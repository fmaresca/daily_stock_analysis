/**
 * Capital, Collateral, Position Audit, and YTD Tax-Alpha Ledger Engine
 *
 * Tracks liquid cash, cash collateral locked in open Cash-Secured Puts,
 * free cash available to deploy (strictly non-margin / 100% cash-secured),
 * and calendar-year YTD option premiums earned and capital gains/losses with prior-year loss carryforward.
 */

import { AccountCapitalState, TaxLedgerState, TaxLedgerRecord } from '../types/options';
import { PortfolioPosition } from './portfolioStressTest';

const CAPITAL_STORAGE_KEY = 'deltaharvest_capital_ledger';
const TAX_STORAGE_KEY = 'deltaharvest_tax_ledger';

export const DEFAULT_PER_POSITION_BUDGET = 15000; // $15,000 per position rule

export function getDefaultCapitalState(): AccountCapitalState {
  return {
    totalCash: 50000,
    committedCollateral: 0,
    freeCash: 50000,
    maxPerPositionAllocation: DEFAULT_PER_POSITION_BUDGET,
    maxAllowedPositions: Math.floor(50000 / DEFAULT_PER_POSITION_BUDGET),
    lastUpdated: new Date().toISOString(),
  };
}

export function getDefaultTaxLedgerState(): TaxLedgerState {
  const currentYear = new Date().getFullYear();
  return {
    currentTaxYear: currentYear,
    priorYearLossCarryforward: 3000, // Standard IRS $3,000 capital loss deduction allowance or custom carryforward
    ytdPremiumsEarned: 4850.00,
    ytdRealizedCapitalGains: 2150.00,
    ytdRealizedCapitalLosses: 800.00,
    records: [
      {
        id: 'REC_001',
        date: `${currentYear}-01-17`,
        symbol: 'SPY',
        type: 'PREMIUM_EARNED',
        amount: 420.00,
        strategy: 'CSP',
        note: 'Expired worthless - 100% premium capture',
      },
      {
        id: 'REC_002',
        date: `${currentYear}-02-14`,
        symbol: 'AAPL',
        type: 'PREMIUM_EARNED',
        amount: 350.00,
        strategy: 'CSP',
        note: 'Closed at 85% profit rule',
      },
      {
        id: 'REC_003',
        date: `${currentYear}-04-18`,
        symbol: 'NVDA',
        type: 'CAPITAL_GAIN',
        amount: 1450.00,
        strategy: 'COVERED_CALL',
        note: 'Shares called away above cost basis',
      },
      {
        id: 'REC_004',
        date: `${currentYear}-05-16`,
        symbol: 'IWM',
        type: 'CAPITAL_LOSS',
        amount: 800.00,
        strategy: 'CSP',
        note: 'Tax loss harvested defensively',
      },
    ],
  };
}

export function getStoredCapitalState(currentPositions: PortfolioPosition[] = []): AccountCapitalState {
  try {
    const raw = localStorage.getItem(CAPITAL_STORAGE_KEY);
    let state = raw ? (JSON.parse(raw) as AccountCapitalState) : getDefaultCapitalState();

    // Recalculate committed collateral dynamically from current open CSPs
    const committed = calculateCommittedCspCollateral(currentPositions);
    const free = Math.max(0, state.totalCash - committed);
    const maxPerPos = state.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET;

    state = {
      ...state,
      committedCollateral: committed,
      freeCash: free,
      maxPerPositionAllocation: maxPerPos,
      maxAllowedPositions: Math.max(0, Math.floor(free / maxPerPos)),
    };
    return state;
  } catch (e) {
    console.warn('Failed to load capital ledger state:', e);
    return getDefaultCapitalState();
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
      if (parsed && typeof parsed.currentTaxYear === 'number') return parsed;
    }
  } catch (e) {
    console.warn('Failed to load tax ledger state:', e);
  }
  return getDefaultTaxLedgerState();
}

export function saveTaxLedgerState(state: TaxLedgerState): void {
  try {
    localStorage.setItem(TAX_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save tax ledger state:', e);
  }
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
 * Evaluates open portfolio positions against the trader's end-of-week checklist:
 * 1. 80% Profit Rule (Close to eliminate gamma)
 * 2. Threatened strikes (Spot <= Strike + 2% for CSPs, Spot >= Strike - 2% for CCs)
 * 3. Expiring this week (DTE <= 5)
 * 4. Uncovered share lots (>= 100 shares without an active covered call)
 */
export function auditPositionsWeeklyStatus(
  positions: PortfolioPosition[]
): PositionAuditCategorization {
  const profitTargetHits: PositionAuditCategorization['profitTargetHits'] = [];
  const threatenedPositions: PositionAuditCategorization['threatenedPositions'] = [];
  const expiringThisWeek: PortfolioPosition[] = [];
  const healthyPositions: PortfolioPosition[] = [];

  // Group shares and existing CCs to detect uncovered lots
  const shareMap = new Map<string, { totalShares: number; avgCost: number }>();
  const callContractsMap = new Map<string, number>();

  for (const p of positions) {
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

    // 1. Check DTE
    if (p.dte <= 5 && p.dte >= 0) {
      expiringThisWeek.push(p);
    }

    // 2. Check 80% Profit Target Rule on short premium
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

    // 3. Check Threatened Strikes
    if (p.type === 'CSP' && p.strike > 0 && p.spotPrice > 0) {
      const distancePct = ((p.spotPrice - p.strike) / p.spotPrice) * 100;
      if (p.spotPrice <= p.strike) {
        threatenedPositions.push({
          position: p,
          distancePct,
          threatSeverity: 'CRITICAL', // In The Money
        });
      } else if (distancePct <= 2.5) {
        threatenedPositions.push({
          position: p,
          distancePct,
          threatSeverity: 'WARNING', // Within 2.5% cushion
        });
      } else if (Math.abs(p.delta) >= 0.35) {
        threatenedPositions.push({
          position: p,
          distancePct,
          threatSeverity: 'ELEVATED', // High delta breach
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
          threatSeverity: 'CRITICAL', // In The Money call (shares being called away)
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
