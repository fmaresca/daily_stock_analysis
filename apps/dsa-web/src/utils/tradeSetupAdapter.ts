import type { StockBarItem, AnalysisReport } from '../types/analysis';
import type { TradeSetupItem, OptionsSetup, AnalyticalThesis } from '../types/tradeSetup';
import type { WatchlistQuoteEntry } from '../types/marketData';

export const INSTITUTIONAL_SAMPLE_SETUPS: TradeSetupItem[] = [
  {
    ticker: 'NVDA',
    company_name: 'NVIDIA Corporation',
    market: 'US',
    bias: 'BULLISH',
    conviction_score: 9.2,
    current_price: 138.25,
    entry_price: 134.50,
    stop_loss: 128.00,
    take_profit: 154.00,
    risk_reward_ratio: 3.0,
    setup_grade: 'Tier 1 (High Conviction)',
    catalyst: 'Blackwell architecture enterprise ramp-up & record AI data center demand',
    risk_summary: 'Geopolitical export restrictions and elevated valuation multiples',
    action_checklist: [
      'Above 20-Day & 50-Day EMA',
      'Institutional volume accumulation spike',
      'Risk/Reward ratio >= 2.5',
      'Data center demand confirmation',
    ],
    ai_thesis:
      'NVIDIA maintains an insurmountable CUDA ecosystem moat and continues expanding enterprise AI infrastructure. Q3 guidance indicates accelerating gross margins with strong hyperscaler capex commitments.',
    has_risk_alerts: false,
    raw_markdown: `### Executive Analysis: NVDA (NVIDIA Corp)
**Market Sentiment:** Bullish | **Conviction:** 9.2/10 | **Target:** $154.00

#### Key Drivers
- Blackwell enterprise chip shipments commencing at scale.
- Hyperscaler capital expenditure revisions revised upward by 18% QoQ.
- Free cash flow yield exceeding 3.8% despite hyper-growth profile.

#### Technical Execution
- Current price testing breakout above ascending consolidation triangle.
- Recommend scaling into long position near **$134.50** entry target with hard stop at **$128.00**.`,
  },
  {
    ticker: 'AAPL',
    company_name: 'Apple Inc.',
    market: 'US',
    bias: 'BULLISH',
    conviction_score: 8.4,
    current_price: 232.10,
    entry_price: 228.00,
    stop_loss: 221.50,
    take_profit: 248.00,
    risk_reward_ratio: 3.08,
    setup_grade: 'Tier 1 (High Conviction)',
    catalyst: 'Apple Intelligence replacement supercycle and services revenue acceleration',
    risk_summary: 'Slower initial AI rollout in European Union due to regulatory compliance',
    action_checklist: [
      'Services gross margin expansion (>74%)',
      'Strong iPhone 16 cycle momentum',
      'Cash balance exceeds $160B',
    ],
    ai_thesis:
      'Consumer hardware replacement cycle initiated by on-device neural engines. Services segment compounding at double-digit rates provides steady cash floor.',
    has_risk_alerts: false,
    raw_markdown: `### Executive Analysis: AAPL (Apple Inc.)
**Market Sentiment:** Bullish | **Conviction:** 8.4/10 | **Target:** $248.00

#### Core Catalyst
- Upward revision in supply chain orders for next-gen A18 Pro silicon.
- Accelerated App Store & iCloud monetization driving margin expansion.`,
  },
  {
    ticker: 'TSLA',
    company_name: 'Tesla, Inc.',
    market: 'US',
    bias: 'NEUTRAL',
    conviction_score: 6.2,
    current_price: 242.80,
    entry_price: 230.00,
    stop_loss: 218.00,
    take_profit: 265.00,
    risk_reward_ratio: 2.92,
    setup_grade: 'Tier 2 (Actionable)',
    catalyst: 'Robotaxi regulatory milestones & Energy storage Megapack backlog expansion',
    risk_summary: 'Automotive gross margin compression and intense global EV price competition',
    action_checklist: [
      'Megapack deliveries +120% YoY',
      'FSD v13 autonomous miles ramping',
      'High beta volatility risk active',
    ],
    ai_thesis:
      'Tesla energy storage division is outperforming EV vehicle delivery slowdowns. Autonomous FSD validation required before assigning Tier 1 grade.',
    has_risk_alerts: true,
    raw_markdown: `### Executive Analysis: TSLA (Tesla Inc.)
**Market Sentiment:** Neutral / Watch | **Conviction:** 6.2/10

#### Analysis Summary
- Automotive gross margins excluding regulatory credits stabilizing around 14.6%.
- Maintain watch stance until breakout above $250 resistance confirms trend continuation.`,
  },
  {
    ticker: 'MSFT',
    company_name: 'Microsoft Corporation',
    market: 'US',
    bias: 'BULLISH',
    conviction_score: 8.8,
    current_price: 432.50,
    entry_price: 426.00,
    stop_loss: 414.00,
    take_profit: 462.00,
    risk_reward_ratio: 3.0,
    setup_grade: 'Tier 1 (High Conviction)',
    catalyst: 'Azure AI cloud capacity coming online with Copilot enterprise adoption',
    risk_summary: 'Massive capital expenditure burden suppressing short-term operating leverage',
    action_checklist: [
      'Azure revenue growth > 29% YoY',
      'Copilot seat expansion across Fortune 500',
      'Tier 1 balance sheet stability',
    ],
    ai_thesis:
      'Microsoft represents the enterprise standard for enterprise GenAI monetization. Cloud backlog expansion confirms long-term recurring contract strength.',
    has_risk_alerts: false,
    raw_markdown: `### Executive Analysis: MSFT (Microsoft)
**Market Sentiment:** Bullish | **Conviction:** 8.8/10 | **Target:** $462.00

#### Core Drivers
- Azure enterprise cloud expansion.
- Office 365 Copilot ARPU expansion.`,
  },
  {
    ticker: 'BABA',
    company_name: 'Alibaba Group Holding',
    market: 'HK',
    bias: 'NEUTRAL',
    conviction_score: 5.8,
    current_price: 88.40,
    entry_price: 82.00,
    stop_loss: 76.50,
    take_profit: 98.00,
    risk_reward_ratio: 2.91,
    setup_grade: 'Tier 3 (Watch Only)',
    catalyst: 'Domestic consumption stimulus packages & Cloud Intelligence restructuring',
    risk_summary: 'Domestic retail e-commerce price war and consumer spending headwinds',
    action_checklist: [
      'Trading below 200 DMA resistance',
      'Share repurchase yield > 8%',
      'Stimulus policy execution needed',
    ],
    ai_thesis:
      'Deep value play supported by extensive share buyback program, but technical breakout requires consistent volume confirmation.',
    has_risk_alerts: true,
    raw_markdown: `### Executive Analysis: BABA (Alibaba Group)
**Market Sentiment:** Neutral | **Conviction:** 5.8/10`,
  },
];

