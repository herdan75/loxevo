const SECRET_KEY = /^(?:.*cookie|.*token|.*password|passwd|.*secret|authorization|csrf|macDms|device_private_key|api[_-]?key)$/i;

export function redactUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '<url>';
    return `${url.protocol}//<host>${url.port ? `:${url.port}` : ''}/<path>`;
  } catch { return '<url>'; }
}

export function redactDiagnosticText(value) {
  return String(value)
    .replace(/\b(?:set-cookie|cookie|authorization)\s*:\s*[^\r\n]*/gi, '<auth-header>')
    .replace(/https?:\/\/[^\s"'<>]+/gi, (match) => redactUrl(match))
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9+/=_.-]+/gi, '<auth>')
    .replace(/\b(cookie|localCookie|loginCookie|refreshToken|accessToken|token|password|passwd|secret|authorization|csrf|macDms)\b["']?\s*[:=]\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;}]+)/gi, '$1=<redacted>')
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '<ip>');
}

export function sanitizeDiagnosticValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeDiagnosticValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, SECRET_KEY.test(key) && !(/^has[A-Z]/.test(key) && typeof nested === 'boolean') ? '<redacted>' : sanitizeDiagnosticValue(nested)]));
  }
  return typeof value === 'string' ? redactDiagnosticText(value) : value;
}
