# Weekly US Economic Indicators & Macro Catalyst Radar

## 1. Executive Overview

The **Weekly US Economic Indicators & Macro Catalyst Radar** provides real-time macroeconomic event tracking, sector transmission analysis, and tactical options defense guidance directly inside DeltaHarvest.

Macroeconomic data releases (such as CPI, FOMC, and Non-Farm Payrolls) cause violent sector re-pricings and options Implied Volatility (IV) expansion. By deterministically mapping each economic indicator to vulnerable market sectors and proxy ETFs/equities, traders can adjust their cash-secured put (CSP) and covered call (CC) strike distances, avoid binary event risk, and harvest IV crush post-announcement.

---

## 2. Data Source Architecture

| Parameter | Specifications |
| :--- | :--- |
| **Tier 1 (Primary Feed)** | Forex Factory Public JSON Feed (`https://nfs.faireconomy.media/ff_calendar_thisweek.json`) |
| **Tier 2 (Live Backup Feed)** | Nasdaq Live Economic Calendar Radar (`https://api.nasdaq.com/api/calendar/economicevents`) |
| **Tier 3 (Baseline Schedule)** | Curated High-Impact Weekly US Macroeconomic Schedule |
| **Authentication** | Zero API keys or authentication required (100% Free) |
| **Cadence** | Real-time weekly releases, refreshed every 15–30 minutes, or instantly on manual refresh |
| **Timezone** | All releases normalized to US Eastern Time (ET) |
| **Filtering** | Filtered strictly for US Dollar (`USD`) releases |
| **Cache-Bypass Refresh** | Manual "Refresh Feed" injects dynamic timestamp (`?t=...`) to bypass edge & memory caches |
| **Offline Resilience** | Multi-tier failover ensures 100% uptime with clear UI badges (`🟢 Forex Factory`, `🏛️ Nasdaq Live`, `🛡️ Curated Schedule`, `⚠️ Baseline Offline`) |

---

## 3. Sector-to-Indicator Transmission Matrix

| Economic Indicator | Impact Tier | Directly Impacted Sectors | Key Proxy ETFs & Equities | Core Transmission Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **CPI / Core CPI / PCE Deflator** | **High** | Technology, Real Estate, Utilities, Financials | `QQQ`, `XLK`, `VNQ`, `XLU`, `XLF`, `TLT` | Discount rate shifts directly compress high-duration tech valuations, dividend cap rates, and bank margins. |
| **FOMC Rate Decision & Presser** | **High** | Broad Market, Regional Banks, Real Estate, Gold | `SPY`, `QQQ`, `KRE`, `IWM`, `VNQ`, `GLD` | Sets benchmark cost of capital, loan demand, and small-cap borrowing rates. |
| **Non-Farm Payrolls (NFP) & Unemployment** | **High** | Consumer Discretionary, Industrials, Small Caps | `XLY`, `XLI`, `XLF`, `IWM` | Labor tightness signals wage inflation pressure and aggregate consumer demand. |
| **Retail Sales m/m** | **High** | Consumer Discretionary, Retail, Transport | `XLY`, `XRT`, `IYT`, `AMZN`, `WMT` | Primary metric for consumer spending resilience and corporate top-line volume. |
| **ISM Manufacturing / Services PMI** | **Moderate** | Industrials, Materials, Energy, Tech Supply | `XLI`, `XLB`, `SOXX` | Cyclical expansion (>50) vs contraction (<50) bellwether. |
| **Initial Jobless Claims (Weekly)** | **Moderate** | Broad Equities, High-Beta Equities | `SPY`, `IWM` | High-frequency weekly labor deceleration indicator (every Thursday at 8:30 AM ET). |
| **EIA Crude Oil Inventories** | **Moderate** | Energy, Airlines, Transportation | `XLE`, `XOP`, `JETS`, `IYT` | Commercial inventory shocks swing input fuel costs and airline refining margins. |
| **Housing Starts / Home Sales** | **Low / Mod** | Homebuilders, Building Products, Real Estate | `ITB`, `XHB`, `VNQ`, `HD`, `LOW` | Mortgage rate sensitivity directly swings order absorption and cancel rates. |

---

## 4. Multi-Tier Dual-Runtime Architecture

```
                       ┌───────────────────────────────┐
                       │   EconomicCalendarView.tsx    │
                       │           (Frontend)          │
                       └───────────────┬───────────────┘
                                       │
              ┌────────────────────────┴───────────────────────┐
              ▼                                                ▼
   [Production Environment]                         [Local Development]
 Cloudflare Pages Edge Function                    FastAPI Local Backend
/functions/api/economic-calendar.js         GET /api/v1/options/economic-calendar
              │                                                │
              ├─────────────► Tier 1: Forex Factory Live ──────┤
              │               (ff_calendar_thisweek.json)      │
              │                                                │
              ├─────────────► Tier 2: Nasdaq Live Radar ───────┤
              │               (api.nasdaq.com)                 │
              │                                                │
              └─────────────► Tier 3: Curated Baseline ────────┘
```

- **Cloudflare Edge Function (`functions/api/economic-calendar.js`)**: Executes in serverless edge V8 isolates with zero server cold starts, sequential Tier 1 -> Tier 2 -> Tier 3 failover, and dynamic cache-control headers.
- **FastAPI Endpoint (`api/v1/endpoints/options.py`)**: Local endpoint with sequential multi-tier failover and `refresh`/`t` parameter cache-bypassing support.
- **Evident Feed & Fallback Badges**: Real-time badges indicate exactly which feed is providing data (`🟢 Forex Factory Live Feed`, `🏛️ Nasdaq Live Radar Feed`, `🛡️ High-Impact Curated Schedule`, or `⚠️ Baseline Offline Schedule`), along with live synchronization timestamps.

---

## 5. AI Macro Synthesis Layer ($0 Cost Gemini Pro Bridge)

1. Click **"AI Macro Catalyst Outlook ($0 Cost)"** in the Economic Calendar header.
2. Click **"Copy Macro Prompt for Gemini Pro"** to copy the current week's schedule and institutional prompt to clipboard.
3. Open `gemini.google.com` (under your personal subscription with Thinking Mode enabled) and paste.
4. Click **"Import Model Output JSON"** and paste the result to instantly view:
   - Executive macroeconomic regime overview.
   - High-impact catalyst schedule with expected volatility ratings.
   - Actionable tactical options defense rules (delta tightening, timing post-event IV crush harvest).

---

## 6. Verification Suite

### Backend Unit Tests
```bash
python -m unittest tests/test_economic_calendar_api.py
```
Validates:
- Successful upstream calendar parsing, USD filtering, and Eastern Time conversion.
- Sector and ticker enrichment mapping.
- Automatic fallback baseline generation with `notice` and `fallback: True`.
- In-memory 30-minute caching mechanism.

### Frontend Build
```bash
cd web
npm run build
```
Validates TypeScript types and Vite production bundling.
