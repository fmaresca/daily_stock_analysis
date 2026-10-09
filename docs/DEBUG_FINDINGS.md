# DeltaHarvest Debug Findings & Triage Log

Generated during **Prompt 2 (Static + Contract Test Pass)**.  
Repository: `fmaresca/daily_stock_analysis`  
Date: 2026-10-09

---

## 1. FIXLOG (Prompt 4 Tracking)

| Finding | File(s) changed | Test | Result |
|---------|-----------------|------|--------|
| *Pending Prompt 4 execution* | | | |

---

## 2. Static & Contract Test Summary

- **TypeScript compilation & Vite bundle:** `npm run build` in `web/` passed with **0 errors** across 252 modules in 14.80s.
- **Unit & Contract Suite:** 62 tests across `tests/test_web_financial_math.mjs` (including financial math benchmarks, 31 mocked API contract tests, and 6 component smoke suites) passed with **0 failures**.
- **Security Grep Gates:** Passed (Zero hardcoded secrets, no reset tokens in client code, no admin email exposed in client bundles).

---

## 3. Findings & Failures Identified

### FAIL 1: V075 — WatchlistManagerModal Crash on Empty Watchlist Groups

- **Item in Registry:** `V075` | Modal M05 | Watchlist Manager Modal
- **File / Lines:** `web/src/components/WatchlistManagerModal.tsx`: lines 80 and 385
- **Repro Steps:**
  1. Clear user watchlist storage or initialize with empty groups array (`localStorage.setItem('delta_harvest_watchlists', '[]')`).
  2. Open the Watchlist Manager Modal by clicking "Manage Watchlists".
- **Exact Error:**
  ```text
  TypeError: Cannot read properties of undefined (reading 'name')
      at WatchlistManagerModal (WatchlistManagerModal.tsx:385:31)
  ```
- **Root Cause:**
  `const activeGroup = watchlistGroups.find((g) => g.id === activeGroupId) || watchlistGroups[0];`
  When `watchlistGroups` is empty (`[]`), `activeGroup` evaluates to `undefined`.
  At line 385, `{activeGroup.name}` attempts property access on `undefined` without an optional chain (`activeGroup?.name`) or empty-state guard, throwing an uncaught runtime exception that crashes React component tree rendering.
- **Proposed Surgical Fix (Prompt 4):**
  Add defensive fallback or empty state guard in `WatchlistManagerModal.tsx` so that when `watchlistGroups` is empty, an empty group placeholder is rendered or defaulted gracefully rather than attempting property access on `undefined`.

---

### FAIL 2: V080 — BrokerOrderStagingModal Crash on Undefined PM Capital Savings

- **Item in Registry:** `V080` | Modal M10 | Broker Order Staging Modal
- **File / Lines:** `web/src/components/BrokerOrderStagingModal.tsx`: line 375
- **Repro Steps:**
  1. Stage an option trade where `accountType` is set to `'PORTFOLIO_MARGIN'`, but `capitalSavedByPm` is not provided (or evaluates to `undefined`).
  2. Open the Broker Order Staging Modal for that staged order.
- **Exact Error:**
  ```text
  TypeError: Cannot read properties of undefined (reading 'toLocaleString')
      at BrokerOrderStagingModal (BrokerOrderStagingModal.tsx:375:61)
  ```
- **Root Cause:**
  Line 375 directly invokes `.toLocaleString()` on `stagedOrder.capitalSavedByPm`:
  ```tsx
  {stagedOrder.accountType === 'PORTFOLIO_MARGIN' && (
    <span className="...">
      PM Benefit: +${stagedOrder.capitalSavedByPm.toLocaleString()} Cap. Eff.
    </span>
  )}
  ```
  If `capitalSavedByPm` is `undefined`, accessing `.toLocaleString()` throws an unhandled `TypeError` crashing the modal.
- **Proposed Surgical Fix (Prompt 4):**
  Use optional chaining / fallback: `${(stagedOrder.capitalSavedByPm ?? 0).toLocaleString()}` or check `stagedOrder.capitalSavedByPm != null`.

---

## 4. Static Architecture Observations & ORPHAN Endpoints

The following API paths are invoked by specific frontend client components with local fallback handling, but do not have dedicated Cloudflare Pages Functions implementations under `functions/api/`:

| Endpoint Path | Invoking Component | Status / Client Handling |
|---------------|-------------------|--------------------------|
| `/api/v1/options/agent/audit` | `AIAgentAuditModal.tsx` | ORPHAN on CF Pages: Client catches HTTP error and renders mock/local audit log |
| `/api/v1/options/schwab/auth` | `BrokerAccountSetupModal.tsx` | ORPHAN on CF Pages: Client catches HTTP error and renders manual auth instructions |
| `/api/v1/options/schwab/status` | `BrokerAccountSetupModal.tsx` | ORPHAN on CF Pages: Client catches HTTP error and reports disconnected status |
| `/api/v1/options/watchlists/sync` | `WatchlistManagerModal.tsx` | ORPHAN on CF Pages: Client falls back to `localStorage` store seamlessly |
| `/api/v1/options/snapshot` | `OptionsStrategyLab.tsx` | ORPHAN on CF Pages: Client falls back to client-side Black-Scholes engine |
| `/api/v1/options/recalculate` | `OptionsStrategyLab.tsx` | ORPHAN on CF Pages: Client recalculates Greeks directly in browser |

All of these have graceful fallbacks in the frontend and do not break the UI.

---

## 5. NEEDS-HUMAN Items

None identified in Prompt 2. Both FAIL items are self-contained frontend UI runtime guards and do not require D1 schema modifications or dependency changes.
