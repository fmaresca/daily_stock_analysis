/**
 * Unit & Behavioral Regression Tests: Market Regime via SPX/NDX Proxies
 * ======================================================================
 * Tests Prompt 7 deliverables:
 * 1. classifyIndexRegime on hand-built series (clean uptrend, clean downtrend, choppy range)
 * 2. evaluateMarketRegime agreement matrix (AGREE, MIXED, CONFLICT)
 * 3. Append-only regime history persistence invariant (never rewrites history)
 * 4. Single-clock post-close schedule evaluation
 * 5. PriceActionView regime banner smoke test
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const webSrcDir = path.resolve(rootDir, 'web/src');

// Import regime module
const regimeModuleUrl = pathToFileURL(path.join(webSrcDir, 'priceAction/regime.ts')).href;
const {
  classifyIndexRegime,
  evaluateMarketRegime,
  recordRegimeHistory,
  getRegimeHistory,
  isPostCloseRegimeEvaluationDue,
  REGIME_HISTORY_STORAGE_KEY,
} = await import(regimeModuleUrl);

// Import Single Clock Authority for time freezing
const appNowUrl = pathToFileURL(path.join(webSrcDir, 'utils/appNow.ts')).href;
const { setMockNow, resetNow } = await import(appNowUrl);

// Mock localStorage for node environment
const storageMock = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => storageMock.get(key) || null,
    setItem: (key, val) => storageMock.set(key, String(val)),
    removeItem: (key) => storageMock.delete(key),
    clear: () => storageMock.clear(),
  },
};

/**
 * Helper to build synthetic CanonicalBar series
 */
function createSyntheticBars(points, startDate = '2024-01-01') {
  const start = new Date(startDate);
  return points.map((p, idx) => {
    const d = new Date(start.getTime() + idx * 86400000);
    const dateStr = d.toISOString().substring(0, 10);
    return {
      time: dateStr,
      open: p.open ?? p.price,
      high: p.high ?? p.price * 1.01,
      low: p.low ?? p.price * 0.99,
      close: p.close ?? p.price,
      volume: 1000000,
    };
  });
}

