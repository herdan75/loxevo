import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { parseLoxoneCatalog, loadLoxoneCatalog } from '../src/loxone-catalog.js';
import { LoxoneClient } from '../src/loxone.js';
import { prepareConfig } from '../src/config.js';

const uuid = '16aad661-0377-5ccb-ffffba27bfcae6ca';
const control = (type, extra = {}) => ({ name: 'Fixture', type, uuidAction: uuid, room: 'room1', cat: 'cat1', ...extra });

test('catalog profiles use action UUIDs and whitelist metadata, never secured details', () => {
  const data = { rooms: { room1: { name: 'Küche' } }, cats: { cat1: { name: 'Licht' } }, secret: 'SECRET', controls: {
    a: control('Switch', { details: { password: 'SECRET' }, states: { active: 'not-an-action' } }),
    b: control('Pushbutton'), c: control('LightControllerV2'), d: control('Jalousie'),
    e: control('Switch', { isSecured: true }), f: control('Switch', { restrictions: 2 }),
    g: control('Switch', { restrictions: 32 }), h: control('Ventilation'),
    i: control('Intercom', { subControls: { input: control('Pushbutton') } }),
    j: control('Switch', { uuidAction: `${uuid}/AI1` }), k: control('Switch', { restrictions: 'invalid' })
  } };
  const result = parseLoxoneCatalog(data, { old: { loxone: { type: 'direct', uuid, value: 'on' } } });
  assert.equal(result.controls[0].room, 'Küche'); assert.equal(result.controls[0].category, 'Licht');
  assert.deepEqual(result.controls[0].existingKeys, ['old']);
  assert.equal(result.controls[0].profiles[0].offValue, 'off');
  assert.equal(result.controls[1].profiles[0].type, 'pulse');
  assert.equal(result.controls[2].profiles[0].offValue, '0');
  assert.deepEqual(result.controls[3].profiles.map((entry) => entry.value), ['FullUp', 'FullDown', 'stop']);
  assert.ok(result.controls.slice(4).every((entry) => !entry.profiles.length && entry.reason));
  assert.ok(!JSON.stringify(result).includes('SECRET')); assert.ok(!JSON.stringify(result).includes('not-an-action'));
  assert.throws(() => parseLoxoneCatalog({ controls: [] }));
  assert.throws(() => parseLoxoneCatalog({ controls: Object.fromEntries(Array.from({ length: 3001 }, (_, i) => [i, control('Switch')])) }));
});

