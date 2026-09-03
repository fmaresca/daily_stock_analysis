import React, { useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Clock, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface MacroTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

const DEFAULT_MACRO_TICKERS: MacroTicker[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 588.42, change: 3.25, changePct: 0.56 },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 504.18, change: 4.82, changePct: 0.97 },
  { symbol: 'DIA', name: 'Dow Jones ETF', price: 432.10, change: 1.45, changePct: 0.34 },
  { symbol: 'IWM', name: 'Russell 2000 ETF', price: 221.80, change: -1.15, changePct: -0.52 },
  { symbol: 'VIX', name: 'CBOE Volatility', price: 14.82, change: -0.65, changePct: -4.20 },
];

interface TopMacroBarProps {
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/** Determines if US markets are currently open (9:30 AM – 4:00 PM Eastern, Mon–Fri). */
function isMarketOpen(): boolean {
  const now = new Date();
  // Convert to Eastern Time
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const et = new Date(etString);
  const day = et.getDay();
  if (day === 0 || day === 6) return false; // Weekend

  const totalMinutes = et.getHours() * 60 + et.getMinutes();
  const openMinutes = 9 * 60 + 30; // 9:30 AM
  const closeMinutes = 16 * 60; // 4:00 PM
  return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
}

export const TopMacroBar: React.FC<TopMacroBarProps> = ({
  className,
  onRefresh,
  isRefreshing = false,
}) => {
  const [tickers, setTickers] = useState<MacroTicker[]>(DEFAULT_MACRO_TICKERS);
  const [marketOpen, setMarketOpen] = useState(isMarketOpen);
  const [lastSync, setLastSync] = useState<string>(() => {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  // Micro-tick variation for institutional live terminal feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((t) => {
          const delta = (Math.random() - 0.48) * 0.12;
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
      setMarketOpen(isMarketOpen());
      setLastSync(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setLastSync(
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    onRefresh?.();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-10 w-full items-center justify-between border-b border-border-subtle bg-surface-dark px-4 backdrop-blur-md text-xs select-none',
        className
      )}
    >
      {/* Left: Compact Macro Ticker Strip (SPY, QQQ, DIA, IWM, VIX) */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1.5 text-secondary-text shrink-0">
          <Activity className="h-3.5 w-3.5 text-accent-long animate-pulse" />
          <span className="hidden sm:inline uppercase tracking-wider text-[10px] text-muted-text font-bold">
            Macro Tape
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {tickers.map((t) => {
            const isUp = t.change >= 0;
            return (
              <div
                key={t.symbol}
                className="flex items-center gap-1.5 rounded bg-card-dark px-2 py-0.5 border border-border-subtle hover:border-border-subtle/80 transition-colors shrink-0"
              >
                <span className="font-bold text-foreground tracking-tight text-[11px]">
                  {t.symbol}
                </span>
                <span className="font-mono tabular-nums text-[11px] text-foreground font-medium">
                  ${t.price.toFixed(2)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-mono tabular-nums text-[10px] font-semibold px-1 rounded',
                    isUp
                      ? 'text-emerald-400 bg-emerald-950/40'
                      : 'text-rose-400 bg-rose-950/40'
                  )}
                >
                  {isUp ? (
                    <ArrowUpRight className="h-2.5 w-2.5 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="h-2.5 w-2.5 stroke-[2.5]" />
                  )}
                  {isUp ? `+${t.changePct.toFixed(2)}%` : `${t.changePct.toFixed(2)}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Last execution time, Market status badge (OPEN/CLOSED), and Refresh button */}
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {/* Pipeline Execution Timestamp */}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-text font-mono tabular-nums">
          <Clock className="h-3 w-3 text-muted-text/80" />
          <span className="hidden lg:inline text-[10px] uppercase font-sans text-muted-text/70">Sync:</span>
          <span>{lastSync}</span>
        </div>

        {/* Market Status Badge (OPEN / CLOSED) */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider uppercase font-mono',
            marketOpen
              ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
              : 'border-amber-500/30 bg-amber-950/40 text-amber-400'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              marketOpen ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
            )}
          />
          <span>{marketOpen ? 'OPEN' : 'CLOSED'}</span>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex h-7 w-7 items-center justify-center rounded border border-border-subtle bg-card-dark text-secondary-text hover:text-foreground hover:border-border-subtle/80 transition-colors disabled:opacity-50"
          title="Refresh Market Feeds & Pipeline"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-accent-long')} />
        </button>
      </div>
    </header>
  );
};

export default TopMacroBar;
