import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { networkInterfaces } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const appRequire = createRequire(import.meta.url);
const COMMAND_TIMEOUT_MS = 5000;
const NATIVE_SEQUENCE_TIMEOUT_MS = 8000;
const NATIVE_FIRE_AND_FORGET_MS = 100;
const MEDIA_VOLUME_TIMEOUT_MS = 1200;

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
        const sequenceMode = this.hasNativeSequenceSupport() ? 'native Sequenzen' : 'sendSequenceCommand-Fallback';
        console.log(`TTS ist mit alexa-remote2 verbunden (${sequenceMode}).`);
        this.persistCookie().catch((persistError) => {
          console.warn(`Alexa-Cookie konnte nicht gespeichert werden: ${persistError.message}`);
        });
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
    const localCookie = firstNonEmptyString(
      cookieData.localCookie,
      cookie,
      sourceData.localCookie,
      sourceData.cookie,
      sourceData.loginCookie
    );

    if (!localCookie) return;

    const nextData = {
      ...sourceData,
      ...cookieData,
      localCookie,
      csrf: firstNonEmptyString(cookieData.csrf, csrf, sourceData.csrf),
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
      alarmVolume: normalizeVolume(this.config.alarmVolume, 100),
      nativeSequences: this.hasNativeSequenceSupport()
    };
  }

  async speak(text, devices = firstNonEmpty(this.config.defaultDevices)) {
    this.assertReady();
    const targets = this.normalizeDevices(devices);
    this.assertDevices(targets);
    await this.sendSequenceToTargets('speak', text, targets);
  }

  async alarm(text, devices = firstNonEmpty(this.config.alarmDevices, this.config.allDevices, this.config.defaultDevices), volume = this.config.alarmVolume) {
    this.assertReady();
    await this.speakAtVolume(text, normalizeVolume(volume, 100), devices);
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
    await this.sendCommandToTargets('volume', value, targets);
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
        else if (isPlainObject(result)) finish(null, result);
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
    await this.sendSequenceToTargets(type, text, targets, volume);
  }

  async sendSequenceToTargets(type, text, targets, volume) {
    if (!text || typeof text !== 'string') {
      throw new Error('TTS braucht einen Text im Request-Body.');
    }
    if (await this.tryNativeSequence(type, text, targets, volume)) {
      return;
    }
    await this.runForTargets(targets, (device) => this.exec(device, type, text, volume), type);
  }

  async sendCommandToTargets(type, value, targets) {
    if (await this.tryNativeCommand(type, value, targets)) {
      return;
    }
    await this.runForTargets(targets, (device) => this.exec(device, type, value), type);
  }

  async runForTargets(targets, runner, type) {
    const results = await Promise.all(targets.map(async (device) => {
      try {
        const result = await runner(device);
        if (result?.timedOut) {
          console.warn(`TTS ${type}: keine Rueckmeldung von ${device} nach ${COMMAND_TIMEOUT_MS} ms.`);
        }
        return { device, ok: true };
      } catch (error) {
        return { device, ok: false, error };
      }
    }));
    const failures = results
      .filter((result) => !result.ok)
      .map((result) => `${result.device}: ${result.error.message}`);
    if (failures.length === targets.length) {
      throw new Error(`Alexa-Befehl "${type}" konnte an kein Geraet gesendet werden. ${failures.join(' | ')}`);
    }
    if (failures.length) {
      console.warn(`TTS ${type}: einzelne Geräte fehlgeschlagen: ${failures.join(' | ')}`);
    }
  }

  async tryNativeSequence(type, text, targets, volume) {
    try {
      const devices = this.resolveNativeDevices(targets);
      if (!devices.length) return false;
      const sender = this.getNativeSequenceSender(devices);
      if (!sender) return false;

      if (type === 'speakAtVolume') {
        const sequence = await this.buildNativeSpeakAtVolumeNode(text, normalizeVolume(volume, 40), devices);
        await this.sendNativeSequence(sequence, sender);
        return true;
      }

      if (type === 'speak') {
        await this.sendNativeSequence(this.parallelNode(devices.map((device) => this.speakNode(text, device))), sender);
        return true;
      }

      return false;
    } catch (error) {
      console.warn(`TTS ${type}: native Alexa-Sequenz nicht moeglich, nutze Fallback. ${error.message}`);
      return false;
    }
  }

  async tryNativeCommand(type, value, targets) {
    if (type !== 'volume') return false;

    try {
      const devices = this.resolveNativeDevices(targets);
      if (!devices.length) return false;
      const sender = this.getNativeSequenceSender(devices);
      if (!sender) return false;

      const volume = normalizeVolume(value, NaN);
      await this.sendNativeSequence(this.parallelNode(devices.map((device) => this.volumeNode(volume, device))), sender);
      return true;
    } catch (error) {
      console.warn(`TTS ${type}: native Alexa-Sequenz nicht moeglich, nutze Fallback. ${error.message}`);
      return false;
    }
  }

  getNativeSequenceSender(devices = []) {
    if (typeof this.remote?.sendSequenceNodeExt === 'function') {
      return this.remote.sendSequenceNodeExt.bind(this.remote);
    }
    if (typeof this.remote?.sendSequenceNode === 'function') {
      return this.remote.sendSequenceNode.bind(this.remote);
    }
    if (typeof this.remote?.sendSequenceCommand === 'function' && devices[0]?.serialNumber) {
      return (startNode) => new Promise((resolve, reject) => {
        this.remote.sendSequenceCommand(
          devices[0].serialNumber,
          {
            sequence: {
              '@type': 'com.amazon.alexa.behaviors.model.Sequence',
              startNode
            }
          },
          (error, response) => {
            if (error) reject(error);
            else resolve(response);
          }
        );
      });
    }
    return null;
  }

  hasNativeSequenceSupport() {
    return Boolean(
      typeof this.remote?.sendSequenceNodeExt === 'function' ||
      typeof this.remote?.sendSequenceNode === 'function' ||
      typeof this.remote?.sendSequenceCommand === 'function'
    );
  }

  async sendNativeSequence(sequenceNode, sender) {
    if (!sequenceNode) {
      throw new Error('Leere Alexa-Sequenz.');
    }

    const result = await withTimeout(new Promise((resolve, reject) => {
      let settled = false;
      let fireAndForgetTimer = null;
      const finish = (error, response) => {
        if (settled) return;
        settled = true;
        if (fireAndForgetTimer) clearTimeout(fireAndForgetTimer);
        if (error) reject(error);
        else resolve(response);
      };

      try {
        const response = sender(sequenceNode, finish);
        if (response && typeof response.then === 'function') {
          response.then((payload) => finish(null, payload)).catch((error) => finish(error));
        } else if (response !== undefined) {
          finish(null, response);
        } else {
          fireAndForgetTimer = setTimeout(() => finish(null, { fireAndForget: true }), NATIVE_FIRE_AND_FORGET_MS);
        }
      } catch (error) {
        finish(error);
      }
    }), NATIVE_SEQUENCE_TIMEOUT_MS, 'Keine Antwort von der nativen Alexa-Sequenz.');

    if (isPlainObject(result) && typeof result.message === 'string' && result.message) {
      throw new Error(result.message);
    }
  }

  async buildNativeSpeakAtVolumeNode(text, volume, devices) {
    const setVolume = this.parallelNode(devices.map((device) => this.volumeNode(volume, device)));
    const speak = this.parallelNode(devices.map((device) => this.speakNode(text, device)));
    const restore = await this.buildRestoreVolumeNode(devices);
    return this.serialNode([setVolume, speak, restore].filter(Boolean));
  }

  async buildRestoreVolumeNode(devices) {
    const nodes = [];
    await Promise.all(devices.map(async (device) => {
      const previousVolume = await this.readCurrentVolume(device);
      if (!Number.isFinite(previousVolume)) return;
      nodes.push(this.volumeNode(previousVolume, device));
    }));
    return nodes.length ? this.parallelNode(nodes) : null;
  }

  async readCurrentVolume(device) {
    if (typeof this.remote?.getMediaPromise !== 'function') return NaN;

    try {
      const media = await withTimeout(
        this.remote.getMediaPromise(device.raw || device),
        MEDIA_VOLUME_TIMEOUT_MS,
        'Media-Status Timeout'
      );
      return normalizeVolume(media?.volume, NaN);
    } catch {
      return NaN;
    }
  }

  resolveNativeDevices(targets) {
    const devices = [];
    const seen = new Set();
    for (const target of targets) {
      for (const device of this.expandNativeDevice(target)) {
        const native = this.toNativeDevice(device, target);
        if (!native || seen.has(native.serialNumber)) continue;
        seen.add(native.serialNumber);
        devices.push(native);
      }
    }
    return devices;
  }

  expandNativeDevice(target, depth = 1) {
    const device = this.findNativeDevice(target);
    if (!device) return [];
    const members = Array.isArray(device.clusterMembers) ? device.clusterMembers : [];
    if (members.length && depth > 0) {
      return members.flatMap((member) => this.expandNativeDevice(member, depth - 1));
    }
    return [device];
  }

  findNativeDevice(target) {
    const value = typeof target === 'string' ? target.trim() : target;
    if (!value) return null;

    if (typeof this.remote?.find === 'function') {
      try {
        const found = this.remote.find(value);
        if (found) return found;
      } catch {
        // Fall through to serialNumbers.
      }
    }

    const serial = String(value);
    const device = this.remote?.serialNumbers?.[serial];
    if (isPlainObject(device)) {
      return { ...device, serialNumber: firstText(device.serialNumber, serial) };
    }
    return null;
  }

  toNativeDevice(device, fallbackSerial) {
    if (!isPlainObject(device)) return null;

    const serialNumber = firstText(device.serialNumber, device.deviceSerialNumber, device.deviceSerial, fallbackSerial);
    const deviceType = firstText(device.deviceType, device.deviceTypeId);
    const customerId = firstText(device.deviceOwnerCustomerId, device.customerId, this.remote?.ownerCustomerId);
    if (!serialNumber || !deviceType || !customerId) return null;

    return {
      raw: device,
      serialNumber,
      deviceType,
      customerId
    };
  }

  speakNode(text, device) {
    return {
      '@type': 'com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode',
      type: 'Alexa.Speak',
      operationPayload: {
        deviceType: device.deviceType,
        deviceSerialNumber: device.serialNumber,
        locale: this.getLocale(),
        customerId: device.customerId,
        textToSpeak: text
      }
    };
  }

  volumeNode(volume, device) {
    return {
      '@type': 'com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode',
      type: 'Alexa.DeviceControls.Volume',
      operationPayload: {
        deviceType: device.deviceType,
        deviceSerialNumber: device.serialNumber,
        locale: this.getLocale(),
        customerId: device.customerId,
        value: normalizeVolume(volume, 40)
      }
    };
  }

  serialNode(nodes) {
    return this.containerNode('SerialNode', nodes);
  }

  parallelNode(nodes) {
    if (nodes.length === 1) return nodes[0];
    return this.containerNode('ParallelNode', nodes);
  }

  containerNode(type, nodes) {
    return {
      '@type': `com.amazon.alexa.behaviors.model.${type}`,
      nodesToExecute: nodes,
      name: null
    };
  }

  getLocale() {
    return this.config.acceptLanguage || defaultAcceptLanguage(this.config.amazonPage || this.auth?.amazonPage);
  }

  exec(device, type, value, volume) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, result = {}) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(result);
      };
      const timer = setTimeout(() => finish(null, { timedOut: true }), COMMAND_TIMEOUT_MS);
      const callback = (error) => finish(error);

      try {
        if (type === 'speakAtVolume') {
          this.remote.sendSequenceCommand(device, 'speakAtVolume', value, volume, callback);
          return;
        }

        this.remote.sendSequenceCommand(device, type, value, callback);
      } catch (error) {
        finish(error);
      }
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
  const rawDevices = extractDeviceCandidates(value);
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
      online: device.online !== false && device.available !== false && device.isConnected !== false
    });
  });

  return Array.from(devices.values()).sort((left, right) => (
    left.name.localeCompare(right.name, 'de', { sensitivity: 'base' })
  ));
}

