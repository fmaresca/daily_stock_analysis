/**
 * discordNotifier.ts
 * Typed Discord Webhook dispatcher for DeltaHarvest options alerts.
 *
 * Features:
 *   - Strict URL validation (supports discord.com, ptb., canary., discordapp.com)
 *   - Dynamic embed colour: Emerald (CSP) · Cyan (CC) · Amber (Spread) · Rose (Condor)
 *   - Full OptionsAlertData → rich Discord Embed field mapping
 *   - HTTP 429 rate-limit retry with exponential back-off using Discord's retry_after
 *   - Typed return value with success flag, HTTP status, and diagnostic message
 */

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface OptionsAlertData {
  ticker: string;
  currentPrice: number;
  priceChangePct?: number;
  rsi?: number;
  ivRank?: number;
  /** Constrained to the four strategy types the UI supports. */
  strategy: 'Cash-Secured Put' | 'Covered Call' | 'Credit Spread' | 'Iron Condor';
  strikePrice: number;
  expirationDate: string;
  dte: number;
  premiumMid: number;
  annualizedReturnPct?: number;
  delta?: number;
  popPct?: number;
  breakEven?: number;
  notes?: string;
}

export interface DiscordDispatchResult {
  success: boolean;
  status: number;
  message?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const APP_URL = 'https://daily-stock-analysis-89j.pages.dev';

/**
 * Validates that a URL is a real Discord Webhook endpoint.
 * Accepts discord.com, discordapp.com, ptb.discord.com, canary.discord.com.
 */
const WEBHOOK_RE =
  /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;

/** Embed colours per strategy. */
const EMBED_COLORS: Record<OptionsAlertData['strategy'], number> = {
  'Cash-Secured Put': 0x10b981, // Emerald-500 → bullish / income
  'Covered Call':     0x06b6d4, // Cyan-500    → defensive call sale
  'Credit Spread':    0xf59e0b, // Amber-500   → neutral income
  'Iron Condor':      0xa855f7, // Purple-500  → range-bound premium
};

// ─── Core Dispatcher ─────────────────────────────────────────────────────────

/**
 * Formats and POSTs an options alert to a Discord Webhook.
 * Retries once on HTTP 429 using Discord's `retry_after` value.
 */
export async function sendDiscordAlert(
  webhookUrl: string,
  alert: OptionsAlertData
): Promise<DiscordDispatchResult> {
  // ── 1. URL validation ─────────────────────────────────────────────────────
  if (!WEBHOOK_RE.test(webhookUrl.trim())) {
    return {
      success: false,
      status: 400,
      message: 'Invalid Discord Webhook URL format.',
    };
  }

  // ── 2. Derived values ─────────────────────────────────────────────────────
  const embedColor = EMBED_COLORS[alert.strategy] ?? 0x10b981;
  const capitalRequired = alert.strikePrice * 100;
  const breakEvenPrice =
    alert.breakEven ??
    (alert.strategy === 'Cash-Secured Put'
      ? alert.strikePrice - alert.premiumMid
      : alert.strikePrice + alert.premiumMid);

  const priceLine =
    `$${alert.currentPrice.toFixed(2)}` +
    (alert.priceChangePct !== undefined
      ? ` (${alert.priceChangePct >= 0 ? '+' : ''}${alert.priceChangePct.toFixed(2)}%)`
      : '');

  const techLine = [
    `RSI(14): **${alert.rsi?.toFixed(1) ?? 'N/A'}**`,
    `IV Rank: **${alert.ivRank !== undefined ? `${alert.ivRank}%` : 'N/A'}**`,
  ].join('\n');

  const contractLine = [
    `Strike: **$${alert.strikePrice.toFixed(2)}**`,
    `Exp: **${alert.expirationDate}**`,
    `DTE: **${alert.dte} days**`,
  ].join('\n');

  const yieldLine = [
    `Mid Premium: **$${alert.premiumMid.toFixed(2)}**`,
    `Collateral: **$${capitalRequired.toLocaleString()}**`,
    `Ann. Return: **${alert.annualizedReturnPct?.toFixed(1) ?? 'N/A'}%**`,
  ].join('\n');

  const riskLine = [
    `Delta: **${alert.delta?.toFixed(2) ?? 'N/A'}**`,
    `POP: **${alert.popPct !== undefined ? `${alert.popPct.toFixed(1)}%` : 'N/A'}**`,
    `Break-Even: **$${breakEvenPrice.toFixed(2)}**`,
  ].join('\n');

  // ── 3. Assemble payload ───────────────────────────────────────────────────
  const payload = {
    username: 'DeltaHarvest Alerts',
    avatar_url: `${APP_URL}/icons/icon-192.png`,
    embeds: [
      {
        title: `📊 ${alert.ticker} — ${alert.strategy}`,
        description:
          alert.notes ??
          `System scanner triggered setup for **$${alert.ticker}** matching income criteria.`,
        url: `${APP_URL}/?ticker=${alert.ticker}`,
        color: embedColor,
        fields: [
          { name: 'Underlying Price',     value: priceLine,    inline: true },
          { name: 'Technicals / Vol',     value: techLine,     inline: true },
          { name: 'Strategy',             value: `**${alert.strategy}**`, inline: true },
          { name: 'Contract Specifications', value: contractLine, inline: true },
          { name: 'Yield Profile',        value: yieldLine,    inline: true },
          { name: 'Probabilities & Risk', value: riskLine,     inline: true },
        ],
        footer: {
          text: 'DeltaHarvest Quantitative Terminal',
          icon_url: `${APP_URL}/favicon.ico`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  // ── 4. Dispatch with 429 retry ────────────────────────────────────────────
  const dispatchOnce = () =>
    fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  try {
    let response = await dispatchOnce();

    // Discord rate-limit: retry once after the specified delay
    if (response.status === 429) {
      let retryAfterMs = 1000;
      try {
        const rl = await response.json() as { retry_after?: number };
        retryAfterMs = (rl.retry_after ?? 1) * 1000;
      } catch { /* swallow JSON parse errors */ }
      await new Promise<void>((resolve) => setTimeout(resolve, retryAfterMs));
      response = await dispatchOnce();
    }

    if (response.ok || response.status === 204) {
      return { success: true, status: response.status };
    }

    let errorText = '';
    try { errorText = await response.text(); } catch { /* ignore */ }
    return {
      success: false,
      status: response.status,
      message: `Discord API rejected payload: ${errorText}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      status: 500,
      message: `Network failure dispatching Discord webhook: ${msg}`,
    };
  }
}

// ─── localStorage key (shared with SocialShareToolbar) ───────────────────────

export const DISCORD_WEBHOOK_LS_KEY = 'dh_discord_webhook';
