import React, { useState, useMemo, useEffect } from 'react';
import {
  PortfolioPosition,
  PositionType,
  getSamplePortfolioBook,
  runPortfolioStressTest,
  generatePnlStressMatrix,
} from '../utils/portfolioStressTest';
import {
  Sliders,
  TrendingUp,
  ShieldCheck,
  Zap,
  DollarSign,
  Activity,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
} from './icons';

export const PortfolioMarginSimulatorView: React.FC = () => {
  const [positions, setPositions] = useState<PortfolioPosition[]>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_portfolio_book');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return getSamplePortfolioBook();
  });

  // Shock parameters
  const [priceShockPct, setPriceShockPct] = useState<number>(0);
  const [ivShockPct, setIvShockPct] = useState<number>(0);
  const [daysPassed, setDaysPassed] = useState<number>(0);

  // Add Position Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newSymbol, setNewSymbol] = useState<string>('SPY');
  const [newType, setNewType] = useState<PositionType>('CSP');
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newSpot, setNewSpot] = useState<number>(550);
  const [newStrike, setNewStrike] = useState<number>(535);
  const [newStrike2, setNewStrike2] = useState<number>(520);
  const [newDte, setNewDte] = useState<number>(30);
  const [newEntryPrice, setNewEntryPrice] = useState<number>(3.50);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(positions));
    } catch (e) {
      console.warn('Failed to save portfolio positions:', e);
    }
  }, [positions]);

  // Run stress calculation
  const stressResult = useMemo(() => {
    return runPortfolioStressTest(positions, priceShockPct, ivShockPct, daysPassed);
  }, [positions, priceShockPct, ivShockPct, daysPassed]);

  // Generate 2D Stress Matrix
  const pnlMatrix = useMemo(() => {
    return generatePnlStressMatrix(positions, daysPassed);
  }, [positions, daysPassed]);

  const handleResetSliders = () => {
    setPriceShockPct(0);
    setIvShockPct(0);
    setDaysPassed(0);
  };

  const handleLoadSampleBook = () => {
    setPositions(getSamplePortfolioBook());
  };

  const handleClearBook = () => {
    if (window.confirm('Are you sure you want to clear all portfolio positions?')) {
      setPositions([]);
    }
  };

  const handleDeletePosition = (id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddPositionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPos: PortfolioPosition = {
      id: `POS_${newSymbol}_${Date.now().toString().slice(-4)}`,
      symbol: newSymbol.toUpperCase().trim(),
      type: newType,
      quantity: Number(newQuantity),
      spotPrice: Number(newSpot),
      strike: Number(newStrike),
      strike2: newType === 'CREDIT_SPREAD' || newType === 'PMCC' ? Number(newStrike2) : undefined,
      dte: Number(newDte),
      entryPrice: Number(newEntryPrice),
      currentOptionPrice: Number(newEntryPrice),
      iv: 25,
      delta: newType === 'STOCK' ? 1.0 : newType === 'CSP' ? -0.20 : 0.25,
      theta: 0.15,
      vega: -0.15,
      beta: 1.0,
    };

    setPositions((prev) => [newPos, ...prev]);
    setIsAddModalOpen(false);
  };

  const priceShocksHeader = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
  const ivShocksRows = [-30, 0, 25, 50, 100];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Portfolio Margin &amp; "What-If" Stress Test Simulator
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  TIMS Risk Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Simulate portfolio P&amp;L under multi-factor market shocks (Price &plusmn;20%, Volatility spikes +100%, Time decay). Compares standard <strong>Reg-T Margin</strong> vs risk-based <strong>Portfolio Margin (PM)</strong> to reveal liberated buying power.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleLoadSampleBook}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Sample Book</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Position</span>
            </button>

            {positions.length > 0 && (
              <button
                onClick={handleClearBook}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                title="Clear all positions"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* KPI Stress Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Projected PnL */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Projected P&amp;L</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${
              stressResult.projectedPnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stressResult.projectedPnlDollar >= 0 ? '+' : ''}${stressResult.projectedPnlDollar.toLocaleString()}
            </div>
            <span className={`text-[10px] font-mono ${
              stressResult.projectedPnlDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stressResult.projectedPnlPct >= 0 ? '+' : ''}{stressResult.projectedPnlPct.toFixed(1)}% Return
            </span>
          </div>

          {/* SPY Beta-Weighted Delta */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Beta-Weighted \Delta (SPY)</span>
            <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
              {stressResult.totalBetaDelta > 0 ? '+' : ''}{stressResult.totalBetaDelta} \Delta
            </div>
            <span className="text-[10px] text-slate-500">
              Directional bias vs SPY
            </span>
          </div>

          {/* Daily Theta Cash Flow */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Daily Theta Income</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              +${stressResult.totalDailyTheta.toFixed(2)}/day
            </div>
            <span className="text-[10px] text-slate-500">
              ~${(stressResult.totalDailyTheta * 30).toFixed(0)} / mo decay
            </span>
          </div>

          {/* Reg-T Margin */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Reg-T Margin</span>
            <div className="text-base font-bold font-mono text-slate-300 mt-0.5">
              ${stressResult.regTMargin.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Standard broker margin</span>
          </div>

          {/* Portfolio Margin */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30">
            <span className="text-[10px] text-indigo-400 uppercase font-mono block">Portfolio Margin (PM)</span>
            <div className="text-base font-bold font-mono text-indigo-300 mt-0.5">
              ${stressResult.portfolioMargin.toLocaleString()}
            </div>
            <span className="text-[10px] text-indigo-400 font-bold">TIMS Stress Haircut</span>
          </div>

          {/* Capital Relief */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
            <span className="text-[10px] text-emerald-400 uppercase font-mono block">Capital Relief</span>
            <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
              {stressResult.capitalReliefPct.toFixed(1)}% Saved
            </div>
            <span className="text-[10px] text-emerald-400">
              +${(stressResult.regTMargin - stressResult.portfolioMargin).toLocaleString()} free cash
            </span>
          </div>
        </div>
      </div>

      {/* "What-If" Market Shock Sliders */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Interactive "What-If" Market Scenario Sliders</span>
          </div>
          <button
            onClick={handleResetSliders}
            className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Reset to Baseline (0%)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider 1: Underlying Price Shock */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Underlying Price Shock:</span>
              <span className={`font-mono font-bold ${
                priceShockPct > 0 ? 'text-emerald-400' : priceShockPct < 0 ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {priceShockPct > 0 ? '+' : ''}{priceShockPct}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={priceShockPct}
              onChange={(e) => setPriceShockPct(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-20% Crash</span>
              <span>Baseline (0%)</span>
              <span>+20% Rally</span>
            </div>
          </div>

          {/* Slider 2: Volatility Shock */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Implied Volatility Shift (\Delta IV):</span>
              <span className={`font-mono font-bold ${
                ivShockPct > 0 ? 'text-rose-400' : ivShockPct < 0 ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {ivShockPct > 0 ? '+' : ''}{ivShockPct}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="100"
              step="5"
              value={ivShockPct}
              onChange={(e) => setIvShockPct(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-30% IV Crush</span>
              <span>Unchanged (0%)</span>
              <span>+100% VIX Spike</span>
            </div>
          </div>

          {/* Slider 3: Days Passed */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Time Decay (\Delta Days):</span>
              <span className="font-mono font-bold text-cyan-400">
                +{daysPassed} Days Passed
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={daysPassed}
              onChange={(e) => setDaysPassed(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Today (0d)</span>
              <span>+14 Days</span>
              <span>+30 Days (Expiry)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2D P&L Stress Heatmap Matrix */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Portfolio P&amp;L Stress Heatmap Matrix (Price Shock vs IV Surge)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {daysPassed > 0 ? `Calculated with +${daysPassed}d Time Decay` : 'Immediate T+0 Shock Matrix'}
          </span>
        </div>

        <div className="overflow-x-auto p-3">
          <table className="w-full text-center border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="py-2 px-3 text-left font-bold text-slate-300">IV Shock</th>
                {priceShocksHeader.map((p) => (
                  <th key={p} className="py-2 px-2 font-bold">
                    {p > 0 ? `+${p}%` : `${p}%`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {ivShocksRows.map((iv) => (
                <tr key={iv} className="hover:bg-slate-900/30">
                  <td className="py-2.5 px-3 text-left font-bold text-purple-300 bg-slate-950/60">
                    {iv > 0 ? `+${iv}% IV` : `${iv}% IV`}
                  </td>
                  {priceShocksHeader.map((p) => {
                    const cell = pnlMatrix.find((c) => c.priceShockPct === p && c.ivShockPct === iv);
                    const pnl = cell ? cell.pnlDollar : 0;
                    const isPositive = pnl >= 0;
                    const intensity = Math.min(0.9, Math.abs(pnl) / 5000);

                    return (
                      <td
                        key={p}
                        className={`py-2 px-2 transition-all font-semibold ${
                          isPositive
                            ? 'text-emerald-300 bg-emerald-950/20'
                            : 'text-rose-300 bg-rose-950/20'
                        }`}
                      >
                        {isPositive ? '+' : ''}${pnl.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Positions Ledger */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Active Derivatives Position Ledger ({positions.length} Open Positions)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Auto-persisted in local browser storage
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <p className="font-semibold text-slate-300">Position Ledger Empty</p>
            <p className="text-[11px] text-slate-500">
              Click <strong>"Load Sample Book"</strong> above or <strong>"Add Position"</strong> to simulate your real or candidate positions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase font-mono">
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Spot Price</th>
                  <th className="py-2.5 px-3 text-right">Strike(s)</th>
                  <th className="py-2.5 px-3 text-right">DTE</th>
                  <th className="py-2.5 px-3 text-right">Entry Price</th>
                  <th className="py-2.5 px-3 text-right">Beta \Delta</th>
                  <th className="py-2.5 px-3 text-right">Daily \Theta</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {positions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      {p.symbol}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.type === 'STOCK'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : p.type === 'CSP'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : p.type === 'COVERED_CALL'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : p.type === 'PMCC'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {p.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-200">
                      {p.quantity} {p.type === 'STOCK' ? 'sh' : 'ct'}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-300">
                      ${p.spotPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right text-white font-bold">
                      {p.strike > 0 ? `$${p.strike}` : '—'}
                      {p.strike2 ? ` / $${p.strike2}` : ''}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-400">
                      {p.dte > 0 ? `${p.dte}d` : '—'}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-200">
                      ${p.entryPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-cyan-400">
                      {p.delta.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      +${p.theta.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeletePosition(p.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Position Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Custom Position to Simulator</span>
            </h3>

            <form onSubmit={handleAddPositionSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Symbol:</label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Position Type:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PositionType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono cursor-pointer"
                  >
                    <option value="CSP">Cash-Secured Put</option>
                    <option value="COVERED_CALL">Covered Call</option>
                    <option value="CREDIT_SPREAD">Bull Put Spread</option>
                    <option value="PMCC">Poor Man’s Covered Call</option>
                    <option value="STOCK">Stock (Long Shares)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity (contracts/shares):</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Current Spot Price ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSpot}
                    onChange={(e) => setNewSpot(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              {newType !== 'STOCK' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Short / Primary Strike ($):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newStrike}
                      onChange={(e) => setNewStrike(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  {(newType === 'CREDIT_SPREAD' || newType === 'PMCC') && (
                    <div>
                      <label className="text-slate-400 block mb-1">Long / Secondary Strike ($):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newStrike2}
                        onChange={(e) => setNewStrike2(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">DTE (Days to Expiration):</label>
                  <input
                    type="number"
                    min="1"
                    value={newDte}
                    onChange={(e) => setNewDte(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Entry Price ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntryPrice}
                    onChange={(e) => setNewEntryPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Add to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
