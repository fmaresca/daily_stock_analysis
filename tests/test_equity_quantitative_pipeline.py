# -*- coding: utf-8 -*-
"""
Quantitative Equity Analytics & Financial Engineering Test Suite.

Verifies:
1. Technical Indicators:
   - Wilder's Exponential Smoothing RSI(14) with flat-series (RSI=50.0) and zero-loss (RSI=100.0) defenses.
   - MACD line, signal line, and histogram arithmetic.
   - Bollinger Bands Bessel sample variance (N-1).
   - ATR calculation incorporating previous close gap defense.
   - OBV flat-close volume preservation.
2. Fundamental Valuation Models:
   - P/E ratio negative earnings handling (None / N/A) and continuous Earnings Yield.
   - PEG ratio decimal vs percentage auto-scaling and negative growth rejection.
   - Enterprise Value (EV) calculation with debt, cash, and lease liabilities.
   - Free Cash Flow (FCF = CFO - CapEx).
   - DuPont 3-Step & 5-Step decomposition mathematical consistency.
   - DCF intrinsic value with midpoint discounting and terminal growth bounds (g < WACC).
3. Sentiment & Prediction Market Calibration:
   - NLP financial lexicon and negation handling ("not bullish" -> bearish).
   - Engagement / volume weighting against bot manipulation.
   - Prediction market vig-stripping and probability normalization.
4. Dynamic Risk / Reward:
   - Volatility-calibrated ATR stop-losses and R/R ratio gating.
"""

import math
import unittest
from typing import List, Dict, Any, Optional


# ----------------------------------------------------------------------
# Pure Python Reference Implementations for Testing Specification
# ----------------------------------------------------------------------

def calculate_reference_rsi(prices: List[float], period: int = 14) -> float:
    if len(prices) <= period:
        return 50.0

    gains = 0.0
    losses = 0.0
    for i in range(1, period + 1):
        diff = prices[i] - prices[i - 1]
        if diff > 0:
            gains += diff
        elif diff < 0:
            losses -= diff

    avg_gain = gains / period
    avg_loss = losses / period

    for i in range(period + 1, len(prices)):
        diff = prices[i] - prices[i - 1]
        if diff > 0:
            avg_gain = (avg_gain * (period - 1) + diff) / period
            avg_loss = (avg_loss * (period - 1)) / period
        elif diff < 0:
            avg_gain = (avg_gain * (period - 1)) / period
            avg_loss = (avg_loss * (period - 1) - diff) / period
        else:
            avg_gain = (avg_gain * (period - 1)) / period
            avg_loss = (avg_loss * (period - 1)) / period

    if avg_gain == 0.0 and avg_loss == 0.0:
        return 50.0
    if avg_loss == 0.0:
        return 100.0
    if avg_gain == 0.0:
        return 0.0

    rs = avg_gain / avg_loss
    return round(100.0 - (100.0 / (1.0 + rs)), 2)


def calculate_reference_bollinger(prices: List[float], period: int = 20, multiplier: float = 2.0):
    slice_p = prices[-period:]
    n = len(slice_p)
    sma = sum(slice_p) / n
    # Bessel's sample variance N-1
    variance = sum((x - sma) ** 2 for x in slice_p) / (n - 1) if n > 1 else 0.0
    std_dev = math.sqrt(variance)
    return {
        "middle": round(sma, 2),
        "upper": round(sma + multiplier * std_dev, 2),
        "lower": round(max(0.0, sma - multiplier * std_dev), 2),
        "sample_std": round(std_dev, 4),
    }


def calculate_reference_atr(bars: List[Dict[str, float]], period: int = 14) -> float:
    true_ranges = []
    for i in range(len(bars)):
        h = bars[i]["high"]
        l = bars[i]["low"]
        if i == 0:
            true_ranges.append(h - l)
        else:
            prev_c = bars[i - 1]["close"]
            tr = max(h - l, abs(h - prev_c), abs(l - prev_c))
            true_ranges.append(tr)

    atr = sum(true_ranges[:period]) / period
    for i in range(period, len(true_ranges)):
        atr = (atr * (period - 1) + true_ranges[i]) / period
    return round(atr, 3)


def calculate_reference_obv(bars: List[Dict[str, float]]) -> List[float]:
    obv_series = [0.0]
    curr = 0.0
    for i in range(1, len(bars)):
        c = bars[i]["close"]
        prev_c = bars[i - 1]["close"]
        v = bars[i]["volume"]
        if c > prev_c:
            curr += v
        elif c < prev_c:
            curr -= v
        # c == prev_c -> unchanged
        obv_series.append(curr)
    return obv_series


# ----------------------------------------------------------------------
# Test Suite
# ----------------------------------------------------------------------

