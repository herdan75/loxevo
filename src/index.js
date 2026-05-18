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
const tts = new TtsService(config);

await tts.init();

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
      return sendJson(res, { ok: true, name: config.server.name });
    }

    if (url.pathname === '/admin/plugins/alexa2lox/tts.php') {
      return await handleAlexa2LoxCompat(req, res, url);
    }

    if (pathParts[0] === 'api') {
      return await handleApi(req, res, pathParts, body);
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

  if (req.method === 'PUT' && pathParts[1] === 'config') {
    const nextConfig = parseJson(body);
    config = await saveConfig(nextConfig);
    loxone = new LoxoneClient(config);
    return sendJson(res, { ok: true, config });
  }

  if (req.method === 'POST' && pathParts[1] === 'light') {
    const payload = parseJson(body);
    return await runLightCommand(res, payload.room, payload.scene);
  }

  if (pathParts[1] === 'tts') {
    return await handleTts(req, res, pathParts.slice(1), body);
  }

  return sendJson(res, { error: 'not found' }, 404);
}

async function runLightCommand(res, room, scene) {
  if (!room || !scene) {
    return sendJson(res, { error: 'room und scene sind erforderlich' }, 400);
  }

  const result = await loxone.changeScene(normalizeKey(room), normalizeKey(scene));
  return sendJson(res, { ok: true, result });
}

async function handleTts(req, res, pathParts, body) {
  if (req.method !== 'POST') {
    return sendJson(res, { error: 'method not allowed' }, 405);
  }

  const cmd = pathParts[1] || 'speak';
  if (cmd === 'lautstaerke' || cmd === 'volume') {
    await tts.setVolume(body);
    return sendJson(res, { ok: true, command: 'volume' });
  }
  if (cmd === 'alarm') {
    await tts.alarm(body);
    return sendJson(res, { ok: true, command: 'alarm' });
  }

  await tts.speak(body);
  return sendJson(res, { ok: true, command: 'speak' });
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
  }

  await tts.speak(normalizeTtsText(text), resolveTtsDevices(devices));
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
  if (!raw) return config.tts?.defaultDevices || [];
  if (raw.toUpperCase() === 'ALL') return config.tts?.allDevices || config.tts?.alarmDevices || config.tts?.defaultDevices || [];
  return raw.split(',').map((device) => device.trim()).filter(Boolean);
}
