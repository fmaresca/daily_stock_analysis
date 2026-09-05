# Institutional Gemini Pro / Thinking Mode Options Prompt & Workflow Guide

## 1. Context & Architecture Evolution

### The Legacy Workflow vs. The Modern DeltaHarvest App Architecture

In the legacy workflow, an options trader had to manually export data from ThinkorSwim, Barchart, and MarketChameleon into an Excel workbook (`WeeklyStockScreener_MM_DD_YYYY.xlsx`) across separate tabs (`ThinkorSwim`, `Barchart`, `MktChameleon`, `Investments`), then attach the workbook to an LLM with code interpreter or Python execution capabilities and ask the model to:
1. Parse the Excel file with Python (`openpyxl` / `pandas`).
2. Filter tickers across sheets.
3. Guess an arbitrary fixed cash pool (e.g. static `$300,000.00`).
4. Format the output.

### Why This is Now Obsolete & How DeltaHarvest Upgrades It

DeltaHarvest replaces this entire manual cycle with a **unified, real-time, closed-loop pipeline**:

1. **Native Pre-Screened Data Synthesis (Step 3 & 4)**:
   - **ThinkorSwim (TOS)**: Directly imported or pre-filled in the Watchlist Console.
   - **Barchart View 190898**: 100% Directional Strength, 13-indicator technical consensus, and short-term trend scores.
   - **MarketChameleon**: Momentum, IV30, Uptrend confirmation, and official CBOE Weekly Options directory tags.
   - **Live Pricing & Greeks**: Black-Scholes Delta (-0.16 to -0.22 sweet spot), 14-day blended RSI, 20 SMA, 2-SD lower Bollinger Bands, and earnings calendar runway.

2. **True Dynamic Capital Ledger (Step 1)**:
   - Eliminates static `$300,000` assumptions.
   - Automatically computes:
     $$\text{Deployable Free Cash} = \text{Total Liquid Cash} - \$5,000\text{ (Weekly Living Disbursements)} - \text{Committed Active CSP Collateral}$$
   - Strictly enforces the **$200,000 maximum collateral per single equity security** (`Strike * 100 * Contracts <= $200,000`).
   - Dynamically sizes concurrent positions (capped at **5 max**).

