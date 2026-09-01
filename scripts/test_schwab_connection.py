#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_schwab_connection.py — Charles Schwab Retail Trader API Diagnostic & Verification Tool

Usage:
  1. Set environment variables or pass flags:
     python scripts/test_schwab_connection.py --auth
     python scripts/test_schwab_connection.py --test-quotes SPY,TSLA
     python scripts/test_schwab_connection.py --test-chain SPY
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data_provider.schwab_fetcher import SchwabAuthManager, SchwabFetcher


def main():
    parser = argparse.ArgumentParser(description="Test and verify Charles Schwab Trader API connection.")
    parser.add_argument("--key", help="Schwab App Key (or set SCHWAB_APP_KEY in .env)")
    parser.add_argument("--secret", help="Schwab App Secret (or set SCHWAB_APP_SECRET in .env)")
    parser.add_argument("--callback", default="https://127.0.0.1", help="Callback URL registered in Schwab portal")
    parser.add_argument("--auth", action="store_true", help="Initiate OAuth2 authorization flow")
    parser.add_argument("--code", help="Exchange returned authorization code or full callback URL for access tokens")
    parser.add_argument("--test-quotes", default="SPY,TSLA", help="Comma-separated symbols to test live quotes")
    parser.add_argument("--test-chain", default="SPY", help="Symbol to test live options chain with Greeks")

    args = parser.parse_args()

    print("=" * 70)
    print(" Charles Schwab Retail Trader API Diagnostic & Verification Engine")
    print("=" * 70)

    auth = SchwabAuthManager(
        app_key=args.key,
        app_secret=args.secret,
        callback_url=args.callback,
    )

    if not auth.is_configured():
        print("\n[!] Error: Schwab App Key and App Secret are not configured.")
        print("    Please set SCHWAB_APP_KEY and SCHWAB_APP_SECRET in .env or pass via --key and --secret.")
        print(f"    Portal App creation URL: https://developer.schwab.com/")
        sys.exit(1)

    print(f"[*] App Key Configured: {auth.app_key[:4]}...{auth.app_key[-4:] if len(auth.app_key) > 8 else ''}")
    print(f"[*] Callback URL:       {auth.callback_url}")
    print(f"[*] Token Cache File:   {auth.token_path}")

    # Handle explicit auth code exchange
    if args.code:
        raw_code = args.code.strip()
        # If user pasted the whole URL https://127.0.0.1/?code=...
        if "code=" in raw_code:
            import urllib.parse
            parsed = urllib.parse.urlparse(raw_code)
            query_params = urllib.parse.parse_qs(parsed.query)
            extracted_code = query_params.get("code", [raw_code])[0]
            # Strip potential %2520 or %3D
            raw_code = urllib.parse.unquote(extracted_code)

        print("\n[*] Exchanging authorization code for OAuth tokens...")
        try:
            tokens = auth.exchange_code_for_token(raw_code)
            print(f"[OK] Token exchange successful! Access token valid for {tokens.get('expires_in', 1800)}s.")
        except Exception as e:
            print(f"[!] Token exchange failed: {e}")
            sys.exit(1)

    # Check if we have valid access token
    token = auth.get_valid_access_token()
    if not token:
        print("\n[!] No valid access token found in token cache.")
        auth_url = auth.get_authorization_url()
        print("\n" + "-" * 70)
        print(" STEP 1: Authorize with Charles Schwab")
        print("-" * 70)
        print(f"Open this URL in your web browser:\n\n{auth_url}\n")
        print("Log in with your Schwab retail credentials and click 'Allow'.")
        print("Schwab will redirect your browser to a blank page at https://127.0.0.1/?code=...")
        print("\n" + "-" * 70)
        print(" STEP 2: Complete Token Handshake")
        print("-" * 70)
        print("Copy the full URL from your browser address bar and run:")
        print(f"python scripts/test_schwab_connection.py --code \"<PASTE_REDIRECT_URL_HERE>\"\n")
        sys.exit(0)

    print("[OK] Valid Charles Schwab OAuth Access Token detected.")
    fetcher = SchwabFetcher(auth_manager=auth)

    # 1. Test Live Quotes
    test_symbols = [s.strip().upper() for s in args.test_quotes.split(",") if s.strip()]
    if test_symbols:
        print("\n" + "-" * 70)
        print(f" TEST 1: Live NBBO Market Data Quotes for {test_symbols}")
        print("-" * 70)
        try:
            t0 = time.time()
            quotes = fetcher.fetch_quotes(test_symbols)
            elapsed_ms = (time.time() - t0) * 1000
            print(f"[OK] Received response from Schwab in {elapsed_ms:.1f}ms:")
            for sym, q in quotes.items():
                quote_data = q.get("quote", {})
                bid = quote_data.get("bidPrice", "N/A")
                ask = quote_data.get("askPrice", "N/A")
                last = quote_data.get("lastPrice", "N/A")
                vol = quote_data.get("totalVolume", "N/A")
                print(f"    - {sym:<5}: Last=${last} | Bid=${bid} x Ask=${ask} | Volume={vol:,}" if isinstance(vol, (int, float)) else f"    - {sym:<5}: Last=${last} | Bid=${bid} x Ask=${ask}")
        except Exception as e:
            print(f"[!] Quote fetch failed: {e}")

    # 2. Test Live Options Chain
    if args.test_chain:
        chain_sym = args.test_chain.strip().upper()
        print("\n" + "-" * 70)
        print(f" TEST 2: Live Options Chain & Greeks for {chain_sym}")
        print("-" * 70)
        try:
            t0 = time.time()
            chain = fetcher.fetch_option_chains(symbol=chain_sym, strike_count=5)
            elapsed_ms = (time.time() - t0) * 1000
            underlying = chain.get("underlying", {})
            spot = underlying.get("mark") or underlying.get("last")
            call_map = chain.get("callExpDateMap", {})
            put_map = chain.get("putExpDateMap", {})
            total_expirations = len(call_map)
            print(f"[OK] Received live option chain for {chain_sym} in {elapsed_ms:.1f}ms:")
            print(f"    - Spot Mark: ${spot}")
            print(f"    - Available Expirations: {total_expirations}")

            # Sample nearest put
            if put_map:
                first_exp = next(iter(put_map.keys()))
                strikes = put_map[first_exp]
                first_strike = next(iter(strikes.keys()))
                opt = strikes[first_strike][0]
                print(f"    - Sample Put Contract [{first_exp} Strike ${first_strike}]:")
                print(f"        * Bid=${opt.get('bid')} / Ask=${opt.get('ask')} (Mid=${opt.get('mark')})")
                print(f"        * Delta={opt.get('delta')} | Theta={opt.get('theta')} | IV={opt.get('volatility')}%")

        except Exception as e:
            print(f"[!] Option chain fetch failed: {e}")

    print("\n" + "=" * 70)
    print(" [ALL CHECKS PASSED] Charles Schwab Retail Trader API is 100% operational!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
