/**
 * Quantitative Options Trade Quality Scoring Model
 * 
 * Implements the 100-point composite scoring architecture for weekly
 * Cash-Secured Puts (CSPs) and Covered Calls (CCs).
 * 
 * Score breakdown (100 pts max):
 * 1. IV Rank / Percentile: 25% (Sweet spot 35%–70%)
 * 2. Option Delta / PoP: 25% (Target 0.15–0.25 for Puts, 0.20–0.30 for Calls)
 * 3. Technical & MA Alignment: 25% (Strike vs 20/50/200 SMA support/resistance)
 * 4. Annualized Return on Capital (RoC): 15% (Target 18%–35% annualized)
 * 5. Liquidity & Execution: 10% (Spread <= 4% and OI >= 1000)
 * 6. Hard Risk Gates: -40 pts penalty for earnings inside expiration; disqualification for spread > 15%
 */

import {
  OptionContract,
  TechnicalIndicators,
  ScreenedTradeCandidate,
  ScoreComponentBreakdown,
  OptionStrategyType,
} from '../types/optionsScreener.types';
import { safeDivide, isFiniteNumber, clamp, roundToDecimals } from './financeMath';

export function scoreOptionCandidate(
  contract: OptionContract,
  technicals: TechnicalIndicators
): ScreenedTradeCandidate {
  const notes: string[] = [];
  const midPrice = (contract.bid + contract.ask) / 2;
  const spread = Math.max(0, contract.ask - contract.bid);
  const bidAskSpreadPct = midPrice > 0 ? safeDivide(spread * 100, midPrice, 100) : 100;

  // 1. Return on Capital (RoC) Calculation
  // CSP: Collateral = Strike * 100. CC: Collateral = Current Stock Price * 100
  const collateral =
    contract.strategy === 'CASH_SECURED_PUT'
      ? contract.strikePrice
      : technicals.currentPrice;

  const rawReturnPct = collateral > 0 ? safeDivide(contract.bid, collateral, 0) : 0;
  const safeDte = Math.max(1, contract.daysToExpiration);
  const annualizedReturnPct = rawReturnPct * safeDivide(365, safeDte, 0) * 100;

  const breakEvenPrice =
    contract.strategy === 'CASH_SECURED_PUT'
      ? contract.strikePrice - contract.bid
      : technicals.currentPrice - contract.bid;

  const bufferToStrikePct =
    technicals.currentPrice > 0
      ? (Math.abs(technicals.currentPrice - contract.strikePrice) / technicals.currentPrice) * 100
      : 0;

  // 2. Score Component Evaluations
  const ivScore = evaluateIvRank(contract.ivRank, notes);
  const deltaScore = evaluateDelta(contract.delta, contract.strategy, notes);
  const technicalScore = evaluateTechnicalSupport(contract, technicals, notes);
  const returnScore = evaluateReturn(annualizedReturnPct, notes);
  const liquidityScore = evaluateLiquidity(bidAskSpreadPct, contract.openInterest, notes);

  // 3. Composite Calculation & Risk Gates
  let rawScore = ivScore + deltaScore + technicalScore + returnScore + liquidityScore;
  let passedRiskGate = true;

  if (contract.hasEarningsBeforeExpiration) {
    passedRiskGate = false;
    rawScore = Math.max(0, rawScore - 40);
    notes.push('CRITICAL RISK: Earnings announcement falls prior to weekly expiration.');
  }

  if (bidAskSpreadPct > 15) {
    passedRiskGate = false;
    notes.push('EXECUTION RISK: Bid/ask spread exceeds 15% of contract value.');
  }

  const compositeScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

  const breakdown: ScoreComponentBreakdown = {
    ivScore: Math.round(ivScore * 10) / 10,
    deltaScore: Math.round(deltaScore * 10) / 10,
    technicalScore: Math.round(technicalScore * 10) / 10,
    returnScore: Math.round(returnScore * 10) / 10,
    liquidityScore: Math.round(liquidityScore * 10) / 10,
  };

  return {
    contract,
    technicals,
    compositeScore,
    breakdown,
    metrics: {
      midPrice: roundToDecimals(midPrice, 2),
      bidAskSpreadPct: roundToDecimals(bidAskSpreadPct, 1),
      bufferToStrikePct: roundToDecimals(bufferToStrikePct, 1),
      annualizedReturnPct: roundToDecimals(annualizedReturnPct, 1),
      breakEvenPrice: roundToDecimals(breakEvenPrice, 2),
    },
    passedRiskGate,
    notes,
  };
}

// --- Component Scoring Logic ---

