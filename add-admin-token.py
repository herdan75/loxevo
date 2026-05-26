from pathlib import Path
import json


def replace_once(file, old, new):
    path = Path(file)
    text = path.read_text(encoding="utf-8")
    if new in text:
        print(f"SKIP: {file} ist bereits angepasst")
        return
    if old not in text:
        raise SystemExit(f"NICHT GEFUNDEN in {file}:\n{old}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"OK: {file}")


replace_once(
    "src/index.js",
    "const MAX_REQUEST_BODY_SIZE = 1024 * 1024 * 2;\nconst LOXONE_TTS_RESERVED_PATHS = new Set([",
    """const MAX_REQUEST_BODY_SIZE = 1024 * 1024 * 2;
const ADMIN_TOKEN_HEADER = 'x-loxevo-admin-token';
const ADMIN_PROTECTED_API_ROUTES = [
  ['GET', 'config'],
  ['PUT', 'config'],
  ['GET', 'backup'],
  ['POST', 'backup/restore'],
  ['POST', 'dependencies/alexa-remote2/update'],
  ['POST', 'system/restart'],
  ['PUT', 'dry-run']
];
const LOXONE_TTS_RESERVED_PATHS = new Set(["""
)

replace_once(
    "src/index.js",
    "async function handleApi(req, res, pathParts, readRequestBody, url) {\n",
    """async function handleApi(req, res, pathParts, readRequestBody, url) {
  if (isAdminProtectedApiRequest(req, pathParts) && !isAdminAuthorized(req)) {
    return sendAdminUnauthorized(res);
  }

"""
)

replace_once(
    "src/index.js",
    "\nasync function exportBackup(res, includeCookie) {\n",
    """
function adminToken() {
  const envToken = String(process.env.LOXEVO_ADMIN_TOKEN || '').trim();
  if (envToken) return envToken;

  if (config.security?.adminTokenEnabled === true) {
    return String(config.security?.adminToken || '').trim();
  }

  return '';
}

function isAdminProtectionEnabled() {
  return Boolean(adminToken());
}

function isAdminProtectedApiRequest(req, pathParts) {
  if (!isAdminProtectionEnabled()) return false;
  const route = pathParts.slice(1).join('/');
  return ADMIN_PROTECTED_API_ROUTES.some(([method, protectedRoute]) => (
    req.method === method && route === protectedRoute
  ));
}

function isAdminAuthorized(req) {
  const expected = adminToken();
  if (!expected) return true;

  const headerToken = String(req.headers[ADMIN_TOKEN_HEADER] || '').trim();
  const authHeader = String(req.headers.authorization || '').trim();
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  return headerToken === expected || bearerToken === expected;
}

function sendAdminUnauthorized(res) {
  res.setHeader('x-loxevo-admin-token', 'required');
  return sendJson(res, {
    error: 'Admin-Token erforderlich.',
    adminTokenRequired: true
  }, 401);
}

async function exportBackup(res, includeCookie) {
"""
)

replace_once(
    "src/config.js",
    "  config.discovery.helperTimeoutMs = Number(config.discovery.helperTimeoutMs || 5000);\n}",
    """  config.discovery.helperTimeoutMs = Number(config.discovery.helperTimeoutMs || 5000);
  config.security ||= {};
  config.security.adminTokenEnabled = config.security.adminTokenEnabled === true;
  config.security.adminToken = String(config.security.adminToken || '');
}"""
)

replace_once(
    "public/app.js",
    "const roomsEl = document.querySelector('#rooms');",
    """const ADMIN_TOKEN_STORAGE_KEY = 'loxevoAdminToken';
const ADMIN_TOKEN_HEADER = 'X-LoxEvo-Admin-Token';
const originalFetch = window.fetch.bind(window);

window.fetch = async function loxevoFetch(input, init = {}) {
  let response = await originalFetch(input, withAdminToken(init));
  if (response.status !== 401 || response.headers.get('x-loxevo-admin-token') !== 'required') {
    return response;
  }

  const token = window.prompt('Admin-Token erforderlich:');
  if (!token) return response;

  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token.trim());
  response = await originalFetch(input, withAdminToken(init));
  if (response.status === 401) {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  }
  return response;
};

function withAdminToken(init = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  if (!token) return init;

  const next = { ...init };
  const headers = new Headers(next.headers || {});
  headers.set(ADMIN_TOKEN_HEADER, token);
  next.headers = headers;
  return next;
}

const roomsEl = document.querySelector('#rooms');"""
)

cfg_path = Path("config.example.json")
cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
cfg.setdefault("security", {
    "adminTokenEnabled": False,
    "adminToken": ""
})
cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("OK: config.example.json")

replace_once(
    "docker-compose.yml",
    "      CONFIG_PATH: /config/config.json\n      TZ: Europe/Zurich",
    """      CONFIG_PATH: /config/config.json
      TZ: Europe/Zurich
      # Optional: schützt Admin-Funktionen wie Konfiguration, Backup, Restore und Neustart.
      # Leer oder nicht gesetzt = Schutz aus, gesetzt = Schutz ein.
      # LOXEVO_ADMIN_TOKEN: "bitte-aendern""" 
)

replace_once(
    "README.md",
    "Web-UI:\n\n```text\nhttp://<loxberry>:8080\n```\n",
    """Web-UI:

```text
http://<loxberry>:8080
```

Optionaler Admin-Zugriffsschutz:

```yaml
environment:
  LOXEVO_ADMIN_TOKEN: "bitte-aendern"
```

Wenn `LOXEVO_ADMIN_TOKEN` gesetzt ist, schützt LoxEvo sensible Admin-Funktionen wie Konfiguration, Backup, Restore, Dependency-Update, Neustart und Dry-Run-Umschaltung. Loxone-Befehle, TTS, Health, Events, Setup-Status, Preflight und die Alexa/Hue-Bridge bleiben bewusst offen, damit bestehende Automationen weiter funktionieren.

Alternativ kann der Schutz in der lokalen `config.json` über `security.adminTokenEnabled` und `security.adminToken` aktiviert werden. Ein gesetztes `LOXEVO_ADMIN_TOKEN` aus der Docker-Umgebung hat Vorrang.

"""
)

print("Fertig. Bitte danach ausführen:")
print("npm run check")
print("git diff")
print("git add .")
print('git commit -m "Add optional admin token protection"')
print("git push origin develop")
