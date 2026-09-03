/**
 * Section 1256 Tax-Alpha & Wash-Sale Shield Optimization Engine
 *
 * Models the IRS Section 1256 60/40 blended capital gains tax advantage:
 * - 60% Long-Term Capital Gains (20% top rate)
 * - 40% Short-Term Capital Gains (37% top rate)
 * Blended Effective Rate: 26.8% vs 37.0% Ordinary Income = 10.2% Pure Tax Alpha.
 *
 * Also provides non-substantially identical tax-loss harvesting proxy swaps to bank
 * tax deductions without triggering IRS Section 1091 30-day wash-sale rules.
 */

export interface TaxBracketProfile {
  marginalOrdinaryRatePct: number; // e.g. 37% or 32%
  longTermCapGainsRatePct: number; // e.g. 20% or 15%
}

export interface Section1256Comparison {
  annualNetProfit: number;
  equityOptionTax: number;
  section1256Tax: number;
  taxAlphaSavingsDollars: number;
  effectiveTaxReliefPct: number;
  noWashSaleAccounting: boolean;
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

export const DEFAULT_TAX_PROFILE: TaxBracketProfile = {
  marginalOrdinaryRatePct: 35.0,
  longTermCapGainsRatePct: 20.0,
};

export function calculateSection1256Comparison(
  annualNetProfit: number,
  profile: TaxBracketProfile = DEFAULT_TAX_PROFILE
): Section1256Comparison {
  const profit = Math.max(0, annualNetProfit);

  // Equity option: 100% ordinary income
  const equityOptionTax = profit * (profile.marginalOrdinaryRatePct / 100.0);

  // Section 1256: 60% Long-Term, 40% Short-Term
  const blendedRate =
    0.60 * profile.longTermCapGainsRatePct + 0.40 * profile.marginalOrdinaryRatePct;
  const section1256Tax = profit * (blendedRate / 100.0);

  const taxAlphaSavingsDollars = Math.round((equityOptionTax - section1256Tax) * 100) / 100;
  const effectiveTaxReliefPct = Math.round((profile.marginalOrdinaryRatePct - blendedRate) * 10) / 10;

  return {
    annualNetProfit: profit,
    equityOptionTax: Math.round(equityOptionTax),
    section1256Tax: Math.round(section1256Tax),
    taxAlphaSavingsDollars,
    effectiveTaxReliefPct,
    noWashSaleAccounting: true,
  };
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
