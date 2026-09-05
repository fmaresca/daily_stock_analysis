#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for Screener Agents (Barchart, MarketChameleon, and ScreenerRegistry).
Works with both pytest and unittest.
"""

import io
import json
import os
import tempfile
import unittest
from pathlib import Path

from src.screener_agents.base_agent import BaseScreenerAgent, ScreenerDataset, ScreenerRecord
from src.screener_agents.barchart_agent import BarchartScreenerAgent
from src.screener_agents.marketchameleon_agent import MarketChameleonScreenerAgent
from src.screener_agents.registry import ScreenerRegistry


class TestScreenerAgents(unittest.TestCase):
    def test_screener_record_serialization(self):
        rec = ScreenerRecord(
            symbol="AAPL",
            name="Apple Inc",
            last_price=230.50,
            price_change=2.15,
            percent_change=0.94,
            opinion="100% Buy",
            opinion_pct=100.0,
            has_options=True,
            has_weekly_options=True,
            signal_strength="Maximum (Top 1%)",
            signal_direction="Strong Bullish",
            source="barchart",
            recommended_strategy="BULL_PUT_SPREAD",
        )

        d = rec.to_dict()
        self.assertEqual(d["symbol"], "AAPL")
        self.assertEqual(d["last_price"], 230.50)
        self.assertTrue(d["has_weekly_options"])
        self.assertEqual(d["recommended_strategy"], "BULL_PUT_SPREAD")

    def test_screener_registry(self):
        sources = ScreenerRegistry.list_sources()
        source_ids = [s["source_id"] for s in sources]
        self.assertIn("barchart", source_ids)
        self.assertIn("marketchameleon", source_ids)

        barchart_agent = ScreenerRegistry.get_agent("barchart")
        self.assertIsInstance(barchart_agent, BarchartScreenerAgent)
        self.assertIn("190898", barchart_agent.target_url)

        chameleon_agent = ScreenerRegistry.get_agent("marketchameleon")
        self.assertIsInstance(chameleon_agent, MarketChameleonScreenerAgent)

        with self.assertRaises(ValueError):
            ScreenerRegistry.get_agent("non_existent_source")

    def test_barchart_csv_parser(self):
        sample_csv = """Symbol,Name,Last Price,Price Change,% Change,Signal,Weekly Options
ZETA,Zeta Global Holdings Corp,31.35,-1.33,-4.07%,100% Buy,Yes
VLO,Valero Energy Corp,370.72,0.03,0.01%,100% Buy,Yes
MUFG,Mitsubishi Ufj Financial Group,24.09,-0.04,-0.17%,100% Buy,No
"""
        agent = BarchartScreenerAgent()
        records = agent.parse_csv(sample_csv)

        self.assertEqual(len(records), 3)
        self.assertEqual(records[0].symbol, "ZETA")
        self.assertEqual(records[0].last_price, 31.35)
        self.assertEqual(records[0].price_change, -1.33)
        self.assertEqual(records[0].percent_change, -4.07)
        self.assertTrue(records[0].has_weekly_options)
        self.assertEqual(records[0].opinion_pct, 100.0)
        self.assertEqual(records[0].recommended_strategy, "BULL_PUT_SPREAD")

        self.assertEqual(records[2].symbol, "MUFG")
        self.assertFalse(records[2].has_weekly_options)
        self.assertEqual(records[2].recommended_strategy, "CSP")

    def test_marketchameleon_csv_parser(self):
        sample_csv = """Symbol,Company,Price,Change,% Chg,IV30,IV Rank,Weeklys
