/**
 * Setup Alerts with Market Regime Filter
 * ========================================
 * Brooks Price Action Methodology (Al Brooks, John Wiley & Sons)
 * 
 * Features:
 * 1. Regime Filter:
 *    - Long setups require SPX bull regime (or range with agreement).
 *    - Short setups require SPX bear regime.
 *    - Trading ranges block new breakout alerts.
 *    - Filter toggleable per direction.
 * 2. Deduplication & Cooldown:
 *    - Key = (ticker, setupType, signalBarDate). Never re-fires the same key.
 *    - Cooldown = no repeat alert for the same ticker + direction within N bars (default: 5).
 * 3. Observational Wording:
 *    - Strictly observational ("Pullback setup detected", never "buy now" or trade recommendation).
 * 4. Multi-Channel Dispatch:
 *    - Reuses existing Discord, browser, and email infrastructure.
 *    - Every payload carries: ticker, setup type, date, entry/stop/target, rationale, SPX/NDX regime, disclaimer.
 * 5. Quiet Hours:
 *    - Suppresses alerts outside 7:00 AM – 10:00 PM local (22:00 – 07:00).
 * 6. Single Clock Authority:
 *    - Uses web/src/utils/appNow.ts for ET-correct time anchoring.
 */

import type { PriceActionSetup, SetupType } from './detect.ts';
import type { MarketRegime } from './regime.ts';
import { now, getPartsET, todayET } from '../utils/appNow.ts';

