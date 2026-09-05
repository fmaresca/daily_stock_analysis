import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  X,
  TrendingUp,
  BarChart2,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Star,
  Flame,
  ShieldCheck,
  Calendar,
  Layers,
  Printer,
  Key,
  Zap,
  BrainCircuit,
  DollarSign,
  Award,
} from './icons';
import { TickerMeta, MenuTreeType, EquitiesTabType, OptionsTabType } from '../types/options';
import { getSecurityIntelligence } from '../utils/securityIntelligence';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: TickerMeta[];
  onSelectTicker: (ticker: TickerMeta) => void;
  onNavigateTree: (tree: MenuTreeType, tab?: EquitiesTabType | OptionsTabType) => void;
  onOpenHelp: () => void;
  onOpenWatchlist: () => void;
  onOpenReports: () => void;
  onOpenSchwab?: () => void;
  onOpenDiagnostics?: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onTriggerPrint: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tickers,
  onSelectTicker,
  onNavigateTree,
  onOpenHelp,
  onOpenWatchlist,
  onOpenReports,
  onOpenSchwab,
  onOpenDiagnostics,
  onExportCSV,
  onExportExcel,
  onTriggerPrint,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : undefined;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search Results
  const matchingTickers = tickers
    .filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.sector.toLowerCase().includes(q)
    )
    .slice(0, 6);

  const actions = [
    {
      id: 'nav-equities',
      title: 'US Equities Technical Screener',
      subtitle: 'Technical screener, 20D SMA, Bollinger Bands, and RSI',
      icon: <BarChart2 className="w-4 h-4 text-blue-400" />,
      action: () => {
        onNavigateTree('EQUITIES', 'TECHNICAL_SCREENER');
        onClose();
      },
    },
    {
      id: 'nav-weekly-screeners',
      title: 'Weekly Stock Screeners (Barchart Top 1% Signals)',
      subtitle: 'Direction strength signals, 13-indicator technical consensus & weekly options candidates',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTree('EQUITIES', 'WEEKLY_STOCK_SCREENERS');
        onClose();
      },
    },
    {
      id: 'nav-charts',
      title: 'Interactive Technical Charts',
      subtitle: 'TradingView Lightweight Candlestick charts with Bollinger Bands and strike overlays',
      icon: <BarChart2 className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigateTree('EQUITIES', 'INTERACTIVE_CHARTS');
        onClose();
      },
    },
    {
      id: 'nav-fundamentals',
      title: 'Fundamental Solvency & CEF Audit',
      subtitle: 'Altman Z-Score bankruptcy risk, Piotroski F-Score & CEF discount/premium Z-scores',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTree('EQUITIES', 'FUNDAMENTAL_HEALTH');
        onClose();
      },
    },
    {
      id: 'nav-weekly-cash-ledger',
      title: 'Step 1: Cash, Disbursements & YTD Tax Ledger',
      subtitle: 'Liquid cash balance, $5k living expense deduction, CSP collateral, and True Deployable Free Cash',
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTree('WORKFLOW', 'WEEKLY_CASH_LEDGER');
        onClose();
      },
    },
    {
      id: 'nav-holdings-covered-calls',
      title: 'Step 2: Holdings & 20Δ Covered Calls Suggester',
      subtitle: 'Long stock inventory, uncovered shares (≥100) detection, 20-Delta call generation, and CSP monitor',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTree('WORKFLOW', 'HOLDINGS_COVERED_CALLS');
        onClose();
      },
    },
    {
      id: 'nav-weekly-executive-report',
      title: 'Step 5: Weekly Executive Master Report',
      subtitle: 'Consolidated master tabular report with CSV export and Print-to-PDF format',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTree('WORKFLOW', 'WEEKLY_EXECUTIVE_REPORT');
        onClose();
      },
    },
    {
      id: 'nav-weekly-audit',
      title: 'End-of-Week Position Audit & Capital Center',
      subtitle: 'Evaluate open CSPs, covered calls, 80% profit rules, threatened strikes, and cash ledger',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTree('WORKFLOW', 'WEEKLY_POSITION_AUDIT');
        onClose();
      },
    },
    {
      id: 'nav-cascading-screener',
      title: 'Cascading Options Screener (15Δ–25Δ & Cash Gate)',
      subtitle: 'Multi-stage funnel: Quality → IVR → 15-25Δ → $15k/pos Cash Gate → Gemini Thinking',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTree('WORKFLOW', 'CASCADING_SCREENER');
        onClose();
      },
    },
    {
      id: 'nav-options',
      title: 'Options Weekly Income Screener',
      subtitle: 'Conservative 0.15-0.20 Delta Cash-Secured Puts & Covered Calls',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'INCOME_SCREENER');
        onClose();
      },
    },
    {
      id: 'nav-ai-options-income',
      title: 'Options Income Screener (AI Extended Thinking)',
      subtitle: 'Institutional quantitative reasoning using Gemini Thinking Mode (HIGH) for CSPs and CCs',
      icon: <BrainCircuit className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'AI_OPTIONS_INCOME');
        onClose();
      },
    },
    {
      id: 'nav-economic-calendar',
      title: 'Weekly US Economic Indicators & Macro Catalysts',
      subtitle: 'USD macro releases, ET timestamps, sector transmission channels & proxy ETFs (Forex Factory feed)',
      icon: <Calendar className="w-4 h-4 text-blue-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'ECONOMIC_CALENDAR');
        onClose();
      },
    },
    {
      id: 'nav-spreads',
      title: 'Multi-Leg Spreads & Iron Condors',
      subtitle: 'Bull Put Spreads, Bear Call Spreads, and Iron Condors with defined risk',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'MULTI_LEG_SPREADS');
        onClose();
      },
    },
    {
      id: 'nav-skew',
      title: 'Volatility Skew & Term Structure Radar',
      subtitle: '25-Delta Put/Call Volatility Skew and 7D-90D Term Structure Slope',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'VOLATILITY_SKEW');
        onClose();
      },
    },
    {
      id: 'nav-backtest',
      title: 'Strategy Backtest & Margin Stress Test',
      subtitle: 'Historical equity curves, win rates, and FINRA 4210 Reg-T vs Portfolio Margin',
      icon: <BarChart2 className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'BACKTEST_MARGIN');
        onClose();
      },
    },
    {
      id: 'nav-staging',
      title: 'Broker Order Staging & Execution Payloads',
      subtitle: 'Generate bracket orders for Charles Schwab API, IBKR BasketTrader, and Thinkorswim',
      icon: <Zap className="w-4 h-4 text-rose-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'BROKER_STAGING');
        onClose();
      },
    },
    {
      id: 'nav-calculator',
      title: 'Compound Yield & Income Calculator',
      subtitle: 'Simulate weekly option harvesting returns and cash collateral growth',
      icon: <TrendingUp className="w-4 h-4 text-teal-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'INCOME_CALCULATOR');
        onClose();
      },
    },
    {
      id: 'nav-cadence',
      title: 'Expiration Cadence & CBOE Registry',
      subtitle: 'Filter Weeklys vs Monthly-only cycles across universe',
      icon: <Layers className="w-4 h-4 text-teal-400" />,
      action: () => {
        onNavigateTree('OPTIONS', 'EXPIRATION_CADENCE');
        onClose();
      },
    },
    {
      id: 'action-watchlist',
      title: 'Manage Watchlists (Add / Bulk Paste)',
      subtitle: 'Build, edit, and import custom watchlists via CSV/Excel',
      icon: <Star className="w-4 h-4 text-amber-400" />,
      action: () => {
        onOpenWatchlist();
        onClose();
      },
    },
    {
      id: 'action-reports',
      title: 'Report Query Builder & Exports',
      subtitle: 'Generate and filter executive reports for CSV, Excel, and PDF',
      icon: <FileText className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onOpenReports();
        onClose();
      },
    },
    {
      id: 'action-diagnostics',
      title: '⚡ Automated API Self-Test & Diagnostics Suite',
      subtitle: 'Probe live endpoints for Schwab API, Yahoo tick stream, Polymarket, and StockTwits',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      action: () => {
        if (onOpenDiagnostics) onOpenDiagnostics();
        onClose();
      },
    },
    {
      id: 'action-schwab',
      title: 'Charles Schwab API Provisioning & Settings',
      subtitle: 'Configure retail developer App Key, Secret, and OAuth tokens',
      icon: <Key className="w-4 h-4 text-blue-400" />,
      action: () => {
        if (onOpenSchwab) onOpenSchwab();
        onClose();
      },
    },
    {
      id: 'action-export-excel',
      title: 'Export to Excel (.xlsx)',
      subtitle: 'Download multi-sheet formatted workbook with full dataset',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onExportExcel();
        onClose();
      },
    },
    {
      id: 'action-export-csv',
      title: 'Export to CSV',
      subtitle: 'Download tabular equities & options data',
      icon: <FileText className="w-4 h-4 text-slate-300" />,
      action: () => {
        onExportCSV();
        onClose();
      },
    },
    {
      id: 'action-print-pdf',
      title: 'Print / Save Report as PDF',
      subtitle: 'Format printable executive summary view',
      icon: <Printer className="w-4 h-4 text-purple-400" />,
      action: () => {
        onTriggerPrint();
        onClose();
      },
    },
    {
      id: 'action-help',
      title: 'Help & Strategy Handbook (?)',
      subtitle: 'Audit rules, Greeks cheat sheet, Polymarket sentiment, and Liquidity tiers',
      icon: <HelpCircle className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onOpenHelp();
        onClose();
      },
    },
  ].filter((a) => !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q));

  const totalItems = matchingTickers.length + actions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < matchingTickers.length) {
        const item = matchingTickers[selectedIndex];
        if (item) {
          onSelectTicker(item);
          onClose();
        }
      } else {
        const actionIdx = selectedIndex - matchingTickers.length;
        const act = actions[actionIdx];
        if (act) act.action();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/60">
          <Command className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tickers, strategies, actions, or help topics (Ctrl+K)..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4 flex-1">
          {/* Tickers Section */}
          {matchingTickers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
                <span>Equities &amp; Tickers</span>
                <span className="font-mono">{matchingTickers.length} results</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchingTickers.map((t, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={t.symbol}
                      onClick={() => {
                        onSelectTicker(t);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-600/20 text-white border border-emerald-500/40'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-white text-xs border border-slate-700">
                          {t.symbol}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white">{t.name}</div>
                          <div className="text-[11px] text-slate-400">{t.sector}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-right">
                        <div>
                          <div className="font-mono font-bold text-xs text-slate-200">
                            ${t.spot_price.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400">IVR: {t.iv_rank}%</div>
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            getSecurityIntelligence(t.symbol, t).compositeScore >= 80
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {getSecurityIntelligence(t.symbol, t).compositeScore}/100
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            t.has_weeklys === false
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {t.has_weeklys === false ? 'Monthly' : 'Weekly'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions & Navigation Section */}
          {actions.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                <span>Quick Actions &amp; Navigation</span>
              </div>
              <div className="space-y-1 mt-1">
                {actions.map((act, idx) => {
                  const globalIdx = matchingTickers.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  return (
                    <div
                      key={act.id}
                      onClick={act.action}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 text-white border border-blue-500/40'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                        {act.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-white">{act.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{act.subtitle}</div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">↵ Run</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {totalItems === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm font-medium text-slate-400">No matching tickers or actions found</p>
              <p className="text-xs mt-1">Try typing a ticker symbol like "SPY" or an action like "Excel"</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <div>DeltaHarvest Command Radar</div>
        </div>
      </div>
    </div>
  );
};
