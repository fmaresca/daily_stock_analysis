# -*- coding: utf-8 -*-
"""
Data Normalization & Formatting Layer for Daily Stock Analysis.
Transforms raw analytical feeds into a structured, high-density payload.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, computed_field


class OptionsIdea(BaseModel):
    strategy: str = Field(description="CASH_SECURED_PUT, COVERED_CALL, or DEBIT_SPREAD")
    strike_price: float
    expiration: str
    delta: float
    premium_bid: float
    implied_volatility_rank: float

    @computed_field
    @property
    def annualized_yield_pct(self) -> float:
        """Calculates rough annualized cash-on-cash yield for options income."""
        if self.strike_price <= 0:
            return 0.0
        # Assumes 30-day baseline holding period if not parsed
        raw_yield = self.premium_bid / self.strike_price
        return round((raw_yield * (365 / 30)) * 100, 2)


class TickerSignal(BaseModel):
    ticker: str
    company_name: str
    market_cap_category: str = "Large"
    bias: str = Field(description="BULLISH, BEARISH, or NEUTRAL")
    conviction_score: float = Field(ge=0.0, le=10.0)

    current_price: float
    entry_level: float
    target_price: float
    stop_loss: float

    primary_catalyst: str
    options_idea: Optional[OptionsIdea] = None
    key_risks: List[str] = []
    full_thesis_markdown: str = ""

    @computed_field
    @property
    def risk_reward_ratio(self) -> float:
        """Computes risk-to-reward ratio for active positioning."""
        downside = abs(self.entry_level - self.stop_loss)
        upside = abs(self.target_price - self.entry_level)
        if downside == 0:
            return 0.0
        return round(upside / downside, 2)

    @computed_field
    @property
    def actionable_grade(self) -> str:
        """Institutional setup categorization."""
        if self.conviction_score >= 8.0 and self.risk_reward_ratio >= 2.0:
            return "Tier 1: High Conviction"
        elif self.conviction_score >= 6.5:
            return "Tier 2: Actionable"
        return "Tier 3: Watchlist Only"


class MarketDashboardPayload(BaseModel):
    as_of_date: str
    macro_regime: str
    vix_level: float
    total_screened: int
    signals: List[TickerSignal]


def format_pipeline_output(raw_records: list) -> MarketDashboardPayload:
    """
    Adapter function to normalize raw analysis records into the dashboard schema.
    """
    processed = []
    for item in raw_records:
        options_data = item.get("options_idea") or item.get("options")
        options_obj = None
        if isinstance(options_data, dict):
            try:
                options_obj = OptionsIdea(
                    strategy=options_data.get("strategy", "CASH_SECURED_PUT"),
                    strike_price=float(options_data.get("strike_price") or options_data.get("strike", 0.0)),
                    expiration=str(options_data.get("expiration", "30 DTE")),
                    delta=float(options_data.get("delta", 0.20)),
                    premium_bid=float(options_data.get("premium_bid") or options_data.get("premium", 0.0)),
                    implied_volatility_rank=float(
                        options_data.get("implied_volatility_rank") or options_data.get("iv_rank", 0.0)
                    ),
                )
            except Exception:
                options_obj = None

        processed.append(
            TickerSignal(
                ticker=str(item.get("ticker", "")).upper(),
                company_name=str(item.get("name") or item.get("company_name") or "Unknown"),
                market_cap_category=str(item.get("market_cap_category", "Large")),
                bias=str(item.get("bias", "NEUTRAL")).upper(),
                conviction_score=float(item.get("score") or item.get("conviction_score", 5.0)),
                current_price=float(item.get("close") or item.get("current_price", 0.0)),
                entry_level=float(item.get("entry") or item.get("entry_level") or item.get("entry_price", 0.0)),
                target_price=float(item.get("target") or item.get("target_price", 0.0)),
                stop_loss=float(item.get("stop") or item.get("stop_loss", 0.0)),
                primary_catalyst=str(
                    item.get("catalyst") or item.get("primary_catalyst") or "No catalyst provided"
                ),
                options_idea=options_obj,
                key_risks=item.get("key_risks", []),
                full_thesis_markdown=str(item.get("markdown") or item.get("full_thesis_markdown", "")),
            )
        )

    return MarketDashboardPayload(
        as_of_date="2026-09-03",
        macro_regime="Risk-On (Bullish Breadth)",
        vix_level=14.85,
        total_screened=len(processed),
        signals=processed,
    )
