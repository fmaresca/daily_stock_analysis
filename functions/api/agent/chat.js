/**
 * Cloudflare Pages Function: /api/agent/chat
 * Conversational Strategy Q&A Agent ("Ask about any stock")
 *
 * Supports:
 * - POST: SSE Streaming chat execution with server-side tool calling loop
 *   (with graceful Edge Quantitative Engine fallback when LLM API keys are unconfigured)
 * - POST ?action=save_key: Persist Gemini API key to Cloudflare D1 system_settings
 * - GET ?action=key_status: Check whether Gemini or custom LLM key is configured
 * - GET: List user chat sessions or retrieve messages for a specific session
 * - DELETE: Delete a conversation session (strictly tenant-scoped)
 *
 * Strict Security:
 * - Session authentication required (401 if unauthenticated)
 * - Rate-limited per user
 * - Tenant isolation: WHERE user_id = <session.id>
 * - Secrets strictly server-side
 * - Tool-only numerical facts (zero hallucinations)
 */

import { authenticateRequest } from "../_auth_utils.js";
import { checkRateLimit, buildRateLimitResponse } from "../_rate_limit.js";
import { completeLLM, resolveGeminiApiKey } from "../_llm.js";
import {
  getOrCreateSession,
  listUserSessions,
  getSessionMessages,
  saveMessage,
  deleteUserSession,
} from "./_agent_db.js";
import { AGENT_TOOLS, executeAgentTool } from "./_agent_tools.js";
import { STRATEGY_PLAYBOOKS, getPlaybookById } from "./_playbooks.js";

const VALID_LENSES = [
  "Trend/Momentum",
  "Mean-Reversion",
  "Breakout",
  "Quality/Value",
  "Growth",
  "Event-Driven (Earnings)",
  "Sentiment/Positioning",
  "Risk/Defensive",
];

function buildSystemPrompt(activeLens, tickerContext, playbookId) {
  const selectedPlaybook = playbookId ? getPlaybookById(playbookId) : null;
  const playbookSection = selectedPlaybook ? `
### ACTIVE STRATEGY PLAYBOOK
Playbook: ${selectedPlaybook.name} (${selectedPlaybook.category})
Target Delta: ${selectedPlaybook.targetDelta} | Min Cushion: ${selectedPlaybook.minCushionPct}% | IV Rank Goal: ${selectedPlaybook.idealIvRank}
${selectedPlaybook.instructions}
` : "";

  return `You are DeltaHarvest's Senior Institutional Equity & Derivatives Strategy Assistant.
You specialize in conservative, quantitative options and equity analysis for US markets.

### ACTIVE STRATEGY LENS
Current Lens: ${activeLens}

Available Strategy Lenses:
1. Trend/Momentum: Focus on multi-timeframe trend alignment, 20/50 SMA posture, volume confirmation, and RSI momentum.
2. Mean-Reversion: Focus on Bollinger Band extremes, overbought/oversold RSI (<30 or >70), and statistical stretch from moving averages.
3. Breakout: Focus on consolidation range compression, pivot resistance tests, and volume expansion breakouts.
4. Quality/Value: Focus on balance sheet stability, historical drawdown resilience, and margin of safety.
5. Growth: Focus on relative strength vs SPY/QQQ, sector leadership, and beta momentum.
6. Event-Driven (Earnings): Focus on upcoming earnings calendar risks, implied volatility rush/crush, and binary risk mitigation.
7. Sentiment/Positioning: Focus on retail crowd positioning, social sentiment (Reddit/X/News buzz via Adanos), and contrarian signals.
8. Risk/Defensive: Focus on capital preservation, downside cushions, stop-loss benchmarks, and cash-secured buffer.
${playbookSection}
### CRITICAL RULES & CITATION MANDATE
1. NEVER INVENT OR GUESS NUMBERS. Every price, moving average, RSI, yield, or sentiment metric you state MUST come directly from a tool call (e.g. get_market_price_and_technicals, get_options_preflight_checklist, get_market_sentiment).
2. When advising on Cash-Secured Puts (CSP) or Covered Calls (CC), call get_options_preflight_checklist to verify binary earnings risk, weekly liquidity, volume, and technical buffer before finalizing strike targets.
3. For deep corporate filings or analyst updates, call search_financial_catalysts.
4. Always cite the exact source of figures inline: e.g. "Spot price $124.50 (Yahoo)", "RSI 68.2 (14d)", "20-day SMA $118.40", "Pre-flight score 4.5/5.0 (DeltaHarvest Matrix)".
5. Answer concisely with clear institutional formatting (markdown headings, bullet points, quantitative takeaways).
6. Always begin or end your analysis explicitly noting the lens used, and encourage the user to compare alternative lenses if appropriate.
${tickerContext ? `Currently focused ticker context: ${tickerContext}` : ""}`;
}

