# Plain-Language Label Glossary & Ritual Unification

**DeltaHarvest Platform — Round-8 Menu & Navigation Reorganization**  
**Document Status:** Complete Proposal for Frank's Approval (Prompt 1)  
**Author:** Antigravity (AI Assistant)  
**Target Release:** v3.4 / Round-8  
**Scope:** Canonical plain-language naming for all menus, buttons, tabs, tooltips, and the 7-step ritual.

---

## 1. Governance Rules for Labels

1. **One Destination, One Label:** Every destination has exactly one byte-identical primary label across the sidebar, tab strip, page header, command palette, URL, and handbook.
2. **Action-Oriented & Plain English:** Primary labels use intuitive verbs and plain nouns a non-trader understands (e.g. *"Find Income Trades"* replaces *"Conservative Income (CSPs & CCs)"*).
3. **Jargon as Subtitles Only:** Institutional terms, Greek symbols, tax codes, and acronyms (`CSP`, `CC`, `PMCC`, `25Δ`, `Iron Condor`, `IRC §1256`, `DCF`, `DuPont`, `TIMS`) survive **only** as secondary subtitle text or badge labels, never as the primary title.
4. **Owner-Chosen Labels Preserved:** Labels Frank explicitly designated (e.g. **"Investment Portfolio"**) are marked `KEEP — owner-chosen` and never silently altered.
5. **Concise Descriptions:** Every menu item includes a plain-English description of **≤12 words** displayed as a visible subtitle or tooltip.

---

## 2. Weekend Ritual Unification Proposal (Human Checklist Item 1)

Currently, the 7-step Weekend Ritual has **three inconsistent label sets** across the application:

```
Step 1: "1. Upload Positions" (Sidebar) vs "1. Upload Schwab Positions" (Tab)
Step 2: "2. Cash & Tax Ledger" (Sidebar) vs "2. Cash & YTD Tax" (Tab)
Step 3: "3. Holdings Calls" (Sidebar) vs "3. Holdings & 20Δ Calls" (Tab)
Step 4: "4. Economic Calendar" (Sidebar) vs "4. Macro & Catalysts" (Tab)
Step 5: "5. Cascading Screener" (Sidebar) vs "5. Tri-Screen & Gemini AI" (Tab)
Step 6: "6. Executive Report" (Sidebar) vs "6. Master Report" (Tab)
Step 7: "7. Order Staging" (Sidebar) vs "7. Broker Staging" (Tab)
```

### Proposed Unified Canonical Labels (Pending Frank's Approval)

The sequence, order, and functionality remain **100% byte-for-byte identical**. We propose unifying them to the following canonical label set:

| Step # | Proposed Canonical Label | Visible Subtitle / Jargon Retained | One-Line Description (≤12 words) | Current Sidebar Label | Current DualMenuTree Tab Label | Approval Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **1** | **1. Upload Positions** | Schwab CSV Import | *Import your Schwab account positions and cash balances from CSV.* | 1. Upload Positions | 1. Upload Schwab Positions | **Pending Frank** |
| **2** | **2. Cash & Tax Ledger** | Living & Loss Carryforward | *Calculate deployable cash after deducting living expenses and tax liabilities.* | 2. Cash & Tax Ledger | 2. Cash & YTD Tax | **Pending Frank** |
| **3** | **3. Holdings & Covered Calls** | 80% Profit & 20Δ Radar | *Review stock holdings for 80% profit alerts and safe covered calls.* | 3. Holdings Calls | 3. Holdings & 20Δ Calls | **Pending Frank** |
| **4** | **4. Economic Calendar** | High-Impact USD Macro | *Check upcoming high-impact economic events and Fed announcements this week.* | 4. Economic Calendar | 4. Macro & Catalysts | **Pending Frank** |
| **5** | **5. Weekly Shortlist Screener** | 15Δ–25Δ Funnel & AI | *Run the 3-stage quantitative funnel and generate AI trade ideas.* | 5. Cascading Screener | 5. Tri-Screen & Gemini AI | **Pending Frank** |
| **6** | **6. Executive Report** | Compliance & Theta Pulse | *Generate weekly compliance health score, theta income, and PDF summary.* | 6. Executive Report | 6. Master Report | **Pending Frank** |
| **7** | **7. Order Staging** | Broker Staging & Execution | *Review and prepare final trade orders before placing them at broker.* | 7. Order Staging | 7. Broker Staging | **Pending Frank** |

