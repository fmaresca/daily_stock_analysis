/**
 * Institutional Strategy Playbooks for US Equities & Options.
 * Declarative playbooks that inject specialized underwriting rules into Strategy Agent sessions.
 */

export const STRATEGY_PLAYBOOKS = [
  {
    id: "conservative_income_csp",
    name: "Conservative Theta Income (CSP)",
    category: "Income",
    targetDelta: "15Δ – 18Δ",
    minCushionPct: 6.0,
    idealIvRank: "> 35",
    description: "Systematic cash-secured put underwriting targeting ≥ 80% PoP, selling strictly below verified 20d/50d SMA moving average support rails.",
    instructions: `
Playbook: Conservative Theta Income (Cash-Secured Put)
Mandate:
1. Target strike delta strictly within 14Δ–18Δ range (PoP > 80%).
2. Require minimum 6.0% downside cushion from current spot price.
3. Strike MUST be anchored at or below the 20-day Simple Moving Average ($sma20).
4. Verify no earnings announcement within 14 days.
5. Emphasize annualized Return on Capital (ROC) target of 14%–22%.
`,
  },
  {
    id: "aggressive_momentum_cc",
    name: "Momentum Resistance Covered Call (CC)",
    category: "Yield",
    targetDelta: "20Δ – 25Δ",
    minCushionPct: 5.0,
    idealIvRank: "> 45",
    description: "Tactical covered call writing on extended uptrend equities near the 2-sigma upper Bollinger Band rail to harvest rich premium before resistance consolidation.",
    instructions: `
Playbook: Momentum Resistance Covered Call (CC)
Mandate:
1. Target strike delta within 18Δ–24Δ range.
2. Require short call strike to sit at or above the 2-sigma Upper Bollinger Band rail ($upperBb).
3. Confirm RSI-14 is elevated (> 62), indicating elevated probability of short-term consolidation.
4. Calculate net profit if called away (strike gain + premium harvest) vs static yield.
`,
  },
  {
    id: "pmcc_growth_compounder",
    name: "Poor Man's Covered Call (PMCC)",
    category: "Leveraged Growth",
    targetDelta: "Long 80Δ / Short 20Δ",
    minCushionPct: 8.0,
    idealIvRank: "< 35 for Leap, > 45 for Short",
    description: "Synthetic covered call replacement utilizing deep in-the-money LEAP calls (≥ 180 DTE, 0.80 Delta) as collateral while selling front-month weekly calls.",
    instructions: `
Playbook: Poor Man's Covered Call (PMCC / Diagonal Spread)
Mandate:
1. Long collateral leg: 80Δ+ deep ITM LEAP with at least 180+ DTE (extrinsic value < 10% of premium).
2. Short income leg: 18Δ–22Δ OTM call with 7–21 DTE.
3. Strike width check: Distance between long and short strike must exceed total net debit paid.
4. Emphasize capital efficiency: Releases 65%–75% collateral compared to owning 100 shares of stock.
`,
  },
  {
    id: "earnings_vol_crush_post",
    name: "Post-Earnings Volatility Crush",
    category: "Event-Driven",
    targetDelta: "12Δ – 16Δ",
    minCushionPct: 8.5,
    idealIvRank: "Immediate Post-Earnings",
    description: "Writing cash-secured puts 24-48 hours after earnings reports once market direction has confirmed and implied volatility is rapidly contracting.",
    instructions: `
Playbook: Post-Earnings Volatility Crush Re-entry
Mandate:
1. Wait until corporate earnings have been released and initial overnight gap has been absorbed.
2. Identify new post-earnings support pivot.
3. Write short put with deep 8.5%+ cushion below the post-earnings low.
4. Capitalize on IV collapse as post-earnings uncertainty premium deflates.
`,
  },
  {
    id: "mean_reversion_oversold_bounce",
    name: "Mean-Reversion Capitulation Bounce",
    category: "Contrarian",
    targetDelta: "10Δ – 14Δ",
    minCushionPct: 10.0,
    idealIvRank: "> 55",
    description: "Contrarian put underwriting when Tier-1 mega-cap stock reaches extreme oversold conditions (RSI < 30, Lower Bollinger Band breach) with elevated IV.",
    instructions: `
Playbook: Mean-Reversion Capitulation Bounce
Mandate:
1. Identify extreme statistical stretch: Spot trading below Lower Bollinger rail ($lowerBb) and RSI < 32.
2. Verify stock is a profitable Tier-1 mega-cap, not a structurally impaired bankrupt equity.
3. Sell wide out-of-the-money put with minimum 10.0% cushion below panic lows.
4. Expect rapid theta + vega profit realization upon initial relief bounce back into Bollinger envelope.
`,
  },
];

/**
 * Resolves a playbook by ID or returns the conservative default.
 */
export function getPlaybookById(id) {
  return STRATEGY_PLAYBOOKS.find((p) => p.id === id) || STRATEGY_PLAYBOOKS[0];
}

/**
 * Ranks playbooks suitability based on spot, moving averages, RSI, and IV Rank.
 */
export function evaluatePlaybookSuitability({ spotPrice, sma20, rsi14, ivRank } = {}) {
  const spot = Number(spotPrice) || 100;
  const sma = Number(sma20) || spot;
  const rsi = Number(rsi14) || 50;
  const iv = Number(ivRank) || 40;

  return STRATEGY_PLAYBOOKS.map((pb) => {
    let score = 60;
    if (pb.id === "conservative_income_csp" && spot >= sma && rsi <= 62) score = 92;
    else if (pb.id === "aggressive_momentum_cc" && rsi >= 62) score = 88;
    else if (pb.id === "mean_reversion_oversold_bounce" && rsi < 35) score = 95;
    else if (pb.id === "earnings_vol_crush_post" && iv > 50) score = 80;
    else if (pb.id === "pmcc_growth_compounder" && spot >= sma) score = 78;

    return {
      playbookId: pb.id,
      name: pb.name,
      confidence: score,
    };
  }).sort((a, b) => b.confidence - a.confidence);
}
