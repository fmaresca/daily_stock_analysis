# -*- coding: utf-8 -*-
"""
Backend Main CLI entrypoint
===========================
Provides CLI execution:
`python -m backend.main --screen-options --symbols AAPL,MSFT`
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from src.services.options.market_data import OptionsMarketDataService
from src.pipeline.option_agent import OptionStrategyAgent


def run_screen_options(symbols: list[str], min_dte: int = 7, max_dte: int = 60, min_ivp: float = 0.0) -> dict:
    service = OptionsMarketDataService()
    agent = OptionStrategyAgent()
    results = {}

    for sym in symbols:
        sym_clean = sym.strip().upper()
        if not sym_clean:
            continue
        candidates = service.screen_covered_calls_for_symbol(
            sym_clean,
            min_dte=min_dte,
            max_dte=max_dte,
            min_ivp=min_ivp,
        )
        scored = agent.synthesize_candidates(sym_clean, candidates)
        results[sym_clean] = [c.to_dict() for c in scored]

    return {
        "status": "success",
        "symbols": [s.strip().upper() for s in symbols if s.strip()],
        "data": results,
    }


def main():
    parser = argparse.ArgumentParser(description="DSA Options Income Engine CLI")
    parser.add_argument("--screen-options", action="store_true", help="Screen covered call candidates")
    parser.add_argument("--symbols", type=str, default="AAPL,MSFT", help="Comma-separated stock symbols")
    parser.add_argument("--min-dte", type=int, default=7, help="Minimum DTE")
    parser.add_argument("--max-dte", type=int, default=60, help="Maximum DTE")
    parser.add_argument("--min-ivp", type=float, default=0.0, help="Minimum IV percentile")

    args = parser.parse_args()

    if args.screen_options:
        syms = [s.strip() for s in args.symbols.split(",") if s.strip()]
        res = run_screen_options(syms, min_dte=args.min_dte, max_dte=args.max_dte, min_ivp=args.min_ivp)
        print(json.dumps(res, indent=2))
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
