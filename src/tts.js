import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { networkInterfaces } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const appRequire = createRequire(import.meta.url);

export class TtsService {
  constructor(config) {
    this.rootConfig = config || {};
    this.config = this.rootConfig.tts || {};
    this.remote = null;
    this.ready = false;
    this.lastError = null;
    this.auth = null;
  }

  async init() {
    if (!this.config.enabled) {
      console.log('TTS ist deaktiviert. Setze tts.enabled=true, wenn Alexa sprechen soll.');
      return;
    }

    let AlexaRemote;
    try {
      AlexaRemote = loadAlexaRemote2();
    } catch (error) {
      this.markUnavailable(
        'alexa-remote2 ist nicht installiert. Bitte in der Web-UI unter Wartung installieren.',
        error
      );
      return;
    }

    let auth;
    try {
      auth = parseAlexaCookieFile(await readFile(this.config.cookieFile, 'utf8'));
    } catch (error) {
      this.markUnavailable(`Alexa-Cookie konnte nicht gelesen werden: ${this.config.cookieFile}`, error);
      return;
    }

    this.remote = new AlexaRemote();
    this.attachCookiePersistence(auth);

    await this.initAlexaRemote();
  }

  async initAlexaRemote() {
    await new Promise((resolve) => {
      let firstCallbackHandled = false;
      const finishFirstCallback = () => {
        if (firstCallbackHandled) return;
        firstCallbackHandled = true;
        resolve();
      };

      this.remote.init(this.buildInitOptions(this.auth), (error) => {
        if (error) {
          if (isProxyLoginPrompt(error)) {
            this.markWaitingForLogin(error);
            finishFirstCallback();
            return;
          }

          this.markUnavailable('Alexa-Verbindung konnte nicht initialisiert werden.', error);
          finishFirstCallback();
          return;
        }

        this.ready = true;
        this.lastError = null;
        console.log('TTS ist mit alexa-remote2 verbunden.');
        finishFirstCallback();
      });
    });
  }

  buildInitOptions(auth) {
    const options = {
      cookie: auth.remoteCookie || auth.cookie,
      csrf: auth.csrf,
      amazonPage: this.config.amazonPage || auth.amazonPage || 'amazon.de',
      alexaServiceHost: this.config.alexaServiceHost || 'layla.amazon.de',
      acceptLanguage: this.config.acceptLanguage || defaultAcceptLanguage(this.config.amazonPage || auth.amazonPage),
      proxyOwnIp: this.getProxyOwnIp(),
      usePushConnection: true
    };

    const proxyPort = Number(this.config.proxyPort || 0);
    if (proxyPort > 0) {
      options.proxyPort = proxyPort;
    }

    if (auth.formerRegistrationData) {
      options.formerRegistrationData = auth.formerRegistrationData;
    }
    if (auth.macDms) {
      options.macDms = auth.macDms;
    }
    if (auth.deviceAppName) {
      options.deviceAppName = auth.deviceAppName;
    }

    return options;
  }

  attachCookiePersistence(auth) {
    this.auth = auth;
    if (!this.remote || typeof this.remote.on !== 'function') return;

    this.remote.on('cookie', (cookie, csrf, macDms) => {
      this.persistCookie(cookie, csrf, macDms).catch((error) => {
        console.warn(`Alexa-Cookie konnte nicht gespeichert werden: ${error.message}`);
      });
    });
  }

  async persistCookie(cookie, csrf, macDms) {
    if (!this.config.cookieFile) return;

    const cookieData = isPlainObject(this.remote?.cookieData) ? this.remote.cookieData : {};
    const sourceData = isPlainObject(this.auth?.originalData) ? this.auth.originalData : {};
    const localCookie = cookieData.localCookie || cookie;

    if (!localCookie || typeof localCookie !== 'string') return;
    if (!isFreshRegistrationData(cookieData)) return;

    const nextData = {
      ...sourceData,
      ...cookieData,
      localCookie,
      csrf: cookieData.csrf || csrf || sourceData.csrf,
      dataVersion: cookieData.dataVersion || sourceData.dataVersion || 2,
      tokenDate: cookieData.tokenDate || Date.now()
    };
    const macDmsValue = firstNonEmptyObject(cookieData.macDms, macDms, sourceData.macDms);
    if (macDmsValue) {
      nextData.macDms = macDmsValue;
    } else {
      delete nextData.macDms;
    }

    if (isSameJsonData(sourceData, nextData)) return;

    await writeFile(this.config.cookieFile, `${JSON.stringify(nextData, null, 2)}\n`, 'utf8');
    this.auth = parseAlexaCookieFile(JSON.stringify(nextData));
    console.log(`Alexa-Cookie wurde aktualisiert: ${this.config.cookieFile}`);
  }

