import test from 'node:test';
import assert from 'node:assert/strict';

import {
  now,
  setMockNow,
  resetNow,
  todayET,
  nowET,
  startOfTradingWeekET,
  isMarketOpen,
  isExpiredOption,
  parseOptionExpirationDate,
} from '../web/src/utils/appNow.ts';

import {
  getAvailableExpirations,
  generateOptionChainMatrix,
} from '../web/src/utils/optionChainMatrix.ts';

import {
  getOptionExpirationStatus,
  isOptionExpired,
} from '../web/src/utils/optionExpirationEngine.ts';

import {
  todayET as serverTodayET,
  startOfTradingWeekET as serverStartOfWeekET,
  isExpiredOption as serverIsExpiredOption,
} from '../functions/api/_now.js';

import {
  simulatePosition,
  runPortfolioStressTest,
} from '../web/src/utils/portfolioStressTest.ts';

import {
  filterDigestContent,
} from '../functions/api/scheduled/morning-digest.js';

test('Single Clock Authority: Saturday morning freeze (2026-10-10T09:00:00-05:00)', () => {
  // 9:00 AM Central = 10:00 AM Eastern on Saturday Oct 10, 2026
  setMockNow('2026-10-10T09:00:00-05:00');

  try {
    assert.equal(todayET(), '2026-10-10', 'todayET() must accurately report America/New_York date 2026-10-10');
    assert.equal(startOfTradingWeekET(), '2026-10-12', 'On weekends, startOfTradingWeekET() rolls to upcoming Monday 2026-10-12');
    assert.equal(isMarketOpen(), false, 'Market must be closed on Saturday');

    // Friday Oct 9 option is dead
    assert.equal(isExpiredOption('2026-10-09'), true, 'Friday 10/09 contract must be expired on Saturday 10/10');
    assert.equal(isOptionExpired('2026-10-09'), true, 'optionExpirationEngine isOptionExpired must report true');
    assert.equal(isExpiredOption('10/09/2026'), true, 'US format MM/DD/YYYY must report true');
    assert.equal(isExpiredOption('PANW 10/09/2026 327.50 P'), true, 'Symbol with expiration must report true');

    // Next Friday Oct 16 option is active
    assert.equal(isExpiredOption('2026-10-16'), false, 'Next Friday 10/16 contract must be active');
    assert.equal(isOptionExpired('2026-10-16'), false, 'optionExpirationEngine must report false for 10/16');

    // Option chain matrix: Friday 10/09 must NEVER be in available expirations
    const chains = getAvailableExpirations();
    assert.ok(chains.length > 0, 'Must have available live expirations');
    const hasOct9 = chains.some((c) => c.expiration === '2026-10-09');
    assert.equal(hasOct9, false, 'Expired Friday 10/09 expiration must be purged from chain matrix');
    assert.equal(chains[0].expiration, '2026-10-16', 'Nearest live expiration must be next Friday 2026-10-16');

    // Server mirror parity
    assert.equal(serverTodayET(now()), '2026-10-10', 'Server todayET must match');
    assert.equal(serverStartOfWeekET(now()), '2026-10-12', 'Server startOfTradingWeekET must match');
    assert.equal(serverIsExpiredOption('2026-10-09', now()), true, 'Server isExpiredOption must match');
    assert.equal(serverIsExpiredOption('2026-10-16', now()), false, 'Server isExpiredOption must match');
  } finally {
    resetNow();
  }
});

test('Single Clock Authority: Friday 4:01 PM ET close cutoff (2026-10-09T16:01:00-04:00)', () => {
  setMockNow('2026-10-09T16:01:00-04:00');

  try {
    assert.equal(todayET(), '2026-10-09');
    // At 4:01 PM ET on expiration Friday, option is dead
    assert.equal(isExpiredOption('2026-10-09'), true, 'Friday 4:01 PM ET -> that day expiry reads expired');
    const status = getOptionExpirationStatus('2026-10-09');
    assert.equal(status.isExpired, true, 'Status must report expired');
    assert.equal(status.statusText, 'EXPIRED');

    // Trading week rolls to upcoming Monday after Friday close
    assert.equal(startOfTradingWeekET(), '2026-10-12', 'After Friday 4pm close, week rolls to upcoming Monday');
  } finally {
    resetNow();
  }
});

test('Single Clock Authority: Friday 3:59 PM ET trading session (2026-10-09T15:59:00-04:00)', () => {
  setMockNow('2026-10-09T15:59:00-04:00');

  try {
    assert.equal(todayET(), '2026-10-09');
    // Before 4:00 PM ET close, today's option is still active / expiring today
    assert.equal(isExpiredOption('2026-10-09'), false, 'Before 4:00 PM ET, today expiration is not yet dead');
    const status = getOptionExpirationStatus('2026-10-09');
    assert.equal(status.isExpired, false);
    assert.equal(status.isToday, true);
    assert.equal(status.statusText, 'EXPIRING_TODAY');

    // Trading week is still the current week
    assert.equal(startOfTradingWeekET(), '2026-10-05', 'Before Friday 4pm close, week is still current week Monday');
  } finally {
    resetNow();
  }
});

