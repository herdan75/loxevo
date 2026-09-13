import { mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { hasCommandOffTarget, isCommandType, isValidLoxoneUuid, readCommandTarget } from './command-utils.js';
import { writePrivateFile } from './file-security.js';

const DEFAULT_CONFIG_PATH = './config.json';
const EXAMPLE_CONFIG_PATH = './config.example.json';

export async function loadConfig() {
  const path = process.env.CONFIG_PATH || DEFAULT_CONFIG_PATH;
  const raw = await readConfigOrCreateDefault(path);
  const config = JSON.parse(raw);

  validateConfig(config, { strictCommandValidation: false });
  normalizeConfig(config);

  return config;
}

export async function saveConfig(config) {
  const path = process.env.CONFIG_PATH || DEFAULT_CONFIG_PATH;
  const prepared = prepareConfig(config);
  await writePrivateFile(path, `${JSON.stringify(prepared, null, 2)}\n`, 'Konfigurationsdatei');
  return prepared;
}

export function prepareConfig(config) {
  const next = structuredClone(config);
  validateConfig(next);
  normalizeConfig(next);
  validateConfig(next);
  return next;
}

export function validateConfig(config, options = {}) {
  const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!object(config)) throw new Error('Konfiguration muss ein Objekt sein.');
  for (const section of ['server', 'loxone', 'tts', 'alexaBridge', 'discovery', 'bridge']) {
    if (config[section] !== undefined && !object(config[section])) throw new Error(`${section} muss ein Objekt sein.`);
  }
  const httpUrl = (value, name) => {
    try {
      if (typeof value !== 'string') throw new Error();
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) throw new Error();
    } catch { throw new Error(`${name} muss eine gültige HTTP-/HTTPS-URL sein.`); }
  };
  httpUrl(config.loxone?.baseUrl, 'loxone.baseUrl');
  if (config.discovery?.helperUrl) httpUrl(config.discovery.helperUrl, 'discovery.helperUrl');
  for (const [section, keys] of Object.entries({ tts: ['cookieFile', 'amazonPage', 'alexaServiceHost', 'proxyOwnIp', 'acceptLanguage'], loxone: ['username', 'password'], alexaBridge: ['advertiseIp', 'bridgeId'], discovery: ['helperToken'] })) {
    for (const key of keys) if (config[section]?.[key] !== undefined && typeof config[section][key] !== 'string') throw new Error(`${section}.${key} muss Text sein.`);
  }
  for (const [name, value] of [
    ['server.port', config.server?.port], ['PORT', process.env.PORT],
    ['bridge.port', config.bridge?.port], ['alexaBridge.advertisePort', config.alexaBridge?.advertisePort],
    ['tts.proxyPort', config.tts?.proxyPort]
  ]) {
    if (value === undefined || value === '' || (name === 'tts.proxyPort' && Number(value) === 0)) continue;
    if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 65535) throw new Error(`${name}: Port muss zwischen 1 und 65535 liegen.`);
  }
  for (const key of ['defaultDevices', 'allDevices', 'alarmDevices']) {
    const value = config.tts?.[key];
    if (value !== undefined && (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string'))) throw new Error(`tts.${key} muss eine Liste von Gerätekennungen sein.`);
  }
  const strictCommandValidation = options.strictCommandValidation !== false;
  const reportCommandIssue = (message) => {
    if (strictCommandValidation) {
      throw new Error(message);
    }
    console.warn(message);
  };

  config.server ||= {};
  if (!config.loxone?.baseUrl) {
    throw new Error('loxone.baseUrl fehlt in der Konfiguration.');
  }
  if (!config.commands && !config.rooms) {
    throw new Error('commands fehlt in der Konfiguration.');
  }

  if (config.commands) {
    if (!object(config.commands)) {
      throw new Error('commands muss ein Objekt sein.');
    }
    const keys = new Set();
    for (const [commandName, command] of Object.entries(config.commands)) {
      const normalizedKey = normalizeConfigCommandKey(commandName);
      if (!normalizedKey || ['__proto__', 'constructor', 'prototype'].includes(normalizedKey) || keys.has(normalizedKey)) reportCommandIssue(`Befehlsschlüssel "${commandName}" ist ungültig oder doppelt.`);
      keys.add(normalizedKey);
      if (!object(command)) throw new Error(`Befehl "${commandName}" muss ein Objekt sein.`);
      if (command.loxone !== undefined && !object(command.loxone)) throw new Error(`Loxone-Ziel für "${commandName}" muss ein Objekt sein.`);
      if (command.enabled === false) {
        continue;
      }
      const target = readCommandTarget(command);
      if (!isCommandType(target.type)) {
        reportCommandIssue(`Unbekannter Loxone-Befehlstyp "${target.type}" für Befehl "${commandName}".`);
        continue;
      }

      const alexaMode = String(command.alexaMode || 'switch').trim().toLowerCase();
      if (!['switch', 'action'].includes(alexaMode)) {
        reportCommandIssue(`Unbekannter Alexa-Modus "${command.alexaMode}" für Befehl "${commandName}".`);
      }
      const offCommand = normalizeConfigCommandKey(command.offCommand);
      if (offCommand && alexaMode !== 'action' && !hasCommandOffTarget(command)) {
        if (offCommand === commandName) {
          reportCommandIssue(`Aus-Befehl "${offCommand}" für Befehl "${commandName}" darf nicht auf sich selbst zeigen.`);
        }
        const targetCommand = config.commands[offCommand];
        if (!targetCommand) {
          reportCommandIssue(`Aus-Befehl "${offCommand}" für Befehl "${commandName}" wurde nicht gefunden.`);
        } else if (targetCommand.enabled === false) {
          reportCommandIssue(`Aus-Befehl "${offCommand}" für Befehl "${commandName}" ist deaktiviert.`);
        }
      }

      if (command.confirmation?.enabled) {
        const confirmationText = String(command.confirmation.text || '').trim();
        if (!confirmationText) {
          reportCommandIssue(`Rückmeldungstext für Befehl "${commandName}" fehlt.`);
        }
        if (confirmationText.length > 300) {
          reportCommandIssue(`Rückmeldungstext für Befehl "${commandName}" ist zu lang.`);
        }
      }

      if (target.type === 'raw') {
        if (typeof target.path !== 'string' || !target.path.trim()) {
          reportCommandIssue(`Loxone Pfad für Befehl "${commandName}" fehlt.`);
          continue;
        }
        if (target.path.includes('{uuid}') && !target.uuid) {
          reportCommandIssue(`Loxone UUID für Befehl "${commandName}" fehlt.`);
        } else if (target.path.includes('{uuid}') && target.uuid && !isValidLoxoneUuid(target.uuid)) {
          reportCommandIssue(`Loxone UUID für Befehl "${commandName}" ist ungültig.`);
        }
        if ((target.path.includes('{value}') || target.path.includes('{command}')) && String(target.value ?? '').trim() === '') {
          reportCommandIssue(`Loxone Wert für Befehl "${commandName}" fehlt.`);
        }
        continue;
      }

      if (!target.uuid) {
        reportCommandIssue(`Loxone UUID für Befehl "${commandName}" fehlt.`);
      } else if (!isValidLoxoneUuid(target.uuid)) {
        reportCommandIssue(`Loxone UUID für Befehl "${commandName}" ist ungültig.`);
      }
      if (target.type !== 'pulse' && String(target.value ?? '').trim() === '') {
        reportCommandIssue(`Loxone Wert/Befehl für Befehl "${commandName}" fehlt.`);
      }
    }
  }

  if (config.rooms) {
    if (!object(config.rooms)) {
      throw new Error('rooms muss ein Objekt sein.');
    }
    for (const [roomName, room] of Object.entries(config.rooms)) {
      if (!object(room)) throw new Error(`Raum "${roomName}" muss ein Objekt sein.`);
      if (!room.uuid) {
        throw new Error(`UUID für Raum "${roomName}" fehlt.`);
      }
      if (!isValidLoxoneUuid(room.uuid)) {
        throw new Error(`UUID für Raum "${roomName}" ist ungültig.`);
      }
      if (!object(room.scenes)) {
        throw new Error(`Szenen für Raum "${roomName}" fehlen.`);
      }
    }
  }
}

async function readConfigOrCreateDefault(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    const example = await readFile(EXAMPLE_CONFIG_PATH, 'utf8');
    await mkdir(dirname(path), { recursive: true });
    await writePrivateFile(path, example, 'Konfigurationsdatei');
    console.log(`Keine Konfiguration gefunden. Erstkonfiguration wurde angelegt: ${path}`);
    return example;
  }
}

