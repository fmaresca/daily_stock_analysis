"""Weekly Options Validator for US Equities and ETFs.

Validates whether a ticker has active weekly options using:
1. Real-time expiration chain date cadence from yfinance.
2. Official CBOE Available Weeklys Directory (cached download).
"""

import io
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Set

import pandas as pd
import requests
import yfinance as yf

CBOE_WEEKLYS_CSV_URL = "https://www.cboe.com/available_weeklys/get_csv_download/"


def fetch_cboe_weekly_directory() -> Set[str]:
    """Fetches and parses the official list of weekly optionable tickers from CBOE."""
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        }
        response = requests.get(CBOE_WEEKLYS_CSV_URL, headers=headers, timeout=10)
        if response.status_code != 200:
            return set()

        text = response.text
        tickers = set()
        for line in text.splitlines():
            tokens = [t.strip().strip('"') for t in line.split(",")]
            for token in tokens:
                # Standard US ticker regex (1 to 5 uppercase alpha chars)
                if re.match(r"^[A-Z]{1,5}$", token) and token not in {
                    "SYMBOL", "NAME", "EXPIRES", "TYPE", "CBOE", "CLASS"
                }:
                    tickers.add(token)
        return tickers
    except Exception as e:
        print(f"[!] CBOE directory fetch warning: {e}")
        return set()


def check_ticker_weekly_options(ticker_symbol: str, cboe_set: Set[str] = None) -> Dict[str, Any]:
    """Inspects live yfinance options chain to verify active weekly expirations."""
    symbol = ticker_symbol.upper().strip()
    in_cboe_list = symbol in cboe_set if cboe_set else False

    try:
        ticker = yf.Ticker(symbol)
        expirations = ticker.options  # Tuple of 'YYYY-MM-DD' strings

        if not expirations:
            return {
                "symbol": symbol,
                "has_weeklys": False,
                "in_cboe_registry": in_cboe_list,
                "cadence": "No Options Chain",
                "reason": "No options chain found",
                "upcoming_expirations": [],
                "next_expiration": "N/A",
                "next_expiration_days": None,
            }

        today = datetime.now().date()
        exp_dates = [datetime.strptime(exp, "%Y-%m-%d").date() for exp in expirations]
        upcoming_35d = [d for d in exp_dates if 0 <= (d - today).days <= 35]

        # Check for non-3rd-Friday expirations
        # Standard monthly expiration is the 3rd Friday (falls between day 15 and 21)
        has_non_third_friday = False
        for d in upcoming_35d:
            if not (15 <= d.day <= 21):
                has_non_third_friday = True
                break

        # If there are 3 or more expirations within 35 days, weeklys are actively traded
        has_weeklys = (len(upcoming_35d) >= 3) or has_non_third_friday or in_cboe_list

        next_exp = upcoming_35d[0] if upcoming_35d else exp_dates[0]
        days_to_next = (next_exp - today).days

        if len(upcoming_35d) >= 5:
            cadence = "Daily / Intra-Week"
        elif len(upcoming_35d) >= 3 or has_non_third_friday or in_cboe_list:
            cadence = "Weekly"
        else:
            cadence = "Monthly Only"

        return {
            "symbol": symbol,
            "has_weeklys": has_weeklys,
            "in_cboe_registry": in_cboe_list,
            "total_expirations_35d": len(upcoming_35d),
            "next_expiration": next_exp.strftime("%Y-%m-%d"),
            "next_expiration_days": days_to_next,
            "upcoming_expirations": [d.strftime("%Y-%m-%d") for d in upcoming_35d[:4]],
            "cadence": cadence,
        }
    except Exception as e:
        return {
            "symbol": symbol,
            "has_weeklys": in_cboe_list,
            "in_cboe_registry": in_cboe_list,
            "cadence": "Weekly" if in_cboe_list else "Unknown",
            "reason": f"Error querying chain: {str(e)}",
            "upcoming_expirations": [],
            "next_expiration": "N/A",
            "next_expiration_days": None,
        }


if __name__ == "__main__":
    watchlist = [
        "SPY", "QQQ", "IWM", "NVDA", "AAPL", "MSFT", "AMZN",
        "JEPI", "SCHD", "TSLA", "PLTR", "AXTI", "IONQ", "NET",
        "RTX", "SPCX", "ZETA", "BLZE"
    ]

    print("[*] Fetching official CBOE Weeklys directory...")
    cboe_weeklys = fetch_cboe_weekly_directory()
    print(f"[OK] Loaded {len(cboe_weeklys)} tickers from CBOE registry.\n")

    print(f"{'STATUS':<15} {'TICKER':<6} {'CADENCE':<20} {'NEXT EXPIRATION':<20} {'CBOE REGISTRY'}")
    print("-" * 75)

    results = []
    for s in watchlist:
        res = check_ticker_weekly_options(s, cboe_weeklys)
        results.append(res)
        badge = "[WEEKLYS]" if res["has_weeklys"] else "[MONTHLY ONLY]"
        next_info = f"{res.get('next_expiration', 'N/A')} ({res.get('next_expiration_days', '?')} DTE)"
        cboe_info = "Yes (Registered)" if res.get('in_cboe_registry') else "No"
        print(f"{badge:<15} {s:<6} {res.get('cadence', 'N/A'):<20} {next_info:<20} {cboe_info}")
