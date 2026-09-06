/**
 * Capital, Collateral, Position Audit, and YTD Tax-Alpha Ledger Engine
 *
 * Tracks liquid cash, planned disbursements (encumbered), cash collateral locked in open CSPs,
 * true free cash available to deploy (strictly non-margin / 100% cash-secured),
 * weekly settlement reconciliation, and calendar-year YTD option premiums earned with loss carryforward.
 */

import {
  AccountCapitalState,
  TaxLedgerState,
  TaxLedgerRecord,
  DisbursementItem,
  StockHoldingPair,
  GeminiScreenResult,
  GeminiRecommendedTrade,
  GeminiBorderlineCandidate,
  GeminiExcludedCandidate,
} from '../types/options';
import { PortfolioPosition, LIVING_TRUST_OPTIONS_POSITIONS } from './portfolioStressTest';

const CAPITAL_STORAGE_KEY = 'deltaharvest_capital_ledger';
const TAX_STORAGE_KEY = 'deltaharvest_tax_ledger';

export const MAX_SINGLE_EQUITY_POSITION_LIMIT = 200000; // $200,000 maximum collateral on any one equity security CSP

// Real Account Profile: Living Trust-Options ...609
export const DEFAULT_ACCOUNT_NAME = 'Living Trust-Options ...609';
export const DEFAULT_ACCOUNT_NET_VALUE = 2343519.76; // Total account liquidation value
export const DEFAULT_SNYXX_CASH = 202775.94; // Schwab New York Municipal Money Ultra
export const DEFAULT_SNAXX_CASH = 77341.30; // Schwab Prime Advantage Money Ultra
export const DEFAULT_CORE_CASH = 293703.52; // Cash & Cash Investments sweep
export const DEFAULT_TOTAL_AVAILABLE_CASH = 573820.76; // Total liquid cash to cover CSP before offsets (SNYXX + SNAXX + Core Cash)
export const DEFAULT_WEEKLY_DISBURSEMENT = 5000; // $5,000 weekly living expenses rule
export const DEFAULT_PER_POSITION_BUDGET = 100000; // Default target allocation per position (strictly capped at $200,000)

/**
 * Dynamically calculates target allocation per position and maximum concurrent positions permitted:
 * - Position limit on any one equity security CSP will be NO MORE than $200,000.
 * - Target allocation per position defaults to freeCash / 5 (bounded between $25k and $200,000).
 * - Maximum concurrent positions permitted is dynamically calculated as:
 *   min(5, max(0, floor(freeCash / targetAllocationPerPosition)))
 */
export function calculateDynamicPositionSizing(
  freeCash: number,
  customPositionAllocation?: number
): {
  targetAllocationPerPosition: number;
  maxConcurrentPositions: number;
  singleEquityPositionLimit: number;
  totalCashDeployableToPuts: number;
} {
  const singleEquityPositionLimit = MAX_SINGLE_EQUITY_POSITION_LIMIT; // $200,000
  if (freeCash <= 0) {
    return {
      targetAllocationPerPosition: 0,
      maxConcurrentPositions: 0,
      singleEquityPositionLimit,
      totalCashDeployableToPuts: 0,
    };
  }

  // Target allocation clamped strictly to the $200,000 single equity security ceiling
  let targetAllocation =
    customPositionAllocation && customPositionAllocation > 0
      ? Math.min(singleEquityPositionLimit, customPositionAllocation)
      : Math.min(singleEquityPositionLimit, Math.max(25000, Math.floor(freeCash / 5)));

  if (targetAllocation <= 0) {
    targetAllocation = Math.min(singleEquityPositionLimit, freeCash);
  }

  // Maximum concurrent positions permitted (capped at 5 max per portfolio rule)
  const maxConcurrent = Math.min(5, Math.max(1, Math.floor(freeCash / targetAllocation)));
  const totalDeployable = Math.min(freeCash, maxConcurrent * targetAllocation);

  return {
    targetAllocationPerPosition: targetAllocation,
    maxConcurrentPositions: maxConcurrent,
    singleEquityPositionLimit,
    totalCashDeployableToPuts: totalDeployable,
  };
}