export function evaluateIvRank(ivRank: number, notes: string[] = []): number {
  // Max 25 pts. Sweet spot: 35% to 70%
  const safeIvr = isFiniteNumber(ivRank) ? ivRank : 0;
  if (safeIvr >= 35 && safeIvr <= 70) {
    return 25;
  } else if (safeIvr > 70) {
    notes.push(`High IV Rank (${safeIvr}%): Verify absence of unscheduled binary events.`);
    return 20; // Slight haircut for tail risk
  } else if (safeIvr >= 20 && safeIvr < 35) {
    return safeDivide(safeIvr, 35, 0) * 20; // 11.4 to 20 pts
  } else {
    notes.push(`Low IV Rank (${safeIvr}%): Reduced volatility risk premium.`);
    return Math.max(0, safeDivide(safeIvr, 20, 0) * 10);
  }
}

export function evaluateDelta(
  delta: number,
  strategy: OptionStrategyType = 'CASH_SECURED_PUT',
  notes: string[] = []
): number {
  // Max 25 pts. Targets: Put delta ~0.15-0.25, Call delta ~0.20-0.30
  const absDelta = Math.abs(isFiniteNumber(delta) ? delta : 0.20);
  const minTarget = strategy === 'CASH_SECURED_PUT' ? 0.15 : 0.20;
  const maxTarget = strategy === 'CASH_SECURED_PUT' ? 0.25 : 0.30;

  if (absDelta >= minTarget && absDelta <= maxTarget) {
    return 25;
  }

  if (absDelta < minTarget) {
    const penaltyRatio = safeDivide(absDelta, minTarget, 0);
    return Math.max(5, penaltyRatio * 20); // Premium decays too rapidly
  }

  // Delta > maxTarget (Elevated assignment risk)
  if (absDelta > 0.35) {
    notes.push(`High assignment risk: Delta is ${absDelta.toFixed(2)}.`);
    return Math.max(0, 20 - (absDelta - maxTarget) * 100);
  }

  return 20;
}

export function evaluateTechnicalSupport(
  contract: OptionContract,
  technicals: TechnicalIndicators,
  notes: string[] = []
): number {
  // Max 25 pts. Evaluates relationship with 20 SMA, 50 SMA, and 200 SMA
  let score = 0;
  const { currentPrice, sma20, sma50, sma200 } = technicals;
  const strike = contract.strikePrice;

  if (contract.strategy === 'CASH_SECURED_PUT') {
    // Bullish trend filter: Price > 50 SMA and 50 SMA > 200 SMA
    const inBullishTrend = currentPrice > sma50 && sma50 > sma200;
    if (inBullishTrend) score += 10;
    else if (currentPrice > sma50) score += 6;

    // Support Level Cushion: Strike placed below key dynamic support
    if (strike < sma50) {
      score += 10; // Strike is protected below 50-day moving average
    } else if (strike < sma20) {
      score += 6; // Strike protected below 20-day moving average
    } else {
      notes.push('CSP strike is above short-term MA support levels.');
    }

    // RSI oversold bounce check
    if (technicals.rsi14 >= 40 && technicals.rsi14 <= 60) score += 5;
    else if (technicals.rsi14 < 35) score += 3; // Potential mean reversion entry
  } else {
    // Covered Call logic: Ensure stock isn't in severe breakdown, strike above resistance
    const above200Sma = currentPrice >= sma200;
    if (above200Sma) score += 10;

    if (strike >= sma20 && strike >= currentPrice) {
      score += 10; // Strike respects recent resistance
    } else {
      notes.push('CC strike set below key moving averages; risk of capping upside early.');
    }

    if (technicals.rsi14 <= 70) score += 5; // Avoid selling CC into an active breakout (>70 RSI)
  }

  return Math.min(25, score);
}

export function evaluateReturn(annualizedReturnPct: number, notes: string[] = []): number {
  // Max 15 pts. Target weekly annualized RoC: 18% to 35%+
  const safeRoC = isFiniteNumber(annualizedReturnPct) ? annualizedReturnPct : 0;
  if (safeRoC >= 18) {
    return 15;
  } else if (safeRoC >= 12 && safeRoC < 18) {
    return 10;
  } else {
    notes.push(`Low annualized return (${safeRoC.toFixed(1)}%).`);
    return Math.max(0, safeDivide(safeRoC, 12, 0) * 8);
  }
}

export function evaluateLiquidity(
  bidAskSpreadPct: number,
  openInterest: number,
  notes: string[] = []
): number {
  // Max 10 pts. Tight spread (<=5% of mid) and robust Open Interest (>=500 contracts)
  let score = 0;

  if (bidAskSpreadPct <= 5) score += 6;
  else if (bidAskSpreadPct <= 8) score += 4;
  else if (bidAskSpreadPct <= 12) score += 2;

  if (openInterest >= 500) score += 4;
  else if (openInterest >= 200) score += 2;
  else if (openInterest >= 100) score += 1;
  else notes.push('Low open interest (<100 contracts); potential fill slippage.');

  return score;
}

/**
 * Simplified dynamic evaluator for real-time simulator sliders.
 * Recomputes the composite score and sub-scores when sliders change.
 */
