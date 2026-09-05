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

3. **CBOE Weeklys Directory & Expiration Cadence Validation**:
   - Integrates the official CBOE Available Weeklys Directory (`https://www.cboe.com/available_weeklys/get_csv_download/`).
   - Categorizes every candidate into an explicit expiration cycle:
     - `Daily / Multi-Weekly`: SPY, QQQ, AAPL, DELL, etc.
     - `Weekly`: Verified CBOE weekly registered options chains.
     - `Monthly Only`: Standard 3rd-Friday options only.
   - In CLI and Web UI, toggle `--cboe-only` / `Strict CBOE Weeklys` to immediately filter out monthly-only contracts.

4. **MarketChameleon Prescreen Builder & Custom Presets**:
   - Reverse-engineered catalog of all 103 native filter dropdown categories from MarketChameleon.
   - Interactive Modal (`MarketChameleonPrescreenModal.tsx`) providing:
     - Preset selector with built-in presets (`Default Momentum & Volatility (Strict CBOE Weeklys)`, `High IV Growth (Any Options)`, `Mega-Cap Momentum`).
     - Category dropdown builders to prescreen any native MarketChameleon criteria.
     - LocalStorage persistence for saving, overwriting, and deleting custom named presets.
     - 1-click "Save & Run Screener" applying criteria to the view.

5. **Barchart Custom Watchlist Agent (`barchart_custom`) & View 190898 Output**:
   - Ingest stock symbols via single ticker quick-add or bulk ingestion (comma, space, newline separated, or `.txt` / `.csv` file upload).
   - Queries Barchart's core API (`/proxies/core-api/v1/quotes/get?viewName=190898`) in headless Playwright sessions with fallback to the local 13-indicator technical consensus engine (`barchart_opinion_service.py`).
   - Produces output identical to `https://www.barchart.com/my/watchlist?viewName=190898`:
     - Symbol & Name
     - Last Price, Net Change, % Change
     - Barchart Opinion & Opinion Score %
     - Historical Stability: Stability (Previous), Stability (Last Week), Stability (Last Month)
     - Weekly Options & Options Cadence
     - Signal Strength & Signal Direction
     - Recommended Strategy
   - Built-in tab-delimited text (`generate_copy_paste_text`) and standardized CSV export.
   - Web UI tab "Barchart Watchlist (View 190898)" with dedicated Ingestion & Analysis Console, quick preset chips (`Mag 7`, `Semis`, `CBOE High Vol`, `AI & Cloud`), single symbol quick analyze, and bulk symbol ingestion.

6. **Web UI Section ("Weekly Stock Screeners")**:
   - Accessible from both the Equities and Options navigation menus, as well as the Ctrl+K Command Palette.
   - Real-time KPI summary (Total universe candidates, 100% direction strength count, weekly options percentage, bullish bias).
   - In-browser CSV Upload: Drag-and-drop or upload any Barchart or MarketChameleon CSV directly.
   - CSV Export & 1-Click Clipboard Copy: Instantly copy or download screened candidates with all respective column headings (including CBOE Weeklys and Options Cadence).
   - 1-Click navigation to Interactive Candlestick Charts, 5-Part Options Safety Audit, and Schwab Broker Staging.

## CLI Usage

### Fetch live data from Barchart (Default Direction Strength 190898)
```bash
python scripts/run_screener_agent.py --source barchart
```

### Fetch live data from MarketChameleon (All Optionable Candidates)
```bash
python scripts/run_screener_agent.py --source marketchameleon
```

### Fetch live data from MarketChameleon (Strict CBOE Weeklys Only)
```bash
python scripts/run_screener_agent.py --source marketchameleon --cboe-only
```

### Run with Custom Category Filter Overrides (JSON)
```bash
python scripts/run_screener_agent.py --source marketchameleon --cboe-only --filters-json '{"c45": "60.0 To 70.0"}'
```

### Run Barchart Custom Watchlist Analysis (View 190898) with Specific Symbols
```bash
python scripts/run_screener_agent.py --source barchart_custom --symbols "AAPL,NVDA,TSLA,DELL,NOW,MSFT,AMD"
```

### Run Barchart Custom Watchlist Analysis from a File of Symbols
```bash
python scripts/run_screener_agent.py --source barchart_custom --symbols-file path/to/symbols.txt
```

### Import an existing CSV file
```bash
python scripts/run_screener_agent.py --import-csv path/to/screener.csv --source marketchameleon
```

### Run Unit Tests
```bash
python -m unittest tests/test_screener_agent.py
```

