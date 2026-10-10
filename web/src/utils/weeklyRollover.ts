/**
 * Weekly Workflow Rollover & Screener Archive Engine - DeltaHarvest
 *
 * Implements the "New-Upload Weekly Reset and Expiry Purge on Import" contract:
 * 1. Single Clock Authority week labeling:
 *    - Uses appNow.ts (now() and startOfTradingWeekET()) for consistent America/New_York trading week boundaries.
 * 2. Archive, don't annihilate:
 *    - On new Schwab upload or ritual reset, moves prior-week screener datasets to week-stamped archives:
 *      `deltaharvest_screen_archive_<weekLabel>_<sourceId>`
 *    - Clears active screener keys so new week starts clean without stale contamination.
 *    - Keeps user filter preferences (settings survive; results reset).
 * 3. Cumulative data is sacred:
 *    - YTD premium balances, capital ledger, options journal, tax records are NEVER touched.
 * 4. Expiry purge on import:
 *    - Partitions uploaded option legs via isExpiredOption().
 *    - Expired contracts are quarantined into `deltaharvest_expired_on_import_<weekLabel>`
 *      and completely excluded from live P&L, greeks, CSP collateral, and covered call math.
 */

import { now, startOfTradingWeekET, isExpiredOption } from './appNow.ts';
import type { PortfolioPosition } from './portfolioStressTest.ts';
import type {
  ParsedSchwabPositionsResult,
  ParsedOptionPosition,
  ParsedEquityHolding,
} from './schwabPositionsParser.ts';

export interface ManagedScreenerKeyConfig {
  key: string;
  sourceId: string;
  label: string;
}

/**
 * Canonical registry of active weekly screener localStorage keys.
 * CI gate ensures any new screener key introduced in the codebase is registered here.
 */
export const MANAGED_SCREENER_KEYS: ManagedScreenerKeyConfig[] = [
  {
    key: 'deltaharvest_mc_screen_data',
    sourceId: 'mc',
    label: 'MarketChameleon Screen',
  },
  {
    key: 'deltaharvest_barchart_screen_data',
    sourceId: 'barchart',
    label: 'Barchart Top 1% Screen',
  },
  {
    key: 'deltaharvest_gemini_parsed_screen',
    sourceId: 'gemini_parsed',
    label: 'Gemini AI Parsed Selections',
  },
  {
    key: 'deltaharvest_gemini_raw_markdown',
    sourceId: 'gemini_raw_markdown',
    label: 'Gemini AI Raw Briefing',
  },
  {
    key: 'deltaharvest_tos_barchart_watchlist',
    sourceId: 'tos_barchart_watchlist',
    label: 'ThinkorSwim / Barchart Watchlist',
  },
];

export interface ArchivedScreenEnvelope {
  week: string;
  sourceId: string;
  key: string;
  label: string;
  archivedAt: string;
  recordCount: number;
  data: any;
}

export interface ArchivedSourceDetail {
  sourceId: string;
  key: string;
  label: string;
  recordCount: number;
  week: string;
  archiveKey: string;
}

export interface ArchiveReport {
  week: string;
  totalScreensArchived: number;
  totalRecordsArchived: number;
  sources: ArchivedSourceDetail[];
  timestamp: string;
}

export interface ArchivedWeekSummary {
  week: string;
  sources: string[];
  totalRecords: number;
}

export interface ExpiredOptionOnImport extends ParsedOptionPosition {
  statusLabel: string;
  expiredDateStr: string;
}

export interface ExpiryPurgeResult {
  livePositions: PortfolioPosition[];
  expiredOnImport: ExpiredOptionOnImport[];
  liveOpenCSPs: ParsedOptionPosition[];
  liveCoveredCalls: ParsedOptionPosition[];
  liveEquities: ParsedEquityHolding[];
  liveCollateral: number;
  liveNetFreeCash: number;
}

/**
 * Returns the Monday YYYY-MM-DD representing the current America/New_York trading week.
 * Authority: startOfTradingWeekET() in appNow.ts (rolls forward on weekends / post-close Friday).
 */
export function getCurrentTradingWeekLabel(at: Date = now()): string {
  return startOfTradingWeekET(at);
}

/**
 * Counts records inside any screener dataset format.
 */
export function countDatasetRecords(data: any): number {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;

  // Gemini Parsed Screen Result
  if (data.recommendedTrades || data.borderlineCandidates || data.excludedCandidates) {
    const t1 = Array.isArray(data.recommendedTrades) ? data.recommendedTrades.length : 0;
    const t2 = Array.isArray(data.borderlineCandidates) ? data.borderlineCandidates.length : 0;
    const t3 = Array.isArray(data.excludedCandidates) ? data.excludedCandidates.length : 0;
    return t1 + t2 + t3;
  }

  // Standard WeeklyScreenerDataset
  if (Array.isArray(data.records)) {
    return data.records.length;
  }
  if (typeof data.total_count === 'number' && data.total_count > 0) {
    return data.total_count;
  }

  // Raw text (e.g. markdown briefing)
  if (typeof data === 'string') {
    return data.trim().length > 0 ? 1 : 0;
  }

  return 1;
}

