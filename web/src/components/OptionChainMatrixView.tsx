import React, { useState, useMemo } from 'react';
import { TickerMeta, OptionOpportunity } from '../types/options';
import {
  generateOptionChainMatrix,
  OptionContractData,
  StraddleRow,
} from '../utils/optionChainMatrix';
import {
  Layers,
  Activity,
  Sliders,
  Zap,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Info,
} from './icons';

interface OptionChainMatrixViewProps {
  tickers: TickerMeta[];
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  onStageCustomOrder?: (contract: OptionContractData, spotPrice: number) => void;
  onCalculateIncome?: (contract: OptionContractData, spotPrice: number) => void;
}

export const OptionChainMatrixView: React.FC<OptionChainMatrixViewProps> = ({
  tickers,
  selectedSymbol,
  onSelectSymbol,
  onStageCustomOrder,
  onCalculateIncome,
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string>(
    selectedSymbol || (tickers.length > 0 ? tickers[0].symbol : 'SPY')
  );
  const [selectedDte, setSelectedDte] = useState<number>(30);
  const [sideFilter, setSideFilter] = useState<'BOTH' | 'CALLS' | 'PUTS'>('BOTH');
  const [strikeRange, setStrikeRange] = useState<'NEAR_10' | 'NEAR_15' | 'ALL'>('NEAR_15');
  const [hoveredPoint, setHoveredPoint] = useState<{ strike: number; callIv: number; putIv: number } | null>(null);

  const currentTicker = useMemo(() => {
    return tickers.find((t) => t.symbol === activeSymbol) || tickers[0] || {
      symbol: activeSymbol,
      name: activeSymbol,
      spot_price: 550.0,
      sector: 'Technology',
      iv_rank: 35,
      rsi_14: 50,
      liquidity_tier: 'Tier 1',
    };
  }, [tickers, activeSymbol]);

  const chainResult = useMemo(() => {
    return generateOptionChainMatrix(currentTicker as TickerMeta, selectedDte);
  }, [currentTicker, selectedDte]);

  // Filter strikes range
  const filteredRows = useMemo(() => {
    const rows = chainResult.rows;
    if (strikeRange === 'ALL') return rows;
    const atmIndex = rows.findIndex((r) => r.isNearMoney);
    const center = atmIndex >= 0 ? atmIndex : Math.floor(rows.length / 2);
    const count = strikeRange === 'NEAR_10' ? 10 : 15;
    const start = Math.max(0, center - count);
    const end = Math.min(rows.length, center + count + 1);
    return rows.slice(start, end);
  }, [chainResult.rows, strikeRange]);

  const handleSymbolChange = (sym: string) => {
    setActiveSymbol(sym);
    if (onSelectSymbol) onSelectSymbol(sym);
  };

  // Convert contract to OptionOpportunity format for staging
  const handleStageContract = (contract: OptionContractData) => {
    if (onStageCustomOrder) {
      onStageCustomOrder(contract, chainResult.spotPrice);
    }
  };

  // Calculate coordinates for SVG Volatility Smile Chart
  const svgWidth = 800;
  const svgHeight = 160;
  const padding = { top: 20, right: 30, bottom: 25, left: 40 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const minStrike = chainResult.ivSmilePoints[0]?.strike || 100;
  const maxStrike = chainResult.ivSmilePoints[chainResult.ivSmilePoints.length - 1]?.strike || 200;

  const ivValues = chainResult.ivSmilePoints.flatMap((p) => [p.callIv, p.putIv]);
  const minIv = Math.max(5, Math.min(...ivValues) - 3);
  const maxIv = Math.max(...ivValues) + 4;

  const getX = (strike: number) => {
    return padding.left + ((strike - minStrike) / Math.max(1, maxStrike - minStrike)) * graphWidth;
  };

  const getY = (iv: number) => {
    return padding.top + graphHeight - ((iv - minIv) / Math.max(1, maxIv - minIv)) * graphHeight;
  };

  const callPath = chainResult.ivSmilePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.strike).toFixed(1)} ${getY(p.callIv).toFixed(1)}`)
    .join(' ');

  const putPath = chainResult.ivSmilePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.strike).toFixed(1)} ${getY(p.putIv).toFixed(1)}`)
    .join(' ');

  const spotX = getX(chainResult.spotPrice);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Ticker / Expiration Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Interactive Option Chain Matrix &amp; Volatility Smile
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Straddle Ladder
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Full strike-by-strike straddle view pairing Calls &amp; Puts with live Greeks (Delta, Gamma, Theta, Vega), Volume/OI, and Volatility Smile skew curve analysis.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Spot Price</span>
              <span className="text-base font-bold text-white font-mono">
                ${chainResult.spotPrice.toFixed(2)}
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-mono">ATM IV (30d)</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {chainResult.atmIv.toFixed(1)}%
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-mono">Put / Call Skew</span>
              <span className="text-xs font-bold text-amber-400 font-mono mt-0.5 block">
                {(chainResult.putSkewAvg - chainResult.callSkewAvg).toFixed(1)}% Skew
              </span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar: Symbol, Expiration, View Filter, Strike Depth */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3">
            {/* Symbol Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Symbol:</span>
              <select
                value={activeSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {tickers.map((t) => (
                  <option key={t.symbol} value={t.symbol} className="bg-slate-900 text-white">
                    {t.symbol} - ${t.spot_price.toFixed(0)} ({t.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Expiration Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Expiration:</span>
              <select
                value={selectedDte}
                onChange={(e) => setSelectedDte(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-cyan-400 focus:outline-none cursor-pointer"
              >
                {chainResult.expirations.map((exp) => (
                  <option key={exp.dte} value={exp.dte} className="bg-slate-900 text-white">
                    {exp.formattedDate}
                  </option>
                ))}
              </select>
            </div>

            {/* Strike Depth Filter */}
            <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setStrikeRange('NEAR_10')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  strikeRange === 'NEAR_10'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                &plusmn;10 Strikes
              </button>
              <button
                onClick={() => setStrikeRange('NEAR_15')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  strikeRange === 'NEAR_15'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                &plusmn;15 Strikes
              </button>
              <button
                onClick={() => setStrikeRange('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  strikeRange === 'ALL'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All (Full Ladder)
              </button>
            </div>
          </div>

          {/* Side Filter: Both, Calls, Puts */}
          <div className="inline-flex p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSideFilter('BOTH')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sideFilter === 'BOTH'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calls &amp; Puts (Straddle)
            </button>
            <button
              onClick={() => setSideFilter('CALLS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sideFilter === 'CALLS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calls Only
            </button>
            <button
              onClick={() => setSideFilter('PUTS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sideFilter === 'PUTS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Puts Only
            </button>
          </div>
        </div>
      </div>

      {/* Volatility Smile / Skew Curve Visualization */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Implied Volatility Smile &amp; Skew Curve ({chainResult.selectedExpiration})</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
              <span className="text-amber-300 font-semibold">Put IV Skew</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
              <span className="text-emerald-300 font-semibold">Call IV Curve</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400 border-dashed border-b inline-block" />
              <span className="text-cyan-300 font-semibold">Spot (${chainResult.spotPrice.toFixed(2)})</span>
            </span>
          </div>
        </div>

        {/* SVG Curve Plot */}
        <div className="relative w-full overflow-hidden bg-slate-900/50 rounded-xl p-2 border border-slate-800/60">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40">
            {/* Grid Lines */}
            {[0.25, 0.5, 0.75].map((ratio) => {
              const y = padding.top + graphHeight * ratio;
              const ivVal = maxIv - ratio * (maxIv - minIv);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="2,2"
                    strokeWidth="0.8"
                  />
                  <text x={padding.left - 5} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {ivVal.toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Vertical Spot Price Line */}
            {spotX >= padding.left && spotX <= svgWidth - padding.right && (
              <g>
                <line
                  x1={spotX}
                  y1={padding.top}
                  x2={spotX}
                  y2={padding.top + graphHeight}
                  stroke="#06b6d4"
                  strokeDasharray="4,3"
                  strokeWidth="1.5"
                />
                <text x={spotX} y={padding.top - 4} fill="#06b6d4" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  Spot ${chainResult.spotPrice.toFixed(0)}
                </text>
              </g>
            )}

            {/* Put IV Curve */}
            <path d={putPath} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />

            {/* Call IV Curve */}
            <path d={callPath} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />

            {/* Interactive Points */}
            {chainResult.ivSmilePoints.map((p, idx) => {
              const cx = getX(p.strike);
              const cyPut = getY(p.putIv);
              const cyCall = getY(p.callIv);
              return (
                <g key={idx}>
                  <circle
                    cx={cx}
                    cy={cyPut}
                    r="2.5"
                    fill="#f59e0b"
                    className="hover:r-4 cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <circle
                    cx={cx}
                    cy={cyCall}
                    r="2.5"
                    fill="#10b981"
                    className="hover:r-4 cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Hover Status Box */}
          {hoveredPoint && (
            <div className="absolute top-3 right-4 bg-slate-950/95 border border-slate-700 px-3 py-1.5 rounded-lg shadow-xl text-xs font-mono">
              <span className="text-white font-bold">${hoveredPoint.strike} Strike: </span>
              <span className="text-amber-400 font-bold ml-1.5">Put IV: {hoveredPoint.putIv}%</span>
              <span className="text-emerald-400 font-bold ml-2">Call IV: {hoveredPoint.callIv}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Option Chain Straddle Ladder Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              {chainResult.symbol} Option Straddle Chain • {chainResult.selectedExpiration} ({chainResult.selectedDte} DTE)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredRows.length} Strikes Loaded • Click row to stage order
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* Top Level Group Header */}
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-center">
                {(sideFilter === 'BOTH' || sideFilter === 'CALLS') && (
                  <th colSpan={sideFilter === 'BOTH' ? 8 : 9} className="py-2 px-3 bg-emerald-950/30 text-emerald-400 border-r border-slate-800">
                    CALLS ({chainResult.symbol} Bullish / Covered Call Writing)
                  </th>
                )}
                <th className="py-2 px-4 bg-slate-950 text-white border-r border-l border-slate-800">
                  STRIKE
                </th>
                {(sideFilter === 'BOTH' || sideFilter === 'PUTS') && (
                  <th colSpan={sideFilter === 'BOTH' ? 8 : 9} className="py-2 px-3 bg-amber-950/30 text-amber-400 border-l border-slate-800">
                    PUTS ({chainResult.symbol} Bearish / Cash-Secured Put Writing)
                  </th>
                )}
              </tr>

              {/* Detailed Columns Header */}
              <tr className="border-b border-slate-800 bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase font-mono">
                {/* Calls Columns */}
                {(sideFilter === 'BOTH' || sideFilter === 'CALLS') && (
                  <>
                    <th className="py-2 px-2 text-right">Delta</th>
                    <th className="py-2 px-2 text-right">Theta</th>
                    <th className="py-2 px-2 text-right">Vega</th>
                    <th className="py-2 px-2 text-right">Bid</th>
                    <th className="py-2 px-2 text-right text-emerald-400 font-bold">Ask</th>
                    <th className="py-2 px-2 text-right">IV%</th>
                    <th className="py-2 px-2 text-right">Vol</th>
                    <th className="py-2 px-2 text-right border-r border-slate-800">OI</th>
                  </>
                )}

                {/* Center Strike Column */}
                <th className="py-2 px-4 text-center text-white font-bold bg-slate-900 border-r border-l border-slate-800">
                  Strike
                </th>

                {/* Puts Columns */}
                {(sideFilter === 'BOTH' || sideFilter === 'PUTS') && (
                  <>
                    <th className="py-2 px-2 text-left border-l border-slate-800">OI</th>
                    <th className="py-2 px-2 text-left">Vol</th>
                    <th className="py-2 px-2 text-left">IV%</th>
                    <th className="py-2 px-2 text-left text-amber-400 font-bold">Bid</th>
                    <th className="py-2 px-2 text-left">Ask</th>
                    <th className="py-2 px-2 text-left">Delta</th>
                    <th className="py-2 px-2 text-left">Theta</th>
                    <th className="py-2 px-2 text-left">Vega</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredRows.map((row) => {
                const isNearAtm = row.isNearMoney;
                return (
                  <tr
                    key={row.strike}
                    className={`transition-colors ${
                      isNearAtm
                        ? 'bg-cyan-950/20 border-y-2 border-cyan-500/40 font-bold'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Calls Data (Left) */}
                    {(sideFilter === 'BOTH' || sideFilter === 'CALLS') && (
                      <>
                        <td className={`py-2 px-2 text-right ${row.inTheMoneyCall ? 'bg-emerald-950/20 text-emerald-300 font-bold' : 'text-slate-300'}`}>
                          {row.call.delta.toFixed(3)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">
                          {row.call.theta.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">
                          {row.call.vega.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          ${row.call.bid.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-bold cursor-pointer hover:underline" onClick={() => handleStageContract(row.call)} title="Click to Stage Call Order">
                          ${row.call.ask.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">
                          {row.call.iv.toFixed(1)}%
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">
                          {row.call.volume.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 border-r border-slate-800">
                          {row.call.openInterest.toLocaleString()}
                        </td>
                      </>
                    )}

                    {/* Center Strike */}
                    <td className={`py-2 px-4 text-center font-bold font-mono border-r border-l border-slate-800 ${
                      isNearAtm
                        ? 'bg-cyan-900/40 text-cyan-300 shadow-sm'
                        : 'bg-slate-900 text-white'
                    }`}>
                      ${row.strike.toFixed(row.strike % 1 === 0 ? 0 : 2)}
                    </td>

                    {/* Puts Data (Right) */}
                    {(sideFilter === 'BOTH' || sideFilter === 'PUTS') && (
                      <>
                        <td className="py-2 px-2 text-left text-slate-400 border-l border-slate-800">
                          {row.put.openInterest.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-left text-slate-400">
                          {row.put.volume.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-left text-slate-400">
                          {row.put.iv.toFixed(1)}%
                        </td>
                        <td className="py-2 px-2 text-left text-amber-400 font-bold cursor-pointer hover:underline" onClick={() => handleStageContract(row.put)} title="Click to Stage Put Order">
                          ${row.put.bid.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-left text-slate-300">
                          ${row.put.ask.toFixed(2)}
                        </td>
                        <td className={`py-2 px-2 text-left ${row.inTheMoneyPut ? 'bg-amber-950/20 text-amber-300 font-bold' : 'text-slate-300'}`}>
                          {row.put.delta.toFixed(3)}
                        </td>
                        <td className="py-2 px-2 text-left text-slate-400">
                          {row.put.theta.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-left text-slate-400">
                          {row.put.vega.toFixed(2)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
