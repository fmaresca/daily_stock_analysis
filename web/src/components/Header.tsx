import React from 'react';
import { TrendingUp, RefreshCw, Activity } from './icons';
import { ScreenerSummary } from '../types/options';

interface HeaderProps {
  summary: ScreenerSummary | null;
  lastUpdated: string;
  totalTickers: number;
  onRefresh: () => void;
  isLoading: boolean;
  dataSource: string;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  lastUpdated,
  totalTickers,
  onRefresh,
  isLoading,
  dataSource,
}) => {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : 'Live Session';

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Weekly Options Income Dashboard</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Conservative Income
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Volatility Harvest • Cash-Secured Puts (Lower BB) & Covered Calls (Upper BB)
            </p>
          </div>
        </div>

        {/* Center Pill: Tickers Analyzed & Strategy Status */}
        <div className="hidden lg:flex items-center space-x-4 text-xs bg-slate-900/90 border border-slate-800 rounded-full px-4 py-1.5 shadow-inner">
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Analyzed Universe:</span>
            <span className="font-bold font-mono text-white">
              {totalTickers} Tickers
            </span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Target Expiry:</span>
            <span className="font-semibold font-mono text-cyan-400">
              3–7 DTE Weekly
            </span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Target Delta:</span>
            <span className="font-semibold font-mono text-amber-300">
              0.15–0.20 Δ
            </span>
          </div>
        </div>

        {/* Right Side Controls & Source */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-slate-400 font-mono">
              Updated: {formattedTime}
            </div>
            <div className="flex items-center justify-end space-x-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="truncate max-w-[150px]">{dataSource}</span>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all hover:border-emerald-500/50 disabled:opacity-50 shadow-sm"
            title="Reload latest data from JSON or GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
