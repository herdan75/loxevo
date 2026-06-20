import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeConfig } from '../src/config.js';
import { parseAlexaCookieFile } from '../src/tts.js';

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
