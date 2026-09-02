"""
MarketChameleon Quantitative Replication Service & Engine
=========================================================
Implements proprietary technical indicators, Stock Ideas criteria,
and options strategy alignment based on MarketChameleon's quantitative rules.

Operational Definitions:
1. Moving Average Engine: SMA_20 (short-term), SMA_50 (medium-term), SMA_250 (long-term).
2. Technical Rating Classifications:
   - Uptrend: Price[t] > SMA_20[t] > SMA_50[t] > SMA_250[t]
   - Downtrend: Price[t] < SMA_20[t] < SMA_50[t] < SMA_250[t]
   - Bullish Crossover: SMA_20[t-1] <= SMA_50[t-1] and SMA_20[t] > SMA_50[t]
   - Bearish Crossover: SMA_20[t-1] >= SMA_50[t-1] and SMA_20[t] < SMA_50[t]
   - Fast Bullish Crossover: Bearish stack (SMA_20 < SMA_50 < SMA_250), Price[t] crosses above SMA_20[t]
   - Fast Bearish Crossover: Bullish stack (SMA_20 > SMA_50 > SMA_250), Price[t] crosses below SMA_20[t]
   - Bottom Bounce: Downtrend (SMA_20 < SMA_50), Price[t-1] <= SMA_20[t-1], and Price[t] > SMA_20[t]
   - Top Pullback: Uptrend (SMA_20 > SMA_50 > SMA_250), Price[t] < SMA_20[t] while holding above SMA_50[t]
   - Dead Cat Bounce: Downtrend (SMA_50 < SMA_250), breached SMA_20 in last 5 bars, but closed down
3. Stock Ideas Classifications:
   - Market Leaders: Top 25 S&P 500 constituents ranked by Index Contribution (Weight % * Return %)
   - Market Laggers: Bottom 25 S&P 500 constituents ranked by Index Contribution
   - Momentum Stocks: Price location relative to 6-month range strictly increasing across 3M, 2M, 1M intervals
4. Options Strategy Alignment:
   - CSP (Cash-Secured Puts), CC (Covered Calls), Bull Put Spreads, Bear Call Spreads, Long Calls/Puts
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
import yfinance as yf


# =====================================================================
# 1. CORE TECHNICAL CLASSIFIER (MarketChameleon Rule Engine)
# =====================================================================
class MarketChameleonEngine:
    """Quantitative technical rating and pattern evaluation engine."""

    @staticmethod
    def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """Calculates 20-day, 50-day, and 250-day SMAs and 6-month rolling extremes."""
        df = df.sort_index().copy()

        # Flatten MultiIndex columns if present (from yfinance)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]

        close_col = "Close" if "Close" in df.columns else df.columns[0]
        high_col = "High" if "High" in df.columns else close_col
        low_col = "Low" if "Low" in df.columns else close_col

        df["SMA_20"] = df[close_col].rolling(window=20).mean()
        df["SMA_50"] = df[close_col].rolling(window=50).mean()
        df["SMA_250"] = df[close_col].rolling(window=250).mean()

        # 6-Month (~126 trading days) extremes
        df["Low_6M"] = df[low_col].rolling(window=126).min()
        df["High_6M"] = df[high_col].rolling(window=126).max()

        denom = df["High_6M"] - df["Low_6M"]
        denom = denom.replace(0, np.nan)
        df["Range_Pos"] = (df[close_col] - df["Low_6M"]) / (denom + 1e-9)
        return df

    @classmethod
    def evaluate_technical_rankings(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """Evaluates price and moving averages against MarketChameleon's criteria."""
        if len(df) < 60:
            return {"Error": "Insufficient historical data (minimum 60 bars required)"}

        curr = df.iloc[-1]
        prev = df.iloc[-2]

        close_col = "Close" if "Close" in df.columns else df.columns[0]
        high_col = "High" if "High" in df.columns else close_col

        p_curr, p_prev = float(curr[close_col]), float(prev[close_col])
        sma20_c = float(curr["SMA_20"]) if pd.notna(curr["SMA_20"]) else p_curr
        sma20_p = float(prev["SMA_20"]) if pd.notna(prev["SMA_20"]) else p_prev
        sma50_c = float(curr["SMA_50"]) if pd.notna(curr["SMA_50"]) else p_curr
        sma50_p = float(prev["SMA_50"]) if pd.notna(prev["SMA_50"]) else p_prev
        sma250_c = float(curr["SMA_250"]) if pd.notna(curr["SMA_250"]) else sma50_c

        # Moving Average Gaps (%)
        gap_price_sma20 = round(((p_curr - sma20_c) / sma20_c) * 100, 2)
        gap_sma20_sma50 = round(((sma20_c - sma50_c) / sma50_c) * 100, 2)
        gap_sma50_sma250 = round(((sma50_c - sma250_c) / sma250_c) * 100, 2)

        # Technical Classifications
        is_uptrend = p_curr > sma20_c > sma50_c > sma250_c
        is_downtrend = p_curr < sma20_c < sma50_c < sma250_c

        bullish_crossover = (sma20_p <= sma50_p) and (sma20_c > sma50_c)
        bearish_crossover = (sma20_p >= sma50_p) and (sma20_c < sma50_c)

        fast_bullish_crossover = (
            (sma20_c < sma50_c < sma250_c)
            and (p_prev <= sma20_p)
            and (p_curr > sma20_c)
        )

        fast_bearish_crossover = (
            (sma20_c > sma50_c > sma250_c)
            and (p_prev >= sma20_p)
            and (p_curr < sma20_c)
        )

        bottom_bounce = (
            (sma20_c < sma50_c) and (p_prev <= sma20_p) and (p_curr > sma20_c)
        )

        top_pullback = (
            (sma20_c > sma50_c > sma250_c)
            and (p_curr < sma20_c)
            and (p_curr > sma50_c)
        )

        # Dead Cat Bounce: In a broad downtrend, temporary breach of SMA_20 in last 5 bars that failed
        recent_window = df.iloc[-6:-1]
        had_recent_bounce = False
        if len(recent_window) > 0 and high_col in recent_window.columns and "SMA_20" in recent_window.columns:
            had_recent_bounce = bool((recent_window[high_col] >= recent_window["SMA_20"]).any())

        dead_cat_bounce = (
            (sma50_c < sma250_c)
            and had_recent_bounce
            and (p_curr < sma20_c)
            and (p_curr < p_prev)
        )

        # Recommended Options Strategy Alignment
        aligned_strategies = cls.align_options_strategies(
            is_uptrend=is_uptrend,
            is_downtrend=is_downtrend,
            bullish_crossover=bullish_crossover,
            bearish_crossover=bearish_crossover,
            fast_bullish=fast_bullish_crossover,
            fast_bearish=fast_bearish_crossover,
            bottom_bounce=bottom_bounce,
            top_pullback=top_pullback,
            dead_cat_bounce=dead_cat_bounce,
        )

        return {
            "Uptrend": bool(is_uptrend),
            "Downtrend": bool(is_downtrend),
            "Bullish_Crossover": bool(bullish_crossover),
            "Bearish_Crossover": bool(bearish_crossover),
            "Fast_Bullish_Crossover": bool(fast_bullish_crossover),
            "Fast_Bearish_Crossover": bool(fast_bearish_crossover),
            "Bottom_Bounce": bool(bottom_bounce),
            "Top_Pullback": bool(top_pullback),
            "Dead_Cat_Bounce": bool(dead_cat_bounce),
            "Gaps": {
                "Price_vs_SMA20_Pct": gap_price_sma20,
                "SMA20_vs_SMA50_Pct": gap_sma20_sma50,
                "SMA50_vs_SMA250_Pct": gap_sma50_sma250,
            },
            "Aligned_Options_Strategies": aligned_strategies,
        }

    @staticmethod
    def align_options_strategies(
        is_uptrend: bool,
        is_downtrend: bool,
        bullish_crossover: bool,
        bearish_crossover: bool,
        fast_bullish: bool,
        fast_bearish: bool,
        bottom_bounce: bool,
        top_pullback: bool,
        dead_cat_bounce: bool,
    ) -> List[str]:
        """Aligns MarketChameleon technical flags with conservative and directional options setups."""
        strategies = []
        if is_uptrend:
            strategies.append("Bull Put Spread (0.20Δ)")
            strategies.append("Covered Call (OTM Strike >= Upper BB)")
        if top_pullback or fast_bullish or bottom_bounce or bullish_crossover:
            strategies.append("Cash-Secured Put (CSP <= Lower BB)")
            strategies.append("Long Call Calendar Spread")
        if is_downtrend or dead_cat_bounce or fast_bearish or bearish_crossover:
            strategies.append("Bear Call Spread (Credit)")
            strategies.append("Collar Hedge Protection")
        if not strategies:
            strategies.append("Neutral Iron Condor (Range-Bound)")
        return strategies

    @classmethod
    def evaluate_momentum_stock(cls, df: pd.DataFrame) -> bool:
        """Verifies if price has moved away from 6-month lows towards 6-month highs

        consistently over the last 3 months (~63 days), 2 months (~42 days), and 1 month (~21 days).
        """
        if len(df) < 126 or "Range_Pos" not in df.columns:
            return False

        try:
            pos_now = float(df["Range_Pos"].iloc[-1])
            pos_1m = float(df["Range_Pos"].iloc[-21]) if len(df) >= 21 else pos_now
            pos_2m = float(df["Range_Pos"].iloc[-42]) if len(df) >= 42 else pos_1m
            pos_3m = float(df["Range_Pos"].iloc[-63]) if len(df) >= 63 else pos_2m

            return bool(pos_now > pos_1m > pos_2m > pos_3m and pos_now >= 0.70)
        except Exception:
            return False


