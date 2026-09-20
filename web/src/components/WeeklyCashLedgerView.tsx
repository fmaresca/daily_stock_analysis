import React, { useState, useMemo, useEffect } from 'react';
import {
  AccountCapitalState,
  TaxLedgerState,
  TaxLedgerRecord,
  DisbursementItem,
} from '../types/options';
import { PortfolioPosition, LIVING_TRUST_OPTIONS_POSITIONS } from '../utils/portfolioStressTest';
import {
  getStoredCapitalState,
  getDefaultCapitalState,
  saveCapitalState,
  getStoredTaxLedgerState,
  saveTaxLedgerState,
  calculateEncumberedDisbursements,
  calculateNetTaxableMetrics,
  calculateDynamicPositionSizing,
  MAX_SINGLE_EQUITY_POSITION_LIMIT,
  DEFAULT_PER_POSITION_BUDGET,
} from '../utils/capitalAndTaxLedger';
import {
  parseSchwabPositionsCsv,
  syncImportedEquitiesToWatchlist,
} from '../utils/schwabPositionsParser';
import { executeWeeklyWorkflowCleanReset } from '../utils/weeklyWorkflowReset';
import { autoSyncSchwabPortfolioPrices } from '../utils/liveMarketFetcher';
import { LiveTransactionModal } from './LiveTransactionModal';
import { LiquidCapitalWaterfall } from './cash/LiquidCapitalWaterfall';
import { TaxAlphaLedgerPanel } from './cash/TaxAlphaLedgerPanel';
import {
  EditBalancesModal,
  AddDisbursementModal,
  AddWeeklyPremiumModal,
  EditPriorYtdModal,
  EditTaxGainsModal,
} from './cash/EditCarryforwardModal';
import { Sliders, CheckCircle2, AlertTriangle } from './icons';

export interface WeeklyCashLedgerViewProps {
  positions?: PortfolioPosition[];
  onNavigateToNextStep?: () => void;
  onNavigateToHoldings?: () => void;
  onNavigateToStep2?: () => void;
  onNavigateToScreener?: () => void;
}

