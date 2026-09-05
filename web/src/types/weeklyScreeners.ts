export interface WeeklyScreenerRecord {
  symbol: string;
  name: string;
  last_price: number;
  price_change: number;
  percent_change: number;
  opinion: string;
  opinion_pct: number;
  opinion_previous?: string;
  opinion_last_week?: string;
  opinion_last_month?: string;
  has_options: boolean;
  has_weekly_options: boolean;
  signal_strength: string;
  signal_direction: string;
  source: string;
  source_url?: string;
  updated_at: string;
  recommended_strategy: string;
  notes?: string;
  in_cboe_registry?: boolean;
  expiration_cadence?: string;
  extra_fields?: Record<string, any>;
}

export interface WeeklyScreenerDataset {
  source_id: string;
  source_name: string;
  source_url: string;
  timestamp: string;
  total_count: number;
  records: WeeklyScreenerRecord[];
}

export type ScreenerSourceType = 'BARCHART' | 'MARKETCHAMELEON' | 'CUSTOM_UPLOAD';

export interface WeeklyScreenerFilterState {
  searchQuery: string;
  sourceType: 'ALL' | ScreenerSourceType;
  weeklyOnly: boolean;
  minPrice: number;
  maxPrice: number;
  minOpinionPct: number;
  signalDirection: string;
  strategyFilter: string;
  sortBy: keyof WeeklyScreenerRecord;
  sortOrder: 'asc' | 'desc';
}
