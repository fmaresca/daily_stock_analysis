/**
 * Systematic Options Strategy Backtest View & FINRA 4210 Stress Engine
 *
 * Attribution:
 * Section 1256 after-tax compounding and regime comparison ported from MIT-licensed
 * `howard-lynn-ye/Fin-RSI` (`fin_skills/_skills/section-1256-and-derivatives-tax/SKILL.md`,
 * source-verified 2026-09-09 against IRC §1256, IRS Pub 550 (2025), and Rev. Rul. 2026-16).
 *
 * IMPORTANT LEGAL & TAX DISCLAIMER:
 * Modelling assumptions for backtests, NOT tax advice.
 * Always consult a qualified CPA or licensed tax professional regarding your
 * specific tax situation and filing of IRS Form 6781.
 */

import React, { useState, useMemo } from 'react';
import { runOptionsBacktest, computeMarginStressTest, AfterTaxBacktestConfig } from '../utils/optionsBacktest';
import { exportCustomDataToExcel } from '../utils/exportImport';
import { getStoredTaxProfile } from '../utils/taxAlphaOptimizer';
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
  DollarSign,
  Info,
} from './icons';

interface OptionsBacktestViewProps {
  availableSymbols?: string[];
}

export const OptionsBacktestView: React.FC<OptionsBacktestViewProps> = ({
  availableSymbols = ['SPX', 'NDX', 'RUT', 'SPY', 'QQQ', 'IWM', 'NVDA', 'AAPL', 'MSFT', 'PLTR'],
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('SPX');
  const [selectedStrategy, setSelectedStrategy] = useState<
    '30D_CSP_15DELTA' | '7D_CSP_15DELTA' | 'BULL_PUT_SPREAD' | 'COVERED_CALL'
  >('30D_CSP_15DELTA');
  const [selectedYears, setSelectedYears] = useState<1 | 2 | 3>(2);

  // After-tax simulation controls (default OFF — pre-tax behavior unchanged)
  const [afterTaxMode, setAfterTaxMode] = useState<boolean>(false);
  const storedProfile = useMemo(() => getStoredTaxProfile(), []);
  const [shortTermRate, setShortTermRate] = useState<number>(storedProfile.marginalOrdinaryRatePct || 37);
  const [longTermRate, setLongTermRate] = useState<number>(storedProfile.longTermCapGainsRatePct || 20);

  // Active authority popup
  const [activeAuthority, setActiveAuthority] = useState<{ label: string; text: string } | null>(null);

  const afterTaxConfig: AfterTaxBacktestConfig | undefined = useMemo(() => {
    if (!afterTaxMode) return undefined;
    return {
      enabled: true,
      shortTermRatePct: shortTermRate,
      longTermRatePct: longTermRate,
    };
  }, [afterTaxMode, shortTermRate, longTermRate]);

  // Run backtest simulation
  const backtest = runOptionsBacktest(selectedSymbol, selectedStrategy, selectedYears, afterTaxConfig);

  // Approximate current spot & 0.15 delta short strike for stress testing
  const spotPrices: Record<string, number> = {
    SPX: 5850,
    NDX: 20400,
    RUT: 2200,
    SPY: 590,
    QQQ: 498,
    IWM: 218,
    NVDA: 128,
    AAPL: 226,
    MSFT: 428,
    PLTR: 32,
  };
  const currentSpot = spotPrices[selectedSymbol] || 100;
  const shortStrike = Math.round(currentSpot * 0.94); // ~0.15 delta put strike (~6% OTM)

  const stressScenarios = computeMarginStressTest(currentSpot, shortStrike, 1);

  const exportBacktestToCSV = () => {
    const summaryRows = [
      ['Metric', 'Value'],
      ['Symbol', backtest.symbol],
      ['Tax Regime', backtest.classification.badgeLabel],
      ['Strategy', `"${backtest.strategyName}"`],
      ['Timeframe', `${backtest.timeframeYears} Years`],
      ['Starting Capital', backtest.initialCapital],
      ['Ending Capital', backtest.endingCapital],
      ['Total Return %', `${backtest.totalReturnPct}%`],
      ['After-Tax Mode Enabled', afterTaxMode ? 'YES' : 'NO'],
      ...(afterTaxMode
        ? [
            ['After-Tax Ending Capital', backtest.afterTaxEndingCapital || 'N/A'],
            ['After-Tax Total Return %', `${backtest.afterTaxTotalReturnPct}%`],
            ['Total Tax Paid', `$${backtest.totalTaxPaid?.toLocaleString()}`],
          ]
        : []),
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
      { Metric: 'Tax Regime', Value: backtest.classification.badgeLabel },
      { Metric: 'Strategy', Value: backtest.strategyName },
      { Metric: 'Timeframe', Value: `${backtest.timeframeYears} Years` },
      { Metric: 'Starting Capital', Value: `$${backtest.initialCapital.toLocaleString()}` },
      { Metric: 'Ending Capital (Pre-Tax)', Value: `$${backtest.endingCapital.toLocaleString()}` },
      ...(afterTaxMode
        ? [
            { Metric: 'Ending Capital (After-Tax)', Value: `$${backtest.afterTaxEndingCapital?.toLocaleString()}` },
            { Metric: 'Total Return (After-Tax)', Value: `+${backtest.afterTaxTotalReturnPct}%` },
            { Metric: 'Total Tax Paid', Value: `$${backtest.totalTaxPaid?.toLocaleString()}` },
          ]
        : []),
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

    exportCustomDataToExcel(
      [
        { name: 'Strategy KPIs', data: summaryData },
        { name: 'Monthly Equity Curve', data: equityData },
        { name: 'FINRA 4210 Margin Stress', data: stressData },
      ],
      `options_backtest_${backtest.symbol}_${new Date().toISOString().slice(0, 10)}.xls`
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Systematic Options Strategy Backtester
                </h1>
                {/* Regime Badge for Selected Symbol */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveAuthority({
                      label: `${selectedSymbol} Statutory Tax Regime`,
                      text: `${backtest.classification.authority}\n\n${backtest.classification.explanation}`,
                    })
                  }
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                    backtest.classification.badgeLabel === '§1256'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                      : backtest.classification.badgeLabel === 'Equity option'
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                  title="Click to view tax authority"
                >
                  {backtest.classification.badgeLabel}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Simulate multi-year return profiles, win rates, drawdowns, and FINRA 4210 margin stress test requirements for institutional option strategies with optional Section 1256 after-tax compounding.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Underlying</span>
              <span className="text-base font-bold text-white">{selectedSymbol}</span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Spot Price</span>
              <span className="text-base font-bold text-slate-300">${currentSpot.toLocaleString()}</span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">
                {afterTaxMode ? 'After-Tax Ret.' : 'Total Return'}
              </span>
              <span className="text-base font-bold text-emerald-400">
                +{afterTaxMode ? backtest.afterTaxTotalReturnPct : backtest.totalReturnPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Strategy & Simulation Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
          {/* Strategy Picker */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              1. Select Strategy:
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
            <div className="flex flex-wrap p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono gap-1">
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

          {/* Export Actions & After-Tax Toggle */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              4. Mode &amp; Export:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAfterTaxMode(!afterTaxMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border flex items-center space-x-1.5 cursor-pointer ${
                  afterTaxMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle Section 1256 After-Tax Compounding & Year-End MTM debits"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>After-Tax Mode: {afterTaxMode ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={exportBacktestToExcel}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 text-xs font-semibold flex items-center space-x-1 transition-colors"
                title="Export Multi-Sheet Backtest to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={exportBacktestToCSV}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center space-x-1 transition-colors"
                title="Export Backtest to CSV"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* After-Tax Rate Controls & Warning Banner when ON */}
        {afterTaxMode && (
          <div className="p-4 rounded-xl bg-slate-950/95 border border-emerald-500/40 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                  Section 1256 After-Tax Compounding Engine
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                  Debiting tax at each Dec 31 MTM mark
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Attribution: howard-lynn-ye/Fin-RSI • Modelling assumptions, not tax advice
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Frank's Marginal Short-Term Rate (%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={shortTermRate}
                  onChange={(e) => setShortTermRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Frank's Long-Term Capital Gains Rate (%):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={longTermRate}
                  onChange={(e) => setLongTermRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 uppercase block">Blended 1256 Statutory Rate</span>
                <span className="text-base font-bold text-emerald-400">
                  {Math.round((0.6 * longTermRate + 0.4 * shortTermRate) * 10) / 10}%
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Authority: IRC §1256(a)(3) (60% LT / 40% ST)
                </span>
              </div>
            </div>

            {/* Holding Period Honesty Warning (Skill §4) */}
            {backtest.holdingPeriodWarning && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{backtest.holdingPeriodWarning}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Backtest KPI Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Cumulative Return */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {afterTaxMode ? 'After-Tax Total Return' : 'Total Strategy Return'}
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            +{afterTaxMode ? backtest.afterTaxTotalReturnPct : backtest.totalReturnPct}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {afterTaxMode ? `Pre-Tax: +${backtest.totalReturnPct}%` : `S&P 500: +${backtest.benchmarkReturnPct}%`}
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

        {/* Ending Capital */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {afterTaxMode ? 'After-Tax Ending Capital' : 'Ending Capital'}
          </div>
          <div className="text-lg font-black text-emerald-300 font-mono">
            ${(afterTaxMode ? backtest.afterTaxEndingCapital || backtest.endingCapital : backtest.endingCapital).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {afterTaxMode ? `Tax Paid: -$${backtest.totalTaxPaid?.toLocaleString()}` : '$100k starting base'}
          </div>
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

        {/* Sharpe / Sortino */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Sharpe / Sortino
          </div>
          <div className="text-lg font-black text-purple-400 font-mono">
            {backtest.sharpeRatio} / {backtest.sortinoRatio}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">High risk-adjusted yield</div>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Growth of $100,000 Portfolio: {backtest.strategyName}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-emerald-400 rounded" />
              <span className="text-emerald-400 font-semibold">
                {afterTaxMode ? 'After-Tax Strategy' : 'Strategy Pre-Tax'}
              </span>
            </span>
            {afterTaxMode && (
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-blue-400 rounded" />
                <span className="text-blue-300">Pre-Tax Baseline</span>
              </span>
            )}
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-slate-500 rounded" />
              <span className="text-slate-400">S&amp;P 500 Buy &amp; Hold</span>
            </span>
          </div>
        </div>

        {/* CSS-based Bar Timeline */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 overflow-x-auto">
          <div className="flex items-end space-x-2 min-w-[600px] h-44 pt-6 pb-2 border-b border-slate-800">
            {backtest.equityCurve.map((pt, idx) => {
              const afterTaxPt = backtest.regimeEquityCurve?.[idx];
              const effectiveStratVal = afterTaxMode
                ? (backtest.classification.regime === 'section1256'
                    ? afterTaxPt?.section1256Equity || pt.strategyEquity
                    : afterTaxPt?.equityOptionEquity || pt.strategyEquity)
                : pt.strategyEquity;

              const maxVal = Math.max(
                ...backtest.equityCurve.map((p) => Math.max(p.strategyEquity, p.benchmarkEquity))
              );
              const minVal = backtest.initialCapital * 0.95;
              const range = maxVal - minVal;

              const stratHeight = Math.max(10, Math.min(100, ((effectiveStratVal - minVal) / range) * 100));
              const benchHeight = Math.max(10, Math.min(100, ((pt.benchmarkEquity - minVal) / range) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {pt.date}: {afterTaxMode ? 'After-Tax' : 'Strat'} ${effectiveStratVal.toLocaleString()} | S&amp;P ${pt.benchmarkEquity.toLocaleString()}
                  </div>

                  <div className="w-full flex items-end justify-center space-x-1 h-36">
                    {/* Strategy Bar */}
                    <div
                      style={{ height: `${stratHeight}%` }}
                      className={`w-2.5 rounded-t transition-all ${
                        afterTaxMode
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                          : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                      }`}
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

      {/* Regime Comparison Panel (Skill §5): Answers "Was Section 1256 actually better for this strategy?" */}
      {afterTaxMode && backtest.regimeComparison && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/70 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                Tax Regime Comparison: Section 1256 vs. Equity Option
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Authority: IRC §1256 vs. IRC §1221 • Rate &amp; Timing Effects
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Total Economic Move</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                +${backtest.regimeComparison.totalEconomicMove.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Pre-tax economic profit</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block">Section 1256 Total Tax</span>
              <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                ${backtest.regimeComparison.section1256Tax.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono">60/40 blended tax rate</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-blue-500/30">
              <span className="text-[10px] text-blue-400 uppercase font-mono block">Equity Option Total Tax</span>
              <div className="text-base font-bold font-mono text-blue-300 mt-0.5">
                ${backtest.regimeComparison.equityOptionTax.toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-400/80 font-mono">Short-term ordinary tax</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/50">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block font-bold">
                Tax Alpha Advantage
              </span>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                {backtest.regimeComparison.netTaxAlpha >= 0 ? '+' : ''}$
                {backtest.regimeComparison.netTaxAlpha.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-300 font-mono">
                {backtest.regimeComparison.netTaxAlpha >= 0
                  ? '1256 treatment saved tax cash'
                  : 'Timing drag exceeded rate savings'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed font-sans">
            <p>
              <strong>Decomposition insight:</strong> Rate Effect provided{' '}
              <span className="text-emerald-400 font-bold">+${backtest.regimeComparison.rateEffect.toLocaleString()}</span> in statutory tax relief, while Timing Effect pulled forward{' '}
              <span className="text-amber-400 font-bold">${backtest.regimeComparison.timingEffect.toLocaleString()}</span> of tax liabilities to December 31 marks before cash close.
            </p>
            <p className="text-[11px] text-slate-400">
              {backtest.regimeComparison.disclaimer}
            </p>
          </div>
        </div>
      )}

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

      {/* Authority Details Modal */}
      {activeAuthority && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{activeAuthority.label}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveAuthority(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              {activeAuthority.text}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveAuthority(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
