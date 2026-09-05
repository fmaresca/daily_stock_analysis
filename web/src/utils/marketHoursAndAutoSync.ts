/**
 * Market Hours Detection & Automated Live Sync Rate-Limiting Engine
 *
 * Enforces anti-blocking rate limits and market-hours gating for real-time market syncs:
 * - Yahoo Finance unauthenticated endpoint threshold: ~2,000 reqs/hr (~30-35 reqs/min peak burst)
 * - Watchlist scale: ~21-30 tickers per sync cycle
 * - Recommended safe cadence: 5 minutes (252 reqs/hr = ~12.6% of rate limit)
 * - Fast day-trading cadence: 2 minutes (630 reqs/hr = ~31.5% of rate limit)
 * - Market hours: Monday - Friday, 9:30 AM - 4:00 PM US Eastern Time (ET)
 */

export type AutoSyncCadence = number;

export interface AutoSyncSettings {
  intervalSeconds: AutoSyncCadence; // 0 = disabled, 120 = 2m, 300 = 5m, 600 = 10m
  marketHoursOnly: boolean; // Pause outside 9:30 AM - 4:00 PM ET
}

export const AUTO_SYNC_STORAGE_KEY = 'deltaharvest_autosync_settings';

export const DEFAULT_AUTO_SYNC_SETTINGS: AutoSyncSettings = {
  intervalSeconds: 300, // 5 minutes default (Recommended safe rate)
  marketHoursOnly: true,
};

export interface RateLimitAnalysis {
  intervalSeconds: number;
  syncsPerHour: number;
  requestsPerHour: number;
  requestsPerDay: number;
  yahooHourlyQuotaEstimate: number;
  quotaUtilizationPct: number;
  safetyTier: 'ULTRA_SAFE' | 'RECOMMENDED' | 'ACTIVE_CAUTION' | 'DANGEROUS_BLOCK_RISK';
  recommendation: string;
}

export function loadAutoSyncSettings(): AutoSyncSettings {
  try {
    const raw = localStorage.getItem(AUTO_SYNC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.intervalSeconds === 'number' && typeof parsed.marketHoursOnly === 'boolean') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_AUTO_SYNC_SETTINGS;
}

export function saveAutoSyncSettings(settings: AutoSyncSettings): void {
  try {
    localStorage.setItem(AUTO_SYNC_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save auto-sync settings:', e);
  }
}

export function analyzeSyncRateLimits(
  intervalSeconds: number,
  tickerCount: number = 21,
  marketHoursPerDay: number = 6.5
): RateLimitAnalysis {
  if (intervalSeconds <= 0) {
    return {
      intervalSeconds: 0,
      syncsPerHour: 0,
      requestsPerHour: 0,
      requestsPerDay: 0,
      yahooHourlyQuotaEstimate: 2000,
      quotaUtilizationPct: 0,
      safetyTier: 'ULTRA_SAFE',
      recommendation: 'Manual sync only. Zero risk of API blocks.',
    };
  }

  const syncsPerHour = Math.floor(3600 / intervalSeconds);
  const requestsPerHour = syncsPerHour * tickerCount;
  const requestsPerDay = Math.round(requestsPerHour * marketHoursPerDay);
  const yahooHourlyQuotaEstimate = 2000;
  const quotaUtilizationPct = Math.round((requestsPerHour / yahooHourlyQuotaEstimate) * 1000) / 10;

  let safetyTier: RateLimitAnalysis['safetyTier'] = 'RECOMMENDED';
  let recommendation = '';

  if (intervalSeconds >= 600) {
    safetyTier = 'ULTRA_SAFE';
    recommendation = `Every 10 min: ${requestsPerHour} reqs/hr (~${quotaUtilizationPct}% of limit). 100% block-proof.`;
  } else if (intervalSeconds >= 300) {
    safetyTier = 'RECOMMENDED';
    recommendation = `Every 5 min: ${requestsPerHour} reqs/hr (~${quotaUtilizationPct}% of limit). Optimal balance of fresh Greeks and zero block risk.`;
  } else if (intervalSeconds >= 120) {
    safetyTier = 'ACTIVE_CAUTION';
    recommendation = `Every 2 min: ${requestsPerHour} reqs/hr (~${quotaUtilizationPct}% of limit). Safe during market hours; avoid running 24/7.`;
  } else {
    safetyTier = 'DANGEROUS_BLOCK_RISK';
    recommendation = `Sub-minute (${intervalSeconds}s): ${requestsPerHour} reqs/hr (~${quotaUtilizationPct}% of limit). HIGH RISK of HTTP 429 throttling and IP block.`;
  }

  return {
    intervalSeconds,
    syncsPerHour,
    requestsPerHour,
    requestsPerDay,
    yahooHourlyQuotaEstimate,
    quotaUtilizationPct,
    safetyTier,
    recommendation,
  };
}

export function getUsEasternTime(): {
  date: Date;
  dayOfWeek: number;
  hours: number;
  minutes: number;
  timeString: string;
  isWeekday: boolean;
} {
  const now = new Date();
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const etDate = new Date(etString);
  const dayOfWeek = etDate.getDay(); // 0 = Sun, 6 = Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const hours = etDate.getHours();
  const minutes = etDate.getMinutes();

  return {
    date: etDate,
    dayOfWeek,
    hours,
    minutes,
    timeString: etDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    isWeekday,
  };
}

export function isUsMarketOpen(): boolean {
  const et = getUsEasternTime();
  if (!et.isWeekday) return false;

  const currentMinutes = et.hours * 60 + et.minutes;
  const marketOpenMinutes = 9 * 60 + 30; // 9:30 AM ET = 570
  const marketCloseMinutes = 16 * 60; // 4:00 PM ET = 960

  return currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes;
}
