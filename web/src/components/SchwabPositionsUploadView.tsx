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
  const [errorMessage, setErrorMessage] = useState<string>('');

  const processCsvText = (text: string, filename: string) => {
    try {
      setErrorMessage('');
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

      // Notify other tabs
      window.dispatchEvent(
        new CustomEvent('deltaharvest_portfolio_updated', {
          detail: { source: 'csv_upload', positions: parsed.portfolioPositions, capital: parsed.capitalState },
        })
      );

      setUploadSuccessMsg(
        `Successfully ingested ${parsed.accountName}: ${parsed.equities.length} Equities, ${parsed.openCSPs.length} Open CSPs, ${parsed.coveredCalls.length} Covered Calls, and $${parsed.capitalState.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })} Total Liquid Cash!`
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

  const handleLoadBaseline = () => {
    // Generate fresh baseline book and simulate CSV ingestion
    const sampleBook = getSamplePortfolioBook();
    localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(sampleBook));
    
    // Create mock Schwab text format for Living Trust-Options ...609
    const mockCsv = `"Positions for account Living Trust-Options ...609 as of 04:00 PM ET, 2026/09/11"
"Symbol","Description","Quantity","Price","Price Change %","Price Change $","Market Value","Cost Basis","Gain/Loss %","Gain/Loss $","Total Gain/Loss %","Total Gain/Loss $","Rating","Security Type"
"Cash & Cash Investments","Bank Deposit Sweep",293703.52,1.00,0%,0.00,293703.52,293703.52,0%,0.00,0%,0.00,"","Cash"
"SNYXX","Schwab NY Municipal Money Fund Ultra",202775.94,1.00,0%,0.00,202775.94,202775.94,0%,0.00,0%,0.00,"","Money Market"
"SNAXX","Schwab Prime Advantage Money Fund Ultra",77341.30,1.00,0%,0.00,77341.30,77341.30,0%,0.00,0%,0.00,"","Money Market"
"AXTI","AXT Inc",1500,61.64,0%,0.00,92460.00,180160.13,-48.68%,-87700.13,-48.68%,-87700.13,"","Equity"
"BLZE","Backblaze Inc",11000,13.455,0%,0.00,148005.00,188173.41,-21.35%,-40168.41,-21.35%,-40168.41,"","Equity"
"IONQ","IonQ Inc",1500,39.52,0%,0.00,59280.00,88315.08,-32.88%,-29035.08,-32.88%,-29035.08,"","Equity"
"LUNR","Intuitive Machines Inc",5000,14.81,0%,0.00,74050.00,143934.00,-48.55%,-69884.00,-48.55%,-69884.00,"","Equity"
"NET","Cloudflare Inc",1300,278.92,0%,0.00,362596.00,380583.72,-4.73%,-17987.72,-4.73%,-17987.72,"","Equity"
"RTX","RTX Corp",1700,200.79,0%,0.00,341343.00,372209.38,-8.29%,-30866.38,-8.29%,-30866.38,"","Equity"
"TSLA","Tesla Inc",2000,354.08,0%,0.00,708160.00,786234.08,-9.93%,-78074.08,-9.93%,-78074.08,"","Equity"
"PANW 09/11/2026 327.50 P","PANW PUT",-3,5.375,0%,0.00,-1612.50,-1998.96,19.33%,386.46,19.33%,386.46,"","Option"
"PLTR 09/11/2026 165.00 P","PLTR PUT",-10,1.01,0%,0.00,-1010.00,-883.33,-14.34%,-126.67,-14.34%,-126.67,"","Option"
"AXTI 09/18/2026 70.00 C","AXTI CALL",-15,2.25,0%,0.00,-3375.00,-11464.50,70.56%,8089.50,70.56%,8089.50,"","Option"
"BLZE 09/18/2026 17.50 C","BLZE CALL",-110,0.15,0%,0.00,-1650.00,-10923.00,84.90%,9273.00,84.90%,9273.00,"","Option"
"IONQ 09/11/2026 43.50 C","IONQ CALL",-15,0.365,0%,0.00,-547.50,-634.50,13.71%,87.00,13.71%,87.00,"","Option"
"LUNR 09/11/2026 16.50 C","LUNR CALL",-50,0.13,0%,0.00,-650.00,-415.00,-56.63%,-235.00,-56.63%,-235.00,"","Option"
"NET 09/11/2026 300.00 C","NET CALL",-13,1.37,0%,0.00,-1781.00,-2070.90,14.00%,289.90,14.00%,289.90,"","Option"
"RTX 09/11/2026 207.50 C","RTX CALL",-17,0.27,0%,0.00,-459.00,-464.10,1.10%,5.10,1.10%,5.10,"","Option"
"TSLA 09/09/2026 370.00 C","TSLA CALL",-20,1.09,0%,0.00,-2180.00,-2766.00,21.19%,586.00,21.19%,586.00,"","Option"
"TSLA 09/11/2026 375.00 C","TSLA CALL",-20,0.19,0%,0.00,-380.00,-2580.00,85.27%,2200.00,85.27%,2200.00,"","Option"`;
    processCsvText(mockCsv, 'Positions-LivingTrust-Options-609.csv');
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
            Step 1 of the Weekend Routine: Ingest your Charles Schwab positions CSV as of Friday's market close. Automatically parses Bank Core Cash, Money Market Funds (SNYXX, SNAXX), open options (CSPs &amp; CCs), and stock lots.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleLoadBaseline}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Load live Charles Schwab Living Trust baseline with all 4 asset classes"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Schwab Account (...609 Baseline)</span>
          </button>

          <button
            onClick={onNavigateToCashLedger}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>Proceed to Step 2: Cash Balance &rarr;</span>
          </button>
        </div>
      </div>

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

          {/* Action to proceed */}
          <div className="glass-panel p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Schwab Positions Ingested &amp; Synchronized!</span>
              </h4>
              <p className="text-xs text-slate-300">
                Proceed to Step 2 to verify your Precalculated Cash Balance (Liquid Cash less Open Put Liabilities) and encumber planned disbursements.
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
