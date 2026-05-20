import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, saveConfig } from './config.js';
import { LoxoneClient } from './loxone.js';
import { TtsService } from './tts.js';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(rootDir, 'public');

let config = await loadConfig();
let loxone = new LoxoneClient(config);
let tts = new TtsService(config);
const events = [];

await initTts();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const body = await readBody(req);

    if (req.method === 'GET' && url.pathname === '/') {
      return serveStatic(res, 'index.html');
    }

    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
      return serveStatic(res, url.pathname.replace('/assets/', ''));
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, { ok: true, name: config.server.name, tts: tts.getStatus() });
    }

    if (url.pathname === '/admin/plugins/alexa2lox/tts.php') {
      return await handleAlexa2LoxCompat(req, res, url);
    }

    if (pathParts[0] === 'api') {
      return await handleApi(req, res, pathParts, body);
    }

    // Frei definierbarer Befehl: /command/kueche_licht_hell
    if (req.method === 'POST' && pathParts[0] === 'command' && pathParts[1]) {
      return await runConfiguredCommand(res, pathParts[1]);
    }

    // Kurze Legacy-URL fuer Node-RED oder Loxone: /light/kueche/ambient
    if (req.method === 'POST' && pathParts[0] === 'light' && pathParts.length >= 3) {
      return await runLightCommand(res, pathParts[1], pathParts[2]);
    }

    if (pathParts[0] === 'tts') {
      return await handleTts(req, res, pathParts, body);
    }

    sendJson(res, { error: 'not found' }, 404);
  } catch (error) {
    console.error(error);
    sendJson(res, { error: error.message }, 500);
  }
});

server.listen(config.server.port, '0.0.0.0', () => {
  console.log(`${config.server.name} lauscht auf Port ${config.server.port}`);
});

async function handleApi(req, res, pathParts, body) {
  if (req.method === 'GET' && pathParts[1] === 'config') {
    return sendJson(res, config);
  }

  if (req.method === 'GET' && pathParts[1] === 'events') {
    return sendJson(res, events);
  }

  if (req.method === 'GET' && pathParts[1] === 'setup-status') {
    return sendJson(res, getSetupStatus());
  }

  if (req.method === 'GET' && pathParts[1] === 'tts' && pathParts[2] === 'status') {
    return sendJson(res, tts.getStatus());
  }

  if (req.method === 'PUT' && pathParts[1] === 'dry-run') {
    const payload = parseJson(body);
    config.loxone.dryRun = payload.enabled !== false;
    config = await saveConfig(config);
    loxone = new LoxoneClient(config);
    addEvent({ type: 'config', status: 'updated', text: `dryRun=${config.loxone.dryRun}` });
    return sendJson(res, { ok: true, dryRun: config.loxone.dryRun });
  }

  if (req.method === 'PUT' && pathParts[1] === 'config') {
    const nextConfig = parseJson(body);
    config = await saveConfig(nextConfig);
    loxone = new LoxoneClient(config);
    tts = new TtsService(config);
    await initTts();
    return sendJson(res, { ok: true, config });
  }

  if (req.method === 'POST' && pathParts[1] === 'light') {
    const payload = parseJson(body);
    return await runLightCommand(res, payload.room, payload.scene);
  }

  if (req.method === 'POST' && pathParts[1] === 'command') {
    const payload = parseJson(body);
    return await runConfiguredCommand(res, payload.command || payload.key);
  }

  if (pathParts[1] === 'tts') {
    return await handleTts(req, res, pathParts.slice(1), body);
  }

  return sendJson(res, { error: 'not found' }, 404);
}

async function runConfiguredCommand(res, commandKey) {
  if (!commandKey) {
    return sendJson(res, { error: 'command ist erforderlich' }, 400);
  }

  const result = await loxone.runCommand(normalizeKey(commandKey));
  addEvent({
    type: 'command',
    status: result.dryRun ? 'dry-run' : 'sent',
    key: result.key,
    label: result.label,
    category: result.category,
    room: result.room,
    function: result.functionName,
    action: result.action,
    commandType: result.type,
    url: result.url
  });
  return sendJson(res, { ok: true, result });
}

async function runLightCommand(res, room, scene) {
  if (!room || !scene) {
    return sendJson(res, { error: 'room und scene sind erforderlich' }, 400);
  }

  const result = await loxone.changeScene(normalizeKey(room), normalizeKey(scene));
  addEvent({
    type: 'light',
    status: result.dryRun ? 'dry-run' : 'sent',
    room: result.room,
    scene: result.action || scene,
    url: result.url
  });
  return sendJson(res, { ok: true, result });
}

