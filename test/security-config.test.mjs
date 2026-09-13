import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { prepareConfig, saveConfig } from '../src/config.js';
import { writePrivateFile } from '../src/file-security.js';
import { redactUrl, redactDiagnosticText, sanitizeDiagnosticValue } from '../src/diagnostics.js';
import { LoxoneClient, assertLoxoneResponse } from '../src/loxone.js';
import { isValidLoxoneUuid, normalizeLoxoneUuid } from '../src/command-utils.js';

const uuid = '16aad661-0377-5ccb-ffffba27bfcae6ca';
const base = () => ({ server: { port: 8080 }, loxone: { baseUrl: 'http://miniserver.invalid', dryRun: true }, commands: {} });

describe('Configuration integrity', () => {
  it('rejects invalid structures and ports before writing and preserves the last file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'loxevo-config-'));
    const before = process.env.CONFIG_PATH;
    process.env.CONFIG_PATH = join(dir, 'config.json');
    try {
      await saveConfig(base());
      const saved = await readFile(process.env.CONFIG_PATH, 'utf8');
      for (const value of [null, [], { ...base(), loxone: { baseUrl: 123 } }, { ...base(), server: { port: 999999 } }, { ...base(), commands: [] }, { ...base(), commands: { broken: null } }]) {
        await assert.rejects(saveConfig(value));
        assert.equal(await readFile(process.env.CONFIG_PATH, 'utf8'), saved);
      }
    } finally {
      if (before === undefined) delete process.env.CONFIG_PATH; else process.env.CONFIG_PATH = before;
      await rm(dir, { recursive: true, force: true });
    }
  });
  it('preserves supported zero, UUID formats, raw paths, offUuid and inactive drafts', () => {
    for (const id of [uuid, '16aad661-0377-5ccb-ffff-ba27bfcae6ca', uuid.replaceAll('-', '')]) {
      assert.ok(isValidLoxoneUuid(normalizeLoxoneUuid(id)));
      const command = { loxone: { type: 'direct', uuid: id, value: 0, offUuid: id, offValue: 0 }, extra: { preserved: true } };
      const result = prepareConfig({ ...base(), commands: { test: command, draft: { enabled: false } } });
      assert.equal(result.commands.test.loxone.value, 0);
      assert.equal(result.commands.test.loxone.offUuid, id);
      assert.deepEqual(result.commands.test.extra, command.extra);
    }
    assert.equal(normalizeLoxoneUuid(`/jdev/sps/io/${uuid}/pulse`), uuid);
    assert.equal(isValidLoxoneUuid(normalizeLoxoneUuid(`invalid-${uuid}`)), false);
    assert.doesNotThrow(() => prepareConfig({ ...base(), commands: { raw: { loxone: { type: 'raw', path: '/test/{value}', value: 0 } } } }));
    assert.throws(() => prepareConfig({ ...base(), commands: { raw: { loxone: { type: 'raw', path: '/test/{uuid}' } } } }), /UUID/);
  });
  it('ignores unused offCommand references for actions and direct off targets', () => {
    for (const command of [
      { alexaMode: 'action', loxone: { type: 'pulse', uuid } },
      { loxone: { type: 'direct', uuid, value: 'on', offValue: 0 } }
    ]) assert.doesNotThrow(() => prepareConfig({ ...base(), commands: { test: { ...command, offCommand: 'absent' } } }));
  });
  it('serializes private atomic writes and leaves no temporary files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'loxevo-write-'));
    try {
      const path = join(dir, 'private.json');
      await Promise.all(Array.from({ length: 20 }, (_, sequence) => writePrivateFile(path, JSON.stringify({ sequence }))));
      assert.equal(JSON.parse(await readFile(path, 'utf8')).sequence, 19);
      assert.deepEqual(await readdir(dir), ['private.json']);
      if (process.platform !== 'win32') assert.equal((await stat(path)).mode & 0o777, 0o600);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
});

describe('Diagnostic redaction', () => {
  it('removes host, credentials, path secrets, query and fragments', () => {
    const value = redactUrl('https://user:password@private.example/SECRET_PATH?token=SECRET_QUERY#SECRET_HASH');
    for (const secret of ['user', 'password', 'private.example', 'SECRET']) assert.ok(!value.includes(secret));
    assert.ok(!redactDiagnosticText('error token=FAKE_SECRET https://private.example/a').includes('FAKE_SECRET'));
  });
  it('redacts secret fields without removing safe presence metadata', () => {
    const result = sanitizeDiagnosticValue({ hasLocalCookie: true, nested: { refreshToken: 'FAKE', password: 'FAKE' } });
    assert.equal(result.hasLocalCookie, true);
    assert.ok(!JSON.stringify(result).includes('FAKE'));
  });
});

describe('Loxone transport', () => {
  it('retains numeric zero when expanding raw templates and legacy room scenes', async () => {
    const client = new LoxoneClient({ ...base(), rooms: { test: { uuid, scenes: { off: 0 } } } });
    assert.equal(client.buildPath({ type: 'raw', path: '/test/{value}/{command}', command: 0 }), '/test/0/0');
    assert.match((await client.changeScene('test', 'off')).url, /changeTo\/0$/);
  });
  it('never sends Miniserver credentials to another origin', async () => {
    const before = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Response('{"LL":{"Code":"200"}}'); };
    try {
      const client = new LoxoneClient({ ...base(), loxone: { baseUrl: 'https://miniserver.invalid', username: 'FAKE', password: 'FAKE', dryRun: false } });
      await client.sendLoxoneCommand({ type: 'raw', path: 'https://external.invalid/test' });
      await client.sendLoxoneCommand({ type: 'direct', uuid, command: 0 });
      assert.equal(calls[0].options.headers.authorization, undefined);
      assert.match(calls[1].options.headers.authorization, /^Basic /);
      assert.ok(calls[0].options.signal instanceof AbortSignal);
      assert.equal(calls[0].options.redirect, 'error');
    } finally { globalThis.fetch = before; }
  });
  it('recognizes Loxone response errors without rejecting unrelated raw output', () => {
    assert.throws(() => assertLoxoneResponse('{"LL":{"Code":"500"}}'), /500/);
    assert.throws(() => assertLoxoneResponse('<LL control="test" Code="403"/>'), /403/);
    assert.doesNotThrow(() => assertLoxoneResponse('arbitrary raw response'));
    assert.doesNotThrow(() => assertLoxoneResponse('{"LL":{"Code":"200"}}'));
  });
});
