export interface CandleData {
  time: string; // 'YYYY-MM-DD' or timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface OptionsSetup {
  strategy_type: 'CSP' | 'CC' | string;
  strike: number;
  expiration: string;
  dte: number;
  delta: number;
  annualized_yield_pct: number;
  cushion_pct: number;
  premium_estimate: number;
}

export interface AnalyticalThesis {
  bull_case: string[];
  bear_invalidation: string[];
  catalyst_timing: string;
}

export interface TradeSetupItem {
  ticker: string;
  company_name?: string | null;
  companyName?: string | null;
  market: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | string;
  conviction_score: number;
  convictionScore?: number;
  current_price: number;
  currentPrice?: number;
  entry_price: number;
  entryPrice?: number;
  stop_loss: number;
  stopLoss?: number;
  take_profit: number;
  takeProfit?: number;
  catalyst: string;
  risk_summary: string;
  riskSummary?: string;
  action_checklist: string[];
  actionChecklist?: string[];
  raw_markdown: string;
  rawMarkdown?: string;
  risk_reward_ratio?: number;
  riskRewardRatio?: number;
  setup_grade?: string;
  setupGrade?: string;
  // Chart & synthesis extensions
  candles?: CandleData[];
  technical_indicators?: Record<string, string | number>;
  ai_thesis?: string;
  has_risk_alerts?: boolean;
  options_setup?: OptionsSetup;
  optionsSetup?: OptionsSetup;
  thesis?: AnalyticalThesis;
}

export interface DailyDashboardPayload {
  report_date: string;
  market_phase: string;
  vix_level?: number | null;
  analyzed_count: number;
  bullish_count: number;
  bearish_count: number;
  trades: TradeSetupItem[];
}
