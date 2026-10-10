import { isCboeWeeklyOptionable } from '../data/cboeWeeklyDirectory';
import type { TickerMeta, OptionOpportunity } from '../types/options';
import { now } from './appNow.ts';

export interface PreFlightCheckItem {
  id: 'binary_events' | 'cboe_cadence' | 'liquidity_spread' | 'iv_rank' | 'technical_buffer' | 'earnings' | 'cboe_weekly';
  title: string;
  category: string;
  status: 'PASS' | 'CAUTION' | 'FAIL';
  metric: string;
  explanation: string;
  recommendation: string;
}

export interface OptionsPreFlightAudit {
  symbol: string;
  overallRating: 'PRIME' | 'CONDITIONAL' | 'AVOID';
  rating: 'PRIME' | 'CONDITIONAL' | 'AVOID';
  overallScore: number; // 0 to 5
  score: number;
  scoreLabel: string;
  passCount: number;
  cautionCount: number;
  failCount: number;
  recommendedStrategy: 'CSP' | 'CC' | 'STAND_ASIDE';
  recommendedStrikeDescription: string;
  checks: PreFlightCheckItem[];
  items: PreFlightCheckItem[];
  evaluatedAt: string;
}

/**
 * Institutional 5-Point Options Pre-Flight Readiness Evaluator.
 * Evaluates binary risk, CBOE weekly liquidity, volume/slippage, IV rank edge, and technical clearance.
 */