export interface PriceActionAlertSettings {
  enabled: boolean;
  alertUniverse: 'WATCHLIST' | 'TOP_TICKERS' | 'CUSTOM';
  customTickers: string[];
  enabledSetups: Partial<Record<SetupType, boolean>>;
  // Regime Filter Toggles
  filterLongByRegime: boolean;
  filterShortByRegime: boolean;
  blockBreakoutsInRange: boolean;
  // Deduplication & Cooldown
  cooldownBars: number;
  // Notification Channels
  enableDiscord: boolean;
  discordWebhookUrl: string;
  enableBrowser: boolean;
  enableEmail: boolean;
  alertEmailAddress: string;
  // Quiet Hours
  respectQuietHours: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

export const DEFAULT_ALERT_SETTINGS: PriceActionAlertSettings = {
  enabled: false, // Opt-in
  alertUniverse: 'WATCHLIST',
  customTickers: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA'],
  enabledSetups: {
    H1: true,
    H2: true,
    L1: true,
    L2: true,
    BREAKOUT_BULL: true,
    BREAKOUT_BEAR: true,
    FAILED_BREAKOUT_REVERSAL: true,
    MAJOR_TREND_REVERSAL: true,
    DOUBLE_TOP: true,
    DOUBLE_BOTTOM: true,
  },
  filterLongByRegime: true,
  filterShortByRegime: true,
  blockBreakoutsInRange: true,
  cooldownBars: 5,
  enableDiscord: false,
  discordWebhookUrl: '',
  enableBrowser: false,
  enableEmail: false,
  alertEmailAddress: '',
  respectQuietHours: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export const ALERT_SETTINGS_STORAGE_KEY = 'deltaharvest_price_action_alert_settings';
export const ALERT_HISTORY_STORAGE_KEY = 'deltaharvest_price_action_alert_history';

export interface FormattedPriceActionAlert {
  key: string;
  ticker: string;
  setupType: SetupType;
  direction: 'BULL' | 'BEAR';
  signalBarDate: string;
  signalBarIndex: number;
  entryPrice: number;
  invalidationLevel: number;
  measuredMoveTarget?: number;
  rationale: string;
  regimeSummary: string;
  headline: string;
  body: string;
  disclaimer: string;
  timestamp: string;
}

export interface DispatchedAlertRecord {
  key: string;
  ticker: string;
  direction: 'BULL' | 'BEAR';
  signalBarDate: string;
  signalBarIndex: number;
  dispatchedAt: string;
}

/**
 * Builds the unique deduplication key for a setup alert.
 * Key = (ticker:setupType:signalBarDate)
 */
export function buildAlertKey(ticker: string, setup: PriceActionSetup): string {
  return `${ticker.trim().toUpperCase()}:${setup.type}:${setup.signalBarDate}`;
}

/**
 * Evaluates whether current time falls within configured quiet hours.
 * Uses Single Clock Authority (getPartsET).
 */
export function isWithinQuietHours(
  at: Date = now(),
  startStr = '22:00',
  endStr = '07:00'
): boolean {
  const parts = getPartsET(at);
  const curMinutes = parts.hours * 60 + parts.minutes;

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  if (startMinutes > endMinutes) {
    // Overnight interval (e.g. 22:00 to 07:00)
    return curMinutes >= startMinutes || curMinutes < endMinutes;
  } else {
    // Same-day interval
    return curMinutes >= startMinutes && curMinutes < endMinutes;
  }
}

/**
 * Evaluates whether a setup passes the market regime filter.
 * 
 * Rules:
 * - Long setups require SPX regime bull (or range with agreement).
 * - Short setups require SPX bear.
 * - "range" blocks new breakout alerts.
 * - The filter is toggleable per direction, never hardcoded on.
 */
export function filterSetupByRegime(
  setup: PriceActionSetup,
  regime: MarketRegime,
  settings: PriceActionAlertSettings = DEFAULT_ALERT_SETTINGS
): { allowed: boolean; reason: string } {
  // Check breakout filter in trading ranges
  const isBreakout = setup.type === 'BREAKOUT_BULL' || setup.type === 'BREAKOUT_BEAR';
  if (isBreakout && settings.blockBreakoutsInRange) {
    if (regime.spx.direction === 'RANGE' || regime.ndx.direction === 'RANGE') {
      return {
        allowed: false,
        reason: 'Suppressed: Trading range regime blocks new breakout alerts.',
      };
    }
  }

  // Bull / Long Setups
  if (setup.direction === 'BULL') {
    if (!settings.filterLongByRegime) {
      return { allowed: true, reason: 'Long regime filter disabled by user setting.' };
    }

    if (regime.spx.direction === 'BULL') {
      return { allowed: true, reason: 'SPX confirmed bull trend allows long setup.' };
    }

    if (regime.spx.direction === 'RANGE' && regime.agreement === 'AGREE') {
      return { allowed: true, reason: 'SPX trading range with index agreement allows long setup.' };
    }

    return {
      allowed: false,
      reason: `Suppressed: Long setups require SPX bull regime (or range with agreement). Current SPX: ${regime.spx.direction}, agreement: ${regime.agreement}.`,
    };
  }

  // Bear / Short Setups
  if (setup.direction === 'BEAR') {
    if (!settings.filterShortByRegime) {
      return { allowed: true, reason: 'Short regime filter disabled by user setting.' };
    }

    if (regime.spx.direction === 'BEAR') {
      return { allowed: true, reason: 'SPX confirmed bear trend allows short setup.' };
    }

    return {
      allowed: false,
      reason: `Suppressed: Short setups require SPX bear regime. Current SPX: ${regime.spx.direction}.`,
    };
  }

  return { allowed: true, reason: 'Allowed.' };
}

/**
 * Evaluates deduplication and cooldown guards for a candidate setup alert.
 */
export function evaluateDeduplicationAndCooldown(
  ticker: string,
  setup: PriceActionSetup,
  history: DispatchedAlertRecord[],
  cooldownBars = 5
): { allowed: boolean; reason: string } {
  const cleanTicker = ticker.trim().toUpperCase();
  const alertKey = buildAlertKey(cleanTicker, setup);

  // 1. Exact Key Deduplication: Never re-fire the same key
  const duplicate = history.find((h) => h.key === alertKey);
  if (duplicate) {
    return {
      allowed: false,
      reason: `Duplicate suppressed: Alert key ${alertKey} has already been dispatched.`,
    };
  }

  // 2. Directional Cooldown: No repeat alert for the same ticker + direction within N bars
  const recentSameDirection = history
    .filter((h) => h.ticker === cleanTicker && h.direction === setup.direction)
    .sort((a, b) => b.signalBarIndex - a.signalBarIndex);

  if (recentSameDirection.length > 0) {
    const lastDispatched = recentSameDirection[0];
    const barDistance = setup.signalBarIndex - lastDispatched.signalBarIndex;

    if (barDistance >= 0 && barDistance < cooldownBars) {
      return {
        allowed: false,
        reason: `Cooldown active: ${cleanTicker} ${setup.direction} alert dispatched ${barDistance} bar(s) ago (cooldown is ${cooldownBars} bars).`,
      };
    }
  }

  return { allowed: true, reason: 'Passed deduplication and cooldown checks.' };
}

/**
 * Formats a raw setup detection into a strictly observational alert payload.
 * No trade recommendations, "buy now", or financial advice.
 */
export function formatPriceActionAlert(
  ticker: string,
  setup: PriceActionSetup,
  regime: MarketRegime
): FormattedPriceActionAlert {
  const cleanTicker = ticker.trim().toUpperCase();
  const alertKey = buildAlertKey(cleanTicker, setup);
  const targetText = setup.measuredMoveTarget ? ` | Target: $${setup.measuredMoveTarget.toFixed(2)}` : '';

  const headline = `[Price Action Alert] ${cleanTicker}: ${setup.direction === 'BULL' ? 'Bullish' : 'Bearish'} ${setup.type} setup detected`;
  const body = `${setup.rationale}\nLevel: Entry ~$${setup.entryPrice.toFixed(2)} | Invalidation: $${setup.invalidationLevel.toFixed(2)}${targetText}\nRegime: ${regime.summary}`;
  const disclaimer = 'Not financial advice — pattern detection and market regime classifications are probabilistic.';

  return {
    key: alertKey,
    ticker: cleanTicker,
    setupType: setup.type,
    direction: setup.direction,
    signalBarDate: setup.signalBarDate,
    signalBarIndex: setup.signalBarIndex,
    entryPrice: setup.entryPrice,
    invalidationLevel: setup.invalidationLevel,
    measuredMoveTarget: setup.measuredMoveTarget,
    rationale: setup.rationale,
    regimeSummary: regime.summary,
    headline,
    body,
    disclaimer,
    timestamp: now().toISOString(),
  };
}

/**
 * Loads alert settings from storage.
 */
export function loadAlertSettings(): PriceActionAlertSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_ALERT_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(ALERT_SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[PriceActionAlerts] Failed to load alert settings:', err);
  }
  return DEFAULT_ALERT_SETTINGS;
}

/**
 * Saves alert settings to storage.
 */
export function saveAlertSettings(settings: PriceActionAlertSettings): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(ALERT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('[PriceActionAlerts] Failed to save alert settings:', err);
    }
  }
}

