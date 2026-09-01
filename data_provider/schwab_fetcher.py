# -*- coding: utf-8 -*-
"""
SchwabFetcher — Charles Schwab Retail Trader API Provider for US Equities and Options

Provides direct access to Schwab's retail developer platform:
- Real-time Level 1/2 quotes
- Live option chains with real-time Greeks (Delta, Theta, Gamma, Vega, Implied Volatility)
- Historical OHLCV candles
- Automated OAuth2 refresh token lifecycle
"""

import base64
import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import pandas as pd
import requests

from .base import BaseFetcher, DataFetchError, STANDARD_COLUMNS
from .realtime_types import UnifiedRealtimeQuote, RealtimeSource
from .us_index_mapping import is_us_stock_code

logger = logging.getLogger(__name__)

_SCHWAB_API_BASE = "https://api.schwabapi.com"
_SCHWAB_TOKEN_URL = f"{_SCHWAB_API_BASE}/v1/oauth/token"
_SCHWAB_MARKETDATA_URL = f"{_SCHWAB_API_BASE}/marketdata/v1"


class SchwabAuthManager:
    """Manages OAuth2 credentials and token lifecycle for Charles Schwab Developer API."""

    def __init__(
        self,
        app_key: Optional[str] = None,
        app_secret: Optional[str] = None,
        callback_url: str = "https://127.0.0.1",
        token_path: str = "schwab_token.json",
    ):
        self.app_key = app_key or os.getenv("SCHWAB_APP_KEY", "").strip()
        self.app_secret = app_secret or os.getenv("SCHWAB_APP_SECRET", "").strip()
        self.callback_url = callback_url or os.getenv("SCHWAB_CALLBACK_URL", "https://127.0.0.1").strip()
        self.token_path = token_path or os.getenv("SCHWAB_TOKEN_PATH", "schwab_token.json").strip()
        self._tokens: Dict[str, Any] = {}
        self._load_tokens()

    def is_configured(self) -> bool:
        """Returns True if minimum credentials (app_key and app_secret) are set."""
        return bool(self.app_key and self.app_secret)

    def _load_tokens(self) -> None:
        """Loads cached OAuth tokens from file if available."""
        if os.path.exists(self.token_path):
            try:
                with open(self.token_path, "r", encoding="utf-8") as f:
                    self._tokens = json.load(f)
            except Exception as e:
                logger.warning(f"[Schwab] Failed to load token from {self.token_path}: {e}")

    def _save_tokens(self) -> None:
        """Saves current OAuth tokens to disk."""
        try:
            with open(self.token_path, "w", encoding="utf-8") as f:
                json.dump(self._tokens, f, indent=2)
        except Exception as e:
            logger.warning(f"[Schwab] Failed to save token to {self.token_path}: {e}")

    def get_authorization_url(self) -> str:
        """Generates the Schwab authorization URL for manual or automated browser login."""
        return (
            f"https://api.schwabapi.com/v1/oauth/authorize?"
            f"client_id={self.app_key}&"
            f"redirect_uri={self.callback_url}"
        )

    def exchange_code_for_token(self, auth_code: str) -> Dict[str, Any]:
        """Exchanges an authorization code for access and refresh tokens."""
        if not self.is_configured():
            raise DataFetchError("[Schwab] App Key and Secret must be configured")

        auth_header = base64.b64encode(f"{self.app_key}:{self.app_secret}".encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "grant_type": "authorization_code",
            "code": auth_code,
            "redirect_uri": self.callback_url,
        }

        resp = requests.post(_SCHWAB_TOKEN_URL, headers=headers, data=data, timeout=15)
        if resp.status_code != 200:
            raise DataFetchError(f"[Schwab] Token exchange failed ({resp.status_code}): {resp.text}")

        tokens = resp.json()
        tokens["expires_at"] = time.time() + tokens.get("expires_in", 1800) - 60
        self._tokens = tokens
        self._save_tokens()
        return tokens

    def refresh_access_token(self) -> Optional[str]:
        """Refreshes the access token using the stored refresh token."""
        refresh_token = self._tokens.get("refresh_token")
        if not refresh_token:
            return None

        auth_header = base64.b64encode(f"{self.app_key}:{self.app_secret}".encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }

        try:
            resp = requests.post(_SCHWAB_TOKEN_URL, headers=headers, data=data, timeout=15)
            if resp.status_code == 200:
                tokens = resp.json()
                tokens["expires_at"] = time.time() + tokens.get("expires_in", 1800) - 60
                # Preserve refresh token if not returned in refresh response
                if "refresh_token" not in tokens:
                    tokens["refresh_token"] = refresh_token
                self._tokens = tokens
                self._save_tokens()
                return tokens.get("access_token")
            else:
                logger.warning(f"[Schwab] Refresh failed ({resp.status_code}): {resp.text}")
                return None
        except Exception as e:
            logger.warning(f"[Schwab] Error during token refresh: {e}")
            return None

    def get_valid_access_token(self) -> Optional[str]:
        """Returns a valid access token, automatically refreshing if close to expiry."""
        if not self.is_configured():
            return None

        access_token = self._tokens.get("access_token")
        expires_at = self._tokens.get("expires_at", 0)

        # Token still valid
        if access_token and time.time() < expires_at:
            return access_token

        # Try refresh
        return self.refresh_access_token()


