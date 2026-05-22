import dgram from 'node:dgram';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

const SSDP_ADDRESS = '239.255.255.250';
const SSDP_PORT = 1900;

export class AlexaBridgeService {
  constructor(config, handlers) {
    this.config = config;
    this.handlers = handlers;
    this.socket = null;
    this.helper = null;
    this.ready = false;
    this.lastError = null;
    this.ssdpBindAddress = '';
    this.ssdpMode = '';
  }

  async start() {
    if (!this.isEnabled()) {
      this.ready = false;
      this.lastError = null;
      return;
    }

    try {
      await this.startSsdp();
      this.ready = true;
      this.lastError = null;
      this.handlers.addEvent?.({
        type: 'alexa-bridge',
        status: 'ready',
        text: `Alexa-Geräte bereit: ${this.getDevices().length}`
      });
    } catch (error) {
      this.ready = false;
      this.lastError = error.message;
      this.handlers.addEvent?.({
        type: 'alexa-bridge',
        status: 'error',
        text: error.message
      });
    }
  }

  async stop() {
    if (this.helper) {
      const helper = this.helper;
      this.helper = null;
      helper.kill('SIGTERM');
    }
    if (this.socket) {
      await new Promise((resolve) => {
        this.socket.close(() => resolve());
      });
      this.socket = null;
    }
    this.ready = false;
    this.ssdpMode = '';
  }

  getStatus() {
    const devices = this.getDevices();
    return {
      enabled: this.isEnabled(),
      ready: this.ready,
      error: this.lastError,
      ip: this.getAdvertiseIp(),
      port: this.getAdvertisePort(),
      ssdpPort: SSDP_PORT,
      ssdpBindAddress: this.ssdpBindAddress,
      ssdpMode: this.ssdpMode,
      descriptionUrl: `http://${this.getAdvertiseIp()}:${this.getAdvertisePort()}/description.xml`,
      bridgeId: this.getBridgeId(),
      deviceCount: devices.length,
      devices: devices.map((device) => ({
        id: device.id,
        name: device.name,
        command: device.commandKey
      }))
    };
  }

  canHandleHttp(req, url, pathParts) {
    if (!this.isEnabled()) return false;
    if (req.method === 'GET' && url.pathname === '/description.xml') return true;
    if (pathParts[0] !== 'api') return false;
    const reservedApiRoots = new Set([
      'alexa-bridge',
      'command',
      'config',
      'dependencies',
      'dry-run',
      'events',
      'light',
      'setup-status',
      'system',
      'tts'
    ]);
    return pathParts.length === 1 || !reservedApiRoots.has(pathParts[1]);
  }

  async handleHttp(req, res, url, pathParts, readBody, helpers) {
    if (req.method === 'GET' && url.pathname === '/description.xml') {
      return helpers.sendXml(res, this.buildDescriptionXml());
    }

    if (req.method === 'POST' && pathParts.length === 1) {
      return helpers.sendJson(res, [{ success: { username: this.getHueUsername() } }]);
    }

    if (req.method === 'GET' && pathParts.length === 2) {
      return helpers.sendJson(res, { lights: this.getHueLights(), config: this.getHueConfig() });
    }

    if (req.method === 'GET' && pathParts.length === 3 && pathParts[2] === 'config') {
      return helpers.sendJson(res, this.getHueConfig());
    }

    if (req.method === 'GET' && pathParts.length === 3 && pathParts[2] === 'lights') {
      return helpers.sendJson(res, this.getHueLights());
    }

    if (req.method === 'GET' && pathParts.length === 4 && pathParts[2] === 'lights') {
      const light = this.getHueLights()[pathParts[3]];
      if (!light) return helpers.sendJson(res, [{ error: { type: 3, description: 'resource not available' } }], 404);
      return helpers.sendJson(res, light);
    }

    if (req.method === 'PUT' && pathParts.length === 5 && pathParts[2] === 'lights' && pathParts[4] === 'state') {
      const body = parseJson(await readBody());
      return await this.handleLightState(res, pathParts[3], body, helpers);
    }

    return helpers.sendJson(res, [{ error: { type: 3, description: 'resource not available' } }], 404);
  }

