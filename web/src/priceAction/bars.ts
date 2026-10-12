/**
 * DeltaHarvest — Al Brooks Price Action Analysis
 * Module: Bar Data Pipeline (priceAction/bars.ts)
 * 
 * Implements canonical OHLC normalization, gap handling, and bad-tick rejection.
 * Adheres strictly to the policies defined in PRICE_ACTION_SPEC.md.
 * 
 * Notice: This software implements analytical heuristics based on published
 * price-action methodology (Al Brooks, "Reading Price Charts Bar by Bar", John Wiley & Sons).
 * Not financial advice. Probabilistic modeling only.
 */

export interface CanonicalBar {
  /** YYYY-MM-DD for daily bars; ISO-8601 for intraday bars */
  time: string;
  /** UNIX epoch timestamp in milliseconds (UTC) */
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BarValidationOptions {
  /** Maximum acceptable ratio of bad ticks before invalidating entire series (default: 0.02 = 2%) */
  maxBadTickPct?: number;
  /** Allow flat bars where open == high == low == close (default: true) */
  allowFlatBars?: boolean;
  /** Enforce strictly ascending order in output (default: true) */
  strictAscending?: boolean;
}

export interface BarNormalizationReport {
  /** Normalized, validated, sorted canonical bars ready for detector */
  bars: CanonicalBar[];
  /** Total raw records inspected */
  totalInputCount: number;
  /** Number of valid bars produced */
  validCount: number;
  /** Number of bad ticks dropped */
  droppedBadTicksCount: number;
  /** Number of duplicate timestamps merged/resolved */
  deduplicatedCount: number;
  /** Count of weekend or NYSE holiday gaps observed between adjacent trading sessions */
  weekendHolidayGapCount: number;
  /** Diagnostic issue logs */
  issues: string[];
  /** Flag indicating whether the series meets minimum data integrity thresholds */
  isValid: boolean;
}

/**
 * Normalizes an arbitrary date or timestamp representation into canonical { time, timestamp }.
 */
export function normalizeBarTime(rawTime: string | number | Date): { time: string; timestamp: number } | null {
  if (rawTime === null || rawTime === undefined) return null;

  let d: Date;
  if (rawTime instanceof Date) {
    d = rawTime;
  } else if (typeof rawTime === 'number') {
    // If number is in seconds (< 1e11), convert to milliseconds
    d = new Date(rawTime < 1e11 ? rawTime * 1000 : rawTime);
  } else if (typeof rawTime === 'string') {
    const trimmed = rawTime.trim();
    // Daily string format "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      d = new Date(`${trimmed}T00:00:00.000Z`);
    } else {
      d = new Date(trimmed);
    }
  } else {
    return null;
  }

  const timestamp = d.getTime();
  if (isNaN(timestamp) || timestamp <= 0) return null;

  // Format as YYYY-MM-DD if at midnight UTC, otherwise full ISO string
  const iso = d.toISOString();
  const time = iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;

  return { time, timestamp };
}

/**
 * Validates a single tick against physical price-bar geometry.
 * 
 * Rejection Policy:
 * 1. Any non-finite or non-positive price (NaN, <= 0).
 * 2. High < Low.
 * 3. High < max(Open, Close) (bar extends above high).
 * 4. Low > min(Open, Close) (bar extends below low).
 * 5. Flat bar when allowFlatBars is false.
 */
export function validateBarGeometry(
  open: number,
  high: number,
  low: number,
  close: number,
  volume: number,
  allowFlatBars = true
): { valid: boolean; reason?: string } {
  if (!Number.isFinite(open) || open <= 0) return { valid: false, reason: 'Invalid Open price' };
  if (!Number.isFinite(high) || high <= 0) return { valid: false, reason: 'Invalid High price' };
  if (!Number.isFinite(low) || low <= 0) return { valid: false, reason: 'Invalid Low price' };
  if (!Number.isFinite(close) || close <= 0) return { valid: false, reason: 'Invalid Close price' };

  if (high < low) {
    return { valid: false, reason: `Geometry violation: High (${high}) < Low (${low})` };
  }

  const maxOC = Math.max(open, close);
  if (high < maxOC - 1e-6) {
    return { valid: false, reason: `Geometry violation: High (${high}) < max(Open, Close) (${maxOC})` };
  }

  const minOC = Math.min(open, close);
  if (low > minOC + 1e-6) {
    return { valid: false, reason: `Geometry violation: Low (${low}) > min(Open, Close) (${minOC})` };
  }

  if (!allowFlatBars && open === high && high === low && low === close) {
    return { valid: false, reason: 'Flat bar rejected by policy' };
  }

  return { valid: true };
}

