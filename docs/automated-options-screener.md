# AI Options Income Screener (Gemini Extended Thinking)

## 1. Overview

The **AI Options Income Screener** is an institutional quantitative options engine integrated into DeltaHarvest. It bridges market data screeners (such as Barchart Direction Strength View 190898, MarketChameleon Weekly Options, and custom watchlists) with **Google Gemini 2.5 Flash / 2.0 Pro** running in **Extended Thinking Mode** (`thinking_level: HIGH`).

The screener enforces mathematical constraints for selling **Cash-Secured Puts (CSP)** and **Covered Calls (CC)**, auditing candidates against dynamic technical support/resistance anchors, earnings event windows, bid/ask spreads, and annualized return on capital (AROC).

---

## 2. Quantitative Screening Rules & Constraints

Every underlying equity is evaluated against institutional rules:

| Parameter | Cash-Secured Put (CSP) | Covered Call (CC) |
| :--- | :--- | :--- |
| **DTE Target** | 5–10 DTE (Nearest Weekly Expiration) | 5–10 DTE (Nearest Weekly Expiration) |
| **Delta Range** | -0.15 to -0.30 (80%–85% win probability) | +0.15 to +0.30 |
| **Safety Cushion** | 3.5% to 6.0% below current spot | Strike &ge; dynamic resistance |
| **Technical Anchor** | Strike &le; support (20/50 SMA, swing low) | Strike &ge; resistance (upper BB, 50 SMA) |
| **Volatility Floor** | IV Rank &gt; 35% | IV Rank &gt; 30% |
| **Min AROC %** | &ge; 15.0% annualized | &ge; 12.0% annualized |
| **Earnings Blackout** | **Strict Rejection** if earnings during cycle | **Strict Rejection** if earnings during cycle |
| **Liquidity Gate** | Open Interest &gt; 100, Spread &le; 10% of bid | Open Interest &gt; 100, Spread &le; 10% of bid |

### Annualized Return on Capital (AROC) Formula:
$$\text{AROC (\%)} = \left( \frac{\text{Expected Premium}}{\text{Strike Price}} \times \frac{365}{\text{DTE}} \right) \times 100$$

---

## 3. Gemini Extended Thinking Mode (`thinking_level: HIGH`)

Standard LLMs frequently hallucinate delta-to-strike relationships and overlook nearby earnings dates. By enforcing `thinking_config: { thinking_level: "HIGH" }` and explicit prompt thinking mandates:
- The model executes deep step-by-step mathematical reasoning.
- It validates the downside cushion percentage and AROC math before generating the final JSON payload.
- It identifies why specific tickers failed (e.g. "Earnings in 3 days; binary event risk" or "AROC 9.2% is below 15% threshold") and generates a structured audit log of rejected candidates.

---

## 4. Zero-Billing Guarantee & Pro Plan Bridge ($0 Cost)

To ensure users on consumer **Google Gemini Pro** subscriptions (`gemini.google.com`) are **never billed for developer API usage or overages**, DeltaHarvest provides a 1-click prompt-and-import bridge:

1. **Copy Prompt for Gemini Pro Plan ($0 Cost)**:
   - Clicking this button bundles the raw screener data, institutional constraints, and strict JSON schema into your clipboard.
2. **Execute in Web Interface**:
   - Open `gemini.google.com` (under your existing consumer subscription) with Thinking Mode enabled, paste the prompt, and let Gemini reason.
3. **Import Gemini JSON**:
   - Click "Import Gemini JSON" in the DeltaHarvest header, paste the response, and immediately populate the interactive decision table, metrics badges, and audit cards.

Additionally, for direct API execution, requests use Google AI Studio's Free Tier with client-side HTTP 429 detection and zero-billing notices.

---

## 5. Dual-Runtime Architecture

```
                       ┌──────────────────────────────┐
                       │   OptionsIncomeAnalyzer.tsx   │
                       │          (Frontend)          │
                       └──────────────┬───────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   [Production Environment]                        [Local Development]
 Cloudflare Pages Edge Function                   FastAPI Local Backend
  /functions/api/analyze-options.js               POST /api/v1/options/analyze-options
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      ▼
                        Google Gemini API (Thinking Mode)
                     POST https://generativelanguage.googleapis.com
```

- **Cloudflare Pages (`functions/api/analyze-options.js`)**: Executes on Cloudflare edge workers with zero server maintenance and automatic CORS handling.
- **FastAPI (`api/v1/endpoints/options.py`)**: Local development endpoint providing identical request/response schemas, API key validation, and thinking config support.
- **Automatic Fallback Routing**: If `/api/analyze-options` is unreachable, the frontend automatically falls back to `/api/v1/options/analyze-options`.

---

## 6. Verification & Test Suite

### Backend Tests
```bash
python -m unittest tests/test_options_analyzer_api.py
```
Validates:
- Request schema parsing (Pydantic validation).
- Missing API key helpful guidance (Zero-Billing bridge recommendation).
- Empty payload rejection.
- Mocked Gemini thinking mode execution and JSON response structure.

### Frontend Build
```bash
cd web
npm run build
```
Ensures TypeScript (`tsc -b`) and Vite production bundling compile cleanly with zero errors.
