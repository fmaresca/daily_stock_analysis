export interface CoveredCallItem {
  symbol: string;
  spot_price: number;
  strike: number;
  expiration: string;
  dte: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  bid: number;
  ask: number;
  mid: number;
  open_interest: number;
  volume: number;
  spread_pct: number;
  implied_volatility: number;
  iv_rank: number;
  iv_percentile: number;
  realized_volatility_30d: number;
  variance_risk_premium: number;
  static_yield_annualized: number;
  if_called_yield_annualized: number;
  downside_cushion_pct: number;
  breakeven_price: number;
  ex_dividend_date?: string | null;
  dividend_amount: number;
  early_assignment_risk: string;
  early_assignment_has_risk: boolean;
  ai_conviction_score?: number | null;
  ai_thesis?: string | null;
  earnings_date?: string | null;
  earnings_risk: boolean;
}

export interface CoveredCallScreenResponse {
  status: string;
  symbols: string[];
  total_candidates: number;
  data: Record<string, CoveredCallItem[]>;
}

export interface RollItem {
  new_strike: number;
  new_expiration: string;
  new_dte: number;
  new_bid: number;
  btc_ask: number;
  net_credit: number;
  new_annualized_yield: number;
  delta_adjustment: number;
  recommendation_score: number;
  rationale: string;
}

export interface RollOptimizerResponse {
  status: string;
  symbol: string;
  spot_price: number;
  cost_basis: number;
  current_strike: number;
  current_expiration: string;
  buy_to_close_ask: number;
  rolls: RollItem[];
}

export interface PayoffPoint {
  price: number;
  pnl: number;
  pnl_per_share: number;
  return_pct: number;
}

export interface PayoffCurveResponse {
  spot: number;
  strike: number;
  premium: number;
  cost_basis: number;
  contracts: number;
  breakeven_price: number;
  max_profit: number;
  max_profit_pct: number;
  points: PayoffPoint[];
}
