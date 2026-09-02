export type StrategyType =
  | 'CSP'
  | 'CC'
  | 'BULL_PUT_SPREAD'
  | 'BEAR_CALL_SPREAD'
  | 'IRON_CONDOR';

export interface MultiLegSpread {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  strategy: 'BULL_PUT_SPREAD' | 'BEAR_CALL_SPREAD' | 'IRON_CONDOR';
  strategy_name: string;
  expiration: string;
  dte: number;
  current_price: number;
  // Short leg anchored in 0.15 - 0.20 Delta outside Bollinger Bands
  short_strike: number;
  short_delta: number;
  short_type: 'put' | 'call';
  // Long protective wing
  long_strike: number;
  long_delta: number;
  long_type: 'put' | 'call';
  // Call side if Iron Condor
  call_short_strike?: number;
  call_short_delta?: number;
  call_long_strike?: number;
  call_long_delta?: number;

  spread_width: number;
  net_credit: number;
  max_loss: number;
  collateral_required: number;
  breakeven: number;
  upper_breakeven?: number;
  cushion_pct: number;
  roc_pct: number;
  annualized_roc: number;
  pop_pct: number;
  iv_rank: number;
  liquidity_tier?: string;
  has_weeklys?: boolean;
  is_monthly_adjusted?: boolean;
}

export interface VolatilitySkewData {
  symbol: string;
  name: string;
  spot_price: number;
  put_iv_25d: number;
  call_iv_25d: number;
  iv_skew_spread: number;
  skew_sentiment: 'Heavy Put Demand (Bearish Fear)' | 'Neutral Skew' | 'Call Skew (Bullish Speculation)';
  term_structure: {
    label: string;
    dte: number;
    iv: number;
    isInverted: boolean;
  }[];
}

export interface AnalystRatingsBreakdown {
  strong_buy: number;
  buy: number;
  hold: number;
  underperform: number;
  sell: number;
}

export interface AnalystIntelligence {
  current?: number;
  mean?: number;
  high?: number;
  low?: number;
  recommendation?: string;
  numberOfAnalysts?: number;
  number_of_analysts?: number;
  score?: number; // 1.0 (Strong Buy) to 5.0 (Strong Sell)
  ratings_breakdown?: AnalystRatingsBreakdown;
}

export interface CorporateActions {
  dividend_rate?: number;
  dividend_yield?: number;
  ex_dividend_date?: string | null;
  payout_ratio?: number | null;
  trailing_pe?: number | null;
  forward_pe?: number | null;
}

export interface PredictionMarketEvent {
  source: string;
  event: string;
  probability: string;
  url?: string;
  category?: 'EQUITY_EARNINGS' | 'CORP_CATALYST' | 'SECTOR_MACRO' | 'FED_RATES' | string;
  relevance_note?: string;
  horizon_year?: string; // e.g. '2025', '2026', '2027', '2028+'
  target_date?: string;
  term_structure_group?: string; // e.g. 'SPCX / TSLA Combination', 'Robotaxi Regulatory Approval'
  volume_usd?: number;
  liquidity_depth?: string;
  cross_platform_consensus?: {
    kalshi?: string;
    polymarket?: string;
    manifold?: string;
    predictit?: string;
  };
  historical_7d_change_pct?: number;
  catalyst_impact_rating?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PredictionMarketTermStructurePoint {
  horizon_year: string;
  cumulative_probability_pct: number;
  marginal_probability_pct: number;
  implied_hazard_rate_annual: number;
  primary_driver: string;
  cross_market_spread_pct?: number;
  consensus_label: 'Low Likelihood' | 'Emerging Catalyst' | 'High Probability' | 'Consensus Outcome';
}

export interface PredictionMarketTermStructure {
  group_name: string;
  catalyst_description: string;
  timeline: PredictionMarketTermStructurePoint[];
  peak_inflection_year: string;
  options_implication: string;
}

export interface SocialSentiment {
  stocktwits_sentiment?: string;
  stocktwits_bullish_pct?: number;
  reddit_rank?: string;
  reddit_sentiment?: string;
  social_volume_flag?: string;
  twitter_cashtag_sentiment?: string;
  twitter_volume_score?: number;
  yahoo_finance_community_score?: number;
  seeking_alpha_sentiment?: string;
  seeking_alpha_quant_rating?: number;
  tradingview_technical_rating?: string;
  volume_z_score?: number;
  sentiment_momentum?: 'Accelerating' | 'Steady' | 'Fading';
  retail_vs_institutional_divergence?: string;
  fomo_risk_flag?: string;
  ssvs_composite_score?: number; // 0 - 100 Social Sentiment Velocity Score
  pmci_composite_score?: number; // 0 - 100 Prediction Market Composite Index
  icrrs_composite_score?: number; // 0 - 100 Integrated Catalyst Risk-Reward Score
  icrrs_decision_action?: 'HIGH_CONVICTION_HARVEST' | 'BUY_CSP_STEADY' | 'NEUTRAL_WHEEL' | 'HOLD_DEFENSIVE';
}

export interface BarchartOpinion {
  symbol?: string;
  opinion_pct: number;
  opinion_label: string;
  buy_votes: string;
  sell_votes: string;
  signal_strength: 'Maximum (Top 1%)' | 'Strong' | 'Average' | 'Weak' | string;
  signal_direction: 'Strongest' | 'Strengthening' | 'Weakening' | 'Neutral' | string;
  is_top_1_pct: boolean;
  votes_breakdown?: Record<string, number>;
}

export interface MarketChameleonPattern {
  symbol?: string;
  technical_flags: string[];
  primary_trend: 'Uptrend' | 'Downtrend' | 'Neutral / Consolidation';
  stock_ideas_category: string;
  is_momentum_stock: boolean;
  moving_average_gaps: {
    price_vs_sma20: number;
    sma20_vs_sma50: number;
    sma50_vs_sma250: number;
  };
  sma_20: number;
  sma_50: number;
  sma_250: number;
  aligned_strategies: string[];
}

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
  // Contextual Intelligence Layers
  analyst_intelligence?: AnalystIntelligence;
  corporate_actions?: CorporateActions;
  prediction_markets?: PredictionMarketEvent[];
  social_sentiment?: SocialSentiment;
  barchart_opinion?: BarchartOpinion;
  market_chameleon?: MarketChameleonPattern;
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
  barchart_opinion?: BarchartOpinion;
}