TSLA,Tesla Inc,240.50,5.20,2.21%,45.0,68,Yes
SPY,SPDR S&P 500 ETF,580.10,1.20,0.21%,22.0,22,Yes
"""
        agent = MarketChameleonScreenerAgent()
        records = agent.parse_csv(sample_csv)

        self.assertEqual(len(records), 2)
        self.assertEqual(records[0].symbol, "TSLA")
        self.assertEqual(records[0].last_price, 240.50)
        self.assertTrue(records[0].has_weekly_options)
        self.assertEqual(records[0].recommended_strategy, "BULL_PUT_SPREAD")

        self.assertEqual(records[1].symbol, "SPY")
        self.assertEqual(records[1].recommended_strategy, "CSP")

    def test_export_and_save_dataset(self):
        agent = BarchartScreenerAgent()
        records = [
            ScreenerRecord(
                symbol="NVDA",
                name="Nvidia Corp",
                last_price=125.0,
                price_change=3.5,
                percent_change=2.88,
                opinion="100% Buy",
                opinion_pct=100.0,
                has_options=True,
                has_weekly_options=True,
            )
        ]

        with tempfile.TemporaryDirectory() as tmpdir:
            csv_file = Path(tmpdir) / "test_export.csv"
            json_file = Path(tmpdir) / "test_dataset.json"

            agent.export_csv(records, csv_file)
            self.assertTrue(csv_file.exists())
            csv_content = csv_file.read_text(encoding="utf-8")
            self.assertIn("NVDA", csv_content)
            self.assertIn("125.0", csv_content)

            agent.save_dataset_json(records, json_file)
            self.assertTrue(json_file.exists())
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.assertEqual(data["total_count"], 1)
            self.assertEqual(data["records"][0]["symbol"], "NVDA")

    def test_marketchameleon_copy_paste_and_headings(self):
        agent = MarketChameleonScreenerAgent()
        records = [
            ScreenerRecord(
                symbol="DELL",
                name="Dell Technologies",
                last_price=524.14,
                price_change=7.75,
                percent_change=1.50,
                opinion="Bullish (Uptrend)",
                opinion_pct=95.0,
                has_options=True,
                has_weekly_options=True,
                signal_strength="IV30: 61.4%",
                signal_direction="Strong Bullish",
                source="marketchameleon",
                recommended_strategy="BULL_PUT_SPREAD",
                extra_fields={
                    "market_cap_str": "338.7 B",
                    "rsi_14": 64.58,
                    "iv30": 61.36,
                    "vol_20d": 63.04,
                    "vol_1y": 61.72,
                    "ma_signal": "Uptrend",
                    "in_cboe_registry": True,
                    "expiration_cadence": "Weekly",
                },
            )
        ]

        # Test copy-paste text generation with CBOE Weeklys and Options Cadence
        copy_text = agent.generate_copy_paste_text(records)
        self.assertIn("Symbol\tName\tPrice\tChange\t% Chg\tMarket Cap\t14-Day RSI\tIV30\t20-Day Vol\t1-Yr Vol\tMA Signal\tCBOE Weeklys\tOptions Cadence\tRecommended Strategy", copy_text)
        self.assertIn("DELL\tDell Technologies\t$524.14\t+7.75\t+1.50%\t338.7 B\t64.58\t61.36%\t63.04%\t61.72%\tUptrend\tYes (CBOE)\tWeekly\tBULL_PUT_SPREAD", copy_text)

        # Test CSV export with full headings
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = Path(tmpdir) / "mc_export.csv"
            agent.export_csv(records, csv_path)
            self.assertTrue(csv_path.exists())
            content = csv_path.read_text(encoding="utf-8")
            self.assertIn("Symbol,Name,Price,Price Change,% Chg,Volume,Avg Volume,Relative Volume,Market Cap", content)
            self.assertIn("CBOE Weeklys,Options Cadence", content)
            self.assertIn("DELL,Dell Technologies,$524.14,+7.75,+1.50%", content)
            self.assertIn("Yes (CBOE),Weekly", content)

    def test_marketchameleon_cboe_filtering(self):
        from src.screener_agents.marketchameleon_agent import get_cboe_weekly_directory
        cboe_set = get_cboe_weekly_directory()
        self.assertGreater(len(cboe_set), 500)
        self.assertIn("DELL", cboe_set)
        self.assertIn("NOW", cboe_set)
        self.assertIn("SNOW", cboe_set)
        # Verify non-weekly ticker is not in registry
        self.assertNotIn("NAT", cboe_set)

    def test_barchart_custom_watchlist_agent(self):
        from src.screener_agents.barchart_custom_agent import BarchartCustomWatchlistAgent
        agent = ScreenerRegistry.get_agent("barchart_custom")
        self.assertIsInstance(agent, BarchartCustomWatchlistAgent)
        self.assertIn("190898", agent.target_url)

        # 1. Test clean_symbols
        raw_symbols = [" aapl ", "nvda,", "TSLA\n", "aapl", "BRK.B", "INVALID$$$SYMBOL!"]
        cleaned = agent.clean_symbols(raw_symbols)
        self.assertEqual(cleaned, ["AAPL", "NVDA", "TSLA", "BRK.B"])

        # 2. Test parse_api_item into ScreenerRecord with exact View 190898 fields
        mock_item = {
            "raw": {
                "symbol": "AAPL",
                "symbolName": "Apple Inc",
                "lastPrice": 235.50,
                "priceChange": 3.25,
                "percentChange": 1.40,
                "opinion": "100% Buy",
                "opinionScore": 100,
                "opinionStabilityPrevious": "100% Buy",
                "opinionStabilityLastWeek": "88% Buy",
                "opinionStabilityLastMonth": "80% Buy",
                "hasWeeklyOptions": True,
            }
        }
        rec = agent._parse_api_item(mock_item)
        self.assertEqual(rec.symbol, "AAPL")
        self.assertEqual(rec.name, "Apple Inc")
        self.assertEqual(rec.last_price, 235.50)
        self.assertEqual(rec.price_change, 3.25)
        self.assertEqual(rec.percent_change, 1.40)
        self.assertEqual(rec.opinion, "100% Buy")
        self.assertEqual(rec.opinion_pct, 100.0)
        self.assertEqual(rec.opinion_previous, "100% Buy")
        self.assertEqual(rec.opinion_last_week, "88% Buy")
        self.assertEqual(rec.opinion_last_month, "80% Buy")
        self.assertTrue(rec.has_weekly_options)
        self.assertEqual(rec.recommended_strategy, "BULL_PUT_SPREAD")

        # 3. Test View 190898 copy-paste TSV output
        records = [rec]
        tsv_text = agent.generate_copy_paste_text(records)
        self.assertIn("Symbol\tName\tLast Price\tNet Change\t% Change\tBarchart Opinion\tOpinion Score %\tStability (Previous)\tStability (Last Week)\tStability (Last Month)\tWeekly Options\tOptions Cadence\tSignal Strength\tSignal Direction\tRecommended Strategy", tsv_text)
        self.assertIn("AAPL\tApple Inc\t$235.50\t+3.25\t+1.40%\t100% Buy\t100%\t100% Buy\t88% Buy\t80% Buy\tYes\tWeekly\tMaximum (Top 1%)\tStrongest\tBULL_PUT_SPREAD", tsv_text)

        # 4. Test View 190898 CSV export
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_path = Path(tmpdir) / "watchlist_190898.csv"
            agent.export_csv(records, csv_path)
            self.assertTrue(csv_path.exists())
            csv_text = csv_path.read_text(encoding="utf-8")
            self.assertIn("Symbol,Name,Last Price,Price Change,Percent Change,Signal Opinion,Opinion Score %", csv_text)
            self.assertIn("AAPL,Apple Inc,$235.50,+3.25,+1.40%", csv_text)


if __name__ == "__main__":
    unittest.main()
