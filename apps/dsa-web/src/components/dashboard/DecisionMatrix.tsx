import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import type { TradeSetupItem } from '../../types/tradeSetup';
import type { WatchlistQuoteEntry } from '../../types/marketData';

export type MarketBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface TradeSignal {
  id: string;
  ticker: string;
  companyName: string;
  bias: MarketBias;
  convictionScore: number; // 0.0 to 10.0
  currentPrice: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  primaryCatalyst: string;
  optionsStrategy?: string;
  setupTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  rawTrade?: TradeSetupItem;
}

export interface DecisionMatrixProps {
  signals?: TradeSignal[];
  trades?: TradeSetupItem[];
  selectedTicker?: string | null;
  onSelectTicker?: (signal: TradeSignal) => void;
  onSelectTrade?: (trade: TradeSetupItem) => void;
  isLoading?: boolean;
  className?: string;
  hydrationCache?: Record<string, WatchlistQuoteEntry>;
  hideUnhydrated?: boolean;
}

export type SortableField = 
  | 'ticker' 
  | 'bias' 
  | 'convictionScore' 
  | 'currentPrice' 
  | 'entryPrice' 
  | 'targetPrice' 
  | 'stopLoss' 
  | 'riskRewardRatio';

// Default Mock Dataset for Immediate Visual Validation
export const DEFAULT_SIGNALS: TradeSignal[] = [
  {
    id: '1',
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    bias: 'BULLISH',
    convictionScore: 9.2,
    currentPrice: 128.40,
    entryPrice: 125.50,
    targetPrice: 145.00,
    stopLoss: 118.00,
    riskRewardRatio: 2.6,
    primaryCatalyst: 'Data center CAPEX beat; Blackwell ramp validation',
    optionsStrategy: 'Sell $120 CSP (32 DTE, 18.5% Ann. Yield)',
    setupTier: 'Tier 1'
  },
  {
    id: '2',
    ticker: 'MSFT',
    companyName: 'Microsoft Corp',
    bias: 'BULLISH',
    convictionScore: 8.4,
    currentPrice: 448.20,
    entryPrice: 442.00,
    targetPrice: 485.00,
    stopLoss: 428.00,
    riskRewardRatio: 3.1,
    primaryCatalyst: 'Azure AI enterprise run-rate expansion',
    optionsStrategy: 'Bull Call Debit Spread 445/470',
    setupTier: 'Tier 1'
  },
  {
    id: '3',
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    bias: 'BEARISH',
    convictionScore: 6.8,
    currentPrice: 215.10,
    entryPrice: 218.00,
    targetPrice: 185.00,
    stopLoss: 229.00,
    riskRewardRatio: 3.0,
    primaryCatalyst: 'Auto gross margin compression & EU delivery drop',
    optionsStrategy: 'Bear Put Spread 215/195',
    setupTier: 'Tier 2'
  },
  {
    id: '4',
    ticker: 'JNJ',
    companyName: 'Johnson & Johnson',
    bias: 'NEUTRAL',
    convictionScore: 5.4,
    currentPrice: 161.80,
    entryPrice: 159.00,
    targetPrice: 168.00,
    stopLoss: 155.00,
    riskRewardRatio: 2.25,
    primaryCatalyst: 'Defensive health sector rotation; stable dividend profile',
    optionsStrategy: 'Covered Call @ $167.50 strike',
    setupTier: 'Tier 3'
  }
];

