import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { TtsService, parseAlexaCookieFile } from '../src/tts.js';
import { refreshRemoteInventory, TESTED_ALEXA_REMOTE_VERSION } from '../src/alexa-remote-adapter.js';
import { DeviceIdRegistry, allocateLegacyDeviceId } from '../src/device-ids.js';
import { AlexaBridgeService, isSsdpPortInUseError } from '../src/alexa-bridge.js';
import { appendEvent, MAX_EVENTS, MAX_EVENT_BYTES } from '../src/event-buffer.js';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'loxevo-stability-'));
  const root = { tts: { enabled: true, cookieFile: join(dir, 'Node.txt'), defaultDevices: ['A'], allDevices: [], alarmDevices: [] }, alexaBridge: {} };
  const service = new TtsService(root, { commandTimeoutMs: 30, initTimeoutMs: 30 });
  t.after(async () => { await service.dispose(); await rm(dir, { recursive: true, force: true }); });
  return { service, dir, root };
}

test('cookie updates use canonical state, serialize and ignore retired generations', async (t) => {
  const { service } = await fixture(t);
  const remote = new EventEmitter();
  const oldAuth = parseAlexaCookieFile(JSON.stringify({ localCookie: 'session=old', refreshToken: 'old', tokenDate: 1000, deviceSerial: 'test' }));
  service.remote = remote; service.auth = oldAuth;
  service.attachCookiePersistence(remote, oldAuth);
  remote.cookieData = { localCookie: 'session=new', refreshToken: 'new', tokenDate: 2000 };
  await service.persistCookie();
  remote.cookieData = undefined;
  remote.emit('cookie', 'session=latest', 'csrf=new');
  await service.cookieWriteQueue;
  const data = JSON.parse(await readFile(service.config.cookieFile, 'utf8'));
  assert.equal(data.refreshToken, 'new'); assert.equal(data.localCookie, 'session=latest'); assert.equal(data.tokenDate, 2000);
  assert.equal(await service.persistCookie(), false);
  await service.disposeRemote(remote);
  assert.equal(remote.listenerCount('cookie'), 0);
  assert.equal(await service.persistCookie('session=retired', '', null, remote, oldAuth), false);
});

test('dispose stops proxy AND remote and cancels a hanging init', async (t) => {
  const { service } = await fixture(t);
  const remote = new EventEmitter();
  let proxyStops = 0, stops = 0;
  remote.stopProxyServer = () => { proxyStops++; }; remote.stop = () => { stops++; };
  remote.init = () => {};
  service.remote = remote; service.attachCookiePersistence(remote, {});
  const pending = service.initializeRemoteCandidate(remote, {});
  await service.dispose();
  assert.equal((await pending).ok, false);
  assert.equal(proxyStops, 1); assert.equal(stops, 1);
  assert.equal(service.initCancellations.size, 0);
  await service.dispose(); assert.equal(stops, 1);
});

test('in-place refresh still persists after a generated candidate became the cookie owner', async (t) => {
  const { service } = await fixture(t);
  const remote = new EventEmitter(); service.remote = remote; service.initSequence = 3;
  service.remoteGenerations.set(remote, 3);
  remote.cookieData = { localCookie: 'session=initial', refreshToken: 'one', tokenDate: 1000 };
  await service.persistCookie();
  await service.applyRefreshedCookieData({ localCookie: 'session=refreshed', refreshToken: 'two', tokenDate: 2000 });
  const data = JSON.parse(await readFile(service.config.cookieFile, 'utf8'));
  assert.equal(data.refreshToken, 'two'); assert.equal(service.auth.cookieData.refreshToken, 'two');
  await service.applyRefreshedCookieData({ localCookie: 'session=next', refreshToken: null, tokenDate: null });
  assert.equal(service.auth.cookieData.refreshToken, 'two'); assert.equal(service.auth.cookieData.tokenDate, 2000);
});

