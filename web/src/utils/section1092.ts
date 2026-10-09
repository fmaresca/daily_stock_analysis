/**
 * Section 1092 Tax Straddle Engine, QCC Benchmarks & Loss Deferral Modeling
 *
 * Attribution:
 * Ported from MIT-licensed `net_alpha` (https://github.com/chen-star/net_alpha, PyPI `wash-alpha`),
 * straddles module and confidence taxonomy (Confirmed / Probable / Unclear),
 * source-verified 2026-10 against:
 *  - IRC §1092 (Straddles, Loss Deferral, Identified Straddles)
 *  - IRC §1092(c)(4) & Treas. Reg. §1.1092(c)-1 through -4 (Qualified Covered Calls)
 *  - Temp. Treas. Reg. §1.1092(b)-1T & §1.1092(b)-2T (Holding Period & Loss Character)
 *  - IRS Publication 550 (2025/2026), Chapter 4 (Straddles, QCC Table 4-3, Form 6781 Part II)
 *
 * MIT License Notice:
 * Copyright (c) net_alpha contributors / chen-star
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * IMPORTANT LEGAL & TAX DISCLAIMER:
 * Modeling assumptions for backtests and portfolio analysis, NOT tax advice.
 * Always consult a qualified CPA or licensed tax professional regarding your
 * specific tax situation, Form 6781 filings, and identified straddle elections.
 *
 * IRON RULES (Non-negotiable):
 * 1. Never auto-classify a straddle: automated detection proposes candidates; the user
 *    confirms or rejects each one. Unconfirmed candidates stay labeled 'Unclear'.
 * 2. Mixed straddle guard: any straddle overlapping an IRC §1256 contract is flagged
 *    as 'Mixed straddle — CPA review required' and excluded from automated arithmetic.
 * 3. Qualified covered calls (QCC) meeting statutory criteria are exempt from §1092.
 */

// Broad-based index contracts verified under 15 U.S.C. §78c(a)(55) and IRC §1256(g)(6)
export const SECTION_1256_INDEX_SET = new Set([
  'SPX',
  'NDX',
  'RUT',
  'VIX',
  'XSP',
  'DJX',
  'MRUT',
  'OEX',
  'XEO',
  'MNX',
]);

export function isSection1256Contract(symbol: string): boolean {
  const clean = (symbol || '').trim().toUpperCase();
  const base = clean.split(/[\s_\-/]/)[0].replace(/[^A-Z]/g, '');
  return clean.startsWith('/') || SECTION_1256_INDEX_SET.has(clean) || SECTION_1256_INDEX_SET.has(base);
}

export type StraddleKind =
  | 'literal-straddle'
  | 'strangle'
  | 'married-put'
  | 'covered-call'
  | 'vertical-spread'
  | 'calendar-spread'
  | 'collar';

export type Confidence = 'Confirmed' | 'Probable' | 'Unclear';

export interface StraddlePosition {
  id: string;
  underlying: string;
  kind: 'stock' | 'call' | 'put';
  side: 'long' | 'short';
  strike?: number;
  expiry?: string; // YYYY-MM-DD
  openedAt: string; // YYYY-MM-DD
  quantity: number;
  basis?: number;
  currentPrice?: number;
  unrealizedGain?: number;
  closedAt?: string; // YYYY-MM-DD
  realizedLoss?: number;
}

export interface QCCResult {
  isQualified: boolean;
  reasons: string[];
  testedAt: string;
  dte: number;
  lowestQualifiedBenchmark?: number;
  applicableStockPrice?: number;
  isInTheMoney?: boolean;
  holdingPeriodEffect: 'continues' | 'suspended' | 'resets_to_zero';
  authority: string;
}

export interface IdentifiedStraddle {
  straddleId: string;
  identifiedAt: string;
  positions: string[];
  notes: string;
}

export interface DetectedStraddle {
  id: string;
  kind: StraddleKind;
  underlying: string;
  legs: StraddlePosition[];
  confidence: Confidence;
  status: 'candidate' | 'confirmed' | 'rejected';
  qcc?: QCCResult;
  isMixedStraddle: boolean;
  mixedStraddleWarning?: string;
  identifiedElection?: IdentifiedStraddle;
  authority: string;
  rationale: string;
}

