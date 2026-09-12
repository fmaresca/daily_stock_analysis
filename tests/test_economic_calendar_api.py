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
        self.assertEqual(result["source"], "curated_macro_schedule")
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

        # Third call with refresh=True must bypass cache and trigger network call
        res3 = get_economic_calendar(refresh=True)
        self.assertEqual(mock_urlopen.call_count, 2)
        self.assertEqual(res3["indicators"], res1["indicators"])

    @patch("urllib.request.urlopen")
    def test_nasdaq_backup_when_ff_fails(self, mock_urlopen):
        nasdaq_sample = {
            "data": {
                "asOf": "Wed, Sep 16, 2026",
                "rows": [
                    {
                        "gmt": "12:30",
                        "country": "United States",
                        "eventName": "Core CPI",
                        "actual": "",
                        "consensus": "0.3%",
                        "previous": "0.2%",
                        "description": ""
                    },
                    {
                        "gmt": "10:00",
                        "country": "Germany",
                        "eventName": "German ZEW",
                        "actual": "",
                        "consensus": "15.0",
                        "previous": "12.0",
                        "description": ""
                    }
                ]
            }
        }

        # First call (Forex Factory) raises Exception, second call (Nasdaq) succeeds
        mock_ff_resp = MagicMock()
        mock_ff_resp.side_effect = Exception("Forex Factory 429 Too Many Requests")

        mock_nasdaq_resp = MagicMock()
        mock_nasdaq_resp.read.return_value = json.dumps(nasdaq_sample).encode("utf-8")
        mock_nasdaq_resp.__enter__.return_value = mock_nasdaq_resp

        mock_urlopen.side_effect = [Exception("Forex Factory 429"), mock_nasdaq_resp]

        result = get_economic_calendar()

        self.assertIn("indicators", result)
        self.assertFalse(result["fallback"])
        self.assertEqual(result["source"], "nasdaq_live")
        self.assertEqual(len(result["indicators"]), 1)
        cpi = result["indicators"][0]
        self.assertEqual(cpi["title"], "Core CPI")
        self.assertEqual(cpi["forecast"], "0.3%")
        self.assertIn("Technology", cpi["sectors"])
        self.assertIn("QQQ", cpi["tickers"])

    @patch("urllib.request.urlopen")
    def test_scope_past_returns_historical(self, mock_urlopen):
        past_sample = [
            {
                "title": "Unemployment Claims",
                "country": "USD",
                "date": "2026-09-10T08:30:00-04:00",
                "impact": "Medium",
                "forecast": "205K",
                "previous": "206K"
            }
        ]
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(past_sample).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        result = get_economic_calendar(scope="past")
        self.assertEqual(result["scope"], "past")
        self.assertEqual(result["source"], "faireconomy_media")
        self.assertEqual(len(result["indicators"]), 1)
        self.assertEqual(result["indicators"][0]["title"], "Unemployment Claims")


if __name__ == "__main__":
    unittest.main()