/**
 * Retrieves dispatched alert records from storage.
 */
export function getDispatchedAlertHistory(): DispatchedAlertRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(ALERT_HISTORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[PriceActionAlerts] Failed to read alert history:', err);
  }
  return [];
}

/**
 * Appends a dispatched alert record into storage.
 */
export function recordAlertDispatched(
  record: DispatchedAlertRecord,
  history: DispatchedAlertRecord[] = getDispatchedAlertHistory()
): DispatchedAlertRecord[] {
  const updated = [...history, record];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(ALERT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[PriceActionAlerts] Failed to record alert history:', err);
    }
  }
  return updated;
}

/**
 * Evaluates and filters candidate setups for alert dispatch.
 */
export function evaluateCandidateSetups(
  ticker: string,
  setups: PriceActionSetup[],
  regime: MarketRegime,
  settings: PriceActionAlertSettings = DEFAULT_ALERT_SETTINGS,
  history: DispatchedAlertRecord[] = getDispatchedAlertHistory(),
  at: Date = now()
): {
  approvedAlerts: FormattedPriceActionAlert[];
  suppressedList: { setup: PriceActionSetup; reason: string }[];
} {
  const approvedAlerts: FormattedPriceActionAlert[] = [];
  const suppressedList: { setup: PriceActionSetup; reason: string }[] = [];

  // 1. Quiet Hours check
  if (settings.respectQuietHours && isWithinQuietHours(at, settings.quietHoursStart, settings.quietHoursEnd)) {
    for (const setup of setups) {
      suppressedList.push({
        setup,
        reason: `Suppressed: Current time is within quiet hours (${settings.quietHoursStart} - ${settings.quietHoursEnd}).`,
      });
    }
    return { approvedAlerts, suppressedList };
  }

  for (const setup of setups) {
    // 2. Setup type preference
    if (settings.enabledSetups[setup.type] === false) {
      suppressedList.push({ setup, reason: `Suppressed: Setup type ${setup.type} disabled by user preferences.` });
      continue;
    }

    // 3. Regime Filter
    const regimeCheck = filterSetupByRegime(setup, regime, settings);
    if (!regimeCheck.allowed) {
      suppressedList.push({ setup, reason: regimeCheck.reason });
      continue;
    }

    // 4. Deduplication & Cooldown
    const dedupeCheck = evaluateDeduplicationAndCooldown(ticker, setup, history, settings.cooldownBars);
    if (!dedupeCheck.allowed) {
      suppressedList.push({ setup, reason: dedupeCheck.reason });
      continue;
    }

    // Passed all guards!
    approvedAlerts.push(formatPriceActionAlert(ticker, setup, regime));
  }

  return { approvedAlerts, suppressedList };
}

