import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Filter,
  Flame,
  Loader2,
  Percent,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import type { TradeSetupItem } from '../../types/tradeSetup';
import type { WatchlistQuoteEntry } from '../../types/marketData';
import { cn } from '../../utils/cn';

export type FilterPreset = 'all' | 'high_conviction' | 'bullish' | 'options_income' | 'risk_alerts';
export type SortField =
  | 'ticker'
  | 'bias'
  | 'conviction'
  | 'price'
  | 'entry'
  | 'stop'
  | 'target'
  | 'rr';
export type SortDirection = 'asc' | 'desc';

interface DecisionMatrixProps {
  trades: TradeSetupItem[];
  selectedTicker?: string | null;
  onSelectTrade: (trade: TradeSetupItem) => void;
  isLoading?: boolean;
  className?: string;
  /**
   * Per-ticker hydration cache from watchlistQuoteStore.
   * When provided, price cells show real-time status indicators.
   */
  hydrationCache?: Record<string, WatchlistQuoteEntry>;
  /**
   * QC gate: when true, rows whose hydration status is pending or hydrating
   * are excluded from the rendered table until data is ready.
   * Default false (show spinner in row instead).
   */
  hideUnhydrated?: boolean;
}

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({
  trades,
  selectedTicker,
  onSelectTrade,
  isLoading = false,
  className,
  hydrationCache,
  hideUnhydrated = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterPreset>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('conviction');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle column header sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter & Search Logic
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const tickerMatch = t.ticker.toLowerCase().includes(q);
        const nameMatch = (t.company_name || t.companyName || '').toLowerCase().includes(q);
        const catalystMatch = (t.catalyst || '').toLowerCase().includes(q);
        if (!tickerMatch && !nameMatch && !catalystMatch) return false;
      }

      // Quick Filters
      const score = t.conviction_score ?? t.convictionScore ?? 0;
      const bias = (t.bias || '').toUpperCase();
      const hasRisks =
        t.has_risk_alerts ||
        (t.risk_summary && !t.risk_summary.toLowerCase().includes('standard') && t.risk_summary.length > 5);

      if (activeFilter === 'high_conviction') {
        return score >= 8.0;
      }
      if (activeFilter === 'bullish') {
        return bias === 'BULLISH';
      }
      if (activeFilter === 'options_income') {
        return Boolean(t.options_setup || t.optionsSetup);
      }
      if (activeFilter === 'risk_alerts') {
        return Boolean(hasRisks);
      }

      return true;
    });
  }, [trades, searchQuery, activeFilter]);

  // Sorting Logic
  const sortedTrades = useMemo(() => {
    const list = [...filteredTrades];
    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case 'ticker':
          valA = a.ticker;
          valB = b.ticker;
          break;
        case 'bias':
          valA = a.bias;
          valB = b.bias;
          break;
        case 'conviction':
          valA = a.conviction_score ?? a.convictionScore ?? 0;
          valB = b.conviction_score ?? b.convictionScore ?? 0;
          break;
        case 'price':
          valA = a.current_price ?? a.currentPrice ?? 0;
          valB = b.current_price ?? b.currentPrice ?? 0;
          break;
        case 'entry':
          valA = a.entry_price ?? a.entryPrice ?? 0;
          valB = b.entry_price ?? b.entryPrice ?? 0;
          break;
        case 'stop':
          valA = a.stop_loss ?? a.stopLoss ?? 0;
          valB = b.stop_loss ?? b.stopLoss ?? 0;
          break;
        case 'target':
          valA = a.take_profit ?? a.takeProfit ?? 0;
          valB = b.take_profit ?? b.takeProfit ?? 0;
          break;
        case 'rr':
          valA = a.risk_reward_ratio ?? a.riskRewardRatio ?? 0;
          valB = b.risk_reward_ratio ?? b.riskRewardRatio ?? 0;
          break;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
    return list;
  }, [filteredTrades, sortField, sortDirection]);

  // Counts for quick filter badges
  const counts = useMemo(() => {
    return {
      all: trades.length,
      high_conviction: trades.filter((t) => (t.conviction_score ?? t.convictionScore ?? 0) >= 8.0).length,
      bullish: trades.filter((t) => (t.bias || '').toUpperCase() === 'BULLISH').length,
      options_income: trades.filter((t) => Boolean(t.options_setup || t.optionsSetup)).length,
      risk_alerts: trades.filter(
        (t) =>
          t.has_risk_alerts ||
          (t.risk_summary && !t.risk_summary.toLowerCase().includes('standard') && t.risk_summary.length > 5)
      ).length,
    };
  }, [trades]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-70 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-accent-long stroke-[2.5]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-accent-long stroke-[2.5]" />
    );
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border-subtle bg-card-dark shadow-soft-card flex flex-col overflow-hidden select-none',
        className
      )}
    >
      {/* Header & Controls Toolbar */}
      <div className="p-3 sm:p-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card-dark">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-long animate-pulse" />
            <h2 className="text-sm font-bold text-foreground tracking-tight uppercase font-financial">
              Executive Decision Matrix
            </h2>
            <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-surface-dark border border-border-subtle text-secondary-text inline-flex items-center gap-1">
              {isLoading ? <span className="h-1.5 w-1.5 rounded-full bg-accent-long animate-ping" /> : null}
              {sortedTrades.length} Setups
            </span>
          </div>
          <p className="text-xs text-muted-text">
            High-density institutional trade matrix with automated options setups and risk/reward quantification.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Chips */}
          <div className="inline-flex rounded-lg border border-border-subtle bg-surface-dark p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all text-[11px]',
                activeFilter === 'all'
                  ? 'bg-card-dark text-foreground shadow-sm border border-border-subtle'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <span>All</span>
              <span className="text-[10px] opacity-70 font-mono tabular-nums">({counts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('high_conviction')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all text-[11px]',
                activeFilter === 'high_conviction'
                  ? 'bg-card-dark text-accent-long shadow-sm border border-border-subtle'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <Flame className="h-3 w-3 text-accent-long" />
              <span>Conviction &ge; 8.0</span>
              <span className="text-[10px] opacity-70 font-mono tabular-nums">({counts.high_conviction})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('bullish')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all text-[11px]',
                activeFilter === 'bullish'
                  ? 'bg-card-dark text-accent-long shadow-sm border border-border-subtle'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <TrendingUp className="h-3 w-3 text-accent-long" />
              <span>Bullish</span>
              <span className="text-[10px] opacity-70 font-mono tabular-nums">({counts.bullish})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('options_income')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all text-[11px]',
                activeFilter === 'options_income'
                  ? 'bg-card-dark text-emerald-400 shadow-sm border border-border-subtle'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <Percent className="h-3 w-3 text-emerald-400" />
              <span>Options Income</span>
              <span className="text-[10px] opacity-70 font-mono tabular-nums">({counts.options_income})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('risk_alerts')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all text-[11px]',
                activeFilter === 'risk_alerts'
                  ? 'bg-card-dark text-accent-short shadow-sm border border-border-subtle'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <AlertTriangle className="h-3 w-3 text-accent-short" />
              <span>Risk Alerts</span>
              <span className="text-[10px] opacity-70 font-mono tabular-nums">({counts.risk_alerts})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-text pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, company, catalyst..."
              className="h-8 w-44 sm:w-56 rounded-lg border border-border-subtle bg-surface-dark pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-text focus:outline-none focus:border-border-subtle focus:ring-1 focus:ring-accent-long/30 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Decision Table (table-fixed for zero layout shifts) */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left border-collapse min-w-[980px]">
          {/* Explicit Column Width Allocation: Sums to 100% */}
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[8%]" />
            <col className="w-[12%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[16%]" />
            <col className="w-[5%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border-subtle bg-surface-dark/90 text-[11px] font-semibold text-muted-text tracking-wider uppercase">
              {/* 1. Ticker */}
              <th
                onClick={() => handleSort('ticker')}
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Ticker</span>
                  {renderSortIcon('ticker')}
                </div>
              </th>

              {/* 2. Bias Badge */}
              <th
                onClick={() => handleSort('bias')}
                className="py-2.5 px-2 cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Bias</span>
                  {renderSortIcon('bias')}
                </div>
              </th>

              {/* 3. Conviction Score */}
              <th
                onClick={() => handleSort('conviction')}
                className="py-2.5 px-3 cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Conviction</span>
                  {renderSortIcon('conviction')}
                </div>
              </th>

              {/* 4. Last Price */}
              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Last Price</span>
                  {renderSortIcon('price')}
                </div>
              </th>

              {/* 5. Buy/Entry Zone */}
              <th
                onClick={() => handleSort('entry')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Entry Zone</span>
                  {renderSortIcon('entry')}
                </div>
              </th>

              {/* 6. Target */}
              <th
                onClick={() => handleSort('target')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Target</span>
                  {renderSortIcon('target')}
                </div>
              </th>

              {/* 7. Invalidation Stop */}
              <th
                onClick={() => handleSort('stop')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Inval. Stop</span>
                  {renderSortIcon('stop')}
                </div>
              </th>

              {/* 8. Risk/Reward Ratio */}
              <th
                onClick={() => handleSort('rr')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>R:R Ratio</span>
                  {renderSortIcon('rr')}
                </div>
              </th>

              {/* 9. Options Setup (CSP / CC) */}
              <th className="py-2.5 px-3">Options Setup</th>

              {/* 10. Actions */}
              <th className="py-2.5 px-2 text-center">Inspect</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border-subtle text-xs font-sans">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-text">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="h-6 w-6 stroke-[1.5] text-muted-text/60" />
                    <span className="text-sm font-medium">No trade setups match the active filters</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter('all');
                        setSearchQuery('');
                      }}
                      className="text-xs text-accent-long hover:underline mt-1"
                    >
                      Reset filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedTrades.map((t) => {
                const ticker = t.ticker.toUpperCase();
                const isSelected = selectedTicker?.toUpperCase() === ticker;
                const score = t.conviction_score ?? t.convictionScore ?? 5.0;
                const bias = (t.bias || 'NEUTRAL').toUpperCase();
                const currentPrice = t.current_price ?? t.currentPrice ?? 0;
                const entryPrice = t.entry_price ?? t.entryPrice ?? 0;
                const stopLoss = t.stop_loss ?? t.stopLoss ?? 0;
                const takeProfit = t.take_profit ?? t.takeProfit ?? 0;
                const rr = t.risk_reward_ratio ?? t.riskRewardRatio ?? 0;

                // Hydration-aware rendering
                const hydEntry = hydrationCache?.[ticker];
                const hydStatus = hydEntry?.status;
                const isHydrating = hydStatus === 'pending' || hydStatus === 'hydrating';
                const hydFailed = hydStatus === 'failed';

                // Apply QC gate: skip row if hard-blocking is enabled and data isn't ready
                if (hideUnhydrated && isHydrating) return null;

                const isBullish = bias === 'BULLISH';
                const isBearish = bias === 'BEARISH';

                // Derived options setup
                const optionsSetup = t.options_setup || t.optionsSetup;

                // Price cell renderer with monospace tabular-nums
                const PriceCell: React.FC<{ value: number; colorClass?: string }> = ({ value, colorClass }) => {
                  if (isHydrating) {
                    return (
                      <span className="inline-flex items-center gap-1 text-muted-text text-xs justify-end">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Fetching…</span>
                      </span>
                    );
                  }
                  if (hydFailed || value === 0) {
                    return <span className="text-muted-text font-mono text-xs">—</span>;
                  }
                  return (
                    <span className={cn('font-mono tabular-nums font-semibold text-[13px]', colorClass)}>
                      ${value.toFixed(2)}
                    </span>
                  );
                };

                return (
                  <tr
                    key={t.ticker}
                    onClick={() => onSelectTrade(t)}
                    className={cn(
                      'cursor-pointer transition-colors group',
                      isSelected
                        ? 'bg-accent-long/10 border-l-2 border-l-accent-long'
                        : 'hover:bg-surface-dark/70',
                      isHydrating && 'opacity-75'
                    )}
                  >
                    {/* 1. Ticker & Company Name */}
                    <td className="py-2.5 px-3 sm:px-4">
                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground font-financial tracking-tight text-sm">
                            {t.ticker}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-surface-dark text-muted-text border border-border-subtle font-mono">
                            {t.market}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-text truncate">
                          {t.company_name || t.companyName || t.ticker}
                        </span>
                      </div>
                    </td>

                    {/* 2. Bias Badge */}
                    <td className="py-2.5 px-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border',
                          isBullish &&
                            'bg-emerald-950/40 text-emerald-400 border-emerald-500/30',
                          isBearish &&
                            'bg-rose-950/40 text-rose-400 border-rose-500/30',
                          !isBullish &&
                            !isBearish &&
                            'bg-amber-950/40 text-amber-400 border-amber-500/30'
                        )}
                      >
                        {isBullish && <ArrowUp className="h-3 w-3 stroke-[2.5]" />}
                        {isBearish && <ArrowDown className="h-3 w-3 stroke-[2.5]" />}
                        <span>{bias}</span>
                      </span>
                    </td>

                    {/* 3. Conviction Score (Progress bar 1-10) */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1 min-w-[90px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono tabular-nums font-bold text-foreground">
                            {score.toFixed(1)}
                            <span className="text-muted-text font-normal text-[10px]">/10</span>
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-semibold',
                              score >= 8
                                ? 'text-emerald-400'
                                : score >= 6
                                ? 'text-amber-400'
                                : 'text-muted-text'
                            )}
                          >
                            {score >= 8 ? 'STRONG' : score >= 6 ? 'MOD' : 'WEAK'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-surface-dark border border-border-subtle overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              score >= 8
                                ? 'bg-emerald-400'
                                : score >= 6
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            )}
                            style={{ width: `${Math.min(100, Math.max(5, score * 10))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 4. Last Price (tabular-nums, right align) */}
                    <td className="py-2.5 px-3 text-right">
                      {isHydrating ? (
                        <span className="inline-flex items-center gap-1 text-muted-text text-xs justify-end">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-[10px]">Loading…</span>
                        </span>
                      ) : hydFailed ? (
                        <span className="inline-flex items-center gap-1 text-rose-400/80 text-[10px]" title={hydEntry?.error}>
                          <AlertTriangle className="h-3 w-3" />
                          Offline
                        </span>
                      ) : (
                        <span className="font-mono tabular-nums text-foreground font-semibold text-[13px]">
                          ${currentPrice > 0 ? currentPrice.toFixed(2) : '—'}
                        </span>
                      )}
                    </td>

                    {/* 5. Buy/Entry Zone */}
                    <td className="py-2.5 px-3 text-right">
                      <PriceCell value={entryPrice} colorClass="text-secondary-text" />
                    </td>

                    {/* 6. Target */}
                    <td className="py-2.5 px-3 text-right">
                      <PriceCell value={takeProfit} colorClass="text-emerald-400 font-semibold" />
                    </td>

                    {/* 7. Invalidation Stop */}
                    <td className="py-2.5 px-3 text-right">
                      <PriceCell value={stopLoss} colorClass="text-rose-400 font-semibold" />
                    </td>

                    {/* 8. Risk/Reward Ratio */}
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={cn(
                          'font-mono tabular-nums font-bold px-1.5 py-0.5 rounded text-[11px] inline-block',
                          rr >= 2.0
                            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                            : rr >= 1.5
                            ? 'text-amber-400 bg-amber-950/40'
                            : 'text-muted-text bg-surface-dark'
                        )}
                      >
                        1:{rr > 0 ? rr.toFixed(2) : '—'}
                      </span>
                    </td>

                    {/* 9. Options Setup (CSP / CC) */}
                    <td className="py-2.5 px-3">
                      {optionsSetup ? (
                        <div className="flex flex-col truncate">
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1 py-0.2 rounded font-mono',
                                optionsSetup.strategy_type === 'CSP'
                                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-indigo-950/50 text-indigo-300 border border-indigo-500/30'
                              )}
                            >
                              {optionsSetup.strategy_type}
                            </span>
                            <span className="font-mono tabular-nums font-semibold text-foreground text-xs">
                              ${optionsSetup.strike.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono font-medium">
                              {optionsSetup.annualized_yield_pct.toFixed(0)}% APY
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-text truncate font-mono">
                            {optionsSetup.cushion_pct.toFixed(1)}% cushion • {optionsSetup.expiration}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-text font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* 10. Actions */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrade(t);
                        }}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface-dark text-muted-text hover:text-foreground hover:border-accent-long/40 transition-colors"
                        title="Inspect Ticker Setup"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Stats Strip */}
      <div className="p-2.5 px-4 bg-surface-dark/90 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs text-muted-text">
        <div className="flex items-center gap-3">
          <span className="font-medium text-secondary-text">
            Showing <strong className="text-foreground font-mono tabular-nums">{sortedTrades.length}</strong> of{' '}
            <span className="font-mono tabular-nums">{trades.length}</span> setups
          </span>
          <span className="hidden sm:inline text-border-subtle">|</span>
          <span className="hidden sm:inline">
            Click any row to open the 550px Ticker Inspector
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Bullish: {counts.bullish}
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-400">
            <Percent className="h-3 w-3" />
            Options Yield Setups: {counts.options_income}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DecisionMatrix;
