import React, { useState, useMemo } from 'react';
import { scoreFromSliderInputs } from '../../utils/scoringModel';
import { OptionStrategyType } from '../../types/optionsScreener.types';

export interface OptionsTradeQualitySimulatorProps {
  initialStrategy?: OptionStrategyType;
  initialIvRank?: number;
  initialDelta?: number;
  initialDistTo50Sma?: number;
  onClose?: () => void;
  isModal?: boolean;
}

export const OptionsTradeQualitySimulator: React.FC<OptionsTradeQualitySimulatorProps> = ({
  initialStrategy = 'CASH_SECURED_PUT',
  initialIvRank = 48,
  initialDelta = 0.18,
  initialDistTo50Sma = -5.1,
  onClose,
  isModal = false,
}) => {
  // Interactive Slider States
  const [strategy, setStrategy] = useState<OptionStrategyType>(initialStrategy);
  const [ivRank, setIvRank] = useState<number>(initialIvRank);
  const [delta, setDelta] = useState<number>(initialDelta);
  const [distTo50Sma, setDistTo50Sma] = useState<number>(initialDistTo50Sma);

  // Additional quantitative context inputs (collapsible / advanced)
  const [annualizedRoC, setAnnualizedRoC] = useState<number>(26.5);
  const [bidAskSpread, setBidAskSpread] = useState<number>(3.5);
  const [openInterest, setOpenInterest] = useState<number>(2400);
  const [hasEarningsAlert, setHasEarningsAlert] = useState<boolean>(false);

  // Compute live score and breakdown in real time
  const result = useMemo(() => {
    return scoreFromSliderInputs({
      strategy,
      ivRank,
      delta,
      distTo50SmaPct: distTo50Sma,
      annualizedReturnPct: annualizedRoC,
      bidAskSpreadPct: bidAskSpread,
      openInterest,
      hasEarningsAlert,
    });
  }, [strategy, ivRank, delta, distTo50Sma, annualizedRoC, bidAskSpread, openInterest, hasEarningsAlert]);

  // Radial Gauge Math
  // Circumference for r=70 is 2 * PI * 70 = 439.82
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 260 degrees (leaving bottom open)
  const arcLength = circumference * (260 / 360);
  const progressRatio = Math.min(100, Math.max(0, result.compositeScore)) / 100;
  const strokeDashoffset = arcLength * (1 - progressRatio);

  // Needle angle: from -130 deg (0 score) to +130 deg (100 score)
  const needleAngle = -130 + progressRatio * 260;

  // Preset Handlers
  const handleLoadPreset = (name: string) => {
    if (name === 'XYZ_REFERENCE') {
      setStrategy('CASH_SECURED_PUT');
      setIvRank(48);
      setDelta(0.18);
      setDistTo50Sma(-5.1);
      setAnnualizedRoC(28.5);
      setBidAskSpread(4.2);
      setOpenInterest(2400);
      setHasEarningsAlert(false);
    } else if (name === 'TSLA_BULL_CSP') {
      setStrategy('CASH_SECURED_PUT');
      setIvRank(58);
      setDelta(0.19);
      setDistTo50Sma(-6.4);
      setAnnualizedRoC(32.0);
      setBidAskSpread(3.0);
      setOpenInterest(8500);
      setHasEarningsAlert(false);
    } else if (name === 'PLTR_CSP') {
      setStrategy('CASH_SECURED_PUT');
      setIvRank(52);
      setDelta(0.17);
      setDistTo50Sma(-4.2);
      setAnnualizedRoC(29.0);
      setBidAskSpread(2.8);
      setOpenInterest(4200);
      setHasEarningsAlert(false);
    } else if (name === 'EARNINGS_RISK') {
      setStrategy('CASH_SECURED_PUT');
      setIvRank(85);
      setDelta(0.24);
      setDistTo50Sma(-3.0);
      setAnnualizedRoC(45.0);
      setBidAskSpread(8.0);
      setOpenInterest(1200);
      setHasEarningsAlert(true);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl p-5 sm:p-7 max-w-5xl w-full mx-auto backdrop-blur-xl font-sans select-none">
      {/* 1. Header Bar matching reference image */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          {/* Neon Cube Logo */}
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/20">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Options Trade Quality Simulator
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Weekly {strategy === 'CASH_SECURED_PUT' ? 'CSP' : 'CC'}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Strategy switcher chips */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStrategy('CASH_SECURED_PUT')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                strategy === 'CASH_SECURED_PUT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cash-Secured Put
            </button>
            <button
              onClick={() => setStrategy('COVERED_CALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                strategy === 'COVERED_CALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Covered Call
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
              title="Close Simulator"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Quick Presets Row */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Presets:</span>
        <button
          onClick={() => handleLoadPreset('XYZ_REFERENCE')}
          className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-colors"
        >
          Reference Example (XYZ - 96 Score)
        </button>
        <button
          onClick={() => handleLoadPreset('TSLA_BULL_CSP')}
          className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-colors"
        >
          TSLA High-IVR CSP (58% IVR)
        </button>
        <button
          onClick={() => handleLoadPreset('PLTR_CSP')}
          className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-colors"
        >
          PLTR 17Δ Sweet Spot
        </button>
        <button
          onClick={() => handleLoadPreset('EARNINGS_RISK')}
          className="px-2.5 py-1 rounded-md bg-slate-900 border border-rose-900/40 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 transition-colors"
        >
          Earnings Risk Gate Test (-40 pts)
        </button>
      </div>

      {/* 2. Main 3-Column Layout matching reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between">
          {/* Slider 1: IV Rank */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {/* Speedometer icon */}
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 14v-4" />
                  <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                </svg>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  IV Rank (0-100%)
                </span>
              </div>
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {ivRank}%
              </span>
            </div>

            {/* Custom Styled Slider Track */}
            <div className="relative py-1">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={ivRank}
                onChange={(e) => setIvRank(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                <span>0%</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  ▲ Optimal Range (35%-70%) ▲
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Slider 2: Option Delta */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {/* Sigma icon */}
                <span className="text-xs font-bold text-emerald-400 font-serif text-sm leading-none">Σ</span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Option Delta (0.10-0.45)
                </span>
              </div>
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {delta.toFixed(2)}
              </span>
            </div>

            <div className="relative py-1">
              <input
                type="range"
                min="0.10"
                max="0.45"
                step="0.01"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                <span>0.10Δ</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  ▲ Optimal Range ({strategy === 'CASH_SECURED_PUT' ? '0.15-0.25Δ' : '0.20-0.30Δ'}) ▲
                </span>
                <span>0.45Δ</span>
              </div>
            </div>
          </div>

          {/* Slider 3: Distance to 50 SMA */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {/* Chart line icon */}
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Dist. to 50 SMA (%)
                </span>
              </div>
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {distTo50Sma > 0 ? `+${distTo50Sma.toFixed(1)}%` : `${distTo50Sma.toFixed(1)}%`}
              </span>
            </div>

            <div className="relative py-1">
              <input
                type="range"
                min="-15"
                max="15"
                step="0.1"
                value={distTo50Sma}
                onChange={(e) => setDistTo50Sma(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                <span>-15% (Under)</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  ▲ Optimal (Strike &lt; 50 SMA) ▲
                </span>
                <span>+15% (Over)</span>
              </div>
            </div>
          </div>

          {/* Additional risk gate quick toggle */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/40 rounded-xl border border-slate-800/60 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEarningsAlert}
                onChange={(e) => setHasEarningsAlert(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500/30"
              />
              <span className="text-slate-300">Earnings Within Expiration Window</span>
            </label>
            {hasEarningsAlert && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                -40 PTS PENALTY
              </span>
            )}
          </div>
        </div>

        {/* Center Column: Radial Gauge & Composite Score (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Composite Score
          </span>

          {/* SVG Circular Radial Gauge */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
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
              {/* Animated Glowing Progress Arc */}
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
                strokeDashoffset={strokeDashoffset}
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

          {/* Subtitle text matching reference */}
          <div className="text-center mt-3">
            <p className="text-xs text-slate-300 font-medium">
              {result.qualityDescription}
            </p>
          </div>
        </div>

        {/* Right Column: Score Breakdown (3 cols) */}
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
      </div>

      {/* 3. Footer Bar matching reference */}
      <div className="flex flex-wrap items-center justify-between pt-4 mt-5 border-t border-slate-800/80 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold font-mono">Live Update: Active</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Based on 100-point quantitative scoring model (`scoringModel.ts`)
        </div>
      </div>
    </div>
  );
};
