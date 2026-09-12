import React, { useState, useMemo, useEffect } from 'react';
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
  Sun,
  Moon,
  Bell,
  ShieldCheck,
  Clock,
} from './icons';
import { ScreenerSummary } from '../types/options';
import { analyzeSyncRateLimits } from '../utils/marketHoursAndAutoSync';
import {
  calculateLiveExecutiveMetrics,
  ExecutiveDigestMetrics,
} from '../utils/executiveReportGenerator';

interface HeaderProps {
  summary: ScreenerSummary | null;
  lastUpdated: string;
  totalTickers: number;
  executiveMetrics?: ExecutiveDigestMetrics;
  onRefresh: () => void;
  onLiveRecalculate?: () => void;
  isLoading: boolean;
  isRecalculating?: boolean;
  dataSource: string;
  onOpenCommandPalette: () => void;
  onOpenHelp: () => void;
  onOpenWatchlists: () => void;
  onOpenReports: () => void;
  onOpenTradier: () => void;
  onOpenSchwab: () => void;
  onOpenAlerts?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenExecutiveDigest?: () => void;
  onOpenSimulator?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  autoSyncInterval?: number;
  onChangeAutoSyncInterval?: (seconds: number) => void;
  autoSyncCountdown?: number;
  marketHoursOnly?: boolean;
  onToggleMarketHoursOnly?: () => void;
  isMarketOpen?: boolean;
  isThrottled?: boolean;
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
  onOpenTradier,
  onOpenSchwab,
  onOpenAlerts,
  onOpenDiagnostics,
  onOpenExecutiveDigest,
  onOpenSimulator,
  theme = 'dark',
  onToggleTheme,
  autoSyncInterval = 300,
  onChangeAutoSyncInterval,
  autoSyncCountdown = 300,
  marketHoursOnly = true,
  onToggleMarketHoursOnly,
  isMarketOpen = true,
  isThrottled = false,
  executiveMetrics,
}) => {
  const [isAutoSyncMenuOpen, setIsAutoSyncMenuOpen] = useState(false);
  const [liveExecutiveMetrics, setLiveExecutiveMetrics] = useState<ExecutiveDigestMetrics>(
    () => executiveMetrics || calculateLiveExecutiveMetrics()
  );

  useEffect(() => {
    if (executiveMetrics) {
      setLiveExecutiveMetrics(executiveMetrics);
      return;
    }
    const handleSync = () => {
      setLiveExecutiveMetrics(calculateLiveExecutiveMetrics());
    };
    handleSync();
    window.addEventListener('deltaharvest_portfolio_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('deltaharvest_portfolio_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [executiveMetrics]);

  const rateAnalysis = useMemo(() => {
    return analyzeSyncRateLimits(autoSyncInterval, totalTickers || 7);
  }, [autoSyncInterval, totalTickers]);

  const countdownText = useMemo(() => {
    if (!autoSyncInterval || autoSyncInterval <= 0) return 'Off';
    const m = Math.floor(autoSyncCountdown / 60);
    const s = autoSyncCountdown % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }, [autoSyncInterval, autoSyncCountdown]);
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
                  v3.3
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

          {/* Portfolio Health Pulse Badge */}
          {onOpenExecutiveDigest && (
            <button
              onClick={onOpenExecutiveDigest}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold font-mono rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-emerald-500/10 group"
              title={`Executive Portfolio Health Digest • ${liveExecutiveMetrics.complianceHealthScore}/100 Health • $${liveExecutiveMetrics.netLiquidity.toLocaleString()} Net Liq • +$${liveExecutiveMetrics.dailyTheta.toFixed(2)}/day Theta`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{liveExecutiveMetrics.complianceHealthScore}/100 Health</span>
              <span className="text-slate-500">•</span>
              <span className={liveExecutiveMetrics.dailyTheta >= 0 ? "text-cyan-300" : "text-rose-400"}>
                {liveExecutiveMetrics.dailyTheta >= 0 ? '+' : ''}${Math.round(liveExecutiveMetrics.dailyTheta)}/d
              </span>
            </button>
          )}

          {/* Tradier API Settings (Primary) */}
          <button
            onClick={onOpenTradier}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400/70 transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-emerald-500/10"
            title="Configure Tradier API Key (Primary Live Market Data & Options Chains)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tradier API</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-mono">Primary</span>
          </button>

          {/* Schwab API Settings (Fallback) */}
          <button
            onClick={onOpenSchwab}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-blue-300 hover:border-blue-500/50 transition-all cursor-pointer whitespace-nowrap"
            title="Configure Charles Schwab Retail Trader API keys (Fallback Provider)"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Schwab API</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-blue-950/80 text-blue-400 border border-blue-700/40 font-mono">Fallback</span>
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

          {/* Alerts & Webhooks Button */}
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:border-amber-500/50 transition-all cursor-pointer whitespace-nowrap"
              title="Configure real-time desktop push notifications and Discord/Telegram webhooks"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Alerts</span>
            </button>
          )}

          {/* Reports & Query Builder Button */}
          <button
            onClick={onOpenReports}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-indigo-300 hover:border-indigo-500/50 transition-all cursor-pointer whitespace-nowrap"
            title="Custom report queries & exports to CSV/Excel/PDF (R)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reports</span>
          </button>

          {/* Trade Quality Simulator Button (Image-based UI Widget) */}
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 hover:border-emerald-400 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
              title="Open Options Trade Quality Simulator (Weekly CSP/CC)"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulator</span>
            </button>
          )}

          {/* Help Handbook Button */}
          <button
            onClick={onOpenHelp}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:border-cyan-500/50 transition-all cursor-pointer whitespace-nowrap"
            title="Open Strategy Handbook and FAQs (?)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Help</span>
          </button>

          {/* Day / Night Mode (Light / Dark) Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to Day Mode (Light Theme)' : 'Switch to Night Mode (Dark Theme)'}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:border-amber-400/50 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              title={theme === 'dark' ? 'Switch to Day Mode (Light Theme)' : 'Switch to Night Mode (Dark Theme)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Day Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Night Mode</span>
                </>
              )}
            </button>
          )}

          {/* Unified Real-Time Live Sync & Auto-Sync Split Control */}
          <div className="relative flex items-center shadow-sm shadow-emerald-500/10">
            {/* Manual Trigger Button */}
            <button
              onClick={onLiveRecalculate || onRefresh}
              disabled={isLoading || isRecalculating}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-l-lg bg-emerald-950/70 hover:bg-emerald-900/80 border-y border-l border-emerald-500/60 text-emerald-300 hover:border-emerald-400 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
              title="Fetch real-time market quotes, refresh Bollinger Bands, RSI & recalculate options Greeks across all watchlists"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRecalculating || isLoading ? 'animate-spin' : ''}`} />
              <span>{isRecalculating ? 'Syncing...' : 'Live Sync'}</span>
            </button>

            {/* Auto-Sync Cadence & Safety Indicator Dropdown Trigger */}
            <button
              onClick={() => setIsAutoSyncMenuOpen(!isAutoSyncMenuOpen)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-r-lg border transition-all cursor-pointer whitespace-nowrap ${
                isThrottled
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                  : autoSyncInterval > 0
                    ? marketHoursOnly && !isMarketOpen
                      ? 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-300'
                      : 'bg-emerald-900/40 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Configure Automated Live Sync Frequency & Anti-Block Quota Guard"
            >
              {autoSyncInterval > 0 ? (
                isThrottled ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mr-0.5" />
                ) : marketHoursOnly && !isMarketOpen ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-0.5" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-0.5" />
                )
              ) : null}
              <span>
                {isThrottled
                  ? 'Throttled (5m)'
                  : autoSyncInterval > 0
                    ? marketHoursOnly && !isMarketOpen
                      ? 'Paused (Mkt Closed)'
                      : `Auto: ${countdownText}`
                    : 'Auto: Off'}
              </span>
              <span className="text-[9px] text-slate-400 font-sans ml-0.5">▼</span>
            </button>

            {/* Automated Sync Configuration Menu */}
            {isAutoSyncMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 text-xs space-y-3 font-sans animate-fade-in text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">Automated Live Sync</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Anti-Block Guard
                  </span>
                </div>

                {/* Cadence Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-semibold block">Sync Cadence:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { sec: 0, label: 'Off', sub: 'Manual Only' },
                      { sec: 300, label: 'Every 5 min', sub: 'Recommended (0% Block)' },
                      { sec: 600, label: 'Every 10 min', sub: 'Ultra-Safe' },
                      { sec: 120, label: 'Every 2 min', sub: 'Active Trading' },
                    ].map((opt) => (
                      <button
                        key={opt.sec}
                        onClick={() => {
                          onChangeAutoSyncInterval && onChangeAutoSyncInterval(opt.sec);
                        }}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          autoSyncInterval === opt.sec
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <span className="block text-xs font-semibold">{opt.label}</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Market Hours Only Safeguard Checkbox */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketHoursOnly}
                      onChange={onToggleMarketHoursOnly}
                      className="mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <div className="text-[11px]">
                      <span className="font-semibold text-white block">Market Hours Only (9:30 AM - 4:00 PM ET)</span>
                      <span className="text-slate-400 text-[10px] block leading-tight">
                        Automatically pauses syncs during weeknights and weekends to prevent burning API calls when markets are closed.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Live Quota Analysis Meter */}
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Hourly API Rate:</span>
                    <strong className="text-emerald-300">
                      {rateAnalysis.requestsPerHour} / ~2,000 reqs/hr
                    </strong>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        rateAnalysis.quotaUtilizationPct > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, rateAnalysis.quotaUtilizationPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Utilization: {rateAnalysis.quotaUtilizationPct}%</span>
                    <span>Status: {isMarketOpen ? '🟢 Mkt Open' : '⏸️ Mkt Closed'}</span>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setIsAutoSyncMenuOpen(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