/**
 * Archives all active weekly screener datasets to week-labeled archive keys
 * and clears the active workspace keys.
 *
 * Rules:
 * - Archive, don't annihilate: writes to `deltaharvest_screen_archive_<weekLabel>_<sourceId>`.
 * - Cumulative data is untouched (never modifies portfolio book cumulative fields, capital ledger, journal, tax).
 * - User filter preferences (WeeklyScreenerFilterState, presets) are preserved.
 */
export function archiveAndClearScreens(at: Date = now()): ArchiveReport {
  const currentWeek = getCurrentTradingWeekLabel(at);
  const timestamp = now().toISOString(); // wall-clock-ok: logging/archive timestamp

  let priorWeekStamp = '';
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      priorWeekStamp = window.localStorage.getItem('deltaharvest_portfolio_book_week') || '';
    } catch {
      // ignore
    }
  }

  const sourcesArchived: ArchivedSourceDetail[] = [];
  let totalRecords = 0;

  if (typeof window !== 'undefined' && window.localStorage) {
    MANAGED_SCREENER_KEYS.forEach((config) => {
      try {
        const raw = window.localStorage.getItem(config.key);
        if (!raw || !raw.trim()) return;

        let parsed: any = raw;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // Keep raw string (e.g. markdown)
        }

        const count = countDatasetRecords(parsed);
        // Determine week for archive stamp: prefer dataset week/timestamp or previous portfolio book week
        let itemWeek = priorWeekStamp;
        if (!itemWeek && parsed && typeof parsed === 'object') {
          if (parsed.week && typeof parsed.week === 'string') {
            itemWeek = parsed.week;
          } else if (parsed.timestamp) {
            const d = new Date(parsed.timestamp);
            if (!isNaN(d.getTime())) {
              itemWeek = startOfTradingWeekET(d);
            }
          }
        }
        if (!itemWeek) {
          itemWeek = currentWeek;
        }

        const archiveKey = `deltaharvest_screen_archive_${itemWeek}_${config.sourceId}`;
        const envelope: ArchivedScreenEnvelope = {
          week: itemWeek,
          sourceId: config.sourceId,
          key: config.key,
          label: config.label,
          archivedAt: timestamp,
          recordCount: count,
          data: parsed,
        };

        window.localStorage.setItem(archiveKey, JSON.stringify(envelope));
        window.localStorage.removeItem(config.key);

        sourcesArchived.push({
          sourceId: config.sourceId,
          key: config.key,
          label: config.label,
          recordCount: count,
          week: itemWeek,
          archiveKey,
        });
        totalRecords += count;
      } catch (err) {
        console.warn(`[weeklyRollover] Failed to archive ${config.key}:`, err);
      }
    });
  }

  return {
    week: priorWeekStamp || currentWeek,
    totalScreensArchived: sourcesArchived.length,
    totalRecordsArchived: totalRecords,
    sources: sourcesArchived,
    timestamp,
  };
}

/**
 * Lists all archived screen weeks available in localStorage.
 * Returns weeks sorted descending (newest week first).
 */
export function listArchivedScreenWeeks(): ArchivedWeekSummary[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];

  const weekMap = new Map<string, { sources: Set<string>; totalRecords: number }>();
  const prefix = 'deltaharvest_screen_archive_';

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;

      const raw = window.localStorage.getItem(k);
      if (!raw) continue;

      try {
        const envelope: ArchivedScreenEnvelope = JSON.parse(raw);
        const w = envelope.week || 'unknown';
        if (!weekMap.has(w)) {
          weekMap.set(w, { sources: new Set(), totalRecords: 0 });
        }
        const entry = weekMap.get(w)!;
        entry.sources.add(envelope.label || envelope.sourceId);
        entry.totalRecords += envelope.recordCount || 0;
      } catch {
        // Fallback: parse key string
        const rest = k.slice(prefix.length);
        const parts = rest.split('_');
        const w = parts[0] || 'unknown';
        const src = parts.slice(1).join('_') || 'source';
        if (!weekMap.has(w)) {
          weekMap.set(w, { sources: new Set(), totalRecords: 0 });
        }
        weekMap.get(w)!.sources.add(src);
      }
    }
  } catch (err) {
    console.warn('[weeklyRollover] Error listing archived weeks:', err);
  }

  const result: ArchivedWeekSummary[] = [];
  weekMap.forEach((val, week) => {
    result.push({
      week,
      sources: Array.from(val.sources),
      totalRecords: val.totalRecords,
    });
  });

  // Sort descending by week label
  return result.sort((a, b) => b.week.localeCompare(a.week));
}

/**
 * Restores all screener datasets for a specific week from archive into active workspace.
 *
 * Safety Invariant:
 * Archives current active state first before overwriting, so restore is never destructive.
 */
