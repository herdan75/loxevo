const roomsEl = document.querySelector('#rooms');
const configEditor = document.querySelector('#configEditor');
const ttsText = document.querySelector('#ttsText');
const saveBtn = document.querySelector('#saveBtn');
const speakBtn = document.querySelector('#speakBtn');
const alarmBtn = document.querySelector('#alarmBtn');
const refreshEventsBtn = document.querySelector('#refreshEventsBtn');
const eventsEl = document.querySelector('#events');
const clearEventsBtn = document.querySelector('#clearEventsBtn');
const eventSearch = document.querySelector('#eventSearch');
const eventFilterButtons = document.querySelectorAll('.event-filter');
const dryRunToggle = document.querySelector('#dryRunToggle');
const modeBanner = document.querySelector('#modeBanner');
const modeTitle = document.querySelector('#modeTitle');
const modeText = document.querySelector('#modeText');
const systemNotice = document.querySelector('#systemNotice');
const dashboardCards = document.querySelector('#dashboardCards');
const backupReminder = document.querySelector('#backupReminder');
const refreshDashboardBtn = document.querySelector('#refreshDashboardBtn');
const openWizardBtn = document.querySelector('#openWizardBtn');
const dashboardConfigBtn = document.querySelector('#dashboardConfigBtn');
const wizardPrompt = document.querySelector('#wizardPrompt');
const startWizardBtn = document.querySelector('#startWizardBtn');
const skipWizardBtn = document.querySelector('#skipWizardBtn');
const wizardModal = document.querySelector('#wizardModal');
const closeWizardBtn = document.querySelector('#closeWizardBtn');
const wizardBackBtn = document.querySelector('#wizardBackBtn');
const wizardNextBtn = document.querySelector('#wizardNextBtn');
const wizardStepLabel = document.querySelector('#wizardStepLabel');
const wizardTitle = document.querySelector('#wizardTitle');
const wizardProgress = document.querySelector('#wizardProgress');
const wizardBody = document.querySelector('#wizardBody');
const wizardActionBar = document.querySelector('#wizardActionBar');
const loxoneBaseUrl = document.querySelector('#loxoneBaseUrl');
const loxoneUsername = document.querySelector('#loxoneUsername');
const loxonePassword = document.querySelector('#loxonePassword');
const alexaBridgeStatus = document.querySelector('#alexaBridgeStatus');
const alexaBridgeEnabled = document.querySelector('#alexaBridgeEnabled');
const alexaBridgeName = document.querySelector('#alexaBridgeName');
const alexaBridgeAdvertiseIp = document.querySelector('#alexaBridgeAdvertiseIp');
const alexaBridgeAdvertisePort = document.querySelector('#alexaBridgeAdvertisePort');
const discoveryStatus = document.querySelector('#discoveryStatus');
const discoveryHelpBtn = document.querySelector('#discoveryHelpBtn');
const discoveryHelpText = document.querySelector('#discoveryHelpText');
const startDiscoveryBtn = document.querySelector('#startDiscoveryBtn');
const stopDiscoveryBtn = document.querySelector('#stopDiscoveryBtn');
const ttsEnabled = document.querySelector('#ttsEnabled');
const ttsCookieFile = document.querySelector('#ttsCookieFile');
const ttsAmazonPage = document.querySelector('#ttsAmazonPage');
const ttsAlexaHost = document.querySelector('#ttsAlexaHost');
const ttsProxyOwnIp = document.querySelector('#ttsProxyOwnIp');
const ttsProxyPort = document.querySelector('#ttsProxyPort');
const ttsDefaultVolume = document.querySelector('#ttsDefaultVolume');
const ttsAlarmVolume = document.querySelector('#ttsAlarmVolume');
const ttsDefaultVolumeValue = document.querySelector('#ttsDefaultVolumeValue');
const ttsAlarmVolumeValue = document.querySelector('#ttsAlarmVolumeValue');
const ttsDefaultDevices = document.querySelector('#ttsDefaultDevices');
const ttsAllDevices = document.querySelector('#ttsAllDevices');
const ttsAlarmDevices = document.querySelector('#ttsAlarmDevices');
const refreshTtsDevicesBtn = document.querySelector('#refreshTtsDevicesBtn');
const ttsDeviceList = document.querySelector('#ttsDeviceList');
const roomEditor = document.querySelector('#roomEditor');
const addRoomBtn = document.querySelector('#addRoomBtn');
const reloadJsonBtn = document.querySelector('#reloadJsonBtn');
const saveJsonBtn = document.querySelector('#saveJsonBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const views = document.querySelectorAll('.view');
const refreshIntegrationsBtn = document.querySelector('#refreshIntegrationsBtn');
const lightEndpoints = document.querySelector('#lightEndpoints');
const alexaDevices = document.querySelector('#alexaDevices');
const integrationCommandsCount = document.querySelector('#integrationCommandsCount');
const integrationAlexaDevicesCount = document.querySelector('#integrationAlexaDevicesCount');
const configCommandsCount = document.querySelector('#configCommandsCount');
const configTtsDevicesCount = document.querySelector('#configTtsDevicesCount');
const ttsConfigStatus = document.querySelector('#ttsConfigStatus');
const ttsHelpBtn = document.querySelector('#ttsHelpBtn');
const ttsHelpText = document.querySelector('#ttsHelpText');
const setupPanel = document.querySelector('#setupPanel');
const setupSummary = document.querySelector('#setupSummary');
const setupChecks = document.querySelector('#setupChecks');
const setupConfigBtn = document.querySelector('#setupConfigBtn');
const refreshMaintenanceBtn = document.querySelector('#refreshMaintenanceBtn');
const dependencyStatus = document.querySelector('#dependencyStatus');
const refreshPreflightBtn = document.querySelector('#refreshPreflightBtn');
const exportDiagnosticsBtn = document.querySelector('#exportDiagnosticsBtn');
const preflightSummary = document.querySelector('#preflightSummary');
const preflightChecks = document.querySelector('#preflightChecks');
const backupIncludeCookie = document.querySelector('#backupIncludeCookie');
const exportBackupBtn = document.querySelector('#exportBackupBtn');
const importBackupFile = document.querySelector('#importBackupFile');
const importBackupBtn = document.querySelector('#importBackupBtn');
const backupHelpBtn = document.querySelector('#backupHelpBtn');
const backupHelpText = document.querySelector('#backupHelpText');
const backupExportHelpBtn = document.querySelector('#backupExportHelpBtn');
const backupExportHelpText = document.querySelector('#backupExportHelpText');
const backupImportHelpBtn = document.querySelector('#backupImportHelpBtn');
const backupImportHelpText = document.querySelector('#backupImportHelpText');
const adminSecurityStatus = document.querySelector('#adminSecurityStatus');
const adminSecurityHelpBtn = document.querySelector('#adminSecurityHelpBtn');
const adminSecurityHelpText = document.querySelector('#adminSecurityHelpText');
const adminTokenHelpBtn = document.querySelector('#adminTokenHelpBtn');
const adminTokenHelpText = document.querySelector('#adminTokenHelpText');
const adminDisableHelpBtn = document.querySelector('#adminDisableHelpBtn');
const adminDisableHelpText = document.querySelector('#adminDisableHelpText');
const adminTokenInput = document.querySelector('#adminTokenInput');
const adminTokenRepeatInput = document.querySelector('#adminTokenRepeatInput');
const saveAdminTokenBtn = document.querySelector('#saveAdminTokenBtn');
const disableAdminTokenBtn = document.querySelector('#disableAdminTokenBtn');

let config = null;
let ttsStatus = null;
let setupStatus = null;
let dependencyInfo = null;
let preflightInfo = null;
let alexaBridgeInfo = null;
let discoveryInfo = null;
let ttsDevices = [];
let adminSecurityInfo = null;
let allEvents = [];
let activeEventFilter = 'all';
let configDirty = false;
const ADMIN_TOKEN_STORAGE_KEY = 'loxevoAdminToken';
const LAST_BACKUP_EXPORT_KEY = 'loxevoLastBackupExportAt';
const SETUP_WIZARD_SKIPPED_KEY = 'loxevoSetupWizardSkipped';
let wizardStepIndex = 0;

load();

saveBtn.addEventListener('click', () => saveConfig(saveBtn));
saveJsonBtn.addEventListener('click', () => saveJsonConfig(saveJsonBtn));
reloadJsonBtn.addEventListener('click', () => regenerateJsonFromForms(reloadJsonBtn));
speakBtn.addEventListener('click', () => postTtsTest('speak', speakBtn));
alarmBtn.addEventListener('click', () => postTtsTest('alarm', alarmBtn));
refreshEventsBtn.addEventListener('click', () => loadEvents(refreshEventsBtn));
clearEventsBtn?.addEventListener('click', () => clearEvents(clearEventsBtn));
dryRunToggle.addEventListener('change', () => setDryRun(dryRunToggle.checked));
refreshDashboardBtn?.addEventListener('click', () => refreshDashboard(refreshDashboardBtn));
openWizardBtn?.addEventListener('click', () => openWizard(0));
dashboardConfigBtn?.addEventListener('click', () => showView('configView'));
startWizardBtn?.addEventListener('click', () => openWizard(0));
skipWizardBtn?.addEventListener('click', () => skipWizardPrompt());
closeWizardBtn?.addEventListener('click', () => closeWizard());
wizardBackBtn?.addEventListener('click', () => moveWizard(-1));
wizardNextBtn?.addEventListener('click', () => moveWizard(1));
wizardModal?.addEventListener('click', (event) => {
  if (event.target === wizardModal) closeWizard();
});
addRoomBtn.addEventListener('click', addRoom);
refreshIntegrationsBtn.addEventListener('click', () => {
  renderIntegrations();
  loadAlexaBridgeStatus();
  showToast('Aufrufe aktualisiert', 'ok');
});
setupConfigBtn.addEventListener('click', () => showView('configView'));
refreshMaintenanceBtn.addEventListener('click', () => loadDependencyStatus(refreshMaintenanceBtn));
refreshPreflightBtn?.addEventListener('click', () => loadPreflightStatus(refreshPreflightBtn));
exportDiagnosticsBtn?.addEventListener('click', () => exportDiagnostics(exportDiagnosticsBtn));
exportBackupBtn?.addEventListener('click', () => exportBackup(exportBackupBtn));
importBackupBtn?.addEventListener('click', () => importBackup(importBackupBtn));
backupHelpBtn?.addEventListener('click', () => toggleBackupHelp());
adminSecurityHelpBtn?.addEventListener('click', () => toggleAdminSecurityHelp());
backupExportHelpBtn?.addEventListener('click', () => toggleHelpBox(backupExportHelpBtn, backupExportHelpText));
backupImportHelpBtn?.addEventListener('click', () => toggleHelpBox(backupImportHelpBtn, backupImportHelpText));
adminTokenHelpBtn?.addEventListener('click', () => toggleHelpBox(adminTokenHelpBtn, adminTokenHelpText));
adminDisableHelpBtn?.addEventListener('click', () => toggleHelpBox(adminDisableHelpBtn, adminDisableHelpText));
saveAdminTokenBtn?.addEventListener('click', () => saveAdminToken(saveAdminTokenBtn));
disableAdminTokenBtn?.addEventListener('click', () => disableAdminToken(disableAdminTokenBtn));
ttsHelpBtn?.addEventListener('click', () => toggleTtsHelp());
discoveryHelpBtn?.addEventListener('click', () => toggleDiscoveryHelp());
startDiscoveryBtn?.addEventListener('click', () => runDiscoveryAction('start', startDiscoveryBtn));
stopDiscoveryBtn?.addEventListener('click', () => runDiscoveryAction('stop', stopDiscoveryBtn));
refreshTtsDevicesBtn?.addEventListener('click', () => loadTtsDevices(refreshTtsDevicesBtn));
eventSearch?.addEventListener('input', () => renderEvents(allEvents));
eventFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeEventFilter = button.dataset.eventFilter || 'all';
    eventFilterButtons.forEach((item) => item.classList.toggle('active', item === button));
    renderEvents(allEvents);
  });
});
ttsDefaultVolume?.addEventListener('input', () => {
  updateTtsVolumeLabels();
  syncJsonFromForms();
});
ttsAlarmVolume?.addEventListener('input', () => {
  updateTtsVolumeLabels();
  syncJsonFromForms();
});
[ttsDefaultDevices, ttsAllDevices, ttsAlarmDevices].forEach((textarea) => {
  textarea?.addEventListener('input', () => {
    renderTtsDevices();
    updateConfigSectionCounts();
    syncJsonFromForms();
  });
});
document.querySelector('#configView')?.addEventListener('input', () => markConfigDirty());
document.querySelector('#configView')?.addEventListener('change', () => markConfigDirty());
tabButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.tabTarget));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && wizardModal && !wizardModal.hidden) {
    closeWizard();
  }
});

