import React from 'react';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import type { PayoffCurveResponse } from '../../types/coveredCall';

interface PayoffDiagramProps {
  data: PayoffCurveResponse;
  symbol: string;
}

export const PayoffDiagram: React.FC<PayoffDiagramProps> = ({ data, symbol }) => {
  const chartData = data.points.map((p) => ({
    price: p.price,
    pnl: p.pnl,
    pnlPositive: p.pnl >= 0 ? p.pnl : 0,
    pnlNegative: p.pnl < 0 ? p.pnl : 0,
  }));

  const minPnl = Math.min(...data.points.map((p) => p.pnl));
  const maxPnl = Math.max(...data.points.map((p) => p.pnl));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-emerald-400">{symbol}</span>
            <span className="text-xs text-slate-400">Covered Call Payoff at Expiry</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Spot: ${data.spot.toFixed(2)} | Strike: ${data.strike.toFixed(2)} | Premium: ${data.premium.toFixed(2)} ({data.contracts} Contract{data.contracts > 1 ? 's' : ''})
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5">
            <span className="text-slate-400">Breakeven: </span>
            <span className="font-bold text-cyan-400">${data.breakeven_price.toFixed(2)}</span>
          </div>
          <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-1.5">
            <span className="text-emerald-400/80">Max Profit: </span>
            <span className="font-bold text-emerald-400">+${data.max_profit.toFixed(2)} ({data.max_profit_pct.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="price"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `$${v}`}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `$${v}`}
              domain={[minPnl * 1.05, maxPnl * 1.1]}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  const isGain = p.pnl >= 0;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 shadow-2xl backdrop-blur-md text-xs font-mono">
                      <p className="text-slate-400">Stock Price: <span className="text-white font-bold">${p.price}</span></p>
                      <p className={isGain ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        P&L: {isGain ? '+' : ''}${p.pnl.toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
            <ReferenceLine x={data.spot} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: 'Spot', fill: '#38bdf8', fontSize: 10 }} />
            <ReferenceLine x={data.strike} stroke="#a855f7" strokeDasharray="4 4" label={{ value: 'Strike (Cap)', fill: '#a855f7', fontSize: 10 }} />
            <ReferenceLine x={data.breakeven_price} stroke="#22d3ee" strokeDasharray="4 4" label={{ value: 'BE', fill: '#22d3ee', fontSize: 10 }} />

            <Area type="monotone" dataKey="pnlPositive" fill="url(#profitGrad)" stroke="none" />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0f172a' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