export function getDefaultCapitalState(positions: PortfolioPosition[] = []): AccountCapitalState {
  const defaultDisbursements: DisbursementItem[] = [
    {
      id: 'DISB_DEFAULT_001',
      description: 'Weekly Living Expenses',
      amount: DEFAULT_WEEKLY_DISBURSEMENT,
      isRecurring: true,
      frequency: 'WEEKLY',
    },
  ];

  const totalCash = DEFAULT_TOTAL_AVAILABLE_CASH;
  const activePositions = positions && positions.length > 0 ? positions : LIVING_TRUST_OPTIONS_POSITIONS;
  const committed = calculateCommittedCspCollateral(activePositions);
  const encumbered = DEFAULT_WEEKLY_DISBURSEMENT;
  const free = Math.max(0, totalCash - encumbered - committed);
  const sizing = calculateDynamicPositionSizing(free, DEFAULT_PER_POSITION_BUDGET);

  return {
    accountName: DEFAULT_ACCOUNT_NAME,
    totalAccountValue: DEFAULT_ACCOUNT_NET_VALUE,
    cashBreakdown: {
      snyxx: DEFAULT_SNYXX_CASH,
      snaxx: DEFAULT_SNAXX_CASH,
      coreCash: DEFAULT_CORE_CASH,
    },
    totalCash,
    plannedDisbursements: defaultDisbursements,
    totalEncumberedDisbursements: encumbered,
    committedCollateral: committed,
    freeCash: free,
    priorYtdPremiumBalance: 45942.09,
    currentWeekPremiumsCollected: 5572.02,
    ytdPremiumsEarned: 51514.11,
    maxPerPositionAllocation: sizing.targetAllocationPerPosition,
    singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
    maxAllowedPositions: sizing.maxConcurrentPositions,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Authentic Options Transactions from Charles Schwab Live Account (Living Trust-Options ...609)
 * Replaces dummy test entries (SPY / AAPL CSPs).
 */
export const SCHWAB_REAL_OPTIONS_RECORDS: TaxLedgerRecord[] = [
  {
    id: 'REC_SCHWAB_PANW_327_5P',
    date: '2026-09-04',
    symbol: 'PANW',
    type: 'PREMIUM_EARNED',
    amount: 1998.96, // 3 contracts @ $6.663
    strategy: 'CSP',
    note: 'Sold 3x 327.50P exp 09/11/26 (Cash Collateral: $98,250.00)',
  },
  {
    id: 'REC_SCHWAB_PLTR_165P',
    date: '2026-09-04',
    symbol: 'PLTR',
    type: 'PREMIUM_EARNED',
    amount: 883.33, // 10 contracts @ $0.883
    strategy: 'CSP',
    note: 'Sold 10x 165.00P exp 09/11/26 (Cash Collateral: $165,000.00)',
  },
  {
    id: 'REC_SCHWAB_TSLA_375C',
    date: '2026-08-28',
    symbol: 'TSLA',
    type: 'PREMIUM_EARNED',
    amount: 19886.25, // 20 contracts @ $9.943
    strategy: 'COVERED_CALL',
    note: 'Sold 20x 375.00C exp 09/11/26 (+85.27% profit target hit)',
  },
  {
    id: 'REC_SCHWAB_AXTI_70C',
    date: '2026-08-21',
    symbol: 'AXTI',
    type: 'PREMIUM_EARNED',
    amount: 11464.76, // 15 contracts @ $7.643
    strategy: 'COVERED_CALL',
    note: 'Sold 15x 70.00C exp 09/18/26 (+70.56% profit captured)',
  },
  {
    id: 'REC_SCHWAB_BLZE_17_5C',
    date: '2026-08-21',
    symbol: 'BLZE',
    type: 'PREMIUM_EARNED',
    amount: 10926.45, // 110 contracts @ $0.993
    strategy: 'COVERED_CALL',
    note: 'Sold 110x 17.50C exp 09/18/26 (+84.90% profit target hit)',
  },
  {
    id: 'REC_SCHWAB_TSLA_370C',
    date: '2026-09-02',
    symbol: 'TSLA',
    type: 'PREMIUM_EARNED',
    amount: 2766.63, // 20 contracts @ $1.383
    strategy: 'COVERED_CALL',
    note: 'Sold 20x 370.00C exp 09/09/26 (+21.20% gain)',
  },
  {
    id: 'REC_SCHWAB_NET_300C',
    date: '2026-09-04',
    symbol: 'NET',
    type: 'PREMIUM_EARNED',
    amount: 2071.31, // 13 contracts @ $1.593
    strategy: 'COVERED_CALL',
    note: 'Sold 13x 300.00C exp 09/11/26 (+14.02% gain)',
  },
  {
    id: 'REC_SCHWAB_IONQ_43_5C',
    date: '2026-09-04',
    symbol: 'IONQ',
    type: 'PREMIUM_EARNED',
    amount: 635.01, // 15 contracts @ $0.423
    strategy: 'COVERED_CALL',
    note: 'Sold 15x 43.50C exp 09/11/26 (+13.78% gain)',
  },
  {
    id: 'REC_SCHWAB_RTX_207_5C',
    date: '2026-09-04',
    symbol: 'RTX',
    type: 'PREMIUM_EARNED',
    amount: 464.68, // 17 contracts @ $0.273
    strategy: 'COVERED_CALL',
    note: 'Sold 17x 207.50C exp 09/11/26 (+1.22% gain)',
  },
  {
    id: 'REC_SCHWAB_LUNR_16_5C',
    date: '2026-09-04',
    symbol: 'LUNR',
    type: 'PREMIUM_EARNED',
    amount: 416.73, // 50 contracts @ $0.083
    strategy: 'COVERED_CALL',
    note: 'Sold 50x 16.50C exp 09/11/26',
  },
];

export function getDefaultTaxLedgerState(): TaxLedgerState {
  const currentYear = new Date().getFullYear();
  const totalPremiums = SCHWAB_REAL_OPTIONS_RECORDS.reduce((sum, r) => sum + r.amount, 0);

  return {
    currentTaxYear: currentYear,
    priorYearLossCarryforward: 3000, // Standard IRS $3,000 capital loss deduction allowance or custom carryforward
    ytdPremiumsEarned: totalPremiums,
    ytdRealizedCapitalGains: 0.00,
    ytdRealizedCapitalLosses: 0.00,
    records: SCHWAB_REAL_OPTIONS_RECORDS,
  };
}

export function calculateEncumberedDisbursements(disbursements: DisbursementItem[]): number {
  return disbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}

export function getStoredCapitalState(currentPositions: PortfolioPosition[] = []): AccountCapitalState {
  try {
    const raw = localStorage.getItem(CAPITAL_STORAGE_KEY);
    const activePositions = currentPositions && currentPositions.length > 0
      ? currentPositions
      : LIVING_TRUST_OPTIONS_POSITIONS;

    let state = raw ? (JSON.parse(raw) as AccountCapitalState) : getDefaultCapitalState(activePositions);

    if (!Array.isArray(state.plannedDisbursements)) {
      state.plannedDisbursements = getDefaultCapitalState(activePositions).plannedDisbursements;
    }

    // Auto-migrate to real Living Trust-Options account values if default/legacy $550,000 is present
    if (!state.cashBreakdown || state.totalCash === 550000) {
      state.accountName = DEFAULT_ACCOUNT_NAME;
      state.totalAccountValue = DEFAULT_ACCOUNT_NET_VALUE;
      state.cashBreakdown = {
        snyxx: DEFAULT_SNYXX_CASH,
        snaxx: DEFAULT_SNAXX_CASH,
        coreCash: DEFAULT_CORE_CASH,
      };
      state.totalCash = DEFAULT_TOTAL_AVAILABLE_CASH;
    }

    const mmfCashTotal = activePositions
      .filter((p) => p.type === 'CASH' || p.type === 'MMF')
      .reduce((sum, p) => sum + (p.marketValueTotal || (p.quantity * (p.spotPrice || 1))), 0);

    const snyxxVal = activePositions.find((p) => p.type === 'MMF' && p.symbol === 'SNYXX')?.marketValueTotal ?? DEFAULT_SNYXX_CASH;
    const snaxxVal = activePositions.find((p) => p.type === 'MMF' && p.symbol === 'SNAXX')?.marketValueTotal ?? DEFAULT_SNAXX_CASH;
    const coreVal = activePositions.find((p) => p.type === 'CASH')?.marketValueTotal ?? DEFAULT_CORE_CASH;

    const encumbered = calculateEncumberedDisbursements(state.plannedDisbursements);
    const committed = calculateCommittedCspCollateral(activePositions);
    const totalCash = mmfCashTotal > 0
      ? mmfCashTotal
      : (Number(state.totalCash) > 0 ? Number(state.totalCash) : DEFAULT_TOTAL_AVAILABLE_CASH);
    const free = Math.max(0, totalCash - encumbered - committed);
    const sizing = calculateDynamicPositionSizing(free, state.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET);

    state = {
      ...state,
      accountName: state.accountName || DEFAULT_ACCOUNT_NAME,
      totalAccountValue: state.totalAccountValue || DEFAULT_ACCOUNT_NET_VALUE,
      cashBreakdown: {
        snyxx: snyxxVal,
        snaxx: snaxxVal,
        coreCash: coreVal,
      },
      totalCash,
      totalEncumberedDisbursements: encumbered,
      committedCollateral: committed,
      freeCash: free,
      maxPerPositionAllocation: sizing.targetAllocationPerPosition,
      singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
      maxAllowedPositions: sizing.maxConcurrentPositions,
      ytdPremiumsEarned: (Number(state.priorYtdPremiumBalance) || 0) + (Number(state.currentWeekPremiumsCollected) || 0),
    };
    return state;
  } catch (e) {
    console.warn('Failed to load capital ledger state:', e);
    return getDefaultCapitalState(currentPositions);
  }
}

export function saveCapitalState(state: AccountCapitalState): void {
  try {
    localStorage.setItem(CAPITAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save capital ledger state:', e);
  }
}

export function getStoredTaxLedgerState(): TaxLedgerState {
  try {
    const raw = localStorage.getItem(TAX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TaxLedgerState;
      if (parsed && typeof parsed.currentTaxYear === 'number') {
        // Auto-migrate away from legacy dummy test records (e.g. SPY, AAPL CSPs)
        const hasLegacyTestRecords = Array.isArray(parsed.records) && parsed.records.some(
          (r) => r.symbol === 'SPY' || r.symbol === 'AAPL' || r.id === 'REC_001' || r.id === 'REC_002'
        );
        if (hasLegacyTestRecords || !parsed.records || parsed.records.length === 0) {
          const fresh = getDefaultTaxLedgerState();
          // Preserve any custom user-added records while removing dummy test records
          const userRecords = (parsed.records || []).filter(
            (r) => r.symbol !== 'SPY' && r.symbol !== 'AAPL' && r.symbol !== 'IWM' && !r.id.startsWith('REC_00')
          );
          fresh.records = [...userRecords, ...SCHWAB_REAL_OPTIONS_RECORDS];
          fresh.ytdPremiumsEarned = fresh.records
            .filter((r) => r.type === 'PREMIUM_EARNED')
            .reduce((sum, r) => sum + r.amount, 0);
          fresh.priorYearLossCarryforward = parsed.priorYearLossCarryforward || 3000;
          saveTaxLedgerState(fresh);
          return fresh;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load tax ledger state:', e);
  }
  const defaultState = getDefaultTaxLedgerState();
  saveTaxLedgerState(defaultState);
  return defaultState;
}

export function saveTaxLedgerState(state: TaxLedgerState): void {
  try {
    localStorage.setItem(TAX_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save tax ledger state:', e);
  }
}

export interface LiveTransactionEntry {
  category: 'PUT_WRITTEN' | 'CALL_WRITTEN' | 'STOCK_BUY' | 'STOCK_SELL';
  symbol: string;
  strike?: number;
  expiration?: string;
  dte?: number;
  quantity: number; // contracts or shares
  price: number; // premium per share for option, or price per share for stock
  spotPrice?: number;
  delta?: number;
  costBasisPerShare?: number; // for stock sell
  notes?: string;
  date?: string;
}

/**
 * Dynamically records mid-week transactions (equities, call and put options written)
 * into deltaharvest_portfolio_book, deltaharvest_capital_ledger, and deltaharvest_tax_ledger.
 * Automatically recalculates Free Cash, committed CSP collateral, and updates all views.
 */
export function recordLiveTransaction(tx: LiveTransactionEntry): {
  success: boolean;
  message: string;
  updatedPositions: PortfolioPosition[];
  updatedCapital: AccountCapitalState;
  updatedTax: TaxLedgerState;
} {
  const sym = tx.symbol.toUpperCase().trim();
  const txDate = tx.date || new Date().toISOString().split('T')[0];

  // 1. Load active positions
  let positions: PortfolioPosition[] = [];
  try {
    const raw = localStorage.getItem('deltaharvest_portfolio_book');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) positions = parsed;
    }
  } catch (e) {
    console.warn('Failed to load positions for live transaction:', e);
  }
  if (positions.length === 0) {
    positions = [...LIVING_TRUST_OPTIONS_POSITIONS];
  }

  // 2. Load Capital & Tax State
  let capital = getStoredCapitalState(positions);
  let taxLedger = getStoredTaxLedgerState();

  let actionDesc = '';

  if (tx.category === 'PUT_WRITTEN') {
    // Put Option Written (Cash-Secured Put)
    const strike = Number(tx.strike) || 100;
    const contracts = Math.max(1, Number(tx.quantity) || 1);
    const premium = Number(tx.price) || 1.0;
    const collateral = strike * contracts * 100;
    const totalPremium = premium * contracts * 100;
    const spot = tx.spotPrice || strike * 1.02;
    const dte = tx.dte || 6;
    const expiration = tx.expiration || new Date(Date.now() + dte * 86400000).toISOString().split('T')[0];

    const newPos: PortfolioPosition = {
      id: `POS_${sym}_CSP_${Date.now()}`,
      symbol: sym,
      type: 'CSP',
      quantity: contracts,
      spotPrice: spot,
      strike,
      dte,
      expiration,
      entryPrice: premium,
      currentOptionPrice: premium,
      iv: 35,
      delta: tx.delta || -0.20,
      theta: 0.12,
      vega: -0.15,
      beta: 1.15,
      gainDollar: 0,
      gainPct: 0,
      account: capital.accountName || DEFAULT_ACCOUNT_NAME,
    };
    positions = [newPos, ...positions];

    const newTaxRec: TaxLedgerRecord = {
      id: `REC_LIVE_${Date.now()}`,
      date: txDate,
      symbol: sym,
      type: 'PREMIUM_EARNED',
      amount: totalPremium,
      strategy: 'CSP',
      note: tx.notes || `Sold to Open ${contracts}x $${strike.toFixed(2)}P exp ${expiration} (+$${totalPremium.toFixed(2)})`,
    };
    taxLedger.records = [newTaxRec, ...taxLedger.records];
    taxLedger.ytdPremiumsEarned += totalPremium;

    // Update capital
    capital.currentWeekPremiumsCollected = (capital.currentWeekPremiumsCollected || 0) + totalPremium;
    capital.ytdPremiumsEarned = (capital.ytdPremiumsEarned || 0) + totalPremium;

    actionDesc = `Wrote ${contracts}x ${sym} $${strike.toFixed(2)} Put (Collected +$${totalPremium.toFixed(2)} premium, locked $${collateral.toLocaleString()} collateral)`;

  } else if (tx.category === 'CALL_WRITTEN') {
    // Call Option Written (Covered Call)
    const strike = Number(tx.strike) || 100;
    const contracts = Math.max(1, Number(tx.quantity) || 1);
    const premium = Number(tx.price) || 1.0;
    const totalPremium = premium * contracts * 100;
    const spot = tx.spotPrice || strike * 0.98;
    const dte = tx.dte || 6;
    const expiration = tx.expiration || new Date(Date.now() + dte * 86400000).toISOString().split('T')[0];

    const newPos: PortfolioPosition = {
      id: `POS_${sym}_CC_${Date.now()}`,
      symbol: sym,
      type: 'COVERED_CALL',
      quantity: contracts,
      spotPrice: spot,
      strike,
      dte,
      expiration,
      entryPrice: premium,
      currentOptionPrice: premium,
      iv: 40,
      delta: tx.delta || -0.20,
      theta: 0.18,
      vega: -0.15,
      beta: 1.15,
      gainDollar: 0,
      gainPct: 0,
      account: capital.accountName || DEFAULT_ACCOUNT_NAME,
    };
    positions = [newPos, ...positions];

    const newTaxRec: TaxLedgerRecord = {
      id: `REC_LIVE_${Date.now()}`,
      date: txDate,
      symbol: sym,
      type: 'PREMIUM_EARNED',
      amount: totalPremium,
      strategy: 'COVERED_CALL',
      note: tx.notes || `Sold to Open ${contracts}x $${strike.toFixed(2)}C exp ${expiration} (+$${totalPremium.toFixed(2)})`,
    };
    taxLedger.records = [newTaxRec, ...taxLedger.records];
    taxLedger.ytdPremiumsEarned += totalPremium;

    capital.currentWeekPremiumsCollected = (capital.currentWeekPremiumsCollected || 0) + totalPremium;
    capital.ytdPremiumsEarned = (capital.ytdPremiumsEarned || 0) + totalPremium;

    actionDesc = `Wrote ${contracts}x ${sym} $${strike.toFixed(2)} Covered Call (Collected +$${totalPremium.toFixed(2)} premium)`;

  } else if (tx.category === 'STOCK_BUY') {
    // Equity Purchased
    const shares = Math.max(1, Number(tx.quantity) || 100);
    const price = Number(tx.price) || 100;
    const existingIdx = positions.findIndex((p) => p.type === 'STOCK' && p.symbol.toUpperCase() === sym);

    if (existingIdx >= 0) {
      const existing = positions[existingIdx];
      const newTotalShares = existing.quantity + shares;
      const newCostBasis = ((existing.quantity * existing.entryPrice) + (shares * price)) / newTotalShares;
      positions[existingIdx] = {
        ...existing,
        quantity: newTotalShares,
        entryPrice: newCostBasis,
        spotPrice: tx.spotPrice || price,
      };
    } else {
      positions.push({
        id: `POS_${sym}_STOCK_${Date.now()}`,
        symbol: sym,
        type: 'STOCK',
        quantity: shares,
        spotPrice: tx.spotPrice || price,
        strike: 0,
        dte: 0,
        entryPrice: price,
        currentOptionPrice: 0,
        iv: 35,
        delta: 1.0,
        theta: 0,
        vega: 0,
        beta: 1.0,
        account: capital.accountName || DEFAULT_ACCOUNT_NAME,
      });
    }

    actionDesc = `Bought ${shares} shares of ${sym} @ $${price.toFixed(2)}/sh`;

  } else if (tx.category === 'STOCK_SELL') {
    // Equity Sold
    const shares = Math.max(1, Number(tx.quantity) || 100);
    const salePrice = Number(tx.price) || 100;
    const existingIdx = positions.findIndex((p) => p.type === 'STOCK' && p.symbol.toUpperCase() === sym);

    let costBasis = tx.costBasisPerShare || salePrice;
    if (existingIdx >= 0) {
      costBasis = positions[existingIdx].entryPrice;
      const rem = positions[existingIdx].quantity - shares;
      if (rem <= 0) {
        positions.splice(existingIdx, 1);
      } else {
        positions[existingIdx].quantity = rem;
      }
    }

    const pnl = (salePrice - costBasis) * shares;
    const isGain = pnl >= 0;

    const newTaxRec: TaxLedgerRecord = {
      id: `REC_LIVE_${Date.now()}`,
      date: txDate,
      symbol: sym,
      type: isGain ? 'CAPITAL_GAIN' : 'CAPITAL_LOSS',
      amount: Math.abs(pnl),
      strategy: 'STOCK',
      note: tx.notes || `Sold ${shares} shares @ $${salePrice.toFixed(2)} (Cost: $${costBasis.toFixed(2)}, P&L: ${isGain ? '+' : ''}$${pnl.toFixed(2)})`,
    };
    taxLedger.records = [newTaxRec, ...taxLedger.records];

    if (isGain) {
      taxLedger.ytdRealizedCapitalGains += pnl;
    } else {
      taxLedger.ytdRealizedCapitalLosses += Math.abs(pnl);
    }

    // Add proceeds to cash
    capital.totalCash += salePrice * shares;

    actionDesc = `Sold ${shares} shares of ${sym} @ $${salePrice.toFixed(2)} (Realized ${isGain ? 'Gain' : 'Loss'}: $${Math.abs(pnl).toFixed(2)})`;
  }

  // Recalculate capital state waterfall
  const encumbered = calculateEncumberedDisbursements(capital.plannedDisbursements);
  const committed = calculateCommittedCspCollateral(positions);
  const freeCash = Math.max(0, capital.totalCash - encumbered - committed);
  const sizing = calculateDynamicPositionSizing(freeCash, capital.maxPerPositionAllocation);

  capital = {
    ...capital,
    committedCollateral: committed,
    freeCash,
    maxPerPositionAllocation: sizing.targetAllocationPerPosition,
    singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
    maxAllowedPositions: sizing.maxConcurrentPositions,
    lastUpdated: new Date().toISOString(),
  };

  // Commit all 3 states to localStorage
  try {
    localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(positions));
    saveCapitalState(capital);
    saveTaxLedgerState(taxLedger);
  } catch (e) {
    console.warn('Failed to save updated state to localStorage:', e);
  }

  // Dispatch global update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('deltaharvest_portfolio_updated', {
        detail: { tx, actionDesc, positions, capital, taxLedger },
      })
    );
  }

  return {
    success: true,
    message: actionDesc,
    updatedPositions: positions,
    updatedCapital: capital,
    updatedTax: taxLedger,
  };
}