# =====================================================================
# 2. STOCK IDEAS: MARKET LEADERS & LAGGERS
# =====================================================================
def screen_market_leaders_and_laggers(
    sp500_weights: Dict[str, float], period_returns: Dict[str, float]
) -> pd.DataFrame:
    """Calculates S&P 500 index performance contribution (Weight % * Return %)

    to rank top 25 Leaders and bottom 25 Laggers.
    """
    records = []
    for ticker, weight in sp500_weights.items():
        ret = period_returns.get(ticker, 0.0)
        contrib = weight * ret
        records.append(
            {
                "Symbol": ticker,
                "Weight_Pct": round(weight, 4),
                "Return_Pct": round(ret, 2),
                "Attribution_Score": round(contrib, 4),
            }
        )

    if not records:
        return pd.DataFrame(columns=["Symbol", "Weight_Pct", "Return_Pct", "Attribution_Score", "Classification"])

    df = pd.DataFrame(records)
    df = df.sort_values(by="Attribution_Score", ascending=False).reset_index(drop=True)

    df["Classification"] = "Neutral"
    top_n = min(25, len(df))
    bottom_n = min(25, len(df))

    df.loc[: top_n - 1, "Classification"] = "Market Leader"
    df.loc[max(0, len(df) - bottom_n) :, "Classification"] = "Market Lagger"
    return df