const POPULAR_TICKERS = new Set([
  "TSLA", "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "GOOG", "META", "AMD",
  "PLTR", "SPY", "QQQ", "IWM", "DIA", "VIX", "NFLX", "AVGO", "COST",
  "JPM", "BAC", "DIS", "INTC", "COIN", "SOFI", "UBER", "MARA", "RIOT",
  "MSTR", "SMCI", "BABA", "NIO", "XOM", "CVX", "LLY", "UNH", "WMT",
  "TGT", "BA", "CAT", "GE", "CRM", "ORCL", "PYPL", "SQ", "ROKU",
  "SHOP", "ARM", "MU", "QCOM", "TXN", "PANW", "CRWD", "NOW", "SNOW",
  "NET", "F", "GM", "RIVN", "LCID", "TLT", "GLD", "SLV", "USO", "UNG"
]);

const ENGLISH_WORDS_STOPLIST = new Set([
  "A", "I", "IN", "ON", "AT", "TO", "OF", "FOR", "IS", "IT", "BY", "AS",
  "AND", "OR", "THE", "CAN", "HOW", "WHY", "WHAT", "WHEN", "WILL", "DO",
  "ARE", "NOT", "BUT", "ALL", "NEW", "BUY", "PUT", "CALL", "RSI", "SMA",
  "MACD", "IV", "DTE", "ATM", "OTM", "ITM", "POP", "CBOE", "FOMC", "CPI",
  "STOCK", "STOCKS", "ABOUT", "THIS", "TELL", "ME", "ANALYZE", "OVERBOUGHT", "OVERSOLD",
  "HIGH", "LOW", "RISK", "CASH", "DROP", "FALL", "GAIN", "HOLD", "LOOK",
  "MOVE", "MOVES", "NEXT", "WEEK", "GOOD", "BEST", "MAKE", "THINK", "TODAY", "PRICE",
  "PRICES", "TRADE", "TRADES", "LEVEL", "LEVELS", "TREND", "TRENDS", "FAST", "SLOW",
  "REAL", "OPEN", "PLAY", "PLAYS", "RUN", "DOWN", "PULL", "VIEW", "VIEWS", "RATE",
  "RATES", "WELL", "MUCH", "SHOW", "HELP", "GIVE", "FIND", "SAFE", "SELL",
  "TEST", "PLAN", "TARGET", "TRUE", "FREE", "COST", "DATA", "INFO", "WORK",
  "LOSS", "LOSSES", "BIG", "BASE", "CARE", "CASE", "DEAL", "FACT", "FEEL",
  "HOPE", "IDEA", "IDEAS", "KNOW", "LEAD", "LONG", "LOVE", "MIND", "PART",
  "PAST", "PATH", "PEAK", "POST", "PURE", "READ", "RICH", "RISE", "ROAD",
  "ROLE", "RULE", "SEEM", "SEEN", "SIDE", "SIGN", "SITE", "SIZE", "SOON",
  "STAY", "STEP", "STOP", "SURE", "TAKE", "TALK", "TEAM", "TERM", "TERMS",
  "TIME", "TURN", "TYPE", "USER", "VOTE", "WAIT", "WANT", "WARM", "WAVE",
  "WAYS", "WEAK", "WENT", "WIDE", "WISH", "WORD", "YEAR", "ZERO", "ZONE",
  "BEAR", "BULL", "PUTS", "CALLS", "SELLS", "BUYS", "HOLD", "HOLDS",
  "SHORTS", "SHORT", "SAFE", "DEEP", "EVEN", "EVER", "FIVE", "FOUR", "FULL",
  "HALF", "HARD", "HELD", "HUGE", "INTO", "JUST", "KEEP", "KEPT",
  "LAST", "LATE", "LINE", "LOST", "MAIN", "MEAN", "MIGHT", "MOST", "NEAR",
  "NEED", "ONCE", "ONLY", "OVER", "POOR", "REST", "SAME",
  "SEEK", "SEND", "SHOT", "SLIP", "SNAP", "SOME",
  "SUCH", "TALL", "THEN", "THEY", "TINY", "TOLD",
  "TOOK", "VERY", "WERE", "WILD"
]);

