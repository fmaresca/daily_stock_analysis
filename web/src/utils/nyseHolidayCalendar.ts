/**
 * NYSE Trading Holiday Calendar & Options Expiration Calculation Engine
 *
 * Implements:
 * 1. Full official NYSE/CBOE/OCC Holiday Schedule (Rule 7.2)
 * 2. Algorithmic Good Friday computation via Meeus/Jones/Butcher algorithm
 * 3. US Options Clearing Corporation (OCC Rule 1106) expiration adjustment:
 *    - When the scheduled Friday expiration is an exchange holiday,
 *      the expiration date moves to the preceding business day (Thursday).
 * 4. Closest-Friday snap on or after DTE target periods (14 DTE, 30 DTE, 45 DTE).
 * 5. Timezone-safe local date formatting and parsing (never uses toISOString which shifts evening US dates to next day).
 */

export interface NyseHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface ExpirationOptionResult {
  dateString: string; // YYYY-MM-DD
  dte: number;
  dayOfWeekName: string;
  isFriday: boolean;
  wasHolidayAdjusted: boolean;
  holidayName?: string;
  displayLabel: string;
}

/**
 * Format a Date to 'YYYY-MM-DD' using local date components.
 * Completely avoids UTC day-flip bugs caused by toISOString().
 */
export function formatDateYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses 'YYYY-MM-DD' at noon (12:00:00) local time to prevent DST/timezone shifts.
 */
export function parseDateYMD(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const fallback = new Date();
    fallback.setHours(12, 0, 0, 0);
    return fallback;
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 12, 0, 0, 0);
}

/**
 * Computes Easter Sunday for any year using Meeus/Jones/Butcher algorithm.
 */
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Good Friday is the Friday immediately preceding Easter Sunday (Easter - 2 days).
 */
export function getGoodFriday(year: number): Date {
  const easter = getEasterSunday(year);
  const gf = new Date(easter);
  gf.setDate(gf.getDate() - 2);
  return gf;
}

/**
 * Finds the nth occurrence of a specific weekday in a given month.
 * e.g., 3rd Monday in January (MLK Day).
 * weekday: 0 = Sun, 1 = Mon, ..., 6 = Sat
 */
