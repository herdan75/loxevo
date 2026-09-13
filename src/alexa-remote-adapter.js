export const TESTED_ALEXA_REMOTE_VERSION = '8.1.1';

export function callRemote(remote, method, args = [], timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => finish(Object.assign(new Error('Alexa-Rückmeldung ausgeblieben; Ausführung unbestätigt.'), { code: 'TTS_TIMEOUT' })), timeoutMs);
    try {
      const value = remote[method](...args, finish);
      if (value && typeof value.then === 'function') value.then((result) => finish(null, result), finish);
    } catch (error) { finish(error); }
  });
}

export async function stopRemote(remote) {
  if (!remote) return;
  // Proxy cleanup and remote timer cleanup are separate operations in AlexaRemote 8.1.1.
  const proxyMethod = typeof remote.stopProxyServer === 'function' ? 'stopProxyServer' : 'stopProxy';
  const remoteMethod = ['stop', 'close', 'disconnect'].find((method) => typeof remote[method] === 'function');
  for (const method of [proxyMethod, remoteMethod]) {
    if (!method || typeof remote[method] !== 'function') continue;
    try { await remote[method](); }
    catch { console.warn('AlexaRemote konnte nicht vollständig beendet werden.'); }
  }
}

export async function refreshRemoteInventory(remote) {
  if (typeof remote?.getDevices === 'function') {
    const result = await callRemote(remote, 'getDevices');
    const devices = Array.isArray(result) ? result : result?.devices;
    if (!Array.isArray(devices) || !devices.length || devices.some((device) => !device?.serialNumber || !device.deviceType)) throw new Error('Alexa-Geräteinventar ist ungültig oder leer.');
    const serialNumbers = {};
    const names = {};
    const friendlyNames = {};
    // Build a fresh inventory before publishing it; native initDeviceState keeps stale entries
    // and swallows getDevices errors in 8.1.1. Sequence APIs use these three lookup maps.
    const expanded = [...devices, ...devices.flatMap((device) => (Array.isArray(device.appDeviceList) ? device.appDeviceList : []).map((child) => ({ ...device, ...child, parentDeviceSerialNumber: device.serialNumber, appDeviceList: [] })))];
    for (const device of expanded) {
      if (!device.serialNumber || !device.deviceType) throw new Error('Alexa-Geräteinventar enthält einen ungültigen Untereintrag.');
      if (Object.hasOwn(serialNumbers, device.serialNumber)) continue;
      const previous = remote.serialNumbers?.[device.serialNumber];
      const next = { ...device, capabilities: device.capabilities || [], clusterMembers: device.clusterMembers || [], parentClusters: device.parentClusters || [], preferences: device.preferences || previous?.preferences };
      serialNumbers[next.serialNumber] = next;
      if (next.accountName) { names[next.accountName] = next; names[next.accountName.toLowerCase()] = next; }
      if (next.accountName && next.deviceTypeFriendlyName) {
        const displayName = `${next.accountName} (${next.deviceTypeFriendlyName})`;
        names[displayName] = next; names[displayName.toLowerCase()] = next;
      }
      if (next.deviceTypeFriendlyName) friendlyNames[next.deviceTypeFriendlyName] = next;
    }
    Object.assign(remote, { serialNumbers, names, friendlyNames });
  } else if (typeof remote?.initDeviceState === 'function') {
    await callRemote(remote, 'initDeviceState');
  } else {
    throw new Error('Diese AlexaRemote-Version unterstützt keine Geräteinitialisierung.');
  }
  if (!remote.serialNumbers || !Object.keys(remote.serialNumbers).length) throw new Error('Alexa-Geräteinventar ist leer.');
  return remote.serialNumbers;
}

export async function verifyRemoteAuthentication(remote) {
  if (typeof remote?.checkAuthentication !== 'function') throw new Error('Alexa-Authentifizierung kann nicht überprüft werden.');
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Alexa-Authentifizierungsprüfung dauert zu lange.')), 8000);
    try {
      remote.checkAuthentication((authenticated, error) => {
        clearTimeout(timer);
        if (error || authenticated !== true) reject(new Error('Alexa-Authentifizierung ist noch nicht bestätigt.'));
        else resolve();
      });
    } catch (error) { clearTimeout(timer); reject(error); }
  });
}
