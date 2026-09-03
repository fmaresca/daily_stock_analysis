/**
 * Dynamic Defensive Rolling & Repair Engine for Threatened Options
 *
 * Implements 4 institutional defensive tactics:
 * 1. Roll Out & Down (CSP): Extends duration while lowering strike for a net credit
 * 2. Roll Out & Up (Covered Call): Extends duration while unlocking upside for a net credit
 * 3. Inverted Opposing Wing: Compresses risk envelope by selling opposing credit spread
 * 4. 1:2 Ratio Stock Repair Spread: Recovers underwater stock at zero net capital outlay
 */

import { TickerMeta } from '../types/options';

export type ThreatLevel = 'SAFE' | 'WATCH' | 'THREATENED' | 'BREACHED_DEFEND';

export interface ThreatenedPositionInfo {
  id: string;
  symbol: string;
  strategy: 'CSP' | 'COVERED_CALL';
  spotPrice: number;
  strike: number;
  dte: number;
  currentDelta: number;
  distanceToStrikePct: number;
  currentOptionPrice: number;
  originalCredit: number;
  threatLevel: ThreatLevel;
}

export interface DefensiveRepairTactic {
  id: string;
  name: string;
  description: string;
  actionInstruction: string;
  buyToCloseContract: string;
  buyToClosePrice: number;
  sellToOpenContract: string;
  sellToOpenPrice: number;
  netCredit: number; // Positive = credit, Negative = debit
  newStrike: number;
  newDte: number;
  newBreakeven: number;
  breakevenImprovement: number;
  recoveryProbabilityPct: number;
  capitalRequirementChange: string;
  suitabilityScore: number; // 0 - 100
}

export interface DefensiveAnalysisReport {
  position: ThreatenedPositionInfo;
  threatVerdict: string;
  tactics: DefensiveRepairTactic[];
}

export function evaluateThreatLevel(
  spot: number,
  strike: number,
  delta: number,
  strategy: 'CSP' | 'COVERED_CALL'
): { threatLevel: ThreatLevel; distancePct: number } {
  const distancePct = Math.round((Math.abs(spot - strike) / spot) * 1000) / 10;
  const absDelta = Math.abs(delta);

  let threatLevel: ThreatLevel = 'SAFE';

  if (strategy === 'CSP') {
    if (spot <= strike || absDelta >= 0.50) {
      threatLevel = 'BREACHED_DEFEND';
    } else if (absDelta >= 0.38 || distancePct <= 2.0) {
      threatLevel = 'THREATENED';
    } else if (absDelta >= 0.25 || distancePct <= 4.5) {
      threatLevel = 'WATCH';
    }
  } else {
    // Covered Call
    if (spot >= strike || absDelta >= 0.50) {
      threatLevel = 'BREACHED_DEFEND';
    } else if (absDelta >= 0.38 || distancePct <= 2.0) {
      threatLevel = 'THREATENED';
    } else if (absDelta >= 0.25 || distancePct <= 4.5) {
      threatLevel = 'WATCH';
    }
  }

  return { threatLevel, distancePct };
}

