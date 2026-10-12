/**
 * Unit & Behavioral Regression Tests: Price Action Setup Alerts & Regime Filter
 * ==============================================================================
 * Tests Prompt 8 deliverables:
 * 1. Regime-filter matrix (bull/bear/range × long/short → alert or suppressed, assert each cell)
 * 2. Deduplication (same key twice → one alert, second suppressed)
 * 3. Directional cooldown (same ticker + direction within N bars suppressed, after cooldown allowed)
 * 4. Quiet hours policy (no alerts before 7 AM / after 10 PM local)
 * 5. Observational wording invariant (no "buy now", mandatory disclaimer)
 * 6. Mocked channel dispatch (asserts payload structure, never hits real network)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webSrcDir = path.resolve(rootDir, 'web/src');

// Import alerts module
const alertsModuleUrl = pathToFileURL(path.join(webSrcDir, 'priceAction/alerts.ts')).href;
const {
  filterSetupByRegime,
  evaluateDeduplicationAndCooldown,
  formatPriceActionAlert,
  evaluateCandidateSetups,
  dispatchPriceActionAlert,
  buildAlertKey,
  isWithinQuietHours,
  DEFAULT_ALERT_SETTINGS,
} = await import(alertsModuleUrl);

// Import Single Clock Authority
const appNowUrl = pathToFileURL(path.join(webSrcDir, 'utils/appNow.ts')).href;
const { setMockNow, resetNow } = await import(appNowUrl);

// Mock localStorage for node environment
const storageMap = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => storageMap.get(k) || null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
    clear: () => storageMap.clear(),
  },
};

/**
 * Helper to build mock MarketRegime
 */
function createMockRegime(spxDirection, ndxDirection, spxPhase = 'bull leg 2', ndxPhase = 'bull leg 2') {
  let agreement = 'AGREE';
  if (spxDirection === ndxDirection) {
    agreement = 'AGREE';
  } else if (
    (spxDirection === 'BULL' && ndxDirection === 'BEAR') ||
    (spxDirection === 'BEAR' && ndxDirection === 'BULL')
  ) {
    agreement = 'CONFLICT';
  } else {
    agreement = 'MIXED';
  }

  return {
    spx: {
      symbol: 'SPX',
      direction: spxDirection,
      phase: spxPhase,
      legNumber: 2,
      isExtended: false,
      lastClose: 580,
      ema20: 575,
      lastBarDate: '2024-10-11',
    },
    ndx: {
      symbol: 'NDX',
      direction: ndxDirection,
      phase: ndxPhase,
      legNumber: 2,
      isExtended: false,
      lastClose: 490,
      ema20: 485,
      lastBarDate: '2024-10-11',
    },
    agreement,
    summary: `SPX: ${spxDirection} · NDX: ${ndxDirection} · ${agreement.toLowerCase()} — as of 2024-10-11 close`,
    guidanceNote: 'Regime test note',
    asOfBarDate: '2024-10-11',
    evaluatedAt: '2024-10-11T20:00:00Z',
    confidenceNote: 'Not financial advice — probabilistic.',
  };
}

/**
 * Helper to build mock PriceActionSetup
 */
function createMockSetup(type, direction, barIndex = 20, barDate = '2024-10-11') {
  return {
    type,
    direction,
    signalBarIndex: barIndex,
    entryBarIndex: barIndex + 1,
    signalBarDate: barDate,
    entryPrice: direction === 'BULL' ? 150 : 140,
    invalidationLevel: direction === 'BULL' ? 145 : 145,
    measuredMoveTarget: direction === 'BULL' ? 160 : 130,
    rationale: `Test rationale for ${direction} ${type}`,
    confidenceNote: 'Not financial advice — probabilistic.',
    parametersUsed: {},
  };
}

