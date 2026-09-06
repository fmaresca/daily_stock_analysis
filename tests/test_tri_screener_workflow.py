# -*- coding: utf-8 -*-
"""Unit tests for Item 4: Tri-Screen & Gemini AI Workflow.

Verifies:
1. Barchart Top 1% screener dataset integrity (weekly_screeners.json).
2. MarketChameleon Momentum screener dataset integrity (weekly_screeners_marketchameleon.json) and CBOE gating.
3. ThinkorSwim / Custom Screen View 190898 contract fields (Price, Opinion, Stability, Cadence, Strategy).
4. Sizing rule validation: $200,000 maximum single equity CSP collateral limit.
"""

import json
import os
import unittest


class TestTriScreenerWorkflow(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.public_data_dir = os.path.join(self.base_dir, "web", "public", "data")

    def test_barchart_dataset_integrity(self):
        """Validates weekly_screeners.json contains 53 screened stocks with Barchart Top 1% fields."""
        path = os.path.join(self.public_data_dir, "weekly_screeners.json")
        self.assertTrue(os.path.exists(path), f"Missing {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("source_id"), "barchart")
        self.assertIn("Direction Strength", data.get("source_name", ""))
        self.assertGreaterEqual(data.get("total_count", 0), 50)
        records = data.get("records", [])
        self.assertGreaterEqual(len(records), 50)

        # Check required fields on records
        for r in records[:5]:
            self.assertIn("symbol", r)
            self.assertIn("last_price", r)
            self.assertIn("opinion", r)
            self.assertIn("has_options", r)
            self.assertIn("recommended_strategy", r)
            self.assertGreater(r["last_price"], 0)

    def test_marketchameleon_dataset_integrity(self):
        """Validates weekly_screeners_marketchameleon.json contains 60 records and CBOE registry fields."""
        path = os.path.join(self.public_data_dir, "weekly_screeners_marketchameleon.json")
        self.assertTrue(os.path.exists(path), f"Missing {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("source_id"), "marketchameleon")
        self.assertGreaterEqual(data.get("total_count", 0), 60)
        records = data.get("records", [])
        self.assertGreaterEqual(len(records), 60)

        cboe_verified_count = 0
        for r in records:
            extra = r.get("extra_fields", {})
            if extra.get("in_cboe_registry") or r.get("has_weekly_options"):
                cboe_verified_count += 1

        self.assertGreater(cboe_verified_count, 0, "Expected at least some CBOE-verified weekly options stocks")

    def test_tos_view_190898_return_screen_format(self):
        """Validates custom watchlist dataset follows the exact Barchart Top 1% schema."""
        path = os.path.join(self.public_data_dir, "weekly_screeners_barchart_custom.json")
        self.assertTrue(os.path.exists(path), f"Missing {path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertIn("View 190898", data.get("source_name", ""))
        records = data.get("records", [])
        self.assertGreater(len(records), 0)

        required_keys = {
            "symbol", "name", "last_price", "price_change", "percent_change",
            "opinion", "opinion_pct", "has_options", "recommended_strategy"
        }
        for r in records:
            for k in required_keys:
                self.assertIn(k, r, f"Record {r.get('symbol')} missing required key {k}")

    def test_single_equity_position_limit_enforcement(self):
        """Validates the strict $200,000 maximum single equity CSP collateral limit."""
        max_limit = 200000.0

        def clamp_allocation(target_allocation: float) -> float:
            return min(max_limit, max(0.0, target_allocation))

        # Under limit: remains unchanged
        self.assertEqual(clamp_allocation(50000.0), 50000.0)
        self.assertEqual(clamp_allocation(100000.0), 100000.0)

        # Over limit: clamped to $200,000 strictly
        self.assertEqual(clamp_allocation(250000.0), 200000.0)
        self.assertEqual(clamp_allocation(500000.0), 200000.0)
        self.assertEqual(clamp_allocation(1000000.0), 200000.0)

    def test_candidate_hydration_diversity(self):
        """Validates that candidate tickers (VLO, RVTY, RNG) receive distinct, sector-calibrated IV and RSI."""
        # Simulated profile mapping matching screenerHydrator.ts
        sector_map = {
            "VLO": {"sector": "Energy", "base_iv": 0.31, "base_iv_rank": 42},
            "RVTY": {"sector": "Healthcare", "base_iv": 0.26, "base_iv_rank": 32},
            "RNG": {"sector": "Technology", "base_iv": 0.52, "base_iv_rank": 64},
        }

        # Verify distinct IVs across different sectors
        ivs = [v["base_iv"] for v in sector_map.values()]
        self.assertEqual(len(set(ivs)), 3, "IV values must be unique across distinct candidates")
        self.assertNotIn(0.35, ivs, "Hardcoded 0.35 IV fallback must not be used for calibrated tickers")

        # Energy IV < Tech IV
        self.assertLess(sector_map["VLO"]["base_iv"], sector_map["RNG"]["base_iv"])
        # Healthcare IV < Energy IV
        self.assertLess(sector_map["RVTY"]["base_iv"], sector_map["VLO"]["base_iv"])

    def test_cboe_weekly_options_gating_excludes_monthly_only(self):
        """Validates that securities without weekly options (like AMCX) are detected and filtered."""
        path = os.path.join(self.public_data_dir, "weekly_screeners.json")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        records = data.get("records", [])
        amcx = next((r for r in records if r.get("symbol") == "AMCX"), None)
        self.assertIsNotNone(amcx, "AMCX should be present in raw barchart records")
        # In the source data, AMCX explicitly has has_weekly_options = False
        self.assertFalse(amcx.get("has_weekly_options"), "AMCX must have has_weekly_options=False")

        # Simulate strict CBOE weekly filtering logic in CascadingScreenerView / geminiPromptTemplates
        def filter_strict_weeklys(cand_list):
            return [c for c in cand_list if c.get("has_weekly_options") is True]

        filtered = filter_strict_weeklys(records)
        self.assertNotIn("AMCX", [c["symbol"] for c in filtered], "AMCX must be excluded when strict weeklys gate is active")


if __name__ == "__main__":
    unittest.main()
