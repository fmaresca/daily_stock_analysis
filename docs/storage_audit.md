# DeltaHarvest Browser Storage Audit

*Date: 2026-09-26*
*Reference: Prompt 3 Acceptance Criteria & Security Sweep Remediation*

This document audits all web browser storage mechanisms (`localStorage` and `sessionStorage`) utilized across the DeltaHarvest Institutional terminal.

---

## 1. Executive Summary & Policy

- **No Passwords or Hashes:** Plaintext passwords, unsalted SHA-256 hashes, and local password comparison routines have been completely eradicated.
- **No Long-Lived Sensitive Broker Keys in `localStorage`:** All live broker access keys (Tradier API token, Charles Schwab App Key and App Secret) have been migrated strictly to ephemeral `sessionStorage`. They are destroyed when the user closes their browser or signs out.
- **No Persistent PII or Session Objects:** The legacy `deltaharvest_auth_user` and `deltaharvest_local_users` keys are actively purged on terminal startup and session termination. All session authenticity is managed via server-validated tokens/cookies.
- **Zero False Encryption Claims:** All misleading UI copy claiming "encrypted localStorage" or "private browser encryption" has been replaced with accurate, plain-language descriptions of browser-local storage semantics.

---

## 2. Storage Inventory

### A. Ephemeral `sessionStorage` (Wiped on Tab/Browser Close & User Logout)

| Key | Data Type | Purpose & Contents | Security Justification |
| :--- | :--- | :--- | :--- |
| `tradier_api_key` | String | User's live or sandbox Tradier API bearer token used to query options market chains and stock valuation feeds. | Ephemeral only. Kept in memory/session for the active trading session; wiped upon logout or tab closure. |
| `tradier_enabled` | Boolean (`"true"` / `"false"`) | Flag indicating whether Tradier live data integration is toggled on. | Non-sensitive runtime UI preference. |
| `tradier_use_sandbox` | Boolean (`"true"` / `"false"`) | Flag indicating whether Tradier queries route to the sandbox environment. | Non-sensitive runtime toggle. |
| `schwab_app_key` | String | Schwab developer API client ID for account synchronization. | Ephemeral developer credential; wiped upon logout or tab closure. |
| `schwab_app_secret` | String | Schwab developer API secret. | Ephemeral developer credential; wiped upon logout or tab closure. |
| `schwab_callback_url` | String | OAuth redirection URL registered with Schwab developer portal. | Ephemeral configuration string. |
| `schwab_enabled` | Boolean (`"true"` / `"false"`) | Flag indicating whether Schwab API connectivity is activated. | Non-sensitive runtime toggle. |
| `dh_eb_chunk_reload` | String (Timestamp) | Guard to prevent infinite reload loops during dynamic chunk update errors. | Transient application error recovery state. |

---

### B. Persistent `localStorage` (Non-Sensitive Working Models & User UI Preferences)

| Key | Data Type | Purpose & Contents | Sensitive Data / PII Present? |
| :--- | :--- | :--- | :--- |
| `deltaharvest_theme` | String (`'dark'` \| `'light'`) | User interface theme preference. | **None** |
| `deltaharvest_active_group_id` | String (UUID / ID) | Currently selected watchlist group identifier. | **None** |
| `deltaharvest_watchlist_groups` | JSON Array | User's organized watchlist groups (names and ticker symbol arrays). | **None** |
| `deltaharvest_tos_barchart_watchlist` | JSON Array | List of ticker symbols imported from ThinkorSwim / Barchart watchlist scans. | **None** |
| `deltaharvest_mc_screen_data` | JSON Array | Cached MarketChameleon pre-screened ticker candidates and criteria for the current week. | **None** (Public market data) |
| `deltaharvest_mc_screener_presets` | JSON Array | Saved custom filter presets for MarketChameleon prescreen. | **None** |
| `deltaharvest_barchart_screen_data` | JSON Array | Cached Barchart high-implied-volatility ticker screening metrics. | **None** (Public market data) |
| `deltaharvest_gemini_raw_markdown` | String | AI-generated market commentary and options income strategy analysis markdown. | **None** (Public analysis) |
| `deltaharvest_gemini_parsed_screen` | JSON Array | Structured trade candidate objects parsed from the AI screening run. | **None** (Public market analysis) |
| `deltaharvest_harvest_target_delta` | Number | User's preferred option target delta (e.g., 0.18) for candidate screening. | **None** (UI parameter) |
| `deltaharvest_portfolio_book` | JSON Array | Working list of portfolio positions (CSP/CC/Equities) used in stress testing and risk simulations. | **None** (Synthetic demo positions or user-entered working models; not tied to real identities or live broker sync) |
| `deltaharvest_capital_ledger` | JSON Object | Working cash allocation, target position budgets, and weekly living expense planning model. | **None** (Local planning ledger initialized to demo baseline) |
| `deltaharvest_submitted_orders` | JSON Array | Local history of staged or recorded options orders for tracking workflow execution. | **None** (Simulation and staging records) |
| `deltaharvest_earnings_cache` | JSON Object | Cache of corporate earnings dates to avoid redundant external network lookups. | **None** (Public financial calendars) |
| `deltaharvest_last_live_fetch` | String (ISO Date) | Timestamp of the most recent options market chain refresh. | **None** (Timestamp) |
| `deltaharvest_live_payload` | JSON Object | Cached options quotes (delta, bid, ask, open interest) for active tickers. | **None** (Public market quotes) |
| `deltaharvest_ytd_reconciliation_confirmed` | Boolean | Confirmation flag indicating the user has reviewed annual carryover tax numbers. | **None** |

---

### C. Deprecated & Purged Legacy Keys

The following keys from previous revisions have been deprecated and are explicitly purged on initialization and logout:

1. `deltaharvest_local_users`: **PERMANENTLY PURGED**. Previously stored plaintext user records and passwords in the browser. Fully eliminated; user verification is strictly server-side.
2. `deltaharvest_auth_user`: **PERMANENTLY PURGED**. Previously stored full user profile JSON in `localStorage`. Replaced with server-issued session authentication.
3. `tradier_api_key` (in `localStorage`): **REMOVED FROM PERSISTENT STORAGE**. Moved to `sessionStorage` and wiped if detected in `localStorage`.
4. `schwab_app_key` / `schwab_app_secret` (in `localStorage`): **REMOVED FROM PERSISTENT STORAGE**. Moved to `sessionStorage` and wiped if detected in `localStorage`.
