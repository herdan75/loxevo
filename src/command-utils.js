export const COMMAND_TYPES = ['changeTo', 'direct', 'pulse', 'raw'];
export const LOXONE_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCommandType(value) {
  return COMMAND_TYPES.includes(value);
}

export function readCommandTarget(command = {}) {
  const loxone = command.loxone || {};
  const type = normalizeCommandType(
    loxone.type || command.loxoneType || command.type || (loxone.path || command.loxonePath ? 'raw' : 'changeTo')
  );

  return {
    type,
    uuid: normalizeLoxoneUuid(loxone.uuid || command.loxoneUuid || ''),
    value: loxone.value ?? loxone.command ?? command.loxoneCommand ?? '',
    path: loxone.path || command.loxonePath || ''
  };
}

export function readCommandOffTarget(command = {}) {
  const loxone = command.loxone || {};
  const target = readCommandTarget(command);
  const type = target.type;

  return {
    type,
    uuid: normalizeLoxoneUuid(loxone.offUuid || target.uuid || ''),
    value: loxone.offValue ?? loxone.offCommand ?? '',
    path: loxone.offPath || ''
  };
}

export function hasCommandOffTarget(command = {}) {
  const target = readCommandOffTarget(command);
  if (target.type === 'raw') return Boolean(String(target.path || '').trim());
  if (target.type === 'pulse') return false;
  return Boolean(String(target.value || '').trim());
}

export function normalizeCommandType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'changeto' || raw === 'change_to') return 'changeTo';
  if (raw === 'command' || raw === 'direct') return 'direct';
  if (raw === 'pulse') return 'pulse';
  if (raw === 'raw' || raw === 'path') return 'raw';
  return raw || 'changeTo';
}

export function normalizeLoxoneUuid(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (match) return match[0].toLowerCase();
  return raw.replace(/^\/?jdev\/sps\/io\//i, '').split('/')[0].trim();
}

export function isValidLoxoneUuid(value) {
  return LOXONE_UUID_PATTERN.test(String(value || '').trim());
}