function getNthWeekdayOfMonth(year: number, monthZeroIndexed: number, weekday: number, n: number): Date {
  const d = new Date(year, monthZeroIndexed, 1, 12, 0, 0, 0);
  let count = 0;
  while (d.getMonth() === monthZeroIndexed) {
    if (d.getDay() === weekday) {
      count++;
      if (count === n) {
        return new Date(d);
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return new Date(year, monthZeroIndexed, 1, 12, 0, 0, 0);
}

/**
 * Finds the last occurrence of a specific weekday in a given month.
 * e.g., Last Monday in May (Memorial Day).
 */
function getLastWeekdayOfMonth(year: number, monthZeroIndexed: number, weekday: number): Date {
  const d = new Date(year, monthZeroIndexed + 1, 0, 12, 0, 0, 0); // Last day of month
  while (d.getDay() !== weekday) {
    d.setDate(d.getDate() - 1);
  }
  return new Date(d);
}

/**
 * Returns a map of YYYY-MM-DD -> Holiday Name for a given calendar year.
 * Complies with NYSE Rule 7.2.
 */
export function getNyseHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();

  // 1. New Year's Day (Jan 1)
  // If Jan 1 is Sunday, observed Monday Jan 2.
  // If Jan 1 is Saturday, NYSE does not observe Friday Dec 31 unless special proclamation.
  const nyd = new Date(year, 0, 1, 12, 0, 0, 0);
  if (nyd.getDay() === 0) {
    // Sunday -> Monday Jan 2
    holidays.set(formatDateYMD(new Date(year, 0, 2, 12, 0, 0, 0)), "New Year's Day (Observed)");
  } else if (nyd.getDay() !== 6) {
    holidays.set(formatDateYMD(nyd), "New Year's Day");
  }

  // Check if upcoming year's Jan 1 is Saturday, in which case Dec 31 of this year might be observed
  // Note: Standard NYSE rule does not observe Dec 31 if Jan 1 is Saturday.

  // 2. Martin Luther King, Jr. Day (Third Monday in January)
  const mlk = getNthWeekdayOfMonth(year, 0, 1, 3);
  holidays.set(formatDateYMD(mlk), 'Martin Luther King, Jr. Day');

  // 3. Washington's Birthday / Presidents' Day (Third Monday in February)
  const presDay = getNthWeekdayOfMonth(year, 1, 1, 3);
  holidays.set(formatDateYMD(presDay), "Washington's Birthday (Presidents' Day)");

  // 4. Good Friday (Friday before Easter) - ALWAYS on a Friday
  const goodFriday = getGoodFriday(year);
  holidays.set(formatDateYMD(goodFriday), 'Good Friday');

  // 5. Memorial Day (Last Monday in May)
  const memDay = getLastWeekdayOfMonth(year, 4, 1);
  holidays.set(formatDateYMD(memDay), 'Memorial Day');

  // 6. Juneteenth National Independence Day (June 19)
  // If Sunday -> Monday June 20; If Saturday -> Friday June 18
  const june19 = new Date(year, 5, 19, 12, 0, 0, 0);
  if (june19.getDay() === 0) {
    holidays.set(formatDateYMD(new Date(year, 5, 20, 12, 0, 0, 0)), 'Juneteenth (Observed)');
  } else if (june19.getDay() === 6) {
    holidays.set(formatDateYMD(new Date(year, 5, 18, 12, 0, 0, 0)), 'Juneteenth (Observed)');
  } else {
    holidays.set(formatDateYMD(june19), 'Juneteenth National Independence Day');
  }

  // 7. Independence Day (July 4)
  // If Sunday -> Monday July 5; If Saturday -> Friday July 3
  const july4 = new Date(year, 6, 4, 12, 0, 0, 0);
  if (july4.getDay() === 0) {
    holidays.set(formatDateYMD(new Date(year, 6, 5, 12, 0, 0, 0)), 'Independence Day (Observed)');
  } else if (july4.getDay() === 6) {
    holidays.set(formatDateYMD(new Date(year, 6, 3, 12, 0, 0, 0)), 'Independence Day (Observed)');
  } else {
    holidays.set(formatDateYMD(july4), 'Independence Day');
  }

  // 8. Labor Day (First Monday in September)
  const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1);
  holidays.set(formatDateYMD(laborDay), 'Labor Day');

  // 9. Thanksgiving Day (Fourth Thursday in November)
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4);
  holidays.set(formatDateYMD(thanksgiving), 'Thanksgiving Day');

  // 10. Christmas Day (December 25)
  // If Sunday -> Monday Dec 26; If Saturday -> Friday Dec 24
  const xmas = new Date(year, 11, 25, 12, 0, 0, 0);
  if (xmas.getDay() === 0) {
    holidays.set(formatDateYMD(new Date(year, 11, 26, 12, 0, 0, 0)), 'Christmas Day (Observed)');
  } else if (xmas.getDay() === 6) {
    holidays.set(formatDateYMD(new Date(year, 11, 24, 12, 0, 0, 0)), 'Christmas Day (Observed)');
  } else {
    holidays.set(formatDateYMD(xmas), 'Christmas Day');
  }

  return holidays;
}

/**
 * Checks if a specific date is a NYSE holiday.
 */
export function isNyseHoliday(date: Date | string): { isHoliday: boolean; holidayName?: string } {
  const d = typeof date === 'string' ? parseDateYMD(date) : date;
  const year = d.getFullYear();
  const ymd = formatDateYMD(d);

  const holidays = getNyseHolidays(year);
  if (holidays.has(ymd)) {
    return { isHoliday: true, holidayName: holidays.get(ymd) };
  }
  return { isHoliday: false };
}

/**
 * Checks if a date is an open NYSE trading day (weekday and not a holiday).
 */
export function isNyseTradingDay(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseDateYMD(date) : date;
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  return !isNyseHoliday(d).isHoliday;
}

/**
 * OCC Expiration Holiday Adjustment:
 * If an options expiration falls on a weekend or NYSE holiday,
 * moves backward to the preceding trading day (normally Thursday).
 */
