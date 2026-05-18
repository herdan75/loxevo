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
const ttsStatusCard = document.querySelector('#ttsStatusCard');
const ttsConfigStatus = document.querySelector('#ttsConfigStatus');
const setupPanel = document.querySelector('#setupPanel');
const setupSummary = document.querySelector('#setupSummary');
const setupChecks = document.querySelector('#setupChecks');
const setupConfigBtn = document.querySelector('#setupConfigBtn');

let config = null;
let ttsStatus = null;
let setupStatus = null;

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
setupConfigBtn.addEventListener('click', () => showView('configView'));
tabButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.tabTarget));
});

async function load() {
  try {
    const response = await fetch('/api/config');
    config = await response.json();
    populateForms();
    updateDryRunUi(Boolean(config.loxone?.dryRun));
    await loadTtsStatus();
    await loadSetupStatus();
    renderCommands();
    renderCommandEditor();
    renderIntegrations();
    syncJsonFromForms();
    await loadEvents();
    setStatus('Bereit', 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

function renderCommands() {
  roomsEl.innerHTML = '';
  Object.entries(getConfiguredCommands()).forEach(([commandKey, command]) => {
    const roomEl = document.createElement('div');
    roomEl.className = 'room';

    const title = document.createElement('h3');
    title.textContent = command.label || commandKey;
    roomEl.append(title);

    const sceneGrid = document.createElement('div');
    sceneGrid.className = 'scene-grid';

    const button = document.createElement('button');
    button.className = 'secondary';
    button.textContent = command.action || command.function || 'Ausfuehren';
    button.addEventListener('click', () => sendCommand(commandKey));
    sceneGrid.append(button);

    roomEl.append(sceneGrid);
    roomsEl.append(roomEl);
  });
}

async function sendCommand(commandKey) {
  try {
    await postJson('/api/command', { command: commandKey });
    await loadEvents();
    setStatus(commandKey, 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
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
    renderCommands();
    renderCommandEditor();
    await loadTtsStatus();
    await loadSetupStatus();
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
    renderCommands();
    renderCommandEditor();
    await loadTtsStatus();
    await loadSetupStatus();
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
    await loadTtsStatus();
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

async function loadTtsStatus() {
  try {
    const response = await fetch('/api/tts/status');
    await ensureOk(response);
    ttsStatus = await response.json();
    renderTtsStatus();
  } catch (error) {
    ttsStatus = { enabled: false, ready: false, error: error.message };
    renderTtsStatus();
  }
}

function renderTtsStatus() {
  const targets = [ttsStatusCard, ttsConfigStatus].filter(Boolean);
  if (!targets.length) return;

  const status = ttsStatus || { enabled: false, ready: false };
  let text = 'TTS ist deaktiviert.';
  let className = 'service-status disabled';

  if (status.enabled && status.ready) {
    text = `TTS ist bereit. Standard: ${deviceCount(status.defaultDevices)}, Alarm: ${deviceCount(status.alarmDevices)}.`;
    className = 'service-status ready';
  } else if (status.enabled) {
    text = `TTS ist aktiviert, aber noch nicht bereit: ${status.error || 'Status unbekannt'}`;
    className = 'service-status error';
  }

  targets.forEach((target) => {
    target.textContent = text;
    target.className = className;
  });
}

function deviceCount(devices) {
  const count = Array.isArray(devices) ? devices.length : 0;
  return `${count} ${count === 1 ? 'Geraet' : 'Geraete'}`;
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
    await loadSetupStatus();
    await loadEvents();
    setStatus(result.dryRun ? 'Dry-Run aktiv' : 'Live aktiv', result.dryRun ? 'ok' : 'error');
  } catch (error) {
    dryRunToggle.checked = Boolean(config.loxone?.dryRun);
    setStatus(error.message, 'error');
  }
}

async function loadSetupStatus() {
  try {
    const response = await fetch('/api/setup-status');
    await ensureOk(response);
    setupStatus = await response.json();
    renderSetupStatus();
  } catch (error) {
    setupStatus = null;
    renderSetupStatus(error.message);
  }
}

function renderSetupStatus(errorText) {
  if (!setupPanel || !setupSummary || !setupChecks) return;

  if (errorText) {
    setupPanel.classList.add('setup-warning');
    setupSummary.textContent = `Setup-Status konnte nicht geladen werden: ${errorText}`;
    setupChecks.innerHTML = '';
    return;
  }

  if (!setupStatus) return;

  setupPanel.classList.toggle('setup-complete', setupStatus.complete);
  setupPanel.classList.toggle('setup-warning', !setupStatus.complete);
  setupSummary.textContent = setupStatus.complete
    ? 'Die Basiskonfiguration ist vollstaendig. Live-Modus erst nach erfolgreichem Test aktivieren.'
    : `${setupStatus.openRequired} notwendige Einrichtungsschritte sind noch offen.`;

  setupChecks.innerHTML = '';
  setupStatus.checks.forEach((check) => {
    const row = document.createElement('div');
    row.className = `setup-check ${check.ok ? 'ok' : 'open'} ${check.optional ? 'optional' : ''}`.trim();

    const marker = document.createElement('span');
    marker.className = 'setup-marker';
    marker.textContent = check.ok ? 'OK' : check.optional ? 'Optional' : 'Offen';

    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = check.label;
    const detail = document.createElement('p');
    detail.textContent = check.detail;
    content.append(title, detail);

    row.append(marker, content);
    setupChecks.append(row);
  });
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

function renderCommandEditor() {
  roomEditor.innerHTML = '';
  Object.entries(getConfiguredCommands()).forEach(([commandKey, command]) => {
    roomEditor.append(createCommandCard(commandKey, command));
  });
}

function createCommandCard(commandKey, command) {
  const card = document.createElement('div');
  card.className = 'room-card';
  card.dataset.commandOriginal = commandKey;

  const head = document.createElement('div');
  head.className = 'room-card-head';

  const title = document.createElement('strong');
  title.textContent = command.label || commandKey;

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'secondary small danger-text';
  deleteButton.textContent = 'Entfernen';
  deleteButton.addEventListener('click', () => {
    card.remove();
    syncConfigFromForms();
    renderCommands();
  });

  head.append(title, deleteButton);

  const fields = document.createElement('div');
  fields.className = 'form-row three';
  fields.innerHTML = `
    <label>Befehl-Schluessel<input class="command-key" type="text"></label>
    <label>Anzeigename<input class="command-label" type="text"></label>
    <label>Sprachname<input class="command-voice" type="text"></label>
  `;
  fields.querySelector('.command-key').value = commandKey;
  fields.querySelector('.command-label').value = command.label || '';
  fields.querySelector('.command-voice').value = command.voiceName || '';

  const details = document.createElement('div');
  details.className = 'form-row three';
  details.innerHTML = `
    <label>Raum<input class="command-room" type="text"></label>
    <label>Funktion<input class="command-function" type="text"></label>
    <label>Aktion/Szene<input class="command-action" type="text"></label>
  `;
  details.querySelector('.command-room').value = command.room || '';
  details.querySelector('.command-function').value = command.function || '';
  details.querySelector('.command-action').value = command.action || '';

  const loxone = document.createElement('div');
  loxone.className = 'form-row three';
  loxone.innerHTML = `
    <label>Loxone UUID<input class="command-uuid" type="text"></label>
    <label>changeTo Wert<input class="command-value" type="text"></label>
    <label>Aktiv<span class="checkbox-row inline"><input class="command-enabled" type="checkbox"><span>Befehl verwenden</span></span></label>
  `;
  loxone.querySelector('.command-uuid').value = command.loxoneUuid || '';
  loxone.querySelector('.command-value').value = command.loxoneCommand || '';
  loxone.querySelector('.command-enabled').checked = command.enabled !== false;

  card.append(head, fields, details, loxone);
  return card;
}

function addRoom() {
  const nextName = uniqueCommandName('neuer_befehl');
  config.commands ||= {};
  config.commands[nextName] = {
    label: 'Neuer Befehl',
    voiceName: 'Neuer Befehl',
    room: '',
    function: 'licht',
    action: '',
    loxoneUuid: '',
    loxoneCommand: '',
    enabled: true
  };
  renderCommandEditor();
  renderCommands();
  renderIntegrations();
  syncJsonFromForms();
}

function renderIntegrations() {
  if (!lightEndpoints || !ttsEndpoints || !config) return;

  const baseUrl = window.location.origin;
  lightEndpoints.innerHTML = '';
  Object.entries(getConfiguredCommands()).forEach(([commandKey, command]) => {
    lightEndpoints.append(createEndpointCard({
      title: command.label || commandKey,
      method: 'POST',
      url: `${baseUrl}/command/${encodeURIComponent(commandKey)}`,
      body: '',
      note: `Sprachname: ${command.voiceName || command.label || commandKey}`,
      testLabel: 'Befehl testen',
      testAction: () => testEndpoint({
        method: 'POST',
        url: `${baseUrl}/command/${encodeURIComponent(commandKey)}`,
        successText: command.label || commandKey
      })
    }));
  });

  ttsEndpoints.innerHTML = '';
  ttsEndpoints.append(createEndpointCard({
    title: 'TTS normal',
    method: 'POST',
    url: `${baseUrl}/tts/speak`,
    body: 'Geschirrspueler ist fertig.',
    note: 'Einfacher Text im Request-Body.',
    testLabel: 'TTS testen',
    testAction: () => testEndpoint({
      method: 'POST',
      url: `${baseUrl}/tts/speak`,
      body: 'Geschirrspueler ist fertig.',
      contentType: 'text/plain',
      successText: 'TTS normal'
    })
  }));
  ttsEndpoints.append(createEndpointCard({
    title: 'Alarm',
    method: 'POST',
    url: `${baseUrl}/tts/alarm`,
    body: 'Achtung, Alarm wurde ausgeloest.',
    note: 'Nutzt die Alarm-Geraeteliste und Alarm-Lautstaerke.',
    testLabel: 'Alarm testen',
    testAction: () => testEndpoint({
      method: 'POST',
      url: `${baseUrl}/tts/alarm`,
      body: 'Achtung, Alarm wurde ausgeloest.',
      contentType: 'text/plain',
      successText: 'Alarm'
    })
  }));
  ttsEndpoints.append(createEndpointCard({
    title: 'Alexa2Lox-kompatibel',
    method: 'GET',
    url: `${baseUrl}/admin/plugins/alexa2lox/tts.php?device=ALL&text=Hallo&vol=50`,
    body: '',
    note: 'Kompatibler Einstieg fuer bestehende Loxone-Aufrufe.',
    testLabel: 'Compat testen',
    testAction: () => testEndpoint({
      method: 'GET',
      url: `${baseUrl}/admin/plugins/alexa2lox/tts.php?device=ALL&text=Hallo&vol=50`,
      successText: 'Alexa2Lox TTS'
    })
  }));
}

function createEndpointCard({ title, method, url, body, note, testLabel, testAction }) {
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
  if (testAction) {
    actions.append(createTestButton(testLabel || 'Testen', testAction));
  }
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

function createTestButton(label, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'small';
  button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

async function testEndpoint({ method, url, body, contentType, successText }) {
  try {
    const options = { method };
    if (body) {
      options.body = body;
      options.headers = { 'content-type': contentType || 'text/plain' };
    }
    const response = await fetch(url, options);
    await ensureOk(response);
    await loadTtsStatus();
    await loadEvents();
    setStatus(`${successText} getestet`, 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
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

  nextConfig.commands = collectCommands();
  delete nextConfig.rooms;

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

function collectCommands() {
  const commands = {};
  roomEditor.querySelectorAll('.room-card').forEach((card) => {
    const commandKey = normalizeInputKey(card.querySelector('.command-key').value);
    if (!commandKey) return;

    commands[commandKey] = {
      label: card.querySelector('.command-label').value.trim() || commandKey,
      voiceName: card.querySelector('.command-voice').value.trim() || commandKey,
      room: normalizeInputKey(card.querySelector('.command-room').value),
      function: normalizeInputKey(card.querySelector('.command-function').value),
      action: normalizeInputKey(card.querySelector('.command-action').value),
      loxoneUuid: card.querySelector('.command-uuid').value.trim(),
      loxoneCommand: card.querySelector('.command-value').value.trim(),
      enabled: card.querySelector('.command-enabled').checked
    };
  });
  return commands;
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

function uniqueCommandName(baseName) {
  let name = baseName;
  let index = 2;
  while (getConfiguredCommands()[name]) {
    name = `${baseName}_${index}`;
    index += 1;
  }
  return name;
}

function getConfiguredCommands() {
  if (config.commands && Object.keys(config.commands).length) {
    return config.commands;
  }

  const commands = {};
  Object.entries(config.rooms || {}).forEach(([roomName, room]) => {
    Object.entries(room.scenes || {}).forEach(([sceneName, value]) => {
      const key = normalizeInputKey(`${roomName}_${sceneName}`);
      commands[key] = {
        label: `${room.label || roomName} ${sceneName}`,
        voiceName: `${room.label || roomName} ${sceneName}`,
        room: roomName,
        function: 'licht',
        action: sceneName,
        loxoneUuid: room.uuid || '',
        loxoneCommand: value,
        enabled: true
      };
    });
  });
  return commands;
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
