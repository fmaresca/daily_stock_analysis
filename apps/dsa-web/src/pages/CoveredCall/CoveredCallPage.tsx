import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Sliders,
  Percent,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { coveredCallApi } from '../../api/coveredCall';
import type { CoveredCallItem, PayoffCurveResponse } from '../../types/coveredCall';
import { PayoffDiagram } from './PayoffDiagram';
import { RollOptimizerPanel } from './RollOptimizerPanel';

export const CoveredCallPage: React.FC = () => {
  // Filters
  const [symbolsInput, setSymbolsInput] = useState('AAPL,MSFT,NVDA,TSLA');
  const [deltaTarget, setDeltaTarget] = useState(0.30);
  const [dteRange, setDteRange] = useState<'all' | 'weekly' | 'monthly' | '60d'>('all');
  const [minIvp, setMinIvp] = useState(40);
  const [excludeEarnings, setExcludeEarnings] = useState(false);

  // Data & State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CoveredCallItem[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [payoffCache, setPayoffCache] = useState<Record<string, PayoffCurveResponse>>({});
  const [payoffLoading, setPayoffLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'screener' | 'roll_matrix'>('screener');

  const fetchScreenerData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let minDte = 7;
    let maxDte = 60;
    if (dteRange === 'weekly') {
      minDte = 7;
      maxDte = 14;
    } else if (dteRange === 'monthly') {
      minDte = 15;
      maxDte = 35;
    } else if (dteRange === '60d') {
      minDte = 35;
      maxDte = 60;
    }

    try {
      const symList = symbolsInput.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      const res = await coveredCallApi.screen({
        symbols: symList.length > 0 ? symList : ['AAPL', 'MSFT', 'NVDA', 'TSLA'],
        min_dte: minDte,
        max_dte: maxDte,
        target_delta_min: Math.max(0.10, deltaTarget - 0.10),
        target_delta_max: Math.min(0.50, deltaTarget + 0.10),
        min_ivp: minIvp,
        exclude_earnings: excludeEarnings,
      });

      const allCands: CoveredCallItem[] = [];
      Object.values(res.data).forEach((cands) => {
        allCands.push(...cands);
      });

      setCandidates(allCands);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to fetch covered call screener data.');
    } finally {
      setLoading(false);
    }
  }, [symbolsInput, deltaTarget, dteRange, minIvp, excludeEarnings]);

  useEffect(() => {
    fetchScreenerData();
  }, [fetchScreenerData]);

  const toggleRowExpansion = async (cand: CoveredCallItem) => {
    const key = `${cand.symbol}-${cand.strike}-${cand.expiration}`;
    if (expandedRow === key) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(key);

    if (!payoffCache[key]) {
      setPayoffLoading(true);
      try {
        const payoff = await coveredCallApi.getPayoff({
          spot: cand.spot_price,
          strike: cand.strike,
          premium: cand.bid > 0 ? cand.bid : cand.mid,
          contracts: 1,
        });
        setPayoffCache((prev) => ({ ...prev, [key]: payoff }));
      } catch (err) {
        console.error('Failed to load payoff curve:', err);
      } finally {
        setPayoffLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-wide text-white">
                <span>Covered Call & Option Income Engine</span>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-400">
                  INSTITUTIONAL v4.0
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Quantitative Derivatives Screener • Binomial American Pricing • Greeks • Variance Risk Premium • AI Thesis
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
          <button
            onClick={() => setActiveTab('screener')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'screener'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Income Screener</span>
          </button>
          <button
            onClick={() => setActiveTab('roll_matrix')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'roll_matrix'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Roll Optimizer Matrix</span>
          </button>
        </div>
      </div>

      {activeTab === 'roll_matrix' ? (
        <RollOptimizerPanel defaultSymbol={candidates[0]?.symbol || 'AAPL'} />
      ) : (
        <>
          {/* Interactive Filter Toolbar */}
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {/* Symbols input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">Watchlist Tickers</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={symbolsInput}
                    onChange={(e) => setSymbolsInput(e.target.value.toUpperCase())}
                    placeholder="AAPL,MSFT,NVDA"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={fetchScreenerData}
                    disabled={loading}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Run'}
                  </button>
                </div>
              </div>

              {/* Delta Target Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Target Delta (Δ)</span>
                  <span className="font-mono text-emerald-400">{deltaTarget.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.40"
                  step="0.01"
                  value={deltaTarget}
                  onChange={(e) => setDeltaTarget(parseFloat(e.target.value))}
                  className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
                />
                <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0.15 (OTM)</span>
                  <span>0.30 (Sweet Spot)</span>
                  <span>0.40 (Aggressive)</span>
                </div>
              </div>

              {/* DTE Cadence Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">Expiration DTE Cycle</label>
                <div className="mt-1 flex gap-1 rounded-lg border border-slate-700 bg-slate-950 p-1">
                  {(['all', 'weekly', 'monthly', '60d'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setDteRange(cycle)}
                      className={`flex-1 rounded py-1 text-[11px] font-semibold uppercase transition-all ${
                        dteRange === cycle
                          ? 'bg-emerald-600 font-bold text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cycle === 'all' ? 'All' : cycle === 'weekly' ? '7-14d' : cycle === 'monthly' ? '15-35d' : '35-60d'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min IV Percentile Filter Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Min IV Percentile</span>
                  <span className="font-mono text-cyan-400">{minIvp}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minIvp}
                  onChange={(e) => setMinIvp(parseInt(e.target.value, 10))}
                  className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-cyan-500"
                />
                <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0%</span>
                  <span>40% (Harvest)</span>
                  <span>80%+</span>
                </div>
              </div>

              {/* Exclude Earnings Toggle */}
              <div className="flex flex-col justify-between">
                <span className="text-xs font-semibold text-slate-300">Earnings Shield</span>
                <label className="mt-1 flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs">
                  <span className="text-slate-400">Exclude Earnings</span>
                  <input
                    type="checkbox"
                    checked={excludeEarnings}
                    onChange={(e) => setExcludeEarnings(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-800/50 bg-rose-950/30 p-4 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Dense Screener Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="border-b border-slate-800 bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Ticker</th>
                    <th className="px-4 py-3.5">Spot</th>
                    <th className="px-4 py-3.5">Strike</th>
                    <th className="px-4 py-3.5">Expiry / DTE</th>
                    <th className="px-4 py-3.5">Delta (Δ)</th>
                    <th className="px-4 py-3.5">Bid / Ask</th>
                    <th className="px-4 py-3.5 text-emerald-400">Static Yield (Ann.)</th>
                    <th className="px-4 py-3.5 text-cyan-400">If-Called (Ann.)</th>
                    <th className="px-4 py-3.5">Cushion %</th>
                    <th className="px-4 py-3.5">IVP %</th>
                    <th className="px-4 py-3.5">Early Assign. Risk</th>
                    <th className="px-4 py-3.5 text-right">AI Conviction</th>
                    <th className="px-4 py-3.5 text-center">Payoff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {candidates.map((cand) => {
                    const rowKey = `${cand.symbol}-${cand.strike}-${cand.expiration}`;
                    const isExpanded = expandedRow === rowKey;

                    return (
                      <React.Fragment key={rowKey}>
                        <tr
                          onClick={() => toggleRowExpansion(cand)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? 'bg-slate-800/60' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-white flex items-center gap-1.5">
                            <span>{cand.symbol}</span>
                            {cand.earnings_risk && (
                              <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] text-amber-400 border border-amber-500/30 font-sans" title="Earnings inside expiration cycle">
                                EARN
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            ${cand.spot_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-bold text-purple-400">
                            ${cand.strike.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            <span>{cand.expiration}</span>
                            <span className="ml-1 text-[10px] text-slate-500">({cand.dte}d)</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-400">
                            {cand.delta.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            ${cand.bid.toFixed(2)} / ${cand.ask.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-400">
                            {cand.static_yield_annualized.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 font-bold text-cyan-400">
                            {cand.if_called_yield_annualized.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {cand.downside_cushion_pct.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              cand.iv_percentile >= 50
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {cand.iv_percentile.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {cand.early_assignment_has_risk ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                                <AlertTriangle className="h-3 w-3" />
                                DIV CAPTURE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                                <ShieldCheck className="h-3 w-3" />
                                SAFE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {cand.ai_conviction_score ? (
                              <span className="rounded-lg bg-emerald-500/20 px-2 py-1 font-bold text-emerald-300 border border-emerald-500/40">
                                {cand.ai_conviction_score}/100
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-400">
                            {isExpanded ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />}
                          </td>
                        </tr>

                        {/* Expanded Row with Payoff Diagram & AI Thesis */}
                        {isExpanded && (
                          <tr className="bg-slate-950/90 border-b border-slate-800">
                            <td colSpan={13} className="p-4 sm:p-6">
                              <div className="space-y-4">
                                {cand.ai_thesis && (
                                  <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-xs">
                                    <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                                      <Sparkles className="h-4 w-4" />
                                      <span>AI Strategy Synthesis & Thesis</span>
                                    </div>
                                    <p className="text-slate-300 font-sans leading-relaxed">
                                      {cand.ai_thesis}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  {payoffLoading && !payoffCache[rowKey] ? (
                                    <div className="flex h-48 items-center justify-center text-xs text-slate-400">
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                      Calculating theoretical payoff matrix across expiration boundaries...
                                    </div>
                                  ) : payoffCache[rowKey] ? (
                                    <PayoffDiagram data={payoffCache[rowKey]} symbol={cand.symbol} />
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {candidates.length === 0 && !loading && (
              <div className="py-12 text-center text-xs text-slate-400">
                No covered call candidates met the specified criteria. Try adjusting target Delta, DTE, or IV percentile sliders.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
