import { useMemo } from 'react';
import {
  TickerMeta,
  OptionOpportunity,
  MultiLegSpread,
  VolatilitySkewData,
  FundamentalHealthData,
  FilterState,
} from '../types/options';
import { generateMultiLegSpreads, generateVolatilitySkew } from '../utils/optionsMultiLeg';
import { generateFundamentalHealthData } from '../utils/fundamentalSolvency';

export interface UseFilteredOpportunitiesProps {
  universeTickers: TickerMeta[];
  allUniverseOpportunities: OptionOpportunity[];
  currentWatchlistSymbols: string[];
  showWatchlistOnly: boolean;
  filters: FilterState;
}

export interface UseFilteredOpportunitiesResult {
  weeklyCadenceCounts: { all: number; weekly: number; monthly: number };
  highIvrCount: number;
  earningsAlertCount: number;
  filteredTickers: TickerMeta[];
  filteredOpportunities: OptionOpportunity[];
  multiLegSpreads: MultiLegSpread[];
  volatilitySkewData: VolatilitySkewData[];
  fundamentalHealthData: FundamentalHealthData[];
}

export function useFilteredOpportunities({
  universeTickers,
  allUniverseOpportunities,
  currentWatchlistSymbols,
  showWatchlistOnly,
  filters,
}: UseFilteredOpportunitiesProps): UseFilteredOpportunitiesResult {
  // Derived counts for tabs
  const weeklyCadenceCounts = useMemo(() => {
    let weekly = 0;
    let monthly = 0;
    universeTickers.forEach((t) => {
      if (t.has_weeklys === false) monthly++;
      else weekly++;
    });
    return { all: universeTickers.length, weekly, monthly };
  }, [universeTickers]);

  const highIvrCount = useMemo(() => {
    return universeTickers.filter((t) => t.iv_rank >= 45).length;
  }, [universeTickers]);

  const earningsAlertCount = useMemo(() => {
    return universeTickers.filter((t) => t.earnings_within_7d).length;
  }, [universeTickers]);

  // Filtered Tickers (for Tree 1 & Cadence views)
  const filteredTickers = useMemo(() => {
    return universeTickers.filter((t) => {
      if (showWatchlistOnly && !currentWatchlistSymbols.includes(t.symbol)) {
        return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesSymbol = t.symbol.toLowerCase().includes(q);
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesSector = t.sector.toLowerCase().includes(q);
        if (!matchesSymbol && !matchesName && !matchesSector) return false;
      }

      if (filters.onlyHighIvr && t.iv_rank < 45) return false;
      if (filters.onlyOversold && (t.rsi_14 ?? 50) >= 35) return false;
      if (filters.onlyNearSupport && t.spot_price > (t.lower_bb ?? 0) * 1.02) return false;
      if (filters.onlyEarningsAlert && !t.earnings_within_7d) return false;

      if (filters.weeklyCadence === 'WEEKLY_ONLY' && t.has_weeklys === false) return false;
      if (filters.weeklyCadence === 'MONTHLY_ONLY' && t.has_weeklys !== false) return false;

      if (filters.liquidityTier && filters.liquidityTier !== 'ALL') {
        if (!t.liquidity_tier.includes(filters.liquidityTier)) return false;
      }

      return true;
    });
  }, [
    universeTickers,
    currentWatchlistSymbols,
    showWatchlistOnly,
    filters,
  ]);

  // Filtered Opportunities (for Tree 2 Options Screener)
  const filteredOpportunities = useMemo(() => {
    return allUniverseOpportunities.filter((o) => {
      if (showWatchlistOnly && !currentWatchlistSymbols.includes(o.symbol)) {
        return false;
      }

      if (filters.strategy && filters.strategy !== 'ALL') {
        if (o.strategy !== filters.strategy) return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!o.symbol.toLowerCase().includes(q) && !o.name.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (filters.weeklyCadence === 'WEEKLY_ONLY') {
        const tMeta = universeTickers.find((t) => t.symbol === o.symbol);
        if (tMeta && tMeta.has_weeklys === false) return false;
      }
      if (filters.weeklyCadence === 'MONTHLY_ONLY') {
        const tMeta = universeTickers.find((t) => t.symbol === o.symbol);
        if (tMeta && tMeta.has_weeklys !== false) return false;
      }

      if (filters.onlyHighIvr && o.iv_rank < 45) return false;
      if (filters.onlyEarningsAlert && !o.earnings_within_7d) return false;

      if (filters.liquidityTier && filters.liquidityTier !== 'ALL') {
        if (!o.liquidity_tier?.includes(filters.liquidityTier)) return false;
      }

      return true;
    });
  }, [
    allUniverseOpportunities,
    currentWatchlistSymbols,
    showWatchlistOnly,
    filters,
    universeTickers,
  ]);

  // Synthesized Multi-Leg Spreads
  const multiLegSpreads = useMemo(() => {
    return generateMultiLegSpreads(filteredTickers, allUniverseOpportunities);
  }, [filteredTickers, allUniverseOpportunities]);

  const volatilitySkewData = useMemo(() => {
    return generateVolatilitySkew(filteredTickers);
  }, [filteredTickers]);

  const fundamentalHealthData = useMemo(() => {
    return generateFundamentalHealthData(filteredTickers);
  }, [filteredTickers]);

  return {
    weeklyCadenceCounts,
    highIvrCount,
    earningsAlertCount,
    filteredTickers,
    filteredOpportunities,
    multiLegSpreads,
    volatilitySkewData,
    fundamentalHealthData,
  };
}
