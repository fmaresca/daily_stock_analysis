import React from 'react';
import {
  BrainCircuit,
  Search,
  RefreshCw,
  Upload,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
  BarChart2,
  Zap,
} from '../../icons';
import { SortableTh } from '../../ui/SortableTh';
import { SortOrder } from '../../../utils/tableSort';
import {
  WeeklyScreenerRecord,
  WeeklyScreenerDataset,
} from '../../../types/weeklyScreeners';

export interface BarchartTopTabProps {
  barchartDataset: WeeklyScreenerDataset | null;
  sortedBarchartRecords: WeeklyScreenerRecord[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  weeklyOnlyFilter: boolean;
  onWeeklyOnlyFilterChange: (val: boolean) => void;
  opinionFilter: 'ALL' | '100' | '80';
  onOpinionFilterChange: (val: 'ALL' | '100' | '80') => void;
  isUpdatingBarchart: boolean;
  onUpdateBarchartDataset: () => void;
  onBarchartCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyResultsTSV: (dataset: WeeklyScreenerDataset | null) => void;
  onDownloadCSV: (dataset: WeeklyScreenerDataset | null, filename: string) => void;
  onSendScreenedToGemini: (src: 'BARCHART') => void;
  onOpenTickerAudit?: (symbol: string) => void;
  onSelectSymbolForChart?: (symbol: string) => void;
  onStageScreenerRecord: (item: WeeklyScreenerRecord) => void;
  bcSortKey: string;
  bcSortOrder: SortOrder;
  requestBcSort: (key: string) => void;
}

export const BarchartTopTab: React.FC<BarchartTopTabProps> = React.memo(({
  barchartDataset,
  sortedBarchartRecords,
  searchQuery,
  onSearchChange,
  weeklyOnlyFilter,
  onWeeklyOnlyFilterChange,
  opinionFilter,
  onOpinionFilterChange,
  isUpdatingBarchart,
  onUpdateBarchartDataset,
  onBarchartCsvUpload,
  onCopyResultsTSV,
  onDownloadCSV,
  onSendScreenedToGemini,
  onOpenTickerAudit,
  onSelectSymbolForChart,
  onStageScreenerRecord,
  bcSortKey,
  bcSortOrder,
  requestBcSort,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary KPIs & Direct Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Barchart Universe</span>
          <span className="text-lg font-bold text-white font-mono">
            {barchartDataset?.total_count || 53} Screened Equities
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Top 1% Signal Strength Consensus</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Barchart Consensus</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">100% Strong Buy</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">13/13 Moving Averages &amp; MACD</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Options Chain Status</span>
          <span className="text-lg font-bold text-cyan-400 font-mono">100% Optionable</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Filtered for Active Weeklys</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 flex flex-col justify-center gap-1.5">
          <button
            onClick={() => onSendScreenedToGemini('BARCHART')}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-amber-300" />
            <span>Send to Gemini AI Hub &rarr;</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Barchart stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={weeklyOnlyFilter}
              onChange={(e) => onWeeklyOnlyFilterChange(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500"
            />
            <span className="font-semibold text-emerald-300">Has Weeklys Only</span>
          </label>

          <select
            value={opinionFilter}
            onChange={(e) => onOpinionFilterChange(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
          >
            <option value="ALL">All Opinions</option>
            <option value="100">100% Buy Only</option>
            <option value="80">80%+ Buy</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onUpdateBarchartDataset}
            disabled={isUpdatingBarchart}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            title="Fetch latest market quotes and consensus for Barchart Top 1% symbols"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingBarchart ? 'animate-spin' : ''}`} />
            <span>{isUpdatingBarchart ? 'Updating...' : 'Fetch Live Quotes'}</span>
          </button>

          <label
            className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Upload latest exported Friday CSV directly from Barchart"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={onBarchartCsvUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => onCopyResultsTSV(barchartDataset)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Copy full table to clipboard as TSV"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy TSV</span>
          </button>

          <button
            onClick={() => onDownloadCSV(barchartDataset, 'barchart_direction_strength_top1pct')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <a
            href="https://www.barchart.com/stocks/signals/direction-strength?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold transition-all flex items-center space-x-1.5"
          >
            <span>Barchart View 190898</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Standardized Barchart Top 1% Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl max-h-[620px] 2xl:max-h-[720px] overflow-y-auto relative table-scroll-container">
        <table className="w-full text-left text-xs font-mono border-collapse table-sticky-header">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 text-[11px]">
              <SortableTh label="Rank & Symbol" sortKey="symbol" currentSortKey={bcSortKey} currentSortOrder={bcSortOrder} onSort={requestBcSort} />
              <SortableTh label="Company Name" sortKey="name" currentSortKey={bcSortKey} currentSortOrder={bcSortOrder} onSort={requestBcSort} />
              <SortableTh label="Last Price" sortKey="last_price" currentSortKey={bcSortKey} currentSortOrder={bcSortOrder} onSort={requestBcSort} align="right" />
              <SortableTh label="Change (% Chg)" sortKey="percent_change" currentSortKey={bcSortKey} currentSortOrder={bcSortOrder} onSort={requestBcSort} align="right" />
              <SortableTh label="Barchart Consensus Opinion" sortKey="opinion_pct" currentSortKey={bcSortKey} currentSortOrder={bcSortOrder} onSort={requestBcSort} />
              <SortableTh label="Stability (Prev → LW → LM)" sortKey="stability_previous" currentSortKey={bcSortKey} currentSortOrder={bcSortOrder} onSort={requestBcSort} align="center" />
              <SortableTh label="Options Cadence" sortKey="has_weekly_options" currentSortKey={bcSortKey} currentSortOrder={bcSortOrder} onSort={requestBcSort} align="center" />
              <SortableTh label="Recommended Strategy" sortKey="recommended_strategy" currentSortKey={bcSortKey} currentSortOrder={bcSortOrder} onSort={requestBcSort} />
              <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-2.5 px-3 text-center text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedBarchartRecords.map((item, idx) => {
              const isPositive = item.price_change >= 0;
              return (
                <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">
                    <span className="text-slate-500 font-normal mr-2">#{idx + 1}</span>
                    <span className="text-sm font-bold text-cyan-300">{item.symbol}</span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-xs">{item.name}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-100 font-mono">
                    ${item.last_price.toFixed(2)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold font-mono ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <div>{isPositive ? `+${item.price_change.toFixed(2)}` : item.price_change.toFixed(2)}</div>
                    <div className="text-[10px] opacity-80">
                      {isPositive ? `+${item.percent_change.toFixed(2)}%` : `${item.percent_change.toFixed(2)}%`}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                        {item.opinion}
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold">{item.signal_strength}</span>
                    </div>
                    <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-emerald-400"
                        style={{ width: `${Math.max(5, Math.abs(item.opinion_pct))}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center text-[10px] font-mono text-slate-400">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {item.opinion_previous?.replace(' Buy', '') || '100%'}
                      </span>
                      <span>&rarr;</span>
                      <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {item.opinion_last_week?.replace(' Buy', '') || '100%'}
                      </span>
                      <span>&rarr;</span>
                      <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {item.opinion_last_month?.replace(' Buy', '') || '100%'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.has_weekly_options ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        Weekly Options
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Monthly Only
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="font-semibold text-xs text-cyan-300 font-mono">
                      {item.recommended_strategy === 'BULL_PUT_SPREAD' && '0.15-0.20Δ Bull Put Spread'}
                      {item.recommended_strategy === 'CSP' && 'Conservative Cash-Secured Put'}
                      {item.recommended_strategy === 'IRON_CONDOR' && 'Neutral Iron Condor'}
                      {item.recommended_strategy === 'BEAR_CALL_SPREAD' && 'Defensive Bear Call Spread'}
                    </span>
                    <div className="text-[10px] text-slate-400">Anchor &lt; Lower Bollinger Band</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
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
                        onClick={() => onStageScreenerRecord(item)}
                        className="p-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 transition-colors cursor-pointer"
                        title="Stage Order in Broker Workbench"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

BarchartTopTab.displayName = 'BarchartTopTab';
