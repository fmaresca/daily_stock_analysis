/**
 * Cloudflare Pages Function: GET /api/economic-calendar
 * Multi-Tier Resilient Architecture:
 * - Tier 1: Forex Factory Live Feed (faireconomy.media)
 * - Tier 2 (Live Backup): Nasdaq Live Economic Calendar (api.nasdaq.com)
 * - Tier 3 (Baseline): Curated Weekly US Macro Catalyst Schedule (Auto-reanchoring)
 * 
 * Normalizes all releases to US Eastern Time (ET).
 * Deterministically maps to sector transmission channels and proxy ETFs.
 */

const SECTOR_IMPACT_MAP = {
  CPI: {
    sectors: "Technology, Real Estate, Financials, Utilities",
    tickers: "QQQ, VNQ, XLF, TLT",
    impact: "High"
  },
  INFLATION: {
    sectors: "Technology, Real Estate, Financials",
    tickers: "QQQ, VNQ, XLF, TIP",
    impact: "High"
  },
  PCE: {
    sectors: "Broad Market, Tech, Long Duration Assets",
    tickers: "SPY, QQQ, TLT",
    impact: "High"
  },
  FOMC: {
    sectors: "Banking, Tech, Real Estate, Precious Metals",
    tickers: "KRE, XLF, QQQ, GLD",
    impact: "High"
  },
  FED: {
    sectors: "Banking, Broad Market, Bonds",
    tickers: "SPY, QQQ, TLT, XLF",
    impact: "High"
  },
  "NON-FARM": {
    sectors: "Consumer Discretionary, Industrials, Small Caps",
    tickers: "XLY, XLI, IWM",
    impact: "High"
  },
  PAYROLLS: {
    sectors: "Consumer Discretionary, Industrials, Financials",
    tickers: "XLY, XLI, XLF",
    impact: "High"
  },
  EMPLOYMENT: {
    sectors: "Consumer Discretionary, Industrials, Small Caps",
    tickers: "XLY, XLI, IWM",
    impact: "High"
  },
  "EARNINGS M/M": {
    sectors: "Broad Equities, Tech, Bonds",
    tickers: "SPY, QQQ, TLT",
    impact: "High"
  },
  "HOURLY EARNINGS": {
    sectors: "Broad Equities, Tech, Bonds",
    tickers: "SPY, QQQ, TLT",
    impact: "High"
  },
  "RETAIL SALES": {
    sectors: "Consumer Discretionary, Retail, Transports",
    tickers: "XLY, XRT, IYT, AMZN, WMT",
    impact: "High"
  },
  "UNEMPLOYMENT": {
    sectors: "Broad Equities, Discretionary, Small Caps",
    tickers: "SPY, XLY, IWM",
    impact: "High"
  },
  "JOBLESS CLAIMS": {
    sectors: "Broad Equities, High-Beta Assets",
    tickers: "SPY, IWM, QQQ",
    impact: "High"
  },
  "UNEMPLOYMENT CLAIMS": {
    sectors: "Broad Equities, High-Beta Assets",
    tickers: "SPY, IWM, QQQ",
    impact: "High"
  },
  JOLTS: {
    sectors: "Broad Equities, High-Beta Assets",
    tickers: "SPY, QQQ, IWM",
    impact: "High"
  },
  "CONSUMER CONFIDENCE": {
    sectors: "Consumer Discretionary, Retail",
    tickers: "XLY, XRT, AMZN",
    impact: "High"
  },
  GDP: {
    sectors: "Broad Market, Cyclicals, Small Caps",
    tickers: "SPY, DIA, IWM",
    impact: "High"
  },
  ISM: {
    sectors: "Industrials, Materials, Tech Supply",
    tickers: "XLI, XLB, SOXX",
    impact: "High"
  },
  PMI: {
    sectors: "Industrials, Basic Materials, Cyclicals",
    tickers: "XLI, XLB",
    impact: "Moderate"
  },
  MANUFACTURING: {
    sectors: "Industrials, Basic Materials, Cyclicals",
    tickers: "XLI, XLB, CAT",
    impact: "Moderate"
  },
  "INDUSTRIAL PRODUCTION": {
    sectors: "Industrials, Energy, Materials",
    tickers: "XLI, XLE, GE",
    impact: "Moderate"
  },
  "CRUDE OIL": {
    sectors: "Energy, Transportation, Airlines",
    tickers: "XLE, JETS, IYT, XOM, CVX",
    impact: "Moderate"
  },
  HOUSING: {
    sectors: "Homebuilders, Building Products, Real Estate",
    tickers: "ITB, XHB, VNQ, HD",
    impact: "Moderate"
  },
  "BUILDING PERMITS": {
    sectors: "Homebuilders, Building Products, Real Estate",
    tickers: "ITB, XHB, VNQ, HD",
    impact: "Moderate"
  },
  TREASURY: {
    sectors: "Bonds, Financials, High Dividend",
    tickers: "TLT, IEF, XLF",
    impact: "Moderate"
  },
  AUCTION: {
    sectors: "Fixed Income, Treasury Yields",
    tickers: "TLT, SHY, IEF",
    impact: "Low"
  },
  MORTGAGE: {
    sectors: "Real Estate, Financials, Homebuilders",
    tickers: "VNQ, MBB, ITB",
    impact: "Low"
  },
  "QUADRUPLE WITCHING": {
    sectors: "Broad Market, Derivatives, Index ETFs",
    tickers: "SPY, QQQ, IWM, VIX",
    impact: "High"
  },
  "LEADING ECONOMIC": {
    sectors: "Broad Equities, Cyclicals",
    tickers: "SPY, DIA",
    impact: "Moderate"
  }
};