3. **Zero Python / Zero Attachment Requirement**:
   - The app pre-filters and formats all qualifying candidates with live metrics into clean, structured Markdown.
   - You can copy the generated prompt in 1 click and paste it into any Gemini Pro or Gemini Thinking window at [gemini.google.com](https://gemini.google.com) (at **$0 marginal cost** with personal Google Gemini accounts).

4. **1-Click Closed-Loop Trade Ingestion**:
   - Gemini's Markdown response is parsed by DeltaHarvest's `parseGeminiMarkdownTables` engine.
   - Recommended trades in **TABLE 1** are rendered with interactive cards and a **"⚡ 1-Click Stage into Broker Workbench"** button that populates Schwab or IBKR bracket orders with 80% profit targets.

---

## 2. The Modified & Stored Institutional Prompt

Below is the complete adapted prompt template generated dynamically by [`geminiPromptTemplates.ts`](file:///c:/Frank/DailyStock/web/src/utils/geminiPromptTemplates.ts) and [`CascadingScreenerView.tsx`](file:///c:/Frank/DailyStock/web/src/components/CascadingScreenerView.tsx):

```markdown
**Role & Objective:**
You are an institutional options portfolio manager. Analyze the pre-screened candidate universe and real-time market data provided below (synthesized directly from DeltaHarvest's ThinkorSwim, Barchart View 190898, and MarketChameleon quantitative feeds) and generate an options income report for cash-secured puts (CSPs) expiring on [Target Expiration Date, e.g., September 11, 2026] utilizing the available deployable cash pool of $[Deployable Free Cash, e.g., 550,000.00].

**Portfolio Capital & Risk Parameters (From DeltaHarvest Cash Ledger):**
- Total Liquid Cash Balance: $[Total Cash, e.g., 555,000.00]
- Encumbered Weekly Living Disbursements: $[Disbursements, e.g., 5,000.00] (Deducted upfront)
- Committed Active CSP Collateral: $[Committed Collateral, e.g., 0.00]
- Deployable Free Cash Pool: $[Deployable Free Cash, e.g., 550,000.00] (Available for new trades)
- Target Position Allocation: $[Target Allocation, e.g., 110,000.00] per trade
- Single Equity Position Limit: $200,000.00 STRICT LIMIT (No single equity security CSP collateral may exceed $200,000.00)
- Maximum Concurrent Positions: Up to [Max Positions, e.g., 5] positions (Strictly capped at 5 max)

**Execution Protocol (Mandatory):**
1. Candidate Universe: Evaluate only the candidates provided in the data payload below. All candidates already have Weekly Options = "Yes", 14-Day RSI <= 70, average daily volume >= 500k shares, and no earnings during the target expiration week ([Target Expiration Date]).
2. Fallback Ranking: Rank qualifying candidates by:
   (a) Barchart Short-Term Directional Consensus = "100% Buy" (or highest available conviction),
   (b) 9/18-day EMA confirming uptrend ("Strongest" / "Strengthening" / MarketChameleon "Uptrend"),
   (c) IV Rank >= 35% / elevated IV for maximum volatility risk premium capture.
3. Capital Sizing Algorithm:
   - Target Strike: ~0.16 to 0.22 Delta (must sit below confirmed technical support and 2-SD lower Bollinger Band).
   - Capital Pool: Exactly $[Deployable Free Cash] available cash collateral.
   - Sizing Methodology: Inverse-volatility risk parity (allocate higher dollar percentages to lower-IV, high-conviction underlying assets).
   - Single Equity Cap: Under NO circumstances may the collateral for any single equity security exceed $200,000.00 (Collateral = Strike * 100 * Contracts).
   - Discrete Contracts: Solve for integer contracts such that Total Capital Committed <= $[Deployable Free Cash], maintaining a positive cash reserve.

**Consolidated Screener Data Payload (ThinkorSwim + Barchart + MarketChameleon):**
1. Symbol: NVDA | Spot: $125.50 | Suggested Strike: $118.00 | Delta: -0.18 | Bid/Ask: $1.40/$1.50 | Est. Prem: $1.45 | IV: 38.2% | IV Rank: 48% | 14D RSI: 58 | Cushion: 6.0% | Trend: Uptrend | Barchart: 100% Buy (Strongest) | Volume: 45,000k | Next Earnings: None during expiration week
2. Symbol: MSFT | Spot: $445.00 | Suggested Strike: $425.00 | Delta: -0.19 | Bid/Ask: $2.10/$2.20 | Est. Prem: $2.15 | IV: 22.5% | IV Rank: 42% | 14D RSI: 52 | Cushion: 4.5% | Trend: Uptrend | Barchart: 100% Buy (Strongest) | Volume: 21,000k | Next Earnings: None during expiration week
3. Symbol: AAPL | Spot: $225.00 | Suggested Strike: $215.00 | Delta: -0.20 | Bid/Ask: $1.80/$1.90 | Est. Prem: $1.85 | IV: 21.0% | IV Rank: 39% | 14D RSI: 61 | Cushion: 4.4% | Trend: Uptrend | Barchart: 100% Buy (Strongest) | Volume: 38,000k | Next Earnings: None during expiration week
[... additional screened candidates from active watchlist ...]

**Output Structure Required (Strict Markdown Format for Direct DeltaHarvest Ingestion):**
- Lead with an Executive Summary summarizing total premium captured, portfolio return on capital (weekly and annualized), and remaining cash balance.
- ThinkorSwim Pricing Verification Disclaimer.
- TABLE 1: RECOMMENDED TRADES (FINAL CANDIDATES)
  Columns: Risk Rank | Stock Symbol | Current Price | IV | 14-Day RSI | Suggested Strike | Option Delta | OTM Cushion | Contracts | Collateral Committed | % of Pool | Est. Premium / Share | Total Premium | Weekly ROC | Annualized ROC
  *Must include a TOTALS row, remaining unallocated cash balance, and formula definitions.*
- Technical, support, and earnings runway justifications for each selected trade (explain why the strike sits at or below key support).
- TABLE 2: BORDERLINE CANDIDATES (Symbol, Current Price, Trend Str/Dir, 14D RSI, Earnings Date, Reason).
- TABLE 3: EXCLUDED CANDIDATES (Symbol, Current Price, Specific Exclusion Rule Failed).
```

---

## 3. Field-by-Field Mapping: How DeltaHarvest Feeds the Prompt

| Prompt Parameter | DeltaHarvest Source | How It Operates |
| :--- | :--- | :--- |
| **Deployable Cash Pool** | `capitalState.freeCash` | Automatically computed after subtracting weekly living disbursements (`$5,000`) and open CSP collateral. |
| **Single Equity Cap** | `$200,000.00 STRICT LIMIT` | Hardcoded portfolio governance rule ensuring no single position causes catastrophic concentration risk. |
| **Max Concurrent Positions** | `min(5, floor(Free Cash / Target Allocation))` | Capped at 5 maximum trades to ensure diversification across sectors. |
| **Candidate Universe** | Screeners Step 3 + Cascading Gates | Consolidates ThinkorSwim Watchlists, Barchart Top 1% View 190898, and MarketChameleon Momentum into one deduplicated list. |
| **Suggested Strike & Delta** | Black-Scholes Engine | Evaluates real-time spot price and calculates the 0.16–0.22 Delta strike sitting below key support and lower Bollinger Band. |
| **Target Expiration** | Calendar Friday Engine | Automatically targets the upcoming weekly Friday expiration (e.g. 5–7 DTE). |

---

## 4. Parser Resilience & Table Ingestion

When Gemini outputs the response, simply paste the full Markdown into the **"Gemini Thinking Mode Ingestion"** box in **Step 4: Cascading Screener**. DeltaHarvest's upgraded [`parseGeminiMarkdownTables`](file:///c:/Frank/DailyStock/web/src/utils/capitalAndTaxLedger.ts) handles:
1. **Dynamic Header Detection**: Inspects column names rather than relying on brittle index positions, so all 15 institutional columns are accurately mapped.
2. **Automatic Totals Exclusion**: Skips summary rows (`TOTALS`, `REMAINING CASH: $...`) so they are not misinterpreted as trade tickers.
3. **1-Click Broker Workbench Staging**: Generates an `OptionOpportunity` with exact strike, collateral, contracts, and premium for instant preview in the order workbench.
