import unittest
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.quantlib_greeks import quantlib_greeks_engine, OptionGreeksResult
from src.services.cef_analytics_service import cef_analytics_service, CEFValuationResult
from src.services.risk_circuit_breaker import risk_circuit_breaker, CircuitBreakerStatus
from src.services.contextual_intelligence_service import enrich_ticker_payload


class TestQuantLibGreeks(unittest.TestCase):
    def test_bsm_european_call_put(self):
        # Spot $100, Strike $100, 30 DTE, IV 25%, r 4.5%
        res = quantlib_greeks_engine.calculate_greeks(
            spot=100.0,
            strike=100.0,
            dte_days=30,
            iv=25.0,
            option_type="put",
            risk_free_rate=0.045,
            dividend_yield=0.0
        )
        self.assertIsInstance(res, OptionGreeksResult)
        self.assertGreater(res.theoretical_price, 0.0)
        self.assertLess(res.delta, 0.0)
        self.assertGreater(res.gamma, 0.0)
        self.assertLess(res.theta, 0.0)
        self.assertGreater(res.vega, 0.0)

    def test_baw_american_put_early_exercise(self):
        # Deep ITM Put: Spot $80, Strike $100
        res = quantlib_greeks_engine.calculate_greeks(
            spot=80.0,
            strike=100.0,
            dte_days=2,
            iv=25.0,
            option_type="put",
            risk_free_rate=0.045,
            dividend_yield=0.03
        )
        self.assertTrue(res.is_american_early_exercise_optimal)
        self.assertGreater(res.early_assignment_risk_pct, 50.0)


class TestCEFAnalytics(unittest.TestCase):
    def test_clm_cef_metrics(self):
        res = cef_analytics_service.analyze_fund(
            symbol="UTF",
            market_price=22.50,
            nav_price=23.50,
            distribution_yield_pct=7.5
        )
        self.assertIsInstance(res, CEFValuationResult)
        self.assertEqual(res.symbol, "UTF")
        self.assertLess(res.discount_premium_pct, 0.0)  # Trading at discount
        self.assertIn(res.valuation_status, ["FAIR_VALUE", "CHEAP_EXPANSION_BUY", "RICH_CONTRACTION_AVOID"])

    def test_jepi_covered_call_etf(self):
        res = cef_analytics_service.analyze_fund(
            symbol="JEPI",
            market_price=56.50
        )
        self.assertEqual(res.symbol, "JEPI")
        self.assertIn(res.roc_type, ["CONSTRUCTIVE", "NONE"])


class TestRiskCircuitBreaker(unittest.TestCase):
    def test_order_risk_check_approved(self):
        status = risk_circuit_breaker.check_portfolio_health(
            current_equity=100000.0,
            peak_equity=102000.0,
            positions=[{"symbol": "SPY", "collateral": 15000.0, "delta": 0.05}],
            proposed_order={"symbol": "AAPL", "collateral_required": 8000.0, "delta": 0.02}
        )
        self.assertIsInstance(status, CircuitBreakerStatus)
        self.assertFalse(status.is_halted)
        self.assertFalse(status.is_delta_balanced is False and len(status.breached_limits) > 0)

    def test_drawdown_circuit_breaker_halt(self):
        status = risk_circuit_breaker.check_portfolio_health(
            current_equity=80000.0,
            peak_equity=100000.0,  # 20% Drawdown (exceeds 12% default)
            positions=[{"symbol": "NVDA", "collateral": 20000.0, "delta": 0.10}],
            proposed_order={"symbol": "MSFT", "collateral_required": 10000.0, "delta": 0.02}
        )
        self.assertTrue(status.is_halted)
        self.assertIn("MAX_DRAWDOWN_BREACH", status.halt_reason)


class TestContextualIntelligence(unittest.TestCase):
    def test_enrich_ticker_payload_structure(self):
        data = enrich_ticker_payload("SPY")
        self.assertEqual(data["symbol"], "SPY")
        self.assertIn("analyst_intelligence", data)
        self.assertIn("corporate_actions", data)
        self.assertIn("news_feed", data)
        self.assertIn("prediction_markets", data)
        self.assertIn("social_sentiment", data)


if __name__ == '__main__':
    unittest.main()
