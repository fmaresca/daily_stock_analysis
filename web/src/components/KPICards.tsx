import React from 'react';
import { Flame, ShieldCheck, AlertTriangle, Activity } from './icons';
import { TickerMeta } from '../types/options';

interface KPICardsProps {
  tickers: TickerMeta[];
  onFilterHighIvr: () => void;
  onFilterOversold: () => void;
  onFilterNearSupport?: () => void;
  onFilterEarnings: () => void;
  activeFilter: 'ALL' | 'IVR' | 'OVERSOLD' | 'SUPPORT' | 'EARNINGS';
}

export const KPICards: React.FC<KPICardsProps> = ({
  tickers,
  onFilterHighIvr,
  onFilterOversold,
  onFilterNearSupport,
  onFilterEarnings,
  activeFilter,
}) => {
  const highIvrList = tickers.filter((t) => t.iv_rank >= 45);
  const oversoldList = tickers.filter((t) => t.rsi_14 < 35);
  const nearSupportList = tickers.filter((t) => t.spot_price <= t.lower_bb * 1.02);
  const earningsAlertList = tickers.filter((t) => t.earnings_within_7d);
  const avgIv = tickers.length > 0
    ? (tickers.reduce((acc, t) => acc + t.iv_current, 0) / tickers.length).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Tickers with IVR >= 45% */}
      <div
        onClick={onFilterHighIvr}
        className={`glass-panel p-4 rounded-xl relative overflow-hidden group cursor-pointer transition-all border ${
          activeFilter === 'IVR'
            ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
            : 'border-emerald-500/20 hover:border-emerald-500/50'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>High IV Rank (≥45%)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
            Rich Premium
          </span>
        </div>
        <div className="flex items-baseline space-x-2 mt-1">
          <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
            {highIvrList.length}
          </span>
          <span className="text-xs text-slate-400">/ {tickers.length} tickers</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          {highIvrList.slice(0, 3).map((t) => (
            <span
              key={t.symbol}
              className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300"
            >
              {t.symbol} ({t.iv_rank})
            </span>
          ))}
          {highIvrList.length > 3 && (
            <span className="text-[10px] text-slate-400">+{highIvrList.length - 3} more</span>
          )}
        </div>
      </div>

      {/* KPI 2: Tickers Oversold (RSI < 35) & Near Support */}
      <div
        onClick={onFilterOversold}
        className={`glass-panel p-4 rounded-xl relative overflow-hidden group cursor-pointer transition-all border ${
          activeFilter === 'OVERSOLD' || activeFilter === 'SUPPORT'
            ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
            : 'border-cyan-500/20 hover:border-cyan-500/50'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Oversold Dips</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono font-bold">
              RSI &lt; 35
            </span>
            {onFilterNearSupport && nearSupportList.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterNearSupport();
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors font-mono font-bold ${
                  activeFilter === 'SUPPORT'
                    ? 'bg-blue-500/30 text-blue-200 border-blue-400'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-cyan-300'
                }`}
              >
                {nearSupportList.length} at BB
              </span>
            )}
          </div>
        </div>
        <div className="flex items-baseline space-x-2 mt-1">
          <span className="text-3xl font-black font-mono text-cyan-400 tracking-tight">
            {oversoldList.length}
          </span>
          <span className="text-xs text-slate-400">tickers (RSI &lt; 35)</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          {oversoldList.map((t) => (
            <span
              key={t.symbol}
              className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300"
            >
              {t.symbol} (RSI {t.rsi_14})
            </span>
          ))}
          {oversoldList.length === 0 && (
            <span className="text-[11px] text-slate-400">
              0 tickers with RSI &lt; 35 ({nearSupportList.length} near Lower BB)
            </span>
          )}
        </div>
      </div>

      {/* KPI 3: Earnings Alerts (< 7 Days) */}
      <div
        onClick={onFilterEarnings}
        className={`glass-panel p-4 rounded-xl relative overflow-hidden group cursor-pointer transition-all border ${
          activeFilter === 'EARNINGS'
            ? 'border-rose-500 bg-rose-950/20 shadow-lg shadow-rose-500/10'
            : earningsAlertList.length > 0
            ? 'border-rose-500/40 bg-rose-950/10 hover:border-rose-500/70'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <AlertTriangle className={`w-4 h-4 ${earningsAlertList.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Earnings Alerts (&lt;7d)</span>
          </div>
          {earningsAlertList.length > 0 ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono font-bold animate-pulse">
              Gap Risk
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              Clear
            </span>
          )}
        </div>
        <div className="flex items-baseline space-x-2 mt-1">
          <span className={`text-3xl font-black font-mono tracking-tight ${earningsAlertList.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {earningsAlertList.length}
          </span>
          <span className="text-xs text-slate-400">imminent releases</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2">
          {earningsAlertList.length > 0 ? (
            <span className="text-rose-300">Caution: Binary IV crush risk</span>
          ) : (
            <span>No binary events in 7-day window</span>
          )}
        </div>
      </div>

      {/* KPI 4: Average Universe Volatility */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group border border-slate-800 hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Universe Average IV</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold">
            Annualized
          </span>
        </div>
        <div className="flex items-baseline space-x-2 mt-1">
          <span className="text-3xl font-black font-mono text-white tracking-tight">
            {avgIv}%
          </span>
          <span className="text-xs text-slate-400">Mean IV</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
          <span>Targeting ~0.15–0.20 Delta</span>
          <span className="text-amber-400 font-medium">Theta Harvest</span>
        </div>
      </div>
    </div>
  );
};
