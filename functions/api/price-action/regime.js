/**
 * Cloudflare Pages Function: /api/price-action/regime
 * ====================================================
 * Edge market regime evaluator for Al Brooks Price Action analysis.
 * Classifies SPX and NDX proxies (SPY & QQQ) into { direction, phase }
 * and computes broad market agreement ('AGREE' | 'MIXED' | 'CONFLICT').
 * 
 * Storage:
 * Persists append-only regime history log in D1 (price_action_regimes table).
 * Never rewrites past dates.
 * 
 * Scheduling:
 * Reusable evaluation triggered on market close or scheduled digest cycles.
 * Uses single-clock authority (functions/api/_now.js).
 */

import { now, nowET, todayET, getPartsET } from "../_now.js";

/**
 * Helper to fetch historical daily bars from internal bars handler or Yahoo.
 */
async function fetchIndexBars(symbol, origin) {
  try {
    const resp = await fetch(`${origin}/api/price-action/bars?symbol=${encodeURIComponent(symbol)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (data?.success && Array.isArray(data.bars)) {
        return data.bars;
      }
    }
  } catch (err) {
    console.warn(`[EdgeRegime] Error fetching bars for ${symbol}:`, err);
  }
  return [];
}

/**
 * Pure EMA calculation on server.
 */
function calculateEMA(closes, period = 20) {
  if (closes.length === 0) return [];
  const ema = new Array(closes.length);
  const k = 2 / (period + 1);
  ema[0] = closes[0];
  for (let i = 1; i < closes.length; i++) {
    ema[i] = closes[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

/**
 * Server-side index regime classifier.
 */
function classifyServerBars(bars, symbol = 'SPX') {
  if (!bars || bars.length === 0) {
    return {
      symbol,
      direction: 'RANGE',
      phase: 'range, 0 bars, mid',
      legNumber: 0,
      isExtended: false,
      lastClose: 0,
      ema20: 0,
      lastBarDate: todayET(),
    };
  }

  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const ema = calculateEMA(closes, 20);

  const n = bars.length;
  const lastBar = bars[n - 1];
  const lastClose = lastBar.close;
  const lastEma = ema[ema.length - 1];

  // 1. Check for trading range (overlap in last 10 bars)
  const lookbackRange = Math.min(15, n);
  const recentHighs = highs.slice(n - lookbackRange);
  const recentLows = lows.slice(n - lookbackRange);
  const rangeTop = Math.max(...recentHighs);
  const rangeBottom = Math.min(...recentLows);
  const rangeSpreadPct = (rangeTop - rangeBottom) / rangeBottom;

  // If price has been compressed within < 4.5% over last 10+ bars
  const isRange = lookbackRange >= 10 && rangeSpreadPct < 0.045 && Math.abs(lastClose - lastEma) / lastEma < 0.015;

  if (isRange) {
    const relPos = (lastClose - rangeBottom) / Math.max(0.01, rangeTop - rangeBottom);
    const pos = relPos >= 0.67 ? 'top' : relPos <= 0.33 ? 'bottom' : 'mid';
    return {
      symbol,
      direction: 'RANGE',
      phase: `range, ${lookbackRange} bars, ${pos}`,
      legNumber: 0,
      isExtended: false,
      rangeBars: lookbackRange,
      rangePosition: pos,
      lastClose,
      ema20: Math.round(lastEma * 100) / 100,
      lastBarDate: lastBar.time || todayET(),
    };
  }

  // 2. Trend direction from EMA and recent swing slope
  const emaSlope = n >= 5 ? (lastEma - ema[n - 5]) / 5 : 0;
  const isAboveEma = lastClose > lastEma;
  const isSlopePositive = emaSlope > 0;

  if (isAboveEma && isSlopePositive) {
    // Bull trend
    const emaDist = (lastClose - lastEma) / lastEma;
    const isExtended = emaDist > 0.035;
    return {
      symbol,
      direction: 'BULL',
      phase: `bull leg 2${isExtended ? ', extended' : ''}`,
      legNumber: 2,
      isExtended,
      lastClose,
      ema20: Math.round(lastEma * 100) / 100,
      lastBarDate: lastBar.time || todayET(),
    };
  } else if (!isAboveEma && !isSlopePositive) {
    // Bear trend
    const emaDist = (lastEma - lastClose) / lastEma;
    const isExtended = emaDist > 0.035;
    return {
      symbol,
      direction: 'BEAR',
      phase: `bear leg 2${isExtended ? ', extended' : ''}`,
      legNumber: 2,
      isExtended,
      lastClose,
      ema20: Math.round(lastEma * 100) / 100,
      lastBarDate: lastBar.time || todayET(),
    };
  } else {
    // Mixed / consolidating
    return {
      symbol,
      direction: 'RANGE',
      phase: `range, ${lookbackRange} bars, mid`,
      legNumber: 0,
      isExtended: false,
      rangeBars: lookbackRange,
      rangePosition: 'mid',
      lastClose,
      ema20: Math.round(lastEma * 100) / 100,
      lastBarDate: lastBar.time || todayET(),
    };
  }
}

/**
 * Combines SPX and NDX into a unified MarketRegime object.
 */
function buildMarketRegime(spxRegime, ndxRegime) {
  let agreement = 'AGREE';
  let guidanceNote = '';

  if (spxRegime.direction === ndxRegime.direction) {
    agreement = 'AGREE';
    if (spxRegime.direction === 'BULL') {
      guidanceNote = 'Both SPX and NDX in bull trend. Long pullback setups (H1/H2) favored.';
    } else if (spxRegime.direction === 'BEAR') {
      guidanceNote = 'Both SPX and NDX in bear trend. Defensive posture and bear setups (L1/L2) favored.';
    } else {
      guidanceNote = 'Both SPX and NDX in trading range. Favor buying support / selling resistance; avoid breakout chasing.';
    }
  } else if (
    (spxRegime.direction === 'BULL' && ndxRegime.direction === 'BEAR') ||
    (spxRegime.direction === 'BEAR' && ndxRegime.direction === 'BULL')
  ) {
    agreement = 'CONFLICT';
    guidanceNote = 'Severe index divergence (SPX vs NDX conflict). Reduce size, sit on hands / hedge; directional bias low.';
  } else {
    agreement = 'MIXED';
    guidanceNote = 'Mixed — reduce size / wait. One index trending while other consolidates; selective setups only.';
  }

  const asOfBarDate = spxRegime.lastBarDate || ndxRegime.lastBarDate || todayET();
  const spxLabel = spxRegime.direction === 'BULL' ? 'bull trend' : spxRegime.direction === 'BEAR' ? 'bear trend' : 'trading range';
  const ndxLabel = ndxRegime.direction === 'BULL' ? 'bull trend' : ndxRegime.direction === 'BEAR' ? 'bear trend' : 'trading range';
  const summary = `SPX: ${spxLabel} (${spxRegime.phase}) · NDX: ${ndxLabel} (${ndxRegime.phase}) · ${agreement.toLowerCase()} — as of ${asOfBarDate} close`;

  return {
    spx: spxRegime,
    ndx: ndxRegime,
    agreement,
    summary,
    guidanceNote,
    asOfBarDate,
    evaluatedAt: now().toISOString(),
    confidenceNote: 'Not financial advice — pattern detection and market regime classifications are probabilistic.',
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const url = new URL(request.url);
  const origin = url.origin;

  // 1. Fetch historical bars for SPY and QQQ (the liquid proxies for SPX and NDX)
  const [spyBars, qqqBars] = await Promise.all([
    fetchIndexBars('SPY', origin),
    fetchIndexBars('QQQ', origin),
  ]);

  const spxRegime = classifyServerBars(spyBars, 'SPX');
  const ndxRegime = classifyServerBars(qqqBars, 'NDX');
  const regime = buildMarketRegime(spxRegime, ndxRegime);

  // 2. D1 History Persistence (Append-only)
  let historyLogs = [];
  if (env?.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS price_action_regimes (
          date TEXT PRIMARY KEY,
          spx_json TEXT NOT NULL,
          ndx_json TEXT NOT NULL,
          agreement TEXT NOT NULL,
          summary TEXT NOT NULL,
          guidance_note TEXT NOT NULL,
          evaluated_at TEXT NOT NULL
        )
      `).run();

      // Append-only: INSERT OR IGNORE never modifies a previously recorded day
      await env.DB.prepare(`
        INSERT OR IGNORE INTO price_action_regimes (
          date, spx_json, ndx_json, agreement, summary, guidance_note, evaluated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        regime.asOfBarDate,
        JSON.stringify(regime.spx),
        JSON.stringify(regime.ndx),
        regime.agreement,
        regime.summary,
        regime.guidanceNote,
        regime.evaluatedAt
      ).run();

      const result = await env.DB.prepare(`
        SELECT * FROM price_action_regimes ORDER BY date ASC LIMIT 30
      `).all();

      if (result?.results) {
        historyLogs = result.results.map((r) => ({
          date: r.date,
          regime: {
            spx: JSON.parse(r.spx_json),
            ndx: JSON.parse(r.ndx_json),
            agreement: r.agreement,
            summary: r.summary,
            guidanceNote: r.guidance_note,
            asOfBarDate: r.date,
            evaluatedAt: r.evaluated_at,
            confidenceNote: 'Not financial advice — probabilistic.',
          },
          recordedAt: r.evaluated_at,
        }));
      }
    } catch (dbErr) {
      console.warn('[EdgeRegime] D1 table interaction warning:', dbErr);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      regime,
      history: historyLogs,
      proxiesUsed: {
        spx: 'SPY',
        ndx: 'QQQ',
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=120',
      },
    }
  );
}
