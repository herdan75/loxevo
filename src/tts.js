import { readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { networkInterfaces } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { enforcePrivateFileMode, PRIVATE_FILE_MODE } from './file-security.js';

const appRequire = createRequire(import.meta.url);
const COMMAND_TIMEOUT_MS = 5000;
const NATIVE_SEQUENCE_TIMEOUT_MS = 8000;
const NATIVE_FIRE_AND_FORGET_MS = 100;
const MEDIA_VOLUME_TIMEOUT_MS = 1200;
const DEFAULT_AUTH_REFRESH_HOURS = 24;
const DEFAULT_LOGIN_RECONNECT_INTERVAL_SECONDS = 10;
const DEFAULT_LOGIN_RECONNECT_TIMEOUT_MINUTES = 15;
const COOKIE_REFRESH_TIMEOUT_MS = 15_000;
const AUTH_STATE = Object.freeze({
  DISABLED: 'DISABLED',
  NOT_READY: 'NOT_READY',
  READY: 'READY',
  REFRESHING: 'REFRESHING',
  WAIT_PROXY: 'WAIT_PROXY',
  ERROR: 'ERROR'
});

export class TtsService {
  constructor(config, handlers = {}) {
    this.rootConfig = config || {};
    this.config = this.rootConfig.tts || {};
    this.handlers = handlers || {};
    this.AlexaRemote = null;
    this.remote = null;
    this.ready = false;
    this.authState = this.config.enabled === false ? AUTH_STATE.DISABLED : AUTH_STATE.NOT_READY;
    this.lastError = null;
    this.auth = null;
    this.lastCookiePersistAt = null;
    this.lastAuthRefreshAt = null;
    this.lastAuthError = null;
    this.loginProxyActive = false;
    this.loginUrl = null;
    this.loginProxyRemote = null;
    this.loginProxyStartedAt = null;
    this.loginProxyExpiresAt = null;
    this.loginProxyReconnectTimer = null;
    this.loginProxyReconnectRunning = false;
    this.loginProxyReconnectAttempts = 0;
    this.loginProxyLastHandledCookieMtimeMs = null;
    this.loginProxyReconnectBackoffUntil = null;
    this.loginProxyRemoteCookieFingerprint = null;
    this.loginProxySession = null;
    this.initSequence = 0;
    this.authRefreshTimer = null;
    this.authRefreshPromise = null;
  }

  async init() {
    if (!this.config.enabled) {
      this.authState = AUTH_STATE.DISABLED;
      console.log('TTS ist deaktiviert. Setze tts.enabled=true, wenn Alexa sprechen soll.');
      return;
    }

    let AlexaRemote;
    try {
      AlexaRemote = loadAlexaRemote2();
      this.AlexaRemote = AlexaRemote;
    } catch (error) {
      this.markUnavailable(
        'alexa-remote2 ist nicht installiert. Bitte in der Web-UI unter Wartung installieren.',
        error
      );
      return;
    }

    let auth;
    try {
      auth = parseAlexaCookieFile(await readFile(this.config.cookieFile, 'utf8'));
      this.emitAuthEvent('cookie-read', 'Alexa-Cookie-Datei wurde gelesen.');
    } catch (error) {
      this.markUnavailable(`Alexa-Cookie konnte nicht gelesen werden: ${this.config.cookieFile}`, error);
      return;
    }

    this.remote = new AlexaRemote();
    this.auth = auth;
    this.attachCookiePersistence(this.remote, auth);

    await this.initAlexaRemote(this.remote, auth, { commit: true });
  }

  async initAlexaRemote(remote = this.remote, auth = this.auth, options = {}) {
    const sequence = options.sequence || ++this.initSequence;
    const previousReady = Boolean(this.ready && this.remote && this.remote !== remote);
    const previousRemote = previousReady ? this.remote : null;
    const result = await this.initializeRemoteCandidate(remote, auth, {
      sequence,
      onProxyPrompt: (proxyResult) => this.beginLoginProxySession({
        remote,
        auth,
        proxyResult,
        previousReady,
        previousRemote,
        sequence
      }),
      onFinal: (finalResult) => this.handleLoginProxyFinal(sequence, finalResult)
    });
    if (!options.commit) return result;

    if (!result.ok) {
      if (result.waitProxy) {
        return false;
      }
      if (result.loginRequired) {
        this.markWaitingForLogin(result.error, { remote, auth, previousReady, previousRemote, sequence });
      } else {
        this.markUnavailable('Alexa-Verbindung konnte nicht initialisiert werden.', result.error);
      }
      return false;
    }

    await this.commitRemoteCandidate(remote, auth);
    return true;
  }

  async initializeRemoteCandidate(remote, auth, options = {}) {
    return await new Promise((resolve) => {
      let initialResolved = false;
      let proxyPromptSeen = false;
      let finalHandled = false;
      const finishInitial = (result) => {
        if (initialResolved) return;
        initialResolved = true;
        resolve(result);
      };
      const finishFinal = (result) => {
        if (finalHandled) return;
        finalHandled = true;
        if (proxyPromptSeen && typeof options.onFinal === 'function') {
          Promise.resolve(options.onFinal(result)).catch((error) => {
            this.lastAuthError = summarizeAuthError(error);
          });
          return;
        }
        finishInitial(result);
      };

      remote.init(this.buildInitOptions(auth), (error) => {
        if (error) {
          if (isProxyLoginPrompt(error)) {
            proxyPromptSeen = true;
            const proxyResult = {
              ok: false,
              waitProxy: true,
              loginRequired: true,
              loginUrl: extractLoginUrl(error),
              error
            };
            if (typeof options.onProxyPrompt === 'function') {
              options.onProxyPrompt(proxyResult);
            }
            finishInitial(proxyResult);
            return;
          }

          finishFinal({ ok: false, loginRequired: false, error });
          return;
        }

        finishFinal({ ok: true });
      });
    });
  }

  async commitRemoteCandidate(remote, auth) {
    const previousRemote = this.remote;
    const previousLoginProxyRemote = this.loginProxyRemote;
    const shouldDisposePrevious = previousRemote && previousRemote !== remote;

    this.remote = remote;
    this.auth = auth;
    this.ready = true;
    this.authState = AUTH_STATE.READY;
    this.lastError = null;
    this.clearLoginProxyState();
    this.stopLoginProxyReconnectTimer();
    this.startAuthRefreshTimer();

    if (shouldDisposePrevious) {
      await this.disposeRemote(previousRemote);
    }
    if (previousLoginProxyRemote && previousLoginProxyRemote !== remote && previousLoginProxyRemote !== previousRemote) {
      await this.disposeRemote(previousLoginProxyRemote);
    }

    const sequenceMode = this.hasNativeSequenceSupport() ? 'native Sequenzen' : 'sendSequenceCommand-Fallback';
    console.log(`TTS ist mit alexa-remote2 verbunden (${sequenceMode}).`);
    this.emitAuthEvent('ready', 'Alexa TTS ist bereit.');
    this.persistCookie(undefined, undefined, undefined, remote, auth).catch((persistError) => {
      console.warn(`Alexa-Cookie konnte nicht gespeichert werden: ${persistError.message}`);
    });
  }

  buildInitOptions(auth) {
    const storedCookieData = auth?.cookieData || auth?.remoteCookie;
    // LoxEvo nutzt bewusst einen eigenen Auth-Refresh-Timer statt eine
    // alexa-remote2-spezifische Refresh-Option zu erzwingen. So bleibt das
    // Verhalten über verschiedene alexa-remote2-Versionen nachvollziehbar.
    // Eine PushConnection ist für reine TTS-Ausgabe nicht nötig und bleibt
    // deshalb standardmässig aus.
    const options = {
      cookie: storedCookieData || auth?.cookie,
      csrf: auth?.csrf,
      cookieJustCreated: !storedCookieData,
      amazonPage: this.config.amazonPage || auth?.amazonPage || storedCookieData?.amazonPage || 'amazon.de',
      alexaServiceHost: this.config.alexaServiceHost || 'layla.amazon.de',
      acceptLanguage: this.config.acceptLanguage || defaultAcceptLanguage(this.config.amazonPage || auth?.amazonPage || storedCookieData?.amazonPage),
      proxyOwnIp: this.getProxyOwnIp(),
      usePushConnection: this.config.usePushConnection === true
    };

    const proxyPort = Number(this.config.proxyPort || 0);
    if (proxyPort > 0) {
      options.proxyPort = proxyPort;
    }

    if (auth?.formerRegistrationData) {
      options.formerRegistrationData = auth.formerRegistrationData;
    }
    if (auth?.macDms) {
      options.macDms = auth.macDms;
    }
    if (auth?.deviceAppName) {
      options.deviceAppName = auth.deviceAppName;
    }

    return options;
  }

  attachCookiePersistence(remote = this.remote, auth = this.auth) {
    if (remote === this.remote) {
      this.auth = auth;
    }
    if (!remote || typeof remote.on !== 'function') return;

    remote.on('cookie', (cookie, csrf, macDms) => {
      this.persistCookie(cookie, csrf, macDms, remote, auth).catch((error) => {
        console.warn(`Alexa-Cookie konnte nicht gespeichert werden: ${error.message}`);
      });
    });
  }

  async persistCookie(cookie, csrf, macDms, sourceRemote = this.remote, sourceAuth = this.auth) {
    if (!this.config.cookieFile) return false;

    const cookieData = isPlainObject(sourceRemote?.cookieData) ? sourceRemote.cookieData : {};
    const sourceData = isPlainObject(sourceAuth?.originalData) ? sourceAuth.originalData : {};
    const hasRemoteCookieData = Object.keys(cookieData).length > 0;
    const hasCookieEventData = Boolean(
      firstNonEmptyString(cookie, csrf) ||
      firstNonEmptyObject(macDms)
    );

    if (!hasRemoteCookieData && !hasCookieEventData) return false;

    const localCookie = firstNonEmptyString(
      cookieData.localCookie,
      cookie,
      sourceData.localCookie,
      sourceData.cookie,
      sourceData.loginCookie
    );

    if (!localCookie) return false;

    const nextCsrf = firstNonEmptyString(cookieData.csrf, csrf, sourceData.csrf);
    const previousCookie = firstNonEmptyString(sourceData.localCookie, sourceData.cookie, sourceData.loginCookie);
    const cookieChanged = Boolean(previousCookie && localCookie !== previousCookie);
    const nextTokenDate = cookieData.tokenDate || sourceData.tokenDate || (hasCookieEventData || cookieChanged ? Date.now() : undefined);
    const nextData = {
      ...sourceData,
      ...cookieData,
      localCookie,
      csrf: nextCsrf,
      dataVersion: cookieData.dataVersion || sourceData.dataVersion || 2
    };
    if (nextTokenDate) {
      nextData.tokenDate = nextTokenDate;
    }

    const macDmsValue = firstNonEmptyObject(cookieData.macDms, macDms, sourceData.macDms);
    if (macDmsValue) {
      nextData.macDms = macDmsValue;
    } else {
      delete nextData.macDms;
    }

    if (isSameJsonData(sourceData, nextData)) return false;

    await writeFile(this.config.cookieFile, `${JSON.stringify(nextData, null, 2)}\n`, { encoding: 'utf8', mode: PRIVATE_FILE_MODE });
    await enforcePrivateFileMode(this.config.cookieFile, 'Alexa-Cookie-Datei');
    if (sourceRemote === this.remote || sourceAuth === this.auth) {
      this.auth = parseAlexaCookieFile(JSON.stringify(nextData));
    }
    this.lastCookiePersistAt = new Date().toISOString();
    this.emitAuthEvent('cookie-updated', 'Alexa-Cookie wurde aktualisiert.');
    console.log(`Alexa-Cookie wurde aktualisiert: ${this.config.cookieFile}`);
    return true;
  }

  getStoredCookieData(sourceAuth = this.auth, sourceRemote = this.remote) {
    const sourceData = isPlainObject(sourceAuth?.originalData) ? sourceAuth.originalData : {};
    const authCookieData = isPlainObject(sourceAuth?.cookieData) ? sourceAuth.cookieData : {};
    const remoteCookieData = isPlainObject(sourceRemote?.cookieData) ? sourceRemote.cookieData : {};
    const data = {
      ...sourceData,
      ...authCookieData,
      ...remoteCookieData
    };
    const localCookie = firstNonEmptyString(data.localCookie, data.cookie, data.loginCookie, sourceAuth?.cookie);
    if (localCookie) {
      data.localCookie = localCookie;
    }
    const csrf = firstNonEmptyString(data.csrf, sourceAuth?.csrf);
    if (csrf) {
      data.csrf = csrf;
    }
    const macDmsValue = firstNonEmptyObject(data.macDms, sourceAuth?.macDms);
    if (macDmsValue) {
      data.macDms = macDmsValue;
    }
    data.amazonPage = firstNonEmptyString(data.amazonPage, sourceAuth?.amazonPage, this.config.amazonPage, 'amazon.de');
    data.deviceAppName = firstNonEmptyString(data.deviceAppName, sourceAuth?.deviceAppName, this.config.deviceAppName);
    data.dataVersion = data.dataVersion || 2;
    return data;
  }

  buildCookieRefreshOptions(cookieData) {
    const formerRegistrationData = {
      ...cookieData,
      localCookie: firstNonEmptyString(cookieData.localCookie, cookieData.cookie, cookieData.loginCookie),
      loginCookie: firstNonEmptyString(cookieData.loginCookie, cookieData.localCookie, cookieData.cookie)
    };
    return {
      amazonPage: firstNonEmptyString(this.config.amazonPage, cookieData.amazonPage, 'amazon.de'),
      baseAmazonPage: firstNonEmptyString(this.config.baseAmazonPage, cookieData.baseAmazonPage, 'amazon.com'),
      acceptLanguage: this.config.acceptLanguage || defaultAcceptLanguage(cookieData.amazonPage || this.config.amazonPage),
      deviceAppName: firstNonEmptyString(cookieData.deviceAppName, this.config.deviceAppName),
      logger: null,
      formerRegistrationData
    };
  }

  async refreshStoredAlexaCookieData(reason = 'auth-error') {
    const cookieData = this.getStoredCookieData();
    const refreshToken = firstNonEmptyString(cookieData.refreshToken);
    const localCookie = firstNonEmptyString(cookieData.localCookie, cookieData.cookie, cookieData.loginCookie);
    if (!refreshToken && !localCookie) {
      return false;
    }

    let tokenRefreshError = null;
    if (refreshToken && firstNonEmptyString(cookieData.loginCookie, cookieData.localCookie, cookieData.cookie)) {
      try {
        const refreshed = await this.refreshStoredCookieViaToken(cookieData);
        if (refreshed) {
          await this.applyRefreshedCookieData(refreshed);
          this.emitAuthEvent('token-refresh-ok', 'Alexa-Cookie wurde per Refresh-Token erneuert.');
          return true;
        }
      } catch (error) {
        tokenRefreshError = error;
      }
    }

    try {
      const refreshed = await this.refreshStoredCookieViaSpa(cookieData);
      if (refreshed) {
        await this.applyRefreshedCookieData(refreshed);
        this.emitAuthEvent('spa-cookie-refresh-ok', 'Alexa-Cookie wurde über Alexa-Websession erneuert.');
        return true;
      }
    } catch (error) {
      this.lastAuthError = summarizeAuthError(error);
      return false;
    }

    if (tokenRefreshError) {
      this.lastAuthError = summarizeAuthError(tokenRefreshError);
    }
    return false;
  }

  async refreshStoredCookieViaToken(cookieData) {
    const alexaCookie = this.alexaCookieModule || this.remote?.alexaCookie || loadAlexaCookie2();
    if (!alexaCookie || typeof alexaCookie.refreshAlexaCookie !== 'function') {
      return null;
    }

    const options = this.buildCookieRefreshOptions(cookieData);
    const result = await withTimeout(
      callAlexaCookieRefresh(alexaCookie, options),
      COOKIE_REFRESH_TIMEOUT_MS,
      'Alexa-Cookie-Token-Refresh Timeout.'
    );
    if (!isPlainObject(result)) return null;
    return normalizeRefreshedCookieData(cookieData, result);
  }

  async refreshStoredCookieViaSpa(cookieData) {
    const localCookie = firstNonEmptyString(cookieData.localCookie, cookieData.cookie, cookieData.loginCookie);
    if (!localCookie) return null;
    const fetchFn = this.fetch || globalThis.fetch;
    if (typeof fetchFn !== 'function') return null;

    const amazonPage = firstNonEmptyString(cookieData.amazonPage, this.config.amazonPage, 'amazon.de');
    const response = await withTimeout(
      fetchFn(`https://alexa.${amazonPage}/spa/index.html`, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          Cookie: localCookie,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': this.config.acceptLanguage || defaultAcceptLanguage(amazonPage),
          'User-Agent': this.config.userAgent || 'Mozilla/5.0'
        }
      }),
      COOKIE_REFRESH_TIMEOUT_MS,
      'Alexa-SPA-Cookie-Refresh Timeout.'
    );
    const status = Number(response?.status || 0);
    const allowedRedirect = [301, 302, 303, 307, 308].includes(status);
    if (status >= 400 || (!response?.ok && !allowedRedirect)) {
      throw new Error(`Alexa-SPA-Cookie-Refresh fehlgeschlagen (${status || 'unbekannt'}).`);
    }

    const setCookies = getSetCookieHeaders(response?.headers);
    const mergedCookie = mergeCookieHeader(localCookie, setCookies);
    const csrf = firstNonEmptyString(extractCookieValue(mergedCookie, 'csrf'), cookieData.csrf);
    const changed = Boolean(setCookies.length && mergedCookie !== localCookie) || csrf !== cookieData.csrf;
    if (!changed) return null;

    return normalizeRefreshedCookieData(cookieData, {
      localCookie: mergedCookie,
      csrf,
      tokenDate: Date.now()
    });
  }

  async applyRefreshedCookieData(refreshedData) {
    const data = normalizeRefreshedCookieData(this.getStoredCookieData(), refreshedData);
    const persisted = await this.persistCookie(data.localCookie, data.csrf, data.macDms, { cookieData: data }, this.auth);
    if (!persisted && this.auth) {
      this.auth = parseAlexaCookieFile(JSON.stringify(data));
    }
    await this.applyCookieDataToRemote(data);
    this.lastAuthRefreshAt = new Date().toISOString();
    this.lastAuthError = null;
    if (this.ready) {
      this.authState = AUTH_STATE.READY;
      this.lastError = null;
    }
    return true;
  }

  async applyCookieDataToRemote(cookieData) {
    if (!this.remote || !isPlainObject(cookieData)) return;
    this.remote.cookieData = {
      ...(isPlainObject(this.remote.cookieData) ? this.remote.cookieData : {}),
      ...cookieData
    };
    if (cookieData.localCookie) {
      this.remote.cookie = cookieData.localCookie;
    }
    if (cookieData.csrf) {
      this.remote.csrf = cookieData.csrf;
    }
    if (isPlainObject(cookieData.macDms)) {
      this.remote.macDms = cookieData.macDms;
    }
    if (typeof this.remote.setCookie === 'function' && cookieData.localCookie) {
      try {
        const result = this.remote.setCookie(cookieData.localCookie);
        if (result && typeof result.then === 'function') {
          await result;
        }
      } catch (error) {
        this.lastAuthError = summarizeAuthError(error);
      }
    }
  }

  getProxyOwnIp() {
    return String(
      this.config.proxyOwnIp ||
      this.rootConfig.alexaBridge?.advertiseIp ||
      firstLanAddress()
    ).trim();
  }

  markUnavailable(message, error) {
    this.ready = false;
    this.authState = AUTH_STATE.ERROR;
    this.remote = null;
    this.stopAuthRefreshTimer();
    this.stopLoginProxyReconnectTimer();
    this.clearLoginProxyState();
    this.lastError = error?.message ? `${message} (${error.message})` : message;
    console.warn(`TTS nicht bereit: ${this.lastError}`);
  }

  markWaitingForLogin(error, options = {}) {
    this.beginLoginProxySession({
      remote: options.remote || this.remote,
      auth: options.auth || this.auth,
      proxyResult: {
        error,
        loginUrl: extractLoginUrl(error)
      },
      previousReady: options.previousReady === true,
      previousRemote: options.previousRemote || null,
      sequence: options.sequence || this.initSequence
    });
  }

  beginLoginProxySession({ remote, auth, proxyResult, previousReady = false, previousRemote = null, sequence = this.initSequence }) {
    if (this.loginProxySession && this.loginProxyActive) {
      this.emitAuthEvent('wait-proxy-still-active', 'Amazon-Login wartet bereits auf Abschluss.');
      return this.loginProxySession;
    }

    const startedAt = new Date();
    const timeoutMinutes = numberInRange(
      this.config.loginProxyReconnectTimeoutMinutes,
      DEFAULT_LOGIN_RECONNECT_TIMEOUT_MINUTES,
      1,
      60
    );
    const loginUrl = proxyResult?.loginUrl || extractLoginUrl(proxyResult?.error);
    if (!(previousReady && previousRemote)) {
      this.stopAuthRefreshTimer();
    }
    this.authState = AUTH_STATE.WAIT_PROXY;
    this.ready = previousReady && Boolean(previousRemote);
    if (this.ready) {
      this.remote = previousRemote;
    } else if (remote) {
      this.remote = remote;
    }
    this.auth = auth || this.auth;
    this.loginProxyActive = true;
    this.loginUrl = loginUrl;
    this.loginProxyRemote = remote;
    this.loginProxyStartedAt = startedAt.toISOString();
    this.loginProxyExpiresAt = new Date(startedAt.getTime() + timeoutMinutes * 60_000).toISOString();
    this.resetLoginProxyReconnectState(startedAt);
    this.loginProxySession = {
      remote,
      auth,
      loginUrl,
      startedAt: this.loginProxyStartedAt,
      expiresAt: this.loginProxyExpiresAt,
      previousReady: this.ready,
      previousRemote: this.ready ? previousRemote : null,
      sequence
    };
    const message = proxyResult?.error?.message || String(proxyResult?.error || 'Amazon-Login erforderlich.');
    if (this.ready) {
      this.lastAuthError = `Neue Amazon-Anmeldung empfohlen. ${message}`;
      this.lastError = null;
      this.emitAuthEvent('wait-proxy-started', 'Amazon-Neuanmeldung empfohlen; bestehende TTS-Verbindung bleibt aktiv.');
    } else {
      this.lastError = `Amazon-Login erforderlich. ${message}`;
      this.emitAuthEvent('login-required', 'Amazon-Login ist erforderlich.');
    }
    this.startLoginProxyReconnectTimer();
    console.warn(`TTS wartet auf Amazon-Login: ${message}`);
    return this.loginProxySession;
  }

  clearLoginProxyState() {
    this.loginProxyActive = false;
    this.loginUrl = null;
    this.loginProxyRemote = null;
    this.loginProxyStartedAt = null;
    this.loginProxyExpiresAt = null;
    this.loginProxyReconnectAttempts = 0;
    this.loginProxyLastHandledCookieMtimeMs = null;
    this.loginProxyReconnectBackoffUntil = null;
    this.loginProxyRemoteCookieFingerprint = null;
    this.loginProxySession = null;
  }

  resetLoginProxyReconnectState(startedAt = new Date()) {
    const startedMs = startedAt instanceof Date ? startedAt.getTime() : Date.parse(startedAt);
    this.loginProxyReconnectAttempts = 0;
    this.loginProxyLastHandledCookieMtimeMs = Number.isFinite(startedMs) ? startedMs : null;
    this.loginProxyReconnectBackoffUntil = null;
    this.loginProxyRemoteCookieFingerprint = cookieDataFingerprint(this.auth?.originalData);
  }

  startAuthRefreshTimer() {
    this.stopAuthRefreshTimer();
    if (!this.config.enabled || !this.ready) return;
    const intervalMs = numberInRange(
      this.config.authRefreshIntervalHours,
      DEFAULT_AUTH_REFRESH_HOURS,
      1,
      168
    ) * 60 * 60 * 1000;
    this.authRefreshTimer = setTimeout(() => {
      this.authRefreshTimer = null;
      this.refreshAuth('scheduled-refresh').catch((error) => {
        this.lastAuthError = summarizeAuthError(error);
        this.emitAuthEvent('refresh-failed', 'Geplanter Alexa-Auth-Refresh ist fehlgeschlagen.');
      });
    }, intervalMs);
    this.authRefreshTimer.unref?.();
  }

  stopAuthRefreshTimer() {
    if (this.authRefreshTimer) {
      clearTimeout(this.authRefreshTimer);
      this.authRefreshTimer = null;
    }
  }

  startLoginProxyReconnectTimer() {
    this.stopLoginProxyReconnectTimer();
    if (!this.loginProxyActive || this.config.loginProxyAutoReconnect === false || !this.config.cookieFile) return;
    const intervalMs = numberInRange(
      this.config.loginProxyReconnectIntervalSeconds,
      DEFAULT_LOGIN_RECONNECT_INTERVAL_SECONDS,
      5,
      120
    ) * 1000;
    this.loginProxyReconnectTimer = setTimeout(() => {
      this.loginProxyReconnectTimer = null;
      this.checkLoginProxyReconnect().catch((error) => {
        this.lastAuthError = summarizeAuthError(error);
      });
    }, intervalMs);
    this.loginProxyReconnectTimer.unref?.();
  }

  stopLoginProxyReconnectTimer() {
    if (this.loginProxyReconnectTimer) {
      clearTimeout(this.loginProxyReconnectTimer);
      this.loginProxyReconnectTimer = null;
    }
  }

  async checkLoginProxyReconnect() {
    if (!this.loginProxyActive) {
      return;
    }
    if (this.loginProxySession) {
      const expiresAt = Date.parse(this.loginProxyExpiresAt || '');
      if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
        await this.expireLoginProxySession();
        return;
      }
      await this.tryCompleteLoginProxySessionFromCookie();
      this.startLoginProxyReconnectTimer();
      return;
    }
    if (this.loginProxyReconnectRunning) {
      this.startLoginProxyReconnectTimer();
      return;
    }

    const expiresAt = Date.parse(this.loginProxyExpiresAt || '');
    if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
      this.lastAuthError = 'Automatischer TTS-Reconnect nach Amazon-Login ist abgelaufen.';
      this.emitAuthEvent('refresh-failed', 'Automatischer TTS-Reconnect ist abgelaufen.');
      return;
    }

    if (this.loginProxyReconnectBackoffUntil && Date.now() < this.loginProxyReconnectBackoffUntil) {
      this.startLoginProxyReconnectTimer();
      return;
    }

    const remoteWithLoginProxy = this.loginProxyRemote || this.remote;
    const remoteCookieData = isPlainObject(remoteWithLoginProxy?.cookieData) ? remoteWithLoginProxy.cookieData : null;
    const hasNewRemoteCookieData = this.hasNewLoginProxyCookieData(remoteCookieData);
    const cookieFileChanged = await this.cookieFileChangedAfterLoginStart();
    if (!hasNewRemoteCookieData && !cookieFileChanged) {
      this.startLoginProxyReconnectTimer();
      return;
    }

    this.loginProxyReconnectRunning = true;
    try {
      let reconnectReason = null;
      const cookiePersisted = hasNewRemoteCookieData
        ? await this.persistCookie(undefined, undefined, undefined, remoteWithLoginProxy, this.auth)
        : false;
      if (cookiePersisted) {
        this.loginProxyRemoteCookieFingerprint = cookieDataFingerprint(remoteCookieData);
        reconnectReason = 'login-proxy-cookie-data';
        this.loginProxyLastHandledCookieMtimeMs = await this.getCookieFileMtimeMs() || Date.now();
      } else if (cookieFileChanged) {
        this.loginProxyLastHandledCookieMtimeMs = await this.getCookieFileMtimeMs() || Date.now();
        reconnectReason = 'login-proxy-cookie-updated';
      }

      if (!reconnectReason) {
        this.startLoginProxyReconnectTimer();
        return;
      }
      this.loginProxyReconnectAttempts += 1;
      const result = await this.reconnect(reconnectReason);
      if (result.ok) return;
      this.deferNextLoginProxyReconnect();
    } finally {
      this.loginProxyReconnectRunning = false;
    }

    if (this.loginProxyActive) {
      this.startLoginProxyReconnectTimer();
    }
  }

  async tryCompleteLoginProxySessionFromCookie() {
    const session = this.loginProxySession;
    if (!session || !this.loginProxyActive || this.loginProxyReconnectRunning) {
      return false;
    }

    const remoteCookieData = isPlainObject(session.remote?.cookieData) ? session.remote.cookieData : null;
    const hasNewRemoteCookieData = this.hasNewLoginProxyCookieData(remoteCookieData);
    const cookieFileChanged = await this.cookieFileChangedAfterLoginStart();
    if (!hasNewRemoteCookieData && !cookieFileChanged) {
      return false;
    }

    this.loginProxyReconnectRunning = true;
    try {
      let auth = session.auth || this.auth;
      let canCommitSessionRemote = false;

      if (hasNewRemoteCookieData) {
        const persisted = await this.persistCookie(undefined, undefined, undefined, session.remote, session.auth);
        if (persisted && this.config.cookieFile) {
          auth = parseAlexaCookieFile(await readFile(this.config.cookieFile, 'utf8'));
          this.loginProxyLastHandledCookieMtimeMs = await this.getCookieFileMtimeMs() || Date.now();
        }
        this.loginProxyRemoteCookieFingerprint = cookieDataFingerprint(remoteCookieData);
        canCommitSessionRemote = persisted || hasReusableAuthData(auth);
      } else if (cookieFileChanged) {
        this.loginProxyLastHandledCookieMtimeMs = await this.getCookieFileMtimeMs() || Date.now();
        if (this.config.cookieFile) {
          auth = parseAlexaCookieFile(await readFile(this.config.cookieFile, 'utf8'));
        }
        canCommitSessionRemote = Boolean(remoteCookieData && hasReusableAuthData(auth));
      }

      if (!canCommitSessionRemote || !hasReusableAuthData(auth)) {
        return false;
      }

      await this.commitRemoteCandidate(session.remote, auth);
      this.lastAuthRefreshAt = new Date().toISOString();
      this.lastAuthError = null;
      this.emitAuthEvent('wait-proxy-success', 'Amazon-Login wurde ueber Cookie-Daten abgeschlossen.');
      this.emitAuthEvent('candidate-committed', 'Neue Alexa-TTS-Verbindung wurde uebernommen.');
      return true;
    } catch (error) {
      this.lastAuthError = summarizeAuthError(error);
      this.deferNextLoginProxyReconnect();
      return false;
    } finally {
      this.loginProxyReconnectRunning = false;
    }
  }

  async cookieFileChangedAfterLoginStart() {
    const startedAt = Date.parse(this.loginProxyStartedAt || '');
    if (!Number.isFinite(startedAt)) return false;
    const lastHandledAt = Number.isFinite(this.loginProxyLastHandledCookieMtimeMs)
      ? this.loginProxyLastHandledCookieMtimeMs
      : startedAt;
    try {
      const mtimeMs = await this.getCookieFileMtimeMs();
      return Number.isFinite(mtimeMs) && mtimeMs > lastHandledAt + 1;
    } catch {
      return false;
    }
  }

  async getCookieFileMtimeMs() {
    if (!this.config.cookieFile) return NaN;
    const fileStat = await stat(this.config.cookieFile);
    return fileStat.mtimeMs;
  }

  hasNewLoginProxyCookieData(cookieData) {
    if (!isPlainObject(cookieData) || !Object.keys(cookieData).length) return false;

    const sourceData = isPlainObject(this.auth?.originalData) ? this.auth.originalData : {};
    const localCookie = firstNonEmptyString(cookieData.localCookie, cookieData.cookie, cookieData.loginCookie);
    const csrf = firstNonEmptyString(cookieData.csrf);
    const previousCookie = firstNonEmptyString(sourceData.localCookie, sourceData.cookie, sourceData.loginCookie, this.auth?.cookie);
    const previousCsrf = firstNonEmptyString(sourceData.csrf, this.auth?.csrf);
    const tokenDateMs = cookieDataTimeMs(cookieData.tokenDate);
    const previousTokenDateMs = cookieDataTimeMs(sourceData.tokenDate);
    const loginStartedAt = Date.parse(this.loginProxyStartedAt || '');

    const cookieChanged = Boolean(localCookie && previousCookie && localCookie !== previousCookie);
    const csrfChanged = Boolean(csrf && previousCsrf && csrf !== previousCsrf);
    const tokenDateIsFresh = Number.isFinite(tokenDateMs) &&
      Number.isFinite(loginStartedAt) &&
      tokenDateMs > loginStartedAt &&
      (!Number.isFinite(previousTokenDateMs) || tokenDateMs > previousTokenDateMs);

    if (!cookieChanged && !csrfChanged && !tokenDateIsFresh) return false;

    const fingerprint = cookieDataFingerprint(cookieData);
    return Boolean(fingerprint && fingerprint !== this.loginProxyRemoteCookieFingerprint);
  }

  deferNextLoginProxyReconnect() {
    const intervalMs = numberInRange(
      this.config.loginProxyReconnectIntervalSeconds,
      DEFAULT_LOGIN_RECONNECT_INTERVAL_SECONDS,
      5,
      120
    ) * 1000;
    const multiplier = Math.min(Math.max(this.loginProxyReconnectAttempts, 1), 12);
    this.loginProxyReconnectBackoffUntil = Date.now() + Math.min(intervalMs * multiplier, 5 * 60_000);
  }

  async handleLoginProxyFinal(sequence, result) {
    const session = this.loginProxySession;
    if (!session || session.sequence !== sequence) {
      if (result?.ok === true) {
        this.emitAuthEvent('candidate-discarded', 'Veraltetes Alexa-TTS-Login-Ergebnis wurde verworfen.');
      }
      return;
    }

    if (result.ok) {
      try {
        const persisted = await this.persistCookie(undefined, undefined, undefined, session.remote, session.auth);
        let auth = session.auth;
        if (persisted && this.config.cookieFile) {
          auth = parseAlexaCookieFile(await readFile(this.config.cookieFile, 'utf8'));
        }
        await this.commitRemoteCandidate(session.remote, auth);
        this.lastAuthRefreshAt = new Date().toISOString();
        this.lastAuthError = null;
        this.emitAuthEvent('wait-proxy-success', 'Amazon-Login wurde abgeschlossen.');
        this.emitAuthEvent('candidate-committed', 'Neue Alexa-TTS-Verbindung wurde übernommen.');
      } catch (error) {
        await this.handleLoginProxyFinal(sequence, { ok: false, loginRequired: false, error });
      }
      return;
    }

    this.lastAuthError = summarizeAuthError(result.error);
    this.emitAuthEvent('refresh-failed', 'Alexa-TTS-Login-Session ist fehlgeschlagen.');
    if (session.previousReady && session.previousRemote) {
      this.ready = true;
      this.authState = AUTH_STATE.READY;
      this.remote = session.previousRemote;
      this.lastError = null;
      this.startAuthRefreshTimer();
      await this.disposeRemote(session.remote);
      this.clearLoginProxyState();
      return;
    }

    await this.disposeRemote(session.remote);
    this.clearLoginProxyState();
    this.markUnavailable('Alexa TTS konnte nach Amazon-Login nicht verbunden werden.', result.error);
  }

  async expireLoginProxySession() {
    const session = this.loginProxySession;
    this.lastAuthError = 'Amazon-Login wurde nicht innerhalb der Wartezeit abgeschlossen.';
    this.emitAuthEvent('wait-proxy-expired', 'Amazon-Login wurde nicht innerhalb der Wartezeit abgeschlossen.');
    if (session?.previousReady && session.previousRemote) {
      this.ready = true;
      this.authState = AUTH_STATE.READY;
      this.remote = session.previousRemote;
      this.lastError = null;
      this.startAuthRefreshTimer();
      await this.disposeRemote(session.remote);
      this.clearLoginProxyState();
      return;
    }
    await this.disposeRemote(session?.remote);
    this.clearLoginProxyState();
    this.ready = false;
    this.authState = AUTH_STATE.ERROR;
    this.lastError = 'Amazon-Login erforderlich. Der Login-Link ist abgelaufen.';
  }

  getStatus() {
    return {
      enabled: Boolean(this.config.enabled),
      ready: this.ready,
      error: this.lastError,
      defaultDevices: configuredDeviceList(this.config.defaultDevices),
      allDevices: configuredDeviceList(this.config.allDevices),
      alarmDevices: configuredDeviceList(this.config.alarmDevices),
      defaultSpeakDevices: configuredDeviceList(this.getDefaultSpeakDevices()),
      defaultVolume: normalizeVolume(this.config.defaultVolume, 40),
      alarmVolume: normalizeVolume(this.config.alarmVolume, 100),
      nativeSequences: this.hasNativeSequenceSupport(),
      auth: this.getAuthStatus()
    };
  }

  getDefaultSpeakDevices() {
    return firstNonEmpty(this.config.defaultDevices, this.config.allDevices, this.config.alarmDevices);
  }

  getAuthStatus() {
    const sourceData = isPlainObject(this.auth?.originalData) ? this.auth.originalData : {};
    const tokenAgeMs = tokenAgeMsFromDate(sourceData.tokenDate);
    return {
      cookieFile: this.config.cookieFile || '',
      cookieJson: Boolean(this.auth?.isJson),
      hasLocalCookie: Boolean(firstNonEmptyString(sourceData.localCookie, this.auth?.cookie)),
      hasLoginCookie: Boolean(firstNonEmptyString(sourceData.loginCookie)),
      hasRefreshToken: Boolean(firstNonEmptyString(sourceData.refreshToken)),
      hasDeviceSerial: Boolean(firstNonEmptyString(sourceData.deviceSerial, sourceData.deviceId)),
      hasCsrf: Boolean(firstNonEmptyString(sourceData.csrf, this.auth?.csrf)),
      hasMacDms: Boolean(firstNonEmptyObject(sourceData.macDms, this.auth?.macDms)),
      amazonPage: sourceData.amazonPage || this.auth?.amazonPage || this.config.amazonPage || '',
      tokenDate: sourceData.tokenDate || null,
      tokenAgeHours: Number.isFinite(tokenAgeMs) ? Math.round(tokenAgeMs / 36_000) / 100 : null,
      state: this.authState,
      lastCookiePersistAt: this.lastCookiePersistAt,
      lastAuthRefreshAt: this.lastAuthRefreshAt,
      lastAuthError: this.lastAuthError,
      loginProxyActive: this.loginProxyActive,
      loginUrl: this.loginUrl,
      loginProxyStartedAt: this.loginProxyStartedAt,
      loginProxyExpiresAt: this.loginProxyExpiresAt
    };
  }

  async reconnect(reason = 'manual-reconnect') {
    if (this.loginProxySession && this.loginProxyActive) {
      this.emitAuthEvent('wait-proxy-still-active', 'Amazon-Login wartet bereits auf Abschluss.');
      return { ok: false, waitProxy: true, ready: this.ready, status: this.getStatus() };
    }
    const previousReady = this.ready && this.remote;
    this.stopAuthRefreshTimer();
    this.stopLoginProxyReconnectTimer();
    this.authState = AUTH_STATE.REFRESHING;
    this.emitAuthEvent('refresh-started', `Alexa TTS wird neu verbunden (${reason}).`);
    try {
      let AlexaRemote = this.AlexaRemote;
      if (!AlexaRemote) {
        AlexaRemote = loadAlexaRemote2();
        this.AlexaRemote = AlexaRemote;
      }

      const auth = parseAlexaCookieFile(await readFile(this.config.cookieFile, 'utf8'));
      this.emitAuthEvent('cookie-read', 'Alexa-Cookie-Datei wurde neu gelesen.');
      const candidateRemote = new AlexaRemote();
      this.attachCookiePersistence(candidateRemote, auth);
      const sequence = ++this.initSequence;
      const result = await this.initAlexaRemote(candidateRemote, auth, { commit: false, sequence });
      if (!result.ok) {
        if (result.waitProxy) {
          return {
            ok: false,
            waitProxy: true,
            ready: this.ready,
            status: this.getStatus(),
            error: 'Amazon-Login wartet auf Abschluss.'
          };
        }
        if (previousReady) {
          this.lastAuthError = summarizeAuthError(result.error);
          if (result.loginRequired) {
            this.setLoginProxyRecommendation(result.error, candidateRemote, auth, previousReady, this.remote, sequence);
            this.emitAuthEvent('login-required', 'Neue Amazon-Anmeldung empfohlen; bestehende TTS-Verbindung bleibt aktiv.');
          } else {
            this.authState = AUTH_STATE.READY;
            this.startAuthRefreshTimer();
            await this.disposeRemote(candidateRemote);
          }
          this.emitAuthEvent('refresh-failed', 'Neue Alexa-TTS-Verbindung konnte nicht ersetzt werden; bestehende Verbindung bleibt aktiv.');
          return {
            ok: false,
            ready: this.ready,
            status: this.getStatus(),
            error: 'Neue Verbindung konnte nicht ersetzt werden, bestehende TTS-Verbindung bleibt aktiv.'
          };
        }

        if (result.loginRequired) {
          this.markWaitingForLogin(result.error, { remote: candidateRemote, auth, sequence });
        } else {
          this.markUnavailable('Alexa TTS konnte nicht neu verbunden werden.', result.error);
          await this.disposeRemote(candidateRemote);
        }
        this.emitAuthEvent('refresh-failed', 'Alexa TTS konnte nicht neu verbunden werden.');
        return { ok: false, ready: this.ready, status: this.getStatus() };
      }

      await this.commitRemoteCandidate(candidateRemote, auth);
      this.lastAuthRefreshAt = new Date().toISOString();
      this.lastAuthError = null;
      this.emitAuthEvent('refresh-ok', 'Alexa TTS wurde neu verbunden.');
      return { ok: true, ready: this.ready, status: this.getStatus() };
    } catch (error) {
      this.lastAuthError = summarizeAuthError(error);
      if (!previousReady) {
        this.ready = false;
        this.authState = AUTH_STATE.ERROR;
        this.lastError = `Alexa TTS konnte nicht neu verbunden werden. ${error.message}`;
      } else {
        this.authState = AUTH_STATE.READY;
        this.startAuthRefreshTimer();
      }
      this.emitAuthEvent('refresh-failed', 'Alexa TTS konnte nicht neu verbunden werden.');
      return {
        ok: false,
        ready: this.ready,
        status: this.getStatus(),
        error: previousReady
          ? 'Neue Verbindung konnte nicht ersetzt werden, bestehende TTS-Verbindung bleibt aktiv.'
          : this.lastError
      };
    }
  }

  setLoginProxyRecommendation(error, remote = null, auth = this.auth, previousReady = Boolean(this.ready && this.remote), previousRemote = this.remote, sequence = this.initSequence) {
    return this.beginLoginProxySession({
      remote,
      auth,
      proxyResult: { error, loginUrl: extractLoginUrl(error) },
      previousReady,
      previousRemote,
      sequence
    });
  }

  async disposeRemote(remote = this.remote) {
    if (!remote) return;
    const cleanupMethods = ['stopProxyServer', 'stopProxy', 'close', 'disconnect', 'stop'];
    for (const method of cleanupMethods) {
      if (typeof remote[method] !== 'function') continue;
      try {
        await remote[method]();
      } catch (error) {
        console.warn(`AlexaRemote Cleanup (${method}) ist fehlgeschlagen: ${error.message}`);
      }
      return;
    }
    // alexa-remote2 bietet je nach Version keine dokumentierte Cleanup-Methode
    // für den Login-Proxy an. In diesem Fall wird die alte Instanz ersetzt; der
    // interne Proxy endet normalerweise durch alexa-remote2 selbst.
  }

  async speak(text, devices = this.getDefaultSpeakDevices()) {
    this.assertReady();
    const targets = this.normalizeDevices(devices);
    this.assertDevices(targets);
    await this.sendSequenceToTargets('speak', text, targets);
  }

  async alarm(text, devices = firstNonEmpty(this.config.alarmDevices, this.config.allDevices, this.config.defaultDevices), volume = this.config.alarmVolume) {
    this.assertReady();
    await this.speakAtVolume(text, normalizeVolume(volume, 100), devices);
  }

  async speakAtVolume(text, volume, devices = this.getDefaultSpeakDevices()) {
    this.assertReady();
    await this.sendSequence('speakAtVolume', text, devices, normalizeVolume(volume, 40));
  }

  async setVolume(volume, devices = firstNonEmpty(this.config.allDevices, this.config.defaultDevices)) {
    this.assertReady();
    const value = normalizeVolume(volume, NaN);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Ungültige Alexa-Lautstärke: ${volume}`);
    }

    const targets = this.normalizeDevices(devices);
    this.assertDevices(targets);
    await this.sendCommandToTargets('volume', value, targets);
  }

  async getDeviceInventory() {
    this.assertReady();
    const devices = await this.readRemoteDevices();
    return normalizeDeviceList(devices);
  }

  async readRemoteDevices() {
    if (typeof this.remote?.getDevices !== 'function') {
      return serialNumberMapToDevices(this.remote?.serialNumbers);
    }

    return await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, devices) => {
        if (settled) return;
        settled = true;
        if (error) reject(error);
        else resolve(devices || []);
      };
      const finishFromCallback = (error, devices) => {
        if (devices === undefined && (Array.isArray(error) || isPlainObject(error))) {
          finish(null, error);
          return;
        }
        finish(error, devices);
      };

      try {
        const result = this.remote.getDevices((error, devices) => finishFromCallback(error, devices));
        if (Array.isArray(result)) finish(null, result);
        else if (isPlainObject(result)) finish(null, result);
        else if (result && typeof result.then === 'function') {
          result.then((devices) => finish(null, devices)).catch((error) => finish(error));
        }
      } catch (error) {
        finish(error);
      }

      setTimeout(() => finish(null, serialNumberMapToDevices(this.remote?.serialNumbers)), 5000);
    });
  }

  async sendSequence(type, text, devices, volume) {
    if (!text || typeof text !== 'string') {
      throw new Error('TTS braucht einen Text im Request-Body.');
    }
    const targets = this.normalizeDevices(devices);
    this.assertDevices(targets);
    await this.sendSequenceToTargets(type, text, targets, volume);
  }

  async sendSequenceToTargets(type, text, targets, volume) {
    return await this.withAuthRetry(`tts-${type}`, async () => this.sendSequenceToTargetsOnce(type, text, targets, volume));
  }

  async sendSequenceToTargetsOnce(type, text, targets, volume) {
    if (!text || typeof text !== 'string') {
      throw new Error('TTS braucht einen Text im Request-Body.');
    }
    if (await this.tryNativeSequence(type, text, targets, volume)) {
      return;
    }
    await this.runForTargets(targets, (device) => this.exec(device, type, text, volume), type);
  }

  async sendCommandToTargets(type, value, targets) {
    return await this.withAuthRetry(`tts-${type}`, async () => this.sendCommandToTargetsOnce(type, value, targets));
  }

  async sendCommandToTargetsOnce(type, value, targets) {
    if (await this.tryNativeCommand(type, value, targets)) {
      return;
    }
    await this.runForTargets(targets, (device) => this.exec(device, type, value), type);
  }

  async withAuthRetry(reason, action) {
    try {
      return await action();
    } catch (error) {
      if (!isAuthError(error)) throw error;
      this.lastAuthError = summarizeAuthError(error);
      if (await this.refreshExistingRemoteAuth(reason, error)) {
        return await action();
      }
      await this.refreshAuth(reason, error);
      return await action();
    }
  }

  async refreshExistingRemoteAuth(reason = 'auth-error', error = null) {
    if (!this.ready || !this.remote) return false;
    const method = ['refreshAlexaCookies', 'refreshCookie'].find((name) => typeof this.remote?.[name] === 'function');

    this.emitAuthEvent('existing-cookie-refresh-started', `Alexa-Auth wird auf der bestehenden Verbindung erneuert (${reason}).`);
    let methodError = null;
    if (method) {
      try {
        const refreshResult = await withTimeout(callMaybeCallback(this.remote, method), NATIVE_SEQUENCE_TIMEOUT_MS, 'Alexa-Auth-Refresh Timeout.');
        if (isPlainObject(refreshResult)) {
          this.remote.cookieData = {
            ...(isPlainObject(this.remote.cookieData) ? this.remote.cookieData : {}),
            ...refreshResult
          };
        }
        await this.persistCookie(undefined, undefined, undefined, this.remote, this.auth);
        this.lastAuthRefreshAt = new Date().toISOString();
        this.lastAuthError = null;
        this.authState = AUTH_STATE.READY;
        this.emitAuthEvent('existing-cookie-refresh-ok', 'Alexa-Auth wurde auf der bestehenden Verbindung erneuert.');
        return true;
      } catch (refreshError) {
        methodError = refreshError;
      }
    }

    try {
      if (await this.refreshStoredAlexaCookieData(reason)) {
        this.emitAuthEvent('existing-cookie-refresh-ok', 'Alexa-Auth wurde mit gespeicherten Cookie-Daten erneuert.');
        return true;
      }
    } catch (refreshError) {
      methodError = refreshError;
    }

    this.lastAuthError = summarizeAuthError(methodError || error);
    this.emitAuthEvent('existing-cookie-refresh-failed', 'Alexa-Auth konnte auf der bestehenden Verbindung nicht erneuert werden.');
    return false;
  }

  async refreshAuth(reason = 'auth-error', error = null) {
    if (this.authRefreshPromise) return await this.authRefreshPromise;
    this.authRefreshPromise = this.refreshAuthInternal(reason, error).finally(() => {
      this.authRefreshPromise = null;
    });
    return await this.authRefreshPromise;
  }

  async refreshAuthInternal(reason, error) {
    const previousReady = this.ready && this.remote;
    if (reason === 'scheduled-refresh') {
      this.emitAuthEvent('scheduled-refresh-started', 'Geplanter Alexa-Auth-Refresh wurde gestartet.');
    }
    if (this.loginProxySession && this.loginProxyActive) {
      if (previousReady) {
        const refreshed = await this.refreshExistingRemoteAuth(reason, error);
        if (this.loginProxySession && this.loginProxyActive) {
          this.authState = AUTH_STATE.WAIT_PROXY;
        }
        if (this.ready) {
          this.startAuthRefreshTimer();
        }
        if (refreshed) return;
      }
      throw new Error(this.lastError || this.lastAuthError || 'Amazon-Login wartet auf Abschluss.');
    }

    if (previousReady) {
      this.stopAuthRefreshTimer();
      const refreshed = await this.refreshExistingRemoteAuth(reason, error);
      if (refreshed) {
        this.ready = true;
        this.authState = AUTH_STATE.READY;
        this.lastError = null;
        this.startAuthRefreshTimer();
        return;
      }
    }

    this.stopAuthRefreshTimer();
    this.authState = AUTH_STATE.REFRESHING;
    this.lastAuthError = summarizeAuthError(error);
    this.emitAuthEvent('candidate-refresh-started', `Neue Alexa-TTS-Verbindung wird vorbereitet (${reason}).`);

    if (!hasReusableAuthData(this.auth)) {
      if (previousReady) {
        this.lastAuthError = 'Keine wiederverwendbaren Cookie-Daten vorhanden; bestehende TTS-Verbindung bleibt aktiv.';
        this.authState = AUTH_STATE.READY;
        this.startAuthRefreshTimer();
      } else {
        this.markWaitingForLogin(new Error('Keine wiederverwendbaren Cookie-Daten vorhanden.'));
      }
      this.emitAuthEvent('refresh-failed', 'Alexa-Auth konnte nicht automatisch erneuert werden.');
      throw new Error(this.lastError || this.lastAuthError || 'Amazon-Login erforderlich.');
    }

    let AlexaRemote = this.AlexaRemote;
    if (!AlexaRemote) {
      AlexaRemote = loadAlexaRemote2();
      this.AlexaRemote = AlexaRemote;
    }

    const auth = this.auth;
    const candidateRemote = new AlexaRemote();
    this.attachCookiePersistence(candidateRemote, auth);
    const sequence = ++this.initSequence;
    const result = await this.initAlexaRemote(candidateRemote, auth, { commit: false, sequence });
    if (!result.ok) {
      if (result.waitProxy) {
        this.emitAuthEvent('refresh-failed', 'Alexa-Auth wartet auf Amazon-Login.');
        throw new Error(this.lastError || 'Amazon-Login wartet auf Abschluss.');
      }
      if (previousReady) {
        this.lastAuthError = summarizeAuthError(result.error);
        if (result.loginRequired) {
          this.setLoginProxyRecommendation(result.error, candidateRemote, auth, previousReady, this.remote, sequence);
          this.startAuthRefreshTimer();
          this.emitAuthEvent('candidate-refresh-login-required', 'Neue Amazon-Anmeldung empfohlen; bestehende TTS-Verbindung bleibt aktiv.');
        } else {
          this.authState = AUTH_STATE.READY;
          this.startAuthRefreshTimer();
          await this.disposeRemote(candidateRemote);
        }
      } else if (result.loginRequired) {
        this.markWaitingForLogin(result.error, { remote: candidateRemote, auth, sequence });
      } else {
        this.markUnavailable('Alexa-Auth konnte nicht automatisch erneuert werden.', result.error);
        await this.disposeRemote(candidateRemote);
      }
      this.emitAuthEvent('refresh-failed', 'Alexa-Auth konnte nicht automatisch erneuert werden.');
      throw new Error(this.lastError || 'Amazon-Login erforderlich.');
    }

    await this.commitRemoteCandidate(candidateRemote, auth);
    this.lastAuthRefreshAt = new Date().toISOString();
    this.emitAuthEvent('refresh-ok', 'Alexa-Auth wurde erneuert.');
    await this.persistCookie(undefined, undefined, undefined, candidateRemote, auth);
  }

  emitAuthEvent(status, text) {
    if (typeof this.handlers.addEvent !== 'function') return;
    this.handlers.addEvent({
      type: 'tts-auth',
      status,
      text
    });
  }

  async runForTargets(targets, runner, type) {
    const results = await Promise.all(targets.map(async (device) => {
      try {
        const result = await runner(device);
        if (result?.timedOut) {
          console.warn(`TTS ${type}: keine Rueckmeldung von ${device} nach ${COMMAND_TIMEOUT_MS} ms.`);
        }
        return { device, ok: true };
      } catch (error) {
        return { device, ok: false, error };
      }
    }));
    const failures = results
      .filter((result) => !result.ok)
      .map((result) => `${result.device}: ${result.error.message}`);
    if (failures.length === targets.length) {
      throw new Error(`Alexa-Befehl "${type}" konnte an kein Geraet gesendet werden. ${failures.join(' | ')}`);
    }
    if (failures.length) {
      console.warn(`TTS ${type}: einzelne Geräte fehlgeschlagen: ${failures.join(' | ')}`);
    }
  }

  async tryNativeSequence(type, text, targets, volume) {
    try {
      const devices = this.resolveNativeDevices(targets);
      if (!devices.length) return false;
      const sender = this.getNativeSequenceSender(devices);
      if (!sender) return false;

      if (type === 'speakAtVolume') {
        const sequence = await this.buildNativeSpeakAtVolumeNode(text, normalizeVolume(volume, 40), devices);
        await this.sendNativeSequence(sequence, sender);
        return true;
      }

      if (type === 'speak') {
        await this.sendNativeSequence(this.parallelNode(devices.map((device) => this.speakNode(text, device))), sender);
        return true;
      }

      return false;
    } catch (error) {
      console.warn(`TTS ${type}: native Alexa-Sequenz nicht moeglich, nutze Fallback. ${error.message}`);
      return false;
    }
  }

  async tryNativeCommand(type, value, targets) {
    if (type !== 'volume') return false;

    try {
      const devices = this.resolveNativeDevices(targets);
      if (!devices.length) return false;
      const sender = this.getNativeSequenceSender(devices);
      if (!sender) return false;

      const volume = normalizeVolume(value, NaN);
      await this.sendNativeSequence(this.parallelNode(devices.map((device) => this.volumeNode(volume, device))), sender);
      return true;
    } catch (error) {
      console.warn(`TTS ${type}: native Alexa-Sequenz nicht moeglich, nutze Fallback. ${error.message}`);
      return false;
    }
  }

  getNativeSequenceSender(devices = []) {
    if (typeof this.remote?.sendSequenceNodeExt === 'function') {
      return this.remote.sendSequenceNodeExt.bind(this.remote);
    }
    if (typeof this.remote?.sendSequenceNode === 'function') {
      return this.remote.sendSequenceNode.bind(this.remote);
    }
    if (typeof this.remote?.sendSequenceCommand === 'function' && devices[0]?.serialNumber) {
      return (startNode) => new Promise((resolve, reject) => {
        this.remote.sendSequenceCommand(
          devices[0].serialNumber,
          {
            sequence: {
              '@type': 'com.amazon.alexa.behaviors.model.Sequence',
              startNode
            }
          },
          (error, response) => {
            if (error) reject(error);
            else resolve(response);
          }
        );
      });
    }
    return null;
  }

  hasNativeSequenceSupport() {
    return Boolean(
      typeof this.remote?.sendSequenceNodeExt === 'function' ||
      typeof this.remote?.sendSequenceNode === 'function' ||
      typeof this.remote?.sendSequenceCommand === 'function'
    );
  }

  async sendNativeSequence(sequenceNode, sender) {
    if (!sequenceNode) {
      throw new Error('Leere Alexa-Sequenz.');
    }

    const result = await withTimeout(new Promise((resolve, reject) => {
      let settled = false;
      let fireAndForgetTimer = null;
      const finish = (error, response) => {
        if (settled) return;
        settled = true;
        if (fireAndForgetTimer) clearTimeout(fireAndForgetTimer);
        if (error) reject(error);
        else resolve(response);
      };

      try {
        const response = sender(sequenceNode, finish);
        if (response && typeof response.then === 'function') {
          response.then((payload) => finish(null, payload)).catch((error) => finish(error));
        } else if (response !== undefined) {
          finish(null, response);
        } else {
          fireAndForgetTimer = setTimeout(() => finish(null, { fireAndForget: true }), NATIVE_FIRE_AND_FORGET_MS);
        }
      } catch (error) {
        finish(error);
      }
    }), NATIVE_SEQUENCE_TIMEOUT_MS, 'Keine Antwort von der nativen Alexa-Sequenz.');

    if (isPlainObject(result) && typeof result.message === 'string' && result.message) {
      throw new Error(result.message);
    }
  }

  async buildNativeSpeakAtVolumeNode(text, volume, devices) {
    const setVolume = this.parallelNode(devices.map((device) => this.volumeNode(volume, device)));
    const speak = this.parallelNode(devices.map((device) => this.speakNode(text, device)));
    const restore = await this.buildRestoreVolumeNode(devices);
    return this.serialNode([setVolume, speak, restore].filter(Boolean));
  }

  async buildRestoreVolumeNode(devices) {
    const nodes = [];
    await Promise.all(devices.map(async (device) => {
      const previousVolume = await this.readCurrentVolume(device);
      if (!Number.isFinite(previousVolume)) return;
      nodes.push(this.volumeNode(previousVolume, device));
    }));
    return nodes.length ? this.parallelNode(nodes) : null;
  }

  async readCurrentVolume(device) {
    if (typeof this.remote?.getMediaPromise !== 'function') return NaN;

    try {
      const media = await withTimeout(
        this.remote.getMediaPromise(device.raw || device),
        MEDIA_VOLUME_TIMEOUT_MS,
        'Media-Status Timeout'
      );
      return normalizeVolume(media?.volume, NaN);
    } catch {
      return NaN;
    }
  }

  resolveNativeDevices(targets) {
    const devices = [];
    const seen = new Set();
    for (const target of targets) {
      for (const device of this.expandNativeDevice(target)) {
        const native = this.toNativeDevice(device, target);
        if (!native || seen.has(native.serialNumber)) continue;
        seen.add(native.serialNumber);
        devices.push(native);
      }
    }
    return devices;
  }

  expandNativeDevice(target, depth = 1) {
    const device = this.findNativeDevice(target);
    if (!device) return [];
    const members = Array.isArray(device.clusterMembers) ? device.clusterMembers : [];
    if (members.length && depth > 0) {
      return members.flatMap((member) => this.expandNativeDevice(member, depth - 1));
    }
    return [device];
  }

  findNativeDevice(target) {
    const value = typeof target === 'string' ? target.trim() : target;
    if (!value) return null;

    if (typeof this.remote?.find === 'function') {
      try {
        const found = this.remote.find(value);
        if (found) return found;
      } catch {
        // Fall through to serialNumbers.
      }
    }

    const serial = String(value);
    const device = this.remote?.serialNumbers?.[serial];
    if (isPlainObject(device)) {
      return { ...device, serialNumber: firstText(device.serialNumber, serial) };
    }
    return null;
  }

  toNativeDevice(device, fallbackSerial) {
    if (!isPlainObject(device)) return null;

    const serialNumber = firstText(device.serialNumber, device.deviceSerialNumber, device.deviceSerial, fallbackSerial);
    const deviceType = firstText(device.deviceType, device.deviceTypeId);
    const customerId = firstText(device.deviceOwnerCustomerId, device.customerId, this.remote?.ownerCustomerId);
    if (!serialNumber || !deviceType || !customerId) return null;

    return {
      raw: device,
      serialNumber,
      deviceType,
      customerId
    };
  }

  speakNode(text, device) {
    return {
      '@type': 'com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode',
      type: 'Alexa.Speak',
      operationPayload: {
        deviceType: device.deviceType,
        deviceSerialNumber: device.serialNumber,
        locale: this.getLocale(),
        customerId: device.customerId,
        textToSpeak: text
      }
    };
  }

  volumeNode(volume, device) {
    return {
      '@type': 'com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode',
      type: 'Alexa.DeviceControls.Volume',
      operationPayload: {
        deviceType: device.deviceType,
        deviceSerialNumber: device.serialNumber,
        locale: this.getLocale(),
        customerId: device.customerId,
        value: normalizeVolume(volume, 40)
      }
    };
  }

  serialNode(nodes) {
    return this.containerNode('SerialNode', nodes);
  }

  parallelNode(nodes) {
    if (nodes.length === 1) return nodes[0];
    return this.containerNode('ParallelNode', nodes);
  }

  containerNode(type, nodes) {
    return {
      '@type': `com.amazon.alexa.behaviors.model.${type}`,
      nodesToExecute: nodes,
      name: null
    };
  }

  getLocale() {
    return this.config.acceptLanguage || defaultAcceptLanguage(this.config.amazonPage || this.auth?.amazonPage);
  }

  exec(device, type, value, volume) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, result = {}) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(result);
      };
      const timer = setTimeout(() => finish(null, { timedOut: true }), COMMAND_TIMEOUT_MS);
      const callback = (error) => finish(error);

      try {
        if (type === 'speakAtVolume') {
          this.remote.sendSequenceCommand(device, 'speakAtVolume', value, volume, callback);
          return;
        }

        this.remote.sendSequenceCommand(device, type, value, callback);
      } catch (error) {
        finish(error);
      }
    });
  }

  assertReady() {
    if (!this.config.enabled) {
      throw new Error('TTS ist in config.json deaktiviert.');
    }
    if (!this.ready) {
      throw new Error(this.lastError || 'TTS ist noch nicht initialisiert.');
    }
  }

  normalizeDevices(devices) {
    if (Array.isArray(devices)) {
      return devices.map((device) => String(device).trim()).filter(isConfiguredDevice);
    }
    const device = String(devices || '').trim();
    return isConfiguredDevice(device) ? [device] : [];
  }

  assertDevices(devices) {
    if (!devices.length) {
      throw new Error('Keine Alexa-Geräte für TTS konfiguriert.');
    }
  }
}

function loadAlexaRemote2() {
  const requires = [
    createRequire(join(getDependencyInstallDir(), 'package.json')),
    appRequire
  ];

  let lastError;
  for (const requireFn of requires) {
    try {
      const module = requireFn('alexa-remote2');
      return module.default || module;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function loadAlexaCookie2() {
  const requires = [
    createRequire(join(getDependencyInstallDir(), 'package.json')),
    appRequire
  ];

  for (const requireFn of requires) {
    try {
      const module = requireFn('alexa-cookie2');
      return module.default || module;
    } catch {
      // Optional dependency path; fall through to the next resolver.
    }
  }
  return null;
}

function normalizeVolume(value, fallback) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) {
    if (Number.isFinite(fallback)) return fallback;
    throw new Error(`Ungültige Alexa-Lautstärke: ${value}`);
  }
  return Math.min(100, Math.max(0, Math.round(volume)));
}

function numberInRange(value, fallback, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function serialNumberMapToDevices(value) {
  if (!isPlainObject(value)) return [];
  return Object.entries(value).map(([serialNumber, device]) => ({
    ...(isPlainObject(device) ? device : {}),
    serialNumber
  }));
}

function normalizeDeviceList(value) {
  const rawDevices = extractDeviceCandidates(value);
  const devices = new Map();
  rawDevices.forEach((device) => {
    if (!isPlainObject(device)) return;
    const serial = firstText(
      device.serialNumber,
      device.deviceSerialNumber,
      device.deviceSerial,
      device.serial,
      device.id
    );
    if (!serial) return;

    devices.set(serial, {
      serial,
      name: firstText(
        device.accountName,
        device.deviceAccountName,
        device.name,
        device.friendlyName,
        device.deviceName,
        serial
      ),
      type: firstText(device.deviceTypeFriendlyName, device.deviceFamily, device.deviceType, device.productName),
      online: device.online !== false && device.available !== false && device.isConnected !== false
    });
  });

  return Array.from(devices.values()).sort((left, right) => (
    left.name.localeCompare(right.name, 'de', { sensitivity: 'base' })
  ));
}

function extractDeviceCandidates(value) {
  const candidates = [];
  const seen = new Set();

  const visit = (item, mapKey = '') => {
    if (Array.isArray(item)) {
      item.forEach((entry) => visit(entry));
      return;
    }
    if (!isPlainObject(item)) return;
    if (seen.has(item)) return;
    seen.add(item);

    const nestedKeys = ['devices', 'deviceList', 'deviceStates', 'alexaDevices'];
    let usedNestedList = false;
    for (const key of nestedKeys) {
      if (Array.isArray(item[key])) {
        usedNestedList = true;
        visit(item[key]);
      }
    }

    if (looksLikeAlexaDevice(item)) {
      candidates.push(withFallbackSerial(item, mapKey));
      return;
    }

    if (usedNestedList) return;

    for (const [key, entry] of Object.entries(item)) {
      if (isPlainObject(entry) || Array.isArray(entry)) {
        visit(entry, key);
      }
    }
  };

  visit(value);
  return candidates;
}

function looksLikeAlexaDevice(value) {
  return Boolean(
    isPlainObject(value) &&
    firstText(
      value.serialNumber,
      value.deviceSerialNumber,
      value.deviceSerial,
      value.accountName,
      value.deviceAccountName,
      value.deviceType,
      value.deviceFamily
    )
  );
}

function withFallbackSerial(device, fallbackSerial) {
  if (!fallbackSerial || firstText(device.serialNumber, device.deviceSerialNumber, device.deviceSerial, device.serial, device.id)) {
    return device;
  }
  return { ...device, serialNumber: fallbackSerial };
}

function firstText(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0);
}

function normalizeRefreshedCookieData(previousData = {}, refreshedData = {}) {
  const refreshed = isPlainObject(refreshedData) ? refreshedData : {};
  const data = {
    ...(isPlainObject(previousData) ? previousData : {}),
    ...refreshed
  };
  const localCookie = firstNonEmptyString(
    refreshed.localCookie,
    refreshed.cookie,
    data.localCookie,
    data.cookie,
    data.loginCookie
  );
  if (localCookie) {
    data.localCookie = localCookie;
  }
  const loginCookie = firstNonEmptyString(refreshed.loginCookie, data.loginCookie);
  if (loginCookie) {
    data.loginCookie = loginCookie;
  }
  const csrf = firstNonEmptyString(refreshed.csrf, data.csrf);
  if (csrf) {
    data.csrf = csrf;
  }
  const macDmsValue = firstNonEmptyObject(refreshed.macDms, data.macDms);
  if (macDmsValue) {
    data.macDms = macDmsValue;
  }
  data.dataVersion = data.dataVersion || 2;
  data.tokenDate = refreshed.tokenDate || Date.now();
  return data;
}

function callAlexaCookieRefresh(alexaCookie, options) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(value);
    };

    try {
      const result = alexaCookie.refreshAlexaCookie(options, finish);
      if (result && typeof result.then === 'function') {
        result.then((value) => finish(null, value)).catch((error) => finish(error));
      } else if (result !== undefined) {
        finish(null, result);
      }
    } catch (error) {
      finish(error);
    }
  });
}

function getSetCookieHeaders(headers) {
  if (!headers) return [];
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie().filter(Boolean);
  }
  if (typeof headers.raw === 'function') {
    const raw = headers.raw();
    if (Array.isArray(raw?.['set-cookie'])) {
      return raw['set-cookie'].filter(Boolean);
    }
  }
  if (typeof headers.get === 'function') {
    const value = headers.get('set-cookie');
    if (value) return splitSetCookieHeader(value);
  }
  return [];
}

function splitSetCookieHeader(value) {
  return String(value || '')
    .split(/,(?=\s*[^;,=]+=)/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function mergeCookieHeader(currentCookie, setCookies = []) {
  const cookies = new Map();
  const addPair = (entry) => {
    const pair = String(entry || '').split(';')[0].trim();
    const index = pair.indexOf('=');
    if (index <= 0) return;
    cookies.set(pair.slice(0, index), pair);
  };

  String(currentCookie || '').split(';').forEach(addPair);
  setCookies.forEach(addPair);
  return Array.from(cookies.values()).join('; ');
}

function extractCookieValue(cookieHeader, name) {
  const target = String(name || '').trim();
  if (!target) return '';
  for (const entry of String(cookieHeader || '').split(';')) {
    const pair = entry.trim();
    const index = pair.indexOf('=');
    if (index <= 0) continue;
    if (pair.slice(0, index) === target) {
      return pair.slice(index + 1);
    }
  }
  return '';
}

export function parseAlexaCookieFile(content) {
  const raw = String(content || '').trim();
  if (!raw) {
    throw new Error('Cookie-Datei ist leer.');
  }

  if (!raw.startsWith('{')) {
    return {
      cookie: raw,
      isJson: false,
      originalData: null,
      cookieData: null
    };
  }

  const parsed = JSON.parse(raw);
  const cookie = parsed.localCookie || parsed.cookie || parsed.loginCookie;
  if (!cookie || typeof cookie !== 'string') {
    throw new Error('Cookie-Datei ist JSON, enthaelt aber keinen localCookie oder loginCookie.');
  }

  const cookieData = {
    ...parsed,
    localCookie: parsed.localCookie || cookie
  };

  return {
    cookie,
    isJson: true,
    originalData: parsed,
    cookieData,
    remoteCookie: cookieData,
    csrf: typeof parsed.csrf === 'string' ? parsed.csrf : undefined,
    amazonPage: typeof parsed.amazonPage === 'string' ? parsed.amazonPage : undefined,
    deviceAppName: typeof parsed.deviceAppName === 'string' ? parsed.deviceAppName : undefined,
    macDms: isPlainObject(parsed.macDms) ? parsed.macDms : undefined,
    formerRegistrationData: buildFormerRegistrationData(parsed)
  };
}

function buildFormerRegistrationData(parsed) {
  if (!isPlainObject(parsed)) return undefined;
  const keys = [
    'localCookie',
    'loginCookie',
    'frc',
    'map-md',
    'deviceId',
    'deviceSerial',
    'refreshToken',
    'tokenDate',
    'amazonPage',
    'csrf',
    'deviceAppName',
    'dataVersion',
    'macDms'
  ];
  const data = {};
  for (const key of keys) {
    if (parsed[key] !== undefined) {
      data[key] = parsed[key];
    }
  }
  return Object.keys(data).length ? data : undefined;
}

function defaultAcceptLanguage(amazonPage) {
  const page = String(amazonPage || '').toLowerCase();
  if (page.endsWith('.de')) return 'de-DE';
  if (page.endsWith('.fr')) return 'fr-FR';
  if (page.endsWith('.it')) return 'it-IT';
  if (page.endsWith('.es')) return 'es-ES';
  if (page.endsWith('.co.uk')) return 'en-GB';
  return 'en-US';
}

function isProxyLoginPrompt(error) {
  return /please open https?:\/\//i.test(error?.message || String(error || ''));
}

function extractLoginUrl(error) {
  const text = String(error?.message || error || '');
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0].replace(/[).,;]+$/, '') : null;
}

function isAuthError(error) {
  const rawCode = error?.statusCode ?? error?.status;
  const code = Number(rawCode);
  const message = String(error?.message || error || '').toLowerCase();
  return (
    code === 401 ||
    code === 403 ||
    /\b401\b/.test(message) ||
    /\b403\b/.test(message) ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('authentication failed') ||
    message.includes('not authenticated') ||
    message.includes('login required') ||
    isProxyLoginPrompt(error)
  );
}

function summarizeAuthError(error) {
  if (!error) return null;
  const code = error?.statusCode || error?.status || error?.code || '';
  const message = String(error?.message || error || '').replace(/https?:\/\/\S+/g, '[login-url]');
  return [code, message].filter(Boolean).join(' ');
}

function hasReusableAuthData(auth) {
  if (!auth) return false;
  const data = isPlainObject(auth.originalData) ? auth.originalData : {};
  return Boolean(firstNonEmptyString(
    auth.cookie,
    data.localCookie,
    data.loginCookie,
    data.cookie,
    data.refreshToken
  ));
}

function tokenAgeMsFromDate(value) {
  if (!value) return NaN;
  const date = typeof value === 'number' ? new Date(value) : new Date(String(value));
  const time = date.getTime();
  return Number.isFinite(time) ? Date.now() - time : NaN;
}

function cookieDataTimeMs(value) {
  if (!value) return NaN;
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  const date = new Date(String(value));
  const time = date.getTime();
  return Number.isFinite(time) ? time : NaN;
}

function cookieDataFingerprint(value) {
  if (!isPlainObject(value)) return null;
  const data = {};
  for (const key of ['localCookie', 'cookie', 'loginCookie', 'csrf', 'refreshToken', 'deviceSerial', 'deviceId', 'tokenDate']) {
    if (value[key] !== undefined) {
      data[key] = value[key];
    }
  }
  return Object.keys(data).length ? stableStringify(data) : null;
}

function isSameJsonData(left, right) {
  return stableStringify(left || {}) === stableStringify(right || {});
}

function firstNonEmptyObject(...values) {
  return values.find((value) => isPlainObject(value) && Object.keys(value).length > 0);
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function callMaybeCallback(target, method, ...args) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(value);
    };

    try {
      const result = target[method](...args, finish);
      if (result && typeof result.then === 'function') {
        result.then((value) => finish(null, value)).catch((error) => finish(error));
      } else if (result !== undefined) {
        finish(null, result);
      }
    } catch (error) {
      finish(error);
    }
  });
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function firstLanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return '';
}

function getDependencyInstallDir() {
  if (process.env.DEPENDENCY_INSTALL_DIR) {
    return process.env.DEPENDENCY_INSTALL_DIR;
  }
  if (process.env.CONFIG_PATH) {
    return resolve(dirname(process.env.CONFIG_PATH));
  }
  return process.cwd();
}

function firstNonEmpty(...lists) {
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    const devices = list.map((device) => String(device).trim()).filter(isConfiguredDevice);
    if (devices.length) return devices;
  }
  return [];
}

function isConfiguredDevice(device) {
  const value = String(device || '').trim();
  return Boolean(value && !value.includes('replace-with'));
}

function configuredDeviceList(value) {
  return Array.isArray(value) ? value.map((device) => String(device).trim()).filter(isConfiguredDevice) : [];
}
