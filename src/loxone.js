import { normalizeCommandType, normalizeLoxoneUuid, readCommandTarget } from './command-utils.js';

export class LoxoneClient {
  constructor(config) {
    this.baseUrl = config.loxone.baseUrl.replace(/\/$/, '');
    this.username = config.loxone.username || '';
    this.password = config.loxone.password || '';
    this.dryRun = config.loxone.dryRun !== false;
    this.commands = config.commands || {};
    this.rooms = config.rooms || {};
  }

  async runCommand(commandKey) {
    const command = this.commands[commandKey];
    if (!command) {
      throw new Error(`Unbekannter Befehl: ${commandKey}`);
    }
    if (command.enabled === false) {
      throw new Error(`Befehl ist deaktiviert: ${commandKey}`);
    }

    const target = readCommandTarget(command);
    return await this.sendLoxoneCommand({
      key: commandKey,
      label: command.label || commandKey,
      voiceName: command.voiceName || command.label || commandKey,
      category: command.category || command.function || 'allgemein',
      room: command.room || '',
      functionName: command.function || '',
      action: command.action || '',
      type: target.type,
      uuid: target.uuid,
      command: target.value,
      path: target.path
    });
  }

  async changeScene(roomName, sceneName) {
    const room = this.rooms[roomName];
    if (!room) {
      throw new Error(`Unbekannter Raum: ${roomName}`);
    }

    const command = room.scenes?.[sceneName];
    if (!command) {
      throw new Error(`Unbekannte Szene "${sceneName}" für Raum "${roomName}".`);
    }

    return await this.sendLoxoneCommand({
      key: `${roomName}_${sceneName}`,
      label: `${room.label || roomName} ${sceneName}`,
      category: 'licht',
      room: roomName,
      functionName: 'licht',
      action: sceneName,
      type: 'changeTo',
      uuid: room.uuid,
      command
    });
  }

  async sendLoxoneCommand(entry) {
    const path = this.buildPath(entry);
    const url = this.toUrl(path);
    const headers = {};

    if (this.dryRun) {
      return { dryRun: true, ...entry, url, response: 'dry-run' };
    }

    if (this.username || this.password) {
      const token = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers.authorization = `Basic ${token}`;
    }

    const response = await fetch(url, { method: 'GET', headers });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Loxone HTTP ${response.status}: ${text}`);
    }

    return { ...entry, url, response: text };
  }

  buildPath(entry) {
    const type = resolveCommandType(entry);
    if (type === 'raw') {
      if (!entry.path) {
        throw new Error(`Loxone Pfad fehlt für "${entry.label}".`);
      }
      return applyPathTemplate(entry.path, entry);
    }

    const uuid = normalizeLoxoneUuid(entry.uuid);
    if (!uuid) {
      throw new Error(`Loxone UUID fehlt für "${entry.label}".`);
    }

    if (type === 'pulse') {
      return `/jdev/sps/io/${encodeURIComponent(uuid)}/pulse`;
    }

    if (!entry.command) {
      throw new Error(`Loxone Befehl fehlt für "${entry.label}".`);
    }

    if (type === 'direct') {
      return `/jdev/sps/io/${encodeURIComponent(uuid)}/${encodeURIComponent(entry.command)}`;
    }

    if (type === 'changeTo') {
      return `/jdev/sps/io/${encodeURIComponent(uuid)}/changeTo/${encodeURIComponent(entry.command)}`;
    }

    throw new Error(`Unbekannter Loxone-Befehlstyp "${type}" für "${entry.label}".`);
  }

  toUrl(path) {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }
}

function resolveCommandType(command) {
  const rawType = command.loxone?.type || command.loxoneType || command.type;
  if (rawType) {
    return normalizeCommandType(rawType);
  }
  if (command.loxone?.path || command.loxonePath) {
    return 'raw';
  }
  return 'changeTo';
}

function applyPathTemplate(path, entry) {
  const uuid = normalizeLoxoneUuid(entry.uuid);
  return String(path)
    .replaceAll('{uuid}', encodeURIComponent(uuid || ''))
    .replaceAll('{value}', encodeURIComponent(entry.command || ''))
    .replaceAll('{command}', encodeURIComponent(entry.command || ''));
}
