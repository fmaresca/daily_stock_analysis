import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { runOptionsBacktest, computeMarginStressTest } from '../utils/optionsBacktest';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Activity,
  BarChart2,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Printer,
} from './icons';

interface OptionsBacktestViewProps {
  availableSymbols?: string[];
}

export const OptionsBacktestView: React.FC<OptionsBacktestViewProps> = ({
  availableSymbols = ['SPY', 'NVDA', 'AAPL', 'MSFT', 'QQQ', 'PLTR', 'IWM'],
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('SPY');
  const [selectedStrategy, setSelectedStrategy] = useState<
    '30D_CSP_15DELTA' | '7D_CSP_15DELTA' | 'BULL_PUT_SPREAD' | 'COVERED_CALL'
  >('30D_CSP_15DELTA');
  const [selectedYears, setSelectedYears] = useState<1 | 2 | 3>(2);

  // Run backtest simulation
  const backtest = runOptionsBacktest(selectedSymbol, selectedStrategy, selectedYears);

  // Approximate current spot & 0.15 delta short strike for stress testing
  const spotPrices: Record<string, number> = {
    SPY: 590,
    NVDA: 128,
    AAPL: 226,
    MSFT: 428,
    QQQ: 498,
    PLTR: 32,
    IWM: 218,
  };
  const currentSpot = spotPrices[selectedSymbol] || 100;
  const shortStrike = Math.round(currentSpot * 0.94); // ~0.15 delta put strike (~6% OTM)

  const stressScenarios = computeMarginStressTest(currentSpot, shortStrike, 1);

  const exportBacktestToCSV = () => {
    const summaryRows = [
      ['Metric', 'Value'],
      ['Symbol', backtest.symbol],
      ['Strategy', `"${backtest.strategyName}"`],
      ['Timeframe', `${backtest.timeframeYears} Years`],
      ['Starting Capital', backtest.initialCapital],
      ['Ending Capital', backtest.endingCapital],
      ['Total Return %', `${backtest.totalReturnPct}%`],
      ['S&P 500 Benchmark %', `${backtest.benchmarkReturnPct}%`],
      ['Win Rate %', `${backtest.winRatePct}%`],
      ['Total Trades', backtest.totalTrades],
      ['Sharpe Ratio', backtest.sharpeRatio],
      ['Sortino Ratio', backtest.sortinoRatio],
      ['Max Drawdown %', `${backtest.maxDrawdownPct}%`],
      ['Net Premium Harvested', `$${backtest.totalPremiumHarvested}`],
      ['Assignment Rate %', `${backtest.assignmentRatePct}%`],
      [],
      ['Date', 'Strategy Equity', 'Benchmark Equity'],
      ...backtest.equityCurve.map((pt) => [pt.date, pt.strategyEquity, pt.benchmarkEquity]),
    ];

    const csvContent = summaryRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backtest_${backtest.symbol}_${selectedStrategy}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBacktestToExcel = () => {
    const summaryData = [
      { Metric: 'Underlying Asset', Value: backtest.symbol },
      { Metric: 'Strategy', Value: backtest.strategyName },
      { Metric: 'Timeframe', Value: `${backtest.timeframeYears} Years` },
      { Metric: 'Starting Capital', Value: `$${backtest.initialCapital.toLocaleString()}` },
      { Metric: 'Ending Capital', Value: `$${backtest.endingCapital.toLocaleString()}` },
      { Metric: 'Total Strategy Return', Value: `+${backtest.totalReturnPct}%` },
      { Metric: 'S&P 500 Benchmark Return', Value: `+${backtest.benchmarkReturnPct}%` },
      { Metric: 'Win Rate (OTM Expiry)', Value: `${backtest.winRatePct}%` },
      { Metric: 'Winning / Total Trades', Value: `${backtest.winningTrades} of ${backtest.totalTrades}` },
      { Metric: 'Sharpe Ratio', Value: backtest.sharpeRatio },
      { Metric: 'Sortino Ratio', Value: backtest.sortinoRatio },
      { Metric: 'Max Drawdown (MDD)', Value: `-${backtest.maxDrawdownPct}%` },
      { Metric: 'Net Premium Collected', Value: `$${backtest.totalPremiumHarvested.toLocaleString()}` },
      { Metric: 'Assignment Rate', Value: `${backtest.assignmentRatePct}%` },
    ];

    const equityData = backtest.equityCurve.map((pt) => ({
      Month: pt.date,
      'Strategy Portfolio ($)': pt.strategyEquity,
      'S&P 500 Benchmark ($)': pt.benchmarkEquity,
    }));

    const stressData = stressScenarios.map((sc) => ({
      Scenario: sc.scenarioName,
      'Price Shock': `${sc.spotPriceChangePct}%`,
      'New Spot Price': `$${sc.newSpotPrice}`,
      'Standard Reg-T Margin': `$${sc.regTMarginRequired.toLocaleString()}`,
      'Portfolio Margin (TIMS)': `$${sc.portfolioMarginRequired.toLocaleString()}`,
      'Capital Saved / Freed': `$${sc.capitalSavedByPM.toLocaleString()}`,
      'Risk Status': sc.riskStatus,
    }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsEquity = XLSX.utils.json_to_sheet(equityData);
    const wsStress = XLSX.utils.json_to_sheet(stressData);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Strategy KPIs');
    XLSX.utils.book_append_sheet(wb, wsEquity, 'Monthly Equity Curve');
    XLSX.utils.book_append_sheet(wb, wsStress, 'FINRA 4210 Margin Stress');

    XLSX.writeFile(wb, `options_backtest_${backtest.symbol}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Strategy, Asset & Timeframe Pickers */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Strategy Selector */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              1. Select Systematic Options Strategy:
            </span>
            <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedStrategy('30D_CSP_15DELTA')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedStrategy === '30D_CSP_15DELTA'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30D CSP (0.15–0.20Δ)
              </button>
              <button
                onClick={() => setSelectedStrategy('7D_CSP_15DELTA')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedStrategy === '7D_CSP_15DELTA'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7D Weekly CSP (0.15–0.20Δ)
              </button>
              <button
                onClick={() => setSelectedStrategy('BULL_PUT_SPREAD')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedStrategy === 'BULL_PUT_SPREAD'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bull Put Credit Spread
              </button>
              <button
                onClick={() => setSelectedStrategy('COVERED_CALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedStrategy === 'COVERED_CALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Covered Call Income
              </button>
            </div>
          </div>

          {/* Asset Picker */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              2. Underlying Asset:
            </span>
            <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
              {availableSymbols.map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                    selectedSymbol === sym
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              3. Timeframe:
            </span>
            <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
              {[1, 2, 3].map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYears(y as 1 | 2 | 3)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedYears === y
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {y} {y === 1 ? 'Year' : 'Years'}
                </button>
              ))}
            </div>
          </div>

          {/* Export Actions */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              4. Export &amp; Print:
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportBacktestToExcel}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Export Multi-Sheet Backtest to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={exportBacktestToCSV}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Export Backtest to CSV"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                title="Print or Save PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backtest KPI Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Cumulative Return */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Strategy Return
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            +{backtest.totalReturnPct}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            S&amp;P 500: +{backtest.benchmarkReturnPct}%
          </div>
        </div>

        {/* Win Rate */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Win Rate (OTM Expiry)
          </div>
          <div className="text-lg font-black text-blue-400 font-mono">
            {backtest.winRatePct}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {backtest.winningTrades} of {backtest.totalTrades} trades
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Sharpe / Sortino
          </div>
          <div className="text-lg font-black text-purple-400 font-mono">
            {backtest.sharpeRatio} / {backtest.sortinoRatio}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">High risk-adjusted yield</div>
        </div>

        {/* Max Drawdown */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Max Drawdown (MDD)
          </div>
          <div className="text-lg font-black text-amber-400 font-mono">
            -{backtest.maxDrawdownPct}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Market MDD: -18.2%</div>
        </div>

        {/* Net Premium Harvested */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Net Premium Harvested
          </div>
          <div className="text-lg font-black text-emerald-300 font-mono">
            +${backtest.totalPremiumHarvested.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">On $100k starting capital</div>
        </div>

        {/* Assignment Rate */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Assignment Rate
          </div>
          <div className="text-lg font-black text-slate-200 font-mono">
            {backtest.assignmentRatePct}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {backtest.assignmentsCount} assignments
          </div>
        </div>
      </div>

      {/* Visual Simulation Equity Curve */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Cumulative Growth of $100,000 Portfolio: {backtest.strategyName}
            </h3>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 rounded" />
              <span className="text-emerald-400 font-semibold">0.15–0.20Δ DeltaHarvest Strategy</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-slate-500 rounded" />
              <span className="text-slate-400">S&amp;P 500 Buy &amp; Hold</span>
            </span>
          </div>
        </div>

        {/* CSS-based Bar/Curve Timeline */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
          <div className="flex items-end space-x-2 min-w-[600px] h-44 pt-6 pb-2 border-b border-slate-800">
            {backtest.equityCurve.map((pt, idx) => {
              const maxVal = Math.max(
                ...backtest.equityCurve.map((p) => Math.max(p.strategyEquity, p.benchmarkEquity))
              );
              const minVal = backtest.initialCapital * 0.95;
              const range = maxVal - minVal;

              const stratHeight = Math.max(10, Math.min(100, ((pt.strategyEquity - minVal) / range) * 100));
              const benchHeight = Math.max(10, Math.min(100, ((pt.benchmarkEquity - minVal) / range) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {pt.date}: Strat ${pt.strategyEquity.toLocaleString()} | S&amp;P ${pt.benchmarkEquity.toLocaleString()}
                  </div>

                  <div className="w-full flex items-end justify-center space-x-1 h-36">
                    {/* Strategy Bar */}
                    <div
                      style={{ height: `${stratHeight}%` }}
                      className="w-2.5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all"
                    />
                    {/* Benchmark Bar */}
                    <div
                      style={{ height: `${benchHeight}%` }}
                      className="w-2 bg-slate-700 rounded-t transition-all"
                    />
                  </div>

                  <span className="text-[9px] text-slate-500 font-mono mt-1 rotate-45 origin-left">
                    {idx % 3 === 0 ? pt.date.slice(2) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FINRA 4210 Reg-T vs. Portfolio Margin Stress Test */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                FINRA 4210 Reg-T vs. Portfolio Margin (TIMS) Stress Test
              </h3>
              <p className="text-xs text-slate-400">
                1 Contract ({selectedSymbol} Spot ${currentSpot}, Short Strike ${shortStrike} Put)
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Portfolio Margin requires FINRA Rule 4210 approval ($110k+ equity)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Stress Shock Scenario</th>
                <th className="py-2.5 px-3 text-right">New Spot Price</th>
                <th className="py-2.5 px-3 text-right">Standard Reg-T Margin</th>
                <th className="py-2.5 px-3 text-right">Portfolio Margin (TIMS)</th>
                <th className="py-2.5 px-3 text-right">Capital Saved / Freed</th>
                <th className="py-2.5 px-3 text-center">Margin Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stressScenarios.map((sc, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{sc.scenarioName}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{sc.description}</div>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-200">
                    ${sc.newSpotPrice.toFixed(2)} ({sc.spotPriceChangePct}%)
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300 font-bold">
                    ${sc.regTMarginRequired.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                    ${sc.portfolioMarginRequired.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-blue-400 font-bold">
                    +${sc.capitalSavedByPM.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        sc.riskStatus === 'SAFE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : sc.riskStatus === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {sc.riskStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