function extractDeviceCandidates(value) {
  const candidates = [];
  const seen = new Set();

  const visit = (item, mapKey = '') => {
    if (Array.isArray(item)) {
      item.forEach((entry) => visit(entry));
      return;
    }
    if (!isPlainObject(item)) return;
    if (seen.has(item)) return;
    seen.add(item);

    const nestedKeys = ['devices', 'deviceList', 'deviceStates', 'alexaDevices'];
    let usedNestedList = false;
    for (const key of nestedKeys) {
      if (Array.isArray(item[key])) {
        usedNestedList = true;
        visit(item[key]);
      }
    }

    if (looksLikeAlexaDevice(item)) {
      candidates.push(withFallbackSerial(item, mapKey));
      return;
    }

    if (usedNestedList) return;

    for (const [key, entry] of Object.entries(item)) {
      if (isPlainObject(entry) || Array.isArray(entry)) {
        visit(entry, key);
      }
    }
  };

  visit(value);
  return candidates;
}

function looksLikeAlexaDevice(value) {
  return Boolean(
    isPlainObject(value) &&
    firstText(
      value.serialNumber,
      value.deviceSerialNumber,
      value.deviceSerial,
      value.accountName,
      value.deviceAccountName,
      value.deviceType,
      value.deviceFamily
    )
  );
}

function withFallbackSerial(device, fallbackSerial) {
  if (!fallbackSerial || firstText(device.serialNumber, device.deviceSerialNumber, device.deviceSerial, device.serial, device.id)) {
    return device;
  }
  return { ...device, serialNumber: fallbackSerial };
}

function firstText(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0);
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

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
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
