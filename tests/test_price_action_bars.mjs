import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRawBars,
  normalizeBarTime,
  validateBarGeometry,
  normalizeTradierHistory,
  normalizeYahooChart,
} from '../web/src/priceAction/bars.ts';

test('1. Normal bar series: converts clean daily OHLC bars to CanonicalBar format', () => {
  const rawBars = [
    { date: '2024-04-01', open: 170.0, high: 172.5, low: 169.5, close: 172.0, volume: 50000000 },
    { date: '2024-04-02', open: 172.0, high: 174.0, low: 171.0, close: 173.5, volume: 48000000 },
    { date: '2024-04-03', open: 173.5, high: 175.0, low: 172.8, close: 174.2, volume: 42000000 },
    { date: '2024-04-04', open: 174.0, high: 174.8, low: 170.5, close: 171.0, volume: 61000000 },
    { date: '2024-04-05', open: 171.2, high: 173.0, low: 170.8, close: 172.8, volume: 39000000 },
  ];

  const report = normalizeRawBars(rawBars);
  assert.equal(report.isValid, true);
  assert.equal(report.totalInputCount, 5);
  assert.equal(report.validCount, 5);
  assert.equal(report.droppedBadTicksCount, 0);
  assert.equal(report.weekendHolidayGapCount, 0);

  // Check first and last bar formatting
  assert.equal(report.bars[0].time, '2024-04-01');
  assert.equal(report.bars[0].open, 170.0);
  assert.equal(report.bars[0].high, 172.5);
  assert.equal(report.bars[0].low, 169.5);
  assert.equal(report.bars[0].close, 172.0);
  assert.equal(report.bars[0].volume, 50000000);

  assert.equal(report.bars[4].time, '2024-04-05');
  assert.equal(report.bars[4].close, 172.8);
});

test('2. Weekend & holiday gaps: preserves natural gaps and NEVER synthetically interpolates', () => {
  // Friday 2024-04-05 -> Monday 2024-04-08 (weekend gap = 3 calendar days)
  // Monday 2024-04-08 -> Wednesday 2024-04-10 (missing Tuesday holiday gap = 2 calendar days)
  const rawBarsWithGaps = [
    { date: '2024-04-05', open: 170.0, high: 172.0, low: 169.0, close: 171.5, volume: 1000 },
    { date: '2024-04-08', open: 171.5, high: 173.5, low: 170.5, close: 173.0, volume: 1000 },
    { date: '2024-04-10', open: 173.0, high: 175.0, low: 172.0, close: 174.5, volume: 1000 },
  ];

  const report = normalizeRawBars(rawBarsWithGaps);
  assert.equal(report.isValid, true);
  // Total bars must strictly remain 3 — no artificial bars inserted!
  assert.equal(report.bars.length, 3);
  assert.equal(report.weekendHolidayGapCount, 2);
  assert.equal(report.bars[0].time, '2024-04-05');
  assert.equal(report.bars[1].time, '2024-04-08');
  assert.equal(report.bars[2].time, '2024-04-10');
});

test('3. Bad-tick bar rejection: drops impossible geometry (high < low) without crashing', () => {
  const rawBars = [
    { date: '2024-04-01', open: 100.0, high: 105.0, low: 98.0, close: 104.0, volume: 1000 },
    // Bad tick: High (95) < Low (98)
    { date: '2024-04-02', open: 104.0, high: 95.0, low: 98.0, close: 102.0, volume: 1000 },
    // Bad tick: High (103) < Close (106)
    { date: '2024-04-03', open: 102.0, high: 103.0, low: 99.0, close: 106.0, volume: 1000 },
    // Bad tick: Negative price
    { date: '2024-04-04', open: -10.0, high: 105.0, low: 99.0, close: 101.0, volume: 1000 },
    { date: '2024-04-05', open: 102.0, high: 107.0, low: 101.0, close: 106.0, volume: 1000 },
  ];

  // With relaxed maxBadTickPct for test inspection
  const report = normalizeRawBars(rawBars, { maxBadTickPct: 0.8 });
  assert.equal(report.totalInputCount, 5);
  assert.equal(report.droppedBadTicksCount, 3);
  assert.equal(report.validCount, 2);
  assert.equal(report.bars.length, 2);
  assert.equal(report.bars[0].time, '2024-04-01');
  assert.equal(report.bars[1].time, '2024-04-05');
  assert.equal(report.issues.length >= 3, true);
});

