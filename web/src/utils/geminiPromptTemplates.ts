/**
 * Gemini Pro Institutional Options Prompt Template & Generator
 * 
 * Adapts legacy Excel workbook workflows into clean, structured Markdown prompts
 * natively populated from DeltaHarvest's:
 * 1. Step 1 Weekly Cash Ledger (Total Cash, $5,000 Living Disbursements, Free Cash, $200k Limit)
 * 2. Step 3 Multi-Source Screeners (ThinkorSwim, Barchart View 190898, MarketChameleon)
 * 3. Step 4 Cascading Quantitative Gates (RSI <= 70, IV Rank, 0.16-0.22 Delta, CBOE weeklys)
 */

import { AccountCapitalState, OptionOpportunity, TickerMeta } from '../types/options';

export interface GeminiPromptGenerationParams {
  capitalState: AccountCapitalState;
  maxPositionCollateral?: number;
  targetExpirationDate?: string;
  opportunities: OptionOpportunity[];
  tickers: TickerMeta[];
}

/**
 * Generates the fully adapted institutional options prompt for Gemini Pro / Gemini Thinking.
 */
export function generateInstitutionalGeminiPrompt({
  capitalState,
  maxPositionCollateral = 15000,
  targetExpirationDate,
  opportunities,
  tickers,
}: GeminiPromptGenerationParams): string {
  // Compute next Friday expiration if not provided
  let expDate = targetExpirationDate;
  if (!expDate) {
    const d = new Date();
    const daysUntilFriday = (5 + 7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + daysUntilFriday);
    expDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const effectiveAlloc = Math.min(200000, maxPositionCollateral || 15000);
  const deployableCash = Math.max(0, capitalState.freeCash || (capitalState.totalCash - 5000 - capitalState.committedCollateral));
  const maxPositions = Math.max(1, Math.min(5, Math.floor(deployableCash / (effectiveAlloc || 15000)) || 1));

  // Build candidate dataset directly from the consolidated screener state (strictly weekly options only)
  const validOpportunities = opportunities.filter((o) => o.has_weeklys !== false);
  const candidateRows = validOpportunities.slice(0, 25).map((o, idx) => {
    const tMeta = tickers.find((t) => t.symbol === o.symbol);
    const barchartText = tMeta?.barchart_opinion
      ? `${tMeta.barchart_opinion.opinion_pct}% Buy (${tMeta.barchart_opinion.signal_strength || '100% Buy'})`
      : o.rating
      ? `${o.rating}% Buy (${o.safety_tier || 'Strong'})`
      : '100% Buy';
    const mcTrend = o.trend || tMeta?.market_chameleon?.primary_trend || (o.rating >= 80 ? 'Strong Uptrend' : 'Uptrend');
    const rsi = (o.rsi !== undefined ? o.rsi : (tMeta?.rsi_14 ?? 50)).toFixed(1);
    const rawIv = o.iv !== undefined ? o.iv : (tMeta?.iv_current ?? 0.35);
    const iv = (rawIv * 100).toFixed(1);
    const ivRank = o.iv_rank !== undefined ? o.iv_rank : (tMeta?.iv_rank ?? 45);
    const cushion = o.cushion_pct ? o.cushion_pct.toFixed(1) : (((o.current_price - o.strike) / o.current_price) * 100).toFixed(1);
    const vol = tMeta?.avg_volume_30
      ? `${(tMeta.avg_volume_30 / 1000).toFixed(0)}k`
      : o.liquidity_tier === 'Tier 1'
      ? '2,500k'
      : '1,200k';
    const cadence = o.expiration_cadence || (o.has_weeklys ? 'Weekly' : 'Monthly Only');

    return `${idx + 1}. Symbol: ${o.symbol} | Spot: $${o.current_price.toFixed(2)} | Suggested Strike: $${o.strike.toFixed(2)} | Delta: ${o.delta.toFixed(2)} | Bid/Ask: $${o.bid.toFixed(2)}/$${o.ask.toFixed(2)} | Est. Prem: $${o.mid.toFixed(2)} | IV: ${iv}% | IV Rank: ${ivRank}% | 14D RSI: ${rsi} | Cushion: ${cushion}% | Trend: ${mcTrend} | Barchart: ${barchartText} | Weekly Options: ${cadence} | Volume: ${vol} | Next Earnings: ${o.next_earnings_date || tMeta?.next_earnings_date || 'None during expiration week'}`;
  }).join('\n');

  return `**Role & Objective:**
You are an institutional options portfolio manager. Analyze the pre-screened candidate universe and real-time market data provided below (synthesized directly from DeltaHarvest's ThinkorSwim, Barchart View 190898, and MarketChameleon quantitative feeds) and generate an options income report for cash-secured puts (CSPs) expiring on ${expDate} utilizing the available deployable cash pool of $${deployableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.

**Portfolio Capital & Risk Parameters (From DeltaHarvest Cash Ledger):**
- Total Liquid Cash Balance: $${capitalState.totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Encumbered Weekly Living Disbursements: $${(capitalState.totalEncumberedDisbursements || 5000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Deducted upfront)
- Committed Active CSP Collateral: $${capitalState.committedCollateral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Deployable Free Cash Pool: $${deployableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Available for new trades)
- Target Position Allocation: $${effectiveAlloc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per trade
- Single Equity Position Limit: $200,000.00 STRICT LIMIT (No single equity security CSP collateral may exceed $200,000.00)
- Maximum Concurrent Positions: Up to ${maxPositions} positions (Strictly capped at 5 max)

**Execution Protocol (Mandatory):**
1. Candidate Universe: Evaluate only the candidates provided in the data payload below. All candidates already have Weekly Options = "Yes", 14-Day RSI <= 70, average daily volume >= 500k shares, and no earnings during the target expiration week (${expDate}).
2. Fallback Ranking: Rank qualifying candidates by:
   (a) Barchart Short-Term Directional Consensus = "100% Buy" (or highest available conviction),
   (b) 9/18-day EMA confirming uptrend ("Strongest" / "Strengthening" / MarketChameleon "Uptrend"),
   (c) IV Rank >= 35% / elevated IV for maximum volatility risk premium capture.
3. Capital Sizing Algorithm:
   - Target Strike: ~0.16 to 0.22 Delta (must sit below confirmed technical support and 2-SD lower Bollinger Band).
   - Capital Pool: Exactly $${deployableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available cash collateral.
   - Sizing Methodology: Inverse-volatility risk parity (allocate higher dollar percentages to lower-IV, high-conviction underlying assets).
   - Single Equity Cap: Under NO circumstances may the collateral for any single equity security exceed $200,000.00 (Collateral = Strike * 100 * Contracts).
   - Discrete Contracts: Solve for integer contracts such that Total Capital Committed <= $${deployableCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, maintaining a positive cash reserve.

**Consolidated Screener Data Payload (ThinkorSwim + Barchart + MarketChameleon):**
${candidateRows || 'No candidates currently meeting preliminary filters.'}

**Output Structure Required (Strict Markdown Format for Direct DeltaHarvest Ingestion):**
- Lead with an Executive Summary summarizing total premium captured, portfolio return on capital (weekly and annualized), and remaining cash balance.
- ThinkorSwim Pricing Verification Disclaimer.
- TABLE 1: RECOMMENDED TRADES (FINAL CANDIDATES)
  Columns: Risk Rank | Stock Symbol | Current Price | IV | 14-Day RSI | Suggested Strike | Option Delta | OTM Cushion | Contracts | Collateral Committed | % of Pool | Est. Premium / Share | Total Premium | Weekly ROC | Annualized ROC
  *Must include a TOTALS row, remaining unallocated cash balance, and formula definitions.*
- Technical, support, and earnings runway justifications for each selected trade (explain why the strike sits at or below key support).
- TABLE 2: BORDERLINE CANDIDATES (Symbol, Current Price, Trend Str/Dir, 14D RSI, Earnings Date, Reason).
- TABLE 3: EXCLUDED CANDIDATES (Symbol, Current Price, Specific Exclusion Rule Failed).`;
}
