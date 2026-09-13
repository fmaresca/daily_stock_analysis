import React, { useState } from 'react';
import { RefreshCw, ArrowUpRight, TrendingUp } from 'lucide-react';
import { coveredCallApi } from '../../api/coveredCall';
import type { RollItem } from '../../types/coveredCall';

interface RollOptimizerPanelProps {
  defaultSymbol?: string;
  defaultStrike?: number;
  defaultExpiration?: string;
}

export const RollOptimizerPanel: React.FC<RollOptimizerPanelProps> = ({
  defaultSymbol = 'AAPL',
  defaultStrike = 230,
  defaultExpiration = '2026-09-25',
}) => {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [strike, setStrike] = useState(defaultStrike.toString());
  const [expiration, setExpiration] = useState(defaultExpiration);
  const [costBasis, setCostBasis] = useState('');
  const [loading, setLoading] = useState(false);
  const [rolls, setRolls] = useState<RollItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !strike) return;
    setLoading(true);
    setError(null);

    try {
      const res = await coveredCallApi.optimizeRoll({
        symbol: symbol.trim().toUpperCase(),
        current_strike: parseFloat(strike),
        current_expiration: expiration,
        cost_basis: costBasis ? parseFloat(costBasis) : undefined,
      });
      setRolls(res.rolls || []);
      setSearched(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to optimize roll candidates.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span>Roll Optimizer & Lifecycle Manager</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ranked Roll-Out & Roll-Up Opportunities to defend tested short calls or recapture upside.
          </p>
        </div>
      </div>

      <form onSubmit={handleOptimize} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300">Ticker Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="AAPL"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300">Current Strike ($)</label>
          <input
            type="number"
            step="0.5"
            value={strike}
            onChange={(e) => setStrike(e.target.value)}
            placeholder="230.00"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300">Current Expiry</label>
          <input
            type="date"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white focus:border-emerald-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300">Cost Basis ($ Optional)</label>
          <input
            type="number"
            step="0.5"
            value={costBasis}
            onChange={(e) => setCostBasis(e.target.value)}
            placeholder="e.g. 215.00"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
            <span>Find Best Rolls</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-800/50 bg-rose-950/20 p-3 text-xs text-rose-400">
          {error}
        </div>
      )}

      {rolls.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Rank / Score</th>
                <th className="px-4 py-3">New Strike</th>
                <th className="px-4 py-3">New Expiry</th>
                <th className="px-4 py-3">DTE</th>
                <th className="px-4 py-3">Net Credit</th>
                <th className="px-4 py-3">New Ann. Yield</th>
                <th className="px-4 py-3">Delta Adj.</th>
                <th className="px-4 py-3">Strategy Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {rolls.map((r, idx) => {
                const isNetCredit = r.net_credit >= 0;
                return (
                  <tr key={idx} className="transition-colors hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/30">
                        #{idx + 1} • {r.recommendation_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white">
                      ${r.new_strike.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.new_expiration}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {r.new_dte}d
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${isNetCredit ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isNetCredit ? '+' : ''}${r.net_credit.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-cyan-400">
                      {r.new_annualized_yield.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.delta_adjustment > 0 ? '+' : ''}{r.delta_adjustment.toFixed(2)}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-400 font-sans text-xs">
                      {r.rationale}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {searched && rolls.length === 0 && !loading && (
        <div className="py-8 text-center text-xs text-slate-500">
          No attractive roll candidates identified with specified parameters.
        </div>
      )}
    </div>
  );
};