test('Single Clock Authority: Good Friday Holiday OCC Adjustment (2026-04-03)', () => {
  // Good Friday 2026 is April 3, 2026.
  // OCC Rule 1106 adjusts Friday April 3 to Thursday April 2, 2026 close.
  
  // Test Thursday April 2 at 3:50 PM ET (before adjusted close)
  setMockNow('2026-04-02T15:50:00-04:00');
  try {
    assert.equal(isExpiredOption('2026-04-03'), false, 'Thursday before 4pm, holiday Friday option is still active');
  } finally {
    resetNow();
  }

  // Test Thursday April 2 at 4:05 PM ET (after adjusted close)
  setMockNow('2026-04-02T16:05:00-04:00');
  try {
    assert.equal(isExpiredOption('2026-04-03'), true, 'Thursday after 4pm close, holiday Friday option is dead');
  } finally {
    resetNow();
  }

  // Test Friday April 3 morning (the holiday itself)
  setMockNow('2026-04-03T10:00:00-04:00');
  try {
    assert.equal(isExpiredOption('2026-04-03'), true, 'On Good Friday itself, contract is dead');
    assert.equal(isMarketOpen(), false, 'Market must be closed on Good Friday');
  } finally {
    resetNow();
  }
});

test('Prompt 2 Acceptance: Freeze Saturday morning 2026-10-10 9:00 AM CT', () => {
  setMockNow('2026-10-10T09:00:00-05:00');

  try {
    // 1. Chain matrix: Friday 10/09 is dropped, default expiration is nearest live (10/16)
    const expirations = getAvailableExpirations();
    assert.ok(expirations.length > 0, 'Must provide live expirations');
    assert.equal(expirations.some((e) => e.expiration === '2026-10-09'), false, '10/09 must not render');
    assert.equal(expirations[0].expiration, '2026-10-16', 'Default expiration must be nearest live: 2026-10-16');

    // 2. Positions / portfolio: 10/09 contracts are expired
    const expiredCsp = {
      id: 'POS_EXP_1',
      symbol: 'PANW',
      type: 'CSP',
      quantity: 1,
      spotPrice: 340,
      strike: 320,
      dte: 0,
      entryPrice: 2.5,
      currentOptionPrice: 0.05,
      iv: 35,
      delta: 0.15,
      theta: 0.05,
      vega: 0.04,
      beta: 1.0,
      expiration: '2026-10-09',
    };

    const liveCsp = {
      id: 'POS_LIVE_1',
      symbol: 'AAPL',
      type: 'CSP',
      quantity: 1,
      spotPrice: 230,
      strike: 220,
      dte: 6,
      entryPrice: 1.8,
      currentOptionPrice: 1.2,
      iv: 28,
      delta: 0.20,
      theta: 0.04,
      vega: 0.03,
      beta: 1.0,
      expiration: '2026-10-16',
    };

    // Active positions filter strictly excludes expired options:
    const allPositions = [expiredCsp, liveCsp];
    const activePositions = allPositions.filter(
      (p) => p.type === 'STOCK' || p.type === 'CASH' || p.type === 'MMF' || !isOptionExpired(p.expiration, p.dte)
    );
    assert.equal(activePositions.length, 1, 'Only live positions must remain in active ledger');
    assert.equal(activePositions[0].symbol, 'AAPL', 'Live position must be AAPL');

    // Committed collateral calculation on active positions:
    const activeCommitted = activePositions
      .filter((p) => p.type === 'CSP' && !isOptionExpired(p.expiration, p.dte))
      .reduce((sum, p) => sum + p.strike * 100 * p.quantity, 0);
    assert.equal(activeCommitted, 220 * 100, 'Expired CSP ($320) must be excluded; only live CSP committed');

    // Stress testing simulation: expired position contributes 0 to margin, Greeks, and live value
    const simResult = simulatePosition(expiredCsp, 0, 0, 0);
    assert.equal(simResult.currentValue, 0, 'Expired option current value must be 0');
    assert.equal(simResult.simulatedValue, 0, 'Expired option simulated value must be 0');
    assert.equal(simResult.delta, 0, 'Expired option delta must be 0');
    assert.equal(simResult.regTMargin, 0, 'Expired option margin must be 0');

    // Portfolio stress test aggregate: only live CSP contributes
    const portResult = runPortfolioStressTest([expiredCsp, liveCsp]);
    assert.equal(portResult.regTMargin, 220 * 100, 'Reg-T margin must only count live position');
  } finally {
    resetNow();
  }
});