test('1. Regime-Filter Matrix: Bull/Bear/Range × Long/Short cells', () => {
  const settings = { ...DEFAULT_ALERT_SETTINGS, filterLongByRegime: true, filterShortByRegime: true, blockBreakoutsInRange: true };

  const longSetup = createMockSetup('H2', 'BULL');
  const shortSetup = createMockSetup('L2', 'BEAR');
  const bullBreakout = createMockSetup('BREAKOUT_BULL', 'BULL');

  // Cell 1: Long setup + SPX BULL -> ALLOWED
  const c1 = filterSetupByRegime(longSetup, createMockRegime('BULL', 'BULL'), settings);
  assert.equal(c1.allowed, true, 'Long setup in SPX bull market must be allowed');

  // Cell 2: Long setup + SPX RANGE with agreement (both RANGE) -> ALLOWED
  const c2 = filterSetupByRegime(longSetup, createMockRegime('RANGE', 'RANGE'), settings);
  assert.equal(c2.allowed, true, 'Long setup in SPX range with agreement must be allowed');

  // Cell 3: Long setup + SPX RANGE with disagreement (SPX RANGE, NDX BEAR) -> SUPPRESSED
  const c3 = filterSetupByRegime(longSetup, createMockRegime('RANGE', 'BEAR'), settings);
  assert.equal(c3.allowed, false, 'Long setup in SPX range without agreement must be suppressed');
  assert.ok(c3.reason.includes('Suppressed'), 'Reason must mention suppression');

  // Cell 4: Long setup + SPX BEAR -> SUPPRESSED
  const c4 = filterSetupByRegime(longSetup, createMockRegime('BEAR', 'BEAR'), settings);
  assert.equal(c4.allowed, false, 'Long setup in SPX bear market must be suppressed');

  // Cell 5: Short setup + SPX BEAR -> ALLOWED
  const c5 = filterSetupByRegime(shortSetup, createMockRegime('BEAR', 'BEAR'), settings);
  assert.equal(c5.allowed, true, 'Short setup in SPX bear market must be allowed');

  // Cell 6: Short setup + SPX BULL -> SUPPRESSED
  const c6 = filterSetupByRegime(shortSetup, createMockRegime('BULL', 'BULL'), settings);
  assert.equal(c6.allowed, false, 'Short setup in SPX bull market must be suppressed');

  // Cell 7: Short setup + SPX RANGE -> SUPPRESSED
  const c7 = filterSetupByRegime(shortSetup, createMockRegime('RANGE', 'RANGE'), settings);
  assert.equal(c7.allowed, false, 'Short setup in SPX range market must be suppressed');

  // Cell 8: Breakout setup + SPX or NDX in RANGE -> SUPPRESSED (Range blocks breakouts)
  const c8 = filterSetupByRegime(bullBreakout, createMockRegime('RANGE', 'BULL'), settings);
  assert.equal(c8.allowed, false, 'Breakout setup during market range consolidation must be blocked');

  // Cell 9: Breakout setup + SPX BULL & NDX BULL -> ALLOWED
  const c9 = filterSetupByRegime(bullBreakout, createMockRegime('BULL', 'BULL'), settings);
  assert.equal(c9.allowed, true, 'Breakout setup during confirmed bull trend must be allowed');

  // Cell 10: Toggleability: Long regime filter disabled -> Allowed even in bear market
  const settingsFilterOff = { ...settings, filterLongByRegime: false };
  const c10 = filterSetupByRegime(longSetup, createMockRegime('BEAR', 'BEAR'), settingsFilterOff);
  assert.equal(c10.allowed, true, 'When filterLongByRegime is false, long setup must be allowed');
});

test('2. Deduplication Guard: Same key twice -> Second suppressed', () => {
  const setup = createMockSetup('H2', 'BULL', 15, '2024-10-11');
  const alertKey = buildAlertKey('AAPL', setup);
  assert.equal(alertKey, 'AAPL:H2:2024-10-11');

  // History with this key already recorded
  const history = [
    {
      key: alertKey,
      ticker: 'AAPL',
      direction: 'BULL',
      signalBarDate: '2024-10-11',
      signalBarIndex: 15,
      dispatchedAt: '2024-10-11T20:00:00Z',
    },
  ];

  const result = evaluateDeduplicationAndCooldown('AAPL', setup, history, 5);
  assert.equal(result.allowed, false, 'Exact duplicate key must be suppressed');
  assert.ok(result.reason.includes('Duplicate suppressed'), 'Reason must state duplicate suppressed');
});

test('3. Directional Cooldown Guard: Suppressed within N bars, allowed after N bars', () => {
  const priorHistory = [
    {
      key: 'TSLA:H1:2024-10-01',
      ticker: 'TSLA',
      direction: 'BULL',
      signalBarDate: '2024-10-01',
      signalBarIndex: 10,
      dispatchedAt: '2024-10-01T20:00:00Z',
    },
  ];

  // A. Candidate setup on bar 13 (distance = 3, cooldown = 5) -> SUPPRESSED
  const setupBar13 = createMockSetup('H2', 'BULL', 13, '2024-10-04');
  const r13 = evaluateDeduplicationAndCooldown('TSLA', setupBar13, priorHistory, 5);
  assert.equal(r13.allowed, false, 'Setup within 5-bar cooldown must be suppressed');
  assert.ok(r13.reason.includes('Cooldown active'), 'Reason must mention cooldown');

  // B. Candidate setup on bar 16 (distance = 6, cooldown = 5) -> ALLOWED
  const setupBar16 = createMockSetup('H2', 'BULL', 16, '2024-10-08');
  const r16 = evaluateDeduplicationAndCooldown('TSLA', setupBar16, priorHistory, 5);
  assert.equal(r16.allowed, true, 'Setup past cooldown window must be allowed');

  // C. Candidate setup with OPPOSITE direction (BEAR) on bar 12 -> ALLOWED
  const setupBearBar12 = createMockSetup('L2', 'BEAR', 12, '2024-10-03');
  const rBear = evaluateDeduplicationAndCooldown('TSLA', setupBearBar12, priorHistory, 5);
  assert.equal(rBear.allowed, true, 'Opposite direction is not blocked by bull cooldown');
});