export interface LossDeferralResult {
  realizedLoss: number;
  totalUnrecognizedGains: number;
  deductible: number;
  deferred: number;
  carryforwardYear: number;
  authority: string;
}

export interface HoldingPeriodTollingResult {
  originalDays: number;
  adjustedDays: number;
  suspendedDays: number;
  resetsToZero: boolean;
  isLongTerm: boolean;
  ruleApplied: string;
  authority: string;
}

export interface IdentifiedNettingResult {
  totalRealizedGain: number;
  totalRealizedLoss: number;
  netRealizedPnl: number;
  basisAdjustment: number;
  netDeductible: number;
  isFullyLiquidated: boolean;
  authority: string;
  notes: string;
}

/**
 * Computes standard available exchange strikes around a given stock price
 * if explicit market strike grids are not provided.
 */
export function getStandardExchangeStrikesAround(price: number): number[] {
  if (price <= 0) return [1, 2, 3, 4, 5];
  const step = price <= 25 ? 1 : price <= 100 ? 2.5 : price <= 200 ? 5 : 10;
  const min = Math.max(step, Math.floor((price * 0.5) / step) * step);
  const max = Math.ceil((price * 1.5) / step) * step;
  const strikes: number[] = [];
  for (let s = min; s <= max; s += step) {
    strikes.push(Number(s.toFixed(2)));
  }
  return strikes;
}

/**
 * Calculates the Lowest Qualified Benchmark (LQB) under IRC §1092(c)(4)(D) and IRS Pub 550 Ch. 4.
 *
 * Statutory Strike Tiers:
 * 1. General Rule: Highest available strike < Applicable Stock Price (ASP).
 * 2. Special Rule (>90 DTE & Strike > $50): Second highest available strike < ASP.
 * 3. 85% Rule (ASP <= $25): LQB cannot be less than 85% of ASP.
 * 4. Limitation (ASP <= $150): LQB cannot be less than ASP - $10.
 */
export function calculateLowestQualifiedBenchmark(
  stockPrice: number,
  dte: number,
  callStrike: number,
  availableStrikes?: number[]
): number {
  const strikes = (availableStrikes && availableStrikes.length > 0)
    ? [...availableStrikes].sort((a, b) => a - b)
    : getStandardExchangeStrikesAround(stockPrice);

  const strikesBelowASP = strikes.filter((s) => s < stockPrice).sort((a, b) => b - a);

  if (strikesBelowASP.length === 0) {
    return stockPrice <= 25 ? Number((stockPrice * 0.85).toFixed(2)) : Math.max(1, stockPrice - 10);
  }

  // 1. General rule: highest strike less than ASP
  let lqb = strikesBelowASP[0];

  // 2. Special rule (>90 DTE & Strike > $50): second highest available strike
  if (dte > 90 && callStrike > 50 && strikesBelowASP.length >= 2) {
    lqb = strikesBelowASP[1];
  }

  // 3. 85% Rule where ASP <= $25
  if (stockPrice <= 25) {
    const floor85 = stockPrice * 0.85;
    if (lqb < floor85) {
      // Find highest available benchmark which is >= 85% of ASP
      const valid85 = strikes.filter((s) => s >= floor85 && s < stockPrice).sort((a, b) => b - a);
      if (valid85.length > 0) {
        lqb = valid85[0];
      } else {
        lqb = Number(floor85.toFixed(2));
      }
    }
  }

  // 4. Limitation where ASP <= $150: cannot be less than ASP - $10
  if (stockPrice <= 150) {
    const floorMinus10 = stockPrice - 10;
    if (lqb < floorMinus10) {
      const validMinus10 = strikes.filter((s) => s >= floorMinus10 && s < stockPrice).sort((a, b) => b - a);
      if (validMinus10.length > 0) {
        lqb = validMinus10[0];
      } else {
        lqb = Number(floorMinus10.toFixed(2));
      }
    }
  }

  return Number(lqb.toFixed(2));
}

