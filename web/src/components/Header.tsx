import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Menu,
  DollarSign,
  User,
  Users,
  LogOut,
  Key,
  X,
} from './icons';
import { DeltaHarvestLogo } from './ui/DeltaHarvestLogo';
import { ScreenerSummary, MenuTreeType, OptionsTabType, EquitiesTabType, TickerMeta } from '../types/options';
import { analyzeSyncRateLimits } from '../utils/marketHoursAndAutoSync';
import { useAuth } from '../context/AuthContext';
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
  onOpenValuation?: () => void;
  onOpenEquityAnalysis?: (symbol?: string) => void;
  onToggleMobileSidebar?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  autoSyncInterval?: number;
  onChangeAutoSyncInterval?: (seconds: number) => void;
  autoSyncCountdown?: number;
  marketHoursOnly?: boolean;
  onToggleMarketHoursOnly?: () => void;
  isMarketOpen?: boolean;
  isThrottled?: boolean;
  universeTickers?: TickerMeta[];
  onNavigateTo?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
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
  onOpenValuation,
  onOpenEquityAnalysis,
  onToggleMobileSidebar,
  theme = 'dark',
  onToggleTheme,
  autoSyncInterval = 300,
  onChangeAutoSyncInterval,
  autoSyncCountdown = 300,
  marketHoursOnly = true,
  onToggleMarketHoursOnly,
  isMarketOpen = true,
  isThrottled = false,
  universeTickers,
  executiveMetrics,
  onNavigateTo,
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAutoSyncMenuOpen, setIsAutoSyncMenuOpen] = useState(false);
  const [isTradierActive, setIsTradierActive] = useState<boolean>(() => {
    try {
      const userKey = localStorage.getItem('tradier_api_key') || sessionStorage.getItem('tradier_api_key');
      const isProv =
        localStorage.getItem('tradier_server_provisioned') === 'true' ||
        sessionStorage.getItem('tradier_server_provisioned') === 'true';
      return !!userKey || isProv;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkTradier = () => {
      try {
        const userKey = localStorage.getItem('tradier_api_key') || sessionStorage.getItem('tradier_api_key');
        const isProv =
          localStorage.getItem('tradier_server_provisioned') === 'true' ||
          sessionStorage.getItem('tradier_server_provisioned') === 'true';
        setIsTradierActive(!!userKey || isProv);
      } catch {
        setIsTradierActive(false);
      }
    };
    checkTradier();
    fetch('/api/v1/options/tradier/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.server_provisioned || data.status === 'CONNECTED')) {
          if (data.server_provisioned) {
            localStorage.setItem('tradier_server_provisioned', 'true');
            sessionStorage.setItem('tradier_server_provisioned', 'true');
          }
          setIsTradierActive(true);
        }
      })
      .catch(() => {});
    window.addEventListener('storage', checkTradier);
    window.addEventListener('focus', checkTradier);
    return () => {
      window.removeEventListener('storage', checkTradier);
      window.removeEventListener('focus', checkTradier);
    };
  }, []);
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

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQuery = searchQuery.trim().toUpperCase().replace(/[^A-Z0-9.\-_]/g, '');

  const matchingTickers = useMemo(() => {
    if (!cleanQuery) return [];
    const pool = universeTickers || [];
    return pool
      .filter(
        (t) =>
          t.symbol.toUpperCase().includes(cleanQuery) ||
          t.name.toUpperCase().includes(cleanQuery)
      )
      .slice(0, 5);
  }, [cleanQuery, universeTickers]);

  const hasExactUniverseMatch = useMemo(() => {
    if (!cleanQuery) return false;
    return (universeTickers || []).some((t) => t.symbol.toUpperCase() === cleanQuery);
  }, [cleanQuery, universeTickers]);

  const handleSelectTicker = (sym: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (onOpenEquityAnalysis) {
      onOpenEquityAnalysis(sym);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanQuery) {
      onOpenCommandPalette();
      return;
    }
    setIsSearching(true);
    setIsSearchOpen(false);
    try {
      if (onOpenEquityAnalysis) {
        await onOpenEquityAnalysis(cleanQuery);
      }
      setSearchQuery('');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="border-b border-slate-800/80 light:border-slate-200/90 bg-slate-950/90 light:bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title with Official Adaptive Logo */}
        <div className="flex items-center space-x-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white light:hover:text-slate-900 bg-slate-900/80 light:bg-slate-100 border border-slate-800 light:border-slate-300 transition-colors"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2">
            <DeltaHarvestLogo variant="header" theme={theme} size={36} />
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 light:text-teal-700 border border-emerald-500/30 hidden sm:inline">
              v3.4
            </span>
          </div>

          <div className="hidden xl:flex items-center space-x-2 text-xs text-slate-400 light:text-slate-500 pl-2 border-l border-slate-800 light:border-slate-200">
            <span>Updated: <strong className="text-slate-200 light:text-slate-700 font-mono font-semibold">{formattedTime}</strong></span>
            <span>•</span>
            <span className="text-emerald-400/90 light:text-teal-600 font-mono">{totalTickers} Equities</span>
          </div>
        </div>

        {/* Upper Right Global Search Input & Autocomplete Dropdown (Ctrl+K) */}
        <div className="flex-1 max-w-xs mx-2 hidden md:block relative" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
              isSearching ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
            }`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search or enter symbol (e.g. NVDA)..."
              className="w-full pl-8 pr-16 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 focus:bg-slate-900 light:bg-slate-100 light:hover:bg-slate-200/80 light:focus:bg-white border border-slate-800 focus:border-emerald-500/60 light:border-slate-300 light:focus:border-emerald-600 text-slate-200 light:text-slate-800 text-xs placeholder-slate-500 focus:outline-none transition-all shadow-inner font-mono font-medium"
            />
            {isSearching ? (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
            <kbd
              onClick={(e) => {
                e.stopPropagation();
                onOpenCommandPalette();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-800 light:bg-white rounded text-[9px] font-mono text-slate-400 light:text-slate-500 border border-slate-700 light:border-slate-300 cursor-pointer hover:border-emerald-500/50"
              title="Open Global Command Palette (Ctrl+K)"
            >
              Ctrl+K
            </kbd>
          </form>

          {/* Autocomplete / Suggestions Dropdown */}
          {isSearchOpen && cleanQuery.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900/95 light:bg-white border border-slate-700/80 light:border-slate-300 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-md animate-fade-in divide-y divide-slate-800/60 light:divide-slate-200">
              {/* Existing Database Tickers Matching Query */}
              {matchingTickers.length > 0 && (
                <div className="p-1">
                  <div className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider px-2.5 py-1">
                    Database Tickers ({matchingTickers.length})
                  </div>
                  {matchingTickers.map((t) => (
                    <div
                      key={t.symbol}
                      onClick={() => handleSelectTicker(t.symbol)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 light:hover:bg-slate-100 cursor-pointer transition-colors text-xs group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-400 light:text-teal-600 bg-slate-950 light:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-800 light:border-slate-300 text-[11px]">
                          {t.symbol}
                        </span>
                        <span className="text-slate-200 light:text-slate-700 truncate max-w-[140px] text-xs">
                          {t.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono">
                        <span className="text-slate-300 light:text-slate-600 font-semibold">
                          ${t.spot_price?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-slate-500 light:text-slate-400 group-hover:text-emerald-400 transition-colors">
                          ↵ Card
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dynamic New Ticker Fetch Option (if not exact match or enter pressed) */}
              {!hasExactUniverseMatch && cleanQuery.length <= 8 && (
                <div className="p-1.5 bg-emerald-950/20 light:bg-emerald-50/50">
                  <div
                    onClick={() => handleSelectTicker(cleanQuery)}
                    className="flex items-center justify-between p-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 light:text-teal-800 cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <span>{`Fetch & Render "${cleanQuery}"`}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            New Symbol
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 light:text-slate-500">
                          Fetch live quote, 20-SMA, Bollinger, RSI &amp; open Equity Card
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded shrink-0">
                      Enter ↵
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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

          {/* DCF Valuation & DuPont Terminal Quick Launch */}
          {onOpenValuation && (
            <button
              onClick={onOpenValuation}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer whitespace-nowrap shadow-sm group"
              title="Open DCF Intrinsic Valuation, DuPont Decomposition & ATR Risk Terminal (v3.4)"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>DCF Valuation</span>
            </button>
          )}

          {/* Dedicated Equity Analysis (Equity Card) Menu Button */}
          {onOpenEquityAnalysis && (
            <button
              onClick={() => onOpenEquityAnalysis()}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/50 shadow-md shadow-blue-900/40 hover:shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap group ring-1 ring-blue-400/30"
              title="Open Comprehensive Equity Analysis Card (Technicals, Options, Analyst Ratings, News, DuPont DCF)"
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-200 group-hover:scale-110 transition-transform" />
              <span>Equity Analysis</span>
            </button>
          )}

          {/* Portfolio Health Pulse Badge (Super-Admin Frank Only) */}
          {isAdmin && onOpenExecutiveDigest && (
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

          {/* Client Tenant Status Badge */}
          {!isAdmin && isAuthenticated && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Client Workspace Active</span>
            </div>
          )}

          {/* Tradier API Settings (Primary) */}
          <button
            onClick={onOpenTradier}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
              isTradierActive
                ? 'border-emerald-500/40 text-emerald-300 hover:border-emerald-400/70 shadow-emerald-500/10'
                : 'border-slate-700/80 text-slate-400 hover:border-slate-600 hover:text-slate-300'
            }`}
            title={
              isTradierActive
                ? 'Tradier API Active (Primary Live Market Data & Options Chains)'
                : 'Configure Tradier API Key (Primary Provider Unconfigured)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isTradierActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>Tradier API</span>
            <span
              className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                isTradierActive
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isTradierActive ? 'Primary' : 'Off'}
            </span>
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

          {/* Direct Admin Console Quick-Action */}
          {isAuthenticated && isAdmin && (
            <button
              onClick={() => (onNavigateTo ? onNavigateTo('ADMIN_USERS') : (window.location.href = '/admin/users'))}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 hover:text-white transition-all cursor-pointer shadow-sm shadow-purple-900/30"
              title="Open Admin User Console to provision and manage logins"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Admin Console</span>
            </button>
          )}

          {/* User Account / Tenant Profile Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 hover:border-emerald-400 transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                title={`User Session: ${user.role}`}
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[85px] truncate text-slate-100">{user.role === 'ADMIN' ? 'Admin' : (user.displayName || user.email.split('@')[0])}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-600/40'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  }`}
                >
                  {user.role}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 p-2 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 text-xs space-y-1 font-sans animate-fade-in">
                  <div className="px-2.5 py-2 border-b border-slate-800 text-[11px]">
                    <div className="font-bold text-white truncate">{user.displayName}</div>
                    <div className="text-slate-400 font-mono truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigateTo ? onNavigateTo('DASHBOARD') : (window.location.href = '/dashboard');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Private Workspace</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigateTo ? onNavigateTo('ADMIN_USERS') : (window.location.href = '/admin/users');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-purple-300 hover:text-purple-200 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Admin User Console</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigateTo ? onNavigateTo('SETTINGS_PASSWORD') : (window.location.href = '/settings/password');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-cyan-300 hover:text-cyan-200 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Change Password</span>
                  </button>
                  <div className="border-t border-slate-800 pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => (onNavigateTo ? onNavigateTo('LOGIN') : (window.location.href = '/login'))}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white shadow-sm shadow-emerald-950/40 transition-all cursor-pointer"
              title="Sign In to DeltaHarvest Account or Admin Console"
            >
              <User className="w-3.5 h-3.5" />
              <span>Admin / Sign In</span>
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