---

## 3. Comprehensive Master Label Glossary

Below is the exhaustive glossary for all 48 reachable destinations across the platform.

### Group 1: Weekend Ritual

| Destination Key | Current Label(s) | Proposed Plain-Language Label | One-Line Description (≤12 words) | Secondary Text / Jargon Retained | Owner Flag |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `SCHWAB_POSITIONS_UPLOAD` | 1. Upload Positions / 1. Upload Schwab Positions | **1. Upload Positions** | *Import your Schwab account positions and cash balances from CSV.* | Schwab CSV Import | Standard |
| `WEEKLY_CASH_LEDGER` | 2. Cash & Tax Ledger / 2. Cash & YTD Tax | **2. Cash & Tax Ledger** | *Calculate deployable cash after deducting living expenses and tax liabilities.* | Living & Loss Carryforward | Standard |
| `HOLDINGS_COVERED_CALLS` | 3. Holdings Calls / 3. Holdings & 20Δ Calls | **3. Holdings & Covered Calls** | *Review stock holdings for 80% profit alerts and safe covered calls.* | 80% Profit & 20Δ Radar | Standard |
| `ECONOMIC_CALENDAR` (Ritual) | 4. Economic Calendar / 4. Macro & Catalysts | **4. Economic Calendar** | *Check upcoming high-impact economic events and Fed announcements this week.* | High-Impact USD Macro | Standard |
| `CASCADING_SCREENER` | 5. Cascading Screener / 5. Tri-Screen & Gemini AI | **5. Weekly Shortlist Screener** | *Run the 3-stage quantitative funnel and generate AI trade ideas.* | 15Δ–25Δ Funnel & AI | Standard |
| `WEEKLY_EXECUTIVE_REPORT` | 6. Executive Report / 6. Master Report | **6. Executive Report** | *Generate weekly compliance health score, theta income, and PDF summary.* | Compliance & Theta Pulse | Standard |
| `BROKER_STAGING` (Ritual) | 7. Order Staging / 7. Broker Staging | **7. Order Staging** | *Review and prepare final trade orders before placing them at broker.* | Broker Staging & Execution | Standard |

---

### Group 2: My Money

| Destination Key | Current Label(s) | Proposed Plain-Language Label | One-Line Description (≤12 words) | Secondary Text / Jargon Retained | Owner Flag |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `DASHBOARD` | My Workspace / Client View Simulator | **My Workspace** | *View your private portfolio, personal trade log, and custom watchlists.* | Portfolio & Trades | Standard |
| `EXECUTIVE_DIGEST` | Investment Portfolio / Executive Digest | **Investment Portfolio** | *Review overall capital allocation across cash, equities, and options positions.* | Executive Capital Digest | `KEEP — owner-chosen` |
| `WatchlistManagerModal` | Watchlists | **Watchlists** | *Create and manage custom stock lists to monitor across the app.* | Custom Ticker Groups | Standard |
| `BROKER_STAGING` (Workbench) | Order Staging / Broker Staging Workbench | **Order Staging** | *Review, adjust, and stage bracket orders ready for broker execution.* | Broker Workbench | Standard |
| `ReportQueryModal` | Reports / Reports & PDF / Excel Exports | **Reports & Exports** | *Generate custom query reports, transaction audit logs, and spreadsheet exports.* | PDF, CSV & Audit Logs | Standard |

---

### Group 3: Research