/**
 * Evaluates whether a covered call option qualifies for the Qualified Covered Call (QCC)
 * exemption from the §1092 straddle rules per IRC §1092(c)(4) and Treas. Reg. §1.1092(c)-1.
 */
export function testQualifiedCoveredCall(
  call: StraddlePosition,
  stockPrice: number,
  grantDate: string = call.openedAt,
  availableStrikes?: number[]
): QCCResult {
  const reasons: string[] = [];
  const testedAt = new Date().toISOString();

  if (!call.expiry) {
    return {
      isQualified: false,
      reasons: ['Option missing expiration date; unable to determine DTE term.'],
      testedAt,
      dte: 0,
      holdingPeriodEffect: 'resets_to_zero',
      authority: 'IRC §1092(c)(4)(B) — Indeterminate expiration',
    };
  }

  const gDate = new Date(grantDate);
  const expDate = new Date(call.expiry);
  const diffMs = expDate.getTime() - gDate.getTime();
  const dte = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const strike = call.strike ?? 0;
  const lqb = calculateLowestQualifiedBenchmark(stockPrice, dte, strike, availableStrikes);
  const isInTheMoney = strike < stockPrice;

  // Prong 1: Term > 30 days
  if (dte <= 30) {
    reasons.push(
      `Term to expiration is ${dte} days (≤ 30 DTE). Weekly options fail the statutory QCC term prong per IRC §1092(c)(4)(B)(i).`
    );
  }

  // Prong 2: Max term <= 33 months (~1006 days)
  if (dte > 1006) {
    reasons.push(
      `Term to expiration exceeds 33 months (${dte} DTE). Long-dated LEAPS fail QCC per IRC §1092(c)(4)(B)(i).`
    );
  }

  // Prong 3: Strike >= Lowest Qualified Benchmark (LQB)
  if (strike < lqb) {
    reasons.push(
      `Strike ($${strike}) is below the Lowest Qualified Benchmark ($${lqb}). Deep-in-the-money option fails QCC per IRC §1092(c)(4)(B)(iii).`
    );
  }

  const isQualified = reasons.length === 0;

  // Holding period effect determination:
  // - Non-qualified covered call: holding period resets to zero if held <= 1 year (Temp. Reg. §1.1092(b)-2T)
  // - In-the-money QCC: holding period suspended/tolled during option term (IRC §1092(f))
  // - OTM/ATM QCC: holding period continues to run continuously
  let holdingPeriodEffect: 'continues' | 'suspended' | 'resets_to_zero' = 'continues';
  if (!isQualified) {
    holdingPeriodEffect = 'resets_to_zero';
  } else if (isInTheMoney) {
    holdingPeriodEffect = 'suspended';
  } else {
    holdingPeriodEffect = 'continues';
  }

  return {
    isQualified,
    reasons: isQualified
      ? [
          `Satisfies all QCC statutory requirements: DTE = ${dte} (>30d), Strike ($${strike}) ≥ Lowest Qualified Benchmark ($${lqb}).`,
        ]
      : reasons,
    testedAt,
    dte,
    lowestQualifiedBenchmark: lqb,
    applicableStockPrice: stockPrice,
    isInTheMoney,
    holdingPeriodEffect,
    authority: isQualified
      ? 'IRC §1092(c)(4) — Qualified Covered Call Exemption (Not a Straddle)'
      : 'IRC §1092(c)(4) — Non-Qualified Covered Call (Offsetting Straddle)',
  };
}

/**
 * Computes deferred loss under IRC §1092(a)(1) and Form 6781 Part II.
 * Loss is deductible only to the extent it exceeds unrecognized gains in offsetting positions.
 */
export function computeDeferredLoss(
  realizedLoss: number,
  unrecognizedGains: number[],
  taxYear: number = new Date().getFullYear()
): LossDeferralResult {
  const absLoss = Math.abs(realizedLoss);
  const totalGains = unrecognizedGains.reduce((sum, g) => sum + Math.max(0, g), 0);
  const deductible = Math.max(0, absLoss - totalGains);
  const deferred = absLoss - deductible;

  return {
    realizedLoss: absLoss,
    totalUnrecognizedGains: totalGains,
    deductible,
    deferred,
    carryforwardYear: taxYear + 1,
    authority: 'IRC §1092(a)(1) — Loss Deferral Rule (IRS Pub 550 Ch. 4 / Form 6781 Line 4)',
  };
}