/**
 * Transforms a StockBarItem into a TradeSetupItem for the DecisionMatrix.
 *
 * @param item       - Latest analysis history entry from stockBarItems
 * @param quoteEntry - Optional live-quote hydration cache entry. When status
 *                     is 'ready' the real market price replaces the old
 *                     placeholder of $100.00.
 */
export function convertStockBarToTradeSetup(
  item: StockBarItem,
  quoteEntry?: WatchlistQuoteEntry,
): TradeSetupItem {
  const code = item.stockCode || 'UNKNOWN';
  let market = 'US';
  if (/^\d{6}$/.test(code)) {
    market = 'CN';
  } else if (/^\d{4,5}$/.test(code) || code.toLowerCase().startsWith('hk')) {
    market = 'HK';
  }

  const rawScore = typeof item.sentimentScore === 'number' ? item.sentimentScore : 50;
  // Convert 0-100 to 0-10
  const convictionScore = +(rawScore > 10 ? rawScore / 10 : rawScore).toFixed(1);

  let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (convictionScore >= 6.5 || (item.action && item.action.toLowerCase().includes('buy'))) {
    bias = 'BULLISH';
  } else if (convictionScore <= 4.0 || (item.action && item.action.toLowerCase().includes('sell'))) {
    bias = 'BEARISH';
  }

  // Use real live price from cache when available; fall back to 0 (signals
  // "not yet loaded" — the DecisionMatrix will show a spinner for 0/null)
  const livePrice =
    quoteEntry?.status === 'ready' && (quoteEntry.quote?.currentPrice ?? 0) > 0
      ? quoteEntry.quote!.currentPrice
      : 0;

  const currentPrice = livePrice;
  const hasRealPrice = currentPrice > 0;

  // Compute levels only when we have a real price; otherwise keep 0 so the
  // UI can distinguish "loading" from a genuinely zero-priced instrument.
  const entryPrice = hasRealPrice
    ? +(currentPrice * (bias === 'BULLISH' ? 0.98 : 1.02)).toFixed(2)
    : 0;
  const stopLoss = hasRealPrice
    ? +(currentPrice * (bias === 'BULLISH' ? 0.93 : 1.07)).toFixed(2)
    : 0;
  const takeProfit = hasRealPrice
    ? +(currentPrice * (bias === 'BULLISH' ? 1.12 : 0.88)).toFixed(2)
    : 0;

  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  const rr = risk > 0 ? +(reward / risk).toFixed(2) : 2.0;

  const catalyst = item.operationAdvice || item.actionLabel || `Trend analysis and score of ${convictionScore}/10`;
  const riskSummary = convictionScore < 6 ? 'High volatility & weak trend confirmation' : 'Standard systematic market risk';

  // Build technical indicators map from cache if available
  const technicals = quoteEntry?.technicals
    ? {
        'EMA 20': quoteEntry.technicals.ema20 ?? '—',
        'EMA 50': quoteEntry.technicals.ema50 ?? '—',
        'RSI 14': quoteEntry.technicals.rsi14 ?? '—',
        'ATR 14': quoteEntry.technicals.atr14 ?? '—',
        'Above EMA 20': quoteEntry.technicals.aboveEma20 ? 'Yes' : 'No',
        'Above EMA 50': quoteEntry.technicals.aboveEma50 ? 'Yes' : 'No',
        'RSI Signal': quoteEntry.technicals.rsiSignal,
        Volume: quoteEntry.quote?.volume ?? '—',
        'Day High': quoteEntry.quote?.high ?? '—',
        'Day Low': quoteEntry.quote?.low ?? '—',
      }
    : undefined;

  return {
    ticker: code.toUpperCase(),
    company_name: item.stockName || quoteEntry?.quote?.stockName || code,
    market,
    bias,
    conviction_score: convictionScore,
    current_price: currentPrice,
    entry_price: entryPrice,
    stop_loss: stopLoss,
    take_profit: takeProfit,
    risk_reward_ratio: rr,
    catalyst,
    risk_summary: riskSummary,
    action_checklist: [
      `Operation Advice: ${item.operationAdvice || 'Review Levels'}`,
      `Sentiment Score: ${rawScore}/100`,
      `Analyzed Runs: ${item.analysisCount || 1}`,
    ],
    raw_markdown: `### Analysis for ${code} (${item.stockName || ''})\n\n- **Score:** ${rawScore}/100\n- **Advice:** ${item.operationAdvice || 'N/A'}\n- **Action:** ${item.action || item.actionLabel || 'N/A'}`,
    has_risk_alerts: convictionScore < 5.0,
    options_setup: deriveOptionsSetup(currentPrice, bias),
    thesis: deriveAnalyticalThesis(code, item.stockName || code, bias, catalyst),
    ...(technicals && { technical_indicators: technicals }),
    ...(quoteEntry?.candles?.length && { candles: quoteEntry.candles }),
  };
}

