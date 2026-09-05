import React, { useState, useMemo, useEffect } from 'react';
import {
  PortfolioPosition,
  PositionType,
  getSamplePortfolioBook,
} from '../utils/portfolioStressTest';
import {
  AccountCapitalState,
  TaxLedgerState,
  TaxLedgerRecord,
  MultiLegSpread,
} from '../types/options';
import {
  getStoredCapitalState,
  saveCapitalState,
  getStoredTaxLedgerState,
  saveTaxLedgerState,
  auditPositionsWeeklyStatus,
  calculateNetTaxableMetrics,
  DEFAULT_PER_POSITION_BUDGET,
} from '../utils/capitalAndTaxLedger';
import {
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Zap,
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  Percent,
  Sliders,
  Award,
  Layers,
} from './icons';

interface WeeklyPositionAuditViewProps {
  onNavigateToRollAssistant?: (symbol: string) => void;
  onNavigateToCoveredCallScreener?: (symbol: string) => void;
  onStageCloseOrder?: (pos: PortfolioPosition) => void;
}

export const WeeklyPositionAuditView: React.FC<WeeklyPositionAuditViewProps> = ({
  onNavigateToRollAssistant,
  onNavigateToCoveredCallScreener,
  onStageCloseOrder,
}) => {
  // 1. Portfolio Positions state synced with localStorage
  const [positions, setPositions] = useState<PortfolioPosition[]>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_portfolio_book');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load portfolio book:', e);
    }
    return getSamplePortfolioBook();
  });

  // 2. Capital Ledger state
  const [capitalState, setCapitalState] = useState<AccountCapitalState>(() =>
    getStoredCapitalState(positions)
  );

  // 3. Tax Ledger state
  const [taxState, setTaxState] = useState<TaxLedgerState>(() =>
    getStoredTaxLedgerState()
  );

  // Modals state
  const [isEditCapitalOpen, setIsEditCapitalOpen] = useState(false);
  const [editTotalCash, setEditTotalCash] = useState<number>(capitalState.totalCash);
  const [editMaxPerPos, setEditMaxPerPos] = useState<number>(capitalState.maxPerPositionAllocation);
  const [editLossCarryforward, setEditLossCarryforward] = useState<number>(
    taxState.priorYearLossCarryforward
  );

  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState('SPY');
  const [newType, setNewType] = useState<PositionType>('CSP');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newSpot, setNewSpot] = useState(550);
  const [newStrike, setNewStrike] = useState(535);
  const [newDte, setNewDte] = useState(28);
  const [newEntryPrice, setNewEntryPrice] = useState(3.50);
  const [newDelta, setNewDelta] = useState(0.18);

  const [isAddTaxRecordOpen, setIsAddTaxRecordOpen] = useState(false);
  const [taxRecordSymbol, setTaxRecordSymbol] = useState('');
  const [taxRecordType, setTaxRecordType] = useState<'PREMIUM_EARNED' | 'CAPITAL_GAIN' | 'CAPITAL_LOSS'>('PREMIUM_EARNED');
  const [taxRecordAmount, setTaxRecordAmount] = useState<number>(250);
  const [taxRecordNote, setTaxRecordNote] = useState('');

  // Sync positions to localStorage and update capital state
  useEffect(() => {
    try {
      localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(positions));
      const updated = getStoredCapitalState(positions);
      setCapitalState(updated);
    } catch (e) {
      console.warn('Failed to update positions/capital:', e);
    }
  }, [positions]);

  // Run End-of-Week Audit
  const audit = useMemo(() => {
    return auditPositionsWeeklyStatus(positions);
  }, [positions]);

  // Calculate Tax Metrics
  const taxMetrics = useMemo(() => {
    return calculateNetTaxableMetrics(taxState);
  }, [taxState]);

  // Capital Utilization calculation
  const utilizationPct = useMemo(() => {
    if (!capitalState.totalCash || capitalState.totalCash <= 0) return 0;
    return Math.min(100, Math.round((capitalState.committedCollateral / capitalState.totalCash) * 100));
  }, [capitalState]);

  // Handle Save Capital
  const handleSaveCapital = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AccountCapitalState = {
      ...capitalState,
      totalCash: Number(editTotalCash),
      maxPerPositionAllocation: Number(editMaxPerPos),
      freeCash: Math.max(0, Number(editTotalCash) - capitalState.committedCollateral),
      maxAllowedPositions: Math.max(0, Math.floor(Math.max(0, Number(editTotalCash) - capitalState.committedCollateral) / Number(editMaxPerPos))),
      lastUpdated: new Date().toISOString(),
    };
    setCapitalState(updated);
    saveCapitalState(updated);

    const updatedTax: TaxLedgerState = {
      ...taxState,
      priorYearLossCarryforward: Number(editLossCarryforward),
    };
    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);

    setIsEditCapitalOpen(false);
  };

  // Handle Add Position
  const handleAddPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = newSymbol.toUpperCase().trim();
    const pos: PortfolioPosition = {
      id: `POS_${sym}_${Date.now().toString().slice(-4)}`,
      symbol: sym,
      type: newType,
      quantity: Number(newQuantity),
      spotPrice: Number(newSpot),
      strike: newType === 'STOCK' ? 0 : Number(newStrike),
      dte: newType === 'STOCK' ? 0 : Number(newDte),
      entryPrice: Number(newEntryPrice),
      currentOptionPrice: Number(newEntryPrice),
      iv: 22,
      delta: newType === 'CSP' ? -Math.abs(Number(newDelta)) : Number(newDelta),
      theta: 0.12,
      vega: -0.15,
      beta: 1.0,
    };
    setPositions((prev) => [pos, ...prev]);
    setIsAddPositionOpen(false);
  };

  // Handle Delete Position
  const handleDeletePosition = (id: string) => {
    if (window.confirm('Are you sure you want to remove this position?')) {
      setPositions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Handle Add Tax Record
  const handleAddTaxRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const rec: TaxLedgerRecord = {
      id: `TAX_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      symbol: taxRecordSymbol.toUpperCase().trim() || 'OPTION',
      type: taxRecordType,
      amount: Number(taxRecordAmount),
      strategy: 'CSP',
      note: taxRecordNote || 'Closed position',
    };

    const newRecords = [rec, ...taxState.records];
    const newPremiums = newRecords
      .filter((r) => r.type === 'PREMIUM_EARNED')
      .reduce((sum, r) => sum + r.amount, 0);
    const newGains = newRecords
      .filter((r) => r.type === 'CAPITAL_GAIN')
      .reduce((sum, r) => sum + r.amount, 0);
    const newLosses = newRecords
      .filter((r) => r.type === 'CAPITAL_LOSS')
      .reduce((sum, r) => sum + r.amount, 0);

    const updatedTax: TaxLedgerState = {
      ...taxState,
      ytdPremiumsEarned: newPremiums,
      ytdRealizedCapitalGains: newGains,
      ytdRealizedCapitalLosses: newLosses,
      records: newRecords,
    };

    setTaxState(updatedTax);
    saveTaxLedgerState(updatedTax);
    setIsAddTaxRecordOpen(false);
    setTaxRecordSymbol('');
    setTaxRecordNote('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Routine Title & Quick Settings */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>End-of-Week Position Audit &amp; Capital Action Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate open positions, enforce 80% profit taking, manage assignment risk, track free cash (zero margin), and audit YTD tax performance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditTotalCash(capitalState.totalCash);
              setEditMaxPerPos(capitalState.maxPerPositionAllocation);
              setEditLossCarryforward(taxState.priorYearLossCarryforward);
              setIsEditCapitalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex items-center space-x-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Cash &amp; Tax Settings</span>
          </button>

          <button
            onClick={() => setIsAddPositionOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Open Position</span>
          </button>
        </div>
      </div>

      {/* 2. Dual KPI Ribbon: Available Capital & YTD Tax Alpha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card A: Liquid Cash & Collateral Budgeting */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Available Capital &amp; CSP Collateral Ledger</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              100% Cash-Secured (Zero Margin)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Total Liquid Cash</span>
              <span className="text-lg font-bold font-mono text-white">
                ${capitalState.totalCash.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Committed CSP Collateral</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                ${capitalState.committedCollateral.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-400 block font-semibold">Free Cash Deployable</span>
              <span className="text-lg font-bold font-mono text-emerald-300">
                ${capitalState.freeCash.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Capital Utilization Gauge Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Cash Committed: {utilizationPct}%</span>
              <span>
                Affordable $15k Positions: <strong className="text-white">{capitalState.maxAllowedPositions}</strong>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  utilizationPct > 85
                    ? 'bg-rose-500'
                    : utilizationPct > 65
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${utilizationPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card B: Calendar YTD Premiums & Tax-Loss Carryforward */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Percent className="w-4 h-4 text-cyan-400" />
              <span>YTD Option Premiums &amp; Capital Gains ({taxState.currentTaxYear})</span>
            </span>
            <button
              onClick={() => setIsAddTaxRecordOpen(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>+ Log Closed Trade</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block truncate">YTD Premiums</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                +${taxState.ytdPremiumsEarned.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block truncate">Realized Gains</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                +${taxState.ytdRealizedCapitalGains.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block truncate">Loss Carryforward</span>
              <span className="text-base font-bold font-mono text-amber-400">
                -${taxState.priorYearLossCarryforward.toLocaleString()}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-500/30">
              <span className="text-[10px] text-blue-300 block truncate font-semibold">Net Taxable</span>
              <span className="text-base font-bold font-mono text-white">
                ${taxMetrics.netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
            <span>
              Carryforward Applied: <strong className="text-amber-300">${taxMetrics.carryforwardApplied.toLocaleString()}</strong>
            </span>
            <span>
              Remaining Carryforward: <strong className="text-slate-300">${taxMetrics.remainingCarryforward.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Banners: Urgent Weekend Decisions */}
      <div className="space-y-3">
        {/* Alert 1: 80% Profit Rule */}
        {audit.profitTargetHits.length > 0 && (
          <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  🎯 80% Profit Target Hit ({audit.profitTargetHits.length} Positions)
                </span>
                <span className="text-xs text-slate-300">
                  Options have decayed &ge; 80%. Close these positions to eliminate tail gamma risk and redeploy cash.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {audit.profitTargetHits.map((h) => (
                <div
                  key={h.position.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-500/40 text-xs font-mono flex items-center space-x-2"
                >
                  <strong className="text-white">{h.position.symbol}</strong>
                  <span className="text-emerald-400 font-bold">+{h.profitPct.toFixed(0)}%</span>
                  {onStageCloseOrder && (
                    <button
                      onClick={() => onStageCloseOrder(h.position)}
                      className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                    >
                      Close
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert 2: Threatened Strikes */}
        {audit.threatenedPositions.length > 0 && (
          <div className="glass-panel p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                  ⚠️ Strike Tested / Assignment Risk ({audit.threatenedPositions.length} Positions)
                </span>
                <span className="text-xs text-slate-300">
                  Spot price is within 2.5% of strike or in-the-money. Evaluate defensive down-and-out credit rolls.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {audit.threatenedPositions.map((t) => (
                <div
                  key={t.position.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-rose-500/40 text-xs font-mono flex items-center space-x-2"
                >
                  <strong className="text-white">{t.position.symbol}</strong>
                  <span className="text-rose-400 font-bold">
                    ${t.position.strike} ({t.distancePct.toFixed(1)}% cushion)
                  </span>
                  {onNavigateToRollAssistant && (
                    <button
                      onClick={() => onNavigateToRollAssistant(t.position.symbol)}
                      className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center space-x-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Roll</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert 3: Uncovered Shares Available for Covered Calls */}
        {audit.uncoveredShareLots.length > 0 && (
          <div className="glass-panel p-3.5 rounded-xl border border-blue-500/40 bg-blue-950/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">
                  ⚡ Uncovered Share Lots ({audit.uncoveredShareLots.length} Stocks Ready for Covered Calls)
                </span>
                <span className="text-xs text-slate-300">
                  You own 100+ shares without an active short call. Screen 15–25Δ covered calls to harvest weekly cash flow.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {audit.uncoveredShareLots.map((lot) => (
                <div
                  key={lot.symbol}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-blue-500/40 text-xs font-mono flex items-center space-x-2"
                >
                  <strong className="text-white">{lot.symbol}</strong>
                  <span className="text-blue-300 font-semibold">{lot.uncoveredShares} shares</span>
                  {onNavigateToCoveredCallScreener && (
                    <button
                      onClick={() => onNavigateToCoveredCallScreener(lot.symbol)}
                      className="px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold"
                    >
                      Screen CCs
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Portfolio Positions Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Active Positions Ledger ({positions.length})</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {positions.filter((p) => p.type === 'CSP').length} CSPs •{' '}
            {positions.filter((p) => p.type === 'COVERED_CALL').length} CCs •{' '}
            {positions.filter((p) => p.type === 'STOCK').length} Equity Lots
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Symbol / Type</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Spot Price</th>
                <th className="py-3 px-3">Strike (Cushion)</th>
                <th className="py-3 px-3">DTE (Exp)</th>
                <th className="py-3 px-3">Delta</th>
                <th className="py-3 px-3">Entry / Mid</th>
                <th className="py-3 px-3">Collateral Locked</th>
                <th className="py-3 px-3">Profit Captured</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No active positions currently logged. Click "+ Add Open Position" to begin tracking.
                  </td>
                </tr>
              ) : (
                positions.map((p) => {
                  const isCsp = p.type === 'CSP';
                  const isCc = p.type === 'COVERED_CALL';
                  const isStock = p.type === 'STOCK';

                  const collateral = isCsp
                    ? p.strike * 100 * (p.quantity || 1)
                    : isStock
                    ? p.spotPrice * p.quantity
                    : p.spotPrice * 100 * (p.quantity || 1);

                  const profitPct =
                    p.entryPrice > 0 && p.currentOptionPrice !== undefined
                      ? ((p.entryPrice - p.currentOptionPrice) / p.entryPrice) * 100
                      : 0;

                  const cushionPct =
                    isCsp && p.strike > 0 && p.spotPrice > 0
                      ? ((p.spotPrice - p.strike) / p.spotPrice) * 100
                      : isCc && p.strike > 0 && p.spotPrice > 0
                      ? ((p.strike - p.spotPrice) / p.spotPrice) * 100
                      : null;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-white text-sm block">{p.symbol}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            isCsp
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isCc
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {p.type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        {p.quantity} {isStock ? 'shs' : 'cts'}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-200">
                        ${p.spotPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {isStock ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <div>
                            <span className="text-white font-bold">${p.strike.toFixed(2)}</span>
                            {cushionPct !== null && (
                              <span
                                className={`text-[10px] block ${
                                  cushionPct <= 2.5 ? 'text-rose-400 font-bold' : 'text-slate-400'
                                }`}
                              >
                                {cushionPct.toFixed(1)}% cushion
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {isStock ? (
                          <span className="text-slate-500">Hold</span>
                        ) : (
                          <span
                            className={`${
                              p.dte <= 5 ? 'text-amber-400 font-bold' : 'text-slate-300'
                            }`}
                          >
                            {p.dte}d
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {isStock ? (
                          <span className="text-slate-400">1.00</span>
                        ) : (
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              Math.abs(p.delta) >= 0.15 && Math.abs(p.delta) <= 0.25
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                                : Math.abs(p.delta) > 0.35
                                ? 'bg-rose-500/20 text-rose-300 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {p.delta.toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        ${p.entryPrice.toFixed(2)} / ${(p.currentOptionPrice || p.entryPrice).toFixed(2)}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        ${collateral.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {isStock ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <span
                            className={`font-bold ${
                              profitPct >= 80
                                ? 'text-emerald-400'
                                : profitPct >= 50
                                ? 'text-cyan-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {profitPct.toFixed(0)}%
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {profitPct >= 80 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            80% Hit
                          </span>
                        ) : cushionPct !== null && cushionPct <= 2.5 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Threatened
                          </span>
                        ) : p.dte <= 5 && !isStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Expiring
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                            Normal
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isCsp && onNavigateToRollAssistant && (
                            <button
                              onClick={() => onNavigateToRollAssistant(p.symbol)}
                              title="Evaluate Defensive Roll"
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePosition(p.id)}
                            title="Remove Position"
                            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-rose-400 border border-slate-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Edit Capital & Loss Carryforward Settings */}
      {isEditCapitalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Account Capital &amp; Tax Settings</span>
              </h3>
              <button
                onClick={() => setIsEditCapitalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveCapital} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Total Liquid Cash ($)
                </label>
                <input
                  type="number"
                  value={editTotalCash}
                  onChange={(e) => setEditTotalCash(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Total available cash in your brokerage account (used to cash-secure puts without margin).
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Target Allocation per Position ($)
                </label>
                <input
                  type="number"
                  value={editMaxPerPos}
                  onChange={(e) => setEditMaxPerPos(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Standard position sizing rule (default: $15,000 per put write).
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Prior Year Capital Loss Carryforward ($)
                </label>
                <input
                  type="number"
                  value={editLossCarryforward}
                  onChange={(e) => setEditLossCarryforward(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Deductible against current year capital gains and option premiums (e.g. IRS $3,000 allowance or accumulated losses).
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditCapitalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Position */}
      {isAddPositionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-lg w-full shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Add Position to Active Ledger</span>
              </h3>
              <button
                onClick={() => setIsAddPositionOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddPosition} className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Symbol</label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Position Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PositionType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="CSP">Cash-Secured Put (CSP)</option>
                  <option value="COVERED_CALL">Covered Call (CC)</option>
                  <option value="STOCK">Stock (Long Shares)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Quantity</label>
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Spot Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newSpot}
                  onChange={(e) => setNewSpot(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              {newType !== 'STOCK' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Strike ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newStrike}
                      onChange={(e) => setNewStrike(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">DTE</label>
                    <input
                      type="number"
                      value={newDte}
                      onChange={(e) => setNewDte(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Entry Premium ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newEntryPrice}
                      onChange={(e) => setNewEntryPrice(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Delta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newDelta}
                      onChange={(e) => setNewDelta(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                      required
                    />
                  </div>
                </>
              )}

              <div className="col-span-2 flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddPositionOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Add to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Tax / Closed Trade Record */}
      {isAddTaxRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Percent className="w-5 h-5 text-cyan-400" />
                <span>Log Closed Trade / Realized PnL</span>
              </h3>
              <button
                onClick={() => setIsAddTaxRecordOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddTaxRecord} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Ticker Symbol</label>
                <input
                  type="text"
                  value={taxRecordSymbol}
                  onChange={(e) => setTaxRecordSymbol(e.target.value)}
                  placeholder="e.g. SPY, AAPL"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Record Type</label>
                <select
                  value={taxRecordType}
                  onChange={(e) => setTaxRecordType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  <option value="PREMIUM_EARNED">Option Premium Earned (Cash Inflow)</option>
                  <option value="CAPITAL_GAIN">Realized Capital Gain</option>
                  <option value="CAPITAL_LOSS">Realized Capital Loss</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Net Dollar Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={taxRecordAmount}
                  onChange={(e) => setTaxRecordAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Note / Trade Description</label>
                <input
                  type="text"
                  value={taxRecordNote}
                  onChange={(e) => setTaxRecordNote(e.target.value)}
                  placeholder="e.g. Expired worthless, closed at 80% rule"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTaxRecordOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/30"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
