import React, { useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface MiniTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

const DEFAULT_TICKERS: MiniTicker[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 588.42, change: 3.25, changePct: 0.56 },
  { symbol: 'QQQ', name: 'Invesco QQQ', price: 504.18, change: 4.82, changePct: 0.97 },
  { symbol: 'VIX', name: 'Volatility Index', price: 14.82, change: -0.65, changePct: -4.20 },
];

interface TopMarketBarProps {
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const TopMarketBar: React.FC<TopMarketBarProps> = ({
  className,
  onRefresh,
  isRefreshing = false,
}) => {
  const [tickers, setTickers] = useState<MiniTicker[]>(DEFAULT_TICKERS);
  const [lastSync, setLastSync] = useState<string>(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // Periodically refresh simulated micro-tick variations for terminal feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((t) => {
          // slight random jitter of 0.05%
          const delta = (Math.random() - 0.48) * 0.15;
          const newPrice = Math.max(1, +(t.price + delta).toFixed(2));
          const newChange = +(t.change + delta).toFixed(2);
          const newPct = +((newChange / (newPrice - newChange)) * 100).toFixed(2);
          return {
            ...t,
            price: newPrice,
            change: newChange,
            changePct: newPct,
          };
        })
      );
      setLastSync(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setLastSync(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    onRefresh?.();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-11 w-full items-center justify-between border-b border-border-subtle bg-surface-dark/95 px-3 sm:px-4 backdrop-blur-md text-xs select-none',
        className
      )}
    >
      {/* Mini Ticker Strip */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 text-secondary-text shrink-0 font-medium">
          <Activity className="h-3.5 w-3.5 text-accent-long animate-pulse" />
          <span className="hidden sm:inline uppercase tracking-wider text-[10px] text-muted-text font-bold">
            Macro Feed
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {tickers.map((t) => {
            const isUp = t.change >= 0;
            return (
              <div
                key={t.symbol}
                className="flex items-center gap-1.5 rounded bg-card-dark/80 px-2 py-0.5 border border-border-subtle/80 hover:border-border-subtle transition-colors shrink-0"
              >
                <span className="font-semibold text-foreground tracking-tight text-[11px]">
                  {t.symbol}
                </span>
                <span className="font-financial text-[11px] text-foreground font-medium">
                  {t.price.toFixed(2)}
                </span>
                <div
                  className={cn(
                    'flex items-center gap-0.5 font-financial text-[10px] font-semibold px-1 rounded',
                    isUp ? 'text-accent-long bg-accent-long/10' : 'text-accent-short bg-accent-short/10'
                  )}
                >
                  {isUp ? (
                    <ArrowUpRight className="h-2.5 w-2.5 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="h-2.5 w-2.5 stroke-[2.5]" />
                  )}
                  <span>{isUp ? `+${t.changePct.toFixed(2)}%` : `${t.changePct.toFixed(2)}%`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync Status & Action */}
      <div className="flex items-center gap-3 shrink-0 ml-2">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-text">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-long opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-long" />
          </span>
          <span className="font-financial font-medium text-secondary-text">LIVE FEED</span>
          <span className="text-border-subtle">|</span>
          <span>Sync:</span>
          <span className="font-financial text-foreground">{lastSync}</span>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border-subtle bg-card-dark text-secondary-text hover:text-foreground hover:bg-surface-dark transition-all disabled:opacity-50"
          title="Refresh Market Data"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-accent-long')} />
        </button>
      </div>
    </header>
  );
};
