import { readFile } from 'node:fs/promises';

export class TtsService {
  constructor(config) {
    this.config = config.tts || {};
    this.remote = null;
    this.ready = false;
    this.lastError = null;
  }

  async init() {
    if (!this.config.enabled) {
      console.log('TTS ist deaktiviert. Setze tts.enabled=true, wenn Alexa sprechen soll.');
      return;
    }

    let AlexaRemote;
    try {
      ({ default: AlexaRemote } = await import('alexa-remote2'));
    } catch (error) {
      this.markUnavailable(
        'alexa-remote2 ist nicht installiert. Bitte Abhaengigkeiten im LoxBerry/Docker-Container installieren.',
        error
      );
      return;
    }

    let cookie;
    try {
      cookie = await readFile(this.config.cookieFile, 'utf8');
    } catch (error) {
      this.markUnavailable(`Alexa-Cookie konnte nicht gelesen werden: ${this.config.cookieFile}`, error);
      return;
    }

    this.remote = new AlexaRemote();

    try {
      await new Promise((resolve, reject) => {
        this.remote.init(
          {
            cookie,
            amazonPage: this.config.amazonPage || 'amazon.de',
            alexaServiceHost: this.config.alexaServiceHost || 'layla.amazon.de',
            usePushConnection: true
          },
          (error) => (error ? reject(error) : resolve())
        );
      });
    } catch (error) {
      this.markUnavailable('Alexa-Verbindung konnte nicht initialisiert werden.', error);
      return;
    }

    this.ready = true;
    this.lastError = null;
    console.log('TTS ist mit alexa-remote2 verbunden.');
  }

  markUnavailable(message, error) {
    this.ready = false;
    this.remote = null;
    this.lastError = error?.message ? `${message} (${error.message})` : message;
    console.warn(`TTS nicht bereit: ${this.lastError}`);
  }

  getStatus() {
    return {
      enabled: Boolean(this.config.enabled),
      ready: this.ready,
      error: this.lastError,
      defaultDevices: this.config.defaultDevices || [],
      allDevices: this.config.allDevices || [],
      alarmDevices: this.config.alarmDevices || []
    };
  }

  async speak(text, devices = this.config.defaultDevices || []) {
    this.assertReady();
    await this.sendSequence('speak', text, devices);
  }

  async alarm(text, devices = this.config.alarmDevices || []) {
    this.assertReady();
    await this.sendSequence('speakAtVolume', text, devices, Number(this.config.alarmVolume || 100));
  }

  async setVolume(volume, devices = this.config.alarmDevices || this.config.defaultDevices || []) {
    this.assertReady();
    const value = Number(volume);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Ungueltige Alexa-Lautstaerke: ${volume}`);
    }

    const targets = this.normalizeDevices(devices);
    this.assertDevices(targets);
    await Promise.all(targets.map((device) => this.exec(device, 'volume', value)));
  }

  async sendSequence(type, text, devices, volume) {
    if (!text || typeof text !== 'string') {
      throw new Error('TTS braucht einen Text im Request-Body.');
    }
    const targets = this.normalizeDevices(devices);
    this.assertDevices(targets);
    await Promise.all(targets.map((device) => this.exec(device, type, text, volume)));
  }

  exec(device, type, value, volume) {
    return new Promise((resolve, reject) => {
      const callback = (error) => (error ? reject(error) : resolve());

      if (type === 'speakAtVolume') {
        this.remote.sendSequenceCommand(device, 'speakAtVolume', value, volume, callback);
        return;
      }

      this.remote.sendSequenceCommand(device, type, value, callback);
    });
  }

  assertReady() {
    if (!this.config.enabled) {
      throw new Error('TTS ist in config.json deaktiviert.');
    }
    if (!this.ready) {
      throw new Error(this.lastError || 'TTS ist noch nicht initialisiert.');
    }
  }

  normalizeDevices(devices) {
    if (Array.isArray(devices)) {
      return devices.map((device) => String(device).trim()).filter(Boolean);
    }
    const device = String(devices || '').trim();
    return device ? [device] : [];
  }

  assertDevices(devices) {
    if (!devices.length) {
      throw new Error('Keine Alexa-Geraete fuer TTS konfiguriert.');
    }
  }
}
