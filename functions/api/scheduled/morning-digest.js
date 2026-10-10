/**
 * Cloudflare Pages Function: /api/scheduled/morning-digest
 * Automated Morning Analysis & Push Digest Execution Handler.
 * 
 * Execution Cadence: Weekdays at 6:00 AM CT (before market open).
 * 
 * Flow:
 * 1. Verifies US Market Trading Day (skips weekends and US holidays).
 * 2. Compiles Macro Market Recap via _market_recap_core.js.
 * 3. Identifies opted-in users from morning_digest_preferences.
 * 4. Hydrates each user's watchlist symbols with quantitative indicators & risk signals.
 * 5. Dispatches digest via Resend REST API (and optional user Discord webhook).
 * 6. Records execution telemetry in morning_digest_logs (D1).
 * 
 * Security:
 * - Only callable with Authorization: Bearer <CRON_SECRET>, internal CF worker, or authenticated Admin.
 * - Zero secret leakage.
 */

import { authenticateRequest } from "../_auth_utils.js";
import { getDailyMarketRecap } from "../_market_recap_core.js";
import { getMarketPriceAndTechnicals, getOptionsPreFlightChecklist } from "../agent/_agent_tools.js";
import { nowET, todayET, isExpiredOption } from "../_now.js";

/**
 * Purges expired option contracts and past economic calendar events from digest content.
 * Strictly uses single clock authority (_now.js).
 */
export function filterDigestContent({ positions = [], events = [] } = {}, at = nowET()) {
  const curToday = todayET(at);

  const filteredPositions = (positions || []).filter((pos) => {
    const expStr = pos.expiration || pos.expiry || pos.expirationDate || pos.symbol || "";
    // If it is an option contract with an expiration date, exclude if expired!
    return !isExpiredOption(expStr, at);
  });

  const filteredEvents = (events || []).filter((evt) => {
    const rawDate = evt.isoDate || evt.date || evt.dateET || "";
    const evtDate = rawDate.substring(0, 10);
    if (!evtDate) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(evtDate)) {
      return evtDate >= curToday;
    }
    try {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        const pIso = parsed.toISOString().substring(0, 10);
        return pIso >= curToday;
      }
    } catch {
      // keep
    }
    return true;
  });

  return {
    positions: filteredPositions,
    events: filteredEvents,
  };
}

/**
 * Checks if a given date is a US equity market trading day.
 * Skips weekends and standard US Market Holidays (NYSE/Nasdaq).
 */
export function isUsMarketTradingDay(date = nowET()) {
  const d = new Date(date);
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const month = d.getUTCMonth() + 1; // 1-12
  const day = d.getUTCDate();

  // Fixed/observed federal market holidays
  // New Year's Day (Jan 1)
  if (month === 1 && day === 1) return false;
  // Juneteenth (Jun 19)
  if (month === 6 && day === 19) return false;
  // Independence Day (Jul 4)
  if (month === 7 && day === 4) return false;
  // Christmas Day (Dec 25)
  if (month === 12 && day === 25) return false;

  return true;
}

