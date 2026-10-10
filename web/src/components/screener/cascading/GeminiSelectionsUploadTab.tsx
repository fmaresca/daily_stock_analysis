import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Zap,
  Trash2,
  ExternalLink,
  Copy,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  DollarSign,
} from '../../icons';
import { SortableTh } from '../../ui/SortableTh';
import { SortOrder } from '../../../utils/tableSort';
import {
  GeminiScreenResult,
  GeminiRecommendedTrade,
  AccountCapitalState,
} from '../../../types/options';
import {
  parseGeminiSelectionsFile,
  parseGeminiSelectionsCSV,
  fetchGoogleSheetCsv,
} from '../../../utils/geminiSelectionsParser';
import {
  exportGeminiTradesToCSV,
  exportGeminiTradesToExcel,
  downloadGeminiCsvTemplate,
  downloadGeminiExcelTemplate,
} from '../../../utils/exportImport';

export interface GeminiSelectionsUploadTabProps {
  capitalState: AccountCapitalState;
  parsedGeminiResult: GeminiScreenResult | null;
  onUpdateGeminiResult: (result: GeminiScreenResult) => void;
  onClearGeminiResult: () => void;
  onStageGeminiTrade: (trade: GeminiRecommendedTrade) => void;
  sortedGeminiTrades: GeminiRecommendedTrade[];
  geminiTradesSortKey: string;
  geminiTradesSortOrder: SortOrder;
  requestGeminiTradesSort: (key: string) => void;
  showToast: (msg: string) => void;
  onSelectSymbolForChart?: (symbol: string) => void;
  onNavigateToAiPrompt?: () => void;
}

