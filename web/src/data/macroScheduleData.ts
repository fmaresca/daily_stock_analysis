/**
 * Curated Macroeconomic Indicator Schedules
 * Fallback & Benchmark dataset for US Federal Reserve, Treasury, and Bureau of Labor Statistics releases.
 */

import { EconomicIndicator } from '../types/economicCalendar';

export const BUNDLED_MACRO_SCHEDULE: EconomicIndicator[] = [
  {
    title: "Empire State Manufacturing Index",
    country: "USD",
    dateET: "Mon, Sep 14",
    timeET: "08:30 AM",
    impact: "Moderate",
    forecast: "-4.0",
    previous: "-4.7",
    sectors: "Industrials, Basic Materials, Cyclicals",
    tickers: "XLI, XLB, CAT",
    isoDate: "2026-09-14T08:30:00-04:00"
  },
  {
    title: "Retail Sales m/m",
    country: "USD",
    dateET: "Tue, Sep 15",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "0.3%",
    previous: "0.4%",
    sectors: "Consumer Discretionary, Retail, Transports",
    tickers: "XLY, XRT, IYT, AMZN, WMT",
    isoDate: "2026-09-15T08:30:00-04:00"
  },
  {
    title: "Core Retail Sales m/m",
    country: "USD",
    dateET: "Tue, Sep 15",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "0.4%",
    previous: "0.3%",
    sectors: "Consumer Discretionary, Retail",
    tickers: "XLY, XRT, HD, TGT",
    isoDate: "2026-09-15T08:30:00-04:00"
  },
  {
    title: "Industrial Production m/m",
    country: "USD",
    dateET: "Tue, Sep 15",
    timeET: "09:15 AM",
    impact: "Moderate",
    forecast: "0.2%",
    previous: "-0.6%",
    sectors: "Industrials, Energy, Materials",
    tickers: "XLI, XLE, GE",
    isoDate: "2026-09-15T09:15:00-04:00"
  },
  {
    title: "FOMC Meeting Begins (Day 1)",
    country: "USD",
    dateET: "Tue, Sep 15",
    timeET: "All Day",
    impact: "Moderate",
    forecast: "—",
    previous: "—",
    sectors: "Broad Market, Interest Rate Sensitive",
    tickers: "SPY, QQQ, TLT",
    isoDate: "2026-09-15T09:30:00-04:00"
  },
  {
    title: "Building Permits",
    country: "USD",
    dateET: "Wed, Sep 16",
    timeET: "08:30 AM",
    impact: "Moderate",
    forecast: "1.41M",
    previous: "1.40M",
    sectors: "Homebuilders, Building Products, Real Estate",
    tickers: "ITB, XHB, VNQ, HD",
    isoDate: "2026-09-16T08:30:00-04:00"
  },
  {
    title: "Housing Starts",
    country: "USD",
    dateET: "Wed, Sep 16",
    timeET: "08:30 AM",
    impact: "Moderate",
    forecast: "1.31M",
    previous: "1.24M",
    sectors: "Homebuilders, Real Estate",
    tickers: "ITB, XHB, DHI, LEN",
    isoDate: "2026-09-16T08:30:00-04:00"
  },
  {
    title: "Crude Oil Inventories (EIA)",
    country: "USD",
    dateET: "Wed, Sep 16",
    timeET: "10:30 AM",
    impact: "Moderate",
    forecast: "-1.2M",
    previous: "+0.8M",
    sectors: "Energy, Transportation, Airlines",
    tickers: "XLE, JETS, IYT, XOM, CVX",
    isoDate: "2026-09-16T10:30:00-04:00"
  },
  {
    title: "FOMC Rate Decision & Statement",
    country: "USD",
    dateET: "Wed, Sep 16",
    timeET: "02:00 PM",
    impact: "High",
    forecast: "5.00% - 5.25%",
    previous: "5.25% - 5.50%",
    sectors: "Banking, Tech, Real Estate, Precious Metals",
    tickers: "KRE, XLF, QQQ, GLD, TLT",
    isoDate: "2026-09-16T14:00:00-04:00"
  },
  {
    title: "FOMC Economic Projections (Dot Plot)",
    country: "USD",
    dateET: "Wed, Sep 16",
    timeET: "02:00 PM",
    impact: "High",
    forecast: "—",
    previous: "—",
    sectors: "Broad Market, Treasury Yields",
    tickers: "SPY, TLT, IEF, QQQ",
    isoDate: "2026-09-16T14:00:00-04:00"
  },
  {
    title: "FOMC Press Conference (Chair Powell)",
    country: "USD",
    dateET: "Wed, Sep 16",
    timeET: "02:30 PM",
    impact: "High",
    forecast: "—",
    previous: "—",
    sectors: "Broad Market, High-Beta Tech, Small Caps",
    tickers: "SPY, QQQ, IWM, VIX",
    isoDate: "2026-09-16T14:30:00-04:00"
  },
  {
    title: "Initial Jobless Claims",
    country: "USD",
    dateET: "Thu, Sep 17",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "228K",
    previous: "227K",
    sectors: "Broad Equities, High-Beta Assets",
    tickers: "SPY, IWM, QQQ",
    isoDate: "2026-09-17T08:30:00-04:00"
  },
  {
    title: "Philly Fed Manufacturing Index",
    country: "USD",
    dateET: "Thu, Sep 17",
    timeET: "08:30 AM",
    impact: "Moderate",
    forecast: "2.3",
    previous: "-7.0",
    sectors: "Industrials, Basic Materials",
    tickers: "XLI, XLB",
    isoDate: "2026-09-17T08:30:00-04:00"
  },
  {
    title: "Continuing Jobless Claims",
    country: "USD",
    dateET: "Thu, Sep 17",
    timeET: "08:30 AM",
    impact: "Moderate",
    forecast: "1.85M",
    previous: "1.84M",
    sectors: "Broad Equities",
    tickers: "SPY, IWM",
    isoDate: "2026-09-17T08:30:00-04:00"
  },
  {
    title: "Natural Gas Storage",
    country: "USD",
    dateET: "Thu, Sep 17",
    timeET: "10:30 AM",
    impact: "Low",
    forecast: "+52B",
    previous: "+40B",
    sectors: "Energy, Utilities",
    tickers: "XLE, XLU, UNG",
    isoDate: "2026-09-17T10:30:00-04:00"
  },
  {
    title: "Current Account Balance",
    country: "USD",
    dateET: "Thu, Sep 17",
    timeET: "08:30 AM",
    impact: "Low",
    forecast: "-260B",
    previous: "-238B",
    sectors: "US Dollar, Multi-nationals",
    tickers: "UUP, SPY",
    isoDate: "2026-09-17T08:30:00-04:00"
  },
  {
    title: "Quadruple Witching Options Expiration",
    country: "USD",
    dateET: "Fri, Sep 18",
    timeET: "Market Close",
    impact: "High",
    forecast: "Volume Surge",
    previous: "—",
    sectors: "Broad Market, Derivatives, Index ETFs",
    tickers: "SPY, QQQ, IWM, VIX",
    isoDate: "2026-09-18T16:00:00-04:00"
  },
  {
    title: "Leading Economic Index (LEI) m/m",
    country: "USD",
    dateET: "Fri, Sep 18",
    timeET: "10:00 AM",
    impact: "Moderate",
    forecast: "-0.3%",
    previous: "-0.6%",
    sectors: "Broad Equities, Cyclicals",
    tickers: "SPY, DIA",
    isoDate: "2026-09-18T10:00:00-04:00"
  }
];

