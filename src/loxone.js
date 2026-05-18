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
      room: command.room || '',
      functionName: command.function || '',
      action: command.action || '',
      uuid: command.loxoneUuid,
      command: command.loxoneCommand
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
      room: roomName,
      functionName: 'licht',
      action: sceneName,
      uuid: room.uuid,
      command
    });
  }

  async sendLoxoneCommand(entry) {
    if (!entry.uuid) {
      throw new Error(`Loxone UUID fehlt fuer "${entry.label}".`);
    }
    if (!entry.command) {
      throw new Error(`Loxone Befehl fehlt fuer "${entry.label}".`);
    }

    const path = `/jdev/sps/io/${encodeURIComponent(entry.uuid)}/changeTo/${encodeURIComponent(entry.command)}`;
    const url = `${this.baseUrl}${path}`;
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
}
