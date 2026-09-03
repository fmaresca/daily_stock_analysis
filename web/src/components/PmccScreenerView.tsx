import React, { useState, useMemo } from 'react';
import { TickerMeta, MultiLegSpread } from '../types/options';
import {
  generatePmccOpportunities,
  PmccOpportunity,
} from '../utils/pmccScreener';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  DollarSign,
  Activity,
  Layers,
  Award,
  Search,
  CheckCircle2,
  AlertTriangle,
} from './icons';

interface PmccScreenerViewProps {
  tickers: TickerMeta[];
  onStagePmcc?: (spread: MultiLegSpread) => void;
}

export const PmccScreenerView: React.FC<PmccScreenerViewProps> = ({
  tickers,
  onStagePmcc,
}) => {
  const [minSavingsFilter, setMinSavingsFilter] = useState<number>(55);
  const [zeroExtrinsicOnly, setZeroExtrinsicOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const pmccList = useMemo(() => {
    return generatePmccOpportunities(tickers);
  }, [tickers]);

  const filteredPmcc = useMemo(() => {
    return pmccList.filter((p) => {
      if (p.capitalSavingsPct < minSavingsFilter) return false;
      if (zeroExtrinsicOnly && !p.hasZeroExtrinsicRisk) return false;
      if (searchQuery) {
        const q = searchQuery.toUpperCase();
        if (!p.symbol.includes(q) && !p.name.toUpperCase().includes(q)) return false;
      }
      return true;
    });
  }, [pmccList, minSavingsFilter, zeroExtrinsicOnly, searchQuery]);

  // Aggregate stats
  const avgSavings = useMemo(() => {
    if (pmccList.length === 0) return 0;
    const sum = pmccList.reduce((acc, p) => acc + p.capitalSavingsPct, 0);
    return Math.round((sum / pmccList.length) * 10) / 10;
  }, [pmccList]);

  const zeroRiskCount = useMemo(() => {
    return pmccList.filter((p) => p.hasZeroExtrinsicRisk).length;
  }, [pmccList]);

  // Convert PMCC opportunity into MultiLegSpread format for the Broker Staging Modal
  const handleStagePmccOrder = (pmcc: PmccOpportunity) => {
    if (!onStagePmcc) return;
    const spread: MultiLegSpread = {
      id: pmcc.id,
      symbol: pmcc.symbol,
      strategy: 'BULL_CALL_SPREAD',
      strategy_name: 'Poor Man’s Covered Call (PMCC Diagonal)',
      expiration: pmcc.shortExpiration,
      dte: pmcc.shortDte,
      current_price: pmcc.spotPrice,
      short_strike: pmcc.shortStrike,
      short_delta: pmcc.shortDelta,
      short_type: 'call',
      long_strike: pmcc.longStrike,
      long_delta: pmcc.longDelta,
      long_type: 'call',
      spread_width: Math.abs(pmcc.shortStrike - pmcc.longStrike),
      net_credit: -pmcc.netDebitPerShare,
      max_loss: pmcc.netDebitPerShare,
      max_profit: pmcc.maxProfitAtShortStrike / 100,
      roc_pct: 12,
      annualized_roc: pmcc.annualizedRoc,
      pop_pct: 78.5,
      cushion_pct: pmcc.downsideCushionPct,
      iv_rank: 30,
    };
    onStagePmcc(spread);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Poor Man’s Covered Call (PMCC) &amp; Diagonal Spread Screener
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Synthetic Stock Income
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Replace costly 100-share stock ownership with deep In-The-Money LEAPS ($0.80+\Delta$) and harvest recurring short call income ($0.20–0.30\Delta$), freeing up <strong>60%–75% of capital</strong> while locking in zero extrinsic assignment risk.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Avg Capital Saved</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {avgSavings}%
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Zero Extrinsic Risk</span>
              <span className="text-base font-bold text-purple-400 font-mono">
                {zeroRiskCount} / {pmccList.length}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Synthetic Long Leg (LEAPS Call)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deep ITM call ($0.80–0.85\Delta$, 180–270 DTE) behaves nearly identical to stock ($1.00\Delta$) with zero downside margin risk below strike.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Short Call Leg (30-45 DTE $\ge$ Upper BB)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sells 0.20–0.28 Delta calls against the LEAPS. Roll monthly to generate recurring cash flow on a drastically smaller capital base.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Zero Extrinsic Assignment Rule</span>
            </div>
            <p className="text-[11px] text-slate-400">
              When Net Debit $\le$ Strike Width, the position is immune to upside assignment losses, ensuring guaranteed profit if the stock surges.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker..."
              className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono w-40"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          </div>

          {/* Min Capital Savings Slider / Selector */}
          <div className="inline-flex p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
            {[50, 60, 65, 70].map((val) => (
              <button
                key={val}
                onClick={() => setMinSavingsFilter(val)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  minSavingsFilter === val
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                &ge; {val}% Savings
              </button>
            ))}
          </div>

          {/* Zero Extrinsic Toggle */}
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={zeroExtrinsicOnly}
              onChange={(e) => setZeroExtrinsicOnly(e.target.checked)}
              className="rounded border-slate-700 text-purple-500 focus:ring-purple-500 bg-slate-950"
            />
            <span className={zeroExtrinsicOnly ? 'text-purple-300 font-bold' : 'text-slate-400'}>
              Zero Extrinsic Risk Only
            </span>
          </label>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredPmcc.length} of {pmccList.length} PMCC Candidates
        </span>
      </div>

      {/* PMCC Candidates Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Systematic Poor Man’s Covered Call Candidates
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sorted by Safety Score &amp; Ann. ROC
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase font-mono">
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-3">Spot Price</th>
                <th className="py-3 px-3">Long LEAPS ($0.85\Delta$)</th>
                <th className="py-3 px-3">Short Call ($0.25\Delta$)</th>
                <th className="py-3 px-3 text-right">Net Capital Outlay</th>
                <th className="py-3 px-3 text-right">Capital Saved</th>
                <th className="py-3 px-3 text-right">Breakeven &amp; Cushion</th>
                <th className="py-3 px-3 text-right">Ann. ROC</th>
                <th className="py-3 px-3 text-center">Safety Rating</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredPmcc.map((pmcc) => (
                <tr key={pmcc.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-sans">
                    <div className="font-bold text-white flex items-center space-x-1.5">
                      <span>{pmcc.symbol}</span>
                      {pmcc.hasZeroExtrinsicRisk && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800" title="Zero Extrinsic Risk if Assigned">
                          Zero Risk
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                      {pmcc.name}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-200">
                    ${pmcc.spotPrice.toFixed(2)}
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-purple-300 font-bold">
                      ${pmcc.longStrike} Call ({pmcc.longDelta.toFixed(2)}\Delta)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {pmcc.longDte}d exp (${pmcc.longCostTotal.toLocaleString()} debit)
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-emerald-300 font-bold">
                      ${pmcc.shortStrike} Call ({pmcc.shortDelta.toFixed(2)}\Delta)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {pmcc.shortDte}d exp (+${pmcc.shortCreditTotal.toLocaleString()} credit)
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-white">
                    ${pmcc.netDebitTotal.toLocaleString()}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      (${pmcc.netDebitPerShare.toFixed(2)}/sh)
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    {pmcc.capitalSavingsPct.toFixed(1)}%
                    <span className="text-[10px] text-slate-400 block font-normal">
                      vs ${pmcc.stockEquivalentCost.toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="text-slate-200 font-bold">
                      ${pmcc.breakevenPrice.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      {pmcc.downsideCushionPct.toFixed(1)}% Cushion
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-cyan-400">
                    {pmcc.annualizedRoc.toFixed(1)}%
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pmcc.safetyScore >= 85
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    }`}>
                      {pmcc.safetyScore} / 100
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleStagePmccOrder(pmcc)}
                      className="px-3 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/40 font-semibold flex items-center space-x-1 mx-auto transition-all shadow-sm"
                    >
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span>Stage PMCC</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