# =====================================================================
# 3. SCREENING PIPELINE RUNNER & TABLE GENERATOR
# =====================================================================
def run_marketchameleon_screening(
    tickers: List[str],
    period: str = "1y",
) -> pd.DataFrame:
    """Executes full quantitative MarketChameleon screening across a list of tickers

    and produces a structured Pandas DataFrame table.
    """
    if not tickers:
        return pd.DataFrame()

    print(f"Fetching market data for {len(tickers)} tickers ({', '.join(tickers[:5])}...)...")
    raw_data = yf.download(
        tickers,
        period=period,
        group_by="ticker" if len(tickers) > 1 else None,
        progress=False,
    )

    records = []
    for sym in tickers:
        try:
            if len(tickers) == 1:
                df_ticker = raw_data.dropna()
            else:
                df_ticker = raw_data[sym].dropna()

            if df_ticker.empty or len(df_ticker) < 20:
                continue

            df_ind = MarketChameleonEngine.calculate_indicators(df_ticker)
            tech_eval = MarketChameleonEngine.evaluate_technical_rankings(df_ind)
            is_momentum = MarketChameleonEngine.evaluate_momentum_stock(df_ind)

            active_signals = [k for k, v in tech_eval.items() if v and k not in ("Gaps", "Aligned_Options_Strategies", "Error")]
            signals_str = ", ".join(active_signals) if active_signals else "Consolidation / Neutral"

            gaps = tech_eval.get("Gaps", {})
            strategies = tech_eval.get("Aligned_Options_Strategies", [])

            close_col = "Close" if "Close" in df_ticker.columns else df_ticker.columns[0]
            current_close = round(float(df_ticker[close_col].iloc[-1]), 2)

            stock_ideas_cat = []
            if is_momentum:
                stock_ideas_cat.append("🔥 Momentum Stock")
            if "Uptrend" in active_signals:
                stock_ideas_cat.append("📈 Bullish Trend")
            elif "Downtrend" in active_signals:
                stock_ideas_cat.append("📉 Bearish Trend")
            elif "Bottom_Bounce" in active_signals or "Fast_Bullish_Crossover" in active_signals:
                stock_ideas_cat.append("⚡ Reversal Candidate")

            records.append({
                "Symbol": sym,
                "Close_Price": current_close,
                "Technical_Flags": signals_str,
                "Stock_Ideas_Category": " | ".join(stock_ideas_cat) if stock_ideas_cat else "Core Universe",
                "Price_vs_SMA20_Gap_%": gaps.get("Price_vs_SMA20_Pct", 0.0),
                "SMA20_vs_SMA50_Gap_%": gaps.get("SMA20_vs_SMA50_Pct", 0.0),
                "SMA50_vs_SMA250_Gap_%": gaps.get("SMA50_vs_SMA250_Pct", 0.0),
                "Aligned_Options_Strategies": " | ".join(strategies),
            })
        except Exception as e:
            print(f"Warning: Error processing {sym}: {e}")
            continue

    return pd.DataFrame(records)


