/**
 * Trading Week Resolution Utility
 *
 * Computes Mon-Fri bounds for the upcoming (or current in-progress) trading
 * week and the prior trading week, relative to today''s local date.
 *
 * Rules:
 *  - Mon-Fri today  -> current week is the in-progress week (Monday of this week)
 *  - Saturday       -> upcoming week starts next Monday
 *  - Sunday         -> upcoming week starts tomorrow (Monday)
 */

import type { EconomicIndicator } from '../types/economicCalendar.ts';
import { now, startOfTradingWeekET, todayET } from './appNow.ts';

export interface TradingWeek {
  monday: Date;
  friday: Date;
  monDateStr: string;
  tueDateStr: string;
  wedDateStr: string;
  thuDateStr: string;
  friDateStr: string;
  monShort: string;
  friShort: string;
  label: string;
  shortLabel: string;
  year: number;
  isoMonday: string;
  isoFriday: string;
}

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLabel(d: Date): string {
  return `${DAY_NAMES_SHORT[d.getDay()]}, ${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function formatMonthDay(d: Date): string {
  return `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/**
 * Resolves the calendar day-of-week and whether the current time is at or past
 * the Friday 16:00 ET (4:00 PM Eastern) close of regular US equity market trading.
 */
export function getEasternTradingState(from: Date = now()): {
  dow: number;
  isAfterFridayClose: boolean;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(from);
    let dowStr = '';
    let hours = 0;
    let minutes = 0;
    for (const p of parts) {
      if (p.type === 'weekday') dowStr = p.value;
      else if (p.type === 'hour') hours = parseInt(p.value, 10);
      else if (p.type === 'minute') minutes = parseInt(p.value, 10);
    }
    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const dow = dayMap[dowStr] !== undefined ? dayMap[dowStr] : from.getDay();
    const isAfterFridayClose = dow === 5 && (hours > 16 || (hours === 16 && minutes >= 0));
    return { dow, isAfterFridayClose };
  } catch {
    const dow = from.getDay();
    const isAfterFridayClose = dow === 5 && from.getHours() >= 16;
    return { dow, isAfterFridayClose };
  }
}

export function getMondayOfWeek(from: Date = now()): Date {
  const ymd = startOfTradingWeekET(from);
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function buildTradingWeek(monday: Date): TradingWeek {
  const fri = addDays(monday, 4);
  const tue = addDays(monday, 1);
  const wed = addDays(monday, 2);
  const thu = addDays(monday, 3);

  const monMonth = MONTH_NAMES_SHORT[monday.getMonth()];
  const friMonth = MONTH_NAMES_SHORT[fri.getMonth()];
  const year = fri.getFullYear();

  const label =
    monMonth === friMonth
      ? `${monMonth} ${monday.getDate()} \u2013 ${fri.getDate()}, ${year}`
      : `${monMonth} ${monday.getDate()} \u2013 ${friMonth} ${fri.getDate()}, ${year}`;

  const shortLabel =
    monMonth === friMonth
      ? `${monMonth} ${monday.getDate()} \u2013 ${fri.getDate()}`
      : `${monMonth} ${monday.getDate()} \u2013 ${friMonth} ${fri.getDate()}`;

  return {
    monday,
    friday: fri,
    monDateStr: formatDateLabel(monday),
    tueDateStr: formatDateLabel(tue),
    wedDateStr: formatDateLabel(wed),
    thuDateStr: formatDateLabel(thu),
    friDateStr: formatDateLabel(fri),
    monShort: formatMonthDay(monday),
    friShort: formatMonthDay(fri),
    label,
    shortLabel,
    year,
    isoMonday: formatDateYMD(monday),
    isoFriday: formatDateYMD(fri),
  };
}

/**
 * Returns the current in-progress Mon-Fri trading week (if today is Mon-Fri)
 * or the upcoming Mon-Fri trading week (if today is Sat/Sun).
 */
export function getUpcomingTradingWeek(from: Date = now()): TradingWeek {
  return buildTradingWeek(getMondayOfWeek(from));
}

/**
 * Returns the prior Mon-Fri trading week (always 7 days before the upcoming Monday).
 */
export function getPriorTradingWeek(from: Date = now()): TradingWeek {
  const upcomingMonday = getMondayOfWeek(from);
  return buildTradingWeek(addDays(upcomingMonday, -7));
}

// Day-of-week index (1=Mon...5=Fri) -> offset from Monday
const DOW_TO_OFFSET: Record<number, number> = {
  1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 4, 0: 0,
};

/**
 * Re-anchors a static fallback schedule onto a resolved TradingWeek by mapping
 * each event''s original day-of-week to the corresponding date in the target week.
 * Preserves time-of-day and timezone from the original isoDate.
 */
export function reanchorScheduleToWeek(
  schedule: EconomicIndicator[],
  week: TradingWeek,
): EconomicIndicator[] {
  return schedule.map((event) => {
    try {
      const orig = new Date(event.isoDate);
      if (isNaN(orig.getTime())) return event;
      const offset = DOW_TO_OFFSET[orig.getDay()] ?? 0;
      const targetDate = addDays(week.monday, offset);
      const timePart = event.isoDate.substring(10);
      return {
        ...event,
        isoDate: formatDateYMD(targetDate) + timePart,
        dateET: formatDateLabel(targetDate),
      };
    } catch {
      return event;
    }
  });
}
