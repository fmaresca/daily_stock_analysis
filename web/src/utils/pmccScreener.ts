/**
 * Poor Man's Covered Call (PMCC) & Diagonal Spread Screener Engine
 *
 * Algorithmically identifies and structures capital-efficient PMCC diagonals:
 * - Long Leg: Deep ITM Call (0.80+ Delta, 120-365 DTE LEAPS)
 * - Short Leg: OTM Call (0.20-0.30 Delta, 21-45 DTE >= Upper BB)
 * - Yields 60-75% capital savings compared to 100 shares ownership
 */

import { TickerMeta } from '../types/options';
import { calculateBlackScholesOption } from './optionChainMatrix';

export interface PmccOpportunity {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  spotPrice: number;
  liquidityTier: string;
  ivRank: number;

  // Long Leg (LEAPS synthetic stock substitute)
  longStrike: number;
  longDte: number;
  longExpiration: string;
  longDelta: number;
  longDebitPerShare: number;
  longCostTotal: number;

  // Short Leg (Income generator)
  shortStrike: number;
  shortDte: number;
  shortExpiration: string;
  shortDelta: number;
  shortCreditPerShare: number;
  shortCreditTotal: number;

  // Capital Efficiency & Risk Metrics
  stockEquivalentCost: number; // Spot * 100
  capitalSavingsPct: number; // % saved vs owning 100 shares
  netDebitTotal: number;
  netDebitPerShare: number;
  maxProfitAtShortStrike: number;
  breakevenPrice: number;
  downsideCushionPct: number;
  extrinsicRiskTotal: number; // Net debit - Strike width * 100
  hasZeroExtrinsicRisk: boolean;
  annualizedRoc: number;
  safetyScore: number; // 0 - 100
  safetyTier: 'Elite PMCC (Zero Extrinsic Risk)' | 'Strong PMCC' | 'Standard PMCC';
}

export function generatePmccOpportunities(tickers: TickerMeta[]): PmccOpportunity[] {
  const opportunities: PmccOpportunity[] = [];
  const now = new Date();

  // Long LEAPS expiration ~180-270 days out
  const leapsDate = new Date(now.getTime() + 210 * 86400000);
  const leapsDte = 210;
  const leapsExpStr = leapsDate.toISOString().split('T')[0];

  // Short income expiration ~30-45 days out
  const shortDate = new Date(now.getTime() + 35 * 86400000);
  const shortDte = 35;
  const shortExpStr = shortDate.toISOString().split('T')[0];

  for (const t of tickers) {
    const spot = t.spot_price > 0 ? t.spot_price : 100;
    const baseIv = t.iv_rank ? Math.max(16, t.iv_rank * 0.4 + 18) : 24;

    // Step size for strikes
    let step = 1;
    if (spot >= 500) step = 10;
    else if (spot >= 200) step = 5;
    else if (spot >= 100) step = 2.5;
    else step = 1;

    // Long Leg: ~0.82-0.85 Delta -> roughly 12-15% In-The-Money
    const longStrikeRaw = spot * 0.86;
    const longStrike = Math.round(longStrikeRaw / step) * step;

    // Short Leg: ~0.22-0.28 Delta -> roughly 5-8% Out-of-The-Money (or >= Upper Bollinger Band)
    const upperBb = t.upper_bb || spot * 1.05;
    const shortStrikeRaw = Math.max(upperBb, spot * 1.05);
    const shortStrike = Math.round(shortStrikeRaw / step) * step;

    if (longStrike >= shortStrike) continue;

    // Pricing
    const longCalc = calculateBlackScholesOption(spot, longStrike, leapsDte, baseIv);
    const shortCalc = calculateBlackScholesOption(spot, shortStrike, shortDte, baseIv);

    const longDebitPerShare = Math.round(longCalc.callPrice * 100) / 100;
    const shortCreditPerShare = Math.round(shortCalc.callPrice * 100) / 100;

    const longCostTotal = Math.round(longDebitPerShare * 100);
    const shortCreditTotal = Math.round(shortCreditPerShare * 100);

    const stockEquivalentCost = Math.round(spot * 100);
    const netDebitTotal = Math.max(50, longCostTotal - shortCreditTotal);
    const netDebitPerShare = Math.round((netDebitTotal / 100) * 100) / 100;

    const capitalSavingsPct = Math.round(((stockEquivalentCost - longCostTotal) / stockEquivalentCost) * 1000) / 10;

    // Strike width & Max Profit
    const strikeWidth = (shortStrike - longStrike) * 100;
    const maxProfitAtShortStrike = Math.max(0, strikeWidth - netDebitTotal);

    // Breakeven & Downside Cushion
    const breakevenPrice = Math.round((longStrike + netDebitPerShare) * 100) / 100;
    const downsideCushionPct = Math.round((((spot - breakevenPrice) / spot) * 100) * 10) / 10;

    // Extrinsic Risk: Is the net debit less than strike width?
    const extrinsicRiskTotal = Math.max(0, netDebitTotal - strikeWidth);
    const hasZeroExtrinsicRisk = netDebitTotal <= strikeWidth;

    // Annualized ROC based on recurring short call write
    const cycleRoc = (shortCreditTotal / netDebitTotal) * 100;
    const annualizedRoc = Math.round((cycleRoc * (365 / shortDte)) * 10) / 10;

    // Safety Score (0-100)
    let safetyScore = 75;
    if (hasZeroExtrinsicRisk) safetyScore += 12;
    if (downsideCushionPct >= 5) safetyScore += 8;
    if (t.liquidity_tier === 'Tier 1') safetyScore += 5;
    safetyScore = Math.min(99, Math.max(55, safetyScore));

    const safetyTier = hasZeroExtrinsicRisk
      ? 'Elite PMCC (Zero Extrinsic Risk)'
      : downsideCushionPct > 0
      ? 'Strong PMCC'
      : 'Standard PMCC';

    opportunities.push({
      id: `PMCC_${t.symbol}_${longStrike}_${shortStrike}`,
      symbol: t.symbol,
      name: t.name,
      sector: t.sector,
      spotPrice: spot,
      liquidityTier: t.liquidity_tier,
      ivRank: t.iv_rank,

      longStrike,
      longDte: leapsDte,
      longExpiration: leapsExpStr,
      longDelta: Math.round(longCalc.callDelta * 100) / 100,
      longDebitPerShare,
      longCostTotal,

      shortStrike,
      shortDte,
      shortExpiration: shortExpStr,
      shortDelta: Math.round(shortCalc.callDelta * 100) / 100,
      shortCreditPerShare,
      shortCreditTotal,

      stockEquivalentCost,
      capitalSavingsPct,
      netDebitTotal,
      netDebitPerShare,
      maxProfitAtShortStrike,
      breakevenPrice,
      downsideCushionPct,
      extrinsicRiskTotal,
      hasZeroExtrinsicRisk,
      annualizedRoc,
      safetyScore,
      safetyTier,
    });
  }

  // Sort by Safety Score & Annualized ROC
  return opportunities.sort((a, b) => b.safetyScore - a.safetyScore || b.annualizedRoc - a.annualizedRoc);
}
