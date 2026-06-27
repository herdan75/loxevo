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

  it('commits the same proxy candidate when cookieData appears without a final callback', async () => {
    const service = await createReconnectService(ProxyNoFinalRemote);
    let timerStarts = 0;
    service.startLoginProxyReconnectTimer = () => {
      timerStarts += 1;
    };

    const result = await service.reconnect('test-proxy-cookie-complete');
    const candidateRemote = service.loginProxySession.remote;
    timerStarts = 0;
    candidateRemote.cookieData = {
      localCookie: 'session-id=new',
      csrf: 'csrf-token-new',
      amazonPage: 'amazon.de',
      tokenDate: Date.now() + 1000,
      dataVersion: 2
    };

    assert.equal(result.waitProxy, true);
    assert.equal(service.ready, false);

    await service.checkLoginProxyReconnect();

    assert.equal(service.ready, true);
    assert.equal(service.remote, candidateRemote);
    assert.equal(service.loginProxyActive, false);
    assert.equal(timerStarts, 1);
    const stored = JSON.parse(await readFile(service.config.cookieFile, 'utf8'));
    assert.equal(stored.localCookie, 'session-id=new');
  });

  it('keeps the auth refresh timer active when WAIT_PROXY starts from an existing ready remote', async () => {
    const service = await createReconnectService(SuccessRemote);
    const oldRemote = new TrackableRemote();
    const candidateRemote = new TrackableRemote();
    let stops = 0;
    service.ready = true;
    service.remote = oldRemote;
    service.stopAuthRefreshTimer = () => {
      stops += 1;
    };
    service.startLoginProxyReconnectTimer = () => {};

    service.beginLoginProxySession({
      remote: candidateRemote,
      auth: service.auth,
      proxyResult: {
        error: new Error('Please open http://127.0.0.1:12345/ in your browser'),
        loginUrl: 'http://127.0.0.1:12345/'
      },
      previousReady: true,
      previousRemote: oldRemote,
      sequence: 1
    });

    assert.equal(stops, 0);
    assert.equal(service.ready, true);
    assert.equal(service.remote, oldRemote);
    assert.equal(service.loginProxySession.remote, candidateRemote);
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

  it('refreshes the old ready remote during WAIT_PROXY without creating an error loop', async () => {
    const service = await createReconnectService(SuccessRemote);
    const oldRemote = new RefreshableRemote();
    const candidateRemote = new TrackableRemote();
    service.ready = true;
    service.remote = oldRemote;
    service.authState = 'READY';
    service.startLoginProxyReconnectTimer = () => {};
    let timerStarts = 0;
    service.startAuthRefreshTimer = () => {
      timerStarts += 1;
    };

    service.beginLoginProxySession({
      remote: candidateRemote,
      auth: service.auth,
      proxyResult: {
        error: new Error('Please open http://127.0.0.1:12345/ in your browser'),
        loginUrl: 'http://127.0.0.1:12345/'
      },
      previousReady: true,
      previousRemote: oldRemote,
      sequence: 1
    });

    await service.refreshAuthInternal('scheduled-refresh', new Error('auth check'));

    assert.equal(oldRemote.refreshes, 1);
    assert.equal(service.remote, oldRemote);
    assert.equal(service.ready, true);
    assert.equal(service.authState, 'WAIT_PROXY');
    assert.equal(service.loginProxyActive, true);
    assert.equal(timerStarts, 1);
  });

  it('uses stored cookieData refresh before building a candidate on scheduled refresh', async () => {
    let candidateConstructed = 0;
    class CandidateRemote extends SuccessRemote {
      constructor() {
        super();
        candidateConstructed += 1;
      }
    }

    const service = await createReconnectService(CandidateRemote);
    await writeCookie(service, {
      localCookie: 'session-id=old',
      loginCookie: 'login-cookie=old',
      refreshToken: 'refresh-token',
      deviceSerial: 'device-serial',
      csrf: 'csrf-old',
      amazonPage: 'amazon.de',
      dataVersion: 2
    });
    service.remote = new TrackableRemote();
    service.ready = true;
    service.authState = 'READY';
    let timerStarts = 0;
    service.startAuthRefreshTimer = () => {
      timerStarts += 1;
    };
    service.alexaCookieModule = {
      refreshAlexaCookie(options, callback) {
        assert.equal(options.formerRegistrationData.refreshToken, 'refresh-token');
        callback(null, {
          ...options.formerRegistrationData,
          localCookie: 'session-id=refreshed',
          loginCookie: 'login-cookie=refreshed',
          csrf: 'csrf-new',
          tokenDate: Date.now()
        });
      }
    };

    await service.refreshAuthInternal('scheduled-refresh', new Error('scheduled check'));

    assert.equal(candidateConstructed, 0);
    assert.equal(service.ready, true);
    assert.equal(service.authState, 'READY');
    assert.equal(service.auth.originalData.localCookie, 'session-id=refreshed');
    assert.equal(service.remote.cookieData.localCookie, 'session-id=refreshed');
    assert.equal(timerStarts, 1);
  });

  it('falls back to Alexa SPA cookie refresh when token refresh is unavailable', async () => {
    const service = await createReconnectService(SuccessRemote);
    await writeCookie(service, {
      localCookie: 'session-id=old; csrf=csrf-old',
      csrf: 'csrf-old',
      amazonPage: 'amazon.de',
      dataVersion: 2
    });
    service.remote = new TrackableRemote();
    service.ready = true;
    service.authState = 'READY';
    service.startAuthRefreshTimer = () => {};
    service.fetch = async (url, options) => {
      assert.equal(url, 'https://alexa.amazon.de/spa/index.html');
      assert.equal(options.headers.Cookie, 'session-id=old; csrf=csrf-old');
      return {
        ok: true,
        status: 200,
        headers: {
          getSetCookie: () => [
            'session-id=spa; Path=/; Secure',
            'csrf=csrf-spa; Path=/; Secure'
          ]
        }
      };
    };

    const refreshed = await service.refreshExistingRemoteAuth('test-spa-refresh', new Error('401'));

    assert.equal(refreshed, true);
    assert.equal(service.auth.originalData.localCookie, 'session-id=spa; csrf=csrf-spa');
    assert.equal(service.auth.originalData.csrf, 'csrf-spa');
  });

  it('keeps the ready remote when stored refresh fails and candidate requires login', async () => {
    const service = await createReconnectService(LoginRequiredRemote);
    await writeCookie(service, {
      localCookie: 'session-id=old',
      loginCookie: 'login-cookie=old',
      refreshToken: 'refresh-token',
      csrf: 'csrf-old',
      amazonPage: 'amazon.de',
      dataVersion: 2
    });
    const oldRemote = new TrackableRemote();
    service.remote = oldRemote;
    service.ready = true;
    service.authState = 'READY';
    service.startLoginProxyReconnectTimer = () => {};
    service.startAuthRefreshTimer = () => {};
    service.alexaCookieModule = {
      refreshAlexaCookie(_options, callback) {
        callback(new Error('refresh token expired'));
      }
    };
    service.fetch = async () => ({
      ok: false,
      status: 403,
      headers: {
        getSetCookie: () => []
      }
    });

    await assert.rejects(
      () => service.refreshAuthInternal('scheduled-refresh', new Error('scheduled check')),
      /Amazon-Login|erforderlich/
    );

    assert.equal(service.ready, true);
    assert.equal(service.remote, oldRemote);
    assert.equal(service.authState, 'WAIT_PROXY');
    assert.equal(service.loginProxyActive, true);
    assert.equal(oldRemote.stopped, false);
  });

  it('retries a TTS action after refreshing stored cookieData', async () => {
    const service = await createReconnectService(SuccessRemote);
    await writeCookie(service, {
      localCookie: 'session-id=old',
      loginCookie: 'login-cookie=old',
      refreshToken: 'refresh-token',
      csrf: 'csrf-old',
      amazonPage: 'amazon.de',
      dataVersion: 2
    });
    service.remote = new TrackableRemote();
    service.ready = true;
    service.authState = 'READY';
    service.alexaCookieModule = {
      refreshAlexaCookie(options, callback) {
        callback(null, {
          ...options.formerRegistrationData,
          localCookie: 'session-id=retry',
          csrf: 'csrf-retry',
          tokenDate: Date.now()
        });
      }
    };
    let attempts = 0;

    const result = await service.withAuthRetry('tts-speak', async () => {
      attempts += 1;
      if (attempts === 1) {
        const error = new Error('unauthorized');
        error.statusCode = 401;
        throw error;
      }
      return 'spoken';
    });

    assert.equal(result, 'spoken');
    assert.equal(attempts, 2);
    assert.equal(service.auth.originalData.localCookie, 'session-id=retry');
  });

  it('does not include refreshed cookie secrets in auth events', async () => {
    const events = [];
    const service = await createReconnectService(SuccessRemote);
    await writeCookie(service, {
      localCookie: 'secret-cookie-old',
      loginCookie: 'secret-login-old',
      refreshToken: 'secret-refresh-token',
      csrf: 'secret-csrf-old',
      amazonPage: 'amazon.de',
      dataVersion: 2
    });
    service.handlers = { addEvent: (event) => events.push(event) };
    service.remote = new TrackableRemote();
    service.ready = true;
    service.authState = 'READY';
    service.alexaCookieModule = {
      refreshAlexaCookie(options, callback) {
        callback(null, {
          ...options.formerRegistrationData,
          localCookie: 'secret-cookie-new',
          loginCookie: 'secret-login-new',
          refreshToken: 'secret-refresh-token',
          csrf: 'secret-csrf-new',
          tokenDate: Date.now()
        });
      }
    };

    await service.refreshExistingRemoteAuth('test-no-secret-events');

    const eventText = JSON.stringify(events);
    assert.equal(eventText.includes('secret-cookie'), false);
    assert.equal(eventText.includes('secret-login'), false);
    assert.equal(eventText.includes('secret-refresh-token'), false);
    assert.equal(eventText.includes('secret-csrf'), false);
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

  it('keeps WAIT_PROXY timer checks quiet when no new cookie data exists', async () => {
    const service = await createReconnectService(SuccessRemote);
    const events = [];
    const oldRemote = new TrackableRemote();
    const candidateRemote = new TrackableRemote();
    let timerStarts = 0;
    service.handlers = { addEvent: (event) => events.push(event) };
    service.ready = true;
    service.remote = oldRemote;
    service.startLoginProxyReconnectTimer = () => {
      timerStarts += 1;
    };
    service.beginLoginProxySession({
      remote: candidateRemote,
      auth: service.auth,
      proxyResult: {
        error: new Error('Please open http://127.0.0.1:12345/ in your browser'),
        loginUrl: 'http://127.0.0.1:12345/'
      },
      previousReady: true,
      previousRemote: oldRemote,
      sequence: 1
    });
    events.length = 0;

    await service.checkLoginProxyReconnect();
    await service.checkLoginProxyReconnect();

    assert.equal(timerStarts, 3);
    assert.deepEqual(events.map((event) => event.status), []);
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

async function writeCookie(service, data) {
  await writeFile(service.config.cookieFile, JSON.stringify(data), 'utf8');
  service.auth = parseAlexaCookieFile(await readFile(service.config.cookieFile, 'utf8'));
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

class ProxyNoFinalRemote extends TrackableRemote {
  init(_options, callback) {
    callback(new Error('Please open http://127.0.0.1:12345/ in your browser'));
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
