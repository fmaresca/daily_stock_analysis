import React from 'react';
import { BarchartOpinion } from '../types/options';
import { CheckCircle2, XCircle, TrendingUp, Award, Flame, Zap, HelpCircle } from './icons';

interface BarchartOpinionCardProps {
  opinion: BarchartOpinion;
}

export const BarchartOpinionCard: React.FC<BarchartOpinionCardProps> = ({ opinion }) => {
  const isBuy = opinion.opinion_pct > 0;
  const isSell = opinion.opinion_pct < 0;
  const votes = opinion.votes_breakdown || {};

  const shortTermIndicators = [
    { key: '20_SMA', label: '20-Day Simple Moving Average', desc: 'Price > 20-Day SMA' },
    { key: '20_50_MACD', label: '20-50 MACD Oscillator', desc: '20 EMA - 50 EMA > 0' },
    { key: '20_100_MACD', label: '20-100 MACD Oscillator', desc: '20 EMA - 100 EMA > 0' },
    { key: '20_200_MACD', label: '20-200 MACD Oscillator', desc: '20 EMA - 200 EMA > 0' },
  ];

  const mediumTermIndicators = [
    { key: '50_SMA', label: '50-Day Simple Moving Average', desc: 'Price > 50-Day SMA' },
    { key: '50_100_MACD', label: '50-100 MACD Oscillator', desc: '50 EMA - 100 EMA > 0' },
    { key: '50_150_MACD', label: '50-150 MACD Oscillator', desc: '50 EMA - 150 EMA > 0' },
    { key: '50_200_MACD', label: '50-200 MACD Oscillator', desc: '50 EMA - 200 EMA > 0' },
  ];

  const longTermIndicators = [
    { key: '100_SMA', label: '100-Day Simple Moving Average', desc: 'Price > 100-Day SMA' },
    { key: '150_SMA', label: '150-Day Simple Moving Average', desc: 'Price > 150-Day SMA' },
    { key: '200_SMA', label: '200-Day Simple Moving Average', desc: 'Price > 200-Day SMA' },
    { key: '100_200_MACD', label: '100-200 MACD Oscillator', desc: '100 EMA - 200 EMA > 0' },
    { key: '200_SLOPE', label: '200 SMA 20-Day Slope', desc: '200 SMA is rising over 20 days' },
  ];

  const renderIndicatorRow = (ind: { key: string; label: string; desc: string }) => {
    const val = votes[ind.key] ?? (isBuy ? 1 : -1);
    const passed = val === 1;

    return (
      <div
        key={ind.key}
        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {passed ? (
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/40 shrink-0">
              ✓
            </span>
          ) : (
            <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px] border border-rose-500/40 shrink-0">
              ✗
            </span>
          )}
          <div>
            <div className="text-[11px] font-semibold text-slate-200">{ind.label}</div>
            <div className="text-[10px] text-slate-400">{ind.desc}</div>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
            passed
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          {passed ? 'Buy +1' : 'Sell -1'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Barchart 13-Indicator Opinion &amp; Signal Strength Engine
            </h3>
            {opinion.is_top_1_pct && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/30 to-emerald-500/30 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Top 1% Signal Strength</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Multi-timeframe technical indicator consensus across short, medium, and long-term trends.
          </p>
        </div>

        {/* Primary Opinion Badge */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Composite Opinion
            </div>
            <div
              className={`text-lg font-black font-mono leading-none mt-0.5 ${
                isBuy
                  ? 'text-emerald-400'
                  : isSell
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {opinion.opinion_label}
            </div>
          </div>

          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-sm border shadow-lg ${
              opinion.opinion_pct >= 90
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                : opinion.opinion_pct > 0
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : opinion.opinion_pct < 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {opinion.opinion_pct}%
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">Signal Strength</div>
          <div className="text-sm font-bold font-mono text-white mt-1 flex items-center gap-1.5">
            {opinion.is_top_1_pct ? (
              <span className="text-amber-300 font-extrabold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {opinion.signal_strength}
              </span>
            ) : (
              <span>{opinion.signal_strength}</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {opinion.is_top_1_pct ? 'Top 1% consistency (≥90% 60d)' : 'Trend consistency rating'}
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">Signal Direction</div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{opinion.signal_direction}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">5-Day Short-Term Momentum Delta</div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">Buy Votes</div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
            {opinion.buy_votes} Indicators
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bullish confirmation count</div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-400 font-medium">Sell Votes</div>
          <div className="text-sm font-bold font-mono text-rose-400 mt-1">
            {opinion.sell_votes} Indicators
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Bearish resistance count</div>
        </div>
      </div>

      {/* 13-Indicator Breakdown Grid */}
      <div className="space-y-4 pt-2">
        <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>13 Technical Studies Evaluation Matrix</span>
          <span className="text-[10px] font-mono text-slate-500 font-normal">
            Short (4) • Medium (4) • Long (5)
          </span>
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Short-Term Bucket */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-cyan-300">
              <span>Short-Term (4 Studies)</span>
              <span className="text-[10px] text-slate-400 font-mono">20D Focus</span>
            </div>
            <div className="space-y-1.5">
              {shortTermIndicators.map(renderIndicatorRow)}
            </div>
          </div>

          {/* Medium-Term Bucket */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-indigo-300">
              <span>Medium-Term (4 Studies)</span>
              <span className="text-[10px] text-slate-400 font-mono">50D Focus</span>
            </div>
            <div className="space-y-1.5">
              {mediumTermIndicators.map(renderIndicatorRow)}
            </div>
          </div>

          {/* Long-Term Bucket */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-purple-300">
              <span>Long-Term (5 Studies)</span>
              <span className="text-[10px] text-slate-400 font-mono">100–200D Focus</span>
            </div>
            <div className="space-y-1.5">
              {longTermIndicators.map(renderIndicatorRow)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
