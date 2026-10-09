/**
 * Section 1256 Tax-Alpha & Wash-Sale Shield Optimization Engine
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
 */

import {
  classify,
  blendedRate,
  sixtyForty,
  TaxRegime,
  ClassificationResult,
} from './section1256';

export interface TaxBracketProfile {
  marginalOrdinaryRatePct: number; // e.g. 37% or 32% (User input, never hardcoded default)
  longTermCapGainsRatePct: number; // e.g. 20% or 15% (User input, never hardcoded default)
}

export interface Section1256Comparison {
  annualNetProfit: number;
  equityOptionTax: number;
  section1256Tax: number;
  taxAlphaSavingsDollars: number;
  effectiveTaxReliefPct: number;
  noWashSaleAccounting: boolean;
  rateEffect: number; // Pure statutory savings from 60/40 vs short-term
  timingEffect: number; // Cost of earlier recognition via year-end mark
  netTaxAlpha: number; // rateEffect - timingEffect
  blendedRatePct: number;
  authority: string;
  disclaimer: string;
  decemberMtmWarning?: string;
}

export interface WashSaleHarvestCandidate {
  id: string;
  symbol: string;
  positionType: string;
  entryDate: string;
  unrealizedLossDollars: number;
  recommendedProxy: string;
  proxyName: string;
  proxyType: 'SECTION_1256_INDEX' | 'CORRELATED_SECTOR_ETF' | 'CROSS_TICKER_PROXY';
  correlationR2: number; // e.g. 0.98
  estimatedTaxDeductionValue: number; // Loss * Marginal Tax Rate
  rationale: string;
}

export interface TaxAlphaHoldingPosition {
  id: string;
  symbol: string;
  description: string;
  contractType: string;
  unrealizedPnl: number;
  isOpenAtYearEnd: boolean;
  classification: ClassificationResult;
}

export const TAX_RATES_STORAGE_KEY = 'deltaharvest_tax_rates';

export const DEFAULT_TAX_PROFILE: TaxBracketProfile = {
  marginalOrdinaryRatePct: 37.0,
  longTermCapGainsRatePct: 20.0,
};

export function getStoredTaxProfile(): TaxBracketProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_TAX_PROFILE;
  }
  try {
    const raw = localStorage.getItem(TAX_RATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.marginalOrdinaryRatePct === 'number' &&
        typeof parsed.longTermCapGainsRatePct === 'number'
      ) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_TAX_PROFILE;
}

