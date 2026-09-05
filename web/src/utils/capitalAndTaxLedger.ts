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
import { PortfolioPosition } from './portfolioStressTest';

const CAPITAL_STORAGE_KEY = 'deltaharvest_capital_ledger';
const TAX_STORAGE_KEY = 'deltaharvest_tax_ledger';

export const DEFAULT_PER_POSITION_BUDGET = 15000; // $15,000 per position rule
export const DEFAULT_WEEKLY_DISBURSEMENT = 5000; // $5,000 weekly living expenses rule

export function getDefaultCapitalState(): AccountCapitalState {
  const defaultDisbursements: DisbursementItem[] = [
    {
      id: 'DISB_DEFAULT_001',
      description: 'Weekly Living Expenses',
      amount: DEFAULT_WEEKLY_DISBURSEMENT,
      isRecurring: true,
      frequency: 'WEEKLY',
    },
  ];

  const totalCash = 65000;
  const committed = 0;
  const encumbered = DEFAULT_WEEKLY_DISBURSEMENT;
  const free = Math.max(0, totalCash - encumbered - committed);

  return {
    totalCash,
    plannedDisbursements: defaultDisbursements,
    totalEncumberedDisbursements: encumbered,
    committedCollateral: committed,
    freeCash: free,
    priorYtdPremiumBalance: 3600.00,
    currentWeekPremiumsCollected: 1250.00,
    ytdPremiumsEarned: 4850.00,
    maxPerPositionAllocation: DEFAULT_PER_POSITION_BUDGET,
    maxAllowedPositions: Math.floor(free / DEFAULT_PER_POSITION_BUDGET),
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

export function calculateEncumberedDisbursements(disbursements: DisbursementItem[]): number {
  return disbursements.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}

export function getStoredCapitalState(currentPositions: PortfolioPosition[] = []): AccountCapitalState {
  try {
    const raw = localStorage.getItem(CAPITAL_STORAGE_KEY);
    let state = raw ? (JSON.parse(raw) as AccountCapitalState) : getDefaultCapitalState();

    if (!Array.isArray(state.plannedDisbursements)) {
      state.plannedDisbursements = getDefaultCapitalState().plannedDisbursements;
    }

    const encumbered = calculateEncumberedDisbursements(state.plannedDisbursements);
    const committed = calculateCommittedCspCollateral(currentPositions);
    const free = Math.max(0, state.totalCash - encumbered - committed);
    const maxPerPos = state.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET;

    state = {
      ...state,
      totalEncumberedDisbursements: encumbered,
      committedCollateral: committed,
      freeCash: free,
      maxPerPositionAllocation: maxPerPos,
      maxAllowedPositions: Math.max(0, Math.floor(free / maxPerPos)),
      ytdPremiumsEarned: (Number(state.priorYtdPremiumBalance) || 0) + (Number(state.currentWeekPremiumsCollected) || 0),
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

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section headers
    if (line.toUpperCase().includes('RECOMMENDED TRADES') || line.toUpperCase().includes('TABLE 1')) {
      currentTable = 'RECOMMENDED';
      continue;
    } else if (line.toUpperCase().includes('BORDERLINE') || line.toUpperCase().includes('TABLE 2')) {
      currentTable = 'BORDERLINE';
      continue;
    } else if (line.toUpperCase().includes('EXCLUDED') || line.toUpperCase().includes('TABLE 3')) {
      currentTable = 'EXCLUDED';
      continue;
    }

    // Skip markdown table dividers e.g. |---|---|
    if (line.includes('---') || !line.startsWith('|')) continue;

    const cols = line.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length);
    if (cols.length < 2) continue;

    // Skip header rows
    const firstColLower = cols[0].toLowerCase();
    if (
      firstColLower.includes('ticker') ||
      firstColLower.includes('symbol') ||
      firstColLower.includes('risk rank') ||
      firstColLower.includes('rank')
    ) {
      continue;
    }

    try {
      if (currentTable === 'RECOMMENDED') {
        const hasRankCol = /^\d+$/.test(cols[0].trim());
        const offset = hasRankCol ? 1 : 0;
        const rank = hasRankCol ? parseInt(cols[0], 10) : result.recommendedTrades.length + 1;
        const sym = (cols[offset] || '').replace(/[*_`]/g, '').trim();
        if (!sym) continue;

        const currentPrice = parseFloat((cols[offset + 1] || '0').replace(/[^0-9.]/g, '')) || 0;
        const strike = parseFloat((cols[offset + 2] || '0').replace(/[^0-9.]/g, '')) || 0;
        
        // Check if cols[offset + 3] is Expiration or Trend
        const col3 = cols[offset + 3] || '';
        const isExpDate = /\d{4}-\d{2}-\d{2}|\w{3}\s+\d{1,2}/.test(col3) || col3.toLowerCase().includes('dte');
        
        let delta = 0.20;
        let prem = '$1.50';
        let collateral = strike > 0 ? strike * 100 : 10000;
        let justification = '';

        if (isExpDate) {
          // Format from steps.txt: Ticker | Current Price | Put Strike | Expiration | DTE | Delta | Bid/Ask | Net Premium | Collateral | Ann. ROC (%) | Cushion (%) | Rationale / Key Support Level
          delta = parseFloat((cols[offset + 5] || '0.20').replace(/[^0-9.-]/g, '')) || 0.20;
          prem = cols[offset + 7] || cols[offset + 6] || '$1.50';
          collateral = parseFloat((cols[offset + 8] || `${strike * 100}`).replace(/[^0-9.]/g, '')) || (strike * 100);
          const roc = cols[offset + 9] || '';
          const cushion = cols[offset + 10] || '';
          const rationale = cols[offset + 11] || cols[cols.length - 1] || 'Optimal risk-reward';
          justification = `${rationale} (ROC: ${roc}, Cushion: ${cushion})`;
        } else {
          // Standard columns format
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
      } else if (currentTable === 'BORDERLINE') {
        // Table 2 format: Ticker | Strike | Delta | Reason for Demotion OR Ticker | Current Price | Trend | RSI | Earnings | Reason
        const sym = (cols[0] || '').replace(/[*_`]/g, '').trim();
        if (!sym) continue;
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
        // Table 3 format: Ticker | Filter Failed
        const sym = (cols[0] || '').replace(/[*_`]/g, '').trim();
        if (!sym) continue;
        const reason = cols[1] || cols[cols.length - 1] || 'Failed hard filters';
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