export const PAST_WEEK_SCHEDULE: EconomicIndicator[] = [
  {
    title: "Bank Holiday (Labor Day)",
    country: "USD",
    dateET: "Mon, Sep 07",
    timeET: "All Day",
    impact: "Low",
    forecast: "—",
    previous: "—",
    sectors: "Broad Equities",
    tickers: "SPY",
    isoDate: "2026-09-07T08:00:00-04:00"
  },
  {
    title: "NFIB Small Business Index",
    country: "USD",
    dateET: "Tue, Sep 08",
    timeET: "06:00 AM",
    impact: "Low",
    forecast: "99.4",
    previous: "99.8",
    sectors: "Small Caps, Regional Banks",
    tickers: "IWM, KRE",
    isoDate: "2026-09-08T06:00:00-04:00"
  },
  {
    title: "Consumer Credit m/m",
    country: "USD",
    dateET: "Tue, Sep 08",
    timeET: "03:00 PM",
    impact: "Low",
    forecast: "11.9B",
    previous: "14.2B",
    sectors: "Financials, Consumer Discretionary",
    tickers: "XLF, XLY",
    isoDate: "2026-09-08T15:00:00-04:00"
  },
  {
    title: "Core PPI m/m",
    country: "USD",
    dateET: "Thu, Sep 10",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "0.3%",
    previous: "0.2%",
    sectors: "Technology, Financials",
    tickers: "QQQ, XLF, TLT",
    isoDate: "2026-09-10T08:30:00-04:00"
  },
  {
    title: "PPI m/m",
    country: "USD",
    dateET: "Thu, Sep 10",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "0.4%",
    previous: "0.0%",
    sectors: "Broad Market, Industrials",
    tickers: "SPY, XLI",
    isoDate: "2026-09-10T08:30:00-04:00"
  },
  {
    title: "Unemployment Claims",
    country: "USD",
    dateET: "Thu, Sep 10",
    timeET: "08:30 AM",
    impact: "Moderate",
    forecast: "205K",
    previous: "206K",
    sectors: "Broad Equities",
    tickers: "SPY, IWM",
    isoDate: "2026-09-10T08:30:00-04:00"
  },
  {
    title: "Core CPI m/m",
    country: "USD",
    dateET: "Fri, Sep 11",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "0.2%",
    previous: "0.2%",
    sectors: "Technology, Financials, Real Estate",
    tickers: "QQQ, XLF, TLT, VNQ",
    isoDate: "2026-09-11T08:30:00-04:00"
  },
  {
    title: "Core CPI y/y",
    country: "USD",
    dateET: "Fri, Sep 11",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "2.4%",
    previous: "2.5%",
    sectors: "Technology, Real Estate",
    tickers: "QQQ, VNQ, TLT",
    isoDate: "2026-09-11T08:30:00-04:00"
  },
  {
    title: "CPI m/m",
    country: "USD",
    dateET: "Fri, Sep 11",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "0.4%",
    previous: "0.1%",
    sectors: "Broad Market, Consumer Discretionary",
    tickers: "SPY, XLY",
    isoDate: "2026-09-11T08:30:00-04:00"
  },
  {
    title: "CPI y/y",
    country: "USD",
    dateET: "Fri, Sep 11",
    timeET: "08:30 AM",
    impact: "High",
    forecast: "3.4%",
    previous: "3.4%",
    sectors: "Broad Market, Treasury Yields",
    tickers: "SPY, TLT",
    isoDate: "2026-09-11T08:30:00-04:00"
  },
  {
    title: "Prelim UoM Consumer Sentiment",
    country: "USD",
    dateET: "Fri, Sep 11",
    timeET: "10:00 AM",
    impact: "Moderate",
    forecast: "51.0",
    previous: "51.0",
    sectors: "Consumer Discretionary",
    tickers: "XLY, XRT",
    isoDate: "2026-09-11T10:00:00-04:00"
  }
];
