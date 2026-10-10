/**
 * Section 1256 Tax Engine & Derivatives Regime Modeling
 *
 * Attribution:
 * Ported from MIT-licensed `howard-lynn-ye/Fin-RSI`
 * (`fin_skills/_skills/section-1256-and-derivatives-tax/SKILL.md`,
 * source-verified 2026-09-09 against IRC §1256, IRS Pub 550 (2025),
 * 15 U.S.C. §78c(a)(55), and Rev. Rul. 2026-16).
 *
 * IMPORTANT LEGAL & TAX DISCLAIMER:
 * Modelling assumptions for backtests and portfolio analysis, NOT tax advice.
 * Always consult a qualified CPA or licensed tax professional regarding your
 * specific tax situation and filing of IRS Form 6781.
 *
 * SCOPE LIMITATIONS (What this engine deliberately does NOT model):
 * 1. Wash sales on §1256 contracts (IRC §1091 wash sale rules DO NOT apply to §1256 contracts — IRS Pub 550 p.87).
 * 2. Straddle loss-deferral rules (IRC §1092).
 * 3. §1256(e) hedging exception.
 * 4. §988 foreign currency ordinary gain/loss rules.
 * 5. Moving qualified-exchange lists (venues evolve — see Rev. Rul. 2026-16 as a caveat to verify with your CPA).
 */

import { now } from './appNow.ts';

export type TaxRegime = 'section1256' | 'equityOption' | 'unclear';

export interface ClassificationResult {
  regime: TaxRegime;
  badgeLabel: '§1256' | 'Equity option' | 'Needs review';
  authority: string;
  explanation: string;
}

export interface SixtyFortySplit {
  longTerm: number;
  shortTerm: number;
  authority: string;
}

export interface PositionMark {
  positionId: string;
  symbol: string;
  entryDate: string; // YYYY-MM-DD
  entryBasis: number; // Positive dollar basis
  closeDate?: string; // YYYY-MM-DD (optional if open)
  closeAmount?: number; // Proceeds on close
  yearEndMarks?: Record<number, number>; // e.g. { 2024: 57000 }
}

export interface YearlyRecognizedGain {
  year: number;
  positionId: string;
  symbol: string;
  startReference: number;
  endReference: number;
  amount: number; // endReference - startReference
  isYearEndMark: boolean;
  authority: string;
}

export interface YearlyTaxScheduleItem {
  year: number;
  totalRecognized: number;
  longTermAmount: number; // 60%
  shortTermAmount: number; // 40%
  taxDue: number;
  blendedRatePct: number;
  isNetLoss: boolean;
  carrybackEligible: boolean;
  authority: string;
  carrybackNote?: string;
}

export interface RegimeComparisonResult {
  totalEconomicMove: number;
  section1256Tax: number;
  equityOptionTax: number;
  rateEffect: number; // Pure statutory savings from 60/40 vs short-term
  timingEffect: number; // Cost of earlier recognition via year-end mark
  netTaxAlpha: number; // equityOptionTax - section1256Tax
  holdingPeriodDays: number;
  isHoldingOverYear: boolean;
  holdingPeriodWarning?: string;
  schedule1256: YearlyTaxScheduleItem[];
  authority: string;
  disclaimer: string;
}

