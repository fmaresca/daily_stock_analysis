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
import { getOptionExpirationStatus, isOptionExpired } from '../utils/optionExpirationEngine';
import { fetchTradierQuotesBatch } from '../utils/liveMarketFetcher';
import { SortableTh } from './ui/SortableTh';
import { sortData, SortOrder } from '../utils/tableSort';
import { PositionAuditRow } from './positions/PositionAuditRow';
import { AssetClassSummaryCards } from './positions/AssetClassSummaryCards';
import { AddPositionModal } from './positions/AddPositionModal';

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If cached positions don't have CASH or MMF yet, auto-merge fresh cash/MMF positions
          const hasCashOrMmf = parsed.some((p: PortfolioPosition) => p.type === 'CASH' || p.type === 'MMF');
          if (!hasCashOrMmf) {
            const sampleBook = getSamplePortfolioBook();
            const cashPositions = sampleBook.filter((p) => p.type === 'CASH' || p.type === 'MMF');
            const merged = [...cashPositions, ...parsed];
            try {
              localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(merged));
            } catch {}
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load portfolio book:', e);
    }
    return getSamplePortfolioBook();
  });

  // Filter state for Active Position Ledger
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'EQUITY' | 'CSP' | 'COVERED_CALL' | 'CASH_MMF' | 'EXPIRED'>('ALL');

  // Filtered positions based on selected tab
  const filteredPositions = useMemo(() => {
    if (positionFilter === 'EQUITY') return positions.filter((p) => p.type === 'STOCK');
    if (positionFilter === 'CSP') return positions.filter((p) => p.type === 'CSP' && !isOptionExpired(p.expiration, p.dte));
    if (positionFilter === 'COVERED_CALL') return positions.filter((p) => p.type === 'COVERED_CALL' && !isOptionExpired(p.expiration, p.dte));
    if (positionFilter === 'CASH_MMF') return positions.filter((p) => p.type === 'CASH' || p.type === 'MMF');
    if (positionFilter === 'EXPIRED') return positions.filter((p) => (p.type === 'CSP' || p.type === 'COVERED_CALL') && isOptionExpired(p.expiration, p.dte));
    return positions;
  }, [positions, positionFilter]);

  // Live market quote hydration state
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [marketStatusMsg, setMarketStatusMsg] = useState<string>('');

  const refreshMarketQuotes = async () => {
    setIsRefreshingQuotes(true);
    try {
      const symbols = Array.from(
        new Set(
          positions
            .filter((p) => p.type !== 'CASH' && p.type !== 'MMF')
            .map((p) => p.symbol.toUpperCase().trim())
            .filter(Boolean)
        )
      );
      if (symbols.length === 0) {
        setIsRefreshingQuotes(false);
        return;
      }

      const tradierQuotes = await fetchTradierQuotesBatch(symbols);

      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const estNow = new Date(utc + 3600000 * -4); // EDT UTC-4
      const dayOfWeek = estNow.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isMarketHours =
        !isWeekend &&
        (estNow.getHours() > 9 || (estNow.getHours() === 9 && estNow.getMinutes() >= 30)) &&
        estNow.getHours() < 16;

      let updatedCount = 0;
      const updatedPositions = positions.map((pos) => {
        if (pos.type === 'CASH' || pos.type === 'MMF') return pos;
        const sym = pos.symbol.toUpperCase().trim();
        const quote = tradierQuotes.get(sym);
        if (quote && quote.last > 0) {
          updatedCount++;
          const newPrice = Math.round(quote.last * 100) / 100;
          return {
            ...pos,
            spotPrice: newPrice,
            marketValueTotal: pos.type === 'STOCK' ? newPrice * pos.quantity : pos.marketValueTotal,
          };
        }
        return pos;
      });

      if (updatedCount > 0) {
        setPositions(updatedPositions);
      }

      setMarketStatusMsg(
        isMarketHours ? 'Live NBBO Market Feed' : 'Market Closed (Friday Close)'
      );
    } catch (e) {
      console.warn('Quote refresh notice:', e);
    } finally {
      setIsRefreshingQuotes(false);
    }
  };

  useEffect(() => {
    refreshMarketQuotes();
  }, []);

  // Sorting state for Active Positions Ledger
  const [posSortKey, setPosSortKey] = useState<string>('symbol');
  const [posSortOrder, setPosSortOrder] = useState<SortOrder>('asc');
  const requestPosSort = (key: string) => {
    if (posSortKey === key) {
      setPosSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setPosSortKey(key);
      setPosSortOrder('asc');
    }
  };

  const sortedPositions = useMemo(() => {
    return sortData(filteredPositions, posSortKey, posSortOrder);
  }, [filteredPositions, posSortKey, posSortOrder]);

  // Reset to live Charles Schwab account baseline (7 equities, 2 CSPs, 8 CCs, 3 Cash/MMFs = 20 positions)
  const handleResetToLiveSchwabAccount = () => {
    const fresh = getSamplePortfolioBook();
    setPositions(fresh);
    try {
      localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(fresh));
      const updatedCap = getStoredCapitalState(fresh);
      setCapitalState(updatedCap);
    } catch (e) {
      console.warn('Failed to reset positions:', e);
    }
  };

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
      <AssetClassSummaryCards
        capitalState={capitalState}
        taxState={taxState}
        taxMetrics={taxMetrics}
        utilizationPct={utilizationPct}
        onOpenAddTaxRecord={() => setIsAddTaxRecordOpen(true)}
      />

      {/* 3. Action Banners: Urgent Weekend Decisions */}
      <div className="space-y-3">
        {/* Alert 1: 80% Profit Rule (Active unexpired positions only) */}
        {audit.profitTargetHits.length > 0 && (
          <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  🎯 80% Profit Target Hit ({audit.profitTargetHits.length} Open Positions)
                </span>
                <span className="text-xs text-slate-300">
                  Active options have decayed &ge; 80%. Close these positions early to eliminate tail gamma risk and redeploy cash.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {audit.profitTargetHits.map((h) => (
                <div
                  key={h.position.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-500/40 text-xs font-mono flex items-center space-x-2"
                >
                  <strong className="text-white">{h.position.symbol} ${h.position.strike}{h.position.type === 'CSP' ? 'P' : 'C'}</strong>
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

        {/* Alert 2: Threatened Strikes (Active unexpired positions only) */}
        {audit.threatenedPositions.length > 0 && (
          <div className="glass-panel p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/20 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                  ⚠️ Strike Tested / Assignment Risk ({audit.threatenedPositions.length} Open Positions)
                </span>
                <span className="text-xs text-slate-300">
                  Mkt price is within 2.5% of strike or in-the-money. Evaluate defensive down-and-out credit rolls before expiration.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {audit.threatenedPositions.map((t) => (
                <div
                  key={t.position.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-rose-500/40 text-xs font-mono flex items-center space-x-2"
                >
                  <strong className="text-white">{t.position.symbol} ${t.position.strike}{t.position.type === 'CSP' ? 'P' : 'C'}</strong>
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

        {/* Alert 3: Informational Settled/Expired Contracts */}
        {audit.expiredPositions && audit.expiredPositions.length > 0 && (
          <div className="glass-panel p-3 rounded-xl border border-slate-700/60 bg-slate-900/50 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  📜 Settled / Expired Contracts ({audit.expiredPositions.length} Contracts)
                </span>
                <span className="text-[11px] text-slate-400">
                  Expiration date has passed. Expired contracts do not require action; collateral released and 100% premium kept for OTM expires.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-1.5">
              {audit.expiredPositions.map((exp) => (
                <div
                  key={exp.position.id}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono flex items-center space-x-1.5"
                >
                  <strong className="text-white">{exp.position.symbol} ${exp.position.strike}{exp.position.type === 'CSP' ? 'P' : 'C'}</strong>
                  <span className={exp.isWorthless ? 'text-emerald-400 font-semibold text-[11px]' : 'text-amber-400 font-semibold text-[11px]'}>
                    {exp.isWorthless ? 'Worthless (100% Win)' : 'Assigned/Settled'}
                  </span>
                  <span className="text-slate-500 text-[10px]">({exp.expiredDate})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alert 4: Uncovered Shares Available for Covered Calls */}
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
        <div className="p-4 border-b border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Active Positions Ledger ({positions.length})</h3>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {capitalState.accountName || positions[0]?.account || 'Active Account'}
              </span>
              {marketStatusMsg && (
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{marketStatusMsg}</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshMarketQuotes}
                disabled={isRefreshingQuotes}
                title="Refresh real-time / closing market prices (Tradier API Primary)"
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuotes ? 'animate-spin' : ''}`} />
                <span>{isRefreshingQuotes ? 'Refreshing...' : 'Refresh Mkt Quotes'}</span>
              </button>
              <button
                onClick={handleResetToLiveSchwabAccount}
                title="Reset/sync baseline Charles Schwab account positions (Equities, Options, Cash & MMFs)"
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Sync Schwab Baseline</span>
              </button>
              <span className="text-xs text-slate-400 font-mono hidden md:inline">
                {positions.filter((p) => p.type === 'CSP' && !isOptionExpired(p.expiration, p.dte)).length} CSPs •{' '}
                {positions.filter((p) => p.type === 'COVERED_CALL' && !isOptionExpired(p.expiration, p.dte)).length} CCs •{' '}
                {positions.filter((p) => p.type === 'STOCK').length} Equities •{' '}
                {positions.filter((p) => p.type === 'CASH' || p.type === 'MMF').length} Cash &amp; MMF
              </span>
            </div>
          </div>

          {/* Asset Class Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setPositionFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                positionFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              All Positions ({positions.length})
            </button>
            <button
              onClick={() => setPositionFilter('EQUITY')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                positionFilter === 'EQUITY'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              Equities ({positions.filter((p) => p.type === 'STOCK').length})
            </button>
            <button
              onClick={() => setPositionFilter('CSP')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                positionFilter === 'CSP'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              Cash-Secured Puts ({positions.filter((p) => p.type === 'CSP' && !isOptionExpired(p.expiration, p.dte)).length})
            </button>
            <button
              onClick={() => setPositionFilter('COVERED_CALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                positionFilter === 'COVERED_CALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              Covered Calls ({positions.filter((p) => p.type === 'COVERED_CALL' && !isOptionExpired(p.expiration, p.dte)).length})
            </button>
            <button
              onClick={() => setPositionFilter('CASH_MMF')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                positionFilter === 'CASH_MMF'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              Cash &amp; Money Market Funds ({positions.filter((p) => p.type === 'CASH' || p.type === 'MMF').length})
            </button>
            <button
              onClick={() => setPositionFilter('EXPIRED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                positionFilter === 'EXPIRED'
                  ? 'bg-slate-700 text-white shadow-md ring-1 ring-slate-400'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              Expired / Settled ({positions.filter((p) => (p.type === 'CSP' || p.type === 'COVERED_CALL') && isOptionExpired(p.expiration, p.dte)).length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[640px] 2xl:max-h-[740px] overflow-y-auto relative table-scroll-container">
          <table className="w-full text-left border-collapse text-xs table-sticky-header">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <SortableTh label="Symbol / Asset Class" sortKey="symbol" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="Quantity" sortKey="quantity" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="Mkt Price" sortKey="spotPrice" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="Strike / Coverage" sortKey="strike" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="DTE (Exp)" sortKey="dte" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="Delta" sortKey="delta" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="Entry / Current" sortKey="entryPrice" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="Collateral / Market Val" sortKey="marketValueTotal" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="Profit / Yield" sortKey="gainDollar" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <SortableTh label="Status" sortKey="status" currentSortKey={posSortKey} currentSortOrder={posSortOrder} onSort={requestPosSort} />
                <th className="sticky top-0 z-10 bg-slate-900/98 backdrop-blur py-3 px-4 text-center border-b border-slate-800">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {sortedPositions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No positions found for the selected filter tab. Click "+ Add Open Position" or "Sync Schwab Baseline".
                  </td>
                </tr>
              ) : (
                sortedPositions.map((p) => (
                  <PositionAuditRow
                    key={p.id}
                    position={p}
                    onNavigateToRollAssistant={onNavigateToRollAssistant}
                    onDeletePosition={handleDeletePosition}
                  />
                ))
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
      <AddPositionModal
        isOpen={isAddPositionOpen}
        onClose={() => setIsAddPositionOpen(false)}
        onAddPosition={(pos) => setPositions((prev) => [pos, ...prev])}
      />

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
                  placeholder="e.g. PANW, PLTR, TSLA, NET"
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