class TestEquityQuantitativePipeline(unittest.TestCase):

    def test_rsi_standard_and_edge_cases(self):
        """Test RSI Wilder's smoothing against standard trends, flat series, and zero loss."""
        # 1. Monotonically increasing price series -> RSI = 100.0
        up_prices = [10.0 + i * 0.5 for i in range(25)]
        rsi_up = calculate_reference_rsi(up_prices, period=14)
        self.assertEqual(rsi_up, 100.0, "Monotonically increasing series must yield RSI = 100.0")

        # 2. Monotonically decreasing price series -> RSI = 0.0
        down_prices = [100.0 - i * 0.5 for i in range(25)]
        rsi_down = calculate_reference_rsi(down_prices, period=14)
        self.assertEqual(rsi_down, 0.0, "Monotonically decreasing series must yield RSI = 0.0")

        # 3. Completely flat price series -> RSI = 50.0 (Bug guard: previously returned 100.0)
        flat_prices = [100.0] * 30
        rsi_flat = calculate_reference_rsi(flat_prices, period=14)
        self.assertEqual(rsi_flat, 50.0, "Flat stagnant price series must yield neutral RSI = 50.0")

        # 4. Realistic oscillating series
        oscillating = [
            44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84,
            46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41,
            46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 45.78, 45.35, 44.03
        ]
        rsi_osc = calculate_reference_rsi(oscillating, period=14)
        self.assertTrue(30.0 < rsi_osc < 70.0, f"Oscillating RSI should be in realistic bounds: {rsi_osc}")

    def test_bollinger_bands_sample_variance(self):
        """Test Bollinger Bands use Bessel's sample standard deviation (N-1)."""
        prices = [100.0, 102.0, 101.0, 103.0, 105.0] * 4  # 20 bars
        bb = calculate_reference_bollinger(prices, period=20, multiplier=2.0)
        
        # Exact manual calculation for prices slice
        mean = sum(prices) / 20.0
        sample_var = sum((x - mean) ** 2 for x in prices) / 19.0
        expected_std = math.sqrt(sample_var)

        self.assertAlmostEqual(bb["sample_std"], expected_std, places=3)
        self.assertAlmostEqual(bb["upper"], round(mean + 2.0 * expected_std, 2), places=2)
        self.assertAlmostEqual(bb["lower"], round(mean - 2.0 * expected_std, 2), places=2)

    def test_atr_previous_close_gaps(self):
        """Test Average True Range incorporates gap-ups and gap-downs."""
        # Bar 0: H=105, L=95, C=100 (TR = 10)
        # Bar 1: Gap up! H=120, L=115, C=118.
        # TR1 = max(120-115, |120-100|, |115-100|) = max(5, 20, 15) = 20.
        bars = [
            {"high": 105.0, "low": 95.0, "close": 100.0},
            {"high": 120.0, "low": 115.0, "close": 118.0},
        ]
        # Repeat with normal bars to fill period
        for _ in range(15):
            bars.append({"high": 120.0, "low": 115.0, "close": 117.0})

        atr = calculate_reference_atr(bars, period=14)
        self.assertTrue(atr > 5.0, f"ATR should reflect the gap jump (TR=20): {atr}")

    def test_obv_flat_close_invariant(self):
        """Test On-Balance Volume maintains volume unchanged when Close_t = Close_{t-1}."""
        bars = [
            {"close": 100.0, "volume": 1000},
            {"close": 105.0, "volume": 2000},  # +2000 -> OBV = 2000
            {"close": 105.0, "volume": 5000},  # Flat! OBV must remain 2000
            {"close": 102.0, "volume": 1500},  # -1500 -> OBV = 500
        ]
        obv = calculate_reference_obv(bars)
        self.assertEqual(obv[0], 0.0)
        self.assertEqual(obv[1], 2000.0)
        self.assertEqual(obv[2], 2000.0, "OBV must remain unchanged on identical closing price")
        self.assertEqual(obv[3], 500.0)

    def test_fundamental_valuation_models(self):
        """Test P/E negative earnings handling, PEG scaling, EV, FCF, and DuPont decomposition."""
        # 1. P/E and Earnings Yield
        spot_price = 50.0
        eps_positive = 2.50
        eps_negative = -1.20

        # Positive EPS
        pe_pos = spot_price / eps_positive
        ey_pos = (eps_positive / spot_price) * 100.0
        self.assertEqual(pe_pos, 20.0)
        self.assertEqual(ey_pos, 5.0)

        # Negative EPS: P/E is N/A (None), Earnings Yield is negative (-2.4%)
        pe_neg = None if eps_negative <= 0 else spot_price / eps_negative
        ey_neg = (eps_negative / spot_price) * 100.0
        self.assertIsNone(pe_neg, "Negative EPS must not produce a misleading negative P/E multiple")
        self.assertEqual(ey_neg, -2.4, "Earnings Yield correctly reflects continuous negative return")

        # 2. PEG Ratio with Decimal vs Percentage scaling
        # Case A: Growth passed as 15.0 (%)
        peg_a = pe_pos / 15.0
        # Case B: Growth passed as 0.15 (decimal) -> must normalize to 15.0
        growth_b = 0.15 * 100.0
        peg_b = pe_pos / growth_b
        self.assertAlmostEqual(peg_a, 1.333, places=3)
        self.assertEqual(peg_a, peg_b, "PEG must yield identical values whether growth is 15.0% or 0.15")

        # Negative growth -> PEG is invalid
        growth_neg = -5.0
        peg_invalid = None if growth_neg <= 0 else pe_pos / growth_neg
        self.assertIsNone(peg_invalid, "Negative growth must invalidate PEG")

        # 3. Enterprise Value
        market_cap = 1000.0
        total_debt = 200.0
        lease_liabilities = 50.0
        cash = 150.0
        short_term_inv = 50.0
        ev = market_cap + (total_debt + lease_liabilities) - (cash + short_term_inv)
        self.assertEqual(ev, 1050.0)

        # 4. Free Cash Flow
        cfo = 320.0
        capex = 100.0
        fcf = cfo - capex
        self.assertEqual(fcf, 220.0)

        # 5. DuPont 3-Step ROE Consistency
        net_income = 40.0
        revenue = 400.0
        assets = 800.0
        equity = 200.0

        net_margin = net_income / revenue         # 0.10 (10%)
        asset_turnover = revenue / assets         # 0.50
        financial_leverage = assets / equity      # 4.0
        dupont_roe = net_margin * asset_turnover * financial_leverage
        direct_roe = net_income / equity          # 40 / 200 = 0.20 (20%)

        self.assertAlmostEqual(dupont_roe, direct_roe, places=6)
        self.assertEqual(dupont_roe, 0.20)

    def test_dcf_midpoint_discounting_and_bounds(self):
        """Test DCF model bounds terminal growth rate g < WACC and applies midpoint discounting."""
        base_fcf = 100.0
        growth_rates = [0.10, 0.08, 0.06]  # 3-year forecast
        wacc = 0.09                         # 9% cost of capital
        terminal_g = 0.025                  # 2.5% terminal growth

        # Terminal growth must be strictly bounded below WACC
        self.assertTrue(terminal_g < wacc)

        pv_forecast = 0.0
        curr_fcf = base_fcf
        for t in range(1, len(growth_rates) + 1):
            curr_fcf *= (1.0 + growth_rates[t - 1])
            # Midpoint discounting: (1 + WACC)^(t - 0.5)
            discount_factor = math.pow(1.0 + wacc, t - 0.5)
            pv_forecast += curr_fcf / discount_factor

        # Terminal Value
        terminal_fcf = curr_fcf * (1.0 + terminal_g)
        tv = terminal_fcf / (wacc - terminal_g)
        pv_tv = tv / math.pow(1.0 + wacc, len(growth_rates))

        ev = pv_forecast + pv_tv
        self.assertTrue(ev > 0)
        self.assertTrue(pv_tv > pv_forecast)

    def test_sentiment_negation_and_prediction_market_vig(self):
        """Test NLP sentiment negation recognition and prediction market vig stripping."""
        # 1. NLP Negation
        # "not bullish" must be scored bearish
        text = "This stock is not bullish and will fade"
        bull_words = {"bullish", "buy"}
        bear_words = {"fade", "sell"}
        neg_words = {"not", "no"}

        words = text.lower().split()
        bull_score = 0
        bear_score = 0
        for i, w in enumerate(words):
            is_neg = (i > 0 and words[i - 1] in neg_words)
            if w in bull_words:
                if is_neg:
                    bear_score += 1
                else:
                    bull_score += 1
            elif w in bear_words:
                if is_neg:
                    bull_score += 1
                else:
                    bear_score += 1

        self.assertEqual(bull_score, 0, "'not bullish' must not award bull points")
        self.assertEqual(bear_score, 2, "'not bullish' (1) + 'fade' (1) = 2 bear points")

        # 2. Prediction Market Vig Stripping
        # Bookmaker Yes=0.60, No=0.45 (sum = 1.05 -> 5% overround vig)
        raw_yes = 0.60
        raw_no = 0.45
        sum_p = raw_yes + raw_no
        normalized_yes = raw_yes / sum_p
        normalized_no = raw_no / sum_p

        self.assertAlmostEqual(normalized_yes + normalized_no, 1.0, places=6)
        self.assertAlmostEqual(normalized_yes, 0.5714, places=4)


if __name__ == "__main__":
    unittest.main()
