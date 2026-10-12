/**
 * Cloudflare Pages Function: GET /api/price-action/bars
 * Edge market bar proxy for Al Brooks Price Action analysis.
 * Zero-CORS, high-integrity historical daily bars with caching.
 * 
 * Provider Priority:
 * 1. Tradier API (Broker-grade daily history)
 * 2. Yahoo Finance (Direct edge fetch without browser CORS)
 */

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') || '').trim().toUpperCase();

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'Query parameter "symbol" is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // 1. Tradier Token Resolution
  let tradierToken = (
    env?.TRADIER_API_KEY ||
    env?.TRADIER_API_TOKEN ||
    env?.["TRADIER_API-TOKEN"] ||
    env?.TRADIER_TOKEN ||
    env?.["TRADIER-TOKEN"] ||
    ""
  ).trim();

  if (!tradierToken && env?.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT value FROM system_settings WHERE key = 'tradier_api_key' LIMIT 1"
      ).first();
      if (row && row.value && row.value.trim()) {
        tradierToken = row.value.trim();
      }
    } catch {
      // Non-blocking
    }
  }

  const useSandbox = (env?.TRADIER_USE_SANDBOX || '').toLowerCase() === 'true';
  const tradierBaseUrl = useSandbox ? 'https://sandbox.tradier.com/v1' : 'https://api.tradier.com/v1';

  // Tier 1: Tradier Historical Daily Bars
  if (tradierToken) {
    try {
      const histUrl = `${tradierBaseUrl}/markets/history?symbol=${encodeURIComponent(symbol)}&interval=daily`;
      const histResp = await fetch(histUrl, {
        headers: {
          Authorization: `Bearer ${tradierToken}`,
          Accept: 'application/json',
        },
      });

      if (histResp.ok) {
        const hData = await histResp.json();
        const days = hData?.history?.day;
        const daysArr = Array.isArray(days) ? days : days ? [days] : [];

        if (daysArr.length > 0) {
          const rawBars = daysArr.map((d) => ({
            time: d.date,
            open: Number(d.open),
            high: Number(d.high),
            low: Number(d.low),
            close: Number(d.close),
            volume: Number(d.volume || 0),
          })).filter((b) => b.close > 0 && b.high >= b.low);

          if (rawBars.length >= 10) {
            return new Response(
              JSON.stringify({
                success: true,
                symbol,
                provider: 'TRADIER',
                bars: rawBars,
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'public, max-age=60, s-maxage=120',
                  'Access-Control-Allow-Origin': '*',
                },
              }
            );
          }
        }
      }
    } catch (tErr) {
      // Non-fatal, fall through to Yahoo
    }
  }

  // Tier 2: Yahoo Finance (Direct Edge Fetch)
  try {
    const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;
    const yResp = await fetch(yUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });

    if (yResp.ok) {
      const yData = await yResp.json();
      const result = yData?.chart?.result?.[0];
      if (result) {
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0] || {};
        const opens = quotes.open || [];
        const highs = quotes.high || [];
        const lows = quotes.low || [];
        const closes = quotes.close || [];
        const volumes = quotes.volume || [];

        const rawBars = [];
        for (let i = 0; i < timestamps.length; i++) {
          const o = opens[i];
          const h = highs[i];
          const l = lows[i];
          const c = closes[i];
          const v = volumes[i];

          if (c !== null && !isNaN(c) && c > 0 && h !== null && l !== null && h >= l) {
            rawBars.push({
              timestamp: timestamps[i],
              open: Number(o || c),
              high: Number(h),
              low: Number(l),
              close: Number(c),
              volume: Number(v || 0),
            });
          }
        }

        if (rawBars.length >= 10) {
          return new Response(
            JSON.stringify({
              success: true,
              symbol,
              provider: 'YAHOO',
              bars: rawBars,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60, s-maxage=120',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
      }
    }
  } catch (yErr) {
    // Non-fatal
  }

  return new Response(
    JSON.stringify({
      success: false,
      symbol,
      error: `Unable to retrieve daily price action bars for ${symbol}`,
      bars: [],
    }),
    {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
