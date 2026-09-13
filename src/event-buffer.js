import { sanitizeDiagnosticValue } from './diagnostics.js';

export const MAX_EVENTS = 300;
export const MAX_DIAGNOSTIC_EVENTS = 200;
export const MAX_EVENT_BYTES = 8192;

function bounded(value, depth = 0) {
  if (typeof value === 'string') return value.length > 1024 ? `${value.slice(0, 1024)}...` : value;
  if (Array.isArray(value)) return depth > 2 ? '[...]' : value.slice(0, 16).map((item) => bounded(item, depth + 1));
  if (value && typeof value === 'object') return depth > 2 ? '{...}' : Object.fromEntries(Object.entries(value).slice(0, 24).map(([key, item]) => [key.slice(0, 64), bounded(item, depth + 1)]));
  return ['number', 'boolean'].includes(typeof value) || value == null ? value : String(value).slice(0, 128);
}

export function prepareEvent(event) {
  const result = sanitizeDiagnosticValue(bounded(event));
  result.at = new Date().toISOString();
  result.type = String(result.type || 'system').slice(0, 64);
  result.status = String(result.status || 'info').slice(0, 64);
  result.severity = /error|failed|not-ready|unconfirmed|partial/.test(result.status) ? 'error' : /warning|optional/.test(result.status) ? 'warning' : 'info';
  if (Buffer.byteLength(JSON.stringify(result)) <= MAX_EVENT_BYTES) return result;
  return { at: result.at, type: result.type, status: result.status, severity: result.severity, text: String(result.text || result.error || '').slice(0, 1024), truncated: true };
}

export function appendEvent(events, event) {
  events.unshift(prepareEvent(event));
  events.splice(MAX_EVENTS);
}
