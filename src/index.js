import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, saveConfig } from './config.js';
import { AlexaBridgeService } from './alexa-bridge.js';
import { isCommandType, readCommandTarget } from './command-utils.js';
import { LoxoneClient } from './loxone.js';
import { TtsService } from './tts.js';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(rootDir, 'public');
const require = createRequire(import.meta.url);
let dependencyUpdate = null;

let config = await loadConfig();
let loxone = new LoxoneClient(config);
let tts = new TtsService(config);
let alexaBridge = createAlexaBridge();
let bridgeHttpServer = null;
let bridgeHttpStatus = { enabled: false, ready: false, error: null, port: null };
const events = [];

await initTts();
await initAlexaBridge();
await restartBridgeHttpServer();

const server = http.createServer((req, res) => handleRequest(req, res, { bridgeOnly: false }));

server.listen(config.server.port, '0.0.0.0', () => {
  console.log(`${config.server.name} lauscht auf Port ${config.server.port}`);
});

async function handleRequest(req, res, { bridgeOnly = false } = {}) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (bridgeOnly) {
      if (alexaBridge.canHandleHttp(req, url, pathParts)) {
        return await alexaBridge.handleHttp(req, res, url, pathParts, () => readBody(req), {
          sendJson,
          sendText,
          sendXml
        });
      }
      return sendJson(res, { error: 'not found' }, 404);
    }

    if (req.method === 'GET' && url.pathname === '/') {
      return serveStatic(res, 'index.html');
    }

    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
      return serveStatic(res, url.pathname.replace('/assets/', ''));
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, { ok: true, name: config.server.name, tts: tts.getStatus(), alexaBridge: getAlexaBridgeStatus() });
    }

    if (url.pathname === '/admin/plugins/alexa2lox/tts.php') {
      return await handleAlexa2LoxCompat(req, res, url);
    }

    if (alexaBridge.canHandleHttp(req, url, pathParts)) {
      return await alexaBridge.handleHttp(req, res, url, pathParts, () => readBody(req), {
        sendJson,
        sendText,
        sendXml
      });
    }

    if (pathParts[0] === 'api') {
      return await handleApi(req, res, pathParts, () => readBody(req));
    }

    // Frei definierbarer Befehl: /command/kueche_licht_hell
    if (req.method === 'POST' && pathParts[0] === 'command' && pathParts[1]) {
      return await runConfiguredCommand(res, pathParts[1]);
    }

    // Kurze Legacy-URL für Loxone oder optionale externe Tools: /light/kueche/ambient
    if (req.method === 'POST' && pathParts[0] === 'light' && pathParts.length >= 3) {
      return await runLightCommand(res, pathParts[1], pathParts[2]);
    }

    if (pathParts[0] === 'tts') {
      const body = await readBody(req);
      return await handleTts(req, res, pathParts, body);
    }

    sendJson(res, { error: 'not found' }, 404);
  } catch (error) {
    console.error(error);
    sendJson(res, { error: error.message }, 500);
  }
}

async function handleApi(req, res, pathParts, readRequestBody) {
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

  if (req.method === 'GET' && pathParts[1] === 'tts' && pathParts[2] === 'devices') {
    return await handleTtsDevices(res);
  }

  if (req.method === 'GET' && pathParts[1] === 'alexa-bridge' && pathParts[2] === 'status') {
    return sendJson(res, getAlexaBridgeStatus());
  }

  if (req.method === 'GET' && pathParts[1] === 'dependencies') {
    return sendJson(res, { dependencies: [await getDependencyStatus('alexa-remote2')] });
  }

  if (req.method === 'POST' && pathParts[1] === 'dependencies' && pathParts[2] === 'alexa-remote2' && pathParts[3] === 'update') {
    const payload = parseJson(await readRequestBody());
    return await updateDependency(res, 'alexa-remote2', payload.version || 'latest');
  }

  if (req.method === 'POST' && pathParts[1] === 'system' && pathParts[2] === 'restart') {
    sendJson(res, { ok: true, message: 'LoxEvo startet neu.' });
    setTimeout(() => process.exit(0), 500);
    return;
  }

  if (req.method === 'PUT' && pathParts[1] === 'dry-run') {
    const payload = parseJson(await readRequestBody());
    config.loxone.dryRun = payload.enabled !== false;
    config = await saveConfig(config);
    loxone = new LoxoneClient(config);
    addEvent({ type: 'config', status: 'updated', text: `dryRun=${config.loxone.dryRun}` });
    return sendJson(res, { ok: true, dryRun: config.loxone.dryRun });
  }

  if (req.method === 'PUT' && pathParts[1] === 'config') {
    const nextConfig = parseJson(await readRequestBody());
    config = await saveConfig(nextConfig);
    loxone = new LoxoneClient(config);
    tts = new TtsService(config);
    await initTts();
    await restartAlexaBridge();
    await restartBridgeHttpServer();
    return sendJson(res, { ok: true, config });
  }

  if (req.method === 'POST' && pathParts[1] === 'light') {
    const payload = parseJson(await readRequestBody());
    return await runLightCommand(res, payload.room, payload.scene);
  }

  if (req.method === 'POST' && pathParts[1] === 'command') {
    const payload = parseJson(await readRequestBody());
    return await runConfiguredCommand(res, payload.command || payload.key);
  }

  if (pathParts[1] === 'tts') {
    return await handleTts(req, res, pathParts.slice(1), await readRequestBody());
  }

  return sendJson(res, { error: 'not found' }, 404);
}

