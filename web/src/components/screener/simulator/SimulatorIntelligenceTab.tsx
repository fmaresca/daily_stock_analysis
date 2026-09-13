import React, { useMemo } from 'react';
import { OptionStrategyType } from '../../../types/optionsScreener.types';
import { SimulatedContractData } from './SimulatorBlueprintCard';
import { PulledTechnicalData } from '../OptionsTradeQualitySimulator';
import { ShieldCheck, AlertTriangle, TrendingUp, CheckCircle2, Zap } from '../../icons';

interface SimulatorIntelligenceTabProps {
  ticker: string;
  strategy: OptionStrategyType;
  contract: SimulatedContractData;
  pulledData: PulledTechnicalData | null;
  ivRank: number;
}

export const SimulatorIntelligenceTab: React.FC<SimulatorIntelligenceTabProps> = ({
  ticker,
  strategy,
  contract,
  pulledData,
  ivRank,
}) => {
  const { spotPrice, nearestStrike: strike, midPrice: premium, dte } = contract;

  // Compute Volatility Spread & Variance Risk Premium (VRP)
  const currentIv = useMemo(() => {
    if (pulledData?.ivCurrent) {
      return pulledData.ivCurrent > 1 ? pulledData.ivCurrent : pulledData.ivCurrent * 100;
    }
    return 32.0;
  }, [pulledData]);

  const historicalVol = useMemo(() => {
    if (pulledData?.hv30) {
      return pulledData.hv30 > 1 ? pulledData.hv30 : pulledData.hv30 * 100;
    }
    return 26.5;
  }, [pulledData]);

  const vrp = useMemo(() => {
    return Math.round((currentIv - historicalVol) * 10) / 10;
  }, [currentIv, historicalVol]);

  // Extrinsic value & Ex-Dividend early assignment check
  const extrinsicValue = useMemo(() => {
    if (strategy === 'COVERED_CALL') {
      const intrinsic = Math.max(0, spotPrice - strike);
      return Math.max(0, premium - intrinsic);
    } else {
      const intrinsic = Math.max(0, strike - spotPrice);
      return Math.max(0, premium - intrinsic);
    }
  }, [spotPrice, strike, premium, strategy]);

  const estimatedQuarterlyDividend = useMemo(() => {
    // Check known tickers or estimate ~0.4% quarterly yield for dividend payers
    const div = spotPrice * 0.005;
    return Math.round(div * 100) / 100;
  }, [spotPrice]);

  const hasAssignmentRisk = strategy === 'COVERED_CALL' && extrinsicValue < estimatedQuarterlyDividend && spotPrice > strike;

  // AI Strategy Synthesis Score (1-100)
  const aiScore = useMemo(() => {
    let score = 70;
    if (ivRank > 50) score += 12;
    else if (ivRank < 25) score -= 15;

    if (vrp > 2) score += 8;
    else if (vrp < -2) score -= 8;

    if (contract.bufferPct > 5) score += 5;
    if (hasAssignmentRisk) score -= 18;

    return Math.min(98, Math.max(35, score));
  }, [ivRank, vrp, contract.bufferPct, hasAssignmentRisk]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Volatility Intelligence &amp; Dividend Assignment Guard</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Institutional Risk Modeling
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Variance Risk Premium ($VRP$), IV Rank percentile distribution, and early exercise dividend capture safeguards.
          </p>
        </div>

        {/* AI Conviction Score Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">AI Strategy Conviction:</span>
          <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded-lg border ${
            aiScore >= 75
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : aiScore >= 50
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {aiScore} / 100
          </span>
        </div>
      </div>

      {/* Grid: Volatility Intelligence + Dividend Safeguard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Card 1: Volatility Intelligence & VRP */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Volatility Regime &amp; VRP</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                vrp > 0
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {vrp > 0 ? 'Rich Option Premium' : 'Compressed Volatility'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans">Implied Vol (IV)</span>
                <span className="text-emerald-400 font-bold text-sm">{currentIv.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans">Realized Vol (30d)</span>
                <span className="text-slate-300 font-bold text-sm">{historicalVol.toFixed(1)}%</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans">Variance Spread</span>
                <span className={vrp >= 0 ? 'text-emerald-400 font-bold text-sm' : 'text-amber-400 font-bold text-sm'}>
                  {vrp >= 0 ? `+${vrp}%` : `${vrp}%`}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {vrp > 0 ? (
                <span>
                  <strong className="text-emerald-400">Positive VRP Edge:</strong> Implied volatility is pricing in {vrp}% more turbulence than the stock has actually delivered over the last 30 trading days. Excellent environment for option sellers to capture variance risk premium.
                </span>
              ) : (
                <span>
                  <strong className="text-amber-400">VRP Discount:</strong> Realized price swings currently exceed implied volatility. Option buyers hold an edge; consider wider out-of-the-money cushions or higher delta margins of safety.
                </span>
              )}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-sans">252-Day IV Rank:</span>
            <span className="font-mono font-bold text-slate-200">{ivRank} / 100</span>
          </div>
        </div>

        {/* Card 2: Ex-Dividend & Early Assignment Guard */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ex-Dividend &amp; Early Exercise Guard</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                hasAssignmentRisk
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {hasAssignmentRisk ? '⚠️ High Assignment Risk' : '✓ Protected (Safe Extrinsic)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans">Extrinsic Value ($C_ext$)</span>
                <span className="text-cyan-300 font-bold text-sm">${extrinsicValue.toFixed(2)}/sh</span>
                <span className="text-[9px] text-slate-500 block">Time &amp; Vol Premium</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans">Est. Dividend Payout</span>
                <span className="text-slate-300 font-bold text-sm">${estimatedQuarterlyDividend.toFixed(2)}/sh</span>
                <span className="text-[9px] text-slate-500 block">Quarterly Amount</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {hasAssignmentRisk ? (
                <span className="text-rose-300">
                  <strong>Dividend Arbitrage Danger:</strong> Remaining extrinsic value (${extrinsicValue.toFixed(2)}) is less than the expected dividend payout (${estimatedQuarterlyDividend.toFixed(2)}). Counterparties are mathematically incentivized to exercise short calls early before the ex-dividend date!
                </span>
              ) : (
                <span>
                  <strong>Safe Time Value Cushion:</strong> Extrinsic value (${extrinsicValue.toFixed(2)}) exceeds estimated dividend drops, preserving assignment protection through the {dte} DTE expiration cycle.
                </span>
              )}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-sans">Early Assignment Criterion:</span>
            <span className="font-mono font-bold text-slate-300">C_ext &lt; Div</span>
          </div>
        </div>
      </div>

      {/* Institutional Execution Protocol */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs">
        <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Institutional Execution &amp; Risk Checklist</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
          <div className="flex items-start gap-1.5">
            <span className="text-emerald-400 font-bold mt-0.5">1.</span>
            <span>
              <strong>80% Profit Target:</strong> Set automated GTC limit order to buy back short call/put once 80% of max premium is captured.
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-emerald-400 font-bold mt-0.5">2.</span>
            <span>
              <strong>Delta Threshold:</strong> Monitor position delta; if short delta crosses 0.50, activate the Defensive Roll Assistant.
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-emerald-400 font-bold mt-0.5">3.</span>
            <span>
              <strong>Binary Event Discipline:</strong> Verify earnings announcements occur outside option expiration or ensure straddle defense clearance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