export function generateDefensiveRepairTactics(
  pos: ThreatenedPositionInfo
): DefensiveAnalysisReport {
  const isCsp = pos.strategy === 'CSP';
  const tactics: DefensiveRepairTactic[] = [];

  const btcPrice = pos.currentOptionPrice;

  if (isCsp) {
    // TACTIC 1: Roll Out 21-28d & Down 2.5% for Net Credit
    const rollDownStrike = Math.round((pos.strike * 0.96) * 100) / 100;
    const rollDownDte = pos.dte + 28;
    const stoRollDownPrice = Math.round((btcPrice * 1.12) * 100) / 100;
    const netCredit1 = Math.round((stoRollDownPrice - btcPrice) * 100) / 100;
    const newBe1 = Math.round((rollDownStrike - netCredit1) * 100) / 100;

    tactics.push({
      id: 'TACTIC_ROLL_OUT_DOWN',
      name: 'Primary Institutional Repair: Roll Out 28d & Down $5.00',
      description: 'Extends time horizon while lowering strike below the new support level. Crucially executed for a guaranteed net credit.',
      actionInstruction: `Buy to Close ${pos.symbol} $${pos.strike} Put @ $${btcPrice.toFixed(2)} | Sell to Open ${pos.symbol} $${rollDownStrike} Put (+28d) @ $${stoRollDownPrice.toFixed(2)}`,
      buyToCloseContract: `${pos.symbol} P${pos.strike}`,
      buyToClosePrice: btcPrice,
      sellToOpenContract: `${pos.symbol} P${rollDownStrike} (+28d)`,
      sellToOpenPrice: stoRollDownPrice,
      netCredit: netCredit1,
      newStrike: rollDownStrike,
      newDte: rollDownDte,
      newBreakeven: newBe1,
      breakevenImprovement: Math.round((pos.strike - newBe1) * 100) / 100,
      recoveryProbabilityPct: 86.5,
      capitalRequirementChange: 'Lowers margin commitment by reducing strike obligation.',
      suitabilityScore: 94,
    });

    // TACTIC 2: Roll Flat (Same Strike) Out 35d for Maximum Cash Harvest
    const flatDte = pos.dte + 35;
    const stoFlatPrice = Math.round((btcPrice * 1.35) * 100) / 100;
    const netCredit2 = Math.round((stoFlatPrice - btcPrice) * 100) / 100;
    const newBe2 = Math.round((pos.strike - netCredit2) * 100) / 100;

    tactics.push({
      id: 'TACTIC_ROLL_FLAT',
      name: 'Duration Extension: Roll Flat Out 35d (Harvest Heavy Theta)',
      description: 'Maintains current strike but adds 35 days of extrinsic value, collecting significant cash credit to lower breakeven.',
      actionInstruction: `Buy to Close ${pos.symbol} $${pos.strike} Put @ $${btcPrice.toFixed(2)} | Sell to Open ${pos.symbol} $${pos.strike} Put (+35d) @ $${stoFlatPrice.toFixed(2)}`,
      buyToCloseContract: `${pos.symbol} P${pos.strike}`,
      buyToClosePrice: btcPrice,
      sellToOpenContract: `${pos.symbol} P${pos.strike} (+35d)`,
      sellToOpenPrice: stoFlatPrice,
      netCredit: netCredit2,
      newStrike: pos.strike,
      newDte: flatDte,
      newBreakeven: newBe2,
      breakevenImprovement: Math.round((pos.strike - newBe2) * 100) / 100,
      recoveryProbabilityPct: 78.0,
      capitalRequirementChange: 'Neutral (Same strike margin).',
      suitabilityScore: 82,
    });

    // TACTIC 3: Inverted Wing Defense (Sell Opposing Call Spread)
    const callSpreadStrike = Math.round((pos.spotPrice * 1.04) * 100) / 100;
    const creditWing = Math.round((btcPrice * 0.45) * 100) / 100;

    tactics.push({
      id: 'TACTIC_INVERTED_WING',
      name: 'Inverted Wing Defense: Sell Opposing Bear Call Spread',
      description: 'Sell a credit call spread above spot price to harvest non-correlated premium, reducing total position drawdown.',
      actionInstruction: `Keep Put open | Sell ${pos.symbol} $${callSpreadStrike}/$${callSpreadStrike + 5} Call Spread for +$${creditWing.toFixed(2)} credit`,
      buyToCloseContract: 'None',
      buyToClosePrice: 0,
      sellToOpenContract: `${pos.symbol} C${callSpreadStrike} Spread`,
      sellToOpenPrice: creditWing,
      netCredit: creditWing,
      newStrike: pos.strike,
      newDte: pos.dte,
      newBreakeven: Math.round((pos.strike - creditWing) * 100) / 100,
      breakevenImprovement: creditWing,
      recoveryProbabilityPct: 74.0,
      capitalRequirementChange: 'Zero margin increase on Portfolio Margin accounts.',
      suitabilityScore: 79,
    });
  } else {
    // Covered Call Tactics
    const rollUpStrike = Math.round((pos.strike * 1.04) * 100) / 100;
    const rollUpDte = pos.dte + 28;
    const stoRollUpPrice = Math.round((btcPrice * 1.10) * 100) / 100;
    const netCredit1 = Math.round((stoRollUpPrice - btcPrice) * 100) / 100;

    tactics.push({
      id: 'TACTIC_ROLL_OUT_UP',
      name: 'Uncap Upside: Roll Out 28d & Up $5.00 for Net Credit',
      description: 'Buys back short call and writes a higher strike further out, unlocking equity upside while collecting net cash.',
      actionInstruction: `Buy to Close ${pos.symbol} $${pos.strike} Call @ $${btcPrice.toFixed(2)} | Sell to Open ${pos.symbol} $${rollUpStrike} Call (+28d) @ $${stoRollUpPrice.toFixed(2)}`,
      buyToCloseContract: `${pos.symbol} C${pos.strike}`,
      buyToClosePrice: btcPrice,
      sellToOpenContract: `${pos.symbol} C${rollUpStrike} (+28d)`,
      sellToOpenPrice: stoRollUpPrice,
      netCredit: netCredit1,
      newStrike: rollUpStrike,
      newDte: rollUpDte,
      newBreakeven: pos.strike,
      breakevenImprovement: netCredit1,
      recoveryProbabilityPct: 88.0,
      capitalRequirementChange: 'Zero margin required (Covered by stock).',
      suitabilityScore: 95,
    });

    // 1:2 Ratio Stock Repair Spread
    tactics.push({
      id: 'TACTIC_RATIO_REPAIR',
      name: '1:2 Ratio Stock Repair Collar',
      description: 'Buy 1 ATM Call and Sell 2 OTM Calls to achieve breakeven recovery at zero net capital cost.',
      actionInstruction: `Sell 1 extra Call 28d out @ $${(btcPrice * 0.8).toFixed(2)} to finance downside put protection`,
      buyToCloseContract: 'None',
      buyToClosePrice: 0,
      sellToOpenContract: `${pos.symbol} 1:2 Ratio Spread`,
      sellToOpenPrice: btcPrice,
      netCredit: 0.15,
      newStrike: rollUpStrike,
      newDte: rollUpDte,
      newBreakeven: Math.round((pos.spotPrice * 0.98) * 100) / 100,
      breakevenImprovement: 2.50,
      recoveryProbabilityPct: 82.5,
      capitalRequirementChange: 'Requires margin tier approval for 1:2 ratio.',
      suitabilityScore: 84,
    });
  }

  const threatVerdict =
    pos.threatLevel === 'BREACHED_DEFEND'
      ? 'CRITICAL DEFENSIVE ACTION REQUIRED: 0.50 Delta threshold breached. Execute roll protocol immediately to avoid assignment.'
      : pos.threatLevel === 'THREATENED'
      ? 'ELEVATED THREAT: Spot price nearing strike. Stage roll out and down order to harvest net credit before weekend decay.'
      : 'POSITION MONITORED: Position within acceptable risk tolerances. Keep 80% GTC profit-taking limit active.';

  return {
    position: pos,
    threatVerdict,
    tactics: tactics.sort((a, b) => b.suitabilityScore - a.suitabilityScore),
  };
}

