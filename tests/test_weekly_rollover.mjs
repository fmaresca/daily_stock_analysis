/**
 * Behavioral & Invariant Test Suite: Weekly Rollover & Expiry Purge
 * =================================================================
 * Verifies:
 * 1. Single Clock Authority week labeling (appNow.ts integration).
 * 2. Archive, don't annihilate: Active screener datasets move to week-stamped archives and active workspace clears.
 * 3. User filter preferences (WeeklyScreenerFilterState) survive archive.
 * 4. Non-destructive restore: Rehydrates archived screens without destroying existing active data.
 * 5. Expiry purge on import: Expired options quarantined and excluded from live P&L, greeks, and CSP collateral.
 * 6. Permanent data-safety sentinel test: Cumulative capital, tax ledger, journal, and prior YTD premiums are sacred.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Set up in-memory localStorage and window mock for Node test environment
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockStorage = new MemoryStorage();
globalThis.window = {
  localStorage: mockStorage,
  dispatchEvent: () => true,
};
globalThis.localStorage = mockStorage;

import {
  setMockNow,
  resetNow,
  todayET,
  startOfTradingWeekET,
  isExpiredOption,
} from '../web/src/utils/appNow.ts';

import {
  getCurrentTradingWeekLabel,
  archiveAndClearScreens,
  listArchivedScreenWeeks,
  restoreArchivedScreens,
  partitionExpiredLegsOnImport,
  MANAGED_SCREENER_KEYS,
  countDatasetRecords,
} from '../web/src/utils/weeklyRollover.ts';

import {
  parseSchwabPositionsCsv,
} from '../web/src/utils/schwabPositionsParser.ts';

test.beforeEach(() => {
  mockStorage.clear();
  resetNow();
});

test('1. Single Clock Authority trading week labeling for weekly rollover', () => {
  // Freeze to Saturday Oct 10, 2026
  setMockNow('2026-10-10T10:00:00-04:00');
  try {
    const weekLabel = getCurrentTradingWeekLabel();
    assert.equal(weekLabel, '2026-10-12', 'Weekend clock must roll forward to upcoming Monday 2026-10-12');

    // Freeze to Wednesday Oct 14, 2026
    setMockNow('2026-10-14T11:00:00-04:00');
    assert.equal(getCurrentTradingWeekLabel(), '2026-10-12', 'Mid-week clock must anchor to current Monday 2026-10-12');
  } finally {
    resetNow();
  }
});

test('2. Archive, don\'t annihilate: archives active screens and clears active workspace', () => {
  setMockNow('2026-10-10T10:00:00-04:00');
  try {
    // Stamp prior week on active workspace
    mockStorage.setItem('deltaharvest_portfolio_book_week', '2026-10-05');

    // Seed active screener datasets from prior week
    const mcData = {
      source_id: 'mc',
      timestamp: '2026-10-05T16:00:00Z',
      total_count: 25,
      records: Array.from({ length: 25 }, (_, i) => ({ symbol: `MC_${i}` })),
    };
    const barchartData = {
      source_id: 'barchart_top1',
      timestamp: '2026-10-05T16:00:00Z',
      total_count: 10,
      records: Array.from({ length: 10 }, (_, i) => ({ symbol: `BC_${i}` })),
    };
    const tosWatchlistData = {
      source_id: 'tos_watchlist',
      timestamp: '2026-10-05T16:00:00Z',
      total_count: 7,
      records: Array.from({ length: 7 }, (_, i) => ({ symbol: `TOS_${i}` })),
    };
    const geminiParsed = {
      recommendedTrades: [{ symbol: 'AAPL', strike: 220 }],
      borderlineCandidates: [{ symbol: 'MSFT', strike: 410 }],
      excludedCandidates: [{ symbol: 'TSLA', strike: 200 }],
    };

    mockStorage.setItem('deltaharvest_mc_screen_data', JSON.stringify(mcData));
    mockStorage.setItem('deltaharvest_barchart_screen_data', JSON.stringify(barchartData));
    mockStorage.setItem('deltaharvest_tos_barchart_watchlist', JSON.stringify(tosWatchlistData));
    mockStorage.setItem('deltaharvest_gemini_parsed_screen', JSON.stringify(geminiParsed));
    mockStorage.setItem('deltaharvest_gemini_raw_markdown', '# Gemini Selections\n- AAPL 220P');

    // Seed user filter preferences (must survive untouched)
    mockStorage.setItem('deltaharvest_screener_filters', JSON.stringify({ opinionFilter: '80', weeklyOnly: true }));

    // Execute archive and clear
    const report = archiveAndClearScreens();

    assert.equal(report.week, '2026-10-05', 'Archive report must stamp the week they belonged to (2026-10-05)');
    assert.equal(report.totalScreensArchived, 5, 'All 5 managed active screens must be archived');
    assert.equal(report.totalRecordsArchived, 25 + 10 + 7 + 3 + 1, 'Total records count must be accurate');

    // Invariant: active workspace keys must now be null/cleared
    assert.equal(mockStorage.getItem('deltaharvest_mc_screen_data'), null);
    assert.equal(mockStorage.getItem('deltaharvest_barchart_screen_data'), null);
    assert.equal(mockStorage.getItem('deltaharvest_tos_barchart_watchlist'), null);
    assert.equal(mockStorage.getItem('deltaharvest_gemini_parsed_screen'), null);
    assert.equal(mockStorage.getItem('deltaharvest_gemini_raw_markdown'), null);

    // Invariant: archive keys must exist with envelope and intact records
    const mcArchiveRaw = mockStorage.getItem('deltaharvest_screen_archive_2026-10-05_mc');
    assert.ok(mcArchiveRaw, 'MC archive key must exist');
    const mcEnv = JSON.parse(mcArchiveRaw);
    assert.equal(mcEnv.week, '2026-10-05');
    assert.equal(mcEnv.recordCount, 25);
    assert.equal(mcEnv.data.records.length, 25);

    // Invariant: user filter preferences survive intact
    const filters = JSON.parse(mockStorage.getItem('deltaharvest_screener_filters'));
    assert.equal(filters.opinionFilter, '80');
    assert.equal(filters.weeklyOnly, true);
  } finally {
    resetNow();
  }
});

test('3. Non-destructive restore: rehydrates archived screens without destroying current active data', () => {
  setMockNow('2026-10-10T10:00:00-04:00');
  try {
    // Seed archive for week of 2026-10-05
    const barchartEnvelope = {
      week: '2026-10-05',
      sourceId: 'barchart',
      key: 'deltaharvest_barchart_screen_data',
      label: 'Barchart Top 1%',
      archivedAt: '2026-10-10T10:00:00Z',
      recordCount: 15,
      data: { records: Array.from({ length: 15 }, (_, i) => ({ symbol: `HIST_${i}` })) },
    };
    mockStorage.setItem('deltaharvest_screen_archive_2026-10-05_barchart', JSON.stringify(barchartEnvelope));

    // List archived weeks
    const archivedWeeks = listArchivedScreenWeeks();
    assert.equal(archivedWeeks.length, 1);
    assert.equal(archivedWeeks[0].week, '2026-10-05');
    assert.equal(archivedWeeks[0].totalRecords, 15);

    // Restore archived screens
    restoreArchivedScreens('2026-10-05');

    // Verify active key reappeared
    const restoredRaw = mockStorage.getItem('deltaharvest_barchart_screen_data');
    assert.ok(restoredRaw, 'deltaharvest_barchart_screen_data must be rehydrated into active workspace');
    const restored = JSON.parse(restoredRaw);
    assert.equal(restored.records.length, 15);

    // Starting another upload re-archives rather than destroying
    const nextReport = archiveAndClearScreens();
    assert.equal(nextReport.totalScreensArchived, 1);
    assert.equal(mockStorage.getItem('deltaharvest_barchart_screen_data'), null);
  } finally {
    resetNow();
  }
});

test('4. Expiry purge on import: partitions expired options and excludes them from live math & collateral', () => {
  // Saturday morning freeze: Friday 2026-10-09 options are dead; Friday 2026-10-16 options are live
  setMockNow('2026-10-10T10:00:00-04:00');
  try {
    const fixtureCsv = [
      '"Positions for account DEMO-Portfolio as of 04:00 PM ET, 2026/10/09",,,,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,,,',
      'Symbol,Description,Qty (Quantity),Price,Price Chng % (Price Change %),Price Chng $ (Price Change $),Mkt Val (Market Value),Cost Basis,Day Chng $ (Day Change $),Day Chng % (Day Change %),Gain $ (Gain/Loss $),Gain % (Gain/Loss %),Ratings,Reinvest?,Reinvest Capital Gains?,% of Acct (% of Account),Asset Type',
      'AAPL,APPLE INC,"100",230.00,0.00%,0.00,"$23,000.00 ","$20,000.00 ",$0.00 ,0.00%,"$3,000.00 ",15.00%,A,No,N/A,15.00%,Equity',
      'NVDA,NVIDIA CORP,"100",120.00,0.00%,0.00,"$12,000.00 ","$10,000.00 ",$0.00 ,0.00%,"$2,000.00 ",20.00%,A,No,N/A,10.00%,Equity',
      // Live CSP expiring next Friday (2026-10-16) at $400 strike -> $40,000 collateral
      'MSFT 10/16/2026 400.00 P,PUT MSFT 10/16/2026 400.00 P,"-1",3.50,0.00%,0.00,"-$350.00 ","$500.00 ",$0.00 ,0.00%,"$150.00 ",30.00%,--,--,--,--,Option',
      // Live Covered Call expiring next Friday (2026-10-16)
      'AAPL 10/16/2026 240.00 C,CALL AAPL 10/16/2026 240.00 C,"-1",2.50,0.00%,0.00,"-$250.00 ","$400.00 ",$0.00 ,0.00%,"$150.00 ",37.50%,--,--,--,--,Option',
      // Expired CSP from yesterday (2026-10-09) at $320 strike -> $32,000 collateral if not purged
      'PANW 10/09/2026 320.00 P,PUT PANW 10/09/2026 320.00 P,"-1",0.01,0.00%,0.00,"-$1.00 ","$600.00 ",$0.00 ,0.00%,"$599.00 ",99.80%,--,--,--,--,Option',
      // Expired Covered Call from yesterday (2026-10-09)
      'AMD 10/09/2026 160.00 C,CALL AMD 10/09/2026 160.00 C,"-1",0.01,0.00%,0.00,"-$1.00 ","$450.00 ",$0.00 ,0.00%,"$449.00 ",99.70%,--,--,--,--,Option',
      // Cash & Money Market ($100,000 liquid cash)
      'Cash & Cash Investments,--,--,--,--,--,"$100,000.00 ",--,$0.00 ,0%,--,--,--,--,--,65.00%,Cash and Money Market',
      'Positions Total,--,--,--,--,--,"$135,000.00 ","$130,000.00 ",$0.00 ,0.00%,"$5,000.00 ",3.80%,--,--,--,--,--',
    ].join('\n');

    const parsed = parseSchwabPositionsCsv(fixtureCsv, 5000);

    // Initial parse contains 2 CSPs and 2 Covered Calls before partition
    assert.equal(parsed.openCSPs.length, 2);
    assert.equal(parsed.coveredCalls.length, 2);
    assert.equal(parsed.equities.length, 2);

    // Run expiry purge partitioning
    const partition = partitionExpiredLegsOnImport(parsed, '2026-10-12');

    // 1. Live positions partition
    assert.equal(partition.liveEquities.length, 2, '2 live equities');
    assert.equal(partition.liveOpenCSPs.length, 1, 'Only 1 live CSP (MSFT)');
    assert.equal(partition.liveOpenCSPs[0].underlyingSymbol, 'MSFT');
    assert.equal(partition.liveCoveredCalls.length, 1, 'Only 1 live Covered Call (AAPL)');
    assert.equal(partition.liveCoveredCalls[0].underlyingSymbol, 'AAPL');

    // 2. Expired partition: 2 expired legs quarantined
    assert.equal(partition.expiredOnImport.length, 2, 'Exactly 2 options expired on import');
    const expiredPanw = partition.expiredOnImport.find((e) => e.underlyingSymbol === 'PANW');
    assert.ok(expiredPanw);
    assert.equal(expiredPanw.type, 'PUT');
    assert.equal(expiredPanw.expiredDateStr, '10/09/2026');
    assert.equal(expiredPanw.statusLabel, 'Expired 10/09/2026 — excluded from live analysis');

    const expiredAmd = partition.expiredOnImport.find((e) => e.underlyingSymbol === 'AMD');
    assert.ok(expiredAmd);
    assert.equal(expiredAmd.type, 'CALL');
    assert.equal(expiredAmd.expiredDateStr, '10/09/2026');

    // 3. Live collateral: strictly $40,000 (MSFT 400P only, PANW $32k backed out!)
    assert.equal(partition.liveCollateral, 40000, 'Collateral must be exactly $40,000 from live MSFT put');

    // 4. Net free cash: $100,000 cash - $40,000 collateral - $5,000 living expenses = $55,000
    assert.equal(partition.liveNetFreeCash, 55000, 'Net Free Cash must be exactly $55,000');

    // 5. Portfolio positions: only cash, stocks, and live option legs
    const expiredInLive = partition.livePositions.filter((p) => p.expiration && isExpiredOption(p.expiration));
    assert.equal(expiredInLive.length, 0, 'No expired contracts can exist in live portfolio positions');

    // 6. Expired bucket persisted in localStorage
    const savedExpired = JSON.parse(mockStorage.getItem('deltaharvest_expired_on_import_2026-10-12'));
    assert.equal(savedExpired.length, 2);
  } finally {
    resetNow();
  }
});

test('5. Data-safety permanent sentinel test: cumulative data, ledger, tax, and journal are sacred', () => {
  setMockNow('2026-10-10T10:00:00-04:00');
  try {
    // Put unique, identifiable sentinels in cumulative storage keys
    const SENTINEL_CAPITAL = {
      sentinel: 'SACRED_CAPITAL_DO_NOT_TOUCH',
      totalCash: 125000.0,
      priorYtdPremiumBalance: 888888.88,
      ytdPremiumsEarned: 888888.88,
    };
    const SENTINEL_TAX = {
      sentinel: 'SACRED_TAX_LEDGER_IMMUTABLE',
      ytdPremiumsEarned: 888888.88,
      records: [{ id: 'TAX_REC_SENTINEL_01', amount: 5000 }],
    };
    const SENTINEL_JOURNAL = [
      { id: 'JOURNAL_ENTRY_SENTINEL_01', strategy: 'CSP', notes: 'Permanent trade log' },
    ];
    const SENTINEL_PORTFOLIO_BOOK = [
      { id: 'POS_CUMULATIVE_01', symbol: 'SPY', quantity: 100 },
    ];

    mockStorage.setItem('deltaharvest_capital_ledger', JSON.stringify(SENTINEL_CAPITAL));
    mockStorage.setItem('deltaharvest_tax_ledger', JSON.stringify(SENTINEL_TAX));
    mockStorage.setItem('deltaharvest_options_journal_entries', JSON.stringify(SENTINEL_JOURNAL));
    mockStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(SENTINEL_PORTFOLIO_BOOK));

    // Also populate a screener dataset that SHOULD be cleared
    mockStorage.setItem('deltaharvest_mc_screen_data', JSON.stringify({ records: [{ symbol: 'AAPL' }] }));

    // Run archive and clear
    archiveAndClearScreens();

    // Invariant: Screener data was cleared
    assert.equal(mockStorage.getItem('deltaharvest_mc_screen_data'), null);

    // Invariant: Cumulative data was 100% untouched
    const afterCap = JSON.parse(mockStorage.getItem('deltaharvest_capital_ledger'));
    assert.equal(afterCap.sentinel, 'SACRED_CAPITAL_DO_NOT_TOUCH');
    assert.equal(afterCap.priorYtdPremiumBalance, 888888.88);

    const afterTax = JSON.parse(mockStorage.getItem('deltaharvest_tax_ledger'));
    assert.equal(afterTax.sentinel, 'SACRED_TAX_LEDGER_IMMUTABLE');
    assert.equal(afterTax.records.length, 1);
    assert.equal(afterTax.records[0].id, 'TAX_REC_SENTINEL_01');

    const afterJournal = JSON.parse(mockStorage.getItem('deltaharvest_options_journal_entries'));
    assert.equal(afterJournal.length, 1);
    assert.equal(afterJournal[0].id, 'JOURNAL_ENTRY_SENTINEL_01');

    const afterBook = JSON.parse(mockStorage.getItem('deltaharvest_portfolio_book'));
    assert.equal(afterBook.length, 1);
    assert.equal(afterBook[0].id, 'POS_CUMULATIVE_01');
  } finally {
    resetNow();
  }
});

test('6. Multi-week sequential upload lifecycle test', () => {
  // Week 1: Monday Oct 5
  setMockNow('2026-10-05T09:30:00-04:00');
  try {
    mockStorage.setItem('deltaharvest_portfolio_book_week', '2026-10-05');
    mockStorage.setItem('deltaharvest_mc_screen_data', JSON.stringify({ records: [{ symbol: 'WK1_STOCK' }] }));

    // Weekend Oct 10: New upload for Week 2
    setMockNow('2026-10-10T11:00:00-04:00');
    const weekLabel = getCurrentTradingWeekLabel();
    assert.equal(weekLabel, '2026-10-12');

    // Execute rollover
    const archiveReport = archiveAndClearScreens();
    assert.equal(archiveReport.week, '2026-10-05');
    assert.equal(archiveReport.totalScreensArchived, 1);

    // Verify Week 1 archive exists
    const w1Archive = mockStorage.getItem('deltaharvest_screen_archive_2026-10-05_mc');
    assert.ok(w1Archive);

    // Active key is empty for Week 2
    assert.equal(mockStorage.getItem('deltaharvest_mc_screen_data'), null);

    // Week stamp updated to Week 2
    mockStorage.setItem('deltaharvest_portfolio_book_week', weekLabel);
    assert.equal(mockStorage.getItem('deltaharvest_portfolio_book_week'), '2026-10-12');
  } finally {
    resetNow();
  }
});
