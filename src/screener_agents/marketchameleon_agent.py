#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MarketChameleon Screener Agent
Automates extraction of stocks from MarketChameleon Stock Screener:
https://marketchameleon.com/Screeners/Stocks

Preselects the specific screener criteria:
- Stock Idea: Momentum Stocks
- Market Cap: Over $1 billion
- Options Liquidity: Has Options
- Technical: 14-day RSI: 50 to 70
- Country: USA
- Volatility: 1-Yr Above 30, 20-day Above 30, 1-day Above 30, IV30 Above 30, IV % Rank Any
- Price, Volume & Technical: MA Technical: Any Bullish

Iterates through all pages, extracts respective column headings, generates standardized CSV
and tab-delimited copy-paste output, and synchronizes to the DeltaHarvest platform.
"""

from __future__ import annotations

import csv
import io
import json
import logging
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from .base_agent import BaseScreenerAgent, ScreenerRecord

logger = logging.getLogger(__name__)

MARKETCHAMELEON_URL = "https://marketchameleon.com/Screeners/Stocks"
MARKETCHAMELEON_DATA_ENDPOINT = "https://marketchameleon.com/EquityScreener/EquityScreenerData"

# Preselected filter values matching the user's requirements
PRESELECTED_FILTERS: Dict[str, str] = {
    "StockIdeas": "Momentum",  # Stock Idea: Momentum Stocks
    "c8": "Over 1000000000",  # Market Cap: Over $1 billion
    "c31": "true",  # Options Listed: Has Options
    "c45": "50.0 To 70.0",  # 14-day RSI: 50 to 70
    "c80": "United States of America",  # Country: USA
    "c50": "Above 30.0",  # 1-Yr Volatility: Above 30
    "c49": "Above 30.0",  # 20-day Volatility: Above 30
    "c48": "Above 30.0",  # 1-day Volatility: Above 30
    "c21": "Above 30.0",  # IV30: Above 30
    "c59": "Uptrend;Bullish Crossover;Fast Bullish Crossover",  # MA Technical: Any Bullish
}


class MarketChameleonScreenerAgent(BaseScreenerAgent):
    """Screener Agent for MarketChameleon.com with preselected Momentum & Volatility filters."""

    source_id = "marketchameleon"
    display_name = "MarketChameleon Momentum & Volatility Screener"
    description = "Preselected Momentum Stocks, Market Cap > $1B, Has Options, RSI 50-70, IV30 > 30, Volatility > 30, Bullish MA"
    default_url = MARKETCHAMELEON_URL

    def __init__(
        self,
        target_url: Optional[str] = None,
        custom_filters: Optional[Dict[str, str]] = None,
    ):
        super().__init__(target_url or MARKETCHAMELEON_URL)
        self.filters: Dict[str, str] = {**PRESELECTED_FILTERS, **(custom_filters or {})}
        self.column_defs: List[Tuple[str, str]] = []

    def _get_column_definitions(self, session: Any) -> List[Tuple[str, str]]:
        """Retrieve dynamic DataTables column definitions from MarketChameleon bundle."""
        if self.column_defs:
            return self.column_defs

        try:
            r_bundle = session.get("https://marketchameleon.com/bundles/MCPJS1.js", timeout=15)
            text = r_bundle.text
            idx = text.find("function equityScreener_LoadTable")
            if idx != -1:
                sub = text[idx : idx + 35000]
                start = sub.find("columns:[") + 8
                depth = 0
                end = start
                for i in range(start, len(sub)):
                    if sub[i] == "[":
                        depth += 1
                    elif sub[i] == "]":
                        depth -= 1
                        if depth == 0:
                            end = i
                            break

                cols_text = sub[start : end + 1]
                defs = []
                for m in re.finditer(r"\{([^}]+)\}", cols_text):
                    block = m.group(1)
                    name_m = re.search(r'name:\s*["\']([^"\']+)["\']', block)
                    data_m = re.search(r'data:\s*["\']([^"\']+)["\']', block)
                    if name_m and data_m:
                        defs.append((name_m.group(1), data_m.group(1)))

                if defs:
                    self.column_defs = defs
                    logger.info(f"Loaded {len(defs)} column definitions from MarketChameleon bundle.")
                    return defs
        except Exception as e:
            logger.warning(f"Could not load dynamic bundle columns: {e}. Using standard schema fallback.")

        # Robust standard schema fallback matching MarketChameleon's 124 DataTables columns
        fallback_defs = [
            ("c0", "Symbol"),
            ("c1", "BD.Name"),
            ("c2", "BD.Px"),
            ("c3", "BD.PxChgPct"),
            ("c6", "BD.Volume"),
            ("c51", "BD.AvgVolume"),
            ("c7", "BD.RelVolume"),
            ("c8", "BD.MarketCap"),
            ("c9", "BD.DivYield"),
            ("c10", "Fm.pe_ratio"),
            ("c53", "BD.Chg2D"),
            ("c54", "BD.Chg3D"),
            ("c55", "BD.Chg4D"),
            ("c56", "BD.Chg5D"),
            ("c57", "BD.Chg6D"),
            ("c58", "BD.Chg7D"),
            ("c11", "BD.Chg2Wk"),
            ("c12", "BD.Chg3M"),
            ("c13", "BD.Chg6M"),
            ("c14", "BD.Chg1Y"),
            ("c15", "BD.ChgYTD"),
            ("c200", "BD.Chg3Y"),
            ("c201", "BD.Chg5Y"),
            ("c4", "BD.ChgCloseToOpen"),
            ("c5", "BD.ChgOpenPx"),
            ("c16", "BD.Chg52WLo"),
            ("c17", "BD.Chg52WHi"),
            ("c18", "BD.ChgMA20"),
            ("c19", "BD.ChgMA50"),
            ("c20", "BD.ChgMA250"),
            ("c21", "BD.IV30"),
            ("c22", "BD.IV30Chg"),
            ("c23", "BD.OptVolume"),
            ("c24", "BD.RelOptVolume"),
            ("c25", "BD.IVRank"),
            ("c26", "BD.Sector"),
            ("c27", "BD.Industry"),
            ("c28", "BD.EquityType"),
            ("c32", "BD.DivGrowth1Yr"),
            ("c33", "BD.DivGrowth3Yr"),
            ("c34", "BD.PayoutRatio"),
            ("c45", "BD.RSI14"),
            ("c46", "BD.DivIncreases3Yr"),
            ("c47", "BD.DivDecreases3Yr"),
            ("c48", "BD.Vol1Day"),
            ("c49", "BD.Vol20Day"),
            ("c50", "BD.Vol1Year"),
            ("c52", "BD.Skew25DSort"),
            ("c80", "BD.Country"),
            ("c90", "BD.ShrOut"),
            ("c91", "BD.ShrFloat"),
            ("MA_20D", "BD.MA_20D"),
            ("MA_50D", "BD.MA_50D"),
            ("MA_250D", "BD.MA_250D"),
            ("_20MA_vs_50MA", "BD.MA_20v50"),
            ("_20MA_vs_250MA", "BD.MA_20v250"),
            ("_50MA_vs_250MA", "BD.MA_50v250"),
            ("c59", "BD.MA_Name"),
            ("c81", "BD.DayVWMinSD"),
            ("c82", "BD.DayVWAP"),
            ("c83", "BD.DayVWPlusSD"),
            ("c84", "BD.PvVWStd"),
            ("c85", "BD.PvVWPct"),
            ("c86", "BD.VwSD"),
            ("c101", "Fm.pe_ratio"),
            ("c102", "Fm.pe_normalized_eps"),
            ("c103", "Fm.px_to_sales"),
            ("c104", "Fm.px_to_bookval"),
            ("c105", "Fm.px_to_tangiblebookval"),
            ("c106", "Fm.peg_ratio"),
            ("c107", "Fm.px_to_cash"),
            ("c108", "Fm.px_to_freecashflow"),
            ("c109", "Fm.px_to_ebitda"),
            ("c110", "Fm.forward_pe_ratio"),
            ("c111", "Fm.peg_pay_back"),
            ("c112", "Fm.price_to_cfo"),
            ("c113", "Fm.ev_to_ebitda"),
            ("c121", "Fm.gross_margin"),
            ("c122", "Fm.ebitda_margin"),
            ("c123", "Fm.ebit_margin"),
            ("c124", "Fm.net_profit_marg"),
            ("c125", "Fm.norm_net_profit_marg"),
            ("c126", "Fm.tax_rate"),
            ("c127", "Fm.return_on_equity"),
            ("c128", "Fm.sales_per_employee"),
            ("c129", "Fm.pretax_marg"),
            ("c130", "Fm.roic"),
            ("c131", "Fm.ops_marg"),
            ("c132", "Fm.roa"),
            ("c133", "Fm.cash_return"),
            ("c141", "Fm.debt_to_equity"),
            ("c142", "Fm.debt_to_assets"),
            ("c143", "Fm.debt_to_ebitda"),
            ("c144", "Fm.debt_to_cash"),
            ("c145", "Fm.interest_coverage"),
            ("c146", "Fm.quick_ratio"),
            ("c147", "Fm.current_ratio"),
            ("c148", "Fm.debt_to_capital"),
            ("c149", "Fm.financial_leverage"),
            ("c161", "Fm.diluted_eps_growth"),
            ("c162", "Fm.sust_growth_rate"),
            ("c163", "Fm.revenue_growth"),
            ("c164", "Fm.ops_income_growth"),
            ("c165", "Fm.gross_profit_ann_5y_growth"),
            ("c166", "Fm.cap_expend_ann_5y_growth"),
            ("c167", "Fm.net_income_growth"),
            ("c170", "DailyPerf15.PctPos"),
            ("c171", "DailyPerf15.AvgRet"),
            ("c172", "DailyPerf15.StdDev"),
            ("c173", "DailyPerf15.Sharpe"),
            ("c174", "DailyPerf30.PctPos"),
            ("c175", "DailyPerf30.AvgRet"),
            ("c176", "DailyPerf30.StdDev"),
            ("c177", "DailyPerf30.Sharpe"),
            ("c178", "DailyPerf90.PctPos"),
            ("c179", "DailyPerf90.AvgRet"),
            ("c180", "DailyPerf90.StdDev"),
            ("c181", "DailyPerf90.Sharpe"),
            ("c29", "BD.EtfHoldingsList"),
            ("c30", "BD.EarningsType"),
            ("c31", "BD.HasOptions"),
            ("StockIdeas", "BD.StockIdeas"),
        ]
        self.column_defs = fallback_defs
        return fallback_defs

    def fetch_records(self, limit: int = 500, page_size: int = 100) -> List[ScreenerRecord]:
        """
        Fetch all records across multiple pages from MarketChameleon Stock Screener
        with the preselected criteria.
        """
        try:
            from curl_cffi import requests
        except ImportError:
            raise RuntimeError("curl_cffi is required. Install via `pip install curl_cffi`")

        logger.info(f"Connecting to MarketChameleon ({self.target_url})...")
        session = requests.Session(impersonate="chrome120")

        # 1. Warm up session
        r_init = session.get(self.target_url, timeout=20)
        if r_init.status_code != 200:
            raise RuntimeError(f"Failed to load MarketChameleon page: HTTP {r_init.status_code}")

        # 2. Get column definitions
        col_defs = self._get_column_definitions(session)

        headers = {
            "Referer": self.target_url,
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "https://marketchameleon.com",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        }

        all_records: List[ScreenerRecord] = []
        start = 0
        draw = 1
        total_filtered = None

        logger.info(
            f"Applying Preselected Filters: Momentum, MktCap > $1B, Has Options, RSI 50-70, USA, Vol > 30, MA Bullish..."
        )

        while True:
            payload: Dict[str, str] = {
                "draw": str(draw),
                "start": str(start),
                "length": str(page_size),
                "search[value]": "",
                "search[regex]": "false",
                "order[0][column]": "7",  # Order by Market Cap desc
                "order[0][dir]": "desc",
            }

            for idx, (cname, cdata) in enumerate(col_defs):
                payload[f"columns[{idx}][data]"] = cdata
                payload[f"columns[{idx}][name]"] = cname
                payload[f"columns[{idx}][searchable]"] = "true"
                payload[f"columns[{idx}][orderable]"] = "true"
                val = self.filters.get(cname, "")
                payload[f"columns[{idx}][search][value]"] = val
                payload[f"columns[{idx}][search][regex]"] = "false"

            resp = session.post(MARKETCHAMELEON_DATA_ENDPOINT, data=payload, headers=headers, timeout=25)
            if resp.status_code != 200:
                logger.error(f"POST error HTTP {resp.status_code}: {resp.text[:200]}")
                break

            data = resp.json()
            if total_filtered is None:
                total_filtered = int(data.get("recordsFiltered", 0))
                logger.info(f"Total matching candidates across all pages: {total_filtered}")

            raw_rows = data.get("data", [])
            if not raw_rows:
                break

            for r in raw_rows:
                rec = self._parse_json_row(r)
                if rec:
                    all_records.append(rec)

            logger.info(f"Fetched page {draw} (records {start + 1} to {start + len(raw_rows)} of {total_filtered})")
            start += len(raw_rows)
            draw += 1

            if start >= total_filtered or len(all_records) >= limit:
                break

        logger.info(f"Successfully retrieved {len(all_records)} total MarketChameleon momentum stocks!")
        return all_records

    def _parse_json_row(self, r: Dict[str, Any]) -> Optional[ScreenerRecord]:
        """Map MarketChameleon raw row to ScreenerRecord."""
        symbol = str(r.get("Symbol") or "").strip().upper()
        if not symbol:
            return None

        bd = r.get("BD", {})
        fm = r.get("Fm", {})

        name = str(bd.get("Name") or symbol).strip()

        def clean_float(val: Any, default: float = 0.0) -> float:
            if val is None or val == "":
                return default
            try:
                s = str(val).replace("$", "").replace(",", "").replace("%", "").strip()
                return float(s)
            except Exception:
                return default

        last_price = clean_float(bd.get("Px"))
        price_change = clean_float(bd.get("PxChg"))

        # Convert percent change decimal (e.g. 0.015 -> 1.50%)
        raw_pct = clean_float(bd.get("PxChgPct"))
        if abs(raw_pct) < 1.0 and raw_pct != 0:
            percent_change = round(raw_pct * 100.0, 2)
        else:
            percent_change = round(raw_pct, 2)

        rsi14 = clean_float(bd.get("RSI14"), 50.0)
        iv30 = clean_float(bd.get("IV30"))
        iv_rank = clean_float(bd.get("IVRank"))
        vol_1d = clean_float(bd.get("Vol1Day"))
        vol_20d = clean_float(bd.get("Vol20Day"))
        vol_1y = clean_float(bd.get("Vol1Year"))

        volume = int(clean_float(bd.get("Volume")))
        avg_volume = int(clean_float(bd.get("AvgVolume")))
        rel_volume = clean_float(bd.get("RelVolume"))
        market_cap_str = str(bd.get("MarketCapStr") or "")
        pe_ratio = clean_float(fm.get("pe_ratio"))
        div_yield = clean_float(bd.get("DivYield")) * 100.0 if bd.get("DivYield") else 0.0

        ma_name = str(bd.get("MA_Name") or "Bullish Trend").strip()
        ma_desc = str(bd.get("MA_Desc") or "").strip()
        country = str(bd.get("Country") or "USA").strip()
        has_options = bool(bd.get("HasOptions", True))

        # Composite opinion based on MarketChameleon MA Signal + Momentum RSI
        opinion = f"Bullish ({ma_name})" if ma_name else "Bullish Momentum"
        opinion_pct = 95.0 if "uptrend" in ma_name.lower() else 85.0

        # Strategy implication
        if iv30 >= 40:
            recommended_strat = "BULL_PUT_SPREAD"
        elif rsi14 <= 55:
            recommended_strat = "CSP"
        else:
            recommended_strat = "COVERED_CALL"

        notes = f"RSI: {rsi14} | IV30: {iv30}% | MktCap: {market_cap_str} | Signal: {ma_name}"

        return ScreenerRecord(
            symbol=symbol,
            name=name,
            last_price=last_price,
            price_change=price_change,
            percent_change=percent_change,
            opinion=opinion,
            opinion_pct=opinion_pct,
            opinion_previous=f"RSI {rsi14:.1f}",
            opinion_last_week=f"IV30 {iv30:.1f}%",
            opinion_last_month=f"1Y Vol {vol_1y:.1f}%",
            has_options=has_options,
            has_weekly_options=True,
            signal_strength=f"IV30: {iv30:.1f}%",
            signal_direction="Strong Bullish" if "uptrend" in ma_name.lower() else "Bullish",
            source=self.source_id,
            source_url=self.target_url,
            recommended_strategy=recommended_strat,
            notes=notes,
            extra_fields={
                "rsi_14": rsi14,
                "iv30": iv30,
                "iv_rank": iv_rank,
                "vol_1d": vol_1d,
                "vol_20d": vol_20d,
                "vol_1y": vol_1y,
                "volume": volume,
                "avg_volume": avg_volume,
                "rel_volume": rel_volume,
                "market_cap_str": market_cap_str,
                "pe_ratio": pe_ratio,
                "div_yield_pct": round(div_yield, 2),
                "ma_signal": ma_name,
                "ma_desc": ma_desc,
                "country": country,
                "stock_idea": "Momentum Stocks",
            },
        )

    def export_csv(self, records: List[ScreenerRecord], output_path: Union[str, Path]) -> str:
        """
        Export all records including respective MarketChameleon column headings.
        """
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        fieldnames = [
            "Symbol",
            "Name",
            "Price",
            "Price Change",
            "% Chg",
            "Volume",
            "Avg Volume",
            "Relative Volume",
            "Market Cap",
            "Div Yield %",
            "P/E Ratio",
            "14-Day RSI",
            "IV30",
            "IV % Rank",
            "1-Day Volatility",
            "20-Day Volatility",
            "1-Year Volatility",
            "MA Technical Signal",
            "MA Description",
            "Country",
            "Has Options",
            "Stock Idea",
            "Recommended Strategy",
            "Notes",
            "Source",
            "Updated At",
        ]

        with open(out, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(fieldnames)

            for r in records:
                ex = r.extra_fields or {}
                writer.writerow([
                    r.symbol,
                    r.name,
                    f"${r.last_price:.2f}",
                    f"{r.price_change:+.2f}",
                    f"{r.percent_change:+.2f}%",
                    ex.get("volume", ""),
                    ex.get("avg_volume", ""),
                    ex.get("rel_volume", ""),
                    ex.get("market_cap_str", ""),
                    ex.get("div_yield_pct", ""),
                    ex.get("pe_ratio", ""),
                    ex.get("rsi_14", ""),
                    ex.get("iv30", ""),
                    ex.get("iv_rank", ""),
                    ex.get("vol_1d", ""),
                    ex.get("vol_20d", ""),
                    ex.get("vol_1y", ""),
                    ex.get("ma_signal", ""),
                    ex.get("ma_desc", ""),
                    ex.get("country", "USA"),
                    "Yes" if r.has_options else "No",
                    ex.get("stock_idea", "Momentum Stocks"),
                    r.recommended_strategy,
                    r.notes,
                    r.source,
                    r.updated_at,
                ])

        return str(out.resolve())

    def generate_copy_paste_text(self, records: List[ScreenerRecord]) -> str:
        """
        Generate tab-delimited text ready to copy and paste directly into spreadsheets or documents,
        including respective column headings.
        """
        output = io.StringIO()
        fieldnames = [
            "Symbol",
            "Name",
            "Price",
            "Change",
            "% Chg",
            "Market Cap",
            "14-Day RSI",
            "IV30",
            "20-Day Vol",
            "1-Yr Vol",
            "MA Signal",
            "Recommended Strategy",
        ]
        output.write("\t".join(fieldnames) + "\n")

        for r in records:
            ex = r.extra_fields or {}
            row = [
                r.symbol,
                r.name,
                f"${r.last_price:.2f}",
                f"{r.price_change:+.2f}",
                f"{r.percent_change:+.2f}%",
                str(ex.get("market_cap_str", "")),
                str(ex.get("rsi_14", "")),
                f"{ex.get('iv30', '')}%" if ex.get("iv30") else "",
                f"{ex.get('vol_20d', '')}%" if ex.get("vol_20d") else "",
                f"{ex.get('vol_1y', '')}%" if ex.get("vol_1y") else "",
                str(ex.get("ma_signal", "")),
                r.recommended_strategy,
            ]
            output.write("\t".join(row) + "\n")

        return output.getvalue()

    def parse_csv(self, csv_data: Union[str, Path, io.StringIO]) -> List[ScreenerRecord]:
        """
        Parse raw CSV or copied-and-pasted tabular text from MarketChameleon.
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
            if any(k in line.lower() for k in ["symbol", "ticker", "price", "iv", "name"]):
                header_idx = i
                break

        # Check delimiter (tab or comma)
        sample_line = lines[header_idx] if len(lines) > header_idx else ""
        delimiter = "\t" if "\t" in sample_line else ","

        csv_reader = csv.DictReader(lines[header_idx:], delimiter=delimiter)
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

            symbol = get_col("symbol", "ticker").upper()
            if not symbol:
                continue

            name = get_col("name", "company", "description", default=symbol)
            price_str = get_col("price", "stockprice", "lastprice", "last", default="0")
            pct_str = get_col("%chg", "%change", "percentchange", "pctchange", default="0")
            chg_str = get_col("netchange", "chg", "change", "pricechange", default="0")
            iv30_str = get_col("iv30", "iv_30", default="35")
            rsi_str = get_col("14dayrsi", "rsi14", "rsi", default="60")
            mkt_cap_str = get_col("marketcap", "mktcap", default="")
            ma_signal = get_col("matechnicalsignal", "masignal", "ma", default="Bullish Trend")

            def clean_f(s: str) -> float:
                try:
                    return float(re.sub(r"[^\d.-]", "", s) or 0)
                except Exception:
                    return 0.0

            last_price = clean_f(price_str)
            price_change = clean_f(chg_str)
            percent_change = clean_f(pct_str)
            iv30 = clean_f(iv30_str)
            rsi14 = clean_f(rsi_str)

            records.append(
                ScreenerRecord(
                    symbol=symbol,
                    name=name,
                    last_price=last_price,
                    price_change=price_change,
                    percent_change=percent_change,
                    opinion=f"Bullish ({ma_signal})",
                    opinion_pct=90.0,
                    opinion_previous=f"RSI {rsi14:.1f}",
                    opinion_last_week=f"IV30 {iv30:.1f}%",
                    has_options=True,
                    has_weekly_options=True,
                    signal_strength=f"IV30: {iv30:.1f}%",
                    signal_direction="Bullish",
                    source=self.source_id,
                    source_url=self.target_url,
                    recommended_strategy="BULL_PUT_SPREAD" if iv30 >= 40 else "CSP",
                    notes=f"RSI: {rsi14} | IV30: {iv30}% | Signal: {ma_signal}",
                    extra_fields={
                        "rsi_14": rsi14,
                        "iv30": iv30,
                        "market_cap_str": mkt_cap_str,
                        "ma_signal": ma_signal,
                        "stock_idea": "Momentum Stocks",
                    },
                )
            )

        return records
