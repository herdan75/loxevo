import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import { sanitizeDiagnosticValue } from '../src/diagnostics.js';

const base = new URL(process.argv[2] || 'http://127.0.0.1:8080');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('HTTP-/HTTPS-Basisadresse ohne Zugangsdaten angeben.');
const hours = Number(process.argv[3] || 48);
if (!Number.isFinite(hours) || hours <= 0 || hours > 168) throw new Error('Dauer muss zwischen 0 und 168 Stunden liegen.');
const until = Date.now() + hours * 3600000;
const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
process.once('SIGTERM', () => controller.abort());
let lastSignature = '';
const deviceId = (value) => createHash('sha256').update(String(value)).digest('hex').slice(0, 12);

async function read(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Statusabfrage HTTP ${response.status}`);
  return response.json();
}

// Read-only observer: no Speak, alarm, reconnect, inventory refresh or persistent app log.
while (!controller.signal.aborted && Date.now() < until) {
  try {
    const status = await read('/api/tts/status');
    const summary = { ready: status.ready, authReady: status.authReady, inventoryReady: status.inventoryReady, inventoryCount: status.inventoryCount, error: status.error, lastDelivery: status.lastDelivery, auth: status.auth };
    const signature = JSON.stringify([status.ready, status.inventoryReady, status.error, status.auth?.state, status.auth?.lastAuthRefreshAt, status.lastDelivery?.at]);
    if (signature !== lastSignature) {
      const record = { at: new Date().toISOString(), status: summary };
      if (!lastSignature || !status.ready || ['error', 'partial', 'unconfirmed'].includes(status.lastDelivery?.status)) {
        const inventory = await read('/api/tts/devices?refresh=false');
        record.inventory = (inventory.devices || []).map((device) => ({ id: deviceId(device.serialNumber), deviceType: device.deviceType, online: device.online }));
        record.configured = [...new Set([...(status.defaultSpeakDevices || []), ...(status.alarmDevices || [])])].map(deviceId);
      }
      console.log(JSON.stringify(sanitizeDiagnosticValue(record)));
      lastSignature = signature;
    }
  } catch (error) {
    const message = String(error.message);
    if (lastSignature !== message) console.log(JSON.stringify(sanitizeDiagnosticValue({ at: new Date().toISOString(), error: message })));
    lastSignature = message;
  }
  await delay(Math.min(60000, Math.max(1, until - Date.now())), null, { signal: controller.signal }).catch(() => {});
}