  getProxyOwnIp() {
    return String(
      this.config.proxyOwnIp ||
      this.rootConfig.alexaBridge?.advertiseIp ||
      firstLanAddress()
    ).trim();
  }

  markUnavailable(message, error) {
    this.ready = false;
    this.remote = null;
    this.lastError = error?.message ? `${message} (${error.message})` : message;
    console.warn(`TTS nicht bereit: ${this.lastError}`);
  }

  markWaitingForLogin(error) {
    this.ready = false;
    this.lastError = `Amazon-Login erforderlich. ${error.message}`;
    console.warn(`TTS wartet auf Amazon-Login: ${error.message}`);
  }

  getStatus() {
    return {
      enabled: Boolean(this.config.enabled),
      ready: this.ready,
      error: this.lastError,
      defaultDevices: configuredDeviceList(this.config.defaultDevices),
      allDevices: configuredDeviceList(this.config.allDevices),
      alarmDevices: configuredDeviceList(this.config.alarmDevices),
      defaultVolume: normalizeVolume(this.config.defaultVolume, 40),
      alarmVolume: normalizeVolume(this.config.alarmVolume, 100)
    };
  }

  async speak(text, devices = firstNonEmpty(this.config.defaultDevices)) {
    this.assertReady();
    await this.speakAtVolume(text, normalizeVolume(this.config.defaultVolume, 40), devices);
  }

  async alarm(text, devices = firstNonEmpty(this.config.alarmDevices, this.config.allDevices, this.config.defaultDevices)) {
    this.assertReady();
    await this.speakAtVolume(text, normalizeVolume(this.config.alarmVolume, 100), devices);
  }

  async speakAtVolume(text, volume, devices = firstNonEmpty(this.config.defaultDevices)) {
    this.assertReady();
    await this.sendSequence('speakAtVolume', text, devices, normalizeVolume(volume, 40));
  }

