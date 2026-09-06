/**
 * Strict TypeScript Definitions for Screener Criteria & Indicators
 */

import { StrategyType } from './options';

export type LiquidityTier = 'ALL' | 'Tier 1' | 'Tier 2/3' | 'Tier 4';

export type ScreenerCadence = 'ALL' | 'WEEKLY_ONLY' | 'MONTHLY_ONLY';

export type ScreenerOpinionFilter = 'ALL' | 'TOP_1_PCT' | 'BUY_ONLY' | 'WEEKLY_ONLY';

export interface ScreenerFilterCriteria {
  search: string;
  onlyHighIvr?: boolean;
  onlyOversold?: boolean;
  onlyNearSupport?: boolean;
  onlyEarningsAlert?: boolean;
  weeklyCadence?: ScreenerCadence;
  opinionFilter?: ScreenerOpinionFilter;
  liquidityTier?: string;
  strategy?: 'ALL' | StrategyType;
  maxDelta?: number;
  minAnnualizedYield?: number;
  minDte?: number;
  maxDte?: number;
  minIvRank?: number;
  maxRsi?: number;
  selectedSector?: string;
  safetyTier?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ScreenerPaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}
