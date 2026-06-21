import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { normalizeConfig } from '../src/config.js';
import { describeFileMode } from '../src/file-security.js';
import { parseAlexaCookieFile, TtsService } from '../src/tts.js';

describe('Alexa cookie parsing', () => {
  it('accepts a raw cookie string', () => {
    const auth = parseAlexaCookieFile('session-id=abc; ubid-acbde=123');

    assert.equal(auth.isJson, false);
    assert.equal(auth.cookie, 'session-id=abc; ubid-acbde=123');
    assert.equal(auth.cookieData, null);
  });

  it('keeps full JSON cookieData fields', () => {
    const auth = parseAlexaCookieFile(JSON.stringify({
      localCookie: 'session-id=abc',
      loginCookie: 'login-cookie',
      refreshToken: 'refresh-token',
      deviceSerial: 'device-serial',
      csrf: 'csrf-token',
      macDms: { device_private_key: 'private-key' },
      amazonPage: 'amazon.de',
      deviceAppName: 'LoxEvo',
      tokenDate: 1710000000000,
      dataVersion: 2
    }));

    assert.equal(auth.isJson, true);
    assert.equal(auth.cookie, 'session-id=abc');
    assert.equal(auth.cookieData.refreshToken, 'refresh-token');
    assert.equal(auth.cookieData.deviceSerial, 'device-serial');
    assert.equal(auth.csrf, 'csrf-token');
    assert.deepEqual(auth.macDms, { device_private_key: 'private-key' });
    assert.equal(auth.formerRegistrationData.refreshToken, 'refresh-token');
  });
});

describe('TTS config normalization', () => {
  it('sets safe defaults and clamps reconnect values', () => {
    const config = {
      loxone: { baseUrl: 'http://loxone' },
      commands: {},
      tts: {
        authRefreshIntervalHours: 0,
        usePushConnection: 'true',
        loginProxyReconnectIntervalSeconds: 1,
        loginProxyReconnectTimeoutMinutes: 120
      }
    };

    normalizeConfig(config);

    assert.equal(config.tts.authRefreshIntervalHours, 1);
    assert.equal(config.tts.usePushConnection, false);
    assert.equal(config.tts.loginProxyAutoReconnect, true);
    assert.equal(config.tts.loginProxyReconnectIntervalSeconds, 5);
    assert.equal(config.tts.loginProxyReconnectTimeoutMinutes, 60);
  });
});

describe('Sensitive file mode helpers', () => {
  it('detects group or other readable modes', () => {
    assert.equal(describeFileMode(0o600).groupOrOtherReadable, false);
    assert.equal(describeFileMode(0o640).groupOrOtherReadable, true);
    assert.equal(describeFileMode(0o604).groupOrOtherReadable, true);
    assert.equal(describeFileMode(0o644).modeOctal, '644');
  });
});