test('proxy cookie completion waits for verified auth and can retry the same cookie later', async (t) => {
  const { service } = await fixture(t);
  const remote = new EventEmitter(); let authenticated = false;
  remote.cookieData = { localCookie: 'session=new', refreshToken: 'test' };
  remote.checkAuthentication = (callback) => callback(authenticated);
  remote.getDevices = (callback) => callback(null, { devices: [{ serialNumber: 'A', deviceType: 'test' }] });
  service.auth = { cookie: '', originalData: null };
  service.loginProxySession = { remote, auth: service.auth, sequence: 1 };
  service.initSequence = 1; service.remoteGenerations.set(remote, 1); service.attachCookiePersistence(remote, service.auth);
  service.loginProxyActive = true; service.loginProxyStartedAt = new Date().toISOString();
  assert.equal(await service.tryCompleteLoginProxySessionFromCookie(), false);
  assert.equal(service.ready, false); assert.equal(service.loginProxyActive, true);
  authenticated = true;
  assert.equal(await service.tryCompleteLoginProxySessionFromCookie(), true);
  assert.equal(service.remote, remote); assert.equal(service.ready, true);
});

test('missing cookie can start proxy auth and malformed JSON never leaks its contents', async (t) => {
  const { service } = await fixture(t);
  assert.equal((await service.readAlexaCookieAuth()).cookie, '');
  assert.throws(() => parseAlexaCookieFile('{"localCookie":"SECRET"'), (error) => !error.message.includes('SECRET'));
  assert.throws(() => parseAlexaCookieFile('<html>login page</html>'));
});

test('repeated candidate swaps leave only the active listener and no retired timers', async (t) => {
  const { service } = await fixture(t);
  const retired = [];
  for (let i = 1; i <= 30; i++) {
    const remote = new EventEmitter(); remote.stops = 0; remote.stop = () => { remote.stops++; }; remote.stopProxyServer = () => {};
    remote.serialNumbers = { A: {} }; remote.cookieData = { localCookie: `session=${i}`, tokenDate: i };
    service.initSequence = i; service.remoteGenerations.set(remote, i); service.attachCookiePersistence(remote, {});
    await service.commitRemoteCandidate(remote, {}); retired.push(remote);
  }
  assert.equal(service.cookieListeners.size, 1);
  assert.ok(retired.slice(0, -1).every((remote) => remote.listenerCount('cookie') === 0 && remote.stops === 1));
  await service.dispose(); assert.equal(service.authRefreshTimer, null); assert.equal(service.cookieListeners.size, 0);
});

test('late candidate cannot replace a newer remote', async (t) => {
  const { service } = await fixture(t);
  const old = new EventEmitter(); old.stop = () => {}; service.remoteGenerations.set(old, 1); service.initSequence = 2;
  const active = {}; service.remote = active;
  assert.equal(await service.commitRemoteCandidate(old, {}), false);
  assert.equal(service.remote, active);
});

test('list-only configuration changes retain auth instance; auth changes require disposal', async (t) => {
  const { service, root } = await fixture(t);
  const next = structuredClone(root); next.tts.defaultDevices = ['B'];
  assert.equal(service.requiresRestart(next), false); service.configure(next);
  assert.deepEqual(service.config.defaultDevices, ['B']);
  next.tts = { ...next.tts, enabled: false };
  assert.equal(service.requiresRestart(next), true);
});

test('native dispatch waits for acknowledgment and never treats a returned Remote as success', async (t) => {
  const { service } = await fixture(t);
  await assert.rejects(service.sendNativeSequence({}, () => new EventEmitter()), { code: 'TTS_TIMEOUT' });
  await assert.rejects(service.sendNativeSequence({}, (_node, callback) => setTimeout(() => callback(new Error('denied')), 10)), /denied/);
  await service.sendNativeSequence({}, (_node, callback) => callback(null, {}));
});

