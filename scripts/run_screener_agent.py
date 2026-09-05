#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Run Screener Agent CLI
Automates downloading screener records from Barchart, MarketChameleon, or custom sources,
exports the raw CSV file, and updates the weekly screener dataset for DeltaHarvest web.

Usage:
    python scripts/run_screener_agent.py --source barchart
    python scripts/run_screener_agent.py --import-csv path/to/screener.csv --source barchart
"""

import argparse
import logging
import os
import shutil
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.screener_agents.registry import ScreenerRegistry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("run_screener_agent")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Screener Agent to fetch and sync Weekly Stock Screeners.")
    parser.add_argument(
        "--source",
        type=str,
        default="barchart",
        help="Screener source ID: 'barchart' or 'marketchameleon' (default: barchart)",
    )
    parser.add_argument(
        "--url",
        type=str,
        default=None,
        help="Custom target URL to scrape",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Maximum records to fetch (default: 100)",
    )
    parser.add_argument(
        "--import-csv",
        type=str,
        default=None,
        help="Import an existing CSV file instead of fetching live",
    )
    parser.add_argument(
        "--export-csv",
        type=str,
        default=None,
        help="Destination path for CSV export (defaults to data/screeners/<source>_weekly_direction_strength.csv)",
    )
    parser.add_argument(
        "--export-json",
        type=str,
        default="data/weekly_screeners.json",
        help="Destination path for web JSON payload",
    )
    parser.add_argument(
        "--cboe-only",
        action="store_true",
        default=False,
        help="Strictly filter to stocks registered in CBOE Weeklys directory or daily/multi-weekly cycles",
    )
    parser.add_argument(
        "--filters-json",
        type=str,
        default=None,
        help="Custom filter overrides in JSON format or path to JSON file (e.g. '{\"c8\":\"Over 20000000000\"}')",
    )

    args = parser.parse_args()

    custom_filters = None
    if args.filters_json:
        try:
            if os.path.exists(args.filters_json):
                with open(args.filters_json, "r", encoding="utf-8") as f:
                    custom_filters = json.load(f)
            else:
                custom_filters = json.loads(args.filters_json)
            logger.info(f"Loaded {len(custom_filters)} custom filter overrides.")
        except Exception as e:
            logger.error(f"Failed to parse --filters-json: {e}")
            return 1

    agent = ScreenerRegistry.get_agent(args.source, target_url=args.url)
    if custom_filters and hasattr(agent, "filters"):
        agent.filters.update(custom_filters)

    logger.info(f"Initialized agent: {agent.display_name}")

    # Determine paths
    data_dir = PROJECT_ROOT / "data"
    screeners_dir = data_dir / "screeners"
    screeners_dir.mkdir(parents=True, exist_ok=True)

    default_csv_name = (
        f"{args.source}_momentum_screener.csv"
        if args.source == "marketchameleon"
        else f"{args.source}_weekly_direction_strength.csv"
    )
    csv_path = Path(args.export_csv) if args.export_csv else screeners_dir / default_csv_name
    
    if args.export_json == "data/weekly_screeners.json" and args.source != "barchart":
        json_path = data_dir / f"weekly_screeners_{args.source}.json"
    else:
        json_path = Path(args.export_json)

    if args.import_csv:
        logger.info(f"Importing records from CSV: {args.import_csv}")
        records = agent.parse_csv(args.import_csv)
    else:
        logger.info(f"Fetching live records from {agent.target_url} (limit={args.limit}, cboe_only={args.cboe_only})...")
        if args.source == "marketchameleon":
            records = agent.fetch_records(limit=args.limit, cboe_only=args.cboe_only)
        else:
            records = agent.fetch_records(limit=args.limit)

    if args.cboe_only and args.source != "marketchameleon":
        records = [r for r in records if r.has_weekly_options]

    logger.info(f"Retrieved {len(records)} standardized records.")

    if not records:
        logger.warning("No records were retrieved or parsed!")
        return 1

    # 1. Export CSV
    saved_csv = agent.export_csv(records, csv_path)
    logger.info(f"✓ Exported CSV to: {saved_csv}")

    # Also export copy-paste formatted TSV if supported
    if hasattr(agent, "generate_copy_paste_text"):
        tsv_path = screeners_dir / f"{args.source}_copy_paste.tsv"
        copy_paste_txt = agent.generate_copy_paste_text(records)
        with open(tsv_path, "w", encoding="utf-8") as f:
            f.write(copy_paste_txt)
        logger.info(f"✓ Exported Copy-Paste TSV with headings to: {tsv_path}")

    # 2. Save JSON for web
    saved_json = agent.save_dataset_json(records, json_path)
    logger.info(f"✓ Saved web dataset JSON to: {saved_json}")

    # 3. Sync to web/public/data/ for frontend use
    web_public_data = PROJECT_ROOT / "web" / "public" / "data"
    web_public_data.mkdir(parents=True, exist_ok=True)
    
    target_web_json = web_public_data / f"weekly_screeners_{args.source}.json"
    shutil.copyfile(json_path, target_web_json)
    logger.info(f"✓ Synced to web public directory: {target_web_json}")

    if args.source == "barchart":
        shutil.copyfile(json_path, web_public_data / "weekly_screeners.json")

    # Also copy the CSV to web/public/data so web users can download it directly
    target_web_csv = web_public_data / f"weekly_screeners_{args.source}.csv"
    shutil.copyfile(csv_path, target_web_csv)
    logger.info(f"✓ Synced CSV to web public directory: {target_web_csv}")

    if args.source == "barchart":
        shutil.copyfile(csv_path, web_public_data / "weekly_screeners.csv")

    logger.info(f"Successfully processed {len(records)} stocks for Weekly Stock Screeners ({agent.display_name})!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
