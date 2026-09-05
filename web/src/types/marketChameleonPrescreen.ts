/**
 * MarketChameleon Prescreen Builder Types & Option Catalogs
 * Corresponds to native categories and filter keys on https://marketchameleon.com/Screeners/Stocks
 */

export interface FilterOption {
  value: string;
  label: string;
  badge?: string;
}

export interface CategorySpec {
  key: string;
  label: string;
  category: 'Stock Attributes' | 'Options Liquidity' | 'Technical' | 'Volatility' | 'Price, Volume & Technical';
  description?: string;
  options: FilterOption[];
}

export const MARKET_CHAMELEON_CATEGORIES: CategorySpec[] = [
  {
    key: 'StockIdeas',
    label: 'Stock Ideas',
    category: 'Stock Attributes',
    description: 'Pre-computed quantitative ideas and momentum classifications',
    options: [
      { value: '-Any-', label: 'Any Ideas' },
      { value: 'Momentum', label: 'Momentum Stocks (Rolling 6M Alpha)' },
      { value: 'MarketLeaders', label: 'Market Leaders (Top S&P Index Contributors)' },
      { value: 'MarketLaggers', label: 'Market Laggers' },
    ],
  },
  {
    key: 'c8',
    label: 'Market Cap',
    category: 'Stock Attributes',
    description: 'Minimum market capitalization requirement',
    options: [
      { value: '-Any-', label: 'Any Market Cap' },
      { value: 'Over 100000000000', label: 'Over $100 Billion (Mega Cap)' },
      { value: 'Over 50000000000', label: 'Over $50 Billion' },
      { value: 'Over 20000000000', label: 'Over $20 Billion (Large Cap)' },
      { value: 'Over 10000000000', label: 'Over $10 Billion' },
      { value: 'Over 5000000000', label: 'Over $5 Billion' },
      { value: 'Over 1000000000', label: 'Over $1 Billion (Mid/Large Cap)' },
      { value: '1000000000 To 10000000000', label: '$1B to $10B (Mid Cap Range)' },
      { value: 'Under 1000000000', label: 'Under $1 Billion (Small Cap)' },
    ],
  },
  {
    key: 'c31',
    label: 'Options Listed',
    category: 'Options Liquidity',
    description: 'Securities with active options chains listed across US exchanges',
    options: [
      { value: '-Any-', label: 'Any' },
      { value: 'true', label: 'Has Options Listed' },
      { value: 'false', label: 'No Options' },
    ],
  },
  {
    key: 'c45',
    label: '14-Day RSI',
    category: 'Technical',
    description: '14-period Relative Strength Index boundary range',
    options: [
      { value: '-Any-', label: 'Any RSI' },
      { value: '50.0 To 70.0', label: '50 to 70 (Bullish Momentum Sweet Spot)' },
      { value: '30.0 To 70.0', label: '30 to 70 (Standard Range)' },
      { value: '30.0 To 50.0', label: '30 to 50 (Neutral to Weak)' },
      { value: 'Above 70.0', label: 'Above 70 (Overbought / Climax)' },
      { value: 'Below 30.0', label: 'Below 30 (Oversold / Dip Reversal)' },
    ],
  },
  {
    key: 'c80',
    label: 'Country of Incorporation',
    category: 'Stock Attributes',
    description: 'Issuer geographic headquarters / exchange country',
    options: [
      { value: '-Any-', label: 'Any Country' },
      { value: 'United States of America', label: 'USA (United States)' },
      { value: 'China', label: 'China' },
      { value: 'Canada', label: 'Canada' },
      { value: 'United Kingdom of Great Britain and Northern Ireland', label: 'United Kingdom' },
      { value: 'Israel', label: 'Israel' },
    ],
  },
  {
    key: 'c50',
    label: '1-Yr Volatility',
    category: 'Volatility',
    description: '1-year annualized historical volatility',
    options: [
      { value: '-Any-', label: 'Any' },
      { value: 'Above 30.0', label: 'Above 30%' },
      { value: 'Above 20.0', label: 'Above 20%' },
      { value: 'Above 50.0', label: 'Above 50%' },
      { value: 'Above 70.0', label: 'Above 70%' },
      { value: 'Below 20.0', label: 'Below 20%' },
    ],
  },
  {
    key: 'c49',
    label: '20-Day Volatility',
    category: 'Volatility',
    description: '20-day annualized short-term historical volatility',
    options: [
      { value: '-Any-', label: 'Any' },
      { value: 'Above 30.0', label: 'Above 30%' },
      { value: 'Above 20.0', label: 'Above 20%' },
      { value: 'Above 50.0', label: 'Above 50%' },
      { value: 'Above 70.0', label: 'Above 70%' },
      { value: 'Below 20.0', label: 'Below 20%' },
    ],
  },
  {
    key: 'c48',
    label: '1-Day Volatility',
    category: 'Volatility',
    description: 'Single session price swing intensity',
    options: [
      { value: '-Any-', label: 'Any' },
      { value: 'Above 30.0', label: 'Above 30%' },
      { value: 'Above 20.0', label: 'Above 20%' },
      { value: 'Above 50.0', label: 'Above 50%' },
      { value: 'Above 70.0', label: 'Above 70%' },
      { value: 'Below 20.0', label: 'Below 20%' },
    ],
  },
  {
    key: 'c21',
    label: 'IV30 (Implied Volatility)',
    category: 'Volatility',
    description: '30-day constant maturity implied volatility index',
    options: [
      { value: '-Any-', label: 'Any' },
      { value: 'Above 30.0', label: 'Above 30% (Rich Options Premium)' },
      { value: 'Above 20.0', label: 'Above 20%' },
      { value: 'Above 50.0', label: 'Above 50% (High Beta / Bio / Tech)' },
      { value: 'Above 70.0', label: 'Above 70%' },
      { value: 'Below 20.0', label: 'Below 20%' },
    ],
  },
  {
    key: 'c25',
    label: 'IV % Rank',
    category: 'Volatility',
    description: 'Percentile of current IV30 relative to past 52 weeks',
    options: [
      { value: '-Any-', label: 'Any' },
      { value: 'Above 0.70', label: 'Elevated (> 70% Rank - Ideal for Credit Spreads)' },
      { value: '0.300001 to 0.699999', label: 'Moderate (30% to 70% Rank)' },
      { value: 'Below 0.30', label: 'Subdued (< 30% Rank - Cheap Options Buying)' },
      { value: 'Above 0.5', label: 'Above 50% Rank' },
      { value: 'Above 0.25', label: 'Above 25% Rank' },
    ],
  },
  {
    key: 'c59',
    label: 'MA Technical Signal',
    category: 'Price, Volume & Technical',
    description: 'Moving average alignment and trend trajectory',
    options: [
      { value: '-Any-', label: 'Any Signal' },
      { value: 'Uptrend;Bullish Crossover;Fast Bullish Crossover', label: 'Any Bullish (Uptrend / Golden Cross)' },
      { value: 'Uptrend', label: 'Strict Uptrend (20 MA > 50 MA > 250 MA)' },
      { value: 'Bullish Crossover', label: 'Bullish Crossover' },
      { value: 'Fast Bullish Crossover', label: 'Fast Bullish Crossover' },
      { value: 'Bottom Bounce', label: 'Bottom Bounce (Mean Reversion)' },
      { value: 'Top Pullback', label: 'Top Pullback (Dip Entry)' },
      { value: 'Downtrend;Bearish Crossover;Fast Bearish Crossover', label: 'Any Bearish' },
      { value: 'Downtrend', label: 'Downtrend' },
    ],
  },
];