test('4. Quiet Hours Policy: Suppresses alerts during 22:00 - 07:00 local', () => {
  try {
    // 11:30 PM ET (23:30) -> Inside quiet hours
    setMockNow('2024-10-15T03:30:00Z'); // 23:30 ET
    assert.equal(isWithinQuietHours(undefined, '22:00', '07:00'), true, '23:30 ET must be inside quiet hours');

    // 2:00 PM ET (14:00) -> Outside quiet hours
    setMockNow('2024-10-15T18:00:00Z'); // 14:00 ET
    assert.equal(isWithinQuietHours(undefined, '22:00', '07:00'), false, '14:00 ET must be outside quiet hours');
  } finally {
    resetNow();
  }
});

test('5. Observational Wording & Disclaimers Invariant', () => {
  const setup = createMockSetup('H2', 'BULL', 25, '2024-10-11');
  const regime = createMockRegime('BULL', 'BULL');

  const alert = formatPriceActionAlert('NVDA', setup, regime);

  // Assert headline has observational tone
  assert.ok(alert.headline.includes('setup detected'), 'Headline must state setup detected');
  assert.ok(!alert.headline.toLowerCase().includes('buy now'), 'Must never say buy now');
  assert.ok(!alert.headline.toLowerCase().includes('strong buy'), 'Must never say strong buy');
  assert.ok(!alert.headline.toLowerCase().includes('recommendation'), 'Must never say recommendation');

  // Assert mandatory disclaimer footer
  assert.ok(alert.disclaimer.includes('Not financial advice'), 'Must include Not financial advice disclaimer');
  assert.ok(alert.disclaimer.includes('probabilistic'), 'Must note probabilistic nature');

  // Assert price metrics present
  assert.equal(alert.entryPrice, 150);
  assert.equal(alert.invalidationLevel, 145);
  assert.equal(alert.measuredMoveTarget, 160);
});

test('6. Mocked Multi-Channel Dispatch: Asserts payload contents, zero real network calls', async () => {
  const setup = createMockSetup('H2', 'BULL', 25, '2024-10-11');
  const regime = createMockRegime('BULL', 'BULL');
  const alert = formatPriceActionAlert('AAPL', setup, regime);

  let capturedDiscord = null;
  let capturedBrowser = null;
  let capturedEmail = null;

  const mockDispatchers = {
    discordDispatcher: async (url, payload) => {
      capturedDiscord = { url, payload };
      return true;
    },
    browserDispatcher: async (payload) => {
      capturedBrowser = payload;
      return true;
    },
    emailDispatcher: async (email, payload) => {
      capturedEmail = { email, payload };
      return true;
    },
  };

  const settings = {
    ...DEFAULT_ALERT_SETTINGS,
    enableDiscord: true,
    discordWebhookUrl: 'https://discord.com/api/webhooks/mock/test',
    enableBrowser: true,
    enableEmail: true,
    alertEmailAddress: 'trader@example.com',
  };

  const results = await dispatchPriceActionAlert(alert, settings, mockDispatchers);

  // Assert all channels dispatched successfully
  assert.equal(results.discord, true);
  assert.equal(results.browser, true);
  assert.equal(results.email, true);

  // Assert Discord payload contents
  assert.equal(capturedDiscord.url, 'https://discord.com/api/webhooks/mock/test');
  assert.equal(capturedDiscord.payload.ticker, 'AAPL');
  assert.equal(capturedDiscord.payload.setupType, 'H2');
  assert.equal(capturedDiscord.payload.entryPrice, 150);
  assert.equal(capturedDiscord.payload.invalidationLevel, 145);
  assert.ok(capturedDiscord.payload.disclaimer.includes('Not financial advice'));

  // Assert Browser payload contents
  assert.equal(capturedBrowser.headline, alert.headline);

  // Assert Email payload contents
  assert.equal(capturedEmail.email, 'trader@example.com');
  assert.equal(capturedEmail.payload.headline, alert.headline);
});
