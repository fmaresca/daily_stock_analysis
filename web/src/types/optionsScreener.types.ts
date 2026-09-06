/**
 * Quantitative Options Trade Quality Scoring Model Types
 * Specification for 100-Point Composite Evaluation of Weekly CSPs & CCs
 */

export type OptionStrategyType = 'CASH_SECURED_PUT' | 'COVERED_CALL';

export interface TechnicalIndicators {
  currentPrice: number;
  sma20: number;
  sma50: number;
  sma200: number;
  rsi14: number;
  averageTrueRange14?: number;
}

export interface OptionContract {
  ticker: string;
  strategy: OptionStrategyType;
  expirationDate: string; // YYYY-MM-DD
  daysToExpiration: number; // Targeted for weeklies (3 - 10 days)
  strikePrice: number;
  bid: number;
  ask: number;
  impliedVolatility: number;
  ivRank: number; // 0 to 100
  delta: number; // Absolute value (e.g., 0.18)
  openInterest: number;
  volume: number;
  hasEarningsBeforeExpiration: boolean;
}

export interface ScoreComponentBreakdown {
  ivScore: number; // Max 25
  deltaScore: number; // Max 25
  technicalScore: number; // Max 25
  returnScore: number; // Max 15
  liquidityScore: number; // Max 10
}

export interface ScreenedTradeCandidate {
  contract: OptionContract;
  technicals: TechnicalIndicators;
  compositeScore: number; // 0 to 100
  breakdown: ScoreComponentBreakdown;
  metrics: {
    midPrice: number;
    bidAskSpreadPct: number;
    bufferToStrikePct: number; // Distance from current price to strike
    annualizedReturnPct: number;
    breakEvenPrice: number;
  };
  passedRiskGate: boolean;
  notes: string[];
}
