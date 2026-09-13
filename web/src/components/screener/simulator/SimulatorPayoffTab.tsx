import React, { useMemo } from 'react';
import { OptionStrategyType } from '../../../types/optionsScreener.types';
import { SimulatedContractData } from './SimulatorBlueprintCard';

interface SimulatorPayoffTabProps {
  ticker: string;
  strategy: OptionStrategyType;
  contract: SimulatedContractData;
}

export const SimulatorPayoffTab: React.FC<SimulatorPayoffTabProps> = ({
  ticker,
  strategy,
  contract,
}) => {
  const { spotPrice, nearestStrike: strike, midPrice: premium } = contract;

  const { points, minPrice, maxPrice, maxProfit, maxLoss, breakEven } = useMemo(() => {
    const isCC = strategy === 'COVERED_CALL';
    const bEven = isCC ? spotPrice - premium : strike - premium;
    const mProfit = isCC ? (strike - spotPrice) + premium : premium;
    const mLoss = isCC ? -(spotPrice - premium) : -(strike - premium);

    // Dynamic price range: +/- 25% from spot/strike
    const low = Math.max(1, Math.min(spotPrice, strike) * 0.75);
    const high = Math.max(spotPrice, strike) * 1.25;
    const step = (high - low) / 40;

    const pts: { price: number; pnl: number; isProfit: boolean }[] = [];
    for (let p = low; p <= high + 0.001; p += step) {
      let pnl = 0;
      if (isCC) {
        // Covered Call: (ST - S0) + C - max(0, ST - K)
        pnl = (p - spotPrice) + premium - Math.max(0, p - strike);
      } else {
        // Cash-Secured Put: P - max(0, K - ST)
        pnl = premium - Math.max(0, strike - p);
      }
      pts.push({
        price: p,
        pnl: Math.round(pnl * 100) / 100,
        isProfit: pnl >= 0,
      });
    }

    return {
      points: pts,
      minPrice: low,
      maxPrice: high,
      maxProfit: Math.round(mProfit * 100) / 100,
      maxLoss: Math.round(mLoss * 100) / 100,
      breakEven: Math.round(bEven * 100) / 100,
    };
  }, [spotPrice, strike, premium, strategy]);

  // SVG dimensions
  const width = 600;
  const height = 220;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minPnl = Math.min(...points.map((p) => p.pnl), -maxProfit * 0.5);
  const maxPnl = Math.max(...points.map((p) => p.pnl), maxProfit * 1.2);
  const pnlRange = maxPnl - minPnl || 1;

  const getX = (price: number) => padLeft + ((price - minPrice) / (maxPrice - minPrice)) * chartW;
  const getY = (pnl: number) => padTop + (1 - (pnl - minPnl) / pnlRange) * chartH;

  const zeroY = getY(0);
  const strikeX = getX(strike);
  const spotX = getX(spotPrice);
  const breakEvenX = getX(breakEven);

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.price).toFixed(1)} ${getY(p.pnl).toFixed(1)}`)
    .join(' ');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Expiration Payoff Curve (P&amp;L Profile)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              100 Shares / 1 Contract
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {strategy === 'COVERED_CALL'
              ? `Long 100 ${ticker || 'Stock'} @ $${spotPrice.toFixed(2)} + Short $${strike.toFixed(2)} Call @ $${premium.toFixed(2)}`
              : `Short 1x $${strike.toFixed(2)} Put @ $${premium.toFixed(2)} on ${ticker || 'Stock'}`}
          </p>
        </div>

        {/* Stats Pill Badges */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2.5 py-1">
            <span className="text-[10px] text-emerald-400 block font-sans font-semibold">Max Profit</span>
            <span className="font-bold text-emerald-300">+${(maxProfit * 100).toFixed(0)}</span>
          </div>
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-2.5 py-1">
            <span className="text-[10px] text-cyan-400 block font-sans font-semibold">Break-Even</span>
            <span className="font-bold text-cyan-300">${breakEven.toFixed(2)}</span>
          </div>
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-lg px-2.5 py-1">
            <span className="text-[10px] text-rose-400 block font-sans font-semibold">Max Risk</span>
            <span className="font-bold text-rose-300">${(Math.abs(maxLoss) * 100).toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* SVG Payoff Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padLeft}
            y1={zeroY}
            x2={width - padRight}
            y2={zeroY}
            stroke="#475569"
            strokeDasharray="4,4"
            strokeWidth="1.2"
          />

          {/* Vertical Key Inflection Markers */}
          {/* Break-Even line */}
          <line
            x1={breakEvenX}
            y1={padTop}
            x2={breakEvenX}
            y2={height - padBottom}
            stroke="#06B6D4"
            strokeDasharray="3,3"
            strokeWidth="1"
            opacity="0.8"
          />
          {/* Strike line */}
          <line
            x1={strikeX}
            y1={padTop}
            x2={strikeX}
            y2={height - padBottom}
            stroke="#10B981"
            strokeDasharray="3,3"
            strokeWidth="1.2"
          />
          {/* Spot price line */}
          <line
            x1={spotX}
            y1={padTop}
            x2={spotX}
            y2={height - padBottom}
            stroke="#94A3B8"
            strokeDasharray="2,2"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Payoff Curve Line */}
          <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

          {/* Key Dots */}
          <circle cx={strikeX} cy={getY(points.find((p) => Math.abs(p.price - strike) < 2)?.pnl || maxProfit)} r="4" fill="#10B981" />
          <circle cx={breakEvenX} cy={zeroY} r="4" fill="#06B6D4" />
          <circle cx={spotX} cy={getY(points.find((p) => Math.abs(p.price - spotPrice) < 2)?.pnl || 0)} r="3.5" fill="#F59E0B" />

          {/* Labels */}
          <text x={padLeft - 8} y={zeroY + 3} textAnchor="end" fill="#64748B" fontSize="9" fontFamily="monospace">
            $0
          </text>
          <text x={padLeft - 8} y={getY(maxProfit) + 3} textAnchor="end" fill="#10B981" fontSize="9" fontFamily="monospace">
            +${maxProfit.toFixed(1)}
          </text>

          {/* X-Axis Tick Labels */}
          <text x={spotX} y={height - padBottom + 14} textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="bold" fontFamily="monospace">
            Spot ${spotPrice.toFixed(0)}
          </text>
          <text x={breakEvenX} y={height - padBottom + 26} textAnchor="middle" fill="#06B6D4" fontSize="9" fontFamily="monospace">
            B/E ${breakEven.toFixed(1)}
          </text>
          <text x={strikeX} y={height - padBottom + 14} textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="bold" fontFamily="monospace">
            Strike ${strike.toFixed(0)}
          </text>
        </svg>
      </div>

      {/* Legend & Rules */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span>Spot Price (${spotPrice.toFixed(2)})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span>Break-Even (${breakEven.toFixed(2)})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Strike (${strike.toFixed(2)})</span>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {strategy === 'COVERED_CALL'
            ? 'Stock upside capped above strike price'
            : 'Buffer protects against stock downside down to break-even'}
        </span>
      </div>
    </div>
  );
};
