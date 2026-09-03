# -*- coding: utf-8 -*-
"""
Unit tests for MarketDashboardPayload, TickerSignal, OptionsIdea, and format_pipeline_output.
"""

import unittest
from src.schemas.market_dashboard import (
    OptionsIdea,
    TickerSignal,
    MarketDashboardPayload,
    format_pipeline_output,
)


class TestMarketDashboardSchema(unittest.TestCase):
    def test_options_idea_annualized_yield(self):
        idea = OptionsIdea(
            strategy="CASH_SECURED_PUT",
            strike_price=100.0,
            expiration="30 DTE",
            delta=0.20,
            premium_bid=2.50,
            implied_volatility_rank=45.0,
        )
        # raw_yield = 2.50 / 100 = 0.025
        # annualized = (0.025 * (365 / 30)) * 100 = 30.4166... -> 30.42
        self.assertEqual(idea.annualized_yield_pct, 30.42)

    def test_options_idea_zero_strike_guard(self):
        idea = OptionsIdea(
            strategy="CASH_SECURED_PUT",
            strike_price=0.0,
            expiration="30 DTE",
            delta=0.20,
            premium_bid=1.00,
            implied_volatility_rank=20.0,
        )
        self.assertEqual(idea.annualized_yield_pct, 0.0)

    def test_ticker_signal_computed_fields(self):
        # Tier 1 High Conviction: conviction >= 8.0, RR >= 2.0
        tier1 = TickerSignal(
            ticker="NVDA",
            company_name="Nvidia Corp",
            bias="BULLISH",
            conviction_score=8.5,
            current_price=120.0,
            entry_level=118.0,
            target_price=138.0,  # upside = 20.0
            stop_loss=110.0,  # downside = 8.0 -> RR = 2.5
            primary_catalyst="AI chip volume expansion",
        )
        self.assertEqual(tier1.risk_reward_ratio, 2.5)
        self.assertEqual(tier1.actionable_grade, "Tier 1: High Conviction")

        # Tier 2 Actionable: conviction >= 6.5, RR < 2.0
        tier2 = TickerSignal(
            ticker="AAPL",
            company_name="Apple Inc",
            bias="BULLISH",
            conviction_score=7.0,
            current_price=220.0,
            entry_level=218.0,
            target_price=225.0,  # upside = 7.0
            stop_loss=213.0,  # downside = 5.0 -> RR = 1.4
            primary_catalyst="iPhone launch cycle",
        )
        self.assertEqual(tier2.risk_reward_ratio, 1.4)
        self.assertEqual(tier2.actionable_grade, "Tier 2: Actionable")

        # Tier 3 Watchlist Only
        tier3 = TickerSignal(
            ticker="INTC",
            company_name="Intel Corp",
            bias="NEUTRAL",
            conviction_score=5.0,
            current_price=22.0,
            entry_level=21.5,
            target_price=23.0,
            stop_loss=20.5,
            primary_catalyst="Foundry turnaround",
        )
        self.assertEqual(tier3.actionable_grade, "Tier 3: Watchlist Only")

    def test_ticker_signal_zero_downside_guard(self):
        signal = TickerSignal(
            ticker="TEST",
            company_name="Test Co",
            bias="NEUTRAL",
            conviction_score=5.0,
            current_price=10.0,
            entry_level=10.0,
            target_price=15.0,
            stop_loss=10.0,  # entry == stop_loss -> downside = 0
            primary_catalyst="None",
        )
        self.assertEqual(signal.risk_reward_ratio, 0.0)

    def test_format_pipeline_output(self):
        raw = [
            {
                "ticker": "eose",
                "name": "Eos Energy Enterprises",
                "bias": "bullish",
                "score": 8.2,
                "close": 2.85,
                "entry": 2.70,
                "target": 4.10,
                "stop": 2.20,
                "catalyst": "Znyth battery manufacturing DOE loan",
                "markdown": "### EOSE Bull Case\nLong duration energy storage...",
                "options": {
                    "strategy": "CASH_SECURED_PUT",
                    "strike_price": 2.50,
                    "expiration": "35 DTE",
                    "delta": 0.20,
                    "premium_bid": 0.25,
                    "implied_volatility_rank": 68.0,
                },
            },
            {
                "ticker": "tsla",
                "name": "Tesla Inc",
                "bias": "bearish",
                "score": 4.0,
                "close": 210.0,
                "entry": 212.0,
                "target": 185.0,
                "stop": 225.0,
                "catalyst": "Robotaxi regulatory delay",
                "markdown": "Short setup on macro slowdown.",
            },
        ]

        payload = format_pipeline_output(raw)
        self.assertIsInstance(payload, MarketDashboardPayload)
        self.assertEqual(payload.total_screened, 2)
        self.assertEqual(len(payload.signals), 2)

        eose = payload.signals[0]
        self.assertEqual(eose.ticker, "EOSE")
        self.assertEqual(eose.company_name, "Eos Energy Enterprises")
        self.assertEqual(eose.bias, "BULLISH")
        self.assertEqual(eose.conviction_score, 8.2)
        self.assertEqual(eose.current_price, 2.85)
        self.assertEqual(eose.entry_level, 2.70)
        self.assertEqual(eose.target_price, 4.10)
        self.assertEqual(eose.stop_loss, 2.20)
        self.assertEqual(eose.actionable_grade, "Tier 1: High Conviction")
        self.assertIsNotNone(eose.options_idea)
        self.assertEqual(eose.options_idea.strike_price, 2.50)
        self.assertGreater(eose.options_idea.annualized_yield_pct, 0)

        tsla = payload.signals[1]
        self.assertEqual(tsla.ticker, "TSLA")
        self.assertEqual(tsla.bias, "BEARISH")
        self.assertEqual(tsla.conviction_score, 4.0)
        self.assertEqual(tsla.actionable_grade, "Tier 3: Watchlist Only")
        self.assertIsNone(tsla.options_idea)


if __name__ == "__main__":
    unittest.main()
