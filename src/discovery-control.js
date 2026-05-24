export class DiscoveryControl {
  constructor(config) {
    this.config = config;
    this.baseUrl = normalizeHelperUrl(process.env.DISCOVERY_HELPER_URL || config.discovery?.helperUrl || 'http://127.0.0.1:18091');
    this.token = String(process.env.DISCOVERY_HELPER_TOKEN || config.discovery?.helperToken || '').trim();
    this.timeoutMs = Number(process.env.DISCOVERY_HELPER_TIMEOUT_MS || config.discovery?.helperTimeoutMs || 5000);
  }

  async getStatus() {
    return await this.request('GET', '/status');
  }

  async start() {
    return await this.request('POST', '/start');
  }

  async stop() {
    return await this.request('POST', '/stop');
  }

  async request(method, path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.headers(),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `Discovery-Helper HTTP ${response.status}`);
      }
      return {
        available: true,
        ...payload,
        helperUrl: this.baseUrl
      };
    } catch (error) {
      return {
        available: false,
        ready: false,
        error: humanizeHelperError(error),
        helperUrl: this.baseUrl
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  headers() {
    if (!this.token) return {};
    return { authorization: `Bearer ${this.token}` };
  }
}

function normalizeHelperUrl(value) {
  return String(value || 'http://127.0.0.1:18091').trim().replace(/\/+$/, '');
}

function humanizeHelperError(error) {
  const message = String(error?.message || error || '');
  if (error?.name === 'AbortError') {
    return 'Discovery-Helper antwortet nicht rechtzeitig.';
  }
  if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
    return 'Discovery-Helper ist nicht erreichbar. Der Button kann den LoxBerry-SSDP-Dienst erst steuern, wenn der Host-Helper installiert und gestartet ist.';
  }
  return message || 'Discovery-Helper ist nicht erreichbar.';
}