export function saveStoredTaxProfile(profile: TaxBracketProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TAX_RATES_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

/**
 * Calculates Section 1256 comparison breaking out Rate Effect and Timing Effect.
 *
 * Authority:
 * - Rate Effect: IRC §1256(a)(3) — 60/40 blended capital gains vs short-term rate.
 * - Timing Effect: IRC §1256(a)(1), IRS Pub 550 (2025) p.57 — Year-end mark-to-market.
 */
export function calculateSection1256Comparison(
  annualNetProfit: number,
  profile: TaxBracketProfile = DEFAULT_TAX_PROFILE,
  open1256UnrealizedGains: number = 0
): Section1256Comparison {
  const profit = Math.max(0, annualNetProfit);
  const sRate = profile.marginalOrdinaryRatePct / 100.0;
  const lRate = profile.longTermCapGainsRatePct / 100.0;
  const blended = blendedRate(sRate, lRate);
  const blendedPct = Math.round(blended * 1000) / 10;

  // Equity option: 100% ordinary / short-term income
  const equityOptionTax = profit * sRate;

  // Section 1256: 60% Long-Term, 40% Short-Term
  const section1256Tax = profit * blended;

  // Rate Effect: Pure statutory tax savings from 60/40 rate vs short-term rate
  const rateEffect = Math.round((equityOptionTax - section1256Tax) * 100) / 100;

  // Timing Effect: Tax due on December 31 for open mark-to-market gains before cash realization
  const timingEffect =
    open1256UnrealizedGains > 0
      ? Math.round(open1256UnrealizedGains * blended * 100) / 100
      : 0;

  // Net Tax Alpha taking both counteracting effects into account
  const netTaxAlpha = Math.round((rateEffect - timingEffect) * 100) / 100;
  const effectiveTaxReliefPct = Math.round((profile.marginalOrdinaryRatePct - blendedPct) * 10) / 10;

  let decemberMtmWarning: string | undefined;
  if (open1256UnrealizedGains > 0 && timingEffect > 0) {
    decemberMtmWarning = `Cash-Flow Warning (IRC §1256(a)(1)): You will owe an estimated $${timingEffect.toLocaleString()} in tax on $${open1256UnrealizedGains.toLocaleString()} of unrealized gains on Dec 31 with NO sale proceeds to fund it. Prepare cash reserves before year-end.`;
  }

  return {
    annualNetProfit: profit,
    equityOptionTax: Math.round(equityOptionTax * 100) / 100,
    section1256Tax: Math.round(section1256Tax * 100) / 100,
    taxAlphaSavingsDollars: rateEffect,
    effectiveTaxReliefPct,
    noWashSaleAccounting: true,
    rateEffect,
    timingEffect,
    netTaxAlpha,
    blendedRatePct: blendedPct,
    authority: 'IRC §1256(a)(3) — 60/40 rate; IRC §1256(a)(1) — Mark-to-market',
    disclaimer: 'Modelling assumptions for backtests and portfolio analysis, not tax advice. Consult a licensed CPA.',
    decemberMtmWarning,
  };
}

/**
 * Returns sample positions demonstrating regime classification badges:
 * - SPX position -> §1256 badge with authority
 * - SPY position -> Equity option badge (unclear regime with Rev. Rul. 2026-16 warning)
 * - AAPL position -> Equity option badge
 * - OTC/Exotic position -> Needs review badge
 */
export function getSampleTaxAlphaPositions(): TaxAlphaHoldingPosition[] {
  return [
    {
      id: 'POS_SPX_CONDOR',
      symbol: 'SPX',
      description: 'SPX 5000/5050 Iron Condor (European Cash-Settled)',
      contractType: 'nonequity option',
      unrealizedPnl: 8500,
      isOpenAtYearEnd: true,
      classification: classify('SPX', 'nonequity option'),
    },
    {
      id: 'POS_SPY_PUT',
      symbol: 'SPY',
      description: 'SPY 510 Cash-Secured Put (ETF Option)',
      contractType: 'equity option',
      unrealizedPnl: 1200,
      isOpenAtYearEnd: false,
      classification: classify('SPY', 'equity option'),
    },
    {
      id: 'POS_AAPL_CC',
      symbol: 'AAPL',
      description: 'AAPL 220 Covered Call (Single-Stock Equity Option)',
      contractType: 'equity option',
      unrealizedPnl: 2400,
      isOpenAtYearEnd: false,
      classification: classify('AAPL', 'equity option'),
    },
    {
      id: 'POS_EXOTIC_SWAP',
      symbol: 'OTC_SWAP',
      description: 'Synthetic Total Return Swap (Over-the-Counter)',
      contractType: 'swap',
      unrealizedPnl: 3100,
      isOpenAtYearEnd: false,
      classification: classify('OTC_SWAP', 'swap'),
    },
  ];
}

export function getSampleWashSaleCandidates(
  profile: TaxBracketProfile = DEFAULT_TAX_PROFILE
): WashSaleHarvestCandidate[] {
  const rate = profile.marginalOrdinaryRatePct / 100.0;

  return [
    {
      id: 'HARVEST_SPY_LOSS',
      symbol: 'SPY',
      positionType: 'Cash-Secured Put / Long Shares',
      entryDate: '2026-07-14',
      unrealizedLossDollars: 3450,
      recommendedProxy: 'XSP (Mini-SPX Index)',
      proxyName: 'CBOE Mini-S&P 500 Index Cash-Settled Option',
      proxyType: 'SECTION_1256_INDEX',
      correlationR2: 0.999,
      estimatedTaxDeductionValue: Math.round(3450 * rate),
      rationale:
        'Swapping SPY into cash-settled XSP captures identical S&P 500 exposure, avoids the 30-day IRS wash-sale rule (§ 1091), and upgrades future gains to Section 1256 60/40 tax status.',
    },
    {
      id: 'HARVEST_QQQ_LOSS',
      symbol: 'QQQ',
      positionType: 'Bull Put Spread',
      entryDate: '2026-08-02',
      unrealizedLossDollars: 2180,
      recommendedProxy: 'ONEQ / QQQM',
      proxyName: 'Fidelity Nasdaq Composite / Invesco QQQM Proxy',
      proxyType: 'CROSS_TICKER_PROXY',
      correlationR2: 0.985,
      estimatedTaxDeductionValue: Math.round(2180 * rate),
      rationale:
        'Closes QQQ spread to deduct $2,180 loss this tax year while immediately opening replacement Nasdaq exposure in QQQM without wash-sale disallowance.',
    },
    {
      id: 'HARVEST_NVDA_LOSS',
      symbol: 'NVDA',
      positionType: 'Underwater Covered Call',
      entryDate: '2026-08-11',
      unrealizedLossDollars: 4200,
      recommendedProxy: 'SMH (VanEck Semiconductor ETF)',
      proxyName: 'Semiconductor ETF Basket (20% NVDA weight)',
      proxyType: 'CORRELATED_SECTOR_ETF',
      correlationR2: 0.942,
      estimatedTaxDeductionValue: Math.round(4200 * rate),
      rationale:
        'Banks $4,200 capital loss deduction against ordinary gains while rotating into SMH, maintaining semiconductor industry upside.',
    },
  ];
}