async function runConfiguredCommand(res, commandKey) {
  if (!commandKey) {
    return sendJson(res, { error: 'command ist erforderlich' }, 400);
  }

  const result = await executeConfiguredCommand(commandKey, 'command');
  return sendJson(res, { ok: true, result });
}

async function executeConfiguredCommand(commandKey, source) {
  const result = await loxone.runCommand(normalizeKey(commandKey));
  addEvent({
    type: source,
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
  return result;
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
  const payload = parseTtsPayload(body);
  if (cmd === 'lautstaerke' || cmd === 'volume') {
    await tts.setVolume(payload.volume ?? payload.text, payload.devices);
    addEvent({ type: 'tts-volume', status: 'sent', volume: payload.volume ?? payload.text, devices: payload.devices });
    return sendJson(res, { ok: true, command: 'volume', devices: payload.devices || [] });
  }
  if (cmd === 'alarm') {
    const targetDevices = payload.devices || firstNonEmpty(config.tts?.alarmDevices, config.tts?.allDevices, config.tts?.defaultDevices);
    if (payload.volume !== undefined) {
      await tts.speakAtVolume(payload.text, payload.volume, targetDevices);
    } else {
      await tts.alarm(payload.text, targetDevices);
    }
    addEvent({ type: 'tts-alarm', status: 'sent', text: payload.text, volume: payload.volume, devices: targetDevices });
    return sendJson(res, { ok: true, command: 'alarm', devices: targetDevices });
  }

  if (payload.volume !== undefined) {
    await tts.speakAtVolume(payload.text, payload.volume, payload.devices);
  } else {
    await tts.speak(payload.text, payload.devices);
  }
  addEvent({ type: 'tts-speak', status: 'sent', text: payload.text, volume: payload.volume, devices: payload.devices });
  return sendJson(res, { ok: true, command: 'speak', devices: payload.devices || [] });
}

async function handleTtsDevices(res) {
  const devices = await tts.getDeviceInventory();
  return sendJson(res, { devices });
}

function parseTtsPayload(body) {
  const raw = String(body || '');
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) {
    return { text: raw };
  }

  const parsed = parseJson(trimmed);
  const devices = normalizeTtsDeviceOverride(parsed.devices ?? parsed.device);
  return {
    text: String(parsed.text ?? parsed.message ?? parsed.payload ?? ''),
    volume: parsed.volume === undefined ? undefined : parsed.volume,
    devices: devices.length ? devices : undefined
  };
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
  const alexaBridgeStatus = getAlexaBridgeStatus();
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
      detail: 'Benutzer und Passwort werden für Live-Befehle an Loxone benötigt.'
    },
    {
      id: 'commands',
      label: 'Befehle konfigurieren',
      ok: commandsConfigured(config.commands) || roomsConfigured(config.rooms),
      detail: 'Jeder aktive Befehl braucht einen gültigen Loxone-Zieltyp mit UUID, Wert oder Pfad.'
    },
    {
      id: 'dry-run',
      label: 'Betriebsmodus bewusst wählen',
      ok: true,
      optional: true,
      detail: config.loxone?.dryRun !== false
        ? 'Dry-Run ist für erste Tests aktiv. Loxone-Befehle werden nur protokolliert.'
        : 'Live-Modus ist aktiv. Das ist im produktiven Betrieb korrekt; Loxone-Befehle werden wirklich gesendet.'
    },
    {
      id: 'tts',
      label: 'Optional: Alexa TTS konfigurieren',
      ok: ttsReady,
      optional: true,
      detail: ttsDetail(ttsStatus)
    },
    {
      id: 'alexa-bridge',
      label: 'Optional: Alexa Geräte aktivieren',
      ok: !config.alexaBridge?.enabled || alexaBridgeStatus.ready,
      optional: true,
      detail: alexaBridgeDetail(alexaBridgeStatus)
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

async function getDependencyStatus(name) {
  const installedVersion = await getInstalledPackageVersion(name);
  const registry = await getRegistryPackageInfo(name);
  const updateAvailable = Boolean(registry.latestVersion && (!installedVersion || compareVersions(installedVersion, registry.latestVersion) < 0));

  return {
    name,
    installedVersion,
    latestVersion: registry.latestVersion,
    availableVersions: registry.availableVersions,
    updateAvailable,
    latestCheckedAt: registry.checkedAt,
    latestError: registry.error,
    installPath: getDependencyInstallDir(),
    update: dependencyUpdate?.name === name ? dependencyUpdate : null
  };
}

async function getInstalledPackageVersion(name) {
  const requires = [
    createRequire(join(getDependencyInstallDir(), 'package.json')),
    require
  ];

  for (const requireFn of requires) {
    try {
      const packagePath = requireFn.resolve(`${name}/package.json`);
      const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
      return packageJson.version || null;
    } catch {
      // Try the next installation location.
    }
  }
  return null;
}

async function getRegistryPackageInfo(name) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      headers: { accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`npm Registry HTTP ${response.status}`);
    }
    const payload = await response.json();
    const availableVersions = Object.keys(payload.versions || {})
      .sort(compareVersions)
      .reverse()
      .slice(0, 30);
    return {
      latestVersion: payload['dist-tags']?.latest || availableVersions[0] || null,
      availableVersions,
      checkedAt: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    return { latestVersion: null, availableVersions: [], checkedAt: new Date().toISOString(), error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function updateDependency(res, name, version) {
  if (dependencyUpdate?.status === 'running') {
    return sendJson(res, { ok: false, error: 'Ein Update läuft bereits.' }, 409);
  }
  const requestedVersion = normalizePackageVersion(version);

  dependencyUpdate = {
    name,
    requestedVersion,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    message: 'Update wird installiert...',
    restartRequired: false
  };

  try {
    const output = await runNpmInstall(name, requestedVersion);
    dependencyUpdate = {
      ...dependencyUpdate,
      status: 'done',
      finishedAt: new Date().toISOString(),
      message: `${name}@${requestedVersion} installiert. Bitte LoxEvo neu starten.`,
      restartRequired: true,
      output: output.slice(-4000)
    };
    addEvent({ type: 'dependency-update', status: 'done', text: `${name} wurde aktualisiert.` });
    return sendJson(res, { ok: true, dependencies: [await getDependencyStatus(name)] });
  } catch (error) {
    dependencyUpdate = {
      ...dependencyUpdate,
      status: 'error',
      finishedAt: new Date().toISOString(),
      message: error.message,
      restartRequired: false
    };
    addEvent({ type: 'dependency-update', status: 'error', text: `${name}: ${error.message}` });
    return sendJson(res, { ok: false, error: error.message, dependencies: [await getDependencyStatus(name)] }, 500);
  }
}

async function runNpmInstall(name, version) {
  await ensureDependencyInstallDir();
  const npmExecPath = process.env.npm_execpath;
  const command = npmExecPath ? process.execPath : 'npm';
  const packageSpec = `${name}@${version}`;
  const args = npmExecPath
    ? [npmExecPath, 'install', packageSpec, '--omit=dev', '--no-audit', '--no-fund']
    : ['install', packageSpec, '--omit=dev', '--no-audit', '--no-fund'];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: getDependencyInstallDir(),
      windowsHide: true,
      env: process.env
    });
    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(output.trim() || `npm install wurde mit Code ${code} beendet.`));
    });
  });
}