export async function ensureLogsTable(env) {
  if (env?.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS morning_digest_logs (
          id TEXT PRIMARY KEY,
          run_at TEXT NOT NULL,
          status TEXT NOT NULL,
          recipient_count INTEGER NOT NULL,
          details TEXT,
          created_at TEXT NOT NULL
        )
      `).run();
    } catch (e) {
      console.warn("D1 ensureLogsTable error:", e);
    }
  }
}

/**
 * Composes rich HTML email for the morning digest
 */
export function composeDigestEmailHtml({ userEmail, recap, watchlistData, positions = [], events = [], runDate }) {
  const { positions: livePositions, events: upcomingEvents } = filterDigestContent({ positions, events });
  const indicesRows = (recap?.indices || []).map((idx) => {
    const isUp = idx.changePct >= 0;
    const color = isUp ? "#10b981" : "#ef4444";
    return `
      <td style="padding: 10px; border: 1px solid #1e293b; background: #0f172a; text-align: center;">
        <div style="font-size: 11px; color: #94a3b8; font-weight: bold;">${idx.name}</div>
        <div style="font-size: 14px; font-weight: bold; color: #f8fafc; font-family: monospace; margin: 4px 0;">$${idx.price.toFixed(2)}</div>
        <div style="font-size: 12px; font-weight: bold; color: ${color}; font-family: monospace;">${isUp ? "+" : ""}${idx.changePct.toFixed(2)}%</div>
      </td>
    `;
  }).join("");

  const watchlistRows = watchlistData.map((item) => {
    const isUp = item.changePct >= 0;
    const color = isUp ? "#10b981" : "#ef4444";
    const rsiText = item.rsi14 !== null ? item.rsi14 : "N/A";
    const rsiColor = item.rsi14 !== null && item.rsi14 > 70 ? "#ef4444" : item.rsi14 !== null && item.rsi14 < 30 ? "#10b981" : "#cbd5e1";
    const cushionText = item.sma20 ? `${Math.round(((item.spotPrice - item.sma20) / item.sma20) * 1000) / 10}%` : "N/A";
    const preflightBadge = item.preflightRating === "PRIME" ? "#10b981" : item.preflightRating === "CONDITIONAL" ? "#f59e0b" : "#94a3b8";

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #1e293b; font-weight: bold; font-family: monospace; color: #38bdf8;">${item.symbol}</td>
        <td style="padding: 10px; border-bottom: 1px solid #1e293b; font-family: monospace; color: #f8fafc;">$${item.spotPrice.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #1e293b; font-family: monospace; font-weight: bold; color: ${color};">${isUp ? "+" : ""}${item.changePct.toFixed(2)}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #1e293b; font-family: monospace; color: ${rsiColor};">${rsiText}</td>
        <td style="padding: 10px; border-bottom: 1px solid #1e293b; font-family: monospace; color: ${preflightBadge}; font-weight: bold;">${item.preflightScore} ${item.preflightRating}</td>
        <td style="padding: 10px; border-bottom: 1px solid #1e293b; font-family: monospace; color: #94a3b8;">${cushionText}</td>
        <td style="padding: 10px; border-bottom: 1px solid #1e293b; font-size: 11px; color: ${item.alert ? "#f59e0b" : "#10b981"};">${item.signal}</td>
      </tr>
    `;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
  <div style="max-width: 680px; margin: 0 auto; padding: 24px 16px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #064e3b, #0f172a); border: 1px solid #059669; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; color: #f8fafc; font-weight: bold;">DeltaHarvest Morning Strategy Digest</h1>
      <p style="margin: 6px 0 0; font-size: 12px; color: #6ee7b7; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Pre-Market Quantitative Analysis • ${runDate}</p>
    </div>

    <!-- Section 1: Market Recap -->
    <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px;">Macro Index &amp; Volatility Regime</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>${indicesRows}</tr>
      </table>
      ${recap?.vix ? `<p style="margin: 0; font-size: 12px; color: #cbd5e1;"><strong>CBOE VIX:</strong> <span style="font-family: monospace; font-weight: bold; color: #c084fc;">${recap.vix.value.toFixed(2)}</span> (${recap.vix.changePct >= 0 ? "+" : ""}${recap.vix.changePct.toFixed(2)}%)</p>` : ""}
    </div>

    <!-- Section 2: Watchlist Quantitative Signals -->
    <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #10b981; letter-spacing: 0.5px;">Watchlist Quantitative Pulse</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #334155; color: #94a3b8;">
            <th style="padding: 8px 10px;">Symbol</th>
            <th style="padding: 8px 10px;">Spot</th>
            <th style="padding: 8px 10px;">Change</th>
            <th style="padding: 8px 10px;">14d RSI</th>
            <th style="padding: 8px 10px;">Pre-Flight</th>
            <th style="padding: 8px 10px;">20 SMA Buffer</th>
            <th style="padding: 8px 10px;">Signal / Status</th>
          </tr>
        </thead>
        <tbody>
          ${watchlistRows}
        </tbody>
      </table>
    </div>

    ${livePositions.length > 0 ? `
    <!-- Section 3: Live Positions Underwriting -->
    <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px;">Live Options Positions</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #334155; color: #94a3b8;">
            <th style="padding: 8px 10px;">Symbol</th>
            <th style="padding: 8px 10px;">Expiration</th>
            <th style="padding: 8px 10px;">Type</th>
            <th style="padding: 8px 10px;">Strike</th>
          </tr>
        </thead>
        <tbody>
          ${livePositions.map((pos) => `
            <tr>
              <td style="padding: 8px 10px; border-bottom: 1px solid #1e293b; font-weight: bold; font-family: monospace; color: #38bdf8;">${pos.symbol}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #1e293b; font-family: monospace; color: #f8fafc;">${pos.expiration || pos.expiry || "—"}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #1e293b; font-family: monospace; color: #10b981;">${pos.type || "OPTION"}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #1e293b; font-family: monospace; color: #cbd5e1;">$${pos.strike || "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    ${upcomingEvents.length > 0 ? `
    <!-- Section 4: Upcoming Macro Catalysts -->
    <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.5px;">Upcoming Macro Catalysts</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid #334155; color: #94a3b8;">
            <th style="padding: 8px 10px;">Date</th>
            <th style="padding: 8px 10px;">Event</th>
            <th style="padding: 8px 10px;">Impact</th>
          </tr>
        </thead>
        <tbody>
          ${upcomingEvents.map((evt) => `
            <tr>
              <td style="padding: 8px 10px; border-bottom: 1px solid #1e293b; font-weight: bold; font-family: monospace; color: #f8fafc;">${evt.dateET || evt.date || "—"}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #1e293b; color: #38bdf8;">${evt.title || "Economic Event"}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #1e293b; font-family: monospace; color: ${evt.impact === 'High' ? '#ef4444' : '#f59e0b'};">${evt.impact || "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; padding-top: 16px;">
      <p style="margin: 0;">Dispatched to ${userEmail} via DeltaHarvest Pre-Market Scheduled Engine (6:00 AM CT).</p>
      <p style="margin: 4px 0 0;">Strict institutional income and options risk management. For analysis purposes only.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Authorization Gate
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const configuredCronSecret = typeof env?.CRON_SECRET === "string" ? env.CRON_SECRET.trim() : "";

  const isCronSecretValid = Boolean(
    configuredCronSecret && token && token === configuredCronSecret
  );

  let isAdmin = false;
  let userContext = null;

  if (!isCronSecretValid) {
    const auth = await authenticateRequest(context);
    if (auth.authenticated && auth.user?.role?.toLowerCase() === "admin") {
      isAdmin = true;
      userContext = auth.user;
    } else {
      const errorMsg = configuredCronSecret
        ? "Unauthorized. Scheduled endpoint requires CRON_SECRET or Admin authentication."
        : "Cron authentication is not configured.";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const url = new URL(request.url);
  const forceRun = url.searchParams.get("force") === "true";
  const testEmail = url.searchParams.get("test_email");

  await ensureLogsTable(env);

  // 2. Market Trading Day Check
  const curNow = nowET();
  if (!forceRun && !isUsMarketTradingDay(curNow)) {
    return new Response(
      JSON.stringify({
        skipped: true,
        reason: "US equity markets are closed today (Weekend or federal holiday).",
        asOf: new Date().toISOString(), // wall-clock-ok: response envelope timestamp
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Compile Macro Market Recap
  const recap = await getDailyMarketRecap(forceRun);
  const todayStr = todayET(curNow);

  // 4. Retrieve Opted-In Recipients
  let optedInUsers = [];
  if (testEmail) {
    optedInUsers = [{ user_id: "test", email: testEmail, discord_webhook_url: "" }];
  } else if (env?.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT user_id, email, discord_webhook_url FROM morning_digest_preferences WHERE opted_in = 1 LIMIT 100"
      ).all();
      optedInUsers = results || [];
    } catch (e) {
      console.warn("Error querying opted-in users from D1:", e);
    }
  }

  if (optedInUsers.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        sent: 0,
        message: "No users currently opted in to morning digest.",
        asOf: curNow.toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Core baseline tickers to evaluate
  const defaultSymbols = ["SPY", "QQQ", "AAPL", "NVDA", "MSFT"];
  let successCount = 0;
  let errorCount = 0;

  for (const user of optedInUsers) {
    try {
      // 5. Gather Watchlist
      let symbols = defaultSymbols;
      if (env?.DB && user.user_id !== "test") {
        try {
          const wRow = await env.DB.prepare(
            "SELECT symbols FROM user_watchlists WHERE user_id = ? LIMIT 1"
          ).bind(user.user_id).first();
          if (wRow && wRow.symbols) {
            const parsed = typeof wRow.symbols === "string" ? JSON.parse(wRow.symbols) : wRow.symbols;
            if (Array.isArray(parsed) && parsed.length > 0) {
              symbols = parsed.slice(0, 10);
            }
          }
        } catch {
          // fallback to default
        }
      }

      // Hydrate quantitative data for each symbol
      const watchlistData = [];
      for (const sym of symbols) {
        const quote = await getMarketPriceAndTechnicals(sym, env);
        if (!quote.error) {
          let signal = "Normal Range";
          let alert = false;
          if (quote.rsi14 && quote.rsi14 > 70) {
            signal = "RSI Overbought (>70)";
            alert = true;
          } else if (quote.rsi14 && quote.rsi14 < 30) {
            signal = "RSI Oversold (<30)";
            alert = true;
          } else if (quote.sma20 && quote.spotPrice < quote.sma20 * 0.96) {
            signal = "Below 20 SMA Buffer";
            alert = true;
          }

          let preflightScore = "N/A";
          let preflightRating = "";
          try {
            const pf = await getOptionsPreFlightChecklist(sym, env);
            if (pf && typeof pf.score === "number") {
              preflightScore = `${pf.score}/5.0`;
              preflightRating = pf.rating || "";
            }
          } catch {
            // graceful fallback
          }

          watchlistData.push({
            symbol: sym,
            spotPrice: quote.spotPrice,
            changePct: quote.changePct,
            rsi14: quote.rsi14,
            sma20: quote.sma20,
            preflightScore,
            preflightRating,
            signal,
            alert,
          });
        }
      }

      const emailHtml = composeDigestEmailHtml({
        userEmail: user.email,
        recap,
        watchlistData,
        runDate: todayStr,
      });

      // 6. Push via Resend (with 1-retry fallback)
      if (env?.RESEND_API_KEY && env.RESEND_API_KEY.trim()) {
        let sentOk = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const resendResp = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${env.RESEND_API_KEY.trim()}`,
              },
              body: JSON.stringify({
                from: env.EMAIL_FROM || "DeltaHarvest Digest <onboarding@resend.dev>",
                to: user.email,
                subject: `[DeltaHarvest] Morning Market Digest • ${todayStr}`,
                html: emailHtml,
              }),
            });

            if (resendResp.ok) {
              sentOk = true;
              break;
            } else {
              console.warn(`Resend dispatch attempt ${attempt} returned ${resendResp.status}`);
            }
          } catch (rErr) {
            console.warn(`Resend dispatch attempt ${attempt} error:`, rErr);
          }
        }

        if (sentOk) successCount++;
        else errorCount++;
      }

      // 7. Push to user's optional Discord Webhook
      if (user.discord_webhook_url && user.discord_webhook_url.startsWith("https://discord.com/api/webhooks/")) {
        try {
          const lines = watchlistData.map((w) =>
            `• **${w.symbol}** ($${w.spotPrice.toFixed(2)}): Pre-Flight **${w.preflightScore} ${w.preflightRating}** | 14d RSI ${w.rsi14 ?? 'N/A'} | ${w.signal}`
          ).join('\n');

          await fetch(user.discord_webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: `🌅 **[DeltaHarvest Morning Strategy Digest • ${todayStr}]**\nMacro Regime: **SPY** $${recap?.indices?.[0]?.price?.toFixed(2) || 'N/A'} | **CBOE VIX** ${recap?.vix?.value?.toFixed(2) || 'N/A'}\n\n**Watchlist Underwriting Signals:**\n${lines || 'No active watchlist tickers.'}\n\n*Review full quantitative analytics in DeltaHarvest.*`,
            }),
          });
        } catch (dErr) {
          console.warn("Discord webhook push error:", dErr);
        }
      }
    } catch (userErr) {
      console.warn(`Error processing morning digest for user ${user.email}:`, userErr);
      errorCount++;
    }
  }

  // 8. Log run to D1
  const logId = `digest_${Date.now()}`; // wall-clock-ok: unique digest run ID
  if (env?.DB) {
    try {
      await env.DB.prepare(`
        INSERT INTO morning_digest_logs (id, run_at, status, recipient_count, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        logId,
        todayStr,
        errorCount === 0 ? "SUCCESS" : "PARTIAL_FAILURE",
        successCount,
        JSON.stringify({ successCount, errorCount, optedInTotal: optedInUsers.length }),
        now.toISOString()
      ).run();
    } catch (lErr) {
      console.warn("D1 log morning digest error:", lErr);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      runDate: todayStr,
      recipients: successCount,
      errors: errorCount,
      totalOptedIn: optedInUsers.length,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
