export type ImpactLevel = 'High' | 'Moderate' | 'Low';

export interface EconomicIndicator {
  title: string;
  country: string;
  dateET: string;
  timeET: string;
  impact: ImpactLevel;
  forecast: string;
  previous: string;
  sectors: string;
  tickers: string;
  isoDate: string;
}

export interface EconomicCalendarResponse {
  indicators: EconomicIndicator[];
  source: string;
  fallback: boolean;
  notice?: string;
  last_updated: string;
}

export type IndicatorFilterTier = 'ALL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface HighImpactCatalyst {
  indicator: string;
  date: string;
  expected_volatility: string;
  strategic_impact: string;
}

export interface MacroSynthesisOutput {
  market_regime_summary: string;
  high_impact_catalysts: HighImpactCatalyst[];
  options_defense_rules: string[];
  recommended_delta_adjustment: string;
}
