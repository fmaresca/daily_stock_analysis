# -*- coding: utf-8 -*-
"""
Covered Call Yield & Downside Protection Calculator
===================================================
Formulas:
- Static (Uncalled) Return: (Premium received / Spot Price) * (365 / DTE)
- Assigned (If-Called) Return: [Premium + max(0, Strike - Spot)] / Spot Price * (365 / DTE)
- Downside Protection Cushion: (Premium / Spot Price) * 100%
- Net Roll Economics: (New Premium - BTC Cost) / Spot Price
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class CoveredCallYieldMetrics:
    spot_price: float
    strike_price: float
    dte: int
    premium: float  # Bid or Mid premium received
    static_yield_annualized: float
    static_yield_absolute: float
    if_called_yield_annualized: float
    if_called_yield_absolute: float
    downside_cushion_pct: float
    breakeven_price: float
    upside_capital_gain_pct: float


def calculate_covered_call_yields(
    spot: float,
    strike: float,
    dte_days: int,
    premium: float,
) -> CoveredCallYieldMetrics:
    """
    Computes annualized and absolute yields for covered calls.

    :param spot: Current underlying price ($)
    :param strike: Call strike price ($)
    :param dte_days: Days to expiration ($DTE \ge 1$)
    :param premium: Option premium received per share ($)
    """
    if spot <= 0.0:
        raise ValueError("Spot price must be strictly positive.")

    dte = max(1, dte_days)
    annualization_factor = 365.0 / dte

    # 1. Static (Uncalled) Yield
    # Income generated if the stock stays flat or moves slightly below strike
    static_abs = premium / spot
    static_ann = static_abs * annualization_factor * 100.0

    # 2. Assigned (If-Called) Yield
    # Capital gain up to strike + premium received
    capital_gain = max(0.0, strike - spot)
    if_called_abs = (premium + capital_gain) / spot
    if_called_ann = if_called_abs * annualization_factor * 100.0

    # 3. Downside Protection Cushion
    cushion_pct = (premium / spot) * 100.0
    breakeven = spot - premium
    upside_gain_pct = (capital_gain / spot) * 100.0

    return CoveredCallYieldMetrics(
        spot_price=round(spot, 2),
        strike_price=round(strike, 2),
        dte=dte,
        premium=round(premium, 2),
        static_yield_annualized=round(static_ann, 2),
        static_yield_absolute=round(static_abs * 100.0, 2),
        if_called_yield_annualized=round(if_called_ann, 2),
        if_called_yield_absolute=round(if_called_abs * 100.0, 2),
        downside_cushion_pct=round(cushion_pct, 2),
        breakeven_price=round(breakeven, 2),
        upside_capital_gain_pct=round(upside_gain_pct, 2),
    )


@dataclass
class RollOpportunity:
    new_strike: float
    new_expiration: str
    new_dte: int
    new_bid: float
    btc_ask: float
    net_credit: float
    new_annualized_yield: float
    delta_adjustment: float
    recommendation_score: float
    rationale: str


def calculate_roll_opportunity(
    spot: float,
    cost_basis: float,
    current_strike: float,
    current_call_ask: float,
    candidate_strike: float,
    candidate_bid: float,
    candidate_expiration: str,
    candidate_dte: int,
    current_delta: float,
    candidate_delta: float,
) -> RollOpportunity:
    """
    Computes net credit and revised annualized return for rolling out & up.
    """
    # Net credit = Premium collected from selling new call - Cost to buy back current call
    net_credit = candidate_bid - current_call_ask
    delta_adjustment = candidate_delta - current_delta

    dte = max(1, candidate_dte)
    # Annualized return from new position based on spot or cost basis
    base_price = max(spot, cost_basis, 1.0)
    capital_gain = max(0.0, candidate_strike - spot)
    new_ann_yield = ((candidate_bid + capital_gain) / base_price) * (365.0 / dte) * 100.0

    # Score: Prefer positive net credit + strike increase + reduction in assignment risk (lower delta)
    strike_diff = candidate_strike - current_strike
    score = 50.0 + (net_credit * 10.0) + (strike_diff / spot * 100.0) - (abs(candidate_delta - 0.25) * 50.0)
    score = max(5.0, min(99.0, score))

    if net_credit > 0:
        rationale = f"Roll for a net credit of ${net_credit:.2f} while moving strike up by ${strike_diff:.2f}."
    else:
        rationale = f"Roll requires a net debit of ${abs(net_credit):.2f} to recapture upside up to ${candidate_strike:.2f}."

    return RollOpportunity(
        new_strike=candidate_strike,
        new_expiration=candidate_expiration,
        new_dte=candidate_dte,
        new_bid=candidate_bid,
        btc_ask=current_call_ask,
        net_credit=round(net_credit, 2),
        new_annualized_yield=round(new_ann_yield, 2),
        delta_adjustment=round(delta_adjustment, 4),
        recommendation_score=round(score, 1),
        rationale=rationale,
    )
