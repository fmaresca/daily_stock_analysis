import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  AlertCircle,
} from '../icons';

export interface MarketRecapData {
  date: string;
  indices: Array<{
    symbol: string;
    name: string;
    price: number;
    changePct: number;
  }>;
  sectors: Array<{
    symbol: string;
    name: string;
    price: number;
    changePct: number;
  }>;
  vix?: {
    value: number;
    changePct: number;
  };
  treasury10y?: {
    yieldPct: number;
    changePct: number;
  };
  breadth?: {
    advancers: number;
    decliners: number;
    newHighs: number;
    newLows: number;
  };
  asOf: string;
  cached?: boolean;
}

export const MarketRecapSection: React.FC = () => {
  const [recap, setRecap] = useState<MarketRecapData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecap = useCallback(async (refresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/market-recap${refresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecap(data);
      } else {
        setError('Market recap temporarily unavailable.');
      }
    } catch (e: any) {
      setError('Unable to fetch market recap.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  if (error && !recap) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-slate-500" />
          <span>Daily market recap is quiet or refreshing.</span>
        </div>
        <button
          onClick={() => fetchRecap(true)}
          className="text-emerald-400 hover:text-emerald-300 font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const indices = recap?.indices || [];
  const sectors = recap?.sectors || [];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100 transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Daily US Market Recap
              </h3>
              {recap?.asOf && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(recap.asOf).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Broad index performance, volatility regime &amp; sector rotation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchRecap(true)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
            title="Refresh recap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse' : 'Sector Strip'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 1. Major Indices Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
        {indices.map((idx) => {
          const isUp = idx.changePct >= 0;
          return (
            <div
              key={idx.symbol}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300">{idx.name}</span>
                <span className="font-mono text-[10px] text-slate-500">{idx.symbol}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-mono text-xs font-bold text-slate-100">
                  ${idx.price.toFixed(2)}
                </span>
                <span
                  className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                    isUp
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}

        {/* VIX Card */}
        {recap?.vix && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-purple-300">CBOE VIX</span>
              <span className="font-mono text-[10px] text-slate-500">^VIX</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-xs font-bold text-slate-100">
                {recap.vix.value.toFixed(2)}
              </span>
              <span
                className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  recap.vix.changePct >= 0
                    ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {recap.vix.changePct >= 0 ? '+' : ''}{recap.vix.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* 10Y Treasury Yield Card */}
        {recap?.treasury10y && (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-blue-300">10Y Yield</span>
              <span className="font-mono text-[10px] text-slate-500">^TNX</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-xs font-bold text-slate-100">
                {recap.treasury10y.yieldPct.toFixed(2)}%
              </span>
              <span
                className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  recap.treasury10y.changePct >= 0
                    ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {recap.treasury10y.changePct >= 0 ? '+' : ''}{recap.treasury10y.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Optional Breadth Bar (Rendered only if upstream supplies it, never fabricated) */}
      {recap?.breadth && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Market Breadth:</span>
          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span className="text-emerald-400">Advancers: {recap.breadth.advancers}</span>
            <span className="text-rose-400">Decliners: {recap.breadth.decliners}</span>
            <span className="text-slate-400">New Highs: {recap.breadth.newHighs}</span>
            <span className="text-slate-400">New Lows: {recap.breadth.newLows}</span>
          </div>
        </div>
      )}

      {/* 3. Expandable 11 GICS Sector Heat Strip */}
      {isExpanded && sectors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
              11 GICS Sector SPDR Heat Strip
            </span>
            <span className="text-[10px] text-slate-500">Sorted by Daily Performance</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {[...sectors]
              .sort((a, b) => b.changePct - a.changePct)
              .map((sec) => {
                const isUp = sec.changePct >= 0;
                return (
                  <div
                    key={sec.symbol}
                    className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-2">
                      <span className="font-bold text-slate-200 block truncate">{sec.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{sec.symbol}</span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isUp
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isUp ? '+' : ''}{sec.changePct.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