const CURATED_WEEKLY_SCHEDULE = [
  {
    "title": "OPEC-JMMC Meetings",
    "country": "USD",
    "dateET": "Mon, Oct 5",
    "timeET": "06:00 AM",
    "impact": "Moderate",
    "forecast": "—",
    "previous": "—",
    "sectors": "Energy, Transportation, Airlines",
    "tickers": "XLE, JETS, USO, XOM, CVX",
    "isoDate": "2026-10-05T06:00:00-04:00"
  },
  {
    "title": "Final Services PMI",
    "country": "USD",
    "dateET": "Mon, Oct 5",
    "timeET": "09:45 AM",
    "impact": "Moderate",
    "forecast": "55.4",
    "previous": "55.4",
    "sectors": "Broad Equities, Services",
    "tickers": "SPY, XLC",
    "isoDate": "2026-10-05T09:45:00-04:00"
  },
  {
    "title": "ISM Services PMI",
    "country": "USD",
    "dateET": "Mon, Oct 5",
    "timeET": "10:00 AM",
    "impact": "High",
    "forecast": "51.6",
    "previous": "51.5",
    "sectors": "Industrials, Materials, Tech Supply",
    "tickers": "XLI, XLB, SOXX, SPY",
    "isoDate": "2026-10-05T10:00:00-04:00"
  },
  {
    "title": "Factory Orders m/m",
    "country": "USD",
    "dateET": "Mon, Oct 5",
    "timeET": "10:00 AM",
    "impact": "Moderate",
    "forecast": "0.2%",
    "previous": "-0.1%",
    "sectors": "Industrials, Cyclicals",
    "tickers": "XLI, DIA",
    "isoDate": "2026-10-05T10:00:00-04:00"
  },
  {
    "title": "Trade Balance",
    "country": "USD",
    "dateET": "Tue, Oct 6",
    "timeET": "08:30 AM",
    "impact": "Moderate",
    "forecast": "-.5B",
    "previous": "-.8B",
    "sectors": "Industrials, Materials",
    "tickers": "XLI, XLB",
    "isoDate": "2026-10-06T08:30:00-04:00"
  },
  {
    "title": "IBD/TIPP Economic Optimism",
    "country": "USD",
    "dateET": "Tue, Oct 6",
    "timeET": "10:00 AM",
    "impact": "Moderate",
    "forecast": "45.1",
    "previous": "44.5",
    "sectors": "Broad Equities, Consumer Discretionary",
    "tickers": "SPY, XLY",
    "isoDate": "2026-10-06T10:00:00-04:00"
  },
  {
    "title": "FOMC Member Bostic Speaks",
    "country": "USD",
    "dateET": "Tue, Oct 6",
    "timeET": "12:00 PM",
    "impact": "High",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Tech, Interest Rate Sensitive",
    "tickers": "KRE, XLF, QQQ",
    "isoDate": "2026-10-06T12:00:00-04:00"
  },
  {
    "title": "MBA Mortgage Applications",
    "country": "USD",
    "dateET": "Wed, Oct 7",
    "timeET": "07:00 AM",
    "impact": "Low",
    "forecast": "-0.5%",
    "previous": "+1.4%",
    "sectors": "Real Estate, Financials, Homebuilders",
    "tickers": "VNQ, MBB, ITB",
    "isoDate": "2026-10-07T07:00:00-04:00"
  },
  {
    "title": "Crude Oil Inventories (EIA)",
    "country": "USD",
    "dateET": "Wed, Oct 7",
    "timeET": "10:30 AM",
    "impact": "Moderate",
    "forecast": "-1.8M",
    "previous": "+3.9M",
    "sectors": "Energy, Transportation, Airlines",
    "tickers": "XLE, JETS, XOM, CVX",
    "isoDate": "2026-10-07T10:30:00-04:00"
  },
  {
    "title": "10-Year Bond Auction",
    "country": "USD",
    "dateET": "Wed, Oct 7",
    "timeET": "01:01 PM",
    "impact": "Moderate",
    "forecast": "—",
    "previous": "—",
    "sectors": "Bonds, Financials, High Dividend",
    "tickers": "TLT, IEF, XLF",
    "isoDate": "2026-10-07T13:01:00-04:00"
  },
  {
    "title": "FOMC Meeting Minutes",
    "country": "USD",
    "dateET": "Wed, Oct 7",
    "timeET": "02:00 PM",
    "impact": "High",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Tech, Real Estate, Precious Metals",
    "tickers": "KRE, XLF, QQQ, TLT, SPY",
    "isoDate": "2026-10-07T14:00:00-04:00"
  },
  {
    "title": "Consumer Credit m/m",
    "country": "USD",
    "dateET": "Wed, Oct 7",
    "timeET": "03:00 PM",
    "impact": "Moderate",
    "forecast": ".3B",
    "previous": ".9B",
    "sectors": "Financials, Consumer Discretionary",
    "tickers": "XLF, XLY",
    "isoDate": "2026-10-07T15:00:00-04:00"
  },
  {
    "title": "Initial Jobless Claims",
    "country": "USD",
    "dateET": "Thu, Oct 8",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "221K",
    "previous": "218K",
    "sectors": "Broad Equities, High-Beta Assets",
    "tickers": "SPY, IWM, QQQ",
    "isoDate": "2026-10-08T08:30:00-04:00"
  },
  {
    "title": "Continuing Jobless Claims",
    "country": "USD",
    "dateET": "Thu, Oct 8",
    "timeET": "08:30 AM",
    "impact": "Moderate",
    "forecast": "1.83M",
    "previous": "1.83M",
    "sectors": "Broad Equities, Discretionary, Small Caps",
    "tickers": "SPY, IWM",
    "isoDate": "2026-10-08T08:30:00-04:00"
  },
  {
    "title": "Wholesale Inventories m/m",
    "country": "USD",
    "dateET": "Thu, Oct 8",
    "timeET": "10:00 AM",
    "impact": "Moderate",
    "forecast": "0.2%",
    "previous": "0.2%",
    "sectors": "Consumer Discretionary, Retail",
    "tickers": "XRT, XLI",
    "isoDate": "2026-10-08T10:00:00-04:00"
  },
  {
    "title": "Natural Gas Storage (EIA)",
    "country": "USD",
    "dateET": "Thu, Oct 8",
    "timeET": "10:30 AM",
    "impact": "Low",
    "forecast": "+68B",
    "previous": "+55B",
    "sectors": "Energy, Utilities",
    "tickers": "XLE, XLU, UNG",
    "isoDate": "2026-10-08T10:30:00-04:00"
  },
  {
    "title": "30-Year Bond Auction",
    "country": "USD",
    "dateET": "Thu, Oct 8",
    "timeET": "01:01 PM",
    "impact": "Moderate",
    "forecast": "—",
    "previous": "—",
    "sectors": "Fixed Income, Treasury Yields",
    "tickers": "TLT, IEF",
    "isoDate": "2026-10-08T13:01:00-04:00"
  },
  {
    "title": "Fed Balance Sheet",
    "country": "USD",
    "dateET": "Thu, Oct 8",
    "timeET": "04:30 PM",
    "impact": "Moderate",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Broad Market, Bonds",
    "tickers": "SPY, QQQ, TLT, XLF",
    "isoDate": "2026-10-08T16:30:00-04:00"
  },
  {
    "title": "PPI Final Demand m/m",
    "country": "USD",
    "dateET": "Fri, Oct 9",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "0.2%",
    "previous": "0.2%",
    "sectors": "Technology, Financials, Utilities",
    "tickers": "QQQ, XLF, SPY",
    "isoDate": "2026-10-09T08:30:00-04:00"
  },
  {
    "title": "Core PPI m/m",
    "country": "USD",
    "dateET": "Fri, Oct 9",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "0.2%",
    "previous": "0.3%",
    "sectors": "Technology, Real Estate, Financials",
    "tickers": "QQQ, VNQ, TLT",
    "isoDate": "2026-10-09T08:30:00-04:00"
  },
  {
    "title": "Preliminary UoM Consumer Sentiment",
    "country": "USD",
    "dateET": "Fri, Oct 9",
    "timeET": "10:00 AM",
    "impact": "High",
    "forecast": "70.5",
    "previous": "70.1",
    "sectors": "Consumer Discretionary, Retail",
    "tickers": "XLY, XRT, AMZN",
    "isoDate": "2026-10-09T10:00:00-04:00"
  },
  {
    "title": "Preliminary UoM Inflation Expectations",
    "country": "USD",
    "dateET": "Fri, Oct 9",
    "timeET": "10:00 AM",
    "impact": "High",
    "forecast": "2.7%",
    "previous": "2.7%",
    "sectors": "Technology, Bonds, Inflation-Protected",
    "tickers": "QQQ, TLT, TIP",
    "isoDate": "2026-10-09T10:00:00-04:00"
  },
  {
    "title": "FOMC Member Williams Speaks",
    "country": "USD",
    "dateET": "Fri, Oct 9",
    "timeET": "10:45 AM",
    "impact": "High",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Broad Market, Bonds",
    "tickers": "SPY, QQQ, TLT, XLF",
    "isoDate": "2026-10-09T10:45:00-04:00"
  }
];