export function deriveOptionsSetup(currentPrice: number, bias: string): OptionsSetup | undefined {
  if (!currentPrice || currentPrice <= 0) return undefined;
  const isBull = bias === 'BULLISH';

  if (isBull) {
    const strike = Math.max(1, +(currentPrice * 0.94).toFixed(currentPrice > 50 ? 0 : 1));
    const cushionPct = +(((currentPrice - strike) / currentPrice) * 100).toFixed(1);
    const estPremium = +(strike * 0.024).toFixed(2);
    const apy = +((estPremium / strike) * (365 / 35) * 100).toFixed(1);
    return {
      strategy_type: 'CSP',
      strike,
      expiration: '35 DTE',
      dte: 35,
      delta: 0.18,
      annualized_yield_pct: Math.min(65, Math.max(12, apy)),
      cushion_pct: cushionPct,
      premium_estimate: estPremium,
    };
  } else {
    const strike = +(currentPrice * 1.06).toFixed(currentPrice > 50 ? 0 : 1);
    const cushionPct = +(((strike - currentPrice) / currentPrice) * 100).toFixed(1);
    const estPremium = +(currentPrice * 0.022).toFixed(2);
    const apy = +((estPremium / currentPrice) * (365 / 35) * 100).toFixed(1);
    return {
      strategy_type: 'CC',
      strike,
      expiration: '35 DTE',
      dte: 35,
      delta: 0.20,
      annualized_yield_pct: Math.min(50, Math.max(10, apy)),
      cushion_pct: cushionPct,
      premium_estimate: estPremium,
    };
  }
}