/**
 * Dispatches an approved alert through configured channels.
 * Custom dispatchers can be injected for testing.
 */
export async function dispatchPriceActionAlert(
  alert: FormattedPriceActionAlert,
  settings: PriceActionAlertSettings,
  dispatchers?: {
    discordDispatcher?: (webhookUrl: string, alert: FormattedPriceActionAlert) => Promise<boolean>;
    browserDispatcher?: (alert: FormattedPriceActionAlert) => Promise<boolean>;
    emailDispatcher?: (email: string, alert: FormattedPriceActionAlert) => Promise<boolean>;
  }
): Promise<{ discord: boolean; browser: boolean; email: boolean }> {
  const results = { discord: false, browser: false, email: false };

  // 1. Discord Webhook
  if (settings.enableDiscord && settings.discordWebhookUrl) {
    if (dispatchers?.discordDispatcher) {
      results.discord = await dispatchers.discordDispatcher(settings.discordWebhookUrl, alert);
    } else {
      try {
        const payload = {
          embeds: [
            {
              title: alert.headline,
              description: alert.body,
              color: alert.direction === 'BULL' ? 0x10b981 : 0xf43f5e,
              fields: [
                { name: 'Symbol', value: alert.ticker, inline: true },
                { name: 'Setup', value: alert.setupType, inline: true },
                { name: 'Date', value: alert.signalBarDate, inline: true },
                { name: 'Entry Price', value: `$${alert.entryPrice.toFixed(2)}`, inline: true },
                { name: 'Invalidation Stop', value: `$${alert.invalidationLevel.toFixed(2)}`, inline: true },
                {
                  name: 'Target (Measured Move)',
                  value: alert.measuredMoveTarget ? `$${alert.measuredMoveTarget.toFixed(2)}` : 'N/A',
                  inline: true,
                },
              ],
              footer: { text: alert.disclaimer },
              timestamp: alert.timestamp,
            },
          ],
        };
        const resp = await fetch(settings.discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        results.discord = resp.ok;
      } catch (err) {
        console.warn('[PriceActionAlerts] Discord dispatch failure:', err);
      }
    }
  }

  // 2. HTML5 Browser Push
  if (settings.enableBrowser) {
    if (dispatchers?.browserDispatcher) {
      results.browser = await dispatchers.browserDispatcher(alert);
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(alert.headline, {
          body: `${alert.rationale}\nEntry: $${alert.entryPrice.toFixed(2)} | Stop: $${alert.invalidationLevel.toFixed(2)}`,
        });
        results.browser = true;
      } catch (err) {
        console.warn('[PriceActionAlerts] Browser push failure:', err);
      }
    }
  }

  // 3. Email Dispatch via Server-Side Inquiry Middleware
  if (settings.enableEmail && settings.alertEmailAddress) {
    if (dispatchers?.emailDispatcher) {
      results.email = await dispatchers.emailDispatcher(settings.alertEmailAddress, alert);
    } else {
      try {
        const resp = await fetch('/api/admin/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'DeltaHarvest Price Action Alert',
            email: settings.alertEmailAddress,
            requestType: 'MAINTENANCE',
            message: `[${alert.headline}]\n\n${alert.body}\n\n${alert.disclaimer}`,
          }),
        });
        results.email = resp.ok;
      } catch (err) {
        console.warn('[PriceActionAlerts] Email dispatch failure:', err);
      }
    }
  }

  return results;
}
