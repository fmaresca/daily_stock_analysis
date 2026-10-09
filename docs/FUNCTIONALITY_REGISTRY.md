# DeltaHarvest Granular Functionality Registry

**Generated for:** Granular Debug, Test, and Fix-Without-Breaking Pack  
**Repository:** `fmaresca/daily_stock_analysis`  
**Pass Status:** Verified via Prompt 2 Static Analysis, Component Smoke Tests, and Mocked API Contract Suite.

---

## 1. Views & Controls

| # | Area | Item | How to reach | Expected behavior | Status |
|---|------|------|--------------|-------------------|--------|
| V001 | Auth Gate | Login Form Email Input | Navigate to `/` (signed out) | Accepts user email address string | PASS |
| V002 | Auth Gate | Login Form Password Input | Navigate to `/` (signed out) | Accepts secret password with masked text | PASS |
| V003 | Auth Gate | Login Submit Button | Click "Sign In" button | Dispatches `/api/auth/login`, transitions to terminal or password change gate | PASS |
| V004 | Auth Gate | Request Access Modal Trigger | Click "Request Access" link on login view | Opens Request Access dialog | PASS |
| V005 | Auth Gate | Request Access Form Submit | Submit Request Access dialog | Posts inquiry to `/api/auth/request-access`, displays confirmation | PASS |
| V006 | Auth Gate | Forgot Password Modal Trigger | Click "Forgot Password" link on login view | Opens Password Reset Request dialog | PASS |
| V007 | Auth Gate | Forgot Password Form Submit | Submit Password Reset dialog | Sends reset request to `/api/auth/reset-password` | PASS |
| V008 | Password Gate | Current Password Input | Mandatory redirect on `must_change_password` flag | Accepts existing temporary password | PASS |
| V009 | Password Gate | New Password Input | Password Change View | Accepts new password meeting complexity criteria | PASS |
| V010 | Password Gate | Confirm Password Input | Password Change View | Matches new password entry | PASS |
| V011 | Password Gate | Submit Password Change Button | Click "Update Password" | Calls `/api/auth/change-password`, updates credentials, unlocks terminal | PASS |
| V012 | Navigation Shell | DualMenuTree Mode Selector | Top Header navigation tabs | Switches active menu category (Workflow, Options, Equities, Methodology, FAQ, Disclaimer) | PASS |
| V013 | Navigation Shell | DualMenuTree Tab Buttons | Secondary horizontal bar below mode selector | Activates specific sub-view/panel within the selected mode | PASS |
| V014 | Navigation Shell | Command Palette Shortcut / Button | Press `Ctrl+K` or click header search icon | Opens global CommandPalette modal | PASS |
| V015 | Navigation Shell | Auto-Sync Dropdown / Toggle | Header right toolbar | Toggles auto-refresh intervals (off, 30s, 60s, 5m) | PASS |
| V016 | Navigation Shell | Notifications Bell | Header right toolbar | Toggles system notification panel/drawer | PASS |
| V017 | Navigation Shell | User Profile Menu / Logout | Header avatar/profile dropdown -> Click "Sign Out" | Dispatches `/api/auth/logout`, purges session, returns to login screen | PASS |
| V018 | Navigation Shell | Dark/Light Theme Toggle | Header theme button | Toggles CSS root theme variables between dark and light modes | PASS |
| V019 | Workflow (Step 1) | Schwab Positions Upload CSV Dropzone | DualMenuTree -> Workflow -> Step 1 (Upload Positions) | Accepts CSV drop or file selection, parses positions | PASS |
| V020 | Workflow (Step 1) | Positions Table Display & Filters | DualMenuTree -> Workflow -> Step 1 | Displays uploaded holdings, quantities, strikes, cost bases | PASS |
| V021 | Workflow (Step 1) | Clear / Reset Uploaded Data Button | DualMenuTree -> Workflow -> Step 1 -> "Clear Data" | Resets uploaded positions state with confirmation prompt | PASS |
| V022 | Workflow (Step 2) | Cash & Tax Ledger Table | DualMenuTree -> Workflow -> Step 2 (Cash & Tax Ledger) | Renders weekly cash, margin, settled balances, and tax liabilities | PASS |
| V023 | Workflow (Step 2) | Add Cash/Tax Transaction Button | DualMenuTree -> Workflow -> Step 2 -> "Add Entry" | Opens transaction logging row/modal, updates ledger | PASS |
| V024 | Workflow (Step 2) | Export Cash Ledger CSV Button | DualMenuTree -> Workflow -> Step 2 -> "Export CSV" | Triggers browser download of ledger records in CSV format | PASS |
| V025 | Workflow (Step 3) | Holdings & Covered Calls Matrix | DualMenuTree -> Workflow -> Step 3 (Holdings & CCs) | Evaluates covered call eligibility, assignment delta, annualized yield | PASS |
| V026 | Workflow (Step 3) | Covered Call Recommendation Refresh | DualMenuTree -> Workflow -> Step 3 -> "Analyze CC Opportunities" | Fetches live options chains, computes CC strike recommendations | PASS |
| V027 | Workflow (Step 3) | Stage CC Order Button | DualMenuTree -> Workflow -> Step 3 -> Click "Stage Trade" on row | Pre-fills and opens BrokerOrderStagingModal with trade parameters | PASS |
| V028 | Workflow (Step 4) | Economic Calendar Event Filter | DualMenuTree -> Workflow -> Step 4 (Economic Calendar) | Filters high-impact macroeconomic events (CPI, FOMC, Jobs) | PASS |
| V029 | Workflow (Step 4) | Economic Calendar Refresh Button | DualMenuTree -> Workflow -> Step 4 -> "Refresh Calendar" | Fetches live calendar items from `/api/economic-calendar` | PASS |
| V030 | Workflow (Step 5) | Weekly Shortlist Screener Presets | DualMenuTree -> Workflow -> Step 5 (Weekly Shortlist) | Applies dividend aristocrat, high-IV, or low-P/E screener presets | PASS |
| V031 | Workflow (Step 5) | Run Cascading Screener Scan | DualMenuTree -> Workflow -> Step 5 -> "Run Scan" | Executes multi-factor screen, ranks candidates by composite score | PASS |
| V032 | Workflow (Step 5) | Add Filtered Stock to Watchlist | DualMenuTree -> Workflow -> Step 5 -> Click bookmark icon | Persists selected ticker to user watchlist store | PASS |
| V033 | Workflow (Step 6) | Executive Report Generator Button | DualMenuTree -> Workflow -> Step 6 (Executive Report) -> "Generate Report" | Assembles weekly performance, open risk, yield metrics into report | PASS |
| V034 | Workflow (Step 6) | Copy Executive Report Markdown | DualMenuTree -> Workflow -> Step 6 -> "Copy Markdown" | Copies formatted markdown summary to clipboard with toast notification | PASS |
| V035 | Workflow (Step 6) | Print / Export PDF Report | DualMenuTree -> Workflow -> Step 6 -> "Export PDF / Print" | Opens browser print dialog formatted for institutional report style | PASS |
| V036 | Workflow (Step 7) | Broker Order Staging Table | DualMenuTree -> Workflow -> Step 7 (Broker Staging) | Lists staged trades awaiting Schwab/Tradier execution | PASS |
| V037 | Workflow (Step 7) | Export Orders to Broker Format | DualMenuTree -> Workflow -> Step 7 -> "Export Orders" | Generates batch broker-compatible import format | PASS |
| V038 | Workflow (Step 7) | Clear Staged Orders | DualMenuTree -> Workflow -> Step 7 -> "Clear All" | Empties staging queue with confirmation dialog | PASS |
| V039 | Strategy Labs (Opt 1) | Find Income Trades Screener Table | DualMenuTree -> Options -> Find Income Trades | Filters options by delta, DTE, annualized return, downside cushion | PASS |
| V040 | Strategy Labs (Opt 1) | Income Screener Filter Sliders | DualMenuTree -> Options -> Find Income Trades | Dynamically filters table rows on min yield, max delta, min cushion | PASS |
| V041 | Strategy Labs (Opt 2) | Multi-Leg Spreads Strategy Selector | DualMenuTree -> Options -> Multi-Leg Spreads | Selects Bull Put, Bear Call, Iron Condor, Iron Butterfly | PASS |
| V042 | Strategy Labs (Opt 2) | Spread Payoff Diagram Visualizer | DualMenuTree -> Options -> Multi-Leg Spreads | Renders interactive PnL chart across stock price at expiration | PASS |
| V043 | Strategy Labs (Opt 3) | PMCC Screener LEAPS Strike Selector | DualMenuTree -> Options -> PMCC (Poor Man's Covered Call) | Chooses deep ITM long call (0.80+ delta) and short call (0.30 delta) | PASS |
| V044 | Strategy Labs (Opt 3) | PMCC Return on Capital Calculator | DualMenuTree -> Options -> PMCC | Computes leverage ratio, net debit, max profit, and break-even | PASS |
| V045 | Strategy Labs (Opt 4) | Option Chain Matrix Ticker Input | DualMenuTree -> Options -> Option Chain Matrix | Allows typing symbol, fetches full expiration cycle and strikes | PASS |
| V046 | Strategy Labs (Opt 4) | Option Chain Expiration Dropdown | DualMenuTree -> Options -> Option Chain Matrix | Changes displayed expiration date, re-renders calls and puts | PASS |
| V047 | Strategy Labs (Opt 5) | Volatility Skew Radar Chart | DualMenuTree -> Options -> Volatility Skew Radar | Displays implied volatility curve across strikes and puts vs calls | PASS |
| V048 | Strategy Labs (Opt 6) | Portfolio Margin Stress Simulator | DualMenuTree -> Options -> Margin Stress Simulator | Simulates -20% to +20% market shock, computes margin requirement | PASS |
| V049 | Strategy Labs (Opt 7) | Defensive Roll Assistant Calculator | DualMenuTree -> Options -> Roll Assistant | Evaluates rolling tested short options out and down/up for credit | PASS |
| V050 | Strategy Labs (Opt 8) | Tax Alpha Optimizer Harvest Loss Tool | DualMenuTree -> Options -> Tax Optimizer | Identifies tax-loss harvesting candidates with replacement proxy suggestions | PASS |
| V051 | Strategy Labs (Opt 9) | Options Income AI Prompt Form | DualMenuTree -> Options -> Options Income AI | Generates structured AI income recommendations based on criteria | PASS |
| V052 | Strategy Labs (Opt 10) | Strategy Backtest Margin Controls | DualMenuTree -> Options -> Strategy Backtester | Inputs ticker, strategy, historical window, runs simulation | PASS |
| V053 | Equities (Eq 1) | Stock Screener Multi-Factor Filter Bar | DualMenuTree -> Equities -> Stock Screener | Filters equities by sector, market cap, P/E, RSI, 52w range | PASS |
| V054 | Equities (Eq 2) | Weekly Stock Picks Cards | DualMenuTree -> Equities -> Weekly Stock Picks | Displays algorithmic high-conviction picks with fundamental drivers | PASS |
| V055 | Equities (Eq 3) | Interactive Charts Candlestick / MA | DualMenuTree -> Equities -> Interactive Charts | Renders price chart, volume, SMA/EMA overlays, timeframe selectors | PASS |
| V056 | Equities (Eq 4) | Fundamental Health Balance Sheet Tab | DualMenuTree -> Equities -> Company Health & SEC | Displays debt-to-equity, current ratio, free cash flow margin | PASS |
| V057 | Equities (Eq 5) | Trend & Support Map Dynamic Levels | DualMenuTree -> Equities -> Trend & Support Map | Computes pivot points, Fibonacci retracements, major support/resistance | PASS |
| V058 | Equities (Eq 6) | Volatility Profiler Historical vs Implied | DualMenuTree -> Equities -> Volatility Profiler | Compares 30d HV vs IV percentile and IV rank across sectors | PASS |
| V059 | Equities (Eq 7) | Earnings Calendar Date Range Picker | DualMenuTree -> Equities -> Earnings Calendar | Filters confirmed reporting dates, EPS estimates, surprise history | PASS |
| V060 | Equities (Eq 8) | Macro Economic Calendar Event List | DualMenuTree -> Equities -> Economic Calendar | Lists scheduled central bank releases, forecast vs actual | PASS |
| V061 | Equities (Eq 9) | Sector Overview Performance Heatmap | DualMenuTree -> Equities -> Sector Overview | Displays 11 GICS sector performance across 1D, 1W, 1M, YTD | PASS |
| V062 | Reference | Quantitative Methodology View | DualMenuTree -> Methodology | Renders quantitative formulas, Black-Scholes, Greeks explanations | PASS |
| V063 | Reference | Investor FAQ Accordion Items | DualMenuTree -> FAQ | Expands and collapses frequently asked questions on platform usage | PASS |
| V064 | Reference | Regulatory Disclaimers View | DualMenuTree -> Disclaimer | Displays FINRA/SEC compliance disclaimers and risk notices | PASS |
| V065 | Workspace Shell | Institutional Dashboard View | Sidebar / Header -> Dashboard (`UserDashboardView`) | Displays user private portfolio metrics, cash, and trade log | PASS |
| V066 | Workspace Shell | Admin User Management View | Sidebar / Header -> Admin (`AdminUsersView`) | Renders user list, role controls, active toggles, reset password | PASS |
| V067 | Workspace Shell | User Password Settings View | Sidebar / Header -> Password (`PasswordChangeView`) | Allows authenticated user to self-service change their password | PASS |
| V068 | Workspace Shell | AI Strategy Agent Chat View | Sidebar / Header -> Agent Chat (`StrategyAgentChatView`) | Renders multi-lens AI dialogue, prompt history, tool-use trace | PASS |
| V069 | Workspace Shell | Daily Market Recap Section | Sidebar / Header -> Market Recap (`MarketRecapSection`) | Renders market pulse, index performance, sector summary, AI recap | PASS |
| V070 | Workspace Shell | Executive Portfolio Digest View | Sidebar / Header -> Executive Digest (`ExecutivePortfolioDigestView`) | Renders executive asset allocation and high-level strategy overview | PASS |
| V071 | Modal M01 | Help Handbook Modal | Click "?" Help icon in header | Displays user handbook, keyboard shortcuts, platform guides | PASS |
| V072 | Modal M02 | Tradier Settings Modal | Profile / Settings -> "Tradier Settings" | Configures Tradier API access mode and account identifiers | PASS |
| V073 | Modal M03 | Schwab Settings Modal | Profile / Settings -> "Schwab Settings" | Configures Charles Schwab API connectivity status | PASS |
| V074 | Modal M04 | API Diagnostics Modal | Profile / Settings -> "API Diagnostics" | Tests connectivity to all endpoints, checks latency and auth status | PASS |
| V075 | Modal M05 | Watchlist Manager Modal | Click "Manage Watchlists" | Creates, renames, and deletes custom ticker watchlists | FAIL:crashes on mount/render if watchlistGroups is empty |
| V076 | Modal M06 | Report Query Modal | Header / Reports -> "Generate Query Report" | Formulates custom institutional report queries | PASS |
| V077 | Modal M07 | Ticker Audit Modal (Equity Analysis) | Click ticker link or Audit button anywhere in terminal | Loads comprehensive technical, fundamental, and sentiment audit | PASS |
| V078 | Modal M08 | Option Detail Modal | Click option contract row in any screener/chain | Shows Greeks (Delta, Gamma, Theta, Vega), IV, payoff profile | PASS |
| V079 | Modal M09 | Income Calculator Modal | Click "Calculate Income" on covered call row | Computes projected return based on contracts, premium, and margin | PASS |
| V080 | Modal M10 | Broker Order Staging Modal | Click "Stage Order" on any recommended trade | Edits action, quantity, limit price, duration, and submits to staging | FAIL:crashes with TypeError if capitalSavedByPm is undefined under PORTFOLIO_MARGIN |
| V081 | Modal M11 | Alert Settings Modal | Click Bell / Alert settings | Configures price, IV rank, and technical breakout alert thresholds | PASS |
| V082 | Modal M12 | Options Trade Quality Simulator | Click "Trade Quality" / "Simulate" | Grades proposed option structure on liquidity, skew, and edge | PASS |
| V083 | Modal M13 | Fundamental Valuation Modal (DCF) | Click "DCF Valuation" on ticker audit | Interactive DCF model with discount rate, growth rate, margin sliders | PASS |

---

## 2. API Endpoints

| # | Area | Item | How to reach | Expected behavior | Status |
|---|------|------|--------------|-------------------|--------|
| A001 | Auth API | POST `/api/auth/login` | Login form submission | Returns session token cookie & user metadata, or 401 on bad credentials | PASS |
| A002 | Auth API | POST `/api/auth/logout` | Logout button click | Clears session cookie, invalidates auth token, returns 200 OK | PASS |
| A003 | Auth API | GET `/api/auth/session` | Client boot / reload session check | Returns current user profile and role or 401 Unauthorized | PASS |
| A004 | Auth API | POST `/api/auth/request-access` | Request Access dialog | Validates email/intent, stores inquiry, returns 200 or 400 | PASS |
| A005 | Auth API | POST `/api/auth/reset-password` | Forgot Password dialog | Initiates password reset flow, sends reset email if configured | PASS |
| A006 | Auth API | POST `/api/auth/reset-password/confirm` | Reset password token link | Verifies reset token and updates password in D1 | PASS |
| A007 | Auth API | POST `/api/auth/change-password` | Mandatory password change form | Updates password for authenticated user, clears `must_change_password` | PASS |
| A008 | User API | POST `/api/user/change-password` | Profile settings password change | Authenticated password change endpoint | PASS |
| A009 | User API | GET/POST `/api/user/data` | Watchlists / custom settings sync | Persists and retrieves encrypted user preferences and watchlist items | PASS |
| A010 | User API | GET/POST `/api/user/digest-preferences` | Morning digest notification settings | Gets or sets user email digest preferences and cadence | PASS |
| A011 | Admin API | GET `/api/admin/users` | Admin user list view | Requires Admin role; returns list of registered users and status | PASS |
| A012 | Admin API | POST `/api/admin/users/create` | Admin user creation form | Requires Admin role; provisions new user account with temporary credentials | PASS |
| A013 | Admin API | POST `/api/admin/users/toggle-status` | Admin user status toggle switch | Requires Admin role; enables or disables user login access | PASS |
| A014 | Admin API | POST `/api/admin/users/reset-password` | Admin reset password button | Requires Admin role; forces password reset for specified user | PASS |
| A015 | Admin API | GET `/api/admin/diagnostics` | Admin system diagnostics panel | Requires Admin role; tests DB connection, KV storage, external APIs | PASS |
| A016 | Admin API | GET `/api/admin/inquiries` | Admin user inquiries panel | Requires Admin role; lists access request inquiries | PASS |
| A017 | Admin API | POST `/api/admin/llm-chain-test` | Admin LLM connectivity tester | Requires Admin role; executes test prompt against configured LLM providers | PASS |
| A018 | Admin API | GET/POST `/api/admin/settings` | Admin system configurations | Requires Admin role; gets or sets global system configuration values | PASS |
| A019 | Market API | GET `/api/market-price` | Symbol lookup / price fetch | Accepts `?symbol=XYZ`; returns real-time quote, change, volume, metrics | PASS |
| A020 | Market API | GET `/api/market-recap` | Market recap view / header pulse | Returns major index quotes, market breadth, and sector breakdown | PASS |
| A021 | Market API | GET `/api/market-sentiment` | Sentiment dashboard widget | Returns Fear & Greed index, put/call ratios, and market mood metrics | PASS |
| A022 | Market API | GET `/api/economic-calendar` | Economic calendar view | Returns macroeconomic events, consensus, and previous figures | PASS |
| A023 | Market API | GET `/api/news/[ticker]` | Ticker news tab | Returns latest news headlines and sentiment for specified ticker | PASS |
| A024 | Options API | POST `/api/analyze-options` | Option screener analysis | Runs options valuation, calculates Greeks and projected return | PASS |
| A025 | Options API | GET/POST `/api/covered-calls` | Covered call screener | Scans holdings or tickers for optimal covered call strike/expiration | PASS |
| A026 | Options API | GET/POST `/api/options/journal` | Options trade journal | Retrieves and logs options trades, PnL, and notes | PASS |
| A027 | Options API | POST `/api/v1/options/screeners/barchart/analyze-watchlist` | Barchart options screener runner | Analyzes watchlist against Barchart screener rules | PASS |
| A028 | Options API | GET `/api/v1/options/tradier/status` | Tradier integration check | Checks Tradier account connectivity and API key validity | PASS |
| A029 | AI Agent API | POST `/api/agent/chat` | AI Strategy Agent chat submit | Multi-lens financial assistant stream/response with tool execution | PASS |
| A030 | Bot API | POST `/api/bot/discord` | Discord webhook / interaction | Handles Discord bot commands and notifications | PASS |
| A031 | System API | GET `/api/version` / `/version` | System build check | Returns current application version, git commit hash, and build timestamp | PASS |

---

## 3. Background Jobs

| # | Area | Item | How to reach | Expected behavior | Status |
|---|------|------|--------------|-------------------|--------|
| B001 | Scheduled Task | Morning Digest Cloudflare Cron | Scheduled trigger: `functions/api/scheduled/morning-digest.js` | Runs at configured morning market hour; generates recap and sends digest emails | PASS |
| B002 | GitHub Actions | Morning Digest Workflow | `.github/workflows/morning-digest.yml` | Scheduled CI workflow dispatching morning market analysis pipeline | PASS |
