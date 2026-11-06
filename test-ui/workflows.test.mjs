import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
const fixture = () => ({
  server: { name: 'LoxEvo', port: 8080 },
  loxone: { baseUrl: 'http://miniserver.invalid', username: 'fixture', password: 'fixture', dryRun: true },
  alexaBridge: { enabled: false, advertisePort: 80 },
  tts: { enabled: false, cookieFile: '/config/Node.txt', defaultDevices: [], allDevices: [], alarmDevices: [] },
  commands: Object.fromEntries(Array.from({ length: 42 }, (_, i) => [`test_${i}`, {
    label: `Test ${i}`, voiceName: `Test ${i}`, category: ['Licht', 'Lüftung', 'Rollladen', 'Reinigung'][i % 4],
    enabled: true, room: 'test', function: 'light', action: 'ein', extra: { retained: true },
    confirmation: { enabled: true, text: 'OK', extra: { retained: true } },
    loxone: { type: 'changeTo', uuid: '16aad661-0377-5ccb-ffffba27bfcae6ca', value: '1', offValue: '778', offUuid: 'aaaaaaaa-bbbb-cccc-dddddddddddddddd' }
  }]))
});

test('UI regression workflows and responsive layouts', async (t) => {
  const browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => dialog.accept());
  let persisted = fixture();
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'loxevo-test.invalid') return route.abort();
    const path = url.pathname;
    if (path === '/' || path.startsWith('/assets/')) {
      const file = path === '/' ? 'public/index.html' : `public/${path.slice(8)}`;
      return route.fulfill({ body: await readFile(new URL(file, root)), contentType: file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html' });
    }
    let body = {};
    if (path === '/api/config') {
      if (route.request().method() === 'PUT') { persisted = route.request().postDataJSON(); body = { ok: true, config: persisted }; }
      else body = persisted;
    } else if (path === '/api/dry-run') { persisted.loxone.dryRun = route.request().postDataJSON().enabled; body = { dryRun: persisted.loxone.dryRun }; }
    else if (path === '/api/loxone/controls') body = { controls: [
      { uuid: 'aaaaaaaa-bbbb-cccc-dddddddddddddddd', name: 'Küchenlicht', type: 'Switch', room: 'Küche', category: 'Licht', existingKeys: [], profiles: [{ id: 'switch', label: 'Ein / Aus', type: 'direct', value: 'on', offValue: 'off', alexaMode: 'switch' }] },
      { uuid: 'bbbbbbbb-bbbb-cccc-dddddddddddddddd', name: 'Türschloss', type: 'Switch', room: 'Eingang', category: 'Sicherheit', reason: 'Gesicherter Baustein', profiles: [], existingKeys: [] }
    ] };
    else if (path === '/api/tts/status') body = { enabled: false, ready: false, defaultDevices: [], allDevices: [], alarmDevices: [], auth: {} };
    else if (path === '/api/tts/devices') body = { devices: [] };
    else if (path === '/api/events') body = [];
    else if (path === '/api/command') body = { ok: true, result: { dryRun: true } };
    else if (path === '/api/alexa-bridge/status') body = { enabled: false, ready: false, devices: [] };
    else if (path === '/api/discovery/status') body = { helper: { available: false }, alexaBridge: { enabled: false } };
    else if (path === '/api/setup-status') body = { complete: true, checks: [] };
    else if (path === '/api/admin/status') body = { enabled: false, manageable: true };
    else if (path === '/api/dependencies') body = { dependencies: [] };
    else if (path === '/api/preflight') body = { checkedAt: new Date().toISOString(), summary: { level: 'ok', error: 0, warning: 0 }, sections: [], backup: {} };
    return route.fulfill({ json: body });
  });
  const reset = async () => {
    persisted = fixture(); await page.goto('http://loxevo-test.invalid/');
    await page.waitForFunction(() => savedConfigSnapshot !== null);
  };
  await t.test('duplicate and empty keys block saving without dropping cards', async () => {
    await reset();
    const result = await page.evaluate(() => {
      const card = roomEditor.querySelector('[data-command-original="test_1"]');
      const errors = [];
      for (const value of ['test_0', '']) { card.querySelector('.command-key').value = value; try { collectConfigFromForms(); } catch (error) { errors.push(error.message); } }
      return { errors, count: Object.keys(config.commands).length, cards: roomEditor.querySelectorAll('.room-card').length };
    });
    assert.equal(result.errors.length, 2); assert.equal(result.count, 42); assert.equal(result.cards, 42);
  });
  await t.test('discard cannot undo the persisted live mode just in the browser', async () => {
    await reset();
    const result = await page.evaluate(async () => {
      await setDryRun(false);
      roomEditor.querySelector('.command-label').value = 'Unsaved'; markConfigDirty(); discardConfigChanges();
      return { config: config.loxone.dryRun, saved: savedConfigSnapshot.loxone.dryRun, toggle: dryRunToggle.checked };
    });
    assert.deepEqual(result, { config: false, saved: false, toggle: false }); assert.equal(persisted.loxone.dryRun, false);
  });
  await t.test('edits during slow post-save refresh stay dirty and are not part of the snapshot', async () => {
    await reset();
    const result = await page.evaluate(async () => {
      const original = loadTtsStatus; let release;
      loadTtsStatus = () => new Promise((resolve) => { release = resolve; });
      const saving = saveConfig(saveBtn);
      while (!release) await new Promise((resolve) => setTimeout(resolve, 10));
      const input = roomEditor.querySelector('[data-command-original="test_0"] .command-label');
      input.value = 'AFTER SAVE'; input.dispatchEvent(new Event('input', { bubbles: true }));
      release(); await saving; loadTtsStatus = original;
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { dirty: configDirty, baseline: savedConfigSnapshot.commands.test_0.label, value: input.value, locked: document.querySelector('#configView').inert };
    });
    assert.deepEqual(result, { dirty: true, baseline: 'Test 0', value: 'AFTER SAVE', locked: false });
    assert.equal(persisted.commands.test_0.label, 'Test 0');
  });
  await t.test('pending write locks editing and prevents another save or mode switch', async () => {
    await reset();
    const result = await page.evaluate(async () => {
      const original = putJson; let release, writes = 0;
      putJson = async (_url, value) => { writes++; await new Promise((resolve) => { release = resolve; }); return { config: value }; };
      const first = saveConfig(saveBtn);
      while (!release) await new Promise((resolve) => setTimeout(resolve, 5));
      const locked = document.querySelector('#configView').inert && dryRunToggle.disabled;
      await saveJsonConfig(saveJsonBtn); await setDryRun(false);
      release(); await first; putJson = original;
      return { writes, locked, unlocked: !document.querySelector('#configView').inert, mode: config.loxone.dryRun };
    });
    assert.deepEqual(result, { writes: 1, locked: true, unlocked: true, mode: true });
  });
  await t.test('multiple inactive drafts and internal duplicate voice names can be saved', async () => {
    await reset();
    const result = await page.evaluate(() => {
      addRoom(); addRoom(); const next = collectConfigFromForms();
      const drafts = validateConfigBeforeSave(next);
      next.commands.test_1.voiceName = next.commands.test_0.voiceName; next.commands.test_1.alexaExpose = false;
      const internal = validateConfigBeforeSave(next);
      next.commands.test_1.alexaExpose = true;
      return { drafts, internal, exposed: validateConfigBeforeSave(next) };
    });
    assert.deepEqual(result.drafts, []); assert.deepEqual(result.internal, []); assert.ok(result.exposed.some((error) => error.includes('Doppelte')));
  });
  await t.test('legacy keys survive form round-trip and duplication creates a new inactive identity', async () => {
    await reset();
    const result = await page.evaluate(() => {
      config.commands['Licht Küche'] = config.commands.test_0; delete config.commands.test_0; renderCommandEditor();
      const original = collectConfigFromForms();
      const card = [...roomEditor.querySelectorAll('.room-card')].find((item) => item.dataset.commandOriginal === 'Licht Küche');
      card.querySelector('.command-card-actions button').click();
      const commands = collectConfigFromForms().commands;
      return { kept: Object.hasOwn(original.commands, 'Licht Küche'), original: commands['Licht Küche'], copy: commands.licht_kueche_kopie, draft: isDraftCommand('licht_kueche_kopie') };
    });
    assert.equal(result.kept, true); assert.equal(result.original.enabled, true); assert.equal(result.copy.enabled, false); assert.equal(result.draft, true);
    assert.deepEqual(result.copy.extra, result.original.extra);
  });
  await t.test('Loxone picker is read-only until inactive draft import, handles restrictions and duplicates', async () => {
    await reset(); await page.evaluate(() => openConfigArea('Befehle und Sprachnamen'));
    await page.locator('#loxonePickerBtn').click();
    await page.locator('.picker-control option').first().waitFor();
    await page.locator('.picker-control').selectOption('1');
    assert.equal(await page.locator('.picker-add').isDisabled(), true);
    await page.locator('.picker-control').selectOption('0');
    assert.equal(await page.locator('.picker-add').isEnabled(), true);
    assert.equal(await page.locator('.picker-mood-label').isVisible(), false);
    await mkdir('.tmp/stability', { recursive: true });
    for (const width of [1366, 390, 320]) {
      await page.setViewportSize({ width, height: 800 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: `.tmp/stability/picker-${width}.png` });
    }
    await page.setViewportSize({ width: 1366, height: 800 });
    await page.locator('.picker-add').click();
    assert.equal(await page.locator('dialog.loxone-picker').count(), 0);
    const result = await page.evaluate(() => {
      const card = roomEditor.querySelector('[data-command-original="kuechenlicht"]');
      return { command: collectConfigFromForms().commands.kuechenlicht, open: card.open, simple: card.classList.contains('command-simple'), first: roomEditor.querySelector('.room-card').dataset.commandOriginal };
    });
    assert.equal(result.command.enabled, false); assert.equal(result.command.loxone.value, 'on'); assert.equal(result.command.loxone.offValue, 'off');
    assert.equal(result.open, true); assert.equal(result.simple, true); assert.equal(result.first, 'kuechenlicht');
    assert.equal(Object.keys(persisted.commands).length, 42);
    await page.locator('#loxonePickerBtn').click(); await page.locator('.picker-control option').first().waitFor();
    await page.locator('.picker-control').selectOption('0'); assert.equal(await page.locator('.picker-add').isDisabled(), true);
    await page.keyboard.press('Escape');
  });
  await t.test('target fallback, explicit tests and partial results remain understandable', async () => {
    await reset();
    const result = await page.evaluate(() => {
      ttsDefaultDevices.value = ''; ttsAllDevices.value = 'group'; ttsAlarmDevices.value = 'alarm';
      const speak = ttsTestPlan('speak'), alarm = ttsTestPlan('alarm');
      const target = document.querySelector('#ttsTestTarget'); target.add(new Option('Echo', 'single')); target.value = 'single';
      showActionResult('ttsTestResult', deliveryDescription({ confirmed: 1, requested: 2, status: 'partial' }), true);
      return { speak, alarm, explicit: ttsTestPlan('alarm'), text: document.querySelector('#ttsTestResult').textContent };
    });
    assert.deepEqual(result.speak, { devices: ['group'], source: 'Alle/Fallback' });
    assert.deepEqual(result.alarm, { devices: ['alarm'], source: 'Alarm' }); assert.deepEqual(result.explicit.devices, ['single']);
    assert.match(result.text, /1 von 2/); assert.match(result.text, /nicht geprüft/);
    const safety = await page.evaluate(async () => {
      document.querySelector('#ttsTestTarget').value = '';
      ttsDefaultDevices.value = ''; ttsAllDevices.value = ''; ttsAlarmDevices.value = '';
      await postTtsTest('speak', speakBtn);
      await sendCommand('test_0', document.createElement('button'));
      return { tts: document.querySelector('#ttsTestResult').textContent, loxone: document.querySelector('#commandTestResult').textContent };
    });
    assert.match(safety.tts, /nichts gesendet/); assert.match(safety.loxone, /Dry-Run, nicht gesendet/);
  });
  await t.test('backup conflict preview is secret-free and cancel performs no write', async () => {
    await reset();
    const next = fixture(); delete next.commands.test_0; next.commands.test_1.label = 'Changed'; next.commands.added = next.commands.test_2;
    await page.locator('#importBackupFile').setInputFiles({ name: 'fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ config: next, cookie: { content: 'SECRET_COOKIE' } })) });
    const result = await page.evaluate(async () => {
      const original = window.confirm; let message = '';
      window.confirm = (text) => { message = text; return false; };
      await importBackup(document.querySelector('#importBackupBtn')); window.confirm = original;
      return { message, locked: configWritePending, label: config.commands.test_1.label };
    });
    assert.match(result.message, /Entfernt \(1\): test_0/); assert.match(result.message, /Neu \(1\): added/);
    assert.match(result.message, /Cookie enthalten: ja/); assert.ok(!result.message.includes('SECRET_COOKIE'));
    assert.equal(result.locked, false); assert.equal(result.label, 'Test 1'); assert.equal(persisted.commands.test_1.label, 'Test 1');
  });
  await t.test('discard restores command values and JSON save replaces stale editor state', async () => {
    await reset();
    const label = await page.evaluate(() => {
      roomEditor.querySelector('[data-command-original="test_0"] .command-label').value = 'UNSAVED'; markConfigDirty(); discardConfigChanges();
      return roomEditor.querySelector('[data-command-original="test_0"] .command-label').value;
    });
    assert.equal(label, 'Test 0');
    const result = await page.evaluate(async () => {
      const next = structuredClone(config); next.commands.test_0.label = 'JSON saved'; configEditor.value = JSON.stringify(next); await saveJsonConfig(saveJsonBtn);
      return { form: roomEditor.querySelector('[data-command-original="test_0"] .command-label').value, json: JSON.parse(configEditor.value).commands.test_0.label, dirty: configDirty };
    });
    assert.deepEqual(result, { form: 'JSON saved', json: 'JSON saved', dirty: false });
    assert.equal(persisted.commands.test_0.label, 'JSON saved');
  });
  await t.test('extra command fields and offUuid survive editing and new drafts stay open at top', async () => {
    await reset();
    const result = await page.evaluate(() => {
      const collected = collectConfigFromForms();
      addRoom(); roomEditor.querySelector('[data-command-original="neuer_befehl"] .command-label').value = 'Draft one'; addRoom();
      return { command: collected.commands.test_0, first: [...roomEditor.querySelectorAll('.room-card')].slice(0, 2).map((card) => ({ key: card.querySelector('.command-key').value, label: card.querySelector('.command-label').value, open: card.open })) };
    });
    assert.deepEqual(result.command.extra, { retained: true }); assert.equal(result.command.loxone.offUuid, fixture().commands.test_0.loxone.offUuid);
    assert.deepEqual(result.command.confirmation.extra, { retained: true });
    assert.deepEqual(result.first.map((card) => card.key), ['neuer_befehl', 'neuer_befehl_2']); assert.equal(result.first[0].label, 'Draft one'); assert.ok(result.first.every((card) => card.open));
  });
  await t.test('command validation accepts supported combinations and marks only actual omissions', async () => {
    await reset();
    const result = await page.evaluate(() => {
      const uuid = '16aad661-0377-5ccb-ffffba27bfcae6ca';
      const issues = (command) => commandValidationIssues('test', command, { test: command }).filter((issue) => issue.level === 'error').map((issue) => issue.label);
      const accepted = [
        { loxone: { type: 'direct', uuid, value: 0, offValue: 0 }, offCommand: 'absent' },
        { loxone: { type: 'raw', path: '/test/{value}', value: 0 } },
        { loxone: { type: 'raw', path: '/test' } },
        { loxone: { type: 'pulse', uuid }, alexaMode: 'action', offCommand: 'absent' },
        { enabled: false }
      ].map(issues);
      return { accepted, missingUuid: issues({ loxone: { type: 'raw', path: '/{uuid}' } }), missingValue: issues({ loxone: { type: 'raw', path: '/{command}' } }), missingOff: issues({ loxone: { type: 'direct', uuid, value: 'on' }, offCommand: 'absent' }) };
    });
    assert.ok(result.accepted.every((issues) => issues.length === 0));
    assert.deepEqual(result.missingUuid, ['UUID fehlt']); assert.deepEqual(result.missingValue, ['Wert fehlt']); assert.deepEqual(result.missingOff, ['Aus-Befehl fehlt']);
  });
  await t.test('tab switching preserves open cards and event errors retain their category', async () => {
    await reset();
    assert.deepEqual(await page.evaluate(() => {
      showView('configView'); const card = roomEditor.querySelector('.room-card'); card.open = true; showView('eventsView'); showView('configView');
      const sample = [{ type: 'tts-auth', status: 'refresh-failed' }]; activeEventFilter = 'error'; const errorCount = filterEvents(sample).length; activeEventFilter = 'tts';
      return { open: card.open, errorCount, ttsCount: filterEvents(sample).length };
    }), { open: true, errorCount: 1, ttsCount: 1 });
  });
  await t.test('renaming a draft is repeatable and duplicate keys hidden by a filter still block saving', async () => {
    await reset();
    assert.deepEqual(await page.evaluate(() => {
      addRoom(); const card = roomEditor.querySelector('[data-command-original="neuer_befehl"]'); card.querySelector('.command-key').value = 'new_name';
      const first = collectConfigFromForms(); const second = collectConfigFromForms();
      commandSearch.value = 'Test 0'; refreshCommandFilter();
      roomEditor.querySelector('.command-key').value = 'test_1';
      let blocked = false; try { collectConfigFromForms(); } catch { blocked = true; }
      return { first: Object.keys(first.commands).includes('new_name'), second: Object.keys(second.commands).includes('new_name'), blocked };
    }), { first: true, second: true, blocked: true });
  });
  await t.test('admin dialog traps focus and Escape restores it', async () => {
    await reset();
    await page.evaluate(() => { document.querySelector('#openWizardBtn').focus(); void requestAdminToken('Test'); });
    await page.locator('.admin-token-input').focus(); await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.type), 'submit');
    await page.keyboard.press('Escape'); assert.equal(await page.locator('.admin-token-modal').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'openWizardBtn');
  });
  await t.test('all six views fit desktop, tablet and mobile widths', async () => {
    await reset(); await mkdir('.tmp/stability', { recursive: true });
    const overflow = [];
    for (const width of [1366, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 800 });
      for (const view of ['dashboardView', 'configView', 'controlView', 'integrationView', 'maintenanceView', 'eventsView']) {
        await page.evaluate((id) => { showView(id); document.getElementById(id).querySelectorAll('details').forEach((node) => { node.open = true; }); }, view);
        const delta = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (delta > 1) overflow.push({ width, view, delta });
      }
      await page.evaluate(() => { showView('configView'); addRoom(); });
      await page.locator('[data-command-original="neuer_befehl"] .command-key').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `.tmp/stability/config-${width}.png` });
    }
    assert.deepEqual(overflow, []);
  });
  assert.deepEqual(errors, []);
});