export function evaluateOptionsPreFlight(
  tickerOrConfig: any,
  argSpotPrice?: number,
  argIvRank?: number,
  argSma20?: number,
  argSma50?: number,
  argRsi14?: number,
  argAvgVolume30?: number,
  bestCSP?: OptionOpportunity | null,
  bestCC?: OptionOpportunity | null
): OptionsPreFlightAudit {
  const isConfigObj = typeof argSpotPrice !== 'number' && typeof tickerOrConfig === 'object' && tickerOrConfig !== null;
  const ticker: any = tickerOrConfig || {};
  const symbol = String(ticker.symbol || ticker.ticker || 'SPY').toUpperCase();
  const spotPrice = Number(isConfigObj ? (ticker.spotPrice ?? ticker.current_price ?? 100) : (argSpotPrice ?? ticker.current_price ?? 100)) || 100;
  const ivRank = Number(isConfigObj ? (ticker.ivRank ?? ticker.iv_rank ?? 40) : (argIvRank ?? 40));
  const sma20 = isConfigObj ? ticker.sma20 : argSma20;
  const sma50 = isConfigObj ? ticker.sma50 : argSma50;
  const rsi14 = isConfigObj ? ticker.rsi14 : argRsi14;
  const avgVolume30 = isConfigObj ? (ticker.avgVolume30 ?? ticker.avg_volume_30) : argAvgVolume30;
  const daysToEarnings = isConfigObj ? ticker.daysToEarnings : undefined;

  const checks: PreFlightCheckItem[] = [];

  // 1. Rule 1: Earnings & Binary Event Clearance
  const earnings7d = ticker.earnings_within_7d === true || (typeof daysToEarnings === 'number' && daysToEarnings <= 7);
  let earningsStatus: 'PASS' | 'CAUTION' | 'FAIL' = 'PASS';
  let earningsMetric = 'No earnings in next 14+ days';
  let earningsExplanation = 'Clear runway for premium harvest without binary event gap risk.';
  let earningsRec = 'Optimal for 7–21 DTE weekly options cycles.';

  if (earnings7d) {
    earningsStatus = 'FAIL';
    earningsMetric = typeof daysToEarnings === 'number' ? `Earnings in ${daysToEarnings}d` : 'Earnings ≤ 7 Days';
    earningsExplanation = 'Imminent corporate earnings release triggers severe volatility expansion and overnight gap risk.';
    earningsRec = 'Avoid selling options ahead of print. Re-enter 24h post-earnings once IV crush materializes.';
  } else if (typeof daysToEarnings === 'number' && daysToEarnings <= 14) {
    earningsStatus = 'CAUTION';
    earningsMetric = `Earnings in ${daysToEarnings} days`;
    earningsExplanation = 'Earnings approaching within 2 weeks. Time decay competes with pre-earnings IV ramp.';
    earningsRec = 'Select expiration strictly before earnings date to avoid binary risk.';
  } else if (ticker.earnings_date) {
    const daysUntil = Math.round((new Date(ticker.earnings_date).getTime() - now().getTime()) / (1000 * 3600 * 24));
    if (daysUntil <= 14 && daysUntil > 0) {
      earningsStatus = 'CAUTION';
      earningsMetric = `Earnings in ${daysUntil} days`;
      earningsExplanation = 'Earnings approaching within 2 weeks. Time decay competes with pre-earnings IV ramp.';
      earningsRec = `Select expiration strictly BEFORE ${ticker.earnings_date} to avoid binary risk.`;
    }
  }

  checks.push({
    id: 'binary_events',
    title: '1. Earnings & Binary Event Clearance',
    category: 'Risk Mitigation',
    status: earningsStatus,
    metric: earningsMetric,
    explanation: earningsExplanation,
    recommendation: earningsRec,
  });

  // 2. Rule 2: CBOE Weekly Options Liquidity & Cadence
  const isWeekly = isCboeWeeklyOptionable(symbol) || ticker.has_weeklys === true || ticker.hasWeeklys === true;
  let weeklyStatus: 'PASS' | 'CAUTION' | 'FAIL' = isWeekly ? 'PASS' : 'CAUTION';
  let weeklyMetric = isWeekly ? 'CBOE Weeklys Active (Friday Expirations)' : 'Monthly Expirations Only';
  let weeklyExplanation = isWeekly
    ? 'Symbol is certified on CBOE Weekly Options Directory. Highly granular weekly delta roll adjustments available.'
    : 'Symbol only offers standard monthly (third Friday) expirations. Less flexibility for rapid theta harvesting.';
  let weeklyRec = isWeekly
    ? 'Deploy 7–14 DTE short strikes to harvest accelerated theta decay curves.'
    : 'Must utilize 30–45 DTE monthly cycles and manage position at 50% profit target.';

  checks.push({
    id: 'cboe_cadence',
    title: '2. CBOE Weekly Liquidity Cadence',
    category: 'Execution Flexibility',
    status: weeklyStatus,
    metric: weeklyMetric,
    explanation: weeklyExplanation,
    recommendation: weeklyRec,
  });

  // 3. Rule 3: Volume & Slippage Efficiency
  const vol = avgVolume30 ?? ticker.avg_volume_30 ?? 2000000;
  const isTier1 = ticker.liquidity_tier === 'Tier 1' || vol >= 1500000;
  const isTier4 = ticker.liquidity_tier === 'Tier 4' || vol < 400000;
  let liqStatus: 'PASS' | 'CAUTION' | 'FAIL' = isTier1 ? 'PASS' : isTier4 ? 'FAIL' : 'CAUTION';
  let liqMetric = `${(vol / 1000000).toFixed(2)}M avg volume (${ticker.liquidity_tier || (isTier1 ? 'Tier 1' : 'Tier 2')})`;
  let liqExplanation = isTier1
    ? 'High market maker presence guarantees tight bid/ask spreads (< $0.05) and instant limit order execution.'
    : isTier4
    ? 'Thin volume creates wide bid/ask spreads. Entering and exiting spreads will suffer significant slippage.'
    : 'Moderate liquidity. Option spreads may range $0.10–$0.20 wide; limit orders mandatory.';
  let liqRec = isTier1
    ? 'Safe to execute single-leg or multi-leg combinations with minimal friction.'
    : isTier4
    ? 'Avoid writing options on this ticker due to prohibitive illiquidity penalty.'
    : 'Always work limit orders midway between bid and ask; avoid market orders.';

  checks.push({
    id: 'liquidity_spread',
    title: '3. Volume & Slippage Efficiency',
    category: 'Market Quality',
    status: liqStatus,
    metric: liqMetric,
    explanation: liqExplanation,
    recommendation: liqRec,
  });

  // 4. Rule 4: Implied Volatility Edge (IV Rank)
  let ivStatus: 'PASS' | 'CAUTION' | 'FAIL' = 'PASS';
  let ivMetric = `IV Rank: ${ivRank} / 100`;
  let ivExplanation = '';
  let ivRec = '';

  if (ivRank >= 40) {
    ivStatus = 'PASS';
    ivExplanation = `IV Rank is elevated at ${ivRank}th percentile. Implied volatility significantly exceeds historical norm, generating high option premium.`;
    ivRec = 'Prime environment for option sellers (high Volatility Risk Premium harvest).';
  } else if (ivRank >= 20) {
    ivStatus = 'CAUTION';
    ivExplanation = `IV Rank is moderate at ${ivRank}th percentile. Premiums are average; cushion against unexpected downside is narrower.`;
    ivRec = 'Enforce conservative 12Δ–15Δ strike targets to compensate for lower premium yields.';
  } else {
    ivStatus = 'FAIL';
    ivExplanation = `IV Rank is depressed at ${ivRank}th percentile. Options are cheap; seller receives inadequate compensation for capital tie-up.`;
    ivRec = 'Consider Poor Man\'s Covered Call (PMCC) or debit spreads instead of naked CSP.';
  }

  checks.push({
    id: 'iv_rank',
    title: '4. Implied Volatility Edge (IV Rank)',
    category: 'Premium Pricing',
    status: ivStatus,
    metric: ivMetric,
    explanation: ivExplanation,
    recommendation: ivRec,
  });

  // 5. Rule 5: Technical Buffer & Trend Posture
  const activeSma20 = sma20 ?? spotPrice;
  const activeRsi = rsi14 ?? 50;
  const isAboveSma20 = spotPrice >= activeSma20;
  const sma20Cushion = spotPrice > 0 && activeSma20 > 0 ? ((spotPrice - activeSma20) / spotPrice) * 100 : 0;
  let techStatus: 'PASS' | 'CAUTION' | 'FAIL' = 'PASS';
  let techMetric = `Spot $${spotPrice.toFixed(2)} vs 20d SMA $${activeSma20.toFixed(2)} | RSI ${activeRsi.toFixed(1)}`;
  let techExplanation = '';
  let techRec = '';

  if (activeRsi < 30) {
    techStatus = 'FAIL';
    techExplanation = `RSI-14 is in extreme oversold breakdown (${activeRsi.toFixed(1)}). Falling knife hazard indicates institutional dumping.`;
    techRec = 'Wait for RSI momentum stabilization above 35 before writing Cash-Secured Puts.';
  } else if (activeRsi > 75) {
    techStatus = 'CAUTION';
    techExplanation = `RSI-14 is in severe overbought territory (${activeRsi.toFixed(1)}). Elevated probability of mean-reversion pullbacks.`;
    techRec = 'Covered Calls are favored; avoid chasing aggressive CSP strikes at local highs.';
  } else if (isAboveSma20) {
    techStatus = 'PASS';
    techExplanation = `Bullish posture: Spot is trading above 20-day SMA ($${activeSma20.toFixed(2)}) with ${sma20Cushion.toFixed(1)}% buffer. Healthy trend alignment.`;
    techRec = 'Target CSP strikes at or below 20-day SMA support rail.';
  } else {
    techStatus = 'CAUTION';
    techExplanation = `Spot is trading below 20-day SMA ($${activeSma20.toFixed(2)}). Stock is consolidating or in mild corrective phase.`;
    techRec = 'Enforce minimum 7.0% downside clearance below 50-day moving average.';
  }

  checks.push({
    id: 'technical_buffer',
    title: '5. Technical Buffer & Trend Posture',
    category: 'Directional Guard',
    status: techStatus,
    metric: techMetric,
    explanation: techExplanation,
    recommendation: techRec,
  });

  // Calculate composite score
  const passCount = checks.filter((c) => c.status === 'PASS').length;
  const cautionCount = checks.filter((c) => c.status === 'CAUTION').length;
  const failCount = checks.filter((c) => c.status === 'FAIL').length;
  const score = passCount * 1.0 + cautionCount * 0.5;

  let overallRating: 'PRIME' | 'CONDITIONAL' | 'AVOID' = 'CONDITIONAL';
  let scoreLabel = 'Conditional Entry · Widen Margin';
  let recommendedStrategy: 'CSP' | 'CC' | 'STAND_ASIDE' = 'CSP';
  let recommendedStrikeDescription = '';

  if (failCount === 0 && score >= 4.0) {
    overallRating = 'PRIME';
    scoreLabel = 'Institutional Prime Setup · Green Light';
    if (activeRsi >= 62) {
      recommendedStrategy = 'CC';
      const targetStrike = bestCC ? `$${bestCC.strike.toFixed(2)} (+${bestCC.cushion_pct}% upside)` : 'Target 20Δ call rail';
      recommendedStrikeDescription = `Write Covered Call at ${targetStrike}.`;
    } else {
      recommendedStrategy = 'CSP';
      const targetStrike = bestCSP ? `$${bestCSP.strike.toFixed(2)} (-${bestCSP.cushion_pct}% buffer)` : 'Target 16Δ put rail';
      recommendedStrikeDescription = `Write Cash-Secured Put at ${targetStrike} (PoP > 80%).`;
    }
  } else if (failCount >= 2 || earningsStatus === 'FAIL') {
    overallRating = 'AVOID';
    scoreLabel = 'High Tail Risk · Stand Aside';
    recommendedStrategy = 'STAND_ASIDE';
    recommendedStrikeDescription = 'Stand aside. Imminent earnings or severe illiquidity violates risk threshold.';
  } else {
    overallRating = 'CONDITIONAL';
    scoreLabel = 'Conditional Entry · Stricter Safety Rails';
    recommendedStrategy = isAboveSma20 ? 'CSP' : 'CC';
    recommendedStrikeDescription = 'Enforce conservative strikes with minimum 6.5% buffer and smaller sizing.';
  }

  return {
    symbol,
    overallRating,
    rating: overallRating,
    overallScore: Math.round(score * 10) / 10,
    score: Math.round(score * 10) / 10,
    scoreLabel,
    passCount,
    cautionCount,
    failCount,
    recommendedStrategy,
    recommendedStrikeDescription,
    checks,
    items: checks,
    evaluatedAt: new Date().toISOString(), // wall-clock-ok: evaluation audit timestamp
  };
}