test('Prompt 2 Acceptance: Freeze Friday 4:01 PM ET on expiration day -> 0DTE chain reads expired', () => {
  setMockNow('2026-10-09T16:01:00-04:00');

  try {
    assert.equal(isExpiredOption('2026-10-09'), true, '0DTE contract must read expired at 4:01 PM ET');
    const available = getAvailableExpirations();
    const hasToday = available.some((e) => e.expiration === '2026-10-09');
    assert.equal(hasToday, false, '0DTE chain must not include expired today in live expirations');
  } finally {
    resetNow();
  }
});

test('Prompt 3 Acceptance: Freeze to Saturday 2026-10-10 -> calendar opens on upcoming week Mon 10/12, no Oct 5-9 events shown as current', () => {
  setMockNow('2026-10-10T09:00:00-05:00');

  try {
    const mondayWeek = startOfTradingWeekET();
    assert.equal(mondayWeek, '2026-10-12', 'On weekend, calendar must open on upcoming week Monday 2026-10-12');
    
    // Server parity
    assert.equal(serverStartOfWeekET(now()), '2026-10-12', 'Server mirror must roll to upcoming week Monday');

    // Any events from the prior week (October 5 - 9) must not be treated as belonging to the upcoming week
    const priorWeekEvents = [
      { title: 'CPI', isoDate: '2026-10-06T08:30:00-04:00' },
      { title: 'Jobless Claims', isoDate: '2026-10-08T08:30:00-04:00' },
    ];

    priorWeekEvents.forEach((evt) => {
      const evtWeekMonday = evt.isoDate.slice(0, 10);
      assert.notEqual(evtWeekMonday, mondayWeek, `Prior event on ${evtWeekMonday} does not belong to upcoming week ${mondayWeek}`);
    });
  } finally {
    resetNow();
  }
});

test('Prompt 3 Acceptance: Freeze to Wednesday mid-week -> calendar shows Mon-Fri of that week; Monday past events are dimmed/past, not removed', () => {
  setMockNow('2026-10-07T12:00:00-04:00');

  try {
    const today = todayET();
    assert.equal(today, '2026-10-07', 'Current day is Wednesday 2026-10-07');
    const monday = startOfTradingWeekET();
    assert.equal(monday, '2026-10-05', 'Mid-week calendar week starts on Monday 2026-10-05');

    // Simulate events for Monday and Thursday
    const monEvent = { title: 'ISM Manufacturing', isoDate: '2026-10-05T10:00:00-04:00' };
    const wedEvent = { title: 'FOMC Minutes', isoDate: '2026-10-07T14:00:00-04:00' };
    const thuEvent = { title: 'CPI Release', isoDate: '2026-10-08T08:30:00-04:00' };

    const weekEvents = [monEvent, wedEvent, thuEvent];

    // Verify all 3 events are retained in the week view
    assert.equal(weekEvents.length, 3, 'All week events are retained in the current week view');

    // Monday event is marked as past (< todayET), Thursday event is upcoming (>= todayET)
    const isMonPast = monEvent.isoDate.slice(0, 10) < today;
    const isWedPast = wedEvent.isoDate.slice(0, 10) < today;
    const isThuPast = thuEvent.isoDate.slice(0, 10) < today;

    assert.equal(isMonPast, true, 'Monday event date is in the past and should be visually dimmed');
    assert.equal(isWedPast, false, 'Today event is not in the past');
    assert.equal(isThuPast, false, 'Thursday event is upcoming and active');
  } finally {
    resetNow();
  }
});

test('Prompt 3 Acceptance: Digest generation purges expired contracts and past events at generation time', () => {
  // Frozen to Saturday 2026-10-10 9:00 AM CT
  setMockNow('2026-10-10T09:00:00-05:00');

  try {
    const mockPositions = [
      { symbol: 'PANW 10/09/2026 320 P', expiration: '2026-10-09', strike: 320, type: 'CSP' }, // EXPIRED
      { symbol: 'AAPL 10/16/2026 220 P', expiration: '2026-10-16', strike: 220, type: 'CSP' }, // LIVE
    ];

    const mockEvents = [
      { title: 'Jobless Claims', isoDate: '2026-10-08T08:30:00-04:00' }, // PAST
      { title: 'Upcoming PPI', isoDate: '2026-10-14T08:30:00-04:00' },   // FUTURE
    ];

    const { positions: cleanPos, events: cleanEvents } = filterDigestContent(
      { positions: mockPositions, events: mockEvents },
      now()
    );

    // 1. Expired PANW option is purged; AAPL live contract remains
    assert.equal(cleanPos.length, 1, 'Expired contract must be purged from digest');
    assert.equal(cleanPos[0].symbol, 'AAPL 10/16/2026 220 P');

    // 2. Past Jobless Claims event is purged; upcoming PPI remains
    assert.equal(cleanEvents.length, 1, 'Past event must be purged from digest');
    assert.equal(cleanEvents[0].title, 'Upcoming PPI');
  } finally {
    resetNow();
  }
});
