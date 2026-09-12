import React from 'react';
import {
  BrainCircuit,
  Search,
  ShieldCheck,
  Sliders,
  RefreshCw,
  Upload,
  Copy,
  Download,
  ExternalLink,
  BarChart2,
  Zap,
} from '../../icons';
import { SortableTh } from '../../ui/SortableTh';
import { SortOrder } from '../../../utils/tableSort';
import {
  WeeklyScreenerRecord,
  WeeklyScreenerDataset,
} from '../../../types/weeklyScreeners';

export interface MarketChameleonTabProps {
  mcDataset: WeeklyScreenerDataset | null;
  sortedMcRecords: WeeklyScreenerRecord[];
  activePresetName: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  cboeOnlyGate: boolean;
  onCboeOnlyGateToggle: () => void;
  onOpenPrescreenModal: () => void;
  isUpdatingMc: boolean;
  onUpdateMcDataset: () => void;
  onMcCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyResultsTSV: (dataset: WeeklyScreenerDataset | null) => void;
  onDownloadCSV: (dataset: WeeklyScreenerDataset | null, filename: string) => void;
  onSendScreenedToGemini: (src: 'MC') => void;
  onOpenTickerAudit?: (symbol: string) => void;
  onSelectSymbolForChart?: (symbol: string) => void;
  onStageScreenerRecord: (item: WeeklyScreenerRecord) => void;
  mcSortKey: string;
  mcSortOrder: SortOrder;
  requestMcSort: (key: string) => void;
}

export const MarketChameleonTab: React.FC<MarketChameleonTabProps> = React.memo(({
  mcDataset,
  sortedMcRecords,
  activePresetName,
  searchQuery,
  onSearchChange,
  cboeOnlyGate,
  onCboeOnlyGateToggle,
  onOpenPrescreenModal,
  isUpdatingMc,
  onUpdateMcDataset,
  onMcCsvUpload,
  onCopyResultsTSV,
  onDownloadCSV,
  onSendScreenedToGemini,
  onOpenTickerAudit,
  onSelectSymbolForChart,
  onStageScreenerRecord,
  mcSortKey,
  mcSortOrder,
  requestMcSort,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary KPIs & Direct Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">MarketChameleon Universe</span>
          <span className="text-lg font-bold text-white font-mono">
            {mcDataset?.total_count || 60} Momentum Stocks
          </span>
          <span className="text-[10px] text-purple-400 block mt-0.5">Preset: {activePresetName}</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">Volatility Profile</span>
          <span className="text-lg font-bold text-amber-400 font-mono">IV30 &gt; 30% • RSI 50–70</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">High Premium Inflow Candidates</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[11px]">CBOE Verified Weeklys</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            {cboeOnlyGate ? 'Strict CBOE (10 Active)' : 'All Chains (60 Active)'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Direct CBOE Directory Cross-Check</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-purple-500/30 flex flex-col justify-center gap-1.5">
          <button
            onClick={() => onSendScreenedToGemini('MC')}
            className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
              placeholder="Search MarketChameleon stocks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
            />
          </div>

          <button
            onClick={onCboeOnlyGateToggle}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              cboeOnlyGate
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-400 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle strict CBOE weekly registered options"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{cboeOnlyGate ? 'Strict CBOE Weeklys (10)' : 'All Options Chains (60)'}</span>
          </button>

          <button
            onClick={onOpenPrescreenModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer"
            title="Customize MarketChameleon categories and presets"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Prescreen Builder &amp; Presets</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onUpdateMcDataset}
            disabled={isUpdatingMc}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            title="Fetch latest market prices for MarketChameleon Momentum symbols"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingMc ? 'animate-spin' : ''}`} />
            <span>{isUpdatingMc ? 'Updating...' : 'Fetch Live Quotes'}</span>
          </button>

          <label
            className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Upload latest exported Friday CSV directly from MarketChameleon"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={onMcCsvUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => onCopyResultsTSV(mcDataset)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Copy full table to clipboard as TSV"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy TSV</span>
          </button>

          <button
            onClick={() => onDownloadCSV(mcDataset, 'marketchameleon_momentum_screen')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <a
            href="https://marketchameleon.com/Screeners/Stocks"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold transition-all flex items-center space-x-1.5"
          >
            <span>MarketChameleon.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Standardized MarketChameleon Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl max-h-[620px] 2xl:max-h-[720px] overflow-y-auto relative table-scroll-container">
        <table className="w-full text-left text-xs font-mono border-collapse table-sticky-header">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 text-[11px]">
              <SortableTh label="Symbol" sortKey="symbol" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} />
              <SortableTh label="Company Name" sortKey="name" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} />
              <SortableTh label="Price" sortKey="last_price" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} align="right" />
              <SortableTh label="Change (% Chg)" sortKey="percent_change" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} align="right" />
              <SortableTh label="Market Cap" sortKey="extra_fields.market_cap" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} align="right" />
              <SortableTh label="14D RSI" sortKey="extra_fields.rsi_14" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} align="right" />
              <SortableTh label="IV30" sortKey="extra_fields.iv30" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} align="right" />
              <SortableTh label="Options Cadence" sortKey="has_weekly_options" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} align="center" />
              <SortableTh label="Recommended Strategy" sortKey="recommended_strategy" currentSortKey={mcSortKey} currentSortOrder={mcSortOrder} onSort={requestMcSort} />
              <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-2.5 px-3 text-center text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedMcRecords.map((item) => {
              const isPositive = item.price_change >= 0;
              const isCboe = item.extra_fields?.in_cboe_registry ?? item.has_weekly_options;
              return (
                <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-cyan-300 text-sm">{item.symbol}</td>
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
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {item.extra_fields?.market_cap ? `$${(item.extra_fields.market_cap / 1e9).toFixed(1)}B` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                    {item.extra_fields?.rsi_14 ? item.extra_fields.rsi_14.toFixed(1) : '55.0'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    <span className="font-bold text-emerald-400">
                      {item.extra_fields?.iv30 ? `${item.extra_fields.iv30.toFixed(1)}%` : '35.0%'}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {item.extra_fields?.vol_20d ? `${item.extra_fields.vol_20d.toFixed(0)}%` : '—'} /{' '}
                      {item.extra_fields?.vol_1y ? `${item.extra_fields.vol_1y.toFixed(0)}%` : '—'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isCboe ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        CBOE Weekly
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
                      {item.recommended_strategy === 'COVERED_CALL' && '20Δ Covered Call'}
                      {item.recommended_strategy === 'IRON_CONDOR' && 'Neutral Iron Condor'}
                    </span>
                    <div className="text-[10px] text-slate-400">Momentum Pattern: Uptrend</div>
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

MarketChameleonTab.displayName = 'MarketChameleonTab';
