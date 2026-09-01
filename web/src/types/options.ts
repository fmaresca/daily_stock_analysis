export type StrategyType = 'CSP' | 'CC';

export interface TickerMeta {
  symbol: string;
  name: string;
  sector: string;
  liquidity_tier: string;
  liquidity_warning?: string;
  spot_price: number;
  avg_volume_30: number;
  sma_20: number;
  upper_bb: number;
  lower_bb: number;
  bb_width_pct: number;
  rsi_14: number;
  rsi_flag: string;
  hv_30: number;
  iv_current: number;
  iv_rank: number;
  earnings_within_7d: boolean;
  next_earnings_date: string;
  has_weeklys?: boolean;
  expiration_cadence?: string;
  nearest_expiration_date?: string;
  days_to_nearest_expiration?: number;
  is_monthly_adjusted?: boolean;
  options_cadence?: string;
  in_cboe_registry?: boolean;
  next_options_expiration?: string;
  next_options_dte?: number;
  target_exp?: string;
  target_dte?: number;
}

export interface OptionOpportunity {
  id: string;
  symbol: string;
  name: string;
  category: string;
  sector: string;
  liquidity_tier?: string;
  liquidity_warning?: string;
  strategy: StrategyType;
  strategy_name: string;
  expiration: string;
  dte: number;
  current_price: number;
  strike: number;
  type: 'put' | 'call';
  bid: number;
  ask: number;
  mid: number;
  collateral_required: number;
  premium_total: number;
  breakeven: number;
  cushion_pct: number;
  roc_pct: number;
  annualized_roc: number;
  max_return_pct?: number;
  annualized_max?: number;
  delta: number;
  abs_delta: number;
  theta: number;
  pop_pct: number;
  iv: number;
  iv_rank: number;
  hv_30?: number;
  sma_20?: number;
  upper_bb?: number;
  lower_bb?: number;
  bb_width_pct?: number;
  rsi: number;
  rsi_14?: number;
  rsi_flag?: string;
  earnings_within_7d?: boolean;
  next_earnings_date?: string;
  trend?: string;
  support_level?: number;
  dist_to_support?: number;
  safety_tier: string;
  tier_color: string;
  tags: string[];
  rating: number;
}

export interface ScreenerSummary {
  generated_at: string;
  total_screened_tickers: number;
  total_opportunities: number;
  csp_count: number;
  cc_count: number;
  avg_annualized_yield_csp: number;
  avg_annualized_yield_cc: number;
  top_volatility_tickers: {
    symbol: string;
    iv: number;
    iv_rank: number;
  }[];
  tier_breakdown?: {
    tier_1_count: number;
    tier_4_count: number;
    earnings_warning_count: number;
  };
}

export interface OptionsDataPayload {
  metadata: {
    title: string;
    description: string;
    version: string;
    last_updated: string;
    target_delta_range: string;
    target_dte_range: string;
    strike_heuristics?: string;
  };
  summary: ScreenerSummary;
  tickers?: TickerMeta[];
  opportunities: OptionOpportunity[];
}

export interface FilterState {
  search: string;
  onlyHighIvr?: boolean;
  onlyOversold?: boolean;
  onlyEarningsAlert?: boolean;
  weeklyCadence?: 'ALL' | 'WEEKLY_ONLY' | 'MONTHLY_ONLY';
  liquidityTier?: string;
  strategy?: 'ALL' | 'CSP' | 'CC';
  maxDelta?: number;
  minAnnualizedYield?: number;
  minDte?: number;
  maxDte?: number;
  minIvRank?: number;
  maxRsi?: number;
  selectedSector?: string;
  safetyTier?: string;
  sortBy: any;
  sortOrder: 'asc' | 'desc';
}