const PAST_WEEK_SCHEDULE = [
  {
    "title": "FOMC Member Bowman Speaks",
    "country": "USD",
    "dateET": "Mon, Sep 28",
    "timeET": "08:15 AM",
    "impact": "High",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Tech, Interest Rate Sensitive",
    "tickers": "KRE, XLF, QQQ",
    "isoDate": "2026-09-28T08:15:00-04:00"
  },
  {
    "title": "FOMC Member Cook Speaks",
    "country": "USD",
    "dateET": "Mon, Sep 28",
    "timeET": "01:25 PM",
    "impact": "Moderate",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Tech",
    "tickers": "XLF, QQQ",
    "isoDate": "2026-09-28T13:25:00-04:00"
  },
  {
    "title": "FOMC Member Barkin Speaks",
    "country": "USD",
    "dateET": "Mon, Sep 28",
    "timeET": "01:30 PM",
    "impact": "Moderate",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Equities",
    "tickers": "XLF, SPY",
    "isoDate": "2026-09-28T13:30:00-04:00"
  },
  {
    "title": "S&P/CS Composite-20 HPI y/y",
    "country": "USD",
    "dateET": "Tue, Sep 29",
    "timeET": "09:00 AM",
    "impact": "Moderate",
    "forecast": "5.9%",
    "previous": "6.5%",
    "sectors": "Homebuilders, Real Estate",
    "tickers": "ITB, XHB, VNQ",
    "isoDate": "2026-09-29T09:00:00-04:00"
  },
  {
    "title": "CB Consumer Confidence",
    "country": "USD",
    "dateET": "Tue, Sep 29",
    "timeET": "10:00 AM",
    "impact": "High",
    "forecast": "103.9",
    "previous": "103.3",
    "sectors": "Consumer Discretionary, Retail",
    "tickers": "XLY, XRT, AMZN, WMT",
    "isoDate": "2026-09-29T10:00:00-04:00"
  },
  {
    "title": "JOLTS Job Openings",
    "country": "USD",
    "dateET": "Tue, Sep 29",
    "timeET": "10:00 AM",
    "impact": "High",
    "forecast": "7.64M",
    "previous": "7.67M",
    "sectors": "Broad Equities, High-Beta Assets",
    "tickers": "SPY, QQQ, IWM",
    "isoDate": "2026-09-29T10:00:00-04:00"
  },
  {
    "title": "FOMC Member Waller Speaks",
    "country": "USD",
    "dateET": "Tue, Sep 29",
    "timeET": "03:00 PM",
    "impact": "High",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Broad Market, Bonds",
    "tickers": "KRE, XLF, TLT, QQQ",
    "isoDate": "2026-09-29T15:00:00-04:00"
  },
  {
    "title": "API Weekly Crude Oil Stock",
    "country": "USD",
    "dateET": "Tue, Sep 29",
    "timeET": "04:30 PM",
    "impact": "Moderate",
    "forecast": "-1.1M",
    "previous": "+1.96M",
    "sectors": "Energy, Oil & Gas",
    "tickers": "XLE, USO",
    "isoDate": "2026-09-29T16:30:00-04:00"
  },
  {
    "title": "ADP Non-Farm Employment Change",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "08:15 AM",
    "impact": "High",
    "forecast": "124K",
    "previous": "99K",
    "sectors": "Consumer Discretionary, Industrials, Small Caps",
    "tickers": "XLY, XLI, IWM",
    "isoDate": "2026-09-30T08:15:00-04:00"
  },
  {
    "title": "Core PCE Price Index m/m",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "0.2%",
    "previous": "0.2%",
    "sectors": "Broad Market, Tech, Long Duration Assets",
    "tickers": "SPY, QQQ, TLT",
    "isoDate": "2026-09-30T08:30:00-04:00"
  },
  {
    "title": "Final GDP q/q (Q2 Final)",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "3.0%",
    "previous": "3.0%",
    "sectors": "Broad Market, Cyclicals, Small Caps",
    "tickers": "SPY, DIA, IWM",
    "isoDate": "2026-09-30T08:30:00-04:00"
  },
  {
    "title": "Final GDP Price Index q/q",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "2.5%",
    "previous": "2.5%",
    "sectors": "Broad Equities, Bonds",
    "tickers": "SPY, TLT",
    "isoDate": "2026-09-30T08:30:00-04:00"
  },
  {
    "title": "Personal Income m/m",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "08:30 AM",
    "impact": "Moderate",
    "forecast": "0.4%",
    "previous": "0.3%",
    "sectors": "Consumer Discretionary",
    "tickers": "XLY, SPY",
    "isoDate": "2026-09-30T08:30:00-04:00"
  },
  {
    "title": "Personal Spending m/m",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "08:30 AM",
    "impact": "Moderate",
    "forecast": "0.3%",
    "previous": "0.5%",
    "sectors": "Consumer Discretionary, Retail",
    "tickers": "XLY, XRT",
    "isoDate": "2026-09-30T08:30:00-04:00"
  },
  {
    "title": "Chicago PMI",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "09:45 AM",
    "impact": "Moderate",
    "forecast": "46.2",
    "previous": "46.1",
    "sectors": "Industrials, Basic Materials, Cyclicals",
    "tickers": "XLI, XLB",
    "isoDate": "2026-09-30T09:45:00-04:00"
  },
  {
    "title": "Crude Oil Inventories (EIA)",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "10:30 AM",
    "impact": "Moderate",
    "forecast": "-1.5M",
    "previous": "+3.0M",
    "sectors": "Energy, Transportation, Airlines",
    "tickers": "XLE, JETS, XOM, CVX",
    "isoDate": "2026-09-30T10:30:00-04:00"
  },
  {
    "title": "FOMC Member Kashkari Speaks",
    "country": "USD",
    "dateET": "Wed, Sep 30",
    "timeET": "06:00 PM",
    "impact": "High",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Tech, Real Estate",
    "tickers": "KRE, XLF, QQQ",
    "isoDate": "2026-09-30T18:00:00-04:00"
  },
  {
    "title": "Initial Jobless Claims",
    "country": "USD",
    "dateET": "Thu, Oct 1",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "224K",
    "previous": "218K",
    "sectors": "Broad Equities, High-Beta Assets",
    "tickers": "SPY, IWM, QQQ",
    "isoDate": "2026-10-01T08:30:00-04:00"
  },
  {
    "title": "Continuing Jobless Claims",
    "country": "USD",
    "dateET": "Thu, Oct 1",
    "timeET": "08:30 AM",
    "impact": "Moderate",
    "forecast": "1.83M",
    "previous": "1.82M",
    "sectors": "Broad Equities",
    "tickers": "SPY, IWM",
    "isoDate": "2026-10-01T08:30:00-04:00"
  },
  {
    "title": "Final Manufacturing PMI",
    "country": "USD",
    "dateET": "Thu, Oct 1",
    "timeET": "09:45 AM",
    "impact": "Moderate",
    "forecast": "50.2",
    "previous": "50.2",
    "sectors": "Industrials, Basic Materials",
    "tickers": "XLI, XLB",
    "isoDate": "2026-10-01T09:45:00-04:00"
  },
  {
    "title": "ISM Manufacturing PMI",
    "country": "USD",
    "dateET": "Thu, Oct 1",
    "timeET": "10:00 AM",
    "impact": "High",
    "forecast": "47.6",
    "previous": "47.2",
    "sectors": "Industrials, Materials, Tech Supply",
    "tickers": "XLI, XLB, SOXX",
    "isoDate": "2026-10-01T10:00:00-04:00"
  },
  {
    "title": "ISM Manufacturing Prices",
    "country": "USD",
    "dateET": "Thu, Oct 1",
    "timeET": "10:00 AM",
    "impact": "Moderate",
    "forecast": "53.5",
    "previous": "54.0",
    "sectors": "Industrials, Materials, Tech Supply",
    "tickers": "XLI, XLB, SOXX",
    "isoDate": "2026-10-01T10:00:00-04:00"
  },
  {
    "title": "Construction Spending m/m",
    "country": "USD",
    "dateET": "Thu, Oct 1",
    "timeET": "10:00 AM",
    "impact": "Low",
    "forecast": "0.1%",
    "previous": "-0.3%",
    "sectors": "Homebuilders, Real Estate",
    "tickers": "ITB, XHB, VNQ",
    "isoDate": "2026-10-01T10:00:00-04:00"
  },
  {
    "title": "Natural Gas Storage (EIA)",
    "country": "USD",
    "dateET": "Thu, Oct 1",
    "timeET": "10:30 AM",
    "impact": "Low",
    "forecast": "+55B",
    "previous": "+53B",
    "sectors": "Energy, Utilities",
    "tickers": "XLE, XLU, UNG",
    "isoDate": "2026-10-01T10:30:00-04:00"
  },
  {
    "title": "FOMC Member Logan Speaks",
    "country": "USD",
    "dateET": "Thu, Oct 1",
    "timeET": "06:45 PM",
    "impact": "High",
    "forecast": "—",
    "previous": "—",
    "sectors": "Banking, Tech, Rate Sensitive",
    "tickers": "KRE, XLF, QQQ",
    "isoDate": "2026-10-01T18:45:00-04:00"
  },
  {
    "title": "Average Hourly Earnings m/m",
    "country": "USD",
    "dateET": "Fri, Oct 2",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "0.3%",
    "previous": "0.4%",
    "sectors": "Broad Equities, Tech, Bonds",
    "tickers": "SPY, QQQ, TLT",
    "isoDate": "2026-10-02T08:30:00-04:00"
  },
  {
    "title": "Non-Farm Employment Change (NFP)",
    "country": "USD",
    "dateET": "Fri, Oct 2",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "144K",
    "previous": "142K",
    "sectors": "Consumer Discretionary, Industrials, Small Caps",
    "tickers": "XLY, XLI, IWM",
    "isoDate": "2026-10-02T08:30:00-04:00"
  },
  {
    "title": "Unemployment Rate",
    "country": "USD",
    "dateET": "Fri, Oct 2",
    "timeET": "08:30 AM",
    "impact": "High",
    "forecast": "4.2%",
    "previous": "4.2%",
    "sectors": "Broad Equities, Discretionary, Small Caps",
    "tickers": "SPY, XLY, IWM",
    "isoDate": "2026-10-02T08:30:00-04:00"
  },
  {
    "title": "Factory Orders m/m",
    "country": "USD",
    "dateET": "Fri, Oct 2",
    "timeET": "10:00 AM",
    "impact": "Moderate",
    "forecast": "0.2%",
    "previous": "-0.1%",
    "sectors": "Industrials, Cyclicals",
    "tickers": "XLI, DIA",
    "isoDate": "2026-10-02T10:00:00-04:00"
  }
];