export function deriveAnalyticalThesis(
  ticker: string,
  companyName: string,
  bias: string,
  catalyst: string
): AnalyticalThesis {
  return {
    bull_case: [
      `${companyName || ticker} exhibits solid technical foundation with institutional sponsorship.`,
      `Relative strength sustained above key 20/50 day moving average envelopes.`,
      `Catalyst: ${catalyst}`,
    ],
    bear_invalidation: [
      `Breakdown below structural support invalidate current directional bias.`,
      `Unexpected macroeconomic contraction or sector-wide risk-off rotation.`,
    ],
    catalyst_timing: 'Active 2–6 week horizon with upcoming liquidity & volume confirmation.',
  };
}

/**
 * Transforms a full AnalysisReport into a TradeSetupItem.
 */
export function convertAnalysisReportToTradeSetup(report: AnalysisReport): TradeSetupItem {
  const code = report.meta.stockCode;
  let market = 'US';
  if (/^\d{6}$/.test(code)) {
    market = 'CN';
  } else if (/^\d{4,5}$/.test(code) || code.toLowerCase().startsWith('hk')) {
    market = 'HK';
  }

  const rawScore = report.summary?.sentimentScore ?? 50;
  const convictionScore = +(rawScore > 10 ? rawScore / 10 : rawScore).toFixed(1);

  let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (convictionScore >= 6.5) {
    bias = 'BULLISH';
  } else if (convictionScore <= 4.0) {
    bias = 'BEARISH';
  }

  const currentPrice = report.meta.currentPrice || 100.0;
  let entryPrice = +(currentPrice * 0.98).toFixed(2);
  let stopLoss = +(currentPrice * 0.93).toFixed(2);
  let takeProfit = +(currentPrice * 1.12).toFixed(2);

  if (report.strategy) {
    if (report.strategy.idealBuy && !isNaN(Number(report.strategy.idealBuy))) {
      entryPrice = Number(report.strategy.idealBuy);
    }
    if (report.strategy.stopLoss && !isNaN(Number(report.strategy.stopLoss))) {
      stopLoss = Number(report.strategy.stopLoss);
    }
    if (report.strategy.takeProfit && !isNaN(Number(report.strategy.takeProfit))) {
      takeProfit = Number(report.strategy.takeProfit);
    }
  }

  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  const rr = risk > 0 ? +(reward / risk).toFixed(2) : 2.0;

  const catalyst =
    report.summary?.analysisSummary ||
    report.summary?.operationAdvice ||
    'Quantitative LLM multi-factor analysis';
  const riskSummary = report.summary?.operationAdvice || 'Standard market risk';

  return {
    ticker: code.toUpperCase(),
    company_name: report.meta.stockName || code,
    market,
    bias,
    conviction_score: convictionScore,
    current_price: currentPrice,
    entry_price: entryPrice,
    stop_loss: stopLoss,
    take_profit: takeProfit,
    risk_reward_ratio: rr,
    catalyst,
    risk_summary: riskSummary,
    action_checklist: [
      `Operation: ${report.summary?.operationAdvice || 'Hold'}`,
      `Score: ${rawScore}/100`,
      `Model: ${report.meta.modelUsed || 'DSA Engine'}`,
    ],
    ai_thesis: report.summary?.analysisSummary || '',
    raw_markdown: report.summary?.analysisSummary || '',
    has_risk_alerts: convictionScore < 5.0,
    options_setup: deriveOptionsSetup(currentPrice, bias),
    thesis: deriveAnalyticalThesis(code, report.meta.stockName || code, bias, catalyst),
  };
}
