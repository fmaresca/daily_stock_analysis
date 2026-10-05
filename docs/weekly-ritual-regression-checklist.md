# DeltaHarvest Institutional Weekly Ritual Regression Checklist

This checklist documents the mandatory behavioral regression test suite to execute against preview or staging deployments before pushing code to the production branch.

---

## Pre-Deployment Verification Protocol

All tests must be conducted while signed in as `admin@deltaharvest.local` (or testing credentials) on a deployed preview environment or local production preview (`npm run preview`).

### 1. Economic Calendar & Macro Catalyst Radar
- [ ] **Current Week Coverage:**
  - Navigate to the **Macro & Catalysts Radar** (Economic Calendar view).
  - Verify that the calendar displays comprehensive events for the entire current trading week (Monday through Friday), rather than a single isolated release.
  - Header high-impact catalyst list matches active week releases (e.g., ISM Services, FOMC Minutes, Jobless Claims, PPI, UoM Sentiment).
- [ ] **Prior Week Archive:**
  - Toggle the scope button to **Past Week Archive**.
  - Verify that the table renders historical actual releases and prints from the prior trading week (e.g. Sep 28 – Oct 2), rather than displaying upcoming-week events.
  - Notice text correctly reads: `Historical US macroeconomic releases & actual prints from previous trading week...`.
- [ ] **Feed Badge & Timestamp Unification:**
  - Top strip/badge and heading display a single, coherent source badge (`🏛️ Nasdaq Live Radar Feed`, `🟢 Forex Factory Live Feed`, `🛡️ High-Impact Curated Schedule`, or `⏪ Past Week Archive`).
  - Exactly one sync timestamp is rendered (`Synced: HH:MM:SS AM/PM ET`), updating synchronously with manual refreshes without ghost labels.
- [ ] **Chronological Date Sort:**
  - Click the **DATE & TIME (ET)** column header.
  - Ascending order must place the earliest event at the top (e.g., Monday 06:00 AM before Friday 10:45 AM).
  - Descending order must place the latest event at the top (e.g., Friday 10:45 AM before Monday 06:00 AM).
  - Confirm date sort operates chronologically across calendar month boundaries.

### 2. MarketChameleon Cascading Screener
- [ ] **Visible As-Of Vintage Date:**
  - Open the **Cascading Screener** and select the **MarketChameleon** tab.
  - Verify the as-of timestamp/vintage date is prominently visible.
- [ ] **Interactive Filter Updates:**
  - Adjust the preset filter (e.g., toggle CBOE Weekly gate or change search query).
  - Results update reactively and reflect filtered counts accurately.
- [ ] **Market Cap Column Populated:**
  - The **Market Cap** column must display formatted market capitalization (e.g. `$137.0B`, `$45.5B`, `$9.3B`) for every row where data is present.
  - No column renders `—` across 100% of rows.
- [ ] **Numeric Price & Market Cap Sorting:**
  - Clicking **Price** or **Market Cap** sorts records strictly by numerical magnitude (e.g. `$137.0B` > `$45.5B` > `$9.3B`), not lexicographically.

### 3. Tradier Server-Side Provisioning & Secret Hygiene
- [ ] **Settings Modal Status:**
  - Open **Settings & APIs** -> **Tradier API Settings**.
  - Status renders `Active (Server-Provisioned Primary)` when server provisioning is active.
  - The browser access token input field remains completely blank/empty (tokens are not echoed into client state).
- [ ] **Network Request URL Audit:**
  - Open DevTools Network panel and trigger market quotes or calendar refresh.
  - Verify that **no** request URL, query parameter, or client header leaks any raw API token or secret.

### 4. Public Inquiry & Access Dialogs
- [ ] **No Client-Side Email Exposure:**
  - Sign out to the login page.
  - Open **Request Institutional Access / Support** modal.
  - Inspect UI and HTML elements for New Account, Password Reset, and Maintenance inquiry forms.
  - Confirm **no administrative email address** is displayed in the UI or bundled into client source maps. Routing is handled entirely server-side.

### 5. Server-Side Administrative Notifications
- [ ] **D1 & Worker Configuration:**
  - Admin notification recipient is configured strictly in server-side environment variables or Cloudflare D1 settings.
  - Delivery verification confirms routing to server destination without client leaks.

### 6. Session Hygiene & Security Claims
- [ ] **Clean Session Payloads:**
  - Inspect `localStorage` and `sessionStorage` in DevTools Application tab.
  - Verify stored session objects contain no internal database account UUIDs, sensitive system credentials, or unencrypted keys.
- [ ] **UI Security Claim Alignment:**
  - Verify all security statements (Zero-Tracker, Non-Custodial, Local Token Storage) align precisely with implemented system behavior.

### 7. Session Termination & Sign-Out
- [ ] **Sign-Out Reliability:**
  - Click **Sign Out** from the user menu.
  - Ensure the session terminates cleanly, authorization tokens are purged from client memory, and the application immediately routes back to the `/login` view.
  - Attempting to navigate back with the browser button redirects back to `/login`.