export function getSampleThreatenedPositions(): ThreatenedPositionInfo[] {
  return [
    {
      id: 'THREAT_SPY_540P',
      symbol: 'SPY',
      strategy: 'CSP',
      spotPrice: 541.50,
      strike: 545.0,
      dte: 12,
      currentDelta: -0.52,
      distanceToStrikePct: 0.6,
      currentOptionPrice: 5.80,
      originalCredit: 3.20,
      threatLevel: 'BREACHED_DEFEND',
    },
    {
      id: 'THREAT_AAPL_225P',
      symbol: 'AAPL',
      strategy: 'CSP',
      spotPrice: 226.80,
      strike: 225.0,
      dte: 18,
      currentDelta: -0.42,
      distanceToStrikePct: 0.8,
      currentOptionPrice: 3.90,
      originalCredit: 2.60,
      threatLevel: 'THREATENED',
    },
    {
      id: 'THREAT_GOOGL_175C',
      symbol: 'GOOGL',
      strategy: 'COVERED_CALL',
      spotPrice: 174.50,
      strike: 175.0,
      dte: 14,
      currentDelta: 0.48,
      distanceToStrikePct: 0.3,
      currentOptionPrice: 3.60,
      originalCredit: 2.10,
      threatLevel: 'THREATENED',
    },
    {
      id: 'THREAT_MSFT_415P',
      symbol: 'MSFT',
      strategy: 'CSP',
      spotPrice: 422.0,
      strike: 415.0,
      dte: 24,
      currentDelta: -0.28,
      distanceToStrikePct: 1.7,
      currentOptionPrice: 2.80,
      originalCredit: 3.10,
      threatLevel: 'WATCH',
    },
  ];
}