/**
 * Calculates calendar day difference between two UTC timestamps.
 */
function calendarDayDiff(ts1: number, ts2: number): number {
  const dayMs = 86400000;
  return Math.round(Math.abs(ts2 - ts1) / dayMs);
}

/**
 * Normalizes an array of raw bars into CanonicalBar series.
 * 
 * Policies Enforced:
 * - Bad ticks are discarded and logged; never interpolated.
 * - Gaps (weekends/holidays) are counted and preserved; NEVER synthetically filled.
 * - Out-of-order bars are chronologically sorted.
 * - Duplicate timestamps take the last valid bar.
 */
export function normalizeRawBars(
  rawBars: unknown[],
  options: BarValidationOptions = {}
): BarNormalizationReport {
  const {
    maxBadTickPct = 0.02,
    allowFlatBars = true,
    strictAscending = true,
  } = options;

  const issues: string[] = [];
  if (!Array.isArray(rawBars) || rawBars.length === 0) {
    return {
      bars: [],
      totalInputCount: 0,
      validCount: 0,
      droppedBadTicksCount: 0,
      deduplicatedCount: 0,
      weekendHolidayGapCount: 0,
      issues: ['Empty or non-array input received'],
      isValid: false,
    };
  }

  const candidateBars: CanonicalBar[] = [];
  let droppedBadTicksCount = 0;

  for (let i = 0; i < rawBars.length; i++) {
    const raw = rawBars[i] as Record<string, unknown>;
    if (!raw || typeof raw !== 'object') {
      droppedBadTicksCount++;
      issues.push(`Index ${i}: not an object`);
      continue;
    }

    const rawTime = raw.time ?? raw.date ?? raw.timestamp ?? raw.datetime ?? raw.t;
    const timeNorm = normalizeBarTime(rawTime as string | number | Date);
    if (!timeNorm) {
      droppedBadTicksCount++;
      issues.push(`Index ${i}: unparseable time value "${String(rawTime)}"`);
      continue;
    }

    const open = Number(raw.open ?? raw.o);
    const high = Number(raw.high ?? raw.h);
    const low = Number(raw.low ?? raw.l);
    const close = Number(raw.close ?? raw.c);
    const volume = Math.max(0, Number(raw.volume ?? raw.vol ?? raw.v ?? 0));

    const geom = validateBarGeometry(open, high, low, close, volume, allowFlatBars);
    if (!geom.valid) {
      droppedBadTicksCount++;
      issues.push(`Index ${i} (${timeNorm.time}): ${geom.reason}`);
      continue;
    }

    candidateBars.push({
      time: timeNorm.time,
      timestamp: timeNorm.timestamp,
      open: Math.round(open * 10000) / 10000,
      high: Math.round(high * 10000) / 10000,
      low: Math.round(low * 10000) / 10000,
      close: Math.round(close * 10000) / 10000,
      volume: Math.round(volume),
    });
  }

  // Sort ascending by timestamp
  candidateBars.sort((a, b) => a.timestamp - b.timestamp);

  // Deduplicate on timestamp
  const deduplicatedBars: CanonicalBar[] = [];
  let deduplicatedCount = 0;

  for (const bar of candidateBars) {
    if (deduplicatedBars.length === 0) {
      deduplicatedBars.push(bar);
      continue;
    }

    const last = deduplicatedBars[deduplicatedBars.length - 1];
    if (last.timestamp === bar.timestamp) {
      // Overwrite with newer or higher volume bar
      deduplicatedBars[deduplicatedBars.length - 1] = bar;
      deduplicatedCount++;
    } else {
      deduplicatedBars.push(bar);
    }
  }

  // Inspect gaps (weekends, holidays) without interpolating
  let weekendHolidayGapCount = 0;
  for (let i = 1; i < deduplicatedBars.length; i++) {
    const prev = deduplicatedBars[i - 1];
    const curr = deduplicatedBars[i];
    const dayGap = calendarDayDiff(prev.timestamp, curr.timestamp);

    // If day gap > 1 day in daily series, it represents a weekend or holiday
    if (dayGap > 1) {
      weekendHolidayGapCount++;
    }
  }

  const badTickRatio = rawBars.length > 0 ? droppedBadTicksCount / rawBars.length : 1;
  const isValid = badTickRatio <= maxBadTickPct && deduplicatedBars.length > 0;

  if (badTickRatio > maxBadTickPct) {
    issues.push(`Bad tick ratio ${(badTickRatio * 100).toFixed(2)}% exceeded maximum allowed ${(maxBadTickPct * 100).toFixed(2)}%`);
  }

  return {
    bars: deduplicatedBars,
    totalInputCount: rawBars.length,
    validCount: deduplicatedBars.length,
    droppedBadTicksCount,
    deduplicatedCount,
    weekendHolidayGapCount,
    issues,
    isValid,
  };
}

