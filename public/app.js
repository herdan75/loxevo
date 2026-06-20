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
const modeSubNotice = document.querySelector('#modeSubNotice');
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
const alexaBridgeId = document.querySelector('#alexaBridgeId');
const alexaBridgeDebug = document.querySelector('#alexaBridgeDebug');
const alexaBridgeDebugHelpBtn = document.querySelector('#alexaBridgeDebugHelpBtn');
const alexaBridgeDebugHelpText = document.querySelector('#alexaBridgeDebugHelpText');
const regenerateBridgeIdBtn = document.querySelector('#regenerateBridgeIdBtn');
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
const showAllTtsDeviceTypes = document.querySelector('#showAllTtsDeviceTypes');
const ttsDeviceList = document.querySelector('#ttsDeviceList');
const roomEditor = document.querySelector('#roomEditor');
const addRoomBtn = document.querySelector('#addRoomBtn');
const reloadJsonBtn = document.querySelector('#reloadJsonBtn');
const saveJsonBtn = document.querySelector('#saveJsonBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const views = document.querySelectorAll('.view');
const refreshIntegrationsBtn = document.querySelector('#refreshIntegrationsBtn');
const lightEndpoints = document.querySelector('#lightEndpoints');
const ttsEndpoints = document.querySelector('#ttsEndpoints');
const alexaDevices = document.querySelector('#alexaDevices');
const integrationCommandsCount = document.querySelector('#integrationCommandsCount');
const integrationTtsCount = document.querySelector('#integrationTtsCount');
const integrationAlexaDevicesCount = document.querySelector('#integrationAlexaDevicesCount');
const configDirtyNotice = document.querySelector('#configDirtyNotice');
const dirtySaveBtn = document.querySelector('#dirtySaveBtn');
const dirtyDiscardBtn = document.querySelector('#dirtyDiscardBtn');
const configCommandsCount = document.querySelector('#configCommandsCount');
const commandSearch = document.querySelector('#commandSearch');
const commandCategoryFilter = document.querySelector('#commandCategoryFilter');
const commandViewFilter = document.querySelector('#commandViewFilter');
const commandOnlyInvalid = document.querySelector('#commandOnlyInvalid');
const configTtsDevicesCount = document.querySelector('#configTtsDevicesCount');
const ttsConfigStatus = document.querySelector('#ttsConfigStatus');
const ttsAuthDetails = document.querySelector('#ttsAuthDetails');
const ttsReconnectBtn = document.querySelector('#ttsReconnectBtn');
const ttsHelpBtn = document.querySelector('#ttsHelpBtn');
const ttsHelpText = document.querySelector('#ttsHelpText');
const setupPanel = document.querySelector('#setupPanel');
const setupSummary = document.querySelector('#setupSummary');
const setupDetails = document.querySelector('#setupDetails');
const setupDetailsCount = document.querySelector('#setupDetailsCount');
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
let savedConfigSnapshot = null;
const ADMIN_TOKEN_STORAGE_KEY = 'loxevoAdminToken';
const LAST_BACKUP_EXPORT_KEY = 'loxevoLastBackupExportAt';
const SETUP_WIZARD_SKIPPED_KEY = 'loxevoSetupWizardSkipped';
const SHOW_ALL_TTS_DEVICE_TYPES_KEY = 'loxevoShowAllTtsDeviceTypes';
const HELP_TOOLTIP_MARGIN = 10;
const NEW_COMMAND_CATEGORY = 'Neue Befehle';
const NEW_COMMAND_LABEL = 'Neuer noch nicht konfigurierter Befehl';
const LOXONE_UUID_PATTERN = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-(?:[0-9a-f]{16}|[0-9a-f]{4}-[0-9a-f]{12}))$/i;
const draftCommandKeys = new Map();
let draftCommandSequence = 0;
let wizardStepIndex = 0;
let configDirtyRenderTimer = null;
let jsonSyncTimer = null;
let activeHelpTooltip = null;

load();

saveBtn.addEventListener('click', () => saveConfig(saveBtn));
dirtySaveBtn?.addEventListener('click', () => saveConfig(dirtySaveBtn));
dirtyDiscardBtn?.addEventListener('click', () => discardConfigChanges());
saveJsonBtn.addEventListener('click', () => saveJsonConfig(saveJsonBtn));
reloadJsonBtn.addEventListener('click', () => regenerateJsonFromForms(reloadJsonBtn));
speakBtn.addEventListener('click', () => postTtsTest('speak', speakBtn));
alarmBtn.addEventListener('click', () => postTtsTest('alarm', alarmBtn));
refreshEventsBtn.addEventListener('click', () => loadEvents(refreshEventsBtn));
clearEventsBtn?.addEventListener('click', () => clearEvents(clearEventsBtn));
alexaBridgeDebug?.addEventListener('change', () => setAlexaBridgeDebug(alexaBridgeDebug.checked));
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
  showToast('Aufrufe & Geräte aktualisiert', 'ok');
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
alexaBridgeDebugHelpBtn?.addEventListener('click', () => toggleHelpBox(alexaBridgeDebugHelpBtn, alexaBridgeDebugHelpText));
saveAdminTokenBtn?.addEventListener('click', () => saveAdminToken(saveAdminTokenBtn));
disableAdminTokenBtn?.addEventListener('click', () => disableAdminToken(disableAdminTokenBtn));
ttsHelpBtn?.addEventListener('click', () => toggleTtsHelp());
ttsReconnectBtn?.addEventListener('click', () => reconnectTts(ttsReconnectBtn));
discoveryHelpBtn?.addEventListener('click', () => toggleDiscoveryHelp());
bindStaticHelpTooltips();
startDiscoveryBtn?.addEventListener('click', () => runDiscoveryAction('start', startDiscoveryBtn));
stopDiscoveryBtn?.addEventListener('click', () => runDiscoveryAction('stop', stopDiscoveryBtn));
regenerateBridgeIdBtn?.addEventListener('click', () => regenerateAlexaBridgeId());
refreshTtsDevicesBtn?.addEventListener('click', () => loadTtsDevices(refreshTtsDevicesBtn));
showAllTtsDeviceTypes?.addEventListener('change', () => {
  localStorage.setItem(SHOW_ALL_TTS_DEVICE_TYPES_KEY, showAllTtsDeviceTypes.checked ? 'true' : 'false');
  renderTtsDevices();
});
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
  scheduleJsonSyncFromForms();
});
ttsAlarmVolume?.addEventListener('input', () => {
  updateTtsVolumeLabels();
  scheduleJsonSyncFromForms();
});
[ttsDefaultDevices, ttsAllDevices, ttsAlarmDevices].forEach((textarea) => {
  textarea?.addEventListener('input', () => {
    renderTtsDevices();
    updateConfigSectionCounts();
    scheduleJsonSyncFromForms();
  });
});
document.querySelector('#configView')?.addEventListener('input', (event) => {
  if (event.target?.closest?.('.command-tools')) return;
  markConfigDirty();
});
document.querySelector('#configView')?.addEventListener('change', (event) => {
  if (event.target?.closest?.('.command-tools')) return;
  markConfigDirty();
});
roomEditor?.addEventListener('input', (event) => {
  updateCommandCardValidation(event.target?.closest?.('.room-card'));
});
roomEditor?.addEventListener('change', (event) => {
  updateCommandCardValidation(event.target?.closest?.('.room-card'));
});
[commandSearch, commandCategoryFilter, commandViewFilter, commandOnlyInvalid].forEach((control) => {
  control?.addEventListener('input', () => renderCommandEditor());
  control?.addEventListener('change', () => renderCommandEditor());
});
tabButtons.forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.tabTarget));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hideHelpTooltip();
  if (event.key === 'Escape' && wizardModal && !wizardModal.hidden) {
    closeWizard();
  }
});
document.addEventListener('click', (event) => {
  if (!activeHelpTooltip) return;
  if (event.target.closest?.('.help-tooltip')) return;
  if (event.target.closest?.('.info-button')) return;
  hideHelpTooltip();
});
window.addEventListener('resize', () => hideHelpTooltip());
window.addEventListener('scroll', () => hideHelpTooltip(), true);

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
    await loadPreflightStatus();
    renderCommands();
    renderCommandEditor();
    renderIntegrations();
    syncJsonFromForms();
    await loadEvents();
    captureSavedConfigSnapshot();
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
    if (!confirmConfigSave(nextConfig)) return;
    setButtonFeedback(button, 'pending', 'Speichert');
    const result = await putJson('/api/config', nextConfig);
    config = result.config;
    clearDraftCommands();
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
    captureSavedConfigSnapshot();
    markConfigClean();
    renderDashboard();
    setButtonFeedback(button, 'success', 'Gespeichert');
    showToast(`Konfiguration gespeichert: ${configSaveSummaryInline(config)}`, 'ok');
  } catch (error) {
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

async function saveJsonConfig(button) {
  try {
    const nextConfig = JSON.parse(configEditor.value);
    const validation = validateConfigBeforeSave(nextConfig);
    if (validation.length) {
      setButtonFeedback(button, 'error', 'Prüfen');
      showToast(validation[0], 'error');
      return;
    }
    if (!confirmConfigSave(nextConfig)) return;
    setButtonFeedback(button, 'pending', 'Speichert');
    const result = await putJson('/api/config', nextConfig);
    config = result.config;
    clearDraftCommands();
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
    captureSavedConfigSnapshot();
    markConfigClean();
    renderDashboard();
    setButtonFeedback(button, 'success', 'Gespeichert');
    showToast(`JSON gespeichert: ${configSaveSummaryInline(config)}`, 'ok');
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
  const commandErrors = Object.entries(nextConfig.commands || {})
    .flatMap(([commandKey, command]) => commandValidationIssues(commandKey, command, nextConfig.commands || {})
      .filter((issue) => issue.level === 'error')
      .map((issue) => ({ commandKey, command, ...issue })));
  if (commandErrors.length) {
    const first = commandErrors[0];
    errors.push(`Befehl "${getCommandDisplayName(first.commandKey, first.command)}": ${first.text}`);
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
  configDirty = hasConfigChangedFromSnapshot();
  updateConfigDirtyNotice();
  scheduleConfigDirtyRefresh();
}

function markConfigClean() {
  configDirty = false;
  clearTimeout(configDirtyRenderTimer);
  configDirtyRenderTimer = null;
  updateConfigDirtyNotice();
  renderBackupReminder();
}

function markDraftCommand(commandKey, order = draftCommandSequence + 1) {
  const key = normalizeInputKey(commandKey);
  if (!key) return;
  draftCommandSequence = Math.max(draftCommandSequence, order);
  draftCommandKeys.set(key, order);
}

function moveDraftCommand(oldKey, newKey) {
  const oldCommandKey = normalizeInputKey(oldKey);
  const newCommandKey = normalizeInputKey(newKey);
  if (!oldCommandKey || !newCommandKey || oldCommandKey === newCommandKey || !draftCommandKeys.has(oldCommandKey)) return;
  const order = draftCommandKeys.get(oldCommandKey);
  draftCommandKeys.delete(oldCommandKey);
  draftCommandKeys.set(newCommandKey, order);
}

function unmarkDraftCommand(commandKey) {
  const key = normalizeInputKey(commandKey);
  if (key) draftCommandKeys.delete(key);
}

function isDraftCommand(commandKey) {
  return draftCommandKeys.has(normalizeInputKey(commandKey));
}

function draftCommandOrder(commandKey) {
  return draftCommandKeys.get(normalizeInputKey(commandKey)) ?? Number.MAX_SAFE_INTEGER;
}

function clearDraftCommands() {
  draftCommandKeys.clear();
  draftCommandSequence = 0;
}

function captureSavedConfigSnapshot() {
  try {
    savedConfigSnapshot = collectConfigFromForms();
  } catch {
    savedConfigSnapshot = structuredClone(config);
  }
}

function discardConfigChanges() {
  if (!savedConfigSnapshot) return;
  if (configDirty && !window.confirm('Ungespeicherte Änderungen verwerfen?')) return;
  clearDraftCommands();
  config = structuredClone(savedConfigSnapshot);
  populateForms();
  updateDryRunUi(Boolean(config.loxone?.dryRun));
  renderCommands();
  renderCommandEditor();
  renderIntegrations();
  syncJsonFromForms();
  markConfigClean();
  renderDashboard();
  showToast('Änderungen verworfen', 'ok');
}

function updateConfigDirtyNotice() {
  if (!configDirtyNotice) return;
  configDirtyNotice.hidden = !configDirty;
  if (saveBtn) saveBtn.hidden = configDirty;
}

function hasConfigChangedFromSnapshot() {
  if (!savedConfigSnapshot) return false;
  try {
    return stableJsonStringify(collectConfigFromForms()) !== stableJsonStringify(savedConfigSnapshot);
  } catch {
    return true;
  }
}

function stableJsonStringify(value) {
  return JSON.stringify(sortJsonValue(value));
}

function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = sortJsonValue(value[key]);
    return result;
  }, {});
}