export function restoreArchivedScreens(week: string): ArchiveReport | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  // 1. Archive current active workspace first (non-destructive safety step)
  const preRestoreReport = archiveAndClearScreens();

  // 2. Locate all archive envelopes for the target week
  const prefix = `deltaharvest_screen_archive_${week}_`;
  const restoredKeys: string[] = [];

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;

      const raw = window.localStorage.getItem(k);
      if (!raw) continue;

      try {
        const envelope: ArchivedScreenEnvelope = JSON.parse(raw);
        if (envelope.key) {
          window.localStorage.setItem(
            envelope.key,
            typeof envelope.data === 'string' ? envelope.data : JSON.stringify(envelope.data)
          );
          restoredKeys.push(envelope.key);
        }
      } catch (err) {
        console.warn(`[weeklyRollover] Failed to restore archive entry ${k}:`, err);
      }
    }

    // Set week stamp to restored week
    window.localStorage.setItem('deltaharvest_portfolio_book_week', week);

    // 3. Dispatch cross-tab events so all mounted screener views re-render
    window.dispatchEvent(
      new CustomEvent('deltaharvest_screens_updated', {
        detail: { week, restoredKeys, source: 'restore_archived_screens' },
      })
    );
    window.dispatchEvent(
      new CustomEvent('deltaharvest_workflow_reset', {
        detail: { week, source: 'restore_archived_screens' },
      })
    );
  } catch (err) {
    console.error(`[weeklyRollover] Error restoring archived week ${week}:`, err);
  }

  return preRestoreReport;
}

/**
 * Partitions uploaded positions into live vs expired contracts.
 *
 * Rules:
 * - Single Clock Authority: Uses isExpiredOption(expiry, now()) from appNow.ts.
 * - Expired option legs NEVER enter live math (portfolio book, P&L, greeks, CSP collateral, covered calls).
 * - Expired legs are saved to `deltaharvest_expired_on_import_<weekLabel>` for review.
 * - Collateral and free cash are calculated strictly from live non-expired positions.
 */
export function partitionExpiredLegsOnImport(
  parsed: ParsedSchwabPositionsResult,
  weekLabel: string = getCurrentTradingWeekLabel()
): ExpiryPurgeResult {
  const expiredOnImport: ExpiredOptionOnImport[] = [];
  const liveOpenCSPs: ParsedOptionPosition[] = [];
  const liveCoveredCalls: ParsedOptionPosition[] = [];

  // Partition CSPs
  parsed.openCSPs.forEach((csp) => {
    if (isExpiredOption(csp.expiration)) {
      expiredOnImport.push({
        ...csp,
        statusLabel: `Expired ${csp.expiration} — excluded from live analysis`,
        expiredDateStr: csp.expiration,
      });
    } else {
      liveOpenCSPs.push(csp);
    }
  });

  // Partition Covered Calls
  parsed.coveredCalls.forEach((cc) => {
    if (isExpiredOption(cc.expiration)) {
      expiredOnImport.push({
        ...cc,
        statusLabel: `Expired ${cc.expiration} — excluded from live analysis`,
        expiredDateStr: cc.expiration,
      });
    } else {
      liveCoveredCalls.push(cc);
    }
  });

  // Live equities (stock holdings)
  const liveEquities = parsed.equities;

  // Filter portfolioPositions: keep CASH, MMF, STOCK and live options only
  const livePositions = parsed.portfolioPositions.filter((pos) => {
    if (pos.type === 'CASH' || pos.type === 'MMF' || pos.type === 'STOCK') {
      return true;
    }
    if (pos.expiration && isExpiredOption(pos.expiration)) {
      return false;
    }
    return true;
  });

  // Recalculate CSP collateral exclusively from live non-expired CSPs
  const liveCollateral = Math.round(
    liveOpenCSPs.reduce((sum, p) => sum + (p.strike * Math.abs(p.quantity) * 100), 0) * 100
  ) / 100;

  // Recalculate Net Free Cash strictly from live collateral
  const totalLiquidCash = parsed.cashBreakdown.totalCashToCoverCsp;
  const availBeforeLiving = Math.max(0, Math.round((totalLiquidCash - liveCollateral) * 100) / 100);
  const liveNetFreeCash = Math.max(
    0,
    Math.round((availBeforeLiving - parsed.encumberedLivingExpenses) * 100) / 100
  );

  // Persist expired bucket to localStorage for audit/review
  if (typeof window !== 'undefined' && window.localStorage && expiredOnImport.length > 0) {
    try {
      const expiredKey = `deltaharvest_expired_on_import_${weekLabel}`;
      window.localStorage.setItem(expiredKey, JSON.stringify(expiredOnImport));
    } catch (err) {
      console.warn('[weeklyRollover] Failed to store expired on import bucket:', err);
    }
  }

  return {
    livePositions,
    expiredOnImport,
    liveOpenCSPs,
    liveCoveredCalls,
    liveEquities,
    liveCollateral,
    liveNetFreeCash,
  };
}
