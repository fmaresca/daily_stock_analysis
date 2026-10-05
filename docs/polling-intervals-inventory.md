# Polling Intervals and Live Feeds Inventory

This document provides a comprehensive inventory of all background polling timers, countdown intervals, and WebSocket connections in the DeltaHarvest Institutional platform.

## Policy & Safeguards
- **Minimum Polling Threshold:** No automated background service is permitted to poll network endpoints faster than **15 seconds** unless it drives an active, user-visible real-time live feed explicitly enabled by the user.
- **Battery & Server Quota Conservation:** All market syncs are market-hours gated (09:30 AM – 04:00 PM US Eastern Time) and paused when the browser tab is idle or backgrounded.

---

## 1. Automated Network Polling & Live Feeds

| Service / Hook | Target Endpoint | Default Cadence | Configurable Options | Gating / Safeguards |
| :--- | :--- | :--- | :--- | :--- |
| **Options Market Auto-Sync** (`web/src/hooks/useOptionsData.ts`) | `/api/v1/options/recalculate` or Yahoo / Tradier quotes | **300 s (5 min)** | 120 s (2 min), 300 s (5 min), 600 s (10 min), 0 (Disabled) | Strictly paused outside US market hours (09:30 – 16:00 ET) via `isUsMarketOpen()`. Backed by client-side throttle guard. |
| **Tradier WebSocket Stream** (`web/src/hooks/useOptionsData.ts`) | `wss://ws.tradier.com/v1/markets/events` or `ws://127.0.0.1:8000/ws/market-stream` | Event-driven WebSocket | Enabled only when live stream configured | Skipped on static Cloudflare Pages CDN. Reconnect backoff with exponential delay. |
| **Economic Calendar** (`web/src/components/EconomicCalendarView.tsx`) | `/api/economic-calendar` / Cloudflare Edge | **On-demand** (navigation / manual click) | Manual refresh button | Client-side `sessionStorage` cache (30-minute TTL). Revisits render immediately from cache with zero initial network latency. |
| **News Feed** (`web/src/components/NewsCompactFeed.tsx`) | `/api/news/{ticker}` | **On-demand** (selected ticker change) | Manual click | Cached per active ticker session. |

---

## 2. Client-Side Only Timers (Zero Network Traffic)

| Component / Utility | Interval | Purpose | Network Calls |
| :--- | :--- | :--- | :--- |
| **Market Clock Display** (`web/src/hooks/useMarketClock.ts`) | 10 s | Updates header clock and market session status badge (`OPEN`, `CLOSED`, `PRE-MARKET`) | **0** (purely local `new Date()` calculation) |
| **Continuous Risk Sweeper** (`web/src/utils/continuousRiskSweeper.ts`) | 60 s | Evaluates open positions stored in local memory against stop loss & early assignment risk | **0** (in-memory arithmetic) |
| **Auto-Sync Countdown Ticker** (`web/src/hooks/useOptionsData.ts`) | 1 s | Decrements visual countdown bar for scheduled 300s sync cycle | **0** (local UI state only) |

---

## 3. Compliance Summary
- **Fastest Automated Network Polling:** 120 seconds (Option Auto-Sync fast cadence), well above the 15-second minimum threshold.
- **Data & Battery Tax:** Zero uncontrolled network loops. All network interactions are throttled, cached, or user-initiated.
