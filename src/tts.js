import { readFile } from 'node:fs/promises';

export class TtsService {
  constructor(config) {
    this.config = config.tts || {};
    this.remote = null;
    this.ready = false;
  }

  async init() {
    if (!this.config.enabled) {
      console.log('TTS ist deaktiviert. Setze tts.enabled=true, wenn Alexa sprechen soll.');
      return;
    }

    const { default: AlexaRemote } = await import('alexa-remote2');
    const cookie = await readFile(this.config.cookieFile, 'utf8');
    this.remote = new AlexaRemote();

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

    this.ready = true;
    console.log('TTS ist mit alexa-remote2 verbunden.');
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

    await Promise.all(devices.map((device) => this.exec(device, 'volume', value)));
  }

  async sendSequence(type, text, devices, volume) {
    if (!text || typeof text !== 'string') {
      throw new Error('TTS braucht einen Text im Request-Body.');
    }
    await Promise.all(devices.map((device) => this.exec(device, type, text, volume)));
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
      throw new Error('TTS ist noch nicht initialisiert.');
    }
  }
}