  async handleLightState(res, id, body, helpers) {
    const device = this.getDevices().find((item) => item.id === id);
    if (!device) {
      return helpers.sendJson(res, [{ error: { type: 3, description: 'resource not available' } }], 404);
    }

    if (body.on === true) {
      await this.handlers.executeCommand(device.commandKey);
    }

    return helpers.sendJson(res, [
      { success: { [`/lights/${id}/state/on`]: Boolean(body.on) } }
    ]);
  }

  async startSsdp() {
    const helperPath = this.getSsdpHelperPath();
    if (process.platform === 'linux' && existsSync(helperPath)) {
      try {
        await this.startSsdpHelper(helperPath);
        return;
      } catch (error) {
        this.lastError = friendlySsdpError(error, this.getMulticastInterface()).message;
        throw friendlySsdpError(error, this.getMulticastInterface());
      }
    }

    const lanAddress = this.getMulticastInterface();
    const bindAddresses = ['', lanAddress].filter((address, index, list) => (
      address === '' ? index === 0 : list.indexOf(address) === index
    ));
    let lastError;

    for (const address of bindAddresses) {
      try {
        this.socket = await this.bindSsdpSocket(address);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw friendlySsdpError(lastError, lanAddress);
  }

  startSsdpHelper(helperPath) {
    return new Promise((resolve, reject) => {
      const args = [
        '--ip', this.getAdvertiseIp(),
        '--port', String(this.getAdvertisePort()),
        '--bridge-id', this.getBridgeId(),
        '--uuid', this.getUuid()
      ];
      const helper = spawn(helperPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let settled = false;
      let output = '';
      const timeout = setTimeout(() => {
        finish(new Error(`SSDP-Helper antwortet nicht: ${output || helperPath}`));
      }, 5000);

      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) {
          this.helper = null;
          helper.kill('SIGTERM');
          reject(error);
          return;
        }
        this.helper = helper;
        this.ssdpMode = 'linux-helper';
        this.ssdpBindAddress = '0.0.0.0';
        resolve();
      };

      const rememberOutput = (chunk, isError = false) => {
        const text = chunk.toString();
        output = `${output}${text}`.slice(-1000);
        for (const line of text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
          if (line.startsWith('READY ')) {
            console.log(`SSDP-Helper: ${line}`);
            finish();
          } else if (isError || line.startsWith('ERROR ')) {
            console.warn(`SSDP-Helper: ${line}`);
          } else if (!line.includes('SSDP response sent')) {
            console.log(`SSDP-Helper: ${line}`);
          }
        }
      };

      helper.stdout.on('data', (chunk) => rememberOutput(chunk));
      helper.stderr.on('data', (chunk) => rememberOutput(chunk, true));
      helper.on('error', (error) => finish(error));
      helper.on('exit', (code, signal) => {
        const exitReason = signal || (code ?? 'unbekannt');
        const message = `SSDP-Helper beendet (${exitReason}). ${output}`.trim();
        if (!settled) {
          finish(new Error(message));
          return;
        }
        if (this.helper === helper) {
          this.helper = null;
          this.ready = false;
          this.lastError = message;
          this.handlers.addEvent?.({
            type: 'alexa-bridge',
            status: 'error',
            text: message
          });
        }
      });
    });
  }

  bindSsdpSocket(address) {
    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      let settled = false;

      const finish = (error) => {
        if (settled) return;
        settled = true;
        if (error) {
          try {
            socket.close();
          } catch {
            // Socket may already be closed after a bind error.
          }
          reject(error);
        } else {
          resolve(socket);
        }
      };

      socket.on('message', (message, remote) => this.respondToSearch(socket, message, remote));
      socket.on('error', (error) => {
        this.lastError = error.message;
        if (!settled) finish(error);
      });

      const bindOptions = address ? { port: SSDP_PORT, address } : { port: SSDP_PORT };
      socket.bind(bindOptions, () => {
        try {
          const multicastInterface = this.getMulticastInterface();
          if (multicastInterface) {
            socket.addMembership(SSDP_ADDRESS, multicastInterface);
          } else {
            socket.addMembership(SSDP_ADDRESS);
          }
          socket.setMulticastTTL(2);
          this.ssdpBindAddress = address || '0.0.0.0';
          this.ssdpMode = 'node-udp';
          finish();
        } catch (error) {
          finish(error);
        }
      });
    });
  }

  respondToSearch(socket, message, remote) {
    const text = message.toString();
    const lower = text.toLowerCase();
    if (!lower.startsWith('m-search') || !lower.includes('ssdp:discover')) return;

    const searchTarget = normalizeSsdpSearchTarget(readSsdpHeader(text, 'st'));
    if (!searchTarget) return;

    const response = this.buildSsdpResponse(searchTarget);
    socket.send(response, remote.port, remote.address);
  }

  buildSsdpResponse(searchTarget = 'upnp:rootdevice') {
    const uuid = this.getUuid();
    return [
      'HTTP/1.1 200 OK',
      'CACHE-CONTROL: max-age=100',
      'EXT:',
      `LOCATION: http://${this.getAdvertiseIp()}:${this.getAdvertisePort()}/description.xml`,
      'SERVER: Linux/3.14.0 UPnP/1.0 IpBridge/1.50.0',
      `hue-bridgeid: ${this.getBridgeId()}`,
      `ST: ${searchTarget}`,
      `USN: uuid:${uuid}::${searchTarget}`,
      '',
      ''
    ].join('\r\n');
  }

  buildDescriptionXml() {
    const ip = this.getAdvertiseIp();
    const port = this.getAdvertisePort();
    const bridgeId = this.getBridgeId();
    const uuid = this.getUuid();
    const name = escapeXml(this.config.alexaBridge?.name || 'LoxEvo');

    return `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns="urn:schemas-upnp-org:device-1-0">
  <specVersion><major>1</major><minor>0</minor></specVersion>
  <URLBase>http://${ip}:${port}/</URLBase>
  <device>
    <deviceType>urn:schemas-upnp-org:device:Basic:1</deviceType>
    <friendlyName>${name} (${ip})</friendlyName>
    <manufacturer>Royal Philips Electronics</manufacturer>
    <manufacturerURL>http://www.philips.com</manufacturerURL>
    <modelDescription>Philips hue Personal Wireless Lighting</modelDescription>
    <modelName>Philips hue bridge 2015</modelName>
    <modelNumber>BSB002</modelNumber>
    <serialNumber>${bridgeId}</serialNumber>
    <UDN>uuid:${uuid}</UDN>
  </device>
</root>`;
  }

  getHueConfig() {
    return {
      name: this.config.alexaBridge?.name || 'LoxEvo',
      bridgeid: this.getBridgeId(),
      mac: bridgeIdToMac(this.getBridgeId()),
      dhcp: true,
      ipaddress: this.getAdvertiseIp(),
      netmask: '255.255.255.0',
      gateway: this.getAdvertiseIp(),
      swversion: '1941132080',
      apiversion: '1.50.0',
      linkbutton: true,
      portalservices: false
    };
  }

  getHueLights() {
    return Object.fromEntries(
      this.getDevices().map((device) => [device.id, this.toHueLight(device)])
    );
  }

  toHueLight(device) {
    return {
      state: {
        on: false,
        bri: 254,
        alert: 'none',
        mode: 'homeautomation',
        reachable: true
      },
      type: 'Dimmable light',
      name: device.name,
      modelid: 'LWB010',
      manufacturername: 'LoxEvo',
      productname: 'LoxEvo command',
      uniqueid: device.uniqueId,
      swversion: '1.0'
    };
  }

  getDevices() {
    const commands = this.handlers.getCommands?.() || {};
    return Object.entries(commands)
      .filter(([, command]) => command.enabled !== false)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([commandKey, command], index) => ({
        id: String(index + 1),
        commandKey,
        name: getAlexaDeviceName(command, commandKey),
        uniqueId: makeLightUniqueId(this.getBridgeId(), index)
      }));
  }

  isEnabled() {
    return this.config.alexaBridge?.enabled === true;
  }

  getAdvertiseIp() {
    return String(this.config.alexaBridge?.advertiseIp || '').trim() || firstLanAddress();
  }

  getAdvertisePort() {
    return Number(this.config.alexaBridge?.advertisePort || this.config.server?.port || process.env.PORT || 8080);
  }

  getMulticastInterface() {
    const ip = this.getAdvertiseIp();
    return isUsableLanAddress(ip) ? ip : '';
  }

  getBridgeId() {
    const configured = String(this.config.alexaBridge?.bridgeId || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
    if (configured.length >= 12) return configured.slice(0, 16).padEnd(16, '0');
    const hash = createHash('sha1')
      .update(`${this.config.server?.name || 'LoxEvo'}:${this.getAdvertiseIp()}`)
      .digest('hex')
      .toUpperCase();
    return `001788FFFE${hash.slice(0, 6)}`;
  }

  getUuid() {
    const suffix = this.getBridgeId().slice(-12).toLowerCase();
    return `2f402f80-da50-11e1-9b23-${suffix}`;
  }

  getHueUsername() {
    return 'loxevo';
  }

  getSsdpHelperPath() {
    return process.env.SSDP_HELPER_PATH || '/app/bin/loxevo-ssdp-helper';
  }
}

