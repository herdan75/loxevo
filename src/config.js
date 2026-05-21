import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const DEFAULT_CONFIG_PATH = './config.json';
const EXAMPLE_CONFIG_PATH = './config.example.json';

export async function loadConfig() {
  const path = process.env.CONFIG_PATH || DEFAULT_CONFIG_PATH;
  const raw = await readConfigOrCreateDefault(path);
  const config = JSON.parse(raw);

  validateConfig(config);
  normalizeConfig(config);

  return config;
}

export async function saveConfig(config) {
  const path = process.env.CONFIG_PATH || DEFAULT_CONFIG_PATH;
  validateConfig(config);
  normalizeConfig(config);
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return config;
}

function validateConfig(config) {
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
      if (!['changeTo', 'direct', 'pulse', 'raw'].includes(target.type)) {
        throw new Error(`Unbekannter Loxone-Befehlstyp "${target.type}" für Befehl "${commandName}".`);
      }

      if (target.type === 'raw') {
        if (!target.path) {
          throw new Error(`Loxone Pfad für Befehl "${commandName}" fehlt.`);
        }
        if (target.path.includes('{uuid}') && !target.uuid) {
          throw new Error(`Loxone UUID für Befehl "${commandName}" fehlt.`);
        }
        if ((target.path.includes('{value}') || target.path.includes('{command}')) && !target.value) {
          throw new Error(`Loxone Wert für Befehl "${commandName}" fehlt.`);
        }
        continue;
      }

      if (!target.uuid) {
        throw new Error(`Loxone UUID für Befehl "${commandName}" fehlt.`);
      }
      if (target.type !== 'pulse' && !target.value) {
        throw new Error(`Loxone Wert/Befehl für Befehl "${commandName}" fehlt.`);
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
    await writeFile(path, example, 'utf8');
    console.log(`Keine Konfiguration gefunden. Erstkonfiguration wurde angelegt: ${path}`);
    return example;
  }
}

function normalizeConfig(config) {
  config.server ||= {};
  config.server.port = Number(process.env.PORT || config.server.port || config.bridge?.port || 8080);
  config.server.name ||= config.bridge?.name || 'LoxEvo';
}

function readCommandTarget(command) {
  const loxone = command.loxone || {};
  const type = normalizeType(loxone.type || command.loxoneType || command.type || (loxone.path || command.loxonePath ? 'raw' : 'changeTo'));

  return {
    type,
    uuid: normalizeLoxoneUuid(loxone.uuid || command.loxoneUuid || ''),
    value: loxone.value ?? loxone.command ?? command.loxoneCommand ?? '',
    path: loxone.path || command.loxonePath || ''
  };
}

function normalizeType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'changeto' || raw === 'change_to') return 'changeTo';
  if (raw === 'command' || raw === 'direct') return 'direct';
  if (raw === 'pulse') return 'pulse';
  if (raw === 'raw' || raw === 'path') return 'raw';
  return raw || 'changeTo';
}

function normalizeLoxoneUuid(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (match) return match[0].toLowerCase();
  return raw.replace(/^\/?jdev\/sps\/io\//i, '').split('/')[0].trim();
}
