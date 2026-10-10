/**
 * Server-Side Single Clock Authority (Cloudflare Pages Functions)
 *
 * Provides UTC-safe, America/New_York (ET)-correct date math via Intl.
 * Mirrors web/src/utils/appNow.ts for edge functions.
 */

export function now() {
  return new Date();
}

/**
 * Returns decomposition of time in America/New_York
 */
export function getPartsET(at = now()) {
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

  const dayMap = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = dayMap[weekdayStr] !== undefined ? dayMap[weekdayStr] : 0;
  const ymd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { year, month, day, hours, minutes, seconds, dayOfWeek, ymd };
}

/**
 * Returns current Eastern Time as Date
 */
export function nowET(at = now()) {
  const p = getPartsET(at);
  return new Date(p.year, p.month - 1, p.day, p.hours, p.minutes, p.seconds);
}

/**
 * Returns today's ET calendar date as YYYY-MM-DD
 */
export function todayET(at = now()) {
  return getPartsET(at).ymd;
}

/**
 * Returns the Monday YYYY-MM-DD of the current ET trading week.
 * On weekends or Friday post-close, rolls to the upcoming Monday.
 */
export function startOfTradingWeekET(at = now()) {
  const p = getPartsET(at);
  const isAfterFridayClose = p.dayOfWeek === 5 && (p.hours > 16 || (p.hours === 16 && (p.minutes > 0 || p.seconds > 0)));

  let daysOffset = 0;
  if (p.dayOfWeek === 0) {
    daysOffset = 1;
  } else if (p.dayOfWeek === 6) {
    daysOffset = 2;
  } else if (isAfterFridayClose) {
    daysOffset = 3;
  } else {
    daysOffset = -(p.dayOfWeek - 1);
  }

  const target = new Date(p.year, p.month - 1, p.day + daysOffset, 12, 0, 0);
  const mYear = target.getFullYear();
  const mMonth = String(target.getMonth() + 1).padStart(2, '0');
  const mDay = String(target.getDate()).padStart(2, '0');
  return `${mYear}-${mMonth}-${mDay}`;
}

/**
 * Parses YYYY-MM-DD, MM/DD/YYYY, or OCC symbols into standard YYYY-MM-DD
 */
export function parseExpirationYmd(expStr) {
  if (!expStr || typeof expStr !== 'string') return null;
  const trimmed = expStr.trim();
  if (!trimmed || trimmed === 'N/A' || trimmed === '—') return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split('/').map(Number);
    let m = String(parts[0]).padStart(2, '0');
    let d = String(parts[1]).padStart(2, '0');
    let y = parts[2];
    if (y < 100) y += 2000;
    return `${y}-${m}-${d}`;
  }
  const occMatch = trimmed.match(/[A-Z]{1,6}(\d{2})(\d{2})(\d{2})[CP]/i);
  if (occMatch) {
    const y = 2000 + parseInt(occMatch[1], 10);
    const m = occMatch[2];
    const d = occMatch[3];
    return `${y}-${m}-${d}`;
  }
  return null;
}

/**
 * Checks if option expiration has passed relative to 4:00 PM ET close
 */
export function isExpiredOption(expiryStr, at = now()) {
  const expYmd = parseExpirationYmd(expiryStr);
  if (!expYmd) return false;

  const curET = getPartsET(at);
  if (curET.ymd > expYmd) return true;
  if (curET.ymd < expYmd) return false;

  const isPast4pm = curET.hours > 16 || (curET.hours === 16 && (curET.minutes > 0 || curET.seconds > 0));
  return isPast4pm;
}
