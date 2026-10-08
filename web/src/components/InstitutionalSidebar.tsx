import React, { useState } from 'react';
import {
  MenuTreeType,
  EquitiesTabType,
  OptionsTabType,
} from '../types/options';
import { DeltaHarvestLogo } from './ui/DeltaHarvestLogo';
import {
  LayoutDashboard,
  Briefcase,
  Sliders,
  BarChart2,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Zap,
  Star,
  Bell,
  HelpCircle,
  BrainCircuit,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  DollarSign,
  Activity,
  User,
  Users,
  LogOut,
  Lock,
  Calendar,
} from './icons';
import { useAuth } from '../context/AuthContext';

interface InstitutionalSidebarProps {
  activeTree: MenuTreeType;
  onSelectTree: (tree: MenuTreeType) => void;
  activeEquitiesTab: EquitiesTabType;
  onSelectEquitiesTab: (tab: EquitiesTabType) => void;
  activeOptionsTab: OptionsTabType;
  onSelectOptionsTab: (tab: OptionsTabType) => void;
  totalTickersCount: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenSimulator?: () => void;
  onOpenValuation?: () => void;
  onOpenEquityAnalysis?: (symbol?: string) => void;
  onOpenWatchlists?: () => void;
  onOpenReports?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenTradier?: () => void;
  onOpenSchwab?: () => void;
  onOpenAlerts?: () => void;
  onOpenHelp?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  freeCashAmount?: number;
}

