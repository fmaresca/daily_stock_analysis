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
    
    // Create mock Schwab text format for Living Trust-Options ...609 from latest real export
    const mockCsv = `"Positions for account Living Trust-Options ...609 as of 11:35 AM ET, 2026/09/12",,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,
Symbol,Description,Qty (Quantity),Price,Price Chng % (Price Change %),Price Chng $ (Price Change $),Mkt Val (Market Value),Cost Basis,Day Chng $ (Day Change $),Day Chng % (Day Change %),Gain $ (Gain/Loss $),Gain % (Gain/Loss %),Ratings,Reinvest?,Reinvest Capital Gains?,% of Acct (% of Account),Asset Type
AXTI,AXT INC,"1,500",64.77,0.11%,0.07,"$97,155.00 ","$180,160.13 ",$105.00 ,0.11%,"($83,005.13)",-46.07%,D,No,N/A,4.04%,Equity
BLZE,BACKBLAZE INC CLASS A,"11,000",12.4,0.73%,0.09,"$136,400.00 ","$188,173.41 ",$990.00 ,0.73%,"($51,773.41)",-27.51%,C,No,N/A,5.67%,Equity
IONQ,IONQ INC,"1,500",36.75,-0.24%,-0.09,"$55,125.00 ","$88,315.08 ",($135.00),-0.24%,"($33,190.08)",-37.58%,F,No,N/A,2.29%,Equity
LUNR,INTUITIVE MACHS INC CLASS A,"5,000",14.35,-1.85%,-0.27,"$71,750.00 ","$143,934.00 ","($1,350.00)",-1.85%,"($72,184.00)",-50.15%,F,No,N/A,2.98%,Equity
NET,CLOUDFLARE INC CLASS A,"1,300",306.53,-1.49%,-4.64,"$398,489.00 ","$380,583.72 ","($6,032.00)",-1.49%,"$17,905.28 ",4.70%,C,No,N/A,16.57%,Equity
RTX,RTX CORP,"1,700",197.68,-0.22%,-0.44,"$336,056.00 ","$372,209.38 ",($748.00),-0.22%,"($36,153.38)",-9.71%,A,No,N/A,13.97%,Equity
TSLA,TESLA INC,"2,000",365.44,0.52%,1.88,"$730,880.00 ","$786,234.08 ","$3,760.00 ",0.52%,"($55,354.08)",-7.04%,F,Yes,N/A,30.38%,Equity
AXTI 09/18/2026 70.00 C,CALL AXT INC $70 EXP 09/18/26,-15,1.6211,-23.71%,-0.5037,"($2,431.65)","($11,464.76)",$755.55 ,23.71%,"$9,033.11 ",78.79%,-,N/A,N/A,-,Option
BLZE 09/18/2026 17.50 C,CALL BACKBLAZE INC $17.5 EXP 09/18/26,-110,0.0325,-29.96%,-0.0139,($357.50),"($10,926.45)",$152.90 ,29.96%,"$10,568.95 ",96.73%,-,N/A,N/A,-,Option
IONQ 09/18/2026 41.00 C,CALL IONQ INC $41 EXP 09/18/26,-15,0.2808,-32.19%,-0.1333,($421.20),($620.01),$199.95 ,32.19%,$198.81 ,32.07%,-,N/A,N/A,-,Option
NET 09/18/2026 305.00 C,CALL CLOUDFLARE INC $305 EXP 09/18/26,-13,8.8689,-36.98%,-5.2037,"($11,529.57)","($13,719.07)","$6,764.81 ",36.98%,"$2,189.50 ",15.96%,-,N/A,N/A,-,Option
PLTR 09/18/2026 160.00 P,PUT PALANTIR TECHNOLOGIE$160 EXP 09/18/26,-10,1.395,-38.55%,-0.875,"($1,395.00)","($1,593.32)",$875.00 ,38.55%,$198.32 ,12.45%,-,N/A,N/A,-,Option
RTX 09/18/2026 205.00 C,CALL RTX CORP $205 EXP 09/18/26,-17,0.37,-35.09%,-0.2,($629.00),($838.67),$340.00 ,35.09%,$209.67 ,25%,-,N/A,N/A,-,Option
TSLA 09/14/2026 380.00 C,CALL TESLA INC $380 EXP 09/14/26,-20,0.285,-68.68%,-0.625,($570.00),"($1,286.66)","$1,250.00 ",68.68%,$716.66 ,55.70%,-,N/A,N/A,-,Option
SNYXX,SCHWAB NEW YORK MUNICIPAL MONEY ULTRA,"202,775.94",1,0%,0,"$202,775.94 ","$202,775.94 ",$0.00 ,0%,$0.00 ,0%,-,Yes,Yes,8.43%,Cash and Money Market
SNAXX,SCHWAB PRIME ADVANTAGE MONEY ULTRA,"77,341.30",1,0%,0,"$77,341.30 ","$77,341.30 ",$0.00 ,0%,$0.00 ,0%,-,Yes,Yes,3.22%,Cash and Money Market
Cash & Cash Investments,--,--,--,--,--,"$299,590.53 ",--,$0.00 ,0%,--,--,--,--,--,12.45%,Cash and Money Market
Positions Total,,--,--,--,--,"$2,388,228.85 ","$2,379,278.10 ","$6,928.21 ",0.29%,"($290,639.78)",-12.22%,--,--,--,--,--`;
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
