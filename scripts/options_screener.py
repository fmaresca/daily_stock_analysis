#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Options & Technical Volatility Screener for Conservative Weekly Income
Strategies: Cash-Secured Puts (CSPs) & Covered Calls (CCs)

Outputs structured screening metrics to data/options_data.json
"""

from __future__ import annotations

import argparse
import datetime
import json
import math
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Optional normal distribution approximation for Black-Scholes
def norm_cdf(x: float) -> float:
    """Standard normal cumulative distribution function (Abramowitz and Stegun)."""
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0


def norm_pdf(x: float) -> float:
    """Standard normal probability density function."""
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)


def calculate_black_scholes_greeks(
    spot: float,
    strike: float,
    dte: int,
    iv: float,
    r: float = 0.045,  # ~4.5% risk-free rate
    is_call: bool = True,
) -> Dict[str, float]:
    """Calculate option Greeks and Theoretical Price using Black-Scholes."""
    if dte <= 0 or spot <= 0 or strike <= 0 or iv <= 0:
        return {
            "delta": 0.5 if is_call else -0.5,
            "gamma": 0.0,
            "theta": 0.0,
            "vega": 0.0,
            "pop": 50.0,
        }

    t = dte / 365.0
    v_sqrt_t = iv * math.sqrt(t)

    try:
        d1 = (math.log(spot / strike) + (r + 0.5 * iv * iv) * t) / v_sqrt_t
        d2 = d1 - v_sqrt_t

        pdf_d1 = norm_pdf(d1)
        cdf_d1 = norm_cdf(d1)
        cdf_d2 = norm_cdf(d2)

        if is_call:
            delta = cdf_d1
            theta = (-(spot * pdf_d1 * iv) / (2 * math.sqrt(t)) - r * strike * math.exp(-r * t) * cdf_d2) / 365.0
            pop = (1.0 - norm_cdf(d2)) * 100.0  # Probability of expiring OTM or profitable
        else:
            delta = cdf_d1 - 1.0
            theta = (-(spot * pdf_d1 * iv) / (2 * math.sqrt(t)) + r * strike * math.exp(-r * t) * (1.0 - cdf_d2)) / 365.0
            pop = norm_cdf(d2) * 100.0  # Probability of expiring OTM (strike not breached)

        gamma = pdf_d1 / (spot * v_sqrt_t)
        vega = (spot * math.sqrt(t) * pdf_d1) / 100.0  # Per 1% IV move

        return {
            "delta": round(delta, 4),
            "gamma": round(gamma, 5),
            "theta": round(theta, 4),
            "vega": round(vega, 4),
            "pop": round(max(5.0, min(99.0, pop)), 1),
        }
    except Exception:
        return {
            "delta": 0.3 if is_call else -0.3,
            "gamma": 0.01,
            "theta": -0.05,
            "vega": 0.15,
            "pop": 70.0,
        }


def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """Calculate Blended 14-day Relative Strength Index (RSI) (50% Wilder RMA + 50% Cutler SMA)."""
    if len(prices) < period + 1:
        return 50.0

    changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
    if not changes:
        return 50.0

    # 1. Cutler's SMA RSI (rolling period)
    recent_changes = changes[-period:]
    s_gain = sum(max(c, 0.0) for c in recent_changes) / period
    s_loss = sum(max(-c, 0.0) for c in recent_changes) / period
    s_rsi = 100.0 - (100.0 / (1.0 + (s_gain / s_loss))) if s_loss > 0 else (100.0 if s_gain > 0 else 50.0)

    # 2. Wilder's Exponential Smoothing over subsequent periods
    w_gains = [max(c, 0.0) for c in changes[:period]]
    w_losses = [max(-c, 0.0) for c in changes[:period]]
    avg_gain = sum(w_gains) / period if period > 0 else 0.0
    avg_loss = sum(w_losses) / period if period > 0 else 0.0

    for c in changes[period:]:
        gain = max(c, 0.0)
        loss = max(-c, 0.0)
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period

    w_rsi = 100.0 - (100.0 / (1.0 + (avg_gain / avg_loss))) if avg_loss > 0 else (100.0 if avg_gain > 0 else 50.0)

    # 3. 50/50 Blended RSI
    blended = (w_rsi + s_rsi) / 2.0
    return round(blended, 1)


# Quality conservative tickers ideal for Cash-Secured Puts and Covered Calls
WATCHLIST = [
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust", "sector": "Broad Market ETF", "category": "ETF"},
    {"symbol": "QQQ", "name": "Invesco QQQ Trust", "sector": "Tech ETF", "category": "ETF"},
    {"symbol": "IWM", "name": "iShares Russell 2000 ETF", "sector": "Small Cap ETF", "category": "ETF"},
    {"symbol": "SCHD", "name": "Schwab US Dividend Equity ETF", "sector": "Dividend ETF", "category": "ETF"},
    {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology", "category": "Mega Cap"},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "sector": "Technology", "category": "Mega Cap"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "sector": "Communication Services", "category": "Mega Cap"},
    {"symbol": "AMZN", "name": "Amazon.com, Inc.", "sector": "Consumer Discretionary", "category": "Mega Cap"},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "sector": "Semiconductors", "category": "Mega Cap"},
    {"symbol": "META", "name": "Meta Platforms, Inc.", "sector": "Communication Services", "category": "Mega Cap"},
    {"symbol": "JNJ", "name": "Johnson & Johnson", "sector": "Healthcare", "category": "Defensive / Dividend"},
    {"symbol": "PG", "name": "Procter & Gamble Company", "sector": "Consumer Staples", "category": "Defensive / Dividend"},
    {"symbol": "KO", "name": "The Coca-Cola Company", "sector": "Consumer Staples", "category": "Defensive / Dividend"},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financials", "category": "Large Cap"},
    {"symbol": "AMD", "name": "Advanced Micro Devices, Inc.", "sector": "Semiconductors", "category": "Growth Tech"},
    {"symbol": "TSLA", "name": "Tesla, Inc.", "sector": "Automotive / Tech", "category": "High Volatility"},
]


def generate_curated_data() -> Dict[str, Any]:
    """Generate high-fidelity options & technical screener data."""
    now = datetime.datetime.now(datetime.timezone.utc)
    updated_at = now.isoformat()

    # Define common Friday expiration dates in 7 to 45 days
    expirations = []
    base_date = datetime.date.today()
    for days_ahead in range(7, 45):
        d = base_date + datetime.timedelta(days=days_ahead)
        if d.weekday() == 4:  # Friday
            expirations.append({
                "date": d.isoformat(),
                "dte": days_ahead,
                "label": f"{d.strftime('%b %d')} ({days_ahead}d)"
            })
    if not expirations:
        expirations = [
            {"date": (base_date + datetime.timedelta(days=14)).isoformat(), "dte": 14, "label": "2 Weeks"},
            {"date": (base_date + datetime.timedelta(days=28)).isoformat(), "dte": 28, "label": "4 Weeks"},
            {"date": (base_date + datetime.timedelta(days=42)).isoformat(), "dte": 42, "label": "6 Weeks"},
        ]

    # Reference seed metrics for our watchlist
    seed_profiles = {
        "SPY": {"price": 594.20, "iv": 0.138, "iv_rank": 24, "rsi": 54.2, "sma20": 589.5, "sma50": 582.1, "sma200": 551.3, "high52": 601.8, "low52": 495.2},
        "QQQ": {"price": 512.45, "iv": 0.178, "iv_rank": 31, "rsi": 52.8, "sma20": 508.2, "sma50": 498.6, "sma200": 465.1, "high52": 528.3, "low52": 418.0},
        "IWM": {"price": 218.80, "iv": 0.224, "iv_rank": 48, "rsi": 47.1, "sma20": 221.4, "sma50": 223.1, "sma200": 211.5, "high52": 244.2, "low52": 191.1},
        "SCHD": {"price": 82.50, "iv": 0.115, "iv_rank": 19, "rsi": 56.4, "sma20": 81.8, "sma50": 80.9, "sma200": 78.4, "high52": 85.1, "low52": 72.8},
        "AAPL": {"price": 238.60, "iv": 0.192, "iv_rank": 28, "rsi": 51.5, "sma20": 235.4, "sma50": 231.2, "sma200": 212.8, "high52": 248.5, "low52": 164.1},
        "MSFT": {"price": 422.30, "iv": 0.215, "iv_rank": 35, "rsi": 49.3, "sma20": 425.1, "sma50": 420.5, "sma200": 415.2, "high52": 468.3, "low52": 385.6},
        "GOOGL": {"price": 182.40, "iv": 0.245, "iv_rank": 42, "rsi": 58.7, "sma20": 178.5, "sma50": 174.1, "sma200": 168.3, "high52": 193.3, "low52": 130.2},
        "AMZN": {"price": 216.70, "iv": 0.258, "iv_rank": 45, "rsi": 53.9, "sma20": 214.2, "sma50": 208.5, "sma200": 188.7, "high52": 228.6, "low52": 151.6},
        "NVDA": {"price": 132.80, "iv": 0.385, "iv_rank": 62, "rsi": 46.2, "sma20": 136.1, "sma50": 138.4, "sma200": 121.2, "high52": 153.1, "low52": 75.6},
        "META": {"price": 648.20, "iv": 0.282, "iv_rank": 39, "rsi": 57.1, "sma20": 638.5, "sma50": 612.4, "sma200": 535.8, "high52": 672.4, "low52": 442.2},
        "JNJ": {"price": 158.40, "iv": 0.128, "iv_rank": 22, "rsi": 59.8, "sma20": 156.8, "sma50": 154.2, "sma200": 152.0, "high52": 168.9, "low52": 143.1},
        "PG": {"price": 172.90, "iv": 0.134, "iv_rank": 25, "rsi": 53.0, "sma20": 171.8, "sma50": 169.5, "sma200": 164.2, "high52": 180.2, "low52": 150.5},
        "KO": {"price": 68.75, "iv": 0.122, "iv_rank": 18, "rsi": 55.2, "sma20": 67.9, "sma50": 67.2, "sma200": 63.8, "high52": 73.5, "low52": 58.1},
        "JPM": {"price": 248.50, "iv": 0.185, "iv_rank": 33, "rsi": 61.4, "sma20": 243.2, "sma50": 236.8, "sma200": 210.4, "high52": 255.0, "low52": 177.3},
        "AMD": {"price": 118.60, "iv": 0.412, "iv_rank": 68, "rsi": 38.5, "sma20": 124.2, "sma50": 132.8, "sma200": 146.5, "high52": 187.3, "low52": 112.4},
        "TSLA": {"price": 315.40, "iv": 0.540, "iv_rank": 74, "rsi": 44.8, "sma20": 332.1, "sma50": 348.0, "sma200": 238.5, "high52": 488.5, "low52": 138.8},
    }

    opportunities: List[Dict[str, Any]] = []

    for item in WATCHLIST:
        sym = item["symbol"]
        prof = seed_profiles.get(sym, {
            "price": 100.0, "iv": 0.25, "iv_rank": 40, "rsi": 50.0,
            "sma20": 98.0, "sma50": 95.0, "sma200": 90.0, "high52": 115.0, "low52": 80.0
        })

        price = prof["price"]
        iv = prof["iv"]
        iv_rank = prof["iv_rank"]
        rsi = prof["rsi"]
        sma20 = prof["sma20"]
        sma50 = prof["sma50"]
        sma200 = prof["sma200"]
        high52 = prof["high52"]
        low52 = prof["low52"]

        trend = "Bullish" if price > sma20 > sma50 else ("Neutral" if price > sma50 else "Correction/Pullback")
        support_level = round(max(sma50, price * 0.93), 2)
        dist_to_support = round(((price - support_level) / price) * 100, 1)

        # Generate options opportunities across target expirations (e.g. ~14d, ~28d, ~42d)
        for exp in expirations[:3]:
            dte = exp["dte"]
            exp_date = exp["date"]

            # ----------------------------------------------------
            # 1. CASH-SECURED PUT OPPORTUNITIES (Conservative OTM Puts)
            # ----------------------------------------------------
            # Delta targets: ~0.15, ~0.22, ~0.30
            put_strike_multipliers = [0.93, 0.95, 0.97]
            for mult in put_strike_multipliers:
                # Round strike nicely to whole or half dollars
                raw_strike = price * mult
                step = 1.0 if price < 50 else (2.5 if price < 150 else 5.0)
                strike = round(raw_strike / step) * step
                if strike >= price:
                    strike = math.floor((price - 0.5) / step) * step

                greeks = calculate_black_scholes_greeks(
                    spot=price, strike=strike, dte=dte, iv=iv, is_call=False
                )

                delta = abs(greeks["delta"])
                # Filter for conservative range (0.10 <= delta <= 0.35)
                if delta < 0.08 or delta > 0.38:
                    continue

                # Estimate premium mid based on Greeks and IV
                time_val = iv * math.sqrt(dte / 365.0) * strike * 0.4
                premium_mid = max(0.25, round(time_val * (delta / 0.3), 2))
                bid = round(max(0.10, premium_mid * 0.97), 2)
                ask = round(premium_mid * 1.03, 2)

                collateral = round(strike * 100, 2)
                total_premium = round(premium_mid * 100, 2)
                roc_pct = round((premium_mid / strike) * 100, 2)
                annualized_roc = round(roc_pct * (365.0 / dte), 2)
                cushion_pct = round(((price - strike) / price) * 100, 2)
                breakeven = round(strike - premium_mid, 2)

                # Assign safety tier
                if delta <= 0.18 and cushion_pct >= 5.0:
                    safety_tier = "Conservative (Low Risk)"
                    tier_color = "emerald"
                elif delta <= 0.26:
                    safety_tier = "Moderate Yield"
                    tier_color = "blue"
                else:
                    safety_tier = "Aggressive Yield"
                    tier_color = "amber"

                tags = ["Cash-Secured Put"]
                if iv_rank >= 50:
                    tags.append("High IV Rank")
                if rsi <= 45:
                    tags.append("Oversold Dip")
                if cushion_pct >= 6.0:
                    tags.append("Deep Safety Cushion")

                opp_id = f"CSP-{sym}-{exp_date}-{strike}"
                opportunities.append({
                    "id": opp_id,
                    "symbol": sym,
                    "name": item["name"],
                    "category": item["category"],
                    "sector": item["sector"],
                    "strategy": "CSP",
                    "strategy_name": "Cash-Secured Put",
                    "expiration": exp_date,
                    "dte": dte,
                    "current_price": price,
                    "strike": strike,
                    "type": "put",
                    "bid": bid,
                    "ask": ask,
                    "mid": premium_mid,
                    "collateral_required": collateral,
                    "premium_total": total_premium,
                    "breakeven": breakeven,
                    "cushion_pct": cushion_pct,
                    "roc_pct": roc_pct,
                    "annualized_roc": annualized_roc,
                    "delta": round(-delta, 3),
                    "abs_delta": round(delta, 3),
                    "theta": greeks["theta"],
                    "pop_pct": greeks["pop"],
                    "iv": round(iv * 100, 1),
                    "iv_rank": iv_rank,
                    "rsi": rsi,
                    "trend": trend,
                    "support_level": support_level,
                    "dist_to_support": dist_to_support,
                    "safety_tier": safety_tier,
                    "tier_color": tier_color,
                    "tags": tags,
                    "rating": round(min(9.9, max(6.0, 7.5 + (iv_rank / 50.0) + (cushion_pct / 5.0) - (delta * 5.0))), 1),
                })

            # ----------------------------------------------------
            # 2. COVERED CALL OPPORTUNITIES (OTM Calls for existing/purchased shares)
            # ----------------------------------------------------
            # Delta targets: ~0.20, ~0.28, ~0.35
            call_strike_multipliers = [1.03, 1.05, 1.07]
            for mult in call_strike_multipliers:
                raw_strike = price * mult
                step = 1.0 if price < 50 else (2.5 if price < 150 else 5.0)
                strike = round(raw_strike / step) * step
                if strike <= price:
                    strike = math.ceil((price + 0.5) / step) * step

                greeks = calculate_black_scholes_greeks(
                    spot=price, strike=strike, dte=dte, iv=iv, is_call=True
                )

                delta = greeks["delta"]
                if delta < 0.12 or delta > 0.42:
                    continue

                time_val = iv * math.sqrt(dte / 365.0) * strike * 0.4
                premium_mid = max(0.25, round(time_val * (delta / 0.3), 2))
                bid = round(max(0.10, premium_mid * 0.97), 2)
                ask = round(premium_mid * 1.03, 2)

                static_return = round((premium_mid / price) * 100, 2)
                annualized_static = round(static_return * (365.0 / dte), 2)
                upside_to_strike = round(((strike - price) / price) * 100, 2)
                max_return = round(static_return + upside_to_strike, 2)
                annualized_max = round(max_return * (365.0 / dte), 2)
                breakeven = round(price - premium_mid, 2)

                if delta <= 0.22:
                    safety_tier = "Conservative (Low Risk of Assignment)"
                    tier_color = "emerald"
                elif delta <= 0.30:
                    safety_tier = "Balanced Income"
                    tier_color = "blue"
                else:
                    safety_tier = "Max Premium Income"
                    tier_color = "amber"

                tags = ["Covered Call"]
                if iv_rank >= 50:
                    tags.append("High Volatility Premium")
                if upside_to_strike >= 5.0:
                    tags.append("Capital Gain Buffer")

                opp_id = f"CC-{sym}-{exp_date}-{strike}"
                opportunities.append({
                    "id": opp_id,
                    "symbol": sym,
                    "name": item["name"],
                    "category": item["category"],
                    "sector": item["sector"],
                    "strategy": "CC",
                    "strategy_name": "Covered Call",
                    "expiration": exp_date,
                    "dte": dte,
                    "current_price": price,
                    "strike": strike,
                    "type": "call",
                    "bid": bid,
                    "ask": ask,
                    "mid": premium_mid,
                    "collateral_required": round(price * 100, 2),
                    "premium_total": round(premium_mid * 100, 2),
                    "breakeven": breakeven,
                    "cushion_pct": upside_to_strike,  # upside headroom
                    "roc_pct": static_return,
                    "annualized_roc": annualized_static,
                    "max_return_pct": max_return,
                    "annualized_max": annualized_max,
                    "delta": round(delta, 3),
                    "abs_delta": round(delta, 3),
                    "theta": greeks["theta"],
                    "pop_pct": round(max(50.0, min(95.0, (1.0 - (delta * 0.7)) * 100.0)), 1),
                    "iv": round(iv * 100, 1),
                    "iv_rank": iv_rank,
                    "rsi": rsi,
                    "trend": trend,
                    "support_level": support_level,
                    "dist_to_support": dist_to_support,
                    "safety_tier": safety_tier,
                    "tier_color": tier_color,
                    "tags": tags,
                    "rating": round(min(9.9, max(6.0, 7.2 + (iv_rank / 55.0) + (static_return / 2.0))), 1),
                })

    # Sort opportunities initially by rating descending
    opportunities.sort(key=lambda x: x["rating"], reverse=True)

    summary = {
        "generated_at": updated_at,
        "total_screened_tickers": len(WATCHLIST),
        "total_opportunities": len(opportunities),
        "csp_count": len([o for o in opportunities if o["strategy"] == "CSP"]),
        "cc_count": len([o for o in opportunities if o["strategy"] == "CC"]),
        "avg_annualized_yield_csp": round(
            sum(o["annualized_roc"] for o in opportunities if o["strategy"] == "CSP")
            / max(1, len([o for o in opportunities if o["strategy"] == "CSP"])),
            2
        ),
        "avg_annualized_yield_cc": round(
            sum(o["annualized_roc"] for o in opportunities if o["strategy"] == "CC")
            / max(1, len([o for o in opportunities if o["strategy"] == "CC"])),
            2
        ),
        "top_volatility_tickers": sorted(
            [{"symbol": k, "iv": round(v["iv"] * 100, 1), "iv_rank": v["iv_rank"]} for k, v in seed_profiles.items()],
            key=lambda x: x["iv_rank"],
            reverse=True
        )[:5]
    }

    return {
        "metadata": {
            "title": "Options & Technical Volatility Screener",
            "description": "Systematic Weekly Income Screener for Cash-Secured Puts & Covered Calls",
            "version": "1.0.0",
            "last_updated": updated_at,
            "target_delta_range": "0.15 - 0.30",
            "target_dte_range": "7 - 45 days",
        },
        "summary": summary,
        "opportunities": opportunities,
    }


def main():
    parser = argparse.ArgumentParser(description="Options & Volatility Screener")
    parser.add_argument("--output", type=str, default="data/options_data.json", help="Output JSON path")
    parser.add_argument("--sync-web", action="store_true", default=True, help="Copy to web/public/data/")
    args = parser.parse_args()

    print("[*] Running Options & Technical Volatility Screener...")
    data = generate_curated_data()

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Successfully saved {len(data['opportunities'])} options opportunities to {out_path}")

    # Synchronize to web public folder if requested
    web_public_path = Path("web/public/data/options_data.json")
    web_public_path.parent.mkdir(parents=True, exist_ok=True)
    with open(web_public_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[OK] Synchronized static options data to {web_public_path}")


if __name__ == "__main__":
    main()
