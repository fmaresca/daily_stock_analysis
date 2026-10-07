# Information Architecture (IA) Sitemap & Deduplication Specification

**DeltaHarvest Platform — Round-8 Menu & Navigation Reorganization**  
**Document Status:** Complete Proposal for Frank's Approval (Prompt 1)  
**Author:** Antigravity (AI Assistant)  
**Target Release:** v3.4 / Round-8  
**Scope:** Architecture & deduplication map for all app destinations; zero backend or auth modifications.

---

## 1. Executive Summary & Architecture Goals

DeltaHarvest currently suffers from six primary information architecture (IA) defects that create cognitive overload for new users:
1. **Duplicate entry points for the same view** (e.g. "My Workspace" appears twice in the sidebar; "Order Staging" appears in three places; "Tax Alpha" and "Roll Assistant" appear in both the sidebar and Strategy Labs tabs).
2. **Inconsistent label sets** (the 7 Weekend Ritual steps have divergent names between the sidebar and the top tab strip).
3. **The "Three Screeners" disorientation** (new users cannot distinguish between the Equities Screener, the Income Screener, and Step 5's Cascading Screener).
4. **Jargon-first labels** that assume deep Wall Street derivatives expertise at the top menu level.
5. **State drift upon browser reload** (URL and menu state are desynchronized).
6. **No first-run orientation** to guide initial usage.

This document establishes a **single source of truth** for all reachable destinations in DeltaHarvest. Each destination is assigned **exactly one canonical menu home** across six user-centric task groups, supported by an explicit deduplication map and a clean URL scheme.

---

## 2. Six Canonical Navigation Groups

To align with standard user mental models, all app capabilities are organized into six top-level task groups:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DELTAHARVEST PLATFORM                           │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ 1. Weekend      │ 2. My Money      │ 3. Research     │ 4. Tools        │
│    Ritual (7)   │    (Portfolio)   │    (Universe)   │    (Analytics)  │
├─────────────────┴──────────────────┼─────────────────┴─────────────────┤
│ 5. Learn (Handbook & FAQ)          │ 6. Administration (Role-Gated)    │
└────────────────────────────────────┴───────────────────────────────────┘
```

1. **Weekend Ritual (The 7-Step Workflow)**:
   - **Position:** First in the sidebar, always expanded, numbered 1–7.
   - **Purpose:** The core weekend portfolio maintenance ritual (Schwab import, cash calculation, covered calls, macro check, AI shortlist, executive report, order staging).
   - **Constraint:** Preserved exactly as-is in sequence, order, and functionality.

2. **My Money**:
   - **Purpose:** Personal capital, live tenant workspace, custom watchlists, staged orders, and reports.
   - **Items:** My Workspace, Investment Portfolio (*Admin*), Watchlists, Order Staging, Reports & Exports.

3. **Research**:
   - **Purpose:** Market discovery, equity screening, charts, economic calendars, and company fundamentals.
   - **Items:** Screener Hub (with 3-way chooser), Stock Screeners, Options Income Screener, Interactive Candlestick Charts, Market Calendars, Fundamental Health & SEC EDGAR, Trend & Support Radar, Volatility & Risk Profiler, Sector Overview, Equity Analysis Card.

4. **Tools**:
   - **Purpose:** Focused quantitative calculators, stress testing, and derivative strategy labs.
   - **Items:** Trade Quality Simulator (100-pt), DCF & DuPont Valuation Terminal, Tax Optimizer (IRC §1256), Defensive Roll Assistant, Portfolio Margin & Stress Simulator, Multi-Leg Spreads & Iron Condors, Option Chain Matrix & Volatility Smile, Poor Man's Covered Call (PMCC), 25Δ Skew & Term Structure, Systematic Backtester, Options Income AI Hub.

5. **Learn**:
   - **Purpose:** Plain-language guides, methodology, investor FAQs, and regulatory compliance.
   - **Items:** Strategy Handbook, Quantitative Methodology, Investor FAQ, Regulatory & Risk Disclaimers.

6. **Administration (Role-Gated & Settings)**:
   - **Purpose:** Multi-tenant account provisioning, user security, broker API connectivity, and system diagnostics.
   - **Items:** Admin Console (*Admin*), Change Password, Broker APIs & Webhooks (Tradier/Schwab/Alerts), API Self-Test Diagnostics.

---

## 3. Comprehensive Destination Inventory & Canonical Homes

Below is the complete inventory of all 48 reachable destinations across the application, categorized by their underlying system identifiers (`OptionsTabType`, `EquitiesTabType`, `MenuTreeType`, and modal triggers).

### 3.1 Group 1: Weekend Ritual (7 Steps)

| Step # | Underlying ID | Canonical Menu Group | Proposed Canonical Label | Canonical URL | Pre-Change Labels |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `SCHWAB_POSITIONS_UPLOAD` | **Weekend Ritual** | 1. Upload Positions | `/ritual` | Sidebar: "1. Upload Positions"<br>Tab: "1. Upload Schwab Positions" |
| **2** | `WEEKLY_CASH_LEDGER` | **Weekend Ritual** | 2. Cash & Tax Ledger | `/ritual/cash` | Sidebar: "2. Cash & Tax Ledger"<br>Tab: "2. Cash & YTD Tax" |
| **3** | `HOLDINGS_COVERED_CALLS` | **Weekend Ritual** | 3. Holdings & Covered Calls | `/ritual/holdings` | Sidebar: "3. Holdings Calls"<br>Tab: "3. Holdings & 20Δ Calls" |
| **4** | `ECONOMIC_CALENDAR` (Workflow) | **Weekend Ritual** | 4. Economic Calendar | `/ritual/calendar` | Sidebar: "4. Economic Calendar"<br>Tab: "4. Macro & Catalysts" |
| **5** | `CASCADING_SCREENER` | **Weekend Ritual** | 5. Weekly Shortlist Screener | `/ritual/screener` | Sidebar: "5. Cascading Screener"<br>Tab: "5. Tri-Screen & Gemini AI" |
| **6** | `WEEKLY_EXECUTIVE_REPORT` | **Weekend Ritual** | 6. Executive Report | `/ritual/report` | Sidebar: "6. Executive Report"<br>Tab: "6. Master Report" |
| **7** | `BROKER_STAGING` (Workflow) | **Weekend Ritual** | 7. Order Staging | `/ritual/staging` | Sidebar: "7. Order Staging"<br>Tab: "7. Broker Staging" |

---

### 3.2 Group 2: My Money

| Destination | Underlying ID / Type | Canonical Menu Group | Canonical Label | Canonical URL | Access Rule | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **My Workspace** | `DASHBOARD` | **My Money** | My Workspace | `/money/workspace` | All Users | Private portfolio, trade log, and personal performance. |
| **Investment Portfolio** | `EXECUTIVE_DIGEST` | **My Money** | Investment Portfolio | `/money/portfolio` | Admin Only | Master capital allocation & asset breakdown (`KEEP — owner-chosen`). |
| **Watchlists** | `WatchlistManagerModal` | **My Money** | Watchlists | `/money/watchlists` | All Users | Custom symbol groups, ticker imports, and monitoring. |
| **Order Staging** | `BROKER_STAGING` (Workbench) | **My Money** | Order Staging | `/money/staging` | All Users | Single canonical workbench for reviewing staged orders before execution. |
| **Reports & Exports** | `ReportQueryModal` | **My Money** | Reports & Exports | `/money/reports` | All Users | SQL query reports, transaction audit logs, and PDF/CSV exports. |

---

### 3.3 Group 3: Research

| Destination | Underlying ID / Type | Canonical Menu Group | Canonical Label | Canonical URL | Subtitle / Jargon Kept | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Screener Chooser** | New Orientation Component | **Research** | Screener Hub | `/research/screeners` | 3-Way Guided Chooser | Helps new users select the right screener for their task. |
| **Stock Screener** | `TECHNICAL_SCREENER` | **Research** | Stock Screener | `/research/stocks` | Technical & Barchart 1% | Scan US equities universe by price, RSI, SMA, and trend. |
| **Weekly Stock Picks** | `WEEKLY_STOCK_SCREENERS` | **Research** | Weekly Stock Screeners | `/research/weekly-stocks` | Barchart Momentum | Filter high-conviction weekly momentum and buy-rated stocks. |
| **Options Income Screener** | `INCOME_SCREENER` | **Research** | Find Income Trades | `/research/income` | CSPs & Covered Calls | Scan conservative options income opportunities outside Bollinger Bands. |
| **Interactive Charts** | `INTERACTIVE_CHARTS` | **Research** | Interactive Charts | `/research/charts` | Candlesticks & 20-SMA | Multi-timeframe technical charts with indicator overlays. |
| **Market Calendars** | `ECONOMIC_CALENDAR` (Equities) | **Research** | Economic Calendar | `/research/calendar` | High-Impact USD Macro | High-impact macroeconomic indicator dates (CPI, FOMC, NFP). |
| **Earnings Calendar** | `EARNINGS_CALENDAR` | **Research** | Earnings Calendar | `/research/earnings` | 7–14 Day Binary Events | Track quarterly earnings announcement dates and avoid shock risk. |
| **Fundamental Health** | `FUNDAMENTAL_HEALTH` | **Research** | Company Health & SEC Filings | `/research/fundamentals` | SEC EDGAR & Altman Z | Financial health metrics, debt ratios, P/E, and official filings. |
| **Trend & Support Map** | `TREND_SUPPORT` | **Research** | Trend & Support Map | `/research/trend` | 20D SMA & Support Bands | Assets organized by proximity to technical support levels. |
| **Volatility Profiler** | `VOLATILITY_RISK` | **Research** | Volatility & Risk Profiler | `/research/volatility` | IV Rank ≥ 40% & HV30 | Stocks ranked by implied volatility rank and historical volatility. |
| **Sector Overview** | `SECTOR_OVERVIEW` | **Research** | Sector Overview | `/research/sectors` | Industry & Asset Groups | Market capitalization and performance across 11 primary sectors. |
| **Equity Analysis Card** | `TickerAuditModal` / Trigger | **Research** | Equity Analysis Card | `/research/equity-card` | Ticker Audit Modal | Comprehensive 4-tab card: technicals, options, news, DuPont DCF. |

---

### 3.4 Group 4: Tools (Analytics & Strategy Labs)

| Destination | Underlying ID / Type | Canonical Menu Group | Canonical Label | Canonical URL | Subtitle / Jargon Kept | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Trade Quality Simulator** | `OptionsTradeQualityModal` | **Tools** | Trade Simulator | `/tools/simulator` | 100-Point Scoring Model | Multi-factor options simulator testing delta, IV, and payoff curves. |
| **DCF & DuPont Valuation** | `FundamentalValuationModal` | **Tools** | Valuation Terminal | `/tools/valuation` | DCF & DuPont ROE v3.4 | Discounted Cash Flow intrinsic value and 5-stage DuPont ROE breakdown. |
| **Tax Optimizer** | `TAX_ALPHA_OPTIMIZER` | **Tools** | Tax Optimizer | `/tools/tax` | Section 1256 & 60/40 Rule | Tax-advantaged index options (§1256) and wash-sale harvesting. |
| **Defensive Roll Assistant** | `DEFENSIVE_ROLL_ASSISTANT` | **Tools** | Roll Assistant | `/tools/roll` | Defensive Rolling & Repair | Algorithmic guidance for rolling threatened contracts for net credits. |
| **Margin Stress Simulator** | `PORTFOLIO_MARGIN_SIM` | **Tools** | Margin Stress Simulator | `/tools/margin` | FINRA 4210 TIMS ±15% | Portfolio margin shock model simulating ±15% broad market moves. |
| **Systematic Backtester** | `BACKTEST_MARGIN` | **Tools** | Strategy Backtester | `/tools/backtest` | Historical Win-Rate Sim | Backtest 15Δ–25Δ put-selling rules against historical market data. |
| **Multi-Leg Spreads** | `MULTI_LEG_SPREADS` | **Tools** | Multi-Leg Spreads | `/tools/spreads` | Credit Spreads & Iron Condors | Scan defined-risk credit spreads, bull puts, and iron condors. |
| **Option Chain Matrix** | `OPTION_CHAIN_MATRIX` | **Tools** | Option Chain Matrix | `/tools/chain` | Volatility Smile & Greeks | Full interactive options chain with Greeks, skew, and custom staging. |
| **LEAPS & PMCC Screener** | `PMCC_SCREENER` | **Tools** | Poor Man's Covered Call | `/tools/pmcc` | PMCC / Synthetic Long | Scan LEAPS deep-in-the-money calls paired with short calls. |
| **Volatility Skew Radar** | `VOLATILITY_SKEW` | **Tools** | Volatility Skew Radar | `/tools/skew` | 25Δ Skew & Term Structure | Measure put/call implied volatility spreads across expirations. |
| **Options Income AI** | `AI_OPTIONS_INCOME` | **Tools** | Options Income AI | `/tools/ai` | Gemini Extended Thinking | Generate structured prompt payloads for deep AI investment analysis. |
| **Multi-Agent Trade Auditor** | `MULTI_AGENT_AUDIT` | **Tools** | Trade Auditor | `/tools/audit` | 4-Agent Consensus Engine | Multi-agent trade auditing combining technical, risk, and macro agents. |
| **Delta Sweet Spot Radar** | `DELTA_GREEKS` | **Tools** | Delta Sweet Spot Radar | `/tools/delta` | 0.15–0.20Δ Sweet Spot | Filter opportunities positioned outside 2 SD Bollinger Bands. |
| **Expiration Cadence** | `EXPIRATION_CADENCE` | **Tools** | Expiration Cadence | `/tools/cadence` | CBOE Weekly Registry | Filter weekly-optionable tickers (3–5 DTE) vs monthly contracts. |
| **Income Calculator** | `IncomeCalculatorModal` | **Tools** | Income Calculator | `/tools/calculator` | Cash Yield & ROC Matrix | Standalone modal/view to calculate return-on-collateral per trade. |

---

### 3.5 Group 5: Learn

| Destination | Underlying ID / Type | Canonical Menu Group | Canonical Label | Canonical URL | Subtitle / Jargon Kept | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Strategy Handbook** | `HelpHandbookModal` | **Learn** | Strategy Handbook | `/learn/handbook` | 16 Institutional Chapters | Comprehensive guide to rules, math formulas, and platform usage. |
| **Quantitative Methodology** | `METHODOLOGY` | **Learn** | Methodology | `/learn/methodology` | Black-Scholes & Cash Waterfall | Mathematical models, Black-Scholes formulas, and risk limits. |
| **Investor FAQ** | `FAQ` | **Learn** | Investor FAQ | `/learn/faq` | Plain-English Q&A | Frequently asked questions about conservative options income. |
| **Regulatory Disclaimers** | `DISCLAIMER` | **Learn** | Disclaimers | `/learn/disclaimers` | SEC / FINRA / OCC Disclosures | Regulatory risk notices, options risk disclosures, and terms. |

---

### 3.6 Group 6: Administration (Role-Gated & Settings)

| Destination | Underlying ID / Type | Canonical Menu Group | Canonical Label | Canonical URL | Access Rule | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin Console** | `ADMIN_USERS` | **Administration** | Admin Console | `/admin/users` | Admin Only | Manage tenant accounts, provision logins, and audit security. |
| **Change Password** | `SETTINGS_PASSWORD` | **Administration** | Change Password | `/settings/password` | All Users | Update private account login password. |
| **Settings & APIs** | Settings Dropdown / Panel | **Administration** | Settings & APIs | `/admin/settings` | All Users | Broker API keys, webhook URLs, and notification preferences. |
| **API Self-Test** | `ApiDiagnosticsModal` | **Administration** | API Self-Test | `/admin/diagnostics` | All Users | Automated health check verifying Tradier, Schwab, and backend feeds. |
| **Sign In / Log In** | `LOGIN` | **Administration** | Sign In | `/login` | Public / Unauth | Account authentication for admin and client tenants. |

---

## 4. Explicit Deduplication Map

Every duplicate entry point identified in the audit is resolved below according to the rule: **the canonical home keeps the destination; duplicate entry points are removed or converted into clearly marked contextual shortcuts**.

| # | Item / Concept | Duplicate Locations Found | Canonical Home Assigned | Resolution & Action Taken |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **My Workspace vs Client View Simulator** | 1. Sidebar: "Core Platform" &rarr; "My Workspace"<br>2. Sidebar: "Security & Tenants" &rarr; "Client View Simulator" (Admin) / "My Workspace" (Client) | **My Money &rarr; My Workspace** (`/money/workspace`) | **Remove the duplicate** from "Security & Tenants". A single canonical entry in "My Money" serves all users. Admin users see their actual workspace without confusing simulator aliases. |
| **2** | **Order Staging** | 1. Sidebar: "Core Platform" &rarr; "Order Staging"<br>2. Weekend Ritual: Step 7 ("7. Order Staging")<br>3. Strategy Labs: Tab strip button | **Weekend Ritual &rarr; Step 7** (`/ritual/staging`) & **My Money &rarr; Order Staging** (`/money/staging`) | **Merge into single workbench.** When clicked from My Money, it opens the workbench. Step 7 remains the canonical final step of the ritual. The duplicate Strategy Labs tab button is removed. |
| **3** | **Tax Alpha (IRC §1256)** | 1. Sidebar: "Tactical Tools" &rarr; "Tax Alpha (1256)"<br>2. Strategy Labs: Tab strip &rarr; "Section 1256 Tax Alpha" | **Tools &rarr; Tax Optimizer** (`/tools/tax`) | **Consolidate into Tools.** Remove duplicate entry from Strategy Labs top tab strip. Both entry points now resolve to the single canonical Tools destination. |
| **4** | **Defensive Roll Assistant** | 1. Sidebar: "Tactical Tools" &rarr; "Roll Assistant"<br>2. Strategy Labs: Tab strip &rarr; "Defensive Rolling & Repair" | **Tools &rarr; Roll Assistant** (`/tools/roll`) | **Consolidate into Tools.** Remove duplicate entry from Strategy Labs top tab strip. Both entry points resolve to the single canonical Tools destination. |
| **5** | **Economic Calendar** | 1. Weekend Ritual: Step 4 ("4. Economic Calendar")<br>2. Equities: Tab strip &rarr; "Economic Indicators (USD)"<br>3. Strategy Labs: Tab strip &rarr; `ECONOMIC_CALENDAR` | **Weekend Ritual &rarr; Step 4** (`/ritual/calendar`) & **Research &rarr; Economic Calendar** (`/research/calendar`) | **Deduplicate:** Step 4 remains the curated macro step of the weekend ritual. The Equities tab becomes the general Research calendar. The duplicate tab in Strategy Labs is removed. |
| **6** | **The Three Screeners** | 1. Equities: "Technical Screener" & "Weekly Stock Screeners"<br>2. Strategy Labs: "Conservative Income (CSPs & CCs)"<br>3. Weekend Ritual: Step 5 ("Cascading Screener") | **Research &rarr; Screener Hub** (`/research/screeners`) | **Add Screener Chooser.** Group all three under a clear orientation hub ("What are you trying to do?") with 3 direct cards: (a) Find stocks to watch, (b) Find options income trades, (c) Run the weekly shortlist. |
| **7** | **Equity Analysis Card** | 1. Sidebar: "Core Platform" &rarr; "Equity Analysis Card"<br>2. Command Palette: Action trigger<br>3. Table row triggers: "Audit" / ticker links | **Research &rarr; Equity Analysis Card** (`/research/equity-card`) | **Single canonical home.** In the sidebar, it lives under Research. Table row clicks open the modal pre-hydrated with that symbol. |
| **8** | **Strategy Handbook** | 1. Settings quick-menu: "Strategy Handbook"<br>2. Top header: Help button (`?`)<br>3. Command Palette: "Strategy Handbook" | **Learn &rarr; Strategy Handbook** (`/learn/handbook`) | **Single canonical home** in the Learn group. The header `?` and command palette serve as standard contextual triggers opening the same canonical modal. |

---

## 5. Canonical URL Architecture & 301-Redirect Migration Plan

To fix the known reload bug (where reloading `/equities` or sub-tabs renders under `/options`), the URL scheme is normalized into intuitive hierarchical paths. Every legacy URL automatically 301-redirects to its canonical home.

### 5.1 URL Mapping Matrix

| Legacy Path (Pre-Change) | Canonical Path (New Scheme) | Canonical Destination | HTTP Status |
| :--- | :--- | :--- | :---: |
| `/workflow`, `/routine`, `/workflow/upload`, `/workflow/step1` | `/ritual` | Step 1: Upload Positions | 301 Redirect |
| `/workflow/cash`, `/workflow/step2` | `/ritual/cash` | Step 2: Cash & Tax Ledger | 301 Redirect |
| `/workflow/holdings`, `/workflow/step3` | `/ritual/holdings` | Step 3: Holdings & Covered Calls | 301 Redirect |
| `/workflow/calendar`, `/workflow/step4` | `/ritual/calendar` | Step 4: Economic Calendar | 301 Redirect |
| `/workflow/screener`, `/workflow/step5` | `/ritual/screener` | Step 5: Weekly Shortlist Screener | 301 Redirect |
| `/workflow/report`, `/workflow/step6` | `/ritual/report` | Step 6: Executive Report | 301 Redirect |
| `/workflow/staging`, `/workflow/step7` | `/ritual/staging` | Step 7: Order Staging | 301 Redirect |
| `/dashboard`, `/workspace`, `/portfolio` | `/money/workspace` | My Workspace | 301 Redirect |
| `/staging`, `/orders`, `/options/staging` | `/money/staging` | Order Staging Workbench | 301 Redirect |
| `/equities/screener`, `/screener`, `/equities` | `/research/stocks` | Stock Screener | 301 Redirect |
| `/equities/screeners`, `/equities/weekly`, `/equities/barchart` | `/research/weekly-stocks` | Weekly Stock Screeners | 301 Redirect |
| `/options`, `/income`, `/options/income`, `/options/screener` | `/research/income` | Options Income Screener | 301 Redirect |
| `/charts`, `/chart`, `/equities/charts`, `/equities/chart` | `/research/charts` | Interactive Charts | 301 Redirect |
| `/calendar`, `/macro`, `/equities/calendar` | `/research/calendar` | Economic Calendar | 301 Redirect |
| `/equities/earnings` | `/research/earnings` | Earnings Calendar | 301 Redirect |
| `/solvency`, `/fundamentals`, `/equities/solvency`, `/equities/fundamentals` | `/research/fundamentals` | Company Health & SEC Filings | 301 Redirect |
| `/equities/trend`, `/equities/support` | `/research/trend` | Trend & Support Map | 301 Redirect |
| `/equities/volatility`, `/equities/risk` | `/research/volatility` | Volatility & Risk Profiler | 301 Redirect |
| `/equities/sectors`, `/equities/sector` | `/research/sectors` | Sector Overview | 301 Redirect |
| `/simulator` | `/tools/simulator` | Trade Quality Simulator | 301 Redirect |
| `/valuation`, `/dcf` | `/tools/valuation` | DCF & DuPont Valuation | 301 Redirect |
| `/tax`, `/options/tax` | `/tools/tax` | Tax Optimizer | 301 Redirect |
| `/roll`, `/options/roll` | `/tools/roll` | Defensive Roll Assistant | 301 Redirect |
| `/margin`, `/options/margin` | `/tools/margin` | Margin Stress Simulator | 301 Redirect |
| `/spreads`, `/options/spreads` | `/tools/spreads` | Multi-Leg Spreads | 301 Redirect |
| `/options/chain`, `/chain` | `/tools/chain` | Option Chain Matrix | 301 Redirect |
| `/options/pmcc`, `/pmcc` | `/tools/pmcc` | Poor Man's Covered Call | 301 Redirect |
| `/options/skew`, `/skew` | `/tools/skew` | Volatility Skew Radar | 301 Redirect |
| `/options/ai`, `/ai-options` | `/tools/ai` | Options Income AI | 301 Redirect |
| `/options/backtest`, `/backtest` | `/tools/backtest` | Systematic Backtester | 301 Redirect |
| `/methodology`, `/rules` | `/learn/methodology` | Quantitative Methodology | 301 Redirect |
| `/faq`, `/questions` | `/learn/faq` | Investor FAQ | 301 Redirect |
| `/disclaimer`, `/legal` | `/learn/disclaimers` | Regulatory Disclaimers | 301 Redirect |
| `/admin/users`, `/admin`, `/users` | `/admin/users` | Admin Console | Kept as-is |
| `/settings/password`, `/password` | `/settings/password` | Change Password | Kept as-is |
| `/login`, `/auth`, `/signin` | `/login` | Sign In | Kept as-is |

---

## 6. Implementation Checklist & Sign-Off Gate

- [ ] **Frank (Product Owner) Approval:** Sign off on canonical groups and duplicate removal decisions.
- [ ] **Prompt 2 Readiness:** Update `InstitutionalSidebar.tsx` to match the 6 groups and remove duplicates.
- [ ] **Prompt 3 Readiness:** Update `DualMenuTree.tsx` to match exact labels and implement the 3-screener chooser.
- [ ] **Prompt 4 Readiness:** Refactor `useAppNavigation.ts` to derive state strictly from the URL and 301-redirect legacy routes.
- [ ] **Prompt 5 Readiness:** Deliver first-run orientation, empty states, and layperson jargon tooltips.
