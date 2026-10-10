/**
 * Shared core module for Daily Market Recap Digest.
 * Reused by:
 * - GET /api/market-recap
 * - Scheduled morning digest runner
 * - Conversational Strategy Agent tool
 * 
 * Features:
 * - Edge memory caching with ~6 hour TTL
 * - Real Yahoo Finance quotes for major indices, 11 GICS sector ETFs, VIX, 10Y Treasury
 * - Strictly omits unsupported breadth metrics (zero fabrication)
 */

import { todayET } from "./_now.js";

let cachedRecap = null;
let cacheExpiryTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

const INDEX_CONFIG = [
  { symbol: 'SPY', name: 'S&P 500', fallbackIndex: '^GSPC' },
  { symbol: 'QQQ', name: 'Nasdaq 100', fallbackIndex: '^IXIC' },
  { symbol: 'DIA', name: 'Dow Jones', fallbackIndex: '^DJI' },
  { symbol: 'IWM', name: 'Russell 2000', fallbackIndex: '^RUT' },
];

const SECTOR_ETFS = [
  { symbol: 'XLK', name: 'Technology' },
  { symbol: 'XLF', name: 'Financials' },
  { symbol: 'XLV', name: 'Health Care' },
  { symbol: 'XLY', name: 'Consumer Discretionary' },
  { symbol: 'XLP', name: 'Consumer Staples' },
  { symbol: 'XLE', name: 'Energy' },
  { symbol: 'XLI', name: 'Industrials' },
  { symbol: 'XLB', name: 'Materials' },
  { symbol: 'XLRE', name: 'Real Estate' },
  { symbol: 'XLU', name: 'Utilities' },
  { symbol: 'XLC', name: 'Communication Services' },
];

/**
 * Fetch a single quote from Yahoo Finance chart endpoint
 */
async function fetchYahooQuote(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const quotes = result.indicators?.quote?.[0] || {};
    const rawCloses = quotes.close || [];
    const validCloses = rawCloses.filter((c) => c !== null && !isNaN(c) && c > 0);

    const price = meta.regularMarketPrice || (validCloses.length > 0 ? validCloses[validCloses.length - 1] : 0);
    const prevClose = meta.chartPreviousClose || meta.previousClose || (validCloses.length > 1 ? validCloses[validCloses.length - 2] : price);
    const changePct = prevClose > 0 ? Math.round(((price - prevClose) / prevClose) * 10000) / 100 : 0;

    return {
      price: Math.round(price * 100) / 100,
      prevClose: Math.round(prevClose * 100) / 100,
      changePct,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Generates the full daily market recap digest.
 * Cached for ~6 hours.
 * @param {boolean} forceRefresh Ignore cache if true
 * @returns {Promise<Object>} Market recap data payload
 */
export async function getDailyMarketRecap(forceRefresh = false) {
  const now = Date.now(); // wall-clock-ok: memory cache expiry check
  const currentToday = todayET();
  if (!forceRefresh && cachedRecap && now < cacheExpiryTime && cachedRecap.date === currentToday) {
    return {
      ...cachedRecap,
      cached: true,
    };
  }

  // 1. Fetch Major Indices concurrently
  const indicesPromises = INDEX_CONFIG.map(async (idx) => {
    const quote = await fetchYahooQuote(idx.symbol);
    if (!quote) return null;
    return {
      symbol: idx.symbol,
      name: idx.name,
      price: quote.price,
      changePct: quote.changePct,
    };
  });

  // 2. Fetch 11 GICS Sector ETFs concurrently
  const sectorsPromises = SECTOR_ETFS.map(async (sec) => {
    const quote = await fetchYahooQuote(sec.symbol);
    if (!quote) return null;
    return {
      symbol: sec.symbol,
      name: sec.name,
      price: quote.price,
      changePct: quote.changePct,
    };
  });

  // 3. Fetch VIX and 10Y Treasury concurrently
  const vixPromise = fetchYahooQuote('^VIX');
  const tnxPromise = fetchYahooQuote('^TNX');

  const [indicesResults, sectorsResults, vixResult, tnxResult] = await Promise.all([
    Promise.all(indicesPromises),
    Promise.all(sectorsPromises),
    vixPromise,
    tnxPromise,
  ]);

  const validIndices = indicesResults.filter(Boolean);
  const validSectors = sectorsResults.filter(Boolean);

  const todayStr = currentToday;

  const payload = {
    date: todayStr,
    tradingDate: todayStr,
    indices: validIndices,
    sectors: validSectors,
    asOf: new Date().toISOString(), // wall-clock-ok: response envelope timestamp
  };

  if (vixResult) {
    payload.vix = {
      value: vixResult.price,
      changePct: vixResult.changePct,
    };
  }

  if (tnxResult) {
    payload.treasury10y = {
      yieldPct: tnxResult.price,
      changePct: tnxResult.changePct,
    };
  }

  // Note: Breadth (advancers/decliners) is omitted if not directly supplied by upstream
  // per strict rule: "Omit any field the upstream can't supply — never fabricate breadth numbers."

  cachedRecap = payload;
  cacheExpiryTime = now + CACHE_TTL_MS;

  return {
    ...payload,
    cached: false,
  };
}
