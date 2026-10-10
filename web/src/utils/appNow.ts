/**
 * Single Clock Authority (Frontend) - DeltaHarvest
 *
 * Provides a unified, mockable, America/New_York (ET)-correct clock authority
 * across the entire application for all currency and expiration decisions.
 *
 * Rules:
 * - One clock: every "is this expired / is this current / which week" decision flows here.
 * - Test-mockable via setMockNow(iso) / resetNow().
 * - Timezone-correct: America/New_York via Intl (no manual offset math, no toISOString bugs).
 * - Expirations cutoff at 4:00 PM ET on expiration date (OCC holiday-adjusted).
 * - On weekends (and post-close Fridays), the trading week rolls to the upcoming Monday.
 */

import {
  isNyseHoliday,
  adjustExpirationForNyseHolidays,
  formatDateYMD,
} from './nyseHolidayCalendar.ts';

let mockNowDate: Date | null = null;

/**
 * Returns the current moment in time.
 * Overridden in tests via setMockNow().
 */
export function now(): Date {
  return mockNowDate ? new Date(mockNowDate.getTime()) : new Date();
}

/**
 * Freeze or mock the current moment (for testing).
 */
export function setMockNow(isoOrDate: string | Date): void {
  mockNowDate = typeof isoOrDate === 'string' ? new Date(isoOrDate) : new Date(isoOrDate.getTime());
}

/**
 * Reset the clock back to real system time.
 */
export function resetNow(): void {
  mockNowDate = null;
}

export interface DateTimePartsET {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  ymd: string; // YYYY-MM-DD
}

/**
 * Decomposes an instant into America/New_York (ET) wall-clock components using Intl.
 */
export function getPartsET(at: Date = now()): DateTimePartsET {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(at);
  let year = 0;
  let month = 0;
  let day = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let weekdayStr = 'Sun';

  for (const p of parts) {
    if (p.type === 'year') year = parseInt(p.value, 10);
    else if (p.type === 'month') month = parseInt(p.value, 10);
    else if (p.type === 'day') day = parseInt(p.value, 10);
    else if (p.type === 'hour') hours = parseInt(p.value, 10);
    else if (p.type === 'minute') minutes = parseInt(p.value, 10);
    else if (p.type === 'second') seconds = parseInt(p.value, 10);
    else if (p.type === 'weekday') weekdayStr = p.value;
  }

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = dayMap[weekdayStr] !== undefined ? dayMap[weekdayStr] : 0;
  const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { year, month, day, hours, minutes, seconds, dayOfWeek, ymd };
}

/**
 * Returns current Eastern Time as a Date object whose local time fields match ET.
 */
export function nowET(at: Date = now()): Date {
  const p = getPartsET(at);
  return new Date(p.year, p.month - 1, p.day, p.hours, p.minutes, p.seconds);
}

/**
 * Returns current calendar date in America/New_York as YYYY-MM-DD.
 */
export function todayET(at: Date = now()): string {
  return getPartsET(at).ymd;
}

/**
 * Parses diverse option expiration date formats into a standard Date object (at noon to avoid timezone shifts).
 */