export function adjustExpirationForNyseHolidays(targetDate: Date): {
  adjustedDate: Date;
  wasHolidayAdjusted: boolean;
  originalDate: Date;
  holidayName?: string;
} {
  const original = new Date(targetDate);
  const current = new Date(targetDate);
  current.setHours(12, 0, 0, 0);

  let wasHolidayAdjusted = false;
  let encounteredHoliday: string | undefined;

  // If initial day is a weekend or holiday, step backwards
  while (true) {
    const day = current.getDay();
    const holidayCheck = isNyseHoliday(current);

    if (day === 0 || day === 6) {
      // Weekend: step back
      current.setDate(current.getDate() - 1);
      continue;
    }

    if (holidayCheck.isHoliday) {
      wasHolidayAdjusted = true;
      encounteredHoliday = holidayCheck.holidayName;
      current.setDate(current.getDate() - 1);
      continue;
    }

    // Found valid trading day
    break;
  }

  return {
    adjustedDate: current,
    wasHolidayAdjusted,
    originalDate: original,
    holidayName: encounteredHoliday,
  };
}

/**
 * Calculates DTE (days to expiration) between now and expiration date,
 * based on local noon time to eliminate any timezone or hour-of-day offsets.
 */
export function calculateOptionsDte(expirationDateStr: string, fromDate?: Date): number {
  if (!expirationDateStr) return 5;
  const exp = parseDateYMD(expirationDateStr);
  const now = fromDate ? new Date(fromDate) : new Date();
  now.setHours(12, 0, 0, 0);
  exp.setHours(12, 0, 0, 0);

  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  return Math.max(0, diffDays);
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns the next weekly options expiration (standard Friday, or Thursday if Good Friday / Holiday).
 */
export function getNextWeeklyExpiration(fromDate?: Date): ExpirationOptionResult {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setHours(12, 0, 0, 0);

  const day = base.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  let daysToFriday: number;

  if (day === 5) {
    // If today is Friday:
    // If current time is after market hours (e.g. >= 16:00), or for simulation, next weekly is next Friday (+7).
    // During weekend/evening simulation, advance to next Friday (+7).
    const currentHour = (fromDate || new Date()).getHours();
    daysToFriday = currentHour >= 16 ? 7 : 0;
  } else if (day === 6) {
    // Saturday -> next Friday is 6 days away
    daysToFriday = 6;
  } else {
    // Sunday (0) -> 5 days, Mon (1) -> 4 days, etc.
    daysToFriday = (5 - day + 7) % 7;
  }

  const targetFriday = new Date(base);
  targetFriday.setDate(targetFriday.getDate() + daysToFriday);

  const { adjustedDate, wasHolidayAdjusted, holidayName } = adjustExpirationForNyseHolidays(targetFriday);
  const dateString = formatDateYMD(adjustedDate);
  const dte = calculateOptionsDte(dateString, base);
  const dayOfWeekName = WEEKDAY_NAMES[adjustedDate.getDay()];

  const displayLabel = wasHolidayAdjusted
    ? `${dateString} (${dayOfWeekName} - Adjusted for ${holidayName})`
    : `${dateString} (${dayOfWeekName})`;

  return {
    dateString,
    dte,
    dayOfWeekName,
    isFriday: adjustedDate.getDay() === 5,
    wasHolidayAdjusted,
    holidayName,
    displayLabel,
  };
}

/**
 * Snaps to the closest Friday on or after a target DTE period (e.g., 14, 30, 45 DTE),
 * and applies the NYSE holiday calendar to adjust to Thursday if Friday is an exchange holiday.
 */
export function getClosestFridayDteExpiration(targetDte: number, fromDate?: Date): ExpirationOptionResult {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setHours(12, 0, 0, 0);

  // Target date after DTE days
  const targetDate = new Date(base);
  targetDate.setDate(targetDate.getDate() + targetDte);

  // Find closest Friday on or after the DTE period
  const day = targetDate.getDay();
  const daysToFriday = (5 - day + 7) % 7;
  targetDate.setDate(targetDate.getDate() + daysToFriday);

  // Apply NYSE holiday adjustment (e.g., Good Friday -> Thursday)
  const { adjustedDate, wasHolidayAdjusted, holidayName } = adjustExpirationForNyseHolidays(targetDate);
  const dateString = formatDateYMD(adjustedDate);
  const dte = calculateOptionsDte(dateString, base);
  const dayOfWeekName = WEEKDAY_NAMES[adjustedDate.getDay()];

  const displayLabel = wasHolidayAdjusted
    ? `${dateString} (${dayOfWeekName} - Adjusted for ${holidayName})`
    : `${dateString} (${dayOfWeekName})`;

  return {
    dateString,
    dte,
    dayOfWeekName,
    isFriday: adjustedDate.getDay() === 5,
    wasHolidayAdjusted,
    holidayName,
    displayLabel,
  };
}
