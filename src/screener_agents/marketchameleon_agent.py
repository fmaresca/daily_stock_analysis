#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MarketChameleon Screener Agent (Extensible Module)
Provides integration architecture for MarketChameleon.com options, IV rank, and volatility screeners.
Ready for future instruction with specific custom URLs, credentials, or export formats.
"""

from __future__ import annotations

import csv
import io
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .base_agent import BaseScreenerAgent, ScreenerRecord

logger = logging.getLogger(__name__)

MARKETCHAMELEON_DEFAULT_URL = "https://marketchameleon.com/Screeners/OptionsScreener"


class MarketChameleonScreenerAgent(BaseScreenerAgent):
    """Screener Agent for MarketChameleon.com options, implied volatility, and volume signals."""

    source_id = "marketchameleon"
    display_name = "MarketChameleon (Options & Volatility)"
    description = "Implied Volatility (IV) Rank, Unusual Options Volume, and Weekly Screener from MarketChameleon"
    default_url = MARKETCHAMELEON_DEFAULT_URL

    def __init__(self, target_url: Optional[str] = None):
        super().__init__(target_url or MARKETCHAMELEON_DEFAULT_URL)

    def fetch_records(self, limit: int = 100) -> List[ScreenerRecord]:
        """
        Fetch records from MarketChameleon.
        When future credentials/URL endpoints are provided, this method executes the live scraping.
        Defaults to checking local cache or raising informative instructions.
        """
        logger.info(f"MarketChameleon agent ready. Target URL: {self.target_url}")
        # Placeholder for future live authenticated endpoint
        # If a CSV export has been pre-downloaded, it can be loaded directly
        sample_csv = Path("data/screeners/marketchameleon_sample.csv")
        if sample_csv.exists():
            return self.parse_csv(sample_csv)

        logger.info("Awaiting specific MarketChameleon screener parameters or uploaded CSV file.")
        return []

    def parse_csv(self, csv_data: Union[str, Path, io.StringIO]) -> List[ScreenerRecord]:
        """
        Parse raw CSV downloaded from MarketChameleon.
        Handles columns: Symbol, Company, Stock Price, IV30, IV Rank, Call/Put Vol, Weeklys, etc.
        """
        records: List[ScreenerRecord] = []

        if isinstance(csv_data, (str, Path)) and os.path.exists(str(csv_data)):
            with open(csv_data, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        elif isinstance(csv_data, io.StringIO):
            content = csv_data.getvalue()
        else:
            content = str(csv_data)

        lines = content.splitlines()
        header_idx = 0
        for i, line in enumerate(lines[:10]):
            if any(k in line.lower() for k in ["symbol", "ticker", "price", "iv"]):
                header_idx = i
                break

        csv_reader = csv.DictReader(lines[header_idx:])
        for row in csv_reader:
            def get_col(*aliases: str, default: str = "") -> str:
                def norm(s: str) -> str:
                    return re.sub(r"[\s_-]", "", s).lower()

                norm_aliases = [norm(a) for a in aliases]
                for a in norm_aliases:
                    for k in row.keys():
                        if k and norm(k) == a:
                            return str(row[k]).strip()
                return default

            symbol = get_col("symbol", "ticker", "Symbol").upper()
            if not symbol:
                continue

            name = get_col("name", "company", "description", default=symbol)
            price_str = get_col("price", "stockprice", "lastprice", "last", default="0")
            pct_str = get_col("%chg", "%change", "percentchange", "pctchange", default="0")
            chg_str = get_col("netchange", "chg", "change", "pricechange", default="0")
            iv_rank_str = get_col("ivrank", "ivr", "iv_rank", default="50")
            has_wkly = get_col("weeklys", "hasweeklys", "weeklyoptions", default="Yes").lower() in ["yes", "true", "1"]

            def clean_f(s: str) -> float:
                try:
                    return float(re.sub(r"[^\d.-]", "", s) or 0)
                except Exception:
                    return 0.0

            last_price = clean_f(price_str)
            price_change = clean_f(chg_str)
            percent_change = clean_f(pct_str)
            iv_rank = clean_f(iv_rank_str)

            # Strategy implication based on IV Rank
            if iv_rank >= 50:
                opinion = f"IV Rank {int(iv_rank)}% (High Volatility)"
                opinion_pct = 85.0
                strat = "BULL_PUT_SPREAD" if percent_change >= 0 else "IRON_CONDOR"
            else:
                opinion = f"IV Rank {int(iv_rank)}% (Low Volatility)"
                opinion_pct = 60.0
                strat = "COVERED_CALL"

            records.append(
                ScreenerRecord(
                    symbol=symbol,
                    name=name,
                    last_price=last_price,
                    price_change=price_change,
                    percent_change=percent_change,
                    opinion=opinion,
                    opinion_pct=opinion_pct,
                    has_options=True,
                    has_weekly_options=has_wkly,
                    signal_strength=f"IVR {int(iv_rank)}%",
                    signal_direction="Bullish" if percent_change >= 0 else "Neutral",
                    source=self.source_id,
                    source_url=self.target_url,
                    recommended_strategy=strat,
                    notes="MarketChameleon Volatility Screener",
                    extra_fields={"iv_rank": iv_rank},
                )
            )

        return records
