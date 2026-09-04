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

    args = parser.parse_args()

    agent = ScreenerRegistry.get_agent(args.source, target_url=args.url)
    logger.info(f"Initialized agent: {agent.display_name}")

    # Determine paths
    data_dir = PROJECT_ROOT / "data"
    screeners_dir = data_dir / "screeners"
    screeners_dir.mkdir(parents=True, exist_ok=True)

    csv_path = Path(args.export_csv) if args.export_csv else screeners_dir / f"{args.source}_weekly_direction_strength.csv"
    json_path = Path(args.export_json)

    if args.import_csv:
        logger.info(f"Importing records from CSV: {args.import_csv}")
        records = agent.parse_csv(args.import_csv)
    else:
        logger.info(f"Fetching live records from {agent.target_url} (limit={args.limit})...")
        records = agent.fetch_records(limit=args.limit)

    logger.info(f"Retrieved {len(records)} standardized records.")

    if not records:
        logger.warning("No records were retrieved or parsed!")
        return 1

    # 1. Export CSV
    saved_csv = agent.export_csv(records, csv_path)
    logger.info(f"✓ Exported CSV to: {saved_csv}")

    # 2. Save JSON for web
    saved_json = agent.save_dataset_json(records, json_path)
    logger.info(f"✓ Saved web dataset JSON to: {saved_json}")

    # 3. Sync to web/public/data/weekly_screeners.json for frontend immediate use
    web_public_data = PROJECT_ROOT / "web" / "public" / "data"
    web_public_data.mkdir(parents=True, exist_ok=True)
    target_web_json = web_public_data / "weekly_screeners.json"
    shutil.copyfile(json_path, target_web_json)
    logger.info(f"✓ Synced to web public directory: {target_web_json}")

    # Also copy the CSV to web/public/data so web users can download it directly
    target_web_csv = web_public_data / "weekly_screeners.csv"
    shutil.copyfile(csv_path, target_web_csv)
    logger.info(f"✓ Synced CSV to web public directory: {target_web_csv}")

    logger.info(f"Successfully processed {len(records)} stocks for Weekly Stock Screeners!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
