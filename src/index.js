import http from 'node:http';
import { constants } from 'node:fs';
import { access, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, saveConfig } from './config.js';
import { AlexaBridgeService, isSsdpPortInUseError } from './alexa-bridge.js';
import { isCommandType, readCommandTarget } from './command-utils.js';
import { DiscoveryControl } from './discovery-control.js';
import { LoxoneClient } from './loxone.js';
import { TtsService, parseAlexaCookieFile } from './tts.js';
import { enforcePrivateFileMode, inspectFilePermissions, PRIVATE_FILE_MODE } from './file-security.js';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(rootDir, 'public');
const require = createRequire(import.meta.url);
let dependencyUpdate = null;

let config = await loadConfig();
let loxone = new LoxoneClient(config);
let tts = createTtsService();
let alexaBridge = createAlexaBridge();
let discoveryControl = new DiscoveryControl(config);
let bridgeHttpServer = null;
let bridgeHttpStatus = { enabled: false, ready: false, error: null, port: null };
const events = [];
const dedupedEventTimes = new Map();
const oncePerProcessEventKeys = new Set();
const startedAt = new Date();
const MAX_REQUEST_BODY_SIZE = 1024 * 1024 * 2;
const OPTIONAL_DISCOVERY_EVENT_DEDUPE_MS = 30 * 60 * 1000;
const ENV_ADMIN_TOKEN = String(process.env.LOXEVO_ADMIN_TOKEN || '').trim();
let adminSecurity = await loadAdminSecurity();
const LOXONE_TTS_RESERVED_PATHS = new Set([
  'admin',
  'api',
  'assets',
  'command',
  'description.xml',
  'favicon.ico',
  'health',
  'light',
  'tts'
]);

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

    if (req.method === 'GET' && url.pathname === '/favicon.ico') {
      return serveStatic(res, 'loxevo-logo.png');
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
      return await handleApi(req, res, pathParts, () => readBody(req), url);
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

    // Loxone-TTS-Kurzpfad: POST /<cmd>
    // Beispiele: /geschirrspueler -> TTS, /alarm -> Alarm, /lautstaerke -> Lautstärke.
    if (req.method === 'POST' && pathParts.length === 1 && isLoxoneTtsCompatPath(pathParts[0])) {
      const body = await readBody(req);
      return await handleLoxoneTtsShortPath(res, url, pathParts[0], body);
    }

    sendJson(res, { error: 'not found' }, 404);
  } catch (error) {
    console.error(error);
    sendJson(res, { error: error.message }, 500);
  }
}

