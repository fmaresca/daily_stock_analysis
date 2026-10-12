import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyBars,
  detectSwingPivots,
  detectTrendLegs,
  detectTradingRanges,
  detectSetups,
  runPriceActionDetection,
  calculateEMA,
  DEFAULT_PRICE_ACTION_CONFIG,
} from '../web/src/priceAction/detect.ts';

test('1. Bar classification: identifies Bull/Bear trend bars, Doji, Inside, and Outside bars', () => {
  const bars = [
    // 0: Baseline bar
    { time: '2024-01-01', timestamp: 1704067200000, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
    // 1: Bull Trend Bar (close in upper third, body >= 50%)
    { time: '2024-01-02', timestamp: 1704153600000, open: 101, high: 110, low: 100.5, close: 109, volume: 1000 },
    // 2: Bear Trend Bar (close in bottom third, body >= 50%)
    { time: '2024-01-03', timestamp: 1704240000000, open: 109, high: 110, low: 100, close: 101, volume: 1000 },
    // 3: Doji / Range Bar (body <= 25%, not inside, not outside)
    { time: '2024-01-04', timestamp: 1704326400000, open: 105, high: 111, low: 101, close: 105.2, volume: 1000 },
    // 4: Reference bar for inside/outside test
    { time: '2024-01-05', timestamp: 1704412800000, open: 104, high: 108, low: 102, close: 106, volume: 1000 },
    // 5: Inside Bar (high <= 108, low >= 102)
    { time: '2024-01-08', timestamp: 1704672000000, open: 105, high: 107, low: 103, close: 105, volume: 1000 },
    // 6: Outside Bar (high >= 107, low <= 103, neutral close)
    { time: '2024-01-09', timestamp: 1704758400000, open: 105, high: 112, low: 100, close: 105.5, volume: 1000 },
  ];

  const classified = classifyBars(bars, DEFAULT_PRICE_ACTION_CONFIG);
  assert.equal(classified.length, 7);

  assert.equal(classified[1].barType, 'BULL_TREND_BAR');
  assert.equal(classified[1].isBullSignalBar, true);

  assert.equal(classified[2].barType, 'BEAR_TREND_BAR');
  assert.equal(classified[2].isBearSignalBar, true);

  assert.equal(classified[3].barType, 'DOJI_BAR');
  assert.equal(classified[5].barType, 'INSIDE_BAR');
  assert.equal(classified[5].isInside, true);

  assert.equal(classified[6].barType, 'OUTSIDE_BAR');
  assert.equal(classified[6].isOutside, true);
});

test('2. Swing pivots & trend legs: detects confirmed HH/HL sequence with 2-bar delay', () => {
  const bars = [
    { time: '2024-01-01', timestamp: 1000, open: 100, high: 102, low: 99, close: 101, volume: 100 },
    { time: '2024-01-02', timestamp: 2000, open: 101, high: 101.5, low: 98, close: 98.5, volume: 100 },
    { time: '2024-01-03', timestamp: 3000, open: 98.5, high: 99, low: 95, close: 96, volume: 100 }, // Swing Low (low: 95)
    { time: '2024-01-04', timestamp: 4000, open: 96, high: 103, low: 96, close: 102, volume: 100 },
    { time: '2024-01-05', timestamp: 5000, open: 102, high: 108, low: 101, close: 107, volume: 100 },
    { time: '2024-01-08', timestamp: 6000, open: 107, high: 112, low: 106, close: 111, volume: 100 }, // Swing High (high: 112)
    { time: '2024-01-09', timestamp: 7000, open: 111, high: 111.5, low: 105, close: 106, volume: 100 },
    { time: '2024-01-10', timestamp: 8000, open: 106, high: 107, low: 102, close: 103, volume: 100 },
    { time: '2024-01-11', timestamp: 9000, open: 103, high: 104, low: 100, close: 101, volume: 100 }, // Swing Low (low: 100 > 95 -> HL)
    { time: '2024-01-12', timestamp: 10000, open: 101, high: 106, low: 101, close: 105, volume: 100 },
    { time: '2024-01-15', timestamp: 11000, open: 105, high: 109, low: 104, close: 108, volume: 100 },
  ];

  const pivots = detectSwingPivots(bars, 2);
  assert.ok(pivots.length >= 2);

  const lowPivot = pivots.find((p) => p.type === 'SWING_LOW');
  assert.ok(lowPivot);
  assert.equal(lowPivot.price, 95);
  assert.equal(lowPivot.index, 2);
  assert.equal(lowPivot.confirmedAtIndex, 4);

  const highPivot = pivots.find((p) => p.type === 'SWING_HIGH');
  assert.ok(highPivot);
  assert.equal(highPivot.price, 112);
  assert.equal(highPivot.index, 5);

  const legs = detectTrendLegs(bars, pivots, 3);
  assert.ok(legs.length > 0);
  assert.equal(legs[0].direction, 'BULL');
});

test('3. Trading range detection: groups overlapping sideways bars into range box', () => {
  const bars = [
    { time: '2024-02-01', timestamp: 1000, open: 100, high: 102, low: 99, close: 101, volume: 500 },
    { time: '2024-02-02', timestamp: 2000, open: 101, high: 102.5, low: 99.5, close: 100.5, volume: 500 },
    { time: '2024-02-05', timestamp: 3000, open: 100.5, high: 103, low: 100, close: 101.5, volume: 500 },
    { time: '2024-02-06', timestamp: 4000, open: 101.5, high: 102.8, low: 99.2, close: 100.8, volume: 500 },
    { time: '2024-02-07', timestamp: 5000, open: 100.8, high: 102.2, low: 99.8, close: 101.2, volume: 500 },
    { time: '2024-02-08', timestamp: 6000, open: 101.2, high: 103, low: 99.5, close: 100.2, volume: 500 },
    { time: '2024-02-09', timestamp: 7000, open: 100.2, high: 102.5, low: 100, close: 102.0, volume: 500 },
  ];

  const ranges = detectTradingRanges(bars, DEFAULT_PRICE_ACTION_CONFIG);
  assert.equal(ranges.length, 1);
  const r = ranges[0];
  assert.equal(r.top, 103);
  assert.equal(r.bottom, 99);
  assert.equal(r.barCount, 7);
  assert.ok(r.overlapRatio >= 0.60);
});

test('4. Setup H1 / H2 pullback: detects two-legged pullback continuation in bull trend', () => {
  const bars = [
    { time: '2024-03-01', timestamp: 1000, open: 100, high: 106, low: 100, close: 105.5, volume: 1000 },
    { time: '2024-03-04', timestamp: 2000, open: 106, high: 112, low: 105.5, close: 111.5, volume: 1000 },
    { time: '2024-03-05', timestamp: 3000, open: 112, high: 118, low: 111.5, close: 117.5, volume: 1000 },
    { time: '2024-03-06', timestamp: 4000, open: 118, high: 125, low: 117.5, close: 124.5, volume: 1000 },
    // Pullback bar 1: lower high and lower low
    { time: '2024-03-07', timestamp: 5000, open: 123, high: 124, low: 119, close: 120, volume: 1000 },
    // Pullback bar 2: lower high and lower low
    { time: '2024-03-08', timestamp: 6000, open: 120, high: 121, low: 117, close: 118, volume: 1000 },
    // Trigger bar: breaks above prior bar's high (123 > 121)
    { time: '2024-03-11', timestamp: 7000, open: 118, high: 125, low: 117.5, close: 124, volume: 1000 },
  ];

  const result = runPriceActionDetection(bars, DEFAULT_PRICE_ACTION_CONFIG);
  assert.ok(result.setups.length > 0);
  const pullback = result.setups.find((s) => s.type === 'H1' || s.type === 'H2');
  assert.ok(pullback);
  assert.equal(pullback.direction, 'BULL');
  assert.ok(pullback.invalidationLevel <= 118);
  assert.ok(pullback.measuredMoveTarget > pullback.entryPrice);
  assert.ok(pullback.rationale.includes('Pullback'));
  assert.ok(pullback.confidenceNote.includes('Not financial advice'));
});

test('5. Setup Breakout & Failed Breakout: detects range breakouts and reverse failures', () => {
  const bars = [
    // 5-bar range between 100 and 105
    { time: '2024-04-01', timestamp: 1000, open: 101, high: 104, low: 100, close: 103, volume: 500 },
    { time: '2024-04-02', timestamp: 2000, open: 103, high: 105, low: 101, close: 102, volume: 500 },
    { time: '2024-04-03', timestamp: 3000, open: 102, high: 104.5, low: 100.5, close: 104, volume: 500 },
    { time: '2024-04-04', timestamp: 4000, open: 104, high: 105, low: 101.5, close: 102.5, volume: 500 },
    { time: '2024-04-05', timestamp: 5000, open: 102.5, high: 104.8, low: 100.8, close: 103.5, volume: 500 },
    // Bar 5: Probe above range top (high 107 > 105) but closes back inside (102 <= 105) with bear body
    { time: '2024-04-08', timestamp: 6000, open: 106, high: 107, low: 101, close: 102, volume: 800 },
  ];

  const result = runPriceActionDetection(bars, DEFAULT_PRICE_ACTION_CONFIG);
  const fbo = result.setups.find((s) => s.type === 'FAILED_BREAKOUT_REVERSAL');
  assert.ok(fbo, 'Should detect failed breakout reversal when bar probes outside and closes back inside');
  assert.equal(fbo.direction, 'BEAR');
  assert.equal(fbo.measuredMoveTarget, 100);
});

test('6. Adversarial case: choppy sideways market suppresses false trend pullback setups', () => {
  const choppyBars = [];
  for (let i = 0; i < 15; i++) {
    const base = 100 + (i % 2 === 0 ? 0.3 : -0.3);
    choppyBars.push({
      time: `2024-05-${String(i + 1).padStart(2, '0')}`,
      timestamp: 10000 + i * 1000,
      open: base,
      high: base + 1.2,
      low: base - 1.2,
      close: base + 0.1,
      volume: 500,
    });
  }

  const result = runPriceActionDetection(choppyBars, DEFAULT_PRICE_ACTION_CONFIG);
  const trendSetups = result.setups.filter((s) => s.type === 'H1' || s.type === 'H2' || s.type === 'L1' || s.type === 'L2');
  assert.equal(trendSetups.length, 0, 'Choppy range market must NOT produce trend pullback setups');
});

test('7. Verification: 12-Month SPY daily bars simulation and sanity sampling of 20 setups', () => {
  const spyBars = [];
  let price = 475.0;
  const startDate = new Date('2023-10-01T00:00:00Z');

  for (let i = 0; i < 252; i++) {
    const curDate = new Date(startDate.getTime() + i * 86400000);
    let change = 0;
    // Phase 1 (0-120): Bull trend with 2-bar pullbacks every 10 bars
    if (i < 120) {
      const isPullback = (i % 10 === 6 || i % 10 === 7);
      change = isPullback ? -1.5 : 1.5;
    } else if (i < 150) {
      // Phase 2 (120-150): Trading range consolidation
      change = (i % 2 === 0 ? 0.6 : -0.6);
    } else {
      // Phase 3 (150-252): Bear trend with 2-bar bounces
      const isBounce = (i % 10 === 6 || i % 10 === 7);
      change = isBounce ? 1.5 : -1.5;
    }

    const prevClose = price;
    price += change;
    const open = prevClose;
    let close = price;
    const isSwingPeak = (i < 120 && i % 10 === 5) || (i >= 150 && i % 10 === 7);
    const isSwingTrough = (i < 120 && i % 10 === 7) || (i >= 150 && i % 10 === 5);
    let high = Math.max(open, close) + (isSwingPeak ? 1.0 : 0.4);
    let low = Math.min(open, close) - (isSwingTrough ? 1.0 : 0.4);

    if (i === 135) {
      high += 3.5;
      close = open - 0.5;
    }

    spyBars.push({
      time: curDate.toISOString().slice(0, 10),
      timestamp: curDate.getTime(),
      open,
      high,
      low,
      close,
      volume: 45000000 + (i % 7) * 2000000,
    });
  }

  const result = runPriceActionDetection(spyBars, DEFAULT_PRICE_ACTION_CONFIG);

  assert.equal(result.classifiedBars.length, 252);
  assert.ok(result.swingPivots.length > 5);
  assert.ok(result.trendLegs.length > 0);
  assert.ok(result.setups.length >= 10);

  // Sample up to 20 flagged setups for sanity review (logged, not asserted)
  const sample = result.setups.slice(0, 20);
  console.log(`\n======================================================`);
  console.log(`[SPY 12-Month Daily Simulation] Flagged Setups Sample (${sample.length} of ${result.setups.length}):`);
  console.log(`======================================================`);
  for (let i = 0; i < sample.length; i++) {
    const s = sample[i];
    console.log(
      `#${i + 1} [${s.type}] ${s.direction} | Date: ${s.signalBarDate} | Entry: $${s.entryPrice} | Inval: $${s.invalidationLevel} | Target: $${s.measuredMoveTarget || 'N/A'}`
    );
    console.log(`   Rationale: ${s.rationale}`);
  }
  console.log(`======================================================\n`);
});
