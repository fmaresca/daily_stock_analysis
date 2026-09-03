import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Filter,
  Flame,
  Search,
  TrendingUp,
} from 'lucide-react';
import type { TradeSetupItem } from '../../types/tradeSetup';
import { cn } from '../../utils/cn';

export type FilterPreset = 'all' | 'high_conviction' | 'bullish' | 'risk_alerts';
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
}

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({
  trades,
  selectedTicker,
  onSelectTrade,
  isLoading = false,
  className,
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
        const catalystMatch = t.catalyst.toLowerCase().includes(q);
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
      <div className="p-3 sm:p-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card-dark/90">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-long" />
            <h2 className="text-sm font-semibold text-foreground tracking-tight uppercase">
              Executive Decision Matrix
            </h2>
            <span className="text-[11px] font-financial px-1.5 py-0.5 rounded bg-surface-dark border border-border-subtle text-secondary-text inline-flex items-center gap-1">
              {isLoading ? <span className="h-1.5 w-1.5 rounded-full bg-accent-long animate-ping" /> : null}
              {sortedTrades.length} Setups
            </span>
          </div>
          <p className="text-xs text-muted-text">
            High-density institutional trade setups with algorithmic risk/reward quantification.
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
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all',
                activeFilter === 'all'
                  ? 'bg-card-dark text-foreground shadow-sm border border-border-subtle/80'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <span>All</span>
              <span className="text-[10px] opacity-70 font-financial">({counts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('high_conviction')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all',
                activeFilter === 'high_conviction'
                  ? 'bg-card-dark text-accent-long shadow-sm border border-border-subtle/80'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <Flame className="h-3 w-3 text-accent-long" />
              <span>Conviction &gt; 8</span>
              <span className="text-[10px] opacity-70 font-financial">({counts.high_conviction})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('bullish')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all',
                activeFilter === 'bullish'
                  ? 'bg-card-dark text-accent-long shadow-sm border border-border-subtle/80'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <TrendingUp className="h-3 w-3 text-accent-long" />
              <span>Bullish</span>
              <span className="text-[10px] opacity-70 font-financial">({counts.bullish})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('risk_alerts')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all',
                activeFilter === 'risk_alerts'
                  ? 'bg-card-dark text-accent-short shadow-sm border border-border-subtle/80'
                  : 'text-muted-text hover:text-foreground'
              )}
            >
              <AlertTriangle className="h-3 w-3 text-accent-short" />
              <span>Risk Alerts</span>
              <span className="text-[10px] opacity-70 font-financial">({counts.risk_alerts})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-text pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker, name, catalyst..."
              className="h-8 w-44 sm:w-56 rounded-lg border border-border-subtle bg-surface-dark pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-text focus:outline-none focus:border-border-subtle/90 focus:ring-1 focus:ring-accent-long/30 font-sans"
            />
          </div>
        </div>
      </div>

      {/* Decision Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle/80 bg-surface-dark/60 text-[11px] font-semibold text-muted-text tracking-wider uppercase">
              <th
                onClick={() => handleSort('ticker')}
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Ticker &amp; Asset</span>
                  {renderSortIcon('ticker')}
                </div>
              </th>
              <th
                onClick={() => handleSort('bias')}
                className="py-2.5 px-3 cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Bias</span>
                  {renderSortIcon('bias')}
                </div>
              </th>
              <th
                onClick={() => handleSort('conviction')}
                className="py-2.5 px-3 cursor-pointer hover:text-foreground transition-colors group min-w-[130px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Conviction</span>
                  {renderSortIcon('conviction')}
                </div>
              </th>
              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Price</span>
                  {renderSortIcon('price')}
                </div>
              </th>
              <th
                onClick={() => handleSort('entry')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Entry</span>
                  {renderSortIcon('entry')}
                </div>
              </th>
              <th
                onClick={() => handleSort('stop')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Stop Loss</span>
                  {renderSortIcon('stop')}
                </div>
              </th>
              <th
                onClick={() => handleSort('target')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Target</span>
                  {renderSortIcon('target')}
                </div>
              </th>
              <th
                onClick={() => handleSort('rr')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>R:R Ratio</span>
                  {renderSortIcon('rr')}
                </div>
              </th>
              <th className="py-2.5 px-3 sm:px-4">Primary Catalyst &amp; Grade</th>
              <th className="py-2.5 px-2 text-center w-8" />
            </tr>
          </thead>

          <tbody className="divide-y divide-border-subtle/60 text-xs">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-text">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="h-6 w-6 text-muted-text/50" />
                    <span className="font-medium">No trade setups match the selected criteria.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter('all');
                        setSearchQuery('');
                      }}
                      className="text-xs text-accent-long hover:underline font-medium mt-1"
                    >
                      Reset filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedTrades.map((t) => {
                const isSelected = selectedTicker?.toUpperCase() === t.ticker.toUpperCase();
                const score = t.conviction_score ?? t.convictionScore ?? 5.0;
                const bias = (t.bias || 'NEUTRAL').toUpperCase();
                const currentPrice = t.current_price ?? t.currentPrice ?? 0;
                const entryPrice = t.entry_price ?? t.entryPrice ?? 0;
                const stopLoss = t.stop_loss ?? t.stopLoss ?? 0;
                const takeProfit = t.take_profit ?? t.takeProfit ?? 0;
                const rr = t.risk_reward_ratio ?? t.riskRewardRatio ?? 0;
                const grade =
                  t.setup_grade ||
                  t.setupGrade ||
                  (score >= 8 && rr >= 2
                    ? 'Tier 1 (High Conviction)'
                    : score >= 6.5 && rr >= 1.5
                    ? 'Tier 2 (Actionable)'
                    : 'Tier 3 (Watch Only)');

                const isBullish = bias === 'BULLISH';
                const isBearish = bias === 'BEARISH';

                return (
                  <tr
                    key={t.ticker}
                    onClick={() => onSelectTrade(t)}
                    className={cn(
                      'cursor-pointer transition-colors group',
                      isSelected
                        ? 'bg-accent-long/10 border-l-2 border-l-accent-long'
                        : 'hover:bg-surface-dark/70'
                    )}
                  >
                    {/* Ticker & Company */}
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-foreground font-financial tracking-tight text-sm">
                            {t.ticker}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-surface-dark text-muted-text border border-border-subtle font-mono">
                            {t.market}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-text truncate max-w-[140px] sm:max-w-[180px]">
                          {t.company_name || t.companyName || t.ticker}
                        </span>
                      </div>
                    </td>

                    {/* Market Bias Badge */}
                    <td className="py-3 px-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border',
                          isBullish &&
                            'bg-accent-long/15 text-accent-long border-accent-long/30',
                          isBearish &&
                            'bg-accent-short/15 text-accent-short border-accent-short/30',
                          !isBullish &&
                            !isBearish &&
                            'bg-accent-neutral/15 text-accent-neutral border-accent-neutral/30'
                        )}
                      >
                        {isBullish && <ArrowUp className="h-3 w-3 stroke-[2.5]" />}
                        {isBearish && <ArrowDown className="h-3 w-3 stroke-[2.5]" />}
                        <span>{bias}</span>
                      </span>
                    </td>

                    {/* Conviction Score & Mini Progress Bar */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 min-w-[110px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-financial font-bold text-foreground">
                            {score.toFixed(1)}
                            <span className="text-muted-text font-normal">/10</span>
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-semibold',
                              score >= 8
                                ? 'text-accent-long'
                                : score >= 6
                                ? 'text-accent-neutral'
                                : 'text-muted-text'
                            )}
                          >
                            {score >= 8 ? 'STRONG' : score >= 6 ? 'MODERATE' : 'WEAK'}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-surface-dark border border-border-subtle/80 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              score >= 8
                                ? 'bg-accent-long'
                                : score >= 6
                                ? 'bg-accent-neutral'
                                : 'bg-accent-short'
                            )}
                            style={{ width: `${Math.min(100, Math.max(5, score * 10))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Current Price */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-financial text-foreground font-semibold text-[13px]">
                        ${currentPrice.toFixed(2)}
                      </span>
                    </td>

                    {/* Entry Target */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-financial text-secondary-text font-medium">
                        ${entryPrice.toFixed(2)}
                      </span>
                    </td>

                    {/* Stop Loss */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-financial text-accent-short font-medium">
                        ${stopLoss.toFixed(2)}
                      </span>
                    </td>

                    {/* Profit Target */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-financial text-accent-long font-medium">
                        ${takeProfit.toFixed(2)}
                      </span>
                    </td>

                    {/* Risk/Reward Ratio */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className={cn(
                          'font-financial font-bold px-1.5 py-0.5 rounded text-[11px]',
                          rr >= 2.0
                            ? 'text-accent-long bg-accent-long/10 border border-accent-long/20'
                            : rr >= 1.5
                            ? 'text-accent-neutral bg-accent-neutral/10'
                            : 'text-muted-text bg-surface-dark'
                        )}
                      >
                        1:{rr > 0 ? rr.toFixed(2) : '—'}
                      </span>
                    </td>

                    {/* Primary Catalyst & Setup Grade */}
                    <td className="py-3 px-3 sm:px-4 max-w-[220px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground text-xs font-medium truncate" title={t.catalyst}>
                          {t.catalyst}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-1.5 py-0.2 rounded font-sans',
                              grade.includes('Tier 1')
                                ? 'text-accent-long bg-accent-long/10 border border-accent-long/30'
                                : grade.includes('Tier 2')
                                ? 'text-accent-neutral bg-accent-neutral/10 border border-accent-neutral/30'
                                : 'text-muted-text bg-surface-dark border border-border-subtle'
                            )}
                          >
                            {grade}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Arrow Indicator */}
                    <td className="py-3 px-2 text-center">
                      <ChevronRight className="h-4 w-4 text-muted-text group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
