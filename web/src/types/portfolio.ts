/**
 * Strict TypeScript Definitions for Portfolio, Accounts, and Position Ledgers
 */

import { StrategyType } from './options';

export interface PositionLedgerEntry {
  id: string;
  symbol: string;
  strategy: StrategyType | string;
  type: 'STOCK' | 'CSP' | 'COVERED_CALL' | 'SPREAD' | 'MONEY_MARKET' | 'CASH';
  sharesOrContracts: number;
  strikePrice?: number;
  expirationDate?: string;
  costBasis: number;
  currentSpotPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  collateralLocked: number;
  annualizedYieldPct?: number;
  dte?: number;
  delta?: number;
  notes?: string;
}

export interface PortfolioAccountSummary {
  accountId: string;
  accountName: string;
  accountType: 'TAXABLE' | 'ROTH_IRA' | 'TRADITIONAL_IRA' | 'TRUST';
  totalLiquidationValue: number;
  cashEquivalents: {
    snyxx: number;
    snaxx: number;
    coreCash: number;
    totalCash: number;
  };
  lockedCspCollateral: number;
  encumberedDisbursements: number;
  freeCashAvailable: number;
  utilizationPct: number;
  lastUpdated: string;
}