describe('TTS reconnect candidate handling', () => {
  it('keeps the existing ready remote when candidate init fails', async () => {
    const service = await createReconnectService(FailingRemote);
    const oldRemote = new TrackableRemote();
    service.remote = oldRemote;
    service.ready = true;

    const result = await service.reconnect('test-failure');

    assert.equal(result.ok, false);
    assert.equal(result.status.ready, true);
    assert.equal(service.ready, true);
    assert.equal(service.remote, oldRemote);
    assert.equal(oldRemote.stopped, false);
  });

  it('swaps the remote only after successful candidate init', async () => {
    const service = await createReconnectService(SuccessRemote);
    const oldRemote = new TrackableRemote();
    service.remote = oldRemote;
    service.ready = true;

    const result = await service.reconnect('test-success');

    assert.equal(result.ok, true);
    assert.equal(result.status.ready, true);
    assert.equal(service.ready, true);
    assert.notEqual(service.remote, oldRemote);
    assert.equal(service.remote instanceof SuccessRemote, true);
    assert.equal(oldRemote.stopped, true);
  });

  it('keeps not-ready state when candidate requires login and no old ready remote exists', async () => {
    const service = await createReconnectService(LoginRequiredRemote);
    service.ready = false;
    service.remote = null;

    const result = await service.reconnect('test-login-required');

    assert.equal(result.ok, false);
    assert.equal(result.status.ready, false);
    assert.equal(service.ready, false);
    assert.equal(service.loginProxyActive, true);
    assert.equal(service.loginUrl, 'http://127.0.0.1:12345/');
    assert.equal(service.loginProxyRemote instanceof LoginRequiredRemote, true);
  });

  it('keeps ready remote active when candidate requires login', async () => {
    const service = await createReconnectService(LoginRequiredRemote);
    const oldRemote = new TrackableRemote();
    service.remote = oldRemote;
    service.ready = true;

    const result = await service.reconnect('test-ready-login-required');

    assert.equal(result.ok, false);
    assert.equal(result.status.ready, true);
    assert.equal(service.ready, true);
    assert.equal(service.remote, oldRemote);
    assert.equal(oldRemote.stopped, false);
    assert.equal(service.loginProxyActive, true);
    assert.equal(service.loginProxyRemote instanceof LoginRequiredRemote, true);
  });

  it('treats a proxy prompt as WAIT_PROXY and commits the same candidate after final success', async () => {
    const service = await createReconnectService(ProxyThenSuccessRemote);

    const result = await service.reconnect('test-proxy-success');

    assert.equal(result.waitProxy, true);
    assert.equal(service.authState, 'WAIT_PROXY');
    assert.equal(service.loginProxyActive, true);
    assert.equal(service.loginUrl, 'http://127.0.0.1:12345/');

    await waitFor(() => service.ready === true && service.remote instanceof ProxyThenSuccessRemote);

    assert.equal(service.authState, 'READY');
    assert.equal(service.loginProxyActive, false);
  });

  it('keeps the old ready remote while a proxy candidate is waiting', async () => {
    const service = await createReconnectService(ProxyThenSuccessRemote);
    const oldRemote = new TrackableRemote();
    service.remote = oldRemote;
    service.ready = true;
    service.authState = 'READY';

    const result = await service.reconnect('test-ready-proxy-success');

    assert.equal(result.waitProxy, true);
    assert.equal(service.ready, true);
    assert.equal(service.remote, oldRemote);
    assert.equal(oldRemote.stopped, false);

    await waitFor(() => service.remote instanceof ProxyThenSuccessRemote);

    assert.equal(oldRemote.stopped, true);
    assert.equal(service.ready, true);
  });

  it('does not create a second proxy candidate while WAIT_PROXY is active', async () => {
    CountingProxyRemote.constructed = 0;
    const service = await createReconnectService(CountingProxyRemote);

    const first = await service.reconnect('test-proxy-once');
    const second = await service.reconnect('test-proxy-again');

    assert.equal(first.waitProxy, true);
    assert.equal(second.waitProxy, true);
    assert.equal(CountingProxyRemote.constructed, 1);
    assert.equal(service.loginUrl, 'http://127.0.0.1:12345/');
  });

  it('keeps the old ready remote when proxy candidate later fails', async () => {
    const service = await createReconnectService(ProxyThenFailRemote);
    const oldRemote = new TrackableRemote();
    service.remote = oldRemote;
    service.ready = true;
    service.authState = 'READY';

    const result = await service.reconnect('test-proxy-final-failure');

    assert.equal(result.waitProxy, true);
    await waitFor(() => service.loginProxyActive === false);

    assert.equal(service.ready, true);
    assert.equal(service.remote, oldRemote);
    assert.equal(oldRemote.stopped, false);
    assert.match(service.lastAuthError, /final failed/);
  });
});

describe('TTS auth refresh retry', () => {
  it('uses refreshAlexaCookies on the existing ready remote before reconnecting', async () => {
    const service = await createReconnectService(SuccessRemote);
    const remote = new RefreshableRemote();
    service.remote = remote;
    service.ready = true;
    service.authState = 'READY';
    let attempts = 0;
    service.reconnect = async () => {
      throw new Error('reconnect should not be used');
    };

    await service.withAuthRetry('test-auth-refresh', async () => {
      attempts += 1;
      if (attempts === 1) {
        const error = new Error('unauthorized');
        error.statusCode = 401;
        throw error;
      }
      return 'ok';
    });

    assert.equal(attempts, 2);
    assert.equal(remote.refreshes, 1);
  });
});

