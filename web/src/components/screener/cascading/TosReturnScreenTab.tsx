import React from 'react';
import {
  ExternalLink,
  Zap,
  Copy,
  Upload,
  XCircle,
  Trash2,
  BrainCircuit,
  Download,
  ShieldCheck,
  BarChart2,
} from '../../icons';
import { SortableTh } from '../../ui/SortableTh';
import { SortOrder } from '../../../utils/tableSort';
import {
  WeeklyScreenerRecord,
  WeeklyScreenerDataset,
} from '../../../types/weeklyScreeners';
import { getSchwabImportedEquities } from '../../../utils/schwabPositionsParser';

export interface TosReturnScreenTabProps {
  tosTickersInput: string;
  onTosTickersInputChange: (val: string) => void;
  isAnalyzingTos: boolean;
  onRunBarchartAnalysis: (symbols?: string[]) => void;
  copiedBarchartTickers: boolean;
  onCopyAndOpenBarchart: () => void;
  onTosFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tosError: string;
  tosWatchlistDataset: WeeklyScreenerDataset | null;
  sortedTosRecords: WeeklyScreenerRecord[];
  onSendScreenedToGemini: (src: 'TOS') => void;
  onCopyResultsTSV: (dataset: WeeklyScreenerDataset | null) => void;
  onDownloadCSV: (dataset: WeeklyScreenerDataset | null, filename: string) => void;
  onClearReturnedScreen: () => void;
  onRemoveSymbolFromScreen: (symbol: string) => void;
  onOpenTickerAudit?: (symbol: string) => void;
  onSelectSymbolForChart?: (symbol: string) => void;
  onStageScreenerRecord: (item: WeeklyScreenerRecord) => void;
  tosSortKey: string;
  tosSortOrder: SortOrder;
  requestTosSort: (key: string) => void;
}

