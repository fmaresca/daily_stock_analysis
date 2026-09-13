import React from 'react';
import { Upload, Copy, Download, RefreshCw } from '../../icons';

export interface ScreenerExportBarProps {
  isUploading: boolean;
  onUploadClick: () => void;
  onCopyResults: () => void;
  onExportCSV: () => void;
  onLiveRefresh: () => void;
  filteredRecordsCount: number;
  isRefreshing: boolean;
}

export const ScreenerExportBar: React.FC<ScreenerExportBarProps> = React.memo(({
  isUploading,
  onUploadClick,
  onCopyResults,
  onExportCSV,
  onLiveRefresh,
  filteredRecordsCount,
  isRefreshing,
}) => {
  return (
    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
      <button
        onClick={onUploadClick}
        disabled={isUploading}
        className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:border-amber-400/50 shadow-sm transition-all cursor-pointer"
        title="Upload any Barchart or MarketChameleon CSV directly"
      >
        <Upload className="w-3.5 h-3.5 text-amber-400" />
        <span>{isUploading ? 'Importing...' : 'Upload CSV'}</span>
      </button>

      <button
        onClick={onCopyResults}
        disabled={filteredRecordsCount === 0}
        className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:border-cyan-400/50 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        title="Copy all visible results with respective column headings to clipboard for instant pasting into Excel or notes"
      >
        <Copy className="w-3.5 h-3.5 text-cyan-400" />
        <span>Copy Results (TSV)</span>
      </button>

      <button
        onClick={onExportCSV}
        disabled={filteredRecordsCount === 0}
        className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-indigo-300 hover:border-indigo-400/50 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        title="Export visible screened candidates to CSV"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span>Export CSV</span>
      </button>

      <button
        onClick={onLiveRefresh}
        disabled={isRefreshing}
        className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-300 hover:border-emerald-400 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        title="Fetch latest screener synchronization payload"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Syncing...' : 'Sync Agent'}</span>
      </button>
    </div>
  );
});