test('partial target failure is explicit and never repeats a successful fallback target', async (t) => {
  const { service } = await fixture(t);
  const calls = [];
  service.remote = { sendSequenceCommand: (device, _type, _text, callback) => { calls.push(device); callback(device === 'B' ? new Error('401 Unauthorized') : null); } };
  let refreshes = 0;
  service.refreshExistingRemoteAuth = async () => { refreshes++; return true; };
  service.refreshAuth = async () => { refreshes++; };
  await assert.rejects(service.sendSequenceToTargets('speak', 'test', ['A', 'B']), (error) => error.delivery.status === 'partial' && error.delivery.confirmed === 1);
  assert.equal(calls.filter((device) => device === 'A').length, 1);
  assert.ok(refreshes > 0);
});

test('concurrent forced recovery is not lost behind an in-place refresh and remains single-flight', async (t) => {
  const { service } = await fixture(t);
  let release; const wait = new Promise((resolve) => { release = resolve; });
  const modes = [];
  service.refreshAuthInternal = async (_reason, _error, options) => { modes.push(Boolean(options.forceCandidate)); if (modes.length === 1) await wait; };
  const scheduled = service.refreshAuth('scheduled-refresh');
  const forced = [service.refreshAuth('401', null, { forceCandidate: true }), service.refreshAuth('401', null, { forceCandidate: true })];
  release(); await Promise.all([scheduled, ...forced]);
  assert.deepEqual(modes, [false, true]);
});

test('tested AlexaRemote inventory adapter removes stale entries and fails closed on request errors', async () => {
  const require = createRequire(import.meta.url);
  assert.equal(require('alexa-remote2/package.json').version, TESTED_ALEXA_REMOTE_VERSION);
  const Remote = require('alexa-remote2'); const remote = new Remote();
  remote.serialNumbers = { stale: { serialNumber: 'stale' } };
  remote.getDevices = (callback) => callback(null, { devices: [
    { serialNumber: 'group', accountName: 'Group', deviceType: 'group', appDeviceList: [{ serialNumber: 'A', accountName: 'Stale child name', deviceType: 'echo' }] },
    { serialNumber: 'A', accountName: 'Test', deviceType: 'echo', deviceTypeFriendlyName: 'Echo', deviceOwnerCustomerId: 'test', clusterMembers: [], parentClusters: [], capabilities: [] }
  ] });
  await refreshRemoteInventory(remote);
  assert.equal(remote.find('A').accountName, 'Test'); assert.equal(remote.find('stale'), undefined);
  assert.equal(remote.find('Test (Echo)').serialNumber, 'A');
  remote.getDevices = (callback) => callback(new Error('401 Unauthorized'));
  await assert.rejects(refreshRemoteInventory(remote), /401/);
  assert.ok(remote.find('A'));
  remote.stop();
});

test('unknown device triggers one inventory reload without creating a new Remote', async (t) => {
  const { service } = await fixture(t);
  const remote = { serialNumbers: {}, getDevices: (callback) => callback(null, { devices: [{ serialNumber: 'A', deviceType: 'echo' }] }) };
  service.remote = remote; let attempts = 0;
  await service.withDeviceRecovery(async () => { attempts++; if (!remote.serialNumbers.A) throw new Error('Unknown Device or Serial number'); });
  assert.equal(service.remote, remote); assert.equal(attempts, 2); assert.equal(service.inventoryReady, true);
});

test('ID migration matches legacy algorithm and reserves removed or colliding identities', async (t) => {
  const { dir } = await fixture(t);
  const path = join(dir, 'ids.json'); const registry = new DeviceIdRegistry(path);
  const commands = { alpha: {}, beta: {} }; const used = new Set();
  const expected = Object.fromEntries(Object.keys(commands).sort((a, b) => a.localeCompare(b)).map((key) => [key, allocateLegacyDeviceId(key, used)]));
  await registry.load(commands); assert.deepEqual(registry.ids, expected);
  await registry.sync({ aardvark: {}, beta: {} }); assert.equal(registry.get('alpha'), expected.alpha);
  assert.notEqual(registry.get('aardvark'), expected.alpha);
  await assert.rejects(registry.import({ version: 1, ids: { other: expected.alpha } }), /bereits/);
  const reloaded = new DeviceIdRegistry(path); await reloaded.load(commands); assert.deepEqual(reloaded.ids, registry.ids);
  await writeFile(path, '{broken'); const broken = new DeviceIdRegistry(path);
  await assert.rejects(broken.load(commands)); assert.equal(broken.get('beta'), null);
});