# =====================================================================
# 4. GOOGLE ANTIGRAVITY SDK INTEGRATION
# =====================================================================
async def run_antigravity_screener(tickers: List[str]) -> None:
    """Wires the MarketChameleon classification engine into Google Antigravity."""
    summary_df = run_marketchameleon_screening(tickers)

    if summary_df.empty:
        print("No securities met data requirements for screening.")
        return

    print("\n" + "=" * 100)
    print("MARKETCHAMELEON QUANTITATIVE REPLICATION SCREENING RESULTS")
    print("=" * 100)
    print(summary_df.to_string(index=False))
    print("=" * 100 + "\n")

    try:
        from google.antigravity import Agent, LocalAgentConfig

        config = LocalAgentConfig(
            system_instructions="You are a Wall Street Quantitative Options Strategist analyzing MarketChameleon technical screens."
        )
        async with Agent(config) as agent:
            prompt = (
                f"Given this screened MarketChameleon portfolio data:\n\n"
                f"{summary_df.to_string(index=False)}\n\n"
                f"Generate a structured options income and hedging allocation strategy."
            )
            response = await agent.chat(prompt)
            print("--- AGENT STRATEGIC ANALYSIS ---")
            print(await response.text())
    except ImportError:
        print("Note: `google-antigravity` package is ready when invoked in agentic runtime environments.")


# =====================================================================
# 5. CLI ENTRYPOINT & LOCAL VERIFICATION
# =====================================================================
if __name__ == "__main__":
    test_universe = ["SPY", "QQQ", "AAPL", "NVDA", "MSFT", "TSLA", "XOM", "JNJ", "AMD", "META"]
    print(f"Starting MarketChameleon Quantitative Screener for {len(test_universe)} securities...")
    results_df = run_marketchameleon_screening(test_universe)
    print("\n--- RESULTS TABLE ---")
    print(results_df.to_string(index=False))
