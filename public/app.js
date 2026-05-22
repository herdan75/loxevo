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
const alexaBridgeStatus = document.querySelector('#alexaBridgeStatus');
const alexaBridgeEnabled = document.querySelector('#alexaBridgeEnabled');
const alexaBridgeName = document.querySelector('#alexaBridgeName');
const alexaBridgeAdvertiseIp = document.querySelector('#alexaBridgeAdvertiseIp');
const alexaBridgeAdvertisePort = document.querySelector('#alexaBridgeAdvertisePort');
const ttsEnabled = document.querySelector('#ttsEnabled');
const ttsCookieFile = document.querySelector('#ttsCookieFile');
const ttsAmazonPage = document.querySelector('#ttsAmazonPage');
const ttsAlexaHost = document.querySelector('#ttsAlexaHost');
const ttsProxyOwnIp = document.querySelector('#ttsProxyOwnIp');
const ttsProxyPort = document.querySelector('#ttsProxyPort');
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
const alexaDevices = document.querySelector('#alexaDevices');
const ttsEndpoints = document.querySelector('#ttsEndpoints');
const ttsStatusCard = document.querySelector('#ttsStatusCard');
const ttsConfigStatus = document.querySelector('#ttsConfigStatus');
const ttsHelpBtn = document.querySelector('#ttsHelpBtn');
const ttsHelpText = document.querySelector('#ttsHelpText');
const setupPanel = document.querySelector('#setupPanel');
const setupSummary = document.querySelector('#setupSummary');
const setupChecks = document.querySelector('#setupChecks');
const setupConfigBtn = document.querySelector('#setupConfigBtn');
const refreshMaintenanceBtn = document.querySelector('#refreshMaintenanceBtn');
const dependencyStatus = document.querySelector('#dependencyStatus');

let config = null;
let ttsStatus = null;
let setupStatus = null;
let dependencyInfo = null;
let alexaBridgeInfo = null;

load();

saveBtn.addEventListener('click', () => saveConfig(saveBtn));
saveJsonBtn.addEventListener('click', () => saveJsonConfig(saveJsonBtn));
reloadJsonBtn.addEventListener('click', syncJsonFromForms);
speakBtn.addEventListener('click', () => postText('/tts/speak', ttsText.value, speakBtn, 'TTS gesendet'));
alarmBtn.addEventListener('click', () => postText('/tts/alarm', ttsText.value, alarmBtn, 'Alarm gesendet'));
refreshEventsBtn.addEventListener('click', loadEvents);
dryRunToggle.addEventListener('change', () => setDryRun(dryRunToggle.checked));
addRoomBtn.addEventListener('click', addRoom);
refreshIntegrationsBtn.addEventListener('click', () => {
  renderIntegrations();
  loadAlexaBridgeStatus();
  showToast('Aufrufe aktualisiert', 'ok');
});
setupConfigBtn.addEventListener('click', () => showView('configView'));
refreshMaintenanceBtn.addEventListener('click', () => loadDependencyStatus(refreshMaintenanceBtn));
ttsHelpBtn?.addEventListener('click', () => toggleTtsHelp());
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
    await loadAlexaBridgeStatus();
    await loadSetupStatus();
    loadDependencyStatus();
    renderCommands();
    renderCommandEditor();
    renderIntegrations();
    syncJsonFromForms();
    await loadEvents();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderCommands() {
  roomsEl.innerHTML = '';
  const runnableCommands = Object.entries(getRunnableCommands());

  if (!runnableCommands.length) {
    roomsEl.innerHTML = '<p class="empty">Noch keine aktiven Befehle konfiguriert.</p>';
    return;
  }

  Object.entries(groupCommandsByCategory(runnableCommands)).forEach(([category, commands], index) => {
    const group = createCategoryGroup(category, commands.length, index === 0);

    const sceneGrid = document.createElement('div');
    sceneGrid.className = 'scene-grid';

    commands.forEach(([commandKey, command]) => {
      const button = document.createElement('button');
      button.className = 'secondary';
      button.textContent = getCommandDisplayName(commandKey, command);
      button.addEventListener('click', () => sendCommand(commandKey, button));
      sceneGrid.append(button);
    });

    group.append(sceneGrid);
    roomsEl.append(group);
  });
}