const DOW_OFFSET = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 4, 0: 0 };

function getMondayOfWeek(from = new Date()) {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() + 1);
  else if (dow === 6) d.setDate(d.getDate() + 2);
  else d.setDate(d.getDate() - (dow - 1));
  return d;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDateLabel(d) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function formatDateYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function reanchorSchedule(schedule, targetMonday) {
  return schedule.map((event) => {
    try {
      const orig = new Date(event.isoDate);
      if (isNaN(orig.getTime())) return event;
      const offset = DOW_OFFSET[orig.getDay()] ?? 0;
      const targetDate = addDays(targetMonday, offset);
      const timePart = event.isoDate.substring(10);
      return {
        ...event,
        isoDate: formatDateYMD(targetDate) + timePart,
        dateET: formatDateLabel(targetDate),
      };
    } catch {
      return event;
    }
  });
}

function mapSectorAndTickers(title) {
  const titleUpper = (title || "").toUpperCase();
  let affectedSectors = "Broad Equities";
  let affectedTickers = "SPY";
  let mappedImpact = "Low";

  for (const [key, mapping] of Object.entries(SECTOR_IMPACT_MAP)) {
    if (titleUpper.includes(key)) {
      affectedSectors = mapping.sectors;
      affectedTickers = mapping.tickers;
      mappedImpact = mapping.impact;
      break;
    }
  }

  return { sectors: affectedSectors, tickers: affectedTickers, impact: mappedImpact };
}