function getAlexaDeviceName(command, commandKey) {
  const raw = String(command.alexaName || buildCommandDisplayName(command) || command.voiceName || command.label || commandKey).trim();
  return raw.replace(/\s+(an|ein|einschalten)$/i, '') || commandKey;
}

function buildCommandDisplayName(command) {
  const functionName = displayPart(command.function || command.category);
  const roomName = displayPart(command.room);
  const actionName = displayPart(command.action);
  return [functionName, roomName, actionName].filter(Boolean).join(' ');
}

function displayPart(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const mapped = {
    licht: 'Licht',
    lueftung: 'Lüftung',
    rolladen: 'Rollladen',
    rollladen: 'Rollladen',
    kueche: 'Küche',
    buero: 'Büro',
    tv: 'TV',
    up: 'Auf',
    down: 'Ab',
    on: 'An',
    off: 'Aus',
    ein: 'Ein',
    aus: 'Aus',
    hell: 'Hell',
    ambient: 'Ambient',
    nacht: 'Nacht'
  }[raw.toLowerCase()];
  if (mapped) return mapped;
  return raw
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase() === word ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function firstLanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return '127.0.0.1';
}

function makeLightUniqueId(bridgeId, index) {
  const suffix = bridgeId.slice(-6).match(/.{1,2}/g) || ['00', '00', '00'];
  const lightPart = (index + 1).toString(16).padStart(2, '0');
  return `00:17:88:${suffix.join(':')}:00:${lightPart}-0b`;
}

