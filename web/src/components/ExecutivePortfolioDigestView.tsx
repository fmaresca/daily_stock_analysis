import React, { useState, useMemo } from 'react';
import {
  getSampleExecutiveMetrics,
  ExecutiveDigestMetrics,
  generateMarkdownExecutiveReport,
} from '../utils/executiveReportGenerator';
import {
  Award,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  Sliders,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  Printer,
} from './icons';

export const ExecutivePortfolioDigestView: React.FC = () => {
  const [metrics, setMetrics] = useState<ExecutiveDigestMetrics>(() => getSampleExecutiveMetrics());

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownExecutiveReport(metrics);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeltaHarvest_Executive_Digest_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Executive Portfolio Health Digest &amp; Audit Briefing
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Institutional Risk Deck
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Consolidated C-Suite overview aggregating net portfolio telemetry: <strong>Daily Theta Run-Rate</strong>, <strong>SPY Beta Exposure</strong>, <strong>Portfolio Margin (TIMS) Relief</strong>, and <strong>Threatened 0.50Δ Positions</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Markdown</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Executive PDF</span>
            </button>
          </div>
        </div>

        {/* Top Executive KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Net Liquidity */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Net Liquidation</span>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              ${metrics.netLiquidity.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              ${metrics.freeCash.toLocaleString()} Cash ({metrics.cashReservePct}%)
            </span>
          </div>

          {/* Daily Theta Cashflow */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 uppercase font-mono block">Daily Theta Harvest</span>
            <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
              +${metrics.dailyTheta.toFixed(2)}/day
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              ~${metrics.projectedMonthlyCashflow.toLocaleString()} / mo run-rate
            </span>
          </div>

          {/* SPY Beta Delta */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">SPY Beta Delta</span>
            <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
              +{metrics.betaWeightedDelta}Δ
            </div>
            <span className="text-[10px] text-slate-400">
              {metrics.directionalBias} Directional Bias
            </span>
          </div>

          {/* Capital Relief */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30">
            <span className="text-[10px] text-indigo-400 uppercase font-mono block">Portfolio Margin (TIMS)</span>
            <div className="text-base font-bold font-mono text-indigo-300 mt-0.5">
              {metrics.capitalReliefPct}% Saved
            </div>
            <span className="text-[10px] text-indigo-400 font-mono">
              +${(metrics.regTMarginUsed - metrics.portfolioMarginUsed).toLocaleString()} Free Margin
            </span>
          </div>

          {/* Win Rate */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Trailing Win Rate</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {metrics.winRatePct}%
            </div>
            <span className="text-[10px] text-slate-500">12-Month Closed P&amp;L</span>
          </div>

          {/* Compliance Score */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/50">
            <span className="text-[10px] text-emerald-400 uppercase font-mono block">Compliance Health</span>
            <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
              {metrics.complianceHealthScore} / 100
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Institutional Grade</span>
          </div>
        </div>
      </div>

      {/* Threat Assessment & Action Register */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-950/60">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Position Health &amp; Threat Register</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {metrics.totalPositions} Total Open Positions
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block">Safe Positions (Δ &lt; 0.30)</span>
              <div className="text-lg font-bold text-emerald-300 font-mono">
                {metrics.safePositions} Contracts
              </div>
              <span className="text-[10px] text-slate-400 block">Outside 2 SD Bollinger bounds</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <span className="text-[10px] text-rose-400 uppercase font-mono block">Threatened (Δ &ge; 0.40)</span>
              <div className="text-lg font-bold text-rose-300 font-mono">
                {metrics.threatenedPositions} Contracts
              </div>
              <span className="text-[10px] text-rose-400 block">0.50Δ Roll Protocol active</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            DeltaHarvest compliance monitors all positions 24/7. Positions approaching 0.50 Delta are queued for net-credit duration extension before market close.
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-950/60">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Upcoming Binary Events &amp; Margin Haircut</span>
            </div>
            <span className="text-xs text-amber-400 font-mono">
              {metrics.upcomingEarningsCount} Earnings Within 7 Days
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Earnings Shock Buffer</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                DeltaHarvest automatically warns against writing naked CSPs into quarterly earnings releases. Sizing is throttled to 2% max per ticker when binary events are active.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Dry Powder Allocation</span>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${100 - metrics.cashReservePct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>Invested: {(100 - metrics.cashReservePct).toFixed(1)}%</span>
                <span className="text-emerald-400 font-bold">Cash Reserves: {metrics.cashReservePct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