class SchwabFetcher(BaseFetcher):
    """
    Charles Schwab Retail Trader API Fetcher.
    Highest priority for real-time US quotes and options chains with live Greeks.
    """

    name = "SchwabFetcher"
    priority = 1

    def __init__(self, auth_manager: Optional[SchwabAuthManager] = None):
        self.auth = auth_manager or SchwabAuthManager()

    def is_available(self) -> bool:
        """Returns True if Schwab API is configured and has a valid access token."""
        return bool(self.auth.get_valid_access_token())

    def _get_headers(self) -> Dict[str, str]:
        token = self.auth.get_valid_access_token()
        if not token:
            raise DataFetchError("[Schwab] No valid access token available")
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

    def fetch_quotes(self, symbols: List[str]) -> Dict[str, Any]:
        """Fetches real-time NBBO quotes for one or more US equities or ETFs."""
        headers = self._get_headers()
        clean_symbols = [s.strip().upper() for s in symbols if is_us_stock_code(s)]
        if not clean_symbols:
            return {}

        url = f"{_SCHWAB_MARKETDATA_URL}/quotes"
        params = {"symbols": ",".join(clean_symbols), "fields": "quote,reference"}

        resp = requests.get(url, headers=headers, params=params, timeout=10)
        if resp.status_code != 200:
            raise DataFetchError(f"[Schwab] Quotes request failed ({resp.status_code}): {resp.text}")
        return resp.json()

    def fetch_option_chains(
        self,
        symbol: str,
        contract_type: str = "ALL",
        strike_count: int = 15,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetches full live option chains with real-time Greeks from Schwab.
        
        contract_type: 'ALL', 'CALL', 'PUT'
        from_date / to_date: 'YYYY-MM-DD'
        """
        headers = self._get_headers()
        clean_symbol = symbol.strip().upper()

        url = f"{_SCHWAB_MARKETDATA_URL}/chains"
        params: Dict[str, Any] = {
            "symbol": clean_symbol,
            "contractType": contract_type.upper(),
            "strikeCount": strike_count,
            "includeUnderlyingQuote": "TRUE",
            "strategy": "SINGLE",
        }
        if from_date:
            params["fromDate"] = from_date
        if to_date:
            params["toDate"] = to_date

        resp = requests.get(url, headers=headers, params=params, timeout=12)
        if resp.status_code != 200:
            raise DataFetchError(f"[Schwab] Option chains failed ({resp.status_code}): {resp.text}")
        return resp.json()

    def parse_conservative_opportunities(
        self,
        chain_data: Dict[str, Any],
        lower_bb: float,
        upper_bb: float,
        target_delta_min: float = 0.12,
        target_delta_max: float = 0.23,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Filters live Schwab option chain for DeltaHarvest criteria:
        - CSP: Puts <= lower_bb with absolute delta between target_delta_min and max (0.15–0.20 Delta rule)
        - CC: Calls >= upper_bb with delta between target_delta_min and max (0.15–0.20 Delta rule)
        """
        underlying = chain_data.get("underlying", {})
        spot = underlying.get("mark") or underlying.get("last") or 0.0

        put_opps: List[Dict[str, Any]] = []
        call_opps: List[Dict[str, Any]] = []

        # Parse Puts
        put_map = chain_data.get("putExpDateMap", {})
        for exp_key, strikes in put_map.items():
            for strike_str, contracts in strikes.items():
                for contract in contracts:
                    strike = float(strike_str)
                    delta = abs(contract.get("delta", 0.0))
                    # Strict 0.15 - 0.20 delta zone and outside Lower BB
                    if strike <= lower_bb and target_delta_min <= delta <= target_delta_max:
                        put_opps.append({
                            "symbol": contract.get("symbol"),
                            "strike": strike,
                            "type": "put",
                            "expiration": exp_key.split(":")[0],
                            "dte": contract.get("daysToExpiration", 0),
                            "bid": contract.get("bid", 0.0),
                            "ask": contract.get("ask", 0.0),
                            "mark": contract.get("mark", 0.0),
                            "delta": -delta,
                            "theta": contract.get("theta", 0.0),
                            "iv": contract.get("volatility", 0.0),
                            "open_interest": contract.get("openInterest", 0),
                            "volume": contract.get("totalVolume", 0),
                            "spot": spot,
                        })

        # Parse Calls
        call_map = chain_data.get("callExpDateMap", {})
        for exp_key, strikes in call_map.items():
            for strike_str, contracts in strikes.items():
                for contract in contracts:
                    strike = float(strike_str)
                    delta = abs(contract.get("delta", 0.0))
                    # Strict 0.15 - 0.20 delta zone and outside Upper BB
                    if strike >= upper_bb and target_delta_min <= delta <= target_delta_max:
                        call_opps.append({
                            "symbol": contract.get("symbol"),
                            "strike": strike,
                            "type": "call",
                            "expiration": exp_key.split(":")[0],
                            "dte": contract.get("daysToExpiration", 0),
                            "bid": contract.get("bid", 0.0),
                            "ask": contract.get("ask", 0.0),
                            "mark": contract.get("mark", 0.0),
                            "delta": delta,
                            "theta": contract.get("theta", 0.0),
                            "iv": contract.get("volatility", 0.0),
                            "open_interest": contract.get("openInterest", 0),
                            "volume": contract.get("totalVolume", 0),
                            "spot": spot,
                        })

        return {"puts": put_opps, "calls": call_opps}

    def _fetch_raw_data(self, stock_code: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Fetches daily historical OHLCV candle bars from Schwab pricehistory endpoint."""
        headers = self._get_headers()
        symbol = stock_code.strip().upper()

        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")

        url = f"{_SCHWAB_MARKETDATA_URL}/pricehistory"
        params = {
            "symbol": symbol,
            "periodType": "year",
            "frequencyType": "daily",
            "frequency": 1,
            "startDate": int(start_dt.timestamp() * 1000),
            "endDate": int(end_dt.timestamp() * 1000),
            "needExtendedHoursData": "false",
        }

        resp = requests.get(url, headers=headers, params=params, timeout=12)
        if resp.status_code != 200:
            raise DataFetchError(f"[Schwab] Price history failed ({resp.status_code}): {resp.text}")

        data = resp.json()
        candles = data.get("candles", [])
        if not candles:
            return pd.DataFrame(columns=STANDARD_COLUMNS)

        records = []
        for c in candles:
            dt = datetime.fromtimestamp(c["datetime"] / 1000.0).strftime("%Y-%m-%d")
            records.append({
                "date": dt,
                "open": float(c["open"]),
                "high": float(c["high"]),
                "low": float(c["low"]),
                "close": float(c["close"]),
                "volume": float(c["volume"]),
            })

        df = pd.DataFrame(records)
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)
        return df
