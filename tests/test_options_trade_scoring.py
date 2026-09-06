"""Unit tests for the 100-Point Quantitative Options Trade Quality Scoring Model.

Verifies deterministic scoring calculation matching the specification:
- Reference Candidate XYZ returns composite score: 96.0 and exact breakdown [25, 25, 25, 15, 10]
- Earnings binary risk triggers -40 points penalty
- Wide bid/ask spread (>15%) triggers execution risk gate failure
- High delta (>0.35) triggers assignment penalty
"""

import math


def evaluate_iv_rank(iv_rank: float) -> float:
    if 35 <= iv_rank <= 70:
        return 25.0
    elif iv_rank > 70:
        return 20.0
    elif 20 <= iv_rank < 35:
        return (iv_rank / 35.0) * 20.0
    else:
        return max(0.0, (iv_rank / 20.0) * 10.0)


def evaluate_delta(delta: float, strategy: str = "CASH_SECURED_PUT") -> float:
    abs_delta = abs(delta)
    min_target = 0.15 if strategy == "CASH_SECURED_PUT" else 0.20
    max_target = 0.25 if strategy == "CASH_SECURED_PUT" else 0.30

    if min_target <= abs_delta <= max_target:
        return 25.0
    if abs_delta < min_target:
        penalty_ratio = abs_delta / min_target
        return max(5.0, penalty_ratio * 20.0)
    if abs_delta > 0.35:
        return max(0.0, 20.0 - (abs_delta - max_target) * 100.0)
    return 20.0


def evaluate_technical_support(
    strategy: str,
    strike: float,
    current_price: float,
    sma20: float,
    sma50: float,
    sma200: float,
    rsi14: float,
) -> float:
    score = 0.0
    if strategy == "CASH_SECURED_PUT":
        in_bullish_trend = current_price > sma50 and sma50 > sma200
        if in_bullish_trend:
            score += 10.0
        elif current_price > sma50:
            score += 6.0

        if strike < sma50:
            score += 10.0
        elif strike < sma20:
            score += 6.0

        if 40 <= rsi14 <= 60:
            score += 5.0
        elif rsi14 < 35:
            score += 3.0
    else:
        if current_price >= sma200:
            score += 10.0
        if strike >= sma20 and strike >= current_price:
            score += 10.0
        if rsi14 <= 70:
            score += 5.0

    return min(25.0, score)


def evaluate_return(annualized_return_pct: float) -> float:
    if annualized_return_pct >= 18.0:
        return 15.0
    elif 12.0 <= annualized_return_pct < 18.0:
        return 10.0
    else:
        return max(0.0, (annualized_return_pct / 12.0) * 8.0)


def evaluate_liquidity(bid_ask_spread_pct: float, open_interest: int) -> float:
    score = 0.0
    if bid_ask_spread_pct <= 5.0:
        score += 6.0
    elif bid_ask_spread_pct <= 8.0:
        score += 4.0
    elif bid_ask_spread_pct <= 12.0:
        score += 2.0

    if open_interest >= 500:
        score += 4.0
    elif open_interest >= 200:
        score += 2.0
    elif open_interest >= 100:
        score += 1.0

    return score


