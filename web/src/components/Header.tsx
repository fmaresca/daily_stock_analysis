import React from 'react';
import {
  TrendingUp,
  RefreshCw,
  Activity,
  Search,
  Command,
  HelpCircle,
  Star,
  FileSpreadsheet,
  Zap,
} from './icons';
import { ScreenerSummary } from '../types/options';

interface HeaderProps {
  summary: ScreenerSummary | null;
  lastUpdated: string;
  totalTickers: number;
  onRefresh: () => void;
  onLiveRecalculate?: () => void;
  isLoading: boolean;
  isRecalculating?: boolean;
  dataSource: string;
  onOpenCommandPalette: () => void;
  onOpenHelp: () => void;
  onOpenWatchlists: () => void;
  onOpenReports: () => void;
  onOpenSchwab: () => void;
  onOpenDiagnostics?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  lastUpdated,
  totalTickers,
  onRefresh,
  onLiveRecalculate,
  isLoading,
  isRecalculating = false,
  dataSource,
  onOpenCommandPalette,
  onOpenHelp,
  onOpenWatchlists,
  onOpenReports,
  onOpenSchwab,
  onOpenDiagnostics,
}) => {
  const formattedTime = React.useMemo(() => {
    if (!lastUpdated) return 'Live Session';
    try {
      const d = new Date(lastUpdated);
      if (isNaN(d.getTime())) return 'Live Session';
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Live Session';
    }
  }, [lastUpdated]);

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>DeltaHarvest</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v2.0
                </span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono hidden md:inline">
                {totalTickers} Equities Tracked
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span>Updated: <strong className="text-slate-200 font-mono font-semibold">{formattedTime}</strong></span>
              <span>•</span>
              <span className="text-emerald-400/90 font-mono">Conservative Income Engine</span>
            </div>
          </div>
        </div>

        {/* Global Search Trigger (Ctrl+K) */}
        <div className="flex-1 max-w-xs mx-2 hidden md:block">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-slate-400 hover:text-white transition-all text-xs group"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              <span>Search tickers, strategies...</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Action Controls & Navigation Shortcuts */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          {/* Prominent High-Visibility API Self-Test Diagnostics Button */}
          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 shadow-md shadow-emerald-900/40 hover:shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap group ring-1 ring-emerald-400/30 animate-fade-in"
              title="Open Automated API Self-Test & Diagnostic Health Suite"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 group-hover:scale-110 transition-transform" />
              <span>API Self-Test</span>
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse ml-0.5" />
            </button>
          )}

          {/* Schwab API Settings */}
          <button
            onClick={onOpenSchwab}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-blue-300 hover:border-blue-500/50 transition-all cursor-pointer whitespace-nowrap"
            title="Configure Charles Schwab Retail Trader API keys"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Schwab API</span>
          </button>

          {/* Watchlists Button */}
          <button
            onClick={onOpenWatchlists}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:border-amber-500/50 transition-all cursor-pointer whitespace-nowrap"
            title="Manage custom watchlists & bulk upload (W)"
          >
            <Star className="w-3.5 h-3.5" filled />
            <span>Watchlists</span>
          </button>

          {/* Reports & Query Builder Button */}
          <button
            onClick={onOpenReports}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-indigo-300 hover:border-indigo-500/50 transition-all cursor-pointer whitespace-nowrap"
            title="Custom report queries & exports to CSV/Excel/PDF (R)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reports</span>
          </button>

          {/* Help Handbook Button */}
          <button
            onClick={onOpenHelp}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:border-cyan-500/50 transition-all cursor-pointer whitespace-nowrap"
            title="Open Strategy Handbook and FAQs (?)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Help</span>
          </button>

          {/* Live Recalculate Button */}
          {onLiveRecalculate && (
            <button
              onClick={onLiveRecalculate}
              disabled={isLoading || isRecalculating}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 hover:border-emerald-400 transition-all disabled:opacity-50 shadow-sm shadow-emerald-500/10 cursor-pointer whitespace-nowrap"
              title="Compute real market prices, Bollinger Bands, and options for all active tickers on demand"
            >
              <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span>{isRecalculating ? 'Calculating...' : 'Live Fetch'}</span>
            </button>
          )}

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading || isRecalculating}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:border-emerald-500/50 transition-all disabled:opacity-50 cursor-pointer"
            title="Reload latest cached data snapshot"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
