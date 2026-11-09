document.querySelector('#loxonePickerBtn').addEventListener('click', openLoxonePicker);

async function openLoxonePicker() {
  if (configWritePending) return;
  const opener = document.activeElement;
  const modal = document.createElement('dialog');
  modal.className = 'loxone-picker';
  modal.setAttribute('aria-labelledby', 'loxonePickerTitle');
  modal.innerHTML = `
    <form method="dialog" class="section-head compact"><h2 id="loxonePickerTitle">Aus Loxone hinzufügen</h2><button class="secondary" aria-label="Schließen" title="Schließen">×</button></form>
    <p class="picker-status" role="status">Struktur wird gelesen …</p>
    <div class="form-row"><label>Suche<input class="picker-search" type="search"></label><label>Raum<select class="picker-room"><option value="">Alle Räume</option></select></label></div>
    <label>Baustein<select class="picker-control" size="8" aria-label="Baustein" aria-describedby="pickerSelection"></select></label>
    <p id="pickerSelection" class="picker-selection field-note" hidden></p>
    <div class="form-row"><label>Aktion<select class="picker-action" disabled aria-describedby="pickerNote"><option>Baustein auswählen</option></select></label><label class="picker-mood-label" hidden>Stimmungs-ID<input class="picker-mood" type="number" min="0" step="1"></label></div>
    <label>Anzeigename / Sprachname<input class="picker-name" type="text" maxlength="200" disabled></label>
    <p id="pickerNote" class="picker-note field-note" role="status"></p>
    <details class="picker-technical" hidden><summary>Technische Vorschau</summary><pre class="picker-preview"></pre></details>
    <div class="actions"><button class="picker-add" type="button" disabled>Als Entwurf hinzufügen</button></div>`;
  document.body.append(modal);
  modal.addEventListener('close', () => { modal.remove(); opener?.focus(); }, { once: true });
  modal.showModal();
  const find = (selector) => modal.querySelector(selector);
  const status = find('.picker-status'), list = find('.picker-control'), actions = find('.picker-action');
  const name = find('.picker-name'), mood = find('.picker-mood'), note = find('.picker-note'), add = find('.picker-add');
  let controls = [], selected = null, proposed = null;
  const option = (value, text) => { const item = document.createElement('option'); item.value = value; item.textContent = text; return item; };
  function commandPath(target) {
    let path;
    if (target.type === 'raw') {
      path = String(target.path || '').replaceAll('{uuid}', encodeURIComponent(target.uuid || ''))
        .replaceAll('{value}', encodeURIComponent(target.value ?? '')).replaceAll('{command}', encodeURIComponent(target.value ?? ''));
    } else {
      const suffix = target.type === 'pulse' ? 'pulse' : `${target.type === 'changeTo' ? 'changeTo/' : ''}${encodeURIComponent(target.value)}`;
      path = `/jdev/sps/io/${target.uuid}/${suffix}`;
    }
    try {
      const base = new URL(config.loxone.baseUrl);
      const url = new URL(path.startsWith('/') || /^https?:/i.test(path) ? path : `/${path}`, base);
      const pathname = url.pathname.replace(/^(\/jdev\/sps\/io\/)([^/]+)/, (match, prefix, uuid) => isValidLoxoneUuid(uuid) ? `${prefix}${uuid.toLowerCase()}` : match);
      return url.origin === base.origin ? `${pathname}${url.search}` : url.href;
    } catch { return path; }
  }
  function preview() {
    proposed = null; add.disabled = true;
    find('.picker-preview').textContent = ''; find('.picker-technical').hidden = true;
    const profile = selected?.profiles.find((entry) => entry.id === actions.value);
    find('.picker-mood-label').hidden = !profile?.needsValue;
    if (!profile) { note.textContent = selected?.reason || 'Baustein auswählen.'; return; }
    const value = profile.needsValue ? mood.value.trim() : profile.value;
    if (profile.needsValue && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      note.textContent = 'Die Stimmungs-ID aus Loxone ist erforderlich. Stimmungsnamen sind nicht Teil dieser statischen Struktur.';
      find('.picker-preview').textContent = ''; return;
    }
    const target = profile.type === 'raw'
      ? { type: 'raw', uuid: '', value: '', path: profile.path, ...(profile.offPath ? { offPath: profile.offPath } : {}) }
      : { type: profile.type, uuid: selected.uuid, value, ...(profile.offValue !== undefined ? { offValue: profile.offValue } : {}) };
    const onPath = commandPath(target);
    const offPath = target.offPath || (profile.offValue !== undefined ? commandPath({ ...target, value: profile.offValue }) : '');
    find('.picker-preview').textContent = `${profile.alexaMode === 'action' ? 'Aktion' : 'Ein'}: ${onPath}${offPath ? `\nAus: ${offPath}` : ''}`;
    find('.picker-technical').hidden = false;
    let commands;
    try { commands = collectConfigFromForms().commands; }
    catch (error) { note.textContent = error.message; return; }
    const duplicates = Object.entries(commands).filter(([, command]) => {
      const existing = getCommandTarget(command);
      return commandPath(existing) === onPath;
    });
    if (duplicates.length) { note.textContent = `Bereits vorhanden: ${duplicates.map(([key]) => key).join(', ')}. Bestehenden Befehl bearbeiten oder duplizieren.`; return; }
    if (!name.value.trim()) { note.textContent = 'Anzeigenamen eintragen.'; return; }
    proposed = { label: name.value.trim(), voiceName: name.value.trim(), category: selected.category || 'Allgemein', room: normalizeInputKey(selected.room), function: normalizeInputKey(selected.type), action: profile.id, alexaMode: profile.alexaMode, loxone: target, enabled: false };
    note.textContent = `${selected.existingKeys.length ? `Baustein bereits zugeordnet: ${selected.existingKeys.join(', ')}. ` : ''}${selected.type === 'Jalousie' ? 'Alexa bleibt ein Schalter: Ein führt die erste, Aus die zweite Aktion aus. ' : ''}Neuer Entwurf bleibt bis zur bewussten Aktivierung inaktiv.`;
    add.disabled = false;
  }
  function select() {
    selected = list.selectedIndex >= 0 ? controls[Number(list.value)] || null : null;
    const available = selected?.profiles || [];
    actions.disabled = !available.length; name.disabled = !available.length;
    actions.replaceChildren(...(available.length ? available.map((profile) => option(profile.id, profile.label)) : [option('', selected ? 'Nicht unterstützt' : 'Baustein auswählen')]));
    const selection = find('.picker-selection');
    selection.hidden = !selected;
    selection.textContent = selected ? [selected.room, selected.parentName, `${selected.name} (${selected.type})`].filter(Boolean).join(' › ') : '';
    name.value = selected?.name || ''; mood.value = ''; preview();
  }
  function filter() {
    const search = normalizeText(find('.picker-search').value), room = find('.picker-room').value;
    const matches = controls.map((control, index) => ({ control, index })).filter(({ control }) => (!room || control.room === room) && normalizeText(`${control.name} ${control.parentName || ''} ${control.room} ${control.type}`).includes(search));
    const roots = new Map(controls.filter((control) => control.parentId == null).map((control) => [control.id, control]));
    const parents = new Set(controls.filter((control) => control.parentId != null).map((control) => control.rootId));
    const groups = new Map();
    for (const { control, index } of matches.slice(0, 150)) {
      const root = roots.get(control.rootId);
      const grouped = root && parents.has(root.id);
      const groupKey = grouped ? `control:${root.id}` : `room:${control.room}`;
      if (!groups.has(groupKey)) {
        const group = document.createElement('optgroup');
        group.label = grouped ? [root.room, root.name].filter(Boolean).join(' · ') : control.room || 'Ohne Raum';
        groups.set(groupKey, group);
      }
      const item = option(String(index), `${control.parentId != null ? '↳ ' : ''}${control.name} (${control.type})${control.reason ? ' · nicht unterstützt' : control.existingKeys.length ? ' · bereits zugeordnet' : ''}`);
      item.title = control.reason || control.name;
      groups.get(groupKey).append(item);
    }
    list.replaceChildren(...groups.values());
    list.selectedIndex = -1; select();
    const supported = matches.filter(({ control }) => control.profiles.length).length;
    status.textContent = matches.length ? `${matches.length} Treffer · ${supported} unterstützt${matches.length > 150 ? ' · erste 150 angezeigt' : ''}` : 'Keine Bausteine für diese Suche gefunden.';
  }
  list.addEventListener('change', select);
  actions.addEventListener('change', preview); mood.addEventListener('input', preview); name.addEventListener('input', preview);
  find('.picker-search').addEventListener('input', filter); find('.picker-room').addEventListener('change', filter);
  add.addEventListener('click', () => {
    preview(); if (!proposed) return;
    if (addCommandDraft(proposed, normalizeInputKey(proposed.label), true)) modal.close();
  });
  try {
    const response = await adminFetch('/api/loxone/controls', { cache: 'no-store' });
    await ensureOk(response);
    const result = await response.json();
    if (!modal.isConnected) return;
    controls = result.controls || [];
    const rooms = [...new Set(controls.map((control) => control.room).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
    find('.picker-room').append(...rooms.map((room) => option(room, room)));
    filter(); find('.picker-search').focus();
  } catch (error) { status.textContent = error.message; status.classList.add('danger-text'); }
}