async function load() {
  try {
    const response = await adminFetch('/api/config');
    await ensureOk(response);
    config = await response.json();
    populateForms();
    updateDryRunUi(Boolean(config.loxone?.dryRun));
    await loadTtsStatus();
    await loadTtsDevices();
    await loadAlexaBridgeStatus();
    await loadDiscoveryStatus();
    await loadSetupStatus();
    await loadAdminSecurityStatus();
    await loadDependencyStatus();
    await loadPreflightStatus();
    renderCommands();
    renderCommandEditor();
    renderIntegrations();
    syncJsonFromForms();
    await loadEvents();
    markConfigClean();
    renderDashboard();
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

  Object.entries(groupCommandsByCategory(runnableCommands)).forEach(([category, commands]) => {
    const group = createCategoryGroup(category, commands.length);

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
  try {
    const nextConfig = collectConfigFromForms();
    const validation = validateConfigBeforeSave(nextConfig);
    if (validation.length) {
      showToast(validation[0], 'error');
      focusConfigValidation(validation);
      return;
    }
    setButtonFeedback(button, 'pending', 'Speichert');
    const result = await putJson('/api/config', nextConfig);
    config = result.config;
    populateForms();
    syncJsonFromForms();
    updateDryRunUi(Boolean(config.loxone?.dryRun));
    renderCommands();
    renderCommandEditor();
    await loadTtsStatus();
    await loadTtsDevices();
    await loadAlexaBridgeStatus();
    await loadDiscoveryStatus();
    await loadSetupStatus();
    await loadPreflightStatus();
    renderIntegrations();
    markConfigClean();
    renderDashboard();
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
    const validation = validateConfigBeforeSave(nextConfig);
    if (validation.length) {
      setButtonFeedback(button, 'error', 'Prüfen');
      showToast(validation[0], 'error');
      return;
    }
    const result = await putJson('/api/config', nextConfig);
    config = result.config;
    populateForms();
    syncJsonFromForms();
    updateDryRunUi(Boolean(config.loxone?.dryRun));
    renderCommands();
    renderCommandEditor();
    await loadTtsStatus();
    await loadTtsDevices();
    await loadAlexaBridgeStatus();
    await loadDiscoveryStatus();
    await loadSetupStatus();
    await loadPreflightStatus();
    renderIntegrations();
    markConfigClean();
    renderDashboard();
    setButtonFeedback(button, 'success', 'Gespeichert');
    showToast('JSON gespeichert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function validateConfigBeforeSave(nextConfig) {
  clearFieldValidation();
  const errors = [];
  const loxoneUrl = String(nextConfig.loxone?.baseUrl || '').trim();
  if (!isValidHttpUrl(loxoneUrl)) {
    errors.push('Bitte eine gültige Loxone-Miniserver-URL mit http:// oder https:// eintragen.');
    markInvalid(loxoneBaseUrl);
  }
  const isLiveMode = nextConfig.loxone?.dryRun === false;
  if (isLiveMode && !String(nextConfig.loxone?.username || '').trim()) {
    errors.push('Bitte den Loxone-Benutzer eintragen.');
    markInvalid(loxoneUsername);
  }
  if (isLiveMode && !String(nextConfig.loxone?.password || '').trim()) {
    errors.push('Bitte das Loxone-Passwort eintragen.');
    markInvalid(loxonePassword);
  }
  const commandKeys = Object.keys(nextConfig.commands || {});
  const duplicateLabels = duplicateValues(commandKeys.map((key) => normalizeText(nextConfig.commands?.[key]?.voiceName || nextConfig.commands?.[key]?.label || key)));
  if (duplicateLabels.length) {
    errors.push(`Doppelte Sprach-/Befehlsnamen prüfen: ${duplicateLabels.slice(0, 3).join(', ')}.`);
  }
  if (nextConfig.alexaBridge?.enabled && !Number.isFinite(Number(nextConfig.alexaBridge?.advertisePort))) {
    errors.push('Bitte einen gültigen Alexa/Hue-Port eintragen.');
    markInvalid(alexaBridgeAdvertisePort);
  }
  if (nextConfig.tts?.enabled && !String(nextConfig.tts?.cookieFile || '').trim()) {
    errors.push('Bitte eine Cookie-Datei für Alexa TTS eintragen oder TTS deaktivieren.');
    markInvalid(ttsCookieFile);
  }
  return errors;
}

function clearFieldValidation() {
  document.querySelectorAll('.field-invalid').forEach((element) => element.classList.remove('field-invalid'));
}

function markInvalid(element) {
  element?.classList.add('field-invalid');
}

function focusConfigValidation(errors) {
  const firstInvalid = document.querySelector('.field-invalid');
  if (firstInvalid) {
    showView('configView');
    firstInvalid.closest('details')?.setAttribute('open', '');
    firstInvalid.focus();
  }
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.filter(Boolean).forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function markConfigDirty() {
  if (!config) return;
  configDirty = true;
  renderBackupReminder();
  renderDashboard();
}

function markConfigClean() {
  configDirty = false;
  renderBackupReminder();
}

async function postTtsTest(kind, button) {
  const isAlarm = kind === 'alarm';
  const endpoint = isAlarm ? '/tts/alarm' : '/tts/speak';
  const devices = isAlarm
    ? firstDeviceList(ttsAlarmDevices.value, ttsAllDevices.value, ttsDefaultDevices.value)
    : firstDeviceList(ttsDefaultDevices.value);
  const payload = {
    text: ttsText.value
  };
  if (isAlarm) {
    const volume = Number(ttsAlarmVolume.value);
    if (Number.isFinite(volume)) {
      payload.volume = volume;
    }
  }
  if (devices.length) {
    payload.devices = devices;
  }

  setButtonFeedback(button, 'pending', 'Sendet');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    await ensureOk(response);
    await loadTtsStatus();
    await loadEvents();
    setButtonFeedback(button, 'success', 'Gesendet');
    showToast(isAlarm ? 'Alarm gesendet' : 'TTS gesendet', 'ok');
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
  const response = await adminFetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await ensureOk(response);
  return response.json();
}

async function exportBackup(button) {
  const includeCookie = Boolean(backupIncludeCookie?.checked);
  const url = `/api/backup?includeCookie=${includeCookie ? 'true' : 'false'}`;
  setButtonFeedback(button, 'pending', 'Exportiert');
  try {
    const response = await adminFetch(url, { cache: 'no-store' });
    await ensureOk(response);
    const backupPayload = await response.json();
    if (!isLoxEvoBackupPayload(backupPayload)) {
      throw new Error('Die Serverantwort ist keine gültige LoxEvo-Backup-Datei. Bitte LoxEvo aktualisieren und erneut exportieren.');
    }
    const blob = new Blob([`${JSON.stringify(backupPayload, null, 2)}\n`], { type: 'application/json' });
    downloadBlob(blob, filenameFromResponse(response) || `loxevo-backup-${timestampForFile(new Date())}.json`);
    localStorage.setItem(LAST_BACKUP_EXPORT_KEY, new Date().toISOString());
    configDirty = false;
    renderDashboard();
    await loadEvents();
    setButtonFeedback(button, 'success', 'Exportiert');
    showToast(includeCookie ? 'Backup mit Cookie exportiert' : 'Backup exportiert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function exportDiagnostics(button) {
  setButtonFeedback(button, 'pending', 'Exportiert');
  try {
    const response = await adminFetch('/api/diagnostics', { cache: 'no-store' });
    await ensureOk(response);
    const payload = await response.json();
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    downloadBlob(blob, filenameFromResponse(response) || `loxevo-diagnostics-${timestampForFile(new Date())}.json`);
    await loadEvents();
    setButtonFeedback(button, 'success', 'Exportiert');
    showToast('Diagnose exportiert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function importBackup(button) {
  const file = importBackupFile?.files?.[0];
  if (!file) {
    showToast('Bitte zuerst eine Backup-Datei auswählen', 'error');
    return;
  }

  const ok = window.confirm('Backup importieren? Die aktuelle Konfiguration wird vorher im Datenordner gesichert.');
  if (!ok) return;

  setButtonFeedback(button, 'pending', 'Importiert');
  try {
    const response = await adminFetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: await file.text()
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    config = result.config;
    populateForms();
    syncJsonFromForms();
    updateDryRunUi(Boolean(config.loxone?.dryRun));
    renderCommands();
    renderCommandEditor();
    await loadTtsStatus();
    await loadTtsDevices();
    await loadAlexaBridgeStatus();
    await loadDiscoveryStatus();
    await loadSetupStatus();
    await loadPreflightStatus();
    renderIntegrations();
    await loadEvents();
    if (importBackupFile) importBackupFile.value = '';
    markConfigClean();
    renderDashboard();

    setButtonFeedback(button, 'success', 'Importiert');
    showToast(result.cookieRestored ? 'Backup mit Cookie importiert' : 'Backup importiert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function loadAdminSecurityStatus() {
  if (!adminSecurityStatus) return;
  try {
    const response = await fetch('/api/admin/status', { cache: 'no-store' });
    await ensureOk(response);
    adminSecurityInfo = await response.json();
    renderAdminSecurityStatus();
  } catch (error) {
    adminSecurityInfo = null;
    adminSecurityStatus.className = 'service-status error';
    adminSecurityStatus.textContent = `Admin-Schutz konnte nicht geladen werden: ${error.message}`;
  }
}

function renderAdminSecurityStatus() {
  if (!adminSecurityStatus) return;
  const status = adminSecurityInfo || {};
  adminSecurityStatus.className = status.enabled ? 'service-status ready' : 'service-status disabled';
  adminSecurityStatus.textContent = status.message || 'Admin-Schutz-Status unbekannt.';

  const envManaged = status.enabled && status.source === 'environment';
  if (saveAdminTokenBtn) {
    saveAdminTokenBtn.disabled = Boolean(envManaged);
    saveAdminTokenBtn.textContent = status.enabled ? 'Token ändern' : 'Admin-Schutz aktivieren';
  }
  if (disableAdminTokenBtn) {
    disableAdminTokenBtn.disabled = Boolean(!status.enabled || envManaged);
  }
  if (adminTokenInput) adminTokenInput.disabled = Boolean(envManaged);
  if (adminTokenRepeatInput) adminTokenRepeatInput.disabled = Boolean(envManaged);
}

async function saveAdminToken(button) {
  const token = String(adminTokenInput?.value || '').trim();
  const repeat = String(adminTokenRepeatInput?.value || '').trim();
  if (token.length < 8) {
    showToast('Der Admin-Token muss mindestens 8 Zeichen lang sein.', 'error');
    return;
  }
  if (token !== repeat) {
    showToast('Die eingegebenen Tokens stimmen nicht überein.', 'error');
    return;
  }

  setButtonFeedback(button, 'pending', 'Speichert');
  try {
    const response = await adminFetch('/api/admin/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token })
    });
    await ensureOk(response);
    const result = await response.json();
    adminSecurityInfo = result.status;
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    if (adminTokenInput) adminTokenInput.value = '';
    if (adminTokenRepeatInput) adminTokenRepeatInput.value = '';
    renderAdminSecurityStatus();
    await loadPreflightStatus();
    await loadEvents();
    setButtonFeedback(button, 'success', 'Gespeichert');
    showToast('Admin-Schutz gespeichert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function disableAdminToken(button) {
  if (!window.confirm('Admin-Schutz deaktivieren? Sensible Web-UI-Aktionen sind danach ohne Token erreichbar.')) {
    return;
  }
  setButtonFeedback(button, 'pending', 'Deaktiviert');
  try {
    const response = await adminFetch('/api/admin/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: false })
    });
    await ensureOk(response);
    const result = await response.json();
    adminSecurityInfo = result.status;
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    renderAdminSecurityStatus();
    await loadPreflightStatus();
    await loadEvents();
    setButtonFeedback(button, 'success', 'Deaktiviert');
    showToast('Admin-Schutz deaktiviert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function filenameFromResponse(response) {
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/i);
  return match ? match[1] : '';
}

function isLoxEvoBackupPayload(payload) {
  return Boolean(payload && payload.app && payload.formatVersion && payload.exportedAt && isLoxEvoConfigPayload(payload.config));
}

function isLoxEvoConfigPayload(payload) {
  return Boolean(payload && typeof payload === 'object' && payload.loxone && (payload.commands || payload.rooms));
}

function timestampForFile(date) {
  return date.toISOString().replace(/\D/g, '').slice(0, 14);
}

async function ensureOk(response) {
  if (response.ok) return;
  const payload = await response.json().catch(() => ({}));
  throw new Error(payload.error || `HTTP ${response.status}`);
}

async function adminFetch(url, options = {}) {
  let response = await fetchWithAdminToken(url, options);
  if (response.status !== 401) return response;

  const payload = await response.clone().json().catch(() => ({}));
  if (payload.code !== 'admin_token_required') return response;

  const authenticatedResponse = await requestAdminToken('Bitte den LoxEvo Admin-Token eingeben.', async (token) => {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token.trim());
    const retryResponse = await fetchWithAdminToken(url, options);
    if (retryResponse.status === 401) {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      return { ok: false, message: 'Admin-Token war nicht korrekt. Bitte erneut eingeben.' };
    }
    return { ok: true, response: retryResponse };
  });

  return authenticatedResponse || response;
}

function requestAdminToken(message, verifyToken) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'admin-token-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'adminTokenPromptTitle');

    modal.innerHTML = `
      <form class="admin-token-dialog">
        <div>
          <p class="eyebrow">Admin-Schutz</p>
          <h2 id="adminTokenPromptTitle">Admin-Token erforderlich</h2>
          <p class="admin-token-message"></p>
        </div>
        <label>
          <span>Admin-Token</span>
          <input class="admin-token-input" type="password" autocomplete="current-password">
        </label>
        <div class="actions admin-token-actions">
          <button type="button" class="secondary admin-token-cancel">Abbrechen</button>
          <button type="submit">Entsperren</button>
        </div>
      </form>
    `;

    const form = modal.querySelector('form');
    const messageEl = modal.querySelector('.admin-token-message');
    const input = modal.querySelector('.admin-token-input');
    const cancelButton = modal.querySelector('.admin-token-cancel');
    const submitButton = modal.querySelector('button[type="submit"]');

    const close = (value) => {
      document.body.classList.remove('modal-open');
      modal.remove();
      resolve(value);
    };

    messageEl.textContent = message;
    cancelButton.addEventListener('click', () => close(null));
    modal.addEventListener('click', (event) => {
      if (event.target === modal) close(null);
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const token = input.value.trim();
      if (!token) {
        input.focus();
        return;
      }
      if (!verifyToken) {
        close(token);
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Prüfen...';
      let result;
      try {
        result = await verifyToken(token);
      } catch (error) {
        result = { ok: false, message: error.message || 'Admin-Token konnte nicht geprüft werden.' };
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Entsperren';
      }

      if (result?.ok) {
        close(result.response);
        return;
      }

      messageEl.textContent = result?.message || 'Admin-Token war nicht korrekt. Bitte erneut eingeben.';
      input.value = '';
      input.focus();
    });

    document.body.append(modal);
    document.body.classList.add('modal-open');
    input.focus();
  });
}

function fetchWithAdminToken(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  if (token && !headers.has('X-LoxEvo-Admin-Token')) {
    headers.set('X-LoxEvo-Admin-Token', token);
  }
  return fetch(url, { ...options, headers });
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
  const targets = [ttsConfigStatus].filter(Boolean);
  const { text, className } = ttsStatusView();

  targets.forEach((target) => {
    target.textContent = text;
    target.className = className;
  });
  renderSystemNotice();
}

function ttsStatusView() {
  const status = ttsStatus || { enabled: false, ready: false };
  if (status.enabled && status.ready) {
    return {
      text: `TTS ist bereit. Standard: ${deviceCount(status.defaultDevices)}, Alarm: ${deviceCount(status.alarmDevices)}.`,
      className: 'service-status ready'
    };
  }
  if (status.enabled) {
    return {
      text: humanizeTtsStatusError(status.error),
      className: 'service-status error'
    };
  }
  return {
    text: 'TTS ist deaktiviert.',
    className: 'service-status disabled'
  };
}

async function loadTtsDevices(button) {
  if (!ttsDeviceList) return;
  if (!ttsStatus?.ready) {
    ttsDevices = [];
    renderTtsDevices();
    return;
  }

  if (button) setButtonFeedback(button, 'pending', 'Sucht');
  try {
    const response = await fetch(`/api/tts/devices?ts=${Date.now()}`, { cache: 'no-store' });
    await ensureOk(response);
    const payload = await response.json();
    ttsDevices = Array.isArray(payload.devices) ? payload.devices : [];
    renderTtsDevices();
    if (button) {
      setButtonFeedback(button, 'success', 'Gefunden');
      showToast(`${ttsDevices.length} Alexa-Geräte geladen`, 'ok');
    }
  } catch (error) {
    ttsDevices = [];
    renderTtsDevices(error.message);
    if (button) setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function renderTtsDevices(errorText = '') {
  if (!ttsDeviceList) return;
  updateConfigSectionCounts();

  if (errorText) {
    ttsDeviceList.innerHTML = `<div class="service-status error">${escapeHtml(errorText)}</div>`;
    return;
  }

  if (!ttsStatus?.ready) {
    ttsDeviceList.innerHTML = '<p class="empty">TTS muss bereit sein, bevor Alexa-Geräte geladen werden können.</p>';
    return;
  }

  if (!ttsDevices.length) {
    ttsDeviceList.innerHTML = '<p class="empty">Noch keine Alexa-Geräte geladen. Mit "Alexa-Geräte suchen" wird die Liste aus dem Amazon-Konto abgefragt.</p>';
    return;
  }

  const selected = {
    default: new Set(linesToList(ttsDefaultDevices.value)),
    all: new Set(linesToList(ttsAllDevices.value)),
    alarm: new Set(linesToList(ttsAlarmDevices.value))
  };

  ttsDeviceList.innerHTML = '';
  ttsDevices.forEach((device) => {
    const card = document.createElement('div');
    card.className = 'device-card';

    const title = document.createElement('div');
    title.className = 'device-title';
    const name = document.createElement('strong');
    name.textContent = device.name || device.serial;
    const meta = document.createElement('span');
    meta.textContent = device.type || 'Echo-Gerät';
    title.append(name, meta);

    const serial = document.createElement('code');
    serial.textContent = device.serial;

    const choices = document.createElement('div');
    choices.className = 'device-choices';
    [
      ['default', 'Standard'],
      ['all', 'Alle'],
      ['alarm', 'Alarm']
    ].forEach(([group, label]) => {
      const row = document.createElement('label');
      row.className = 'checkbox-row inline';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selected[group].has(device.serial);
      checkbox.addEventListener('change', () => updateTtsDeviceSelection(group, device.serial, checkbox.checked));
      const text = document.createElement('span');
      text.textContent = label;
      row.append(checkbox, text);
      choices.append(row);
    });

    card.append(title, serial, choices);
    ttsDeviceList.append(card);
  });
}

function updateTtsDeviceSelection(group, serial, enabled) {
  const textarea = {
    default: ttsDefaultDevices,
    all: ttsAllDevices,
    alarm: ttsAlarmDevices
  }[group];
  if (!textarea) return;

  const values = linesToList(textarea.value).filter((value) => value !== serial && !value.includes('replace-with'));
  if (enabled) values.push(serial);
  textarea.value = listToLines([...new Set(values)]);
  updateConfigSectionCounts();
  syncConfigFromForms();
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
    renderDiscoveryStatus();
    renderSystemNotice();
    return;
  }

  if (status.discoveryPaused) {
    alexaBridgeStatus.textContent = status.discoveryPauseReason || 'Alexa-Gerätesuche ist deaktiviert. Vorhandene Geräte können weiter funktionieren.';
    alexaBridgeStatus.className = 'service-status disabled';
    renderAlexaDevices();
    renderDiscoveryStatus();
    renderSystemNotice();
    return;
  }

  if (!status.ready) {
    alexaBridgeStatus.textContent = humanizeAlexaBridgeError(status.error);
    alexaBridgeStatus.className = isDiscoveryPortIssue(status.error) ? 'service-status disabled' : 'service-status error';
    renderAlexaDevices();
    renderDiscoveryStatus();
    renderSystemNotice();
    return;
  }

  if (status.bridgeHttp?.error) {
    alexaBridgeStatus.textContent = status.bridgeHttp.error;
    alexaBridgeStatus.className = 'service-status error';
    renderAlexaDevices();
    renderDiscoveryStatus();
    renderSystemNotice();
    return;
  }

  const ssdpText = status.ssdpPort ? `, SSDP/UDP ${status.ssdpPort}` : '';
  const modeText = status.ssdpMode === 'linux-helper' ? ' per Linux-SSDP-Helper' : '';
  const bridgeHttpText = status.bridgeHttp?.ready ? `, Alexa-HTTP ${status.bridgeHttp.port}` : '';
  alexaBridgeStatus.textContent = `Bereit: ${devices.length} virtuelle Geräte auf ${status.ip}:${status.port}${ssdpText}${bridgeHttpText}${modeText}.`;
  alexaBridgeStatus.className = 'service-status ready';
  renderAlexaDevices();
  renderDiscoveryStatus();
  renderSystemNotice();
}

async function loadDiscoveryStatus() {
  if (!discoveryStatus) return;
  try {
    const response = await fetch(`/api/discovery/status?ts=${Date.now()}`, { cache: 'no-store' });
    await ensureOk(response);
    discoveryInfo = await response.json();
    if (discoveryInfo?.alexaBridge) {
      alexaBridgeInfo = discoveryInfo.alexaBridge;
    }
    renderDiscoveryStatus();
  } catch (error) {
    discoveryInfo = { helper: { available: false, error: error.message }, alexaBridge: alexaBridgeInfo };
    renderDiscoveryStatus();
  }
}

function renderDiscoveryStatus() {
  if (!discoveryStatus) return;
  const bridge = discoveryInfo?.alexaBridge || alexaBridgeInfo || {};
  const helper = discoveryInfo?.helper || {};
  const enabled = bridge.enabled ?? config?.alexaBridge?.enabled;

  if (startDiscoveryBtn) startDiscoveryBtn.disabled = true;
  if (stopDiscoveryBtn) stopDiscoveryBtn.disabled = true;

  if (!enabled) {
    discoveryStatus.textContent = 'Gerätesuche ist deaktiviert, weil virtuelle Alexa-Geräte deaktiviert sind.';
    discoveryStatus.className = 'service-status disabled';
    return;
  }

  if (bridge.ready) {
    discoveryStatus.textContent = 'Gerätesuche aktiv. Alexa kann neue virtuelle Geräte finden. Nach der Suche bitte wieder beenden.';
    discoveryStatus.className = 'service-status ready';
    if (stopDiscoveryBtn) stopDiscoveryBtn.disabled = !helper.available;
    return;
  }

  if (bridge.discoveryPaused) {
    const portText = describeDiscoveryPortOwner(helper.portOwner);
    discoveryStatus.textContent = `Gerätesuche ist beendet. ${portText} Vorhandene Alexa-Geräte können weiter funktionieren.`;
    discoveryStatus.className = 'service-status disabled';
    if (startDiscoveryBtn) startDiscoveryBtn.disabled = !helper.available;
    return;
  }

  if (!helper.available) {
    discoveryStatus.textContent = 'Host-Helper ist nicht installiert oder nicht erreichbar. Nur für neue Gerätesuche bei belegtem UDP 1900 nötig; der Info-Button zeigt den einmaligen Installationsbefehl.';
    discoveryStatus.className = 'service-status disabled';
    return;
  }

  discoveryStatus.textContent = 'Gerätesuche ist nicht aktiv. Mit dem Button kann LoxEvo den LoxBerry-SSDP-Dienst kurz pausieren und die Suche starten.';
  discoveryStatus.className = 'service-status disabled';
  if (startDiscoveryBtn) startDiscoveryBtn.disabled = false;
}

function describeDiscoveryPortOwner(portOwner = '') {
  const text = String(portOwner || '').toLowerCase();
  if (!text) {
    return 'UDP 1900 ist aktuell nicht durch LoxEvo reserviert.';
  }
  if (text.includes('loxevo-ssdp')) {
    return 'UDP 1900 ist aktuell durch LoxEvo belegt.';
  }
  if (text.includes('ssdpd') || text.includes('lbssdpd') || text.includes('/opt/loxberry/sbin/ssdpd') || text.includes('perl')) {
    return 'UDP 1900 ist wieder durch den LoxBerry-SSDP-Dienst belegt.';
  }
  return 'UDP 1900 ist durch einen anderen SSDP-Dienst belegt.';
}

async function runDiscoveryAction(action, button) {
  const successLabel = action === 'start' ? 'Aktiviert' : 'Beendet';
  setButtonFeedback(button, 'pending', action === 'start' ? 'Startet' : 'Stoppt');
  try {
    const response = await fetch(`/api/discovery/${action}`, { method: 'POST' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    discoveryInfo = payload.discovery || null;
    if (!discoveryInfo) {
      await loadDiscoveryStatus();
    }
    if (discoveryInfo?.alexaBridge) {
      alexaBridgeInfo = discoveryInfo.alexaBridge;
    }
    renderAlexaBridgeStatus();
    await loadAlexaBridgeStatus();
    await loadDiscoveryStatus();
    await loadSetupStatus();
    await loadPreflightStatus();
    await loadEvents();
    renderDashboard();
    if (wizardModal && !wizardModal.hidden) renderWizard();
    setButtonFeedback(button, 'success', successLabel);
    showToast(action === 'start' ? 'Gerätesuche aktiviert' : 'Gerätesuche beendet', 'ok');
  } catch (error) {
    await loadDiscoveryStatus();
    await loadAlexaBridgeStatus();
    await loadSetupStatus();
    await loadPreflightStatus();
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function renderSystemNotice() {
  if (!systemNotice) return;

  const issues = [];
  if (ttsStatus?.enabled && !ttsStatus.ready) {
    issues.push({
      level: 'error',
      title: 'Alexa TTS ist nicht bereit',
      text: humanizeTtsStatusError(ttsStatus.error)
    });
  }

  if (alexaBridgeInfo?.enabled) {
    const discoveryPortIssue = !alexaBridgeInfo.ready && isDiscoveryPortIssue(alexaBridgeInfo.error);
    if (alexaBridgeInfo.bridgeHttp?.error) {
      issues.push({
        level: 'error',
        title: 'Alexa-Geräte sind nicht bereit',
        text: alexaBridgeInfo.bridgeHttp.error
      });
    } else if (alexaBridgeInfo.discoveryPaused || discoveryPortIssue) {
      issues.push({
        level: 'info',
        title: '',
        text: 'Virtuelle Alexa-Geräte sind aktiviert und funktionsfähig. SSDP/UDP 1900 ist aktuell aber belegt. Für das Suchen und Hinzufügen neuer Geräte unter Konfiguration -> Alexa-Gerätesuche aktivieren.',
        help: 'SSDP/UDP 1900 wird nur für das Suchen und Hinzufügen neuer virtueller Alexa-Geräte benötigt. Für den normalen Betrieb und für bereits gefundene Geräte ist ein belegter Port 1900 kein Problem. Wenn neue Geräte hinzugefügt werden sollen: Konfiguration -> Alexa-Gerätesuche öffnen, Gerätesuche aktivieren, in der Alexa-App Geräte suchen und danach die Gerätesuche wieder beenden. So wird der Zugriff auf SSDP/UDP 1900 nur temporär genutzt und anschliessend wieder an die andere Anwendung zurückgegeben.'
      });
    } else if (!alexaBridgeInfo.ready) {
      issues.push({
        level: 'error',
        title: 'Alexa-Gerätesuche ist nicht bereit',
        text: humanizeAlexaBridgeError(alexaBridgeInfo.error)
      });
    }
  }

  if (!issues.length) {
    systemNotice.hidden = true;
    systemNotice.innerHTML = '';
    return;
  }

  systemNotice.hidden = false;
  systemNotice.className = issues.some((issue) => issue.level === 'error') ? 'system-notice error wide' : 'system-notice info wide';
  systemNotice.innerHTML = '';
  issues.forEach((issue) => {
    const item = document.createElement('div');
    item.className = 'system-notice-item';

    const main = document.createElement('div');
    main.className = 'system-notice-main';
    if (issue.title) {
      const title = document.createElement('strong');
      title.textContent = issue.title;
      main.append(title);
    }
    const text = document.createElement('p');
    text.textContent = issue.text || '';
    main.append(text);
    item.append(main);

    if (issue.help) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'info-button system-notice-info-button';
      button.textContent = 'i';
      button.title = 'Hinweis erklären';
      button.setAttribute('aria-label', 'Hinweis erklären');
      button.setAttribute('aria-expanded', 'false');

      const help = document.createElement('p');
      help.className = 'system-notice-help';
      help.textContent = issue.help;
      help.hidden = true;

      button.addEventListener('click', () => {
        help.hidden = !help.hidden;
        button.setAttribute('aria-expanded', String(!help.hidden));
      });

      item.append(button, help);
    }

    systemNotice.append(item);
  });
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
  if (isDiscoveryPortIssue(text)) {
    return 'SSDP/UDP-Port 1900 konnte nicht geöffnet werden. Der Port ist vermutlich durch LoxBerry-ssdpd oder einen anderen SSDP-Dienst belegt. Vorhandene Alexa-Geräte funktionieren weiter; für neue Geräte muss die Gerätesuche kurz aktiviert werden.';
  }
  return `Alexa-Geräte sind aktiviert, aber noch nicht bereit: ${text || 'Status unbekannt'}`;
}

function isDiscoveryPortIssue(errorText = '') {
  const lower = String(errorText || '').toLowerCase();
  return lower.includes('1900') && (
    lower.includes('eaddrinuse') ||
    lower.includes('bind udp 1900 failed') ||
    lower.includes('address in use') ||
    lower.includes('ssdp/udp-port 1900')
  );
}

function toggleTtsHelp() {
  toggleHelpBox(ttsHelpBtn, ttsHelpText);
}

function toggleBackupHelp() {
  toggleHelpBox(backupHelpBtn, backupHelpText);
}

function toggleAdminSecurityHelp() {
  toggleHelpBox(adminSecurityHelpBtn, adminSecurityHelpText);
}

function toggleDiscoveryHelp() {
  toggleHelpBox(discoveryHelpBtn, discoveryHelpText);
}

function toggleHelpBox(button, helpText) {
  if (!button || !helpText) return;
  const nextHidden = !helpText.hidden;
  helpText.hidden = nextHidden;
  button.setAttribute('aria-expanded', String(!nextHidden));
}

function showView(viewId) {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tabTarget === viewId);
  });
  views.forEach((view) => {
    view.classList.toggle('active', view.id === viewId);
  });
  closeDetailsInView(viewId);
  if (viewId === 'eventsView') {
    loadEvents();
  }
  if (viewId === 'dashboardView') {
    renderDashboard();
    loadPreflightStatus();
  }
  if (viewId === 'maintenanceView') {
    loadPreflightStatus();
    loadAdminSecurityStatus();
    loadDependencyStatus();
  }
}

function closeDetailsInView(viewId) {
  const view = document.getElementById(viewId);
  view?.querySelectorAll('details[open]').forEach((details) => {
    details.open = false;
  });
}

async function loadPreflightStatus(button) {
  if (!preflightSummary || !preflightChecks) return;
  if (button) setButtonFeedback(button, 'pending', 'Prüft');
  preflightSummary.textContent = 'Systemprüfung läuft...';
  preflightSummary.className = 'service-status';
  try {
    const response = await fetch(`/api/preflight?ts=${Date.now()}`, { cache: 'no-store' });
    await ensureOk(response);
    const payload = await response.json();
    preflightInfo = isValidPreflightPayload(payload) ? payload : buildClientPreflightStatus();
    renderPreflightStatus();
    if (button) {
      setButtonFeedback(button, 'success', 'Geprüft');
      showToast('Systemprüfung aktualisiert', 'ok');
    }
  } catch (error) {
    const fallback = buildClientPreflightStatus();
    if (fallback) {
      preflightInfo = fallback;
      renderPreflightStatus();
      if (button) {
        setButtonFeedback(button, 'success', 'Geladen');
        showToast('Systemprüfung mit lokalen Statusdaten geladen', 'ok');
      }
    } else {
      preflightInfo = null;
      preflightSummary.textContent = `Systemprüfung konnte nicht geladen werden: ${error.message}`;
      preflightSummary.className = 'service-status error';
      preflightChecks.innerHTML = '';
      if (button) {
        setButtonFeedback(button, 'error', 'Fehler');
        showToast(error.message, 'error');
      }
    }
  }
}

function isValidPreflightPayload(payload) {
  return Boolean(payload && Array.isArray(payload.sections) && payload.sections.length);
}

function buildClientPreflightStatus() {
  if (!config) return null;
  const activeCommandCount = Object.keys(getRunnableCommands()).length;
  const tts = ttsStatus || { enabled: Boolean(config.tts?.enabled), ready: false };
  const bridge = alexaBridgeInfo || { enabled: Boolean(config.alexaBridge?.enabled), ready: false, deviceCount: activeCommandCount };
  const helper = discoveryInfo?.helper || {};
  const sections = [
    {
      title: 'LoxEvo',
      checks: [
        preflightRow('info', 'Web-UI und API', `Web-UI läuft auf Port ${config.server?.port || 8080}.`),
        preflightRow('info', 'Diagnosequelle', 'Server-Details konnten nicht geladen werden; diese Ansicht nutzt den lokalen Browserstatus.'),
        preflightRow('info', 'Ports', `Web-UI/API ${config.server?.port || 8080}, Alexa/Hue ${config.alexaBridge?.advertisePort || 80}.`),
        preflightRow(adminSecurityInfo?.enabled ? 'ok' : 'info', 'Admin-Schutz', adminSecurityInfo?.message || 'Admin-Schutz-Status wurde noch nicht geladen.')
      ]
    },
    {
      title: 'Loxone',
      checks: [
        preflightRow(config.loxone?.baseUrl ? 'ok' : 'error', 'Miniserver URL', config.loxone?.baseUrl ? 'Miniserver-URL ist eingetragen.' : 'Miniserver-URL fehlt.'),
        preflightRow(config.loxone?.username && config.loxone?.password ? 'ok' : 'error', 'Zugangsdaten', config.loxone?.username && config.loxone?.password ? 'Benutzer und Passwort sind eingetragen.' : 'Benutzer oder Passwort fehlen.'),
        preflightRow(activeCommandCount ? 'ok' : 'warning', 'Befehle', activeCommandCount ? `${activeCommandCount} aktive Befehle vorhanden.` : 'Noch keine aktiven Befehle vorhanden.'),
        preflightRow('info', 'Betriebsmodus', config.loxone?.dryRun !== false ? 'Dry-Run ist aktiv.' : 'Live-Modus ist aktiv.')
      ]
    },
    {
      title: 'Alexa TTS',
      checks: [
        preflightRow(config.tts?.enabled ? (tts.ready ? 'ok' : 'error') : 'optional', 'Alexa-Verbindung', tts.enabled ? (tts.ready ? 'Alexa TTS ist bereit.' : humanizeTtsStatusError(tts.error)) : 'TTS ist deaktiviert.'),
        preflightRow(config.tts?.enabled ? 'info' : 'optional', 'Cookie-Datei', config.tts?.cookieFile ? `Konfigurierter Pfad: ${config.tts.cookieFile}.` : 'Keine Cookie-Datei konfiguriert.'),
        preflightRow(config.tts?.enabled ? (deviceListCount(tts.defaultDevices) ? 'ok' : 'warning') : 'optional', 'Standard-Geräte', deviceListCount(tts.defaultDevices) ? `${deviceListCount(tts.defaultDevices)} Standard-Gerät(e) konfiguriert.` : 'Kein Standard-Gerät ausgewählt.'),
        preflightRow(config.tts?.enabled ? 'info' : 'optional', 'Lautstärke', `Standard ${tts.defaultVolume ?? config.tts?.defaultVolume ?? 40}%, Alarm ${tts.alarmVolume ?? config.tts?.alarmVolume ?? 100}%.`),
        preflightRow(config.tts?.enabled ? (tts.nativeSequences ? 'ok' : 'info') : 'optional', 'TTS-Sequenzen', tts.nativeSequences ? 'Native Alexa-Sequenzen sind aktiv.' : 'Native Sequenzen konnten lokal nicht bestätigt werden.')
      ]
    },
    {
      title: 'Virtuelle Alexa-Geräte',
      checks: [
        preflightRow(config.alexaBridge?.enabled ? (bridge.bridgeHttp?.error ? 'error' : 'ok') : 'optional', 'Alexa/Hue-HTTP', bridge.bridgeHttp?.error || (config.alexaBridge?.enabled ? `Alexa/Hue-Port ${bridge.bridgeHttp?.port || bridge.port || config.alexaBridge?.advertisePort || 80}.` : 'Virtuelle Alexa-Geräte sind deaktiviert.')),
        preflightRow(config.alexaBridge?.enabled ? (bridge.ready ? 'ok' : 'optional') : 'optional', 'Gerätesuche', bridge.ready ? 'Gerätesuche ist aktiv.' : 'Gerätesuche ist aktuell nicht aktiv. Vorhandene Geräte können weiter funktionieren.'),
        preflightRow(config.alexaBridge?.enabled ? (Number(bridge.deviceCount || activeCommandCount) ? 'ok' : 'warning') : 'optional', 'Virtuelle Geräte', `${Number(bridge.deviceCount || activeCommandCount)} virtuelle Geräte/Befehle vorbereitet.`),
        preflightRow(helper.available ? 'ok' : 'optional', 'Discovery-Helper', helper.available ? 'Host-Helper ist erreichbar.' : 'Host-Helper ist nur für neue Gerätesuche bei belegtem UDP 1900 nötig.'),
        preflightRow(config.alexaBridge?.enabled ? 'info' : 'optional', 'Bridge-Info', `Name ${config.alexaBridge?.name || 'LoxEvo'}, Alexa/Hue-Port ${bridge.port || config.alexaBridge?.advertisePort || 80}.`)
      ]
    },
    {
      title: 'Backup',
      checks: [
        preflightRow('info', 'Export und Import', 'Backup-Funktion ist in der Web-UI verfügbar.'),
        preflightRow('info', 'Lokale Sicherungen', 'Details zu vorhandenen Sicherungsdateien kommen aus der Server-Systemprüfung.'),
        preflightRow('info', 'Alexa-Cookie', 'Die Cookie-Datei wird nur exportiert, wenn der Haken beim Backup gesetzt ist.')
      ]
    }
  ];
  return {
    checkedAt: new Date().toISOString(),
    summary: {
      ...summarizePreflightForClient(sections),
      text: 'Systemprüfung mit lokalen Statusdaten geladen.'
    },
    sections
  };
}

function preflightRow(level, label, detail) {
  return { level, label, detail };
}

function summarizePreflightForClient(sections) {
  const counts = sections.flatMap((section) => section.checks || []).reduce((result, check) => {
    result[check.level] = (result[check.level] || 0) + 1;
    return result;
  }, {});
  const level = counts.error ? 'error' : counts.warning ? 'warning' : 'ok';
  const text = counts.error
    ? `${counts.error} kritische Prüfung(en) offen.`
    : counts.warning
      ? `${counts.warning} Hinweis(e) prüfen.`
      : 'Systemprüfung abgeschlossen.';
  return { level, text, counts };
}

function deviceListCount(values) {
  return Array.isArray(values) ? values.filter((value) => value && !String(value).includes('replace-with')).length : 0;
}

function setCountBadge(element, count) {
  if (!element) return;
  const safeCount = Number.isFinite(Number(count)) ? Math.max(0, Number(count)) : 0;
  element.textContent = String(safeCount);
  element.setAttribute('aria-label', `${safeCount} Einträge`);
}

function updateConfigSectionCounts() {
  setCountBadge(configCommandsCount, Object.keys(getConfiguredCommands()).length);
  setCountBadge(configTtsDevicesCount, uniqueTtsDeviceSelectionCount());
}

function uniqueTtsDeviceSelectionCount() {
  return new Set([
    ...linesToDeviceList(ttsDefaultDevices?.value || ''),
    ...linesToDeviceList(ttsAllDevices?.value || ''),
    ...linesToDeviceList(ttsAlarmDevices?.value || '')
  ]).size;
}

function renderPreflightStatus() {
  if (!preflightSummary || !preflightChecks || !preflightInfo) return;
  const summary = preflightInfo.summary || {};
  const counts = summary.counts || {};
  const sections = preflightInfo.sections || [];
  if (!sections.length) {
    preflightSummary.textContent = 'Systemprüfung konnte keine Detaildaten laden. Bitte LoxEvo neu starten oder die Seite aktualisieren.';
    preflightSummary.className = 'service-status warning';
    preflightChecks.innerHTML = '<p class="empty">Keine Prüfpunkte vorhanden.</p>';
    return;
  }
  const countText = [
    `${counts.ok || 0} OK`,
    `${counts.warning || 0} prüfen`,
    `${counts.optional || 0} optional`,
    `${counts.error || 0} Fehler`
  ].join(' · ');

  preflightSummary.textContent = `${summary.text || 'Systemprüfung abgeschlossen.'} ${countText}. Geprüft: ${formatDateTime(preflightInfo.checkedAt)}.`;
  preflightSummary.className = `service-status ${preflightServiceClass(summary.level)}`;
  preflightChecks.innerHTML = '';

  sections.forEach((section) => {
    const card = document.createElement('details');
    card.className = 'preflight-section';
    card.open = false;

    const summaryEl = document.createElement('summary');
    const title = document.createElement('strong');
    title.textContent = section.title || 'Prüfung';
    const sectionMeta = document.createElement('span');
    sectionMeta.className = 'preflight-section-meta';
    sectionMeta.textContent = sectionStatusText(section);
    const badge = document.createElement('span');
    badge.className = 'count-badge';
    badge.textContent = String((section.checks || []).length);
    summaryEl.append(title, sectionMeta, badge);

    const body = document.createElement('div');
    body.className = 'preflight-section-body';
    (section.checks || []).forEach((check) => {
      const row = document.createElement('div');
      row.className = `preflight-check ${check.level || 'info'}`;

      const marker = document.createElement('span');
      marker.className = 'preflight-marker';
      marker.textContent = preflightLevelLabel(check.level);

      const content = document.createElement('div');
      content.className = 'preflight-check-content';
      const titleRow = document.createElement('div');
      titleRow.className = 'preflight-check-title';
      const label = document.createElement('strong');
      label.textContent = check.label || 'Prüfung';
      const helpText = preflightHelpText(section.title, check);
      const helpButton = document.createElement('button');
      helpButton.type = 'button';
      helpButton.className = 'info-button preflight-info-button';
      helpButton.textContent = 'i';
      helpButton.title = 'Prüfung erklären';
      helpButton.setAttribute('aria-label', `${check.label || 'Prüfung'} erklären`);
      helpButton.setAttribute('aria-expanded', 'false');
      const detail = document.createElement('p');
      detail.textContent = check.detail || '';
      const help = document.createElement('p');
      help.className = 'preflight-help';
      help.textContent = helpText;
      help.hidden = true;
      helpButton.addEventListener('click', () => {
        help.hidden = !help.hidden;
        helpButton.setAttribute('aria-expanded', String(!help.hidden));
      });
      titleRow.append(label, helpButton);
      content.append(titleRow, detail, help);

      row.append(marker, content);
      body.append(row);
    });

    card.append(summaryEl, body);
    preflightChecks.append(card);
  });
  renderDashboard();
}

function sectionStatusText(section) {
  const checks = section.checks || [];
  const counts = checks.reduce((result, check) => {
    result[check.level] = (result[check.level] || 0) + 1;
    return result;
  }, {});
  if (counts.error) return `${counts.error} Fehler`;
  if (counts.warning) return `${counts.warning} prüfen`;
  if (counts.optional && !counts.ok && !counts.info) return `${counts.optional} optional`;
  const pieces = [];
  if (counts.ok) pieces.push(`${counts.ok} OK`);
  if (counts.info) pieces.push(`${counts.info} Info`);
  if (counts.optional) pieces.push(`${counts.optional} optional`);
  return pieces.join(' · ') || 'Keine Prüfpunkte';
}

function preflightServiceClass(level) {
  if (level === 'error') return 'error';
  if (level === 'warning') return 'warning';
  return 'ready';
}

function preflightLevelLabel(level) {
  if (level === 'ok') return 'OK';
  if (level === 'error') return 'Fehler';
  if (level === 'warning') return 'Prüfen';
  if (level === 'optional') return 'Optional';
  return 'Info';
}

function preflightHelpText(sectionTitle = '', check = {}) {
  const label = check.label || 'Prüfung';
  const key = `${sectionTitle}|${label}`;
  const help = {
    'LoxEvo|Web-UI und API': 'Prüft, ob die LoxEvo-Weboberfläche und API grundsätzlich erreichbar sind und auf welchem Port sie laufen.',
    'LoxEvo|Version': 'Zeigt die lokal laufende LoxEvo-Version und, falls verfügbar, den Git-Commit. Das hilft beim Abgleich mit GitHub oder Support-Hinweisen.',
    'LoxEvo|Laufzeit': 'Zeigt, seit wann der aktuelle Prozess läuft und mit welcher Node.js-Version er gestartet wurde. Nach einem Neustart beginnt diese Laufzeit neu.',
    'LoxEvo|Konfiguration lesbar': 'Prüft, ob LoxEvo die gespeicherte Konfigurationsdatei lesen kann. Ohne diese Datei kann die Oberfläche keine Einstellungen laden.',
    'LoxEvo|Datenordner beschreibbar': 'Prüft, ob LoxEvo im Datenordner schreiben darf. Das ist nötig für Speichern, Backup, Import-Sicherung und Cookie-Dateien.',
    'LoxEvo|Admin-Schutz': 'Zeigt, ob sensible Web-UI-Aktionen durch einen Admin-Token geschützt sind. Alexa-/Hue-Bridge, Loxone-Befehle und TTS-Aufrufe bleiben bewusst offen, damit bestehende Automationen weiter funktionieren.',
    'LoxEvo|Datenhaltung': 'Erklärt, wo LoxEvo seine persistenten Daten erwartet. Docker-Neustarts sind unkritisch, solange dieser Datenordner erhalten bleibt.',
    'LoxEvo|Diagnosequelle': 'Dieser Hinweis erscheint nur, wenn Detaildaten vom Server nicht geladen wurden und die Weboberfläche auf lokale Browserdaten zurückfällt.',
    'LoxEvo|Ports': 'Zeigt die wichtigsten Ports aus der Konfiguration: Web-UI/API und den separaten Alexa/Hue-Port für virtuelle Geräte.',
    'Loxone|Miniserver URL': 'Prüft, ob eine echte Miniserver-Adresse eingetragen ist und kein Beispielwert verwendet wird.',
    'Loxone|Zugangsdaten': 'Prüft nur, ob Benutzer und Passwort eingetragen sind. Es wird kein Login-Test gegen den Miniserver ausgeführt.',
    'Loxone|Befehle': 'Prüft, ob aktive Befehle vollständig genug konfiguriert sind, damit daraus Loxone-Aufrufe gebaut werden können.',
    'Loxone|Betriebsmodus': 'Zeigt, ob Loxone-Befehle nur simuliert werden oder im Live-Modus wirklich an den Miniserver gesendet werden.',
    'Loxone|Letzter Loxone-Befehl': 'Zeigt den letzten Loxone-Befehl seit dem letzten LoxEvo-Start. Nach einem Neustart ist diese Historie leer.',
    'Alexa TTS|Alexa-Verbindung': 'Prüft, ob die lokale alexa-remote2-Verbindung bereit ist. Nur dann kann LoxEvo Sprachausgaben an Echo-Geräte senden.',
    'Alexa TTS|alexa-remote2': 'Prüft, ob das npm-Paket alexa-remote2 lokal installiert ist. Dieses Paket wird für Alexa-TTS benötigt.',
    'Alexa TTS|Cookie-Datei': 'Prüft, ob die konfigurierte Amazon-Cookie-Datei lesbar ist. Der Inhalt wird nicht angezeigt.',
    'Alexa TTS|Standard-Geräte': 'Prüft, ob mindestens ein Echo-Gerät für normale Sprachausgaben ausgewählt ist.',
    'Alexa TTS|Alarm-Geräte': 'Prüft, ob eigene Alarm-Geräte konfiguriert sind. Falls nicht, nutzt LoxEvo die vorhandene TTS-Geräteauswahl als Fallback.',
    'Alexa TTS|Lautstärke': 'Zeigt die konfigurierten Lautstärken für normale TTS-Ausgaben und Alarm-Ausgaben.',
    'Alexa TTS|TTS-Sequenzen': 'Zeigt, ob LoxEvo native Alexa-Sequenzen nutzt. Dieser Modus ist für schnelle Sprachausgabe mit Lautstärke wichtig.',
    'Alexa TTS|Letzte TTS-Aktion': 'Zeigt die letzte TTS-, Alarm- oder Lautstärkeaktion seit dem letzten Start.',
    'Virtuelle Alexa-Geräte|Alexa/Hue-HTTP': 'Prüft, ob der lokale Hue-kompatible HTTP-Endpunkt für Alexa läuft. Neuere Echo-Geräte erwarten dafür meist Port 80.',
    'Virtuelle Alexa-Geräte|Gerätesuche': 'Prüft den SSDP/UDP-1900-Status. Dieser Port wird nur für das Suchen und Hinzufügen neuer virtueller Alexa-Geräte benötigt. Für den normalen Betrieb und für bereits gefundene Geräte ist ein belegter Port 1900 kein Problem. Wenn neue Geräte hinzugefügt werden sollen: unter Konfiguration -> Alexa-Gerätesuche kurz aktivieren, in der Alexa-App Geräte suchen und danach die Gerätesuche wieder beenden. Dadurch wird der Zugriff auf SSDP/UDP 1900 nur temporär genutzt und anschliessend wieder an die andere Anwendung zurückgegeben.',
    'Virtuelle Alexa-Geräte|Virtuelle Geräte': 'Zeigt, wie viele aktive LoxEvo-Befehle Alexa als virtuelle Geräte angeboten werden.',
    'Virtuelle Alexa-Geräte|Discovery-Helper': 'Prüft, ob der optionale Host-Helper für die Gerätesuche erreichbar ist. Er wird nur benötigt, wenn UDP 1900 durch LoxBerry oder einen anderen Dienst belegt ist.',
    'Virtuelle Alexa-Geräte|Bridge-Info': 'Zeigt technische Basisdaten der lokalen Hue-Bridge-Emulation, zum Beispiel Bridge-ID, Description-URL und Ports.',
    'Virtuelle Alexa-Geräte|Letzte Alexa-Aktion': 'Zeigt die letzte Alexa-Geräteaktion oder Gerätesuche-Aktion seit dem letzten Start.',
    'Backup|Export und Import': 'Prüft, ob der Datenordner grundsätzlich für Backup-Export und Import-Sicherung nutzbar ist.',
    'Backup|Lokale Sicherungen': 'Zeigt, ob LoxEvo im Datenordner vorhandene Sicherungsdateien findet.',
    'Backup|Alexa-Cookie': 'Erinnert daran, dass das Amazon-Cookie nur exportiert wird, wenn der Backup-Haken ausdrücklich gesetzt ist.',
    'Backup|Letzte Backup-Aktion': 'Zeigt den letzten Backup-Export oder Import seit dem letzten Start.'
  };
  const statusText = preflightLevelMeaning(check.level);
  return `${help[key] || `Erklärt den Prüfpunkt "${label}" im Bereich "${sectionTitle || 'Systemprüfung'}".`} ${statusText}`;
}

function preflightLevelMeaning(level) {
  if (level === 'ok') return 'Status OK bedeutet: Der Prüfpunkt ist für den aktuellen Betrieb erfüllt.';
  if (level === 'error') return 'Status Fehler bedeutet: Dieser Punkt sollte geprüft werden, weil eine Funktion wahrscheinlich nicht oder nur teilweise funktioniert.';
  if (level === 'warning') return 'Status Prüfen bedeutet: Die Grundfunktion kann laufen, aber die Einstellung sollte kontrolliert werden.';
  if (level === 'optional') return 'Status Optional bedeutet: Für den aktuellen Betrieb nicht zwingend kritisch, aber für die genannte Zusatzfunktion relevant.';
  return 'Status Info bedeutet: Reine Zustandsinformation ohne akuten Handlungsbedarf.';
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
    const response = await adminFetch(`/api/dependencies/${encodeURIComponent(name)}/update`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ version })
    });
    await ensureOk(response);
    dependencyInfo = await response.json();
    renderDependencyStatus();
    await loadPreflightStatus();
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
    const response = await adminFetch('/api/system/restart', { method: 'POST' });
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
    await loadPreflightStatus();
    await loadEvents();
    renderDashboard();
    if (wizardModal && !wizardModal.hidden) renderWizard();
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
    ? setupStatus.dryRun
      ? 'Die Basiskonfiguration ist vollständig. Dry-Run ist für erste Tests aktiv.'
      : 'Die Basiskonfiguration ist vollständig. Live-Modus ist aktiv.'
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

async function refreshDashboard(button) {
  if (button) setButtonFeedback(button, 'pending', 'Lädt');
  try {
    await loadTtsStatus();
    await loadAlexaBridgeStatus();
    await loadDiscoveryStatus();
    await loadSetupStatus();
    await loadAdminSecurityStatus();
    await loadPreflightStatus();
    await loadEvents();
    renderDashboard();
    if (button) {
      setButtonFeedback(button, 'success', 'Aktualisiert');
      showToast('Übersicht aktualisiert', 'ok');
    }
  } catch (error) {
    if (button) setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function renderDashboard() {
  if (!dashboardCards) return;
  const rows = [
    dashboardStatusRow('Loxone', config?.loxone?.dryRun === false ? 'Live-Modus' : 'Dry-Run', config?.loxone?.dryRun === false ? 'ok' : 'info', config?.loxone?.dryRun === false ? 'Befehle werden an den Miniserver gesendet.' : 'Befehle werden nur protokolliert.', 'Zeigt, ob LoxEvo echte Befehle an den Loxone-Miniserver sendet. Dry-Run ist für Tests gedacht und protokolliert nur. Live-Modus ist für den produktiven Betrieb, sobald die Befehle geprüft sind.'),
    dashboardStatusRow('Alexa TTS', ttsStatus?.ready ? 'Bereit' : config?.tts?.enabled ? 'Prüfen' : 'Deaktiviert', ttsStatus?.ready ? 'ok' : config?.tts?.enabled ? 'warning' : 'info', ttsStatus?.ready ? `${deviceListCount(ttsStatus.defaultDevices)} Standard-Gerät(e).` : humanizeTtsStatusError(ttsStatus?.error || ''), 'Zeigt den Status der Alexa-Sprachausgabe. Bereit bedeutet, dass alexa-remote2 verbunden ist und LoxEvo die konfigurierten Echo-Geräte für normale TTS- oder Alarmmeldungen verwenden kann.'),
    dashboardStatusRow('Virtuelle Alexa-Geräte', alexaBridgeInfo?.bridgeHttp?.ready ? 'Bereit' : config?.alexaBridge?.enabled ? 'HTTP prüfen' : 'Deaktiviert', alexaBridgeInfo?.bridgeHttp?.ready ? 'ok' : config?.alexaBridge?.enabled ? 'warning' : 'info', `${alexaBridgeInfo?.deviceCount ?? 0} Gerät(e), Alexa/Hue-Port ${alexaBridgeInfo?.port || config?.alexaBridge?.advertisePort || 80}.`, 'Zeigt, ob LoxEvo die lokalen Hue-kompatiblen Geräte für Alexa bereitstellt. Diese Funktion ist für Sprachbefehle wie Licht ein oder aus zuständig und läuft unabhängig von Alexa TTS.'),
    dashboardStatusRow('Gerätesuche', alexaBridgeInfo?.ready ? 'Aktiv' : config?.alexaBridge?.enabled ? 'Optional' : 'Deaktiviert', alexaBridgeInfo?.ready ? 'ok' : config?.alexaBridge?.enabled ? 'optional' : 'info', alexaBridgeInfo?.ready ? 'Neue Geräte können gesucht werden.' : 'Für bestehende Geräte normalerweise nicht kritisch.', 'SSDP/UDP 1900 wird nur für das Suchen und Hinzufügen neuer virtueller Alexa-Geräte benötigt. Bereits gefundene Geräte funktionieren normalerweise weiter. Für neue Geräte unter Konfiguration die Alexa-Gerätesuche kurz aktivieren, in der Alexa-App suchen und danach wieder beenden.'),
    dashboardStatusRow('Backup', backupStateTitle(), backupReminderLevel(), backupStateDetail(), 'Zeigt, ob seit den letzten Änderungen ein Export der LoxEvo-Einstellungen empfohlen ist. Backups enthalten die Konfiguration; die Alexa-Cookie-Datei wird nur gesichert, wenn du sie beim Export bewusst einschliesst.'),
    dashboardStatusRow('Admin-Schutz', adminSecurityInfo?.enabled ? 'Aktiv' : 'Inaktiv', adminSecurityInfo?.enabled ? 'ok' : 'info', adminSecurityInfo?.message || 'Status wird geladen.', 'Zeigt, ob sensible Web-UI-Aktionen wie Konfiguration, Backup, Restore, Neustart oder Protokoll löschen mit einem Admin-Token geschützt sind. Loxone-Befehle, TTS und Alexa/Hue-Endpunkte bleiben bewusst offen für lokale Automationen.'),
    dashboardStatusRow('Systemprüfung', preflightInfo?.summary?.level === 'error' ? 'Fehler' : preflightInfo?.summary?.level === 'warning' ? 'Prüfen' : 'OK', preflightInfo?.summary?.level || 'info', preflightInfo?.summary?.text || 'Noch nicht geprüft.', 'Fasst die Systemprüfung aus Wartung zusammen. Sie prüft lokale Konfiguration, Loxone, Alexa TTS, virtuelle Alexa-Geräte, Gerätesuche und Backup. Details findest du im Register Wartung.')
  ];
  dashboardCards.innerHTML = rows.join('');
  bindDashboardHelpButtons();
  renderBackupReminder();
  renderWizardPrompt();
}

function dashboardStatusRow(title, value, level, detail, helpText) {
  const safeLevel = ['ok', 'warning', 'error', 'optional', 'info'].includes(level) ? level : 'info';
  const helpId = `dashboard-help-${normalizeText(title).replace(/[^a-z0-9]+/g, '-')}`;
  return `
    <article class="dashboard-status-row ${safeLevel}">
      <span class="status-pill ${safeLevel}">${escapeHtml(value || 'Unbekannt')}</span>
      <strong class="dashboard-status-title">${escapeHtml(title)}</strong>
      <p class="dashboard-status-detail">${escapeHtml(detail || '')}</p>
      <button type="button" class="info-button info-button-small dashboard-info-button" aria-expanded="false" aria-controls="${helpId}" aria-label="${escapeHtml(title)} erklären" title="${escapeHtml(title)} erklären">i</button>
      <p id="${helpId}" class="dashboard-status-help" hidden>${escapeHtml(helpText || '')}</p>
    </article>
  `;
}

function bindDashboardHelpButtons() {
  dashboardCards?.querySelectorAll('.dashboard-info-button').forEach((button) => {
    const help = button.getAttribute('aria-controls')
      ? document.getElementById(button.getAttribute('aria-controls'))
      : null;
    button.addEventListener('click', () => {
      if (!help) return;
      help.hidden = !help.hidden;
      button.setAttribute('aria-expanded', String(!help.hidden));
    });
  });
}

function backupStateTitle() {
  if (configDirty) return 'Offen';
  return localStorage.getItem(LAST_BACKUP_EXPORT_KEY) ? 'Exportiert' : 'Kein Export';
}

function backupReminderLevel() {
  return configDirty ? 'warning' : localStorage.getItem(LAST_BACKUP_EXPORT_KEY) ? 'ok' : 'info';
}

function backupStateDetail() {
  const lastExport = localStorage.getItem(LAST_BACKUP_EXPORT_KEY);
  if (configDirty) return 'Seit der letzten Änderung wurde noch kein Backup exportiert.';
  return lastExport ? `Letzter Export in diesem Browser: ${formatDateTime(lastExport)}.` : 'Backup kann unter Wartung exportiert werden.';
}

function renderBackupReminder() {
  if (!backupReminder) return;
  if (!configDirty) {
    backupReminder.hidden = true;
    backupReminder.textContent = '';
    return;
  }
  backupReminder.hidden = false;
  backupReminder.textContent = 'Seit der letzten Änderung wurde noch kein Backup exportiert. Nach grösseren Anpassungen unter Wartung ein Backup erstellen.';
}

function renderWizardPrompt() {
  if (!wizardPrompt) return;
  const skipped = localStorage.getItem(SETUP_WIZARD_SKIPPED_KEY) === 'true';
  const hasOpenSetup = setupStatus && !setupStatus.complete;
  const shouldShow = !skipped && (hasOpenSetup || !localStorage.getItem(LAST_BACKUP_EXPORT_KEY));
  wizardPrompt.hidden = !shouldShow;
}

function skipWizardPrompt(closeModalToo = false) {
  localStorage.setItem(SETUP_WIZARD_SKIPPED_KEY, 'true');
  renderWizardPrompt();
  if (closeModalToo) closeWizard();
  showToast('Einrichtungsassistent übersprungen', 'ok');
}

function openWizard(stepIndex = 0) {
  if (!wizardModal) return;
  wizardStepIndex = Math.max(0, Math.min(stepIndex, wizardSteps().length - 1));
  wizardModal.hidden = false;
  document.body.classList.add('modal-open');
  renderWizard();
}

function closeWizard() {
  if (!wizardModal) return;
  wizardModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function moveWizard(direction) {
  const steps = wizardSteps();
  const nextIndex = wizardStepIndex + direction;
  if (nextIndex >= steps.length) {
    closeWizard();
    showToast('Einrichtungsassistent abgeschlossen', 'ok');
    return;
  }
  wizardStepIndex = Math.max(0, nextIndex);
  renderWizard();
}

function renderWizard() {
  const steps = wizardSteps();
  const step = steps[wizardStepIndex];
  if (!step || !wizardBody || !wizardTitle || !wizardProgress || !wizardActionBar) return;

  wizardStepLabel.textContent = `Schritt ${wizardStepIndex + 1} von ${steps.length}`;
  wizardTitle.textContent = step.title;
  wizardProgress.innerHTML = steps.map((item, index) => `<span class="${index === wizardStepIndex ? 'active' : index < wizardStepIndex ? 'done' : ''}">${escapeHtml(item.shortTitle)}</span>`).join('');
  wizardBody.innerHTML = `
    <p>${escapeHtml(step.text)}</p>
    ${step.detail ? `<div class="wizard-detail">${escapeHtml(step.detail)}</div>` : ''}
    ${step.status ? `<div class="service-status ${step.statusClass || 'disabled'}">${escapeHtml(step.status)}</div>` : ''}
  `;
  wizardActionBar.innerHTML = '';
  step.actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.className = action.secondary ? 'secondary' : '';
    button.disabled = Boolean(action.disabled);
    button.addEventListener('click', () => action.run(button));
    wizardActionBar.append(button);
  });
  wizardBackBtn.disabled = wizardStepIndex === 0;
  wizardNextBtn.textContent = wizardStepIndex === steps.length - 1 ? 'Fertig' : 'Weiter';
}

function wizardSteps() {
  const commandCount = Object.keys(config?.commands || {}).length;
  const ttsReady = Boolean(ttsStatus?.ready);
  const bridgeEnabled = Boolean(config?.alexaBridge?.enabled);
  const bridgeReady = Boolean(alexaBridgeInfo?.bridgeHttp?.ready);
  const discoveryActive = Boolean(alexaBridgeInfo?.ready);
  const discoveryOptional = bridgeEnabled && !discoveryActive;
  const helperAvailable = Boolean(discoveryInfo?.helper?.available);
  const dryRun = config?.loxone?.dryRun !== false;
  return [
    {
      shortTitle: 'Start',
      title: 'Einrichtung starten',
      text: 'Dieser Assistent führt durch die wichtigsten Schritte. Er ändert nichts automatisch, ausser du klickst bewusst auf eine Aktion.',
      detail: 'Du kannst den Assistenten jederzeit schliessen oder dauerhaft überspringen. Alle Einstellungen bleiben weiterhin in den normalen Registern erreichbar.',
      status: setupStatus?.complete ? 'Basiskonfiguration vollständig.' : `${setupStatus?.openRequired ?? 0} notwendige Einrichtungsschritte offen.`,
      statusClass: setupStatus?.complete ? 'ready' : 'warning',
      actions: [
        { label: 'Zur Übersicht', secondary: true, run: () => showView('dashboardView') }
      ]
    },
    {
      shortTitle: 'Loxone',
      title: 'Loxone verbinden',
      text: 'Trage Miniserver-URL, Benutzer und Passwort ein. Für erste Tests sollte Dry-Run aktiv bleiben.',
      detail: 'LoxEvo sendet im Live-Modus echte Befehle an den Miniserver. Deshalb zuerst im Dry-Run prüfen.',
      status: isValidHttpUrl(config?.loxone?.baseUrl || '') ? 'Miniserver-URL ist eingetragen.' : 'Miniserver-URL fehlt oder ist ungültig.',
      statusClass: isValidHttpUrl(config?.loxone?.baseUrl || '') ? 'ready' : 'warning',
      actions: [
        { label: 'Loxone-Konfiguration öffnen', run: () => openConfigArea('Loxone') }
      ]
    },
    {
      shortTitle: 'Befehle',
      title: 'Erste Befehle anlegen',
      text: 'Lege Loxone-Befehle mit verständlichem Namen, Rubrik und Ziel an. Diese Befehle werden später getestet oder Alexa als virtuelle Geräte angeboten.',
      detail: 'Jeder aktive Befehl braucht einen Zieltyp mit UUID/Wert oder einen direkten Pfad.',
      status: commandCount ? `${commandCount} Befehl(e) vorhanden.` : 'Noch keine Befehle vorhanden.',
      statusClass: commandCount ? 'ready' : 'warning',
      actions: [
        { label: 'Befehle öffnen', run: () => openConfigArea('Befehle und Sprachnamen') },
        { label: 'Testen öffnen', secondary: true, run: () => showView('controlView') }
      ]
    },
    {
      shortTitle: 'Betrieb',
      title: 'Dry-Run oder Live-Modus wählen',
      text: 'Im Dry-Run wird nur protokolliert. Im Live-Modus werden Befehle wirklich an Loxone gesendet.',
      detail: 'Für eine neue Installation ist Dry-Run am Anfang sinnvoll. Im produktiven Betrieb ist Live-Modus korrekt.',
      status: dryRun ? 'Dry-Run ist aktiv.' : 'Live-Modus ist aktiv.',
      statusClass: dryRun ? 'disabled' : 'ready',
      actions: [
        { label: dryRun ? 'Live-Modus aktivieren' : 'Dry-Run aktivieren', secondary: !dryRun, run: () => setDryRun(!dryRun) }
      ]
    },
    {
      shortTitle: 'Alexa',
      title: 'Virtuelle Alexa-Geräte',
      text: 'Aktive Loxone-Befehle können Alexa als lokale Hue-kompatible Geräte angeboten werden.',
      detail: 'Bereits gefundene Geräte funktionieren auch dann weiter, wenn SSDP/UDP 1900 später wieder durch LoxBerry belegt ist.',
      status: bridgeEnabled ? `${alexaBridgeInfo?.deviceCount ?? 0} virtuelle Gerät(e), Alexa/Hue-HTTP ${bridgeReady ? 'bereit' : 'prüfen'}.` : 'Virtuelle Alexa-Geräte sind deaktiviert.',
      statusClass: bridgeEnabled && bridgeReady ? 'ready' : 'disabled',
      actions: [
        { label: 'Alexa-Geräte konfigurieren', run: () => openConfigArea('Alexa-Geräte') }
      ]
    },
    {
      shortTitle: 'Suche',
      title: 'Alexa-Gerätesuche bei Bedarf',
      text: 'SSDP/UDP 1900 wird nur zum Finden neuer virtueller Alexa-Geräte benötigt.',
      detail: 'Wenn der Port durch LoxBerry-ssdpd belegt ist, ist das für den normalen Betrieb kein Fehler. Für neue Geräte kannst du die Gerätesuche kurz aktivieren, in der Alexa-App suchen und danach wieder beenden.',
      status: discoveryActive
        ? 'Gerätesuche ist aktiv. Nach der Alexa-Suche wieder beenden.'
        : discoveryOptional && !helperAvailable
          ? 'Host-Helper ist nicht installiert oder nicht erreichbar. Die normale Funktion bleibt erhalten; neue Geräte können so nicht gesucht werden.'
          : discoveryOptional
          ? 'Gerätesuche ist aktuell nicht aktiv. Bereits gefundene Geräte funktionieren weiter.'
          : 'Gerätesuche ist nur relevant, wenn virtuelle Alexa-Geräte aktiv sind.',
      statusClass: discoveryActive ? 'ready' : 'disabled',
      actions: [
        { label: 'Gerätesuche-Einstellungen öffnen', run: () => openConfigArea('Alexa-Gerätesuche') },
        { label: 'Gerätesuche aktivieren', disabled: !helperAvailable || discoveryActive || !bridgeEnabled, run: (button) => runDiscoveryAction('start', button) },
        { label: 'Gerätesuche beenden', secondary: true, disabled: !helperAvailable || !discoveryActive, run: (button) => runDiscoveryAction('stop', button) }
      ]
    },
    {
      shortTitle: 'TTS',
      title: 'Alexa TTS einrichten',
      text: 'Für Sprachausgabe benötigt LoxEvo alexa-remote2, eine Cookie-Datei und mindestens ein ausgewähltes Echo-Gerät.',
      detail: 'Alarm nutzt die Alarm-Geräte und die Alarm-Lautstärke. Normale Meldungen nutzen die Standard-Geräte.',
      status: ttsReady ? 'Alexa TTS ist bereit.' : config?.tts?.enabled ? humanizeTtsStatusError(ttsStatus?.error || 'TTS ist noch nicht bereit.') : 'Alexa TTS ist deaktiviert.',
      statusClass: ttsReady ? 'ready' : 'warning',
      actions: [
        { label: 'TTS konfigurieren', run: () => openConfigArea('Alexa TTS') },
        { label: 'TTS-Geräte öffnen', secondary: true, run: () => openConfigArea('TTS-Geräte') }
      ]
    },
    {
      shortTitle: 'Backup',
      title: 'Backup erstellen',
      text: 'Wenn die Einrichtung passt, sollte ein Backup exportiert werden.',
      detail: 'Der normale Export enthält die LoxEvo-Konfiguration. Die Alexa-Cookie-Datei wird nur gesichert, wenn du den Haken bewusst setzt.',
      status: backupStateDetail(),
      statusClass: backupReminderLevel() === 'warning' ? 'warning' : 'disabled',
      actions: [
        { label: 'Backup öffnen', run: () => showView('maintenanceView') }
      ]
    }
  ];
}

function openConfigArea(label) {
  showView('configView');
  const target = [...document.querySelectorAll('#configView details.config-section')].find((details) => {
    const text = details.querySelector('.summary-label')?.textContent || '';
    return normalizeText(text) === normalizeText(label);
  });
  if (target) {
    target.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function populateForms() {
  loxoneBaseUrl.value = config.loxone?.baseUrl || '';
  loxoneUsername.value = config.loxone?.username || '';
  loxonePassword.value = config.loxone?.password || '';

  alexaBridgeEnabled.checked = config.alexaBridge?.enabled === true;
  alexaBridgeName.value = config.alexaBridge?.name || 'LoxEvo';
  alexaBridgeAdvertiseIp.value = config.alexaBridge?.advertiseIp || '';
  alexaBridgeAdvertisePort.value = config.alexaBridge?.advertisePort ?? 80;

  ttsEnabled.checked = Boolean(config.tts?.enabled);
  ttsCookieFile.value = config.tts?.cookieFile || '';
  ttsAmazonPage.value = config.tts?.amazonPage || '';
  ttsAlexaHost.value = config.tts?.alexaServiceHost || '';
  ttsProxyOwnIp.value = config.tts?.proxyOwnIp || '';
  ttsProxyPort.value = config.tts?.proxyPort || '';
  ttsDefaultVolume.value = config.tts?.defaultVolume ?? 40;
  ttsAlarmVolume.value = config.tts?.alarmVolume ?? 100;
  updateTtsVolumeLabels();
  ttsDefaultDevices.value = listToLines(config.tts?.defaultDevices);
  ttsAllDevices.value = listToLines(config.tts?.allDevices);
  ttsAlarmDevices.value = listToLines(config.tts?.alarmDevices);
  renderTtsDevices();
}

function updateTtsVolumeLabels() {
  if (ttsDefaultVolumeValue && ttsDefaultVolume) {
    ttsDefaultVolumeValue.textContent = `${ttsDefaultVolume.value || 0}%`;
  }
  if (ttsAlarmVolumeValue && ttsAlarmVolume) {
    ttsAlarmVolumeValue.textContent = `${ttsAlarmVolume.value || 0}%`;
  }
}

function renderCommandEditor() {
  roomEditor.innerHTML = '';
  const commandGroups = groupCommandsByCategory(Object.entries(getConfiguredCommands()));
  Object.entries(commandGroups).forEach(([category, commands]) => {
    const group = createCategoryGroup(category, commands.length);
    commands.forEach(([commandKey, command]) => {
      group.append(createCommandCard(commandKey, command));
    });
    roomEditor.append(group);
  });
  updateConfigSectionCounts();
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
  if (!lightEndpoints || !config) return;

  const baseUrl = window.location.origin;
  lightEndpoints.innerHTML = '';
  const runnableCommands = Object.entries(getRunnableCommands());

  if (!runnableCommands.length) {
    lightEndpoints.innerHTML = '<p class="empty">Noch keine aktiven Befehle vorhanden.</p>';
  }

  Object.entries(groupCommandsByCategory(runnableCommands)).forEach(([category, commands]) => {
    const group = createCategoryGroup(category, commands.length);
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

  const ttsGroup = createTtsEndpointGroup(baseUrl);
  const ttsEndpointCount = Number(ttsGroup.querySelector('.count-badge')?.textContent || 0);
  setCountBadge(integrationCommandsCount, runnableCommands.length + ttsEndpointCount);
  lightEndpoints.append(ttsGroup);

  renderAlexaDevices();
}

function createTtsEndpointGroup(baseUrl, open = false) {
  const cards = createTtsEndpointCards(baseUrl);
  const group = createCategoryGroup('TTS', cards.length, open);
  const status = document.createElement('div');
  const statusView = ttsStatusView();
  status.className = statusView.className;
  status.textContent = statusView.text;
  group.append(status, ...cards);
  return group;
}

function createTtsEndpointCards(baseUrl) {
  return [
    createEndpointCard({
      title: 'TTS normal',
      method: 'POST',
      url: `${baseUrl}/tts/speak`,
      body: 'Geschirrspüler ist fertig.',
      note: 'Schnelle Sprachausgabe ohne Lautstärke-Vorbefehl.',
      testLabel: 'TTS testen',
      testAction: (button) => testEndpoint({
        method: 'POST',
        url: `${baseUrl}/tts/speak`,
        body: 'Geschirrspüler ist fertig.',
        contentType: 'text/plain',
        successText: 'TTS normal'
      }, button)
    }),
    createEndpointCard({
      title: 'Loxone Kurzpfad',
      method: 'POST',
      url: `${baseUrl}/meldung`,
      body: 'Geschirrspüler ist fertig.',
      note: 'Loxone-Kurzpfad: POST /<name> mit Text im Body spricht auf den Standard-Geräten. Die HTTP-Antwort kommt sofort, die Ausgabe läuft im Hintergrund.',
      testLabel: 'Kurzpfad testen',
      testAction: (button) => testEndpoint({
        method: 'POST',
        url: `${baseUrl}/meldung`,
        body: 'Geschirrspüler ist fertig.',
        contentType: 'text/plain',
        successText: 'TTS Kurzpfad'
      }, button)
    }),
    createEndpointCard({
      title: 'Alarm',
      method: 'POST',
      url: `${baseUrl}/tts/alarm`,
      body: 'Achtung, Alarm wurde ausgelöst.',
      note: 'Nutzt die Alarm-Geräteliste und erzwingt die Alarm-Lautstärke.',
      testLabel: 'Alarm testen',
      testAction: (button) => testEndpoint({
        method: 'POST',
        url: `${baseUrl}/tts/alarm`,
        body: 'Achtung, Alarm wurde ausgelöst.',
        contentType: 'text/plain',
        successText: 'Alarm'
      }, button)
    }),
    createEndpointCard({
      title: 'Alarm Kurzpfad',
      method: 'POST',
      url: `${baseUrl}/alarm`,
      body: 'Achtung, Alarm wurde ausgelöst.',
      note: 'Loxone-Kurzpfad: POST /alarm nutzt die Alarm-Geräte und die Alarm-Lautstärke.',
      testLabel: 'Alarm Kurzpfad',
      testAction: (button) => testEndpoint({
        method: 'POST',
        url: `${baseUrl}/alarm`,
        body: 'Achtung, Alarm wurde ausgelöst.',
        contentType: 'text/plain',
        successText: 'Alarm Kurzpfad'
      }, button)
    }),
    createEndpointCard({
      title: 'Lautstärke setzen',
      method: 'POST',
      url: `${baseUrl}/tts/volume`,
      body: String(ttsDefaultVolume?.value || 40),
      note: 'Setzt die Lautstärke der Alle-Geräte, sonst der Standard-Geräte. Das ist bewusst getrennt von normaler TTS.',
      testLabel: 'Lautstärke setzen',
      testAction: (button) => testEndpoint({
        method: 'POST',
        url: `${baseUrl}/tts/volume`,
        body: String(ttsDefaultVolume?.value || 40),
        contentType: 'text/plain',
        successText: 'Lautstärke'
      }, button)
    }),
    createEndpointCard({
      title: 'Lautstärke Kurzpfad',
      method: 'POST',
      url: `${baseUrl}/lautstaerke`,
      body: String(ttsDefaultVolume?.value || 40),
      note: 'Loxone-Kurzpfad: POST /lautstaerke mit Zahl im Body setzt die Lautstärke der Alle-Geräte, sonst der Standard-Geräte.',
      testLabel: 'Kurzpfad setzen',
      testAction: (button) => testEndpoint({
        method: 'POST',
        url: `${baseUrl}/lautstaerke`,
        body: String(ttsDefaultVolume?.value || 40),
        contentType: 'text/plain',
        successText: 'Lautstärke Kurzpfad'
      }, button)
    }),
    createEndpointCard({
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
    })
  ];
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

function createCategoryGroup(category, count, open = false) {
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
  nextConfig.alexaBridge.advertisePort = numberInRange(alexaBridgeAdvertisePort.value, 80, 1, 65535);
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
  nextConfig.tts.defaultDevices = linesToDeviceList(ttsDefaultDevices.value);
  nextConfig.tts.allDevices = linesToDeviceList(ttsAllDevices.value);
  nextConfig.tts.alarmDevices = linesToDeviceList(ttsAlarmDevices.value);

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

function regenerateJsonFromForms(button) {
  syncJsonFromForms();
  setButtonFeedback(button, 'success', 'Neu erzeugt');
  showToast('JSON wurde aus dem Formular neu erzeugt', 'ok');
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

function linesToDeviceList(value) {
  return linesToList(value).filter((item) => !item.includes('replace-with'));
}

function firstDeviceList(...values) {
  for (const value of values) {
    const devices = linesToDeviceList(value);
    if (devices.length) return devices;
  }
  return [];
}

function numberInRange(value, fallback, min = 0, max = 100) {
  if (String(value ?? '').trim() === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function renderAlexaDevices() {
  if (!alexaDevices) return;
  const status = alexaBridgeInfo || {};
  const devices = Array.isArray(status.devices) ? status.devices : [];
  setCountBadge(integrationAlexaDevicesCount, status.enabled ? devices.length : 0);

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

async function loadEvents(button) {
  if (button) setButtonFeedback(button, 'pending', 'Lädt');
  try {
    const response = await fetch(`/api/events?ts=${Date.now()}`, { cache: 'no-store' });
    await ensureOk(response);
    allEvents = await response.json();
    renderEvents(allEvents);
    if (button) {
      setButtonFeedback(button, 'success', 'Aktualisiert');
      showToast('Protokoll aktualisiert', 'ok');
    }
  } catch (error) {
    if (button) setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function renderEvents(events) {
  if (!eventsEl) return;
  const filteredEvents = filterEvents(events || []);
  if (!filteredEvents.length) {
    eventsEl.innerHTML = '<p class="empty">Noch keine Befehle.</p>';
    return;
  }

  eventsEl.innerHTML = '';
  filteredEvents.slice(0, 50).forEach((event) => {
    const row = document.createElement('div');
    row.className = 'event-row';
    const meta = document.createElement('div');
    meta.className = 'event-meta';
    meta.textContent = `${formatTime(event.at)} | ${event.type} | ${event.status}`;
    const detail = document.createElement('div');
    detail.className = 'event-detail';
    detail.textContent = eventDetailText(event);
    row.append(meta, detail);
    eventsEl.append(row);
  });
}

async function clearEvents(button) {
  if (!window.confirm('Protokoll leeren? Die laufende Funktion von LoxEvo wird dadurch nicht verändert.')) return;
  setButtonFeedback(button, 'pending', 'Leert');
  try {
    const response = await adminFetch('/api/events/clear', { method: 'POST' });
    await ensureOk(response);
    const payload = await response.json();
    allEvents = payload.events || [];
    renderEvents(allEvents);
    setButtonFeedback(button, 'success', 'Geleert');
    showToast('Protokoll geleert', 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function filterEvents(events) {
  const search = normalizeText(eventSearch?.value || '');
  return events.filter((event) => {
    const bucket = eventBucket(event);
    const matchesFilter = activeEventFilter === 'all' || bucket === activeEventFilter || (activeEventFilter === 'error' && event.status === 'error');
    const text = normalizeText(`${event.type || ''} ${event.status || ''} ${event.key || ''} ${event.label || ''} ${event.text || ''} ${event.url || ''} ${event.error || ''}`);
    return matchesFilter && (!search || text.includes(search));
  });
}

function eventBucket(event) {
  const type = String(event.type || '');
  if (event.status === 'error') return 'error';
  if (type.startsWith('tts')) return 'tts';
  if (type.startsWith('alexa')) return 'alexa';
  if (type === 'backup') return 'backup';
  if (['command', 'light', 'alexa-command'].includes(type)) return 'loxone';
  return 'all';
}

function eventDetailText(event) {
  if (String(event.type || '').startsWith('tts')) {
    const parts = [];
    if (event.key) parts.push(`Befehl: ${event.key}`);
    if (event.text) parts.push(event.text);
    if (event.volume !== undefined) parts.push(`Lautstärke: ${event.volume}`);
    if (Array.isArray(event.devices) && event.devices.length) parts.push(`Geräte: ${event.devices.join(', ')}`);
    if (event.error) parts.push(`Fehler: ${event.error}`);
    if (event.compat) parts.push(`Quelle: ${event.compat}`);
    return parts.join(' | ') || JSON.stringify(event);
  }
  return event.url || event.text || JSON.stringify(event);
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
