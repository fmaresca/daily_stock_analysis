import React, { useState, useMemo, useRef } from 'react';
import {
  WeeklyScreenerRecord,
  WeeklyScreenerDataset,
  ScreenerSourceType,
} from '../types/weeklyScreeners';
import { parseScreenerCSV } from '../utils/screenerCsvParser';
import {
  TrendingUp,
  Search,
  Upload,
  Download,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Flame,
  Award,
  Zap,
  BarChart2,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Plus,
  AlertTriangle,
} from './icons';

interface WeeklyStockScreenersViewProps {
  initialDataset: WeeklyScreenerDataset | null;
  onSelectSymbolForChart?: (symbol: string) => void;
  onOpenTickerAudit?: (symbol: string) => void;
  onOpenBrokerStaging?: (symbol: string, strategy: string) => void;
}

export const WeeklyStockScreenersView: React.FC<WeeklyStockScreenersViewProps> = ({
  initialDataset,
  onSelectSymbolForChart,
  onOpenTickerAudit,
  onOpenBrokerStaging,
}) => {
  const [dataset, setDataset] = useState<WeeklyScreenerDataset | null>(initialDataset);
  const [activeSource, setActiveSource] = useState<ScreenerSourceType>('BARCHART');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [weeklyOnly, setWeeklyOnly] = useState<boolean>(true);
  const [opinionFilter, setOpinionFilter] = useState<'ALL' | '100' | '80'>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if initialDataset changes
  React.useEffect(() => {
    if (initialDataset && !dataset) {
      setDataset(initialDataset);
    }
  }, [initialDataset, dataset]);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsedRecords = parseScreenerCSV(text, activeSource);
        if (parsedRecords.length > 0) {
          const newDataset: WeeklyScreenerDataset = {
            source_id: activeSource === 'BARCHART' ? 'barchart' : activeSource === 'MARKETCHAMELEON' ? 'marketchameleon' : 'custom_upload',
            source_name: activeSource === 'BARCHART' ? 'Barchart Direction Strength' : activeSource === 'MARKETCHAMELEON' ? 'MarketChameleon Screener' : 'Custom Uploaded Screener',
            source_url: activeSource === 'BARCHART' ? 'https://www.barchart.com/stocks/signals/direction-strength?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc' : 'https://marketchameleon.com',
            timestamp: new Date().toISOString(),
            total_count: parsedRecords.length,
            records: parsedRecords,
          };
          setDataset(newDataset);
          setUploadSuccessMsg(`Successfully imported ${parsedRecords.length} tickers from ${file.name}!`);
          setTimeout(() => setUploadSuccessMsg(''), 6000);
        } else {
          alert('Could not parse any ticker rows from the provided CSV file. Please verify the CSV header contains Symbol/Price columns.');
        }
      } catch (err) {
        console.error('CSV parse error:', err);
        alert('Failed to parse the uploaded CSV file.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Export current records to CSV
  const handleExportCSV = () => {
    if (!dataset || dataset.records.length === 0) return;
    const headers = [
      'Symbol',
      'Name',
      'Last Price',
      'Price Change',
      'Percent Change',
      'Signal Opinion',
      'Opinion Score %',
      'Previous Opinion',
      'Last Week Opinion',
      'Last Month Opinion',
      'Weekly Options',
      'Signal Strength',
      'Signal Direction',
      'Recommended Strategy',
      'Source',
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.symbol}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      r.last_price,
      r.price_change,
      `${r.percent_change}%`,
      `"${r.opinion}"`,
      r.opinion_pct,
      `"${r.opinion_previous || ''}"`,
      `"${r.opinion_last_week || ''}"`,
      `"${r.opinion_last_month || ''}"`,
      r.has_weekly_options ? 'Yes' : 'No',
      `"${r.signal_strength}"`,
      `"${r.signal_direction}"`,
      `"${r.recommended_strategy}"`,
      `"${r.source}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weekly_stock_screeners_${activeSource.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Refresh trigger
  const handleLiveRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Reload fresh public data
      const resp = await fetch('./data/weekly_screeners.json?t=' + Date.now());
      if (resp.ok) {
        const freshData = await resp.json();
        setDataset(freshData);
      }
    } catch (e) {
      console.warn('Could not fetch updated weekly_screeners.json', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const allRecords = dataset?.records || [];

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchSym = r.symbol.toLowerCase().includes(q);
        const matchName = r.name.toLowerCase().includes(q);
        if (!matchSym && !matchName) return false;
      }

      // Weekly options only filter
      if (weeklyOnly && !r.has_weekly_options) {
        return false;
      }

      // Opinion filter
      if (opinionFilter === '100' && r.opinion_pct < 99) {
        return false;
      }
      if (opinionFilter === '80' && r.opinion_pct < 80) {
        return false;
      }

      // Strategy filter
      if (strategyFilter !== 'ALL' && r.recommended_strategy !== strategyFilter) {
        return false;
      }

      return true;
    });
  }, [allRecords, searchQuery, weeklyOnly, opinionFilter, strategyFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = allRecords.length;
    const weeklyCount = allRecords.filter((r) => r.has_weekly_options).length;
    const topBuyCount = allRecords.filter((r) => r.opinion_pct >= 99).length;
    const bullishCount = allRecords.filter((r) => r.opinion_pct > 0).length;
    const bullishPct = total > 0 ? Math.round((bullishCount / total) * 100) : 0;
    return {
      total,
      weeklyCount,
      topBuyCount,
      bullishPct,
    };
  }, [allRecords]);

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 shadow-xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/95">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black tracking-tight text-white">
                    Weekly Stock Screeners
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Direction Strength &bull; Weekly Options Flow
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated screener agent tracking top 1% directional signals, 13-indicator technical consensus, and weekly options liquidity.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:border-amber-400/50 shadow-sm transition-all cursor-pointer"
              title="Upload any Barchart or MarketChameleon CSV directly"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{isUploading ? 'Importing...' : 'Upload CSV'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-indigo-300 hover:border-indigo-400/50 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Export visible screened candidates to CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleLiveRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-300 hover:border-emerald-400 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              title="Fetch latest screener synchronization payload"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Agent'}</span>
            </button>
          </div>
        </div>

        {uploadSuccessMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Multi-Source Provider Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveSource('BARCHART')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSource === 'BARCHART'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Barchart Direction Strength</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveSource('MARKETCHAMELEON')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSource === 'MARKETCHAMELEON'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>MarketChameleon.com (IV &amp; Volatility)</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Pluggable
            </span>
          </button>

          <button
            onClick={() => setActiveSource('CUSTOM_UPLOAD')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSource === 'CUSTOM_UPLOAD'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-300" />
            <span>Custom CSV Workspace</span>
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <span>Source URL:</span>
          <a
            href="https://www.barchart.com/stocks/signals/direction-strength?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline flex items-center space-x-1"
          >
            <span>Barchart Signals (190898)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Screener Universe</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white font-mono mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Top direction strength stocks</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Weekly Options</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {stats.weeklyCount}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({stats.total > 0 ? Math.round((stats.weeklyCount / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ideal for Friday income expiry</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>100% Buy Signals</span>
            <Award className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-cyan-300 font-mono mt-1">{stats.topBuyCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">13/13 technical consensus</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Bullish Momentum</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono mt-1">{stats.bullishPct}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bull Put Spread high win-rate</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker (e.g. ZETA, VLO, IOVA)..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={weeklyOnly}
              onChange={(e) => setWeeklyOnly(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
            />
            <span className="font-semibold text-emerald-300">Weekly Options Only</span>
          </label>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5 text-xs">
          <span className="text-slate-400">Signal:</span>
          <select
            value={opinionFilter}
            onChange={(e) => setOpinionFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Opinions</option>
            <option value="100">100% Buy Only</option>
            <option value="80">80%+ Buy</option>
          </select>

          <span className="text-slate-400 ml-2">Strategy:</span>
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Strategies</option>
            <option value="BULL_PUT_SPREAD">Bull Put Spread (Credit)</option>
            <option value="CSP">Cash-Secured Put (CSP)</option>
            <option value="IRON_CONDOR">Iron Condor</option>
            <option value="BEAR_CALL_SPREAD">Bear Call Spread</option>
          </select>
        </div>
      </div>

      {/* Screened Equities Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden bg-slate-950/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticker / Security</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-right">Net Chg</th>
                <th className="py-3 px-4">Barchart Signal / Opinion</th>
                <th className="py-3 px-3 text-center">Stability (Prev / Wk / Mo)</th>
                <th className="py-3 px-3 text-center">Options Cadence</th>
                <th className="py-3 px-3">Recommended Options Setup</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    <p className="text-sm font-semibold">No screened stocks matched your filter criteria.</p>
                    <p className="text-xs mt-1">Try unchecking "Weekly Options Only" or clearing the search query.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const isPositive = item.percent_change >= 0;
                  const is100Buy = item.opinion_pct >= 99;

                  return (
                    <tr
                      key={`${item.symbol}-${idx}`}
                      className="hover:bg-slate-900/60 transition-colors group"
                    >
                      {/* Ticker & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onSelectSymbolForChart?.(item.symbol)}
                            className="font-black text-sm text-white hover:text-emerald-400 transition-colors cursor-pointer text-left"
                            title="Click to view Interactive Candlestick Chart"
                          >
                            {item.symbol}
                          </button>
                          {is100Buy && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="100% Buy Signal" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans truncate max-w-[200px]" title={item.name}>
                          {item.name}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        ${item.last_price.toFixed(2)}
                      </td>

                      {/* Net Chg */}
                      <td className={`py-3 px-3 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <div>{isPositive ? `+${item.price_change.toFixed(2)}` : item.price_change.toFixed(2)}</div>
                        <div className="text-[10px] opacity-80">
                          {isPositive ? `+${item.percent_change.toFixed(2)}%` : `${item.percent_change.toFixed(2)}%`}
                        </div>
                      </td>

                      {/* Signal Opinion */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              item.opinion_pct >= 90
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : item.opinion_pct >= 60
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {item.opinion}
                          </span>
                          <span className="text-[10px] text-amber-300 font-mono font-bold hidden sm:inline">
                            {item.signal_strength}
                          </span>
                        </div>
                        <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full ${item.opinion_pct >= 90 ? 'bg-emerald-400' : 'bg-teal-400'}`}
                            style={{ width: `${Math.max(5, Math.abs(item.opinion_pct))}%` }}
                          />
                        </div>
                      </td>

                      {/* Historical Stability */}
                      <td className="py-3 px-3 text-center text-[10px] font-mono text-slate-400 font-sans">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300" title="Previous Day Opinion">
                            {item.opinion_previous?.replace(' Buy', '') || '100%'}
                          </span>
                          <span>&rarr;</span>
                          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300" title="Last Week Opinion">
                            {item.opinion_last_week?.replace(' Buy', '') || '100%'}
                          </span>
                          <span>&rarr;</span>
                          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300" title="Last Month Opinion">
                            {item.opinion_last_month?.replace(' Buy', '') || '88%'}
                          </span>
                        </div>
                      </td>

                      {/* Weekly Options */}
                      <td className="py-3 px-3 text-center font-sans">
                        {item.has_weekly_options ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Weekly Options</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Monthly Only
                          </span>
                        )}
                      </td>

                      {/* Strategy recommendation */}
                      <td className="py-3 px-3 font-sans">
                        <span className="font-semibold text-xs text-cyan-300">
                          {item.recommended_strategy === 'BULL_PUT_SPREAD' && '0.15-0.20Δ Bull Put Spread'}
                          {item.recommended_strategy === 'CSP' && 'Conservative Cash-Secured Put'}
                          {item.recommended_strategy === 'IRON_CONDOR' && 'Neutral Iron Condor'}
                          {item.recommended_strategy === 'BEAR_CALL_SPREAD' && 'Defensive Bear Call Spread'}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Anchor outside 20-Day Bollinger Bands
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center font-sans">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenTickerAudit?.(item.symbol)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Run 5-Part Options Safety Audit"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </button>

                          <button
                            onClick={() => onSelectSymbolForChart?.(item.symbol)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                            title="Open Candlestick Chart"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                          </button>

                          <button
                            onClick={() => onOpenBrokerStaging?.(item.symbol, item.recommended_strategy)}
                            className="p-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-colors cursor-pointer"
                            title="Stage Order in Schwab Broker Workbench"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Source Extensibility Information Card */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Multi-Source Ingestion &amp; MarketChameleon Extensibility</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Weekly Stock Screeners agent is built with a pluggable provider pipeline (<code className="text-emerald-300 font-mono">BaseScreenerAgent</code>).
          In addition to the active <strong>Barchart Direction Strength</strong> feed (view 190898), it includes out-of-the-box support for <strong>MarketChameleon.com</strong> and arbitrary custom CSV uploads. To ingest additional MarketChameleon screeners or custom feeds, simply upload their CSV export above or execute <code className="text-emerald-300 font-mono">python scripts/run_screener_agent.py --source marketchameleon</code>.
        </p>
      </div>
    </div>
  );
};
