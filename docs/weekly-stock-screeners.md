# Weekly Stock Screeners & Multi-Source Ingestion Engine

## Overview

The **Weekly Stock Screeners** module provides an automated, multi-source ingestion pipeline and interactive dashboard for screening high-conviction directional equities with active weekly options liquidity.

Primary Target URL:
`https://www.barchart.com/stocks/signals/direction-strength?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc`

## Key Capabilities

1. **Automated Headless Agent (`src/screener_agents/`)**:
   - Uses Playwright headless Chromium with anti-detection headers to bypass AWS WAF challenges.
   - Extracts complete quote and signal data (e.g., 53+ equities from Barchart view 190898).
   - Generates standardized CSV files (`data/screeners/barchart_weekly_direction_strength.csv`) and structured JSON datasets (`data/weekly_screeners.json`).
   - Automatically synchronizes with the web frontend (`web/public/data/weekly_screeners.json`).

2. **Multi-Source Extensibility**:
   - Implements `BaseScreenerAgent` and `ScreenerRegistry` architecture.
   - Pre-wired support for **MarketChameleon.com** (Implied Volatility Rank, Unusual Volume, and Trade Ideas).
   - Pluggable interface ready to ingest future URLs, credentials, or custom export formats upon instruction.

3. **Web UI Section ("Weekly Stock Screeners")**:
   - Accessible from both the Equities and Options navigation menus, as well as the Ctrl+K Command Palette.
   - Real-time KPI summary (Total universe candidates, 100% direction strength count, weekly options percentage, bullish bias).
   - In-browser CSV Upload: Drag-and-drop or upload any Barchart or MarketChameleon CSV directly.
   - CSV & Excel Export: Instantly download screened candidates with all technical metrics.
   - 1-Click navigation to Interactive Candlestick Charts, 5-Part Options Safety Audit, and Schwab Broker Staging.

## CLI Usage

### Fetch live data from Barchart
```bash
python scripts/run_screener_agent.py --source barchart
```

### Import an existing CSV file
```bash
python scripts/run_screener_agent.py --import-csv path/to/screener.csv --source barchart
```

### Run Unit Tests
```bash
python -m unittest tests/test_screener_agent.py
```
