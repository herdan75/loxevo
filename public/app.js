const statusEl = document.querySelector('#status');
const roomsEl = document.querySelector('#rooms');
const configEditor = document.querySelector('#configEditor');
const ttsText = document.querySelector('#ttsText');
const saveBtn = document.querySelector('#saveBtn');
const speakBtn = document.querySelector('#speakBtn');
const alarmBtn = document.querySelector('#alarmBtn');
const refreshEventsBtn = document.querySelector('#refreshEventsBtn');
const eventsEl = document.querySelector('#events');
const dryRunToggle = document.querySelector('#dryRunToggle');
const modeBanner = document.querySelector('#modeBanner');
const modeTitle = document.querySelector('#modeTitle');
const modeText = document.querySelector('#modeText');
const loxoneBaseUrl = document.querySelector('#loxoneBaseUrl');
const loxoneUsername = document.querySelector('#loxoneUsername');
const loxonePassword = document.querySelector('#loxonePassword');
const ttsEnabled = document.querySelector('#ttsEnabled');
const ttsCookieFile = document.querySelector('#ttsCookieFile');
const ttsAmazonPage = document.querySelector('#ttsAmazonPage');
const ttsAlexaHost = document.querySelector('#ttsAlexaHost');
const ttsDefaultVolume = document.querySelector('#ttsDefaultVolume');
const ttsAlarmVolume = document.querySelector('#ttsAlarmVolume');
const ttsDefaultDevices = document.querySelector('#ttsDefaultDevices');
const ttsAllDevices = document.querySelector('#ttsAllDevices');
const ttsAlarmDevices = document.querySelector('#ttsAlarmDevices');
const roomEditor = document.querySelector('#roomEditor');
const addRoomBtn = document.querySelector('#addRoomBtn');
const reloadJsonBtn = document.querySelector('#reloadJsonBtn');
const saveJsonBtn = document.querySelector('#saveJsonBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const views = document.querySelectorAll('.view');
const refreshIntegrationsBtn = document.querySelector('#refreshIntegrationsBtn');
const lightEndpoints = document.querySelector('#lightEndpoints');
const ttsEndpoints = document.querySelector('#ttsEndpoints');

let config = null;

load();

saveBtn.addEventListener('click', saveConfig);
saveJsonBtn.addEventListener('click', saveJsonConfig);
reloadJsonBtn.addEventListener('click', syncJsonFromForms);
speakBtn.addEventListener('click', () => postText('/tts/speak', ttsText.value));
alarmBtn.addEventListener('click', () => postText('/tts/alarm', ttsText.value));
refreshEventsBtn.addEventListener('click', loadEvents);
dryRunToggle.addEventListener('change', () => setDryRun(dryRunToggle.checked));
addRoomBtn.addEventListener('click', addRoom);
refreshIntegrationsBtn.addEventListener('click', renderIntegrations);
tabButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.tabTarget));
});

