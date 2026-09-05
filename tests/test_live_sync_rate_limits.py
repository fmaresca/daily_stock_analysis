#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit tests for Live Sync API rate limits, frequency safety tiers,
and market hours boundary checks.
"""

import unittest
from datetime import datetime, time
import zoneinfo


def analyze_sync_frequency(interval_seconds: int, ticker_count: int = 21, hourly_quota: int = 2000):
    if interval_seconds <= 0:
        return {"syncs_per_hour": 0, "requests_per_hour": 0, "utilization_pct": 0.0, "is_safe": True}
    
    syncs_per_hour = 3600 // interval_seconds
    requests_per_hour = syncs_per_hour * ticker_count
    utilization_pct = (requests_per_hour / hourly_quota) * 100.0
    is_safe = requests_per_hour < (hourly_quota * 0.70)  # Safe if under 70% of quota
    return {
        "syncs_per_hour": syncs_per_hour,
        "requests_per_hour": requests_per_hour,
        "utilization_pct": utilization_pct,
        "is_safe": is_safe,
    }


def is_us_market_open_at(dt: datetime) -> bool:
    # US Eastern Time
    et_tz = zoneinfo.ZoneInfo("America/New_York")
    et_dt = dt.astimezone(et_tz) if dt.tzinfo else dt.replace(tzinfo=et_tz)
    
    # 0 = Mon, 4 = Fri, 5 = Sat, 6 = Sun
    if et_dt.weekday() >= 5:
        return False
        
    market_open = time(9, 30)
    market_close = time(16, 0)
    t = et_dt.time()
    return market_open <= t < market_close


class TestLiveSyncRateLimits(unittest.TestCase):
    def test_recommended_5_minute_frequency(self):
        # 5-minute interval = 12 syncs/hour
        res = analyze_sync_frequency(300, ticker_count=21)
        self.assertEqual(res["syncs_per_hour"], 12)
        self.assertEqual(res["requests_per_hour"], 252)
        # 252 requests is only 12.6% of the 2,000 req/hr threshold
        self.assertAlmostEqual(res["utilization_pct"], 12.6, places=1)
        self.assertTrue(res["is_safe"])

    def test_conservative_10_minute_frequency(self):
        # 10-minute interval = 6 syncs/hour
        res = analyze_sync_frequency(600, ticker_count=21)
        self.assertEqual(res["syncs_per_hour"], 6)
        self.assertEqual(res["requests_per_hour"], 126)
        self.assertAlmostEqual(res["utilization_pct"], 6.3, places=1)
        self.assertTrue(res["is_safe"])

    def test_active_2_minute_frequency(self):
        # 2-minute interval = 30 syncs/hour
        res = analyze_sync_frequency(120, ticker_count=21)
        self.assertEqual(res["syncs_per_hour"], 30)
        self.assertEqual(res["requests_per_hour"], 630)
        self.assertAlmostEqual(res["utilization_pct"], 31.5, places=1)
        self.assertTrue(res["is_safe"])

    def test_sub_minute_frequency_triggers_block_risk(self):
        # 30-second interval = 120 syncs/hour = 2,520 requests/hour (> 2,000 quota)
        res = analyze_sync_frequency(30, ticker_count=21)
        self.assertEqual(res["syncs_per_hour"], 120)
        self.assertEqual(res["requests_per_hour"], 2520)
        self.assertGreater(res["requests_per_hour"], 2000)
        self.assertFalse(res["is_safe"])

    def test_market_hours_filter(self):
        et_tz = zoneinfo.ZoneInfo("America/New_York")
        
        # Tuesday 10:30 AM ET -> Market Open
        open_time = datetime(2026, 9, 8, 10, 30, tzinfo=et_tz)
        self.assertTrue(is_us_market_open_at(open_time))
        
        # Tuesday 9:15 AM ET -> Pre-Market (Closed)
        pre_market = datetime(2026, 9, 8, 9, 15, tzinfo=et_tz)
        self.assertFalse(is_us_market_open_at(pre_market))
        
        # Tuesday 4:15 PM ET -> After-Hours (Closed)
        post_market = datetime(2026, 9, 8, 16, 15, tzinfo=et_tz)
        self.assertFalse(is_us_market_open_at(post_market))
        
        # Saturday 11:00 AM ET -> Weekend (Closed)
        weekend = datetime(2026, 9, 5, 11, 0, tzinfo=et_tz)
        self.assertFalse(is_us_market_open_at(weekend))


if __name__ == "__main__":
    unittest.main()