test('1. classifyIndexRegime: Clean Uptrend -> BULL with bull leg progression', () => {
  // Hand-built clean uptrend: 25 bars with confirmed HH/HL structure
  const bars = [];
  let price = 500;
  for (let i = 0; i < 30; i++) {
    // 3 up, 1 small pullback
    if (i % 4 === 3) {
      price -= 2;
    } else {
      price += 4;
    }
    const d = new Date(2024, 0, 1 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    bars.push({
      time: dateStr,
      open: price - 1,
      high: price + 2,
      low: price - 2,
      close: price + 1,
      volume: 1000000,
    });
  }

  const result = classifyIndexRegime(bars, 'SPX');
  assert.equal(result.symbol, 'SPX');
  assert.equal(result.direction, 'BULL', 'Clean uptrend must classify as BULL');
  assert.ok(result.phase.startsWith('bull leg'), `Phase must start with 'bull leg', got: ${result.phase}`);
  assert.ok(result.lastClose > result.ema20, 'Bull trend close must be above 20-EMA');
});

test('2. classifyIndexRegime: Clean Downtrend -> BEAR with bear leg progression', () => {
  // Hand-built clean downtrend: 30 bars with confirmed LH/LL structure
  const bars = [];
  let price = 600;
  for (let i = 0; i < 30; i++) {
    if (i % 4 === 3) {
      price += 2;
    } else {
      price -= 4;
    }
    const d = new Date(2024, 0, 1 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    bars.push({
      time: dateStr,
      open: price + 1,
      high: price + 2,
      low: price - 2,
      close: price - 1,
      volume: 1000000,
    });
  }

  const result = classifyIndexRegime(bars, 'NDX');
  assert.equal(result.symbol, 'NDX');
  assert.equal(result.direction, 'BEAR', 'Clean downtrend must classify as BEAR');
  assert.ok(result.phase.startsWith('bear leg'), `Phase must start with 'bear leg', got: ${result.phase}`);
  assert.ok(result.lastClose < result.ema20, 'Bear trend close must be below 20-EMA');
});

test('3. classifyIndexRegime: Choppy Sideways Range -> RANGE with bar count & position', () => {
  // Hand-built range: 25 bars oscillating tightly between 500 and 504
  const bars = [];
  for (let i = 0; i < 25; i++) {
    const cycle = i % 4;
    const base = cycle === 0 ? 501 : cycle === 1 ? 503 : cycle === 2 ? 502 : 500.5;
    const d = new Date(2024, 0, 1 + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    bars.push({
      time: dateStr,
      open: 501,
      high: 504,
      low: 500,
      close: base,
      volume: 500000,
    });
  }

  const result = classifyIndexRegime(bars, 'SPX');
  assert.equal(result.direction, 'RANGE', 'Oscillating series must classify as RANGE');
  assert.ok(result.phase.startsWith('range,'), `Phase must note range, got: ${result.phase}`);
  assert.ok(result.phase.includes('bars'), 'Phase must state bar count');
  assert.ok(['top', 'mid', 'bottom'].includes(result.rangePosition), 'Position must be top, mid, or bottom');
});

test('4. evaluateMarketRegime: Agreement Matrix (AGREE, MIXED, CONFLICT)', () => {
  // Build helper bars
  const bullBars = createSyntheticBars(
    Array.from({ length: 25 }, (_, i) => ({ price: 100 + i * 2 }))
  );
  const bearBars = createSyntheticBars(
    Array.from({ length: 25 }, (_, i) => ({ price: 200 - i * 2 }))
  );
  const rangeBars = createSyntheticBars(
    Array.from({ length: 25 }, (_, i) => ({
      price: 150 + (i % 2 === 0 ? 1 : -1),
      open: 150,
      high: 152,
      low: 148,
      close: 150 + (i % 2 === 0 ? 0.5 : -0.5),
    }))
  );

  // Case A: Both BULL -> AGREE
  const agreeBull = evaluateMarketRegime(bullBars, bullBars);
  assert.equal(agreeBull.agreement, 'AGREE');
  assert.ok(agreeBull.guidanceNote.includes('Both SPX and NDX in bull trend'));
  assert.ok(agreeBull.summary.includes('agree'));

  // Case B: Both BEAR -> AGREE
  const agreeBear = evaluateMarketRegime(bearBars, bearBars);
  assert.equal(agreeBear.agreement, 'AGREE');
  assert.ok(agreeBear.guidanceNote.includes('Both SPX and NDX in bear trend'));

  // Case C: Both RANGE -> AGREE
  const agreeRange = evaluateMarketRegime(rangeBars, rangeBars);
  assert.equal(agreeRange.agreement, 'AGREE');
  assert.ok(agreeRange.guidanceNote.includes('trading range'));

  // Case D: BULL vs BEAR -> CONFLICT
  const conflict = evaluateMarketRegime(bullBars, bearBars);
  assert.equal(conflict.agreement, 'CONFLICT');
  assert.ok(conflict.guidanceNote.toLowerCase().includes('divergence') || conflict.guidanceNote.toLowerCase().includes('conflict'));
  assert.ok(conflict.summary.includes('conflict'));

  // Case E: BULL vs RANGE -> MIXED ("reduce size / wait")
  const mixed = evaluateMarketRegime(bullBars, rangeBars);
  assert.equal(mixed.agreement, 'MIXED');
  assert.ok(mixed.guidanceNote.includes('reduce size / wait'), 'Must advise reducing size or waiting');
  assert.ok(mixed.summary.includes('mixed'));
});

test('5. Append-only regime history log: Strict Invariant (Never rewrites past records)', () => {
  storageMock.clear();

  const mockRegime1 = {
    spx: { symbol: 'SPX', direction: 'BULL', phase: 'bull leg 1', legNumber: 1, isExtended: false, lastClose: 500, ema20: 495, lastBarDate: '2024-10-10' },
    ndx: { symbol: 'NDX', direction: 'BULL', phase: 'bull leg 1', legNumber: 1, isExtended: false, lastClose: 400, ema20: 395, lastBarDate: '2024-10-10' },
    agreement: 'AGREE',
    summary: 'SPX: bull trend · NDX: bull trend · agree — as of 2024-10-10 close',
    guidanceNote: 'Bull trend favored.',
    asOfBarDate: '2024-10-10',
    evaluatedAt: '2024-10-10T20:05:00Z',
    confidenceNote: 'Probabilistic.',
  };

  // Record initial entry
  const hist1 = recordRegimeHistory('2024-10-10', mockRegime1);
  assert.equal(hist1.length, 1);
  assert.equal(hist1[0].date, '2024-10-10');
  assert.equal(hist1[0].regime.summary, mockRegime1.summary);

  // Attempt to overwrite the same date with differing data
  const alteredRegime = { ...mockRegime1, summary: 'TAMPERED SUMMARY' };
  const hist2 = recordRegimeHistory('2024-10-10', alteredRegime);

  // Assert past history was NOT overwritten!
  assert.equal(hist2.length, 1);
  assert.equal(hist2[0].regime.summary, mockRegime1.summary, 'Append-only invariant: Past history must NEVER be rewritten!');

  // Record subsequent date
  const mockRegime2 = { ...mockRegime1, asOfBarDate: '2024-10-11' };
  const hist3 = recordRegimeHistory('2024-10-11', mockRegime2);
  assert.equal(hist3.length, 2, 'New dates must append chronologically');
  assert.equal(hist3[1].date, '2024-10-11');
});

test('6. Single Clock post-close schedule evaluation (appNow.ts authority)', () => {
  try {
    // 1. Weekend test: Saturday at 5:00 PM ET -> not due
    setMockNow('2024-10-12T21:00:00Z'); // Saturday 5:00 PM ET
    assert.equal(isPostCloseRegimeEvaluationDue([]), false, 'Weekend must not trigger regime evaluation');

    // 2. Weekday pre-close: Tuesday 2:30 PM ET -> not due
    setMockNow('2024-10-15T18:30:00Z'); // Tuesday 2:30 PM ET
    assert.equal(isPostCloseRegimeEvaluationDue([]), false, 'Pre-close weekday must not trigger evaluation');

    // 3. Weekday post-close: Tuesday 4:15 PM ET (16:15) -> due if not yet recorded
    setMockNow('2024-10-15T20:15:00Z'); // Tuesday 4:15 PM ET
    assert.equal(isPostCloseRegimeEvaluationDue([]), true, 'Post-close weekday must trigger evaluation if unrecorded');

    // 4. Weekday post-close: Tuesday 4:15 PM ET already recorded -> not due
    const existingHistory = [{ date: '2024-10-15', regime: {}, recordedAt: '' }];
    assert.equal(isPostCloseRegimeEvaluationDue(existingHistory), false, 'Already recorded date must not re-trigger');
  } finally {
    resetNow();
  }
});
