import React, { useState, useMemo } from 'react';
import {
  PortfolioPosition,
  getSamplePortfolioBook,
} from '../utils/portfolioStressTest';
import {
  getStoredCapitalState,
  getStoredTaxLedgerState,
  calculateNetTaxableMetrics,
} from '../utils/capitalAndTaxLedger';
import {
  AccountCapitalState,
  TaxLedgerState,
  GeminiScreenResult,
  OptionsTabType,
} from '../types/options';
import { downloadFile } from '../utils/exportImport';
import {
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
} from './icons';

interface WeeklyExecutiveReportViewProps {
  onNavigateTab?: (tab: OptionsTabType) => void;
}

export const WeeklyExecutiveReportView: React.FC<WeeklyExecutiveReportViewProps> = ({
  onNavigateTab,
}) => {
  // 1. Load Portfolio Positions
  const positions: PortfolioPosition[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_portfolio_book');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load portfolio book:', e);
    }
    return getSamplePortfolioBook();
  }, []);

  // 2. Load Capital Ledger State
  const capitalState: AccountCapitalState = useMemo(() => {
    return getStoredCapitalState(positions);
  }, [positions]);

  // 3. Load Tax Ledger State
  const taxState: TaxLedgerState = useMemo(() => {
    return getStoredTaxLedgerState();
  }, []);

  // 4. Load Parsed Gemini AI Pro Recommendations
  const parsedGeminiResult: GeminiScreenResult | null = useMemo(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_gemini_parsed_screen');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load parsed gemini result:', e);
    }
    return null;
  }, []);

  // Breakdown positions
  const stockPositions = useMemo(() => positions.filter((p) => p.type === 'STOCK'), [positions]);
  const coveredCallPositions = useMemo(() => positions.filter((p) => p.type === 'COVERED_CALL'), [positions]);
  const cspPositions = useMemo(() => positions.filter((p) => p.type === 'CSP'), [positions]);

  // Aggregate Totals
  const totalStockEquity = useMemo(
    () => stockPositions.reduce((acc, p) => acc + p.quantity * p.spotPrice, 0),
    [stockPositions]
  );
  const totalCspCollateral = useMemo(
    () => cspPositions.reduce((acc, p) => acc + p.strike * p.quantity * 100, 0),
    [cspPositions]
  );
  const totalNetAccountValue = useMemo(
    () => capitalState.totalCash + totalStockEquity,
    [capitalState.totalCash, totalStockEquity]
  );

  const taxMetrics = useMemo(() => calculateNetTaxableMetrics(taxState), [taxState]);

  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // EXPORT 1: Master CSV
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`WEEKLY EXECUTIVE OPTIONS & PORTFOLIO MASTER REPORT`);
    lines.push(`Generated:,"${reportDate}"`);
    lines.push('');

    lines.push(`1. EXECUTIVE CAPITAL & LIQUIDITY WATERFALL`);
    lines.push(`Total Liquid Brokerage Cash,$${capitalState.totalCash.toFixed(2)}`);
    lines.push(`Encumbered Planned Disbursements (Living Expenses),-$${(capitalState.totalEncumberedDisbursements || 5000).toFixed(2)}`);
    lines.push(`Committed CSP Collateral (100% Cash-Secured),-$${totalCspCollateral.toFixed(2)}`);
    lines.push(`True Deployable Free Cash,$${capitalState.freeCash.toFixed(2)}`);
    lines.push(`Single Equity Security CSP Limit,$200000.00 (STRICT MAX)`);
    lines.push(`Target Allocation per Position,$${(capitalState.maxPerPositionAllocation || 100000).toFixed(2)}`);
    lines.push(`Max Concurrent Positions Permitted,${capitalState.maxAllowedPositions} (Capped at 5 max)`);
    lines.push(`Long Stock Equity Value,$${totalStockEquity.toFixed(2)}`);
    lines.push(`Total Net Account Value,$${totalNetAccountValue.toFixed(2)}`);
    lines.push('');

    lines.push(`2. CALENDAR YTD PREMIUMS & TAX LEDGER`);
    lines.push(`Starting Prior-Year YTD Balance,$${(capitalState.priorYtdPremiumBalance || 0).toFixed(2)}`);
    lines.push(`Current Week Premiums Collected,$${(capitalState.currentWeekPremiumsCollected || 0).toFixed(2)}`);
    lines.push(`Cumulative YTD Premiums Earned,$${taxState.ytdPremiumsEarned.toFixed(2)}`);
    lines.push(`Prior-Year Loss Carryforward Applied,-$${taxMetrics.carryforwardApplied.toFixed(2)}`);
    lines.push(`Estimated Net Taxable Income,$${taxMetrics.netTaxableIncome.toFixed(2)}`);
    lines.push(`Remaining Capital Loss Carryforward,$${taxMetrics.remainingCarryforward.toFixed(2)}`);
    lines.push('');

    lines.push(`3. LONG STOCKS & COVERED CALLS INVENTORY`);
    lines.push(`Symbol,Shares,Cost Basis,Spot Price,Market Value,Unrealized P&L,Linked Call,DTE,Delta`);
    stockPositions.forEach((s) => {
      const linkedCc = coveredCallPositions.find((cc) => cc.symbol.toUpperCase() === s.symbol.toUpperCase());
      const mktVal = s.quantity * s.spotPrice;
      const pnl = mktVal - s.quantity * s.entryPrice;
      const ccDesc = linkedCc ? `$${linkedCc.strike} Call` : 'None';
      const dteDesc = linkedCc ? `${linkedCc.dte}d` : 'N/A';
      const deltaDesc = linkedCc ? `${linkedCc.delta}Δ` : 'N/A';
      lines.push(`${s.symbol},${s.quantity},$${s.entryPrice.toFixed(2)},$${s.spotPrice.toFixed(2)},$${mktVal.toFixed(2)},$${pnl.toFixed(2)},${ccDesc},${dteDesc},${deltaDesc}`);
    });
    lines.push('');

    lines.push(`4. OPEN CASH-SECURED PUTS (CSPS)`);
    lines.push(`Symbol,Contracts,Put Strike,Spot Price,DTE,Delta,Entry Prem,Current Option,P&L (%),Collateral,Status`);
    cspPositions.forEach((p) => {
      const col = p.strike * p.quantity * 100;
      const pnlPct = p.entryPrice > 0 ? ((p.entryPrice - p.currentOptionPrice) / p.entryPrice) * 100 : 0;
      const status = pnlPct >= 80 ? '80% Profit Target Hit' : p.spotPrice <= p.strike ? 'Tested ITM' : 'OTM On Track';
      lines.push(`${p.symbol},${p.quantity}x,$${p.strike.toFixed(2)},$${p.spotPrice.toFixed(2)},${p.dte}d,${p.delta}Δ,$${p.entryPrice.toFixed(2)},$${p.currentOptionPrice.toFixed(2)},${pnlPct.toFixed(1)}%,$${col.toFixed(2)},${status}`);
    });
    lines.push('');

    if (parsedGeminiResult && parsedGeminiResult.recommendedTrades.length > 0) {
      lines.push(`5. GEMINI AI PRO RECOMMENDED TRADES (FINAL 5)`);
      lines.push(`Rank,Ticker,Spot Price,Put Strike,Delta,Net Premium,Collateral,Rationale`);
      parsedGeminiResult.recommendedTrades.forEach((t) => {
        lines.push(`${t.riskRank},${t.symbol},$${t.currentPrice.toFixed(2)},$${t.suggestedStrike.toFixed(2)},${t.delta}Δ,"${t.estPremiumAnnualized}",$${t.capitalCommitted.toFixed(2)},"${(t.technicalJustification || '').replace(/"/g, '""')}"`);
      });
    }

    const csvContent = lines.join('\r\n');
    downloadFile(csvContent, `weekly_options_executive_report_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  };

  // EXPORT 2: Native Print / PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl print:hidden">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Weekly Options Executive Master Report
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Step 10 Output
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidated master audit of cash waterfall, stock inventory, open derivatives, and finalized Gemini AI trade recommendations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print to PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Master Report Body */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 print:border-none print:bg-white print:text-black print:p-0">
        {/* Printable Header */}
        <div className="border-b border-slate-800 pb-4 print:border-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white print:text-black">
                DELTAHARVEST OPTIONS INCOME MASTER DIGEST
              </h1>
              <span className="text-xs text-slate-400 font-mono print:text-gray-600">
                Audit Cycle: {reportDate} • 100% Cash-Secured Mandate
              </span>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400 block print:text-gray-600">Total Net Account Value</span>
              <span className="text-xl font-bold text-white print:text-black">
                ${totalNetAccountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Capital & Liquidity Waterfall */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-black">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            1. Executive Liquidity &amp; Cash Encumbrance Waterfall
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 print:bg-gray-100 print:border-gray-300">
              <span className="text-slate-400 block text-[11px] print:text-gray-600">Liquid Brokerage Cash</span>
              <span className="text-base font-bold text-white mt-0.5 block print:text-black">
                ${capitalState.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 print:bg-gray-100 print:border-gray-300">
              <span className="text-slate-400 block text-[11px] print:text-gray-600">Encumbered Disbursements</span>
              <span className="text-base font-bold text-rose-400 mt-0.5 block print:text-rose-700">
                -${(capitalState.totalEncumberedDisbursements || 5000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block print:text-gray-500">Weekly Living Expense</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 print:bg-gray-100 print:border-gray-300">
              <span className="text-slate-400 block text-[11px] print:text-gray-600">Committed Put Collateral</span>
              <span className="text-base font-bold text-amber-400 mt-0.5 block print:text-amber-700">
                -${totalCspCollateral.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-slate-500 block print:text-gray-500">100% Cash-Backed</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 print:bg-emerald-50 print:border-emerald-300">
              <span className="text-emerald-400 block text-[11px] font-bold print:text-emerald-800">True Deployable Free Cash</span>
              <span className="text-lg font-black text-emerald-300 mt-0.5 block print:text-emerald-700">
                ${capitalState.freeCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-500/80 block font-bold print:text-emerald-600">
                {capitalState.maxAllowedPositions} positions permitted (Max $200k/equity)
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Calendar YTD Premiums & Tax Ledger */}
        <div className="space-y-3 pt-2 border-t border-slate-800 print:border-gray-300">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-black">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            2. Calendar YTD Premiums &amp; Tax Alpha Ledger
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 print:bg-gray-100 print:border-gray-300">
              <span className="text-slate-400 block text-[11px] print:text-gray-600">Prior-Year Starting YTD</span>
              <span className="text-base font-bold text-slate-200 mt-0.5 block print:text-black">
                ${(capitalState.priorYtdPremiumBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 print:bg-gray-100 print:border-gray-300">
              <span className="text-slate-400 block text-[11px] print:text-gray-600">Current Week Harvest</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block print:text-emerald-700">
                +${(capitalState.currentWeekPremiumsCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 print:bg-gray-100 print:border-gray-300">
              <span className="text-slate-400 block text-[11px] print:text-gray-600">Loss Carryover Offset</span>
              <span className="text-base font-bold text-cyan-400 mt-0.5 block print:text-cyan-700">
                -${taxMetrics.carryforwardApplied.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 print:bg-gray-100 print:border-gray-300">
              <span className="text-slate-400 block text-[11px] print:text-gray-600">Estimated Net Taxable</span>
              <span className="text-base font-bold text-white mt-0.5 block print:text-black">
                ${taxMetrics.netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Long Stock Holdings & Covered Calls */}
        <div className="space-y-3 pt-2 border-t border-slate-800 print:border-gray-300">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-black">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            3. Long Stocks &amp; Covered Calls Inventory ({stockPositions.length} Holdings)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 print:border-black print:text-black">
                  <th className="py-2 px-2.5">Symbol</th>
                  <th className="py-2 px-2.5">Shares</th>
                  <th className="py-2 px-2.5">Cost Basis</th>
                  <th className="py-2 px-2.5">Spot Price</th>
                  <th className="py-2 px-2.5">Market Value</th>
                  <th className="py-2 px-2.5">Unrealized P&amp;L</th>
                  <th className="py-2 px-2.5">Linked Covered Call</th>
                  <th className="py-2 px-2.5">Covered Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                {stockPositions.map((stk) => {
                  const linkedCc = coveredCallPositions.find((cc) => cc.symbol.toUpperCase() === stk.symbol.toUpperCase());
                  const marketVal = stk.quantity * stk.spotPrice;
                  const totalCost = stk.quantity * stk.entryPrice;
                  const pnl = marketVal - totalCost;
                  const uncoveredShares = Math.max(0, stk.quantity - (linkedCc ? linkedCc.quantity * 100 : 0));

                  return (
                    <tr key={stk.id}>
                      <td className="py-2 px-2.5 font-bold text-white print:text-black">{stk.symbol}</td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">{stk.quantity} shs</td>
                      <td className="py-2 px-2.5 text-slate-400 print:text-gray-600">${stk.entryPrice.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-slate-200 print:text-black">${stk.spotPrice.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-slate-200 font-bold print:text-black">${marketVal.toLocaleString()}</td>
                      <td className="py-2 px-2.5">
                        <span className={pnl >= 0 ? 'text-emerald-400 print:text-emerald-700 font-bold' : 'text-rose-400 print:text-rose-700 font-bold'}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        {linkedCc ? (
                          <span className="text-emerald-300 print:text-black">
                            ${linkedCc.strike} C ({linkedCc.dte}d, {linkedCc.delta}&Delta;)
                          </span>
                        ) : (
                          <span className="text-slate-500 italic print:text-gray-500">None</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5">
                        {uncoveredShares >= 100 ? (
                          <span className="text-amber-400 font-bold print:text-amber-700">
                            ⚠️ {uncoveredShares} Uncovered
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold print:text-emerald-700">
                            ✓ Fully Covered
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Open Cash-Secured Put Positions */}
        <div className="space-y-3 pt-2 border-t border-slate-800 print:border-gray-300">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-black">
            <DollarSign className="w-4 h-4 text-amber-400" />
            4. Open Cash-Secured Puts ({cspPositions.length} Contracts Active)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 print:border-black print:text-black">
                  <th className="py-2 px-2.5">Symbol</th>
                  <th className="py-2 px-2.5">Contracts</th>
                  <th className="py-2 px-2.5">Strike</th>
                  <th className="py-2 px-2.5">Spot Price</th>
                  <th className="py-2 px-2.5">DTE</th>
                  <th className="py-2 px-2.5">Delta</th>
                  <th className="py-2 px-2.5">Collateral</th>
                  <th className="py-2 px-2.5">P&amp;L (%)</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                {cspPositions.map((pos) => {
                  const collateral = pos.strike * pos.quantity * 100;
                  const pnlPct = pos.entryPrice > 0 ? ((pos.entryPrice - pos.currentOptionPrice) / pos.entryPrice) * 100 : 0;
                  const is80 = pnlPct >= 80;

                  return (
                    <tr key={pos.id}>
                      <td className="py-2 px-2.5 font-bold text-white print:text-black">{pos.symbol}</td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">{pos.quantity}x</td>
                      <td className="py-2 px-2.5 text-slate-200 font-bold print:text-black">${pos.strike.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-slate-400 print:text-gray-600">${pos.spotPrice.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">{pos.dte}d</td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">{pos.delta}&Delta;</td>
                      <td className="py-2 px-2.5 text-amber-400 font-bold print:text-black">${collateral.toLocaleString()}</td>
                      <td className="py-2 px-2.5">
                        <span className={pnlPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {pnlPct.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        {is80 ? (
                          <span className="text-emerald-400 font-bold print:text-emerald-700">🎯 80% Captured</span>
                        ) : pos.spotPrice <= pos.strike ? (
                          <span className="text-rose-400 font-bold print:text-rose-700">⚠️ In The Money</span>
                        ) : (
                          <span className="text-slate-400 print:text-gray-600">✓ On Track (OTM)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: Gemini AI Pro Recommended New Put Trades (Table 1) */}
        {parsedGeminiResult && parsedGeminiResult.recommendedTrades.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-800 print:border-gray-300">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 print:text-black">
              <Sparkles className="w-4 h-4" />
              5. Final Gemini AI Extended Thinking Recommended Trades ({parsedGeminiResult.recommendedTrades.length} Candidates)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 print:border-black print:text-black">
                    <th className="py-2 px-2.5">Rank</th>
                    <th className="py-2 px-2.5">Ticker</th>
                    <th className="py-2 px-2.5">Spot Price</th>
                    <th className="py-2 px-2.5">Put Strike</th>
                    <th className="py-2 px-2.5">Delta</th>
                    <th className="py-2 px-2.5">Est. Premium</th>
                    <th className="py-2 px-2.5">Collateral</th>
                    <th className="py-2 px-2.5">Rationale / Support Anchor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-300">
                  {parsedGeminiResult.recommendedTrades.map((trade, idx) => (
                    <tr key={`${trade.symbol}-${idx}`}>
                      <td className="py-2 px-2.5 text-slate-500 print:text-black font-bold">#{trade.riskRank || idx + 1}</td>
                      <td className="py-2 px-2.5 font-bold text-white print:text-black">{trade.symbol}</td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">${trade.currentPrice.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-emerald-300 font-bold print:text-black">${trade.suggestedStrike.toFixed(2)} Put</td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black">{trade.delta}&Delta;</td>
                      <td className="py-2 px-2.5 text-emerald-400 font-bold print:text-black">{trade.estPremiumAnnualized}</td>
                      <td className="py-2 px-2.5 text-amber-300 font-bold print:text-black">${trade.capitalCommitted.toLocaleString()}</td>
                      <td className="py-2 px-2.5 text-slate-300 print:text-black text-[11px]">{trade.technicalJustification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
