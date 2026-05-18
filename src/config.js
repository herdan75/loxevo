import { readFile, writeFile } from 'node:fs/promises';

const DEFAULT_CONFIG_PATH = './config.json';

export async function loadConfig() {
  const path = process.env.CONFIG_PATH || DEFAULT_CONFIG_PATH;
  const raw = await readFile(path, 'utf8');
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
  if (!config.rooms || typeof config.rooms !== 'object') {
    throw new Error('rooms fehlt in der Konfiguration.');
  }
  for (const [roomName, room] of Object.entries(config.rooms)) {
    if (!room.uuid) {
      throw new Error(`UUID fuer Raum "${roomName}" fehlt.`);
    }
    if (!room.scenes || typeof room.scenes !== 'object') {
      throw new Error(`Szenen fuer Raum "${roomName}" fehlen.`);
    }
  }
}

function normalizeConfig(config) {
  config.server ||= {};
  config.server.port = Number(config.server.port || config.bridge?.port || 8080);
  config.server.name ||= config.bridge?.name || 'LoxEvo';
}
