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

    return await this.sendLoxoneCommand({
      key: commandKey,
      label: command.label || commandKey,
      voiceName: command.voiceName || command.label || commandKey,
      category: command.category || command.function || 'allgemein',
      room: command.room || '',
      functionName: command.function || '',
      action: command.action || '',
      type: resolveCommandType(command),
      uuid: command.loxone?.uuid || command.loxoneUuid,
      command: command.loxone?.value ?? command.loxone?.command ?? command.loxoneCommand ?? '',
      path: command.loxone?.path || command.loxonePath || ''
    });
  }

  async changeScene(roomName, sceneName) {
    const room = this.rooms[roomName];
    if (!room) {
      throw new Error(`Unbekannter Raum: ${roomName}`);
    }

    const command = room.scenes?.[sceneName];
    if (!command) {
      throw new Error(`Unbekannte Szene "${sceneName}" fuer Raum "${roomName}".`);
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
        throw new Error(`Loxone Pfad fehlt fuer "${entry.label}".`);
      }
      return applyPathTemplate(entry.path, entry);
    }

    const uuid = normalizeLoxoneUuid(entry.uuid);
    if (!uuid) {
      throw new Error(`Loxone UUID fehlt fuer "${entry.label}".`);
    }

    if (type === 'pulse') {
      return `/jdev/sps/io/${encodeURIComponent(uuid)}/pulse`;
    }

    if (!entry.command) {
      throw new Error(`Loxone Befehl fehlt fuer "${entry.label}".`);
    }

    if (type === 'direct') {
      return `/jdev/sps/io/${encodeURIComponent(uuid)}/${encodeURIComponent(entry.command)}`;
    }

    if (type === 'changeTo') {
      return `/jdev/sps/io/${encodeURIComponent(uuid)}/changeTo/${encodeURIComponent(entry.command)}`;
    }

    throw new Error(`Unbekannter Loxone-Befehlstyp "${type}" fuer "${entry.label}".`);
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
    return normalizeType(rawType);
  }
  if (command.loxone?.path || command.loxonePath) {
    return 'raw';
  }
  return 'changeTo';
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

function applyPathTemplate(path, entry) {
  const uuid = normalizeLoxoneUuid(entry.uuid);
  return String(path)
    .replaceAll('{uuid}', encodeURIComponent(uuid || ''))
    .replaceAll('{value}', encodeURIComponent(entry.command || ''))
    .replaceAll('{command}', encodeURIComponent(entry.command || ''));
}