async function handleApi(req, res, pathParts, readRequestBody, url) {
  if (requiresAdminToken(req, pathParts) && !isAdminAuthorized(req)) {
    return sendJson(res, {
      ok: false,
      code: 'admin_token_required',
      error: 'Admin-Passwort erforderlich.'
    }, 401);
  }

  if (req.method === 'GET' && pathParts[1] === 'config') {
    return sendJson(res, config);
  }

  if (req.method === 'GET' && pathParts[1] === 'events') {
    return sendJson(res, events);
  }

  if (req.method === 'POST' && pathParts[1] === 'events' && pathParts[2] === 'clear') {
    events.length = 0;
    addEvent({ type: 'events', status: 'cleared', text: 'Protokoll wurde geleert.' });
    return sendJson(res, { ok: true, events });
  }

  if (req.method === 'GET' && pathParts[1] === 'setup-status') {
    return sendJson(res, getSetupStatus());
  }

  if (req.method === 'GET' && pathParts[1] === 'preflight') {
    return sendJson(res, await getPreflightStatus());
  }

  if (req.method === 'GET' && pathParts[1] === 'diagnostics') {
    return await exportDiagnostics(res);
  }

  if (req.method === 'GET' && pathParts[1] === 'admin' && pathParts[2] === 'status') {
    return sendJson(res, getAdminSecurityStatus());
  }

  if (req.method === 'POST' && pathParts[1] === 'admin' && pathParts[2] === 'token') {
    try {
      return await updateAdminToken(res, parseJson(await readRequestBody()));
    } catch (error) {
      return sendJson(res, { ok: false, error: error.message }, 400);
    }
  }

  if (req.method === 'GET' && pathParts[1] === 'tts' && pathParts[2] === 'status') {
    return sendJson(res, tts.getStatus());
  }

  if (req.method === 'GET' && pathParts[1] === 'tts' && pathParts[2] === 'devices') {
    return await handleTtsDevices(res);
  }

  if (req.method === 'POST' && pathParts[1] === 'tts' && pathParts[2] === 'reconnect') {
    const result = await tts.reconnect('manual-api');
    return sendJson(res, { ok: Boolean(result.ok), status: result.status, error: result.error });
  }

  if (req.method === 'GET' && pathParts[1] === 'alexa-bridge' && pathParts[2] === 'status') {
    return sendJson(res, getAlexaBridgeStatus());
  }

  if (req.method === 'GET' && pathParts[1] === 'discovery' && pathParts[2] === 'status') {
    return sendJson(res, await getDiscoveryStatus());
  }

  if (req.method === 'POST' && pathParts[1] === 'discovery' && pathParts[2] === 'start') {
    return await startDiscoveryMode(res);
  }

  if (req.method === 'POST' && pathParts[1] === 'discovery' && pathParts[2] === 'stop') {
    return await stopDiscoveryMode(res);
  }

  if (req.method === 'GET' && pathParts[1] === 'dependencies') {
    return sendJson(res, { dependencies: [await getDependencyStatus('alexa-remote2')] });
  }

  if (req.method === 'GET' && pathParts[1] === 'backup') {
    return await exportBackup(res, url.searchParams.get('includeCookie') === 'true');
  }

  if (req.method === 'POST' && pathParts[1] === 'backup' && pathParts[2] === 'restore') {
    try {
      return await restoreBackup(res, parseJson(await readRequestBody()));
    } catch (error) {
      return sendJson(res, { ok: false, error: error.message }, 400);
    }
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
    tts = createTtsService();
    discoveryControl = new DiscoveryControl(config);
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

function requiresAdminToken(req, pathParts) {
  if (!isAdminProtectionEnabled()) return false;

  const method = String(req.method || '').toUpperCase();
  const resource = pathParts[1] || '';
  const action = pathParts[2] || '';
  const subAction = pathParts[3] || '';

  if (method === 'POST' && resource === 'admin' && action === 'token') return true;
  if (method === 'POST' && resource === 'tts' && action === 'reconnect') return true;
  if (method === 'POST' && resource === 'discovery' && ['start', 'stop'].includes(action)) return true;
  if (method === 'GET' && resource === 'config') return true;
  if (method === 'PUT' && resource === 'config') return true;
  if (method === 'GET' && resource === 'backup') return true;
  if (method === 'POST' && resource === 'backup' && action === 'restore') return true;
  if (method === 'GET' && resource === 'diagnostics') return true;
  if (method === 'POST' && resource === 'events' && action === 'clear') return true;
  if (method === 'POST' && resource === 'dependencies' && action === 'alexa-remote2' && subAction === 'update') return true;
  if (method === 'POST' && resource === 'system' && action === 'restart') return true;
  if (method === 'PUT' && resource === 'dry-run') return true;

  return false;
}

function isAdminAuthorized(req) {
  const token = readAdminToken(req);
  if (!token) return false;
  if (ENV_ADMIN_TOKEN) return safeTokenEquals(token, ENV_ADMIN_TOKEN);
  return verifyStoredAdminToken(token);
}

function readAdminToken(req) {
  const directHeader = req.headers['x-loxevo-admin-token'];
  if (Array.isArray(directHeader)) return String(directHeader[0] || '').trim();
  if (directHeader) return String(directHeader).trim();

  const authorization = String(req.headers.authorization || '').trim();
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return '';
}

function safeTokenEquals(actual, expected) {
  const actualBuffer = Buffer.from(String(actual));
  const expectedBuffer = Buffer.from(String(expected));
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function isAdminProtectionEnabled() {
  return Boolean(ENV_ADMIN_TOKEN || adminSecurity?.enabled);
}

function getAdminSecurityStatus() {
  const source = ENV_ADMIN_TOKEN ? 'environment' : adminSecurity?.enabled ? 'ui' : 'none';
  return {
    enabled: isAdminProtectionEnabled(),
    source,
    manageable: !ENV_ADMIN_TOKEN,
    message: describeAdminSecurity(source)
  };
}

function describeAdminSecurity(source) {
  if (source === 'environment') {
    return 'Admin-Schutz ist über LOXEVO_ADMIN_TOKEN aktiv und wird ausserhalb der Web-UI verwaltet.';
  }
  if (source === 'ui') {
    return 'Admin-Schutz ist aktiv und wird über die Web-UI verwaltet.';
  }
  return 'Admin-Schutz ist deaktiviert. Sensible Web-UI-Aktionen sind ohne Admin-Passwort erreichbar.';
}

async function updateAdminToken(res, payload) {
  if (ENV_ADMIN_TOKEN) {
    return sendJson(res, {
      ok: false,
      error: 'Admin-Schutz wird über LOXEVO_ADMIN_TOKEN verwaltet und kann in der Web-UI nicht geändert werden.'
    }, 409);
  }

  if (payload?.enabled === false || payload?.action === 'disable') {
    await removeAdminToken();
    adminSecurity = { enabled: false };
    sessionAdminEvent('disabled');
    return sendJson(res, { ok: true, status: getAdminSecurityStatus() });
  }

  const token = String(payload?.token || '').trim();
  if (token.length < 8) {
    throw new Error('Das Admin-Passwort muss mindestens 8 Zeichen lang sein.');
  }

  adminSecurity = createAdminTokenRecord(token);
  await writeAdminSecurity(adminSecurity);
  sessionAdminEvent('updated');
  return sendJson(res, { ok: true, status: getAdminSecurityStatus() });
}

function sessionAdminEvent(status) {
  addEvent({
    type: 'admin-security',
    status,
    text: status === 'disabled'
      ? 'Admin-Schutz wurde deaktiviert.'
      : 'Admin-Schutz wurde aktualisiert.'
  });
}

async function loadAdminSecurity() {
  try {
    const payload = JSON.parse(await readFile(getAdminTokenPath(), 'utf8'));
    if (payload?.version === 1 && payload?.salt && payload?.key) {
      return { enabled: true, ...payload };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Admin-Schutz konnte nicht gelesen werden: ${error.message}`);
    }
  }
  return { enabled: false };
}

async function writeAdminSecurity(record) {
  const tokenPath = getAdminTokenPath();
  await mkdir(dirname(tokenPath), { recursive: true });
  await writeFile(tokenPath, `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', mode: PRIVATE_FILE_MODE });
  await enforcePrivateFileMode(tokenPath, 'Admin-Token-Datei');
}

async function removeAdminToken() {
  await rm(getAdminTokenPath(), { force: true });
}

function createAdminTokenRecord(token) {
  const salt = randomBytes(16).toString('hex');
  return {
    enabled: true,
    version: 1,
    algorithm: 'scrypt',
    salt,
    key: hashAdminToken(token, salt),
    updatedAt: new Date().toISOString()
  };
}

function verifyStoredAdminToken(token) {
  if (!adminSecurity?.enabled || !adminSecurity.salt || !adminSecurity.key) return false;
  const actual = hashAdminToken(token, adminSecurity.salt);
  return safeTokenEquals(actual, adminSecurity.key);
}

function hashAdminToken(token, salt) {
  return scryptSync(String(token), String(salt), 32).toString('hex');
}

async function exportBackup(res, includeCookie) {
  const exportedAt = new Date().toISOString();
  const fileName = `loxevo-backup-${timestampForFile(exportedAt)}.json`;
  const backup = {
    app: config.server?.name || 'LoxEvo',
    formatVersion: 1,
    exportedAt,
    config
  };

  if (includeCookie) {
    const cookiePath = resolveCookiePath(config.tts?.cookieFile);
    try {
      backup.cookie = {
        path: config.tts?.cookieFile || '/config/Node.txt',
        content: await readFile(cookiePath, 'utf8')
      };
    } catch (error) {
      return sendJson(res, { ok: false, error: `Cookie-Datei konnte nicht gelesen werden: ${error.message}` }, 400);
    }
  }

  await writeBackupExportState({
    exportedAt,
    includeCookie,
    fileName,
    configHash: backupRelevantConfigHash(config),
    sectionHashes: backupRelevantSectionHashes(config)
  });
  addEvent({ type: 'backup', status: 'exported', text: includeCookie ? 'Backup mit Cookie exportiert.' : 'Backup exportiert.' });
  return sendJsonDownload(res, backup, fileName);
}

async function restoreBackup(res, backupPayload) {
  const nextConfig = readBackupConfig(backupPayload);
  const cookieTargetPath = resolveBackupCookieTarget(backupPayload, nextConfig);
  const currentBackupPath = await writeCurrentConfigBackup();

  config = await saveConfig(nextConfig);
  const cookieRestored = await restoreCookieFromBackup(backupPayload, cookieTargetPath);

  loxone = new LoxoneClient(config);
  tts = createTtsService();
  discoveryControl = new DiscoveryControl(config);
  await initTts();
  await restartAlexaBridge();
  await restartBridgeHttpServer();

  addEvent({
    type: 'backup',
    status: 'restored',
    text: cookieRestored ? 'Backup mit Cookie importiert.' : 'Backup importiert.',
    backupPath: currentBackupPath
  });

  return sendJson(res, { ok: true, config, backupPath: currentBackupPath, cookieRestored });
}

async function exportDiagnostics(res) {
  const exportedAt = new Date().toISOString();
  const diagnostics = {
    app: config.server?.name || 'LoxEvo',
    formatVersion: 1,
    exportedAt,
    health: {
      ok: true,
      name: config.server?.name || 'LoxEvo',
      tts: summarizeTtsStatus(tts.getStatus()),
      alexaBridge: summarizeAlexaBridgeStatus(getAlexaBridgeStatus())
    },
    adminSecurity: getAdminSecurityStatus(),
    preflight: sanitizeDiagnosticValue(await getPreflightStatus()),
    dependencies: sanitizeDiagnosticValue([await getDependencyStatus('alexa-remote2')]),
    configSummary: sanitizeConfigForDiagnostics(config),
    recentEvents: events.slice(0, 50).map(sanitizeEventForDiagnostics)
  };

  addEvent({ type: 'diagnostics', status: 'exported', text: 'Diagnose exportiert.' });
  return sendJsonDownload(res, diagnostics, `loxevo-diagnostics-${timestampForFile(exportedAt)}.json`);
}

function summarizeTtsStatus(status) {
  return {
    enabled: Boolean(status?.enabled),
    ready: Boolean(status?.ready),
    error: status?.error ? redactDiagnosticText(String(status.error)) : null,
    defaultDevicesCount: configuredCount(status?.defaultDevices),
    defaultSpeakDevicesCount: configuredCount(status?.defaultSpeakDevices),
    allDevicesCount: configuredCount(status?.allDevices),
    alarmDevicesCount: configuredCount(status?.alarmDevices),
    defaultVolume: status?.defaultVolume,
    alarmVolume: status?.alarmVolume,
    nativeSequences: Boolean(status?.nativeSequences),
    auth: sanitizeDiagnosticValue(status?.auth || {})
  };
}

function summarizeAlexaBridgeStatus(status) {
  return {
    enabled: Boolean(status?.enabled),
    ready: Boolean(status?.ready),
    error: status?.error ? redactDiagnosticText(String(status.error)) : null,
    port: status?.port,
    ssdpPort: status?.ssdpPort,
    ssdpMode: status?.ssdpMode,
    discoveryPaused: Boolean(status?.discoveryPaused),
    deviceCount: status?.deviceCount,
    bridgeHttp: status?.bridgeHttp
      ? {
          enabled: Boolean(status.bridgeHttp.enabled),
          ready: Boolean(status.bridgeHttp.ready),
          error: status.bridgeHttp.error ? redactDiagnosticText(String(status.bridgeHttp.error)) : null,
          port: status.bridgeHttp.port
        }
      : undefined
  };
}

function sanitizeConfigForDiagnostics(sourceConfig) {
  return {
    server: {
      name: sourceConfig.server?.name,
      port: sourceConfig.server?.port
    },
    loxone: {
      baseUrl: redactUrlHost(sourceConfig.loxone?.baseUrl),
      usernameConfigured: isConfiguredSecret(sourceConfig.loxone?.username),
      passwordConfigured: isConfiguredSecret(sourceConfig.loxone?.password),
      dryRun: sourceConfig.loxone?.dryRun
    },
    commands: {
      count: Object.keys(sourceConfig.commands || {}).length,
      activeCount: Object.values(sourceConfig.commands || {}).filter((command) => command?.enabled !== false).length,
      categories: uniqueCaseInsensitive(Object.values(sourceConfig.commands || {}).map((command) => command?.category).filter(Boolean))
    },
    alexaBridge: {
      enabled: Boolean(sourceConfig.alexaBridge?.enabled),
      advertiseIpConfigured: Boolean(sourceConfig.alexaBridge?.advertiseIp),
      advertisePort: sourceConfig.alexaBridge?.advertisePort,
      deviceCount: getAlexaBridgeStatus().deviceCount
    },
    tts: {
      enabled: Boolean(sourceConfig.tts?.enabled),
      cookieFile: sourceConfig.tts?.cookieFile,
      defaultDevicesCount: configuredCount(sourceConfig.tts?.defaultDevices),
      allDevicesCount: configuredCount(sourceConfig.tts?.allDevices),
      alarmDevicesCount: configuredCount(sourceConfig.tts?.alarmDevices),
      defaultVolume: sourceConfig.tts?.defaultVolume,
      alarmVolume: sourceConfig.tts?.alarmVolume
    }
  };
}

function sanitizeEventForDiagnostics(event) {
  return {
    at: event.at,
    type: event.type,
    status: event.status,
    key: event.key,
    label: event.label,
    category: event.category,
    room: event.room,
    function: event.function,
    action: event.action,
    commandType: event.commandType,
    compat: event.compat,
    text: event.text ? truncate(redactDiagnosticText(String(event.text)), 140) : undefined,
    error: event.error ? truncate(redactDiagnosticText(String(event.error)), 180) : undefined,
    volume: event.volume,
    devicesCount: Array.isArray(event.devices) ? event.devices.length : undefined,
    url: event.url ? redactUrl(event.url) : undefined
  };
}

function redactUrlHost(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return `${url.protocol}//<host>${url.port ? `:${url.port}` : ''}`;
  } catch {
    return '<configured>';
  }
}

function uniqueCaseInsensitive(values = []) {
  const result = [];
  const seen = new Set();
  values.forEach((value) => {
    const text = String(value || '').trim();
    if (!text) return;
    const key = text.toLocaleLowerCase('de-CH');
    if (seen.has(key)) return;
    seen.add(key);
    result.push(text);
  });
  return result;
}

function redactUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    url.hostname = '<host>';
    if (url.username) url.username = '';
    if (url.password) url.password = '';
    return url.toString();
  } catch {
    return String(value).replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '<ip>');
  }
}

function sanitizeDiagnosticValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeDiagnosticValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, sanitizeDiagnosticValue(nestedValue)]));
  }
  if (typeof value === 'string') return redactDiagnosticText(value);
  return value;
}