/**
 * Calculates total cash collateral required to secure all open Cash-Secured Puts (100% cash-backed)
 */
export function calculateCommittedCspCollateral(positions: PortfolioPosition[]): number {
  return positions
    .filter((p) => p.type === 'CSP')
    .reduce((total, p) => total + p.strike * 100 * (p.quantity || 1), 0);
}

/**
 * Net Taxable Calculation incorporating prior year capital loss carryforwards
 */
export function calculateNetTaxableMetrics(ledger: TaxLedgerState) {
  const netCapitalGainLoss = ledger.ytdRealizedCapitalGains - ledger.ytdRealizedCapitalLosses;
  const totalGainsWithPremiums = ledger.ytdPremiumsEarned + ledger.ytdRealizedCapitalGains;
  const netBeforeCarryforward = totalGainsWithPremiums - ledger.ytdRealizedCapitalLosses;
  
  // Apply loss carryforward against net gains
  const carryforwardApplied = Math.min(
    ledger.priorYearLossCarryforward,
    Math.max(0, netBeforeCarryforward)
  );
  const netTaxableIncome = Math.max(0, netBeforeCarryforward - carryforwardApplied);
  const remainingCarryforward = Math.max(0, ledger.priorYearLossCarryforward - carryforwardApplied);

  return {
    netCapitalGainLoss,
    totalGainsWithPremiums,
    netBeforeCarryforward,
    carryforwardApplied,
    netTaxableIncome,
    remainingCarryforward,
  };
}

