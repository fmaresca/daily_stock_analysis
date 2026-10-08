/**
 * Cloudflare Pages Function: /api/agent/chat
 * Conversational Strategy Q&A Agent ("Ask about any stock")
 *
 * Supports:
 * - POST: SSE Streaming chat execution with server-side tool calling loop
 * - GET: List user chat sessions or retrieve messages for a specific session
 * - DELETE: Delete a conversation session (strictly tenant-scoped)
 *
 * Strict Security:
 * - Session authentication required (401 if unauthenticated)
 * - Rate-limited per user
 * - Tenant isolation: WHERE user_id = <session.id>
 * - Secrets strictly server-side
 * - Tool-only numerical facts (zero hallucinations)
 *
 * FIX (2026-10-08): SSE format corrected — all events use raw `data: {...}\n\n`
 * lines (no `event:` prefix) to match the frontend's EventSource/fetch-stream
 * parser. Also fixed Gemini tool-call conversation history format.
 */

import { authenticateRequest } from "../_auth_utils.js";
import { checkRateLimit, buildRateLimitResponse } from "../_rate_limit.js";
import { completeLLM } from "../_llm.js";
import {
  getOrCreateSession,
  listUserSessions,
  getSessionMessages,
  saveMessage,
  deleteUserSession,
} from "./_agent_db.js";
import { AGENT_TOOLS, executeAgentTool } from "./_agent_tools.js";

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

function buildSystemPrompt(activeLens, tickerContext) {
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

### CRITICAL RULES & CITATION MANDATE
1. NEVER INVENT OR GUESS NUMBERS. Every price, moving average, RSI, yield, or sentiment metric you state MUST come directly from a tool call (e.g. get_market_price_and_technicals, get_market_sentiment).
2. Always cite the exact source of figures inline: e.g. "Spot price $124.50 (Yahoo)", "RSI 68.2 (14d)", "20-day SMA $118.40", "Reddit sentiment score +0.45 (Adanos)".
3. If a tool returns an error or is unconfigured, state the unavailability transparently rather than guessing.
4. Answer concisely with clear institutional formatting (markdown headings, bullet points, quantitative takeaways).
5. Always begin or end your analysis explicitly noting the lens used, and encourage the user to compare alternative lenses if appropriate.
${tickerContext ? `Currently focused ticker context: ${tickerContext}` : ""}`;
}

export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
 *
 * SSE FORMAT (corrected):
 *   All messages use raw `data: <json>\n\n` — no `event:` prefix lines.
 *   The frontend parser only reads `data:` lines; named events were silently dropped.
 *
 * Client-side distinguishes message types via the `type` field inside the JSON payload:
 *   { type: "meta",        sessionId, lens, ticker }
 *   { type: "tool",        tool: <name>, args: <obj> }
 *   { type: "tool_result", tool: <name>, result: <obj> }
 *   { type: "delta",       chunk: <string> }
 *   { type: "done",        sessionId, finished: true }
 *   { type: "error",       error: <string> }
 *   Literal string "data: [DONE]\n\n" signals stream end.
 */
async function handlePost(context, user) {
  const { request, env } = context;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sessionId: reqSessionId, ticker = "", message = "", lens: reqLens } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return new Response(JSON.stringify({ error: "Message content cannot be empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanMessage = message.trim();
  const cleanTicker = (ticker || "").trim().toUpperCase();
  const activeLens = VALID_LENSES.includes(reqLens) ? reqLens : "Trend/Momentum";

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
  const systemPrompt = buildSystemPrompt(activeLens, cleanTicker || session.ticker);

  // Set up SSE TransformStream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  /**
   * Send a raw `data: <json>\n\n` SSE line.
   * No `event:` prefix — matches frontend parser which only checks `data:` lines.
   */
  async function sendData(payload) {
    const json = typeof payload === "string" ? payload : JSON.stringify(payload);
    await writer.write(encoder.encode(`data: ${json}\n\n`));
  }

  // Execute agent tool-calling loop asynchronously (non-blocking return)
  (async () => {
    try {
      await sendData({
        type: "meta",
        sessionId,
        lens: activeLens,
        ticker: cleanTicker || session.ticker,
      });

      let iteration = 0;
      let finalResponseText = "";
      // Working messages are OpenAI-format; provider adapters translate for Gemini/Anthropic
      let workingMessages = [...llmMessages];

      while (iteration < 4) {
        iteration++;

        const response = await completeLLM({
          env,
          system: systemPrompt,
          messages: workingMessages,
          tools: AGENT_TOOLS,
          temperature: 0.2,
          maxTokens: 2048,
        });

        // Case 1: Tool Calls Requested
        if (response.toolCalls && response.toolCalls.length > 0) {
          for (const tc of response.toolCalls) {
            // Notify frontend which tool is running
            await sendData({
              type: "tool",
              tool: tc.name,
              args: typeof tc.arguments === "string"
                ? JSON.parse(tc.arguments || "{}")
                : tc.arguments,
            });

            // Execute the tool
            const toolResult = await executeAgentTool(tc.name, tc.arguments, env);

            await sendData({
              type: "tool_result",
              tool: tc.name,
              result: toolResult,
            });

            // Append to working messages in OpenAI format
            // (completeLLM adapters handle translation per provider)
            workingMessages.push({
              role: "assistant",
              content: response.text || null,
              tool_calls: [{
                id: tc.id,
                type: "function",
                function: {
                  name: tc.name,
                  arguments: typeof tc.arguments === "string"
                    ? tc.arguments
                    : JSON.stringify(tc.arguments || {}),
                },
              }],
            });

            workingMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              name: tc.name,
              content: JSON.stringify(toolResult),
            });
          }
          // Loop continues to next iteration with tool outputs in conversation
          continue;
        }

        // Case 2: Final Text Response Ready
        finalResponseText = response.text || "No response generated.";
        break;
      }

      if (!finalResponseText) {
        finalResponseText = "Analysis concluded. No further details available.";
      }

      // Stream text in small chunks for progressive rendering
      const chunkSize = 32;
      for (let i = 0; i < finalResponseText.length; i += chunkSize) {
        const chunk = finalResponseText.slice(i, i + chunkSize);
        await sendData({ type: "delta", chunk });
      }

      // Persist assistant message in D1
      await saveMessage(env, user.id, sessionId, "assistant", finalResponseText, activeLens);

      await sendData({ type: "done", sessionId, finished: true });
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (err) {
      console.error("[Agent Chat] Execution error:", err);
      await sendData({ type: "error", error: err.message || "Strategy agent processing error." });
      await writer.write(encoder.encode("data: [DONE]\n\n"));
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
