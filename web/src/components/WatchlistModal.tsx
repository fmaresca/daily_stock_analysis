import React, { useState } from 'react';
import { X, Star, Plus, Trash2, RotateCcw, CheckCircle2, ShieldCheck, HelpCircle } from './icons';
import { TickerMeta } from '../types/options';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  universeTickers: TickerMeta[];
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  onAddCustomTicker: (symbol: string) => void;
  onRemoveTicker: (symbol: string) => void;
  onResetWatchlist: () => void;
  onSelectAllUniverse: () => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  universeTickers,
  watchlist,
  onToggleWatchlist,
  onAddCustomTicker,
  onRemoveTicker,
  onResetWatchlist,
  onSelectAllUniverse,
}) => {
  const [newSymbolInput, setNewSymbolInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSymbolInput.trim().toUpperCase();
    if (!clean) return;

    if (!/^[A-Z0-9.\-_]{1,10}$/.test(clean)) {
      setErrorMsg('Invalid ticker format (letters and numbers only, e.g. AMD, META).');
      return;
    }

    if (watchlist.includes(clean)) {
      setErrorMsg(`${clean} is already in your watchlist.`);
      return;
    }

    onAddCustomTicker(clean);
    setNewSymbolInput('');
    setErrorMsg('');
  };

  const universeSymbols = new Set(universeTickers.map((t) => t.symbol));
  const customSymbols = watchlist.filter((sym) => !universeSymbols.has(sym));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Star className="w-5 h-5" filled />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Manage Income Watchlist</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {watchlist.length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Filter the dashboard to trade only the tickers you follow.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Add Ticker Form */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Add Ticker to Watchlist
            </label>
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newSymbolInput}
                onChange={(e) => {
                  setNewSymbolInput(e.target.value.toUpperCase());
                  setErrorMsg('');
                }}
                placeholder="Enter symbol (e.g. AMD, META, GOOGL, COIN)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg flex items-center space-x-1.5 transition-colors shadow-md shadow-amber-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ticker</span>
              </button>
            </form>
            {errorMsg && <p className="text-[11px] text-rose-400">{errorMsg}</p>}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-semibold text-slate-300">
              Universe Tickers ({universeTickers.length})
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={onSelectAllUniverse}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Select All 18
              </button>
              <button
                onClick={onResetWatchlist}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center space-x-1"
                title="Reset to default 18 universe tickers"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Grid of Universe Tickers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {universeTickers.map((ticker) => {
              const isSelected = watchlist.includes(ticker.symbol);
              return (
                <div
                  key={ticker.symbol}
                  onClick={() => onToggleWatchlist(ticker.symbol)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500/50 text-white shadow-sm'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Star
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isSelected ? 'text-amber-400' : 'text-slate-600'
                      }`}
                      filled={isSelected}
                    />
                    <div className="truncate">
                      <div className="font-bold font-mono text-xs">{ticker.symbol}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[100px]">
                        ${ticker.spot_price.toFixed(2)} • IVR {ticker.iv_rank}%
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isSelected ? 'Active' : 'Off'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Custom Added Tickers (if any) */}
          {customSymbols.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="font-semibold text-slate-300 block">
                Custom Added Tickers ({customSymbols.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {customSymbols.map((sym) => (
                  <div
                    key={sym}
                    className="p-2.5 rounded-xl border bg-amber-950/20 border-amber-500/40 text-white flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Star className="w-3.5 h-3.5 text-amber-400" filled />
                      <span className="font-bold font-mono text-xs">{sym}</span>
                    </div>
                    <button
                      onClick={() => onRemoveTicker(sym)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backend Info Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-start space-x-2.5">
            <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Tip:</strong> Your watchlist preference is saved in your browser and automatically syncs across sessions.
              To add permanent custom tickers to the daily automated data runner, run:
              <code className="mx-1 px-1.5 py-0.5 bg-slate-950 text-emerald-400 rounded border border-slate-800 font-mono text-[10px]">
                python scripts/generate_options_data.py --add-ticker SYMBOL
              </code>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {watchlist.length} of {universeTickers.length + customSymbols.length} tickers selected
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md shadow-emerald-600/20"
          >
            Apply &amp; View Watchlist
          </button>
        </div>
      </div>
    </div>
  );
};