/**
 * Calculates 20-Delta Covered Call Strike for Long Stock Holdings (Step 9b)
 * Targets 5-7 DTE, factoring in IVR30 and resistance.
 */
export function calculateSuggestedCoveredCall20Delta(
  spotPrice: number,
  ivr30: number = 25,
  ivr30Rank: number = 40,
  technicalResistance?: number
) {
  const dte = 5; // Target next Friday
  const targetDelta = 0.20;
  const ivNorm = (ivr30 > 1 ? ivr30 / 100 : ivr30) || 0.25;

  // Expected move for 5 DTE: Spot * IV * sqrt(5/365) * 0.84 (for 20 Delta)
  const expectedMove = spotPrice * ivNorm * Math.sqrt(dte / 365.0) * 0.84;
  let rawStrike = spotPrice + expectedMove;

  // If technical resistance provided and higher, anchor at or above resistance
  if (technicalResistance && technicalResistance > spotPrice) {
    rawStrike = Math.max(rawStrike, technicalResistance);
  }

  // Standardize strike to clean increments
  const strike = spotPrice > 150
    ? Math.ceil(rawStrike / 5) * 5
    : spotPrice > 40
    ? Math.ceil(rawStrike)
    : Math.ceil(rawStrike * 2) / 2;

  const estPremium = Math.max(0.15, Math.round(spotPrice * ivNorm * Math.sqrt(dte / 365.0) * 0.20 * 100) / 100);
  const annualizedYield = Math.round(((estPremium / spotPrice) * (365 / dte) * 100) * 10) / 10;

  // Expiration Friday date
  const expDate = new Date(Date.now() + dte * 86400000).toISOString().split('T')[0];

  return {
    strike,
    delta: targetDelta,
    dte,
    expiration: expDate,
    estPremium,
    annualizedYield,
    ivr30: Math.round(ivNorm * 100),
    ivr30Rank,
    technicalJustification: `20Δ strike anchored +${(((strike - spotPrice) / spotPrice) * 100).toFixed(1)}% above spot, above 20-SMA baseline with ${ivr30Rank}% IV Rank.`,
  };
}

