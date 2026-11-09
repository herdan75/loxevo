import { isValidLoxoneUuid, readCommandTarget } from './command-utils.js';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_CONTROLS = 3000;
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const label = (value) => typeof value === 'string' ? value.slice(0, 200) : '';

// Explicit profiles from Loxone Structure File V17. Unknown controls stay manual.
const profiles = {
  Switch: [{ id: 'switch', label: 'Ein / Aus', type: 'direct', value: 'on', offValue: 'off', alexaMode: 'switch' }],
  Dimmer: [{ id: 'switch', label: 'Ein / Aus (letzte Helligkeit)', type: 'direct', value: 'on', offValue: 'off', alexaMode: 'switch' }],
  Pushbutton: [{ id: 'pulse', label: 'Impuls', type: 'pulse', value: '', alexaMode: 'action' }],
  LightControllerV2: [{ id: 'mood', label: 'Lichtstimmung', type: 'changeTo', value: '', offValue: '0', needsValue: true, alexaMode: 'switch' }],
  Jalousie: [
    { id: 'open', label: 'Öffnen / Schließen', type: 'direct', value: 'FullUp', offValue: 'FullDown', alexaMode: 'switch' },
    { id: 'close', label: 'Schließen / Öffnen', type: 'direct', value: 'FullDown', offValue: 'FullUp', alexaMode: 'switch' },
    { id: 'stop', label: 'Stopp', type: 'direct', value: 'stop', alexaMode: 'action' }
  ]
};

function actionAddress(value) {
  if (typeof value !== 'string' || value.length > 200) return '';
  const [uuid, ...parts] = value.trim().split('/');
  return [uuid.toLowerCase(), ...parts].join('/');
}

function protectionReason(control) {
  if (control.isSecured) return 'Gesicherter Baustein: manuell konfigurieren.';
  const value = control.restrictions ?? 0;
  const numeric = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value));
  const restrictions = Number(value);
  if (!numeric || !Number.isSafeInteger(restrictions) || restrictions !== 0) return 'Eingeschränkter Baustein: keine automatische Übernahme.';
  return '';
}

function supportsAddress(address, parent) {
  if (isValidLoxoneUuid(address)) return true;
  if (!parent || parent.type !== 'LightControllerV2') return false;
  const [uuid, input, extra] = address.split('/');
  if (!isValidLoxoneUuid(uuid) || uuid !== parent.uuid || extra !== undefined) return false;
  // Keep only documented light inputs or the explicitly referenced master brightness.
  return /^AI[1-9]\d*$/.test(input || '') || (address === parent.masterValue && /^[A-Za-z][A-Za-z0-9_-]*$/.test(input || ''));
}

function profilesForAddress(type, address) {
  return structuredClone(profiles[type]).map((profile) => {
    if (!address.includes('/')) return profile;
    const { offValue, ...rest } = profile;
    return { ...rest, type: 'raw', value: '', path: `/jdev/sps/io/${address}/${profile.value}`, offPath: `/jdev/sps/io/${address}/${offValue}` };
  });
}

function referencedAddress(target) {
  if (target.type !== 'raw') return target.uuid;
  const path = String(target.path || '').replaceAll('{uuid}', target.uuid);
  const match = path.match(/^\/?jdev\/sps\/io\/([^/]+)\/(.+)$/);
  if (!match || !isValidLoxoneUuid(match[1])) return '';
  const parts = match[2].split('/');
  return actionAddress(`${match[1]}${parts.length > 1 && parts[0] !== 'changeTo' ? `/${parts[0]}` : ''}`);
}

export function parseLoxoneCatalog(data, commands = {}) {
  if (!object(data) || !object(data.controls)) throw new Error('Loxone-Struktur enthält keine gültige Bausteinliste.');
  const controls = [];
  const existing = Object.entries(commands).map(([key, command]) => [key, referencedAddress(readCommandTarget(command))]);
  function visit(entries, parent = null, depth = 0) {
    if (depth > 8) throw new Error('Loxone-Struktur ist zu stark verschachtelt.');
    for (const control of Object.values(entries)) {
      if (!object(control)) continue;
      if (controls.length >= MAX_CONTROLS) throw new Error('Loxone-Struktur enthält zu viele Bausteine.');
      const uuid = actionAddress(control.uuidAction);
      const type = label(control.type);
      const protection = parent?.protection || protectionReason(control);
      const lightChild = parent?.type === 'LightControllerV2' && parent.depth === 0 && isValidLoxoneUuid(parent.uuid) && ['Switch', 'Dimmer'].includes(type);
      const reason = protection
        || (parent && !lightChild ? (type === 'ColorPickerV2' ? 'Farbsteuerung wird noch nicht automatisch übernommen. Lichtstimmung am übergeordneten Baustein wählen oder manuell konfigurieren.' : 'Dieses Unterelement wird noch nicht automatisch unterstützt.') : '')
        || (!supportsAddress(uuid, parent) ? 'Keine unterstützte Steuerungsadresse: manuell konfigurieren.' : '')
        || (!Object.hasOwn(profiles, type) ? 'Für diesen Bausteintyp gibt es noch kein geprüftes Aktionsprofil.' : '');
      const room = control.room || parent?.room;
      const cat = control.cat || parent?.cat;
      const id = String(controls.length);
      const name = label(control.name) || type || 'Unbenannter Baustein';
      controls.push({
        id, parentId: parent?.id ?? null, rootId: parent?.rootId ?? id,
        parentName: parent?.name || '', uuid, name, type,
        room: label(data.rooms?.[room]?.name), category: label(data.cats?.[cat]?.name),
        reason, profiles: reason ? [] : profilesForAddress(type, uuid),
        existingKeys: existing.filter(([, address]) => uuid && address === uuid).map(([key]) => key)
      });
      if (object(control.subControls)) visit(control.subControls, {
        id, rootId: parent?.rootId ?? id, name, type, uuid, room, cat, protection, depth,
        masterValue: actionAddress(control.details?.masterValue)
      }, depth + 1);
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