export function normalizeConfig(config) {
  delete config.security;
  config.server ||= {};
  config.server.port = Number(process.env.PORT || config.server.port || config.bridge?.port || 8080);
  config.server.name ||= config.bridge?.name || 'LoxEvo';
  config.alexaBridge ||= {};
  config.alexaBridge.enabled = config.alexaBridge.enabled === true;
  config.alexaBridge.name ||= config.server.name;
  config.alexaBridge.advertiseIp ||= '';
  config.alexaBridge.advertisePort = Number(config.alexaBridge.advertisePort || 80);
  config.alexaBridge.bridgeId ||= '';
  config.alexaBridge.debug = config.alexaBridge.debug === true;
  config.discovery ||= {};
  config.discovery.helperUrl ||= 'http://127.0.0.1:18091';
  config.discovery.helperToken ||= '';
  config.discovery.helperTimeoutMs = Number(config.discovery.helperTimeoutMs || 5000);
  config.tts ||= {};
  config.tts.authRefreshIntervalHours = numberInRange(config.tts.authRefreshIntervalHours, 24, 1, 168);
  config.tts.usePushConnection = config.tts.usePushConnection === true;
  config.tts.loginProxyAutoReconnect = config.tts.loginProxyAutoReconnect !== false;
  config.tts.loginProxyReconnectIntervalSeconds = numberInRange(config.tts.loginProxyReconnectIntervalSeconds, 10, 5, 120);
  config.tts.loginProxyReconnectTimeoutMinutes = numberInRange(config.tts.loginProxyReconnectTimeoutMinutes, 15, 1, 60);
  if (config.commands && typeof config.commands === 'object') {
    for (const command of Object.values(config.commands)) {
      if (!command || typeof command !== 'object') continue;
      const alexaMode = String(command.alexaMode || '').trim().toLowerCase();
      if (alexaMode === 'action') {
        command.alexaMode = 'action';
      } else {
        delete command.alexaMode;
      }
      const offCommand = normalizeConfigCommandKey(command.offCommand);
      if (offCommand) {
        command.offCommand = offCommand;
      } else {
        delete command.offCommand;
      }
      if (command.alexaExpose !== false) {
        delete command.alexaExpose;
      }
      if (command.loxone && typeof command.loxone === 'object') {
        const offValue = String(command.loxone.offValue ?? '').trim();
        const offPath = String(command.loxone.offPath || '').trim();
        if (offValue) {
          command.loxone.offValue = offValue;
        } else {
          delete command.loxone.offValue;
        }
        if (offPath) {
          command.loxone.offPath = offPath;
        } else {
          delete command.loxone.offPath;
        }
      }
      const confirmation = command.confirmation && typeof command.confirmation === 'object'
        ? command.confirmation
        : {};
      const confirmationEnabled = confirmation.enabled === true;
      const confirmationText = String(confirmation.text || '').trim();
      if (confirmationEnabled) {
        command.confirmation = {
          ...confirmation,
          enabled: true,
          text: confirmationText || 'OK'
        };
      } else {
        delete command.confirmation;
      }
    }
  }
}

function numberInRange(value, fallback, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeConfigCommandKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '_')
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('\u00df', 'ss')
    .replace(/[^a-z0-9_-]/g, '');
}
