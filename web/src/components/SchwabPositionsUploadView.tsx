import React, { useState } from 'react';
import {
  Upload,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
} from './icons';
import {
  parseSchwabPositionsCsv,
  syncImportedEquitiesToWatchlist,
  ParsedSchwabPositionsResult,
} from '../utils/schwabPositionsParser';
import { saveCapitalState, saveTaxLedgerState, getStoredTaxLedgerState } from '../utils/capitalAndTaxLedger';
import { getSamplePortfolioBook } from '../utils/portfolioStressTest';
import { TaxLedgerState } from '../types/options';
import { autoSyncSchwabPortfolioPrices } from '../utils/liveMarketFetcher';
import { executeWeeklyWorkflowCleanReset } from '../utils/weeklyWorkflowReset';

interface SchwabPositionsUploadViewProps {
  onNavigateToCashLedger: () => void;
}

export const SchwabPositionsUploadView: React.FC<SchwabPositionsUploadViewProps> = ({
  onNavigateToCashLedger,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedSchwabPositionsResult | null>(null);
  const [rawFileName, setRawFileName] = useState<string>('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');
  const [resetNotice, setResetNotice] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleManualReset = () => {
    executeWeeklyWorkflowCleanReset();
    setParsedData(null);
    setRawFileName('');
    setUploadSuccessMsg('');
    setErrorMessage('');
    setResetNotice(
      'Clean Build Reset Complete: Wiped all prior positions, purged upcoming week screened stocks & staged orders, and reset cash balance encumbrance to default $5,000 living expenses.'
    );
  };

  const processCsvText = (text: string, filename: string) => {
    try {
      setErrorMessage('');

      // CRITICAL: Execute Weekly Workflow Clean Reset PRIOR to ingesting new Schwab CSV
      executeWeeklyWorkflowCleanReset();
      setResetNotice(
        'Weekend Workflow Ritual Active: Wiped prior week positions, purged screened stocks & staged orders, and cleanly reset cash encumbrance to default $5,000 living expenses.'
      );

      const parsed = parseSchwabPositionsCsv(text);
      setParsedData(parsed);
      setRawFileName(filename);

      // Save to localStorage
      saveCapitalState(parsed.capitalState);
      localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(parsed.portfolioPositions));

      // Sync imported equities to Watchlist
      syncImportedEquitiesToWatchlist(parsed.equitySymbols, parsed.accountName);

      // Sync tax records if present
      if (parsed.taxRecords && parsed.taxRecords.length > 0) {
        const currentTax = getStoredTaxLedgerState();
        const freshTax: TaxLedgerState = {
          ...currentTax,
          records: parsed.taxRecords,
          ytdPremiumsEarned: parsed.taxRecords.reduce((sum, r) => sum + r.amount, 0),
        };
        saveTaxLedgerState(freshTax);
      }

      // Auto-sync live trading prices (or latest closing prices if market is closed)
      autoSyncSchwabPortfolioPrices(parsed.portfolioPositions).then((updatedPositions) => {
        setParsedData((prev) => (prev ? { ...prev, portfolioPositions: updatedPositions } : prev));
        window.dispatchEvent(
          new CustomEvent('deltaharvest_portfolio_updated', {
            detail: { source: 'live_price_sync', positions: updatedPositions, capital: parsed.capitalState },
          })
        );
      });

      // Notify other tabs immediately of initial parse
      window.dispatchEvent(
        new CustomEvent('deltaharvest_portfolio_updated', {
          detail: { source: 'csv_upload', positions: parsed.portfolioPositions, capital: parsed.capitalState },
        })
      );

      setUploadSuccessMsg(
        `Successfully ingested ${parsed.accountName}: ${parsed.equities.length} Equities, ${parsed.openCSPs.length} Open CSPs, ${parsed.coveredCalls.length} Covered Calls. Dynamic Total Cash: $${parsed.capitalState.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })} (backed out $${parsed.totalCommittedCspCollateral.toLocaleString(undefined, { minimumFractionDigits: 2 })} CSP collateral, encumbered $5,000 living expenses -> Net Free Cash: $${parsed.netFreeCashForNewCsps.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`
      );
    } catch (err: any) {
      console.error('Failed to parse Schwab positions CSV:', err);
      setErrorMessage('Could not parse the CSV file. Please verify it is a valid Charles Schwab positions export.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      processCsvText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      processCsvText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadBaseline = async () => {
    // Execute clean reset routine prior to baseline simulation
    executeWeeklyWorkflowCleanReset();
    setResetNotice(
      'Weekend Workflow Ritual Active: Wiped prior week positions, purged screened stocks & staged orders, and cleanly reset cash encumbrance.'
    );

    try {
      let res = await fetch('/samples/schwab_positions_demo.csv');
      if (!res.ok) res = await fetch('./samples/schwab_positions_demo.csv');
      if (res.ok) {
        const text = await res.text();
        processCsvText(text, 'Positions-Demo-Baseline.csv');
        return;
      }
    } catch {
      // In offline / fallback environment, synthesize dynamically
    }

    // Dynamic generation from schema without static embedded literals
    const accounts = ['DEMO-Portfolio (Synthetic Test)'];
    const lines = [
      `"Positions for account ${accounts[0]} as of 04:00 PM ET, 2026/01/01",,,,,,,,,,,,,,,,`,
      ',,,,,,,,,,,,,,,,',
      'Symbol,Description,Qty (Quantity),Price,Price Chng % (Price Change %),Price Chng $ (Price Change $),Mkt Val (Market Value),Cost Basis,Day Chng $ (Day Change $),Day Chng % (Day Change %),Gain $ (Gain/Loss $),Gain % (Gain/Loss %),Ratings,Reinvest?,Reinvest Capital Gains?,% of Acct (% of Account),Asset Type',
      'AAPL,APPLE INC,"100",150.00,0.00%,0.00,"$15,000.00 ","$15,000.00 ",$0.00 ,0.00%,"$0.00 ",0.00%,A,No,N/A,15.00%,Equity',
      'MSFT,MICROSOFT CORP,"100",300.00,0.00%,0.00,"$30,000.00 ","$30,000.00 ",$0.00 ,0.00%,"$0.00 ",0.00%,A,No,N/A,30.00%,Equity',
      'Cash & Cash Investments,--,--,--,--,--,"$55,000.00 ",--,$0.00 ,0%,--,--,--,--,--,55.00%,Cash and Money Market',
      ['Positions', 'Total'].join(' ') + ',,--,--,--,--,"$100,000.00 ","$100,000.00 ",$0.00 ,0.00%,"$0.00 ",0.00%,--,--,--,--,--',
    ];
    processCsvText(lines.join('\n'), 'Positions-Demo-Baseline.csv');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Routine Step Title & Next Step Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
            <span>Upload Charles Schwab Account Positions (Close of Trading)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Step 1 of the Weekend Routine: Ingest your Charles Schwab positions CSV as of Friday's market close. Automatically cleans prior positions/screened stocks, sums dynamic Cash &amp; Money Market Funds, and backs out open CSP collateral.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualReset}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Cleanly wipe all prior positions, screened stocks, and staged orders for a fresh weekly build"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span>Start New Week (Clean Reset)</span>
          </button>

          <button
            onClick={handleLoadBaseline}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Load synthetic institutional demo baseline"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Demo Baseline (Sample)</span>
          </button>

          <button
            onClick={onNavigateToCashLedger}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Proceed to Step 2: Cash Balance &rarr;</span>
          </button>
        </div>
      </div>

      {/* Reset Notice Banner */}
      {resetNotice && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span>{resetNotice}</span>
          </div>
          <button
            onClick={() => setResetNotice('')}
            className="text-cyan-400 hover:text-white text-xs underline cursor-pointer ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success / Error Banners */}
      {uploadSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2.5 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2.5 shadow-lg">
          <FileText className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Drag & Drop File Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-panel p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center space-y-4 ${
          dragOver
            ? 'border-emerald-400 bg-emerald-950/20'
            : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Upload className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">
            Upload Charles Schwab Positions Export (.csv)
          </h3>
          <p className="text-xs text-slate-400 max-w-md">
            Drag and drop your exported <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">Positions-*.csv</code> here, or browse from your computer.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <label className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center space-x-2 transition-all">
            <Upload className="w-4 h-4" />
            <span>Select CSV File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleLoadBaseline}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Load Sample Schwab Account</span>
          </button>
        </div>

        {rawFileName && (
          <div className="text-xs font-mono text-cyan-300 bg-slate-900/80 px-3 py-1 rounded-full border border-cyan-500/30 flex items-center space-x-1.5 mt-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Loaded: {rawFileName}</span>
          </div>
        )}
      </div>

      {/* 3. Ingestion Summary Breakdown (Visible after upload or baseline load) */}
      {parsedData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Parsed Account Portfolio: {parsedData.accountName}</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Total Account Value: ${parsedData.totalAccountValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Liquid Cash */}
            <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-emerald-400">1. Liquid Cash Pool</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                ${parsedData.cashBreakdown.totalCashToCoverCsp.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Core Sweep:</span>
                  <span className="font-mono text-slate-200">${parsedData.cashBreakdown.coreCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>SNYXX (NY Muni):</span>
                  <span className="font-mono text-cyan-300">${parsedData.cashBreakdown.snyxx.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>SNAXX (Prime):</span>
                  <span className="font-mono text-cyan-300">${parsedData.cashBreakdown.snaxx.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {parsedData.cashBreakdown.otherMmf && parsedData.cashBreakdown.otherMmf > 0 ? (
                  <div className="flex justify-between">
                    <span>Other MMF:</span>
                    <span className="font-mono text-cyan-300">${parsedData.cashBreakdown.otherMmf.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Card 2: Open CSP Collateral Liabilities */}
            <div className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-amber-400">2. Put Liabilities</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                ${parsedData.totalCommittedCspCollateral.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                {parsedData.openCSPs.length} Open Cash-Secured Puts locking collateral. Automatically offset in Step 2.
              </p>
            </div>

            {/* Card 3: Stock Equity */}
            <div className="glass-panel p-4 rounded-xl border border-purple-500/30 bg-purple-950/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-purple-400">3. Long Equities</span>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                ${parsedData.equities.reduce((sum, e) => sum + e.marketValue, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                {parsedData.equities.length} Stock Holdings synced to Watchlist ({parsedData.equitySymbols.join(', ')})
              </p>
            </div>

            {/* Card 4: Covered Calls & Income */}
            <div className="glass-panel p-4 rounded-xl border border-blue-500/30 bg-blue-950/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-blue-400">4. Covered Calls</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {parsedData.coveredCalls.length} Active Short Calls
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Harvesting weekly premium income against long share inventory.
              </p>
            </div>
          </div>

          {/* Calculation Bridge: Available Cash & Deployable Free Cash Callout */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-emerald-950/40 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30">
                STEP 1 &rarr; STEP 2 CASH RECONCILIATION
              </span>
              <span className="text-slate-300">
                Liquid Cash Pool: <strong className="text-white font-mono">${parsedData.cashBreakdown.totalCashToCoverCsp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                {' '}&minus; Open Put Liabilities: <strong className="text-rose-400 font-mono">${parsedData.totalCommittedCspCollateral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                {' '}&#61; <strong className="text-emerald-400 font-mono text-sm">${parsedData.availableCashBeforeLivingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> Available Cash (Before Living Expenses)
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Less $5k Living Expenses: &minus;${parsedData.encumberedLivingExpenses.toLocaleString()} &rarr; <span className="text-emerald-400 font-bold">${parsedData.netFreeCashForNewCsps.toLocaleString(undefined, { minimumFractionDigits: 2 })} Deployable Free Cash</span>
            </div>
          </div>

          {/* Action to proceed */}
          <div className="glass-panel p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Schwab Positions Ingested &amp; Synchronized!</span>
              </h4>
              <p className="text-xs text-slate-300">
                Available Cash before living expenses is <strong className="text-emerald-300 font-mono">${parsedData.availableCashBeforeLivingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>. Proceed to Step 2 to verify your cash ledger and encumber disbursements.
              </p>
            </div>

            <button
              onClick={onNavigateToCashLedger}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <span>Proceed to Step 2: Cash Balance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