// Helper to adapt existing TradeSetupItem into TradeSignal
function adaptTradeSetupToSignal(trade: TradeSetupItem): TradeSignal {
  const conviction = trade.conviction_score ?? trade.convictionScore ?? 5.0;
  const rr = trade.risk_reward_ratio ?? trade.riskRewardRatio ?? 2.0;
  const biasStr = (trade.bias || 'NEUTRAL').toUpperCase();
  const bias: MarketBias = biasStr === 'BULLISH' ? 'BULLISH' : biasStr === 'BEARISH' ? 'BEARISH' : 'NEUTRAL';

  let tier: 'Tier 1' | 'Tier 2' | 'Tier 3' = 'Tier 3';
  if (conviction >= 8.0 && rr >= 2.0) {
    tier = 'Tier 1';
  } else if (conviction >= 6.5) {
    tier = 'Tier 2';
  }

  let optionsDesc: string | undefined = undefined;
  const opt = trade.options_setup || trade.optionsSetup;
  if (opt) {
    optionsDesc = `${opt.strategy_type === 'CSP' ? 'Sell' : 'Sell'} $${opt.strike.toFixed(1)} ${opt.strategy_type} (${opt.expiration}, ${opt.annualized_yield_pct.toFixed(0)}% Ann. Yield)`;
  }

  return {
    id: trade.ticker,
    ticker: trade.ticker,
    companyName: trade.company_name || trade.companyName || trade.ticker,
    bias,
    convictionScore: conviction,
    currentPrice: trade.current_price ?? trade.currentPrice ?? 0.0,
    entryPrice: trade.entry_price ?? trade.entryPrice ?? 0.0,
    targetPrice: trade.take_profit ?? trade.takeProfit ?? 0.0,
    stopLoss: trade.stop_loss ?? trade.stopLoss ?? 0.0,
    riskRewardRatio: rr,
    primaryCatalyst: trade.catalyst || 'Quantitative multi-factor analysis',
    optionsStrategy: optionsDesc,
    setupTier: tier,
    rawTrade: trade,
  };
}

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({ 
  signals: propSignals,
  trades,
  selectedTicker,
  onSelectTicker,
  onSelectTrade,
  isLoading = false,
  className = '',
  hydrationCache,
  hideUnhydrated = false,
}) => {
  // Normalize dataset from either signals or trades prop
  const baseSignals = useMemo<TradeSignal[]>(() => {
    if (propSignals && propSignals.length > 0) {
      return propSignals;
    }
    if (trades && trades.length > 0) {
      return trades.map(adaptTradeSetupToSignal);
    }
    return DEFAULT_SIGNALS;
  }, [propSignals, trades]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBias, setSelectedBias] = useState<string>('ALL');
  const [highConvictionOnly, setHighConvictionOnly] = useState(false);
  const [sortField, setSortField] = useState<SortableField>('convictionScore');
  const [sortAscending, setSortAscending] = useState(false);

  // Sorting Handler
  const handleSort = (field: SortableField) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(field === 'ticker' || field === 'currentPrice'); // sensible defaults
    }
  };

  // Filter and Sort Processing
  const filteredAndSortedSignals = useMemo(() => {
    return baseSignals
      .filter((item) => {
        // QC Gate for hydration if required
        if (hideUnhydrated && hydrationCache) {
          const hyd = hydrationCache[item.ticker.toUpperCase()];
          if (hyd && (hyd.status === 'pending' || hyd.status === 'hydrating')) {
            return false;
          }
        }

        const matchesSearch = 
          item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.primaryCatalyst.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesBias = selectedBias === 'ALL' || item.bias === selectedBias;
        const matchesConviction = !highConvictionOnly || item.convictionScore >= 8.0;

        return matchesSearch && matchesBias && matchesConviction;
      })
      .sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];

        // Hydration override for live price sorting
        if (sortField === 'currentPrice' && hydrationCache) {
          const priceA = hydrationCache[a.ticker.toUpperCase()]?.quote?.currentPrice;
          const priceB = hydrationCache[b.ticker.toUpperCase()]?.quote?.currentPrice;
          if (priceA !== undefined && priceA > 0) valueA = priceA;
          if (priceB !== undefined && priceB > 0) valueB = priceB;
        }

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortAscending 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }

        return sortAscending 
          ? (valueA as number) - (valueB as number) 
          : (valueB as number) - (valueA as number);
      });
  }, [baseSignals, searchTerm, selectedBias, highConvictionOnly, sortField, sortAscending, hideUnhydrated, hydrationCache]);

  const handleRowClick = (item: TradeSignal) => {
    if (onSelectTicker) {
      onSelectTicker(item);
    }
    if (onSelectTrade) {
      if (item.rawTrade) {
        onSelectTrade(item.rawTrade);
      } else {
        // Synthesize a TradeSetupItem from TradeSignal
        onSelectTrade({
          ticker: item.ticker,
          company_name: item.companyName,
          bias: item.bias,
          conviction_score: item.convictionScore,
          current_price: item.currentPrice,
          entry_price: item.entryPrice,
          stop_loss: item.stopLoss,
          take_profit: item.targetPrice,
          risk_reward_ratio: item.riskRewardRatio,
          catalyst: item.primaryCatalyst,
          risk_summary: 'Standard volatility guard',
          action_checklist: [`Review ${item.ticker} key levels`, `Verify catalyst alignment`],
          raw_markdown: item.primaryCatalyst,
          has_risk_alerts: item.convictionScore < 5.0,
        });
      }
    }
  };

  // Conviction Bar Component
  const renderConvictionScore = (score: number) => {
    const percentage = (score / 10) * 100;
    const isTopTier = score >= 8.0;

    return (
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-xs font-semibold tabular-nums text-slate-100">
          {score.toFixed(1)}
        </span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-800">
          <div 
            className={`h-full transition-all duration-300 ${
              isTopTier ? 'bg-emerald-400' : score >= 6.0 ? 'bg-sky-400' : 'bg-amber-400'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Directional Bias Badge
  const renderBiasBadge = (bias: MarketBias) => {
    const styles = {
      BULLISH: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400',
      BEARISH: 'border-rose-500/30 bg-rose-950/40 text-rose-400',
      NEUTRAL: 'border-amber-500/30 bg-amber-950/40 text-amber-400',
    };

    const icons = {
      BULLISH: <TrendingUp className="h-3 w-3" />,
      BEARISH: <TrendingDown className="h-3 w-3" />,
      NEUTRAL: <Minus className="h-3 w-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold tracking-wider ${styles[bias]}`}>
        {icons[bias]}
        {bias}
      </span>
    );
  };

  return (
    <div className={`w-full rounded-xl border border-slate-800 bg-[#0B0F17] text-slate-200 shadow-2xl ${className}`}>
      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticker, company, catalyst..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-[#0F172A] py-1.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Filter Badges & High Conviction Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-800 bg-[#0F172A] p-0.5">
            {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as const).map((bias) => (
              <button
                key={bias}
                type="button"
                onClick={() => setSelectedBias(bias)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedBias === bias
                    ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {bias}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setHighConvictionOnly(!highConvictionOnly)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              highConvictionOnly
                ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                : 'border-slate-800 bg-[#0F172A] text-slate-400 hover:border-slate-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Conviction &ge; 8.0
          </button>
        </div>
      </div>

      {/* High-Density Data Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#080B10] text-[11px] uppercase tracking-wider text-slate-400">
              <th 
                className="cursor-pointer px-4 py-3 hover:text-slate-200"
                onClick={() => handleSort('ticker')}
              >
                <div className="flex items-center gap-1">
                  Ticker / Asset
                  <SortIndicator field="ticker" activeField={sortField} ascending={sortAscending} />
                </div>
              </th>
              <th 
                className="cursor-pointer px-3 py-3 hover:text-slate-200"
                onClick={() => handleSort('convictionScore')}
              >
                <div className="flex items-center gap-1">
                  Conviction
                  <SortIndicator field="convictionScore" activeField={sortField} ascending={sortAscending} />
                </div>
              </th>
              <th 
                className="cursor-pointer px-3 py-3 hover:text-slate-200"
                onClick={() => handleSort('bias')}
              >
                <div className="flex items-center gap-1">
                  Bias
                  <SortIndicator field="bias" activeField={sortField} ascending={sortAscending} />
                </div>
              </th>
              <th 
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-200"
                onClick={() => handleSort('currentPrice')}
              >
                <div className="flex items-center justify-end gap-1">
                  Last Price
                  <SortIndicator field="currentPrice" activeField={sortField} ascending={sortAscending} />
                </div>
              </th>
              <th 
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-200"
                onClick={() => handleSort('entryPrice')}
              >
                <div className="flex items-center justify-end gap-1">
                  Entry Zone
                  <SortIndicator field="entryPrice" activeField={sortField} ascending={sortAscending} />
                </div>
              </th>
              <th 
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-200"
                onClick={() => handleSort('targetPrice')}
              >
                <div className="flex items-center justify-end gap-1">
                  Take Profit
                  <SortIndicator field="targetPrice" activeField={sortField} ascending={sortAscending} />
                </div>
              </th>
              <th 
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-200"
                onClick={() => handleSort('stopLoss')}
              >
                <div className="flex items-center justify-end gap-1">
                  Stop Loss
                  <SortIndicator field="stopLoss" activeField={sortField} ascending={sortAscending} />
                </div>
              </th>
              <th 
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-200"
                onClick={() => handleSort('riskRewardRatio')}
              >
                <div className="flex items-center justify-end gap-1">
                  R : R
                  <SortIndicator field="riskRewardRatio" activeField={sortField} ascending={sortAscending} />
                </div>
              </th>
              <th className="px-4 py-3">Core Catalyst / Option Target</th>
              <th className="px-3 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-[#0B0F17]">
            {filteredAndSortedSignals.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-sm text-slate-500">
                  No trade setups match the current filters.
                </td>
              </tr>
            ) : (
              filteredAndSortedSignals.map((item) => {
                const isSelected = selectedTicker?.toUpperCase() === item.ticker.toUpperCase();
                const hyd = hydrationCache?.[item.ticker.toUpperCase()];
                const isHydrating = hyd && (hyd.status === 'pending' || hyd.status === 'hydrating');
                const hydFailed = hyd && hyd.status === 'failed';
                const livePrice = (hyd?.quote?.currentPrice ?? 0) > 0 ? hyd!.quote!.currentPrice : item.currentPrice;

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`group cursor-pointer transition-colors hover:bg-[#151D2F] ${
                      isSelected ? 'bg-cyan-950/20 border-l-2 border-l-cyan-400' : ''
                    }`}
                  >
                    {/* Ticker & Company */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold tracking-tight text-slate-100">
                          {item.ticker}
                        </span>
                        <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-slate-400">
                          {item.setupTier}
                        </span>
                      </div>
                      <div className="max-w-[140px] truncate text-[11px] text-slate-400">
                        {item.companyName}
                      </div>
                    </td>

                    {/* Conviction Score */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {renderConvictionScore(item.convictionScore)}
                    </td>

                    {/* Market Bias */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {renderBiasBadge(item.bias)}
                    </td>

                    {/* Current Price */}
                    <td className="px-3 py-3 text-right font-mono text-xs font-medium tabular-nums text-slate-100">
                      {isHydrating ? (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] justify-end">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Loading…</span>
                        </span>
                      ) : hydFailed && livePrice === 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-400/80 text-[10px]" title={hyd?.error}>
                          <AlertTriangle className="h-3 w-3" />
                          Offline
                        </span>
                      ) : (
                        `$${livePrice.toFixed(2)}`
                      )}
                    </td>

                    {/* Entry Price */}
                    <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-slate-300">
                      ${item.entryPrice.toFixed(2)}
                    </td>

                    {/* Target Price */}
                    <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-emerald-400">
                      ${item.targetPrice.toFixed(2)}
                    </td>

                    {/* Stop Loss */}
                    <td className="px-3 py-3 text-right font-mono text-xs tabular-nums text-rose-400">
                      ${item.stopLoss.toFixed(2)}
                    </td>

                    {/* Risk-Reward Ratio */}
                    <td className="px-3 py-3 text-right font-mono text-xs font-semibold tabular-nums text-slate-100">
                      <span className={item.riskRewardRatio >= 2.0 ? 'text-emerald-400' : 'text-slate-300'}>
                        1:{item.riskRewardRatio.toFixed(1)}
                      </span>
                    </td>

                    {/* Catalyst / Options */}
                    <td className="px-4 py-3">
                      <div className="max-w-[280px] truncate text-xs text-slate-300">
                        {item.primaryCatalyst}
                      </div>
                      {item.optionsStrategy && (
                        <div className="text-[10px] text-cyan-400 font-mono">
                          {item.optionsStrategy}
                        </div>
                      )}
                    </td>

                    {/* Inspect CTA */}
                    <td className="px-3 py-3 text-center">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(item);
                        }}
                        className="rounded p-1 text-slate-500 group-hover:bg-slate-800 group-hover:text-cyan-400"
                        title="Inspect Ticker"
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

      {/* Footer Meta */}
      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500">
        <span>Displaying {filteredAndSortedSignals.length} of {baseSignals.length} trade models</span>
        <span className="font-mono">Sort: {sortField} ({sortAscending ? 'ASC' : 'DESC'})</span>
      </div>
    </div>
  );
};

// Sort Direction Indicator Sub-component
const SortIndicator: React.FC<{ 
  field: SortableField; 
  activeField: SortableField; 
  ascending: boolean 
}> = ({ field, activeField, ascending }) => {
  if (field !== activeField) {
    return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" />;
  }
  return ascending 
    ? <ArrowUp className="h-3 w-3 text-cyan-400" /> 
    : <ArrowDown className="h-3 w-3 text-cyan-400" />;
};

export default DecisionMatrix;
