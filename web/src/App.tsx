import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { PrimaryScreenerTable } from './components/PrimaryScreenerTable';
import { TickerAuditModal } from './components/TickerAuditModal';
import { Search, RotateCcw, ShieldCheck, Flame, AlertTriangle } from './components/icons';
import {
  OptionsDataPayload,
  TickerMeta,
  FilterState,
} from './types/options';

const GITHUB_RAW_DATA_URL =
  'https://raw.githubusercontent.com/fmaresca/daily_stock_analysis/main/web/public/data/options_data.json';

export const App: React.FC = () => {
  const [dataPayload, setDataPayload] = useState<OptionsDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>('Local JSON');
  const [selectedTicker, setSelectedTicker] = useState<TickerMeta | null>(null);

  // Quick filter state
  const [activeKpiFilter, setActiveKpiFilter] = useState<'ALL' | 'IVR' | 'OVERSOLD' | 'EARNINGS'>('ALL');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    onlyHighIvr: false,
    onlyOversold: false,
    onlyEarningsAlert: false,
    liquidityTier: 'ALL',
    sortBy: 'iv_rank',
    sortOrder: 'desc',
  });

  const fetchData = async () => {
    setIsLoading(true);
    let loaded = false;

    // 1. Attempt local public JSON path with cache buster
    try {
      const res = await fetch('./data/options_data.json?t=' + Date.now());
      if (res.ok) {
        const json: OptionsDataPayload = await res.json();
        if (json.tickers && json.tickers.length > 0) {
          setDataPayload(json);
          setDataSource('Local JSON');
          loaded = true;
        }
      }
    } catch (e) {
      console.warn('Local ./data/options_data.json failed:', e);
    }

    // 2. Attempt absolute public root /data/options_data.json
    if (!loaded) {
      try {
        const res = await fetch('/data/options_data.json');
        if (res.ok) {
          const json: OptionsDataPayload = await res.json();
          if (json.tickers && json.tickers.length > 0) {
            setDataPayload(json);
            setDataSource('Root /data');
            loaded = true;
          }
        }
      } catch (e) {
        console.warn('Root /data/options_data.json failed:', e);
      }
    }

    // 3. Fallback to GitHub raw repository URL
    if (!loaded) {
      try {
        console.log('Fetching fallback from GitHub Raw URL:', GITHUB_RAW_DATA_URL);
        const res = await fetch(GITHUB_RAW_DATA_URL);
        if (res.ok) {
          const json: OptionsDataPayload = await res.json();
          if (json.tickers && json.tickers.length > 0) {
            setDataPayload(json);
            setDataSource('GitHub Raw API');
            loaded = true;
          }
        }
      } catch (e) {
        console.error('GitHub Raw fetch failed:', e);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync active KPI filter to state
  const handleKpiToggle = (type: 'IVR' | 'OVERSOLD' | 'EARNINGS') => {
    if (activeKpiFilter === type) {
      setActiveKpiFilter('ALL');
      setFilters((prev) => ({
        ...prev,
        onlyHighIvr: false,
        onlyOversold: false,
        onlyEarningsAlert: false,
      }));
    } else {
      setActiveKpiFilter(type);
      setFilters((prev) => ({
        ...prev,
        onlyHighIvr: type === 'IVR',
        onlyOversold: type === 'OVERSOLD',
        onlyEarningsAlert: type === 'EARNINGS',
      }));
    }
  };

  const handleResetFilters = () => {
    setActiveKpiFilter('ALL');
    setFilters({
      search: '',
      onlyHighIvr: false,
      onlyOversold: false,
      onlyEarningsAlert: false,
      liquidityTier: 'ALL',
      sortBy: 'iv_rank',
      sortOrder: 'desc',
    });
  };

  // Process and extract ticker items
  const tickers: TickerMeta[] = useMemo(() => {
    if (!dataPayload) return [];
    if (dataPayload.tickers && dataPayload.tickers.length > 0) {
      return dataPayload.tickers;
    }
    // If tickers array missing, reconstruct from opportunities
    const map = new Map<string, TickerMeta>();
    dataPayload.opportunities.forEach((o) => {
      if (!map.has(o.symbol)) {
        map.set(o.symbol, {
          symbol: o.symbol,
          name: o.name,
          sector: o.sector,
          liquidity_tier: o.liquidity_tier || 'Tier 2/3 (Moderate)',
          liquidity_warning: o.liquidity_warning,
          spot_price: o.current_price,
          avg_volume_30: 5000000,
          sma_20: o.sma_20 || o.current_price,
          upper_bb: o.upper_bb || o.current_price * 1.05,
          lower_bb: o.lower_bb || o.current_price * 0.95,
          bb_width_pct: o.bb_width_pct || 10.0,
          rsi_14: o.rsi || o.rsi_14 || 50,
          rsi_flag: o.rsi_flag || 'NORMAL',
          hv_30: o.hv_30 || 25,
          iv_current: o.iv,
          iv_rank: o.iv_rank,
          earnings_within_7d: !!o.earnings_within_7d,
          next_earnings_date: o.next_earnings_date || 'N/A',
        });
      }
    });
    return Array.from(map.values());
  }, [dataPayload]);

  // Filtered and Sorted Tickers
  const filteredTickers = useMemo(() => {
    return tickers
      .filter((t) => {
        // Search filter
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchSym = t.symbol.toLowerCase().includes(q);
          const matchName = t.name.toLowerCase().includes(q);
          const matchSector = t.sector.toLowerCase().includes(q);
          if (!matchSym && !matchName && !matchSector) return false;
        }

        // High IVR >= 45%
        if (filters.onlyHighIvr && t.iv_rank < 45) {
          return false;
        }

        // Oversold / Near Support
        if (filters.onlyOversold) {
          const isNearSupport = t.spot_price <= t.lower_bb * 1.02;
          const isOversoldRsi = t.rsi_14 < 35;
          if (!isNearSupport && !isOversoldRsi) return false;
        }

        // Earnings alert
        if (filters.onlyEarningsAlert && !t.earnings_within_7d) {
          return false;
        }

        // Liquidity Tier
        if (filters.liquidityTier && filters.liquidityTier !== 'ALL' && !t.liquidity_tier.includes(filters.liquidityTier)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const field = filters.sortBy;
        let valA: any;
        let valB: any;

        if (field === 'cushion_pct') {
          valA = ((a.spot_price - a.lower_bb) / a.spot_price) * 100;
          valB = ((b.spot_price - b.lower_bb) / b.spot_price) * 100;
        } else {
          valA = a[field as keyof TickerMeta];
          valB = b[field as keyof TickerMeta];
        }

        if (typeof valA === 'string') {
          valA = (valA as string).toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA! < valB!) return filters.sortOrder === 'asc' ? -1 : 1;
        if (valA! > valB!) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [tickers, filters]);

  const handleSort = (column: keyof TickerMeta | 'cushion_pct') => {
    if (filters.sortBy === column) {
      setFilters((prev) => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        sortBy: column,
        sortOrder: column === 'iv_rank' || column === 'cushion_pct' ? 'desc' : 'asc',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header */}
      <Header
        summary={dataPayload?.summary || null}
        lastUpdated={dataPayload?.metadata.last_updated || ''}
        totalTickers={tickers.length}
        onRefresh={fetchData}
        isLoading={isLoading}
        dataSource={dataSource}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* KPI Cards Strip */}
        <KPICards
          tickers={tickers}
          onFilterHighIvr={() => handleKpiToggle('IVR')}
          onFilterOversold={() => handleKpiToggle('OVERSOLD')}
          onFilterEarnings={() => handleKpiToggle('EARNINGS')}
          activeFilter={activeKpiFilter}
        />

        {/* Filter Toolbar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1 min-w-[260px] max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Filter by ticker or name (e.g. SPY, NVDA, AXTI)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Filter buttons */}
            <button
              onClick={() => handleKpiToggle('IVR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                filters.onlyHighIvr
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>IVR ≥ 45%</span>
            </button>

            <button
              onClick={() => handleKpiToggle('OVERSOLD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                filters.onlyOversold
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Oversold Dips</span>
            </button>

            <button
              onClick={() => handleKpiToggle('EARNINGS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                filters.onlyEarningsAlert
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Earnings &le; 7d</span>
            </button>

            {/* Liquidity Tier Dropdown */}
            <select
              value={filters.liquidityTier}
              onChange={(e) => setFilters((prev) => ({ ...prev, liquidityTier: e.target.value }))}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Liquidity Tiers</option>
              <option value="Tier 1">Tier 1 (Ultra-Liquid)</option>
              <option value="Tier 2/3">Tier 2/3 (Moderate)</option>
              <option value="Tier 4">Tier 4 (Small-Cap Warning)</option>
            </select>

            {(filters.search || filters.onlyHighIvr || filters.onlyOversold || filters.onlyEarningsAlert || filters.liquidityTier !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Primary Screener Table */}
        <PrimaryScreenerTable
          tickers={filteredTickers}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSort={handleSort}
          onSelectTicker={(ticker) => setSelectedTicker(ticker)}
        />
      </main>

      {/* Interactive 5-Part Audit Detail Modal */}
      <TickerAuditModal
        ticker={selectedTicker}
        opportunities={dataPayload?.opportunities || []}
        onClose={() => setSelectedTicker(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-300">
            DeltaHarvest • Weekly Options Income &amp; Volatility Screener
          </p>
          <p className="text-[11px] text-slate-400 max-w-2xl mx-auto">
            Rules: Cash-Secured Put strikes positioned $\le$ Lower Bollinger Band (2 SD); Covered Call strikes $\ge$ Upper Bollinger Band (2 SD). 
            Always observe the 80% Profit Buy-to-Close trigger and 0.50 Delta roll trigger.
          </p>
        </div>
      </footer>
    </div>
  );
};
