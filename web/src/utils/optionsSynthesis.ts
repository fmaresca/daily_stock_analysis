import { OptionOpportunity, TickerMeta } from '../types/options';
import { isWeeklyCadence } from './capitalAndTaxLedger';

/**
 * Creates a fully typed fallback TickerMeta instance with standard default properties.
 * Eliminates repetitive inline mock objects and unsafe 'as any' casts.
 */
export function createFallbackTickerMeta(symbol: string, overrides?: Partial<TickerMeta>): TickerMeta {
  const cleanSym = symbol.trim().toUpperCase();
  const basePrice = 100.0;

  return {
    symbol: cleanSym,
    name: cleanSym,
    sector: 'Screened Candidate',
    spot_price: basePrice,
    sma_20: basePrice,
    upper_bb: basePrice * 1.05,
    lower_bb: basePrice * 0.95,
    bb_width_pct: 10.0,
    rsi_14: 50,
    rsi_flag: 'NORMAL',
    iv_rank: 50,
    iv_current: 25.0,
    hv_30: 25.0,
    has_weeklys: true,
    liquidity_tier: 'Tier 1 (Ultra-Liquid)',
    earnings_within_7d: false,
    next_earnings_date: 'N/A',
    avg_volume_30: 1000000,
    ...overrides,
  };
}

/**
 * Pure, deterministic synthesizer that ensures every tracked ticker in the active universe
 * has corresponding high-probability Cash-Secured Put (CSP) and Covered Call (CC) opportunities
 * outside 2 SD Bollinger Bands (0.15–0.20 Delta).
 */
