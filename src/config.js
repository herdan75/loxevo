import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { isCommandType, isValidLoxoneUuid, readCommandTarget } from './command-utils.js';
import { enforcePrivateFileMode, PRIVATE_FILE_MODE } from './file-security.js';

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
  validateConfig(config);
  normalizeConfig(config);
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, { encoding: 'utf8', mode: PRIVATE_FILE_MODE });
  await enforcePrivateFileMode(path, 'Konfigurationsdatei');
  return config;
}

function validateConfig(config, options = {}) {
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
    if (typeof config.commands !== 'object') {
      throw new Error('commands muss ein Objekt sein.');
    }
    for (const [commandName, command] of Object.entries(config.commands)) {
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
      if (offCommand) {
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
        if (!target.path) {
          reportCommandIssue(`Loxone Pfad für Befehl "${commandName}" fehlt.`);
        }
        if (target.path.includes('{uuid}') && !target.uuid) {
          reportCommandIssue(`Loxone UUID für Befehl "${commandName}" fehlt.`);
        } else if (target.path.includes('{uuid}') && target.uuid && !isValidLoxoneUuid(target.uuid)) {
          reportCommandIssue(`Loxone UUID für Befehl "${commandName}" ist ungültig.`);
        }
        if ((target.path.includes('{value}') || target.path.includes('{command}')) && !target.value) {
          reportCommandIssue(`Loxone Wert für Befehl "${commandName}" fehlt.`);
        }
        continue;
      }

      if (!target.uuid) {
        reportCommandIssue(`Loxone UUID für Befehl "${commandName}" fehlt.`);
      } else if (!isValidLoxoneUuid(target.uuid)) {
        reportCommandIssue(`Loxone UUID für Befehl "${commandName}" ist ungültig.`);
      }
      if (target.type !== 'pulse' && !target.value) {
        reportCommandIssue(`Loxone Wert/Befehl für Befehl "${commandName}" fehlt.`);
      }
    }
  }

  if (config.rooms) {
    if (typeof config.rooms !== 'object') {
      throw new Error('rooms muss ein Objekt sein.');
    }
    for (const [roomName, room] of Object.entries(config.rooms)) {
      if (!room.uuid) {
        throw new Error(`UUID für Raum "${roomName}" fehlt.`);
      }
      if (!isValidLoxoneUuid(room.uuid)) {
        throw new Error(`UUID für Raum "${roomName}" ist ungültig.`);
      }
      if (!room.scenes || typeof room.scenes !== 'object') {
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
    await writeFile(path, example, { encoding: 'utf8', mode: PRIVATE_FILE_MODE });
    await enforcePrivateFileMode(path, 'Konfigurationsdatei');
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
