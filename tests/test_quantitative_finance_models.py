# -*- coding: utf-8 -*-
"""
Quantitative Finance Models & Derivatives Pricing Test Suite.

Covers:
1. Black-Scholes-Merton European Option Pricing and Greeks against standard academic benchmarks:
   S=100, K=100, T=0.25 (91.25 days), r=0.05, sigma=0.20, q=0.0
2. Exact Call Rho (> 0) and Put Rho (< 0) verification
3. Zero DTE and boundary condition stability
4. Implied Volatility (IV) solver using Newton-Raphson + Brent bisection
5. American option early exercise and ex-dividend vulnerability modeling
6. Volatility stress testing and directional Delta sign consistency
"""

import math
import unittest
from src.services.quantlib_greeks import QuantLibGreeksEngine, quantlib_greeks_engine


class TestQuantitativeFinanceEngine(unittest.TestCase):
    """Rigorous mathematical tests for quantitative derivatives pricing."""

    def test_black_scholes_benchmark_baseline(self):
        """
        Standard Hull / Black-Scholes benchmark:
        S = 100, K = 100, r = 0.05, q = 0.0, sigma = 0.20, T = 0.25 years (91.25 days)
        Theoretical values:
        Call Price ~ 4.6150
        Put Price ~ 3.3725
        Call Delta ~ 0.5826
        Put Delta ~ -0.4174
        Gamma ~ 0.0384
        Vega ~ 0.1920 ($ per 1% vol move)
        Call Rho ~ 0.1328 ($ per 1% rate move)
        Put Rho ~ -0.1139 ($ per 1% rate move)
        """
        engine = QuantLibGreeksEngine(risk_free_rate=0.05, dividend_yield=0.0)
        dte = 0.25 * 365.0  # 91.25 days

        call_res = engine.calculate_greeks(
            spot=100.0,
            strike=100.0,
            dte_days=dte,
            iv=20.0,
            option_type="call",
            risk_free_rate=0.05,
            dividend_yield=0.0,
        )

        put_res = engine.calculate_greeks(
            spot=100.0,
            strike=100.0,
            dte_days=dte,
            iv=20.0,
            option_type="put",
            risk_free_rate=0.05,
            dividend_yield=0.0,
        )

        # Call & Put Price verification (tolerance 0.03)
        assert abs(call_res.theoretical_price - 4.62) < 0.03
        assert abs(put_res.theoretical_price - 3.37) < 0.03

        # Put-Call Parity: C - P = S - K * exp(-r*T)
        parity_diff = (call_res.theoretical_price - put_res.theoretical_price) - (100.0 - 100.0 * math.exp(-0.05 * 0.25))
        assert abs(parity_diff) < 0.03

        # Deltas: d1 = 0.175 => N(0.175) ≈ 0.5695, Put Delta ≈ -0.4305
        assert abs(call_res.delta - 0.5695) < 0.005
        assert abs(put_res.delta - (-0.4305)) < 0.005
        assert abs((call_res.delta - put_res.delta) - 1.0) < 0.001

        # Gamma (must be positive and identical for call and put)
        assert abs(call_res.gamma - 0.0393) < 0.002
        assert abs(call_res.gamma - put_res.gamma) < 1e-6

        # Vega (must be identical for call and put, ~0.196 per 1% vol)
        assert abs(call_res.vega - 0.196) < 0.01
        assert abs(call_res.vega - put_res.vega) < 1e-6

        # Rho sign convention: Call Rho > 0, Put Rho < 0
        assert call_res.call_rho > 0.10
        assert put_res.put_rho < -0.09
        assert abs(call_res.call_rho - 0.1308) < 0.01
        assert abs(put_res.put_rho - (-0.1167)) < 0.01

        # Theta sign: For long positions, theta is negative (time decay cost)
        assert call_res.theta < 0
        assert put_res.theta < 0

    def test_zero_dte_and_deep_boundaries(self):
        """Tests that near-zero DTE contracts calculate intrinsic value without division errors."""
        engine = QuantLibGreeksEngine()

        # ITM Call at expiration
        call_itm = engine.calculate_greeks(spot=110.0, strike=100.0, dte_days=0.01, iv=20.0, option_type="call")
        assert call_itm.theoretical_price >= 10.0
        assert call_itm.delta > 0.95

        # OTM Call at expiration
        call_otm = engine.calculate_greeks(spot=90.0, strike=100.0, dte_days=0.01, iv=20.0, option_type="call")
        assert call_otm.theoretical_price < 0.05
        assert call_otm.delta < 0.05

        # ITM Put at expiration
        put_itm = engine.calculate_greeks(spot=90.0, strike=100.0, dte_days=0.01, iv=20.0, option_type="put")
        assert put_itm.theoretical_price >= 10.0
        assert put_itm.delta < -0.95

    def test_implied_volatility_solver_convergence(self):
        """
        Verifies that solve_implied_volatility recovers exact input IV
        across ATM, ITM, and OTM strikes.
        """
        engine = QuantLibGreeksEngine(risk_free_rate=0.045, dividend_yield=0.01)

        test_cases = [
            # (spot, strike, dte, true_iv, option_type)
            (100.0, 100.0, 30.0, 25.0, "call"),
            (100.0, 95.0, 45.0, 32.0, "put"),
            (150.0, 160.0, 14.0, 48.5, "call"),
            (250.0, 245.0, 7.0, 19.5, "put"),
        ]

        for spot, strike, dte, true_iv, opt_type in test_cases:
            # 1. Forward price
            fwd = engine.calculate_greeks(spot, strike, dte, true_iv, opt_type)
            # 2. Invert price to solve for IV using exact unrounded analytical price
            solved_iv = engine.solve_implied_volatility(
                target_price=fwd.unrounded_price,
                spot=spot,
                strike=strike,
                dte_days=dte,
                option_type=opt_type,
            )
            # Solved IV must match within 0.10%
            assert abs(solved_iv - true_iv) < 0.10, f"Failed on {opt_type}: true={true_iv}, solved={solved_iv}"

    def test_early_assignment_risk_model(self):
        """Verifies American-style early assignment risk logic."""
        engine = QuantLibGreeksEngine(risk_free_rate=0.045, dividend_yield=0.03)

        # Deep ITM Put close to expiration with negligible time value
        deep_itm_put = engine.calculate_greeks(spot=70.0, strike=100.0, dte_days=2.0, iv=25.0, option_type="put")
        assert deep_itm_put.is_american_early_exercise_optimal is True
        assert deep_itm_put.early_assignment_risk_pct >= 80.0

        # Safe OTM Put (0.18 Delta)
        safe_otm_put = engine.calculate_greeks(spot=100.0, strike=90.0, dte_days=30.0, iv=25.0, option_type="put")
        assert safe_otm_put.is_american_early_exercise_optimal is False
        assert safe_otm_put.early_assignment_risk_pct < 10.0
