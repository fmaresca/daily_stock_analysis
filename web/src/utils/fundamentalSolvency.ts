/**
 * Fundamental Health, Solvency, SEC EDGAR Filings & CEF Analytics Engine
 */

import { TickerMeta, FundamentalHealthData } from '../types/options';

export function generateFundamentalHealthData(tickers: TickerMeta[]): FundamentalHealthData[] {
  return tickers.map((ticker) => {
    const sym = ticker.symbol;
    const spot = ticker.spot_price;
    const isETF = ticker.sector.includes('ETF') || ['SPY', 'QQQ', 'IWM', 'SCHD', 'JEPI', 'SPCX'].includes(sym);

    // Default institutional holders
    const defaultHolders = ['Vanguard Group', 'BlackRock', 'State Street', 'Geode Capital', 'FMR LLC'];

    // Specific metrics curated for universe
    if (sym === 'NVDA') {
      return {
        symbol: sym,
        name: ticker.name,
        sector: ticker.sector,
        spot_price: spot,
        market_cap: '$3.15T',
        pe_ratio: 46.2,
        forward_pe: 28.5,
        ev_ebitda: 38.1,
        revenue_growth_yoy: 122.4,
        operating_margin: 62.1,
        free_cash_flow: '$53.8B',
        altman_z_score: 22.4,
        altman_zone: 'SAFE',
        piotroski_f_score: 8,
        piotroski_tier: 'STRONG',
        debt_to_equity: 0.18,
        current_ratio: 3.52,
        interest_coverage: 142.0,
        latest_10k_date: '2026-02-26',
        latest_10q_date: '2026-05-28',
        sec_edgar_url: `https://www.sec.gov/edgar/browse/?CIK=0001045810`,
        institutional_ownership_pct: 68.4,
        top_institutions: defaultHolders,
      };
    }

    if (sym === 'AAPL') {
      return {
        symbol: sym,
        name: ticker.name,
        sector: ticker.sector,
        spot_price: spot,
        market_cap: '$3.42T',
        pe_ratio: 32.1,
        forward_pe: 26.4,
        ev_ebitda: 23.4,
        revenue_growth_yoy: 6.1,
        operating_margin: 31.3,
        free_cash_flow: '$108.8B',
        altman_z_score: 8.9,
        altman_zone: 'SAFE',
        piotroski_f_score: 7,
        piotroski_tier: 'STRONG',
        debt_to_equity: 1.45,
        current_ratio: 1.04,
        interest_coverage: 36.2,
        latest_10k_date: '2025-11-01',
        latest_10q_date: '2026-05-03',
        sec_edgar_url: `https://www.sec.gov/edgar/browse/?CIK=0000320193`,
        institutional_ownership_pct: 61.2,
        top_institutions: ['Berkshire Hathaway', ...defaultHolders.slice(0, 4)],
      };
    }

    if (sym === 'MSFT') {
      return {
        symbol: sym,
        name: ticker.name,
        sector: ticker.sector,
        spot_price: spot,
        market_cap: '$3.08T',
        pe_ratio: 33.4,
        forward_pe: 27.8,
        ev_ebitda: 21.2,
        revenue_growth_yoy: 15.3,
        operating_margin: 44.6,
        free_cash_flow: '$74.1B',
        altman_z_score: 9.6,
        altman_zone: 'SAFE',
        piotroski_f_score: 8,
        piotroski_tier: 'STRONG',
        debt_to_equity: 0.42,
        current_ratio: 1.25,
        interest_coverage: 48.5,
        latest_10k_date: '2025-08-01',
        latest_10q_date: '2026-04-26',
        sec_edgar_url: `https://www.sec.gov/edgar/browse/?CIK=0000789019`,
        institutional_ownership_pct: 73.1,
        top_institutions: defaultHolders,
      };
    }

    if (sym === 'PLTR') {
      return {
        symbol: sym,
        name: ticker.name,
        sector: ticker.sector,
        spot_price: spot,
        market_cap: '$140.2B',
        pe_ratio: 84.5,
        forward_pe: 52.0,
        ev_ebitda: 62.3,
        revenue_growth_yoy: 30.2,
        operating_margin: 21.4,
        free_cash_flow: '$1.1B',
        altman_z_score: 14.8,
        altman_zone: 'SAFE',
        piotroski_f_score: 7,
        piotroski_tier: 'STRONG',
        debt_to_equity: 0.05,
        current_ratio: 5.12,
        interest_coverage: 95.0,
        latest_10k_date: '2026-02-21',
        latest_10q_date: '2026-05-08',
        sec_edgar_url: `https://www.sec.gov/edgar/browse/?CIK=0001321655`,
        institutional_ownership_pct: 44.5,
        top_institutions: defaultHolders,
      };
    }

    // CEF / Income Fund specific: JEPI
    if (sym === 'JEPI') {
      return {
        symbol: sym,
        name: ticker.name,
        sector: ticker.sector,
        spot_price: spot,
        market_cap: '$36.2B',
        pe_ratio: null,
        forward_pe: null,
        ev_ebitda: null,
        revenue_growth_yoy: 0,
        operating_margin: 0,
        free_cash_flow: 'N/A',
        altman_z_score: 4.5,
        altman_zone: 'SAFE',
        piotroski_f_score: 6,
        piotroski_tier: 'MODERATE',
        debt_to_equity: 0,
        current_ratio: 1.0,
        interest_coverage: 99.0,
        latest_10k_date: '2026-01-15',
        latest_10q_date: '2026-04-18',
        sec_edgar_url: `https://www.sec.gov/edgar/browse/?CIK=0001799292`,
        institutional_ownership_pct: 28.5,
        top_institutions: defaultHolders,
        is_fund_or_cef: true,
        nav_price: Math.round((spot * 0.998) * 100) / 100,
        nav_discount_premium_pct: 0.2, // Trading at 0.2% premium to NAV
        cef_z_score_52w: 0.35,
        distribution_yield_pct: 7.42,
        roc_pct: 0,
        roc_type: 'NONE', // Pure ELN options premium and dividend income
      };
    }

    // Generic calculation for remaining equities and ETFs
    const isDistress = sym === 'BLZE' || sym === 'AXTI';
    const altman = isETF ? 5.2 : isDistress ? 1.62 : Math.round((3.2 + (sym.charCodeAt(0) % 5)) * 10) / 10;
    const fScore = isETF ? 6 : isDistress ? 3 : 6 + (sym.charCodeAt(0) % 3);

    return {
      symbol: sym,
      name: ticker.name,
      sector: ticker.sector,
      spot_price: spot,
      market_cap: isETF ? '$50B–$500B' : '$5B–$80B',
      pe_ratio: isETF ? null : Math.round((22 + (sym.charCodeAt(0) % 18)) * 10) / 10,
      forward_pe: isETF ? null : Math.round((18 + (sym.charCodeAt(0) % 12)) * 10) / 10,
      ev_ebitda: isETF ? null : 16.5,
      revenue_growth_yoy: isETF ? 0 : 12.5,
      operating_margin: isETF ? 0 : 24.2,
      free_cash_flow: isETF ? 'N/A' : '$850M',
      altman_z_score: altman,
      altman_zone: altman > 2.99 ? 'SAFE' : altman >= 1.81 ? 'GREY' : 'DISTRESS',
      piotroski_f_score: fScore,
      piotroski_tier: fScore >= 7 ? 'STRONG' : fScore >= 4 ? 'MODERATE' : 'WEAK',
      debt_to_equity: 0.45,
      current_ratio: 2.1,
      interest_coverage: 18.5,
      latest_10k_date: '2026-02-15',
      latest_10q_date: '2026-05-10',
      sec_edgar_url: `https://www.sec.gov/edgar/searchedgar/companysearch`,
      institutional_ownership_pct: isETF ? 55.0 : 62.4,
      top_institutions: defaultHolders,
      is_fund_or_cef: isETF,
      nav_price: isETF ? Math.round((spot * 0.999) * 100) / 100 : undefined,
      nav_discount_premium_pct: isETF ? 0.05 : undefined,
      cef_z_score_52w: isETF ? 0.1 : undefined,
      distribution_yield_pct: isETF ? (sym === 'SCHD' ? 3.45 : 1.5) : undefined,
      roc_pct: isETF ? 0 : undefined,
      roc_type: isETF ? 'NONE' : undefined,
    };
  });
}