export const WeeklyCashLedgerView: React.FC<WeeklyCashLedgerViewProps> = ({
  positions,
  onNavigateToNextStep,
}) => {
  // Load Capital State synced with positions
  const [capitalState, setCapitalState] = useState<AccountCapitalState>(() =>
    getStoredCapitalState(positions || [])
  );

  // Load Tax Ledger State
  const [taxState, setTaxState] = useState<TaxLedgerState>(() =>
    getStoredTaxLedgerState()
  );

  // Derive active positions from prop or stored book or baseline
  const activePositions = useMemo(() => {
    if (positions && positions.length > 0) return positions;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('deltaharvest_portfolio_book');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return LIVING_TRUST_OPTIONS_POSITIONS;
  }, [positions]);

  const activeCSPs = useMemo(() => activePositions.filter((p) => p.type === 'CSP'), [activePositions]);
  const activeCoveredCalls = useMemo(() => activePositions.filter((p) => p.type === 'COVERED_CALL'), [activePositions]);
  const activeEquities = useMemo(() => activePositions.filter((p) => p.type === 'STOCK'), [activePositions]);
  const activeCspNames = useMemo(() => {
    if (activeCSPs.length === 0) return 'None';
    return activeCSPs.map((p) => p.symbol).join(', ');
  }, [activeCSPs]);

  const availableCashBeforeLiving = useMemo(() => {
    return Math.max(0, capitalState.totalCash - capitalState.committedCollateral);
  }, [capitalState.totalCash, capitalState.committedCollateral]);

  // Modal display states
  const [isEditCashOpen, setIsEditCashOpen] = useState(false);
  const [isLiveTxModalOpen, setIsLiveTxModalOpen] = useState(false);
  const [liveTxSuccessMsg, setLiveTxSuccessMsg] = useState('');
  const [isEditPriorYtdOpen, setIsEditPriorYtdOpen] = useState(false);
  const [isEditTaxGainsOpen, setIsEditTaxGainsOpen] = useState(false);
  const [isAddDisbursementOpen, setIsAddDisbursementOpen] = useState(false);
  const [isAddWeekPremiumOpen, setIsAddWeekPremiumOpen] = useState(false);

  // Quick inline cash editing
  const [isEditingInlineCash, setIsEditingInlineCash] = useState(false);
  const [inlineCashValue, setInlineCashValue] = useState<number>(capitalState.totalCash);

  // End-of-Week YTD Reconciliation confirmation state
  const [isYtdReconciled, setIsYtdReconciled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('deltaharvest_ytd_reconciliation_confirmed') === 'true';
    } catch {
      return false;
    }
  });

  const handleConfirmYtdReconciliation = () => {
    const next = !isYtdReconciled;
    setIsYtdReconciled(next);
    try {
      if (next) {
        localStorage.setItem('deltaharvest_ytd_reconciliation_confirmed', 'true');
      } else {
        localStorage.removeItem('deltaharvest_ytd_reconciliation_confirmed');
      }
    } catch {
      // ignore
    }
  };

  const currentCalendarYear = new Date().getFullYear();
  const isNewCalendarYearAlert = currentCalendarYear > (taxState.currentTaxYear || 2026) || (new Date().getMonth() === 0 && new Date().getDate() <= 31);

  // CSV import success notification
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Automatically synchronize when Step 1 (Schwab CSV upload) updates capital or portfolio
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      const freshCapital = getStoredCapitalState(positions || []);
      const freshTax = getStoredTaxLedgerState();
      setCapitalState(freshCapital);
      setTaxState(freshTax);
      setInlineCashValue(freshCapital.totalCash);
    };

    window.addEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
    window.addEventListener('deltaharvest_workflow_reset', handlePortfolioUpdate);
    window.addEventListener('storage', handlePortfolioUpdate);
    return () => {
      window.removeEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
      window.removeEventListener('deltaharvest_workflow_reset', handlePortfolioUpdate);
      window.removeEventListener('storage', handlePortfolioUpdate);
    };
  }, [positions]);

  const handleBrokerCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      if (!text) return;
      try {
        // Execute clean reset routine prior to CSV ingestion
        executeWeeklyWorkflowCleanReset();

        const parsed = parseSchwabPositionsCsv(text);
        setCapitalState(parsed.capitalState);
        saveCapitalState(parsed.capitalState);
        setInlineCashValue(parsed.capitalState.totalCash);

        // Update portfolio book with all equities, calls, puts
        localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(parsed.portfolioPositions));

        // Sync imported equities to Watchlist
        syncImportedEquitiesToWatchlist(parsed.equitySymbols, parsed.accountName);

        // Sync authentic option tax records
        if (parsed.taxRecords && parsed.taxRecords.length > 0) {
          const currentTax = getStoredTaxLedgerState();
          const freshTax: TaxLedgerState = {
            ...currentTax,
            records: parsed.taxRecords,
            ytdPremiumsEarned: parsed.taxRecords.reduce((sum, r) => sum + r.amount, 0),
          };
          saveTaxLedgerState(freshTax);
          setTaxState(freshTax);
        }

        setImportSuccessMsg(
          `Imported ${parsed.accountName}: Total Cash $${parsed.capitalState.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })} (SNYXX + SNAXX + Sweep), -$${parsed.totalCommittedCspCollateral.toLocaleString(undefined, { minimumFractionDigits: 2 })} CSP Offset (PANW + PLTR), -$${parsed.encumberedLivingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} Living Exp -> $${parsed.netFreeCashForNewCsps.toLocaleString(undefined, { minimumFractionDigits: 2 })} Net Free Cash for new CSPs (${parsed.maxAllowedNewPositions} positions). ${parsed.equitySymbols.length} Equities synced to Watchlist: ${parsed.equitySymbols.join(', ')}!`
        );
        setTimeout(() => setImportSuccessMsg(''), 10000);

        // Auto-sync live trading prices (or latest closing prices if market is closed)
        autoSyncSchwabPortfolioPrices(parsed.portfolioPositions).then((updatedPositions) => {
          window.dispatchEvent(
            new CustomEvent('deltaharvest_portfolio_updated', {
              detail: { source: 'live_price_sync', positions: updatedPositions, capital: parsed.capitalState },
            })
          );
        });

        // Dispatch global update event
        window.dispatchEvent(
          new CustomEvent('deltaharvest_portfolio_updated', {
            detail: { source: 'csv_upload', positions: parsed.portfolioPositions, capital: parsed.capitalState },
          })
        );
      } catch (err: any) {
        console.error('Failed to parse broker positions CSV:', err);
      }
    };
    reader.readAsText(file);
  };

  // Net Taxable calculations
  const taxMetrics = useMemo(() => {
    return calculateNetTaxableMetrics(taxState);
  }, [taxState]);

  // Handle Quick Inline Update of Total Cash
  const handleQuickUpdateTotalCash = (newCash: number) => {
    const encumbered = calculateEncumberedDisbursements(capitalState.plannedDisbursements);
    const free = Math.max(0, newCash - encumbered - capitalState.committedCollateral);
    const sizing = calculateDynamicPositionSizing(free, capitalState.maxPerPositionAllocation);

    const updatedCap: AccountCapitalState = {
      ...capitalState,
      totalCash: newCash,
      freeCash: free,
      maxPerPositionAllocation: sizing.targetAllocationPerPosition,
      singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
      maxAllowedPositions: sizing.maxConcurrentPositions,
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);
    setInlineCashValue(newCash);
    setIsEditingInlineCash(false);
  };

  // Handle Update Target Position Allocation (capped at $200,000)
  const handleUpdatePositionAllocation = (newAllocation: number) => {
    const clamped = Math.min(MAX_SINGLE_EQUITY_POSITION_LIMIT, Math.max(5000, newAllocation));
    const sizing = calculateDynamicPositionSizing(capitalState.freeCash, clamped);

    const updatedCap: AccountCapitalState = {
      ...capitalState,
      maxPerPositionAllocation: sizing.targetAllocationPerPosition,
      singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
      maxAllowedPositions: sizing.maxConcurrentPositions,
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);
  };

  // Reset capital state to baseline
  const handleResetToBaseline = () => {
    const fresh = getDefaultCapitalState(positions || []);
    setCapitalState(fresh);
    saveCapitalState(fresh);
    setInlineCashValue(fresh.totalCash);
  };

  // Handle Save Cash & Balances from EditBalancesModal
  const handleSaveBalances = (data: {
    totalCash: number;
    targetAllocation: number;
    priorYtdPremiums: number;
    currentWeekPremiums: number;
    lossCarryover: number;
    realizedGains: number;
    realizedLosses: number;
  }) => {
    const encumbered = calculateEncumberedDisbursements(capitalState.plannedDisbursements);
    const free = Math.max(0, data.totalCash - encumbered - capitalState.committedCollateral);
    const sizing = calculateDynamicPositionSizing(free, data.targetAllocation);

    const updatedCap: AccountCapitalState = {
      ...capitalState,
      totalCash: data.totalCash,
      priorYtdPremiumBalance: data.priorYtdPremiums,
      currentWeekPremiumsCollected: data.currentWeekPremiums,
      ytdPremiumsEarned: data.priorYtdPremiums + data.currentWeekPremiums,
      freeCash: free,
      maxPerPositionAllocation: sizing.targetAllocationPerPosition,
      singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
      maxAllowedPositions: sizing.maxConcurrentPositions,
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);
    setInlineCashValue(data.totalCash);

    const updatedTax: TaxLedgerState = {
      ...taxState,
      priorYearLossCarryforward: data.lossCarryover,
      ytdRealizedCapitalGains: data.realizedGains,
      ytdRealizedCapitalLosses: data.realizedLosses,
      ytdPremiumsEarned: data.priorYtdPremiums + data.currentWeekPremiums,
    };
    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);

    setIsEditCashOpen(false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('deltaharvest_portfolio_updated', {
          detail: { source: 'balances_updated', capital: updatedCap, taxLedger: updatedTax },
        })
      );
    }
  };

  // Handle Save Prior YTD Balance Only ($603,305.40)
  const handleSavePriorYtdBalance = (newPrior: number) => {
    const newYtdTotal = newPrior + capitalState.currentWeekPremiumsCollected;

    const updatedCap: AccountCapitalState = {
      ...capitalState,
      priorYtdPremiumBalance: newPrior,
      ytdPremiumsEarned: newYtdTotal,
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);

    const updatedTax: TaxLedgerState = {
      ...taxState,
      ytdPremiumsEarned: newYtdTotal,
    };
    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);
    setIsEditPriorYtdOpen(false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('deltaharvest_portfolio_updated', {
          detail: { source: 'prior_ytd_updated', capital: updatedCap, taxLedger: updatedTax },
        })
      );
    }
  };

  // Handle Save YTD Capital Gains, Losses, Carryforward & Option Premiums Written
  const handleSaveTaxGains = (data: {
    taxYear: number;
    ytdPremiumsWritten: number;
    realizedGains: number;
    realizedLosses: number;
    lossCarryover: number;
  }) => {
    const updatedTax: TaxLedgerState = {
      ...taxState,
      currentTaxYear: data.taxYear,
      ytdPremiumsEarned: data.ytdPremiumsWritten,
      ytdRealizedCapitalGains: data.realizedGains,
      ytdRealizedCapitalLosses: data.realizedLosses,
      priorYearLossCarryforward: data.lossCarryover,
    };
    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);

    // Keep capitalState.ytdPremiumsEarned in sync
    const updatedCap: AccountCapitalState = {
      ...capitalState,
      ytdPremiumsEarned: data.ytdPremiumsWritten,
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);

    setIsEditTaxGainsOpen(false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('deltaharvest_portfolio_updated', {
          detail: { source: 'tax_gains_updated', taxLedger: updatedTax, capital: updatedCap },
        })
      );
    }
  };

  // Handle Add Disbursement
  const handleAddDisbursement = (description: string, amount: number, frequency: 'WEEKLY' | 'MONTHLY' | 'ONE_TIME') => {
    const item: DisbursementItem = {
      id: `DISB_${Date.now()}`,
      description: description.trim() || 'Planned Disbursement',
      amount: Number(amount),
      isRecurring: frequency !== 'ONE_TIME',
      frequency,
    };

    const newDisbursements = [...capitalState.plannedDisbursements, item];
    const encumbered = calculateEncumberedDisbursements(newDisbursements);
    const free = Math.max(0, capitalState.totalCash - encumbered - capitalState.committedCollateral);
    const sizing = calculateDynamicPositionSizing(free, capitalState.maxPerPositionAllocation);

    const updated: AccountCapitalState = {
      ...capitalState,
      plannedDisbursements: newDisbursements,
      totalEncumberedDisbursements: encumbered,
      freeCash: free,
      maxPerPositionAllocation: sizing.targetAllocationPerPosition,
      singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
      maxAllowedPositions: sizing.maxConcurrentPositions,
    };
    setCapitalState(updated);
    saveCapitalState(updated);
    setIsAddDisbursementOpen(false);
  };

  // Handle Remove Disbursement
  const handleRemoveDisbursement = (id: string) => {
    const newDisbursements = capitalState.plannedDisbursements.filter((d) => d.id !== id);
    const encumbered = calculateEncumberedDisbursements(newDisbursements);
    const free = Math.max(0, capitalState.totalCash - encumbered - capitalState.committedCollateral);
    const sizing = calculateDynamicPositionSizing(free, capitalState.maxPerPositionAllocation);

    const updated: AccountCapitalState = {
      ...capitalState,
      plannedDisbursements: newDisbursements,
      totalEncumberedDisbursements: encumbered,
      freeCash: free,
      maxPerPositionAllocation: sizing.targetAllocationPerPosition,
      singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
      maxAllowedPositions: sizing.maxConcurrentPositions,
    };
    setCapitalState(updated);
    saveCapitalState(updated);
  };

  // Handle Add Weekly Premium Record
  const handleAddWeeklyPremium = (data: {
    startingYtd: number;
    symbol: string;
    type: 'EXPIRED' | 'EXERCISED' | 'ROLLED';
    amount: number;
    note: string;
  }) => {
    const startingYtd = data.startingYtd || capitalState.priorYtdPremiumBalance;
    const addedAmount = data.amount;
    const newWeeklyTotal = capitalState.currentWeekPremiumsCollected + addedAmount;
    const newYtdTotal = startingYtd + newWeeklyTotal;

    const updatedCap: AccountCapitalState = {
      ...capitalState,
      priorYtdPremiumBalance: startingYtd,
      currentWeekPremiumsCollected: newWeeklyTotal,
      ytdPremiumsEarned: newYtdTotal,
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);

    const newRec: TaxLedgerRecord = {
      id: `PREM_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      symbol: data.symbol.toUpperCase().trim() || 'WEEKLY_EXP',
      type: 'PREMIUM_EARNED',
      amount: addedAmount,
      strategy: 'CSP',
      note: `${data.type}: ${data.note || 'Current week settlement'}`,
    };

    const updatedTax: TaxLedgerState = {
      ...taxState,
      ytdPremiumsEarned: newYtdTotal,
      records: [newRec, ...taxState.records],
    };
    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);

    setIsAddWeekPremiumOpen(false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('deltaharvest_portfolio_updated', {
          detail: { source: 'weekly_premium_logged', capital: updatedCap, taxLedger: updatedTax },
        })
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Routine Step Title & Next Step Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
            <span>Precalculated Cash Balance, Disbursements &amp; Tax-Alpha Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Step 2 of the Weekend Routine: Review your Precalculated Cash Balance (Money Market Funds + Cash Sweep less liabilities for open put options written), encumber planned living disbursements ($5k default), dynamically size new CSPs (max $200k/equity), and track tax alpha.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditCashOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Balances &amp; Sizing</span>
          </button>

          {onNavigateToNextStep && (
            <button
              onClick={onNavigateToNextStep}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Next: Step 3 Holdings &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* 1b. End-of-Week Tax & YTD Reconciliation Checklist Card */}
      <div className={`glass-panel p-5 rounded-2xl border transition-all shadow-xl ${
        isYtdReconciled
          ? 'border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20'
          : 'border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className={`p-2 rounded-xl border ${
              isYtdReconciled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  End-of-Week Tax &amp; YTD Reconciliation Verification
                </h3>
                {isYtdReconciled ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ✓ Verified for Week
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Weekly ritual requirement: Review and confirm your YTD Option Premiums Written and YTD Net Realized Capital Gains before proceeding to Step 3. Capital Loss Carry Forwards are strictly retained across weekly resets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditTaxGainsOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit YTD Gains &amp; Carryover</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmYtdReconciliation}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer ${
                isYtdReconciled
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isYtdReconciled ? 'Re-open Verification' : 'Confirm & Mark Reconciled for Week'}</span>
            </button>
          </div>
        </div>

        {/* New Calendar Year (January 1) Boundary Warning Banner */}
        {isNewCalendarYearAlert && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 mt-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">New Calendar Year Boundary ({currentCalendarYear}): </span>
              IRS annual reset required. Please reset YTD Option Premiums Written and YTD Net Capital Gains to $0.00, and carry forward any unused net capital losses into your Prior-Year Capital Loss Carry Forward.
            </div>
          </div>
        )}

        {/* 3 Verification Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">1. YTD Option Premiums Written</span>
            <span className="text-lg font-bold font-mono text-emerald-400 block mt-0.5">
              ${capitalState.ytdPremiumsEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Cumulative premiums collected in tax year {taxState.currentTaxYear}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">2. YTD Net Realized Capital Gains</span>
            <span className={`text-lg font-bold font-mono block mt-0.5 ${
              (taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses) >= 0 ? '+' : ''}
              ${(taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Gains: ${taxState.ytdRealizedCapitalGains.toLocaleString()} | Losses: ${taxState.ytdRealizedCapitalLosses.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">3. Capital Loss Carry Forward</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                🔒 Retained
              </span>
            </div>
            <span className="text-lg font-bold font-mono text-amber-300 block mt-0.5">
              -${taxState.priorYearLossCarryforward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              IRS Sec. 1211 offset allowance (persisted across resets)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Liquid Capital Waterfall, MMF, Equities & Dynamic Position Sizing */}
      <LiquidCapitalWaterfall
        capitalState={capitalState}
        activePositions={activePositions}
        activeCSPs={activeCSPs}
        activeCoveredCalls={activeCoveredCalls}
        activeEquities={activeEquities}
        activeCspNames={activeCspNames}
        availableCashBeforeLiving={availableCashBeforeLiving}
        isEditingInlineCash={isEditingInlineCash}
        setIsEditingInlineCash={setIsEditingInlineCash}
        inlineCashValue={inlineCashValue}
        setInlineCashValue={setInlineCashValue}
        handleQuickUpdateTotalCash={handleQuickUpdateTotalCash}
        handleUpdatePositionAllocation={handleUpdatePositionAllocation}
        onOpenLiveTxModal={() => setIsLiveTxModalOpen(true)}
        onBrokerCsvUpload={handleBrokerCsvUpload}
        onResetToLivingTrustBaseline={handleResetToBaseline}
        onOpenAddDisbursementModal={() => setIsAddDisbursementOpen(true)}
        liveTxSuccessMsg={liveTxSuccessMsg}
        importSuccessMsg={importSuccessMsg}
      />

      {/* 3. Tax-Alpha Ledger, Planned Disbursements Strip & Dual Tracking Panels */}
      <TaxAlphaLedgerPanel
        capitalState={capitalState}
        taxState={taxState}
        taxMetrics={taxMetrics}
        onOpenAddDisbursement={() => setIsAddDisbursementOpen(true)}
        onRemoveDisbursement={handleRemoveDisbursement}
        onOpenEditPriorYtd={() => setIsEditPriorYtdOpen(true)}
        onOpenAddWeekPremium={() => setIsAddWeekPremiumOpen(true)}
        onOpenEditTaxGains={() => setIsEditTaxGainsOpen(true)}
      />

      {/* Modal 1: Edit Account Balances & Sizing */}
      <EditBalancesModal
        isOpen={isEditCashOpen}
        onClose={() => setIsEditCashOpen(false)}
        capitalState={capitalState}
        taxState={taxState}
        onSave={handleSaveBalances}
      />

      {/* Modal 2: Add Planned Disbursement */}
      <AddDisbursementModal
        isOpen={isAddDisbursementOpen}
        onClose={() => setIsAddDisbursementOpen(false)}
        onAdd={handleAddDisbursement}
      />

      {/* Modal 3: Log Current Week Premium */}
      <AddWeeklyPremiumModal
        isOpen={isAddWeekPremiumOpen}
        onClose={() => setIsAddWeekPremiumOpen(false)}
        initialStartingYtd={capitalState.priorYtdPremiumBalance}
        currentWeekPremiums={capitalState.currentWeekPremiumsCollected}
        onAdd={handleAddWeeklyPremium}
      />

      {/* Modal 4: Edit Starting / Prior YTD Balance Only */}
      <EditPriorYtdModal
        isOpen={isEditPriorYtdOpen}
        onClose={() => setIsEditPriorYtdOpen(false)}
        currentPriorYtd={capitalState.priorYtdPremiumBalance}
        currentWeekPremiums={capitalState.currentWeekPremiumsCollected}
        onSave={handleSavePriorYtdBalance}
      />

      {/* Modal 5: Edit YTD Capital Gains & Loss Carryforward */}
      <EditTaxGainsModal
        isOpen={isEditTaxGainsOpen}
        onClose={() => setIsEditTaxGainsOpen(false)}
        taxState={taxState}
        ytdPremiumsEarned={capitalState.ytdPremiumsEarned}
        onSave={handleSaveTaxGains}
      />

      {/* Live Mid-Week Transaction Entry Modal */}
      <LiveTransactionModal
        isOpen={isLiveTxModalOpen}
        onClose={() => setIsLiveTxModalOpen(false)}
        onSuccess={(msg) => {
          setLiveTxSuccessMsg(msg);
          setTimeout(() => setLiveTxSuccessMsg(''), 8000);
        }}
      />
    </div>
  );
};
