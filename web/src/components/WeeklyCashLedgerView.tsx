import React, { useState, useMemo, useEffect } from 'react';
import {
  AccountCapitalState,
  TaxLedgerState,
  DisbursementItem,
} from '../types/options';
import { PortfolioPosition } from '../utils/portfolioStressTest';
import {
  getStoredCapitalState,
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
} from './icons';

interface WeeklyCashLedgerViewProps {
  positions?: PortfolioPosition[];
  onNavigateToNextStep?: () => void;
  onNavigateToHoldings?: () => void;
  onNavigateToScreener?: () => void;
}

export const WeeklyCashLedgerView: React.FC<WeeklyCashLedgerViewProps> = ({
  positions,
  onNavigateToNextStep,
  onNavigateToHoldings,
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

  // Modals / Edit states
  const [isEditCashOpen, setIsEditCashOpen] = useState(false);
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

  // Sync state whenever positions change
  useEffect(() => {
    const updated = getStoredCapitalState(positions);
    setCapitalState(updated);
    setInputTotalCash(updated.totalCash);
    setInlineCashValue(updated.totalCash);
    setInputTargetAllocation(updated.maxPerPositionAllocation);
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
      ytdPremiumsEarned: Number(inputPriorYtdPremiums) + Number(inputCurrentWeekPremiums),
    };
    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);

    setIsEditCashOpen(false);
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

  // Handle Add Weekly Premium Record
  const handleAddWeeklyPremium = (e: React.FormEvent) => {
    e.preventDefault();
    const addedAmount = Number(premAmount);
    const newWeeklyTotal = capitalState.currentWeekPremiumsCollected + addedAmount;
    const newYtdTotal = capitalState.priorYtdPremiumBalance + newWeeklyTotal;

    const updatedCap: AccountCapitalState = {
      ...capitalState,
      currentWeekPremiumsCollected: newWeeklyTotal,
      ytdPremiumsEarned: newYtdTotal,
    };
    setCapitalState(updatedCap);
    saveCapitalState(updatedCap);

    const newRec = {
      id: `PREM_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      symbol: premSymbol.toUpperCase().trim() || 'WEEKLY_EXP',
      type: 'PREMIUM_EARNED' as const,
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
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Routine Step Title & Next Step Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
            <span>Weekly Cash, Disbursements &amp; Tax-Alpha Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Step 1 of the Weekend Routine: Set available cash, encumber planned living disbursements ($5k default), dynamically size CSP positions (max $200k/equity), track weekly premiums, and offset prior-year losses.
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
              <span>Next: Step 2 Holdings &rarr;</span>
            </button>
          )}
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
            <span className="text-[11px] text-slate-400 block">3. Committed CSP Collateral</span>
            <span className="text-xl font-bold font-mono text-cyan-400 block">
              -${capitalState.committedCollateral.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Locked in {(positions || []).filter((p) => p.type === 'CSP').length} open put writes
            </span>
          </div>

          {/* Box 4: True Free Cash Available */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1 shadow-lg shadow-emerald-950/50">
            <span className="text-[11px] text-emerald-400 font-bold block">4. True Free Deployable Cash</span>
            <span className="text-xl font-bold font-mono text-emerald-300 block">
              ${capitalState.freeCash.toLocaleString()}
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

      {/* 3. Dual Panels: Calendar YTD Premiums & Prior-Year Carryover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel A: Calendar YTD Premiums Tracking */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Calendar YTD Premiums Tracking ({taxState.currentTaxYear})</span>
            </span>
            <button
              onClick={() => setIsAddWeekPremiumOpen(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Current Week Premium</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Prior YTD Balance</span>
              <span className="text-base font-bold font-mono text-slate-200">
                ${capitalState.priorYtdPremiumBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">Previous weeks</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 block font-semibold">+ Current Week</span>
              <span className="text-base font-bold font-mono text-emerald-300">
                +${capitalState.currentWeekPremiumsCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-emerald-400/70 block">Settled this week</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
              <span className="text-[10px] text-white block font-bold">= Cumulative YTD</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                ${capitalState.ytdPremiumsEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-400 block">Resets Jan 1</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Captures all options expired, exercised, or rolled for the current week and adds to your calendar year-to-date starting balance.
          </p>
        </div>

        {/* Panel B: Prior-Year Loss Carryover & Net Tax Offset */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Percent className="w-4 h-4 text-cyan-400" />
              <span>Prior-Year Capital Loss Carryover Offset</span>
            </span>
            <span className="text-[11px] text-cyan-300 font-mono font-semibold">
              IRS Carryforward Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Prior-Year Carryover</span>
              <span className="text-base font-bold font-mono text-amber-400">
                -${taxState.priorYearLossCarryforward.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 block">Carried from {taxState.currentTaxYear - 1}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Carryover Applied</span>
              <span className="text-base font-bold font-mono text-cyan-300">
                -${taxMetrics.carryforwardApplied.toLocaleString()}
              </span>
              <span className="text-[9px] text-cyan-400/70 block">Offsets gains/premiums</span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30">
              <span className="text-[10px] text-blue-300 block font-semibold">Net Estimated Taxable</span>
              <span className="text-base font-bold font-mono text-white">
                ${taxMetrics.netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] text-slate-400 block">Taxable income</span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
            <span>
              Realized Capital Gains: <strong className="text-emerald-400">+${taxState.ytdRealizedCapitalGains.toLocaleString()}</strong>
            </span>
            <span>
              Realized Losses: <strong className="text-rose-400">-${taxState.ytdRealizedCapitalLosses.toLocaleString()}</strong>
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
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Symbol</label>
                <input
                  type="text"
                  value={premSymbol}
                  onChange={(e) => setPremSymbol(e.target.value)}
                  placeholder="e.g. SPY, AAPL"
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
    </div>
  );
};
