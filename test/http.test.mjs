import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scryptSync } from 'node:crypto';

async function start(t, { brokenAdmin = false, adminRecord, delayTts = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'loxevo-http-'));
  const probe = createServer(); await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve)); const port = probe.address().port; await new Promise((resolve) => probe.close(resolve));
  const configPath = join(dir, 'config.json');
  const config = { server: { port, name: 'HTTP test' }, loxone: { baseUrl: 'http://miniserver.invalid', username: 'test-user', password: 'SECRET_HTTP', dryRun: true }, commands: {}, tts: { enabled: false, cookieFile: join(dir, 'Node.txt') }, alexaBridge: { enabled: true, advertisePort: port, advertiseIp: '127.0.0.1' }, discovery: { helperEnabled: false } };
  await writeFile(configPath, JSON.stringify(config));
  if (brokenAdmin) await writeFile(join(dir, 'admin-token.json'), '{broken');
  if (adminRecord) await writeFile(join(dir, 'admin-token.json'), JSON.stringify(adminRecord));
  const child = spawn(process.execPath, ['test-support/http-server.mjs'], { env: { ...process.env, CONFIG_PATH: configPath, PORT: String(port), LOXEVO_ADMIN_TOKEN: '', LOXEVO_ADMIN_TOKEN_FILE: join(dir, 'admin-token.json'), TEST_DELAY_TTS: String(delayTts) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; child.stdout.on('data', (data) => { output += data; }); child.stderr.on('data', (data) => { output += data; });
  const done = new Promise((resolve) => child.once('exit', resolve));
  t.after(async () => { child.kill(); await done; await rm(dir, { recursive: true, force: true }); });
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`${url}/health`)).ok) return { url, configPath, config, output: () => output }; } catch {} await new Promise((resolve) => setTimeout(resolve, 50)); }
  throw new Error(`Server did not start: ${output}`);
}

test('real HTTP diagnostics, validation, failures and private backup routing with Hue enabled', async (t) => {
  const { url, configPath, config } = await start(t);
  const diagnostics = await fetch(`${url}/api/diagnostics/export`);
  assert.equal(diagnostics.status, 200); const report = await diagnostics.json();
  assert.equal(report.eventBuffer.persistent, false); assert.ok(report.configSummary); assert.ok(!JSON.stringify(report).includes('SECRET_HTTP'));
  const before = await readFile(configPath, 'utf8');
  const invalid = await fetch(`${url}/api/config`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...config, server: { port: 'bad' } }) });
  assert.equal(invalid.status, 500); assert.equal(await readFile(configPath, 'utf8'), before);
  const tts = await fetch(`${url}/tts/speak`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'Fixture' }) });
  assert.equal(tts.status, 500); const failure = await tts.json(); assert.ok(failure.requestId);
  const events = await (await fetch(`${url}/api/events`)).json(); assert.ok(events.some((event) => event.requestId === failure.requestId && event.type === 'tts-request'));
  const exported = await (await fetch(`${url}/api/events/export`)).json(); assert.equal(exported.eventBuffer.source, 'memory-ring-buffer');
  const valid = await fetch(`${url}/api/config`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(config) });
  assert.equal(valid.status, 200); assert.equal((await valid.json()).ok, true);
  const backup = await (await fetch(`${url}/api/backup`)).json();
  assert.deepEqual(backup.alexaDeviceIds, { version: 1, ids: {} });
  const invalidCookie = await fetch(`${url}/api/backup/restore`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...backup, cookie: { content: '{"localCookie":"SECRET_BROKEN"' } }) });
  assert.equal(invalidCookie.status, 400); assert.ok(!(await invalidCookie.text()).includes('SECRET_BROKEN'));
  const restored = await fetch(`${url}/api/backup/restore`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...backup, cookie: { content: '{"localCookie":"session=fixture"}' } }) });
  assert.equal(restored.status, 200); assert.equal((await restored.json()).cookieRestored, true);
  assert.equal(JSON.parse(await readFile(config.tts.cookieFile, 'utf8')).localCookie, 'session=fixture');
});

test('unreadable admin state remains protected instead of silently disabling protection', async (t) => {
  const { url, config } = await start(t, { brokenAdmin: true });
  const status = await (await fetch(`${url}/api/admin/status`)).json(); assert.equal(status.enabled, true); assert.equal(status.manageable, false);
  const response = await fetch(`${url}/api/config`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(config) });
  assert.equal(response.status, 401);
  assert.equal((await fetch(`${url}/api/backup`)).status, 401);
});

test('HTTP health is available while optional TTS init is still pending', async (t) => {
  const { url, output } = await start(t, { delayTts: true });
  assert.ok(output().includes('TEST_INIT_PENDING'));
  assert.ok(!output().includes('TEST_INIT_COMPLETE'));
  assert.equal((await (await fetch(`${url}/health`)).json()).ok, true);
});

test('existing version-1 admin passwords remain valid without weakening protected routes', async (t) => {
  const token = 'fixture-admin-password'; const salt = '0123456789abcdef0123456789abcdef';
  const adminRecord = { version: 1, enabled: true, algorithm: 'scrypt', salt, key: scryptSync(token, salt, 32).toString('hex') };
  const { url } = await start(t, { adminRecord });
  for (const value of ['', 'wrong-password', 'x'.repeat(1025)]) {
    assert.equal((await fetch(`${url}/api/diagnostics/export`, { headers: { 'x-loxevo-admin-token': value } })).status, 401);
  }
  const response = await fetch(`${url}/api/diagnostics/export`, { headers: { 'x-loxevo-admin-token': token } });
  assert.equal(response.status, 200);
  const text = await response.text(); assert.ok(!text.includes(token)); assert.ok(!text.includes(adminRecord.key));
});

test('passive soak observer reads cached inventory without sending or reconnecting', async (t) => {
  const { url } = await start(t);
  const child = spawn(process.execPath, ['tools/tts-soak.mjs', url, '0.00001'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', errors = '';
  child.stdout.on('data', (data) => { output += data; }); child.stderr.on('data', (data) => { errors += data; });
  const code = await new Promise((resolve) => child.once('exit', resolve));
  assert.equal(code, 0, errors);
  const record = JSON.parse(output.trim()); assert.equal(record.status.ready, false); assert.deepEqual(record.inventory, []);
  const events = await (await fetch(`${url}/api/events`)).json(); assert.ok(!events.some((event) => event.type === 'tts-speak'));
});
