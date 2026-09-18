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
  Key,
  Lock,
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
  freeCashAmount,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Helper for active styling
  const getItemClasses = (isActive: boolean) =>
    `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer group ${
      isActive
        ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white font-bold shadow-lg shadow-emerald-600/20 border border-emerald-400/40'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 border border-transparent'
    }`;

  const getSubItemClasses = (isActive: boolean) =>
    `flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
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
          className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 light:hover:bg-slate-200 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Institutional Navigation Group */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 light:text-slate-700 px-3 mb-2">
              Core Platform
            </div>
          )}
          <nav className="space-y-1">
            {/* 1. End-of-Week Ritual / Workflow (7 Steps) */}
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
              title="Guided 7-Step End-of-Week Quantitative Ritual"
            >
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full text-left">
                  <span>Workflow Ritual</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    7 Steps
                  </span>
                </div>
              )}
            </button>

            {/* 7-Step Expanded Sub-Navigation (When Workflow is Active) */}
            {activeTree === 'WORKFLOW' && !isCollapsed && (
              <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-emerald-500/30 ml-3 my-1">
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('SCHWAB_POSITIONS_UPLOAD');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'SCHWAB_POSITIONS_UPLOAD')} w-full text-left`}
                  title="Step 1: Upload Schwab Positions"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">1</span>
                  <span className="truncate">1. Upload Positions</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('WEEKLY_CASH_LEDGER');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'WEEKLY_CASH_LEDGER')} w-full text-left`}
                  title="Step 2: Weekly Cash & Tax Ledger"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">2</span>
                  <span className="truncate">2. Cash & Tax Ledger</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('HOLDINGS_COVERED_CALLS');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'HOLDINGS_COVERED_CALLS')} w-full text-left`}
                  title="Step 3: Covered Calls on Holdings"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">3</span>
                  <span className="truncate">3. Holdings Calls</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('ECONOMIC_CALENDAR');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'ECONOMIC_CALENDAR')} w-full text-left`}
                  title="Step 4: Macro Economic Calendar"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">4</span>
                  <span className="truncate">4. Economic Calendar</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('CASCADING_SCREENER');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'CASCADING_SCREENER')} w-full text-left`}
                  title="Step 5: Cascading Screener"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">5</span>
                  <span className="truncate">5. Cascading Screener</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('WEEKLY_EXECUTIVE_REPORT');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'WEEKLY_EXECUTIVE_REPORT')} w-full text-left`}
                  title="Step 6: Executive Master Report"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">6</span>
                  <span className="truncate">6. Executive Report</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTree('WORKFLOW');
                    onSelectOptionsTab('BROKER_STAGING');
                    onCloseMobile?.();
                  }}
                  className={`${getSubItemClasses(activeOptionsTab === 'BROKER_STAGING')} w-full text-left`}
                  title="Step 7: Broker Order Staging"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] font-mono shrink-0">7</span>
                  <span className="truncate">7. Order Staging</span>
                </button>
              </div>
            )}

            {/* 2. Client / User Workspace */}
            <button
              onClick={() => {
                onSelectTree('DASHBOARD');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'DASHBOARD')} w-full`}
              title="Dashboard Workspace: Personal portfolio, private trades & custom watchlists"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full text-left">
                  <span>My Workspace</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Portfolio
                  </span>
                </div>
              )}
            </button>

            {/* 2b. Master Trust Portfolio (Admin Only) */}
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
                title="Portfolio Breakdown & Executive Capital Digest (Living Trust)"
              >
                <Briefcase className="w-4 h-4 text-teal-400 shrink-0" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full text-left">
                    <span>Trust Portfolio</span>
                    {freeCashAmount !== undefined && (
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        ${Math.round(freeCashAmount / 1000)}k
                      </span>
                    )}
                  </div>
                )}
              </button>
            )}

            {/* 3. US Equities Universe */}
            <button
              onClick={() => {
                onSelectTree('EQUITIES');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'EQUITIES')} w-full`}
              title="US Equities Universe Screening & Multi-Timeframe Charts"
            >
              <BarChart2 className="w-4 h-4 text-blue-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full text-left">
                  <span>Equities</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {totalTickersCount}
                  </span>
                </div>
              )}
            </button>

            {/* 3b. Dedicated Equity Analysis Card Trigger */}
            <button
              onClick={() => {
                onOpenEquityAnalysis?.();
                onCloseMobile?.();
              }}
              className={`${getItemClasses(false)} w-full text-blue-300 hover:text-white group`}
              title="Open Comprehensive Equity Analysis Card (Technicals, Options, Analyst Ratings, News, DuPont DCF)"
            >
              <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full text-left">
                  <span>Equity Analysis</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Card
                  </span>
                </div>
              )}
            </button>

            {/* 4. Strategy Labs (Derivatives & Stress Models) */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'OPTIONS' && activeOptionsTab !== 'EXECUTIVE_DIGEST')} w-full`}
              title="Specialized Derivatives Labs & Systematic Stress Testing"
            >
              <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full text-left">
                  <span>Strategy Labs</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    10 Labs
                  </span>
                </div>
              )}
            </button>

            {/* 5. Orders & Broker Staging Workbench */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onSelectOptionsTab('BROKER_STAGING');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'OPTIONS' && activeOptionsTab === 'BROKER_STAGING')} w-full`}
              title="Broker Order Staging Workbench"
            >
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              {!isCollapsed && <span>Order Staging</span>}
            </button>

            {/* 6. Reports & PDF / Excel Exports */}
            <button
              onClick={() => {
                onOpenReports ? onOpenReports() : onSelectTree('WORKFLOW');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(false)} w-full`}
              title="Custom Reports, SQL Queries & PDF Exports"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && <span>Reports</span>}
            </button>
          </nav>
        </div>

        {/* Quick Analytical Tools Group */}
        <div>
          {!isCollapsed && (
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 light:text-slate-700 px-3 mb-2">
              Tactical Tools
            </div>
          )}
          <nav className="space-y-1">
            {/* Options Trade Quality Simulator */}
            {onOpenSimulator && (
              <button
                onClick={() => {
                  onOpenSimulator();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/30 transition-all cursor-pointer group shadow-sm shadow-emerald-500/10"
                title="Open Weekly CSP/CC Options Trade Quality Simulator"
              >
                <Zap className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && <span>Trade Simulator</span>}
              </button>
            )}

            {/* DCF Valuation & DuPont Terminal (v3.4) */}
            {onOpenValuation && (
              <button
                onClick={() => {
                  onOpenValuation();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-teal-300 hover:text-white bg-teal-950/30 hover:bg-teal-900/50 border border-teal-500/30 transition-all cursor-pointer group shadow-sm shadow-teal-500/10"
                title="Open DCF Intrinsic Valuation & DuPont Structural Terminal (v3.4)"
              >
                <DollarSign className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && <span>DCF &amp; Valuation</span>}
              </button>
            )}

            {/* Section 1256 Tax Alpha & Loss Harvest */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onSelectOptionsTab('TAX_ALPHA_OPTIMIZER');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTree === 'OPTIONS' && activeOptionsTab === 'TAX_ALPHA_OPTIMIZER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-emerald-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30'
              } transition-all cursor-pointer group`}
              title="Section 1256 Tax Alpha & Wash Sale Loss Harvest Optimizer"
            >
              <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              {!isCollapsed && <span>Tax Alpha (1256)</span>}
            </button>

            {/* Defensive Rolling Assistant */}
            <button
              onClick={() => {
                onSelectTree('OPTIONS');
                onSelectOptionsTab('DEFENSIVE_ROLL_ASSISTANT');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                activeTree === 'OPTIONS' && activeOptionsTab === 'DEFENSIVE_ROLL_ASSISTANT'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30'
              } transition-all cursor-pointer group`}
              title="Algorithmic Defensive Roll & Contract Repair Assistant"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              {!isCollapsed && <span>Roll Assistant</span>}
            </button>

            {/* Custom Watchlists */}
            {onOpenWatchlists && (
              <button
                onClick={() => {
                  onOpenWatchlists();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer group"
                title="Manage Watchlists and Import Custom Tickers"
              >
                <Star className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" filled />
                {!isCollapsed && <span>Watchlists</span>}
              </button>
            )}

            {/* Quantitative Methodology */}
            <button
              onClick={() => {
                onSelectTree('METHODOLOGY');
                onCloseMobile?.();
              }}
              className={`${getSubItemClasses(activeTree === 'METHODOLOGY')} w-full`}
              title="Mathematical Models, Black-Scholes & Cash Waterfall"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              {!isCollapsed && <span>Methodology</span>}
            </button>

            {/* Investor FAQ */}
            <button
              onClick={() => {
                onSelectTree('FAQ');
                onCloseMobile?.();
              }}
              className={`${getSubItemClasses(activeTree === 'FAQ')} w-full`}
              title="Investor Frequently Asked Questions"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {!isCollapsed && <span>Investor FAQ</span>}
            </button>

            {/* Regulatory Disclaimers */}
            <button
              onClick={() => {
                onSelectTree('DISCLAIMER');
                onCloseMobile?.();
              }}
              className={`${getSubItemClasses(activeTree === 'DISCLAIMER')} w-full`}
              title="Regulatory & Risk Disclaimers"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              {!isCollapsed && <span>Disclaimers</span>}
            </button>
          </nav>
        </div>

        {/* Administration & Multi-Tenant Access */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 light:text-purple-700 px-3 mb-2">
              <span>Security &amp; Tenants</span>
              <span className="px-1.5 py-0.2 bg-purple-950/60 text-purple-300 border border-purple-800/40 rounded text-[9px]">
                RBAC
              </span>
            </div>
          )}
          <nav className="space-y-1">
            {/* Admin User Console (Visible only to Admin) */}
            {isAdmin && (
              <button
                onClick={() => {
                  onSelectTree('ADMIN_USERS');
                  onCloseMobile?.();
                }}
                className={`${getItemClasses(activeTree === 'ADMIN_USERS')} w-full`}
                title="Admin User Console: Provision user logins, manage tenant accounts & reset passwords"
              >
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full text-left">
                    <span>Admin Console</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50 font-mono font-bold">
                      ADMIN
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* Client Private Workspace */}
            <button
              onClick={() => {
                onSelectTree('DASHBOARD');
                onCloseMobile?.();
              }}
              className={`${getItemClasses(activeTree === 'DASHBOARD')} w-full`}
              title="Private Tenant Workspace: Personal portfolio, private trades & custom watchlists"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full text-left">
                  <span>{isAdmin ? 'Client View Simulator' : 'My Workspace'}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 font-mono">
                    PRIVATE
                  </span>
                </div>
              )}
            </button>

            {/* Password Settings */}
            <button
              onClick={() => {
                onSelectTree('SETTINGS_PASSWORD');
                onCloseMobile?.();
              }}
              className={`${getSubItemClasses(activeTree === 'SETTINGS_PASSWORD')} w-full`}
              title="Update your login password"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {!isCollapsed && <span>Change Password</span>}
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
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-white bg-gradient-to-r from-emerald-950/60 to-teal-950/60 hover:from-emerald-900/80 hover:to-teal-900/80 border border-emerald-500/40 transition-all cursor-pointer shadow-sm shadow-emerald-500/10 group"
            title="Open Automated API Self-Test & Diagnostic Health Suite"
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
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 light:hover:bg-slate-200 transition-all cursor-pointer"
            title="Configure APIs, Webhooks, Notifications, and System Settings"
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
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 flex items-center justify-between text-emerald-400"
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
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 flex items-center justify-between text-blue-400"
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
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 flex items-center space-x-2 text-amber-300"
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
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-900 flex items-center space-x-2 text-cyan-300"
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
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                title="Sign Out"
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
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-sm shadow-purple-900/40 transition-all cursor-pointer"
            title="Sign In with Admin or Client Credentials"
          >
            <User className="w-4 h-4 text-white shrink-0" />
            {!isCollapsed && <span>Sign In as Admin</span>}
          </button>
        )}

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 light:hover:bg-slate-200 transition-all cursor-pointer"
            title={theme === 'dark' ? 'Switch to Day Mode (Light Theme)' : 'Switch to Night Mode (Dark Theme)'}
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
