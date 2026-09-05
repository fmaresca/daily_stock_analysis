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

2. **Multi-Source Extensibility & MarketChameleon Screener Agent**:
   - Implements `BaseScreenerAgent` and `ScreenerRegistry` architecture.
   - Fully automated **MarketChameleon Screener Agent** (`src/screener_agents/marketchameleon_agent.py`) targeting `https://marketchameleon.com/Screeners/Stocks`.
   - Preselects the required criteria:
     - **Stock Idea**: Momentum Stocks
     - **Market Cap**: Over $1 billion
     - **Options Listed**: Has Options
     - **Technical 14-day RSI**: 50 to 70
     - **Country**: USA
     - **Volatility**: 1-Yr Above 30, 20-day Above 30, 1-day Above 30, IV30 Above 30, IV % Rank Any
     - **MA Technical**: Any Bullish (Uptrend, Bullish Crossover, Fast Bullish Crossover)
   - Multi-page pagination support automatically fetching across all pages.
   - Built-in `generate_copy_paste_text(records)` function producing tab-delimited text with respective column headings ready for 1-click clipboard copy-pasting into spreadsheets and documents.
   - Web UI integrates "Copy Results (TSV)" button with immediate visual toast feedback.

3. **Web UI Section ("Weekly Stock Screeners")**:
   - Accessible from both the Equities and Options navigation menus, as well as the Ctrl+K Command Palette.
   - Real-time KPI summary (Total universe candidates, 100% direction strength count, weekly options percentage, bullish bias).
   - In-browser CSV Upload: Drag-and-drop or upload any Barchart or MarketChameleon CSV directly.
   - CSV Export & 1-Click Clipboard Copy: Instantly copy or download screened candidates with all respective column headings.
   - 1-Click navigation to Interactive Candlestick Charts, 5-Part Options Safety Audit, and Schwab Broker Staging.

## CLI Usage

### Fetch live data from Barchart
```bash
python scripts/run_screener_agent.py --source barchart
```

### Fetch live data from MarketChameleon (Preselected Momentum & Volatility Filters)
```bash
python scripts/run_screener_agent.py --source marketchameleon
```

### Import an existing CSV file
```bash
python scripts/run_screener_agent.py --import-csv path/to/screener.csv --source marketchameleon
```

### Run Unit Tests
```bash
python -m unittest tests/test_screener_agent.py
```