async function load() {
  try {
    const response = await fetch('/api/config');
    config = await response.json();
    populateForms();
    updateDryRunUi(Boolean(config.loxone?.dryRun));
    renderRooms();
    renderRoomEditor();
    renderIntegrations();
    syncJsonFromForms();
    await loadEvents();
    setStatus('Bereit', 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

function renderRooms() {
  roomsEl.innerHTML = '';
  Object.entries(config.rooms || {}).forEach(([roomName, room]) => {
    const roomEl = document.createElement('div');
    roomEl.className = 'room';

    const title = document.createElement('h3');
    title.textContent = room.label || roomName;
    roomEl.append(title);

    const sceneGrid = document.createElement('div');
    sceneGrid.className = 'scene-grid';

    Object.keys(room.scenes || {}).forEach((sceneName) => {
      const button = document.createElement('button');
      button.className = 'secondary';
      button.textContent = sceneName;
      button.addEventListener('click', () => sendLight(roomName, sceneName));
      sceneGrid.append(button);
    });

    roomEl.append(sceneGrid);
    roomsEl.append(roomEl);
  });
}

async function sendLight(room, scene) {
  try {
    await postJson('/api/light', { room, scene });
    await loadEvents();
    setStatus(`${room} ${scene}`, 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function saveConfig() {
  try {
    const nextConfig = collectConfigFromForms();
    const result = await putJson('/api/config', nextConfig);
    config = result.config;
    populateForms();
    syncJsonFromForms();
    updateDryRunUi(Boolean(config.loxone?.dryRun));
    renderRooms();
    renderRoomEditor();
    renderIntegrations();
    setStatus('Gespeichert', 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function saveJsonConfig() {
  try {
    const nextConfig = JSON.parse(configEditor.value);
    const result = await putJson('/api/config', nextConfig);
    config = result.config;
    populateForms();
    syncJsonFromForms();
    updateDryRunUi(Boolean(config.loxone?.dryRun));
    renderRooms();
    renderRoomEditor();
    renderIntegrations();
    setStatus('JSON gespeichert', 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function postText(url, text) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: text
    });
    await ensureOk(response);
    await loadEvents();
    setStatus('TTS gesendet', 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await ensureOk(response);
  return response.json();
}

async function putJson(url, payload) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await ensureOk(response);
  return response.json();
}

async function ensureOk(response) {
  if (response.ok) return;
  const payload = await response.json().catch(() => ({}));
  throw new Error(payload.error || `HTTP ${response.status}`);
}

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = `status ${type || ''}`.trim();
}

function showView(viewId) {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tabTarget === viewId);
  });
  views.forEach((view) => {
    view.classList.toggle('active', view.id === viewId);
  });
  if (viewId === 'eventsView') {
    loadEvents();
  }
}

async function setDryRun(enabled) {
  try {
    const result = await putJson('/api/dry-run', { enabled });
    config.loxone.dryRun = result.dryRun;
    syncJsonFromForms();
    updateDryRunUi(result.dryRun);
    await loadEvents();
    setStatus(result.dryRun ? 'Dry-Run aktiv' : 'Live aktiv', result.dryRun ? 'ok' : 'error');
  } catch (error) {
    dryRunToggle.checked = Boolean(config.loxone?.dryRun);
    setStatus(error.message, 'error');
  }
}

function populateForms() {
  loxoneBaseUrl.value = config.loxone?.baseUrl || '';
  loxoneUsername.value = config.loxone?.username || '';
  loxonePassword.value = config.loxone?.password || '';

  ttsEnabled.checked = Boolean(config.tts?.enabled);
  ttsCookieFile.value = config.tts?.cookieFile || '';
  ttsAmazonPage.value = config.tts?.amazonPage || '';
  ttsAlexaHost.value = config.tts?.alexaServiceHost || '';
  ttsDefaultVolume.value = config.tts?.defaultVolume ?? 40;
  ttsAlarmVolume.value = config.tts?.alarmVolume ?? 100;
  ttsDefaultDevices.value = listToLines(config.tts?.defaultDevices);
  ttsAllDevices.value = listToLines(config.tts?.allDevices);
  ttsAlarmDevices.value = listToLines(config.tts?.alarmDevices);
}

function renderRoomEditor() {
  roomEditor.innerHTML = '';
  Object.entries(config.rooms || {}).forEach(([roomName, room]) => {
    roomEditor.append(createRoomCard(roomName, room));
  });
}

function createRoomCard(roomName, room) {
  const card = document.createElement('div');
  card.className = 'room-card';
  card.dataset.roomOriginal = roomName;

  const head = document.createElement('div');
  head.className = 'room-card-head';

  const title = document.createElement('strong');
  title.textContent = room.label || roomName;

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'secondary small danger-text';
  deleteButton.textContent = 'Entfernen';
  deleteButton.addEventListener('click', () => {
    card.remove();
    syncConfigFromForms();
    renderRooms();
  });

  head.append(title, deleteButton);

  const fields = document.createElement('div');
  fields.className = 'form-row three';
  fields.innerHTML = `
    <label>Schluessel<input class="room-key" type="text"></label>
    <label>Name<input class="room-label" type="text"></label>
    <label>Loxone UUID<input class="room-uuid" type="text"></label>
  `;
  fields.querySelector('.room-key').value = roomName;
  fields.querySelector('.room-label').value = room.label || '';
  fields.querySelector('.room-uuid').value = room.uuid || '';

  const scenes = document.createElement('div');
  scenes.className = 'scene-editor';

  Object.entries(room.scenes || {}).forEach(([sceneName, command]) => {
    scenes.append(createSceneRow(sceneName, command));
  });

  const addSceneButton = document.createElement('button');
  addSceneButton.type = 'button';
  addSceneButton.className = 'secondary small';
  addSceneButton.textContent = 'Szene hinzufuegen';
  addSceneButton.addEventListener('click', () => {
    scenes.append(createSceneRow('neu', ''));
  });

  card.append(head, fields, scenes, addSceneButton);
  return card;
}

function createSceneRow(sceneName, command) {
  const row = document.createElement('div');
  row.className = 'scene-row';
  row.innerHTML = `
    <label>Szene<input class="scene-name" type="text"></label>
    <label>changeTo Wert<input class="scene-command" type="text"></label>
    <button type="button" class="secondary small danger-text">Entfernen</button>
  `;
  row.querySelector('.scene-name').value = sceneName;
  row.querySelector('.scene-command').value = command;
  row.querySelector('button').addEventListener('click', () => row.remove());
  return row;
}

function addRoom() {
  const nextName = uniqueRoomName('neuer_raum');
  config.rooms ||= {};
  config.rooms[nextName] = {
    label: 'Neuer Raum',
    uuid: '',
    scenes: {
      ambient: '1',
      hell: '777',
      aus: '778'
    }
  };
  renderRoomEditor();
  renderRooms();
  renderIntegrations();
  syncJsonFromForms();
}

function renderIntegrations() {
  if (!lightEndpoints || !ttsEndpoints || !config) return;

  const baseUrl = window.location.origin;
  lightEndpoints.innerHTML = '';
  Object.entries(config.rooms || {}).forEach(([roomName, room]) => {
    Object.keys(room.scenes || {}).forEach((sceneName) => {
      lightEndpoints.append(createEndpointCard({
        title: `${room.label || roomName} - ${sceneName}`,
        method: 'POST',
        url: `${baseUrl}/light/${encodeURIComponent(roomName)}/${encodeURIComponent(sceneName)}`,
        body: '',
        note: `Direkter Szenenaufruf: ${roomName}/${sceneName}`
      }));
    });
  });

  ttsEndpoints.innerHTML = '';
  ttsEndpoints.append(createEndpointCard({
    title: 'TTS normal',
    method: 'POST',
    url: `${baseUrl}/tts/speak`,
    body: 'Geschirrspueler ist fertig.',
    note: 'Einfacher Text im Request-Body.'
  }));
  ttsEndpoints.append(createEndpointCard({
    title: 'Alarm',
    method: 'POST',
    url: `${baseUrl}/tts/alarm`,
    body: 'Achtung, Alarm wurde ausgeloest.',
    note: 'Nutzt die Alarm-Geraeteliste und Alarm-Lautstaerke.'
  }));
  ttsEndpoints.append(createEndpointCard({
    title: 'Alexa2Lox-kompatibel',
    method: 'GET',
    url: `${baseUrl}/admin/plugins/alexa2lox/tts.php?device=ALL&text=Hallo&vol=50`,
    body: '',
    note: 'Kompatibler Einstieg fuer bestehende Loxone-Aufrufe.'
  }));
}

function createEndpointCard({ title, method, url, body, note }) {
  const card = document.createElement('div');
  card.className = 'endpoint-card';

  const header = document.createElement('div');
  header.className = 'endpoint-card-head';

  const label = document.createElement('strong');
  label.textContent = title;

  const methodBadge = document.createElement('span');
  methodBadge.className = 'method-badge';
  methodBadge.textContent = method;

  header.append(label, methodBadge);

  const urlLine = document.createElement('code');
  urlLine.className = 'endpoint-url';
  urlLine.textContent = url;

  const actions = document.createElement('div');
  actions.className = 'endpoint-actions';
  actions.append(createCopyButton('URL kopieren', url));
  actions.append(createCopyButton('PowerShell kopieren', buildPowerShellExample(method, url, body)));

  const noteEl = document.createElement('p');
  noteEl.textContent = note;

  card.append(header, urlLine, actions, noteEl);

  if (body) {
    const bodyEl = document.createElement('pre');
    bodyEl.className = 'endpoint-body';
    bodyEl.textContent = body;
    card.append(bodyEl);
  }

  return card;
}

function createCopyButton(label, value) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary small';
  button.textContent = label;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('Kopiert', 'ok');
    } catch {
      setStatus('Kopieren nicht erlaubt', 'error');
    }
  });
  return button;
}

function buildPowerShellExample(method, url, body) {
  if (method === 'GET') {
    return `Invoke-WebRequest -UseBasicParsing '${url}'`;
  }

  if (body) {
    return `Invoke-WebRequest -UseBasicParsing '${url}' -Method ${method} -Body '${body.replaceAll("'", "''")}' -ContentType 'text/plain'`;
  }

  return `Invoke-WebRequest -UseBasicParsing '${url}' -Method ${method}`;
}

function collectConfigFromForms() {
  const nextConfig = structuredClone(config);
  nextConfig.loxone ||= {};
  nextConfig.loxone.baseUrl = loxoneBaseUrl.value.trim();
  nextConfig.loxone.username = loxoneUsername.value.trim();
  nextConfig.loxone.password = loxonePassword.value;
  nextConfig.loxone.dryRun = dryRunToggle.checked;

  nextConfig.rooms = collectRooms();

  nextConfig.tts ||= {};
  nextConfig.tts.enabled = ttsEnabled.checked;
  nextConfig.tts.cookieFile = ttsCookieFile.value.trim();
  nextConfig.tts.amazonPage = ttsAmazonPage.value.trim() || 'amazon.de';
  nextConfig.tts.alexaServiceHost = ttsAlexaHost.value.trim() || 'layla.amazon.de';
  nextConfig.tts.defaultVolume = numberInRange(ttsDefaultVolume.value, 40);
  nextConfig.tts.alarmVolume = numberInRange(ttsAlarmVolume.value, 100);
  nextConfig.tts.defaultDevices = linesToList(ttsDefaultDevices.value);
  nextConfig.tts.allDevices = linesToList(ttsAllDevices.value);
  nextConfig.tts.alarmDevices = linesToList(ttsAlarmDevices.value);

  return nextConfig;
}

function collectRooms() {
  const rooms = {};
  roomEditor.querySelectorAll('.room-card').forEach((card) => {
    const roomKey = normalizeInputKey(card.querySelector('.room-key').value);
    if (!roomKey) return;

    const scenes = {};
    card.querySelectorAll('.scene-row').forEach((row) => {
      const sceneName = normalizeInputKey(row.querySelector('.scene-name').value);
      const command = row.querySelector('.scene-command').value.trim();
      if (sceneName && command) {
        scenes[sceneName] = command;
      }
    });

    rooms[roomKey] = {
      label: card.querySelector('.room-label').value.trim() || roomKey,
      uuid: card.querySelector('.room-uuid').value.trim(),
      scenes
    };
  });
  return rooms;
}

function syncConfigFromForms() {
  config = collectConfigFromForms();
  syncJsonFromForms();
}

function syncJsonFromForms() {
  try {
    configEditor.value = JSON.stringify(collectConfigFromForms(), null, 2);
  } catch {
    configEditor.value = JSON.stringify(config, null, 2);
  }
}

function uniqueRoomName(baseName) {
  let name = baseName;
  let index = 2;
  while (config.rooms?.[name]) {
    name = `${baseName}_${index}`;
    index += 1;
  }
  return name;
}

function listToLines(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function linesToList(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberInRange(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(100, Math.max(0, number));
}

function normalizeInputKey(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replaceAll(' ', '_')
    .replaceAll('\u00fc', 'ue')
    .replaceAll('\u00f6', 'oe')
    .replaceAll('\u00e4', 'ae')
    .replaceAll('\u00df', 'ss')
    .replace(/[^a-z0-9_-]/g, '');
}

function updateDryRunUi(enabled) {
  dryRunToggle.checked = enabled;
  modeBanner.classList.toggle('live', !enabled);
  modeTitle.textContent = enabled ? 'Testmodus' : 'Live-Modus';
  modeText.textContent = enabled
    ? 'Loxone-Befehle werden nur simuliert und im Event-Log angezeigt.'
    : 'Loxone-Befehle werden wirklich an den Miniserver gesendet.';
}

async function loadEvents() {
  const response = await fetch('/api/events');
  const events = await response.json();
  renderEvents(events);
}

function renderEvents(events) {
  if (!eventsEl) return;
  if (!events.length) {
    eventsEl.innerHTML = '<p class="empty">Noch keine Befehle.</p>';
    return;
  }

  eventsEl.innerHTML = '';
  events.forEach((event) => {
    const row = document.createElement('div');
    row.className = 'event-row';
    const meta = document.createElement('div');
    meta.className = 'event-meta';
    meta.textContent = `${formatTime(event.at)} | ${event.type} | ${event.status}`;
    const detail = document.createElement('div');
    detail.className = 'event-detail';
    detail.textContent = event.url || event.text || JSON.stringify(event);
    row.append(meta, detail);
    eventsEl.append(row);
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
