/**
 * Section 1256 Derivatives Tax Engine Verification Test Suite (Node.js Native)
 * ============================================================================
 * Attribution:
 * Ported from MIT-licensed `howard-lynn-ye/Fin-RSI`
 * (`fin_skills/_skills/section-1256-and-derivatives-tax/SKILL.md`,
 * source-verified 2026-09-09 against IRC §1256, IRS Pub 550 (2025),
 * 15 U.S.C. §78c(a)(55), and Rev. Rul. 2026-16).
 *
 * Verifies:
 * 1. IRS Pub 550 (2025) p.57 benchmark: $50k entry -> $57k mark -> $56k sale.
 * 2. Statutory 60/40 split identity and 26.8% blended rate at 37/20 tax rates.
 * 3. Last business day calendar approximation against verified skill values (2022-2025).
 * 4. Multi-year mark-chaining invariant: sum over years == total economic move (no double counting).
 * 5. Strict classification and ETF option ambiguity gate (SPY/QQQ -> "unclear", never "section1256").
 * 6. Regime comparison separating Rate Effect from Timing Effect.
 * 7. Holding-period honesty check (>365 days warning).
 * 8. Loss carryback schedule for net loss years (Form 6781 note).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  classify,
  sixtyForty,
  blendedRate,
  lastBusinessDay,
  recognise1256,
  taxSchedule,
  compareRegimes,
} from '../web/src/utils/section1256.ts';

test('1. IRS Pub 550 p.57 Benchmark & Mark-Chaining Invariant', () => {
  // IRS Pub 550 p.57 Futures Example:
  // In Year 1, buy contract for $50,000.
  // On Dec 31 Year 1, contract is marked-to-market at $57,000 ($7,000 gain).
  // In Year 2, contract is sold for $56,000 ($1,000 loss).
  // Total economic move = $56,000 - $50,000 = $6,000.
  const positions = [
    {
      positionId: 'pub550-futures-1',
      symbol: '/ES',
      entryDate: '2024-05-15',
      entryBasis: 50000,
      closeDate: '2025-04-10',
      closeAmount: 56000,
      yearEndMarks: {
        2024: 57000,
      },
    },
  ];

  const recognised = recognise1256(positions);
  assert.equal(recognised.length, 2, 'Must produce exactly 2 recognized events (2024 MTM, 2025 Close)');

  // Year 1 (2024) MTM event
  const y1 = recognised.find((r) => r.year === 2024);
  assert.ok(y1, 'Year 2024 must exist');
  assert.equal(y1.isYearEndMark, true);
  assert.equal(y1.startReference, 50000);
  assert.equal(y1.endReference, 57000);
  assert.equal(y1.amount, 7000, 'Year 1 recognized gain must be $7,000');
  assert.ok(y1.authority.includes('Pub 550'));

  // Year 2 (2025) Close event
  const y2 = recognised.find((r) => r.year === 2025);
  assert.ok(y2, 'Year 2025 must exist');
  assert.equal(y2.isYearEndMark, false);
  assert.equal(y2.startReference, 57000, 'Year 2 start reference MUST be prior mark ($57,000)');
  assert.equal(y2.endReference, 56000);
  assert.equal(y2.amount, -1000, 'Year 2 recognized loss must be -$1,000');

  // Sum over years invariant
  const totalRecognized = recognised.reduce((sum, r) => sum + r.amount, 0);
  const totalEconomic = positions[0].closeAmount - positions[0].entryBasis;
  assert.equal(totalRecognized, 6000, 'Sum of recognized amounts must be $6,000');
  assert.equal(totalRecognized, totalEconomic, 'Sum of recognized amounts must equal total economic move (no double-counting)');

  // Check 60/40 split on Year 1
  const splitY1 = sixtyForty(y1.amount);
  assert.equal(splitY1.longTerm, 4200, '60% of $7,000 is $4,200');
  assert.equal(splitY1.shortTerm, 2800, '40% of $7,000 is $2,800');
  assert.ok(splitY1.authority.includes('§1256(a)(3)'));
});

test('2. Statutory Blended Rate & 26.8% Identity at 37%/20%', () => {
  // 37% short-term, 20% long-term marginal rates
  // Blended = 0.6 * 20% + 0.4 * 37% = 12% + 14.8% = 26.8% (0.268)
  const rateDec = blendedRate(0.37, 0.20);
  assert.ok(Math.abs(rateDec - 0.268) < 1e-6, `Blended rate should be 0.268, got ${rateDec}`);

  // Normalization when passed as percentages
  const ratePct = blendedRate(37, 20);
  assert.ok(Math.abs(ratePct - 0.268) < 1e-6, `Blended rate with integer percentages should be 0.268, got ${ratePct}`);

  // Alternate user rates (e.g. 32% short, 15% long)
  // Blended = 0.6 * 15% + 0.4 * 32% = 9% + 12.8% = 21.8%
  const rateAlt = blendedRate(0.32, 0.15);
  assert.ok(Math.abs(rateAlt - 0.218) < 1e-6, `Blended rate should be 0.218, got ${rateAlt}`);
});

test('3. Last Business Day Calendar Rule (Weekday Approximation)', () => {
  // Verified skill values:
  // 2022 -> Dec 30 (Dec 31 was Saturday)
  // 2023 -> Dec 29 (Dec 31 was Sunday)
  // 2024 -> Dec 31 (Tuesday)
  // 2025 -> Dec 31 (Wednesday)
  assert.equal(lastBusinessDay(2022), '2022-12-30', '2022 last business day must be Dec 30');
  assert.equal(lastBusinessDay(2023), '2023-12-29', '2023 last business day must be Dec 29');
  assert.equal(lastBusinessDay(2024), '2024-12-31', '2024 last business day must be Dec 31');
  assert.equal(lastBusinessDay(2025), '2025-12-31', '2025 last business day must be Dec 31');
});

test('4. Classification Engine & Strict ETF Ambiguity Gate', () => {
  // Broad-based index options -> section1256
  const spx = classify('SPX');
  assert.equal(spx.regime, 'section1256');
  assert.equal(spx.badgeLabel, '§1256');
  assert.ok(spx.authority.includes('15 U.S.C. §78c(a)(55)'));

  const spxCall = classify('SPX Call');
  assert.equal(spxCall.regime, 'section1256');

  const ndx = classify('NDX');
  assert.equal(ndx.regime, 'section1256');

  const rut = classify('RUT');
  assert.equal(rut.regime, 'section1256');

  const vix = classify('VIX');
  assert.equal(vix.regime, 'section1256');

  // Futures -> section1256
  const esFuture = classify('/ES');
  assert.equal(esFuture.regime, 'section1256');
  assert.ok(esFuture.authority.includes('§1256(b)(1)(A)'));

  // ETF options -> strictly unclear ("Needs review" / stays "Equity option", NEVER section1256)
  const spyCall = classify('SPY Call');
  assert.equal(spyCall.regime, 'unclear', 'SPY Call must return unclear');
  assert.equal(spyCall.badgeLabel, 'Equity option', 'SPY Call defaults to Equity option badge');
  assert.notEqual(spyCall.regime, 'section1256', 'SPY must NEVER be auto-classified as section1256');
  assert.ok(spyCall.authority.includes('Rev. Rul. 2026-16'));

  const spyBare = classify('SPY');
  assert.equal(spyBare.regime, 'unclear');
  assert.equal(spyBare.badgeLabel, 'Equity option');

  const qqqPut = classify('QQQ Put');
  assert.equal(qqqPut.regime, 'unclear');

  const iwm = classify('IWM');
  assert.equal(iwm.regime, 'unclear');

  // Standard single-stock equity options -> equityOption
  const aapl = classify('AAPL');
  assert.equal(aapl.regime, 'equityOption');
  assert.equal(aapl.badgeLabel, 'Equity option');

  const aaplCall = classify('AAPL Call');
  assert.equal(aaplCall.regime, 'equityOption');

  const tsla = classify('TSLA 200P');
  assert.equal(tsla.regime, 'equityOption');

  // Exotic / Unknown -> unclear
  const exotic = classify('CUSTOM_OTC_SWAP');
  assert.equal(exotic.regime, 'unclear');
  assert.equal(exotic.badgeLabel, 'Needs review');
});

test('5. Tax Schedule & Form 6781 Loss Carryback Emission', () => {
  // Gain year: 2024 gain of $10,000 at 37/20 rates (blended 26.8%)
  const gains = [
    {
      year: 2024,
      positionId: 'pos-1',
      symbol: 'SPX',
      startReference: 10000,
      endReference: 20000,
      amount: 10000,
      isYearEndMark: false,
      authority: 'IRC §1256',
    },
  ];
  const schedGain = taxSchedule(gains, 0.37, 0.20);
  assert.equal(schedGain.length, 1);
  assert.equal(schedGain[0].totalRecognized, 10000);
  assert.equal(schedGain[0].longTermAmount, 6000);
  assert.equal(schedGain[0].shortTermAmount, 4000);
  assert.equal(schedGain[0].taxDue, 2680);
  assert.equal(schedGain[0].isNetLoss, false);
  assert.equal(schedGain[0].carrybackEligible, false);

  // Loss year: 2025 net loss of -$5,000 -> triggers carryback note for Form 6781
  const losses = [
    {
      year: 2025,
      positionId: 'pos-2',
      symbol: 'SPX',
      startReference: 15000,
      endReference: 10000,
      amount: -5000,
      isYearEndMark: false,
      authority: 'IRC §1256',
    },
  ];
  const schedLoss = taxSchedule(losses, 0.37, 0.20);
  assert.equal(schedLoss.length, 1);
  assert.equal(schedLoss[0].isNetLoss, true);
  assert.equal(schedLoss[0].carrybackEligible, true);
  assert.ok(schedLoss[0].carrybackNote?.includes('Form 6781'));
  assert.ok(schedLoss[0].carrybackNote?.includes('3-year loss carryback'));
});

test('6. Regime Comparison: Rate Effect vs Timing Effect Separation & Holding Period Honesty', () => {
  // Short-term trade: 60-day SPX strategy with $20,000 economic gain
  // Realized in year 1 with no year-end mark
  const shortBook = [
    {
      positionId: 'spx-condor-1',
      symbol: 'SPX',
      entryDate: '2024-02-01',
      entryBasis: 30000,
      closeDate: '2024-04-01',
      closeAmount: 50000,
    },
  ];

  const resShort = compareRegimes(shortBook, 0.37, 0.20);
  assert.equal(resShort.totalEconomicMove, 20000);
  assert.equal(resShort.section1256Tax, 5360); // 20,000 * 26.8% = 5,360
  assert.equal(resShort.equityOptionTax, 7400); // 20,000 * 37% = 7,400
  assert.equal(resShort.rateEffect, 2040); // 7,400 - 5,360 = 2,040 statutory savings
  assert.equal(resShort.netTaxAlpha, 2040);
  assert.equal(resShort.isHoldingOverYear, false);
  assert.equal(resShort.holdingPeriodWarning, undefined);

  // Long-term trade (> 365 days):
  // Entry: 2023-01-01, Close: 2024-06-01 (517 days)
  // Shows holding-period honesty warning: 60/40 is a blend that loses to the long-term rate!
  const longBook = [
    {
      positionId: 'spx-long-1',
      symbol: 'SPX',
      entryDate: '2023-01-01',
      entryBasis: 100000,
      closeDate: '2024-06-01',
      closeAmount: 150000,
      yearEndMarks: {
        2023: 130000,
      },
    },
  ];

  const resLong = compareRegimes(longBook, 0.37, 0.20);
  assert.equal(resLong.isHoldingOverYear, true);
  assert.ok(resLong.holdingPeriodWarning, 'Must surface holding-period warning when > 365 days');
  assert.ok(resLong.holdingPeriodWarning.includes('beats the short-term rate but loses to the long-term rate'));

  // Disclaimers and authorities present
  assert.ok(resLong.disclaimer.includes('not tax advice'));
  assert.ok(resLong.authority.includes('Pub 550'));
});