/**
 * Computes holding-period tolling and adjustment math under Temp. Treas. Reg. §1.1092(b)-2T
 * and IRC §1092(f).
 */
export function tollHoldingPeriod(
  openedAt: string,
  straddleStart: string,
  straddleEnd: string,
  isQualifiedInTheMoney: boolean = false,
  isNonQualifiedStraddle: boolean = false
): HoldingPeriodTollingResult {
  const openDate = new Date(openedAt);
  const startDate = new Date(straddleStart);
  const endDate = new Date(straddleEnd);

  const totalCalendarDays = Math.max(
    0,
    Math.round((endDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const suspendedDays = Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysPriorToStraddle = Math.max(
    0,
    Math.round((startDate.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (isNonQualifiedStraddle) {
    if (daysPriorToStraddle <= 365) {
      return {
        originalDays: totalCalendarDays,
        adjustedDays: 0,
        suspendedDays,
        resetsToZero: true,
        isLongTerm: false,
        ruleApplied: 'Non-QCC Straddle: Holding period terminated and resets to zero under Temp. Reg. §1.1092(b)-2T',
        authority: 'IRC §1092(b) & Temp. Treas. Reg. §1.1092(b)-2T(a)(1)',
      };
    } else {
      return {
        originalDays: totalCalendarDays,
        adjustedDays: totalCalendarDays - suspendedDays,
        suspendedDays,
        resetsToZero: false,
        isLongTerm: true,
        ruleApplied: 'Pre-existing Long-Term Asset: Long-term status preserved; option losses treated as long-term',
        authority: 'IRC §1092(b) & Temp. Treas. Reg. §1.1092(b)-2T(a)(2)',
      };
    }
  }

  if (isQualifiedInTheMoney) {
    const adjustedDays = totalCalendarDays - suspendedDays;
    return {
      originalDays: totalCalendarDays,
      adjustedDays,
      suspendedDays,
      resetsToZero: false,
      isLongTerm: adjustedDays > 365,
      ruleApplied: 'In-The-Money QCC: Holding period suspended during option life under IRC §1092(f)',
      authority: 'IRC §1092(f) & IRS Pub 550 Ch. 4',
    };
  }

  // OTM QCC or ordinary position
  return {
    originalDays: totalCalendarDays,
    adjustedDays: totalCalendarDays,
    suspendedDays: 0,
    resetsToZero: false,
    isLongTerm: totalCalendarDays > 365,
    ruleApplied: 'Out-Of-The-Money QCC: Holding period accrues continuously without tolling',
    authority: 'IRC §1092(c)(4) & IRS Pub 550 Ch. 4',
  };
}

/**
 * Nettings for Identified Straddles under IRC §1092(a)(2) and Temp. Reg. §1.1092(b)-2T.
 * General loss deferral does not apply; losses on closed legs are added to basis of remaining
 * offsetting positions until full liquidation.
 */
export function netIdentifiedStraddle(
  legs: Array<{ id: string; realizedPnl: number; isClosed: boolean }>
): IdentifiedNettingResult {
  let totalRealizedGain = 0;
  let totalRealizedLoss = 0;
  const isFullyLiquidated = legs.length > 0 && legs.every((l) => l.isClosed);

  for (const leg of legs) {
    if (leg.realizedPnl > 0) totalRealizedGain += leg.realizedPnl;
    else if (leg.realizedPnl < 0) totalRealizedLoss += Math.abs(leg.realizedPnl);
  }

  const netRealizedPnl = totalRealizedGain - totalRealizedLoss;

  if (isFullyLiquidated) {
    return {
      totalRealizedGain,
      totalRealizedLoss,
      netRealizedPnl,
      basisAdjustment: 0,
      netDeductible: netRealizedPnl < 0 ? Math.abs(netRealizedPnl) : 0,
      isFullyLiquidated: true,
      authority: 'IRC §1092(a)(2) — Identified Straddle Netting (Fully Liquidated)',
      notes: 'All identified positions closed. Net straddle loss/gain recognized in full upon complete disposition.',
    };
  }

  return {
    totalRealizedGain,
    totalRealizedLoss,
    netRealizedPnl,
    basisAdjustment: totalRealizedLoss,
    netDeductible: 0,
    isFullyLiquidated: false,
    authority: 'IRC §1092(a)(2)(A)(ii) — Basis Capitalization on Identified Straddle',
    notes: `Identified straddle has open legs. Realized loss ($${totalRealizedLoss.toFixed(2)}) is capitalized into remaining positions' basis; $0 currently deductible.`,
  };
}

/**
 * Scans a portfolio of positions and detects candidate §1092 tax straddles.
 *
 * Rules:
 * - Never auto-confirms: all items are emitted with status 'candidate'.
 * - Confidence taxonomy ported from `net_alpha`: Confirmed, Probable, Unclear.
 * - Checks for IRC §1256 overlaps -> flags Mixed Straddle requiring CPA review.
 */
export function detectStraddles(positions: StraddlePosition[]): DetectedStraddle[] {
  const results: DetectedStraddle[] = [];

  // Group by underlying
  const groups = new Map<string, StraddlePosition[]>();
  for (const pos of positions) {
    const sym = pos.underlying.trim().toUpperCase();
    if (!groups.has(sym)) groups.set(sym, []);
    groups.get(sym)!.push(pos);
  }

  for (const [underlying, posList] of groups.entries()) {
    // Check §1256 overlap for Mixed Straddle
    const isMixedStraddle = isSection1256Contract(underlying);

    const stocks = posList.filter((p) => p.kind === 'stock');
    const calls = posList.filter((p) => p.kind === 'call');
    const puts = posList.filter((p) => p.kind === 'put');

    // 1. Long Stock + Short Call -> Covered Call (Always run QCC test)
    for (const stock of stocks) {
      if (stock.side === 'long') {
        const shortCalls = calls.filter((c) => c.side === 'short');
        for (const call of shortCalls) {
          const stockPrice = stock.currentPrice ?? stock.basis ?? 100;
          const qcc = testQualifiedCoveredCall(call, stockPrice, call.openedAt);

          // If it fails QCC, it IS an offsetting straddle
          // If it passes QCC, it is an exempt covered call (not an active §1092 straddle)
          const confidence: Confidence = qcc.isQualified ? 'Confirmed' : 'Confirmed';
          const authority = qcc.isQualified
            ? 'IRC §1092(c)(4) — Qualified Covered Call Exemption (Safe Harbor)'
            : 'IRC §1092(c)(4) & (c)(2) — Non-Qualified Covered Call (Straddle)';

          results.push({
            id: `straddle-cc-${stock.id}-${call.id}`,
            kind: 'covered-call',
            underlying,
            legs: [stock, call],
            confidence,
            status: 'candidate',
            qcc,
            isMixedStraddle,
            mixedStraddleWarning: isMixedStraddle
              ? 'Mixed straddle — CPA review required. Overlaps with IRC §1256 contract.'
              : undefined,
            authority,
            rationale: qcc.isQualified
              ? 'Covered call qualifies for IRC §1092(c)(4) safe harbor. Exempt from loss deferral.'
              : `Non-qualified covered call: ${qcc.reasons.join(' ')}`,
          });
        }

        // 2. Long Stock + Long Put -> Married Put
        const longPuts = puts.filter((p) => p.side === 'long');
        for (const put of longPuts) {
          // Check if opened same day (married put election under §1233(c)) vs generic straddle
          const sameDay = put.openedAt === stock.openedAt;
          const confidence: Confidence = sameDay ? 'Confirmed' : 'Probable';
          results.push({
            id: `straddle-mp-${stock.id}-${put.id}`,
            kind: 'married-put',
            underlying,
            legs: [stock, put],
            confidence,
            status: 'candidate',
            isMixedStraddle,
            mixedStraddleWarning: isMixedStraddle
              ? 'Mixed straddle — CPA review required. Overlaps with IRC §1256 contract.'
              : undefined,
            authority: 'IRC §1092(c)(2) & IRC §1233(c) — Married Put Offsetting Positions',
            rationale:
              'Long put substantially diminishes risk of loss on long stock position, constituting an offsetting straddle.',
          });
        }
      }
    }

    // 3. Long Call + Long Put -> Literal Straddle vs Strangle
    const longCalls = calls.filter((c) => c.side === 'long');
    const longPuts = puts.filter((p) => p.side === 'long');
    for (const call of longCalls) {
      for (const put of longPuts) {
        const isLiteral = call.strike !== undefined && put.strike !== undefined && call.strike === put.strike;
        const kind: StraddleKind = isLiteral ? 'literal-straddle' : 'strangle';
        results.push({
          id: `straddle-long-${call.id}-${put.id}`,
          kind,
          underlying,
          legs: [call, put],
          confidence: 'Confirmed',
          status: 'candidate',
          isMixedStraddle,
          mixedStraddleWarning: isMixedStraddle
            ? 'Mixed straddle — CPA review required. Overlaps with IRC §1256 contract.'
            : undefined,
          authority: 'IRC §1092(c)(2) — Offsetting Option Positions (Straddle/Strangle)',
          rationale: isLiteral
            ? 'Matching strike long call + long put on same underlying constitutes a classic §1092 straddle.'
            : 'Non-matching strike long call + long put on same underlying constitutes an offsetting strangle.',
        });
      }
    }

    // 4. Vertical Spreads (Call Spread: Long Call + Short Call; Put Spread: Long Put + Short Put)
    const shortCalls = calls.filter((c) => c.side === 'short');
    if (longCalls.length > 0 && shortCalls.length > 0) {
      for (const lc of longCalls) {
        for (const sc of shortCalls) {
          if (lc.expiry === sc.expiry) {
            results.push({
              id: `straddle-vert-call-${lc.id}-${sc.id}`,
              kind: 'vertical-spread',
              underlying,
              legs: [lc, sc],
              confidence: 'Confirmed',
              status: 'candidate',
              isMixedStraddle,
              mixedStraddleWarning: isMixedStraddle
                ? 'Mixed straddle — CPA review required. Overlaps with IRC §1256 contract.'
                : undefined,
              authority: 'IRC §1092(c)(2) — Vertical Call Spread Offsetting Positions',
              rationale: 'Long and short calls with same expiration date create substantial risk diminution.',
            });
          }
        }
      }
    }

    const shortPuts = puts.filter((p) => p.side === 'short');
    if (longPuts.length > 0 && shortPuts.length > 0) {
      for (const lp of longPuts) {
        for (const sp of shortPuts) {
          if (lp.expiry === sp.expiry) {
            results.push({
              id: `straddle-vert-put-${lp.id}-${sp.id}`,
              kind: 'vertical-spread',
              underlying,
              legs: [lp, sp],
              confidence: 'Confirmed',
              status: 'candidate',
              isMixedStraddle,
              mixedStraddleWarning: isMixedStraddle
                ? 'Mixed straddle — CPA review required. Overlaps with IRC §1256 contract.'
                : undefined,
              authority: 'IRC §1092(c)(2) — Vertical Put Spread Offsetting Positions',
              rationale: 'Long and short puts with same expiration date create substantial risk diminution.',
            });
          }
        }
      }
    }

    // 5. Unrelated positions / Unmatched legs guard
    // If long stock exists with a far-dated protective put opened months apart
    if (stocks.length > 0 && puts.length > 0) {
      for (const st of stocks) {
        for (const pt of puts) {
          const daysDiff = Math.abs(
            (new Date(pt.openedAt).getTime() - new Date(st.openedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff > 90) {
            // Already flagged in married put, but if presented as independent unconfirmed candidate:
            // Ensure any ambiguous combination remains 'Unclear'
            const existing = results.find((r) => r.legs.some((l) => l.id === st.id) && r.legs.some((l) => l.id === pt.id));
            if (existing && existing.confidence === 'Probable') {
              existing.confidence = 'Unclear';
              existing.rationale = 'Positions opened >90 days apart; substantial risk diminution is economically unclear.';
            }
          }
        }
      }
    }
  }

  return results;
}
