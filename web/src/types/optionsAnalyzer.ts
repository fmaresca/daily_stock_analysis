export interface OptionsCandidate {
  ticker: string;
  strategy: 'CSP' | 'COVERED_CALL';
  current_price: number;
  recommended_strike: number;
  expiration_date: string;
  dte: number;
  delta: number;
  bid_ask: string;
  expected_premium: number;
  downside_cushion_pct: number;
  annualized_yield_pct: number;
  iv_rank?: number;
  technical_anchor: string;
  earnings_date?: string;
  selection_tier: 'PRIMARY' | 'SECONDARY' | string;
  risk_factors?: string;
}

export interface RejectedCandidate {
  ticker: string;
  reason: string;
}

export interface OptionsAnalysisResponse {
  market_regime_context: string;
  candidates: OptionsCandidate[];
  rejected_candidates: RejectedCandidate[];
}

export interface AnalyzerSettings {
  strategy: 'CSP' | 'COVERED_CALL' | 'BOTH';
  minAroc: number;
  modelOverride: string;
}