export interface ScreenerSummary {
  generated_at: string;
  total_screened_tickers: number;
  total_opportunities: number;
  avg_annualized_yield: number;
  avg_cushion_pct: number;
  high_ivr_count: number;
  oversold_rsi_count: number;
  breakdown: {
    csp_count: number;
    cc_count: number;
    tier_1_count: number;
    tier_4_count: number;
    earnings_warning_count: number;
  };
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
  onlyNearSupport?: boolean;
  onlyEarningsAlert?: boolean;
  weeklyCadence?: 'ALL' | 'WEEKLY_ONLY' | 'MONTHLY_ONLY';
  opinionFilter?: 'ALL' | 'TOP_1_PCT' | 'BUY_ONLY' | 'WEEKLY_ONLY';
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

export interface FundamentalHealthData {
  symbol: string;
  name: string;
  sector: string;
  spot_price: number;
  market_cap: string;
  pe_ratio: number | null;
  forward_pe: number | null;
  ev_ebitda: number | null;
  revenue_growth_yoy: number;
  operating_margin: number;
  free_cash_flow: string;
  // Solvency & Risk Metrics
  altman_z_score: number;
  altman_zone: 'SAFE' | 'GREY' | 'DISTRESS';
  piotroski_f_score: number; // 0 to 9
  piotroski_tier: 'STRONG' | 'MODERATE' | 'WEAK';
  debt_to_equity: number;
  current_ratio: number;
  interest_coverage: number;
  // SEC EDGAR Filings
  latest_10k_date: string;
  latest_10q_date: string;
  sec_edgar_url: string;
  institutional_ownership_pct: number;
  top_institutions: string[];
  // Fund or CEF specific
  is_fund_or_cef?: boolean;
  nav_price?: number;
  nav_discount_premium_pct?: number;
  cef_z_score_52w?: number;
  distribution_yield_pct?: number;
  roc_pct?: number;
  roc_type?: 'CONSTRUCTIVE' | 'DESTRUCTIVE' | 'NONE';
}

export type MenuTreeType = 'EQUITIES' | 'OPTIONS';

export type EquitiesTabType =
  | 'TECHNICAL_SCREENER'
  | 'INTERACTIVE_CHARTS'
  | 'FUNDAMENTAL_HEALTH'
  | 'TREND_SUPPORT'
  | 'VOLATILITY_RISK'
  | 'EARNINGS_CALENDAR'
  | 'SECTOR_OVERVIEW';

export type OptionsTabType =
  | 'INCOME_SCREENER'
  | 'MULTI_LEG_SPREADS'
  | 'VOLATILITY_SKEW'
  | 'EXPIRATION_CADENCE'
  | 'BACKTEST_MARGIN'
  | 'BROKER_STAGING'
  | 'DELTA_GREEKS'
  | 'TICKER_AUDIT'
  | 'INCOME_CALCULATOR';

export interface WatchlistGroup {
  id: string;
  name: string;
  description?: string;
  tickers: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ReportQueryConfig {
  title: string;
  strategy: 'ALL' | 'CSP' | 'CC';
  cadence: 'ALL' | 'WEEKLY_ONLY' | 'MONTHLY_ONLY';
  minIvr: number;
  minYield: number;
  maxDte: number;
  liquidityTier: 'ALL' | 'Tier 1' | 'Tier 2/3' | 'Tier 4';
  includeEarningsAlerts: boolean;
}