function bridgeIdToMac(bridgeId) {
  return bridgeId
    .slice(0, 12)
    .padEnd(12, '0')
    .match(/.{1,2}/g)
    .join(':')
    .toLowerCase();
}

function readSsdpHeader(message, headerName) {
  const pattern = new RegExp(`^${headerName}\\s*:\\s*(.+)$`, 'im');
  return String(message).match(pattern)?.[1]?.trim() || '';
}

function normalizeSsdpSearchTarget(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('ssdp:all') || raw.includes('upnp:rootdevice')) return 'upnp:rootdevice';
  if (raw.includes('basic:1')) return 'urn:schemas-upnp-org:device:Basic:1';
  return '';
}

function isUsableLanAddress(value) {
  const ip = String(value || '').trim();
  return Boolean(ip && ip !== '127.0.0.1' && ip !== '0.0.0.0' && !ip.startsWith('169.254.'));
}

function friendlySsdpError(error, lanAddress) {
  if (error?.code === 'EADDRINUSE' || String(error?.message || '').includes('EADDRINUSE')) {
    return new Error(
      `SSDP/UDP-Port 1900 ist bereits belegt. ` +
      `Beende den anderen UPnP/Hue-Bridge-Dienst auf dem LoxBerry oder gib LoxEvo eine eigene Netzwerk-IP. ` +
      `Gepruefte Adresse: ${lanAddress || '0.0.0.0'}. Originalfehler: ${error.message}`
    );
  }
  return error;
}

function parseJson(body) {
  try {
    return JSON.parse(body || '{}');
  } catch {
    return {};
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
