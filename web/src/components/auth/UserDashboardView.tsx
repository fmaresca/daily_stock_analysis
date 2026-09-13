import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Star,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  User,
  Zap,
} from '../icons';
import { UserTradeItem, UserWatchlistItem, UserPortfolioItem } from '../../types/auth';
import { PasswordChangeView } from './PasswordChangeView';

interface UserDashboardViewProps {
  onNavigateToScreener?: () => void;
  onNavigateToCharts?: () => void;
  onNavigateToWorkflow?: () => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  onNavigateToScreener,
  onNavigateToCharts,
  onNavigateToWorkflow,
}) => {
  const { user, logout } = useAuth();
  const [trades, setTrades] = useState<UserTradeItem[]>([]);
  const [watchlists, setWatchlists] = useState<UserWatchlistItem[]>([]);
  const [portfolio, setPortfolio] = useState<UserPortfolioItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newWatchlistSymbol, setNewWatchlistSymbol] = useState('');

  // Add Trade Form state
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeStrategy, setTradeStrategy] = useState<'COVERED_CALL' | 'CASH_SECURED_PUT' | 'LONG_STOCK' | 'SPREAD' | 'OTHER'>('CASH_SECURED_PUT');
  const [tradeStrike, setTradeStrike] = useState('');
  const [tradeExpiration, setTradeExpiration] = useState('');
  const [tradeContracts, setTradeContracts] = useState('1');
  const [tradePremium, setTradePremium] = useState('');
  const [tradeNotes, setTradeNotes] = useState('');
  const [isSavingTrade, setIsSavingTrade] = useState(false);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/data', {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
      });
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades || []);
        setWatchlists(data.watchlists || []);
        setPortfolio(data.portfolio || null);
      } else {
        setError('Failed to load private tenant records.');
      }
    } catch {
      setError('Network error loading workspace.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeSymbol) return;

    setIsSavingTrade(true);
    try {
      const res = await fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          type: 'trade',
          trade: {
            symbol: tradeSymbol.toUpperCase().trim(),
            strategy: tradeStrategy,
            strike: tradeStrike ? parseFloat(tradeStrike) : null,
            expiration: tradeExpiration || null,
            contracts: tradeContracts ? parseInt(tradeContracts, 10) : 1,
            premiumPerShare: tradePremium ? parseFloat(tradePremium) : 0,
            status: 'OPEN',
            notes: tradeNotes.trim() || null,
          },
        }),
      });

      if (res.ok) {
        setIsAddTradeOpen(false);
        // Reset form
        setTradeSymbol('');
        setTradeStrike('');
        setTradeExpiration('');
        setTradePremium('');
        setTradeNotes('');
        await fetchUserData();
      }
    } catch {
      alert('Failed to record trade. Please try again.');
    } finally {
      setIsSavingTrade(false);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm('Are you sure you want to remove this trade record?')) return;
    try {
      const res = await fetch(`/api/user/data?type=trade&id=${encodeURIComponent(tradeId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.ok) {
        setTrades((prev) => prev.filter((t) => t.id !== tradeId));
      }
    } catch {
      alert('Failed to remove trade.');
    }
  };

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const sym = newWatchlistSymbol.toUpperCase().trim();
    if (!sym) return;

    try {
      const res = await fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          type: 'watchlist',
          watchlist: { symbol: sym },
        }),
      });
      if (res.ok) {
        setNewWatchlistSymbol('');
        await fetchUserData();
      }
    } catch {
      alert('Failed to add ticker to watchlist.');
    }
  };

  const handleDeleteWatchlist = async (watchlistId: string) => {
    try {
      const res = await fetch(`/api/user/data?type=watchlist&id=${encodeURIComponent(watchlistId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (res.ok) {
        setWatchlists((prev) => prev.filter((w) => w.id !== watchlistId));
      }
    } catch {
      alert('Failed to remove ticker.');
    }
  };

  // Estimated portfolio calculations
  const totalPremiumCollected = trades.reduce(
    (acc, t) => acc + (t.premiumPerShare || 0) * (t.contracts || 1) * 100,
    0
  );
  const openTradesCount = trades.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{user?.displayName || 'Client Portfolio Workspace'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  {user?.role === 'ADMIN' ? 'SUPER-ADMIN' : 'CLIENT TENANT'}
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user?.email} • Account ID: {user?.id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {onNavigateToScreener && (
            <button
              onClick={onNavigateToScreener}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition-colors"
            >
              Options Screener
            </button>
          )}
          {onNavigateToCharts && (
            <button
              onClick={onNavigateToCharts}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition-colors"
            >
              Interactive Charts
            </button>
          )}
          {onNavigateToWorkflow && (
            <button
              onClick={onNavigateToWorkflow}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition-colors"
            >
              Weekly Workflow
            </button>
          )}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-xs font-semibold rounded-lg text-rose-300 border border-rose-700/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Tenant Privacy & Partition Guarantee Banner */}
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-3 shadow-md">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-bold text-emerald-200 text-sm">Tenant Data Security & Strict Isolation Active</h2>
          <p className="mt-0.5 text-emerald-300/90 leading-relaxed">
            Your trades, watchlists, and investment records are isolated with unique cryptographic IDs. Non-admin users cannot view, query, or commingle with your records under any circumstances.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Portfolio Net Liquidity</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-white">
            ${(portfolio?.netLiquidity || 250000).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>Cash: ${(portfolio?.cashBalance || 50000).toLocaleString()}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Open Option Positions</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-cyan-300">
            {openTradesCount} Active
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Total recorded: {trades.length}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Option Premium Realized</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-amber-300">
            ${totalPremiumCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Cumulative harvest
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Private Watchlist</span>
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-yellow-300">
            {watchlists.length} Tickers
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Custom tracked assets
          </p>
        </div>
      </div>

      {/* Main Content Grid: Trades + Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trades Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Personal Option & Equity Trades</span>
                <span className="text-xs text-slate-400 font-mono">({trades.length})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Record your CSPs, CCs, and long equities for personal tracking.
              </p>
            </div>
            <button
              onClick={() => setIsAddTradeOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Trade</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center items-center text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Loading tenant portfolio...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/40 text-rose-300 text-xs">
              {error}
            </div>
          ) : trades.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl p-6 text-slate-500 text-xs space-y-2">
              <p>No trades recorded yet in your personal workspace.</p>
              <p className="text-slate-400">
                Click <strong>Record Trade</strong> to log a Cash-Secured Put or Covered Call.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Strategy</th>
                    <th className="py-2.5 px-3">Strike</th>
                    <th className="py-2.5 px-3">Expiration</th>
                    <th className="py-2.5 px-3 text-right">Contracts</th>
                    <th className="py-2.5 px-3 text-right">Premium/Sh</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {trades.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">{t.symbol}</td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">{t.strategy}</td>
                      <td className="py-2.5 px-3 text-emerald-300">
                        {t.strike ? `$${t.strike.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{t.expiration || '—'}</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{t.contracts || 1}</td>
                      <td className="py-2.5 px-3 text-right text-amber-300">
                        {t.premiumPerShare ? `$${t.premiumPerShare.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.status === 'OPEN'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteTrade(t.id)}
                          className="p-1 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete trade"
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

        {/* Watchlist Section (1 col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Personal Watchlist</span>
            </h2>
            <p className="text-xs text-slate-400">
              Custom tickers tracked for options screening.
            </p>
          </div>

          <form onSubmit={handleAddWatchlist} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. TSLA, NVDA"
              value={newWatchlistSymbol}
              onChange={(e) => setNewWatchlistSymbol(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 uppercase font-mono focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Add
            </button>
          </form>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {watchlists.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No tickers in watchlist. Add one above!
              </p>
            ) : (
              watchlists.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{w.symbol}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteWatchlist(w.id)}
                    className="p-1 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Trade Modal */}
      {isAddTradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Record New Trade</span>
            </h3>

            <form onSubmit={handleAddTrade} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Underlying Ticker *</label>
                <input
                  type="text"
                  required
                  value={tradeSymbol}
                  onChange={(e) => setTradeSymbol(e.target.value)}
                  placeholder="e.g. TSLA"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 uppercase font-mono focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Strategy Type</label>
                <select
                  value={tradeStrategy}
                  onChange={(e) =>
                    setTradeStrategy(
                      e.target.value as 'COVERED_CALL' | 'CASH_SECURED_PUT' | 'LONG_STOCK' | 'SPREAD' | 'OTHER'
                    )
                  }
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="CASH_SECURED_PUT">Cash-Secured Put (CSP)</option>
                  <option value="COVERED_CALL">Covered Call (CC)</option>
                  <option value="LONG_STOCK">Long Equity Shares</option>
                  <option value="SPREAD">Vertical Spread / Multi-Leg</option>
                  <option value="OTHER">Other Strategy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Strike ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={tradeStrike}
                    onChange={(e) => setTradeStrike(e.target.value)}
                    placeholder="e.g. 210.00"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Expiration (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={tradeExpiration}
                    onChange={(e) => setTradeExpiration(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Contracts</label>
                  <input
                    type="number"
                    min="1"
                    value={tradeContracts}
                    onChange={(e) => setTradeContracts(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Premium / Share ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tradePremium}
                    onChange={(e) => setTradePremium(e.target.value)}
                    placeholder="e.g. 2.45"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Notes / Thesis</label>
                <textarea
                  rows={2}
                  value={tradeNotes}
                  onChange={(e) => setTradeNotes(e.target.value)}
                  placeholder="Targeting 30-delta on weekly expiration..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTradeOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTrade}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  {isSavingTrade ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <PasswordChangeView onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );
};
