# -*- coding: utf-8 -*-
"""
Mathematical & Quantitative Verification Test Suite for Options
================================================================
Verifies:
1. Black-Scholes / Binomial pricing matches benchmark test vectors within 0.001 tolerance.
2. Dual-yield formulas accurately annualize leap vs. weekly cycles.
3. Dividend early-exercise triggers correctly flag in-the-money options when C_ext < Div.
4. Newton-Raphson IV solver convergence on known prices.
"""

import math
import unittest
from datetime import date, timedelta

from src.services.options.pricing import (
    black_scholes_price,
    binomial_american_price,
    calculate_greeks,
    solve_implied_volatility,
)
from src.services.options.yield_calculator import (
    calculate_covered_call_yields,
    calculate_roll_opportunity,
)
from src.services.options.dividend_guard import evaluate_early_assignment_risk
from src.services.options.volatility import (
    calculate_realized_volatility,
    calculate_iv_rank_and_percentile,
    calculate_variance_risk_premium,
)


class TestOptionsMath(unittest.TestCase):
    """Quantitative options mathematics and verification test suite."""

    def test_black_scholes_hull_benchmark(self):
        """
        Academic benchmark: S=100, K=100, T=0.25 (91.25d), r=0.05, sigma=0.20, q=0.0
        Hull Options, Futures, and Other Derivatives:
        d1 = 0.175, d2 = 0.075
        N(d1) = 0.56946, N(d2) = 0.52989
        Call price = 100*0.56946 - 100*exp(-0.0125)*0.52989 ≈ 4.6150
        Put price = 4.6150 - 100 + 100*exp(-0.0125) ≈ 3.3725
        """
        spot = 100.0
        strike = 100.0
        dte = 91.25
        r = 0.05
        iv = 0.20
        q = 0.0

        bs_call = black_scholes_price(spot, strike, dte, iv, r=r, q=q, is_call=True)
        bs_put = black_scholes_price(spot, strike, dte, iv, r=r, q=q, is_call=False)

        self.assertAlmostEqual(bs_call, 4.6150, delta=0.005)
        self.assertAlmostEqual(bs_put, 3.3725, delta=0.005)

        # Put-Call Parity: C - P = S - K * exp(-r*T)
        parity_target = spot - strike * math.exp(-r * (dte / 365.0))
        self.assertAlmostEqual(bs_call - bs_put, parity_target, delta=0.001)

    def test_binomial_vs_black_scholes_european_convergence(self):
        """
        When q=0, an American call option has zero early-exercise premium and its
        price must converge to Black-Scholes within 0.02 tolerance for N=100 steps.
        """
        spot = 150.0
        strike = 155.0
        dte = 30.0
        iv = 0.25
        r = 0.045

        bs_call = black_scholes_price(spot, strike, dte, iv, r=r, q=0.0, is_call=True)
        crr_call = binomial_american_price(spot, strike, dte, iv, r=r, q=0.0, is_call=True, steps=100)

        self.assertAlmostEqual(bs_call, crr_call, delta=0.02)

    def test_dual_yield_annualization_leap_vs_weekly(self):
        """
        Verifies dual-yield formulas accurately annualize leap vs weekly cycles.
        Static Return = (Premium / Spot) * (365 / DTE)
        If-Called Return = (Premium + max(0, Strike - Spot)) / Spot * (365 / DTE)
        """
        spot = 200.0
        strike = 210.0  # $10 OTM

        # 1. Weekly cycle: DTE = 7, Premium = $2.00
        weekly_yields = calculate_covered_call_yields(spot=spot, strike=strike, dte_days=7, premium=2.00)
        # Expected static: (2.0 / 200.0) * (365 / 7) * 100 = 1% * 52.1428% = 52.14%
        expected_weekly_static = (2.0 / 200.0) * (365.0 / 7.0) * 100.0
        self.assertAlmostEqual(weekly_yields.static_yield_annualized, expected_weekly_static, delta=0.01)

        # Expected if-called: (2.0 + 10.0) / 200.0 * (365 / 7) * 100 = 6% * 52.1428% = 312.86%
        expected_weekly_called = ((2.0 + 10.0) / 200.0) * (365.0 / 7.0) * 100.0
        self.assertAlmostEqual(weekly_yields.if_called_yield_annualized, expected_weekly_called, delta=0.01)

        # Downside cushion: 2.0 / 200.0 * 100% = 1.0%
        self.assertEqual(weekly_yields.downside_cushion_pct, 1.0)
        self.assertEqual(weekly_yields.breakeven_price, 198.0)

        # 2. LEAP cycle: DTE = 365, Premium = $25.00
        leap_yields = calculate_covered_call_yields(spot=spot, strike=strike, dte_days=365, premium=25.00)
        # Expected static: (25.0 / 200.0) * (365 / 365) * 100 = 12.50%
        self.assertEqual(leap_yields.static_yield_annualized, 12.50)
        # Expected if-called: (25.0 + 10.0) / 200.0 * 100 = 17.50%
        self.assertEqual(leap_yields.if_called_yield_annualized, 17.50)
        self.assertEqual(leap_yields.downside_cushion_pct, 12.50)
        self.assertEqual(leap_yields.breakeven_price, 175.0)

    def test_dividend_early_assignment_risk_trigger(self):
        """
        Verifies early exercise triggers correctly flag ITM options when C_ext < Div.
        """
        today = date(2026, 9, 15)
        exp_date = date(2026, 10, 16)  # 31 days out
        ex_div_date = date(2026, 9, 30)  # Inside expiration window (15 days out)

        # Case 1: Deep ITM call where extrinsic value ($0.40) < dividend ($1.25)
        spot = 120.0
        strike = 100.0  # $20 ITM
        call_market_price = 20.40  # Intrinsic = 20.0, Extrinsic = 0.40
        div_amount = 1.25

        eval_risk = evaluate_early_assignment_risk(
            spot=spot,
            strike=strike,
            call_premium=call_market_price,
            expiration_date=exp_date,
            ex_dividend_date=ex_div_date,
            dividend_amount=div_amount,
            current_date=today,
        )

        self.assertTrue(eval_risk.has_risk)
        self.assertEqual(eval_risk.status, "HIGH_ASSIGNMENT_RISK: DIVIDEND_CAPTURE")
        self.assertAlmostEqual(eval_risk.extrinsic_value, 0.40, delta=0.01)

        # Case 2: OTM Call where extrinsic value ($3.50) > dividend ($1.25)
        otm_call_price = 3.50  # Intrinsic = 0.0, Extrinsic = 3.50
        eval_safe = evaluate_early_assignment_risk(
            spot=100.0,
            strike=105.0,
            call_premium=otm_call_price,
            expiration_date=exp_date,
            ex_dividend_date=ex_div_date,
            dividend_amount=div_amount,
            current_date=today,
        )

        self.assertFalse(eval_safe.has_risk)
        self.assertNotEqual(eval_safe.status, "HIGH_ASSIGNMENT_RISK: DIVIDEND_CAPTURE")

    def test_implied_volatility_solver_roundtrip(self):
        """
        Verifies Newton-Raphson + Brent IV solver recovers the exact volatility from market price.
        """
        spot = 180.0
        strike = 185.0
        dte = 45.0
        true_iv = 32.5  # 32.5%
        r = 0.045

        # Compute price at true IV
        target_price = black_scholes_price(spot, strike, dte, true_iv / 100.0, r=r, q=0.0, is_call=True)

        solved_iv = solve_implied_volatility(
            market_price=target_price,
            spot=spot,
            strike=strike,
            dte_days=dte,
            r=r,
            q=0.0,
            is_call=True,
        )

        self.assertAlmostEqual(solved_iv, true_iv, delta=0.05)


if __name__ == "__main__":
    unittest.main()
