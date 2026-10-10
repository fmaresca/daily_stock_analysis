/**
 * Option Expiration & Dynamic DTE Date Engine
 * 
 * Provides deterministic, real-time date-driven calculations for options expiration:
 * - Compares contract expiration dates against current market time (4:00 PM ET close).
 * - Accurately differentiates active contracts from expired contracts.
 * - Formats DTE with live day/date counters (e.g. "6d (09/18)", "Expired (09/11)").
 * - Fully powered by the central clock authority (appNow.ts).
 */

import {
  now,
  getPartsET,
  todayET,
  isExpiredOption,
  parseOptionExpirationDate,
} from './appNow.ts';
import { adjustExpirationForNyseHolidays, formatDateYMD } from './nyseHolidayCalendar.ts';

export { parseOptionExpirationDate };

export interface OptionExpirationStatus {
  isExpired: boolean;
  isToday: boolean;
  dte: number;
  calendarDaysRemaining: number;
  label: string;
  shortLabel: string;
  formattedExpiration: string;
  statusText: 'ACTIVE' | 'EXPIRING_TODAY' | 'EXPIRED';
  badgeColor: 'emerald' | 'amber' | 'rose' | 'slate';
}

/**
 * Calculates dynamic DTE and expiration status comparing the expiration cutoff against current time.
 * The official options expiration cutoff for trading decisions is Friday 4:00 PM Eastern Time.
 */
export function getOptionExpirationStatus(
  expStr?: string,
  fallbackDte: number = 0,
  referenceNow: Date = now()
): OptionExpirationStatus {
  const expDate = parseOptionExpirationDate(expStr);

  // If no parseable expiration date, fall back to provided static DTE
  if (!expDate) {
    if (fallbackDte < 0) {
      return {
        isExpired: true,
        isToday: false,
        dte: 0,
        calendarDaysRemaining: fallbackDte,
        label: `Expired (${Math.abs(fallbackDte)}d ago)`,
        shortLabel: 'Expired',
        formattedExpiration: expStr || 'N/A',
        statusText: 'EXPIRED',
        badgeColor: 'slate',
      };
    }
    return {
      isExpired: fallbackDte === 0,
      isToday: fallbackDte === 0,
      dte: fallbackDte,
      calendarDaysRemaining: fallbackDte,
      label: `${fallbackDte}d`,
      shortLabel: `${fallbackDte}d`,
      formattedExpiration: expStr || 'N/A',
      statusText: fallbackDte === 0 ? 'EXPIRING_TODAY' : 'ACTIVE',
      badgeColor: fallbackDte <= 5 ? 'amber' : 'emerald',
    };
  }

  // OCC Holiday adjustment
  const { adjustedDate } = adjustExpirationForNyseHolidays(expDate);
  const expYmd = formatDateYMD(adjustedDate);
  const [expYear, expMonthNum, expDayNum] = expYmd.split('-').map(Number);
  const formattedExp = `${String(expMonthNum).padStart(2, '0')}/${String(expDayNum).padStart(2, '0')}`;

  const curET = getPartsET(referenceNow);
  const curYmd = curET.ymd;

  // Calendar day calculation in ET: compute difference in days
  const curMidnightMs = Date.UTC(curET.year, curET.month - 1, curET.day);
  const expMidnightMs = Date.UTC(expYear, expMonthNum - 1, expDayNum);
  const calendarDiffDays = Math.round((expMidnightMs - curMidnightMs) / 86400000);

  const expired = isExpiredOption(expStr, referenceNow);

  // 1. Fully expired (past expiration date, or expiration date after 4:00 PM ET)
  if (expired) {
    const daysAgo = Math.max(1, Math.abs(calendarDiffDays));
    return {
      isExpired: true,
      isToday: curYmd === expYmd,
      dte: 0,
      calendarDaysRemaining: calendarDiffDays,
      label: `Expired (${formattedExp})`,
      shortLabel: 'Expired',
      formattedExpiration: formattedExp,
      statusText: 'EXPIRED',
      badgeColor: 'slate',
    };
  }

  // 2. Expiring today before 4:00 PM ET
  if (curYmd === expYmd) {
    return {
      isExpired: false,
      isToday: true,
      dte: 0,
      calendarDaysRemaining: 0,
      label: `0d (Expires Today ${formattedExp})`,
      shortLabel: '0d (Today)',
      formattedExpiration: formattedExp,
      statusText: 'EXPIRING_TODAY',
      badgeColor: 'rose',
    };
  }

  // 3. Active future expiration
  const activeDte = Math.max(1, calendarDiffDays);
  return {
    isExpired: false,
    isToday: false,
    dte: activeDte,
    calendarDaysRemaining: calendarDiffDays,
    label: `${activeDte}d (${formattedExp})`,
    shortLabel: `${activeDte}d`,
    formattedExpiration: formattedExp,
    statusText: 'ACTIVE',
    badgeColor: activeDte <= 5 ? 'amber' : 'emerald',
  };
}

/**
 * Quick boolean check if an option is expired.
 * Flows directly through the central clock authority.
 */
export function isOptionExpired(expStr?: string, fallbackDte?: number, referenceNow?: Date): boolean {
  if (expStr) {
    return isExpiredOption(expStr, referenceNow ?? now());
  }
  return getOptionExpirationStatus(expStr, fallbackDte, referenceNow).isExpired;
}