export function scoreFromSliderInputs(params: {
  strategy: OptionStrategyType;
  ivRank: number; // 0 to 100
  delta: number; // 0.10 to 0.50
  distTo50SmaPct: number; // e.g. -5.1% (strike is 5.1% below 50 SMA)
  annualizedReturnPct?: number;
  bidAskSpreadPct?: number;
  openInterest?: number;
  rsi14?: number;
  hasEarningsAlert?: boolean;
}): {
  compositeScore: number;
  breakdown: ScoreComponentBreakdown;
  qualityVerdict: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'CAUTION' | 'DISQUALIFIED';
  qualityDescription: string;
  notes: string[];
} {
  const notes: string[] = [];
  const {
    strategy,
    ivRank,
    delta,
    distTo50SmaPct,
    annualizedReturnPct = 26.5,
    bidAskSpreadPct = 3.5,
    openInterest = 1500,
    rsi14 = 52,
    hasEarningsAlert = false,
  } = params;

  // 1. IV Rank (Max 25)
  const ivScore = evaluateIvRank(ivRank, notes);

  // 2. Delta (Max 25)
  const deltaScore = evaluateDelta(delta, strategy, notes);

  // 3. Technical Score based on Distance to 50 SMA & Trend (Max 25)
  let technicalScore = 0;
  if (strategy === 'CASH_SECURED_PUT') {
    // Favorable if strike is below 50 SMA (distTo50SmaPct is negative, e.g. -5.1%)
    if (distTo50SmaPct <= -2.0) {
      technicalScore += 10; // Strike is well below 50 SMA
    } else if (distTo50SmaPct <= 0) {
      technicalScore += 6; // Strike is right at 50 SMA
    } else {
      notes.push('CSP strike is above 50 SMA.');
      technicalScore += 2;
    }

    // Bullish underlying assumed in sweet spot
    technicalScore += 10; // Price in healthy trend
    if (rsi14 >= 40 && rsi14 <= 60) technicalScore += 5;
    else technicalScore += 3;
  } else {
    // Covered Call: strike above 50 SMA / resistance
    if (distTo50SmaPct >= 2.0) {
      technicalScore += 10;
    } else if (distTo50SmaPct >= 0) {
      technicalScore += 6;
    } else {
      notes.push('CC strike is below 50 SMA.');
      technicalScore += 2;
    }
    technicalScore += 10;
    if (rsi14 <= 70) technicalScore += 5;
  }
  technicalScore = Math.min(25, technicalScore);

  // 4. Return on Capital (Max 15)
  const returnScore = evaluateReturn(annualizedReturnPct, notes);

  // 5. Liquidity (Max 10)
  const liquidityScore = evaluateLiquidity(bidAskSpreadPct, openInterest, notes);

  // Composite & Penalties
  let rawScore = ivScore + deltaScore + technicalScore + returnScore + liquidityScore;
  let passedRiskGate = true;

  if (hasEarningsAlert) {
    passedRiskGate = false;
    rawScore = Math.max(0, rawScore - 40);
    notes.push('CRITICAL RISK: Earnings announcement falls prior to weekly expiration.');
  }

  if (bidAskSpreadPct > 15) {
    passedRiskGate = false;
    notes.push('EXECUTION RISK: Bid/ask spread exceeds 15%.');
  }

  const compositeScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

  let qualityVerdict: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'CAUTION' | 'DISQUALIFIED' = 'MODERATE';
  let qualityDescription = '';

  if (!passedRiskGate || compositeScore < 50) {
    qualityVerdict = !passedRiskGate ? 'DISQUALIFIED' : 'CAUTION';
    qualityDescription = !passedRiskGate
      ? 'Fails Hard Risk Gates (Earnings/Spread)'
      : 'Sub-Optimal Setup (Elevated Assignment or Volatility Risk)';
  } else if (compositeScore >= 88) {
    qualityVerdict = 'VERY HIGH';
    qualityDescription = `Trade Quality: VERY HIGH (Optimal for ${strategy === 'CASH_SECURED_PUT' ? 'CSP' : 'CC'})`;
  } else if (compositeScore >= 72) {
    qualityVerdict = 'HIGH';
    qualityDescription = `Trade Quality: HIGH (Favorable ${strategy === 'CASH_SECURED_PUT' ? 'CSP' : 'CC'} Parameters)`;
  } else {
    qualityVerdict = 'MODERATE';
    qualityDescription = `Trade Quality: MODERATE (Acceptable Risk-Reward)`;
  }

  return {
    compositeScore,
    breakdown: {
      ivScore: roundToDecimals(ivScore, 1),
      deltaScore: roundToDecimals(deltaScore, 1),
      technicalScore: roundToDecimals(technicalScore, 1),
      returnScore: roundToDecimals(returnScore, 1),
      liquidityScore: roundToDecimals(liquidityScore, 1),
    },
    qualityVerdict,
    qualityDescription,
    notes,
  };
}
