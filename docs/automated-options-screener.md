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

### 2.1 Options Trade Quality Simulator & ATM Straddle Implied Move
When an earnings announcement falls within the options expiration period ($t_{\text{today}} \le t_{\text{earnings}} \le t_{\text{exp}}$), the **Options Trade Quality Simulator** automatically detects the event and factors in the expected binary move:
- **ATM Straddle Implied Move**:
  $$\text{Straddle Move (\%)} = 0.65 \times \text{IV}_{\text{event}} + 0.35 \times \text{HistoricalEarningsMove}_{\text{avg}}$$
  $$\text{Straddle Dollar Move} = S \times \text{Straddle Move (\%)} = C_{\text{ATM}} + P_{\text{ATM}}$$
- **Earnings-Defended Strike Formulation**:
  - **Cash-Secured Put (CSP)**: Must clear the lower straddle bound with a 15% safety buffer:
    $$\text{Strike}_{\text{CSP, Defended}} \le S - \text{Straddle Dollar Move} \times 1.15$$
  - **Covered Call (CC)**: Must clear the upper straddle bound with a 15% safety buffer:
    $$\text{Strike}_{\text{CC, Defended}} \ge S + \text{Straddle Dollar Move} \times 1.15$$
- **100-Point Scoring Model Reward**: Defended trades that clear the straddle move are protected from binary gap breaches and receive only a mild -12 pt event penalty, passing the risk gate instead of triggering a hard -40 pt disqualification.
- **Automated Live Earnings Calendar Retrieval & Latency Pause**:
  For tickers not pre-stored in the local earnings registry, the simulator automatically pauses to query multi-source financial and SEC disclosure feeds (via Yahoo Finance quoteSummary calendarEvents, v7 quote timestamps, and corporate reporting calendars). A prominent in-flight progress banner (`⏳ Pausing to fetch corporate earnings calendar for {symbol}...`) alerts the user to the network lookup so the ATM Straddle Implied Move and Earnings-Defended Strike are accurately computed and cached.

### 2.2 4-Tab Options Trade Quality Simulator Architecture

The **Options Trade Quality Simulator** (`OptionsTradeQualitySimulator.tsx`) is structured into four specialized institutional tabs:

| Tab | Component Engine | Core Metrics & Mathematical Models |
| :--- | :--- | :--- |
| **📊 Tab 1: Scoring & Sliders** | `renderScoringTab()` | 100-Point Composite Score, DTE/Delta/IVR sliders, Dual-Yield Blueprint: <br/>• **Static Yield**: $Y_{\text{static}} = \frac{C}{S}$<br/>• **Assigned Yield**: $Y_{\text{assigned}} = \frac{C + (K - S)}{S}$<br/>• **AROC**: $\frac{\text{Premium}}{\text{Strike}} \times \frac{365}{\text{DTE}}$ |
| **📈 Tab 2: Expiration Payoff** | `renderPayoffTab()` | Interactive P&L curve across price vectors ($S \in [0.7K, 1.3K]$), calculating exact Break-Even ($S_{\text{BE}} = K - P$ for CSP, $S - C$ for CC), Max Profit Cap, and Downside Assignment zone. |
| **🔄 Tab 3: Defensive Roll Matrix** | `renderRollTab()` | Down-and-out credit roll calculator triggered when spot tests within 2.5% of strike or $|\Delta| \ge 0.40$. Evaluates rolls across 7, 14, 21, and 30 DTE expansions, computing net credit to lower cost basis. |
| **🛡️ Tab 4: Volatility & Dividend Guard** | `renderVolDividendTab()` | • **Variance Risk Premium**: $\text{VRP} = \text{IV} - \text{RV}_{30\text{d}}$<br/>• **Dividend Early Exercise Risk**: Flags hazard if $t_{\text{ex-div}} \le t_{\text{exp}}$ and $C_{\text{extrinsic}} < \text{Dividend}$. |

### 2.3 Tax Alpha & IRC Subchapter P Gateway Integration

Options trades are audited through the 5-Gateway Statutory Framework:
1. **IRC §1256 Non-Equity Index Contracts**: SPX, NDX, RUT, XSP options receive 60% Long-Term / 40% Short-Term capital gains rates (max blended ~26.8% vs. 40.8% ordinary). Single-stock equity options and ETFs (SPY, QQQ) do *not* qualify.
2. **IRC §1092 Qualified Covered Calls (QCC)**: Enforces $> 30$ DTE and non-deep-ITM strike benchmarks to prevent straddle loss-deferral rules and preserve stock holding period clocks.
3. **IRC §1091 Wash Sales**: 61-day window tracking to disallow losses when substantially identical option contracts are re-entered.

### 2.4 Live Access Points & Interactive Hyperlinks

Users can launch these capabilities directly from anywhere in the application:
- **Options Trade Quality Simulator**: Open via the `Trade Quality Simulator` button in the top toolbar, the `Options > Simulator` tab, or from chapter hyperlinks in the Help Handbook.
- **Tax Alpha Optimizer**: Available at `InstitutionalSidebar` &rarr; `Tactical Tools` &rarr; `Tax Alpha (1256)`, or via route `OPTIONS` &rarr; `TAX_ALPHA_OPTIMIZER`.
- **Defensive Roll Assistant**: Available at `InstitutionalSidebar` &rarr; `Tactical Tools` &rarr; `Roll Assistant`, or via route `OPTIONS` &rarr; `DEFENSIVE_ROLL_ASSISTANT`.
- **Portfolio Margin Simulator**: Available at `InstitutionalSidebar` &rarr; `Tactical Tools` &rarr; `Portfolio Margin`, or via route `OPTIONS` &rarr; `PORTFOLIO_MARGIN_SIM`.
- **In-App Help Handbook**: Click `? Help` in the top right to access Chapter 14 (*Options Trade Quality Scoring & 4-Tab Simulator*) and Chapter 15 (*Institutional Derivatives Tax Alpha & IRC Subchapter P Audit*).

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