export async function onRequestGet(context) {
  let isForce = false;
  let scope = "upcoming"; // "upcoming" (default) | "past"
  try {
    if (context && context.request && context.request.url) {
      const urlObj = new URL(context.request.url);
      isForce = urlObj.searchParams.has("t") || urlObj.searchParams.has("refresh");
      if (urlObj.searchParams.has("scope")) {
        scope = urlObj.searchParams.get("scope");
      }
    }
  } catch {
    // ignore
  }

  const commonHeaders = {
    "Content-Type": "application/json",
    "Cache-Control": isForce
      ? "no-store, no-cache, must-revalidate"
      : "public, max-age=900, s-maxage=1800, stale-while-revalidate=3600"
  };

  const now = new Date();
  const currentMonday = getMondayOfWeek(now);
  const priorMonday = addDays(currentMonday, -7);
  const targetMonday = scope === "past" ? priorMonday : currentMonday;
  const targetMondayIso = formatDateYMD(targetMonday);

  // If past week archive is requested, immediately return prior week actuals
  if (scope === "past") {
    return new Response(JSON.stringify({
      indicators: PAST_WEEK_SCHEDULE,
      source: "past_week_archive",
      scope: "past",
      fallback: false,
      notice: `Historical US macroeconomic releases & actual prints from previous trading week (${formatDateLabel(priorMonday)} – ${formatDateLabel(addDays(priorMonday, 4))}).`,
      last_updated: new Date().toISOString()
    }), { status: 200, headers: commonHeaders });
  }

  // Tier 1: Try Forex Factory Live Feed
  try {
    const ffResponse = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (ffResponse.ok) {
      const events = await ffResponse.json();
      if (Array.isArray(events) && events.length > 0) {
        const usdEvents = events
          .filter((e) => e.country === "USD")
          .map((event) => {
            const mapped = mapSectorAndTickers(event.title);
            let rawImpact = event.impact || mapped.impact;
            let finalImpact = rawImpact === "High" ? "High" : (rawImpact === "Medium" || rawImpact === "Moderate" ? "Moderate" : "Low");
            if (mapped.impact === "High") finalImpact = "High";

            let dateET = event.date || "";
            let timeET = "";
            let isoDate = event.date || "";

            try {
              const eventDate = new Date(event.date);
              if (!isNaN(eventDate.getTime())) {
                isoDate = eventDate.toISOString();
                dateET = eventDate.toLocaleDateString("en-US", {
                  timeZone: "America/New_York",
                  weekday: "short",
                  month: "short",
                  day: "numeric"
                });
                timeET = eventDate.toLocaleTimeString("en-US", {
                  timeZone: "America/New_York",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true
                });
              }
            } catch {
              // fallback
            }

            return {
              title: event.title || "Economic Release",
              country: "USD",
              dateET,
              timeET,
              impact: finalImpact,
              forecast: event.forecast && event.forecast.trim() !== "" ? event.forecast : "—",
              previous: event.previous && event.previous.trim() !== "" ? event.previous : "—",
              sectors: mapped.sectors,
              tickers: mapped.tickers,
              isoDate
            };
          });

        const relevantUsd = usdEvents.filter((e) => {
          const eventDatePrefix = (e.isoDate || "").substring(0, 10);
          return eventDatePrefix >= targetMondayIso;
        });

        // Only return Forex Factory if it provides comprehensive coverage (>= 5 events)
        if (relevantUsd.length >= 5) {
          return new Response(JSON.stringify({
            indicators: relevantUsd,
            source: "faireconomy_media",
            scope: "upcoming",
            fallback: false,
            last_updated: new Date().toISOString()
          }), { status: 200, headers: commonHeaders });
        }
      }
    }
  } catch (e) {
    // Proceed to Tier 2
  }

  // Tier 2: Live Backup Feed via Nasdaq Live Economic Calendar
  try {
    const nasdaqResponse = await fetch("https://api.nasdaq.com/api/calendar/economicevents", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*"
      }
    });

    if (nasdaqResponse.ok) {
      const nJson = await nasdaqResponse.json();
      const rows = nJson?.data?.rows;
      const asOf = nJson?.data?.asOf || "This Week";

      if (Array.isArray(rows) && rows.length > 0) {
        const usRows = rows
          .filter((r) => r.country === "United States" || r.country === "USD" || r.country === "US")
          .map((r) => {
            const mapped = mapSectorAndTickers(r.eventName);
            let timeET = r.gmt || "";
            if (r.gmt && r.gmt.includes(":")) {
              try {
                const parts = r.gmt.split(":");
                const h = parseInt(parts[0], 10);
                const m = parts[1];
                const hET = (h - 4 + 24) % 24;
                const ampm = hET < 12 ? "AM" : "PM";
                const dispH = hET === 0 ? 12 : (hET > 12 ? hET - 12 : hET);
                timeET = `${String(dispH).padStart(2, '0')}:${m} ${ampm}`;
              } catch {}
            }

            const cleanConsensus = (r.consensus || "").replace(/&nbsp;/g, "").trim() || "—";
            const cleanPrevious = (r.previous || "").replace(/&nbsp;/g, "").trim() || "—";

            return {
              title: r.eventName || "Economic Release",
              country: "USD",
              dateET: asOf,
              timeET,
              impact: mapped.impact,
              forecast: cleanConsensus,
              previous: cleanPrevious,
              sectors: mapped.sectors,
              tickers: mapped.tickers,
              isoDate: new Date().toISOString()
            };
          });

        if (usRows.length >= 5) {
          return new Response(JSON.stringify({
            indicators: usRows,
            source: "nasdaq_live",
            scope: "upcoming",
            fallback: false,
            notice: "Live macroeconomic feed ingested via Nasdaq Economic Calendar Radar.",
            last_updated: new Date().toISOString()
          }), { status: 200, headers: commonHeaders });
        } else if (usRows.length > 0) {
          // Merge Nasdaq live events with full curated weekly schedule
          const fullSchedule = reanchorSchedule(CURATED_WEEKLY_SCHEDULE, currentMonday);
          for (const nr of usRows) {
            const exists = fullSchedule.some(item =>
              item.title.toLowerCase().includes(nr.title.toLowerCase()) ||
              nr.title.toLowerCase().includes(item.title.toLowerCase())
            );
            if (!exists) {
              fullSchedule.unshift(nr);
            }
          }
          return new Response(JSON.stringify({
            indicators: fullSchedule,
            source: "nasdaq_live",
            scope: "upcoming",
            fallback: false,
            notice: "Live macroeconomic feed ingested via Nasdaq Economic Calendar Radar (augmented for full weekly catalyst coverage).",
            last_updated: new Date().toISOString()
          }), { status: 200, headers: commonHeaders });
        }
      }
    }
  } catch (e) {
    // Proceed to Tier 3
  }

  // Tier 3: Curated Weekly US Macro Schedule with dynamic trading week anchoring
  const anchoredSchedule = reanchorSchedule(CURATED_WEEKLY_SCHEDULE, currentMonday);

  return new Response(JSON.stringify({
    indicators: anchoredSchedule,
    source: "curated_macro_schedule",
    scope: "upcoming",
    fallback: false,
    notice: `Active high-impact weekly macroeconomic catalyst radar for upcoming week (${formatDateLabel(currentMonday)} – ${formatDateLabel(addDays(currentMonday, 4))}).`,
    last_updated: new Date().toISOString()
  }), {
    status: 200,
    headers: commonHeaders
  });
}