function redactDiagnosticText(value) {
  return value
    .replace(/https?:\/\/[^\s"'<>]+/g, (match) => redactUrl(match))
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '<ip>');
}

function readBackupConfig(payload) {
  if (isPlainObject(payload?.config)) {
    if (!looksLikeLoxEvoConfig(payload.config)) {
      throw new Error('Backup enthält keine gültige LoxEvo-Konfiguration.');
    }
    return structuredClone(payload.config);
  }
  if (looksLikeLoxEvoConfig(payload)) {
    return structuredClone(payload);
  }
  throw new Error('Backup enthaelt keine gueltige LoxEvo-Konfiguration.');
}

function looksLikeLoxEvoConfig(value) {
  return isPlainObject(value) && isPlainObject(value.loxone) && (isPlainObject(value.commands) || isPlainObject(value.rooms));
}

async function writeCurrentConfigBackup() {
  const configPath = getConfigPath();
  const backupPath = join(dirname(configPath), `config.backup-${timestampForFile(new Date().toISOString())}.json`);
  await writeFile(backupPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: 'utf8', mode: PRIVATE_FILE_MODE });
  await enforcePrivateFileMode(backupPath, 'Konfigurations-Backup');
  return backupPath;
}

function resolveBackupCookieTarget(payload, nextConfig) {
  if (!payload?.cookie?.content) {
    return null;
  }

  const targetPath = resolveCookiePath(nextConfig.tts?.cookieFile || payload.cookie.path);
  if (!isInsideDirectory(targetPath, getConfigDir())) {
    throw new Error('Cookie-Datei wird nur innerhalb des lokalen Datenordners wiederhergestellt.');
  }

  return targetPath;
}

async function restoreCookieFromBackup(payload, targetPath) {
  if (!targetPath) {
    return false;
  }

  await writeFile(targetPath, payload.cookie.content, { encoding: 'utf8', mode: PRIVATE_FILE_MODE });
  await enforcePrivateFileMode(targetPath, 'Alexa-Cookie-Datei');
  return true;
}

function resolveCookiePath(value) {
  const raw = String(value || 'Node.txt').trim() || 'Node.txt';
  if (raw.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(raw)) {
    return resolve(raw);
  }
  return resolve(getConfigDir(), raw);
}

function getConfigPath() {
  return resolve(process.env.CONFIG_PATH || './config.json');
}

function getConfigDir() {
  return dirname(getConfigPath());
}

function getAdminTokenPath() {
  return resolve(process.env.LOXEVO_ADMIN_TOKEN_FILE || join(getConfigDir(), 'admin-token.json'));
}

function getBackupStatePath() {
  return resolve(process.env.LOXEVO_BACKUP_STATE_FILE || join(getConfigDir(), 'backup-state.json'));
}

function isInsideDirectory(path, directory) {
  const resolvedPath = resolve(path);
  const resolvedDirectory = resolve(directory);
  return resolvedPath === resolvedDirectory || resolvedPath.startsWith(`${resolvedDirectory}${sep}`);
}

function timestampForFile(value) {
  return String(value).replace(/\D/g, '').slice(0, 14);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function runConfiguredCommand(res, commandKey) {
  if (!commandKey) {
    return sendJson(res, { error: 'command ist erforderlich' }, 400);
  }

  const result = await executeConfiguredCommand(commandKey, 'command');
  return sendJson(res, { ok: true, result });
}

async function executeConfiguredCommand(commandKey, source, options = {}) {
  const normalizedCommandKey = normalizeKey(commandKey);
  const result = options.offTarget
    ? await loxone.runCommandOff(normalizedCommandKey)
    : await loxone.runCommand(normalizedCommandKey);
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
    await tts.alarm(payload.text, targetDevices, payload.volume);
    addEvent({ type: 'tts-alarm', status: 'sent', text: payload.text, volume: payload.volume, devices: targetDevices });
    return sendJson(res, { ok: true, command: 'alarm', devices: targetDevices });
  }

  const targetDevices = payload.devices || defaultTtsSpeakDevices();
  await tts.speak(payload.text, targetDevices);
  addEvent({ type: 'tts-speak', status: 'sent', text: payload.text, devices: targetDevices });
  return sendJson(res, { ok: true, command: 'speak', devices: targetDevices });
}