export const InstitutionalSidebar: React.FC<InstitutionalSidebarProps> = ({
  activeTree,
  onSelectTree,
  activeEquitiesTab,
  onSelectEquitiesTab,
  activeOptionsTab,
  onSelectOptionsTab,
  totalTickersCount,
  theme = 'dark',
  onToggleTheme,
  onOpenSimulator,
  onOpenValuation,
  onOpenEquityAnalysis,
  onOpenWatchlists,
  onOpenReports,
  onOpenDiagnostics,
  onOpenTradier,
  onOpenSchwab,
  onOpenAlerts,
  onOpenHelp,
  isMobileOpen = false,
  onCloseMobile,
  freeCashAmount: _freeCashAmount,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Helper for active styling with accessible focus rings
  const getItemClasses = (isActive: boolean) =>
    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
      isActive
        ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white font-bold shadow-lg shadow-emerald-600/20 border border-emerald-400/40'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 border border-transparent'
    }`;

  const getSubItemClasses = (isActive: boolean) =>
    `flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
      isActive
        ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Top Header / Logo Section */}
      <div className="p-4 border-b border-slate-800/80 light:border-slate-200 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2">
            <DeltaHarvestLogo variant="header" theme={theme} size={32} />
          </div>
        ) : (
          <div className="mx-auto">
            <DeltaHarvestLogo variant="mark" theme={theme} size={28} />
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 light:hover:bg-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Items Organised Across 6 Canonical Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* GROUP 1: Weekend Ritual (The 7-Step Workflow) */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 light:text-emerald-700 px-3 mb-1.5">
              <span>Weekend Ritual</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                7 Steps
              </span>
            </div>
          )}
          <nav className="space-y-0.5">
            {/* Primary Stepper Button */}
            <button
              onClick={() => {
                onSelectTree('WORKFLOW');
                if (
                  activeOptionsTab !== 'SCHWAB_POSITIONS_UPLOAD' &&
                  activeOptionsTab !== 'WEEKLY_CASH_LEDGER' &&
                  activeOptionsTab !== 'HOLDINGS_COVERED_CALLS' &&
                  activeOptionsTab !== 'ECONOMIC_CALENDAR' &&
                  activeOptionsTab !== 'CASCADING_SCREENER' &&
                  activeOptionsTab !== 'WEEKLY_EXECUTIVE_REPORT' &&
                  activeOptionsTab !== 'BROKER_STAGING'
                ) {
                  onSelectOptionsTab('SCHWAB_POSITIONS_UPLOAD');
                }
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'WORKFLOW')} w-full`}
              title="Guided 7-step weekend portfolio routine from Schwab CSV to broker staging"
              aria-label="Workflow Ritual"
              aria-current={activeTree === 'WORKFLOW' ? 'true' : undefined}
            >
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Workflow Ritual</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      7 Steps
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Guided 7-step weekly routine
                  </div>
                </div>
              )}
            </button>

            {/* 7-Step Expanded Sub-Navigation Stepper */}
            {activeTree === 'WORKFLOW' && !isCollapsed && (
              <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-emerald-500/30 ml-3 my-1">
                {/* Step 1 */}
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('SCHWAB_POSITIONS_UPLOAD');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'SCHWAB_POSITIONS_UPLOAD')} w-full text-left`}
                  title="Import your Schwab account positions and cash balances from CSV."
                  aria-label="1. Upload Positions"
                  aria-current={activeOptionsTab === 'SCHWAB_POSITIONS_UPLOAD' ? 'true' : undefined}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">1</span>
                  <div className="truncate min-w-0">
                    <span className="truncate block font-medium">1. Upload Positions</span>
                    <span className="text-[9px] text-slate-500 block">Schwab CSV Import</span>
                  </div>
                </button>
                {/* Step 2 */}
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('WEEKLY_CASH_LEDGER');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'WEEKLY_CASH_LEDGER')} w-full text-left`}
                  title="Calculate deployable cash after deducting living expenses and tax liabilities."
                  aria-label="2. Cash & Tax Ledger"
                  aria-current={activeOptionsTab === 'WEEKLY_CASH_LEDGER' ? 'true' : undefined}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">2</span>
                  <div className="truncate min-w-0">
                    <span className="truncate block font-medium">2. Cash &amp; Tax Ledger</span>
                    <span className="text-[9px] text-slate-500 block">Living &amp; Loss Carryforward</span>
                  </div>
                </button>
                {/* Step 3 */}
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('HOLDINGS_COVERED_CALLS');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'HOLDINGS_COVERED_CALLS')} w-full text-left`}
                  title="Review stock holdings for 80% profit alerts and safe covered calls."
                  aria-label="3. Holdings & Covered Calls"
                  aria-current={activeOptionsTab === 'HOLDINGS_COVERED_CALLS' ? 'true' : undefined}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">3</span>
                  <div className="truncate min-w-0">
                    <span className="truncate block font-medium">3. Holdings &amp; Covered Calls</span>
                    <span className="text-[9px] text-slate-500 block">80% Profit &amp; 20Δ Radar</span>
                  </div>
                </button>
                {/* Step 4 */}
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('ECONOMIC_CALENDAR');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'ECONOMIC_CALENDAR')} w-full text-left`}
                  title="Check upcoming high-impact economic events and Fed announcements this week."
                  aria-label="4. Economic Calendar"
                  aria-current={activeOptionsTab === 'ECONOMIC_CALENDAR' ? 'true' : undefined}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">4</span>
                  <div className="truncate min-w-0">
                    <span className="truncate block font-medium">4. Economic Calendar</span>
                    <span className="text-[9px] text-slate-500 block">High-Impact USD Macro</span>
                  </div>
                </button>
                {/* Step 5 */}
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('CASCADING_SCREENER');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'CASCADING_SCREENER')} w-full text-left`}
                  title="Run the 3-stage quantitative funnel and generate AI trade ideas."
                  aria-label="5. Weekly Shortlist Screener"
                  aria-current={activeOptionsTab === 'CASCADING_SCREENER' ? 'true' : undefined}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">5</span>
                  <div className="truncate min-w-0">
                    <span className="truncate block font-medium">5. Weekly Shortlist Screener</span>
                    <span className="text-[9px] text-slate-500 block">15Δ–25Δ Funnel &amp; AI</span>
                  </div>
                </button>
                {/* Step 6 */}
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('WEEKLY_EXECUTIVE_REPORT');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'WEEKLY_EXECUTIVE_REPORT')} w-full text-left`}
                  title="Generate weekly compliance health score, theta income, and PDF summary."
                  aria-label="6. Executive Report"
                  aria-current={activeOptionsTab === 'WEEKLY_EXECUTIVE_REPORT' ? 'true' : undefined}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">6</span>
                  <div className="truncate min-w-0">
                    <span className="truncate block font-medium">6. Executive Report</span>
                    <span className="text-[9px] text-slate-500 block">Compliance &amp; Theta Pulse</span>
                  </div>
                </button>
                {/* Step 7 */}
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('BROKER_STAGING');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'BROKER_STAGING')} w-full text-left`}
                  title="Review and prepare final trade orders before placing them at broker."
                  aria-label="7. Order Staging"
                  aria-current={activeOptionsTab === 'BROKER_STAGING' ? 'true' : undefined}
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">7</span>
                  <div className="truncate min-w-0">
                    <span className="truncate block font-medium">7. Order Staging</span>
                    <span className="text-[9px] text-slate-500 block">Broker Staging &amp; Execution</span>
                  </div>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* GROUP 2: My Money (Workspace, Portfolio, Watchlists, Staging, Reports) */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 light:text-slate-700 px-3 mb-1.5">
              My Money
            </div>
          )}
          <nav className="space-y-0.5">
            {/* My Workspace (Single Canonical Entry Point) */}
            <button
              onClick={() => {
                onSelectTree('DASHBOARD');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'DASHBOARD')} w-full`}
              title="View your private portfolio, personal trade log, and custom watchlists."
              aria-label="My Workspace"
              aria-current={activeTree === 'DASHBOARD' ? 'true' : undefined}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">My Workspace</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      Portfolio
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Personal Portfolio &amp; Trades
                  </div>
                </div>
              )}
            </button>

            {/* Investment Portfolio (Admin Only - KEEP owner-chosen) */}
            {isAdmin && (
              <button
                onClick={() => {
                  onSelectTree('OPTIONS');
                  onSelectOptionsTab('EXECUTIVE_DIGEST');
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(
                  activeTree === 'OPTIONS' &&
                    (activeOptionsTab === 'EXECUTIVE_DIGEST' ||
                      activeOptionsTab === 'WEEKLY_POSITION_AUDIT' ||
                      activeOptionsTab === 'WEEKLY_CASH_LEDGER')
                )} w-full`}
                title="Review overall capital allocation across cash, equities, and options positions."
                aria-label="Investment Portfolio"
                aria-current={
                  activeTree === 'OPTIONS' && activeOptionsTab === 'EXECUTIVE_DIGEST' ? 'true' : undefined
                }
              >
                <Briefcase className="w-4 h-4 text-teal-400 shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">Investment Portfolio</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                      Executive Capital Digest
                    </div>
                  </div>
                )}
              </button>
            )}

            {/* Watchlists */}
            {onOpenWatchlists && (
              <button
                onClick={() => {
                  onOpenWatchlists();
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(false)} w-full`}
                title="Create and manage custom stock lists to monitor across the app."
                aria-label="Watchlists"
              >
                <Star className="w-4 h-4 text-amber-400 shrink-0" filled />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">Watchlists</span>
                    </div>
                    <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                      Custom Ticker Groups
                    </div>
                  </div>
                )}
              </button>
            )}

            {/* Order Staging Workbench (Single Canonical Entry Point) */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onSelectOptionsTab('BROKER_STAGING');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'OPTIONS' && activeOptionsTab === 'BROKER_STAGING')} w-full`}
              title="Review, adjust, and stage bracket orders ready for broker execution."
              aria-label="Order Staging"
              aria-current={activeTree === 'OPTIONS' && activeOptionsTab === 'BROKER_STAGING' ? 'true' : undefined}
            >
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Order Staging</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Broker Execution Workbench
                  </div>
                </div>
              )}
            </button>

            {/* Reports & Exports */}
            {onOpenReports && (
              <button
                onClick={() => {
                  onOpenReports();
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(false)} w-full`}
                title="Generate custom query reports, transaction audit logs, and spreadsheet exports."
                aria-label="Reports & Exports"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">Reports &amp; Exports</span>
                    </div>
                    <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                      PDF, CSV &amp; Audit Logs
                    </div>
                  </div>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* GROUP 3: Research (Stock Screener, Income Screener, Charts, Calendars, Fundamentals) */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 light:text-slate-700 px-3 mb-1.5">
              Research
            </div>
          )}
          <nav className="space-y-0.5">
            {/* Stock Screener */}
            <button
              onClick={() => {
                onSelectTree('EQUITIES');
                onSelectEquitiesTab('TECHNICAL_SCREENER');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(
                activeTree === 'EQUITIES' &&
                  (activeEquitiesTab === 'TECHNICAL_SCREENER' || activeEquitiesTab === 'WEEKLY_STOCK_SCREENERS')
              )} w-full`}
              title="Scan US stocks by price, trend, moving averages, and volume."
              aria-label="Stock Screener"
              aria-current={
                activeTree === 'EQUITIES' && activeEquitiesTab === 'TECHNICAL_SCREENER' ? 'true' : undefined
              }
            >
              <BarChart2 className="w-4 h-4 text-blue-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Stock Screener</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {totalTickersCount}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Technical &amp; Trend Filters
                  </div>
                </div>
              )}
            </button>

            {/* Ask Strategy Agent */}
            <button
              onClick={() => {
                onSelectTree('AGENT_CHAT');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'AGENT_CHAT')} w-full`}
              title="Conversational quantitative strategy assistant. Ask about any stock under 8 strategy lenses."
              aria-label="Ask Strategy Agent"
              aria-current={activeTree === 'AGENT_CHAT' ? 'true' : undefined}
            >
              <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Ask Strategy Agent</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      AI
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    8 Strategy Lenses &amp; Q&amp;A
                  </div>
                </div>
              )}
            </button>

            {/* Find Income Trades (Options Income Screener) */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onSelectOptionsTab('INCOME_SCREENER');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'OPTIONS' && activeOptionsTab === 'INCOME_SCREENER')} w-full`}
              title="Scan conservative options selling trades with high probability of profit."
              aria-label="Find Income Trades"
              aria-current={activeTree === 'OPTIONS' && activeOptionsTab === 'INCOME_SCREENER' ? 'true' : undefined}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Find Income Trades</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Cash-Secured Puts &amp; CCs
                  </div>
                </div>
              )}
            </button>

            {/* Interactive Charts */}
            <button
              onClick={() => {
                onSelectTree('EQUITIES');
                onSelectEquitiesTab('INTERACTIVE_CHARTS');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'EQUITIES' && activeEquitiesTab === 'INTERACTIVE_CHARTS')} w-full`}
              title="Analyze candlestick price charts with technical indicators and support levels."
              aria-label="Interactive Charts"
              aria-current={activeTree === 'EQUITIES' && activeEquitiesTab === 'INTERACTIVE_CHARTS' ? 'true' : undefined}
            >
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Interactive Charts</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Candlesticks &amp; 20-SMA
                  </div>
                </div>
              )}
            </button>

            {/* Market Calendars (Economic & Catalysts) */}
            <button
              onClick={() => {
                onSelectTree('EQUITIES');
                onSelectEquitiesTab('ECONOMIC_CALENDAR');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'EQUITIES' && activeEquitiesTab === 'ECONOMIC_CALENDAR')} w-full`}
              title="Track key macroeconomic release dates and market-moving catalyst events."
              aria-label="Economic Calendar"
              aria-current={activeTree === 'EQUITIES' && activeEquitiesTab === 'ECONOMIC_CALENDAR' ? 'true' : undefined}
            >
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Economic Calendar</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    High-Impact USD Macro
                  </div>
                </div>
              )}
            </button>

            {/* Company Health & SEC Filings */}
            <button
              onClick={() => {
                onSelectTree('EQUITIES');
                onSelectEquitiesTab('FUNDAMENTAL_HEALTH');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'EQUITIES' && activeEquitiesTab === 'FUNDAMENTAL_HEALTH')} w-full`}
              title="Examine company balance sheets, valuation ratios, and official SEC filings."
              aria-label="Company Health & SEC Filings"
              aria-current={activeTree === 'EQUITIES' && activeEquitiesTab === 'FUNDAMENTAL_HEALTH' ? 'true' : undefined}
            >
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Company Health &amp; SEC</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    SEC EDGAR &amp; Altman Z
                  </div>
                </div>
              )}
            </button>

            {/* Dedicated Equity Analysis Card Trigger */}
            {onOpenEquityAnalysis && (
              <button
                onClick={() => {
                  onOpenEquityAnalysis();
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(false)} w-full text-blue-300 hover:text-white group`}
                title="Open deep-dive audit of technicals, options, news, and intrinsic value."
                aria-label="Equity Analysis Card"
              >
                <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">Equity Analysis Card</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Card
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                      Multi-Factor Ticker Audit
                    </div>
                  </div>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* GROUP 4: Tools (Simulator, Valuation, Tax, Roll Assistant, Margin) */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 light:text-slate-700 px-3 mb-1.5">
              Tools
            </div>
          )}
          <nav className="space-y-0.5">
            {/* Options Trade Quality Simulator */}
            {onOpenSimulator && (
              <button
                onClick={() => {
                  onOpenSimulator();
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(false)} w-full`}
                title="Simulate option trade outcomes, expiration payoffs, and downside risk."
                aria-label="Trade Simulator"
              >
                <Zap className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">Trade Simulator</span>
                    </div>
                    <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                      100-Point Scoring Model
                    </div>
                  </div>
                )}
              </button>
            )}

            {/* DCF Valuation & DuPont Terminal (v3.4) */}
            {onOpenValuation && (
              <button
                onClick={() => {
                  onOpenValuation();
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(false)} w-full`}
                title="Calculate intrinsic stock value using discounted cash flows and DuPont ratios."
                aria-label="Valuation Terminal"
              >
                <DollarSign className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">Valuation Terminal</span>
                    </div>
                    <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                      DCF &amp; DuPont ROE v3.4
                    </div>
                  </div>
                )}
              </button>
            )}

            {/* Section 1256 Tax Alpha Optimizer (Single Canonical Entry Point) */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onSelectOptionsTab('TAX_ALPHA_OPTIMIZER');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(
                activeTree === 'OPTIONS' && activeOptionsTab === 'TAX_ALPHA_OPTIMIZER'
              )} w-full`}
              title="Maximize tax efficiency using index options rules and loss harvesting."
              aria-label="Tax Optimizer"
              aria-current={
                activeTree === 'OPTIONS' && activeOptionsTab === 'TAX_ALPHA_OPTIMIZER' ? 'true' : undefined
              }
            >
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Tax Optimizer</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Section 1256 &amp; 60/40 Rule
                  </div>
                </div>
              )}
            </button>

            {/* Defensive Rolling Assistant (Single Canonical Entry Point) */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onSelectOptionsTab('DEFENSIVE_ROLL_ASSISTANT');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(
                activeTree === 'OPTIONS' && activeOptionsTab === 'DEFENSIVE_ROLL_ASSISTANT'
              )} w-full`}
              title="Find algorithmic roll adjustments for threatened positions to collect credits."
              aria-label="Roll Assistant"
              aria-current={
                activeTree === 'OPTIONS' && activeOptionsTab === 'DEFENSIVE_ROLL_ASSISTANT' ? 'true' : undefined
              }
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Roll Assistant</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Defensive Rolling &amp; Repair
                  </div>
                </div>
              )}
            </button>

            {/* Margin Stress Simulator */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onSelectOptionsTab('PORTFOLIO_MARGIN_SIM');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(
                activeTree === 'OPTIONS' && activeOptionsTab === 'PORTFOLIO_MARGIN_SIM'
              )} w-full`}
              title="Stress-test portfolio margin requirements against simulated 15% market crashes."
              aria-label="Margin Stress Simulator"
              aria-current={
                activeTree === 'OPTIONS' && activeOptionsTab === 'PORTFOLIO_MARGIN_SIM' ? 'true' : undefined
              }
            >
              <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Margin Stress Simulator</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    FINRA 4210 TIMS ±15%
                  </div>
                </div>
              )}
            </button>
          </nav>
        </div>

        {/* GROUP 5: Learn (Handbook, Methodology, FAQ, Disclaimers) */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 light:text-slate-700 px-3 mb-1.5">
              Learn
            </div>
          )}
          <nav className="space-y-0.5">
            {/* Strategy Handbook */}
            {onOpenHelp && (
              <button
                onClick={() => {
                  onOpenHelp();
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(false)} w-full`}
                title="Browse comprehensive platform chapters explaining trading rules and systems."
                aria-label="Strategy Handbook"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">Strategy Handbook</span>
                    </div>
                    <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                      16 Institutional Chapters
                    </div>
                  </div>
                )}
              </button>
            )}

            {/* Quantitative Methodology */}
            <button
              onClick={() => {
                onSelectTree('METHODOLOGY');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'METHODOLOGY')} w-full`}
              title="Read mathematical formulas, Black-Scholes models, and cash management rules."
              aria-label="Methodology"
              aria-current={activeTree === 'METHODOLOGY' ? 'true' : undefined}
            >
              <BrainCircuit className="w-4 h-4 text-teal-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Methodology</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Black-Scholes &amp; Cash Rules
                  </div>
                </div>
              )}
            </button>

            {/* Investor FAQ */}
            <button
              onClick={() => {
                onSelectTree('FAQ');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'FAQ')} w-full`}
              title="Find clear answers to common questions about conservative options income."
              aria-label="Investor FAQ"
              aria-current={activeTree === 'FAQ' ? 'true' : undefined}
            >
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Investor FAQ</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Plain-English Q&amp;A
                  </div>
                </div>
              )}
            </button>

            {/* Regulatory Disclaimers */}
            <button
              onClick={() => {
                onSelectTree('DISCLAIMER');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'DISCLAIMER')} w-full`}
              title="Review regulatory risk disclosures, options disclosures, and terms of service."
              aria-label="Disclaimers"
              aria-current={activeTree === 'DISCLAIMER' ? 'true' : undefined}
            >
              <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Disclaimers</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Regulatory &amp; Risk Disclosures
                  </div>
                </div>
              )}
            </button>
          </nav>
        </div>

        {/* GROUP 6: Administration (Admin Console, Change Password - Clean Role-Gated) */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 light:text-purple-700 px-3 mb-1.5">
              <span>Administration</span>
              <span className="px-1.5 py-0.2 bg-purple-950/60 text-purple-300 border border-purple-800/40 rounded text-[9px]">
                RBAC
              </span>
            </div>
          )}
          <nav className="space-y-0.5">
            {/* Admin Console (Visible only to Administrator) */}
            {isAdmin && (
              <button
                onClick={() => {
                  onSelectTree('ADMIN_USERS');
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(activeTree === 'ADMIN_USERS')} w-full`}
                title="Manage multi-tenant accounts, provision new logins, and reset passwords."
                aria-label="Admin Console"
                aria-current={activeTree === 'ADMIN_USERS' ? 'true' : undefined}
              >
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">Admin Console</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50 font-mono font-bold">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                      Multi-Tenant RBAC
                    </div>
                  </div>
                )}
              </button>
            )}

            {/* Change Password Settings */}
            <button
              onClick={() => {
                onSelectTree('SETTINGS_PASSWORD');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'SETTINGS_PASSWORD')} w-full`}
              title="Update your private account password for secure login access."
              aria-label="Change Password"
              aria-current={activeTree === 'SETTINGS_PASSWORD' ? 'true' : undefined}
            >
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">Change Password</span>
                  </div>
                  <div className="text-[10px] text-slate-500 light:text-slate-400 font-normal truncate">
                    Account Security
                  </div>
                </div>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Footer / Settings & Diagnostics Section */}
      <div className="p-3 border-t border-slate-800/80 light:border-slate-200 space-y-1 bg-slate-950/60 light:bg-slate-50/80">
        {/* Prominent API Self-Test Diagnostics */}
        {onOpenDiagnostics && (
          <button
            onClick={() => {
              onOpenDiagnostics();
              onCloseMobile?.();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-white bg-gradient-to-r from-emerald-950/60 to-teal-950/60 hover:from-emerald-900/80 hover:to-teal-900/80 border border-emerald-500/40 transition-all cursor-pointer shadow-sm shadow-emerald-500/10 group focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="Run automated diagnostic tests across broker feeds and data providers."
            aria-label="API Self-Test"
          >
            <Zap className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full text-left">
                <span>API Self-Test</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            )}
          </button>
        )}

        {/* Settings Dropdown / Panel Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              if (onOpenTradier) {
                onOpenTradier();
              } else {
                setIsSettingsMenuOpen(!isSettingsMenuOpen);
              }
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 light:hover:bg-slate-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="Configure broker credentials, alert webhooks, and interface preferences."
            aria-label="Settings & APIs"
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full text-left">
                <span>Settings &amp; APIs</span>
                <span className="text-[10px] text-slate-500">⚙</span>
              </div>
            )}
          </button>

          {/* Expanded Settings Quick-Menu */}
          {isSettingsMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 text-xs space-y-1 animate-fade-in text-slate-200">
              {onOpenTradier && (
                <button
                  onClick={() => {
                    onOpenTradier();
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 flex items-center justify-between text-emerald-400 cursor-pointer"
                  aria-label="Tradier API (Live)"
                >
                  <span>Tradier API (Live)</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 bg-emerald-950 text-emerald-300 rounded">Primary</span>
                </button>
              )}
              {onOpenSchwab && (
                <button
                  onClick={() => {
                    onOpenSchwab();
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 flex items-center justify-between text-blue-400 cursor-pointer"
                  aria-label="Schwab API"
                >
                  <span>Schwab API</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 bg-blue-950 text-blue-300 rounded">Fallback</span>
                </button>
              )}
              {onOpenAlerts && (
                <button
                  onClick={() => {
                    onOpenAlerts();
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 flex items-center space-x-2 text-amber-300 cursor-pointer"
                  aria-label="Alerts & Webhooks"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Alerts &amp; Webhooks</span>
                </button>
              )}
              {onOpenHelp && (
                <button
                  onClick={() => {
                    onOpenHelp();
                    setIsSettingsMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 flex items-center space-x-2 text-cyan-300 cursor-pointer"
                  aria-label="Strategy Handbook"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Strategy Handbook</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Account / Auth Status Widget */}
        {isAuthenticated && user ? (
          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-[10px] font-bold text-purple-300 shrink-0">
                {user.email[0].toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="truncate text-left">
                  <div className="font-semibold text-white truncate text-[11px] leading-tight">{user.displayName || user.email.split('@')[0]}</div>
                  <div className="text-[9px] text-purple-400 font-mono font-bold">{user.role}</div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => logout()}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              onSelectTree('LOGIN');
              onCloseMobile?.();
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-sm shadow-purple-900/40 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
            title="Sign In with Admin or Client Credentials"
            aria-label="Sign In as Admin"
          >
            <User className="w-4 h-4 text-white shrink-0" />
            {!isCollapsed && <span>Sign In as Admin</span>}
          </button>
        )}

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 light:hover:bg-slate-200 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title={theme === 'dark' ? 'Switch to Day Mode (Light Theme)' : 'Switch to Night Mode (Dark Theme)'}
            aria-label={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                {!isCollapsed && <span>Day Mode (Light)</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-400 shrink-0" />
                {!isCollapsed && <span>Night Mode (Dark)</span>}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent / Collapsible) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-slate-800/80 light:border-slate-200 bg-slate-950/95 light:bg-white transition-all duration-300 sticky top-0 h-screen z-20 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-950 light:bg-white h-full shadow-2xl border-r border-slate-800 light:border-slate-200 flex flex-col z-10 animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