| Destination Key | Current Label(s) | Proposed Plain-Language Label | One-Line Description (≤12 words) | Secondary Text / Jargon Retained | Owner Flag |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `SCREENER_HUB` (New) | N/A (Disoriented screeners) | **Screener Hub** | *Choose the right screening tool based on your specific investment goal.* | 3-Way Guided Chooser | Standard |
| `TECHNICAL_SCREENER` | Technical Screener | **Stock Screener** | *Scan US stocks by price, trend, moving averages, and volume.* | Technical & Indicators | Standard |
| `WEEKLY_STOCK_SCREENERS` | Weekly Stock Screeners (Barchart) | **Weekly Stock Picks** | *Filter top weekly momentum stocks and high-conviction buy ratings.* | Barchart Momentum | Standard |
| `INCOME_SCREENER` | Conservative Income (CSPs & CCs) | **Find Income Trades** | *Scan conservative options selling trades with high probability of profit.* | Cash-Secured Puts & CCs | Standard |
| `INTERACTIVE_CHARTS` | Interactive Candlestick Charts | **Interactive Charts** | *Analyze candlestick price charts with technical indicators and support levels.* | Candlesticks & 20-SMA | Standard |
| `ECONOMIC_CALENDAR` (Research) | Economic Indicators (USD) | **Economic Calendar** | *Track key macroeconomic release dates and market-moving catalyst events.* | High-Impact USD Macro | Standard |
| `EARNINGS_CALENDAR` | Earnings Calendar | **Earnings Calendar** | *Monitor upcoming company earnings reports to avoid unexpected volatility shocks.* | 7–14 Day Earnings Risk | Standard |
| `FUNDAMENTAL_HEALTH` | Fundamental Health & SEC EDGAR | **Company Health & SEC Filings** | *Examine company balance sheets, valuation ratios, and official SEC filings.* | SEC EDGAR & Altman Z | Standard |
| `TREND_SUPPORT` | Trend & Support Map | **Trend & Support Map** | *Identify stocks trading near strong historical support and price floors.* | 20D SMA & Support Bands | Standard |
| `VOLATILITY_RISK` | Volatility & Risk Profiler | **Volatility Profiler** | *Rank stocks by implied volatility levels and historical price swings.* | IV Rank ≥ 40% & HV30 | Standard |
| `SECTOR_OVERVIEW` | Sector Overview | **Sector Overview** | *Compare performance and capital flow across major stock market sectors.* | 11 Major Sectors | Standard |
| `TickerAuditModal` | Equity Analysis Card / Ticker Audit | **Equity Analysis Card** | *Open deep-dive audit of technicals, options, news, and intrinsic value.* | Multi-Factor Ticker Audit | Standard |

---

### Group 4: Tools (Analytics & Strategy Labs)

