import { isValidLoxoneUuid, readCommandTarget } from './command-utils.js';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_CONTROLS = 3000;
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const label = (value) => typeof value === 'string' ? value.slice(0, 200) : '';

// Explicit profiles from Loxone Structure File V17. Unknown controls stay manual.
const profiles = {
  Switch: [{ id: 'switch', label: 'Ein / Aus', type: 'direct', value: 'on', offValue: 'off', alexaMode: 'switch' }],
  Pushbutton: [{ id: 'pulse', label: 'Impuls', type: 'pulse', value: '', alexaMode: 'action' }],
  LightControllerV2: [{ id: 'mood', label: 'Lichtstimmung', type: 'changeTo', value: '', offValue: '0', needsValue: true, alexaMode: 'switch' }],
  Jalousie: [
    { id: 'open', label: 'Öffnen / Schließen', type: 'direct', value: 'FullUp', offValue: 'FullDown', alexaMode: 'switch' },
    { id: 'close', label: 'Schließen / Öffnen', type: 'direct', value: 'FullDown', offValue: 'FullUp', alexaMode: 'switch' },
    { id: 'stop', label: 'Stopp', type: 'direct', value: 'stop', alexaMode: 'action' }
  ]
};

export function parseLoxoneCatalog(data, commands = {}) {
  if (!object(data) || !object(data.controls)) throw new Error('Loxone-Struktur enthält keine gültige Bausteinliste.');
  const controls = [];
  const existing = Object.entries(commands).map(([key, command]) => [key, readCommandTarget(command)]);
  function visit(entries, parent = null, depth = 0) {
    if (depth > 8) throw new Error('Loxone-Struktur ist zu stark verschachtelt.');
    for (const control of Object.values(entries)) {
      if (!object(control)) continue;
      if (controls.length >= MAX_CONTROLS) throw new Error('Loxone-Struktur enthält zu viele Bausteine.');
      const uuid = label(control.uuidAction).trim().toLowerCase();
      const type = label(control.type);
      const restrictions = Number(control.restrictions ?? 0);
      const reason = parent ? 'Unterelement: manuell prüfen'
        : control.isSecured ? 'Gesicherter Baustein'
          : !Number.isSafeInteger(restrictions) || restrictions !== 0 ? 'Eingeschränkter Baustein'
            : !isValidLoxoneUuid(uuid) ? 'Keine unterstützte Steuerungs-UUID'
              : !Object.hasOwn(profiles, type) ? 'Kein geprüftes Profil' : '';
      const room = control.room || parent?.room;
      const cat = control.cat || parent?.cat;
      controls.push({
        uuid, name: label(control.name) || type || 'Unbenannter Baustein', type,
        room: label(data.rooms?.[room]?.name), category: label(data.cats?.[cat]?.name),
        reason, profiles: reason ? [] : structuredClone(profiles[type]),
        existingKeys: existing.filter(([, target]) => target.uuid === uuid || target.path.startsWith(`/jdev/sps/io/${uuid}/`)).map(([key]) => key)
      });
      if (object(control.subControls)) visit(control.subControls, control, depth + 1);
    }
  }
  visit(data.controls);
  return { loadedAt: new Date().toISOString(), controls };
}

export async function loadLoxoneCatalog(client) {
  const url = new URL('/data/LoxAPP3.json', client.baseUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Ungültige Miniserver-Adresse.');
  const headers = { accept: 'application/json' };
  if (client.username || client.password) headers.authorization = `Basic ${Buffer.from(`${client.username}:${client.password}`).toString('base64')}`;
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000), redirect: 'error' });
    if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
    if (Number(response.headers.get('content-length')) > MAX_BYTES) { await response.body?.cancel(); throw new Error('Strukturdatei zu groß'); }
    const chunks = []; let length = 0;
    for await (const chunk of response.body) {
      length += chunk.length;
      if (length > MAX_BYTES) throw new Error('Strukturdatei zu groß');
      chunks.push(chunk);
    }
    let data;
    try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new Error('Keine JSON-Strukturdatei erhalten'); }
    return parseLoxoneCatalog(data, client.commands);
  } catch (error) {
    // Do not include server bodies, credentials or URL-bearing transport errors.
    const detail = /^HTTP \d{3}$/.test(error.message) ? ` (${error.message})` : '';
    throw new Error(`Loxone-Struktur konnte nicht geladen werden${detail}. Adresse, Zugangsdaten, Rechte und Strukturdatei prüfen.`);
  }
}