// Broad-based index tickers verified under 15 U.S.C. §78c(a)(55) and IRC §1256(g)(6)
const BROAD_BASED_INDEX_SET = new Set([
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

// ETF options that hold conflicting IRS/judicial precedent (the skill strictly classifies as "unclear")
const ETF_OPTION_SET = new Set([
  'SPY',
  'QQQ',
  'IWM',
  'DIA',
  'XLK',
  'XLF',
  'XLE',
  'XLV',
  'XLI',
  'XLP',
  'XLU',
  'XLB',
  'XLRE',
  'XLC',
  'ARKK',
  'SMH',
  'TLT',
  'HYG',
  'EEM',
  'VXX',
]);

/**
 * Classifies an instrument into Section 1256, Equity Option, or Unclear.
 * 
 * Iron Rule #3: Implement exactly the skill's verified rules — no invented tax law.
 * ETF options (SPY/QQQ) return "unclear" with warning, NEVER auto-classified as 1256.
 */
export function classify(symbol: string, contractType?: string): ClassificationResult {
  const cleanSym = (symbol || '').trim().toUpperCase();
  const cType = (contractType || '').trim().toLowerCase();

  // Extract base ticker root (e.g. "SPY Call" -> "SPY", "SPX 5000P" -> "SPX")
  const baseTicker = cleanSym.split(/[\s_\-/]/)[0].replace(/[^A-Z]/g, '');

  // 1. Regulated Futures & Broad-Based Index Options (§1256 nonequity options)
  const isFuture = cleanSym.startsWith('/') || cType === 'future' || cType === 'futures';
  const isBroadBasedIndex = BROAD_BASED_INDEX_SET.has(cleanSym) || BROAD_BASED_INDEX_SET.has(baseTicker);

  if (isFuture) {
    return {
      regime: 'section1256',
      badgeLabel: '§1256',
      authority: 'IRC §1256(b)(1)(A) — Regulated futures contract',
      explanation: 'Regulated futures contract traded on a qualified board or exchange.',
    };
  }

  if (isBroadBasedIndex) {
    return {
      regime: 'section1256',
      badgeLabel: '§1256',
      authority: 'IRC §1256(b)(1)(B), 15 U.S.C. §78c(a)(55) — Nonequity option on broad-based index',
      explanation: 'Broad-based cash-settled index option subject to statutory 60/40 blended tax rates and year-end mark-to-market.',
    };
  }

  // 2. ETF Options: Conflicting IRS and judicial precedent -> strictly unclear regime, defaults to equity option
  if (ETF_OPTION_SET.has(cleanSym) || ETF_OPTION_SET.has(baseTicker)) {
    return {
      regime: 'unclear',
      badgeLabel: 'Equity option',
      authority: 'IRC §1221 / IRS Pub 550 (2025) — ETF option stays equity option (IRC §1256 status unclear under Rev. Rul. 2026-16)',
      explanation: 'Options on ETFs (SPY, QQQ, etc.) stay standard equity options. 1256 status is unverified under conflicting precedent — never auto-classified as 1256.',
    };
  }

  // 3. Known single-stock equity options (AAPL, NVDA, TSLA, etc.)
  const candidateStock = baseTicker || cleanSym;
  if (/^[A-Z]{1,5}$/.test(candidateStock) && !isBroadBasedIndex && !ETF_OPTION_SET.has(candidateStock)) {
    return {
      regime: 'equityOption',
      badgeLabel: 'Equity option',
      authority: 'IRC §1221 / IRS Pub 550 (2025) — Standard single-stock equity option',
      explanation: 'Taxed under standard capital gains rules upon closing or expiration (short-term if held <= 365 days).',
    };
  }

  // 4. OTC / Exotic / Unrecognized derivative
  return {
    regime: 'unclear',
    badgeLabel: 'Needs review',
    authority: 'IRC §1256(g) — Non-qualified exchange or OTC derivative',
    explanation: 'Unverified venue or non-standard derivative. Requires CPA confirmation.',
  };
}

/**
 * Splits a dollar amount 60% Long-Term and 40% Short-Term regardless of holding period.
 * Authority: IRC §1256(a)(3).
 */
export function sixtyForty(amount: number): SixtyFortySplit {
  return {
    longTerm: 0.6 * amount,
    shortTerm: 0.4 * amount,
    authority: 'IRC §1256(a)(3) — 60% long-term / 40% short-term capital gain or loss',
  };
}

/**
 * Calculates statutory blended rate: 0.6 * longRate + 0.4 * shortRate.
 * Normalizes percentage inputs (e.g. 37 or 0.37 -> 0.268 / 26.8%).
 * Authority: IRC §1256(a)(3).
 */
export function blendedRate(shortRate: number, longRate: number): number {
  const sRate = shortRate > 1.0 ? shortRate / 100.0 : shortRate;
  const lRate = longRate > 1.0 ? longRate / 100.0 : longRate;
  return 0.6 * lRate + 0.4 * sRate;
}

/**
 * Calculates the last business day (weekday) of a given calendar tax year.
 * Verified skill values:
 * - 2022 -> Dec 30
 * - 2023 -> Dec 29
 * - 2024 -> Dec 31
 * - 2025 -> Dec 31
 *
 * Note: This implements a weekday rule (Monday-Friday), not the full exchange holiday
 * calendar — flagged as a standard approximation.
 * Authority: IRC §1256(a)(1), IRS Pub 550 (2025) p.57.
 */
export function lastBusinessDay(year: number): string {
  const d = new Date(Date.UTC(year, 11, 31)); // Dec 31
  const day = d.getUTCDay(); // 0 is Sunday, 6 is Saturday
  if (day === 6) {
    d.setUTCDate(30);
  } else if (day === 0) {
    d.setUTCDate(29);
  }
  const monthStr = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Chains year-end mark-to-market valuations across calendar years.
 *
 * Invariant: Each year's recognized gain/loss = mark - previous reference (prior mark or entry),
 * and the mark BECOMES the new reference so later closes only recognize changes since the last mark.
 * The sum of recognized gains/losses over all years strictly equals the total economic move.
 *
 * Example (Pub 550 p.57 futures):
 * Entry: $50,000 in Year 1. Dec 31 Year 1 mark: $57,000 -> $7,000 recognized 60/40.
 * Reference becomes $57,000. Sold in Year 2 at $56,000 -> $56,000 - $57,000 = -$1,000 loss in Year 2.
 * Total economic move: $6,000. Sum of recognized amounts: $7,000 - $1,000 = $6,000.
 */
export function recognise1256(
  positions: PositionMark[],
  globalYearEndMarks?: Record<string, Record<number, number>>
): YearlyRecognizedGain[] {
  const results: YearlyRecognizedGain[] = [];

  for (const pos of positions) {
    let currentReference = pos.entryBasis;
    const entryYear = parseInt(pos.entryDate.slice(0, 4), 10);
    const closeYear = pos.closeDate ? parseInt(pos.closeDate.slice(0, 4), 10) : now().getFullYear();

    const marksForPos = {
      ...(pos.yearEndMarks || {}),
      ...(globalYearEndMarks?.[pos.positionId] || {}),
    };

    // Process each year-end mark
    for (let yr = entryYear; yr < closeYear; yr++) {
      const markValue = marksForPos[yr];
      if (typeof markValue === 'number' && !isNaN(markValue)) {
        const gainLoss = markValue - currentReference;
        results.push({
          year: yr,
          positionId: pos.positionId,
          symbol: pos.symbol,
          startReference: currentReference,
          endReference: markValue,
          amount: gainLoss,
          isYearEndMark: true,
          authority: 'IRC §1256(a)(1), IRS Pub 550 (2025) p.57 — Year-end mark-to-market recognition',
        });
        currentReference = markValue; // The mark becomes the new reference
      }
    }

    // Process eventual close or current unrealized state
    if (typeof pos.closeAmount === 'number' && !isNaN(pos.closeAmount) && pos.closeDate) {
      const finalGainLoss = pos.closeAmount - currentReference;
      results.push({
        year: closeYear,
        positionId: pos.positionId,
        symbol: pos.symbol,
        startReference: currentReference,
        endReference: pos.closeAmount,
        amount: finalGainLoss,
        isYearEndMark: false,
        authority: 'IRC §1256(a)(2) — Settlement / closing transaction recognition',
      });
    }
  }

  return results;
}

/**
 * Calculates the per-year tax schedule and generates data required for Form 6781 loss carryback.
 *
 * Authority: IRC §1256(a)(3), IRC §1212(c).
 */
export function taxSchedule(
  recognisedGains: YearlyRecognizedGain[],
  shortRate: number,
  longRate: number
): YearlyTaxScheduleItem[] {
  const byYear: Record<number, number> = {};

  for (const item of recognisedGains) {
    byYear[item.year] = (byYear[item.year] || 0) + item.amount;
  }

  const sRate = shortRate > 1.0 ? shortRate / 100.0 : shortRate;
  const lRate = longRate > 1.0 ? longRate / 100.0 : longRate;
  const blended = blendedRate(sRate, lRate);

  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const schedule: YearlyTaxScheduleItem[] = [];

  for (const yr of years) {
    const totalRecognized = byYear[yr];
    const split = sixtyForty(totalRecognized);
    const taxDue = Math.round(totalRecognized * blended * 100) / 100;
    const isNetLoss = totalRecognized < 0;

    schedule.push({
      year: yr,
      totalRecognized: Math.round(totalRecognized * 100) / 100,
      longTermAmount: Math.round(split.longTerm * 100) / 100,
      shortTermAmount: Math.round(split.shortTerm * 100) / 100,
      taxDue,
      blendedRatePct: Math.round(blended * 1000) / 10,
      isNetLoss,
      carrybackEligible: isNetLoss,
      authority: 'IRC §1256(a)(3) — 60/40 schedule',
      carrybackNote: isNetLoss
        ? 'IRC §1212(c): Eligible for 3-year loss carryback election against prior §1256 net gains. File Form 6781 with your CPA.'
        : undefined,
    });
  }

  return schedule;
}

/**
 * Runs the identical portfolio/backtest book under both Section 1256 and Equity Option regimes.
 *
 * Separates the two counteracting effects:
 * - Rate Effect: Tax savings from 60/40 blended rate vs short-term marginal rate.
 * - Timing Effect: The cost of early tax recognition via mark-to-market before cash is received.
 *
 * Authority: IRC §1256, IRC §1221, IRS Pub 550 (2025).
 */
export function compareRegimes(
  book: PositionMark[],
  shortRate: number,
  longRate: number,
  globalYearEndMarks?: Record<string, Record<number, number>>
): RegimeComparisonResult {
  const sRate = shortRate > 1.0 ? shortRate / 100.0 : shortRate;
  const lRate = longRate > 1.0 ? longRate / 100.0 : longRate;
  const blended = blendedRate(sRate, lRate);

  // 1. Calculate Section 1256 treatment
  const recognised1256 = recognise1256(book, globalYearEndMarks);
  const schedule1256 = taxSchedule(recognised1256, sRate, lRate);
  const section1256Tax = schedule1256.reduce((acc, item) => acc + item.taxDue, 0);

  // 2. Calculate Standard Equity Option treatment (realization on close only)
  let totalEconomicMove = 0;
  let equityOptionTax = 0;
  let totalHoldingDays = 0;
  let positionsWithDays = 0;

  for (const pos of book) {
    const finalAmount = typeof pos.closeAmount === 'number' ? pos.closeAmount : pos.entryBasis;
    const economicMove = finalAmount - pos.entryBasis;
    totalEconomicMove += economicMove;

    const entryTime = new Date(pos.entryDate).getTime();
    const closeTime = pos.closeDate ? new Date(pos.closeDate).getTime() : now().getTime();
    const daysHeld = Math.max(0, Math.round((closeTime - entryTime) / (1000 * 60 * 60 * 24)));

    totalHoldingDays += daysHeld;
    positionsWithDays++;

    // Standard equity options: <= 365 days is short-term; > 365 days is long-term
    const rateToUse = daysHeld > 365 ? lRate : sRate;
    equityOptionTax += economicMove * rateToUse;
  }

  const avgHoldingDays = positionsWithDays > 0 ? Math.round(totalHoldingDays / positionsWithDays) : 0;
  const isHoldingOverYear = avgHoldingDays > 365;

  // Rate Effect: Savings from 60/40 rate vs short-term rate on total economic profit
  const rateEffect = Math.max(0, totalEconomicMove) * (sRate - blended);

  // Timing Effect: Tax paid earlier on unrealized marks before realization
  // If marks brought forward tax payments, timingEffect is positive
  let earlyTaxPaid = 0;
  for (const r of recognised1256) {
    if (r.isYearEndMark && r.amount > 0) {
      earlyTaxPaid += r.amount * blended;
    }
  }
  const timingEffect = earlyTaxPaid;

  const netTaxAlpha = Math.round((equityOptionTax - section1256Tax) * 100) / 100;

  let holdingPeriodWarning: string | undefined;
  if (isHoldingOverYear) {
    holdingPeriodWarning =
      'Holding-period honesty check (IRC §1222): 60/40 is a blend — it beats the short-term rate but loses to the long-term rate. Because your strategy holding period exceeds 365 days, standard long-term capital gains treatment may yield lower total tax.';
  }

  return {
    totalEconomicMove: Math.round(totalEconomicMove * 100) / 100,
    section1256Tax: Math.round(section1256Tax * 100) / 100,
    equityOptionTax: Math.round(equityOptionTax * 100) / 100,
    rateEffect: Math.round(rateEffect * 100) / 100,
    timingEffect: Math.round(timingEffect * 100) / 100,
    netTaxAlpha,
    holdingPeriodDays: avgHoldingDays,
    isHoldingOverYear,
    holdingPeriodWarning,
    schedule1256,
    authority: 'IRC §1256, IRC §1221, IRS Pub 550 (2025) p.57',
    disclaimer: 'Modelling assumptions for backtests and portfolio analysis, not tax advice. Consult a licensed CPA.',
  };
}
