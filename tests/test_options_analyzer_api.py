#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for AI Options Income Screener endpoint (Gemini Extended Thinking).
"""

import json
import unittest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from api.v1.endpoints.options import (
    OptionsAnalyzeRequest,
    analyze_options_screener,
)


class TestOptionsAnalyzerAPI(unittest.TestCase):
    def test_request_schema(self):
        req = OptionsAnalyzeRequest(
            screenerData="AAPL,224.50,100% Buy\nNVDA,125.00,100% Buy",
            strategy="CSP",
            minAroc=15.0,
            modelOverride="gemini-2.5-flash",
        )
        self.assertEqual(req.strategy, "CSP")
        self.assertEqual(req.minAroc, 15.0)
        self.assertEqual(req.modelOverride, "gemini-2.5-flash")

    def test_missing_api_key_raises_helpful_error(self):
        req = OptionsAnalyzeRequest(screenerData="AAPL,224.50")
        mock_config = MagicMock()
        mock_config.gemini_api_key = None
        mock_config.gemini_api_keys = []

        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaises(HTTPException) as cm:
                analyze_options_screener(req, config=mock_config)
            self.assertEqual(cm.exception.status_code, 400)
            self.assertIn("Copy Prompt for Gemini Pro Plan", cm.exception.detail)

    def test_empty_screener_data_raises_400(self):
        req = OptionsAnalyzeRequest(screenerData="   ")
        mock_config = MagicMock()
        mock_config.gemini_api_key = "fake-key"

        with self.assertRaises(HTTPException) as cm:
            analyze_options_screener(req, config=mock_config)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("empty", cm.exception.detail.lower())

    @patch("urllib.request.urlopen")
    def test_successful_gemini_analysis(self, mock_urlopen):
        mock_response_data = {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps({
                                    "market_regime_context": "Elevated tech volatility supports conservative premium harvesting.",
                                    "candidates": [
                                        {
                                            "ticker": "AAPL",
                                            "strategy": "CSP",
                                            "current_price": 224.50,
                                            "recommended_strike": 215.00,
                                            "expiration_date": "2026-09-11",
                                            "dte": 7,
                                            "delta": -0.18,
                                            "bid_ask": "1.25 / 1.30",
                                            "expected_premium": 1.25,
                                            "downside_cushion_pct": 4.23,
                                            "annualized_yield_pct": 30.29,
                                            "iv_rank": 45.0,
                                            "technical_anchor": "Strike sits below 20-day SMA ($218.50) support floor.",
                                            "earnings_date": "None during cycle",
                                            "selection_tier": "PRIMARY",
                                        }
                                    ],
                                    "rejected_candidates": [
                                        {
                                            "ticker": "XYZ",
                                            "reason": "Earnings within 2 days; binary event risk."
                                        }
                                    ]
                                })
                            }
                        ]
                    }
                }
            ]
        }

        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(mock_response_data).encode("utf-8")
        mock_resp.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_resp

        req = OptionsAnalyzeRequest(
            screenerData="AAPL,224.50,218.50,45.0\nXYZ,100.0,98.0,60.0",
            strategy="CSP",
            minAroc=15.0,
        )
        mock_config = MagicMock()
        mock_config.gemini_api_key = "test-api-key"

        result = analyze_options_screener(req, config=mock_config)
        self.assertIn("market_regime_context", result)
        self.assertEqual(len(result["candidates"]), 1)
        self.assertEqual(result["candidates"][0]["ticker"], "AAPL")
        self.assertEqual(result["candidates"][0]["recommended_strike"], 215.00)
        self.assertEqual(result["candidates"][0]["selection_tier"], "PRIMARY")
        self.assertEqual(len(result["rejected_candidates"]), 1)
        self.assertEqual(result["rejected_candidates"][0]["ticker"], "XYZ")


if __name__ == "__main__":
    unittest.main()