/**
 * Parses Gemini AI Pro Markdown Output into 3 Structured Tables (Recommended, Borderline, Excluded)
 */
export function parseGeminiMarkdownTables(text: string): GeminiScreenResult {
  const result: GeminiScreenResult = {
    recommendedTrades: [],
    borderlineCandidates: [],
    excludedCandidates: [],
    rawMarkdown: text,
  };

  if (!text || !text.includes('|')) return result;

  const lines = text.split('\n');
  let currentTable: 'RECOMMENDED' | 'BORDERLINE' | 'EXCLUDED' | null = null;
  let currentHeaders: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section headers
    if (line.toUpperCase().includes('RECOMMENDED TRADES') || line.toUpperCase().includes('TABLE 1')) {
      currentTable = 'RECOMMENDED';
      currentHeaders = [];
      continue;
    } else if (line.toUpperCase().includes('BORDERLINE') || line.toUpperCase().includes('TABLE 2')) {
      currentTable = 'BORDERLINE';
      currentHeaders = [];
      continue;
    } else if (line.toUpperCase().includes('EXCLUDED') || line.toUpperCase().includes('TABLE 3')) {
      currentTable = 'EXCLUDED';
      currentHeaders = [];
      continue;
    }

    // Skip markdown table dividers e.g. |---|---|
    if (line.includes('---') || !line.startsWith('|')) continue;

    const cols = line.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length);
    if (cols.length < 2) continue;

    // Detect or skip header rows
    const firstColLower = cols[0].toLowerCase();
    if (
      firstColLower.includes('ticker') ||
      firstColLower.includes('symbol') ||
      firstColLower.includes('risk rank') ||
      firstColLower.includes('rank')
    ) {
      currentHeaders = cols.map((c) => c.toLowerCase().trim());
      continue;
    }

    // Skip summary, totals, or definition rows
    if (
      firstColLower.includes('total') ||
      firstColLower.includes('remaining') ||
      firstColLower.includes('formula') ||
      (cols[1] && cols[1].toLowerCase().includes('total'))
    ) {
      continue;
    }

    try {
      if (currentTable === 'RECOMMENDED') {
        const findColIdx = (keywords: string[]) =>
          currentHeaders.findIndex((h) => keywords.some((kw) => h.includes(kw)));

        const symIdx = findColIdx(['stock symbol', 'symbol', 'ticker']);
        const strikeIdx = findColIdx(['suggested strike', 'put strike', 'strike']);

        if (currentHeaders.length > 0 && symIdx !== -1 && strikeIdx !== -1) {
          // Dynamic Header-Driven Column Extraction
          const priceIdx = findColIdx(['current price', 'price', 'spot']);
          const deltaIdx = findColIdx(['option delta', 'delta']);
          const rsiIdx = findColIdx(['14-day rsi', '14d rsi', 'rsi']);
          const premIdx = findColIdx(['total premium', 'est. premium', 'net premium', 'premium']);
          const collateralIdx = findColIdx(['collateral committed', 'collateral', 'capital']);
          const contractsIdx = findColIdx(['contracts']);
          const cushionIdx = findColIdx(['otm cushion', 'cushion']);
          const rocIdx = findColIdx(['annualized roc', 'ann. roc', 'weekly roc', 'roc']);
          const justIdx = findColIdx(['justification', 'rationale', 'support', 'reason']);

          const sym = (cols[symIdx] || '').replace(/[*_`]/g, '').trim();
          if (!sym || sym.toLowerCase().includes('total')) continue;

          const rankIdx = findColIdx(['risk rank', 'rank']);
          const rank = rankIdx !== -1 && /^\d+$/.test(cols[rankIdx]) ? parseInt(cols[rankIdx], 10) : result.recommendedTrades.length + 1;
          const currentPrice = priceIdx !== -1 ? parseFloat((cols[priceIdx] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
          const strike = parseFloat((cols[strikeIdx] || '0').replace(/[^0-9.]/g, '')) || 0;
          const delta = deltaIdx !== -1 ? Math.abs(parseFloat((cols[deltaIdx] || '0.20').replace(/[^0-9.-]/g, '')) || 0.20) : 0.20;
          const rsi = rsiIdx !== -1 ? parseFloat((cols[rsiIdx] || '55').replace(/[^0-9.]/g, '')) || 55 : 55;
          const prem = premIdx !== -1 ? cols[premIdx] : '$1.50';
          const contracts = contractsIdx !== -1 ? parseInt((cols[contractsIdx] || '1').replace(/[^0-9]/g, ''), 10) || 1 : 1;
          let collateral = collateralIdx !== -1 ? parseFloat((cols[collateralIdx] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
          if (collateral === 0 && strike > 0) collateral = strike * 100 * contracts;

          const cushion = cushionIdx !== -1 ? cols[cushionIdx] : '';
          const roc = rocIdx !== -1 ? cols[rocIdx] : '';
          const justification = justIdx !== -1 ? cols[justIdx] : `Confirmed Support (Contracts: ${contracts}, ROC: ${roc}, Cushion: ${cushion})`;

          result.recommendedTrades.push({
            riskRank: rank,
            symbol: sym,
            currentPrice,
            trendStrDir: 'Strong Uptrend',
            rsi14: rsi,
            earningsDate: 'None in expiration cycle',
            suggestedStrike: strike,
            delta,
            estPremiumAnnualized: prem,
            capitalCommitted: collateral,
            sentimentFlags: 'Bullish',
            technicalJustification: justification,
          });
        } else {
          // Fallback Heuristics
          const hasRankCol = /^\d+$/.test(cols[0].trim());
          const offset = hasRankCol ? 1 : 0;
          const rank = hasRankCol ? parseInt(cols[0], 10) : result.recommendedTrades.length + 1;
          const sym = (cols[offset] || '').replace(/[*_`]/g, '').trim();
          if (!sym || sym.toLowerCase().includes('total')) continue;

          const currentPrice = parseFloat((cols[offset + 1] || '0').replace(/[^0-9.]/g, '')) || 0;
          const strike = parseFloat((cols[offset + 2] || '0').replace(/[^0-9.]/g, '')) || 0;
          
          const col3 = cols[offset + 3] || '';
          const isExpDate = /\d{4}-\d{2}-\d{2}|\w{3}\s+\d{1,2}/.test(col3) || col3.toLowerCase().includes('dte');
          
          let delta = 0.20;
          let prem = '$1.50';
          let collateral = strike > 0 ? strike * 100 : 10000;
          let justification = '';

          if (isExpDate) {
            delta = parseFloat((cols[offset + 5] || '0.20').replace(/[^0-9.-]/g, '')) || 0.20;
            prem = cols[offset + 7] || cols[offset + 6] || '$1.50';
            collateral = parseFloat((cols[offset + 8] || `${strike * 100}`).replace(/[^0-9.]/g, '')) || (strike * 100);
            const roc = cols[offset + 9] || '';
            const cushion = cols[offset + 10] || '';
            const rationale = cols[offset + 11] || cols[cols.length - 1] || 'Optimal risk-reward';
            justification = `${rationale} (ROC: ${roc}, Cushion: ${cushion})`;
          } else {
            delta = parseFloat((cols[offset + 6] || '0.20').replace(/[^0-9.-]/g, '')) || 0.20;
            prem = cols[offset + 7] || '$1.50';
            collateral = parseFloat((cols[offset + 8] || `${strike * 100}`).replace(/[^0-9.]/g, '')) || (strike * 100);
            justification = cols[offset + 10] || cols[cols.length - 1] || 'Confirmed by technicals';
          }

          result.recommendedTrades.push({
            riskRank: rank,
            symbol: sym,
            currentPrice,
            trendStrDir: 'Strong Uptrend',
            rsi14: 55,
            earningsDate: 'None in 14d',
            suggestedStrike: strike,
            delta: Math.abs(delta),
            estPremiumAnnualized: prem,
            capitalCommitted: collateral,
            sentimentFlags: 'Bullish',
            technicalJustification: justification,
          });
        }
      } else if (currentTable === 'BORDERLINE') {
        const sym = (cols[0] || '').replace(/[*_`]/g, '').trim();
        if (!sym || sym.toLowerCase().includes('symbol') || sym.toLowerCase().includes('ticker')) continue;
        const reason = cols.length >= 4 ? cols[cols.length - 1] : (cols[1] || 'Borderline risk profile');
        result.borderlineCandidates.push({
          symbol: sym,
          currentPrice: parseFloat((cols[1] || '0').replace(/[^0-9.]/g, '')) || 0,
          trendStrDir: 'Moderate',
          rsi14: 50,
          earningsDate: 'N/A',
          borderlineReason: reason,
        });
      } else if (currentTable === 'EXCLUDED') {
        const sym = (cols[0] || '').replace(/[*_`]/g, '').trim();
        if (!sym || sym.toLowerCase().includes('symbol') || sym.toLowerCase().includes('ticker')) continue;
        const reason = cols[cols.length - 1] || cols[1] || 'Failed hard filters';
        result.excludedCandidates.push({
          symbol: sym,
          currentPrice: 0,
          reasonForExclusion: reason,
        });
      }
    } catch (err) {
      console.warn('Error parsing markdown line:', rawLine, err);
    }
  }

  return result;
}

