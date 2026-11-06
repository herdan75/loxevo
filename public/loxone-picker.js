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
    <label>Baustein<select class="picker-control" size="6" aria-label="Baustein"></select></label>
    <div class="form-row"><label>Aktion<select class="picker-action"></select></label><label class="picker-mood-label" hidden>Stimmungs-ID<input class="picker-mood" type="number" min="0" step="1"></label></div>
    <label>Anzeigename / Sprachname<input class="picker-name" type="text" maxlength="200"></label>
    <p class="picker-note field-note" role="status"></p>
    <details><summary>Technische Vorschau</summary><pre class="picker-preview"></pre></details>
    <div class="actions"><button class="picker-add" type="button" disabled>Als Entwurf hinzufügen</button></div>`;
  document.body.append(modal);
  modal.addEventListener('close', () => { modal.remove(); opener?.focus(); }, { once: true });
  modal.showModal();
  const find = (selector) => modal.querySelector(selector);
  const status = find('.picker-status'), list = find('.picker-control'), actions = find('.picker-action');
  const name = find('.picker-name'), mood = find('.picker-mood'), note = find('.picker-note'), add = find('.picker-add');
  let controls = [], selected = null, proposed = null;
  const option = (value, text) => { const item = document.createElement('option'); item.value = value; item.textContent = text; return item; };
  function preview() {
    proposed = null; add.disabled = true;
    const profile = selected?.profiles.find((entry) => entry.id === actions.value);
    find('.picker-mood-label').hidden = !profile?.needsValue;
    if (!profile) { note.textContent = selected?.reason || 'Baustein auswählen.'; find('.picker-preview').textContent = ''; return; }
    const value = profile.needsValue ? mood.value.trim() : profile.value;
    if (profile.needsValue && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      note.textContent = 'Die Stimmungs-ID aus Loxone ist erforderlich. Stimmungsnamen sind nicht Teil dieser statischen Struktur.';
      find('.picker-preview').textContent = ''; return;
    }
    const target = { type: profile.type, uuid: selected.uuid, value, ...(profile.offValue !== undefined ? { offValue: profile.offValue } : {}) };
    const suffix = profile.type === 'pulse' ? 'pulse' : `${profile.type === 'changeTo' ? 'changeTo/' : ''}${encodeURIComponent(value)}`;
    find('.picker-preview').textContent = `Ein: /jdev/sps/io/${selected.uuid}/${suffix}${profile.offValue !== undefined ? `\nAus: /jdev/sps/io/${selected.uuid}/${profile.type === 'changeTo' ? 'changeTo/' : ''}${profile.offValue}` : ''}`;
    let commands;
    try { commands = collectConfigFromForms().commands; }
    catch (error) { note.textContent = error.message; return; }
    const duplicates = Object.entries(commands).filter(([, command]) => {
      const existing = getCommandTarget(command);
      return existing.uuid === target.uuid && existing.type === target.type && String(existing.value) === String(target.value);
    });
    if (duplicates.length) { note.textContent = `Bereits vorhanden: ${duplicates.map(([key]) => key).join(', ')}. Bestehenden Befehl bearbeiten oder duplizieren.`; return; }
    if (!name.value.trim()) { note.textContent = 'Anzeigenamen eintragen.'; return; }
    proposed = { label: name.value.trim(), voiceName: name.value.trim(), category: selected.category || 'Allgemein', room: normalizeInputKey(selected.room), function: normalizeInputKey(selected.type), action: profile.id, alexaMode: profile.alexaMode, loxone: target, enabled: false };
    note.textContent = `${selected.existingKeys.length ? `Baustein bereits zugeordnet: ${selected.existingKeys.join(', ')}. ` : ''}${selected.type === 'Jalousie' ? 'Alexa bleibt ein Schalter: Ein führt die erste, Aus die zweite Aktion aus. ' : ''}Neuer Entwurf bleibt bis zur bewussten Aktivierung inaktiv.`;
    add.disabled = false;
  }
  function select() {
    selected = controls[Number(list.value)] || null;
    actions.replaceChildren(...(selected?.profiles || []).map((profile) => option(profile.id, profile.label)));
    name.value = selected?.name || ''; mood.value = ''; preview();
  }
  function filter() {
    const search = normalizeText(find('.picker-search').value), room = find('.picker-room').value;
    const matches = controls.map((control, index) => ({ control, index })).filter(({ control }) => (!room || control.room === room) && normalizeText(`${control.name} ${control.room} ${control.type}`).includes(search));
    list.replaceChildren(...matches.slice(0, 150).map(({ control, index }) => option(String(index), `${control.room ? `${control.room} · ` : ''}${control.name} (${control.type})${control.reason ? ` · ${control.reason}` : control.existingKeys.length ? ' · bereits zugeordnet' : ''}`)));
    list.selectedIndex = -1; selected = null; actions.replaceChildren();
    status.textContent = `${matches.length} Treffer${matches.length > 150 ? ', erste 150 angezeigt' : ''}. Gespeicherter Miniserver; nur lesender Abruf.`;
    preview();
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