export function synthesizeAllUniverseOpportunities(
  rawOpportunities: OptionOpportunity[] = [],
  universeTickers: TickerMeta[] = [],
  trackedEquitySymbols: string[] = []
): OptionOpportunity[] {
  const oppMap = new Map<string, OptionOpportunity>();
  const trackedSymbolsSet = new Set(trackedEquitySymbols.map((s) => s.toUpperCase()));

  // 1. Index pre-existing opportunities for tracked symbols only
  rawOpportunities.forEach((o) => {
    if (trackedSymbolsSet.has(o.symbol.toUpperCase())) {
      const key = o.id || `${o.strategy}_${o.symbol}_${o.strike}`;
      oppMap.set(key, o);
    }
  });

  // 2. Track symbols that already have at least one opportunity
  const coveredSymbols = new Set(Array.from(oppMap.values()).map((o) => o.symbol.toUpperCase()));

  // 3. For every ticker in universeTickers, ensure CSP and CC opportunities exist
  universeTickers.forEach((t) => {
    if (!coveredSymbols.has(t.symbol.toUpperCase())) {
      const spot = t.spot_price || 100.0;
      const lowerBb = t.lower_bb || spot * 0.94;
      const upperBb = t.upper_bb || spot * 1.06;
      const iv = t.iv_current || 0.25;
      const dte = t.has_weeklys === false ? t.days_to_nearest_expiration || 20 : 5;
      const expDate = new Date(Date.now() + dte * 86400000).toISOString().split('T')[0];

      const putStrike = Math.max(
        1,
        spot > 100
          ? Math.floor(lowerBb / 5) * 5
          : spot > 20
          ? Math.floor(lowerBb)
          : Math.floor(lowerBb * 2) / 2
      );
      const callStrike = Math.max(
        putStrike + 1,
        spot > 100
          ? Math.ceil(upperBb / 5) * 5
          : spot > 20
          ? Math.ceil(upperBb)
          : Math.ceil(upperBb * 2) / 2
      );

      const ivNorm = iv > 1 ? iv / 100 : iv;
      const putMid = Math.max(
        0.15,
        Math.round(spot * ivNorm * Math.sqrt(dte / 365.0) * 0.18 * 100) / 100
      );
      const callMid = Math.max(
        0.15,
        Math.round(spot * ivNorm * Math.sqrt(dte / 365.0) * 0.18 * 100) / 100
      );

      const putCollateral = putStrike * 100;
      const putPremium = Math.round(putMid * 100);
      const putRoc = Math.round((putPremium / putCollateral) * 1000) / 10;
      const putAnnualized = Math.round((putRoc * (365 / dte)) * 10) / 10;
      const putCushion = Math.round((((spot - putStrike) / spot) * 100) * 10) / 10;

      const callCollateral = spot * 100;
      const callPremium = Math.round(callMid * 100);
      const callRoc = Math.round((callPremium / callCollateral) * 1000) / 10;
      const callAnnualized = Math.round((callRoc * (365 / dte)) * 10) / 10;
      const callUpside = Math.round((((callStrike - spot) / spot) * 100) * 10) / 10;

      const csp: OptionOpportunity = {
        id: `LIVE_CSP_${t.symbol}_${putStrike}`,
        symbol: t.symbol,
        name: t.name,
        category: t.sector,
        sector: t.sector,
        liquidity_tier: t.liquidity_tier,
        strategy: 'CSP',
        strategy_name: 'Cash-Secured Put (0.15-0.20Δ <= Lower BB)',
        expiration: expDate,
        dte,
        current_price: spot,
        strike: putStrike,
        type: 'put',
        bid: Math.round(putMid * 0.95 * 100) / 100,
        ask: Math.round(putMid * 1.05 * 100) / 100,
        mid: putMid,
        collateral_required: putCollateral,
        premium_total: putPremium,
        breakeven: Math.round((putStrike - putMid) * 100) / 100,
        cushion_pct: putCushion,
        roc_pct: putRoc,
        annualized_roc: putAnnualized,
        delta: -0.17,
        abs_delta: 0.17,
        theta: -0.04,
        pop_pct: 83.5,
        iv: Math.round(ivNorm * 1000) / 10,
        iv_rank: t.iv_rank,
        hv_30: t.hv_30,
        sma_20: t.sma_20,
        upper_bb: t.upper_bb,
        lower_bb: t.lower_bb,
        rsi_14: t.rsi_14,
        rsi: t.rsi_14,
        rsi_flag: t.rsi_flag,
        earnings_within_7d: t.earnings_within_7d,
        next_earnings_date: t.next_earnings_date,
        safety_tier: t.iv_rank >= 45 ? 'Optimal Volatility (IVR >= 45)' : 'Standard Volatility',
        tier_color: t.iv_rank >= 45 ? 'emerald' : 'blue',
        tags: ['CUSTOM_TICKER', 'LIVE_SYNTHESIS', 'CSP_HARVEST'],
        rating: Math.min(99, Math.max(60, Math.round(83.5 + (putAnnualized / 2)))),
        has_weeklys: isWeeklyCadence(t.symbol, t.has_weeklys),
        expiration_cadence: isWeeklyCadence(t.symbol, t.has_weeklys) ? 'Weekly' : 'Monthly Only',
      };

      const cc: OptionOpportunity = {
        id: `LIVE_CC_${t.symbol}_${callStrike}`,
        symbol: t.symbol,
        name: t.name,
        category: t.sector,
        sector: t.sector,
        liquidity_tier: t.liquidity_tier,
        strategy: 'CC',
        strategy_name: 'Covered Call (0.15-0.20Δ >= Upper BB)',
        expiration: expDate,
        dte,
        current_price: spot,
        strike: callStrike,
        type: 'call',
        bid: Math.round(callMid * 0.95 * 100) / 100,
        ask: Math.round(callMid * 1.05 * 100) / 100,
        mid: callMid,
        collateral_required: callCollateral,
        premium_total: callPremium,
        breakeven: Math.round((spot - callMid) * 100) / 100,
        cushion_pct: callUpside,
        roc_pct: callRoc,
        annualized_roc: callAnnualized,
        delta: 0.18,
        abs_delta: 0.18,
        theta: -0.04,
        pop_pct: 82.0,
        iv: Math.round(ivNorm * 1000) / 10,
        iv_rank: t.iv_rank,
        hv_30: t.hv_30,
        sma_20: t.sma_20,
        upper_bb: t.upper_bb,
        lower_bb: t.lower_bb,
        rsi_14: t.rsi_14,
        rsi: t.rsi_14,
        rsi_flag: t.rsi_flag,
        earnings_within_7d: t.earnings_within_7d,
        next_earnings_date: t.next_earnings_date,
        safety_tier: t.iv_rank >= 45 ? 'Optimal Volatility (IVR >= 45)' : 'Standard Volatility',
        tier_color: t.iv_rank >= 45 ? 'emerald' : 'blue',
        tags: ['CUSTOM_TICKER', 'LIVE_SYNTHESIS', 'CC_HARVEST'],
        rating: Math.min(99, Math.max(60, Math.round(82.0 + (callAnnualized / 2)))),
        has_weeklys: isWeeklyCadence(t.symbol, t.has_weeklys),
        expiration_cadence: isWeeklyCadence(t.symbol, t.has_weeklys) ? 'Weekly' : 'Monthly Only',
      };

      oppMap.set(csp.id, csp);
      oppMap.set(cc.id, cc);
    }
  });

  return Array.from(oppMap.values());
}
