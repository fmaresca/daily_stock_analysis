import React, { useState, useMemo } from 'react';
import { calculateExpirationPayoff } from '../utils/optionsMath';

export interface BuyWritePayoffChartProps {
  initialStockPrice?: number;
  initialStrikePrice?: number;
  initialPremium?: number;
  initialDte?: number;
  ticker?: string;
  onValuesChange?: (values: {
    stockPrice: number;
    strikePrice: number;
    premium: number;
    dte: number;
  }) => void;
}

export const BuyWritePayoffChart: React.FC<BuyWritePayoffChartProps> = ({
  initialStockPrice = 232.5,
  initialStrikePrice = 245.0,
  initialPremium = 4.8,
  initialDte = 35,
  ticker = 'AAPL',
  onValuesChange,
}) => {
  const [stockPrice, setStockPrice] = useState<number>(initialStockPrice);
  const [strikePrice, setStrikePrice] = useState<number>(initialStrikePrice);
  const [premium, setPremium] = useState<number>(initialPremium);
  const [dte, setDte] = useState<number>(initialDte);
  const [hoverData, setHoverData] = useState<{
    price: number;
    pnl: number;
    x: number;
    y: number;
  } | null>(null);

  // Synchronize when initial props change
  React.useEffect(() => {
    setStockPrice(initialStockPrice);
    setStrikePrice(initialStrikePrice);
    setPremium(initialPremium);
    setDte(initialDte);
  }, [initialStockPrice, initialStrikePrice, initialPremium, initialDte]);

  const updateValues = (newS: number, newK: number, newC: number, newDte: number) => {
    setStockPrice(newS);
    setStrikePrice(newK);
    setPremium(newC);
    setDte(newDte);
    onValuesChange?.({
      stockPrice: newS,
      strikePrice: newK,
      premium: newC,
      dte: newDte,
    });
  };

  // Quantitative Metrics Calculation
  const metrics = useMemo(() => {
    const netDebit = stockPrice - premium;
    const breakeven = netDebit;
    const maxProfitPerShare = Math.max(0, strikePrice - stockPrice) + premium;
    const maxProfitTotal = maxProfitPerShare * 100;
    const maxProfitPct = netDebit > 0 ? (maxProfitPerShare / netDebit) * 100 : 0;
    const downsideCushionPct = stockPrice > 0 ? (premium / stockPrice) * 100 : 0;
    const annualizedYield = maxProfitPct * (365 / Math.max(1, dte));

    return {
      netDebit,
      breakeven,
      maxProfitPerShare,
      maxProfitTotal,
      maxProfitPct,
      downsideCushionPct,
      annualizedYield,
    };
  }, [stockPrice, strikePrice, premium, dte]);

  // Coordinate Calculation for Responsive SVG Payoff Diagram
  const { points, minPrice, maxPrice, minPnl, maxPnl } = useMemo(() => {
    const span = Math.max(stockPrice * 0.28, 20);
    const minP = Math.floor(stockPrice - span);
    const maxP = Math.ceil(Math.max(strikePrice + span * 0.4, stockPrice + span));
    const step = (maxP - minP) / 50;

    const pts: { price: number; pnl: number }[] = [];
    let lowestPnl = 0;
    let highestPnl = 0;

    for (let p = minP; p <= maxP + 0.0001; p += step) {
      const curPrice = Number(p.toFixed(2));
      const pnlPerShare = calculateExpirationPayoff(curPrice, stockPrice, strikePrice, premium);
      const totalPnl = Number((pnlPerShare * 100).toFixed(1));
      pts.push({ price: curPrice, pnl: totalPnl });

      if (totalPnl < lowestPnl) lowestPnl = totalPnl;
      if (totalPnl > highestPnl) highestPnl = totalPnl;
    }

    return {
      points: pts,
      minPrice: minP,
      maxPrice: maxP,
      minPnl: Math.min(lowestPnl, -metrics.maxProfitTotal * 0.4),
      maxPnl: Math.max(highestPnl, metrics.maxProfitTotal * 1.15),
    };
  }, [stockPrice, strikePrice, premium, metrics.maxProfitTotal]);

  // Chart viewbox bounds
  const svgWidth = 800;
  const svgHeight = 280;
  const padLeft = 60;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 40;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  const pnlSpan = maxPnl - minPnl || 1;

  const getX = (price: number) =>
    padLeft + ((price - minPrice) / (maxPrice - minPrice)) * chartW;
  const getY = (pnl: number) =>
    padTop + (1 - (pnl - minPnl) / pnlSpan) * chartH;

  const zeroY = getY(0);
  const spotX = getX(stockPrice);
  const strikeX = getX(strikePrice);
  const beX = getX(metrics.breakeven);

  // SVG Line path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.price).toFixed(1)} ${getY(p.pnl).toFixed(1)}`)
    .join(' ');

  // Shaded area paths for profit and loss
  const profitAreaD = `${pathD} L ${getX(maxPrice).toFixed(1)} ${zeroY.toFixed(1)} L ${beX.toFixed(1)} ${zeroY.toFixed(1)} Z`;
  const lossAreaD = `M ${getX(minPrice).toFixed(1)} ${zeroY.toFixed(1)} L ${beX.toFixed(1)} ${zeroY.toFixed(1)} L ${getX(minPrice).toFixed(1)} ${getY(points[0]?.pnl || 0).toFixed(1)} Z`;

  // Handle interactive SVG hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const normX = (mouseX / rect.width) * svgWidth;

    if (normX >= padLeft && normX <= svgWidth - padRight) {
      const priceFrac = (normX - padLeft) / chartW;
      const targetPrice = minPrice + priceFrac * (maxPrice - minPrice);
      const pnlPerShare = calculateExpirationPayoff(targetPrice, stockPrice, strikePrice, premium);
      const totalPnl = pnlPerShare * 100;
      setHoverData({
        price: Number(targetPrice.toFixed(2)),
        pnl: Number(totalPnl.toFixed(1)),
        x: normX,
        y: getY(totalPnl),
      });
    }
  };

  return (
    <div className="w-full rounded-2xl bg-slate-950/90 border border-slate-800/90 p-6 backdrop-blur-xl shadow-2xl text-slate-100 font-sans">
      {/* 1. Header & Institutional KPI Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-800/80 gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded bg-cyan-500/15 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
              OptionForge Payoff Engine
            </span>
            <span className="text-xs text-slate-500 font-mono">Expiration Horizon (T=0)</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white mt-1 flex items-center gap-2">
            Buy-Write Payoff Matrix:{' '}
            <span className="text-cyan-400 font-mono">{ticker}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Long 100 Shares @ ${stockPrice.toFixed(2)} + Short 1x ${strikePrice.toFixed(2)} Call @ ${premium.toFixed(2)}
          </p>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Breakeven
            </span>
            <span className="text-base font-bold font-mono text-cyan-400">
              ${metrics.breakeven.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block">Net Debit Paid</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Max Profit
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              +${metrics.maxProfitTotal.toFixed(0)}
            </span>
            <span className="text-[10px] text-emerald-500/90 block">
              +{metrics.maxProfitPct.toFixed(1)}% Return
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Downside Cushion
            </span>
            <span className="text-base font-bold font-mono text-amber-400">
              {metrics.downsideCushionPct.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 block">Buffer to Loss</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              Annualized Yield
            </span>
            <span className="text-base font-bold font-mono text-purple-400">
              {metrics.annualizedYield.toFixed(1)}%
            </span>
            <span className="text-[10px] text-purple-400/80 block">{dte} Days to Exp</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Payoff Graph */}
      <div className="relative mt-6 w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverData(null)}
        >
          <defs>
            <linearGradient id="optforgeProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="optforgeLoss" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[-1000, -500, 0, 500, 1000].map((val) => {
            const yPos = getY(val);
            if (yPos < padTop || yPos > svgHeight - padBottom) return null;
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={svgWidth - padRight}
                  y2={yPos}
                  stroke={val === 0 ? '#475569' : '#1e293b'}
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  strokeWidth={val === 0 ? 1.5 : 1}
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val >= 0 ? `+$${val}` : `-$${Math.abs(val)}`}
                </text>
              </g>
            );
          })}

          {/* Shaded Profit & Loss Zones */}
          <path d={profitAreaD} fill="url(#optforgeProfit)" />
          <path d={lossAreaD} fill="url(#optforgeLoss)" />

          {/* Reference Lines */}
          {/* Current Spot Line */}
          <line
            x1={spotX}
            y1={padTop}
            x2={spotX}
            y2={svgHeight - padBottom}
            stroke="#38bdf8"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={spotX}
            y={padTop - 8}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Spot ${stockPrice.toFixed(2)}
          </text>

          {/* Strike Line */}
          <line
            x1={strikeX}
            y1={padTop}
            x2={strikeX}
            y2={svgHeight - padBottom}
            stroke="#c084fc"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={strikeX}
            y={padTop - 8}
            textAnchor="middle"
            fill="#c084fc"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Strike ${strikePrice.toFixed(2)}
          </text>

          {/* Breakeven Line */}
          <line
            x1={beX}
            y1={padTop}
            x2={beX}
            y2={svgHeight - padBottom}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
          <text
            x={beX}
            y={svgHeight - padBottom + 25}
            textAnchor="middle"
            fill="#f59e0b"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            B/E ${metrics.breakeven.toFixed(2)}
          </text>

          {/* Main Payoff Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair */}
          {hoverData && (
            <g>
              <line
                x1={hoverData.x}
                y1={padTop}
                x2={hoverData.x}
                y2={svgHeight - padBottom}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={hoverData.x}
                cy={hoverData.y}
                r="5"
                fill={hoverData.pnl >= 0 ? '#34d399' : '#f43f5e'}
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Tooltip Overlay */}
        {hoverData && (
          <div
            className="pointer-events-none absolute z-20 bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg shadow-2xl font-mono text-xs transition-transform"
            style={{
              left: `${(hoverData.x / svgWidth) * 100}%`,
              top: '15%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-slate-400 text-[10px]">
              Stock at Expiry: <strong className="text-white">${hoverData.price.toFixed(2)}</strong>
            </div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                hoverData.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {hoverData.pnl >= 0 ? '+' : ''}${hoverData.pnl.toLocaleString()}
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">
              {hoverData.price >= strikePrice
                ? 'Max Profit Cap (Shares Called Away)'
                : hoverData.price >= metrics.breakeven
                ? 'Net Profit Range'
                : 'Capital Loss Zone'}
            </div>
          </div>
        )}
      </div>

      {/* 3. Scenario Sandbox Sensitivity Controls */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[11px] font-mono text-slate-400 block mb-1">Stock Price ($)</label>
          <input
            type="number"
            step="0.50"
            value={stockPrice}
            onChange={(e) =>
              updateValues(
                parseFloat(e.target.value) || 0,
                strikePrice,
                premium,
                dte
              )
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-slate-400 block mb-1">Call Strike ($)</label>
          <input
            type="number"
            step="1"
            value={strikePrice}
            onChange={(e) =>
              updateValues(
                stockPrice,
                parseFloat(e.target.value) || 0,
                premium,
                dte
              )
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm font-mono text-purple-300 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-slate-400 block mb-1">Premium Received ($)</label>
          <input
            type="number"
            step="0.05"
            value={premium}
            onChange={(e) =>
              updateValues(
                stockPrice,
                strikePrice,
                parseFloat(e.target.value) || 0,
                dte
              )
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-slate-400 block mb-1">Days to Expiration (DTE)</label>
          <input
            type="number"
            step="1"
            value={dte}
            onChange={(e) =>
              updateValues(
                stockPrice,
                strikePrice,
                premium,
                parseInt(e.target.value, 10) || 1
              )
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