export const TosReturnScreenTab: React.FC<TosReturnScreenTabProps> = React.memo(({
  tosTickersInput,
  onTosTickersInputChange,
  isAnalyzingTos,
  onRunBarchartAnalysis,
  copiedBarchartTickers,
  onCopyAndOpenBarchart,
  onTosFileUpload,
  tosError,
  tosWatchlistDataset,
  sortedTosRecords,
  onSendScreenedToGemini,
  onCopyResultsTSV,
  onDownloadCSV,
  onClearReturnedScreen,
  onRemoveSymbolFromScreen,
  onOpenTickerAudit,
  onSelectSymbolForChart,
  onStageScreenerRecord,
  tosSortKey,
  tosSortOrder,
  requestTosSort,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Thinkorswim Ticker Ingestion & Analysis Box */}
      <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3.5 text-xs shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
              <ExternalLink className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-cyan-300 text-sm block">
                ThinkorSwim Screen &amp; Barchart View 190898 Workflow
              </span>
              <span className="text-[11px] text-slate-400">
                Standardize any custom or ThinkorSwim scan into 13-indicator Barchart consensus opinions.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRunBarchartAnalysis()}
              disabled={isAnalyzingTos}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-300 ${isAnalyzingTos ? 'animate-spin' : ''}`} />
              <span>{isAnalyzingTos ? 'Analyzing 13 Barchart Indicators...' : '▶ Run Barchart View 190898 Analysis'}</span>
            </button>

            <button
              onClick={onCopyAndOpenBarchart}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                copiedBarchartTickers
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Copy tickers to clipboard and open Barchart View 190898 webpage"
            >
              <Copy className="w-3.5 h-3.5 text-amber-300" />
              <span>{copiedBarchartTickers ? 'Copied! Opening...' : 'Copy & Open Barchart'}</span>
            </button>

            <label className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer flex items-center space-x-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
              <input type="file" accept=".csv,.txt" onChange={onTosFileUpload} className="hidden" />
            </label>

            {tosTickersInput && (
              <button
                onClick={() => onTosTickersInputChange('')}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center space-x-1"
                title="Clear ticker input"
              >
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear Tickers</span>
              </button>
            )}
          </div>
        </div>

        {/* Concise 3-Step Workflow Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px]">
          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[10px]">
              1
            </span>
            <div>
              <div className="font-semibold text-slate-200">Select or Input Tickers</div>
              <div className="text-slate-400 text-[10px] leading-tight mt-0.5">
                Click <strong>Schwab Import Equities</strong> below, paste custom <strong>symbols</strong>, or click <strong>Upload File</strong> (.csv/.txt). <span className="text-cyan-400">CSV headers are auto-audited &amp; filtered.</span>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[10px]">
              2
            </span>
            <div>
              <div className="font-semibold text-slate-200">Run Barchart Analysis</div>
              <div className="text-slate-400 text-[10px] leading-tight mt-0.5">
                Click <strong className="text-cyan-300">▶ Run Barchart View 190898 Analysis</strong> to calculate consensus opinions, stability trends, and weekly options cadence.
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[10px]">
              3
            </span>
            <div>
              <div className="font-semibold text-slate-200">Manage &amp; Formulate Trades</div>
              <div className="text-slate-400 text-[10px] leading-tight mt-0.5">
                Review the Returned Screen below. Remove symbols with <strong className="text-rose-400">Trash</strong>, click <strong className="text-rose-400">Clear Screen</strong> to wipe, or <strong className="text-emerald-400">Send to Gemini AI Hub</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Presets Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto text-[11px] pt-1">
          <span className="text-slate-400 font-semibold shrink-0">Universe Presets:</span>
          <button
            type="button"
            onClick={() => {
              const syms = getSchwabImportedEquities().join(', ');
              onTosTickersInputChange(syms);
              onRunBarchartAnalysis(syms.split(', '));
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5"
            title="Populate with equities from Schwab CSV import / Living Trust account"
          >
            <span>Schwab Import Equities</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-mono">
              {getSchwabImportedEquities().length}
            </span>
          </button>
        </div>

        {/* Textarea for Symbols */}
        <textarea
          rows={2}
          value={tosTickersInput}
          onChange={(e) => onTosTickersInputChange(e.target.value)}
          placeholder="Paste comma or space-separated symbols (e.g. AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA or your custom tickers)..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
        />

        {tosError && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {tosError}
          </div>
        )}
      </div>

      {/* Empty State Card when Returned Screen is empty */}
      {tosWatchlistDataset && tosWatchlistDataset.records.length === 0 && (
        <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
            <Trash2 className="w-6 h-6 text-slate-400" />
          </div>
          <div className="font-bold text-slate-200 text-sm">Returned Screen is Empty</div>
          <p className="max-w-md mx-auto text-xs text-slate-400">
            All screened symbols have been cleared. Select a preset chip above, paste ThinkorSwim scan tickers, or upload a scan file, then click <span className="text-cyan-300 font-semibold">&quot;▶ Run Barchart View 190898 Analysis&quot;</span> to generate a fresh screen.
          </p>
        </div>
      )}

      {/* Return Screen Section in Barchart Top 1% Format */}
      {tosWatchlistDataset && tosWatchlistDataset.records.length > 0 && (
        <div className="space-y-3">
          {/* Action and Summary Bar for the Return Screen */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-white text-sm">
                Returned Screen ({tosWatchlistDataset.records.length} Analyzed Symbols)
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono text-[11px]">
                Barchart View 190898 Format
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSendScreenedToGemini('TOS')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-amber-300" />
                <span>Send to Gemini AI Hub &rarr;</span>
              </button>

              <button
                onClick={() => onCopyResultsTSV(tosWatchlistDataset)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Copy full table to clipboard as TSV"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy TSV</span>
              </button>

              <button
                onClick={() => onDownloadCSV(tosWatchlistDataset, 'tos_barchart_view_190898_screen')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={onClearReturnedScreen}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/50 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Bulk clear all symbols from Returned Screen"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear Screen ({tosWatchlistDataset.records.length})</span>
              </button>
            </div>
          </div>

          {/* Standardized Table matching Barchart Top 1% format */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl max-h-[620px] 2xl:max-h-[720px] overflow-y-auto relative table-scroll-container">
            <table className="w-full text-left text-xs font-mono border-collapse table-sticky-header">
              <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 text-[11px]">
                  <SortableTh label="Symbol" sortKey="symbol" currentSortKey={tosSortKey} currentSortOrder={tosSortOrder} onSort={requestTosSort} />
                  <SortableTh label="Company Name" sortKey="name" currentSortKey={tosSortKey} currentSortOrder={tosSortOrder} onSort={requestTosSort} />
                  <SortableTh label="Last Price" sortKey="last_price" currentSortKey={tosSortKey} currentSortOrder={tosSortOrder} onSort={requestTosSort} align="right" />
                  <SortableTh label="Change (% Chg)" sortKey="percent_change" currentSortKey={tosSortKey} currentSortOrder={tosSortOrder} onSort={requestTosSort} align="right" />
                  <SortableTh label="Barchart Consensus Opinion" sortKey="opinion_pct" currentSortKey={tosSortKey} currentSortOrder={tosSortOrder} onSort={requestTosSort} />
                  <SortableTh label="Stability (Prev → LW → LM)" sortKey="stability_previous" currentSortKey={tosSortKey} currentSortOrder={tosSortOrder} onSort={requestTosSort} align="center" />
                  <SortableTh label="Options Cadence" sortKey="has_weekly_options" currentSortKey={tosSortKey} currentSortOrder={tosSortOrder} onSort={requestTosSort} align="center" />
                  <SortableTh label="Recommended Strategy" sortKey="recommended_strategy" currentSortKey={tosSortKey} currentSortOrder={tosSortOrder} onSort={requestTosSort} />
                  <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-2.5 px-3 text-center text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedTosRecords.map((item) => {
                  const isPositive = item.price_change >= 0;
                  return (
                    <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">
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
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                              item.opinion_pct >= 90
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : item.opinion_pct >= 60
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {item.opinion}
                          </span>
                          <span className="text-[10px] text-amber-300 font-mono font-bold">
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
                        <div className="text-[10px] text-slate-400">13-Indicator Barchart Consensus</div>
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
                          <button
                            onClick={() => onRemoveSymbolFromScreen(item.symbol)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title={`Remove ${item.symbol} from Returned Screen`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
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
      )}
    </div>
  );
});

TosReturnScreenTab.displayName = 'TosReturnScreenTab';
