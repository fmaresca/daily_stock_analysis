/**
 * Weekly Workflow Ritual Clean Reset Engine
 * 
 * Executes prior to ingesting a fresh Charles Schwab positions CSV for the new week (over a weekend):
 * 1. Purges previous week's positions (deltaharvest_portfolio_book)
 * 2. Clears previous week's screened stocks and AI analysis across all workflow steps:
 *    - ThinkorSwim return screen (deltaharvest_tos_barchart_watchlist)
 *    - Barchart top 1% screen (deltaharvest_barchart_screen_data)
 *    - MarketChameleon screen (deltaharvest_mc_screen_data)
 *    - Gemini AI markdown & parsed recommendations (deltaharvest_gemini_raw_markdown, deltaharvest_gemini_parsed_screen)
 * 3. Clears staged and submitted broker orders queue (deltaharvest_submitted_orders)
 * 4. Resets cash ledger encumbrances:
 *    - Preserves default $5,000 weekly living expense disbursement (DISB_DEFAULT_LIVING)
 *    - Clears one-off or ad-hoc disbursements from the prior week
 *    - Resets currentWeekPremiumsCollected to $0.00
 *    - Preserves YTD cumulative tax accounting and carryforwards
 * 5. Clears stale options quotes and live payloads (deltaharvest_live_payload, deltaharvest_last_live_fetch)
 * 6. Dispatches global window events to synchronize all mounted tabs immediately.
 */

import { AccountCapitalState } from '../types/options';
import {
  DEFAULT_WEEKLY_DISBURSEMENT,
  DEFAULT_PRIOR_YTD_PREMIUM_BALANCE,
  DEFAULT_YTD_PREMIUMS_EARNED,
  MAX_SINGLE_EQUITY_POSITION_LIMIT,
  DEFAULT_PER_POSITION_BUDGET,
} from './capitalAndTaxLedger';

export interface WorkflowResetSummary {
  timestamp: string;
  positionsCleared: boolean;
  screenersCleared: boolean;
  stagedOrdersCleared: boolean;
  cashLedgerReset: boolean;
  defaultLivingDisbursement: number;
}

const STORAGE_KEYS_TO_CLEAR = [
  'deltaharvest_portfolio_book',
  'deltaharvest_barchart_screen_data',
  'deltaharvest_mc_screen_data',
  'deltaharvest_tos_barchart_watchlist',
  'deltaharvest_gemini_raw_markdown',
  'deltaharvest_gemini_parsed_screen',
  'deltaharvest_submitted_orders',
  'deltaharvest_live_payload',
  'deltaharvest_last_live_fetch',
];

/**
 * Executes a clean build reset for the new week workflow ritual.
 * Designed to be called immediately before ingesting a new Schwab CSV.
 */
export function executeWeeklyWorkflowCleanReset(): WorkflowResetSummary {
  const timestamp = new Date().toISOString();

  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      timestamp,
      positionsCleared: false,
      screenersCleared: false,
      stagedOrdersCleared: false,
      cashLedgerReset: false,
      defaultLivingDisbursement: DEFAULT_WEEKLY_DISBURSEMENT,
    };
  }

  try {
    // 1. Clear designated storage keys
    STORAGE_KEYS_TO_CLEAR.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (err) {
        console.warn(`[WorkflowReset] Failed to remove ${key}:`, err);
      }
    });

    // 2. Read existing capital state to preserve YTD tax carryforward
    let priorYtd = DEFAULT_PRIOR_YTD_PREMIUM_BALANCE;
    let ytdTotal = DEFAULT_YTD_PREMIUMS_EARNED;
    try {
      const rawCap = window.localStorage.getItem('deltaharvest_capital_ledger');
      if (rawCap) {
        const parsed = JSON.parse(rawCap);
        if (parsed.priorYtdPremiumBalance && Number(parsed.priorYtdPremiumBalance) > 0) {
          priorYtd = Number(parsed.priorYtdPremiumBalance);
        }
        if (parsed.ytdPremiumsEarned && Number(parsed.ytdPremiumsEarned) > 0) {
          ytdTotal = Number(parsed.ytdPremiumsEarned);
        }
      }
    } catch {
      // ignore
    }

    // 3. Construct clean baseline capital state with ONLY default $5,000 living expense disbursement
    const cleanCapitalState: AccountCapitalState = {
      totalCash: 0,
      plannedDisbursements: [
        {
          id: 'DISB_DEFAULT_LIVING',
          description: 'Weekly Living Expenses',
          amount: DEFAULT_WEEKLY_DISBURSEMENT,
          isRecurring: true,
          frequency: 'WEEKLY',
        },
      ],
      totalEncumberedDisbursements: DEFAULT_WEEKLY_DISBURSEMENT,
      committedCollateral: 0,
      freeCash: 0,
      priorYtdPremiumBalance: priorYtd,
      currentWeekPremiumsCollected: 0.00,
      ytdPremiumsEarned: ytdTotal,
      maxPerPositionAllocation: DEFAULT_PER_POSITION_BUDGET,
      singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
      maxAllowedPositions: 0,
      accountName: 'Living Trust-Options ...609',
      totalAccountValue: 0,
      cashBreakdown: {
        snyxx: 0,
        snaxx: 0,
        coreCash: 0,
      },
      lastUpdated: timestamp,
    };

    window.localStorage.setItem('deltaharvest_capital_ledger', JSON.stringify(cleanCapitalState));

    // 4. Notify all components and tabs via custom events
    const resetDetail = {
      timestamp,
      source: 'weekly_workflow_clean_reset',
      defaultLivingDisbursement: DEFAULT_WEEKLY_DISBURSEMENT,
      capital: cleanCapitalState,
      positions: [],
    };

    window.dispatchEvent(new CustomEvent('deltaharvest_workflow_reset', { detail: resetDetail }));
    window.dispatchEvent(new CustomEvent('deltaharvest_portfolio_updated', { detail: resetDetail }));

    console.info('[WorkflowReset] Successfully executed weekly workflow clean reset.');

    return {
      timestamp,
      positionsCleared: true,
      screenersCleared: true,
      stagedOrdersCleared: true,
      cashLedgerReset: true,
      defaultLivingDisbursement: DEFAULT_WEEKLY_DISBURSEMENT,
    };
  } catch (e) {
    console.error('[WorkflowReset] Critical error during workflow clean reset:', e);
    return {
      timestamp,
      positionsCleared: false,
      screenersCleared: false,
      stagedOrdersCleared: false,
      cashLedgerReset: false,
      defaultLivingDisbursement: DEFAULT_WEEKLY_DISBURSEMENT,
    };
  }
}
