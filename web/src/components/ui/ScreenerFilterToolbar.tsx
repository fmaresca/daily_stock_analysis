import React from 'react';
import { FilterState, TickerMeta, OptionOpportunity, WatchlistGroup } from '../../types/options';
import { KPICards } from '../KPICards';
import {
  Search,
  RotateCcw,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Star,
  FileSpreadsheet,
  FileText,
  Printer,
} from '../icons';

interface ScreenerFilterToolbarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  universeTickers: TickerMeta[];
  filteredTickers: TickerMeta[];
  filteredOpportunities: OptionOpportunity[];
  totalOpportunitiesCount: number;
  watchlistGroups: WatchlistGroup[];
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  showWatchlistOnly: boolean;
  setShowWatchlistOnly: (val: boolean) => void;
  onOpenWatchlistModal: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onResetFilters: () => void;
  weeklyCadenceCounts: { all: number; weekly: number; monthly: number };
  activeTree: string;
}

export const ScreenerFilterToolbar: React.FC<ScreenerFilterToolbarProps> = ({
  filters,
  setFilters,
  universeTickers,
  filteredTickers,
  filteredOpportunities,
  totalOpportunitiesCount,
  watchlistGroups,
  activeGroupId,
  setActiveGroupId,
  showWatchlistOnly,
  setShowWatchlistOnly,
  onOpenWatchlistModal,
  onExportCSV,
  onExportExcel,
  onPrint,
  onResetFilters,
  weeklyCadenceCounts,
  activeTree,
}) => {
  return (
    <div className="space-y-4">
      {/* Global KPI Summary Ribbon */}
      <KPICards
        tickers={universeTickers}
        activeFilter={
          filters.onlyHighIvr
            ? 'IVR'
            : filters.onlyOversold
            ? 'OVERSOLD'
            : filters.onlyNearSupport
            ? 'SUPPORT'
            : filters.onlyEarningsAlert
            ? 'EARNINGS'
            : 'ALL'
        }
        onFilterHighIvr={() =>
          setFilters((prev) => ({
            ...prev,
            onlyHighIvr: !prev.onlyHighIvr,
            onlyOversold: false,
            onlyNearSupport: false,
            onlyEarningsAlert: false,
          }))
        }
        onFilterOversold={() =>
          setFilters((prev) => ({
            ...prev,
            onlyOversold: !prev.onlyOversold,
            onlyNearSupport: false,
            onlyHighIvr: false,
            onlyEarningsAlert: false,
          }))
        }
        onFilterNearSupport={() =>
          setFilters((prev) => ({
            ...prev,
            onlyNearSupport: !prev.onlyNearSupport,
            onlyOversold: false,
            onlyHighIvr: false,
            onlyEarningsAlert: false,
          }))
        }
        onFilterEarnings={() =>
          setFilters((prev) => ({
            ...prev,
            onlyEarningsAlert: !prev.onlyEarningsAlert,
            onlyHighIvr: false,
            onlyOversold: false,
            onlyNearSupport: false,
          }))
        }
      />

      {/* Global Toolbar & Filter Strip */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search ticker, company name, or sector..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Filter Buttons & Watchlist Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Watchlist Controls & Quick Switcher */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                showWatchlistOnly
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title={showWatchlistOnly ? 'Filtering active watchlist (Click to show all)' : 'Filter by active watchlist'}
            >
              <Star className="w-3.5 h-3.5" filled={showWatchlistOnly} />
              <span>{showWatchlistOnly ? 'Filtering:' : 'Watchlist:'}</span>
            </button>

            <select
              value={activeGroupId}
              onChange={(e) => {
                if (e.target.value === '__manage__') {
                  onOpenWatchlistModal();
                } else {
                  setActiveGroupId(e.target.value);
                }
              }}
              className="bg-transparent text-amber-400 font-semibold text-xs py-1 px-2 border-0 focus:outline-none cursor-pointer hover:text-amber-300"
              title="Switch active watchlist"
            >
              {watchlistGroups.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900 text-slate-200">
                  {g.name} ({g.tickers.length})
                </option>
              ))}
              <option value="__manage__" className="bg-slate-900 text-amber-400 font-bold">
                + Manage Watchlists...
              </option>
            </select>
          </div>

          {/* Quick Strategy Flags */}
          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlyHighIvr: !prev.onlyHighIvr }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              filters.onlyHighIvr
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>IVR ≥ 45%</span>
          </button>

          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlyOversold: !prev.onlyOversold, onlyNearSupport: false }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              filters.onlyOversold
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Filter tickers with 14-Day RSI strictly < 35"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Oversold (RSI &lt; 35)</span>
          </button>

          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlyNearSupport: !prev.onlyNearSupport, onlyOversold: false }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              filters.onlyNearSupport
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
            title="Filter tickers trading within 2% of Lower Bollinger Band"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Near Lower Support</span>
          </button>

          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlyEarningsAlert: !prev.onlyEarningsAlert }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              filters.onlyEarningsAlert
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Earnings &le; 7d</span>
          </button>

          {/* Liquidity Tier Dropdown */}
          <select
            value={filters.liquidityTier}
            onChange={(e) => setFilters((prev) => ({ ...prev, liquidityTier: e.target.value }))}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Liquidity Tiers</option>
            <option value="Tier 1">Tier 1 (Ultra-Liquid)</option>
            <option value="Tier 2/3">Tier 2/3 (Moderate)</option>
            <option value="Tier 4">Tier 4 (Small-Cap)</option>
          </select>

          {/* Quick Export Actions */}
          <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
            <button
              onClick={onExportCSV}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              title="Quick Export view to CSV"
            >
              <FileText className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={onExportExcel}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 transition-colors cursor-pointer"
              title="Quick Export view to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={onPrint}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 transition-colors cursor-pointer"
              title="Print Report / Save PDF"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
            </button>
          </div>

          {(filters.search ||
            filters.onlyHighIvr ||
            filters.onlyOversold ||
            filters.onlyEarningsAlert ||
            filters.liquidityTier !== 'ALL' ||
            showWatchlistOnly) && (
            <button
              onClick={onResetFilters}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Options Cadence Quick Filter Toggle Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Expiration Cadence:
          </span>
          <div className="inline-flex p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, weeklyCadence: 'ALL' }))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !filters.weeklyCadence || filters.weeklyCadence === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Cycles ({weeklyCadenceCounts.all})
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, weeklyCadence: 'WEEKLY_ONLY' }))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                filters.weeklyCadence === 'WEEKLY_ONLY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Weekly Only ({weeklyCadenceCounts.weekly})</span>
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, weeklyCadence: 'MONTHLY_ONLY' }))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                filters.weeklyCadence === 'MONTHLY_ONLY'
                  ? 'bg-slate-700 text-white shadow-md shadow-slate-700/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Monthly Only ({weeklyCadenceCounts.monthly})</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {activeTree === 'EQUITIES' ? (
            <span>
              Showing <strong className="text-white">{filteredTickers.length}</strong> of{' '}
              <strong className="text-slate-300">{universeTickers.length}</strong> equities
            </span>
          ) : (
            <span>
              Showing <strong className="text-white">{filteredOpportunities.length}</strong> of{' '}
              <strong className="text-slate-300">{totalOpportunitiesCount}</strong> option contracts
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
