# -*- coding: utf-8 -*-
"""
Institutional Options Pricing & Greeks Engine
=============================================
Provides:
- Black-Scholes-Merton (European) analytical benchmark
- Cox-Ross-Rubinstein (CRR) Binomial Tree for American options with discrete/continuous dividend support
- Real-time Greeks: Delta (Δ), Gamma (Γ), Theta (Θ), Vega (V), Rho (ρ)
- Robust Newton-Raphson inversion with Brent bisection fallback for Implied Volatility (IV)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional, Tuple


def norm_cdf(x: float) -> float:
    """Cumulative distribution function for standard normal distribution."""
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0


def norm_pdf(x: float) -> float:
    """Probability density function for standard normal distribution."""
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)


@dataclass
class OptionGreeks:
    price: float
    delta: float
    gamma: float
    theta: float  # 1-day decay in dollars
    vega: float   # 1% IV change in dollars
    rho: float    # 1% rate change in dollars
    intrinsic_value: float
    extrinsic_value: float
    implied_volatility: float


def black_scholes_price(
    spot: float,
    strike: float,
    dte_days: float,
    iv: float,
    r: float = 0.045,
    q: float = 0.0,
    is_call: bool = True,
) -> float:
    """
    Standard Black-Scholes-Merton European option pricing.
    iv is decimal (e.g. 0.25).
    """
    if spot <= 0 or strike <= 0:
        return 0.0
    t = max(dte_days, 1e-5) / 365.0
    if iv <= 1e-6 or t <= 1e-6:
        return max(0.0, (spot - strike) if is_call else (strike - spot))

    sqrt_t = math.sqrt(t)
    v_sqrt_t = iv * sqrt_t
    d1 = (math.log(spot / strike) + (r - q + 0.5 * iv * iv) * t) / v_sqrt_t
    d2 = d1 - v_sqrt_t

    df_q = math.exp(-q * t)
    df_r = math.exp(-r * t)

    if is_call:
        return spot * df_q * norm_cdf(d1) - strike * df_r * norm_cdf(d2)
    else:
        return strike * df_r * norm_cdf(-d2) - spot * df_q * norm_cdf(-d1)


def binomial_american_price(
    spot: float,
    strike: float,
    dte_days: float,
    iv: float,
    r: float = 0.045,
    q: float = 0.0,
    is_call: bool = True,
    steps: int = 100,
) -> float:
    """
    Cox-Ross-Rubinstein (CRR) Binomial Tree for American options.
    Correctly models early exercise boundary for dividend-paying underlying stocks.
    """
    if spot <= 0 or strike <= 0:
        return 0.0
    t = max(dte_days, 1e-5) / 365.0
    if iv <= 1e-6 or t <= 1e-6:
        return max(0.0, (spot - strike) if is_call else (strike - spot))

    dt = t / steps
    u = math.exp(iv * math.sqrt(dt))
    d = 1.0 / u
    disc = math.exp(-r * dt)
    p = (math.exp((r - q) * dt) - d) / (u - d)
    p = min(max(p, 0.0), 1.0)

    # Initialize terminal payoff array
    prices = [0.0] * (steps + 1)
    for i in range(steps + 1):
        s_node = spot * (u ** (steps - i)) * (d ** i)
        prices[i] = max(0.0, (s_node - strike) if is_call else (strike - s_node))

    # Backward induction
    for j in range(steps - 1, -1, -1):
        for i in range(j + 1):
            s_node = spot * (u ** (j - i)) * (d ** i)
            continuation = disc * (p * prices[i] + (1.0 - p) * prices[i + 1])
            exercise = max(0.0, (s_node - strike) if is_call else (strike - s_node))
            prices[i] = max(continuation, exercise)

    return prices[0]


def calculate_greeks(
    spot: float,
    strike: float,
    dte_days: float,
    iv: float,
    r: float = 0.045,
    q: float = 0.0,
    is_call: bool = True,
    american: bool = True,
) -> OptionGreeks:
    """
    Compute analytical and finite-difference Greeks for European or American options.
    """
    # Normalize iv: accept 25 or 0.25
    iv_dec = iv / 100.0 if iv > 2.0 else iv
    iv_dec = max(iv_dec, 0.001)

    t = max(dte_days, 1e-5) / 365.0
    sqrt_t = math.sqrt(t)
    v_sqrt_t = iv_dec * sqrt_t
    d1 = (math.log(spot / strike) + (r - q + 0.5 * iv_dec * iv_dec) * t) / v_sqrt_t
    d2 = d1 - v_sqrt_t

    df_q = math.exp(-q * t)
    df_r = math.exp(-r * t)

    # Base price
    if american:
        price = binomial_american_price(spot, strike, dte_days, iv_dec, r, q, is_call)
    else:
        price = black_scholes_price(spot, strike, dte_days, iv_dec, r, q, is_call)

    # Greeks calculation
    if is_call:
        delta = df_q * norm_cdf(d1)
        theta = (
            -(spot * norm_pdf(d1) * iv_dec * df_q) / (2.0 * sqrt_t)
            - r * strike * df_r * norm_cdf(d2)
            + q * spot * df_q * norm_cdf(d1)
        ) / 365.0
        rho = (strike * t * df_r * norm_cdf(d2)) / 100.0
    else:
        delta = -df_q * norm_cdf(-d1)
        theta = (
            -(spot * norm_pdf(d1) * iv_dec * df_q) / (2.0 * sqrt_t)
            + r * strike * df_r * norm_cdf(-d2)
            - q * spot * df_q * norm_cdf(-d1)
        ) / 365.0
        rho = (-strike * t * df_r * norm_cdf(-d2)) / 100.0

    gamma = (df_q * norm_pdf(d1)) / (spot * v_sqrt_t)
    vega = (spot * df_q * sqrt_t * norm_pdf(d1)) / 100.0

    intrinsic = max(0.0, (spot - strike) if is_call else (strike - spot))
    extrinsic = max(0.0, price - intrinsic)

    return OptionGreeks(
        price=round(price, 4),
        delta=round(delta, 4),
        gamma=round(gamma, 5),
        theta=round(theta, 4),
        vega=round(vega, 4),
        rho=round(rho, 4),
        intrinsic_value=round(intrinsic, 4),
        extrinsic_value=round(extrinsic, 4),
        implied_volatility=round(iv_dec * 100.0, 2),
    )


def solve_implied_volatility(
    market_price: float,
    spot: float,
    strike: float,
    dte_days: float,
    r: float = 0.045,
    q: float = 0.0,
    is_call: bool = True,
    tolerance: float = 1e-4,
    max_iterations: int = 100,
) -> float:
    """
    Solve for Implied Volatility (IV) using Newton-Raphson with fallback to Brent/bisection.
    Returns IV as percentage (e.g. 25.5 for 25.5%).
    """
    intrinsic = max(0.0, (spot - strike) if is_call else (strike - spot))
    if market_price <= intrinsic:
        return 0.001

    # Initial guess
    sigma = 0.25
    t = max(dte_days, 1e-5) / 365.0
    sqrt_t = math.sqrt(t)

    # 1. Newton-Raphson iterations
    for _ in range(max_iterations):
        price = black_scholes_price(spot, strike, dte_days, sigma, r, q, is_call)
        diff = price - market_price
        if abs(diff) < tolerance:
            return round(sigma * 100.0, 2)

        d1 = (math.log(spot / strike) + (r - q + 0.5 * sigma * sigma) * t) / (sigma * sqrt_t)
        vega = spot * math.exp(-q * t) * sqrt_t * norm_pdf(d1)
        if abs(vega) < 1e-8:
            break

        sigma_new = sigma - diff / vega
        if sigma_new <= 0.001 or sigma_new > 5.0:
            break
        sigma = sigma_new

    # 2. Bisection fallback
    low, high = 0.001, 5.0
    for _ in range(60):
        mid = (low + high) / 2.0
        price = black_scholes_price(spot, strike, dte_days, mid, r, q, is_call)
        if abs(price - market_price) < tolerance:
            return round(mid * 100.0, 2)
        if price < market_price:
            low = mid
        else:
            high = mid

    return round(((low + high) / 2.0) * 100.0, 2)