test('Hue on/off/on requests execute in order and failed output never changes confirmed state', async () => {
  const calls = [];
  const bridge = new AlexaBridgeService({ alexaBridge: {} }, { executeCommand: async (_key, options) => { calls.push(options.offTarget); } });
  bridge.getDevices = () => [{ id: '1', commandKey: 'light', alexaMode: 'switch' }]; bridge.hasInlineOffTarget = () => true;
  const helpers = { sendJson: () => {} };
  for (const on of [true, false, true, true]) await bridge.handleLightState(null, '1', { on }, helpers);
  await bridge.drainCommands(); assert.deepEqual(calls, [false, true, false]); assert.equal(bridge.getDeviceOnState('1'), true);
  bridge.handlers.executeCommand = async () => { throw new Error('Miniserver refused'); };
  await bridge.handleLightState(null, '1', { on: false }, helpers); await bridge.drainCommands(); assert.equal(bridge.getDeviceOnState('1'), true);
  await bridge.stop();
});

test('a corrupt ID registry never advertises an empty successful Hue inventory', async () => {
  const events = [];
  const bridge = new AlexaBridgeService({ alexaBridge: { enabled: true } }, {
    getDeviceIdError: () => 'ID registry unavailable', addEvent: (event) => events.push(event)
  });
  await bridge.start();
  assert.equal(bridge.ready, false);
  assert.equal(events[0].status, 'error');
  for (const path of ['/api/test', '/api/test/lights', '/description.xml']) {
    let response;
    await bridge.handleHttp({ method: 'GET' }, null, new URL(path, 'http://localhost'), path.split('/').filter(Boolean), async () => '', {
      sendJson: (_res, body, status) => { response = { body, status }; }
    });
    assert.equal(response.status, 503);
    assert.equal(response.body[0].error.type, 901);
  }
  await bridge.stop();
});

test('adding an alphabetically earlier hash collision never retargets an existing Alexa ID', async (t) => {
  const { dir } = await fixture(t);
  const registry = new DeviceIdRegistry(join(dir, 'collision.json'));
  const seen = new Map(); let pair;
  for (let i = 0; i < 64001; i++) {
    const key = `key_${i}`; const id = allocateLegacyDeviceId(key, new Set());
    if (seen.has(id)) { pair = [key, seen.get(id)].sort((a, b) => a.localeCompare(b)); break; }
    seen.set(id, key);
  }
  assert.ok(pair);
  await registry.load({ [pair[1]]: {} }); const original = registry.get(pair[1]);
  await registry.sync({ [pair[0]]: {}, [pair[1]]: {} });
  assert.equal(registry.get(pair[1]), original); assert.notEqual(registry.get(pair[0]), original);
});

test('SSDP port conflicts do not hide permission or unrelated bind failures', () => {
  assert.equal(isSsdpPortInUseError({ code: 'EADDRINUSE' }), true);
  assert.equal(isSsdpPortInUseError('bind UDP 1900 failed: Address in use'), true);
  assert.equal(isSsdpPortInUseError('bind UDP 1900 failed: Permission denied'), false);
});

test('event buffer bounds count and bytes, sanitizes secrets and retains error category', () => {
  const events = [];
  for (let i = 0; i < 400; i++) appendEvent(events, { type: 'tts-auth', status: 'refresh-failed', text: 'x'.repeat(20000), payload: { cookie: 'secret' } });
  assert.equal(events.length, MAX_EVENTS);
  assert.ok(events.every((event) => Buffer.byteLength(JSON.stringify(event)) <= MAX_EVENT_BYTES));
  assert.equal(events[0].type, 'tts-auth'); assert.equal(events[0].severity, 'error');
  assert.ok(!JSON.stringify(events).includes('secret'));
});