async function sendCommand(commandKey, button) {
  setButtonFeedback(button, 'pending', 'Wird ausgeführt');
  try {
    await postJson('/api/command', { command: commandKey });
    await loadEvents();
    setButtonFeedback(button, 'success', 'Ausgeführt');
    showToast(`Befehl ausgeführt: ${commandKey}`, 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function saveConfig(button) {
  setButtonFeedback(button, 'pending', 'Speichert');
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
    await loadAlexaBridgeStatus();
    await loadSetupStatus();
    renderIntegrations();
    setButtonFeedback(button, 'success', 'Gespeichert');
    showToast('Konfiguration gespeichert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function saveJsonConfig(button) {
  setButtonFeedback(button, 'pending', 'Speichert');
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
    await loadAlexaBridgeStatus();
    await loadSetupStatus();
    renderIntegrations();
    setButtonFeedback(button, 'success', 'Gespeichert');
    showToast('JSON gespeichert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function postText(url, text, button, successText = 'TTS gesendet') {
  setButtonFeedback(button, 'pending', 'Sendet');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: text
    });
    await ensureOk(response);
    await loadTtsStatus();
    await loadEvents();
    setButtonFeedback(button, 'success', 'Gesendet');
    showToast(successText, 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
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

function setButtonFeedback(button, state, label) {
  if (!button) return;

  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent;
  }
  if (!button.dataset.feedbackWidth) {
    button.dataset.feedbackWidth = `${Math.ceil(button.getBoundingClientRect().width)}px`;
  }
  if (button.dataset.feedbackTimer) {
    window.clearTimeout(Number(button.dataset.feedbackTimer));
  }

  button.style.minWidth = button.dataset.feedbackWidth;
  button.classList.remove('action-pending', 'action-success', 'action-error');

  if (state === 'pending') {
    button.disabled = true;
    button.textContent = label;
    button.classList.add('action-pending');
    return;
  }

  button.disabled = false;
  button.textContent = label;
  button.classList.add(state === 'error' ? 'action-error' : 'action-success');

  button.dataset.feedbackTimer = String(window.setTimeout(() => {
    button.textContent = button.dataset.defaultLabel;
    button.classList.remove('action-pending', 'action-success', 'action-error');
    button.style.minWidth = '';
    delete button.dataset.feedbackWidth;
    delete button.dataset.feedbackTimer;
  }, 1600));
}

function showToast(text, type = 'ok') {
  let region = document.querySelector('#toastRegion');
  if (!region) {
    region = document.createElement('div');
    region.id = 'toastRegion';
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.append(region);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : 'ok'}`;
  toast.textContent = text;
  region.append(toast);

  window.requestAnimationFrame(() => toast.classList.add('show'));
  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 220);
  }, 2600);
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
    text = humanizeTtsStatusError(status.error);
    className = 'service-status error';
  }

  targets.forEach((target) => {
    target.textContent = text;
    target.className = className;
  });
}

function deviceCount(devices) {
  const count = Array.isArray(devices) ? devices.length : 0;
  return `${count} ${count === 1 ? 'Gerät' : 'Geräte'}`;
}

async function loadAlexaBridgeStatus() {
  if (!alexaBridgeStatus) return;
  try {
    const response = await fetch('/api/alexa-bridge/status');
    await ensureOk(response);
    alexaBridgeInfo = await response.json();
    renderAlexaBridgeStatus();
  } catch (error) {
    alexaBridgeInfo = { enabled: false, ready: false, error: error.message, devices: [] };
    renderAlexaBridgeStatus();
  }
}

function renderAlexaBridgeStatus() {
  if (!alexaBridgeStatus) return;
  const status = alexaBridgeInfo || { enabled: false, ready: false, devices: [] };
  const devices = Array.isArray(status.devices) ? status.devices : [];

  if (!status.enabled) {
    alexaBridgeStatus.textContent = 'Virtuelle Alexa-Geräte sind deaktiviert.';
    alexaBridgeStatus.className = 'service-status disabled';
    renderAlexaDevices();
    return;
  }

  if (!status.ready) {
    alexaBridgeStatus.textContent = humanizeAlexaBridgeError(status.error);
    alexaBridgeStatus.className = 'service-status error';
    renderAlexaDevices();
    return;
  }

  const ssdpText = status.ssdpPort ? `, SSDP/UDP ${status.ssdpPort}` : '';
  alexaBridgeStatus.textContent = `Bereit: ${devices.length} virtuelle Geräte auf ${status.ip}:${status.port}${ssdpText}.`;
  alexaBridgeStatus.className = 'service-status ready';
  renderAlexaDevices();
}

function humanizeTtsStatusError(errorText = '') {
  const text = String(errorText || '').toLowerCase();
  if (text.includes('please open http://') || text.includes('please open https://')) {
    const loginUrl = String(errorText || '').match(/https?:\/\/[^\s)]+/)?.[0] || '';
    return `Amazon-Login ist erforderlich. Öffne ${loginUrl || 'die Login-Adresse aus dem Docker-Log'} im Browser, melde dich an und starte LoxEvo danach neu.`;
  }
  if (text.includes('cookie') && (text.includes('enoent') || text.includes('no such file'))) {
    return 'TTS ist aktiviert, aber die Cookie-Datei wurde nicht gefunden. Der Info-Button in der Konfiguration erklärt die nächsten Schritte.';
  }
  if (text.includes('no json')) {
    return 'TTS ist aktiviert, aber Amazon hat keine gültige JSON-Antwort geliefert. Häufig passt das Cookie-Format oder die Alexa-Session nicht. Der Info-Button erklärt die nächsten Schritte.';
  }
  if (text.includes('alexa-remote2') && text.includes('nicht installiert')) {
    return 'TTS ist aktiviert, aber alexa-remote2 ist noch nicht installiert. Installiere es im Register Wartung.';
  }
  if (text.includes('cookie')) {
    return `TTS ist aktiviert, aber das Alexa-Cookie ist noch nicht nutzbar: ${errorText}`;
  }
  return `TTS ist aktiviert, aber noch nicht bereit: ${errorText || 'Status unbekannt'}`;
}

function humanizeAlexaBridgeError(errorText = '') {
  const text = String(errorText || '');
  const lower = text.toLowerCase();
  if (lower.includes('eaddrinuse') && lower.includes('1900')) {
    return 'Virtuelle Alexa-Geräte sind aktiviert, aber SSDP/UDP 1900 ist bereits belegt. Auf dem LoxBerry läuft vermutlich schon ein UPnP-, Hue-Bridge- oder anderer Alexa-Emulator.';
  }
  return `Alexa-Geräte sind aktiviert, aber noch nicht bereit: ${text || 'Status unbekannt'}`;
}

function toggleTtsHelp() {
  if (!ttsHelpBtn || !ttsHelpText) return;
  const nextHidden = !ttsHelpText.hidden;
  ttsHelpText.hidden = nextHidden;
  ttsHelpBtn.setAttribute('aria-expanded', String(!nextHidden));
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
  if (viewId === 'maintenanceView') {
    loadDependencyStatus();
  }
}

async function loadDependencyStatus(button) {
  if (!dependencyStatus) return;
  if (button) setButtonFeedback(button, 'pending', 'Prüft');
  dependencyStatus.innerHTML = '<p class="empty">Versionen werden geprüft...</p>';
  try {
    const response = await fetch('/api/dependencies');
    await ensureOk(response);
    dependencyInfo = await response.json();
    renderDependencyStatus();
    if (button) {
      setButtonFeedback(button, 'success', 'Geprüft');
      showToast('Versionen geprüft', 'ok');
    }
  } catch (error) {
    dependencyStatus.innerHTML = `<div class="service-status error">${escapeHtml(error.message)}</div>`;
    if (button) {
      setButtonFeedback(button, 'error', 'Fehler');
      showToast(error.message, 'error');
    }
  }
}

function renderDependencyStatus() {
  if (!dependencyStatus) return;
  const dependencies = dependencyInfo?.dependencies || [];
  if (!dependencies.length) {
    dependencyStatus.innerHTML = '<p class="empty">Keine wartbaren Komponenten gefunden.</p>';
    return;
  }

  dependencyStatus.innerHTML = '';
  dependencies.forEach((dependency) => {
    const card = document.createElement('div');
    card.className = 'maintenance-card';

    const title = document.createElement('div');
    title.className = 'maintenance-title';
    const name = document.createElement('strong');
    name.textContent = dependency.name;
    const badge = document.createElement('span');
    badge.className = dependency.updateAvailable || !dependency.installedVersion ? 'update-badge update' : 'update-badge ok';
    badge.textContent = !dependency.installedVersion
      ? 'Nicht installiert'
      : dependency.updateAvailable ? 'Update verfügbar' : 'Aktuell';
    title.append(name, badge);

    const grid = document.createElement('div');
    grid.className = 'maintenance-grid';
    grid.innerHTML = `
      <div><span>Installiert</span><strong>${escapeHtml(dependency.installedVersion || 'Nicht installiert')}</strong></div>
      <div><span>Verfügbar</span><strong>${escapeHtml(dependency.latestVersion || 'Unbekannt')}</strong></div>
      <div><span>Geprüft</span><strong>${escapeHtml(formatDateTime(dependency.latestCheckedAt))}</strong></div>
      <div><span>Installationspfad</span><strong>${escapeHtml(dependency.installPath || 'Standard')}</strong></div>
    `;

    const message = document.createElement('p');
    message.className = 'maintenance-message';
    message.textContent = dependency.latestError
      ? `Update-Prüfung nicht möglich: ${dependency.latestError}`
      : dependency.update?.message || (dependency.updateAvailable ? 'Eine neuere Version kann installiert werden.' : 'Die installierte Version ist aktuell.');

    const actions = document.createElement('div');
    actions.className = 'actions';
    const versionSelect = document.createElement('select');
    versionSelect.className = 'version-select';
    const versions = dependency.availableVersions || [];
    if (versions.length) {
      versions.forEach((version) => {
        const option = document.createElement('option');
        option.value = version;
        option.textContent = version === dependency.latestVersion ? `${version} (latest)` : version;
        versionSelect.append(option);
      });
    } else {
      const option = document.createElement('option');
      option.value = 'latest';
      option.textContent = 'latest';
      versionSelect.append(option);
    }
    versionSelect.value = dependency.latestVersion || versions[0] || 'latest';
    actions.append(versionSelect);

    const updateButton = document.createElement('button');
    updateButton.type = 'button';
    updateButton.textContent = dependency.installedVersion ? 'Update installieren' : 'Installieren';
    updateButton.disabled = dependency.update?.status === 'running' || Boolean(dependency.latestError);
    updateButton.addEventListener('click', () => updateDependency(dependency.name, versionSelect.value, updateButton));
    actions.append(updateButton);

    if (dependency.update?.restartRequired) {
      const restartButton = document.createElement('button');
      restartButton.type = 'button';
      restartButton.className = 'secondary';
      restartButton.textContent = 'LoxEvo neu starten';
      restartButton.addEventListener('click', () => restartSystem(restartButton));
      actions.append(restartButton);
    }

    card.append(title, grid, message, actions);
    dependencyStatus.append(card);
  });
}

async function updateDependency(name, version, button) {
  setButtonFeedback(button, 'pending', 'Installiert');
  try {
    const response = await fetch(`/api/dependencies/${encodeURIComponent(name)}/update`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ version })
    });
    await ensureOk(response);
    dependencyInfo = await response.json();
    renderDependencyStatus();
    setButtonFeedback(button, 'success', 'Installiert');
    showToast('Update installiert. Neustart erforderlich.', 'ok');
  } catch (error) {
    await loadDependencyStatus();
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function restartSystem(button) {
  setButtonFeedback(button, 'pending', 'Startet neu');
  try {
    const response = await fetch('/api/system/restart', { method: 'POST' });
    await ensureOk(response);
    showToast('LoxEvo startet neu', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
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
    showToast(result.dryRun ? 'Dry-Run aktiv' : 'Live-Modus aktiv', result.dryRun ? 'ok' : 'ok');
  } catch (error) {
    dryRunToggle.checked = Boolean(config.loxone?.dryRun);
    showToast(error.message, 'error');
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
    ? 'Die Basiskonfiguration ist vollständig. Live-Modus erst nach erfolgreichem Test aktivieren.'
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

  alexaBridgeEnabled.checked = config.alexaBridge?.enabled === true;
  alexaBridgeName.value = config.alexaBridge?.name || 'LoxEvo';
  alexaBridgeAdvertiseIp.value = config.alexaBridge?.advertiseIp || '';
  alexaBridgeAdvertisePort.value = config.alexaBridge?.advertisePort || config.server?.port || 8080;

  ttsEnabled.checked = Boolean(config.tts?.enabled);
  ttsCookieFile.value = config.tts?.cookieFile || '';
  ttsAmazonPage.value = config.tts?.amazonPage || '';
  ttsAlexaHost.value = config.tts?.alexaServiceHost || '';
  ttsProxyOwnIp.value = config.tts?.proxyOwnIp || '';
  ttsProxyPort.value = config.tts?.proxyPort || '';
  ttsDefaultVolume.value = config.tts?.defaultVolume ?? 40;
  ttsAlarmVolume.value = config.tts?.alarmVolume ?? 100;
  ttsDefaultDevices.value = listToLines(config.tts?.defaultDevices);
  ttsAllDevices.value = listToLines(config.tts?.allDevices);
  ttsAlarmDevices.value = listToLines(config.tts?.alarmDevices);
}

function renderCommandEditor() {
  roomEditor.innerHTML = '';
  const commandGroups = groupCommandsByCategory(Object.entries(getConfiguredCommands()));
  Object.entries(commandGroups).forEach(([category, commands], index) => {
    const group = createCategoryGroup(category, commands.length, index === 0);
    commands.forEach(([commandKey, command]) => {
      group.append(createCommandCard(commandKey, command));
    });
    roomEditor.append(group);
  });
}

function createCommandCard(commandKey, command) {
  const card = document.createElement('details');
  card.className = 'room-card';
  card.dataset.commandOriginal = commandKey;
  card.open = false;

  const head = document.createElement('summary');
  head.className = 'room-card-head';

  const title = document.createElement('strong');
  title.textContent = getCommandDisplayName(commandKey, command);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'secondary small danger-text';
  deleteButton.textContent = 'Entfernen';
  deleteButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    card.remove();
    syncConfigFromForms();
    renderCommands();
  });

  head.append(title, deleteButton);

  const fields = document.createElement('div');
  fields.className = 'form-row three';
  fields.innerHTML = `
    <label>Befehl-Schlüssel<input class="command-key" type="text"></label>
    <label>Anzeigename<input class="command-label" type="text"></label>
    <label>Sprachname<input class="command-voice" type="text"></label>
  `;
  fields.querySelector('.command-key').value = commandKey;
  fields.querySelector('.command-label').value = getCommandDisplayName(commandKey, command);
  fields.querySelector('.command-voice').value = getCommandVoiceName(commandKey, command);

  const details = document.createElement('div');
  details.className = 'form-row four';
  details.innerHTML = `
    <label>Rubrik<input class="command-category" type="text"></label>
    <label>Raum<input class="command-room" type="text"></label>
    <label>Funktion<input class="command-function" type="text"></label>
    <label>Aktion/Szene<input class="command-action" type="text"></label>
  `;
  details.querySelector('.command-category').value = command.category || command.function || 'Allgemein';
  details.querySelector('.command-room').value = command.room || '';
  details.querySelector('.command-function').value = command.function || '';
  details.querySelector('.command-action').value = command.action || '';

  const target = getCommandTarget(command);
  const loxone = document.createElement('div');
  loxone.className = 'form-row four';
  loxone.innerHTML = `
    <label>Befehlstyp<select class="command-type">
      <option value="changeTo">changeTo</option>
      <option value="direct">direct</option>
      <option value="pulse">pulse</option>
      <option value="raw">raw</option>
    </select></label>
    <label>Loxone UUID (nur UUID)<input class="command-uuid" type="text" placeholder="2030c0ad-02a5-5919-ffffba27bfcae6ca"></label>
    <label>Wert/Befehl<input class="command-value" type="text"></label>
    <label>Aktiv<span class="checkbox-row inline"><input class="command-enabled" type="checkbox"><span>Befehl verwenden</span></span></label>
  `;
  loxone.querySelector('.command-type').value = target.type;
  const uuidInput = loxone.querySelector('.command-uuid');
  uuidInput.value = target.uuid;
  uuidInput.addEventListener('blur', () => {
    const normalizedUuid = normalizeLoxoneUuidInput(uuidInput.value);
    if (normalizedUuid && normalizedUuid !== uuidInput.value.trim()) {
      uuidInput.value = normalizedUuid;
      showToast('UUID aus Loxone-Pfad übernommen', 'ok');
      syncConfigFromForms();
    }
  });
  loxone.querySelector('.command-value').value = target.value;
  loxone.querySelector('.command-enabled').checked = command.enabled !== false;
  loxone.querySelector('.command-type').addEventListener('change', () => updatePathFieldState(card));

  const raw = document.createElement('div');
  raw.className = 'form-row';
  raw.innerHTML = `
    <label>Loxone Pfad / Spezialpfad<input class="command-path" type="text" placeholder="Nur für Befehlstyp raw"></label>
  `;
  raw.querySelector('.command-path').value = target.path;

  card.append(head, fields, details, loxone, raw);
  updatePathFieldState(card);
  return card;
}

function addRoom() {
  const nextName = uniqueCommandName('neuer_befehl');
  config.commands ||= {};
  config.commands[nextName] = {
    label: 'Neuer Befehl',
    voiceName: 'Neuer Befehl',
    category: 'Allgemein',
    room: '',
    function: '',
    action: '',
    loxone: {
      type: 'changeTo',
      uuid: '',
      value: '',
      path: ''
    },
    enabled: false
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
  const runnableCommands = Object.entries(getRunnableCommands());

  if (!runnableCommands.length) {
    lightEndpoints.innerHTML = '<p class="empty">Noch keine aktiven Befehle vorhanden.</p>';
  }

  Object.entries(groupCommandsByCategory(runnableCommands)).forEach(([category, commands], index) => {
    const group = createCategoryGroup(category, commands.length, index === 0);
    commands.forEach(([commandKey, command]) => {
      group.append(createEndpointCard({
        title: command.label || commandKey,
        method: 'POST',
        url: `${baseUrl}/command/${encodeURIComponent(commandKey)}`,
        body: '',
        note: `Sprachname: ${command.voiceName || command.label || commandKey} | Loxone: ${formatCommandTarget(command)}`,
        testLabel: 'Befehl testen',
        testAction: (button) => testEndpoint({
          method: 'POST',
          url: `${baseUrl}/command/${encodeURIComponent(commandKey)}`,
          successText: command.label || commandKey
        }, button)
      }));
    });
    lightEndpoints.append(group);
  });

  renderAlexaDevices();

  ttsEndpoints.innerHTML = '';
  ttsEndpoints.append(createEndpointCard({
    title: 'TTS normal',
    method: 'POST',
    url: `${baseUrl}/tts/speak`,
    body: 'Geschirrspüler ist fertig.',
    note: 'Einfacher Text im Request-Body.',
    testLabel: 'TTS testen',
    testAction: (button) => testEndpoint({
      method: 'POST',
      url: `${baseUrl}/tts/speak`,
      body: 'Geschirrspüler ist fertig.',
      contentType: 'text/plain',
      successText: 'TTS normal'
    }, button)
  }));
  ttsEndpoints.append(createEndpointCard({
    title: 'Alarm',
    method: 'POST',
    url: `${baseUrl}/tts/alarm`,
    body: 'Achtung, Alarm wurde ausgelöst.',
    note: 'Nutzt die Alarm-Geräteliste und Alarm-Lautstärke.',
    testLabel: 'Alarm testen',
    testAction: (button) => testEndpoint({
      method: 'POST',
      url: `${baseUrl}/tts/alarm`,
      body: 'Achtung, Alarm wurde ausgelöst.',
      contentType: 'text/plain',
      successText: 'Alarm'
    }, button)
  }));
  ttsEndpoints.append(createEndpointCard({
    title: 'Alexa2Lox-kompatibel',
    method: 'GET',
    url: `${baseUrl}/admin/plugins/alexa2lox/tts.php?device=ALL&text=Hallo&vol=50`,
    body: '',
    note: 'Kompatibler Einstieg für bestehende Loxone-Aufrufe.',
    testLabel: 'Compat testen',
    testAction: (button) => testEndpoint({
      method: 'GET',
      url: `${baseUrl}/admin/plugins/alexa2lox/tts.php?device=ALL&text=Hallo&vol=50`,
      successText: 'Alexa2Lox TTS'
    }, button)
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
  actions.append(createCopyButton('PowerShell-Befehl kopieren', buildPowerShellExample(method, url, body)));

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
  button.addEventListener('click', () => action(button));
  return button;
}

async function testEndpoint({ method, url, body, contentType, successText }, button) {
  setButtonFeedback(button, 'pending', 'Test läuft');
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
    setButtonFeedback(button, 'success', 'Getestet');
    showToast(`${successText} getestet`, 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function createCopyButton(label, value) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary small';
  button.textContent = label;
  button.addEventListener('click', async () => {
    setButtonFeedback(button, 'pending', 'Kopiert');
    try {
      await copyText(value);
      setButtonFeedback(button, 'success', 'Kopiert');
      showToast('In Zwischenablage kopiert', 'ok');
    } catch {
      setButtonFeedback(button, 'error', 'Fehler');
      showToast('Kopieren nicht erlaubt', 'error');
    }
  });
  return button;
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    if (!document.execCommand('copy')) {
      throw new Error('copy failed');
    }
  } finally {
    textarea.remove();
  }
}

function createCategoryGroup(category, count, open = true) {
  const group = document.createElement('details');
  group.className = 'category-group';
  group.open = open;

  const summary = document.createElement('summary');
  summary.className = 'category-summary';

  const title = document.createElement('span');
  title.textContent = displayPart(category) || 'Allgemein';

  const badge = document.createElement('span');
  badge.className = 'count-badge';
  badge.textContent = String(count);

  summary.append(title, badge);
  group.append(summary);
  return group;
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

  nextConfig.alexaBridge ||= {};
  nextConfig.alexaBridge.enabled = alexaBridgeEnabled.checked;
  nextConfig.alexaBridge.name = alexaBridgeName.value.trim() || 'LoxEvo';
  nextConfig.alexaBridge.advertiseIp = alexaBridgeAdvertiseIp.value.trim();
  nextConfig.alexaBridge.advertisePort = numberInRange(alexaBridgeAdvertisePort.value, nextConfig.server?.port || 8080, 1, 65535);
  nextConfig.alexaBridge.bridgeId ||= '';

  nextConfig.commands = collectCommands();
  delete nextConfig.rooms;

  nextConfig.tts ||= {};
  nextConfig.tts.enabled = ttsEnabled.checked;
  nextConfig.tts.cookieFile = ttsCookieFile.value.trim();
  nextConfig.tts.amazonPage = ttsAmazonPage.value.trim() || 'amazon.de';
  nextConfig.tts.alexaServiceHost = ttsAlexaHost.value.trim() || 'layla.amazon.de';
  nextConfig.tts.proxyOwnIp = ttsProxyOwnIp.value.trim();
  nextConfig.tts.proxyPort = ttsProxyPort.value ? numberInRange(ttsProxyPort.value, 0, 0, 65535) : 0;
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
    const loxoneType = card.querySelector('.command-type').value;

    commands[commandKey] = {
      label: card.querySelector('.command-label').value.trim() || commandKey,
      voiceName: card.querySelector('.command-voice').value.trim() || commandKey,
      category: card.querySelector('.command-category').value.trim() || 'Allgemein',
      room: normalizeInputKey(card.querySelector('.command-room').value),
      function: normalizeInputKey(card.querySelector('.command-function').value),
      action: normalizeInputKey(card.querySelector('.command-action').value),
      loxone: {
        type: loxoneType,
        uuid: normalizeLoxoneUuidInput(card.querySelector('.command-uuid').value),
        value: card.querySelector('.command-value').value.trim(),
        path: loxoneType === 'raw' ? card.querySelector('.command-path').value.trim() : ''
      },
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
        voiceName: `Licht ${room.label || roomName} ${sceneName} an`,
        category: 'Licht',
        room: roomName,
        function: 'licht',
        action: sceneName,
        loxone: {
          type: 'changeTo',
          uuid: room.uuid || '',
          value
        },
        enabled: true
      };
    });
  });
  return commands;
}

function getRunnableCommands() {
  return Object.fromEntries(
    Object.entries(getConfiguredCommands()).filter(([, command]) => command.enabled !== false)
  );
}

function getCommandTarget(command) {
  const loxone = command.loxone || {};
  const type = normalizeCommandType(loxone.type || command.loxoneType || command.type || (loxone.path || command.loxonePath ? 'raw' : 'changeTo'));
  return {
    type,
    uuid: loxone.uuid || command.loxoneUuid || '',
    value: loxone.value ?? loxone.command ?? command.loxoneCommand ?? '',
    path: loxone.path || command.loxonePath || ''
  };
}

function getCommandDisplayName(commandKey, command) {
  const generated = buildCommandDisplayName(command);
  if (!generated) return command.label || commandKey;

  const current = command.label || '';
  if (!current || isGeneratedCommandName(current, command)) {
    return generated;
  }
  return current;
}

function getCommandVoiceName(commandKey, command) {
  const generated = buildCommandVoiceName(command);
  if (!generated) return command.voiceName || getCommandDisplayName(commandKey, command);

  const current = command.voiceName || '';
  if (!current || isGeneratedCommandName(current, command) || isGeneratedCommandName(current.replace(/\s+an$/i, ''), command)) {
    return generated;
  }
  return current;
}

function buildCommandVoiceName(command) {
  const displayName = buildCommandDisplayName(command);
  if (!displayName) return '';
  const action = String(command.action || '').trim().toLowerCase();
  if (['an', 'aus', 'auf', 'ab', 'zu', 'ein', 'up', 'down', 'on', 'off'].includes(action)) {
    return displayName;
  }
  return `${displayName} an`;
}

function buildCommandDisplayName(command) {
  const functionName = displayPart(command.function || command.category);
  const roomName = displayPart(command.room);
  const actionName = displayPart(command.action);
  return [functionName, roomName, actionName].filter(Boolean).join(' ');
}

function isGeneratedCommandName(value, command) {
  const roomName = displayPart(command.room);
  const functionName = displayPart(command.function || command.category);
  const actionName = displayPart(command.action);
  const candidates = [
    [functionName, roomName, actionName],
    [roomName, functionName, actionName],
    [functionName, actionName, roomName],
    [roomName, actionName, functionName]
  ].map((parts) => normalizeComparableName(parts.filter(Boolean).join(' ')));

  return candidates.includes(normalizeComparableName(value));
}

function displayPart(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const mapped = {
    licht: 'Licht',
    lueftung: 'Lüftung',
    rolladen: 'Rollladen',
    rollladen: 'Rollladen',
    kueche: 'Küche',
    buero: 'Büro',
    tv: 'TV',
    up: 'Auf',
    down: 'Ab',
    on: 'An',
    off: 'Aus',
    ein: 'An',
    aus: 'Aus',
    hell: 'Hell',
    ambient: 'Ambient',
    nacht: 'Nacht'
  }[raw.toLowerCase()];
  if (mapped) return mapped;
  return raw
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase() === word ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeComparableName(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replaceAll('\u00fc', 'ue')
    .replaceAll('\u00f6', 'oe')
    .replaceAll('\u00e4', 'ae')
    .replaceAll('\u00df', 'ss');
}

function normalizeCommandType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'changeto' || raw === 'change_to') return 'changeTo';
  if (raw === 'command' || raw === 'direct') return 'direct';
  if (raw === 'pulse') return 'pulse';
  if (raw === 'raw' || raw === 'path') return 'raw';
  return raw || 'changeTo';
}

function normalizeLoxoneUuidInput(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (match) return match[0].toLowerCase();
  return raw.replace(/^\/?jdev\/sps\/io\//i, '').split('/')[0].trim();
}

function formatCommandTarget(command) {
  const target = getCommandTarget(command);
  if (target.type === 'raw') return target.path || 'raw';
  if (target.type === 'pulse') return `${target.type} ${target.uuid || ''}`.trim();
  return `${target.type} ${target.uuid || ''} ${target.value || ''}`.trim();
}

function updatePathFieldState(card) {
  const type = card.querySelector('.command-type')?.value;
  const pathInput = card.querySelector('.command-path');
  if (!pathInput) return;

  const isRaw = type === 'raw';
  pathInput.disabled = !isRaw;
  pathInput.placeholder = isRaw
    ? '/jdev/sps/io/{uuid}/pulse oder kompletter Spezialpfad'
    : 'Nur für Befehlstyp raw';
  pathInput.closest('label')?.classList.toggle('is-disabled', !isRaw);
}

function groupCommandsByCategory(entries) {
  return entries.reduce((groups, [commandKey, command]) => {
    const category = command.category || command.function || 'Allgemein';
    groups[category] ||= [];
    groups[category].push([commandKey, command]);
    return groups;
  }, {});
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

function numberInRange(value, fallback, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function renderAlexaDevices() {
  if (!alexaDevices) return;
  const status = alexaBridgeInfo || {};
  const devices = Array.isArray(status.devices) ? status.devices : [];

  if (!status.enabled) {
    alexaDevices.innerHTML = '<p class="empty">Virtuelle Alexa-Geräte sind deaktiviert.</p>';
    return;
  }

  if (!devices.length) {
    alexaDevices.innerHTML = '<p class="empty">Noch keine aktiven Befehle für Alexa vorhanden.</p>';
    return;
  }

  alexaDevices.innerHTML = '';
  devices.forEach((device) => {
    const card = document.createElement('div');
    card.className = 'endpoint-card';
    const title = document.createElement('strong');
    title.textContent = device.name;
    const note = document.createElement('p');
    note.textContent = `Sprachbeispiel: Alexa, ${device.name} an | Befehl: ${device.command}`;
    card.append(title, note);
    alexaDevices.append(card);
  });
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
    : 'Aktiv: Loxone-Befehle werden wirklich an den Miniserver gesendet.';
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

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDateTime(value) {
  if (!value) return 'Noch nicht';
  return new Date(value).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
