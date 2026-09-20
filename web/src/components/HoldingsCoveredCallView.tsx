import React, { useState, useMemo, useEffect } from 'react';
import {
  PortfolioPosition,
  PositionType,
  getSamplePortfolioBook,
} from '../utils/portfolioStressTest';
import {
  calculateSuggestedCoveredCall20Delta,
  CoveredCall20DeltaResult,
  getNextWeeklyFriday,
  getStoredCapitalState,
  saveCapitalState,
} from '../utils/capitalAndTaxLedger';
import { StockHoldingPair } from '../types/options';
import { getOptionExpirationStatus } from '../utils/optionExpirationEngine';
import {
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
  DollarSign,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
} from './icons';
import { SortableTh } from './ui/SortableTh';
import { sortData, SortOrder } from '../utils/tableSort';
import { PortfolioOverlayScanner } from './PortfolioOverlayScanner';

interface HoldingsCoveredCallViewProps {
  onStageOrder?: (order: any) => void;
  onNavigateToScreener?: () => void;
}

export const HoldingsCoveredCallView: React.FC<HoldingsCoveredCallViewProps> = ({
  onStageOrder,
  onNavigateToScreener,
}) => {
  // Load portfolio positions from localStorage
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

  // Save to localStorage whenever positions change
  useEffect(() => {
    try {
      localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(positions));
    } catch (e) {
      console.warn('Failed to save portfolio book:', e);
    }
  }, [positions]);

  // View mode: Standard Ledger vs Advanced Buy-Write (OptionForge & Optopsy)
  const [viewMode, setViewMode] = useState<'LEDGER' | 'ADVANCED_BUY_WRITE'>('LEDGER');
  const [seedPosition, setSeedPosition] = useState<{ ticker: string; quantity: number; costBasis: number }>({
    ticker: 'AAPL',
    quantity: 300,
    costBasis: 218.4,
  });

  // Modal / Suggestion state
  const [selectedHoldingForCC, setSelectedHoldingForCC] = useState<{
    symbol: string;
    shares: number;
    spotPrice: number;
    costBasis: number;
    ivr30: number;
    ivrRank: number;
    resistance: number;
  } | null>(null);

  const [isAddPositionModalOpen, setIsAddPositionModalOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState('AAPL');
  const [newType, setNewType] = useState<PositionType>('STOCK');
  const [newQuantity, setNewQuantity] = useState(100);
  const [newSpot, setNewSpot] = useState(220);
  const [newStrike, setNewStrike] = useState(225);
  const [newDte, setNewDte] = useState(7);
  const [newEntryPrice, setNewEntryPrice] = useState(2.10);
  const [newDelta, setNewDelta] = useState(0.20);

  // Group positions into Stock Holdings (with linked CCs) and Open CSPs
  const { stockPairs, openCSPs, totalStockEquity, totalCspCollateral, totalActiveCcIncome } = useMemo(() => {
    const stocks = positions.filter((p) => p.type === 'STOCK');
    const coveredCalls = positions.filter((p) => p.type === 'COVERED_CALL');
    const csps = positions.filter((p) => p.type === 'CSP');

    let totalEquity = 0;
    let totalCspCash = 0;
    let totalCcPrem = 0;

    const pairs: StockHoldingPair[] = stocks.map((stk) => {
      const currentVal = stk.quantity * stk.spotPrice;
      totalEquity += currentVal;

      // Find all linked covered calls for this symbol (e.g. TSLA has two short call tranches)
      const linkedCcs = coveredCalls.filter((cc) => cc.symbol.toUpperCase() === stk.symbol.toUpperCase());
      const totalCoveredContracts = linkedCcs.reduce((acc, cc) => acc + cc.quantity, 0);
      const coveredShares = totalCoveredContracts * 100;
      const uncoveredShares = Math.max(0, stk.quantity - coveredShares);

      const activeCallsList = linkedCcs.map((linkedCc) => {
        const pnlPct = linkedCc.gainPct !== undefined
          ? linkedCc.gainPct
          : (linkedCc.entryPrice > 0
              ? ((linkedCc.entryPrice - linkedCc.currentOptionPrice) / linkedCc.entryPrice) * 100
              : 0);
        const totalPremium = linkedCc.entryPrice * linkedCc.quantity * 100;
        totalCcPrem += totalPremium;

        return {
          id: linkedCc.id,
          strike: linkedCc.strike,
          expiration: linkedCc.expiration,
          dte: linkedCc.dte,
          delta: linkedCc.delta,
          premiumCollected: linkedCc.entryPrice,
          currentPrice: linkedCc.currentOptionPrice,
          pnlPercent: pnlPct,
          gainDollar: linkedCc.gainDollar,
          gainPct: linkedCc.gainPct ?? pnlPct,
          quantity: linkedCc.quantity,
        };
      });

      // Default mock IVR and resistance for intelligence
      const ivr30 = 32 + (stk.symbol.charCodeAt(0) % 25);
      const ivrRank = 40 + (stk.symbol.charCodeAt(1) % 45);
      const resistanceLevel = Math.round(stk.spotPrice * 1.05 * 100) / 100;

      const marketValue = stk.quantity * stk.spotPrice;
      const unrealizedPnl = stk.quantity * (stk.spotPrice - stk.entryPrice);

      return {
        symbol: stk.symbol,
        companyName: stk.companyName || stk.symbol,
        shares: stk.quantity,
        costBasis: stk.entryPrice,
        currentSpot: stk.spotPrice,
        marketValue,
        unrealizedPnl,
        uncoveredShares,
        activeCoveredCall: activeCallsList[0],
        activeCoveredCalls: activeCallsList,
        marketChameleonIvr30: ivr30,
        marketChameleonIvrRank: ivrRank,
        resistanceLevel,
      };
    });

    const enrichedCsps = csps.map((p) => {
      const collateral = p.strike * p.quantity * 100;
      totalCspCash += collateral;
      return {
        ...p,
        collateral,
      };
    });

    return {
      stockPairs: pairs,
      openCSPs: enrichedCsps,
      totalStockEquity: totalEquity,
      totalCspCollateral: totalCspCash,
      totalActiveCcIncome: totalCcPrem,
    };
  }, [positions]);

  // Sorting state for stockPairs (Table 1: Long Equities & Covered Calls)
  const [stockSortKey, setStockSortKey] = useState<string>('symbol');
  const [stockSortOrder, setStockSortOrder] = useState<SortOrder>('asc');
  const requestStockSort = (key: string) => {
    if (stockSortKey === key) {
      setStockSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setStockSortKey(key);
      setStockSortOrder('asc');
    }
  };
  const sortedStockPairs = useMemo(() => {
    return sortData(stockPairs, stockSortKey, stockSortOrder);
  }, [stockPairs, stockSortKey, stockSortOrder]);

  // Sorting state for openCSPs (Table 2: Active Cash-Secured Puts)
  const [cspSortKey, setCspSortKey] = useState<string>('symbol');
  const [cspSortOrder, setCspSortOrder] = useState<SortOrder>('asc');
  const requestCspSort = (key: string) => {
    if (cspSortKey === key) {
      setCspSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setCspSortKey(key);
      setCspSortOrder('asc');
    }
  };
  const sortedOpenCSPs = useMemo(() => {
    return sortData(openCSPs, cspSortKey, cspSortOrder);
  }, [openCSPs, cspSortKey, cspSortOrder]);

  // Handler to remove a position
  const handleRemovePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  // Handler to add a position
  const handleAddPosition = () => {
    const newPos: PortfolioPosition = {
      id: `pos-${Date.now()}`,
      symbol: newSymbol.toUpperCase(),
      type: newType,
      quantity: Number(newQuantity),
      spotPrice: Number(newSpot),
      strike: Number(newStrike),
      dte: Number(newDte),
      entryPrice: Number(newEntryPrice),
      currentOptionPrice: Number(newEntryPrice),
      iv: 0.30,
      delta: Number(newDelta),
      theta: 0.05,
      vega: 0.08,
      beta: 1.0,
    };
    setPositions((prev) => [...prev, newPos]);
    setIsAddPositionModalOpen(false);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Compute 20-Delta Covered Call recommendation for the selected modal holding
  const ccRecommendation = useMemo(() => {
    if (!selectedHoldingForCC) return null;
    return calculateSuggestedCoveredCall20Delta(
      selectedHoldingForCC.spotPrice,
      selectedHoldingForCC.ivr30,
      selectedHoldingForCC.ivrRank,
      selectedHoldingForCC.resistance,
      selectedHoldingForCC.costBasis,
      selectedHoldingForCC.symbol,
      selectedHoldingForCC.shares
    );
  }, [selectedHoldingForCC]);

  // Automated Weekly Covered Call Harvest Radar (Uncovered Equity Lots)
  const uncoveredHarvestCandidates = useMemo(() => {
    return stockPairs
      .filter((stk) => stk.uncoveredShares >= 100)
      .map((stk) => {
        const contracts = Math.floor(stk.uncoveredShares / 100);
        const recommendation = calculateSuggestedCoveredCall20Delta(
          stk.currentSpot,
          stk.marketChameleonIvr30 || 35,
          stk.marketChameleonIvrRank || 50,
          stk.resistanceLevel || stk.currentSpot * 1.05,
          stk.costBasis,
          stk.symbol,
          stk.uncoveredShares
        );
        return {
          symbol: stk.symbol,
          companyName: stk.companyName,
          shares: stk.shares,
          uncoveredShares: stk.uncoveredShares,
          contracts,
          spotPrice: stk.currentSpot,
          costBasis: stk.costBasis,
          marketValue: stk.marketValue,
          recommendation,
        };
      });
  }, [stockPairs]);

  const totalHarvestContracts = useMemo(() => {
    return uncoveredHarvestCandidates.reduce((acc, c) => acc + c.contracts, 0);
  }, [uncoveredHarvestCandidates]);

  const totalHarvestDollarIncome = useMemo(() => {
    return uncoveredHarvestCandidates.reduce((acc, c) => acc + c.recommendation.totalDollarIncome, 0);
  }, [uncoveredHarvestCandidates]);

  const safeHarvestCandidates = useMemo(() => {
    return uncoveredHarvestCandidates.filter((c) => !c.recommendation.hasEarningsBlackout);
  }, [uncoveredHarvestCandidates]);

  const safeHarvestDollarIncome = useMemo(() => {
    return safeHarvestCandidates.reduce((acc, c) => acc + c.recommendation.totalDollarIncome, 0);
  }, [safeHarvestCandidates]);

  // 1-Click Action: Batch Stage All Safe Weekly Calls
  const handleBatchStageAllWeeklyCalls = (includeBlackouts: boolean = false) => {
    const targets = includeBlackouts ? uncoveredHarvestCandidates : safeHarvestCandidates;
    if (targets.length === 0) return;

    const newPositions: PortfolioPosition[] = [];

    targets.forEach((c) => {
      const newPos: PortfolioPosition = {
        id: `cc-harvest-${c.symbol}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol: c.symbol,
        type: 'COVERED_CALL',
        quantity: c.contracts,
        spotPrice: c.spotPrice,
        strike: c.recommendation.strike,
        expiration: c.recommendation.expiration,
        dte: c.recommendation.dte,
        entryPrice: c.recommendation.estPremium,
        currentOptionPrice: c.recommendation.estPremium,
        iv: c.recommendation.ivr30 / 100,
        delta: c.recommendation.delta,
        theta: 0.08,
        vega: 0.05,
        beta: 1.0,
        gainDollar: 0,
        gainPct: 0,
      };
      newPositions.push(newPos);

      if (onStageOrder) {
        onStageOrder({
          id: `HARVEST_${c.symbol}_${c.recommendation.strike}C`,
          symbol: c.symbol,
          name: c.symbol,
          strategy: 'COVERED_CALL',
          strategy_name: 'Weekly Covered Call Harvest (20Δ)',
          action: 'SELL_TO_OPEN',
          quantity: c.contracts,
          strike: c.recommendation.strike,
          optionType: 'CALL',
          expiration: c.recommendation.expiration,
          dte: c.recommendation.dte,
          limitPrice: c.recommendation.estPremium,
          premium_total: c.recommendation.totalDollarIncome,
          bid: c.recommendation.estPremium,
          ask: c.recommendation.estPremium,
          mid: c.recommendation.estPremium,
          current_price: c.spotPrice,
          collateral_required: 0,
          tags: ['WEEKLY_CC_HARVEST', '20_DELTA'],
        });
      }
    });

    setPositions((prev) => [...prev, ...newPositions]);
    setToastMessage(`✓ Successfully staged ${targets.length} weekly covered call tranches (${targets.reduce((a, b) => a + b.contracts, 0)} contracts, +$${(includeBlackouts ? totalHarvestDollarIncome : safeHarvestDollarIncome).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} income)!`);
  };

  // Stage single weekly call from Harvest Radar
  const handleStageSingleWeeklyCall = (c: typeof uncoveredHarvestCandidates[0]) => {
    const newPos: PortfolioPosition = {
      id: `cc-harvest-${c.symbol}-${Date.now()}`,
      symbol: c.symbol,
      type: 'COVERED_CALL',
      quantity: c.contracts,
      spotPrice: c.spotPrice,
      strike: c.recommendation.strike,
      expiration: c.recommendation.expiration,
      dte: c.recommendation.dte,
      entryPrice: c.recommendation.estPremium,
      currentOptionPrice: c.recommendation.estPremium,
      iv: c.recommendation.ivr30 / 100,
      delta: c.recommendation.delta,
      theta: 0.08,
      vega: 0.05,
      beta: 1.0,
      gainDollar: 0,
      gainPct: 0,
    };
    setPositions((prev) => [...prev, newPos]);

    if (onStageOrder) {
      onStageOrder({
        id: `HARVEST_${c.symbol}_${c.recommendation.strike}C`,
        symbol: c.symbol,
        name: c.symbol,
        strategy: 'COVERED_CALL',
        strategy_name: 'Weekly Covered Call Harvest (20Δ)',
        action: 'SELL_TO_OPEN',
        quantity: c.contracts,
        strike: c.recommendation.strike,
        optionType: 'CALL',
        expiration: c.recommendation.expiration,
        dte: c.recommendation.dte,
        limitPrice: c.recommendation.estPremium,
        premium_total: c.recommendation.totalDollarIncome,
        bid: c.recommendation.estPremium,
        ask: c.recommendation.estPremium,
        mid: c.recommendation.estPremium,
        current_price: c.spotPrice,
        collateral_required: 0,
        tags: ['WEEKLY_CC_HARVEST', '20_DELTA'],
      });
    }
    setToastMessage(`✓ Staged ${c.contracts}x ${c.symbol} $${c.recommendation.strike} Call (+${c.recommendation.totalDollarIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})`);
  };

  // 80% Profit Handlers: Close (BTC) and Roll to Next Week
  const handleCloseShortCall = (ccId: string | undefined, symbol: string, strike: number, quantity: number, currentPrice: number) => {
    if (onStageOrder) {
      onStageOrder({
        id: `BTC_${symbol}_${strike}C_${Date.now()}`,
        symbol,
        name: symbol,
        strategy: 'COVERED_CALL',
        strategy_name: 'Buy To Close Short Call (80% Profit)',
        action: 'BUY_TO_CLOSE',
        quantity,
        strike,
        optionType: 'CALL',
        limitPrice: currentPrice,
        tags: ['TAKE_PROFIT_80', 'BTC'],
      });
    }
    setPositions((prev) => prev.filter((p) => p.id !== ccId));
    setToastMessage(`✓ Staged BTC order for ${quantity}x ${symbol} $${strike}C @ $${currentPrice.toFixed(2)}. ${quantity * 100} shares now unlocked!`);
  };

  const handleRollShortCall = (ccId: string | undefined, symbol: string, currentStrike: number, quantity: number, currentPrice: number, spotPrice: number, costBasis?: number) => {
    const rec = calculateSuggestedCoveredCall20Delta(spotPrice, 35, 50, spotPrice * 1.05, costBasis, symbol, quantity * 100);
    const netCredit = Math.max(0.01, rec.estPremium - currentPrice);

    if (onStageOrder) {
      onStageOrder({
        id: `ROLL_${symbol}_${currentStrike}to${rec.strike}_${Date.now()}`,
        symbol,
        name: symbol,
        strategy: 'COVERED_CALL',
        strategy_name: 'Weekly Diagonal/Calendar Roll (80% Capture)',
        action: 'ROLL',
        quantity,
        strike: rec.strike,
        oldStrike: currentStrike,
        optionType: 'CALL',
        limitPrice: netCredit,
        expiration: rec.expiration,
        dte: rec.dte,
        notes: `Roll: BTC $${currentStrike} Call @ $${currentPrice.toFixed(2)}, STO next Friday $${rec.strike} Call @ $${rec.estPremium.toFixed(2)} (Net Credit: +$${netCredit.toFixed(2)}/sh)`,
        tags: ['ROLL', 'WEEKLY_HARVEST'],
      });
    }

    setPositions((prev) => {
      const filtered = prev.filter((p) => p.id !== ccId);
      const rolledPos: PortfolioPosition = {
        id: `cc-rolled-${symbol}-${Date.now()}`,
        symbol,
        type: 'COVERED_CALL',
        quantity,
        spotPrice,
        strike: rec.strike,
        expiration: rec.expiration,
        dte: rec.dte,
        entryPrice: rec.estPremium,
        currentOptionPrice: rec.estPremium,
        iv: 0.35,
        delta: rec.delta,
        theta: 0.08,
        vega: 0.05,
        beta: 1.0,
        gainDollar: 0,
        gainPct: 0,
      };
      return [...filtered, rolledPos];
    });

    setToastMessage(`✓ Rolled ${quantity}x ${symbol} $${currentStrike}C into next Friday $${rec.strike}C (+$${(netCredit * quantity * 100).toFixed(0)} Net Credit)!`);
  };

  const handleRollCSP = (cspId: string | undefined, symbol: string, currentStrike: number, quantity: number, currentPrice: number, spotPrice: number) => {
    const nextFriday = getNextWeeklyFriday();
    const newStrike = Math.round(spotPrice * 0.95 * 2) / 2;
    const newEstPrem = Math.round(spotPrice * 0.30 * Math.sqrt(nextFriday.dte / 365) * 0.20 * 100) / 100 || 0.50;
    const netCredit = Math.max(0.01, newEstPrem - currentPrice);

    if (onStageOrder) {
      onStageOrder({
        id: `ROLL_CSP_${symbol}_${currentStrike}to${newStrike}_${Date.now()}`,
        symbol,
        name: symbol,
        strategy: 'CSP',
        strategy_name: 'Weekly CSP Roll (80% Capture)',
        action: 'ROLL',
        quantity,
        strike: newStrike,
        oldStrike: currentStrike,
        optionType: 'PUT',
        limitPrice: netCredit,
        expiration: nextFriday.dateStr,
        dte: nextFriday.dte,
        notes: `Roll CSP: BTC $${currentStrike}P @ $${currentPrice.toFixed(2)}, STO next Friday $${newStrike}P @ $${newEstPrem.toFixed(2)}`,
        tags: ['ROLL', 'CSP'],
      });
    }

    setPositions((prev) => {
      const filtered = prev.filter((p) => p.id !== cspId);
      const rolledPos: PortfolioPosition = {
        id: `csp-rolled-${symbol}-${Date.now()}`,
        symbol,
        type: 'CSP',
        quantity,
        spotPrice,
        strike: newStrike,
        expiration: nextFriday.dateStr,
        dte: nextFriday.dte,
        entryPrice: newEstPrem,
        currentOptionPrice: newEstPrem,
        iv: 0.30,
        delta: -0.20,
        theta: 0.06,
        vega: 0.05,
        beta: 1.0,
        gainDollar: 0,
        gainPct: 0,
      };
      return [...filtered, rolledPos];
    });

    setToastMessage(`✓ Rolled ${quantity}x ${symbol} $${currentStrike}P into next Friday $${newStrike}P (+$${(netCredit * quantity * 100).toFixed(0)} Net Credit)!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Holdings, Covered Calls &amp; Cash-Secured Puts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step 4 &amp; 5 Ledger
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  Living Trust-Options ...609
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real account audit: 7 long equity holdings, 7 covered call tranches (with 80% profit close triggers on BLZE &amp; TSLA), and 2 open CSPs (PANW &amp; PLTR).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setViewMode(viewMode === 'LEDGER' ? 'ADVANCED_BUY_WRITE' : 'LEDGER')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              viewMode === 'ADVANCED_BUY_WRITE'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{viewMode === 'ADVANCED_BUY_WRITE' ? '📋 Positions Ledger' : '⚡ Advanced Buy-Write Module'}</span>
          </button>

          <button
            onClick={() => {
              const fresh = getSamplePortfolioBook();
              setPositions(fresh);
              localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(fresh));
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset positions to Living Trust-Options ...609 Schwab ground truth"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset to Living Trust Account</span>
          </button>

          <button
            onClick={() => setIsAddPositionModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      {viewMode === 'ADVANCED_BUY_WRITE' ? (
        <PortfolioOverlayScanner
          initialPosition={seedPosition}
          onStageOrder={onStageOrder}
        />
      ) : (
        <>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Long Stock Equity</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            ${totalStockEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            {stockPairs.length} Stock Positions
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Active CC Premiums</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            ${totalActiveCcIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-500/80 font-mono mt-0.5 block">
            Buffered Against Stock Cost
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Open CSP Collateral</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            ${totalCspCollateral.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            {openCSPs.length} Open Put Contracts
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Uncovered Shares (&ge;100)</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${
              stockPairs.some((p) => p.uncoveredShares >= 100) ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {stockPairs.reduce((acc, p) => acc + p.uncoveredShares, 0)}
            </span>
            {stockPairs.some((p) => p.uncoveredShares >= 100) && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                Action Needed
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            Eligible for 20&Delta; Weekly Harvest
          </span>
        </div>
      </div>

      {/* WEEKLY COVERED CALL HARVEST RADAR (Uncovered Equity Lots) */}
      {uncoveredHarvestCandidates.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Zap className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white tracking-tight">
                      Weekly Covered Call Harvest Radar (20&Delta;)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      {uncoveredHarvestCandidates.length} Positions Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Targeting upcoming Friday weekly expiration ({getNextWeeklyFriday().dateStr}, {getNextWeeklyFriday().dte} DTE). Generates systematic income on uncovered share blocks while defending cost-basis and avoiding earnings blackouts.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right pr-2">
                <span className="text-[10px] text-slate-400 font-mono block uppercase">Total Weekly Income</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  +${safeHarvestDollarIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleBatchStageAllWeeklyCalls(false)}
                disabled={safeHarvestCandidates.length === 0}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center space-x-2 cursor-pointer ${
                  safeHarvestCandidates.length > 0
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
                title="Stage all recommended 20 Delta weekly covered calls that are cleared of earnings collisions into Step 7 Workbench"
              >
                <Zap className="w-4 h-4" />
                <span>
                  Stage All {safeHarvestCandidates.reduce((a, b) => a + b.contracts, 0)} Safe Weekly Calls (+${safeHarvestDollarIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
                </span>
              </button>
            </div>
          </div>

          {/* Harvest Opportunities Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/80">
                  <th className="py-2.5 px-3">Underlying</th>
                  <th className="py-2.5 px-3">Uncovered Lot</th>
                  <th className="py-2.5 px-3">Target Contract</th>
                  <th className="py-2.5 px-3">Est. Bid/Mid</th>
                  <th className="py-2.5 px-3">Weekly Intake</th>
                  <th className="py-2.5 px-3">Annualized APR</th>
                  <th className="py-2.5 px-3">Audit &amp; Risk Guardrails</th>
                  <th className="py-2.5 px-3 text-right">Harvest Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {uncoveredHarvestCandidates.map((c) => {
                  const rec = c.recommendation;
                  const isBlockedByEarnings = rec.hasEarningsBlackout;

                  return (
                    <tr key={c.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-sm">{c.symbol}</div>
                        <div className="text-[11px] text-slate-400 font-sans">{c.companyName || c.symbol}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-amber-300">{c.uncoveredShares.toLocaleString()} shs</div>
                        <div className="text-[10px] text-slate-400 font-sans">{c.contracts} contract{c.contracts > 1 ? 's' : ''}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-emerald-300 text-sm">
                          ${rec.strike.toFixed(2)} Call
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-sans">
                          <span>{rec.expiration} ({rec.dte}d)</span>
                          <span>•</span>
                          <span className="text-cyan-300 font-mono">{rec.delta}&Delta;</span>
                          <span>•</span>
                          <span className="text-slate-300">+{(((rec.strike - c.spotPrice) / c.spotPrice) * 100).toFixed(1)}% OTM</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200">${rec.estPremium.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 block font-sans">per share</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-400 text-sm">
                          +${rec.totalDollarIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {rec.weeklyYield.toFixed(2)}% weekly yield
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-300">{rec.annualizedYield.toFixed(1)}%</span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {rec.downsideCushion.toFixed(1)}% cushion
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1 text-[11px] font-sans">
                          {rec.isBelowCostBasis ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold" title={`Strike $${rec.strike} is lower than position cost basis $${c.costBasis.toFixed(2)}`}>
                              ⚠️ Strike &lt; Cost Basis (${c.costBasis.toFixed(2)})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🛡️ Clears Cost Basis (${c.costBasis.toFixed(2)})
                            </span>
                          )}

                          {isBlockedByEarnings ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold block" title={rec.earningsTimingDescription}>
                              ⚠️ Earnings on {rec.earningsDate} (Gap Risk)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-400 block">
                              📅 Earnings Cleared
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStageSingleWeeklyCall(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1 ${
                              isBlockedByEarnings
                                ? 'bg-amber-600/80 hover:bg-amber-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            }`}
                            title={isBlockedByEarnings ? 'Override earnings blackout and stage order' : 'Stage weekly covered call order'}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isBlockedByEarnings ? 'Stage (Override)' : 'Stage Call'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 1: Long Stocks & Linked Covered Calls */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Long Stock Holdings &amp; Linked Covered Calls
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies covered vs. uncovered lots. Writing weekly calls on uncovered blocks generates consistent income.
            </p>
          </div>
        </div>

        {stockPairs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-mono">
            No long stock positions recorded. Click "Add Position" above to add your equity holdings.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px] 2xl:max-h-[650px] overflow-y-auto relative table-scroll-container">
            <table className="w-full text-left text-xs border-collapse table-sticky-header">
              <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <SortableTh label="Symbol" sortKey="symbol" currentSortKey={stockSortKey} currentSortOrder={stockSortOrder} onSort={requestStockSort} />
                  <SortableTh label="Shares" sortKey="shares" currentSortKey={stockSortKey} currentSortOrder={stockSortOrder} onSort={requestStockSort} />
                  <SortableTh label="Cost Basis" sortKey="costBasis" currentSortKey={stockSortKey} currentSortOrder={stockSortOrder} onSort={requestStockSort} />
                  <SortableTh label="Mkt Price" sortKey="currentSpot" currentSortKey={stockSortKey} currentSortOrder={stockSortOrder} onSort={requestStockSort} />
                  <SortableTh label="Market Value" sortKey="marketValue" currentSortKey={stockSortKey} currentSortOrder={stockSortOrder} onSort={requestStockSort} />
                  <SortableTh label="Unrealized P&L" sortKey="unrealizedPnl" currentSortKey={stockSortKey} currentSortOrder={stockSortOrder} onSort={requestStockSort} />
                  <th className="sticky top-0 z-10 bg-slate-900/98 backdrop-blur py-2.5 px-3 border-b border-slate-800">Active Covered Call</th>
                  <SortableTh label="Uncovered Status" sortKey="uncoveredShares" currentSortKey={stockSortKey} currentSortOrder={stockSortOrder} onSort={requestStockSort} />
                  <th className="sticky top-0 z-10 bg-slate-900/98 backdrop-blur py-2.5 px-3 text-right border-b border-slate-800">Harvest Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedStockPairs.map((stk) => {
                  const marketVal = stk.shares * stk.currentSpot;
                  const totalCost = stk.shares * stk.costBasis;
                  const pnlDollar = marketVal - totalCost;
                  const pnlPct = totalCost > 0 ? (pnlDollar / totalCost) * 100 : 0;
                  const isUncovered = stk.uncoveredShares >= 100;

                  return (
                    <tr key={stk.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-white text-sm">
                        {stk.symbol}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        {stk.shares} shs
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        ${stk.costBasis.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        ${stk.currentSpot.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-bold">
                        ${marketVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${pnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pnlDollar >= 0 ? '+' : ''}${pnlDollar.toFixed(2)} ({pnlPct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {stk.activeCoveredCalls && stk.activeCoveredCalls.length > 0 ? (
                          <div className="space-y-1.5 text-[11px]">
                            {stk.activeCoveredCalls.map((cc, idx) => {
                              const is80PctProfit =
                                (cc.gainPct !== undefined && cc.gainPct >= 80) ||
                                (cc.pnlPercent !== undefined && cc.pnlPercent >= 80);
                              return (
                                <div
                                  key={cc.id || idx}
                                  className="p-1.5 rounded bg-slate-900/90 border border-slate-800 space-y-0.5"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                                      <span>{cc.quantity ? `-${cc.quantity}x` : ''} ${cc.strike} C</span>
                                      {cc.expiration && (
                                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                                          {cc.expiration}
                                        </span>
                                      )}
                                      <span className="text-slate-500 font-normal">({cc.dte}d)</span>
                                    </div>
                                    {is80PctProfit && (
                                      <div className="flex items-center gap-1">
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                                          🎯 80%
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleCloseShortCall(cc.id, stk.symbol, cc.strike, cc.quantity || 1, cc.currentPrice)}
                                          className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 transition-colors cursor-pointer"
                                          title="Buy to close short call to lock in 80%+ profit and unlock shares"
                                        >
                                          Close (BTC)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRollShortCall(cc.id, stk.symbol, cc.strike, cc.quantity || 1, cc.currentPrice, stk.currentSpot, stk.costBasis)}
                                          className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 transition-colors cursor-pointer"
                                          title="Roll into next week's 20Δ call for net credit"
                                        >
                                          Roll &rarr;
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-slate-400 flex items-center justify-between text-[10px]">
                                    <span>
                                      Prem: ${cc.premiumCollected.toFixed(2)} &rarr; Mark: ${cc.currentPrice.toFixed(2)}
                                    </span>
                                    <span
                                      className={`font-bold ${
                                        (cc.gainPct ?? cc.pnlPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {cc.gainDollar !== undefined
                                        ? cc.gainDollar >= 0
                                          ? `+$${cc.gainDollar.toFixed(0)}`
                                          : `-$${Math.abs(cc.gainDollar).toFixed(0)}`
                                        : ''}{' '}
                                      ({(cc.gainPct ?? cc.pnlPercent ?? 0) >= 0 ? '+' : ''}
                                      {(cc.gainPct ?? cc.pnlPercent ?? 0).toFixed(1)}%)
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : stk.activeCoveredCall ? (
                          <div className="space-y-0.5 text-[11px]">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                              <span>${stk.activeCoveredCall.strike} C</span>
                              <span className="text-slate-500 font-normal">({stk.activeCoveredCall.dte} DTE)</span>
                              <span className="text-slate-400 font-normal">{stk.activeCoveredCall.delta}&Delta;</span>
                            </div>
                            <div className="text-slate-400">
                              Prem: ${stk.activeCoveredCall.premiumCollected.toFixed(2)} | Current: ${stk.activeCoveredCall.currentPrice.toFixed(2)}
                              <span className={`ml-1 font-bold ${(stk.activeCoveredCall.pnlPercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ({(stk.activeCoveredCall.pnlPercent || 0).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No active call</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isUncovered ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⚠️ {stk.uncoveredShares} Uncovered
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ Fully Covered
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isUncovered ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSeedPosition({
                                  ticker: stk.symbol,
                                  quantity: stk.uncoveredShares,
                                  costBasis: stk.costBasis,
                                });
                                setViewMode('ADVANCED_BUY_WRITE');
                              }}
                              className="px-2 py-1.5 rounded-lg text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition-all flex items-center gap-1 cursor-pointer"
                              title="Launch Optopsy Delta & Risk Screener for this holding"
                            >
                              <Zap className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Optopsy Scan</span>
                            </button>
                            <button
                              onClick={() =>
                                setSelectedHoldingForCC({
                                  symbol: stk.symbol,
                                  shares: stk.uncoveredShares,
                                  spotPrice: stk.currentSpot,
                                  costBasis: stk.costBasis,
                                  ivr30: stk.marketChameleonIvr30 || 35,
                                  ivrRank: stk.marketChameleonIvrRank || 50,
                                  resistance: stk.resistanceLevel || stk.currentSpot * 1.05,
                                })
                              }
                              className="px-2 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                              <span>20&Delta;</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSeedPosition({
                                ticker: stk.symbol,
                                quantity: stk.shares,
                                costBasis: stk.costBasis,
                              });
                              setViewMode('ADVANCED_BUY_WRITE');
                            }}
                            className="px-2 py-1 rounded text-[11px] font-mono text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            Scan Payoffs &rarr;
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Open Put Positions (CSPs) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Open Cash-Secured Put Positions (CSPs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks committed collateral. Alerts when profit exceeds 80% (buy to close trigger) or when tested ITM near expiration.
            </p>
          </div>
        </div>

        {openCSPs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs font-mono">
            No open cash-secured puts. You have full buying power available.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px] 2xl:max-h-[650px] overflow-y-auto relative table-scroll-container">
            <table className="w-full text-left text-xs border-collapse table-sticky-header">
              <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <SortableTh label="Symbol" sortKey="symbol" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="Contracts" sortKey="quantity" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="Strike" sortKey="strike" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="Mkt Price" sortKey="spotPrice" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="DTE" sortKey="dte" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="Delta" sortKey="delta" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="Entry Prem" sortKey="entryPrice" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="Current" sortKey="currentOptionPrice" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="P&L (%)" sortKey="gainPercent" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <SortableTh label="Committed Collateral" sortKey="collateral" currentSortKey={cspSortKey} currentSortOrder={cspSortOrder} onSort={requestCspSort} />
                  <th className="sticky top-0 z-10 bg-slate-900/98 backdrop-blur py-2.5 px-3 border-b border-slate-800">Trigger / Status</th>
                  <th className="sticky top-0 z-10 bg-slate-900/98 backdrop-blur py-2.5 px-3 text-right border-b border-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedOpenCSPs.map((pos) => {
                  const collateral = pos.strike * pos.quantity * 100;
                  const expStatus = getOptionExpirationStatus(pos.expiration, pos.dte);
                  const pnlDollar =
                    pos.gainDollar !== undefined
                      ? pos.gainDollar
                      : (pos.entryPrice - pos.currentOptionPrice) * pos.quantity * 100;
                  const pnlPct =
                    pos.gainPct !== undefined
                      ? pos.gainPct
                      : pos.entryPrice > 0
                      ? ((pos.entryPrice - pos.currentOptionPrice) / pos.entryPrice) * 100
                      : 0;
                  const isTested = pos.spotPrice <= pos.strike;
                  const is80PctProfit = pnlPct >= 80;

                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-white text-sm">
                        {pos.symbol}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        {pos.quantity}x Put
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-bold">
                        ${pos.strike.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        ${pos.spotPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          expStatus.isExpired
                            ? 'bg-slate-800 text-slate-400'
                            : expStatus.dte <= 7
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-slate-300'
                        }`}>
                          {expStatus.shortLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {pos.delta}&Delta;
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        ${pos.entryPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-bold">
                        ${pos.currentOptionPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${pnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pnlDollar >= 0 ? '+' : ''}${pnlDollar.toFixed(0)} ({pnlPct.toFixed(0)}%)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-bold">
                        ${collateral.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        {expStatus.isExpired ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            pos.spotPrice >= pos.strike
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}>
                            {pos.spotPrice >= pos.strike ? 'Expired Worthless (100%)' : 'Expired / Assigned'}
                          </span>
                        ) : is80PctProfit ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            🎯 80% Capture! Close
                          </span>
                        ) : isTested ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ⚠️ In The Money
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                            Safe OTM
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {is80PctProfit && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onStageOrder) {
                                    onStageOrder({
                                      symbol: pos.symbol,
                                      action: 'BUY_TO_CLOSE',
                                      quantity: pos.quantity,
                                      strike: pos.strike,
                                      optionType: 'PUT',
                                      limitPrice: pos.currentOptionPrice,
                                    });
                                  }
                                  setPositions((prev) => prev.filter((p) => p.id !== pos.id));
                                  setToastMessage(`✓ Staged BTC order for ${pos.quantity}x ${pos.symbol} $${pos.strike} Put @ $${pos.currentOptionPrice.toFixed(2)}. Cash collateral released!`);
                                }}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow transition-all cursor-pointer"
                                title="Buy to close put and release collateral"
                              >
                                Close (BTC)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRollCSP(pos.id, pos.symbol, pos.strike, pos.quantity, pos.currentOptionPrice, pos.spotPrice)}
                                className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold shadow transition-all cursor-pointer"
                                title="Roll into next week's CSP"
                              >
                                Roll &rarr;
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => handleRemovePosition(pos.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove position"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* MODAL: 20-Delta Covered Call Suggester */}
      {selectedHoldingForCC && ccRecommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    20&Delta; Covered Call Recommendation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Calculated for {selectedHoldingForCC.shares} uncovered shares of {selectedHoldingForCC.symbol}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHoldingForCC(null)}
                className="text-slate-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Input Attributes */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <div>
                <span className="text-slate-400 block">Mkt Price</span>
                <span className="text-white font-bold font-mono text-sm">${selectedHoldingForCC.spotPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">30-Day IVR / Rank</span>
                <span className="text-white font-bold font-mono text-sm">{selectedHoldingForCC.ivr30}% / {selectedHoldingForCC.ivrRank}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">Key Resistance</span>
                <span className="text-amber-400 font-bold font-mono text-sm">${selectedHoldingForCC.resistance.toFixed(2)}</span>
              </div>
            </div>

            {/* Strategy Output Card */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Target Contract</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold">
                  {ccRecommendation.dte} DTE Weekly
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white font-mono">
                  ${ccRecommendation.strike.toFixed(2)} Call
                </span>
                <span className="text-slate-400 font-mono text-sm">
                  ({ccRecommendation.delta}&Delta;)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block">Est. Premium Intake</span>
                  <span className="text-emerald-400 font-bold font-mono text-base">
                    ${ccRecommendation.estPremium.toFixed(2)} / share (${(ccRecommendation.estPremium * (selectedHoldingForCC.shares)).toFixed(0)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Annualized Yield</span>
                  <span className="text-emerald-300 font-bold font-mono text-base">
                    {ccRecommendation.annualizedYield.toFixed(1)}% APR
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/80 text-slate-300 text-xs leading-relaxed border border-slate-700/50">
                <span className="font-bold text-emerald-400">Execution Rationale: </span>
                {ccRecommendation.technicalJustification}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedHoldingForCC(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const contracts = Math.floor(selectedHoldingForCC.shares / 100);
                  const newCcPos: PortfolioPosition = {
                    id: `cc-${Date.now()}`,
                    symbol: selectedHoldingForCC.symbol,
                    type: 'COVERED_CALL',
                    quantity: contracts,
                    spotPrice: selectedHoldingForCC.spotPrice,
                    strike: ccRecommendation.strike,
                    dte: ccRecommendation.dte,
                    entryPrice: ccRecommendation.estPremium,
                    currentOptionPrice: ccRecommendation.estPremium,
                    iv: selectedHoldingForCC.ivr30 / 100,
                    delta: ccRecommendation.delta,
                    theta: 0.08,
                    vega: 0.05,
                    beta: 1.0,
                  };
                  setPositions((prev) => [...prev, newCcPos]);
                  if (onStageOrder) {
                    onStageOrder({
                      symbol: selectedHoldingForCC.symbol,
                      action: 'SELL_TO_OPEN',
                      quantity: contracts,
                      strike: ccRecommendation.strike,
                      optionType: 'CALL',
                      limitPrice: ccRecommendation.estPremium,
                    });
                  }
                  setSelectedHoldingForCC(null);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Adopt &amp; Stage {Math.floor(selectedHoldingForCC.shares / 100)}x Call Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Position */}
      {isAddPositionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Position</h3>
              <button
                onClick={() => setIsAddPositionModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Symbol</label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold"
                  placeholder="e.g. AAPL"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Position Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PositionType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="STOCK">Stock (Long)</option>
                    <option value="CSP">Cash-Secured Put (CSP)</option>
                    <option value="COVERED_CALL">Covered Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    {newType === 'STOCK' ? 'Shares Quantity' : 'Option Contracts'}
                  </label>
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Spot / Current Price ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSpot}
                    onChange={(e) => setNewSpot(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    {newType === 'STOCK' ? 'Cost Basis ($)' : 'Option Strike ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newType === 'STOCK' ? newSpot : newStrike}
                    onChange={(e) => setNewStrike(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              {newType !== 'STOCK' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">DTE (Days)</label>
                    <input
                      type="number"
                      value={newDte}
                      onChange={(e) => setNewDte(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Premium ($)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={newEntryPrice}
                      onChange={(e) => setNewEntryPrice(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Delta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newDelta}
                      onChange={(e) => setNewDelta(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddPositionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPosition}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all cursor-pointer"
              >
                Add Position
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur flex items-center space-x-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