describe('TTS login proxy reconnect polling', () => {
  it('does not reconnect only because the login proxy remote still has stale cookieData', async () => {
    const service = await createReconnectService(SuccessRemote);
    const startedAt = new Date(Date.now() - 10_000);
    let reconnects = 0;
    let timerStarts = 0;
    service.ready = false;
    service.loginProxyActive = true;
    service.loginProxyStartedAt = startedAt.toISOString();
    service.loginProxyExpiresAt = new Date(Date.now() + 60_000).toISOString();
    service.loginProxyLastHandledCookieMtimeMs = Date.now() + 10_000;
    service.loginProxyRemoteCookieFingerprint = null;
    service.loginProxyRemote = {
      cookieData: {
        localCookie: 'session-id=abc',
        csrf: 'csrf-token',
        tokenDate: 1710000000000
      }
    };
    service.reconnect = async () => {
      reconnects += 1;
      return { ok: false, status: service.getStatus() };
    };
    service.startLoginProxyReconnectTimer = () => {
      timerStarts += 1;
    };

    await service.checkLoginProxyReconnect();

    assert.equal(reconnects, 0);
    assert.equal(timerStarts, 1);
  });

  it('reconnects once when the cookie file changed after login started', async () => {
    const service = await createReconnectService(SuccessRemote);
    const startedAt = new Date(Date.now() - 10_000);
    let reconnects = 0;
    let reason = '';
    let timerStarts = 0;
    service.ready = false;
    service.loginProxyActive = true;
    service.loginProxyStartedAt = startedAt.toISOString();
    service.loginProxyExpiresAt = new Date(Date.now() + 60_000).toISOString();
    service.loginProxyLastHandledCookieMtimeMs = startedAt.getTime();
    service.loginProxyRemote = {};
    service.reconnect = async (value) => {
      reconnects += 1;
      reason = value;
      return { ok: false, status: service.getStatus() };
    };
    service.startLoginProxyReconnectTimer = () => {
      timerStarts += 1;
    };

    await writeFile(service.config.cookieFile, JSON.stringify({
      localCookie: 'session-id=new',
      csrf: 'csrf-token-new',
      amazonPage: 'amazon.de',
      dataVersion: 2
    }), 'utf8');

    await service.checkLoginProxyReconnect();
    await service.checkLoginProxyReconnect();

    assert.equal(reconnects, 1);
    assert.equal(reason, 'login-proxy-cookie-updated');
    assert.equal(timerStarts, 2);
  });

  it('keeps a ready remote active when login proxy reconnect candidate fails', async () => {
    const service = await createReconnectService(SuccessRemote);
    const oldRemote = new TrackableRemote();
    const startedAt = new Date(Date.now() - 10_000);
    service.ready = true;
    service.remote = oldRemote;
    service.loginProxyActive = true;
    service.loginProxyStartedAt = startedAt.toISOString();
    service.loginProxyExpiresAt = new Date(Date.now() + 60_000).toISOString();
    service.loginProxyLastHandledCookieMtimeMs = startedAt.getTime();
    service.loginProxyRemote = {};
    service.reconnect = async () => ({ ok: false, ready: service.ready, status: service.getStatus() });
    service.startLoginProxyReconnectTimer = () => {};

    await writeFile(service.config.cookieFile, JSON.stringify({
      localCookie: 'session-id=new',
      csrf: 'csrf-token-new',
      amazonPage: 'amazon.de',
      dataVersion: 2
    }), 'utf8');

    await service.checkLoginProxyReconnect();

    assert.equal(service.ready, true);
    assert.equal(service.remote, oldRemote);
    assert.equal(oldRemote.stopped, false);
  });
});

async function createReconnectService(AlexaRemoteClass) {
  const dir = await mkdtemp(join(tmpdir(), 'loxevo-tts-'));
  const cookieFile = join(dir, 'Node.txt');
  await writeFile(cookieFile, JSON.stringify({
    localCookie: 'session-id=abc',
    csrf: 'csrf-token',
    amazonPage: 'amazon.de',
    dataVersion: 2
  }), 'utf8');

  const service = new TtsService({
    tts: {
      enabled: true,
      cookieFile,
      authRefreshIntervalHours: 24,
      loginProxyReconnectIntervalSeconds: 5,
      loginProxyReconnectTimeoutMinutes: 15
    }
  });
  service.AlexaRemote = AlexaRemoteClass;
  service.auth = parseAlexaCookieFile(await readFile(cookieFile, 'utf8'));
  return service;
}

class TrackableRemote {
  constructor() {
    this.stopped = false;
  }

  on() {}

  async stop() {
    this.stopped = true;
  }
}

class SuccessRemote extends TrackableRemote {
  init(_options, callback) {
    callback(null);
  }
}

class FailingRemote extends TrackableRemote {
  init(_options, callback) {
    callback(new Error('candidate failed'));
  }
}

class LoginRequiredRemote extends TrackableRemote {
  init(_options, callback) {
    callback(new Error('Please open http://127.0.0.1:12345/ in your browser'));
  }
}

class ProxyThenSuccessRemote extends TrackableRemote {
  init(_options, callback) {
    callback(new Error('Please open http://127.0.0.1:12345/ in your browser'));
    setTimeout(() => callback(null), 5);
  }
}

class ProxyThenFailRemote extends TrackableRemote {
  init(_options, callback) {
    callback(new Error('Please open http://127.0.0.1:12345/ in your browser'));
    setTimeout(() => callback(new Error('final failed')), 5);
  }
}

class CountingProxyRemote extends LoginRequiredRemote {
  static constructed = 0;

  constructor() {
    super();
    CountingProxyRemote.constructed += 1;
  }
}

class RefreshableRemote extends TrackableRemote {
  constructor() {
    super();
    this.refreshes = 0;
    this.cookieData = {
      localCookie: 'session-id=abc',
      csrf: 'csrf-token',
      tokenDate: Date.now()
    };
  }

  refreshAlexaCookies(callback) {
    this.refreshes += 1;
    callback(null, this.cookieData);
  }
}

async function waitFor(predicate, timeoutMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.equal(predicate(), true);
}
