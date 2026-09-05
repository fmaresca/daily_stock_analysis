#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for Weekly US Economic Indicators & Macro Catalyst endpoint.
"""

import json
import unittest
from unittest.mock import patch, MagicMock

from tests.litellm_stub import ensure_litellm_stub
ensure_litellm_stub()

from api.v1.endpoints.options import (
    get_economic_calendar,
    _CALENDAR_CACHE,
    _SECTOR_IMPACT_MAP,
)


class TestEconomicCalendarAPI(unittest.TestCase):
    def setUp(self):
        # Reset cache before each test
        _CALENDAR_CACHE["timestamp"] = 0.0
        _CALENDAR_CACHE["data"] = None

    @patch("urllib.request.urlopen")
    def test_successful_calendar_fetch(self, mock_urlopen):
        sample_ff_data = [
            {
                "title": "CPI m/m",
                "country": "USD",
                "date": "2026-09-16T08:30:00-04:00",
                "impact": "High",
                "forecast": "0.2%",
                "previous": "0.2%"
            },
            {
                "title": "German ZEW Economic Sentiment",
                "country": "EUR",
                "date": "2026-09-15T05:00:00-04:00",
                "impact": "Medium",
                "forecast": "17.0",
                "previous": "19.2"
            },
            {
                "title": "Initial Jobless Claims",
                "country": "USD",
                "date": "2026-09-17T08:30:00-04:00",
                "impact": "Medium",
                "forecast": "225K",
                "previous": "227K"
            }
        ]

        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(sample_ff_data).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        result = get_economic_calendar()

        self.assertIn("indicators", result)
        self.assertFalse(result["fallback"])
        self.assertEqual(result["source"], "faireconomy_media")
        # Should filter out EUR and keep only 2 USD events
        self.assertEqual(len(result["indicators"]), 2)

        cpi_event = result["indicators"][0]
        self.assertEqual(cpi_event["title"], "CPI m/m")
        self.assertEqual(cpi_event["impact"], "High")
        self.assertEqual(cpi_event["forecast"], "0.2%")
        self.assertIn("Technology", cpi_event["sectors"])
        self.assertIn("QQQ", cpi_event["tickers"])

        jobless_event = result["indicators"][1]
        self.assertEqual(jobless_event["title"], "Initial Jobless Claims")
        self.assertEqual(jobless_event["impact"], "Moderate")
        self.assertIn("SPY", jobless_event["tickers"])

    @patch("urllib.request.urlopen")
    def test_fallback_when_upstream_fails(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("Connection timeout to faireconomy.media")

        result = get_economic_calendar()

        self.assertIn("indicators", result)
        self.assertTrue(result["fallback"])
        self.assertEqual(result["source"], "fallback_baseline")
        self.assertIn("notice", result)
        self.assertIn("Displaying baseline schedule", result["notice"])
        self.assertGreater(len(result["indicators"]), 0)

        # Check fallback indicators have required fields
        first = result["indicators"][0]
        self.assertIn("title", first)
        self.assertIn("sectors", first)
        self.assertIn("tickers", first)
        self.assertIn("impact", first)

    @patch("urllib.request.urlopen")
    def test_caching_behavior(self, mock_urlopen):
        sample_data = [
            {
                "title": "Fed Interest Rate Decision",
                "country": "USD",
                "date": "2026-09-16T14:00:00-04:00",
                "impact": "High",
                "forecast": "5.00%",
                "previous": "5.25%"
            }
        ]

        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(sample_data).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        # First call fetches from upstream
        res1 = get_economic_calendar()
        self.assertEqual(mock_urlopen.call_count, 1)

        # Second call within 30 minutes must return cached copy without new network call
        res2 = get_economic_calendar()
        self.assertEqual(mock_urlopen.call_count, 1)
        self.assertEqual(res1["indicators"], res2["indicators"])


if __name__ == "__main__":
    unittest.main()
