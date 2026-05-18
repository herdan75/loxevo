const statusEl = document.querySelector('#status');
const roomsEl = document.querySelector('#rooms');
const configEditor = document.querySelector('#configEditor');
const ttsText = document.querySelector('#ttsText');
const saveBtn = document.querySelector('#saveBtn');
const speakBtn = document.querySelector('#speakBtn');
const alarmBtn = document.querySelector('#alarmBtn');

let config = null;

load();

saveBtn.addEventListener('click', saveConfig);
speakBtn.addEventListener('click', () => postText('/tts/speak', ttsText.value));
alarmBtn.addEventListener('click', () => postText('/tts/alarm', ttsText.value));

async function load() {
  try {
    const response = await fetch('/api/config');
    config = await response.json();
    configEditor.value = JSON.stringify(config, null, 2);
    renderRooms();
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
    setStatus(`${room} ${scene}`, 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function saveConfig() {
  try {
    const nextConfig = JSON.parse(configEditor.value);
    const result = await putJson('/api/config', nextConfig);
    config = result.config;
    configEditor.value = JSON.stringify(config, null, 2);
    renderRooms();
    setStatus('Gespeichert', 'ok');
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