export interface PositionAuditCategorization {
  profitTargetHits: {
    position: PortfolioPosition;
    profitPct: number;
    profitDollar: number;
  }[];
  threatenedPositions: {
    position: PortfolioPosition;
    distancePct: number;
    threatSeverity: 'CRITICAL' | 'WARNING' | 'ELEVATED';
  }[];
  expiringThisWeek: PortfolioPosition[];
  uncoveredShareLots: {
    symbol: string;
    totalShares: number;
    coveredShares: number;
    uncoveredShares: number;
    avgCost: number;
  }[];
  healthyPositions: PortfolioPosition[];
}

/**
 * Evaluates open portfolio positions against the trader's end-of-week checklist
 */
export function auditPositionsWeeklyStatus(
  positions: PortfolioPosition[]
): PositionAuditCategorization {
  const profitTargetHits: PositionAuditCategorization['profitTargetHits'] = [];
  const threatenedPositions: PositionAuditCategorization['threatenedPositions'] = [];
  const expiringThisWeek: PortfolioPosition[] = [];
  const healthyPositions: PortfolioPosition[] = [];

  const shareMap = new Map<string, { totalShares: number; avgCost: number }>();
  const callContractsMap = new Map<string, number>();

  for (const p of positions) {
    if (p.type === 'CASH' || p.type === 'MMF') {
      // Cash & Money Market Fund holdings are risk-free liquidity reserves backing CSPs
      healthyPositions.push(p);
      continue;
    }

    if (p.type === 'STOCK') {
      const existing = shareMap.get(p.symbol) || { totalShares: 0, avgCost: p.entryPrice };
      shareMap.set(p.symbol, {
        totalShares: existing.totalShares + p.quantity,
        avgCost: p.entryPrice,
      });
      continue;
    }

    if (p.type === 'COVERED_CALL') {
      const count = callContractsMap.get(p.symbol) || 0;
      callContractsMap.set(p.symbol, count + (p.quantity || 1));
    }

    // Check DTE (Friday Expirations)
    if (p.dte <= 5 && p.dte >= 0) {
      expiringThisWeek.push(p);
    }

    // 80% Profit Rule
    if (p.entryPrice > 0 && p.currentOptionPrice !== undefined) {
      const capturedDollar = (p.entryPrice - p.currentOptionPrice) * 100 * (p.quantity || 1);
      const profitPct = ((p.entryPrice - p.currentOptionPrice) / p.entryPrice) * 100;
      if (profitPct >= 80) {
        profitTargetHits.push({
          position: p,
          profitPct,
          profitDollar: capturedDollar,
        });
      }
    }

    // Threatened Strikes
    if (p.type === 'CSP' && p.strike > 0 && p.spotPrice > 0) {
      const distancePct = ((p.spotPrice - p.strike) / p.spotPrice) * 100;
      if (p.spotPrice <= p.strike) {
        threatenedPositions.push({
          position: p,
          distancePct,
          threatSeverity: 'CRITICAL',
        });
      } else if (distancePct <= 2.5) {
        threatenedPositions.push({
          position: p,
          distancePct,
          threatSeverity: 'WARNING',
        });
      } else if (Math.abs(p.delta) >= 0.35) {
        threatenedPositions.push({
          position: p,
          distancePct,
          threatSeverity: 'ELEVATED',
        });
      } else {
        healthyPositions.push(p);
      }
    } else if (p.type === 'COVERED_CALL' && p.strike > 0 && p.spotPrice > 0) {
      const distancePct = ((p.strike - p.spotPrice) / p.spotPrice) * 100;
      if (p.spotPrice >= p.strike) {
        threatenedPositions.push({
          position: p,
          distancePct,
          threatSeverity: 'CRITICAL',
        });
      } else if (distancePct <= 2.5) {
        threatenedPositions.push({
          position: p,
          distancePct,
          threatSeverity: 'WARNING',
        });
      } else {
        healthyPositions.push(p);
      }
    } else {
      healthyPositions.push(p);
    }
  }

  // Detect Uncovered Shares
  const uncoveredShareLots: PositionAuditCategorization['uncoveredShareLots'] = [];
  shareMap.forEach((data, symbol) => {
    const activeCalls = callContractsMap.get(symbol) || 0;
    const coveredShares = activeCalls * 100;
    const uncoveredShares = Math.max(0, data.totalShares - coveredShares);
    if (uncoveredShares >= 100) {
      uncoveredShareLots.push({
        symbol,
        totalShares: data.totalShares,
        coveredShares,
        uncoveredShares,
        avgCost: data.avgCost,
      });
    }
  });

  return {
    profitTargetHits,
    threatenedPositions,
    expiringThisWeek,
    uncoveredShareLots,
    healthyPositions,
  };
}