export interface MarketChameleonPreset {
  id: string;
  name: string;
  description: string;
  filters: Record<string, string>;
  cboeOnly: boolean;
  isDefault?: boolean;
  updatedAt: string;
}

export const DEFAULT_MARKET_CHAMELEON_PRESETS: MarketChameleonPreset[] = [
  {
    id: 'mc_default_momentum',
    name: 'Momentum Stocks & High IV Sweet Spot',
    description: 'Preselected user screener: Momentum Stocks, Market Cap > $1B, Has Options, RSI 50-70, USA, Vol > 30, IV30 > 30, Any Bullish MA',
    cboeOnly: false,
    isDefault: true,
    filters: {
      StockIdeas: 'Momentum',
      c8: 'Over 1000000000',
      c31: 'true',
      c45: '50.0 To 70.0',
      c80: 'United States of America',
      c50: 'Above 30.0',
      c49: 'Above 30.0',
      c48: 'Above 30.0',
      c21: 'Above 30.0',
      c25: '-Any-',
      c59: 'Uptrend;Bullish Crossover;Fast Bullish Crossover',
    },
    updatedAt: '2026-09-04T20:00:00.000Z',
  },
  {
    id: 'mc_cboe_strict_weeklys',
    name: 'CBOE Official Weeklys (Friday Expiry Only)',
    description: 'Filtered strictly to equities in the official CBOE Weeklys Directory with active weekly or daily options chains',
    cboeOnly: true,
    filters: {
      StockIdeas: 'Momentum',
      c8: 'Over 1000000000',
      c31: 'true',
      c45: '50.0 To 70.0',
      c80: 'United States of America',
      c50: 'Above 30.0',
      c49: 'Above 30.0',
      c48: 'Above 30.0',
      c21: 'Above 30.0',
      c25: '-Any-',
      c59: 'Uptrend;Bullish Crossover;Fast Bullish Crossover',
    },
    updatedAt: '2026-09-04T20:00:00.000Z',
  },
  {
    id: 'mc_mega_cap_leaders',
    name: 'Mega-Cap Market Leaders (> $50B)',
    description: 'High-conviction liquid mega caps (Over $50B Market Cap) with Bullish moving average alignment',
    cboeOnly: true,
    filters: {
      StockIdeas: 'MarketLeaders',
      c8: 'Over 50000000000',
      c31: 'true',
      c45: '50.0 To 70.0',
      c80: 'United States of America',
      c50: '-Any-',
      c49: '-Any-',
      c48: '-Any-',
      c21: 'Above 20.0',
      c25: '-Any-',
      c59: 'Uptrend;Bullish Crossover;Fast Bullish Crossover',
    },
    updatedAt: '2026-09-04T20:00:00.000Z',
  },
  {
    id: 'mc_high_iv_credit_spreads',
    name: 'Elevated IV Rank Credit Spreads (> 50% IV Rank)',
    description: 'High volatility rank equities with rich extrinsic value for high win-rate Bull Put Spreads',
    cboeOnly: true,
    filters: {
      StockIdeas: '-Any-',
      c8: 'Over 5000000000',
      c31: 'true',
      c45: '30.0 To 70.0',
      c80: 'United States of America',
      c50: 'Above 30.0',
      c49: 'Above 30.0',
      c48: 'Above 30.0',
      c21: 'Above 30.0',
      c25: 'Above 0.5',
      c59: 'Uptrend;Bullish Crossover;Fast Bullish Crossover',
    },
    updatedAt: '2026-09-04T20:00:00.000Z',
  },
];
