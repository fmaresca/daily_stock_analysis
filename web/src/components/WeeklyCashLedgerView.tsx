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
  DEFAULT_WEEKLY_DISBURSEMENT,
} from '../utils/capitalAndTaxLedger';
import {
  parseSchwabPositionsCsv,
  syncImportedEquitiesToWatchlist,
} from '../utils/schwabPositionsParser';
import { LiveTransactionModal } from './LiveTransactionModal';
import {
  DollarSign,
  ShieldCheck,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Clock,
  AlertTriangle,
  Upload,
  Zap,
  Edit2,
} from './icons';

interface WeeklyCashLedgerViewProps {
  positions?: PortfolioPosition[];
  onNavigateToNextStep?: () => void;
  onNavigateToHoldings?: () => void;
  onNavigateToStep2?: () => void;
  onNavigateToScreener?: () => void;
}

export const WeeklyCashLedgerView: React.FC<WeeklyCashLedgerViewProps> = ({
  positions,
  onNavigateToNextStep,
  onNavigateToHoldings,
  onNavigateToStep2,
  onNavigateToScreener,
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

  // Automatically synchronize when Step 1 (Schwab CSV upload) updates capital or portfolio
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      const freshCapital = getStoredCapitalState(positions || []);
      const freshTax = getStoredTaxLedgerState();
      setCapitalState(freshCapital);
      setTaxState(freshTax);
      setInputTotalCash(freshCapital.totalCash);
      setInlineCashValue(freshCapital.totalCash);
      setInputTargetAllocation(freshCapital.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET);
      setInputPriorYtdPremiums(freshCapital.priorYtdPremiumBalance);
      setInputPriorYtdBalanceOnly(freshCapital.priorYtdPremiumBalance);
      setModalStartingYtdInput(freshCapital.priorYtdPremiumBalance);
      setInputCurrentWeekPremiums(freshCapital.currentWeekPremiumsCollected);
      setInputLossCarryover(freshTax.priorYearLossCarryforward);
      setInputRealizedGains(freshTax.ytdRealizedCapitalGains);
      setInputRealizedLosses(freshTax.ytdRealizedCapitalLosses);
      setInputTaxCarryover(freshTax.priorYearLossCarryforward);
      setInputTaxYear(freshTax.currentTaxYear);
    };

    window.addEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
    window.addEventListener('storage', handlePortfolioUpdate);
    return () => {
      window.removeEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
      window.removeEventListener('storage', handlePortfolioUpdate);
    };
  }, [positions]);

  // Modals / Edit states
  const [isEditCashOpen, setIsEditCashOpen] = useState(false);
  const [isLiveTxModalOpen, setIsLiveTxModalOpen] = useState(false);
  const [liveTxSuccessMsg, setLiveTxSuccessMsg] = useState('');
  const [inputTotalCash, setInputTotalCash] = useState<number>(capitalState.totalCash);
  const [inputTargetAllocation, setInputTargetAllocation] = useState<number>(
    capitalState.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET
  );
  const [inputPriorYtdPremiums, setInputPriorYtdPremiums] = useState<number>(
    capitalState.priorYtdPremiumBalance
  );
  const [inputCurrentWeekPremiums, setInputCurrentWeekPremiums] = useState<number>(
    capitalState.currentWeekPremiumsCollected
  );
  const [inputLossCarryover, setInputLossCarryover] = useState<number>(
    taxState.priorYearLossCarryforward
  );

  // Dedicated modal for editing Starting / Prior YTD Premium Balance ($603,305.40)
  const [isEditPriorYtdOpen, setIsEditPriorYtdOpen] = useState(false);
  const [inputPriorYtdBalanceOnly, setInputPriorYtdBalanceOnly] = useState<number>(capitalState.priorYtdPremiumBalance);

  // Dedicated modal for editing YTD Capital Gains, Losses & Loss Carryforwards
  const [isEditTaxGainsOpen, setIsEditTaxGainsOpen] = useState(false);
  const [inputRealizedGains, setInputRealizedGains] = useState<number>(taxState.ytdRealizedCapitalGains);
  const [inputRealizedLosses, setInputRealizedLosses] = useState<number>(taxState.ytdRealizedCapitalLosses);
  const [inputTaxCarryover, setInputTaxCarryover] = useState<number>(taxState.priorYearLossCarryforward);
  const [inputTaxYear, setInputTaxYear] = useState<number>(taxState.currentTaxYear);

  // Field in "Log Current Week Premium" modal for editing starting YTD before logging
  const [modalStartingYtdInput, setModalStartingYtdInput] = useState<number>(capitalState.priorYtdPremiumBalance);

  // Quick inline cash editing
  const [isEditingInlineCash, setIsEditingInlineCash] = useState(false);
  const [inlineCashValue, setInlineCashValue] = useState<number>(capitalState.totalCash);

  // New disbursement modal
  const [isAddDisbursementOpen, setIsAddDisbursementOpen] = useState(false);
  const [newDisbDesc, setNewDisbDesc] = useState('');
  const [newDisbAmount, setNewDisbAmount] = useState<number>(5000);
  const [newDisbFreq, setNewDisbFreq] = useState<'WEEKLY' | 'MONTHLY' | 'ONE_TIME'>('WEEKLY');

  // New current week premium record modal
  const [isAddWeekPremiumOpen, setIsAddWeekPremiumOpen] = useState(false);
  const [premSymbol, setPremSymbol] = useState('');
  const [premAmount, setPremAmount] = useState<number>(350);
  const [premType, setPremType] = useState<'EXPIRED' | 'EXERCISED' | 'ROLLED'>('EXPIRED');
  const [premNote, setPremNote] = useState('');

  // CSV import success notification
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  const handleBrokerCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      if (!text) return;
      try {
        const parsed = parseSchwabPositionsCsv(text);
        setCapitalState(parsed.capitalState);
        saveCapitalState(parsed.capitalState);
        setInputTotalCash(parsed.capitalState.totalCash);
        setInlineCashValue(parsed.capitalState.totalCash);
        setInputTargetAllocation(parsed.capitalState.maxPerPositionAllocation);

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

  // Sync state whenever positions change or when live transactions occur mid-week
  useEffect(() => {
    const handleSync = () => {
      const updated = getStoredCapitalState(positions);
      setCapitalState(updated);
      setInputTotalCash(updated.totalCash);
      setInlineCashValue(updated.totalCash);
      setInputTargetAllocation(updated.maxPerPositionAllocation);
      setTaxState(getStoredTaxLedgerState());
    };

    handleSync();

    window.addEventListener('deltaharvest_portfolio_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('deltaharvest_portfolio_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [positions]);

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
    setInputTotalCash(newCash);
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
    setInputTargetAllocation(sizing.targetAllocationPerPosition);
  };

  // Handle Save Cash & Balances
  const handleSaveBalances = (e: React.FormEvent) => {
    e.preventDefault();
    const encumbered = calculateEncumberedDisbursements(capitalState.plannedDisbursements);
    const free = Math.max(0, Number(inputTotalCash) - encumbered - capitalState.committedCollateral);
    const sizing = calculateDynamicPositionSizing(free, Number(inputTargetAllocation));

    const updatedCap: AccountCapitalState = {
      ...capitalState,
      totalCash: Number(inputTotalCash),
      priorYtdPremiumBalance: Number(inputPriorYtdPremiums),
      currentWeekPremiumsCollected: Number(inputCurrentWeekPremiums),
      ytdPremiumsEarned: Number(inputPriorYtdPremiums) + Number(inputCurrentWeekPremiums),
      freeCash: free,
      maxPerPositionAllocation: sizing.targetAllocationPerPosition,
      singleEquityPositionLimit: MAX_SINGLE_EQUITY_POSITION_LIMIT,
      maxAllowedPositions: sizing.maxConcurrentPositions,
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);
    setInlineCashValue(Number(inputTotalCash));

    const updatedTax: TaxLedgerState = {
      ...taxState,
      priorYearLossCarryforward: Number(inputLossCarryover),
      ytdRealizedCapitalGains: Number(inputRealizedGains),
      ytdRealizedCapitalLosses: Number(inputRealizedLosses),
      ytdPremiumsEarned: Number(inputPriorYtdPremiums) + Number(inputCurrentWeekPremiums),
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
  const handleSavePriorYtdBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrior = Number(inputPriorYtdBalanceOnly);
    const newYtdTotal = newPrior + capitalState.currentWeekPremiumsCollected;

    const updatedCap: AccountCapitalState = {
      ...capitalState,
      priorYtdPremiumBalance: newPrior,
      ytdPremiumsEarned: newYtdTotal,
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);
    setInputPriorYtdPremiums(newPrior);
    setModalStartingYtdInput(newPrior);

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

  // Handle Save YTD Capital Gains, Losses & Carryforward
  const handleSaveTaxGains = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTax: TaxLedgerState = {
      ...taxState,
      currentTaxYear: Number(inputTaxYear) || 2026,
      ytdRealizedCapitalGains: Number(inputRealizedGains),
      ytdRealizedCapitalLosses: Number(inputRealizedLosses),
      priorYearLossCarryforward: Number(inputTaxCarryover),
    };
    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);
    setInputLossCarryover(Number(inputTaxCarryover));
    setIsEditTaxGainsOpen(false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('deltaharvest_portfolio_updated', {
          detail: { source: 'tax_gains_updated', taxLedger: updatedTax },
        })
      );
    }
  };

  // Handle Add Disbursement
  const handleAddDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    const item: DisbursementItem = {
      id: `DISB_${Date.now()}`,
      description: newDisbDesc.trim() || 'Planned Disbursement',
      amount: Number(newDisbAmount),
      isRecurring: newDisbFreq !== 'ONE_TIME',
      frequency: newDisbFreq,
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
    setNewDisbDesc('');
    setNewDisbAmount(1000);
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

  // Handle Add Weekly Premium Record (with prior starting balance check/update)
  const handleAddWeeklyPremium = (e: React.FormEvent) => {
    e.preventDefault();
    const startingYtd = Number(modalStartingYtdInput) || capitalState.priorYtdPremiumBalance;
    const addedAmount = Number(premAmount);
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
    setInputPriorYtdPremiums(startingYtd);
    setInputPriorYtdBalanceOnly(startingYtd);

    const newRec: TaxLedgerRecord = {
      id: `PREM_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      symbol: premSymbol.toUpperCase().trim() || 'WEEKLY_EXP',
      type: 'PREMIUM_EARNED',
      amount: addedAmount,
      strategy: 'CSP',
      note: `${premType}: ${premNote || 'Current week settlement'}`,
    };

    const updatedTax: TaxLedgerState = {
      ...taxState,
      ytdPremiumsEarned: newYtdTotal,
      records: [newRec, ...taxState.records],
    };
    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);

    setIsAddWeekPremiumOpen(false);
    setPremSymbol('');
    setPremNote('');

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
            onClick={() => {
              setInputTotalCash(capitalState.totalCash);
              setInputTargetAllocation(capitalState.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET);
              setInputPriorYtdPremiums(capitalState.priorYtdPremiumBalance);
              setInputCurrentWeekPremiums(capitalState.currentWeekPremiumsCollected);
              setInputLossCarryover(taxState.priorYearLossCarryforward);
              setIsEditCashOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center space-x-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Balances &amp; Sizing</span>
          </button>

          {onNavigateToNextStep && (
            <button
              onClick={onNavigateToNextStep}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-colors"
            >
              <span>Next: Step 3 Holdings &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Profile & Money Market Fund (MMF) Collateral Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 shadow-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-white tracking-wide">
                  Account: {capitalState.accountName || 'Living Trust-Options ...609'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Primary CSP Account
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total Net Liquidation Value:{' '}
                <strong className="text-white font-mono">
                  ${(capitalState.totalAccountValue || 2343519.76).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </strong>{' '}
                &bull; Cash &amp; Money Market Funds (SNYXX + SNAXX) are deemed 100% cash to cover CSPs before offsets.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLiveTxModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-md shadow-amber-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Record Mid-Week Trade</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Positions CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleBrokerCsvUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                const fresh = getDefaultCapitalState(positions || []);
                setCapitalState(fresh);
                saveCapitalState(fresh);
                setInputTotalCash(fresh.totalCash);
                setInlineCashValue(fresh.totalCash);
                setInputTargetAllocation(fresh.maxPerPositionAllocation);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Reset capital state and MMF breakdown to Living Trust-Options ...609 baseline"
            >
              <span>Reset to Living Trust Baseline</span>
            </button>
          </div>
        </div>

        {liveTxSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] leading-relaxed">{liveTxSuccessMsg}</span>
          </div>
        )}

        {importSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] leading-relaxed">{importSuccessMsg}</span>
          </div>
        )}

        {/* MMF & Cash Breakdown Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">SNYXX (Schwab NY Muni Money)</span>
            <span className="text-sm font-bold font-mono text-cyan-300 block">
              ${(capitalState.cashBreakdown?.snyxx ?? 202775.94).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-500">Deemed cash to cover CSP</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">SNAXX (Schwab Prime Adv Money)</span>
            <span className="text-sm font-bold font-mono text-cyan-300 block">
              ${(capitalState.cashBreakdown?.snaxx ?? 77341.30).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-500">Deemed cash to cover CSP</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">Core Cash &amp; Sweep</span>
            <span className="text-sm font-bold font-mono text-cyan-300 block">
              ${(capitalState.cashBreakdown?.coreCash ?? 299590.53).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-500">Cash investments sweep</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
            <span className="text-[10px] text-emerald-400 block font-bold">Total Cash to Cover CSPs</span>
            <span className="text-sm font-bold font-mono text-emerald-300 block">
              ${capitalState.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-emerald-400/70 font-mono">
              {activeCspNames} Offsets: -${capitalState.committedCollateral.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Ingested Equities in Watchlist Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-300">Equities Ingested into Watchlist:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              {(activeEquities.length > 0 ? activeEquities.map((e) => e.symbol) : ['AXTI', 'BLZE', 'IONQ', 'LUNR', 'NET', 'RTX', 'TSLA']).map((sym) => (
                <span
                  key={sym}
                  className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px]"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeEquities.length} Long Holdings &bull; {activeCoveredCalls.length} Covered Calls Linked &bull; {activeCSPs.length} CSP Offset{activeCSPs.length === 1 ? '' : 's'} Active ({activeCspNames})
          </span>
        </div>
      </div>

      {/* 2. Cash Reconciliation Waterfall Strip */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl bg-slate-950/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Available Cash Position &amp; True Deployable Free Cash Waterfall
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
              Single Equity Limit: $200,000 MAX
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              100% Cash-Secured (Zero Margin)
            </span>
          </div>
        </div>

        {/* Precalculated Cash Formula Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-emerald-950/30 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30">PRECALCULATED CASH</span>
            <span className="text-slate-300">
              Total Cash Pool (Money Market + Sweep): <strong className="text-white font-mono">${capitalState.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              {' '}&minus; Open Put Liabilities: <strong className="text-rose-400 font-mono">${capitalState.committedCollateral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              {' '}&#61; <strong className="text-emerald-400 font-mono text-sm">${availableCashBeforeLiving.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> Available Cash (Before Living Expenses)
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Less Weekly Living Expenses: &minus;${capitalState.totalEncumberedDisbursements.toLocaleString()} &rarr; <span className="text-emerald-400 font-bold">${capitalState.freeCash.toLocaleString(undefined, { minimumFractionDigits: 2 })} Deployable Free Cash</span>
          </div>
        </div>

        {/* 4-Stage Waterfall Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Box 1: Total Cash (Directly Editable / Interactive) */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 block font-semibold">1. Total Available Cash</span>
              <button
                onClick={() => setIsEditingInlineCash(!isEditingInlineCash)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold"
              >
                {isEditingInlineCash ? 'Close' : 'Quick Set'}
              </button>
            </div>

            {isEditingInlineCash ? (
              <div className="space-y-1.5">
                <input
                  type="number"
                  step="10000"
                  value={inlineCashValue}
                  onChange={(e) => setInlineCashValue(Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickUpdateTotalCash(inlineCashValue);
                    }
                  }}
                  className="w-full bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickUpdateTotalCash(inlineCashValue)}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleQuickUpdateTotalCash(500000)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono text-slate-300"
                  >
                    $500k
                  </button>
                  <button
                    onClick={() => handleQuickUpdateTotalCash(600000)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono text-slate-300"
                  >
                    $600k
                  </button>
                  <button
                    onClick={() => handleQuickUpdateTotalCash(750000)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono text-slate-300"
                  >
                    $750k
                  </button>
                  <button
                    onClick={() => handleQuickUpdateTotalCash(1000000)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono text-slate-300"
                  >
                    $1M
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xl font-bold font-mono text-white block">
                  ${capitalState.totalCash.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-slate-500">Presets:</span>
                  {[250000, 500000, 750000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickUpdateTotalCash(amt)}
                      className={`text-[9px] font-mono px-1 py-0.2 rounded transition-colors ${
                        capitalState.totalCash === amt
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-white bg-slate-800/60'
                      }`}
                    >
                      ${amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Box 2: Encumbered Disbursements */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-300 font-semibold block">2. Planned Disbursements</span>
              <button
                onClick={() => setIsAddDisbursementOpen(true)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
              >
                + Add
              </button>
            </div>
            <span className="text-xl font-bold font-mono text-amber-400 block">
              -${capitalState.totalEncumberedDisbursements.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-200/70 block truncate">
              {capitalState.plannedDisbursements.length} items ($5,000/wk living expenses)
            </span>
          </div>

          {/* Box 3: Committed Put Collateral */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">3. Committed CSP Collateral</span>
            <span className="text-xl font-bold font-mono text-cyan-400 block">
              -${capitalState.committedCollateral.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block truncate" title={activeCSPs.map((p) => `${p.symbol} $${p.strike}P`).join(', ')}>
              Locked in {activeCSPs.length} open put write{activeCSPs.length === 1 ? '' : 's'} ({activeCSPs.map((p) => `${p.symbol} $${p.strike}P`).join(', ') || 'PLTR $160P'})
            </span>
          </div>

          {/* Box 4: True Free Cash Available */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1 shadow-lg shadow-emerald-950/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold block">4. True Free Deployable Cash</span>
              <span className="text-[10px] text-cyan-300 font-mono font-bold" title="Available cash prior to $5,000 weekly living expenses deduction">
                ${availableCashBeforeLiving.toLocaleString(undefined, { minimumFractionDigits: 2 })} pre-deduction
              </span>
            </div>
            <span className="text-xl font-bold font-mono text-emerald-300 block">
              ${capitalState.freeCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-400/90 font-mono block">
              Max Concurrent: <strong className="text-white font-bold">{capitalState.maxAllowedPositions} positions</strong> (capped at 5)
            </span>
          </div>
        </div>

        {/* Dynamic Position Sizing Control & $200k Single Equity Limit Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Dynamic CSP Position Sizing &amp; Allocation Gate
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                Max $200k / Single Equity Security
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 text-[11px]">Formula:</span>
              <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono">
                min(5, floor(Free Cash / Target Allocation))
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center space-x-3">
              <span className="text-slate-300 font-semibold text-[11px]">Target Position Allocation:</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  ${(capitalState.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">(Max $200,000)</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Quick Presets:</span>
              <button
                onClick={() =>
                  handleUpdatePositionAllocation(
                    Math.min(MAX_SINGLE_EQUITY_POSITION_LIMIT, Math.max(25000, Math.floor(capitalState.freeCash / 5)))
                  )
                }
                className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 transition-colors"
                title="Auto-distribute free cash across 5 equal positions (capped at $200,000)"
              >
                Auto (Free Cash &divide; 5)
              </button>
              {[50000, 100000, 150000, 200000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleUpdatePositionAllocation(amt)}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                    capitalState.maxPerPositionAllocation === amt
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  ${amt / 1000}k {amt === 200000 ? '(Max Cap)' : ''}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-slate-400">Permitted Positions:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono text-xs border border-emerald-500/30">
                {capitalState.maxAllowedPositions} concurrent puts
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Planned Disbursements Strip */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Planned Disbursements (Encumbered Against Free Cash)</span>
            </span>
            <button
              onClick={() => setIsAddDisbursementOpen(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold"
            >
              + Add Item
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {capitalState.plannedDisbursements.length === 0 ? (
              <span className="text-slate-500 text-[11px]">No planned disbursements encumbering cash.</span>
            ) : (
              capitalState.plannedDisbursements.map((d) => (
                <div
                  key={d.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center space-x-2 text-xs font-mono"
                >
                  <span className="text-white font-semibold">{d.description}:</span>
                  <span className="text-amber-400 font-bold">-${d.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 lowercase">({d.frequency || 'weekly'})</span>
                  <button
                    onClick={() => handleRemoveDisbursement(d.id)}
                    className="text-slate-500 hover:text-rose-400 text-sm font-bold pl-1"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Dual Panels: Calendar YTD Premiums & YTD Capital Gains / Carryover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel A: Calendar YTD Premiums Tracking */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Calendar YTD Premiums Tracking ({taxState.currentTaxYear})</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setInputPriorYtdBalanceOnly(capitalState.priorYtdPremiumBalance);
                  setIsEditPriorYtdOpen(true);
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-cyan-500/30 hover:border-cyan-400/60 transition-colors"
                title="Directly edit starting YTD baseline balance"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Starting YTD</span>
              </button>
              <button
                onClick={() => {
                  setModalStartingYtdInput(capitalState.priorYtdPremiumBalance);
                  setIsAddWeekPremiumOpen(true);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 hover:border-emerald-400/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Current Week Premium</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div
              onClick={() => {
                setInputPriorYtdBalanceOnly(capitalState.priorYtdPremiumBalance);
                setIsEditPriorYtdOpen(true);
              }}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors group relative"
              title="Click to edit starting YTD balance ($603,305.40)"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block font-medium">Starting / Prior YTD</span>
                <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="text-base font-bold font-mono text-cyan-300">
                ${capitalState.priorYtdPremiumBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">Baseline ($603,305.40 default)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 block font-semibold">+ Current Week</span>
              <span className="text-base font-bold font-mono text-emerald-300">
                +${capitalState.currentWeekPremiumsCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-emerald-400/70 block">Settled this week</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
              <span className="text-[10px] text-white block font-bold">= Cumulative YTD</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                ${capitalState.ytdPremiumsEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-400 block">2026 Calendar Year</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Captures all options expired, exercised, or rolled for the current week and adds to your calendar year-to-date starting balance ($603,305.40 baseline).
          </p>
        </div>

        {/* Panel B: YTD Capital Gains & Loss Carryforward Offset */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Percent className="w-4 h-4 text-cyan-400" />
              <span>YTD Capital Gains &amp; Loss Carryforward ({taxState.currentTaxYear})</span>
            </span>
            <button
              onClick={() => {
                setInputRealizedGains(taxState.ytdRealizedCapitalGains);
                setInputRealizedLosses(taxState.ytdRealizedCapitalLosses);
                setInputTaxCarryover(taxState.priorYearLossCarryforward);
                setInputTaxYear(taxState.currentTaxYear);
                setIsEditTaxGainsOpen(true);
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-cyan-500/30 hover:border-cyan-400/60 transition-colors"
              title="Edit YTD Realized Capital Gains, Losses, and Carryforwards"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Gains &amp; Carryover</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div
              onClick={() => {
                setInputRealizedGains(taxState.ytdRealizedCapitalGains);
                setInputRealizedLosses(taxState.ytdRealizedCapitalLosses);
                setInputTaxCarryover(taxState.priorYearLossCarryforward);
                setInputTaxYear(taxState.currentTaxYear);
                setIsEditTaxGainsOpen(true);
              }}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors group"
              title="Click to edit YTD Realized Capital Gains"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 block font-semibold">Realized Gains</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-400" />
              </div>
              <span className="text-base font-bold font-mono text-emerald-400">
                +${taxState.ytdRealizedCapitalGains.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">YTD Capital Gains</span>
            </div>

            <div
              onClick={() => {
                setInputRealizedGains(taxState.ytdRealizedCapitalGains);
                setInputRealizedLosses(taxState.ytdRealizedCapitalLosses);
                setInputTaxCarryover(taxState.priorYearLossCarryforward);
                setInputTaxYear(taxState.currentTaxYear);
                setIsEditTaxGainsOpen(true);
              }}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-colors group"
              title="Click to edit YTD Realized Capital Losses"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-rose-400 block font-semibold">Realized Losses</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-rose-400" />
              </div>
              <span className="text-base font-bold font-mono text-rose-400">
                -${taxState.ytdRealizedCapitalLosses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">YTD Capital Losses</span>
            </div>

            <div
              onClick={() => {
                setInputRealizedGains(taxState.ytdRealizedCapitalGains);
                setInputRealizedLosses(taxState.ytdRealizedCapitalLosses);
                setInputTaxCarryover(taxState.priorYearLossCarryforward);
                setInputTaxYear(taxState.currentTaxYear);
                setIsEditTaxGainsOpen(true);
              }}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-colors group"
              title="Click to edit Prior-Year Loss Carryforward"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 block font-semibold">Loss Carryforward</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-amber-400" />
              </div>
              <span className="text-base font-bold font-mono text-amber-400">
                -${taxState.priorYearLossCarryforward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">IRS Carryover</span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30">
              <span className="text-[10px] text-blue-300 block font-semibold">Net Taxable Est.</span>
              <span className="text-base font-bold font-mono text-white">
                ${taxMetrics.netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-400 block">Gains - Losses - Carry</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
            <span>
              Net Cap Gains: <strong className={taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses >= 0 ? '+' : ''}${(taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </span>
            <span>
              Carryforward Offsetting: <strong className="text-cyan-300">-${taxMetrics.carryforwardApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </span>
            <span>
              Premiums Included: <strong className="text-emerald-300">+${capitalState.ytdPremiumsEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Edit Total Cash, Prior YTD Balance & Loss Carryover */}
      {isEditCashOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>Edit Account Balances &amp; Tax Carryover</span>
              </h3>
              <button
                onClick={() => setIsEditCashOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveBalances} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Total Brokerage Cash Position ($)
                </label>
                <input
                  type="number"
                  value={inputTotalCash}
                  onChange={(e) => setInputTotalCash(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Unadjusted cash position before subtracting planned living disbursements and CSP collateral.
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
                  <span>Target Allocation per Position ($)</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Max $200,000 / Equity</span>
                </label>
                <input
                  type="number"
                  step="5000"
                  max={MAX_SINGLE_EQUITY_POSITION_LIMIT}
                  value={inputTargetAllocation}
                  onChange={(e) => setInputTargetAllocation(Math.min(MAX_SINGLE_EQUITY_POSITION_LIMIT, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Target capital allocation per CSP write. The position limit on any one equity security CSP will be no more than $200,000.
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Previous / Starting YTD Premiums Balance ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputPriorYtdPremiums}
                  onChange={(e) => setInputPriorYtdPremiums(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Cumulative option premiums harvested prior to the current trading week. Resets to zero on Jan 1.
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Current Week Premiums Collected ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputCurrentWeekPremiums}
                  onChange={(e) => setInputCurrentWeekPremiums(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Net premium settled from Friday expirations or future rolls for the current week.
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Prior-Year Capital Loss Carryforward ($)
                </label>
                <input
                  type="number"
                  value={inputLossCarryover}
                  onChange={(e) => setInputLossCarryover(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Capital loss carried over from prior year to offset current year realized gains and option premiums.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    YTD Realized Gains ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputRealizedGains}
                    onChange={(e) => setInputRealizedGains(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Closed equity/ETF gains
                  </span>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    YTD Realized Losses ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputRealizedLosses}
                    onChange={(e) => setInputRealizedLosses(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-rose-400 font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Closed equity/ETF losses
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditCashOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Balances
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Planned Disbursement */}
      {isAddDisbursementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Add Planned or Recurring Disbursement</span>
              </h3>
              <button
                onClick={() => setIsAddDisbursementOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDisbursement} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  value={newDisbDesc}
                  onChange={(e) => setNewDisbDesc(e.target.value)}
                  placeholder="e.g. Weekly Living Expenses, Tax Reserve"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Amount ($)</label>
                <input
                  type="number"
                  value={newDisbAmount}
                  onChange={(e) => setNewDisbAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Frequency</label>
                <select
                  value={newDisbFreq}
                  onChange={(e) => setNewDisbFreq(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="WEEKLY">Weekly (Default $5,000)</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="ONE_TIME">One-Time Planned Withdrawal</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddDisbursementOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Encumber Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Log Current Week Settled Premium */}
      {isAddWeekPremiumOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>Log Settled Option Premium for Current Week</span>
              </h3>
              <button
                onClick={() => setIsAddWeekPremiumOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddWeeklyPremium} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-semibold text-xs flex items-center space-x-1.5">
                    <span>Starting / Prior YTD Premiums ($)</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Verified 2026 Baseline)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalStartingYtdInput(603305.40)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-mono cursor-pointer"
                  >
                    Reset to $603,305.40
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={modalStartingYtdInput}
                  onChange={(e) => setModalStartingYtdInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  required
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>Current Week premium will be added to this baseline amount.</span>
                  <span className="font-mono text-slate-300">
                    Preview YTD: ${(Number(modalStartingYtdInput || 0) + capitalState.currentWeekPremiumsCollected + Number(premAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Symbol</label>
                <input
                  type="text"
                  value={premSymbol}
                  onChange={(e) => setPremSymbol(e.target.value)}
                  placeholder="e.g. PANW, PLTR, TSLA, NET"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Settlement Outcome</label>
                <select
                  value={premType}
                  onChange={(e) => setPremType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="EXPIRED">Expired Worthless (100% Premium Captured)</option>
                  <option value="EXERCISED">Exercised / Assigned</option>
                  <option value="ROLLED">Rolled for Future Week (Net Credit Captured)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Net Premium Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={premAmount}
                  onChange={(e) => setPremAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Notes</label>
                <input
                  type="text"
                  value={premNote}
                  onChange={(e) => setPremNote(e.target.value)}
                  placeholder="e.g. Friday expiration settlement"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddWeekPremiumOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Add to Current Week
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Starting / Prior YTD Premium Balance Only */}
      {isEditPriorYtdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>Edit Calendar YTD Starting Balance</span>
              </h3>
              <button
                onClick={() => setIsEditPriorYtdOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePriorYtdBalance} className="space-y-4 text-xs">
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-cyan-300 block">Baseline Tracking for 2026</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Enter your verified calendar year-to-date starting option premiums prior to the current week.
                  Current verified baseline is <strong className="text-white font-mono">$603,305.40</strong>.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Starting / Prior YTD Premiums ($)
                  </label>
                  <button
                    type="button"
                    onClick={() => setInputPriorYtdBalanceOnly(603305.40)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono cursor-pointer"
                  >
                    Quick Fill: $603,305.40
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={inputPriorYtdBalanceOnly}
                  onChange={(e) => setInputPriorYtdBalanceOnly(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Current Week Premiums:</span>
                  <span className="text-emerald-400">+${capitalState.currentWeekPremiumsCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-1">
                  <span>New Cumulative YTD:</span>
                  <span className="text-emerald-300">${(Number(inputPriorYtdBalanceOnly || 0) + capitalState.currentWeekPremiumsCollected).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditPriorYtdOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save YTD Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Edit YTD Capital Gains, Losses & Carryforward */}
      {isEditTaxGainsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Percent className="w-5 h-5 text-cyan-400" />
                <span>Edit YTD Capital Gains &amp; Loss Carryforward</span>
              </h3>
              <button
                onClick={() => setIsEditTaxGainsOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTaxGains} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Tax Year</label>
                <input
                  type="number"
                  value={inputTaxYear}
                  onChange={(e) => setInputTaxYear(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  YTD Realized Capital Gains ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputRealizedGains}
                  onChange={(e) => setInputRealizedGains(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Total realized gains on equities/ETFs closed this tax year.
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  YTD Realized Capital Losses ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputRealizedLosses}
                  onChange={(e) => setInputRealizedLosses(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-rose-400 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Total realized losses on closed trades to offset gains.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Prior-Year Capital Loss Carryforward ($)
                  </label>
                  <button
                    type="button"
                    onClick={() => setInputTaxCarryover(3000)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono cursor-pointer"
                  >
                    IRS Default: $3,000
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={inputTaxCarryover}
                  onChange={(e) => setInputTaxCarryover(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Carried forward from previous years (Schedule D / Form 1040).
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Net Capital Gains / Losses:</span>
                  <span className={Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0) >= 0 ? '+' : ''}${(Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Carryforward Deducted:</span>
                  <span className="text-amber-400">-${Math.min(Math.max(0, Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0)), Number(inputTaxCarryover || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-1">
                  <span>Estimated Net Taxable Income:</span>
                  <span className="text-cyan-300">
                    ${Math.max(0, (capitalState.ytdPremiumsEarned + Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0) - Number(inputTaxCarryover || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditTaxGainsOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save Tax Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
