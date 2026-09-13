import React from 'react';
import { SliderScoringResult } from '../../../utils/scoringModel';

export interface SimulatorScoreGaugeProps {
  result: SliderScoringResult;
  radius?: number;
}

export const SimulatorScoreGauge: React.FC<SimulatorScoreGaugeProps> = ({
  result,
  radius = 70,
}) => {
  // Radial Gauge Math
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (260 / 360);
  const progressRatio = Math.min(100, Math.max(0, result.compositeScore)) / 100;

  return (
    <>
      {/* Center Column: Radial Gauge & Composite Score */}
      <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Composite Score
        </span>

        {/* SVG Circular Radial Gauge */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#1e293b"
              strokeWidth="12"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={
                result.compositeScore >= 85
                  ? '#10b981'
                  : result.compositeScore >= 70
                  ? '#06b6d4'
                  : result.compositeScore >= 50
                  ? '#f59e0b'
                  : '#f43f5e'
              }
              strokeWidth="12"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
              style={{
                filter:
                  result.compositeScore >= 70
                    ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
                    : 'none',
              }}
            />
          </svg>

          {/* Centered Large Numeric Score & Verdict */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
              {Math.round(result.compositeScore)}
            </span>
            <span
              className={`text-xs font-extrabold tracking-wider uppercase mt-0.5 ${
                result.qualityVerdict === 'VERY HIGH'
                  ? 'text-emerald-400'
                  : result.qualityVerdict === 'HIGH'
                  ? 'text-cyan-400'
                  : result.qualityVerdict === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {result.qualityVerdict}
            </span>
          </div>
        </div>

        <div className="text-center mt-3">
          <p className="text-xs text-slate-300 font-medium">
            {result.qualityDescription}
          </p>
        </div>
      </div>

      {/* Right Column: Score Breakdown */}
      <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Score Breakdown
          </span>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">(MAX 100 PTS)</span>
        </div>

        {/* Bar 1: IV Rank Score */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-slate-400">IV RANK SCORE (MAX 25)</span>
            <span className="text-emerald-400 font-bold">{result.breakdown.ivScore.toFixed(1)}</span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-400/50"
              style={{ width: `${(result.breakdown.ivScore / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Bar 2: Option Delta Score */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-slate-400">OPTION DELTA SCORE (MAX 25)</span>
            <span className="text-emerald-400 font-bold">{result.breakdown.deltaScore.toFixed(1)}</span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-400/50"
              style={{ width: `${(result.breakdown.deltaScore / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Bar 3: Technical Score */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-slate-400">TECHNICAL SCORE (MAX 25)</span>
            <span className="text-emerald-400 font-bold">{result.breakdown.technicalScore.toFixed(1)}</span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-400/50"
              style={{ width: `${(result.breakdown.technicalScore / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* Bar 4: Return on Capital */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-slate-400">RETURN ON CAPITAL (MAX 15)</span>
            <span className="text-emerald-400 font-bold">{result.breakdown.returnScore.toFixed(1)}</span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-400/50"
              style={{ width: `${(result.breakdown.returnScore / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* Bar 5: Liquidity Score */}
        <div>
          <div className="flex justify-between text-[11px] mb-1 font-mono">
            <span className="text-slate-400">LIQUIDITY SCORE (MAX 10)</span>
            <span className="text-emerald-400 font-bold">{result.breakdown.liquidityScore.toFixed(1)}</span>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-emerald-400/50"
              style={{ width: `${(result.breakdown.liquidityScore / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
