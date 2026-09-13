import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { writePrivateFile } from './file-security.js';

export function allocateLegacyDeviceId(commandKey, usedIds) {
  const seed = parseInt(createHash('sha1').update(String(commandKey)).digest('hex').slice(0, 8), 16);
  for (let offset = 0; offset < 64000; offset++) {
    const id = String(1000 + ((seed + offset) % 64000));
    if (!usedIds.has(id)) { usedIds.add(id); return id; }
  }
  throw new Error('Keine freien Alexa-Geräte-IDs vorhanden.');
}

export class DeviceIdRegistry {
  constructor(path) { this.path = path; this.ids = {}; this.initialized = false; this.error = null; }

  async load(commands) {
    try {
      const stored = JSON.parse(await readFile(this.path, 'utf8'));
      if (stored?.version !== 1 || !stored.ids || typeof stored.ids !== 'object' || Array.isArray(stored.ids)) throw new Error('Ungültiges Format.');
      const values = Object.values(stored.ids);
      if (values.some((id) => typeof id !== 'string' || !/^\d+$/.test(id) || Number(id) < 1000 || Number(id) >= 65000) || new Set(values).size !== values.length) throw new Error('Ungültige oder doppelte ID.');
      this.ids = stored.ids;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.error = 'Alexa-ID-Datei ist nicht lesbar oder beschädigt. Zuordnungen bleiben gesperrt; Datei aus Backup wiederherstellen.';
        throw new Error(this.error);
      }
    }
    this.initialized = true;
    try { await this.sync(commands); }
    catch (error) { this.error = 'Alexa-ID-Datei konnte nicht gespeichert werden. Discovery bleibt gesperrt.'; throw error; }
  }

  async import(stored) {
    if (!stored) return;
    if (stored.version !== 1 || !stored.ids || typeof stored.ids !== 'object' || Array.isArray(stored.ids)) throw new Error('Ungültige Alexa-IDs im Backup.');
    const next = { ...this.ids };
    const used = new Set(Object.values(next));
    for (const [key, id] of Object.entries(stored.ids)) {
      if (typeof id !== 'string' || !/^\d+$/.test(id) || Number(id) < 1000 || Number(id) >= 65000) throw new Error('Ungültige Alexa-ID im Backup.');
      if (Object.hasOwn(next, key)) {
        if (next[key] !== id) throw new Error('Alexa-ID-Konflikt im Backup. Bestehende Zuordnungen werden nicht ersetzt.');
      } else {
        if (used.has(id)) throw new Error('Alexa-ID ist bereits einem anderen Befehl zugeordnet.');
        next[key] = id;
        used.add(id);
      }
    }
    await writePrivateFile(this.path, `${JSON.stringify({ version: 1, ids: next }, null, 2)}\n`, 'Alexa-ID-Datei');
    this.ids = next;
  }

  async sync(commands) {
    if (!this.initialized || this.error) throw new Error(this.error || 'Alexa-IDs sind noch nicht initialisiert.');
    const next = { ...this.ids };
    const used = new Set(Object.values(next));
    // First migration uses exactly the previous ordering and collision algorithm.
    for (const [key] of Object.entries(commands || {}).filter(([, command]) => command?.enabled !== false && command?.alexaExpose !== false).sort(([a], [b]) => a.localeCompare(b))) {
      if (!Object.hasOwn(next, key)) next[key] = allocateLegacyDeviceId(key, used);
    }
    if (JSON.stringify(next) !== JSON.stringify(this.ids) || !Object.keys(next).length) {
      await writePrivateFile(this.path, `${JSON.stringify({ version: 1, ids: next }, null, 2)}\n`, 'Alexa-ID-Datei');
    }
    this.ids = next;
  }

  get(key) { return this.error ? null : this.ids[key] || null; }
}