/**
 * Normalizes Yahoo Finance chart response structure:
 * { chart: { result: [{ timestamp: number[], indicators: { quote: [{ open, high, low, close, volume }] } }] } }
 */
export function normalizeYahooChart(
  yahooPayload: unknown,
  options: BarValidationOptions = {}
): BarNormalizationReport {
  const result = (yahooPayload as any)?.chart?.result?.[0] ?? yahooPayload;
  const timestamps = (result?.timestamp ?? []) as number[];
  const quote = result?.indicators?.quote?.[0] ?? {};

  const opens = quote.open ?? [];
  const highs = quote.high ?? [];
  const lows = quote.low ?? [];
  const closes = quote.close ?? [];
  const volumes = quote.volume ?? [];

  const rawBars: Array<Record<string, unknown>> = [];
  for (let i = 0; i < timestamps.length; i++) {
    rawBars.push({
      timestamp: timestamps[i],
      open: opens[i],
      high: highs[i],
      low: lows[i],
      close: closes[i],
      volume: volumes[i],
    });
  }

  return normalizeRawBars(rawBars, options);
}

/**
 * Normalizes Tradier API history day structure:
 * { history: { day: [{ date: "2024-04-01", open: 170.5, high: 172.0, low: 169.8, close: 171.2, volume: 45000 }] } }
 */
export function normalizeTradierHistory(
  tradierPayload: unknown,
  options: BarValidationOptions = {}
): BarNormalizationReport {
  const history = (tradierPayload as any)?.history?.day ?? (tradierPayload as any)?.day ?? tradierPayload;
  const days = Array.isArray(history) ? history : history ? [history] : [];
  return normalizeRawBars(days, options);
}

/**
 * Wrapper for fetching price bars from DeltaHarvest endpoints without altering existing fetch code.
 * In a browser environment, calls the edge proxy `/api/market-price` or direct fallback.
 */
export async function fetchCanonicalBars(
  symbol: string,
  fetchFn: typeof fetch = fetch,
  options: BarValidationOptions = {}
): Promise<BarNormalizationReport> {
  const cleanSym = String(symbol || '').trim().toUpperCase();
  if (!cleanSym) {
    return {
      bars: [],
      totalInputCount: 0,
      validCount: 0,
      droppedBadTicksCount: 0,
      deduplicatedCount: 0,
      weekendHolidayGapCount: 0,
      issues: ['Symbol is required'],
      isValid: false,
    };
  }

  // 1. Attempt first-party edge proxy (/api/price-action/bars) if in browser
  if (typeof window !== 'undefined') {
    try {
      const edgeResp = await fetchFn(`/api/price-action/bars?symbol=${encodeURIComponent(cleanSym)}`);
      if (edgeResp.ok) {
        const edgeData = await edgeResp.json();
        if (edgeData?.bars && Array.isArray(edgeData.bars) && edgeData.bars.length > 0) {
          return normalizeRawBars(edgeData.bars, options);
        }
      }
    } catch {
      // Non-fatal, fall through to Yahoo direct
    }
  }

  // 2. Fallback to direct Yahoo query endpoint
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=1d&range=1y`;
  try {
    const resp = await fetchFn(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      return normalizeYahooChart(data, options);
    }
  } catch (err) {
    // Non-fatal, return empty report with issue log
  }

  return {
    bars: [],
    totalInputCount: 0,
    validCount: 0,
    droppedBadTicksCount: 0,
    deduplicatedCount: 0,
    weekendHolidayGapCount: 0,
    issues: [`Failed to retrieve market bars for ${cleanSym}`],
    isValid: false,
  };
}