async function handleTts(req, res, pathParts, body) {
  if (req.method !== 'POST') {
    return sendJson(res, { error: 'method not allowed' }, 405);
  }

  const cmd = pathParts[1] || 'speak';
  if (cmd === 'lautstaerke' || cmd === 'volume') {
    await tts.setVolume(body);
    addEvent({ type: 'tts-volume', status: 'sent', volume: body });
    return sendJson(res, { ok: true, command: 'volume' });
  }
  if (cmd === 'alarm') {
    await tts.alarm(body);
    addEvent({ type: 'tts-alarm', status: 'sent', text: body });
    return sendJson(res, { ok: true, command: 'alarm' });
  }

  await tts.speak(body);
  addEvent({ type: 'tts-speak', status: 'sent', text: body });
  return sendJson(res, { ok: true, command: 'speak' });
}

async function initTts() {
  await tts.init();
  const status = tts.getStatus();
  if (!status.enabled) {
    addEvent({ type: 'tts-status', status: 'disabled', text: 'TTS ist deaktiviert.' });
    return;
  }
  if (status.ready) {
    addEvent({ type: 'tts-status', status: 'ready', text: 'Alexa TTS ist bereit.' });
    return;
  }
  addEvent({ type: 'tts-status', status: 'not-ready', text: status.error || 'TTS ist nicht bereit.' });
}

function getSetupStatus() {
  const ttsStatus = tts.getStatus();
  const ttsReady = !config.tts?.enabled || (ttsStatus.ready && ttsDevicesConfigured(ttsStatus));
  const checks = [
    {
      id: 'loxone-url',
      label: 'Loxone-Miniserver URL eintragen',
      ok: isConfiguredUrl(config.loxone?.baseUrl),
      detail: 'Die Beispiel-IP muss durch die echte Miniserver-Adresse ersetzt werden.'
    },
    {
      id: 'loxone-login',
      label: 'Loxone-Zugangsdaten eintragen',
      ok: isConfiguredSecret(config.loxone?.username) && isConfiguredSecret(config.loxone?.password),
      detail: 'Benutzer und Passwort werden fuer Live-Befehle an Loxone benoetigt.'
    },
    {
      id: 'commands',
      label: 'Befehle konfigurieren',
      ok: commandsConfigured(config.commands) || roomsConfigured(config.rooms),
      detail: 'Jeder aktive Befehl braucht einen gueltigen Loxone-Zieltyp mit UUID, Wert oder Pfad.'
    },
    {
      id: 'dry-run',
      label: 'Dry-Run fuer erste Tests aktiv lassen',
      ok: config.loxone?.dryRun !== false,
      detail: 'Live-Modus erst aktivieren, wenn die Tests passen.'
    },
    {
      id: 'tts',
      label: 'Optional: Alexa TTS konfigurieren',
      ok: ttsReady,
      optional: true,
      detail: ttsDetail(ttsStatus)
    }
  ];

  const required = checks.filter((check) => !check.optional);
  const openRequired = required.filter((check) => !check.ok);

  return {
    complete: openRequired.length === 0,
    dryRun: config.loxone?.dryRun !== false,
    openRequired: openRequired.length,
    checks
  };
}

function isConfiguredUrl(value) {
  const raw = String(value || '').trim();
  return raw && raw !== 'http://192.168.1.100' && !raw.includes('replace-with');
}

function isConfiguredSecret(value) {
  const raw = String(value || '').trim();
  return raw && !['loxone-user', 'loxone-pass', 'xxx', 'replace-with'].some((placeholder) => raw.includes(placeholder));
}

function commandsConfigured(commands) {
  const entries = Object.values(commands || {}).filter((command) => command.enabled !== false);
  if (!entries.length) return false;
  return entries.every(isCommandConfigured);
}

function roomsConfigured(rooms) {
  const entries = Object.values(rooms || {});
  if (!entries.length) return false;
  return entries.every((room) => {
    const uuid = String(room.uuid || '');
    return uuid && !uuid.includes('replace-with') && room.scenes && Object.keys(room.scenes).length > 0;
  });
}

function ttsDevicesConfigured(status) {
  return [status.defaultDevices, status.allDevices, status.alarmDevices]
    .some((devices) => Array.isArray(devices) && devices.length > 0);
}

function ttsDetail(status) {
  if (!config.tts?.enabled) {
    return 'TTS ist deaktiviert und kann spaeter eingerichtet werden.';
  }
  if (status.error) {
    return status.error;
  }
  if (!ttsDevicesConfigured(status)) {
    return 'Mindestens ein Alexa-Geraet fuer TTS eintragen.';
  }
  return 'Alexa TTS ist bereit.';
}