test('structure loading is bounded, read-only, same-server and refuses redirects or invalid replies', async (t) => {
  const requests = []; let mode = 'ok';
  const server = createServer((req, res) => {
    requests.push({ url: req.url, method: req.method, auth: req.headers.authorization });
    if (mode === 'redirect') { res.writeHead(302, { location: '/jdev/sps/io/forbidden/pulse' }); return res.end(); }
    if (mode === 'size') { res.writeHead(200, { 'content-length': 6 * 1024 * 1024 }); return res.end(); }
    if (mode === 'error') { res.writeHead(401); return res.end('SECRET'); }
    res.end(mode === 'json' ? '{SECRET' : JSON.stringify({ controls: { a: control('Switch') } }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); t.after(() => { server.closeAllConnections(); server.close(); });
  const client = new LoxoneClient({ loxone: { baseUrl: `http://127.0.0.1:${server.address().port}`, username: 'fixture', password: 'SECRET' } });
  assert.equal((await loadLoxoneCatalog(client)).controls.length, 1);
  for (mode of ['redirect', 'size', 'json', 'error']) await assert.rejects(loadLoxoneCatalog(client), (error) => !error.message.includes('SECRET'));
  assert.equal(requests.length, 5); assert.ok(requests.every((req) => req.url === '/data/LoxAPP3.json' && req.method === 'GET'));
  assert.equal(requests[0].auth, `Basic ${Buffer.from('fixture:SECRET').toString('base64')}`);
});

test('light circuits keep their complete case-sensitive address and survive config and on/off execution', async () => {
  const childUuid = 'aaaaaaaa-bbbb-cccc-dddddddddddddddd';
  const structure = { rooms: { room1: { name: 'Terrasse' } }, cats: { cat1: { name: 'Licht' } }, controls: {
    light: control('LightControllerV2', { name: 'Lichtsteuerung', details: { masterValue: `${uuid}/masterValue` }, subControls: {
      dimmer: control('Dimmer', { name: 'Deckenlicht', uuidAction: `${uuid.toUpperCase()}/AI1`, room: undefined, cat: undefined }),
      switch: control('Switch', { name: 'Steckdose', uuidAction: `${uuid}/AI2`, room: undefined, cat: undefined }),
      own: control('Switch', { name: 'Eigene UUID', uuidAction: childUuid }),
      master: control('Dimmer', { name: 'Master', uuidAction: `${uuid}/masterValue` }),
      color: control('ColorPickerV2', { name: 'Farbe', uuidAction: `${uuid}/AI3` })
    } }),
    standalone: control('Dimmer', { uuidAction: childUuid })
  } };
  const existing = {
    scene: { loxone: { type: 'changeTo', uuid, value: '1' } },
    raw_scene: { loxone: { type: 'raw', path: `/jdev/sps/io/${uuid}/changeTo/2` } },
    circuit: { loxone: { type: 'raw', path: `/jdev/sps/io/${uuid}/AI1/on` } }
  };
  const original = structuredClone(existing);
  const rows = parseLoxoneCatalog(structure, existing).controls;
  assert.deepEqual(existing, original);
  assert.deepEqual(rows[0].existingKeys, ['scene', 'raw_scene']);
  assert.deepEqual(rows[1].existingKeys, ['circuit']);
  assert.deepEqual(rows[2].existingKeys, []);
  assert.equal(rows[1].parentId, rows[0].id); assert.equal(rows[1].rootId, rows[0].id);
  assert.equal(rows[1].parentName, 'Lichtsteuerung'); assert.equal(rows[1].room, 'Terrasse'); assert.equal(rows[1].category, 'Licht');
  assert.equal(rows[1].uuid, `${uuid}/AI1`);
  assert.equal(rows[3].profiles[0].type, 'direct');
  assert.equal(rows[4].profiles[0].path, `/jdev/sps/io/${uuid}/masterValue/on`);
  assert.equal(rows[5].profiles.length, 0); assert.match(rows[5].reason, /Farbsteuerung/);
  assert.equal(rows[6].profiles[0].value, 'on'); assert.equal(rows[6].profiles[0].offValue, 'off');
  const profile = rows[1].profiles[0];
  const prepared = prepareConfig({ loxone: { baseUrl: 'http://miniserver.invalid', dryRun: true }, commands: {
    terrace: { enabled: true, loxone: { type: profile.type, path: profile.path, offPath: profile.offPath } }
  } });
  const client = new LoxoneClient(prepared);
  assert.equal((await client.runCommand('terrace')).url, `http://miniserver.invalid/jdev/sps/io/${uuid}/AI1/on`);
  assert.equal((await client.runCommandOff('terrace')).url, `http://miniserver.invalid/jdev/sps/io/${uuid}/AI1/off`);
});

test('protected ancestors, unknown subcontrols and ambiguous or hostile addresses stay blocked', () => {
  const child = (extra = {}) => control('Dimmer', { uuidAction: `${uuid}/AI1`, ...extra });
  const parent = (extra = {}) => control('LightControllerV2', { subControls: { child: child() }, ...extra });
  for (const restrictions of [1, 2, 16, 32, -1, 0.5, 'invalid', '', [], {}, false]) {
    const rows = parseLoxoneCatalog({ controls: { a: parent({ restrictions }) } }).controls;
    assert.ok(rows.every((row) => !row.profiles.length && row.reason));
  }
  for (const controls of [
    { a: parent({ isSecured: true }) },
    { a: parent({ subControls: { child: child({ isSecured: true }) } }) },
    { a: parent({ subControls: { child: child({ restrictions: 2 }) } }) },
    { a: control('Intercom', { subControls: { child: child() } }) },
    { a: control('Unknown', { subControls: { nested: parent() } }) },
    { a: parent({ uuidAction: 'invalid' }) }
  ]) {
    const rows = parseLoxoneCatalog({ controls }).controls;
    assert.ok(rows.at(-1).reason); assert.equal(rows.at(-1).profiles.length, 0);
  }
  for (const address of ['', `${uuid}/AI0`, `${uuid}/ai1`, `${uuid}/AI1/on`, `${uuid}/../AI1`, `${uuid}/AI1?value=on`, `${uuid}/AI1#on`, `${uuid}/%41I1`, `${uuid}/masterValue`, `aaaaaaaa-bbbb-cccc-dddddddddddddddd/AI1`, `https://evil.invalid/${uuid}/AI1`, `${uuid}/AI1${' '.repeat(201)}`]) {
    const rows = parseLoxoneCatalog({ controls: { a: parent({ subControls: { child: child({ uuidAction: address }) } }) } }).controls;
    assert.equal(rows[1].profiles.length, 0, address); assert.ok(rows[1].reason, address);
  }
  const invalid = parseLoxoneCatalog({ controls: { invalid: control('Switch', { uuidAction: '' }) } }, { raw: { loxone: { type: 'raw', path: '/jdev/sps/io/anything/on' } } });
  assert.deepEqual(invalid.controls[0].existingKeys, []);
});
