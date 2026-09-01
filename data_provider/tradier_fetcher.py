# -*- coding: utf-8 -*-
"""
TradierFetcher — Tradier API Options Chains and Equities Quote Provider.

Implements Phase 1 Component 1 from enhance.md:
- Provides fallback options chain data, Open Interest, and Greeks
- REST API client for api.tradier.com (Production and Sandbox environments)
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import pandas as pd
import requests

from .base import BaseFetcher, DataFetchError, STANDARD_COLUMNS

logger = logging.getLogger(__name__)


class TradierFetcher(BaseFetcher):
    """
    Tradier API Provider for US Equities and Options Chains.
    Used as an automatic fallback when Schwab session is offline or pending authentication.
    """

    name = "TradierFetcher"
    priority = 2

    def __init__(
        self,
        api_token: Optional[str] = None,
        use_sandbox: bool = False,
    ):
        self.api_token = api_token or os.getenv("TRADIER_API_TOKEN", "").strip()
        self.use_sandbox = use_sandbox or os.getenv("TRADIER_USE_SANDBOX", "false").lower() == "true"
        self.base_url = "https://sandbox.tradier.com/v1" if self.use_sandbox else "https://api.tradier.com/v1"
        self.session = requests.Session()

    def is_available(self) -> bool:
        """Returns True if Tradier API token is configured."""
        return bool(self.api_token)

    def _get_headers(self) -> Dict[str, str]:
        if not self.api_token:
            raise DataFetchError("[Tradier] TRADIER_API_TOKEN is not configured")
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Accept": "application/json",
        }

    def fetch_quotes(self, symbols: List[str]) -> Dict[str, Any]:
        """Fetches market quotes for symbols."""
        if not symbols or not self.is_available():
            return {}
        clean_symbols = ",".join([s.strip().upper() for s in symbols])
        url = f"{self.base_url}/markets/quotes"
        try:
            resp = self.session.get(
                url,
                headers=self._get_headers(),
                params={"symbols": clean_symbols, "greeks": "true"},
                timeout=10,
            )
            if resp.status_code == 200:
                return resp.json()
            logger.warning(f"[Tradier] Quotes failed ({resp.status_code}): {resp.text}")
            return {}
        except Exception as e:
            logger.warning(f"[Tradier] Error fetching quotes: {e}")
            return {}

    def fetch_option_chains(self, symbol: str, expiration: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetches option chain with Greeks and Open Interest for symbol.
        """
        if not self.is_available():
            return {}
        url = f"{self.base_url}/markets/options/chains"
        params = {"symbol": symbol.strip().upper(), "greeks": "true"}
        if expiration:
            params["expiration"] = expiration

        try:
            resp = self.session.get(url, headers=self._get_headers(), params=params, timeout=12)
            if resp.status_code == 200:
                return resp.json()
            logger.warning(f"[Tradier] Option chain failed ({resp.status_code}): {resp.text}")
            return {}
        except Exception as e:
            logger.warning(f"[Tradier] Error fetching option chain: {e}")
            return {}

    def _fetch_raw_data(self, stock_code: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Fetches daily historical price bars from Tradier."""
        if not self.is_available():
            return pd.DataFrame(columns=STANDARD_COLUMNS)

        url = f"{self.base_url}/markets/history"
        params = {
            "symbol": stock_code.strip().upper(),
            "interval": "daily",
            "start": start_date,
            "end": end_date,
        }

        try:
            resp = self.session.get(url, headers=self._get_headers(), params=params, timeout=12)
            if resp.status_code != 200:
                return pd.DataFrame(columns=STANDARD_COLUMNS)
            data = resp.json().get("history", {}).get("day", [])
            if not data:
                return pd.DataFrame(columns=STANDARD_COLUMNS)

            df = pd.DataFrame(data)
            df.rename(
                columns={
                    "open": "open",
                    "high": "high",
                    "low": "low",
                    "close": "close",
                    "volume": "volume",
                },
                inplace=True,
            )
            df["date"] = pd.to_datetime(df["date"])
            df.set_index("date", inplace=True)
            return df
        except Exception as e:
            logger.warning(f"[Tradier] Historical fetch failed: {e}")
            return pd.DataFrame(columns=STANDARD_COLUMNS)
