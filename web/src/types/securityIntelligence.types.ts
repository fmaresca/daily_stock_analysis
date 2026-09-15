/**
 * Strict TypeScript interfaces for Security Intelligence & Sentiment
 */

import {
  AnalystIntelligence,
  CorporateActions,
  MarketChameleonPattern,
  PredictionMarketEvent,
  PredictionMarketTermStructure,
  SocialSentiment,
} from './options';

export interface NewsStory {
  id: string;
  headline: string;
  source: string;
  date: string;
  timeAgo: string;
  category: 'Earnings' | 'Product/AI' | 'Macro/Fed' | 'Analyst Rating' | 'Regulatory' | 'Dividends' | 'Operations';
  sentiment: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish';
  summary: string;
  optionsImplication: string;
  url?: string;
}

export interface SecurityIntelligence {
  symbol: string;
  name: string;
  sector: string;
  compositeScore: number; // 0 - 100
  sentimentLabel: 'Strong Bullish' | 'Bullish' | 'Neutral / Hold' | 'Cautious' | 'Bearish';
  decisionAction: 'STRONG_BUY_CSP' | 'BUY_CSP' | 'HOLD_WAIT' | 'SELL_CC' | 'AVOID_EARNINGS';
  decisionLabel: string;
  technicalScore: number; // 0 - 100
  fundamentalScore: number; // 0 - 100
  liquidityScore: number; // 0 - 100
  volatilityEdgeScore: number; // 0 - 100
  targetPrice: number;
  spotPrice?: number;
  upsidePct: number;
  keySupportPrice: number;
  keyResistancePrice: number;
  analystConsensus: 'Strong Buy' | 'Moderate Buy' | 'Hold' | 'Underperform';
  analystCoverageCount: number;
  institutionalOwnershipPct: number;
  topHolders: Array<{ name: string; stakePct: string }>;
  secEdgarUrl: string;
  latestFilingDate: string;
  latestFilingType: '10-K' | '10-Q' | '8-K';
  recentNews: NewsStory[];
  // Multi-source contextual layers from enhance/
  analystTargets?: AnalystIntelligence;
  corporateActions?: CorporateActions;
  predictionMarkets?: PredictionMarketEvent[];
  termStructure?: PredictionMarketTermStructure;
  socialSentiment?: SocialSentiment;
  marketChameleon?: MarketChameleonPattern;
  pmciScore?: number;
  ssvsScore?: number;
  icrrsScore?: number;
}