test('4. Bad-tick threshold guard: invalidates series when bad ticks exceed maxBadTickPct', () => {
  const rawBars = [
    { date: '2024-04-01', open: 100.0, high: 105.0, low: 98.0, close: 104.0, volume: 1000 },
    // 1 bad tick out of 2 bars = 50% bad tick ratio (exceeds default 2%)
    { date: '2024-04-02', open: 104.0, high: 90.0, low: 98.0, close: 102.0, volume: 1000 },
  ];

  const report = normalizeRawBars(rawBars); // default maxBadTickPct is 0.02
  assert.equal(report.isValid, false);
  assert.equal(report.droppedBadTicksCount, 1);
  assert.ok(report.issues.some((issue) => issue.includes('exceeded maximum allowed')));
});

test('5. Deduplication and sorting: out-of-order bars are sorted and duplicate timestamps merged', () => {
  const rawBars = [
    { date: '2024-04-03', open: 102.0, high: 106.0, low: 101.0, close: 105.0, volume: 1000 },
    { date: '2024-04-01', open: 100.0, high: 103.0, low: 99.0, close: 102.0, volume: 1000 },
    // Duplicate 2024-04-01 with updated final volume
    { date: '2024-04-01', open: 100.0, high: 103.0, low: 99.0, close: 102.0, volume: 2500 },
    { date: '2024-04-02', open: 102.0, high: 104.0, low: 100.0, close: 103.0, volume: 1200 },
  ];

  const report = normalizeRawBars(rawBars);
  assert.equal(report.isValid, true);
  assert.equal(report.validCount, 3);
  assert.equal(report.deduplicatedCount, 1);
  assert.equal(report.bars[0].time, '2024-04-01');
  assert.equal(report.bars[0].volume, 2500); // Updated duplicate retained
  assert.equal(report.bars[1].time, '2024-04-02');
  assert.equal(report.bars[2].time, '2024-04-03');
});

test('6. Tradier history adapter: correctly maps { history: { day: [...] } } payload', () => {
  const tradierData = {
    history: {
      day: [
        { date: '2024-04-01', open: 170.5, high: 172.0, low: 169.8, close: 171.2, volume: 45000000 },
        { date: '2024-04-02', open: 171.2, high: 173.8, low: 170.5, close: 173.4, volume: 42000000 },
      ],
    },
  };

  const report = normalizeTradierHistory(tradierData);
  assert.equal(report.isValid, true);
  assert.equal(report.validCount, 2);
  assert.equal(report.bars[0].time, '2024-04-01');
  assert.equal(report.bars[0].close, 171.2);
  assert.equal(report.bars[1].time, '2024-04-02');
  assert.equal(report.bars[1].close, 173.4);
});

test('7. Yahoo Finance chart adapter: correctly maps parallel arrays in { chart: { result: [...] } }', () => {
  const yahooData = {
    chart: {
      result: [
        {
          timestamp: [1711929600, 1712016000], // 2024-04-01, 2024-04-02 in seconds
          indicators: {
            quote: [
              {
                open: [170.5, 171.2],
                high: [172.0, 173.8],
                low: [169.8, 170.5],
                close: [171.2, 173.4],
                volume: [45000000, 42000000],
              },
            ],
          },
        },
      ],
    },
  };

  const report = normalizeYahooChart(yahooData);
  assert.equal(report.isValid, true);
  assert.equal(report.validCount, 2);
  assert.equal(report.bars[0].open, 170.5);
  assert.equal(report.bars[0].high, 172.0);
  assert.equal(report.bars[0].close, 171.2);
  assert.equal(report.bars[1].close, 173.4);
});

test('8. Flat bar policy: handles zero-spread bars per configuration', () => {
  const flatBar = { date: '2024-04-01', open: 50.0, high: 50.0, low: 50.0, close: 50.0, volume: 0 };

  // By default, flat bars are allowed
  const reportDefault = normalizeRawBars([flatBar]);
  assert.equal(reportDefault.isValid, true);
  assert.equal(reportDefault.validCount, 1);

  // When rejected by policy
  const reportDisallowed = normalizeRawBars([flatBar], { allowFlatBars: false });
  assert.equal(reportDisallowed.droppedBadTicksCount, 1);
});