export const GeminiSelectionsUploadTab: React.FC<GeminiSelectionsUploadTabProps> = React.memo(({
  capitalState,
  parsedGeminiResult,
  onUpdateGeminiResult,
  onClearGeminiResult,
  onStageGeminiTrade,
  sortedGeminiTrades,
  geminiTradesSortKey,
  geminiTradesSortOrder,
  requestGeminiTradesSort,
  showToast,
  onSelectSymbolForChart,
  onNavigateToAiPrompt,
}) => {
  const [activeImportMode, setActiveImportMode] = useState<'FILE' | 'GSHEET' | 'PASTE'>('FILE');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [rawPastedContent, setRawPastedContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload Handler
  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setUploadError('');
    setUploadSuccessMessage('');

    try {
      const parsed = await parseGeminiSelectionsFile(file);
      if (
        parsed.recommendedTrades.length === 0 &&
        parsed.borderlineCandidates.length === 0 &&
        parsed.excludedCandidates.length === 0
      ) {
        throw new Error(
          `No valid trade rows found in "${file.name}". Please ensure headers include Symbol/Ticker, Strike, Delta, or use our downloadable CSV/Excel template.`
        );
      }

      onUpdateGeminiResult(parsed);
      const msg = `Successfully imported "${file.name}": ${parsed.recommendedTrades.length} recommended trades, ${parsed.borderlineCandidates.length} borderline, ${parsed.excludedCandidates.length} excluded!`;
      setUploadSuccessMessage(msg);
      showToast(msg);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to process file';
      setUploadError(errMsg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
  };

  // Google Sheet Link Import Handler
  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl.trim()) {
      setUploadError('Please enter a valid Google Sheet URL.');
      return;
    }

    setIsProcessing(true);
    setUploadError('');
    setUploadSuccessMessage('');

    try {
      const parsed = await fetchGoogleSheetCsv(googleSheetUrl.trim());
      if (
        parsed.recommendedTrades.length === 0 &&
        parsed.borderlineCandidates.length === 0 &&
        parsed.excludedCandidates.length === 0
      ) {
        throw new Error('Google Sheet returned no recognized trade rows. Please verify column headers.');
      }

      onUpdateGeminiResult(parsed);
      const msg = `Successfully synced Google Sheet: ${parsed.recommendedTrades.length} recommended trades loaded!`;
      setUploadSuccessMessage(msg);
      showToast(msg);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to fetch Google Sheet.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Raw Pasted Text / TSV / CSV / Markdown Handler
  const handlePastedContentImport = () => {
    if (!rawPastedContent.trim()) {
      setUploadError('Please paste tabular text, CSV, TSV, or Gemini markdown into the box.');
      return;
    }

    setIsProcessing(true);
    setUploadError('');
    setUploadSuccessMessage('');

    try {
      const parsed = parseGeminiSelectionsCSV(rawPastedContent);
      if (
        parsed.recommendedTrades.length === 0 &&
        parsed.borderlineCandidates.length === 0 &&
        parsed.excludedCandidates.length === 0
      ) {
        throw new Error('No candidate trade rows detected in pasted text. Make sure columns include Symbol and Strike.');
      }

      onUpdateGeminiResult(parsed);
      const msg = `Parsed pasted data: ${parsed.recommendedTrades.length} recommended trades, ${parsed.borderlineCandidates.length} borderline, ${parsed.excludedCandidates.length} excluded!`;
      setUploadSuccessMessage(msg);
      showToast(msg);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to parse pasted content.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Summary statistics
  const totalCommitted = (parsedGeminiResult?.recommendedTrades || []).reduce(
    (sum, t) => sum + (t.capitalCommitted || 0),
    0
  );
  const avgDelta =
    parsedGeminiResult?.recommendedTrades && parsedGeminiResult.recommendedTrades.length > 0
      ? (
          parsedGeminiResult.recommendedTrades.reduce((sum, t) => sum + (t.delta || 0), 0) /
          parsedGeminiResult.recommendedTrades.length
        ).toFixed(2)
      : '0.20';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>5. Upload Final Gemini Selections</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  CSV • Google Sheet • Excel (.xlsx / .xls)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Import your final Gemini AI options selections directly into DeltaHarvest. Auto-populates Table 1 (Recommended Trades), Table 2 (Borderline), and Table 3 (Excluded), and activates 1-Click Charles Schwab Broker Staging.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToAiPrompt && (
            <button
              onClick={onNavigateToAiPrompt}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
            >
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              <span>Step 4: Gemini Prompt Matrix</span>
            </button>
          )}

          {parsedGeminiResult && parsedGeminiResult.recommendedTrades.length > 0 && (
            <button
              onClick={onClearGeminiResult}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Clear imported Gemini selections"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Selections</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Ingestion Mode Switcher & Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveImportMode('FILE');
                setUploadError('');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeImportMode === 'FILE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV / Excel File</span>
            </button>
            <button
              onClick={() => {
                setActiveImportMode('GSHEET');
                setUploadError('');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeImportMode === 'GSHEET'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Sheet URL</span>
            </button>
            <button
              onClick={() => {
                setActiveImportMode('PASTE');
                setUploadError('');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeImportMode === 'PASTE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy-Paste Grid / Markdown</span>
            </button>
          </div>

          {/* Template Download Shortcuts */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Templates:</span>
            <button
              onClick={() => downloadGeminiCsvTemplate()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer"
              title="Download standard CSV template with Table 1, 2, and 3 schema"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>CSV Template</span>
            </button>
            <button
              onClick={() => downloadGeminiExcelTemplate()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer"
              title="Download multi-sheet Microsoft Excel template"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Excel (.xls) Template</span>
            </button>
          </div>
        </div>

        {/* MODE A: File Upload Drag & Drop */}
        {activeImportMode === 'FILE' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/30'
                : 'border-slate-700/80 bg-slate-950/60 hover:border-emerald-500/50 hover:bg-slate-950/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,.tsv,.txt,.xlsx,.xls,.xml"
              className="hidden"
            />
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Drop your Gemini Selections File here, or click to browse
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supports <strong>.csv</strong>, <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.tsv</strong>, or <strong>.txt</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">RFC 4180 CSV</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Excel .xlsx Workbooks</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">SpreadsheetML .xls</span>
              </div>
            </div>
          </div>
        )}

        {/* MODE B: Google Sheet URL Input */}
        {activeImportMode === 'GSHEET' && (
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Google Sheet Shareable Link or Published Web URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0"
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleGoogleSheetImport}
                  disabled={isProcessing || !googleSheetUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Fetch Selections</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
              <strong className="text-emerald-300 block">💡 How Google Sheets Sync Works:</strong>
              <p>
                1. Set your Google Sheet access to <strong>&quot;Anyone with the link can view&quot;</strong> (or File &rarr; Share &rarr; Publish to web as CSV).
              </p>
              <p>
                2. DeltaHarvest parses the Sheet ID and GID automatically, downloading the real-time CSV and populating your 3 tables.
              </p>
              <p className="text-slate-400">
                Tip: You can also simply select your sheet cells (Ctrl+A), copy (Ctrl+C), and paste them using the <em>&quot;Copy-Paste Grid&quot;</em> tab!
              </p>
            </div>
          </div>
        )}

        {/* MODE C: Copy-Paste Raw Grid / Markdown */}
        {activeImportMode === 'PASTE' && (
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">
                  Paste Tabular Grid, CSV, or Gemini Markdown Response:
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Auto-detects tabs from Google Sheets/Excel or commas/markdown
                </span>
              </div>
              <textarea
                rows={6}
                value={rawPastedContent}
                onChange={(e) => setRawPastedContent(e.target.value)}
                placeholder="Paste tabular data copied from Google Sheets / Excel, or Gemini's markdown response (Table 1, Table 2, Table 3)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setRawPastedContent('')}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear Input
              </button>
              <button
                onClick={handlePastedContentImport}
                disabled={isProcessing || !rawPastedContent.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Parse Pasted Content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError('')} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {uploadSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uploadSuccessMessage}</span>
            </div>
            <button onClick={() => setUploadSuccessMessage('')} className="text-slate-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 3. Metrics Summary Strip */}
      {parsedGeminiResult && parsedGeminiResult.recommendedTrades.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">Recommended Trades</span>
            <span className="text-lg font-bold text-emerald-400">
              {parsedGeminiResult.recommendedTrades.length} Candidates
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">Total Collateral Committed</span>
            <span className="text-lg font-bold text-amber-300">
              ${totalCommitted.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">Average Sweet-Spot Delta</span>
            <span className="text-lg font-bold text-cyan-300">
              {avgDelta}&Delta;
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">Deployable Free Cash Cushion</span>
            <span className="text-lg font-bold text-white">
              ${Math.max(0, capitalState.freeCash - totalCommitted).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* 4. Interactive Display of 3 Tables */}
      {parsedGeminiResult && parsedGeminiResult.recommendedTrades.length > 0 ? (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Table 1: Institutional Recommended Options Trades</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Ready for Charles Schwab Order Workbench
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Click &quot;1-Click Stage&quot; on any candidate to push directly into your Charles Schwab order execution ticket.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportGeminiTradesToCSV(parsedGeminiResult)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                title="Export current parsed recommendations to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => exportGeminiTradesToExcel(parsedGeminiResult)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                title="Export current parsed recommendations to multi-sheet Excel (.xls)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Table 1 Data Grid */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl max-h-[620px] overflow-y-auto relative table-scroll-container">
            <table className="w-full text-left text-xs font-mono border-collapse table-sticky-header">
              <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <SortableTh label="Rank" sortKey="riskRank" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Ticker" sortKey="symbol" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Current Spot" sortKey="currentPrice" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Put Strike" sortKey="suggestedStrike" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Delta" sortKey="delta" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Est. Premium" sortKey="estPremiumAnnualized" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Cash Collateral" sortKey="capitalCommitted" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    Rationale &amp; Support Level
                  </th>
                  <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-2.5 px-3 text-right text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedGeminiTrades.map((trade, idx) => (
                  <tr key={`${trade.symbol}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-bold">#{trade.riskRank || idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-white text-sm">
                      <button
                        onClick={() => onSelectSymbolForChart?.(trade.symbol)}
                        className="text-cyan-300 hover:text-cyan-200 hover:underline"
                      >
                        {trade.symbol}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      ${trade.currentPrice > 0 ? trade.currentPrice.toFixed(2) : '—'}
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-bold font-mono text-sm">
                      ${trade.suggestedStrike.toFixed(2)} Put
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-bold font-mono">
                      {trade.delta.toFixed(2)}&Delta;
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold font-mono">
                      {trade.estPremiumAnnualized}
                    </td>
                    <td className="py-3 px-3 text-amber-300 font-bold font-mono">
                      ${trade.capitalCommitted.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-300 text-[11px] max-w-sm">
                      {trade.technicalJustification}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onStageGeminiTrade(trade)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                        title="Push directly into Charles Schwab Broker Staging"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>1-Click Stage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table 2 & Table 3 Panels */}
          {(parsedGeminiResult.borderlineCandidates.length > 0 ||
            parsedGeminiResult.excludedCandidates.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800">
              {parsedGeminiResult.borderlineCandidates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                  <span className="font-bold text-amber-300 block">
                    Table 2: Borderline Candidates ({parsedGeminiResult.borderlineCandidates.length})
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px] max-h-48 overflow-y-auto">
                    {parsedGeminiResult.borderlineCandidates.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold font-mono shrink-0">{b.symbol}:</span>
                        <span className="text-slate-400">{b.borderlineReason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedGeminiResult.excludedCandidates.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                  <span className="font-bold text-rose-300 block">
                    Table 3: Excluded Candidates ({parsedGeminiResult.excludedCandidates.length})
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px] max-h-48 overflow-y-auto">
                    {parsedGeminiResult.excludedCandidates.map((x, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold font-mono shrink-0">{x.symbol}:</span>
                        <span className="text-slate-400">{x.reasonForExclusion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">
            No Gemini Selections Currently Loaded
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload your CSV/Excel file or paste your Gemini Pro response above to review trade recommendations, verify collateral, and stage orders in Charles Schwab.
          </p>
        </div>
      )}
    </div>
  );
});

GeminiSelectionsUploadTab.displayName = 'GeminiSelectionsUploadTab';
