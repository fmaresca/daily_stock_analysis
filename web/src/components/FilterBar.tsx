import React from 'react';
import { Search, SlidersHorizontal, RotateCcw } from './icons';
import { FilterState } from '../types/options';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  sectors: string[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  sectors,
  totalResults,
}) => {
  const handleReset = () => {
    onFilterChange({
      ...filters,
      search: '',
      maxDelta: 0.30,
      minAnnualizedYield: 15,
      minDte: 7,
      maxDte: 45,
      minIvRank: 0,
      maxRsi: 100,
      selectedSector: 'ALL',
      safetyTier: 'ALL',
    });
  };

  return (
    <div className="glass-panel p-4 rounded-xl mb-6 border border-slate-800/80 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <span>Screener Parameters</span>
          <span className="text-[11px] font-mono text-slate-400 font-normal">
            ({totalResults} matches)
          </span>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
        {/* 1. Ticker / Name Search */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Search Ticker / Name
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                onFilterChange({ ...filters, search: e.target.value })
              }
              placeholder="e.g. SPY, AAPL, NVDA"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>
        </div>

        {/* 2. Max Delta (Conservative Risk) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-400">
              Max Delta (Risk)
            </label>
            <span className="font-mono text-emerald-400 font-semibold">
              ≤ {(filters.maxDelta ?? 0.30).toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.40"
            step="0.01"
            value={filters.maxDelta ?? 0.30}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                maxDelta: parseFloat(e.target.value),
              })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0.10 (Ultra Safe)</span>
            <span>0.40</span>
          </div>
        </div>

        {/* 3. Min Annualized Yield % */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-400">
              Min Annualized Yield
            </label>
            <span className="font-mono text-emerald-400 font-semibold">
              ≥ {filters.minAnnualizedYield ?? 15}%
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="1"
            value={filters.minAnnualizedYield ?? 15}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                minAnnualizedYield: parseInt(e.target.value),
              })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>5%</span>
            <span>60%+</span>
          </div>
        </div>

        {/* 4. DTE Window */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Expiration Window
          </label>
          <select
            value={`${filters.minDte}-${filters.maxDte}`}
            onChange={(e) => {
              const [min, max] = e.target.value.split('-').map(Number);
              onFilterChange({
                ...filters,
                minDte: min,
                maxDte: max,
              });
            }}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="7-45">All Horizons (7 - 45 DTE)</option>
            <option value="7-14">Weekly (7 - 14 DTE)</option>
            <option value="15-30">Bi-Weekly (15 - 30 DTE)</option>
            <option value="31-45">Monthly (31 - 45 DTE)</option>
          </select>
        </div>

        {/* 5. Sector Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Sector / Asset Class
          </label>
          <select
            value={filters.selectedSector}
            onChange={(e) =>
              onFilterChange({ ...filters, selectedSector: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="ALL">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Safety Tier */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Risk Tier
          </label>
          <select
            value={filters.safetyTier}
            onChange={(e) =>
              onFilterChange({ ...filters, safetyTier: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="ALL">All Risk Profiles</option>
            <option value="Conservative">Conservative (Low Delta)</option>
            <option value="Moderate">Moderate Yield</option>
            <option value="Aggressive">Aggressive Yield</option>
          </select>
        </div>
      </div>
    </div>
  );
};
