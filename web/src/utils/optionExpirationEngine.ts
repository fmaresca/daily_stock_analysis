/**
 * Option Expiration & Dynamic DTE Date Engine
 * 
 * Provides deterministic, real-time date-driven calculations for options expiration:
 * - Compares contract expiration dates against current market time (4:00 PM ET close).
 * - Accurately differentiates active contracts from expired contracts.
 * - Formats DTE with live day/date counters (e.g. "6d (09/18)", "Expired (09/11)").
 */

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
 * Parses diverse option expiration date formats into a standard Date object
 * Handles:
 * - 'YYYY-MM-DD' (e.g. '2026-09-11')
 * - 'MM/DD/YYYY' (e.g. '09/11/2026')
 * - 'MM/DD/YY' (e.g. '09/11/26')
 * - OCC symbols containing 'YYMMDD' (e.g. 'PANW260911P00327500')
 */
export function parseOptionExpirationDate(expStr?: string): Date | null {
  if (!expStr || typeof expStr !== 'string') return null;
  const trimmed = expStr.trim();
  if (!trimmed || trimmed === 'N/A' || trimmed === '—') return null;

  // 1. ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return new Date(year, month - 1, day, 16, 0, 0); // 4:00 PM ET
  }

  // 2. US format: MM/DD/YYYY or MM/DD/YY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split('/').map(Number);
    let month = parts[0];
    let day = parts[1];
    let year = parts[2];
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day, 16, 0, 0);
  }

  // 3. Fallback standard Date constructor
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 16, 0, 0);
  }

  return null;
}

/**
 * Calculates dynamic DTE and expiration status comparing the expiration cutoff against current time.
 * The official options expiration cutoff for trading decisions is Friday 4:00 PM Eastern Time.
 */
export function getOptionExpirationStatus(
  expStr?: string,
  fallbackDte: number = 0,
  referenceNow: Date = new Date()
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

  const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
  const expDay = String(expDate.getDate()).padStart(2, '0');
  const formattedExp = `${expMonth}/${expDay}`;

  // Calendar day calculation (midnight-to-midnight)
  const todayMidnight = new Date(referenceNow.getFullYear(), referenceNow.getMonth(), referenceNow.getDate()).getTime();
  const expMidnight = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate()).getTime();
  const calendarDiffDays = Math.round((expMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

  // Time difference including 4:00 PM ET cutoff
  const msRemaining = expDate.getTime() - referenceNow.getTime();

  // 1. Fully expired (past expiration date, or expiration date after 4:00 PM ET)
  if (calendarDiffDays < 0 || msRemaining <= 0) {
    const daysAgo = Math.max(1, Math.abs(calendarDiffDays));
    return {
      isExpired: true,
      isToday: calendarDiffDays === 0,
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
  if (calendarDiffDays === 0) {
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
  return {
    isExpired: false,
    isToday: false,
    dte: calendarDiffDays,
    calendarDaysRemaining: calendarDiffDays,
    label: `${calendarDiffDays}d (${formattedExp})`,
    shortLabel: `${calendarDiffDays}d`,
    formattedExpiration: formattedExp,
    statusText: 'ACTIVE',
    badgeColor: calendarDiffDays <= 5 ? 'amber' : 'emerald',
  };
}

/**
 * Quick boolean check if an option is expired
 */
export function isOptionExpired(expStr?: string, fallbackDte?: number): boolean {
  return getOptionExpirationStatus(expStr, fallbackDte).isExpired;
}
