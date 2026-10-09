/**
 * Section 1092 Tax Straddle Engine Verification Test Suite (Node.js Native)
 * =========================================================================
 * Attribution:
 * Ported from MIT-licensed `net_alpha` (https://github.com/chen-star/net_alpha, PyPI `wash-alpha`),
 * straddles module and confidence taxonomy (Confirmed / Probable / Unclear),
 * source-verified 2026-10 against:
 *  - IRC §1092 (Straddles, Loss Deferral, Identified Straddles)
 *  - IRC §1092(c)(4) & Treas. Reg. §1.1092(c)-1 through -4 (Qualified Covered Calls)
 *  - Temp. Treas. Reg. §1.1092(b)-1T & §1.1092(b)-2T (Holding Period & Loss Character)
 *  - IRS Publication 550 (2025/2026), Chapter 4 (Straddles, QCC Table 4-3, Form 6781 Part II)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  testQualifiedCoveredCall,
  calculateLowestQualifiedBenchmark,
  computeDeferredLoss,
  tollHoldingPeriod,
  netIdentifiedStraddle,
  detectStraddles,
} from '../web/src/utils/section1092.ts';

// ---------------------------------------------------------------------------
// 1. CANONICAL CASE TESTS
// ---------------------------------------------------------------------------

test('1. Deep-ITM short call vs stock -> fails QCC on moneyness prong, detected as straddle', () => {
  // Fact Pattern:
  // Stock price = $240. Short call strike = $210 (deep in the money).
  // Available standard strikes: 200, 210, 220, 230, 235, 240, 250.
  // Highest strike < 240 is 235. Lowest Qualified Benchmark (LQB) = 230 or 235.
  // Strike 210 is far below LQB.
  const callPos = {
    id: 'c-tsla-ditm',
    underlying: 'TSLA',
    kind: 'call',
    side: 'short',
    strike: 210,
    expiry: '2026-11-20', // ~42 DTE (> 30d)
    openedAt: '2026-10-09',
    quantity: 1,
  };

  const qcc = testQualifiedCoveredCall(callPos, 240, '2026-10-09', [200, 210, 220, 230, 235, 240, 250]);
  assert.strictEqual(qcc.isQualified, false, 'Deep-ITM call must fail QCC');
  assert.ok(
    qcc.reasons.some((r) => r.includes('Lowest Qualified Benchmark')),
    'Must cite failure of Lowest Qualified Benchmark prong'
  );
  assert.strictEqual(qcc.holdingPeriodEffect, 'resets_to_zero', 'Non-qualified covered call holding period resets to zero');

  // Verify full straddle detection
  const stockPos = {
    id: 's-tsla',
    underlying: 'TSLA',
    kind: 'stock',
    side: 'long',
    openedAt: '2026-06-01',
    quantity: 100,
    currentPrice: 240,
  };

  const detected = detectStraddles([stockPos, callPos]);
  assert.strictEqual(detected.length, 1);
  assert.strictEqual(detected[0].kind, 'covered-call');
  assert.strictEqual(detected[0].confidence, 'Confirmed');
  assert.strictEqual(detected[0].status, 'candidate', 'Must be candidate, never auto-confirmed');
  assert.strictEqual(detected[0].qcc?.isQualified, false);
});

test('2. 25-DTE short call vs stock -> fails QCC on 30-day term prong, weekly options straddle', () => {
  // Fact Pattern:
  // Stock price = $150. Short call strike = $155 (OTM).
  // Expiry is 25 days out (e.g. granted Oct 9, expires Nov 3).
  // Fails §1092(c)(4)(B)(i) requiring grant >30 days before expiration.
  const callPos = {
    id: 'c-nvda-weekly',
    underlying: 'NVDA',
    kind: 'call',
    side: 'short',
    strike: 155,
    expiry: '2026-11-03', // exactly 25 DTE
    openedAt: '2026-10-09',
    quantity: 1,
  };

  const qcc = testQualifiedCoveredCall(callPos, 150, '2026-10-09');
  assert.strictEqual(qcc.isQualified, false, 'Weekly/short DTE call must fail QCC');
  assert.strictEqual(qcc.dte, 25);
  assert.ok(
    qcc.reasons.some((r) => r.includes('30 DTE') || r.includes('≤ 30')),
    'Must cite term to expiration ≤ 30 days'
  );
});

test('3. 45-DTE slightly-OTM short call vs stock -> passes QCC, exempt from §1092', () => {
  // Fact Pattern:
  // Stock price = $220. Short call strike = $230 (OTM).
  // Granted Oct 9, expires Nov 23 (45 DTE > 30).
  // Strike 230 >= LQB (215/217.5).
  // Passes all prongs -> QCC Safe Harbor.
  const callPos = {
    id: 'c-aapl-qcc',
    underlying: 'AAPL',
    kind: 'call',
    side: 'short',
    strike: 230,
    expiry: '2026-11-23', // 45 DTE
    openedAt: '2026-10-09',
    quantity: 1,
  };

  const qcc = testQualifiedCoveredCall(callPos, 220, '2026-10-09', [200, 210, 215, 220, 225, 230, 235]);
  assert.strictEqual(qcc.isQualified, true, '45 DTE OTM call must pass QCC');
  assert.strictEqual(qcc.holdingPeriodEffect, 'continues', 'OTM QCC holding period continues to run');
  assert.ok(qcc.authority.includes('Qualified Covered Call Exemption'));
});

test('4. Married put (stock + long put) -> detected with Confirmed / Probable confidence', () => {
  // Fact Pattern:
  // Stock bought and put bought on same day -> Married put under §1233(c) & §1092(c)(2).
  const stockPos = {
    id: 's-amd',
    underlying: 'AMD',
    kind: 'stock',
    side: 'long',
    openedAt: '2026-08-15',
    quantity: 100,
    currentPrice: 160,
  };
  const putPos = {
    id: 'p-amd',
    underlying: 'AMD',
    kind: 'put',
    side: 'long',
    strike: 150,
    expiry: '2026-11-20',
    openedAt: '2026-08-15', // same day
    quantity: 1,
  };

  const detected = detectStraddles([stockPos, putPos]);
  assert.strictEqual(detected.length, 1);
  assert.strictEqual(detected[0].kind, 'married-put');
  assert.strictEqual(detected[0].confidence, 'Confirmed');
  assert.strictEqual(detected[0].status, 'candidate');
  assert.ok(detected[0].authority.includes('Married Put'));
});

test('5. Long straddle vs long strangle -> distinguished by strike relationship', () => {
  // Same strike -> literal-straddle
  const straddleCalls = [
    {
      id: 'c-amzn-straddle',
      underlying: 'AMZN',
      kind: 'call',
      side: 'long',
      strike: 190,
      expiry: '2026-11-20',
      openedAt: '2026-10-01',
      quantity: 1,
    },
    {
      id: 'p-amzn-straddle',
      underlying: 'AMZN',
      kind: 'put',
      side: 'long',
      strike: 190, // same strike!
      expiry: '2026-11-20',
      openedAt: '2026-10-01',
      quantity: 1,
    },
  ];
  const detectedStraddle = detectStraddles(straddleCalls);
  assert.strictEqual(detectedStraddle[0].kind, 'literal-straddle');

  // Different strike -> strangle
  const strangleCalls = [
    {
      id: 'c-amzn-strangle',
      underlying: 'AMZN',
      kind: 'call',
      side: 'long',
      strike: 200,
      expiry: '2026-11-20',
      openedAt: '2026-10-01',
      quantity: 1,
    },
    {
      id: 'p-amzn-strangle',
      underlying: 'AMZN',
      kind: 'put',
      side: 'long',
      strike: 180, // different strike!
      expiry: '2026-11-20',
      openedAt: '2026-10-01',
      quantity: 1,
    },
  ];
  const detectedStrangle = detectStraddles(strangleCalls);
  assert.strictEqual(detectedStrangle[0].kind, 'strangle');
});

test('6. Vertical spreads (bull call spread) -> detected as offsetting positions', () => {
  // Long 140 Call + Short 150 Call, same expiry
  const spreadPositions = [
    {
      id: 'c-pltr-long',
      underlying: 'PLTR',
      kind: 'call',
      side: 'long',
      strike: 140,
      expiry: '2026-11-20',
      openedAt: '2026-10-01',
      quantity: 5,
    },
    {
      id: 'c-pltr-short',
      underlying: 'PLTR',
      kind: 'call',
      side: 'short',
      strike: 150,
      expiry: '2026-11-20',
      openedAt: '2026-10-01',
      quantity: 5,
    },
  ];

  const detected = detectStraddles(spreadPositions);
  assert.strictEqual(detected.length, 1);
  assert.strictEqual(detected[0].kind, 'vertical-spread');
  assert.strictEqual(detected[0].confidence, 'Confirmed');
});

test('7. Unrelated positions guard -> far-dated entries labeled Unclear, never auto-confirmed', () => {
  // Stock opened in January 2026, Put opened in October 2026 (>90 days apart)
  const unrelated = [
    {
      id: 's-meta-old',
      underlying: 'META',
      kind: 'stock',
      side: 'long',
      openedAt: '2026-01-10',
      quantity: 100,
      currentPrice: 580,
    },
    {
      id: 'p-meta-new',
      underlying: 'META',
      kind: 'put',
      side: 'long',
      strike: 500,
      expiry: '2026-11-20',
      openedAt: '2026-10-01', // >260 days later
      quantity: 1,
    },
  ];

  const detected = detectStraddles(unrelated);
  assert.strictEqual(detected.length, 1);
  assert.strictEqual(detected[0].confidence, 'Unclear', 'Far-dated positions must have Unclear confidence');
  assert.strictEqual(detected[0].status, 'candidate', 'Must stay candidate, never auto-confirmed');
});

// ---------------------------------------------------------------------------
// 2. MATHEMATICAL ARITHMETIC TESTS
// ---------------------------------------------------------------------------

test('8. Loss deferral arithmetic (§1092(a)(1)): $10,000 loss vs $6,000 gain -> $4,000 deductible, $6,000 deferred', () => {
  // Fact Pattern:
  // Leg A closed at realized loss = $10,000
  // Leg B open with unrecognized gain = $6,000
  // Under §1092(a)(1): deductible = max(0, 10000 - 6000) = $4,000
  // Deferred = 10000 - 4000 = $6,000
  const result = computeDeferredLoss(10000, [6000], 2026);
  assert.strictEqual(result.realizedLoss, 10000);
  assert.strictEqual(result.totalUnrecognizedGains, 6000);
  assert.strictEqual(result.deductible, 4000);
  assert.strictEqual(result.deferred, 6000);
  assert.strictEqual(result.carryforwardYear, 2027);

  // If unrecognized gain exceeds loss: $10,000 loss vs $12,000 gain -> $0 deductible, $10,000 deferred
  const resultFullDefer = computeDeferredLoss(10000, [12000], 2026);
  assert.strictEqual(resultFullDefer.deductible, 0);
  assert.strictEqual(resultFullDefer.deferred, 10000);
});

test('9. Holding-period tolling arithmetic: suspended window vs reset-to-zero', () => {
  // Fact Pattern A (In-The-Money QCC):
  // Stock opened 2026-01-01, call written 2026-06-01, expires 2026-08-01 (61 days window)
  // Calendar days = 212. Suspended days = 61. Adjusted days = 212 - 61 = 151 days.
  const itmQccTolling = tollHoldingPeriod('2026-01-01', '2026-06-01', '2026-08-01', true, false);
  assert.strictEqual(itmQccTolling.resetsToZero, false);
  assert.strictEqual(itmQccTolling.suspendedDays, 61);
  assert.strictEqual(itmQccTolling.adjustedDays, 212 - 61);

  // Fact Pattern B (Non-Qualified Straddle entered while held <= 1 year):
  // Stock held 150 days, enters non-QCC straddle -> holding period terminated, resets to 0.
  const nonQccTolling = tollHoldingPeriod('2026-01-01', '2026-06-01', '2026-08-01', false, true);
  assert.strictEqual(nonQccTolling.resetsToZero, true);
  assert.strictEqual(nonQccTolling.adjustedDays, 0);
  assert.strictEqual(nonQccTolling.isLongTerm, false);

  // Fact Pattern C (Pre-existing long-term position held > 365 days before straddle):
  // Stock opened 2024-01-01, straddle entered 2026-01-01 (>700 days).
  // Long-term status preserved.
  const preLongTerm = tollHoldingPeriod('2024-01-01', '2026-01-01', '2026-03-01', false, true);
  assert.strictEqual(preLongTerm.resetsToZero, false);
  assert.strictEqual(preLongTerm.isLongTerm, true);
});

test('10. Identified straddle netting (§1092(a)(2)): basis capitalization vs full liquidation', () => {
  // Fact Pattern A: Partially closed straddle (Leg 1 closed at -$3,000 loss, Leg 2 still open)
  // General loss deferral does NOT apply. Loss is capitalized into remaining basis ($3,000). $0 deductible now.
  const partial = netIdentifiedStraddle([
    { id: 'leg-1', realizedPnl: -3000, isClosed: true },
    { id: 'leg-2', realizedPnl: 0, isClosed: false },
  ]);
  assert.strictEqual(partial.isFullyLiquidated, false);
  assert.strictEqual(partial.netDeductible, 0);
  assert.strictEqual(partial.basisAdjustment, 3000);

  // Fact Pattern B: Fully liquidated identified straddle (Leg 1 closed -$3,000, Leg 2 closed +$1,000)
  // Net realized loss = -$2,000 recognized upon full liquidation.
  const fullyClosed = netIdentifiedStraddle([
    { id: 'leg-1', realizedPnl: -3000, isClosed: true },
    { id: 'leg-2', realizedPnl: 1000, isClosed: true },
  ]);
  assert.strictEqual(fullyClosed.isFullyLiquidated, true);
  assert.strictEqual(fullyClosed.netRealizedPnl, -2000);
  assert.strictEqual(fullyClosed.netDeductible, 2000);
  assert.strictEqual(fullyClosed.basisAdjustment, 0);
});

// ---------------------------------------------------------------------------
// 3. MIXED STRADDLE & REGRESSION GREP GATES
// ---------------------------------------------------------------------------

test('11. Mixed Straddle Guard: §1256 leg (SPX) triggers CPA review warning, blocks auto-math', () => {
  const spxLegs = [
    {
      id: 'c-spx',
      underlying: 'SPX',
      kind: 'call',
      side: 'long',
      strike: 5800,
      expiry: '2026-11-20',
      openedAt: '2026-10-01',
      quantity: 1,
    },
    {
      id: 'p-spx',
      underlying: 'SPX',
      kind: 'put',
      side: 'long',
      strike: 5800,
      expiry: '2026-11-20',
      openedAt: '2026-10-01',
      quantity: 1,
    },
  ];

  const detected = detectStraddles(spxLegs);
  assert.strictEqual(detected.length, 1);
  assert.strictEqual(detected[0].isMixedStraddle, true, 'SPX straddle must be flagged as Mixed Straddle');
  assert.ok(
    detected[0].mixedStraddleWarning?.includes('CPA review required'),
    'Must include CPA review warning'
  );
});

test('12. CI Grep Gate: Section 1092 tax files must include mandatory "not tax advice" disclaimers', () => {
  const rootDir = fileURLToPath(new URL('..', import.meta.url));
  const s1092Path = `${rootDir}/web/src/utils/section1092.ts`;
  const s1092PanelPath = `${rootDir}/web/src/components/tax/Section1092StraddlePanel.tsx`;

  assert.ok(fs.existsSync(s1092Path), 'section1092.ts must exist');
  assert.ok(fs.existsSync(s1092PanelPath), 'Section1092StraddlePanel.tsx must exist');

  const s1092Content = fs.readFileSync(s1092Path, 'utf-8');
  assert.ok(
    s1092Content.includes('NOT tax advice') || s1092Content.includes('not tax advice'),
    'section1092.ts must contain disclaimer'
  );
  assert.ok(
    s1092Content.includes('net_alpha'),
    'section1092.ts must include MIT attribution to net_alpha'
  );

  const panelContent = fs.readFileSync(s1092PanelPath, 'utf-8');
  assert.ok(
    panelContent.includes('NOT tax advice') || panelContent.includes('NOT Tax Advice'),
    'Section1092StraddlePanel.tsx must contain disclaimer'
  );
  assert.ok(
    panelContent.includes('net_alpha'),
    'Section1092StraddlePanel.tsx must include MIT attribution to net_alpha'
  );
});