| Destination Key | Current Label(s) | Proposed Plain-Language Label | One-Line Description (≤12 words) | Secondary Text / Jargon Retained | Owner Flag |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `OptionsTradeQualityModal` | Trade Simulator / Options Trade Quality Simulator | **Trade Simulator** | *Simulate option trade outcomes, expiration payoffs, and downside risk.* | 100-Point Scoring Model | Standard |
| `FundamentalValuationModal` | DCF & Valuation / DCF Valuation & DuPont Terminal | **Valuation Terminal** | *Calculate intrinsic stock value using discounted cash flows and DuPont ratios.* | DCF & DuPont ROE v3.4 | Standard |
| `TAX_ALPHA_OPTIMIZER` | Tax Alpha (1256) / Section 1256 Tax Alpha | **Tax Optimizer** | *Maximize tax efficiency using index options rules and loss harvesting.* | Section 1256 & 60/40 Rule | Standard |
| `DEFENSIVE_ROLL_ASSISTANT` | Roll Assistant / Defensive Rolling & Repair | **Roll Assistant** | *Find algorithmic roll adjustments for threatened positions to collect credits.* | Defensive Rolling & Repair | Standard |
| `PORTFOLIO_MARGIN_SIM` | Margin & Shock Simulator / Portfolio Margin Sim | **Margin Stress Simulator** | *Stress-test portfolio margin requirements against simulated 15% market crashes.* | FINRA 4210 TIMS ±15% | Standard |
| `BACKTEST_MARGIN` | Systematic Backtester | **Strategy Backtester** | *Test conservative options selling rules against historical stock market data.* | Historical Win-Rate Sim | Standard |
| `MULTI_LEG_SPREADS` | Multi-Leg Spreads & Iron Condors | **Multi-Leg Spreads** | *Explore defined-risk option spreads, iron condors, and credit strategies.* | Credit Spreads & Iron Condors | Standard |
| `OPTION_CHAIN_MATRIX` | Option Chain & Volatility Smile | **Option Chain Matrix** | *Browse complete option strike chains, bid-ask quotes, and Greek values.* | Volatility Smile & Greeks | Standard |
| `PMCC_SCREENER` | Poor Man's Covered Call (PMCC) | **Poor Man's Covered Call** | *Scan long-term options paired with short calls for reduced capital.* | PMCC / Synthetic Long | Standard |
| `VOLATILITY_SKEW` | 25Δ Skew & Term Structure | **Volatility Skew Radar** | *Measure market fear and institutional demand between put and call options.* | 25Δ Skew & Term Structure | Standard |
| `AI_OPTIONS_INCOME` | Options Income AI (Thinking) | **Options Income AI** | *Use AI extended thinking to analyze and rank weekly trade opportunities.* | Gemini Extended Thinking | Standard |
| `MULTI_AGENT_AUDIT` | Multi-Agent Trade Auditor | **Trade Auditor** | *Audit proposed trades using multi-agent consensus across technicals and risk.* | 4-Agent Consensus Engine | Standard |
| `DELTA_GREEKS` | 0.15–0.20 Delta Sweet Spot | **Delta Sweet Spot Radar** | *Filter options positioned in the 80% to 85% win-rate sweet spot.* | 0.15–0.20Δ Sweet Spot | Standard |
| `EXPIRATION_CADENCE` | Expiration Cadence & CBOE Registry | **Expiration Cadence** | *Identify stocks with weekly options versus standard monthly expiration cycles.* | CBOE Weekly Registry | Standard |
| `IncomeCalculatorModal` | Income Calculator | **Income Calculator** | *Quickly calculate cash premium return on collateral for any contract.* | Cash Yield & ROC Matrix | Standard |

---

### Group 5: Learn

| Destination Key | Current Label(s) | Proposed Plain-Language Label | One-Line Description (≤12 words) | Secondary Text / Jargon Retained | Owner Flag |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `HelpHandbookModal` | Strategy Handbook | **Strategy Handbook** | *Browse comprehensive platform chapters explaining trading rules and systems.* | 16 Institutional Chapters | Standard |
| `METHODOLOGY` | Methodology / Quantitative Methodology | **Methodology** | *Read mathematical formulas, Black-Scholes models, and cash management rules.* | Black-Scholes & Cash Waterfall | Standard |
| `FAQ` | Investor FAQ | **Investor FAQ** | *Find clear answers to common questions about conservative options income.* | Plain-English Q&A | Standard |
| `DISCLAIMER` | Disclaimers / Regulatory Disclaimers | **Disclaimers** | *Review regulatory risk disclosures, options disclosures, and terms of service.* | SEC / FINRA / OCC Disclosures | Standard |

---

### Group 6: Administration

