export class LoxoneClient {
  constructor(config) {
    this.baseUrl = config.loxone.baseUrl.replace(/\/$/, '');
    this.username = config.loxone.username || '';
    this.password = config.loxone.password || '';
    this.rooms = config.rooms;
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

    const path = `/jdev/sps/io/${encodeURIComponent(room.uuid)}/changeTo/${encodeURIComponent(command)}`;
    const url = `${this.baseUrl}${path}`;
    const headers = {};

    if (this.username || this.password) {
      const token = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers.authorization = `Basic ${token}`;
    }

    const response = await fetch(url, { method: 'GET', headers });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Loxone HTTP ${response.status}: ${text}`);
    }

    return { room: roomName, scene: sceneName, url, response: text };
  }
}
