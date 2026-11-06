import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { parseLoxoneCatalog, loadLoxoneCatalog } from '../src/loxone-catalog.js';
import { LoxoneClient } from '../src/loxone.js';

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