function scheduleConfigDirtyRefresh() {
  clearTimeout(configDirtyRenderTimer);
  configDirtyRenderTimer = setTimeout(() => {
    configDirtyRenderTimer = null;
    renderBackupReminder();
    renderDashboard();
  }, 250);
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
    await loadPreflightStatus();
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
    captureSavedConfigSnapshot();
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
    saveAdminTokenBtn.textContent = status.enabled ? 'Passwort ändern' : 'Admin-Schutz aktivieren';
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
    showToast('Das Admin-Passwort muss mindestens 8 Zeichen lang sein.', 'error');
    return;
  }
  if (token !== repeat) {
    showToast('Die eingegebenen Admin-Passwörter stimmen nicht überein.', 'error');
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
  if (!window.confirm('Admin-Schutz deaktivieren? Sensible Web-UI-Aktionen sind danach ohne Admin-Passwort erreichbar.')) {
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

  const authenticatedResponse = await requestAdminToken('Bitte das LoxEvo Admin-Passwort eingeben.', async (token) => {
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token.trim());
    const retryResponse = await fetchWithAdminToken(url, options);
    if (retryResponse.status === 401) {
      sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      return { ok: false, message: 'Admin-Passwort war nicht korrekt. Bitte erneut eingeben.' };
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
          <h2 id="adminTokenPromptTitle">Admin-Passwort erforderlich</h2>
          <p class="admin-token-message"></p>
        </div>
        <label>
          <span>Admin-Passwort</span>
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
        result = { ok: false, message: error.message || 'Admin-Passwort konnte nicht geprüft werden.' };
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Entsperren';
      }

      if (result?.ok) {
        close(result.response);
        return;
      }

      messageEl.textContent = result?.message || 'Admin-Passwort war nicht korrekt. Bitte erneut eingeben.';
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
    button.classList.add('is-loading');
    return;
  }

  button.disabled = false;
  button.classList.remove('is-loading');
  button.textContent = label;
  button.classList.add(state === 'error' ? 'action-error' : 'action-success');

  button.dataset.feedbackTimer = String(window.setTimeout(() => {
    button.textContent = button.dataset.defaultLabel;
    button.classList.remove('action-pending', 'action-success', 'action-error', 'is-loading');
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
  renderTtsAuthDetails();
  renderSystemNotice();
}

function ttsStatusView() {
  const status = ttsStatus || { enabled: false, ready: false };
  if (status.enabled && status.ready) {
    const speakCount = deviceCount(status.defaultSpeakDevices);
    return {
      text: `TTS ist bereit. Sprechen: ${speakCount}, Standard: ${deviceCount(status.defaultDevices)}, Alarm: ${deviceCount(status.alarmDevices)}.`,
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

function renderTtsAuthDetails() {
  if (!ttsAuthDetails) return;
  const auth = ttsStatus?.auth || {};
  const lines = [];

  if (ttsStatus?.enabled) {
    lines.push(`Cookie: ${auth.cookieJson ? 'JSON-CookieData' : 'Roh-Cookie oder nicht lesbar'}`);
    if (!auth.cookieJson) {
      lines.push('Hinweis: Für stabilen Dauerbetrieb ist eine vollständige JSON-CookieData aus dem Amazon-Login-Proxy besser.');
    }
    if (auth.lastAuthRefreshAt) lines.push(`Letzter Auth-Refresh: ${formatDateTime(auth.lastAuthRefreshAt)}`);
    if (auth.lastCookiePersistAt) lines.push(`Cookie zuletzt gespeichert: ${formatDateTime(auth.lastCookiePersistAt)}`);
    if (auth.lastAuthError) lines.push(`Letzter Auth-Hinweis: ${escapeHtml(auth.lastAuthError)}`);
    if (auth.loginProxyActive) {
      const loginLink = auth.loginUrl
        ? `<a href="${escapeAttribute(auth.loginUrl)}" target="_blank" rel="noopener">Amazon-Login öffnen</a>`
        : 'Amazon-Login-Link im Docker-Log prüfen';
      lines.push(`Amazon-Login erforderlich: ${loginLink}. Nach erfolgreichem Login verbindet LoxEvo automatisch neu; falls nicht, den Button „Alexa TTS neu verbinden“ nutzen.`);
    }
  }

  ttsAuthDetails.hidden = !lines.length;
  ttsAuthDetails.innerHTML = lines.map((line) => `<p>${line}</p>`).join('');
}

async function reconnectTts(button) {
  setButtonFeedback(button, 'pending', 'Verbindet');
  try {
    const response = await adminFetch('/api/tts/reconnect', { method: 'POST' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Alexa TTS konnte nicht neu verbunden werden.');
    }
    ttsStatus = payload.status;
    renderTtsStatus();
    await loadEvents();
    if (payload.ok) {
      setButtonFeedback(button, 'success', 'Verbunden');
      showToast('Alexa TTS neu verbunden', 'ok');
      return;
    }
    if (payload.status?.ready) {
      setButtonFeedback(button, 'success', 'Bleibt aktiv');
      showToast('Neue Verbindung konnte nicht ersetzt werden, bestehende TTS-Verbindung bleibt aktiv.', 'warning');
      return;
    }
    setButtonFeedback(button, 'success', 'Noch offen');
    showToast('Alexa TTS ist noch nicht bereit. Amazon-Login abschliessen oder Cookie prüfen.', 'warning');
  } catch (error) {
    await loadTtsStatus();
    setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
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
  if (showAllTtsDeviceTypes) {
    showAllTtsDeviceTypes.checked = localStorage.getItem(SHOW_ALL_TTS_DEVICE_TYPES_KEY) === 'true';
  }

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
  const showAllTypes = showAllTtsDeviceTypes?.checked === true;
  const visibleDevices = showAllTypes
    ? ttsDevices
    : ttsDevices.filter((device) => isEchoDevice(device) || isSelectedTtsDevice(device, selected));

  ttsDeviceList.innerHTML = '';
  if (!visibleDevices.length) {
    ttsDeviceList.innerHTML = '<p class="empty">Keine Echo-Geräte gefunden. Aktiviere "Alle Gerätetypen anzeigen", um TV-, Raum- oder App-Geräte einzublenden.</p>';
    return;
  }

  visibleDevices.forEach((device) => {
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

function isEchoDevice(device) {
  const haystack = `${device?.type || ''} ${device?.name || ''} ${device?.family || ''}`.toLowerCase();
  return /\becho\b/.test(haystack) || haystack.includes('echo dot') || haystack.includes('echo show') || haystack.includes('echo studio');
}

function isSelectedTtsDevice(device, selected) {
  const serial = device?.serial;
  return Boolean(serial && (selected.default.has(serial) || selected.all.has(serial) || selected.alarm.has(serial)));
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
    alexaBridgeStatus.className = isExpectedDiscoveryInactive(status) ? 'service-status disabled' : 'service-status error';
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
    const response = await adminFetch(`/api/discovery/${action}`, { method: 'POST' });
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
    if (alexaBridgeInfo.bridgeHttp?.error) {
      issues.push({
        level: 'error',
        title: 'Alexa-Geräte sind nicht bereit',
        text: alexaBridgeInfo.bridgeHttp.error
      });
    } else if (!alexaBridgeInfo.ready && !isExpectedDiscoveryInactive(alexaBridgeInfo)) {
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
    updateModeBannerNotice();
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

      bindHelpTooltip(button, () => help.textContent);

      item.append(button, help);
    }

    systemNotice.append(item);
  });
  updateModeBannerNotice();
}

function updateModeBannerNotice() {
  if (!modeSubNotice) return;
  if (getModeBannerDiscoveryNotice()) {
    modeSubNotice.textContent = 'Virtuelle Alexa-Geräte sind aktiviert und funktionsfähig. SSDP/UDP 1900 ist aktuell aber belegt. Für das Suchen und Hinzufügen neuer Geräte unter Konfiguration -> Alexa-Gerätesuche aktivieren.';
    modeSubNotice.hidden = false;
    return;
  }
  modeSubNotice.textContent = '';
  modeSubNotice.hidden = true;
}

function getModeBannerDiscoveryNotice() {
  if (!alexaBridgeInfo?.enabled) return false;
  return isExpectedDiscoveryInactive(alexaBridgeInfo);
}

function humanizeTtsStatusError(errorText = '') {
  const text = String(errorText || '').toLowerCase();
  if (text.includes('please open http://') || text.includes('please open https://')) {
    const loginUrl = String(errorText || '').match(/https?:\/\/[^\s)]+/)?.[0] || '';
    return `Amazon-Login ist erforderlich. Öffne ${loginUrl || 'die Login-Adresse aus dem Docker-Log'} im Browser und melde dich an. Danach verbindet LoxEvo automatisch neu; falls nicht, nutze „Alexa TTS neu verbinden“.`;
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
  if (!text.trim()) {
    return 'Gerätesuche ist aktuell nicht aktiv. Vorhandene Alexa-Geräte können weiter funktionieren.';
  }
  if (isDiscoveryPortIssue(text)) {
    return 'SSDP/UDP-Port 1900 konnte nicht geöffnet werden. Der Port ist vermutlich durch LoxBerry-ssdpd oder einen anderen SSDP-Dienst belegt. Vorhandene Alexa-Geräte funktionieren weiter; für neue Geräte muss die Gerätesuche kurz aktiviert werden.';
  }
  return `Alexa-Geräte sind aktiviert, aber noch nicht bereit: ${text || 'Status unbekannt'}`;
}

function isExpectedDiscoveryInactive(status = {}) {
  if (!status?.enabled || status.ready) return false;
  if (status.discoveryPaused) return true;
  if (isDiscoveryPortIssue(status.error)) return true;
  return !String(status.error || '').trim();
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

function regenerateAlexaBridgeId() {
  if (!alexaBridgeId) return;
  alexaBridgeId.value = createAlexaBridgeId();
  showToast('Neue Bridge-ID erzeugt. Bitte Konfiguration speichern und LoxEvo neu starten.', 'ok');
  markConfigDirty();
  scheduleJsonSyncFromForms();
}

function createAlexaBridgeId() {
  const bytes = new Uint8Array(3);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  const suffix = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `001788FFFE${suffix}`;
}

function toggleHelpBox(button, helpText) {
  if (!button || !helpText) return;
  const content = helpText.innerHTML || helpText.textContent || '';
  toggleHelpTooltip(button, content);
}

function bindHelpTooltip(button, getContent) {
  if (!button || button.dataset.tooltipBound === 'true') return;
  button.dataset.tooltipBound = 'true';
  button.removeAttribute('title');
  button.addEventListener('mouseenter', () => {
    const content = getContent?.();
    if (content) showHelpTooltip(button, content, false);
  });
  button.addEventListener('mouseleave', () => {
    if (activeHelpTooltip?.button === button && !activeHelpTooltip.pinned) hideHelpTooltip();
  });
  button.addEventListener('focus', () => {
    const content = getContent?.();
    if (content) showHelpTooltip(button, content, false);
  });
  button.addEventListener('blur', () => {
    if (activeHelpTooltip?.button === button && !activeHelpTooltip.pinned) hideHelpTooltip();
  });
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const content = getContent?.();
    if (content) toggleHelpTooltip(button, content);
  });
}

function bindStaticHelpTooltips(scope = document) {
  scope.querySelectorAll('.info-button[aria-controls]').forEach((button) => {
    const helpId = button.getAttribute('aria-controls');
    const helpText = helpId ? document.getElementById(helpId) : null;
    if (!helpText || button.dataset.tooltipHoverBound === 'true') return;
    button.dataset.tooltipHoverBound = 'true';
    button.removeAttribute('title');
    button.addEventListener('mouseenter', () => showHelpTooltip(button, helpText.innerHTML || helpText.textContent || '', false));
    button.addEventListener('mouseleave', () => {
      if (activeHelpTooltip?.button === button && !activeHelpTooltip.pinned) hideHelpTooltip();
    });
    button.addEventListener('focus', () => showHelpTooltip(button, helpText.innerHTML || helpText.textContent || '', false));
    button.addEventListener('blur', () => {
      if (activeHelpTooltip?.button === button && !activeHelpTooltip.pinned) hideHelpTooltip();
    });
  });
}

function toggleHelpTooltip(button, content) {
  if (activeHelpTooltip?.button === button && activeHelpTooltip.pinned) {
    hideHelpTooltip();
    return;
  }
  showHelpTooltip(button, content, true);
}

function showHelpTooltip(button, content, pinned = false) {
  if (!button || !String(content || '').trim()) return;
  hideHelpTooltip();
  const tooltip = document.createElement('div');
  tooltip.className = 'help-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.innerHTML = content;
  document.body.append(tooltip);
  activeHelpTooltip = { button, tooltip, pinned };
  button.setAttribute('aria-expanded', 'true');
  positionHelpTooltip(button, tooltip);
}

function hideHelpTooltip() {
  if (!activeHelpTooltip) return;
  activeHelpTooltip.button?.setAttribute('aria-expanded', 'false');
  activeHelpTooltip.tooltip?.remove();
  activeHelpTooltip = null;
}

function positionHelpTooltip(button, tooltip) {
  const buttonRect = button.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const belowTop = buttonRect.bottom + HELP_TOOLTIP_MARGIN;
  const aboveTop = buttonRect.top - tooltipRect.height - HELP_TOOLTIP_MARGIN;
  const top = belowTop + tooltipRect.height < viewportHeight - HELP_TOOLTIP_MARGIN
    ? belowTop
    : Math.max(HELP_TOOLTIP_MARGIN, aboveTop);
  const preferredLeft = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2);
  const left = Math.min(
    Math.max(HELP_TOOLTIP_MARGIN, preferredLeft),
    Math.max(HELP_TOOLTIP_MARGIN, viewportWidth - tooltipRect.width - HELP_TOOLTIP_MARGIN)
  );
  tooltip.style.top = `${Math.round(top + window.scrollY)}px`;
  tooltip.style.left = `${Math.round(left + window.scrollX)}px`;
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
        preflightRow(config.tts?.enabled ? (deviceListCount(tts.defaultSpeakDevices) ? 'ok' : 'warning') : 'optional', 'Sprech-Geräte', ttsSpeakDevicesClientDetail(tts)),
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

function ttsSpeakDevicesClientDetail(status) {
  const defaultCount = deviceListCount(status?.defaultDevices);
  const speakCount = deviceListCount(status?.defaultSpeakDevices);
  const allCount = deviceListCount(status?.allDevices);
  const alarmCount = deviceListCount(status?.alarmDevices);
  if (defaultCount) return `${defaultCount} Standard-Gerät(e) konfiguriert.`;
  if (speakCount) {
    const fallback = [];
    if (allCount) fallback.push(`${allCount} Alle-Gerät(e)`);
    if (alarmCount) fallback.push(`${alarmCount} Alarm-Gerät(e)`);
    return `Kein Standard-Gerät ausgewählt; normale TTS nutzt ${fallback.join(' und ')} als Fallback.`;
  }
  return 'Kein Alexa-Gerät für normale TTS-Ausgaben ausgewählt.';
}

function ttsDeviceSummary(status) {
  if (!status?.ready) return humanizeTtsStatusError(status?.error || '');
  const parts = [
    `Sprechen: ${deviceListCount(status.defaultSpeakDevices)}`,
    `Standard: ${deviceListCount(status.defaultDevices)}`,
    `Alarm: ${deviceListCount(status.alarmDevices)}`
  ];
  const allCount = deviceListCount(status.allDevices);
  if (allCount) parts.push(`Alle: ${allCount}`);
  return `${parts.join(' · ')} Gerät(e).`;
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
  const sections = preflightDisplaySections(preflightInfo.sections || []);
  const summary = summarizePreflightForClient(sections);
  const counts = summary.counts || {};
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
    card.open = preflightSectionNeedsAttention(section);

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
      bindHelpTooltip(helpButton, () => help.textContent);
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

function preflightSectionNeedsAttention(section) {
  return (section.checks || []).some((check) => ['error', 'warning'].includes(check.level));
}

function preflightDisplaySections(sections = []) {
  return sections
    .map((section) => ({
      ...section,
      checks: (section.checks || []).filter((check) => !isDashboardCoveredPreflightCheck({
        section: section.title || '',
        ...check
      }))
    }))
    .filter((section) => (section.checks || []).length);
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
    'LoxEvo|Admin-Schutz': 'Zeigt, ob sensible Web-UI-Aktionen durch ein Admin-Passwort geschützt sind. Alexa-/Hue-Bridge, Loxone-Befehle und TTS-Aufrufe bleiben bewusst offen, damit bestehende Automationen weiter funktionieren.',
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
    'Backup|Lokale Sicherungen': 'Zeigt den letzten bekannten Backup-Export und prüft, ob sich seitdem backup-relevante Einstellungen geändert haben. Relevant sind Loxone-Zugang, Befehle, Räume, Alexa-Bridge, Gerätesuche, TTS, Geräteauswahl, Lautstärken und Server-Einstellungen. Dry-Run/Live-Modus wird bewusst ignoriert.',
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
    if (dependency.update?.restartRequired) {
      message.classList.add('restart-required');
    }

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
    const updateButtonState = () => {
      const selectedVersion = versionSelect.value;
      const installedVersion = dependency.installedVersion || '';
      const selectedIsInstalled = installedVersion && selectedVersion === installedVersion;
      const comparison = installedVersion && selectedVersion ? comparePackageVersions(selectedVersion, installedVersion) : 1;
      if (dependency.update?.status === 'running') {
        updateButton.textContent = 'Installation läuft';
        updateButton.disabled = true;
        return;
      }
      if (dependency.latestError) {
        updateButton.textContent = dependency.installedVersion ? 'Update nicht möglich' : 'Installation nicht möglich';
        updateButton.disabled = true;
        return;
      }
      if (selectedIsInstalled) {
        updateButton.textContent = 'Up to date';
        updateButton.disabled = true;
        return;
      }
      if (!dependency.installedVersion) {
        updateButton.textContent = 'Installieren';
      } else if (comparison < 0) {
        updateButton.textContent = 'Downgrade installieren';
      } else {
        updateButton.textContent = 'Update installieren';
      }
      updateButton.disabled = false;
    };
    updateButtonState();
    versionSelect.addEventListener('change', updateButtonState);
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

function comparePackageVersions(left, right) {
  const leftParts = String(left || '').replace(/^[^\d]*/, '').split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = String(right || '').replace(/^[^\d]*/, '').split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

async function updateDependency(name, version, button) {
  const requestedActionText = button?.textContent?.toLowerCase().includes('downgrade') ? 'Downgrade' : 'Update';
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
    showToast(`${requestedActionText} installiert. Neustart empfohlen.`, 'ok');
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

async function setAlexaBridgeDebug(enabled) {
  const previous = config?.alexaBridge?.debug === true;
  if (configDirty) {
    if (alexaBridgeDebug) alexaBridgeDebug.checked = previous;
    showToast('Bitte zuerst ungespeicherte Konfigurationsänderungen speichern oder verwerfen.', 'error');
    return;
  }
  try {
    const nextConfig = structuredClone(config);
    nextConfig.alexaBridge ||= {};
    nextConfig.alexaBridge.debug = enabled === true;
    const result = await putJson('/api/config', nextConfig);
    config = result.config;
    populateForms();
    syncJsonFromForms();
    captureSavedConfigSnapshot();
    markConfigClean();
    await loadAlexaBridgeStatus();
    await loadEvents();
    renderDashboard();
    showToast(enabled ? 'Alexa-Bridge Debug-Protokoll aktiv' : 'Alexa-Bridge Debug-Protokoll aus', 'ok');
  } catch (error) {
    if (alexaBridgeDebug) alexaBridgeDebug.checked = previous;
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
    setupSummary.className = 'setup-summary error';
    setupSummary.textContent = `Setup-Status konnte nicht geladen werden: ${errorText}`;
    setupChecks.innerHTML = '';
    if (setupDetailsCount) setupDetailsCount.textContent = '0';
    return;
  }

  if (!setupStatus) return;

  setupPanel.classList.toggle('setup-complete', setupStatus.complete);
  setupPanel.classList.toggle('setup-warning', !setupStatus.complete);
  setupSummary.className = `setup-summary ${setupStatus.complete ? 'ok' : 'warning'}`;
  setupSummary.textContent = setupStatus.complete
    ? setupStatus.dryRun
      ? 'Die Basiskonfiguration ist vollständig. Dry-Run ist für erste Tests aktiv.'
      : 'Die Basiskonfiguration ist vollständig. Live-Modus ist aktiv.'
    : `${setupStatus.openRequired} notwendige Einrichtungsschritte sind noch offen.`;

  if (setupDetailsCount) setupDetailsCount.textContent = String(setupStatus.checks.length);
  if (setupDetails) setupDetails.open = false;
  setupChecks.innerHTML = '';
  setupStatus.checks.forEach((check) => {
    const row = document.createElement('div');
    row.className = `setup-check ${check.ok ? 'ok' : 'open'} ${check.optional ? 'optional' : ''}`.trim();

    const marker = document.createElement('span');
    marker.className = `setup-marker command-badge ${setupCheckBadgeTone(check)}`;
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

function setupCheckBadgeTone(check = {}) {
  if (check.ok) return 'ok';
  if (check.optional) return 'internal';
  return 'error';
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
      showToast('Statuskontrolle aktualisiert', 'ok');
    }
  } catch (error) {
    if (button) setButtonFeedback(button, 'error', 'Fehler');
    showToast(error.message, 'error');
  }
}

function renderDashboard() {
  if (!dashboardCards) return;
  const adminStatus = dashboardAdminStatus();
  const loxoneStatus = dashboardLoxoneStatus();
  const systemStatus = dashboardSystemStatus();
  const alexaBridgeStatus = dashboardAlexaBridgeStatus();
  const rows = [
    dashboardStatusRow('Loxone', loxoneStatus.value, loxoneStatus.level, loxoneStatus.detail, 'Zeigt, ob LoxEvo echte Befehle an den Loxone-Miniserver senden kann. Die Zeile prüft die wichtigsten Loxone-Grundlagen: Miniserver-URL, Zugangsdaten, konfigurierte Befehle und Betriebsmodus.', loxoneStatus.target),
    dashboardStatusRow('Alexa TTS', ttsStatus?.ready ? 'Bereit' : config?.tts?.enabled ? 'Prüfen' : 'Deaktiviert', ttsStatus?.ready ? 'ok' : config?.tts?.enabled ? 'warning' : 'optional', ttsDeviceSummary(ttsStatus), 'Zeigt den Status der Alexa-Sprachausgabe. Bereit bedeutet, dass alexa-remote2 verbunden ist und LoxEvo die konfigurierten Echo-Geräte für normale TTS- oder Alarmmeldungen verwenden kann.', 'config:Alexa TTS'),
    dashboardStatusRow('Virtuelle Alexa-Geräte', alexaBridgeInfo?.bridgeHttp?.ready ? 'Bereit' : config?.alexaBridge?.enabled ? 'HTTP prüfen' : 'Deaktiviert', alexaBridgeInfo?.bridgeHttp?.ready ? 'ok' : config?.alexaBridge?.enabled ? 'warning' : 'optional', `${alexaBridgeInfo?.deviceCount ?? 0} Gerät(e), Alexa/Hue-Port ${alexaBridgeInfo?.port || config?.alexaBridge?.advertisePort || 80}.`, 'Zeigt, ob LoxEvo die lokalen Hue-kompatiblen Geräte für Alexa bereitstellt. Diese Funktion ist für Sprachbefehle wie Licht ein oder aus zuständig und läuft unabhängig von Alexa TTS.', 'config:Alexa-Geräte'),
    dashboardStatusRow('Gerätesuche', alexaBridgeInfo?.ready ? 'Aktiv' : config?.alexaBridge?.enabled ? 'Optional' : 'Deaktiviert', alexaBridgeInfo?.ready ? 'ok' : config?.alexaBridge?.enabled ? 'optional' : 'info', alexaBridgeInfo?.ready ? 'Neue Geräte können gesucht werden.' : 'Für bestehende Geräte normalerweise nicht kritisch.', 'SSDP/UDP 1900 wird nur für das Suchen und Hinzufügen neuer virtueller Alexa-Geräte benötigt. Bereits gefundene Geräte funktionieren normalerweise weiter. Für neue Geräte unter Konfiguration die Alexa-Gerätesuche kurz aktivieren, in der Alexa-App suchen und danach wieder beenden.', 'config:Alexa-Gerätesuche'),
    dashboardStatusRow('Backup', backupStateTitle(), backupReminderLevel(), backupStateDetail(), 'Zeigt, ob seit dem letzten Backup backup-relevante Einstellungen geändert wurden. Backup-relevant sind Loxone-Zugang, Befehle, Räume, Alexa-Bridge, Gerätesuche, TTS-Einstellungen, Geräteauswahl, Lautstärken und Server-Einstellungen. Nicht backup-relevant ist der Betriebszustand Dry-Run/Live-Modus. Die Alexa-Cookie-Datei wird nur gesichert, wenn du sie beim Export bewusst einschliesst.', 'maintenance:maintenanceBackupPanel'),
    dashboardStatusRow('Admin-Schutz', adminStatus.value, adminStatus.level, adminStatus.detail, 'Zeigt, ob sensible Web-UI-Aktionen wie Konfiguration, Backup, Restore, Neustart oder Protokoll löschen mit einem Admin-Passwort geschützt sind. Loxone-Befehle, TTS und Alexa/Hue-Endpunkte bleiben bewusst offen für lokale Automationen.', 'maintenance:maintenanceAdminPanel'),
    dashboardStatusRow('Systemprüfung', systemStatus.value, systemStatus.level, systemStatus.detail, 'Fasst technische Zusatzprüfungen aus Wartung zusammen. Hinweise, die bereits eigene Statuszeilen haben, werden hier nicht nochmals als offene Punkte gewertet. Details findest du im Register Wartung.', 'maintenance:maintenanceSystemCheckPanel')
  ];
  const bridgeRowIndex = rows.findIndex((row) => row.includes('Virtuelle Alexa-Ger'));
  if (bridgeRowIndex >= 0) {
    rows[bridgeRowIndex] = dashboardStatusRow('Virtuelle Alexa-Geräte', alexaBridgeStatus.value, alexaBridgeStatus.level, alexaBridgeStatus.detail, 'Zeigt, ob LoxEvo die lokalen Hue-kompatiblen Geräte für Alexa bereitstellt. Diese Funktion ist für Sprachbefehle wie Licht ein oder aus zuständig und läuft unabhängig von Alexa TTS.', 'config:Alexa-Geräte');
  }
  dashboardCards.innerHTML = prioritizeDashboardRows(rows).join('');
  bindDashboardHelpButtons();
  bindDashboardRowNavigation();
  renderBackupReminder();
  renderWizardPrompt();
}

function dashboardAdminStatus() {
  if (!adminSecurityInfo) {
    return {
      value: 'Prüfen',
      level: 'warning',
      detail: 'Admin-Schutz-Status wird geladen.'
    };
  }
  if (adminSecurityInfo.enabled && adminSecurityInfo.source === 'environment') {
    return {
      value: 'Docker-ENV',
      level: 'ok',
      detail: adminSecurityInfo.message || 'Admin-Schutz ist per Docker-Umgebungswert aktiv.'
    };
  }
  if (adminSecurityInfo.enabled) {
    return {
      value: 'Aktiv',
      level: 'ok',
      detail: adminSecurityInfo.message || 'Admin-Schutz ist aktiv.'
    };
  }
  return {
    value: 'Optional',
    level: 'optional',
    detail: adminSecurityInfo.message || 'Admin-Schutz ist deaktiviert. Sensible Web-UI-Aktionen sind ohne Admin-Passwort erreichbar.'
  };
}

function dashboardAlexaBridgeStatus() {
  if (!config?.alexaBridge?.enabled) {
    return {
      value: 'Deaktiviert',
      level: 'optional',
      detail: 'Virtuelle Alexa-Geräte sind deaktiviert.'
    };
  }

  const status = alexaBridgeInfo || {};
  const port = status.port || config?.alexaBridge?.advertisePort || 80;
  const deviceCount = status.deviceCount ?? 0;

  if (status.bridgeHttp?.error) {
    return {
      value: 'HTTP prüfen',
      level: 'warning',
      detail: status.bridgeHttp.error
    };
  }

  if (status.bridgeHttp?.ready || Number(port) === Number(config?.server?.port)) {
    return {
      value: 'Bereit',
      level: 'ok',
      detail: `${deviceCount} Gerät(e), Alexa/Hue-Port ${port}.`
    };
  }

  return {
    value: 'Prüfen',
    level: 'warning',
    detail: `${deviceCount} Gerät(e), Alexa/Hue-Port ${port}. HTTP-Status noch nicht geladen.`
  };
}

function dashboardLoxoneStatus() {
  const hasUrl = isValidHttpUrl(config?.loxone?.baseUrl || '');
  const hasLogin = Boolean(config?.loxone?.username && config?.loxone?.password);
  const commandCount = Object.keys(getRunnableCommands()).length;

  if (!hasUrl) {
    return {
      value: 'Prüfen',
      level: 'warning',
      detail: 'Miniserver-URL fehlt oder ist ungültig.',
      target: 'config:Loxone'
    };
  }
  if (!hasLogin) {
    return {
      value: 'Prüfen',
      level: 'warning',
      detail: 'Loxone-Benutzer oder Passwort fehlen.',
      target: 'config:Loxone'
    };
  }
  if (!commandCount) {
    return {
      value: 'Prüfen',
      level: 'warning',
      detail: 'Noch keine aktiven Loxone-Befehle konfiguriert.',
      target: 'config:Befehle und Sprachnamen'
    };
  }
  return {
    value: config?.loxone?.dryRun === false ? 'Live-Modus' : 'Dry-Run',
    level: config?.loxone?.dryRun === false ? 'ok' : 'info',
    detail: config?.loxone?.dryRun === false
      ? 'Befehle werden an den Miniserver gesendet.'
      : 'Befehle werden nur protokolliert.',
    target: 'config:Loxone'
  };
}

function dashboardSystemStatus() {
  if (!preflightInfo?.sections?.length) {
    return {
      value: 'Prüfen',
      level: 'info',
      detail: 'Systemprüfung wurde noch nicht geladen.'
    };
  }

  const relevantChecks = preflightInfo.sections
    .flatMap((section) => (section.checks || []).map((check) => ({
      section: section.title || '',
      ...check
    })))
    .filter((check) => !isDashboardCoveredPreflightCheck(check));

  const errors = relevantChecks.filter((check) => check.level === 'error');
  if (errors.length) {
    return {
      value: 'Fehler',
      level: 'error',
      detail: `${errors.length} technische Prüfung(en) benötigen Aufmerksamkeit.`
    };
  }

  const warnings = relevantChecks.filter((check) => check.level === 'warning');
  if (warnings.length) {
    return {
      value: 'Prüfen',
      level: 'warning',
      detail: `${warnings.length} technische Hinweis(e) prüfen.`
    };
  }

  return {
    value: 'OK',
    level: 'ok',
    detail: 'Keine zusätzlichen technischen Probleme gefunden.'
  };
}

function isDashboardCoveredPreflightCheck(check) {
  const section = String(check.section || '');
  const label = String(check.label || '');
  if (section === 'Backup') return true;
  if (section === 'Loxone') return true;
  if (section === 'Alexa TTS') return true;
  if (section === 'Virtuelle Alexa-Geräte') return true;
  if (section === 'LoxEvo' && ['Admin-Schutz', 'Version', 'Laufzeit', 'Datenhaltung'].includes(label)) return true;
  return false;
}

function prioritizeDashboardRows(rows) {
  const priority = { error: 0, warning: 1, optional: 2, info: 3, ok: 4 };
  return [...rows].sort((left, right) => {
    const leftLevel = left.match(/dashboard-status-row ([a-z]+)/)?.[1] || 'info';
    const rightLevel = right.match(/dashboard-status-row ([a-z]+)/)?.[1] || 'info';
    return (priority[leftLevel] ?? 3) - (priority[rightLevel] ?? 3);
  });
}

function dashboardStatusRow(title, value, level, detail, helpText, target = '') {
  const safeLevel = ['ok', 'warning', 'error', 'optional', 'info'].includes(level) ? level : 'info';
  const helpId = `dashboard-help-${normalizeText(title).replace(/[^a-z0-9]+/g, '-')}`;
  const actionAttrs = target ? ` role="button" tabindex="0" data-dashboard-target="${escapeHtml(target)}"` : '';
  return `
    <article class="dashboard-status-row ${safeLevel}${target ? ' clickable' : ''}"${actionAttrs}>
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
    bindHelpTooltip(button, () => help?.innerHTML || help?.textContent || '');
  });
}

function backupStateTitle() {
  if (configDirty || backupNeedsExport()) return 'Empfohlen';
  return getLastBackupExportAt() ? 'Exportiert' : 'Kein Export';
}

function backupReminderLevel() {
  return configDirty || backupNeedsExport() ? 'warning' : getLastBackupExportAt() ? 'ok' : 'optional';
}

function bindDashboardRowNavigation() {
  dashboardCards?.querySelectorAll('.dashboard-status-row[data-dashboard-target]').forEach((row) => {
    const openTarget = () => openDashboardTarget(row.dataset.dashboardTarget || '');
    row.addEventListener('click', (event) => {
      if (event.target.closest('.dashboard-info-button')) return;
      openTarget();
    });
    row.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openTarget();
    });
  });
}

function openDashboardTarget(target) {
  const [kind, value] = String(target || '').split(':');
  if (kind === 'config' && value) {
    openConfigArea(value);
    return;
  }
  if (kind === 'maintenance' && value) {
    openMaintenanceArea(value);
  }
}

function openMaintenanceArea(elementId) {
  showView('maintenanceView');
  window.setTimeout(() => {
    highlightTargetElement(document.getElementById(elementId));
  }, 220);
}

function highlightTargetElement(element) {
  if (!element) return;
  element.classList.remove('target-highlight');
  window.setTimeout(() => {
    const top = element.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    element.classList.add('target-highlight');
    window.setTimeout(() => element.classList.remove('target-highlight'), 3600);
  }, 120);
}

function backupStateDetail() {
  const lastExport = getLastBackupExportAt();
  if (configDirty) return 'Seit der letzten Änderung wurde noch kein Backup exportiert.';
  if (backupNeedsExport()) {
    const changedText = backupChangedSectionsText();
    return lastExport
      ? `Seit dem letzten Export am ${formatDateTime(lastExport)} wurden Einstellungen geändert.${changedText}`
      : 'Noch kein Backup exportiert. Backup wird empfohlen.';
  }
  return lastExport ? `Letzter Export: ${formatDateTime(lastExport)}. Keine relevanten Änderungen seitdem.` : 'Backup kann unter Wartung exportiert werden.';
}

function getLastBackupExportAt() {
  return preflightInfo?.backup?.lastExport?.exportedAt || localStorage.getItem(LAST_BACKUP_EXPORT_KEY);
}

function backupNeedsExport() {
  return Boolean(preflightInfo?.backup?.needsBackup);
}

function backupChangedSectionsText() {
  const sections = preflightInfo?.backup?.changedSections || [];
  return sections.length ? ` Betroffen: ${sections.join(', ')}.` : '';
}

function renderBackupReminder() {
  if (!backupReminder) return;
  backupReminder.hidden = true;
  backupReminder.textContent = '';
}

function renderWizardPrompt() {
  if (!wizardPrompt) return;
  const skipped = localStorage.getItem(SETUP_WIZARD_SKIPPED_KEY) === 'true';
  const hasOpenSetup = setupStatus && !setupStatus.complete;
  const shouldShow = !skipped && (hasOpenSetup || !getLastBackupExportAt());
  wizardPrompt.hidden = !shouldShow;
  if (openWizardBtn) openWizardBtn.hidden = !skipped;
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
    ${step.status ? `<div><span class="command-badge ${statusClassToBadgeTone(step.statusClass)}">${escapeHtml(step.status)}</span></div>` : ''}
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
        { label: 'Zur Statuskontrolle', secondary: true, run: () => showView('dashboardView') }
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
    highlightTargetElement(target);
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
  if (alexaBridgeId) alexaBridgeId.value = config.alexaBridge?.bridgeId || '';
  if (alexaBridgeDebug) alexaBridgeDebug.checked = config.alexaBridge?.debug === true;

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

function renderCommandEditor(openCommandKey = '') {
  const openCommandKeys = new Set(
    [...roomEditor.querySelectorAll('.room-card[open]')]
      .map((card) => normalizeInputKey(card.querySelector('.command-key')?.value || card.dataset.commandOriginal || ''))
      .filter(Boolean)
  );
  if (roomEditor.querySelector('.room-card')) {
    config = collectConfigFromForms();
  }
  roomEditor.innerHTML = '';
  updateCommandCategoryFilter();
  const filteredCommands = filterConfiguredCommands(Object.entries(getConfiguredCommands()));
  roomEditor.dataset.renderedCommands = JSON.stringify(filteredCommands.map(([commandKey]) => commandKey));
  const commandGroups = groupCommandsByCategory(filteredCommands, { newCommandsFirst: true });
  if (!filteredCommands.length) {
    roomEditor.innerHTML = '<p class="empty">Keine Befehle passend zum Filter gefunden.</p>';
  }
  Object.entries(commandGroups).forEach(([category, commands]) => {
    const groupShouldOpen = commands.some(([commandKey]) => commandKey === openCommandKey || openCommandKeys.has(commandKey));
    const group = createCategoryGroup(category, commands.length, groupShouldOpen);
    commands.forEach(([commandKey, command]) => {
      const card = createCommandCard(commandKey, command);
      card.open = commandKey === openCommandKey || openCommandKeys.has(commandKey);
      group.append(card);
    });
    roomEditor.append(group);
  });
  updateConfigSectionCounts();
}

function statusClassToBadgeTone(statusClass = '') {
  if (statusClass === 'ready' || statusClass === 'ok') return 'ok';
  if (statusClass === 'warning') return 'warning';
  if (statusClass === 'error') return 'error';
  if (statusClass === 'disabled') return 'disabled';
  return 'info';
}

function updateCommandCategoryFilter() {
  if (!commandCategoryFilter) return;
  const selected = commandCategoryFilter.value;
  const selectedCategoryKey = normalizeCategoryName(selected);
  const categoryMap = new Map();
  Object.values(getConfiguredCommands()).forEach((command) => {
    const category = commandBaseCategory(command);
    const categoryKey = normalizeCategoryName(category);
    if (!categoryMap.has(categoryKey)) {
      categoryMap.set(categoryKey, displayPart(category) || 'Allgemein');
    }
  });
  const categories = [...categoryMap.values()]
    .sort((a, b) => displayPart(a).localeCompare(displayPart(b), 'de-CH'));
  commandCategoryFilter.innerHTML = '<option value="">Alle Rubriken</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = displayPart(category) || 'Allgemein';
    commandCategoryFilter.append(option);
  });
  const restoredCategory = categories.find((category) => normalizeCategoryName(category) === selectedCategoryKey);
  if (restoredCategory) {
    commandCategoryFilter.value = restoredCategory;
  }
}

function filterConfiguredCommands(entries) {
  const query = normalizeText(commandSearch?.value || '');
  const category = commandCategoryFilter?.value || '';
  const viewFilter = commandViewFilter?.value || '';
  const onlyInvalid = Boolean(commandOnlyInvalid?.checked);
  const categoryKey = normalizeCategoryName(category);
  return entries.filter(([commandKey, command]) => {
    if (category && normalizeCategoryName(commandBaseCategory(command)) !== categoryKey) return false;
    if (viewFilter && !matchesCommandViewFilter(commandKey, command, viewFilter)) return false;
    if (onlyInvalid && !isCommandIncomplete(commandKey, command)) return false;
    if (!query) return true;
    const target = getCommandTarget(command);
    return [
      commandKey,
      command.label,
      command.voiceName,
      command.category,
      command.room,
      command.function,
      command.action,
      command.offCommand,
      command.confirmation?.text,
      command.alexaExpose === false ? 'intern' : 'alexa',
      command.confirmation?.enabled ? 'rueckmeldung' : '',
      target.type,
      target.uuid,
      target.value,
      target.path,
      target.offValue,
      target.offPath
    ].some((value) => normalizeText(value).includes(query));
  });
}

function isCommandIncomplete(commandKey, command) {
  return commandValidationIssues(commandKey, command).length > 0;
}

function matchesCommandViewFilter(commandKey, command, filter) {
  if (filter === 'alexa') return command.enabled !== false && command.alexaExpose !== false;
  if (filter === 'internal') return command.alexaExpose === false || command.enabled === false;
  if (filter === 'switch') return command.alexaMode !== 'action';
  if (filter === 'action') return command.alexaMode === 'action';
  if (filter === 'confirmation') return command.confirmation?.enabled === true;
  if (filter === 'issues') return commandValidationIssues(commandKey, command).length > 0;
  return true;
}

function createCommandCard(commandKey, command) {
  const card = document.createElement('details');
  card.className = 'room-card';
  card.dataset.commandOriginal = commandKey;
  card.open = false;

  const head = document.createElement('summary');
  head.className = 'room-card-head';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'command-summary-main';

  const titleLine = document.createElement('div');
  titleLine.className = 'command-summary-titleline';

  const title = document.createElement('strong');
  title.className = 'command-summary-title';
  title.textContent = getCommandDisplayName(commandKey, command);

  const key = document.createElement('span');
  key.className = 'command-summary-key';
  key.textContent = commandKey;

  titleLine.append(title, key);

  const badges = document.createElement('div');
  badges.className = 'command-summary-badges';
  commandSummaryBadges(commandKey, command).forEach((badge) => badges.append(createCommandBadge(badge.label, badge.tone)));
  titleWrap.append(titleLine, badges);

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'secondary small danger-text';
  deleteButton.textContent = 'Entfernen';
  deleteButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    unmarkDraftCommand(card.dataset.commandOriginal);
    unmarkDraftCommand(card.querySelector('.command-key')?.value || '');
    card.remove();
    syncConfigFromForms();
    markConfigDirty();
    renderCommandEditor();
    renderCommands();
  });

  head.append(titleWrap, deleteButton);

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
    <label class="option-label">
      <span class="option-label-head">Aktiv<button type="button" class="info-button info-button-small inline-help-button" aria-expanded="false" aria-label="Befehl verwenden erklären">i</button></span>
      <span class="checkbox-row inline"><input class="command-enabled" type="checkbox"><span>Befehl verwenden</span></span>
      <span class="compact-help inline-help-text" hidden>Befehl verwenden aktiviert diesen Eintrag in LoxEvo. Nur aktive Befehle können getestet, per URL aufgerufen, von Alexa ausgelöst oder als interner Aus-Befehl verwendet werden. Wenn der Haken entfernt ist, bleibt der Eintrag gespeichert, wird aber nicht ausgeführt und erscheint auch nicht bei der Alexa-Gerätesuche, selbst wenn Als Alexa-Gerät anbieten aktiv ist.</span>
    </label>
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

  const alexa = document.createElement('div');
  alexa.className = 'form-row command-alexa-grid';
  alexa.innerHTML = `
    <label class="option-label">
      <span class="option-label-head">Alexa-Modus<button type="button" class="info-button info-button-small inline-help-button" aria-expanded="false" aria-label="Alexa-Modus erklären">i</button></span>
      <select class="command-alexa-mode">
        <option value="switch">Schalter: Ein/Aus</option>
        <option value="action">Aktion: nur Einschalten ausführen</option>
      </select>
      <span class="compact-help inline-help-text" hidden>Schalter verwendet Ein und Aus. Beim Ausschalten nutzt LoxEvo zuerst den optionalen Aus-Befehl, sonst einen passenden Aus-Befehl im gleichen Raum und mit gleicher Funktion. Aktion ist ein einzelnes Signal: Einschalten löst den Befehl aus, Ausschalten wird ignoriert.</span>
    </label>
    <label class="option-label">
      <span class="option-label-head">Aus-Befehl beim Ausschalten (optional)<button type="button" class="info-button info-button-small inline-help-button" aria-expanded="false" aria-label="Aus-Befehl beim Ausschalten erklären">i</button></span>
      <input class="command-off-command" type="text" placeholder="z. B. kueche_licht_aus">
      <span class="compact-help inline-help-text" hidden>Dieses Feld gilt nur für das Ausschalten eines Alexa-Schaltergeräts. Trage hier den LoxEvo-Befehl ein, der bei Aus ausgeführt werden soll, zum Beispiel kueche_licht_aus. Der Aus-Befehl muss in LoxEvo vorhanden und aktiv sein. Er muss normalerweise nicht als Alexa-Gerät angeboten werden; für interne Aus-Befehle ist es meist besser, ihn in Alexa auszublenden.</span>
    </label>
    <label class="option-label">
      <span class="option-label-head">Alexa-Gerät<button type="button" class="info-button info-button-small inline-help-button" aria-expanded="false" aria-label="Alexa-Gerät anbieten erklären">i</button></span>
      <span class="checkbox-row inline"><input class="command-alexa-expose" type="checkbox"><span>Als Alexa-Gerät anbieten</span></span>
      <span class="compact-help inline-help-text" hidden>Wenn aktiv, wird dieser aktive Befehl bei der Alexa-Gerätesuche als eigenes virtuelles Gerät in der Alexa-App sichtbar und kann dort für Sprache, App-Bedienung und Routinen genutzt werden. Wenn deaktiviert, bleibt der Befehl nur innerhalb von LoxEvo nutzbar, sofern Befehl verwenden aktiv ist. Befehle, die im Feld Aus-Befehl beim Ausschalten eingetragen werden, sollten meist nicht zusätzlich als Alexa-Gerät angeboten werden, sonst können Gruppen oder Routinen denselben Aus-Befehl doppelt auslösen.</span>
    </label>
    <div class="option-label command-confirmation-block">
      <span class="option-label-head">Rückmeldung<button type="button" class="info-button info-button-small inline-help-button" aria-expanded="false" aria-label="Rückmeldung erklären">i</button></span>
      <div class="command-confirmation-control">
        <label class="checkbox-row inline"><input class="command-confirmation-enabled" type="checkbox"><span>Sprechen</span></label>
        <input class="command-confirmation-text" type="text" maxlength="300" placeholder="OK">
      </div>
      <span class="compact-help inline-help-text" hidden>Wenn aktiv, spricht LoxEvo nach einem erfolgreichen Alexa-Befehl den Rückmeldungstext über die Standard-TTS-Geräte. Der Loxone-Befehl und die Alexa-Antwort werden dadurch nicht blockiert; die Ausgabe kommt so schnell, wie Alexa TTS gerade reagiert.</span>
    </div>
  `;
  alexa.querySelector('.command-alexa-mode').value = command.alexaMode === 'action' ? 'action' : 'switch';
  alexa.querySelector('.command-off-command').value = command.offCommand || '';
  const offTargetLabel = document.createElement('label');
  offTargetLabel.className = 'option-label';
  offTargetLabel.innerHTML = `
    <span class="option-label-head">Aus-Wert/Pfad (optional)<button type="button" class="info-button info-button-small inline-help-button" aria-expanded="false" aria-label="Aus-Wert oder Aus-Pfad erklären">i</button></span>
    <input class="command-off-target" type="text" placeholder="z. B. 778">
    <span class="compact-help inline-help-text" hidden>Einfacher Ausschaltwert direkt am selben Alexa-Schalter. Für changeTo/direct wird dieser Wert mit derselben UUID gesendet, zum Beispiel Ein=1 und Aus=778. Bei raw ist hier ein kompletter Aus-Pfad möglich. Wenn dieses Feld gefüllt ist, braucht es für diesen Schalter keinen separaten internen Aus-Befehl.</span>
  `;
  const alexaExposeLabel = alexa.querySelector('.command-alexa-expose')?.closest('.option-label');
  alexa.insertBefore(offTargetLabel, alexaExposeLabel || alexa.firstChild);
  alexa.querySelector('.command-off-target').value = target.type === 'raw' ? target.offPath : target.offValue;
  alexa.querySelector('.command-alexa-expose').checked = command.alexaExpose !== false;
  alexa.querySelector('.command-confirmation-enabled').checked = command.confirmation?.enabled === true;
  alexa.querySelector('.command-confirmation-text').value = command.confirmation?.text || 'OK';

  const raw = document.createElement('div');
  raw.className = 'form-row';
  raw.innerHTML = `
    <label class="option-label">
      <span class="option-label-head">Spezialpfad (nur bei raw)<button type="button" class="info-button info-button-small inline-help-button" aria-expanded="false" aria-label="Spezialpfad erklären">i</button></span>
      <input class="command-path" type="text" placeholder="Nur bei Befehlstyp raw aktiv">
      <span class="compact-help inline-help-text" hidden>Dieses Feld wird nur beim Befehlstyp raw verwendet. Für changeTo, direct und pulse reichen UUID und Wert/Befehl. Raw ist für komplette Loxone-Pfade gedacht, zum Beispiel spezielle Befehle wie FullUp oder FullDown.</span>
    </label>
  `;
  raw.querySelector('.command-path').value = target.path;

  card.append(
    head,
    createCommandSection('Basisdaten', fields),
    createCommandSection('Zuordnung', details),
    createCommandSection('Loxone', loxone),
    createCommandSection('Alexa und Rückmeldung', alexa),
    createCommandSection('Spezial', raw)
  );
  initInlineHelpButtons(card);
  updatePathFieldState(card);
  updateCommandCardValidation(card);
  return card;
}

function createCommandSection(title, content) {
  const section = document.createElement('section');
  section.className = 'command-detail-section';
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading, content);
  return section;
}

function initInlineHelpButtons(scope) {
  scope.querySelectorAll('.inline-help-button').forEach((button) => {
    const help = button.closest('.option-label')?.querySelector('.inline-help-text');
    if (!help) return;
    bindHelpTooltip(button, () => help.innerHTML || help.textContent || '');
  });
}


function updateCommandCardValidation(card) {
  if (!card) return;
  const commandKey = normalizeInputKey(card.querySelector('.command-key')?.value || card.dataset.commandOriginal || '');
  const command = collectCommandFromCard(card, commandKey);
  const issues = commandValidationIssues(commandKey, command);
  const title = card.querySelector('.command-summary-title');
  const key = card.querySelector('.command-summary-key');
  const badges = card.querySelector('.command-summary-badges');

  if (title) title.textContent = getCommandDisplayName(commandKey, command);
  if (key) key.textContent = commandKey || 'neuer_befehl';
  if (badges) {
    badges.innerHTML = '';
    commandSummaryBadges(commandKey, command).forEach((badge) => badges.append(createCommandBadge(badge.label, badge.tone)));
  }

  card.querySelectorAll('.command-validation-field-error, .command-validation-field-warning')
    .forEach((field) => field.classList.remove('command-validation-field-error', 'command-validation-field-warning'));
  issues.forEach((issue) => {
    commandIssueFields(card, issue.label)
      .forEach((field) => field.classList.add(`command-validation-field-${issue.level}`));
  });
}

function commandIssueFields(card, label) {
  const selectorMap = {
    'Name fehlt': ['.command-label', '.command-voice'],
    'Typ prüfen': ['.command-type'],
    'UUID fehlt': ['.command-uuid'],
    'UUID ungültig': ['.command-uuid'],
    'Wert fehlt': ['.command-value'],
    'Pfad fehlt': ['.command-path'],
    'Aus-Befehl fehlt': ['.command-off-command'],
    'Aus-Befehl inaktiv': ['.command-off-command'],
    'Aus-Befehl Kreis': ['.command-off-command'],
    'Text fehlt': ['.command-confirmation-text']
  };
  return (selectorMap[label] || [])
    .map((selector) => card.querySelector(selector))
    .filter(Boolean);
}

function commandSummaryBadges(commandKey, command) {
  const target = getCommandTarget(command);
  const alexaMode = command.alexaMode === 'action' ? 'Aktion' : 'Schalter';
  const issues = commandValidationIssues(commandKey, command);
  return [
    { label: displayPart(commandBaseCategory(command)), tone: 'neutral' },
    command.room ? { label: displayPart(command.room), tone: 'neutral' } : null,
    { label: target.type, tone: 'technical' },
    { label: alexaMode, tone: command.alexaMode === 'action' ? 'action' : 'switch' },
    command.enabled === false
      ? { label: 'inaktiv', tone: 'disabled' }
      : { label: 'aktiv', tone: 'ok' },
    command.enabled !== false && command.alexaExpose !== false
      ? { label: 'Alexa', tone: 'alexa' }
      : { label: 'Intern', tone: 'internal' },
    command.offCommand ? { label: 'Aus-Befehl', tone: 'off' } : null,
    target.offValue || target.offPath ? { label: 'Aus-Wert', tone: 'off' } : null,
    command.confirmation?.enabled ? { label: 'Rückmeldung', tone: 'info' } : null,
    ...issues.map((issue) => ({ label: issue.label, tone: issue.level }))
  ].filter(Boolean);
}

function createCommandBadge(label, tone = 'neutral') {
  const badge = document.createElement('span');
  badge.className = `command-badge ${tone}`;
  badge.textContent = label;
  return badge;
}

function commandValidationIssues(commandKey, command = {}, commandMap = getConfiguredCommands()) {
  const issues = [];
  const target = getCommandTarget(command);
  const label = getCommandDisplayName(commandKey, command);
  const requiredLevel = command.enabled === false ? 'warning' : 'error';
  const addRequiredIssue = (labelText, text) => {
    issues.push({ level: requiredLevel, label: labelText, text });
  };
  if (!String(label || '').trim()) {
    addRequiredIssue('Name fehlt', 'Anzeigename oder Sprachname fehlt.');
  }
  if (!isKnownCommandType(target.type)) {
    addRequiredIssue('Typ prüfen', `Befehlstyp "${target.type || 'leer'}" ist unbekannt.`);
  } else if (target.type === 'raw') {
    if (!String(target.path || '').trim()) {
      addRequiredIssue('Pfad fehlt', 'Raw-Befehle benötigen einen Spezialpfad.');
    }
  } else if (target.type === 'pulse') {
    if (!String(target.uuid || '').trim()) {
      addRequiredIssue('UUID fehlt', 'Pulse-Befehle benötigen eine Loxone UUID.');
    } else if (!isValidLoxoneUuid(target.uuid)) {
      addRequiredIssue('UUID ungültig', 'Loxone UUID muss als 8-4-4-16, als 8-4-4-4-12 oder als 32 Hex-Zeichen ohne Bindestriche eingetragen sein.');
    }
  } else {
    if (!String(target.uuid || '').trim()) {
      addRequiredIssue('UUID fehlt', `${target.type}-Befehle benötigen eine Loxone UUID.`);
    } else if (!isValidLoxoneUuid(target.uuid)) {
      addRequiredIssue('UUID ungültig', 'Loxone UUID muss als 8-4-4-16, als 8-4-4-4-12 oder als 32 Hex-Zeichen ohne Bindestriche eingetragen sein.');
    }
    if (!String(target.value || '').trim()) {
      addRequiredIssue('Wert fehlt', `${target.type}-Befehle benötigen einen Wert/Befehl.`);
    }
  }

  const offCommand = normalizeInputKey(command.offCommand || '');
  if (offCommand) {
    const offTarget = commandMap[offCommand];
    if (!offTarget) {
      addRequiredIssue('Aus-Befehl fehlt', `Aus-Befehl "${offCommand}" wurde nicht gefunden.`);
    } else if (offTarget.enabled === false) {
      addRequiredIssue('Aus-Befehl inaktiv', `Aus-Befehl "${offCommand}" ist deaktiviert.`);
    } else if (offCommand === normalizeInputKey(commandKey)) {
      addRequiredIssue('Aus-Befehl Kreis', 'Aus-Befehl darf nicht auf sich selbst zeigen.');
    }
  }

  if (command.confirmation?.enabled === true && !String(command.confirmation.text || '').trim()) {
    addRequiredIssue('Text fehlt', 'Rückmeldung ist aktiv, aber der Rückmeldungstext fehlt.');
  }
  if (command.alexaExpose !== false && command.enabled === false) {
    issues.push({ level: 'warning', label: 'Nicht sichtbar', text: 'Alexa-Gerät ist markiert, aber der Befehl ist inaktiv und wird nicht angeboten.' });
  }
  return issues;
}

function isKnownCommandType(type) {
  return ['changeTo', 'direct', 'pulse', 'raw'].includes(normalizeCommandType(type));
}

function addRoom() {
  if (roomEditor.querySelector('.room-card')) {
    config = collectConfigFromForms();
  }
  const nextName = uniqueCommandName('neuer_befehl');
  config.commands ||= {};
  config.commands[nextName] = {
    label: NEW_COMMAND_LABEL,
    voiceName: NEW_COMMAND_LABEL,
    category: NEW_COMMAND_CATEGORY,
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
  markDraftCommand(nextName);
  if (commandCategoryFilter && commandCategoryFilter.value && commandCategoryFilter.value !== NEW_COMMAND_CATEGORY) {
    commandCategoryFilter.value = '';
  }
  renderCommandEditor(nextName);
  renderCommands();
  renderIntegrations();
  syncJsonFromForms();
  markConfigDirty();
}

function renderIntegrations() {
  if (!lightEndpoints || !ttsEndpoints || !config) return;

  const baseUrl = window.location.origin;
  lightEndpoints.innerHTML = '';
  ttsEndpoints.innerHTML = '';
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

  setCountBadge(integrationCommandsCount, runnableCommands.length);
  renderTtsEndpointSection(baseUrl);

  renderAlexaDevices();
}

function renderTtsEndpointSection(baseUrl) {
  if (!ttsEndpoints) return;
  const ttsGroup = createTtsEndpointGroup(baseUrl, true);
  const ttsEndpointCount = Number(ttsGroup.querySelector('.count-badge')?.textContent || 0);
  setCountBadge(integrationTtsCount, ttsEndpointCount);
  ttsEndpoints.append(ttsGroup);
}

function createTtsEndpointGroup(baseUrl, open = false) {
  const cards = createTtsEndpointCards(baseUrl);
  const group = createCategoryGroup('TTS-Vorlagen', cards.length, open);
  const status = document.createElement('div');
  const statusView = ttsStatusView();
  status.className = statusView.className;
  status.textContent = statusView.text;
  const hint = document.createElement('p');
  hint.className = 'section-note endpoint-section-note';
  hint.textContent = 'Diese Einträge sind Muster und Testaufrufe. Sie werden nicht als feste Meldungen gespeichert; Loxone sendet den eigentlichen Text oder die Lautstärke im HTTP-Body.';
  group.append(status, hint, ...cards);
  return group;
}

function createTtsEndpointCards(baseUrl) {
  return [
    createEndpointCard({
      title: 'Vorlage: TTS normal',
      method: 'POST',
      url: `${baseUrl}/tts/speak`,
      body: 'Geschirrspüler ist fertig.',
      note: 'Muster für normale Sprachausgabe. Loxone ruft diese URL per POST auf und sendet den zu sprechenden Text im HTTP-Body.',
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
      title: 'Vorlage: Loxone Kurzpfad',
      method: 'POST',
      url: `${baseUrl}/meldung`,
      body: 'Geschirrspüler ist fertig.',
      note: 'Muster für frei benannte Loxone-Kurzpfade wie /meldung oder /geschirrspueler. Der Pfad ist nur der Auslöser; der gesprochene Text kommt aus dem HTTP-Body.',
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
      title: 'Vorlage: Alarm',
      method: 'POST',
      url: `${baseUrl}/tts/alarm`,
      body: 'Achtung, Alarm wurde ausgelöst.',
      note: 'Muster für Alarm-Sprachausgabe. Nutzt die Alarm-Geräteliste und erzwingt die Alarm-Lautstärke; der Alarmtext oder SSML kommt aus dem HTTP-Body.',
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
      title: 'Vorlage: Alarm Kurzpfad',
      method: 'POST',
      url: `${baseUrl}/alarm`,
      body: 'Achtung, Alarm wurde ausgelöst.',
      note: 'Muster für den kurzen Loxone-Alarmpfad. POST /alarm nutzt Alarm-Geräte und Alarm-Lautstärke; der Text oder SSML steht im HTTP-Body.',
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
      title: 'Vorlage: Lautstärke setzen',
      method: 'POST',
      url: `${baseUrl}/tts/volume`,
      body: String(ttsDefaultVolume?.value || 40),
      note: 'Muster zum Setzen der Alexa-Lautstärke. Loxone sendet die gewünschte Zahl im HTTP-Body; gesprochen wird dabei nichts.',
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
      title: 'Vorlage: Lautstärke Kurzpfad',
      method: 'POST',
      url: `${baseUrl}/lautstaerke`,
      body: String(ttsDefaultVolume?.value || 40),
      note: 'Muster für den kurzen Loxone-Lautstärkepfad. POST /lautstaerke mit Zahl im HTTP-Body setzt die Lautstärke.',
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
      title: 'Vorlage: Alexa2Lox-kompatibel',
      method: 'GET',
      url: `${baseUrl}/admin/plugins/alexa2lox/tts.php?device=ALL&text=Hallo&vol=50`,
      body: '',
      note: 'Muster für bestehende Alexa2Lox-Aufrufe. Geeignet, wenn alte Loxone-URLs möglichst unverändert weiterverwendet werden sollen.',
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
  methodBadge.className = 'method-badge command-badge info';
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
    const bodyLabel = document.createElement('div');
    bodyLabel.className = 'endpoint-body-label';
    bodyLabel.textContent = 'Loxone sendet diesen Body:';
    const bodyEl = document.createElement('pre');
    bodyEl.className = 'endpoint-body';
    bodyEl.textContent = body;
    card.append(bodyLabel, bodyEl);
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
  nextConfig.alexaBridge.bridgeId = normalizeBridgeIdInput(alexaBridgeId?.value || '');
  nextConfig.alexaBridge.debug = alexaBridgeDebug?.checked === true;

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
  const commands = { ...(config?.commands && typeof config.commands === 'object' ? config.commands : {}) };
  let renderedCommandKeys = [];
  try {
    renderedCommandKeys = JSON.parse(roomEditor.dataset.renderedCommands || '[]');
  } catch {
    renderedCommandKeys = [];
  }
  renderedCommandKeys.forEach((commandKey) => {
    delete commands[commandKey];
  });
  roomEditor.querySelectorAll('.room-card').forEach((card) => {
    const commandKey = normalizeInputKey(card.querySelector('.command-key').value);
    if (!commandKey) return;
    moveDraftCommand(card.dataset.commandOriginal || '', commandKey);
    card.dataset.commandOriginal = commandKey;
    commands[commandKey] = collectCommandFromCard(card, commandKey);
  });
  return commands;
}

function collectCommandFromCard(card, commandKey) {
  const loxoneType = card.querySelector('.command-type')?.value || 'changeTo';
  const alexaMode = card.querySelector('.command-alexa-mode')?.value || 'switch';
  const offCommand = normalizeInputKey(card.querySelector('.command-off-command')?.value || '');
  const offTarget = card.querySelector('.command-off-target')?.value.trim() || '';
  const alexaExpose = card.querySelector('.command-alexa-expose')?.checked !== false;
  const confirmationEnabled = card.querySelector('.command-confirmation-enabled')?.checked === true;
  const confirmationText = card.querySelector('.command-confirmation-text')?.value.trim() || 'OK';

  return {
    label: card.querySelector('.command-label')?.value.trim() || commandKey,
    voiceName: card.querySelector('.command-voice')?.value.trim() || commandKey,
    category: normalizeCommandCategoryInput(card.querySelector('.command-category')?.value || ''),
    room: normalizeInputKey(card.querySelector('.command-room')?.value || ''),
    function: normalizeInputKey(card.querySelector('.command-function')?.value || ''),
    action: normalizeInputKey(card.querySelector('.command-action')?.value || ''),
    ...(alexaMode === 'action' ? { alexaMode: 'action' } : {}),
    ...(offCommand ? { offCommand } : {}),
    ...(alexaExpose ? {} : { alexaExpose: false }),
    ...(confirmationEnabled ? { confirmation: { enabled: true, text: confirmationText } } : {}),
    loxone: {
      type: loxoneType,
      uuid: normalizeLoxoneUuidInput(card.querySelector('.command-uuid')?.value || ''),
      value: card.querySelector('.command-value')?.value.trim() || '',
      path: loxoneType === 'raw' ? card.querySelector('.command-path')?.value.trim() || '' : '',
      ...(offTarget && loxoneType === 'raw' ? { offPath: offTarget } : {}),
      ...(offTarget && loxoneType !== 'raw' ? { offValue: offTarget } : {})
    },
    enabled: card.querySelector('.command-enabled')?.checked === true
  };
}

function confirmConfigSave(nextConfig) {
  const summary = configSaveSummary(nextConfig);
  return window.confirm(`Konfiguration speichern?\n\n${summary}`);
}

function configSaveSummary(nextConfig) {
  const activeCommands = Object.values(nextConfig.commands || {}).filter((command) => command?.enabled !== false);
  const commandCount = activeCommands.length;
  const actionCount = activeCommands.filter((command) => command?.alexaMode === 'action').length;
  const switchCount = commandCount - actionCount;
  const exposedCount = activeCommands.filter((command) => command?.alexaExpose !== false).length;
  const defaultCount = Array.isArray(nextConfig.tts?.defaultDevices) ? nextConfig.tts.defaultDevices.length : 0;
  const allCount = Array.isArray(nextConfig.tts?.allDevices) ? nextConfig.tts.allDevices.length : 0;
  const alarmCount = Array.isArray(nextConfig.tts?.alarmDevices) ? nextConfig.tts.alarmDevices.length : 0;
  const virtualDeviceCount = nextConfig.alexaBridge?.enabled ? exposedCount : 0;
  const modeText = nextConfig.loxone?.dryRun === false ? 'Live-Modus aktiv' : 'Dry-Run aktiv';
  const ttsText = nextConfig.tts?.enabled
    ? `${defaultCount} Standard-, ${allCount} Alle- und ${alarmCount} Alarm-Gerät(e)`
    : 'TTS deaktiviert';
  const bridgeText = nextConfig.alexaBridge?.enabled
    ? `${virtualDeviceCount} virtuelle Alexa-Gerät(e) aus ${commandCount} aktiven Befehl(en)`
    : 'Virtuelle Alexa-Geräte deaktiviert';

  return [
    `${commandCount} aktive Loxone-Befehl(e)`,
    `Alexa-Modus: ${switchCount} Schalter, ${actionCount} Aktion(en)`,
    bridgeText,
    `Alexa TTS: ${ttsText}`,
    modeText
  ].join('\n');
}

function configSaveSummaryInline(nextConfig) {
  return configSaveSummary(nextConfig).replaceAll('\n', ', ');
}

function syncConfigFromForms() {
  config = collectConfigFromForms();
  syncJsonFromForms();
}

function syncJsonFromForms() {
  clearTimeout(jsonSyncTimer);
  jsonSyncTimer = null;
  try {
    configEditor.value = JSON.stringify(collectConfigFromForms(), null, 2);
  } catch {
    configEditor.value = JSON.stringify(config, null, 2);
  }
}

function scheduleJsonSyncFromForms() {
  clearTimeout(jsonSyncTimer);
  jsonSyncTimer = setTimeout(() => {
    syncJsonFromForms();
  }, 250);
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
    path: loxone.path || command.loxonePath || '',
    offValue: loxone.offValue ?? '',
    offPath: loxone.offPath || ''
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
  const segment = raw.replace(/^\/?jdev\/sps\/io\//i, '').split('/')[0].trim();
  const match = segment.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-(?:[0-9a-f]{16}|[0-9a-f]{4}-[0-9a-f]{12})|[0-9a-f]{32}/i);
  if (match) return match[0].toLowerCase();
  return segment.toLowerCase();
}

function isValidLoxoneUuid(value) {
  return LOXONE_UUID_PATTERN.test(String(value || '').trim());
}

function normalizeBridgeIdInput(value) {
  return String(value || '').replace(/[^0-9a-f]/gi, '').toUpperCase().slice(0, 16);
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
  const offTargetInput = card.querySelector('.command-off-target');
  if (!pathInput) return;

  const isRaw = type === 'raw';
  pathInput.disabled = !isRaw;
  pathInput.placeholder = isRaw
    ? '/jdev/sps/io/{uuid}/pulse oder kompletter Spezialpfad'
    : 'Nur bei Befehlstyp raw aktiv';
  pathInput.closest('label')?.classList.toggle('is-disabled', !isRaw);
  if (offTargetInput) {
    offTargetInput.placeholder = isRaw
      ? '/jdev/sps/io/{uuid}/FullDown'
      : 'z. B. 778';
  }
}

function groupCommandsByCategory(entries, options = {}) {
  const sortedEntries = [...entries].sort((left, right) => compareConfiguredCommands(left, right, options));
  const groupKeys = new Map();
  return sortedEntries.reduce((groups, [commandKey, command]) => {
    const category = commandGroupCategory(commandKey, command, options);
    const normalizedCategory = normalizeCategoryName(category);
    const groupKey = groupKeys.get(normalizedCategory) || displayPart(category) || 'Allgemein';
    groupKeys.set(normalizedCategory, groupKey);
    groups[groupKey] ||= [];
    groups[groupKey].push([commandKey, command]);
    return groups;
  }, {});
}

function compareConfiguredCommands([leftKey, leftCommand], [rightKey, rightCommand], options = {}) {
  if (options.newCommandsFirst) {
    const leftIsDraft = isDraftCommand(leftKey);
    const rightIsDraft = isDraftCommand(rightKey);
    if (leftIsDraft !== rightIsDraft) return leftIsDraft ? -1 : 1;
    if (leftIsDraft && rightIsDraft) {
      const orderResult = draftCommandOrder(leftKey) - draftCommandOrder(rightKey);
      if (orderResult !== 0) return orderResult;
    }
  }
  const parts = [
    compareCommandCategory(commandGroupCategory(leftKey, leftCommand, options), commandGroupCategory(rightKey, rightCommand, options), options),
    compareDisplay(leftCommand.room, rightCommand.room),
    compareDisplay(leftCommand.function, rightCommand.function),
    compareAction(leftCommand.action, rightCommand.action),
    compareDisplay(leftCommand.label || leftCommand.voiceName || leftKey, rightCommand.label || rightCommand.voiceName || rightKey),
    compareDisplay(leftKey, rightKey)
  ];
  return parts.find((result) => result !== 0) || 0;
}

function commandGroupCategory(commandKey, command, options = {}) {
  if (options.newCommandsFirst && isDraftCommand(commandKey)) return NEW_COMMAND_CATEGORY;
  return commandBaseCategory(command);
}

function commandBaseCategory(command = {}) {
  return String(command.category || command.function || 'Allgemein').trim() || 'Allgemein';
}

function normalizeCategoryName(value) {
  return normalizeText(displayPart(value || 'Allgemein'));
}

function normalizeCommandCategoryInput(value) {
  const raw = String(value || '').trim();
  return displayPart(raw || 'Allgemein') || 'Allgemein';
}

function compareCommandCategory(leftCategory, rightCategory, options = {}) {
  if (options.newCommandsFirst) {
    const leftIsNew = leftCategory === NEW_COMMAND_CATEGORY;
    const rightIsNew = rightCategory === NEW_COMMAND_CATEGORY;
    if (leftIsNew !== rightIsNew) return leftIsNew ? -1 : 1;
  }
  return compareDisplay(leftCategory, rightCategory);
}

function compareAction(leftAction, rightAction) {
  const leftRank = commandActionSortRank(leftAction);
  const rightRank = commandActionSortRank(rightAction);
  if (leftRank !== rightRank) return leftRank - rightRank;
  return compareDisplay(leftAction, rightAction);
}

function commandActionSortRank(action) {
  const normalized = normalizeInputKey(action);
  const ranks = {
    ambient: 10,
    hell: 20,
    nacht: 30,
    an: 40,
    ein: 40,
    on: 40,
    bewegung: 45,
    auf: 50,
    up: 50,
    zu: 60,
    down: 60,
    aus: 90,
    off: 90,
    stop: 95
  };
  return ranks[normalized] ?? 70;
}

function compareDisplay(left, right) {
  return displayPart(left).localeCompare(displayPart(right), 'de-CH', {
    numeric: true,
    sensitivity: 'base'
  });
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
    card.className = 'endpoint-card alexa-device-card';
    const header = document.createElement('div');
    header.className = 'endpoint-card-head';

    const title = document.createElement('strong');
    title.textContent = device.name;

    const badges = document.createElement('div');
    badges.className = 'command-summary-badges';
    badges.append(
      createCommandBadge(device.alexaMode === 'action' ? 'Aktion' : 'Schalter', device.alexaMode === 'action' ? 'action' : 'switch'),
      createCommandBadge('Alexa', 'alexa'),
      createCommandBadge(device.command || 'ohne Befehl', 'technical')
    );
    header.append(title, badges);
    const note = document.createElement('p');
    const modeText = device.alexaMode === 'action'
      ? 'Aktion: Einschalten löst aus, Ausschalten wird ignoriert'
      : 'Schalter: Ein/Aus';
    note.textContent = `Sprachbeispiel: Alexa, ${device.name} an. ${modeText}.`;
    card.append(header, note);
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
  updateModeBannerNotice();
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
  const compactedEvents = compactEvents(filterEvents(events || []));
  if (!compactedEvents.length) {
    eventsEl.innerHTML = '<p class="empty">Noch keine Befehle.</p>';
    return;
  }

  eventsEl.innerHTML = '';
  compactedEvents.slice(0, 50).forEach((event) => {
    const row = document.createElement('div');
    row.className = 'event-row';
    const meta = document.createElement('div');
    meta.className = 'event-meta';
    meta.textContent = event.count > 1
      ? `${formatTime(event.at)} | ${event.type} | ${event.status} | ${event.count}x seit ${formatTime(event.firstAt)}`
      : `${formatTime(event.at)} | ${event.type} | ${event.status}`;
    const detail = document.createElement('div');
    detail.className = 'event-detail';
    detail.textContent = eventDetailText(event);
    row.append(meta, detail);
    eventsEl.append(row);
  });
}

function compactEvents(events) {
  const compacted = [];
  for (const event of events) {
    const signature = eventSignature(event);
    const previous = compacted[compacted.length - 1];
    if (previous?.signature === signature) {
      previous.count += 1;
      previous.firstAt = event.at || previous.firstAt;
      continue;
    }
    compacted.push({ ...event, signature, count: 1, firstAt: event.at });
  }
  return compacted.map(({ signature, ...event }) => event);
}

function eventSignature(event) {
  return [
    event.type || '',
    event.status || '',
    event.key || '',
    event.label || '',
    event.url || '',
    event.text || '',
    event.error || '',
    Array.isArray(event.devices) ? event.devices.join(',') : '',
    event.volume ?? ''
  ].join('|');
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

function escapeAttribute(value) {
  return escapeHtml(value);
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
