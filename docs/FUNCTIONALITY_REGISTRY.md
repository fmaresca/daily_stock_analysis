# DeltaHarvest Granular Functionality Registry

**Generated for:** Granular Debug, Test, and Fix-Without-Breaking Pack  
**Repository:** `fmaresca/daily_stock_analysis`  
**Initial Status:** All items initialized to `UNTESTED`.

---

## 1. Views & Controls

| # | Area | Item | How to reach | Expected behavior | Status |
|---|------|------|--------------|-------------------|--------|
| V001 | Auth Gate | Login Form Email Input | Navigate to `/` (signed out) | Accepts user email address string | UNTESTED |
| V002 | Auth Gate | Login Form Password Input | Navigate to `/` (signed out) | Accepts secret password with masked text | UNTESTED |
| V003 | Auth Gate | Login Submit Button | Click "Sign In" button | Dispatches `/api/auth/login`, transitions to terminal or password change gate | UNTESTED |
| V004 | Auth Gate | Request Access Modal Trigger | Click "Request Access" link on login view | Opens Request Access dialog | UNTESTED |
| V005 | Auth Gate | Request Access Form Submit | Submit Request Access dialog | Posts inquiry to `/api/auth/request-access`, displays confirmation | UNTESTED |
| V006 | Auth Gate | Forgot Password Modal Trigger | Click "Forgot Password" link on login view | Opens Password Reset Request dialog | UNTESTED |
| V007 | Auth Gate | Forgot Password Form Submit | Submit Password Reset dialog | Sends reset request to `/api/auth/reset-password` | UNTESTED |
| V008 | Password Gate | Current Password Input | Mandatory redirect on `must_change_password` flag | Accepts existing temporary password | UNTESTED |
| V009 | Password Gate | New Password Input | Password Change View | Accepts new password meeting complexity criteria | UNTESTED |
| V010 | Password Gate | Confirm Password Input | Password Change View | Matches new password entry | UNTESTED |
| V011 | Password Gate | Submit Password Change Button | Click "Update Password" | Calls `/api/auth/change-password`, updates credentials, unlocks terminal | UNTESTED |
| V012 | Navigation Shell | DualMenuTree Mode Selector | Top Header navigation tabs | Switches active menu category (Workflow, Options, Equities, Methodology, FAQ, Disclaimer) | UNTESTED |
| V013 | Navigation Shell | DualMenuTree Tab Buttons | Secondary horizontal bar below mode selector | Activates specific sub-view/panel within the selected mode | UNTESTED |
| V014 | Navigation Shell | Command Palette Shortcut / Button | Press `Ctrl+K` or click header search icon | Opens global CommandPalette modal | UNTESTED |
| V015 | Navigation Shell | Auto-Sync Dropdown / Toggle | Header right toolbar | Toggles auto-refresh intervals (off, 30s, 60s, 5m) | UNTESTED |
| V016 | Navigation Shell | Notifications Bell | Header right toolbar | Toggles system notification panel/drawer | UNTESTED |
| V017 | Navigation Shell | User Profile Menu / Logout | Header avatar/profile dropdown -> Click "Sign Out" | Dispatches `/api/auth/logout`, purges session, returns to login screen | UNTESTED |
| V018 | Navigation Shell | Dark/Light Theme Toggle | Header theme button | Toggles CSS root theme variables between dark and light modes | UNTESTED |
| V019 | Workflow (Step 1) | Schwab Positions Upload CSV Dropzone | DualMenuTree -> Workflow -> Step 1 (Upload Positions) | Accepts CSV drop or file selection, parses positions | UNTESTED |
| V020 | Workflow (Step 1) | Positions Table Display & Filters | DualMenuTree -> Workflow -> Step 1 | Displays uploaded holdings, quantities, strikes, cost bases | UNTESTED |
| V021 | Workflow (Step 1) | Clear / Reset Uploaded Data Button | DualMenuTree -> Workflow -> Step 1 -> "Clear Data" | Resets uploaded positions state with confirmation prompt | UNTESTED |
| V022 | Workflow (Step 2) | Cash & Tax Ledger Table | DualMenuTree -> Workflow -> Step 2 (Cash & Tax Ledger) | Renders weekly cash, margin, settled balances, and tax liabilities | UNTESTED |
| V023 | Workflow (Step 2) | Add Cash/Tax Transaction Button | DualMenuTree -> Workflow -> Step 2 -> "Add Entry" | Opens transaction logging row/modal, updates ledger | UNTESTED |
| V024 | Workflow (Step 2) | Export Cash Ledger CSV Button | DualMenuTree -> Workflow -> Step 2 -> "Export CSV" | Triggers browser download of ledger records in CSV format | UNTESTED |
| V025 | Workflow (Step 3) | Holdings & Covered Calls Matrix | DualMenuTree -> Workflow -> Step 3 (Holdings & CCs) | Evaluates covered call eligibility, assignment delta, annualized yield | UNTESTED |
| V026 | Workflow (Step 3) | Covered Call Recommendation Refresh | DualMenuTree -> Workflow -> Step 3 -> "Analyze CC Opportunities" | Fetches live options chains, computes CC strike recommendations | UNTESTED |
| V027 | Workflow (Step 3) | Stage CC Order Button | DualMenuTree -> Workflow -> Step 3 -> Click "Stage Trade" on row | Pre-fills and opens BrokerOrderStagingModal with trade parameters | UNTESTED |
| V028 | Workflow (Step 4) | Economic Calendar Event Filter | DualMenuTree -> Workflow -> Step 4 (Economic Calendar) | Filters high-impact macroeconomic events (CPI, FOMC, Jobs) | UNTESTED |
| V029 | Workflow (Step 4) | Economic Calendar Refresh Button | DualMenuTree -> Workflow -> Step 4 -> "Refresh Calendar" | Fetches live calendar items from `/api/economic-calendar` | UNTESTED |
| V030 | Workflow (Step 5) | Weekly Shortlist Screener Presets | DualMenuTree -> Workflow -> Step 5 (Weekly Shortlist) | Applies dividend aristocrat, high-IV, or low-P/E screener presets | UNTESTED |
| V031 | Workflow (Step 5) | Run Cascading Screener Scan | DualMenuTree -> Workflow -> Step 5 -> "Run Scan" | Executes multi-factor screen, ranks candidates by composite score | UNTESTED |
| V032 | Workflow (Step 5) | Add Filtered Stock to Watchlist | DualMenuTree -> Workflow -> Step 5 -> Click bookmark icon | Persists selected ticker to user watchlist store | UNTESTED |
| V033 | Workflow (Step 6) | Executive Report Generator Button | DualMenuTree -> Workflow -> Step 6 (Executive Report) -> "Generate Report" | Assembles weekly performance, open risk, yield metrics into report | UNTESTED |
| V034 | Workflow (Step 6) | Copy Executive Report Markdown | DualMenuTree -> Workflow -> Step 6 -> "Copy Markdown" | Copies formatted markdown summary to clipboard with toast notification | UNTESTED |
| V035 | Workflow (Step 6) | Print / Export PDF Report | DualMenuTree -> Workflow -> Step 6 -> "Export PDF / Print" | Opens browser print dialog formatted for institutional report style | UNTESTED |
| V036 | Workflow (Step 7) | Broker Order Staging Table | DualMenuTree -> Workflow -> Step 7 (Broker Staging) | Lists staged trades awaiting Schwab/Tradier execution | UNTESTED |
| V037 | Workflow (Step 7) | Export Orders to Broker Format | DualMenuTree -> Workflow -> Step 7 -> "Export Orders" | Generates batch broker-compatible import format | UNTESTED |
| V038 | Workflow (Step 7) | Clear Staged Orders | DualMenuTree -> Workflow -> Step 7 -> "Clear All" | Empties staging queue with confirmation dialog | UNTESTED |
| V039 | Strategy Labs (Opt 1) | Find Income Trades Screener Table | DualMenuTree -> Options -> Find Income Trades | Filters options by delta, DTE, annualized return, downside cushion | UNTESTED |
| V040 | Strategy Labs (Opt 1) | Income Screener Filter Sliders | DualMenuTree -> Options -> Find Income Trades | Dynamically filters table rows on min yield, max delta, min cushion | UNTESTED |
| V041 | Strategy Labs (Opt 2) | Multi-Leg Spreads Strategy Selector | DualMenuTree -> Options -> Multi-Leg Spreads | Selects Bull Put, Bear Call, Iron Condor, Iron Butterfly | UNTESTED |
| V042 | Strategy Labs (Opt 2) | Spread Payoff Diagram Visualizer | DualMenuTree -> Options -> Multi-Leg Spreads | Renders interactive PnL chart across stock price at expiration | UNTESTED |
| V043 | Strategy Labs (Opt 3) | PMCC Screener LEAPS Strike Selector | DualMenuTree -> Options -> PMCC (Poor Man's Covered Call) | Chooses deep ITM long call (0.80+ delta) and short call (0.30 delta) | UNTESTED |
| V044 | Strategy Labs (Opt 3) | PMCC Return on Capital Calculator | DualMenuTree -> Options -> PMCC | Computes leverage ratio, net debit, max profit, and break-even | UNTESTED |
| V045 | Strategy Labs (Opt 4) | Option Chain Matrix Ticker Input | DualMenuTree -> Options -> Option Chain Matrix | Allows typing symbol, fetches full expiration cycle and strikes | UNTESTED |
| V046 | Strategy Labs (Opt 4) | Option Chain Expiration Dropdown | DualMenuTree -> Options -> Option Chain Matrix | Changes displayed expiration date, re-renders calls and puts | UNTESTED |
| V047 | Strategy Labs (Opt 5) | Volatility Skew Radar Chart | DualMenuTree -> Options -> Volatility Skew Radar | Displays implied volatility curve across strikes and puts vs calls | UNTESTED |
| V048 | Strategy Labs (Opt 6) | Portfolio Margin Stress Simulator | DualMenuTree -> Options -> Margin Stress Simulator | Simulates -20% to +20% market shock, computes margin requirement | UNTESTED |
| V049 | Strategy Labs (Opt 7) | Defensive Roll Assistant Calculator | DualMenuTree -> Options -> Roll Assistant | Evaluates rolling tested short options out and down/up for credit | UNTESTED |
| V050 | Strategy Labs (Opt 8) | Tax Alpha Optimizer Harvest Loss Tool | DualMenuTree -> Options -> Tax Optimizer | Identifies tax-loss harvesting candidates with replacement proxy suggestions | UNTESTED |
| V051 | Strategy Labs (Opt 9) | Options Income AI Prompt Form | DualMenuTree -> Options -> Options Income AI | Generates structured AI income recommendations based on criteria | UNTESTED |
| V052 | Strategy Labs (Opt 10) | Strategy Backtest Margin Controls | DualMenuTree -> Options -> Strategy Backtester | Inputs ticker, strategy, historical window, runs simulation | UNTESTED |
| V053 | Equities (Eq 1) | Stock Screener Multi-Factor Filter Bar | DualMenuTree -> Equities -> Stock Screener | Filters equities by sector, market cap, P/E, RSI, 52w range | UNTESTED |
| V054 | Equities (Eq 2) | Weekly Stock Picks Cards | DualMenuTree -> Equities -> Weekly Stock Picks | Displays algorithmic high-conviction picks with fundamental drivers | UNTESTED |
| V055 | Equities (Eq 3) | Interactive Charts Candlestick / MA | DualMenuTree -> Equities -> Interactive Charts | Renders price chart, volume, SMA/EMA overlays, timeframe selectors | UNTESTED |
| V056 | Equities (Eq 4) | Fundamental Health Balance Sheet Tab | DualMenuTree -> Equities -> Company Health & SEC | Displays debt-to-equity, current ratio, free cash flow margin | UNTESTED |
| V057 | Equities (Eq 5) | Trend & Support Map Dynamic Levels | DualMenuTree -> Equities -> Trend & Support Map | Computes pivot points, Fibonacci retracements, major support/resistance | UNTESTED |
| V058 | Equities (Eq 6) | Volatility Profiler Historical vs Implied | DualMenuTree -> Equities -> Volatility Profiler | Compares 30d HV vs IV percentile and IV rank across sectors | UNTESTED |
| V059 | Equities (Eq 7) | Earnings Calendar Date Range Picker | DualMenuTree -> Equities -> Earnings Calendar | Filters confirmed reporting dates, EPS estimates, surprise history | UNTESTED |
| V060 | Equities (Eq 8) | Macro Economic Calendar Event List | DualMenuTree -> Equities -> Economic Calendar | Lists scheduled central bank releases, forecast vs actual | UNTESTED |
| V061 | Equities (Eq 9) | Sector Overview Performance Heatmap | DualMenuTree -> Equities -> Sector Overview | Displays 11 GICS sector performance across 1D, 1W, 1M, YTD | UNTESTED |
| V062 | Reference | Quantitative Methodology View | DualMenuTree -> Methodology | Renders quantitative formulas, Black-Scholes, Greeks explanations | UNTESTED |
| V063 | Reference | Investor FAQ Accordion Items | DualMenuTree -> FAQ | Expands and collapses frequently asked questions on platform usage | UNTESTED |
| V064 | Reference | Regulatory Disclaimers View | DualMenuTree -> Disclaimer | Displays FINRA/SEC compliance disclaimers and risk notices | UNTESTED |
| V065 | Workspace Shell | Institutional Dashboard View | Sidebar / Header -> Dashboard (`UserDashboardView`) | Displays user private portfolio metrics, cash, and trade log | UNTESTED |
| V066 | Workspace Shell | Admin User Management View | Sidebar / Header -> Admin (`AdminUsersView`) | Renders user list, role controls, active toggles, reset password | UNTESTED |
| V067 | Workspace Shell | User Password Settings View | Sidebar / Header -> Password (`PasswordChangeView`) | Allows authenticated user to self-service change their password | UNTESTED |
| V068 | Workspace Shell | AI Strategy Agent Chat View | Sidebar / Header -> Agent Chat (`StrategyAgentChatView`) | Renders multi-lens AI dialogue, prompt history, tool-use trace | UNTESTED |
| V069 | Workspace Shell | Daily Market Recap Section | Sidebar / Header -> Market Recap (`MarketRecapSection`) | Renders market pulse, index performance, sector summary, AI recap | UNTESTED |
| V070 | Workspace Shell | Executive Portfolio Digest View | Sidebar / Header -> Executive Digest (`ExecutivePortfolioDigestView`) | Renders executive asset allocation and high-level strategy overview | UNTESTED |
| V071 | Modal M01 | Help Handbook Modal | Click "?" Help icon in header | Displays user handbook, keyboard shortcuts, platform guides | UNTESTED |
| V072 | Modal M02 | Tradier Settings Modal | Profile / Settings -> "Tradier Settings" | Configures Tradier API access mode and account identifiers | UNTESTED |
| V073 | Modal M03 | Schwab Settings Modal | Profile / Settings -> "Schwab Settings" | Configures Charles Schwab API connectivity status | UNTESTED |
| V074 | Modal M04 | API Diagnostics Modal | Profile / Settings -> "API Diagnostics" | Tests connectivity to all endpoints, checks latency and auth status | UNTESTED |
| V075 | Modal M05 | Watchlist Manager Modal | Click "Manage Watchlists" | Creates, renames, and deletes custom ticker watchlists | UNTESTED |
| V076 | Modal M06 | Report Query Modal | Header / Reports -> "Generate Query Report" | Formulates custom institutional report queries | UNTESTED |
| V077 | Modal M07 | Ticker Audit Modal (Equity Analysis) | Click ticker link or Audit button anywhere in terminal | Loads comprehensive technical, fundamental, and sentiment audit | UNTESTED |
| V078 | Modal M08 | Option Detail Modal | Click option contract row in any screener/chain | Shows Greeks (Delta, Gamma, Theta, Vega), IV, payoff profile | UNTESTED |
| V079 | Modal M09 | Income Calculator Modal | Click "Calculate Income" on covered call row | Computes projected return based on contracts, premium, and margin | UNTESTED |
| V080 | Modal M10 | Broker Order Staging Modal | Click "Stage Order" on any recommended trade | Edits action, quantity, limit price, duration, and submits to staging | UNTESTED |
| V081 | Modal M11 | Alert Settings Modal | Click Bell / Alert settings | Configures price, IV rank, and technical breakout alert thresholds | UNTESTED |
| V082 | Modal M12 | Options Trade Quality Simulator | Click "Trade Quality" / "Simulate" | Grades proposed option structure on liquidity, skew, and edge | UNTESTED |
| V083 | Modal M13 | Fundamental Valuation Modal (DCF) | Click "DCF Valuation" on ticker audit | Interactive DCF model with discount rate, growth rate, margin sliders | UNTESTED |

---

## 2. API Endpoints

| # | Area | Item | How to reach | Expected behavior | Status |
|---|------|------|--------------|-------------------|--------|
| A001 | Auth API | POST `/api/auth/login` | Login form submission | Returns session token cookie & user metadata, or 401 on bad credentials | UNTESTED |
| A002 | Auth API | POST `/api/auth/logout` | Logout button click | Clears session cookie, invalidates auth token, returns 200 OK | UNTESTED |
| A003 | Auth API | GET `/api/auth/session` | Client boot / reload session check | Returns current user profile and role or 401 Unauthorized | UNTESTED |
| A004 | Auth API | POST `/api/auth/request-access` | Request Access dialog | Validates email/intent, stores inquiry, returns 200 or 400 | UNTESTED |
| A005 | Auth API | POST `/api/auth/reset-password` | Forgot Password dialog | Initiates password reset flow, sends reset email if configured | UNTESTED |
| A006 | Auth API | POST `/api/auth/reset-password/confirm` | Reset password token link | Verifies reset token and updates password in D1 | UNTESTED |
| A007 | Auth API | POST `/api/auth/change-password` | Mandatory password change form | Updates password for authenticated user, clears `must_change_password` | UNTESTED |
| A008 | User API | POST `/api/user/change-password` | Profile settings password change | Authenticated password change endpoint | UNTESTED |
| A009 | User API | GET/POST `/api/user/data` | Watchlists / custom settings sync | Persists and retrieves encrypted user preferences and watchlist items | UNTESTED |
| A010 | User API | GET/POST `/api/user/digest-preferences` | Morning digest notification settings | Gets or sets user email digest preferences and cadence | UNTESTED |
| A011 | Admin API | GET `/api/admin/users` | Admin user list view | Requires Admin role; returns list of registered users and status | UNTESTED |
| A012 | Admin API | POST `/api/admin/users/create` | Admin user creation form | Requires Admin role; provisions new user account with temporary credentials | UNTESTED |
| A013 | Admin API | POST `/api/admin/users/toggle-status` | Admin user status toggle switch | Requires Admin role; enables or disables user login access | UNTESTED |
| A014 | Admin API | POST `/api/admin/users/reset-password` | Admin reset password button | Requires Admin role; forces password reset for specified user | UNTESTED |
| A015 | Admin API | GET `/api/admin/diagnostics` | Admin system diagnostics panel | Requires Admin role; tests DB connection, KV storage, external APIs | UNTESTED |
| A016 | Admin API | GET `/api/admin/inquiries` | Admin user inquiries panel | Requires Admin role; lists access request inquiries | UNTESTED |
| A017 | Admin API | POST `/api/admin/llm-chain-test` | Admin LLM connectivity tester | Requires Admin role; executes test prompt against configured LLM providers | UNTESTED |
| A018 | Admin API | GET/POST `/api/admin/settings` | Admin system configurations | Requires Admin role; gets or sets global system configuration values | UNTESTED |
| A019 | Market API | GET `/api/market-price` | Symbol lookup / price fetch | Accepts `?symbol=XYZ`; returns real-time quote, change, volume, metrics | UNTESTED |
| A020 | Market API | GET `/api/market-recap` | Market recap view / header pulse | Returns major index quotes, market breadth, and sector breakdown | UNTESTED |
| A021 | Market API | GET `/api/market-sentiment` | Sentiment dashboard widget | Returns Fear & Greed index, put/call ratios, and market mood metrics | UNTESTED |
| A022 | Market API | GET `/api/economic-calendar` | Economic calendar view | Returns macroeconomic events, consensus, and previous figures | UNTESTED |
| A023 | Market API | GET `/api/news/[ticker]` | Ticker news tab | Returns latest news headlines and sentiment for specified ticker | UNTESTED |
| A024 | Options API | POST `/api/analyze-options` | Option screener analysis | Runs options valuation, calculates Greeks and projected return | UNTESTED |
| A025 | Options API | GET/POST `/api/covered-calls` | Covered call screener | Scans holdings or tickers for optimal covered call strike/expiration | UNTESTED |
| A026 | Options API | GET/POST `/api/options/journal` | Options trade journal | Retrieves and logs options trades, PnL, and notes | UNTESTED |
| A027 | Options API | POST `/api/v1/options/screeners/barchart/analyze-watchlist` | Barchart options screener runner | Analyzes watchlist against Barchart screener rules | UNTESTED |
| A028 | Options API | GET `/api/v1/options/tradier/status` | Tradier integration check | Checks Tradier account connectivity and API key validity | UNTESTED |
| A029 | AI Agent API | POST `/api/agent/chat` | AI Strategy Agent chat submit | Multi-lens financial assistant stream/response with tool execution | UNTESTED |
| A030 | Bot API | POST `/api/bot/discord` | Discord webhook / interaction | Handles Discord bot commands and notifications | UNTESTED |
| A031 | System API | GET `/api/version` / `/version` | System build check | Returns current application version, git commit hash, and build timestamp | UNTESTED |

---

## 3. Background Jobs

| # | Area | Item | How to reach | Expected behavior | Status |
|---|------|------|--------------|-------------------|--------|
| B001 | Scheduled Task | Morning Digest Cloudflare Cron | Scheduled trigger: `functions/api/scheduled/morning-digest.js` | Runs at configured morning market hour; generates recap and sends digest emails | UNTESTED |
| B002 | GitHub Actions | Morning Digest Workflow | `.github/workflows/morning-digest.yml` | Scheduled CI workflow dispatching morning market analysis pipeline | UNTESTED |
