export interface OptionContract {
  symbol: string;
  ticker: string;
  strike: number;
  expirationDate: string; // YYYY-MM-DD
  dte: number;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  mid: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number; // e.g. 0.32 for 32%
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  inTheMoney: boolean;
}

export interface DividendSchedule {
  exDividendDate: string; // YYYY-MM-DD
  paymentDate?: string;
  amount: number; // e.g. 0.85 per share
  frequency: 'Quarterly' | 'Monthly' | 'Semi-Annual' | 'Annual';
}

export interface StockUnderlying {
  ticker: string;
  currentPrice: number;
  ivRank52w: number; // 0 - 100
  historicalVol30d: number;
  nextEarningsDate?: string;
  dividend?: DividendSchedule;
}

export interface EarlyAssignmentAnalysis {
  hasRisk: boolean;
  severity: 'NONE' | 'LOW' | 'HIGH';
  exDividendDate?: string;
  dividendAmount?: number;
  callExtrinsicValue: number;
  projectedForfeitedDividend: number;
  reason: string;
}

export interface CoveredCallCandidate {
  contract: OptionContract;
  underlying: StockUnderlying;
  
  // Quantitative Metrics
  netDebit: number; // Stock Price - Call Premium
  maxProfitDollars: number; // (Strike - Stock) + Premium per share * 100
  maxProfitPercent: number; // Max Profit / Net Debit
  downsideProtectionPercent: number; // Premium / Stock Price
  breakevenStockPrice: number; // Stock Price - Premium
  annualizedYieldPercent: number; // (MaxProfit% * (365 / DTE))
  staticReturnPercent: number; // Return if stock closes unchanged at expiration
  
  // Scoring
  compositeScore: number; // 0 - 100 score prioritizing Delta sweet spot + IVR + Liquidity
  
  // Risk Flags
  earlyAssignmentRisk: EarlyAssignmentAnalysis;
}

export interface PortfolioPositionInput {
  ticker: string;
  quantity: number; // e.g., 200 shares (allows 2 contracts)
  costBasis: number; // original purchase price per share
}