export function parseOptionExpirationDate(expStr?: string): Date | null {
  if (!expStr || typeof expStr !== 'string') return null;
  const trimmed = expStr.trim();
  if (!trimmed || trimmed === 'N/A' || trimmed === '—') return null;

  // 1. ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // 2. US format: MM/DD/YYYY or MM/DD/YY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split('/').map(Number);
    let month = parts[0];
    let day = parts[1];
    let year = parts[2];
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // 3. OCC format: e.g. PANW260911P00327500 or AAPL 260911C00220000
  const occMatch = trimmed.match(/[A-Z]{1,6}(\d{2})(\d{2})(\d{2})[CP]/i);
  if (occMatch) {
    const year = 2000 + parseInt(occMatch[1], 10);
    const month = parseInt(occMatch[2], 10);
    const day = parseInt(occMatch[3], 10);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // 4. Embedded US date in string (e.g. "PANW 09/11/2026 327.50 P")
  const embeddedUs = trimmed.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (embeddedUs) {
    let month = parseInt(embeddedUs[1], 10);
    let day = parseInt(embeddedUs[2], 10);
    let year = parseInt(embeddedUs[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // 5. Embedded ISO date in string
  const embeddedIso = trimmed.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (embeddedIso) {
    let year = parseInt(embeddedIso[1], 10);
    let month = parseInt(embeddedIso[2], 10);
    let day = parseInt(embeddedIso[3], 10);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // 6. Fallback Date constructor
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
  }

  return null;
}

/**
 * Deterministically checks whether an option is expired.
 * Options stop trading at the 4:00 PM ET close on expiration day (OCC holiday-adjusted).
 * After 4:00 PM ET on the expiration day, the contract is dead.
 */
export function isExpiredOption(expiryInput?: string | Date | null, at: Date = now()): boolean {
  if (!expiryInput) return false;
  let parsedDate: Date | null = null;
  if (expiryInput instanceof Date) {
    parsedDate = expiryInput;
  } else {
    parsedDate = parseOptionExpirationDate(expiryInput);
  }
  if (!parsedDate || isNaN(parsedDate.getTime())) return false;

  // OCC Holiday Rule adjustment (e.g. Good Friday -> Thursday close)
  const { adjustedDate } = adjustExpirationForNyseHolidays(parsedDate);
  const expYmd = formatDateYMD(adjustedDate);

  const curET = getPartsET(at);

  // 1. Calendar date is past expiration day
  if (curET.ymd > expYmd) {
    return true;
  }

  // 2. Calendar date is before expiration day
  if (curET.ymd < expYmd) {
    return false;
  }

  // 3. Expiration day is today: cutoff is 4:00 PM (16:00:00) ET close
  const isPast4pmET = curET.hours > 16 || (curET.hours === 16 && (curET.minutes > 0 || curET.seconds > 0));
  return isPast4pmET;
}

/**
 * Checks if the US equity market is currently open for regular trading (9:30 AM - 4:00 PM ET).
 * Honors NYSE holidays and weekends.
 */
export function isMarketOpen(at: Date = now()): boolean {
  const p = getPartsET(at);
  // Weekends
  if (p.dayOfWeek === 0 || p.dayOfWeek === 6) return false;
  // NYSE Holiday
  if (isNyseHoliday(p.ymd).isHoliday) return false;
  // Regular trading hours: 9:30 AM ET to 4:00 PM ET
  const minuteOfDay = p.hours * 60 + p.minutes;
  return minuteOfDay >= 9 * 60 + 30 && minuteOfDay < 16 * 60;
}

/**
 * Returns the Monday YYYY-MM-DD of the current ET trading week.
 * On weekends (Saturday or Sunday) or Friday after 4:00 PM ET close,
 * rolls forward to the upcoming Monday ("current if in the new week" rule).
 */
export function startOfTradingWeekET(at: Date = now()): string {
  const p = getPartsET(at);
  const isAfterFridayClose = p.dayOfWeek === 5 && (p.hours > 16 || (p.hours === 16 && (p.minutes > 0 || p.seconds > 0)));

  let daysOffset = 0;
  if (p.dayOfWeek === 0) {
    daysOffset = 1; // Sunday -> upcoming Monday
  } else if (p.dayOfWeek === 6) {
    daysOffset = 2; // Saturday -> upcoming Monday
  } else if (isAfterFridayClose) {
    daysOffset = 3; // Friday after close -> upcoming Monday
  } else {
    daysOffset = -(p.dayOfWeek - 1); // Monday is 1 -> 0, Tue 2 -> -1, etc.
  }

  const targetDate = new Date(p.year, p.month - 1, p.day + daysOffset, 12, 0, 0);
  const mYear = targetDate.getFullYear();
  const mMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  const mDay = String(targetDate.getDate()).padStart(2, '0');
  return `${mYear}-${mMonth}-${mDay}`;
}
