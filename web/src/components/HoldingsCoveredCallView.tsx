import React, { useState, useMemo, useEffect } from 'react';
import {
  PortfolioPosition,
  PositionType,
  getSamplePortfolioBook,
} from '../utils/portfolioStressTest';
import {
  calculateSuggestedCoveredCall20Delta,
  getStoredCapitalState,
  saveCapitalState,
} from '../utils/capitalAndTaxLedger';
import { StockHoldingPair } from '../types/options';
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

      // Find any linked covered call for this symbol
      const linkedCc = coveredCalls.find((cc) => cc.symbol.toUpperCase() === stk.symbol.toUpperCase());
      const ccContracts = linkedCc ? linkedCc.quantity : 0;
      const coveredShares = ccContracts * 100;
      const uncoveredShares = Math.max(0, stk.quantity - coveredShares);

      let activeCc;
      if (linkedCc) {
        const pnlPct = linkedCc.entryPrice > 0
          ? ((linkedCc.entryPrice - linkedCc.currentOptionPrice) / linkedCc.entryPrice) * 100
          : 0;
        const totalPremium = linkedCc.entryPrice * linkedCc.quantity * 100;
        totalCcPrem += totalPremium;

        activeCc = {
          strike: linkedCc.strike,
          dte: linkedCc.dte,
          delta: linkedCc.delta,
          premiumCollected: linkedCc.entryPrice,
          currentPrice: linkedCc.currentOptionPrice,
          pnlPercent: pnlPct,
        };
      }

      // Default mock IVR and resistance for intelligence
      const ivr30 = 32 + (stk.symbol.charCodeAt(0) % 25);
      const ivrRank = 40 + (stk.symbol.charCodeAt(1) % 45);
      const resistanceLevel = Math.round(stk.spotPrice * 1.05 * 100) / 100;

      return {
        symbol: stk.symbol,
        shares: stk.quantity,
        costBasis: stk.entryPrice,
        currentSpot: stk.spotPrice,
        uncoveredShares,
        activeCoveredCall: activeCc,
        marketChameleonIvr30: ivr30,
        marketChameleonIvrRank: ivrRank,
        resistanceLevel,
      };
    });

    csps.forEach((p) => {
      totalCspCash += p.strike * p.quantity * 100;
    });

    return {
      stockPairs: pairs,
      openCSPs: csps,
      totalStockEquity: totalEquity,
      totalCspCollateral: totalCspCash,
      totalActiveCcIncome: totalCcPrem,
    };
  }, [positions]);

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

  // Compute 20-Delta Covered Call recommendation for the selected holding
  const ccRecommendation = useMemo(() => {
    if (!selectedHoldingForCC) return null;
    return calculateSuggestedCoveredCall20Delta(
      selectedHoldingForCC.spotPrice,
      selectedHoldingForCC.ivr30,
      selectedHoldingForCC.ivrRank,
      selectedHoldingForCC.resistance
    );
  }, [selectedHoldingForCC]);

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
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Holdings, Covered Calls &amp; Cash-Secured Puts
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step 4 &amp; 5 Ledger
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit long stocks, identify uncovered lots (&ge;100 shares), generate 20&Delta; covered calls, and monitor open CSP collateral.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddPositionModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Shares</th>
                  <th className="py-2.5 px-3">Cost Basis</th>
                  <th className="py-2.5 px-3">Spot Price</th>
                  <th className="py-2.5 px-3">Market Value</th>
                  <th className="py-2.5 px-3">Unrealized P&amp;L</th>
                  <th className="py-2.5 px-3">Active Covered Call</th>
                  <th className="py-2.5 px-3">Uncovered Status</th>
                  <th className="py-2.5 px-3 text-right">Harvest Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stockPairs.map((stk) => {
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
                        {stk.activeCoveredCall ? (
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
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                            <span>20&Delta; Suggestion</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Optimal</span>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Contracts</th>
                  <th className="py-2.5 px-3">Strike</th>
                  <th className="py-2.5 px-3">Spot Price</th>
                  <th className="py-2.5 px-3">DTE</th>
                  <th className="py-2.5 px-3">Delta</th>
                  <th className="py-2.5 px-3">Entry Prem</th>
                  <th className="py-2.5 px-3">Current</th>
                  <th className="py-2.5 px-3">P&amp;L (%)</th>
                  <th className="py-2.5 px-3">Committed Collateral</th>
                  <th className="py-2.5 px-3">Trigger / Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {openCSPs.map((pos) => {
                  const collateral = pos.strike * pos.quantity * 100;
                  const pnlDollar = (pos.entryPrice - pos.currentOptionPrice) * pos.quantity * 100;
                  const pnlPct = pos.entryPrice > 0
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
                          pos.dte <= 7 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300'
                        }`}>
                          {pos.dte}d
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
                        {is80PctProfit ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            🎯 80% Capture! Close
                          </span>
                        ) : isTested ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ⚠️ In The Money
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            ✓ On Track (OTM)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {is80PctProfit && (
                            <button
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
                              }}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow transition-all cursor-pointer"
                            >
                              BTC
                            </button>
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
                <span className="text-slate-400 block">Spot Price</span>
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
    </div>
  );
};
