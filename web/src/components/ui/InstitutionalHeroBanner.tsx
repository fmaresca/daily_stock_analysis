import React, { useState } from 'react';
import { ShieldCheck, TrendingUp, DollarSign, Activity, Zap, ChevronRight, ChevronLeft } from '../icons';
import { ExecutiveDigestMetrics } from '../../utils/executiveReportGenerator';

interface InstitutionalHeroBannerProps {
  executiveMetrics: ExecutiveDigestMetrics;
  totalTickersCount: number;
  freeCashAmount?: number;
  theme?: 'dark' | 'light';
  onOpenExecutiveDigest?: () => void;
  onOpenSimulator?: () => void;
}

export const InstitutionalHeroBanner: React.FC<InstitutionalHeroBannerProps> = ({
  executiveMetrics,
  totalTickersCount,
  freeCashAmount,
  theme = 'dark',
  onOpenExecutiveDigest,
  onOpenSimulator,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Smooth SVG Sparkline points for the "Portfolio Graph"
  // Simulated high-fidelity quant curve matching the lower right quadrant reference
  const splinePoints = [
    { x: 0, y: 55 },
    { x: 40, y: 48 },
    { x: 80, y: 52 },
    { x: 120, y: 42 },
    { x: 160, y: 46 },
    { x: 200, y: 36 },
    { x: 240, y: 30 },
    { x: 280, y: 38 },
    { x: 320, y: 24 },
    { x: 360, y: 28 },
    { x: 400, y: 18 },
    { x: 440, y: 22 },
    { x: 480, y: 14 },
    { x: 520, y: 18 },
    { x: 560, y: 10 },
    { x: 600, y: 12 },
  ];

  const svgPathD = `M 0 65 L 0 55 ${splinePoints
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')} L 600 65 Z`;

  const svgLineD = splinePoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 light:border-slate-200/90 shadow-xl overflow-hidden transition-all duration-300">
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-800/60 light:border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <h2 className="text-sm font-black tracking-tight text-white light:text-slate-900 flex items-center gap-2">
            <span>Financial Dashboard</span>
            <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 light:text-teal-700 border border-emerald-500/20">
              Institutional Context
            </span>
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 light:bg-emerald-50 light:hover:bg-emerald-100 text-emerald-300 light:text-emerald-700 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
              title="Open Options Trade Quality Simulator"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulator</span>
            </button>
          )}

          {onOpenExecutiveDigest && (
            <button
              onClick={onOpenExecutiveDigest}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/80 hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-slate-700/60 light:border-slate-300 transition-all cursor-pointer"
              title="Full Executive Health Digest"
            >
              <span>Audit Digest</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-xs text-slate-400 hover:text-white light:hover:text-slate-900 transition-colors"
            title={isExpanded ? 'Collapse KPI Overview' : 'Expand KPI Overview'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Main KPI Grid & Area Chart */}
      {isExpanded && (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left KPI Cards (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* KPI 1: Net Liquidity / Portfolio Index */}
            <div className="bg-slate-900/70 light:bg-white p-3.5 rounded-xl border border-slate-800/80 light:border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 light:text-slate-600 block">
                Net Liquidity
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-white light:text-slate-900">
                ${executiveMetrics.netLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 light:text-emerald-700 font-bold">
                  +0.35% ▲
                </span>
                <span className="text-[10px] font-mono text-slate-400 light:text-slate-600">USD</span>
              </div>
            </div>

            {/* KPI 2: Daily Theta Harvesting */}
            <div className="bg-slate-900/70 light:bg-white p-3.5 rounded-xl border border-slate-800/80 light:border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 light:text-slate-600 block">
                Daily Theta
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 light:text-teal-700">
                {executiveMetrics.dailyTheta >= 0 ? '+' : ''}${Math.round(executiveMetrics.dailyTheta)}/d
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-400 light:text-cyan-700 font-bold">
                  +${Math.round(executiveMetrics.dailyTheta * 30)}/mo
                </span>
              </div>
            </div>

            {/* KPI 3: Compliance & Risk Health */}
            <div className="bg-slate-900/70 light:bg-white p-3.5 rounded-xl border border-slate-800/80 light:border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 light:text-slate-600 block">
                Health Score
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-cyan-300 light:text-cyan-700 flex items-center gap-1">
                <span>{executiveMetrics.complianceHealthScore}</span>
                <span className="text-xs text-slate-400 light:text-slate-600 font-normal">/100</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 light:text-emerald-700 font-bold flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Conservative</span>
                </span>
              </div>
            </div>

            {/* KPI 4: Capital Reserve */}
            <div className="bg-slate-900/70 light:bg-white p-3.5 rounded-xl border border-slate-800/80 light:border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 light:text-slate-600 block">
                Free Capital
              </span>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-300 light:text-amber-700">
                ${(freeCashAmount ?? executiveMetrics.freeCash).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-mono text-slate-400 light:text-slate-600">
                  {totalTickersCount} Universe Equities
                </span>
              </div>
            </div>
          </div>

          {/* Right: Portfolio Graph Area Chart (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/50 light:bg-slate-50 p-3 rounded-xl border border-slate-800/60 light:border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[11px] font-bold font-mono text-slate-300 light:text-slate-700">
                Portfolio Graph
              </span>
              <span className="text-[10px] font-mono text-emerald-400 light:text-teal-700 font-semibold">
                Yield Curve: Trajectory ▲
              </span>
            </div>

            {/* Area Sparkline SVG */}
            <div className="w-full h-14 relative overflow-hidden rounded-lg">
              <svg viewBox="0 0 600 65" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="hero-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={theme === 'light' ? '0.35' : '0.45'} />
                    <stop offset="60%" stopColor="#06b6d4" stopOpacity={theme === 'light' ? '0.15' : '0.2'} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={svgPathD} fill="url(#hero-area-gradient)" />
                <path
                  d={svgLineD}
                  fill="none"
                  stroke={theme === 'light' ? '#0d9488' : '#22d3ee'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 light:text-slate-600 mt-1 px-1">
              <span>2020</span>
              <span>2022</span>
              <span>2024</span>
              <span className="text-emerald-400 light:text-teal-700 font-bold">2026 LIVE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