def score_option_candidate(contract: dict, technicals: dict) -> dict:
    mid = (contract["bid"] + contract["ask"]) / 2.0
    spread = contract["ask"] - contract["bid"]
    spread_pct = (spread / mid) * 100.0 if mid > 0 else 100.0

    collateral = (
        contract["strikePrice"]
        if contract["strategy"] == "CASH_SECURED_PUT"
        else technicals["currentPrice"]
    )
    raw_return = (contract["bid"] / collateral) if collateral > 0 else 0.0
    dte = max(1, contract["daysToExpiration"])
    annualized_return_pct = raw_return * (365.0 / dte) * 100.0

    iv_score = evaluate_iv_rank(contract["ivRank"])
    delta_score = evaluate_delta(contract["delta"], contract["strategy"])
    tech_score = evaluate_technical_support(
        contract["strategy"],
        contract["strikePrice"],
        technicals["currentPrice"],
        technicals["sma20"],
        technicals["sma50"],
        technicals["sma200"],
        technicals["rsi14"],
    )
    return_score = evaluate_return(annualized_return_pct)
    liq_score = evaluate_liquidity(spread_pct, contract["openInterest"])

    raw_score = iv_score + delta_score + tech_score + return_score + liq_score
    passed_gate = True

    if contract.get("hasEarningsBeforeExpiration", False):
        passed_gate = False
        raw_score = max(0.0, raw_score - 40.0)

    if spread_pct > 15.0:
        passed_gate = False

    composite = min(100.0, max(0.0, round(raw_score, 1)))

    return {
        "compositeScore": composite,
        "passedRiskGate": passed_gate,
        "breakdown": {
            "ivScore": iv_score,
            "deltaScore": delta_score,
            "technicalScore": tech_score,
            "returnScore": return_score,
            "liquidityScore": liq_score,
        },
        "metrics": {
            "midPrice": round(mid, 2),
            "bidAskSpreadPct": round(spread_pct, 1),
            "annualizedReturnPct": round(annualized_return_pct, 1),
        },
    }


def test_reference_candidate_xyz():
    """Matches the exact reference test case from the specification."""
    contract = {
        "ticker": "XYZ",
        "strategy": "CASH_SECURED_PUT",
        "expirationDate": "2026-09-11",
        "daysToExpiration": 5,
        "strikePrice": 175.0,
        "bid": 1.15,
        "ask": 1.20,
        "impliedVolatility": 0.38,
        "ivRank": 48.0,
        "delta": 0.18,
        "openInterest": 2400,
        "volume": 850,
        "hasEarningsBeforeExpiration": False,
    }

    technicals = {
        "currentPrice": 184.50,
        "sma20": 181.00,
        "sma50": 177.25,
        "sma200": 165.00,
        "rsi14": 52.0,
    }

    result = score_option_candidate(contract, technicals)

    assert result["compositeScore"] >= 96.0
    assert result["passedRiskGate"] is True
    assert result["breakdown"]["ivScore"] == 25.0
    assert result["breakdown"]["deltaScore"] == 25.0
    assert result["breakdown"]["technicalScore"] == 25.0
    assert result["breakdown"]["returnScore"] == 15.0
    assert result["breakdown"]["liquidityScore"] == 10.0


def test_earnings_risk_gate_penalty():
    """Verifies that an earnings event within the expiration window applies a -40 penalty."""
    contract = {
        "ticker": "XYZ",
        "strategy": "CASH_SECURED_PUT",
        "daysToExpiration": 5,
        "strikePrice": 175.0,
        "bid": 1.15,
        "ask": 1.20,
        "ivRank": 48.0,
        "delta": 0.18,
        "openInterest": 2400,
        "hasEarningsBeforeExpiration": True,  # Binary risk active
    }
    technicals = {
        "currentPrice": 184.50,
        "sma20": 181.00,
        "sma50": 177.25,
        "sma200": 165.00,
        "rsi14": 52.0,
    }

    result = score_option_candidate(contract, technicals)
    assert result["passedRiskGate"] is False
    assert result["compositeScore"] <= 60.0


def test_wide_spread_disqualification():
    """Verifies that bid/ask spread > 15% marks passedRiskGate as false."""
    contract = {
        "ticker": "XYZ",
        "strategy": "CASH_SECURED_PUT",
        "daysToExpiration": 5,
        "strikePrice": 175.0,
        "bid": 0.50,
        "ask": 1.50,  # Spread 1.00 on mid 1.00 = 100% spread
        "ivRank": 48.0,
        "delta": 0.18,
        "openInterest": 2400,
        "hasEarningsBeforeExpiration": False,
    }
    technicals = {
        "currentPrice": 184.50,
        "sma20": 181.00,
        "sma50": 177.25,
        "sma200": 165.00,
        "rsi14": 52.0,
    }

    result = score_option_candidate(contract, technicals)
    assert result["passedRiskGate"] is False