async function handleLoxoneTtsShortPath(res, url, commandName, body) {
  const cmd = normalizeKey(commandName);
  const payload = parseTtsPayloadWithQuery(body, url.searchParams);

  if ((cmd === 'lautstaerke' || cmd === 'volume') && !Number.isFinite(Number(payload.volume ?? payload.text))) {
    return sendJson(res, { ok: false, error: `Ungültige Lautstärke für "${cmd}".` }, 400);
  }

  if (cmd !== 'lautstaerke' && cmd !== 'volume' && payload.text !== '0' && !containsSpeechText(payload.text)) {
    addEvent({ type: 'tts-speak', status: 'ignored', key: cmd, text: payload.text, compat: 'loxone-short-path' });
    return sendJson(res, { ok: false, error: `Kein gültiger TTS-Text für "${cmd}" im Request-Body.` }, 400);
  }

  addEvent({ type: 'tts-short-path', status: 'accepted', key: cmd, text: payload.text, volume: payload.volume, compat: 'loxone-short-path' });
  executeLoxoneTtsShortPath(cmd, payload).catch((error) => {
    console.warn(`Loxone-TTS-Kurzpfad "${cmd}" fehlgeschlagen: ${error.message}`);
    addEvent({ type: 'tts-short-path', status: 'error', key: cmd, text: payload.text, error: error.message, compat: 'loxone-short-path' });
  });

  return sendJson(res, { ok: true, accepted: true, route: cmd });
}

async function executeLoxoneTtsShortPath(cmd, payload) {
  if (cmd === 'lautstaerke' || cmd === 'volume') {
    const volume = payload.volume ?? payload.text;
    const targetDevices = payload.devices || firstNonEmpty(config.tts?.allDevices, config.tts?.defaultDevices, config.tts?.alarmDevices);
    await tts.setVolume(volume, targetDevices);
    addEvent({ type: 'tts-volume', status: 'sent', key: cmd, volume, devices: targetDevices, compat: 'loxone-short-path' });
    return;
  }

  if (payload.text === '0' && config.tts?.ignoreZeroText !== false) {
    addEvent({ type: 'tts-speak', status: 'ignored', key: cmd, text: payload.text, compat: 'loxone-short-path' });
    return;
  }

  if (cmd === 'alarm') {
    const targetDevices = payload.devices || firstNonEmpty(config.tts?.alarmDevices, config.tts?.allDevices, config.tts?.defaultDevices);
    await tts.alarm(payload.text, targetDevices, payload.volume);
    addEvent({ type: 'tts-alarm', status: 'sent', key: cmd, text: payload.text, volume: payload.volume, devices: targetDevices, compat: 'loxone-short-path' });
    return;
  }

  const targetDevices = payload.devices || defaultTtsSpeakDevices();
  await tts.speak(payload.text, targetDevices);
  addEvent({ type: 'tts-speak', status: 'sent', key: cmd, text: payload.text, devices: targetDevices, compat: 'loxone-short-path' });
}

async function handleTtsDevices(res) {
  const devices = await tts.getDeviceInventory();
  return sendJson(res, { devices });
}

