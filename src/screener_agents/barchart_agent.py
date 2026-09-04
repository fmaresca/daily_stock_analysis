#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Barchart Screener Agent
Automates retrieval of Barchart Direction Strength and Weekly Options signals:
https://www.barchart.com/stocks/signals/direction-strength?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc

Uses Playwright with headless browser to seamlessly handle AWS WAF challenges,
fetch full quote payloads, generate CSV exports, and sync structured data.
"""

from __future__ import annotations

import csv
import io
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .base_agent import BaseScreenerAgent, ScreenerRecord

logger = logging.getLogger(__name__)

BARCHART_DEFAULT_URL = (
    "https://www.barchart.com/stocks/signals/direction-strength"
    "?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc"
)


class BarchartScreenerAgent(BaseScreenerAgent):
    """Screener Agent for Barchart Top 1% Signal Strength & Direction."""

    source_id = "barchart"
    display_name = "Barchart Direction Strength (Top 1%)"
    description = "Top 1% directional momentum screener with weekly options filter from Barchart"
    default_url = BARCHART_DEFAULT_URL

    def __init__(self, target_url: Optional[str] = None):
        super().__init__(target_url or BARCHART_DEFAULT_URL)

    def fetch_records(self, limit: int = 100) -> List[ScreenerRecord]:
        """Fetch screener records via Playwright browser context."""
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RuntimeError("playwright is required for BarchartScreenerAgent. Install via `pip install playwright`")

        logger.info(f"Navigating to Barchart URL: {self.target_url}")
        records: List[ScreenerRecord] = []

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
            )
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1366, "height": 768},
            )
            page = context.new_page()

            try:
                page.goto(self.target_url, wait_until="domcontentloaded", timeout=35000)
                page.wait_for_timeout(4500)

                # Execute in-page fetch using existing browser credentials and session tokens
                fetch_code = f"""async () => {{
                    try {{
                        const endpoint = '/proxies/core-api/v1/quotes/get?lists=stocks.us.signals_ratings.v2_top_signal_strength.daily&orderDir=desc&fields=symbol%2CsymbolName%2CdailyLastPrice%2CdailyPriceChange%2CdailyPercentChange%2CdailyOpinion%2CdailyOpinionPrevious%2CdailyOpinionLastWeek%2CdailyOpinionLastMonth%2CsymbolCode%2CsymbolType%2ChasOptions%2ChasWeeklyOptions&orderBy=hasWeeklyOptions&meta=field.shortName%2Cfield.type%2Cfield.description%2Clists.lastUpdate&limit={limit}&hasOptions=true&page=1&raw=1';
                        const resp = await fetch(endpoint);
                        if (!resp.ok) {{
                            return {{ error: 'HTTP ' + resp.status }};
                        }}
                        return await resp.json();
                    }} catch (e) {{
                        return {{ error: e.message }};
                    }}
                }}"""

                data = page.evaluate(fetch_code)

                if data and isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
                    raw_items = data["data"]
                    logger.info(f"Successfully retrieved {len(raw_items)} items from Barchart API proxy.")
                    for item in raw_items:
                        rec = self._parse_api_item(item)
                        if rec:
                            records.append(rec)
                else:
                    logger.warning("API proxy failed or returned no data, falling back to HTML table scraping...")
                    records = self._scrape_html_table(page)

            except Exception as e:
                logger.error(f"Error fetching data from Barchart: {e}")
                # Try table fallback if page still open
                try:
                    records = self._scrape_html_table(page)
                except Exception:
                    pass
                if not records:
                    raise e
            finally:
                browser.close()

        return records

    def _parse_api_item(self, item: Dict[str, Any]) -> Optional[ScreenerRecord]:
        """Convert Barchart core-api quote dict into ScreenerRecord."""
        raw = item.get("raw", {})
        symbol = str(item.get("symbol") or raw.get("symbol") or "").strip().upper()
        if not symbol:
            return None

        name = str(item.get("symbolName") or raw.get("symbolName") or symbol).strip()

        # Prices
        def to_f(val: Any, default: float = 0.0) -> float:
            if val is None or val == "":
                return default
            try:
                s = str(val).replace("$", "").replace(",", "").replace("%", "").strip()
                return float(s)
            except Exception:
                return default

        last_price = to_f(raw.get("dailyLastPrice", item.get("dailyLastPrice")))
        price_change = to_f(raw.get("dailyPriceChange", item.get("dailyPriceChange")))

        # Percent change
        pct_val = raw.get("dailyPercentChange", item.get("dailyPercentChange"))
        percent_change = to_f(pct_val)
        # If API returned decimal e.g. -0.0407, convert to -4.07%
        if abs(percent_change) < 1.0 and "%" not in str(pct_val):
            percent_change = round(percent_change * 100.0, 2)
        else:
            percent_change = round(percent_change, 2)

        opinion = str(item.get("dailyOpinion") or "100% Buy").strip()
        opinion_prev = str(item.get("dailyOpinionPrevious") or "").strip()
        opinion_lw = str(item.get("dailyOpinionLastWeek") or "").strip()
        opinion_lm = str(item.get("dailyOpinionLastMonth") or "").strip()

        # Parse numeric score from opinion e.g. "100% Buy" -> 100.0
        opinion_pct = 100.0
        match = re.search(r"(-?\d+)", opinion)
        if match:
            opinion_pct = float(match.group(1))
            if "sell" in opinion.lower() and opinion_pct > 0:
                opinion_pct = -opinion_pct

        has_options = str(item.get("hasOptions") or raw.get("hasOptions", "Yes")).lower() in ["yes", "true", "1"]
        # The query orderBy=hasWeeklyOptions&orderDir=desc means weekly options are prioritized
        has_weekly = str(item.get("hasWeeklyOptions") or raw.get("hasWeeklyOptions", "Yes")).lower() in ["yes", "true", "1"]

        # Signal evaluation
        signal_strength = "Maximum (Top 1%)" if opinion_pct >= 90 else "Strong" if opinion_pct >= 60 else "Moderate"
        signal_direction = "Strong Bullish" if opinion_pct >= 80 else "Bullish" if opinion_pct > 0 else "Neutral" if opinion_pct == 0 else "Bearish"

        # Options strategy recommendation
        if opinion_pct >= 80 and has_weekly:
            recommended_strat = "BULL_PUT_SPREAD"
        elif opinion_pct >= 60:
            recommended_strat = "CSP"
        elif opinion_pct <= -60:
            recommended_strat = "BEAR_CALL_SPREAD"
        else:
            recommended_strat = "IRON_CONDOR"

        return ScreenerRecord(
            symbol=symbol,
            name=name,
            last_price=last_price,
            price_change=price_change,
            percent_change=percent_change,
            opinion=opinion,
            opinion_pct=opinion_pct,
            opinion_previous=opinion_prev,
            opinion_last_week=opinion_lw,
            opinion_last_month=opinion_lm,
            has_options=has_options,
            has_weekly_options=has_weekly,
            signal_strength=signal_strength,
            signal_direction=signal_direction,
            source=self.source_id,
            source_url=self.target_url,
            recommended_strategy=recommended_strat,
            notes=f"Barchart Top 1% Signal: {opinion}",
            extra_fields={
                "symbolCode": item.get("symbolCode", "STK"),
                "symbolType": item.get("symbolType", 1),
            },
        )

    def _scrape_html_table(self, page: Any) -> List[ScreenerRecord]:
        """Scrapes the visible HTML table if API response is unavailable."""
        records: List[ScreenerRecord] = []
        rows = page.locator("table tbody tr").all()
        logger.info(f"Found {len(rows)} table rows in HTML")

        for row in rows:
            cells = [c.inner_text().strip() for c in row.locator("td").all()]
            if len(cells) < 4:
                continue

            symbol = cells[0].split("\n")[0].strip().upper()
            name = cells[1].strip() if len(cells) > 1 else symbol
            last_str = cells[2] if len(cells) > 2 else "0"
            change_str = cells[3] if len(cells) > 3 else "0"
            pct_str = cells[4] if len(cells) > 4 else "0%"
            opinion = cells[5] if len(cells) > 5 else "100% Buy"

            try:
                last_price = float(re.sub(r"[^\d.]", "", last_str) or 0)
            except ValueError:
                last_price = 0.0

            try:
                price_change = float(re.sub(r"[^\d.-]", "", change_str) or 0)
            except ValueError:
                price_change = 0.0

            try:
                percent_change = float(re.sub(r"[^\d.-]", "", pct_str) or 0)
            except ValueError:
                percent_change = 0.0

            records.append(
                ScreenerRecord(
                    symbol=symbol,
                    name=name,
                    last_price=last_price,
                    price_change=price_change,
                    percent_change=percent_change,
                    opinion=opinion,
                    opinion_pct=100.0 if "buy" in opinion.lower() else -100.0 if "sell" in opinion.lower() else 50.0,
                    has_options=True,
                    has_weekly_options=True,
                    signal_strength="Maximum (Top 1%)",
                    signal_direction="Strong Bullish",
                    source=self.source_id,
                    source_url=self.target_url,
                    recommended_strategy="BULL_PUT_SPREAD",
                )
            )

        return records

    def parse_csv(self, csv_data: Union[str, Path, io.StringIO]) -> List[ScreenerRecord]:
        """Parse raw CSV downloaded from Barchart."""
        records: List[ScreenerRecord] = []

        if isinstance(csv_data, (str, Path)) and os.path.exists(str(csv_data)):
            with open(csv_data, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        elif isinstance(csv_data, io.StringIO):
            content = csv_data.getvalue()
        else:
            content = str(csv_data)

        # Handle potential metadata lines at beginning of Barchart CSVs
        lines = content.splitlines()
        header_idx = 0
        for i, line in enumerate(lines[:10]):
            if any(k in line.lower() for k in ["symbol", "ticker", "last", "price"]):
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

            name = get_col("name", "symbolName", "Company Name", "Description", default=symbol)
            last_str = get_col("lastprice", "last", "dailyLastPrice", "Price", default="0")
            pct_str = get_col("percentchange", "%change", "dailyPercentChange", "% Change", "pctchange", default="0")
            chg_str = get_col("pricechange", "netchange", "dailyPriceChange", "change", default="0")
            opinion = get_col("opinion", "dailyOpinion", "Signal", "Overall Signal", default="100% Buy")
            opinion_prev = get_col("opinionPrevious", "dailyOpinionPrevious", default="")
            opinion_lw = get_col("opinionLastWeek", "dailyOpinionLastWeek", default="")
            opinion_lm = get_col("opinionLastMonth", "dailyOpinionLastMonth", default="")
            has_wkly = get_col("hasWeeklyOptions", "Weekly Options", "Weeklys", default="Yes").lower() in ["yes", "true", "1"]

            def clean_f(s: str) -> float:
                try:
                    return float(re.sub(r"[^\d.-]", "", s) or 0)
                except Exception:
                    return 0.0

            last_price = clean_f(last_str)
            price_change = clean_f(chg_str)
            percent_change = clean_f(pct_str)

            opinion_pct = 100.0
            match = re.search(r"(-?\d+)", opinion)
            if match:
                opinion_pct = float(match.group(1))
                if "sell" in opinion.lower() and opinion_pct > 0:
                    opinion_pct = -opinion_pct

            records.append(
                ScreenerRecord(
                    symbol=symbol,
                    name=name,
                    last_price=last_price,
                    price_change=price_change,
                    percent_change=percent_change,
                    opinion=opinion,
                    opinion_pct=opinion_pct,
                    opinion_previous=opinion_prev,
                    opinion_last_week=opinion_lw,
                    opinion_last_month=opinion_lm,
                    has_options=True,
                    has_weekly_options=has_wkly,
                    signal_strength="Maximum (Top 1%)" if opinion_pct >= 90 else "Strong",
                    signal_direction="Strong Bullish" if opinion_pct >= 80 else "Bullish",
                    source=self.source_id,
                    source_url=self.target_url,
                    recommended_strategy="BULL_PUT_SPREAD" if has_wkly else "CSP",
                )
            )

        return records