async function ensureDependencyInstallDir() {
  const installDir = getDependencyInstallDir();
  await mkdir(installDir, { recursive: true });
  const packagePath = join(installDir, 'package.json');
  try {
    await readFile(packagePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeFile(packagePath, `${JSON.stringify({ private: true, dependencies: {} }, null, 2)}\n`, 'utf8');
  }
}

function normalizePackageVersion(version) {
  const raw = String(version || 'latest').trim();
  if (!/^[a-zA-Z0-9._~+-]+$/.test(raw)) {
    throw new Error(`Ungültige Paketversion: ${version}`);
  }
  return raw || 'latest';
}

function getDependencyInstallDir() {
  if (process.env.DEPENDENCY_INSTALL_DIR) {
    return process.env.DEPENDENCY_INSTALL_DIR;
  }
  if (process.env.CONFIG_PATH) {
    return resolve(dirname(process.env.CONFIG_PATH));
  }
  return rootDir;
}

function compareVersions(left, right) {
  const leftParts = String(left || '').split('.').map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = String(right || '').split('.').map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
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
    .some((devices) => Array.isArray(devices) && devices.some(isConfiguredValue));
}

function ttsDetail(status) {
  if (!config.tts?.enabled) {
    return 'TTS ist deaktiviert und kann später eingerichtet werden.';
  }
  if (status.error) {
    return status.error;
  }
  if (!ttsDevicesConfigured(status)) {
    return 'Mindestens ein Alexa-Gerät für TTS eintragen.';
  }
  return 'Alexa TTS ist bereit.';
}

function alexaBridgeDetail(status) {
  if (!status.enabled) {
    return 'Virtuelle Alexa-Geräte sind deaktiviert und können später eingerichtet werden.';
  }
  if (status.bridgeHttp?.error) {
    return status.bridgeHttp.error;
  }
  if (status.error) {
    return status.error;
  }
  return `${status.deviceCount} virtuelle Geräte für Alexa bereit.`;
}

function isCommandConfigured(command) {
  const target = readCommandTarget(command);
  if (!isCommandType(target.type)) return false;

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
  const targetDevices = resolveTtsDevices(devices);

  if (!text) {
    return sendText(res, 'Missing text. Use text=... or t=...', 400);
  }

  if (text === '0' && config.tts?.ignoreZeroText !== false) {
    return sendText(res, 'Input text was "0". Request ignored.');
  }

  if (volume) {
    await tts.speakAtVolume(normalizeTtsText(text), volume, targetDevices);
    addEvent({ type: 'tts-speak', status: 'sent', text, volume, devices: targetDevices, compat: 'alexa2lox' });
    return sendText(res, `TTS sent: ${text}`);
  }

  await tts.speak(normalizeTtsText(text), targetDevices);
  addEvent({ type: 'tts-speak', status: 'sent', text, devices: targetDevices, compat: 'alexa2lox' });
  return sendText(res, `TTS sent: ${text}`);
}

function createAlexaBridge() {
  return new AlexaBridgeService(config, {
    getCommands: () => config.commands || {},
    executeCommand: (commandKey) => executeConfiguredCommand(commandKey, 'alexa-command'),
    addEvent
  });
}

async function initAlexaBridge() {
  await alexaBridge.start();
}

async function restartAlexaBridge() {
  await alexaBridge.stop();
  alexaBridge = createAlexaBridge();
  await initAlexaBridge();
}

function getAlexaBridgeStatus() {
  return {
    ...alexaBridge.getStatus(),
    bridgeHttp: bridgeHttpStatus
  };
}

async function restartBridgeHttpServer() {
  await stopBridgeHttpServer();

  const bridgeStatus = alexaBridge.getStatus();
  const port = Number(bridgeStatus.port);
  bridgeHttpStatus = {
    enabled: bridgeStatus.enabled && port !== Number(config.server.port),
    ready: false,
    error: null,
    port
  };

  if (!bridgeHttpStatus.enabled) {
    return;
  }

  bridgeHttpServer = http.createServer((req, res) => handleRequest(req, res, { bridgeOnly: true }));
  try {
    await new Promise((resolve, reject) => {
      bridgeHttpServer.once('error', reject);
      bridgeHttpServer.listen(port, '0.0.0.0', resolve);
    });
    bridgeHttpStatus.ready = true;
    console.log(`Alexa-Bridge HTTP lauscht auf Port ${port}`);
  } catch (error) {
    bridgeHttpStatus.error = `Alexa-Bridge HTTP Port ${port} konnte nicht geoeffnet werden: ${error.message}`;
    console.warn(bridgeHttpStatus.error);
    addEvent({ type: 'alexa-bridge-http', status: 'error', text: bridgeHttpStatus.error });
    await stopBridgeHttpServer();
  }
}

async function stopBridgeHttpServer() {
  if (!bridgeHttpServer) return;
  const currentServer = bridgeHttpServer;
  bridgeHttpServer = null;
  await new Promise((resolve) => currentServer.close(resolve));
}

async function serveStatic(res, relativePath) {
  const absolutePath = resolve(publicDir, relativePath);
  const publicRoot = `${resolve(publicDir)}${sep}`;
  if (absolutePath !== resolve(publicDir) && !absolutePath.startsWith(publicRoot)) {
    return sendText(res, 'not found', 404);
  }

  let content;
  try {
    content = await readFile(absolutePath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      return sendText(res, 'not found', 404);
    }
    throw error;
  }

  res.writeHead(200, {
    'content-type': contentType(absolutePath),
    'cache-control': 'no-store'
  });
  res.end(content);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 256) {
        reject(new Error('Request body zu groß.'));
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
    throw new Error('Ungültiges JSON.');
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

function sendXml(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { 'content-type': 'application/xml; charset=utf-8' });
  res.end(payload);
}

function contentType(path) {
  const ext = extname(path);
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'text/javascript; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
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

function normalizeTtsDeviceOverride(value) {
  if (Array.isArray(value)) {
    return value.map((device) => String(device).trim()).filter(Boolean);
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  if (raw.toUpperCase() === 'ALL') {
    return firstNonEmpty(config.tts?.allDevices, config.tts?.alarmDevices, config.tts?.defaultDevices);
  }
  return raw.split(/\r?\n|,/).map((device) => device.trim()).filter(Boolean);
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