| Destination Key | Current Label(s) | Proposed Plain-Language Label | One-Line Description (≤12 words) | Secondary Text / Jargon Retained | Owner Flag |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `ADMIN_USERS` | Admin Console / Admin User Console | **Admin Console** | *Manage multi-tenant accounts, provision new logins, and reset passwords.* | Multi-Tenant RBAC | Standard |
| `SETTINGS_PASSWORD` | Change Password | **Change Password** | *Update your private account password for secure login access.* | Account Security | Standard |
| `SETTINGS_PANEL` | Settings & APIs | **Settings & APIs** | *Configure broker credentials, alert webhooks, and interface preferences.* | Tradier, Schwab & Alerts | Standard |
| `ApiDiagnosticsModal` | API Self-Test | **API Self-Test** | *Run automated diagnostic tests across broker feeds and data providers.* | Automated Health Suite | Standard |
| `LOGIN` | Sign In as Admin / Sign In | **Sign In** | *Enter credentials to access your private tenant investment workspace.* | Tenant Authentication | Standard |

---

## 4. Screener Disambiguation Guide ("What are you trying to do?")

To eliminate the "three screeners" confusion for new users, a clear visual chooser card will be presented in `DualMenuTree.tsx`:

```
┌────────────────────────────────────────────────────────────────────────┐
│               🔍 WHAT ARE YOU TRYING TO DO TODAY?                       │
├──────────────────────┬────────────────────────┬────────────────────────┤
│ 1. Find Stocks       │ 2. Find Income Trades  │ 3. Run Weekly Shortlist│
│    to Watch          │                        │                        │
│ Scan the US stock    │ Screen cash-secured    │ Walk the 7-step weekend│
│ universe by price,   │ puts & covered calls   │ ritual and generate AI │
│ volume & technicals. │ for steady cash flow.  │ trade recommendations. │
│                      │                        │                        │
│ [Open Stock Screener]│ [Find Income Trades]   │ [Start Weekend Ritual] │
└──────────────────────┴────────────────────────┴────────────────────────┘
```

1. **Card 1: Find Stocks to Watch** &rarr; Deep-links to **Research &rarr; Stock Screener** (`/research/stocks`).
2. **Card 2: Find Options Income Trades** &rarr; Deep-links to **Research &rarr; Find Income Trades** (`/research/income`).
3. **Card 3: Run the Weekly Shortlist** &rarr; Deep-links to **Weekend Ritual &rarr; Step 5** (`/ritual/screener`).

---

## 5. Layperson Glossary Component Dictionary (For Tooltips & Badges)

The following plain-language definitions will be mounted in a shared hover/tap tooltip component across all tables and menus:

| Term | Full Name | Plain-English Definition for Beginners (Displayed in Tooltip) |
| :--- | :--- | :--- |
| **CSP** | Cash-Secured Put | *An option trade where you get paid cash today for agreeing to buy a stock at a discount if it drops.* |
| **CC** | Covered Call | *An option trade where you get paid cash today for agreeing to sell shares you already own at a higher price.* |
| **PMCC** | Poor Man's Covered Call | *Using an inexpensive long-term option instead of 100 shares of stock to collect weekly income.* |
| **25Δ (Delta)** | 25 Delta Strike | *A strike price positioned so the trade has an approximately 75% to 80% statistical chance of winning.* |
| **Iron Condor** | Iron Condor Spread | *A four-leg trade that collects cash upfront and wins if the stock stays within a wide price range.* |
| **Section 1256** | IRC §1256 Tax Rule | *A federal tax rule taxing index option profits at a lower blended rate (60% long-term, 40% short-term).* |
| **DCF** | Discounted Cash Flow | *A valuation model estimating what a company is really worth based on its projected future cash generation.* |
| **DuPont** | DuPont ROE Analysis | *A method breaking down company return-on-equity into profit margin, asset turnover, and leverage.* |
| **TIMS** | Theoretical Intermarket Margin | *A FINRA margin system calculating the worst-case capital loss of an options portfolio under stress.* |
| **IV Rank (IVR)** | Implied Volatility Rank | *A 0–100 score showing whether option payouts are currently cheap (low rank) or expensive (high rank).* |
| **DTE** | Days to Expiration | *The exact number of calendar days remaining until an option contract expires.* |
| **POP** | Probability of Profit | *The mathematical chance that an option trade will expire profitably without taking a loss.* |