function parseTtsPayload(body) {
  const raw = String(body || '');
  const trimmed = raw.trim();
  if (looksLikeFormBody(trimmed)) {
    return parseTtsFormPayload(new URLSearchParams(trimmed));
  }
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

function parseTtsPayloadWithQuery(body, params) {
  const payload = parseTtsPayload(body);
  const queryPayload = parseTtsFormPayload(params);
  return {
    text: firstText(payload.text, queryPayload.text),
    volume: payload.volume === undefined ? queryPayload.volume : payload.volume,
    devices: payload.devices || queryPayload.devices
  };
}

function parseTtsFormPayload(params) {
  const devices = normalizeTtsDeviceOverride(params.get('devices') || params.get('device') || params.get('d') || '');
  const text = firstText(params.get('text'), params.get('t'), params.get('message'), params.get('payload'));
  const volume = firstText(params.get('volume'), params.get('vol'), params.get('v'));
  return {
    text,
    volume: volume === '' ? undefined : volume,
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

async function getPreflightStatus() {
  const ttsStatus = tts.getStatus();
  const alexaBridgeStatus = getAlexaBridgeStatus();
  const discoveryStatus = config.alexaBridge?.enabled
    ? await getDiscoveryStatus()
    : { helper: { available: false, ready: false }, alexaBridge: alexaBridgeStatus };
  const configPath = getConfigPath();
  const configDir = getConfigDir();
  const configReadError = await accessError(configPath, constants.R_OK);
  const configWriteError = await accessError(configDir, constants.W_OK);
  const packageVersion = await getPackageVersion();
  const buildCommit = await getBuildCommit();
  const alexaRemoteVersion = await getInstalledPackageVersion('alexa-remote2');
  const cookieInfo = await getCookieFileInfo(config.tts?.cookieFile);
  const backupInfo = await getBackupInfo();
  const lastLoxoneEvent = latestEvent((event) => ['command', 'alexa-command', 'light'].includes(event.type));
  const lastTtsEvent = latestEvent((event) => String(event.type || '').startsWith('tts'));
  const lastAlexaEvent = latestEvent((event) => event.type === 'alexa-command' || String(event.type || '').startsWith('alexa-discovery') || String(event.type || '').startsWith('alexa-bridge'));
  const lastBackupEvent = latestEvent((event) => event.type === 'backup');

  const sections = [
    {
      title: 'LoxEvo',
      checks: [
        preflightCheck('ok', 'Web-UI und API', `Läuft auf Port ${config.server?.port || 8080}.`),
        preflightCheck('info', 'Version', describeVersion(packageVersion, buildCommit)),
        preflightCheck('info', 'Laufzeit', `Gestartet: ${formatDateTimeForDetail(startedAt.toISOString())}. Laufzeit: ${formatDuration(process.uptime())}. Node.js ${process.version}.`),
        preflightCheck(configReadError ? 'error' : 'ok', 'Konfiguration lesbar', configReadError || `Datei: ${configPath}`),
        preflightCheck(configWriteError ? 'error' : 'ok', 'Datenordner beschreibbar', configWriteError || `Ordner: ${configDir}`),
        preflightCheck(isAdminProtectionEnabled() ? 'ok' : 'info', 'Admin-Schutz', getAdminSecurityStatus().message),
        preflightCheck('info', 'Datenhaltung', 'Konfiguration, Backup und Cookie-Datei liegen im Datenordner. Alexa-Cookies werden nur bei bewusst gesetztem Backup-Haken exportiert.')
      ]
    },
    {
      title: 'Loxone',
      checks: [
        preflightCheck(isConfiguredUrl(config.loxone?.baseUrl) ? 'ok' : 'error', 'Miniserver URL', isConfiguredUrl(config.loxone?.baseUrl)
          ? 'Eine Miniserver-URL ist konfiguriert.'
          : 'Die Miniserver-URL fehlt oder enthält noch einen Platzhalter.'),
        preflightCheck(isConfiguredSecret(config.loxone?.username) && isConfiguredSecret(config.loxone?.password) ? 'ok' : 'error', 'Zugangsdaten', isConfiguredSecret(config.loxone?.username) && isConfiguredSecret(config.loxone?.password)
          ? 'Benutzer und Passwort sind eingetragen.'
          : 'Benutzer oder Passwort fehlen noch.'),
        preflightCheck(commandsConfigured(config.commands) || roomsConfigured(config.rooms) ? 'ok' : 'error', 'Befehle', commandsConfigured(config.commands) || roomsConfigured(config.rooms)
          ? 'Aktive Befehle haben gültige Loxone-Ziele.'
          : 'Es sind noch keine vollständig konfigurierten aktiven Befehle vorhanden.'),
        preflightCheck('info', 'Betriebsmodus', config.loxone?.dryRun !== false
          ? 'Dry-Run ist aktiv. Loxone-Befehle werden nur protokolliert.'
          : 'Live-Modus ist aktiv. Loxone-Befehle werden wirklich an den Miniserver gesendet.'),
        preflightCheck(lastLoxoneEvent ? eventLevel(lastLoxoneEvent) : 'info', 'Letzter Loxone-Befehl', describeEvent(lastLoxoneEvent, 'Seit dem letzten Start wurde noch kein Loxone-Befehl ausgeführt.'))
      ]
    },
    {
      title: 'Alexa TTS',
      checks: [
        preflightCheck(config.tts?.enabled ? (ttsStatus.ready ? 'ok' : 'error') : 'optional', 'Alexa-Verbindung', ttsPreflightDetail(ttsStatus)),
        preflightCheck(config.tts?.enabled ? alexaRemoteLevel(alexaRemoteVersion) : 'optional', 'alexa-remote2', describeAlexaRemoteVersion(alexaRemoteVersion)),
        preflightCheck(config.tts?.enabled ? cookieLevel(cookieInfo, ttsStatus) : 'optional', 'Cookie-Datei', describeCookieInfo(cookieInfo, config.tts?.enabled)),
        preflightCheck(config.tts?.enabled ? (configuredCount(ttsStatus.defaultSpeakDevices) > 0 ? 'ok' : 'warning') : 'optional', 'Sprech-Geräte', ttsSpeakDevicesDetail(ttsStatus)),
        preflightCheck(config.tts?.enabled ? (configuredCount(ttsStatus.alarmDevices) > 0 ? 'ok' : 'info') : 'optional', 'Alarm-Geräte', configuredCount(ttsStatus.alarmDevices) > 0
          ? `${configuredCount(ttsStatus.alarmDevices)} Alarm-Gerät(e) konfiguriert.`
          : 'Keine eigenen Alarm-Geräte konfiguriert; LoxEvo nutzt dann die vorhandene Geräteauswahl als Fallback.'),
        preflightCheck(config.tts?.enabled ? 'info' : 'optional', 'Lautstärke', `Standard ${ttsStatus.defaultVolume ?? config.tts?.defaultVolume ?? 40}%, Alarm ${ttsStatus.alarmVolume ?? config.tts?.alarmVolume ?? 100}%.`),
        preflightCheck(config.tts?.enabled ? (ttsStatus.nativeSequences ? 'ok' : 'info') : 'optional', 'TTS-Sequenzen', ttsStatus.nativeSequences
          ? 'Native Alexa-Sequenzen sind aktiv; das ist der schnelle Modus für Sprachausgabe mit Lautstärke.'
          : 'Native Sequenzen sind nicht aktiv; TTS funktioniert ggf. langsamer oder mit Fallback.'),
        preflightCheck(lastTtsEvent ? eventLevel(lastTtsEvent) : 'info', 'Letzte TTS-Aktion', describeEvent(lastTtsEvent, 'Seit dem letzten Start wurde noch keine TTS-Aktion ausgeführt.'))
      ]
    },
    {
      title: 'Virtuelle Alexa-Geräte',
      checks: [
        preflightCheck(config.alexaBridge?.enabled ? bridgeHttpLevel(alexaBridgeStatus) : 'optional', 'Alexa/Hue-HTTP', bridgeHttpDetail(alexaBridgeStatus)),
        preflightCheck(config.alexaBridge?.enabled ? bridgeDiscoveryLevel(alexaBridgeStatus) : 'optional', 'Gerätesuche', bridgeDiscoveryDetail(alexaBridgeStatus)),
        preflightCheck(config.alexaBridge?.enabled ? (Number(alexaBridgeStatus.deviceCount) > 0 ? 'ok' : 'warning') : 'optional', 'Virtuelle Geräte', Number(alexaBridgeStatus.deviceCount) > 0
          ? `${alexaBridgeStatus.deviceCount} aktive Befehle werden Alexa als Geräte angeboten.`
          : 'Es gibt noch keine aktiven Befehle, die Alexa als Geräte finden kann.'),
        preflightCheck(config.alexaBridge?.enabled ? discoveryHelperLevel(discoveryStatus) : 'optional', 'Discovery-Helper', discoveryHelperDetail(discoveryStatus)),
        preflightCheck(config.alexaBridge?.enabled ? 'info' : 'optional', 'Bridge-Info', describeBridgeInfo(alexaBridgeStatus)),
        preflightCheck(lastAlexaEvent ? alexaEventLevel(lastAlexaEvent) : 'info', 'Letzte Alexa-Aktion', describeEvent(lastAlexaEvent, 'Seit dem letzten Start wurde noch keine Alexa-Geräteaktion protokolliert.'))
      ]
    },
    {
      title: 'Backup',
      checks: [
        preflightCheck(configWriteError ? 'error' : 'ok', 'Export und Import', configWriteError || 'Backups können exportiert und Import-Sicherungen im Datenordner angelegt werden.'),
        preflightCheck(backupInfo.error ? 'warning' : backupInfo.needsBackup ? 'warning' : 'ok', 'Lokale Sicherungen', describeBackupInfo(backupInfo)),
        preflightCheck('info', 'Alexa-Cookie', 'Die Cookie-Datei wird nur exportiert, wenn der Haken beim Backup gesetzt ist.'),
        preflightCheck(lastBackupEvent ? eventLevel(lastBackupEvent) : 'info', 'Letzte Backup-Aktion', describeEvent(lastBackupEvent, 'Seit dem letzten Start wurde noch kein Backup exportiert oder importiert.'))
      ]
    }
  ];

  return {
    checkedAt: new Date().toISOString(),
    summary: summarizePreflight(sections),
    backup: {
      lastExport: backupInfo.lastExport || null,
      needsBackup: Boolean(backupInfo.needsBackup),
      changedSections: backupInfo.changedSections || [],
      localBackupCount: backupInfo.count || 0,
      latestLocalBackup: backupInfo.latest || null
    },
    sections
  };
}

function preflightCheck(level, label, detail) {
  return { level, label, detail };
}

async function accessError(path, mode) {
  try {
    await access(path, mode);
    return null;
  } catch (error) {
    return error.message;
  }
}

async function getPackageVersion() {
  try {
    const packageJson = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'));
    return packageJson.version || null;
  } catch {
    return null;
  }
}

async function getBuildCommit() {
  const envCommit = process.env.LOXEVO_COMMIT || process.env.GIT_COMMIT || process.env.SOURCE_COMMIT;
  if (envCommit) return shortCommit(envCommit);

  try {
    const head = (await readFile(join(rootDir, '.git', 'HEAD'), 'utf8')).trim();
    if (!head.startsWith('ref:')) return shortCommit(head);
    const refPath = head.slice(5).trim().split('/').filter(Boolean);
    const ref = (await readFile(join(rootDir, '.git', ...refPath), 'utf8')).trim();
    return shortCommit(ref);
  } catch {
    return null;
  }
}

function shortCommit(value) {
  const raw = String(value || '').trim();
  return raw ? raw.slice(0, 12) : null;
}

async function getCookieFileInfo(cookieFile) {
  const path = resolveCookiePath(cookieFile);
  try {
    await access(path, constants.R_OK);
    const fileStat = await stat(path);
    const permissions = await inspectFilePermissions(path);
    const content = await readFile(path, 'utf8');
    let auth = null;
    let parseError = null;
    try {
      auth = parseAlexaCookieFile(content);
    } catch (error) {
      parseError = error.message;
    }
    const authData = auth?.originalData || {};
    const tokenAgeMs = tokenAgeMsFromDate(authData.tokenDate);
    return {
      path,
      exists: true,
      size: fileStat.size,
      modifiedAt: fileStat.mtime.toISOString(),
      permissions,
      json: Boolean(auth?.isJson),
      parseError,
      hasLocalCookie: Boolean(firstConfiguredValue(authData.localCookie, auth?.cookie)),
      hasLoginCookie: Boolean(firstConfiguredValue(authData.loginCookie)),
      hasRefreshToken: Boolean(firstConfiguredValue(authData.refreshToken)),
      hasDeviceSerial: Boolean(firstConfiguredValue(authData.deviceSerial, authData.deviceId)),
      hasCsrf: Boolean(firstConfiguredValue(authData.csrf, auth?.csrf)),
      hasMacDms: Boolean(authData.macDms && typeof authData.macDms === 'object'),
      amazonPage: authData.amazonPage || auth?.amazonPage || null,
      tokenDate: authData.tokenDate || null,
      tokenAgeHours: Number.isFinite(tokenAgeMs) ? Math.round(tokenAgeMs / 36_000) / 100 : null
    };
  } catch (error) {
    return {
      path,
      exists: false,
      error: error.message
    };
  }
}

async function getBackupInfo() {
  const exportState = await readBackupExportState();
  const currentConfigHash = backupRelevantConfigHash(config);
  const currentSectionHashes = backupRelevantSectionHashes(config);
  const changedSections = changedBackupSections(exportState?.sectionHashes, currentSectionHashes);
  try {
    const directory = getConfigDir();
    const files = await readdir(directory);
    const backupFiles = [];

    for (const fileName of files) {
      if (!/^loxevo-backup-\d+\.json$/.test(fileName) && !/^config\.backup-\d+\.json$/.test(fileName)) {
        continue;
      }
      try {
        const filePath = join(directory, fileName);
        const fileStat = await stat(filePath);
        backupFiles.push({
          name: fileName,
          path: filePath,
          size: fileStat.size,
          modifiedAt: fileStat.mtime.toISOString(),
          modifiedMs: fileStat.mtimeMs
        });
      } catch {
        // Ignore files that disappeared while reading the directory.
      }
    }

    backupFiles.sort((left, right) => right.modifiedMs - left.modifiedMs);
    return {
      directory,
      count: backupFiles.length,
      latest: backupFiles[0] || null,
      lastExport: exportState,
      currentConfigHash,
      changedSections,
      needsBackup: !exportState?.configHash || exportState.configHash !== currentConfigHash
    };
  } catch (error) {
    return {
      directory: getConfigDir(),
      count: 0,
      latest: null,
      lastExport: exportState,
      currentConfigHash,
      changedSections,
      needsBackup: !exportState?.configHash || exportState.configHash !== currentConfigHash,
      error: error.message
    };
  }
}

async function writeBackupExportState(state) {
  const payload = {
    formatVersion: 1,
    exportedAt: state.exportedAt,
    includeCookie: Boolean(state.includeCookie),
    fileName: state.fileName || null,
    configHash: state.configHash || null,
    sectionHashes: state.sectionHashes || null
  };
  await writeFile(getBackupStatePath(), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function readBackupExportState() {
  try {
    const payload = JSON.parse(await readFile(getBackupStatePath(), 'utf8'));
    if (!payload?.exportedAt) return null;
    return {
      exportedAt: payload.exportedAt,
      includeCookie: Boolean(payload.includeCookie),
      fileName: payload.fileName || null,
      configHash: payload.configHash || null,
      sectionHashes: isPlainObject(payload.sectionHashes) ? payload.sectionHashes : null
    };
  } catch {
    return null;
  }
}

function backupRelevantConfigHash(sourceConfig) {
  return createHash('sha256')
    .update(JSON.stringify(sortForStableHash(toBackupRelevantConfig(sourceConfig))))
    .digest('hex');
}

function backupRelevantSectionHashes(sourceConfig) {
  const snapshot = toBackupRelevantConfig(sourceConfig);
  const sections = {
    Loxone: snapshot.loxone || {},
    Befehle: {
      commands: snapshot.commands || {},
      rooms: snapshot.rooms || {}
    },
    'Alexa TTS': snapshot.tts || {},
    'Virtuelle Alexa-Geräte': snapshot.alexaBridge || {},
    Gerätesuche: snapshot.discovery || {},
    Server: snapshot.server || {}
  };

  return Object.fromEntries(
    Object.entries(sections).map(([name, value]) => [
      name,
      createHash('sha256').update(JSON.stringify(sortForStableHash(value))).digest('hex')
    ])
  );
}

function changedBackupSections(previousHashes, currentHashes) {
  if (!isPlainObject(previousHashes)) return [];
  return Object.keys(currentHashes || {}).filter((name) => previousHashes[name] !== currentHashes[name]);
}

function toBackupRelevantConfig(sourceConfig) {
  const snapshot = structuredClone(sourceConfig || {});
  if (snapshot.loxone) {
    delete snapshot.loxone.dryRun;
  }
  return snapshot;
}

function sortForStableHash(value) {
  if (Array.isArray(value)) return value.map(sortForStableHash);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, sortForStableHash(value[key])])
  );
}

function latestEvent(predicate) {
  return events.find(predicate) || null;
}

function eventLevel(event) {
  if (!event) return 'info';
  if (event.status === 'error') return 'error';
  if (event.status === 'warning' || event.status === 'ignored') return 'warning';
  return 'info';
}

function alexaEventLevel(event) {
  if (!event) return 'info';
  const text = [event.text, event.error, event.label, event.key].filter(Boolean).join(' ');
  if ((event.status === 'error' || event.status === 'warning') && isDiscoveryPortIssue(text)) {
    return 'optional';
  }
  return eventLevel(event);
}

function describeEvent(event, emptyText) {
  if (!event) return emptyText;
  const parts = [
    formatDateTimeForDetail(event.at),
    [event.type, event.status].filter(Boolean).join('/'),
    event.label || event.key || event.commandType || event.compat || '',
    event.text ? truncate(String(event.text), 90) : ''
  ].filter(Boolean);
  return parts.join(' · ');
}

function describeVersion(version, commit) {
  const pieces = [];
  pieces.push(version ? `LoxEvo ${version}` : 'LoxEvo-Version konnte nicht ermittelt werden');
  if (commit) pieces.push(`Commit ${commit}`);
  return `${pieces.join(', ')}.`;
}

function alexaRemoteLevel(version) {
  if (!version) return 'warning';
  return compareVersions(version, '8.0.4') < 0 ? 'warning' : 'ok';
}

function describeAlexaRemoteVersion(version) {
  if (!version) {
    return 'Nicht lokal gefunden. Wenn TTS genutzt wird, im Register Wartung installieren.';
  }
  if (compareVersions(version, '8.0.4') < 0) {
    return `Installiert: ${version}. Für stabile Authentifizierung wird alexa-remote2 >= 8.0.4 empfohlen.`;
  }
  return `Installiert: ${version}.`;
}

function describeCookieInfo(info, enabled) {
  if (!enabled) {
    return `TTS ist deaktiviert. Konfigurierter Pfad: ${info.path}.`;
  }
  if (info.exists) {
    const details = [];
    details.push(info.json ? 'JSON' : 'Roh-Cookie');
    if (info.hasLocalCookie) details.push('localCookie');
    if (info.hasLoginCookie) details.push('loginCookie');
    if (info.hasRefreshToken) details.push('refreshToken');
    if (info.hasDeviceSerial) details.push('deviceSerial');
    if (info.hasCsrf) details.push('csrf');
    if (info.hasMacDms) details.push('macDms');
    if (info.tokenAgeHours !== null && info.tokenAgeHours !== undefined) details.push(`Token-Alter ca. ${info.tokenAgeHours} h`);
    if (info.permissions?.modeOctal) details.push(`Rechte ${info.permissions.modeOctal}`);
    const parseDetail = info.parseError ? ` Parse-Hinweis: ${info.parseError}` : '';
    const warnings = cookieInfoWarnings(info);
    const warningDetail = warnings.length ? ` Hinweise: ${warnings.join(' ')}` : '';
    return `Lesbar: ${info.path}. Grösse: ${formatBytes(info.size)}, geändert: ${formatDateTimeForDetail(info.modifiedAt)}. Felder: ${details.join(', ') || 'keine erkannten Auth-Felder'}.${parseDetail}${warningDetail}`;
  }
  return `Nicht lesbar: ${info.path}. ${info.error || ''}`.trim();
}

function cookieLevel(info, status) {
  if (!info.exists) return status.ready ? 'warning' : 'error';
  if (info.parseError) return 'error';
  if (!info.hasLocalCookie) return 'error';
  if (!info.json) return 'warning';
  if (cookieInfoWarnings(info).length) return 'warning';
  return 'ok';
}

function cookieInfoWarnings(info) {
  const warnings = [];
  if (info.permissions?.groupOrOtherReadable) {
    warnings.push('Cookie-Datei ist für Gruppe oder andere Benutzer lesbar. Empfohlen: chmod 600 data/Node.txt.');
  }
  if (!info.json) {
    warnings.push('Roh-Cookie erkannt; für stabilen Dauerbetrieb ist eine vollständige JSON-CookieData aus dem Amazon-Login-Proxy besser.');
  }
  if (info.json && !info.hasCsrf) warnings.push('csrf fehlt.');
  if (info.json && !info.hasMacDms) warnings.push('macDms fehlt.');
  if (info.json && !info.hasRefreshToken) warnings.push('refreshToken fehlt; automatische Erneuerung kann eingeschränkt sein.');
  if (Number.isFinite(info.tokenAgeHours) && info.tokenAgeHours > 168) warnings.push('tokenDate ist älter als 7 Tage.');
  return warnings;
}

function describeBackupInfo(info) {
  if (info.error) {
    return `Backup-Ordner konnte nicht gelesen werden: ${info.error}`;
  }
  if (info.lastExport?.exportedAt) {
    const cookieText = info.lastExport.includeCookie ? 'mit Alexa-Cookie' : 'ohne Alexa-Cookie';
    const changedText = info.changedSections?.length ? ` Betroffen: ${info.changedSections.join(', ')}.` : '';
    const backupText = info.needsBackup
      ? ` Seitdem wurden backup-relevante Einstellungen geändert; ein neues Backup wird empfohlen.${changedText}`
      : ' Die backup-relevanten Einstellungen sind seitdem unverändert.';
    return `Letzter Export: ${formatDateTimeForDetail(info.lastExport.exportedAt)} (${cookieText}).${backupText}`;
  }
  if (!info.count) {
    return `Noch keine lokalen Sicherungsdateien in ${info.directory} gefunden.`;
  }
  return `${info.count} Sicherungsdatei(en) gefunden. Neueste: ${info.latest.name}, ${formatBytes(info.latest.size)}, ${formatDateTimeForDetail(info.latest.modifiedAt)}.`;
}

function describeBridgeInfo(status) {
  if (!status.enabled) {
    return 'Virtuelle Alexa-Geräte sind deaktiviert.';
  }
  const pieces = [
    `Name: ${config.alexaBridge?.name || config.server?.name || 'LoxEvo'}`,
    `Bridge-ID: ${status.bridgeId || 'nicht gesetzt'}`,
    `Beschreibung: ${status.descriptionUrl || 'nicht bereit'}`,
    `Web-UI/API: ${config.server?.port || 8080}`,
    `Alexa/Hue: ${status.port || config.alexaBridge?.advertisePort || 80}`
  ];
  return `${pieces.join(' · ')}.`;
}

function formatDateTimeForDetail(value) {
  if (!value) return 'unbekannt';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'unbekannt';
  return date.toLocaleString('de-CH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatDuration(value) {
  let seconds = Math.max(0, Math.floor(Number(value) || 0));
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  const parts = [];
  if (days) parts.push(`${days} Tag(e)`);
  if (hours) parts.push(`${hours} h`);
  if (minutes) parts.push(`${minutes} min`);
  if (!parts.length) parts.push(`${seconds} s`);
  return parts.slice(0, 2).join(' ');
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
}

function truncate(value, maxLength) {
  const text = String(value || '');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function summarizePreflight(sections) {
  const checks = sections.flatMap((section) => section.checks || []);
  const counts = checks.reduce((result, check) => {
    result[check.level] = (result[check.level] || 0) + 1;
    return result;
  }, {});
  const level = counts.error ? 'error' : counts.warning ? 'warning' : 'ok';
  const text = counts.error
    ? `${counts.error} kritische Prüfung(en) offen.`
    : counts.warning
      ? `${counts.warning} Hinweis(e) prüfen. Grundfunktionen können trotzdem laufen.`
      : 'Alle wichtigen Prüfungen sind in Ordnung.';

  return { level, text, counts, total: checks.length };
}

function ttsPreflightDetail(status) {
  if (!config.tts?.enabled) {
    return 'TTS ist deaktiviert und muss nur eingerichtet werden, wenn Alexa-Sprachausgabe genutzt wird.';
  }
  if (status.ready) {
    return status.nativeSequences
      ? 'TTS ist bereit und nutzt native Sequenzen für schnelle Sprachausgabe.'
      : 'TTS ist bereit.';
  }
  return status.error || 'TTS ist aktiviert, aber noch nicht bereit.';
}

function ttsSpeakDevicesDetail(status) {
  const defaultCount = configuredCount(status?.defaultDevices);
  const speakCount = configuredCount(status?.defaultSpeakDevices);
  const allCount = configuredCount(status?.allDevices);
  const alarmCount = configuredCount(status?.alarmDevices);
  if (defaultCount > 0) {
    return `${defaultCount} Standard-Gerät(e) für normale TTS-Ausgaben konfiguriert.`;
  }
  if (speakCount > 0) {
    const fallbackParts = [];
    if (allCount > 0) fallbackParts.push(`${allCount} Alle-Gerät(e)`);
    if (alarmCount > 0) fallbackParts.push(`${alarmCount} Alarm-Gerät(e)`);
    return `Kein Standard-Gerät ausgewählt; normale TTS nutzt als Fallback ${fallbackParts.join(' und ')}.`;
  }
  return 'Für normale TTS-Ausgaben ist kein Alexa-Gerät ausgewählt.';
}

function bridgeHttpLevel(status) {
  if (status.bridgeHttp?.error) return 'error';
  if (status.bridgeHttp?.ready || Number(status.port) === Number(config.server?.port)) return 'ok';
  return 'warning';
}

function bridgeHttpDetail(status) {
  if (!status.enabled) {
    return 'Virtuelle Alexa-Geräte sind deaktiviert.';
  }
  if (status.bridgeHttp?.error) {
    return status.bridgeHttp.error;
  }
  if (status.bridgeHttp?.ready) {
    return `Alexa/Hue-HTTP läuft auf Port ${status.bridgeHttp.port}.`;
  }
  if (Number(status.port) === Number(config.server?.port)) {
    return `Alexa/Hue nutzt denselben Port wie die Web-UI/API (${status.port}).`;
  }
  return 'Alexa/Hue-HTTP ist noch nicht bereit.';
}

function bridgeDiscoveryLevel(status) {
  if (status.ready) return 'ok';
  if (status.discoveryPaused || isDiscoveryPortIssue(status.error)) return 'optional';
  if (status.error) return 'error';
  return 'optional';
}

function bridgeDiscoveryDetail(status) {
  if (!status.enabled) {
    return 'Virtuelle Alexa-Geräte sind deaktiviert.';
  }
  if (status.ready) {
    return 'SSDP/UDP 1900 ist für die Gerätesuche aktiv. Nach der Alexa-Suche bitte wieder beenden.';
  }
  if (status.discoveryPaused || isDiscoveryPortIssue(status.error)) {
    return 'SSDP/UDP 1900 ist aktuell nicht für LoxEvo frei. Für den normalen Betrieb mit bereits gefundenen Geräten ist das kein Problem. Nur wenn neue virtuelle Alexa-Geräte hinzugefügt werden sollen, unter Konfiguration -> Alexa-Gerätesuche kurz aktivieren, in der Alexa-App Geräte suchen und danach die Gerätesuche wieder beenden, damit der Port an die andere Anwendung zurückgegeben wird.';
  }
  return status.error || 'Gerätesuche ist aktuell nicht aktiv. Vorhandene Alexa-Geräte können weiter funktionieren.';
}

function discoveryHelperLevel(status) {
  const helper = status?.helper || {};
  const bridge = status?.alexaBridge || {};
  if (bridge.ready) return 'ok';
  if (helper.available) return 'ok';
  return 'optional';
}

function discoveryHelperDetail(status) {
  const helper = status?.helper || {};
  const bridge = status?.alexaBridge || {};
  if (bridge.ready) {
    return 'Gerätesuche ist aktuell aktiv.';
  }
  if (helper.available) {
    return helper.portOwner
      ? `Host-Helper ist erreichbar. UDP 1900: ${helper.portOwner}.`
      : 'Host-Helper ist erreichbar und kann die Gerätesuche starten.';
  }
  return helper.error || 'Host-Helper ist nicht installiert oder nicht erreichbar. Das ist nur für neue Alexa-Gerätesuche bei belegtem UDP 1900 nötig.';
}

function configuredCount(values) {
  return Array.isArray(values) ? values.filter(isConfiguredValue).length : 0;
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

function isDiscoveryPortIssue(errorText = '') {
  if (isSsdpPortInUseError(errorText)) return true;
  const lower = String(errorText || '').toLowerCase();
  return lower.includes('1900') && (
    lower.includes('eaddrinuse') ||
    lower.includes('bind udp 1900 failed') ||
    lower.includes('address in use') ||
    lower.includes('ssdp/udp-port 1900')
  );
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

function firstConfiguredValue(...values) {
  return values.find((value) => isConfiguredValue(value));
}

function tokenAgeMsFromDate(value) {
  if (!value) return NaN;
  const date = typeof value === 'number' ? new Date(value) : new Date(String(value));
  const time = date.getTime();
  return Number.isFinite(time) ? Date.now() - time : NaN;
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
    executeCommand: executeAlexaBridgeCommand,
    addEvent
  });
}

function createTtsService() {
  return new TtsService(config, { addEvent });
}

async function executeAlexaBridgeCommand(commandKey, options = {}) {
  const result = await executeConfiguredCommand(commandKey, 'alexa-command', options);
  triggerAlexaCommandConfirmation(result.key || commandKey);
  return result;
}

function triggerAlexaCommandConfirmation(commandKey) {
  const command = config.commands?.[normalizeKey(commandKey)];
  const confirmation = command?.confirmation;
  if (!confirmation?.enabled) return;

  const text = normalizeTtsText(confirmation.text || 'OK');
  if (!text) return;

  const status = tts.getStatus();
  if (!config.tts?.enabled || !status.ready) {
    addEvent({
      type: 'alexa-confirmation',
      status: 'ignored',
      key: normalizeKey(commandKey),
      text,
      error: status.error || 'TTS ist nicht bereit.'
    });
    return;
  }

  const targetDevices = defaultTtsSpeakDevices();
  if (!targetDevices.length) {
    addEvent({
      type: 'alexa-confirmation',
      status: 'ignored',
      key: normalizeKey(commandKey),
      text,
      error: 'Keine TTS-Geraete konfiguriert.'
    });
    return;
  }

  tts.speak(text, targetDevices)
    .then(() => {
      addEvent({ type: 'alexa-confirmation', status: 'sent', key: normalizeKey(commandKey), text, devices: targetDevices });
    })
    .catch((error) => {
      addEvent({ type: 'alexa-confirmation', status: 'error', key: normalizeKey(commandKey), text, error: error.message });
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

async function getDiscoveryStatus() {
  const alexaBridgeStatus = getAlexaBridgeStatus();
  const helper = alexaBridgeStatus.enabled
    ? await discoveryControl.getStatus()
    : { available: false, ready: false, error: null };
  return {
    helper,
    alexaBridge: alexaBridgeStatus
  };
}

async function startDiscoveryMode(res) {
  if (!config.alexaBridge?.enabled) {
    return sendJson(res, { ok: false, error: 'Virtuelle Alexa-Geräte sind deaktiviert.' }, 400);
  }

  const helper = await discoveryControl.start();
  if (!helper.available) {
    addEvent({ type: 'alexa-discovery', status: 'error', text: helper.error });
    return sendJson(res, { ok: false, error: helper.error, discovery: await getDiscoveryStatus() }, 503);
  }

  await restartAlexaBridge();
  await restartBridgeHttpServer();
  addEvent({ type: 'alexa-discovery', status: 'started', text: 'Alexa-Gerätesuche aktiviert.' });
  return sendJson(res, { ok: true, helper, discovery: await getDiscoveryStatus() });
}

async function stopDiscoveryMode(res) {
  if (!config.alexaBridge?.enabled) {
    return sendJson(res, { ok: false, error: 'Virtuelle Alexa-Geräte sind deaktiviert.' }, 400);
  }

  await alexaBridge.pauseDiscovery('Alexa-Gerätesuche ist deaktiviert. Vorhandene Alexa-Geräte können weiter funktionieren.');
  await restartBridgeHttpServer();

  const helper = await discoveryControl.stop();
  if (!helper.available) {
    addEvent({ type: 'alexa-discovery', status: 'warning', text: helper.error });
    return sendJson(res, { ok: false, error: helper.error, discovery: await getDiscoveryStatus() }, 503);
  }

  addEvent({ type: 'alexa-discovery', status: 'stopped', text: 'Alexa-Gerätesuche deaktiviert.' });
  return sendJson(res, { ok: true, helper, discovery: await getDiscoveryStatus() });
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
    bridgeHttpStatus.error = `Alexa-Bridge HTTP Port ${port} konnte nicht geöffnet werden: ${error.message}`;
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
      if (data.length > MAX_REQUEST_BODY_SIZE) {
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
    throw new Error('Ungültiges JSON.');
  }
}

function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendJsonDownload(res, payload, filename) {
  res.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'content-disposition': `attachment; filename="${filename}"`,
    'cache-control': 'no-store'
  });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
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
  if (!raw) return defaultTtsSpeakDevices();
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

function isLoxoneTtsCompatPath(value) {
  const path = normalizeKey(value);
  return !LOXONE_TTS_RESERVED_PATHS.has(path);
}

function containsSpeechText(value) {
  return /[A-Za-z\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\u00df]/.test(String(value || ''));
}

function looksLikeFormBody(value) {
  return /^(text|t|message|payload|volume|vol|v|device|devices|d)=/i.test(String(value || '').trim());
}

function firstText(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value);
    if (text !== '') return text;
  }
  return '';
}

function firstNonEmpty(...lists) {
  return lists.find((list) => Array.isArray(list) && list.length > 0) || [];
}

function defaultTtsSpeakDevices() {
  return firstNonEmpty(config.tts?.defaultDevices, config.tts?.allDevices, config.tts?.alarmDevices);
}

function addEvent(event) {
  const normalizedEvent = normalizeEvent(event);
  if (shouldSuppressEvent(normalizedEvent)) return;
  events.unshift({
    at: new Date().toISOString(),
    ...normalizedEvent
  });
  events.splice(50);
}

function shouldSuppressEvent(event) {
  if (!event) return false;
  const type = String(event.type || '');
  const status = String(event.status || '');
  const text = [event.text, event.error].filter(Boolean).join(' ');
  const isRepeatedDiscoveryHint = type === 'alexa-bridge' && status === 'optional' && isDiscoveryPortIssue(text);
  if (!isRepeatedDiscoveryHint) return false;

  const key = `${type}:${status}:discovery-port`;
  if (oncePerProcessEventKeys.has(key)) return true;
  oncePerProcessEventKeys.add(key);

  const now = Date.now();
  const lastAt = dedupedEventTimes.get(key) || 0;
  if (now - lastAt < OPTIONAL_DISCOVERY_EVENT_DEDUPE_MS) return true;

  dedupedEventTimes.set(key, now);
  return false;
}

function normalizeEvent(event) {
  if (!event) return {};
  const normalized = { ...event };
  const type = String(normalized.type || '');
  const text = [normalized.text, normalized.error].filter(Boolean).join(' ');
  if (type.startsWith('alexa-') && normalized.status === 'error' && isDiscoveryPortIssue(text)) {
    normalized.status = 'optional';
  }
  return normalized;
}