function isCommandConfigured(command) {
  const target = readCommandTarget(command);
  if (!['changeTo', 'direct', 'pulse', 'raw'].includes(target.type)) return false;

  if (target.type === 'raw') {
    if (!target.path || target.path.includes('replace-with')) return false;
    if (target.path.includes('{uuid}') && !isConfiguredValue(target.uuid)) return false;
    if ((target.path.includes('{value}') || target.path.includes('{command}')) && !isConfiguredValue(target.value)) return false;
    return true;
  }

  if (!isConfiguredValue(target.uuid)) return false;
  if (target.type === 'pulse') return true;
  return isConfiguredValue(target.value);
}

function readCommandTarget(command) {
  const loxone = command.loxone || {};
  const type = normalizeCommandType(loxone.type || command.loxoneType || command.type || (loxone.path || command.loxonePath ? 'raw' : 'changeTo'));
  return {
    type,
    uuid: loxone.uuid || command.loxoneUuid || '',
    value: loxone.value ?? loxone.command ?? command.loxoneCommand ?? '',
    path: loxone.path || command.loxonePath || ''
  };
}

function normalizeCommandType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'changeto' || raw === 'change_to') return 'changeTo';
  if (raw === 'command' || raw === 'direct') return 'direct';
  if (raw === 'pulse') return 'pulse';
  if (raw === 'raw' || raw === 'path') return 'raw';
  return raw || 'changeTo';
}

function isConfiguredValue(value) {
  const raw = String(value || '').trim();
  return raw && !raw.includes('replace-with');
}

async function handleAlexa2LoxCompat(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendText(res, 'method not allowed', 405);
  }

  const params = url.searchParams;
  const text = params.get('text') || params.get('t') || '';
  const devices = params.get('device') || params.get('devices') || params.get('d') || '';
  const volume = params.get('vol') || '';

  if (!text) {
    return sendText(res, 'Missing text. Use text=... or t=...', 400);
  }

  if (text === '0' && config.tts?.ignoreZeroText !== false) {
    return sendText(res, 'Input text was "0". Request ignored.');
  }

  if (volume) {
    await tts.setVolume(volume, resolveTtsDevices(devices));
    addEvent({ type: 'tts-volume', status: 'sent', volume, devices: resolveTtsDevices(devices) });
  }

  await tts.speak(normalizeTtsText(text), resolveTtsDevices(devices));
  addEvent({ type: 'tts-speak', status: 'sent', text, devices: resolveTtsDevices(devices), compat: 'alexa2lox' });
  return sendText(res, `TTS sent: ${text}`);
}

async function serveStatic(res, relativePath) {
  const safePath = normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const absolutePath = join(publicDir, safePath);
  const content = await readFile(absolutePath);
  res.writeHead(200, { 'content-type': contentType(absolutePath) });
  res.end(content);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 256) {
        reject(new Error('Request body zu gross.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function parseJson(body) {
  try {
    return JSON.parse(body || '{}');
  } catch {
    throw new Error('Ungueltiges JSON.');
  }
}

function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendText(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(payload);
}

function contentType(path) {
  const ext = extname(path);
  if (ext === '.css') return 'text/css';
  if (ext === '.js') return 'text/javascript';
  if (ext === '.svg') return 'image/svg+xml';
  return 'text/html; charset=utf-8';
}

function normalizeKey(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replaceAll('\u00fc', 'ue')
    .replaceAll('\u00f6', 'oe')
    .replaceAll('\u00e4', 'ae')
    .replaceAll('\u00df', 'ss');
}

function normalizeTtsText(value) {
  return String(value).replaceAll('\u00df', 'ss').replaceAll('\u00b0', ' Grad');
}

function resolveTtsDevices(deviceParam) {
  const raw = String(deviceParam || '').trim();
  if (!raw) return firstNonEmpty(config.tts?.defaultDevices);
  if (raw.toUpperCase() === 'ALL') {
    return firstNonEmpty(config.tts?.allDevices, config.tts?.alarmDevices, config.tts?.defaultDevices);
  }
  return raw.split(',').map((device) => device.trim()).filter(Boolean);
}

function firstNonEmpty(...lists) {
  return lists.find((list) => Array.isArray(list) && list.length > 0) || [];
}

function addEvent(event) {
  events.unshift({
    at: new Date().toISOString(),
    ...event
  });
  events.splice(50);
}