/**
 * Extracts a ticker candidate from the user's message if not specified.
 */
function extractTickerFromMessage(msg, fallbackTicker) {
  if (!msg || typeof msg !== "string") return fallbackTicker || "SPY";

  // 1. Explicit dollar-prefixed ticker e.g. $TSLA or $AAPL
  const dollarMatch = msg.match(/\$([A-Za-z]{1,5})\b/);
  if (dollarMatch) return dollarMatch[1].toUpperCase();

  const words = msg.split(/[\s,?.!;:()"'`]+/);

  // 2. High-priority check: explicitly matches a known prominent ticker
  for (const w of words) {
    const clean = w.toUpperCase();
    if (POPULAR_TICKERS.has(clean)) {
      return clean;
    }
  }

  // 3. Fallback check: 1-5 letters that are not conversational English stopwords
  for (const w of words) {
    const clean = w.toUpperCase();
    if (/^[A-Z]{1,5}$/.test(clean) && !ENGLISH_WORDS_STOPLIST.has(clean)) {
      return clean;
    }
  }

  return fallbackTicker || "SPY";
}

/**
 * Synthesizes institutional quantitative markdown using real data gathered from tools.
 */
function generateQuantitativeAnalysisReport({
  ticker,
  lens,
  techData,
  newsData,
  macroData,
  notice = "",
}) {
  const spot = techData?.spotPrice ?? "N/A";
  const changePct = typeof techData?.changePct === "number"
    ? `${techData.changePct >= 0 ? "+" : ""}${techData.changePct.toFixed(2)}%`
    : "N/A";
  const sma20 = techData?.sma20 ?? "N/A";
  const sma50 = techData?.sma50 ?? "N/A";
  const rsi = techData?.rsi14 ?? "N/A";
  const upperBb = techData?.upperBb ?? "N/A";
  const lowerBb = techData?.lowerBb ?? "N/A";
  const bbWidth = typeof techData?.bbWidthPct === "number"
    ? `${techData.bbWidthPct.toFixed(1)}%`
    : "N/A";

  let sma20Buffer = "N/A";
  let sma50Buffer = "N/A";
  let rsiStance = "Neutral (40–60)";
  let posture = "Neutral Consolidation";
  let cspStrike = "N/A";
  let ccStrike = "N/A";

  if (typeof spot === "number" && spot > 0) {
    if (typeof sma20 === "number" && sma20 > 0) {
      const b20 = ((spot - sma20) / spot) * 100;
      sma20Buffer = `${b20 >= 0 ? "+" : ""}${b20.toFixed(2)}%`;
    }
    if (typeof sma50 === "number" && sma50 > 0) {
      const b50 = ((spot - sma50) / spot) * 100;
      sma50Buffer = `${b50 >= 0 ? "+" : ""}${b50.toFixed(2)}%`;
    }
    if (typeof rsi === "number") {
      if (rsi >= 70) rsiStance = `Overbought (${rsi.toFixed(1)} ≥ 70) — Elevated mean-reversion risk`;
      else if (rsi <= 30) rsiStance = `Oversold (${rsi.toFixed(1)} ≤ 30) — Capitulation bounce candidate`;
      else if (rsi > 60) rsiStance = `Bullish Momentum (${rsi.toFixed(1)}) — Healthy upward drift`;
      else if (rsi < 40) rsiStance = `Weak Momentum (${rsi.toFixed(1)}) — Downside pressure`;
    }

    if (typeof sma20 === "number" && typeof sma50 === "number") {
      if (spot > sma20 && sma20 > sma50) posture = "Strong Bullish Uptrend (Spot > 20d SMA > 50d SMA)";
      else if (spot < sma20 && sma20 < sma50) posture = "Bearish Downtrend (Spot < 20d SMA < 50d SMA)";
      else if (spot > sma20 && spot < sma50) posture = "Short-term Rebound into 50d Overhead Resistance";
      else posture = "Mixed / Range-bound Consolidation";
    }

    const putAnchor = typeof sma20 === "number" && sma20 < spot ? Math.min(sma20, spot * 0.94) : spot * 0.94;
    cspStrike = `$${(Math.floor(putAnchor / 2.5) * 2.5).toFixed(2)} (approx. -${(((spot - putAnchor) / spot) * 100).toFixed(1)}% downside cushion)`;

    const callAnchor = typeof upperBb === "number" && upperBb > spot ? Math.max(upperBb, spot * 1.05) : spot * 1.05;
    ccStrike = `$${(Math.ceil(callAnchor / 2.5) * 2.5).toFixed(2)} (approx. +${(((callAnchor - spot) / spot) * 100).toFixed(1)}% upside resistance)`;
  }

  let lensAnalysis = "";
  if (lens === "Trend/Momentum") {
    lensAnalysis = `Under the **Trend/Momentum** lens, **${ticker}** is currently in a **${posture}**. Spot is trading at **$${spot}** relative to its 20-day SMA ($${sma20}) and 50-day SMA ($${sma50}). Momentum confirmation: RSI-14 is currently **${rsi}**, indicating ${rsiStance.toLowerCase()}.`;
  } else if (lens === "Mean-Reversion") {
    lensAnalysis = `Under the **Mean-Reversion** lens, **${ticker}** is evaluated against its 2-sigma Bollinger envelope ($${lowerBb} – $${upperBb}, width ${bbWidth}). With 14-day RSI at **${rsi}**, the stock is **${rsiStance}**. Statistical reversion favors patience if stretched beyond 2-sigma boundary rails.`;
  } else if (lens === "Breakout") {
    lensAnalysis = `Under the **Breakout** lens, the primary overhead hurdle is **$${upperBb}** (upper Bollinger rail / 50d SMA $${sma50}). A sustained high-volume close above this resistance is required to validate breakout expansion; failure signals range continuation down toward $${lowerBb}.`;
  } else if (lens === "Risk/Defensive") {
    lensAnalysis = `Under the **Risk/Defensive** lens, capital preservation mandates anchoring Cash-Secured Puts below verified support. The primary structural cushion is the 20-day SMA ($${sma20}) and 50-day SMA ($${sma50}). Any CSP written should enforce minimum 4.5%–7.0% downside clearance.`;
  } else {
    lensAnalysis = `Under the **${lens}** lens, **${ticker}** presents a **${posture}** setup at spot **$${spot}** (${changePct}). Key moving average anchors: 20-day SMA at $${sma20} and 50-day SMA at $${sma50}, with 14-day RSI positioned at ${rsi}.`;
  }

  let newsSection = "No recent catalyst headlines retrieved.";
  if (Array.isArray(newsData?.articles) && newsData.articles.length > 0) {
    newsSection = newsData.articles.slice(0, 4).map((a) =>
      `- **${a.title}** (${a.source || "Google News"}, ${a.pubDate ? new Date(a.pubDate).toLocaleDateString() : "Recent"})`
    ).join("\n");
  }

  let macroSection = "No immediate high-impact catalysts scheduled.";
  if (Array.isArray(macroData?.upcomingEvents) && macroData.upcomingEvents.length > 0) {
    macroSection = macroData.upcomingEvents.slice(0, 3).map((e) =>
      `- **${e.name || e.event}**: ${e.date || "Upcoming"} (${e.impact || "High"} Impact)`
    ).join("\n");
  }

  const noticeBadge = notice
    ? `> ⚠️ **Notice:** ${notice}\n\n`
    : `> 💡 **Notice:** *Analysis synthesized by DeltaHarvest's Edge Quantitative Engine using live real-time market feeds. To unlock unrestricted neural reasoning with Google Gemini 2.5 Flash, enter your Gemini API key via the 🔑 API Key button above or set \`GEMINI_API_KEY\` in Cloudflare Pages.*\n\n`;

  return `### 📊 ${ticker} Institutional Strategy Briefing (${lens})

**Executive Posture:** ${posture}
Spot Price: **$${spot}** (${changePct}) | 14-Day RSI: **${rsi}** (${rsiStance})

---

#### 📈 Key Quantitative Boundary Matrix
| Metric | Level | Cushion / Stance |
| :--- | :--- | :--- |
| **Spot Price** | **$${spot}** | Live Quote (Yahoo Finance) |
| **20-Day SMA** | $${sma20} | Cushion: ${sma20Buffer} |
| **50-Day SMA** | $${sma50} | Cushion: ${sma50Buffer} |
| **14-Day RSI** | ${rsi} | ${rsiStance} |
| **Bollinger Upper (2σ)** | $${upperBb} | Overhead Resistance Target |
| **Bollinger Lower (2σ)** | $${lowerBb} | Dynamic Volatility Floor |
| **Bandwidth (BBW)** | ${bbWidth} | Volatility Compression Index |

---

#### 🎯 Active Lens Assessment: ${lens}
${lensAnalysis}

#### 🛡️ Options Income Strategy Recommendations
- **Cash-Secured Put (CSP) Safe Zone:** Target strikes around **${cspStrike}**, strictly below technical support to maximize Probability of Expiring OTM (PoP > 75%).
- **Covered Call (CC) Resistance Anchor:** Target strikes around **${ccStrike}**, capitalizing on premium while avoiding premature stock assignment.

---

#### 🗞️ Recent Catalyst Radar & Macro Events
**Top News Headlines for ${ticker}:**
${newsSection}

**Upcoming Macro Catalysts:**
${macroSection}

---
${noticeBadge}`;
}

/**
 * Fallback execution pipeline when LLM is unconfigured or returns an error.
 */
async function executeAlgorithmicFallback({
  env,
  sessionId,
  activeLens,
  ticker,
  userMessage,
  sendData,
  writer,
  encoder,
  user,
  notice = "",
}) {
  const explicitTicker = extractTickerFromMessage(userMessage, null);
  const targetTicker = explicitTicker || ticker || "SPY";

  // Step 1: Run technical indicators tool
  await sendData({
    type: "tool",
    tool: "get_market_price_and_technicals",
    args: { symbol: targetTicker },
  });
  const techData = await executeAgentTool("get_market_price_and_technicals", { symbol: targetTicker }, env);
  await sendData({
    type: "tool_result",
    tool: "get_market_price_and_technicals",
    result: techData,
  });

  // Step 2: Run ticker news tool
  await sendData({
    type: "tool",
    tool: "get_ticker_news",
    args: { symbol: targetTicker },
  });
  const newsData = await executeAgentTool("get_ticker_news", { symbol: targetTicker }, env);
  await sendData({
    type: "tool_result",
    tool: "get_ticker_news",
    result: newsData,
  });

  // Step 3: Run macro calendar tool
  await sendData({
    type: "tool",
    tool: "get_macro_economic_calendar",
    args: {},
  });
  const macroData = await executeAgentTool("get_macro_economic_calendar", {}, env);
  await sendData({
    type: "tool_result",
    tool: "get_macro_economic_calendar",
    result: macroData,
  });

  // Step 4: Synthesize structured institutional strategy markdown
  const markdown = generateQuantitativeAnalysisReport({
    ticker: targetTicker,
    lens: activeLens,
    userQuery: userMessage,
    techData,
    newsData,
    macroData,
    notice,
  });

  // Stream in small progressive chunks
  const chunkSize = 32;
  for (let i = 0; i < markdown.length; i += chunkSize) {
    const chunk = markdown.slice(i, i + chunkSize);
    await sendData({ type: "delta", chunk });
  }

  // Persist assistant message in D1
  await saveMessage(env, user.id, sessionId, "assistant", markdown, activeLens);
  await sendData({ type: "done", sessionId, finished: true });
  await writer.write(encoder.encode("data: [DONE]\n\n"));
}

export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-gemini-api-key, x-api-key, x-llm-api-key",
      },
    });
  }

  // 1. Mandatory Session Authentication
  const auth = await authenticateRequest(context);
  if (!auth.authenticated) {
    return auth.response;
  }
  const user = auth.user;

  // 2. Rate Limiting (30 requests/minute per user)
  const rl = await checkRateLimit(context.env, `agent_chat_${user.id}`, 30, 60);
  if (!rl.allowed) {
    return buildRateLimitResponse(rl.retryAfter);
  }

  if (request.method === "GET") {
    return handleGet(context, user);
  } else if (request.method === "DELETE") {
    return handleDelete(context, user);
  } else if (request.method === "POST") {
    return handlePost(context, user);
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/agent/chat: List sessions or retrieve messages for a session
 */
async function handleGet(context, user) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Status check for configured API keys
  if (url.searchParams.get("action") === "key_status") {
    const activeKey = await resolveGeminiApiKey(env);
    const hasAnyKey = Boolean(
      activeKey ||
      env?.LLM_API_KEY ||
      env?.OPENAI_API_KEY ||
      env?.ANTHROPIC_API_KEY ||
      env?.DEEPSEEK_API_KEY
    );
    return new Response(
      JSON.stringify({
        configured: hasAnyKey,
        provider: hasAnyKey ? "gemini" : "algorithmic",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  }

  if (url.searchParams.get("action") === "playbooks") {
    return new Response(JSON.stringify({ playbooks: STRATEGY_PLAYBOOKS }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
    });
  }

  const sessionId = url.searchParams.get("sessionId");

  if (sessionId) {
    const messages = await getSessionMessages(env, user.id, sessionId);
    const session = await getOrCreateSession(env, user.id, sessionId);
    return new Response(JSON.stringify({ session, messages }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const sessions = await listUserSessions(env, user.id);
  return new Response(JSON.stringify({ sessions }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/**
 * DELETE /api/agent/chat?sessionId=...: Delete conversation session
 */
async function handleDelete(context, user) {
  const { request, env } = context;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await deleteUserSession(env, user.id, sessionId);
  return new Response(JSON.stringify({ success: true, deletedSessionId: sessionId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * POST /api/agent/chat: Run tool-calling loop & stream SSE response
 */
async function handlePost(context, user) {
  const { request, env } = context;
  const url = new URL(request.url);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Key storage action: Allows saving or clearing Gemini API key in D1 system_settings (Admin-only)
  if (url.searchParams.get("action") === "save_key" || body?.action === "save_key") {
    if (user.role?.toLowerCase() !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Administrator role required to configure global system keys." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const keyToSave = (body.apiKey || body.geminiApiKey || "").trim();
    if (env?.DB) {
      try {
        await env.DB.prepare(
          "CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
        ).run();
        if (keyToSave) {
          await env.DB.prepare(
            "INSERT INTO system_settings (key, value, updated_at) VALUES ('gemini_api_key', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP"
          ).bind(keyToSave).run();
        } else {
          await env.DB.prepare("DELETE FROM system_settings WHERE key = 'gemini_api_key'").run();
        }
      } catch (err) {
        console.warn("[Agent Chat] Failed to persist key in system_settings:", err);
      }
    }
    return new Response(JSON.stringify({ success: true, configured: Boolean(keyToSave) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sessionId: reqSessionId, ticker = "", message = "", lens: reqLens, playbook: reqPlaybook } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return new Response(JSON.stringify({ error: "Message content cannot be empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanMessage = message.trim();
  const cleanTicker = (ticker || "").trim().toUpperCase();
  const activeLens = VALID_LENSES.includes(reqLens) ? reqLens : "Trend/Momentum";

  // Multi-tier API key resolution
  const clientApiKey = (
    request.headers.get("x-gemini-api-key") ||
    request.headers.get("x-api-key") ||
    request.headers.get("x-llm-api-key") ||
    body.geminiApiKey ||
    body.apiKey ||
    ""
  ).trim();

  let effectiveEnv = { ...env };
  if (clientApiKey) {
    effectiveEnv.GEMINI_API_KEY = clientApiKey;
  }

  const resolvedGeminiKey = await resolveGeminiApiKey(effectiveEnv);
  if (resolvedGeminiKey) {
    effectiveEnv.GEMINI_API_KEY = resolvedGeminiKey;
  }

  const hasLLMProvider = Boolean(
    resolvedGeminiKey ||
    effectiveEnv.LLM_API_KEY ||
    effectiveEnv.OPENAI_API_KEY ||
    effectiveEnv.ANTHROPIC_API_KEY ||
    effectiveEnv.DEEPSEEK_API_KEY
  );

  // Get or initialize session
  const session = await getOrCreateSession(env, user.id, reqSessionId, cleanTicker, activeLens);
  const sessionId = session.id;

  // Persist user message
  await saveMessage(env, user.id, sessionId, "user", cleanMessage, activeLens);

  // Retrieve prior messages for conversation history (last 10)
  const priorMessages = await getSessionMessages(env, user.id, sessionId);
  const llmMessages = priorMessages.slice(-10).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Build System Prompt
  const explicitTicker = extractTickerFromMessage(cleanMessage, null);
  const targetTicker = explicitTicker || cleanTicker || session.ticker || "SPY";
  const systemPrompt = buildSystemPrompt(activeLens, targetTicker, reqPlaybook);

  // Set up SSE TransformStream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  async function sendData(payload) {
    const json = typeof payload === "string" ? payload : JSON.stringify(payload);
    await writer.write(encoder.encode(`data: ${json}\n\n`));
  }

  // Execute agent loop asynchronously
  (async () => {
    try {
      await sendData({
        type: "meta",
        sessionId,
        lens: activeLens,
        ticker: targetTicker,
      });

      // If no LLM key is provisioned anywhere, seamlessly execute algorithmic synthesis
      if (!hasLLMProvider) {
        await executeAlgorithmicFallback({
          env: effectiveEnv,
          sessionId,
          activeLens,
          ticker: targetTicker,
          userMessage: cleanMessage,
          sendData,
          writer,
          encoder,
          user,
        });
        return;
      }

      let iteration = 0;
      let finalResponseText = "";
      let workingMessages = [...llmMessages];

      while (iteration < 4) {
        iteration++;

        const response = await completeLLM({
          env: effectiveEnv,
          system: systemPrompt,
          messages: workingMessages,
          tools: AGENT_TOOLS,
          temperature: 0.2,
          maxTokens: 2048,
        });

        // Case 1: Tool Calls Requested
        if (response.toolCalls && response.toolCalls.length > 0) {
          // Push a single assistant turn containing all generated tool calls
          workingMessages.push({
            role: "assistant",
            content: response.text || "",
            tool_calls: response.toolCalls.map((tc) => ({
              id: tc.id,
              type: "function",
              function: {
                name: tc.name,
                arguments: typeof tc.arguments === "string"
                  ? tc.arguments
                  : JSON.stringify(tc.arguments || {}),
              },
            })),
          });

          // Execute each tool and append corresponding tool response
          for (const tc of response.toolCalls) {
            await sendData({
              type: "tool",
              tool: tc.name,
              args: typeof tc.arguments === "string"
                ? JSON.parse(tc.arguments || "{}")
                : tc.arguments,
            });

            const toolResult = await executeAgentTool(tc.name, tc.arguments, effectiveEnv);

            await sendData({
              type: "tool_result",
              tool: tc.name,
              result: toolResult,
            });

            workingMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              name: tc.name,
              content: JSON.stringify(toolResult),
            });
          }
          continue;
        }

        // Case 2: Final Text Response Ready
        finalResponseText = response.text || "No response generated.";
        break;
      }

      if (!finalResponseText) {
        finalResponseText = "Analysis concluded. No further details available.";
      }

      const chunkSize = 32;
      for (let i = 0; i < finalResponseText.length; i += chunkSize) {
        const chunk = finalResponseText.slice(i, i + chunkSize);
        await sendData({ type: "delta", chunk });
      }

      await saveMessage(env, user.id, sessionId, "assistant", finalResponseText, activeLens);
      await sendData({ type: "done", sessionId, finished: true });
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (err) {
      console.warn("[Agent Chat] LLM loop error, falling back to algorithmic synthesis:", err);
      try {
        await executeAlgorithmicFallback({
          env: effectiveEnv,
          sessionId,
          activeLens,
          ticker: targetTicker,
          userMessage: cleanMessage,
          sendData,
          writer,
          encoder,
          user,
          notice: `Primary AI model returned: "${err.message || 'Key configuration or rate limit notice'}". Analysis generated via Edge Quantitative Engine.`
        });
      } catch (fallbackErr) {
        console.error("[Agent Chat] Fallback also failed:", fallbackErr);
        await sendData({ type: "error", error: fallbackErr.message || "Strategy agent processing error." });
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
