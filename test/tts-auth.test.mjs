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