  async setVolume(volume, devices = firstNonEmpty(this.config.allDevices, this.config.defaultDevices)) {
    this.assertReady();
    const value = normalizeVolume(volume, NaN);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Ungültige Alexa-Lautstärke: ${volume}`);
    }

    const targets = this.normalizeDevices(devices);
    this.assertDevices(targets);
    await Promise.all(targets.map((device) => this.exec(device, 'volume', value)));
  }

  async getDeviceInventory() {
    this.assertReady();
    const devices = await this.readRemoteDevices();
    return normalizeDeviceList(devices);
  }

  async readRemoteDevices() {
    if (typeof this.remote?.getDevices !== 'function') {
      return serialNumberMapToDevices(this.remote?.serialNumbers);
    }

    return await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, devices) => {
        if (settled) return;
        settled = true;
        if (error) reject(error);
        else resolve(devices || []);
      };
      const finishFromCallback = (error, devices) => {
        if (devices === undefined && (Array.isArray(error) || isPlainObject(error))) {
          finish(null, error);
          return;
        }
        finish(error, devices);
      };

      try {
        const result = this.remote.getDevices((error, devices) => finishFromCallback(error, devices));
        if (Array.isArray(result)) finish(null, result);
        else if (isPlainObject(result)) finish(null, Object.values(result));
        else if (result && typeof result.then === 'function') {
          result.then((devices) => finish(null, devices)).catch((error) => finish(error));
        }
      } catch (error) {
        finish(error);
      }

      setTimeout(() => finish(null, serialNumberMapToDevices(this.remote?.serialNumbers)), 5000);
    });
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
      return devices.map((device) => String(device).trim()).filter(isConfiguredDevice);
    }
    const device = String(devices || '').trim();
    return isConfiguredDevice(device) ? [device] : [];
  }

  assertDevices(devices) {
    if (!devices.length) {
      throw new Error('Keine Alexa-Geräte für TTS konfiguriert.');
    }
  }
}

function loadAlexaRemote2() {
  const requires = [
    createRequire(join(getDependencyInstallDir(), 'package.json')),
    appRequire
  ];

  let lastError;
  for (const requireFn of requires) {
    try {
      const module = requireFn('alexa-remote2');
      return module.default || module;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function normalizeVolume(value, fallback) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) {
    if (Number.isFinite(fallback)) return fallback;
    throw new Error(`Ungültige Alexa-Lautstärke: ${value}`);
  }
  return Math.min(100, Math.max(0, Math.round(volume)));
}

function serialNumberMapToDevices(value) {
  if (!isPlainObject(value)) return [];
  return Object.entries(value).map(([serialNumber, device]) => ({
    ...(isPlainObject(device) ? device : {}),
    serialNumber
  }));
}

function normalizeDeviceList(value) {
  const rawDevices = Array.isArray(value) ? value : serialNumberMapToDevices(value);
  const devices = new Map();
  rawDevices.forEach((device) => {
    if (!isPlainObject(device)) return;
    const serial = firstText(
      device.serialNumber,
      device.deviceSerialNumber,
      device.deviceSerial,
      device.serial,
      device.id
    );
    if (!serial) return;

    devices.set(serial, {
      serial,
      name: firstText(
        device.accountName,
        device.deviceAccountName,
        device.name,
        device.friendlyName,
        device.deviceName,
        serial
      ),
      type: firstText(device.deviceTypeFriendlyName, device.deviceFamily, device.deviceType, device.productName),
      volume: firstNumber(device.speakerVolume, device.volume, device.volumeLevel, device?.media?.volume),
      online: device.online !== false && device.available !== false && device.isConnected !== false
    });
  });

  return Array.from(devices.values()).sort((left, right) => (
    left.name.localeCompare(right.name, 'de', { sensitivity: 'base' })
  ));
}

function firstText(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return Math.round(number);
  }
  return null;
}

export function parseAlexaCookieFile(content) {
  const raw = String(content || '').trim();
  if (!raw) {
    throw new Error('Cookie-Datei ist leer.');
  }

  if (!raw.startsWith('{')) {
    return { cookie: raw, isJson: false, originalData: null };
  }

  const parsed = JSON.parse(raw);
  const cookie = parsed.localCookie || parsed.cookie || parsed.loginCookie;
  if (!cookie || typeof cookie !== 'string') {
    throw new Error('Cookie-Datei ist JSON, enthaelt aber keinen localCookie oder loginCookie.');
  }

  return {
    cookie,
    isJson: true,
    originalData: parsed,
    remoteCookie: {
      ...parsed,
      localCookie: parsed.localCookie || cookie
    },
    csrf: typeof parsed.csrf === 'string' ? parsed.csrf : undefined,
    amazonPage: typeof parsed.amazonPage === 'string' ? parsed.amazonPage : undefined,
    deviceAppName: typeof parsed.deviceAppName === 'string' ? parsed.deviceAppName : undefined,
    macDms: isPlainObject(parsed.macDms) ? parsed.macDms : undefined,
    formerRegistrationData: buildFormerRegistrationData(parsed)
  };
}

function buildFormerRegistrationData(parsed) {
  if (!isPlainObject(parsed)) return undefined;
  const keys = [
    'localCookie',
    'loginCookie',
    'frc',
    'map-md',
    'deviceId',
    'deviceSerial',
    'refreshToken',
    'tokenDate',
    'amazonPage',
    'csrf',
    'deviceAppName',
    'dataVersion',
    'macDms'
  ];
  const data = {};
  for (const key of keys) {
    if (parsed[key] !== undefined) {
      data[key] = parsed[key];
    }
  }
  return Object.keys(data).length ? data : undefined;
}

function defaultAcceptLanguage(amazonPage) {
  const page = String(amazonPage || '').toLowerCase();
  if (page.endsWith('.de')) return 'de-DE';
  if (page.endsWith('.fr')) return 'fr-FR';
  if (page.endsWith('.it')) return 'it-IT';
  if (page.endsWith('.es')) return 'es-ES';
  if (page.endsWith('.co.uk')) return 'en-GB';
  return 'en-US';
}

function isProxyLoginPrompt(error) {
  return /please open https?:\/\//i.test(error?.message || String(error || ''));
}

function isFreshRegistrationData(value) {
  return Boolean(
    isPlainObject(value) &&
    typeof value.localCookie === 'string' &&
    typeof value.refreshToken === 'string' &&
    typeof value.deviceSerial === 'string'
  );
}

function isSameJsonData(left, right) {
  return stableStringify(left || {}) === stableStringify(right || {});
}

function firstNonEmptyObject(...values) {
  return values.find((value) => isPlainObject(value) && Object.keys(value).length > 0);
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function firstLanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return '';
}

function getDependencyInstallDir() {
  if (process.env.DEPENDENCY_INSTALL_DIR) {
    return process.env.DEPENDENCY_INSTALL_DIR;
  }
  if (process.env.CONFIG_PATH) {
    return resolve(dirname(process.env.CONFIG_PATH));
  }
  return process.cwd();
}

function firstNonEmpty(...lists) {
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    const devices = list.map((device) => String(device).trim()).filter(isConfiguredDevice);
    if (devices.length) return devices;
  }
  return [];
}

function isConfiguredDevice(device) {
  const value = String(device || '').trim();
  return Boolean(value && !value.includes('replace-with'));
}

function configuredDeviceList(value) {
  return Array.isArray(value) ? value.map((device) => String(device).trim()).filter(isConfiguredDevice) : [];
}
