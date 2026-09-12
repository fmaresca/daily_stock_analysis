# Options & Technical Volatility Screener Audit Report
**Audit Generated:** 2026-09-12 15:05:14 UTC  
**Target Strategy:** Weekly Income (3–7 DTE Cash-Secured Puts & Covered Calls)  
**Strike Rules:** Puts $\le$ Lower Bollinger Band (2 SD) | Calls $\ge$ Upper Bollinger Band (2 SD)  

---

## 1. Technical Indicators & Volatility Audit
| Ticker | Spot ($) | 20 SMA | Lower BB | Upper BB | 14 RSI | 30d HV | 52w IVR | Earnings (≤7d) | Liquidity Tier |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **SPY** | $764.29 | $766.88 | $758.01 | $775.75 | 49.5 | 10.4% | 5/100 | No | Tier |
| **QQQ** | $714.88 | $715.67 | $702.62 | $728.72 | 51.0 | 16.4% | 5/100 | No | Tier |

---

## 2. Conservative Cash-Secured Put Opportunities (Weekly Income)
> Positioned at or below Lower Bollinger Band to provide downside safety margin and target ~0.15–0.20 Delta.

| Ticker | Strike ($) | Spot ($) | Cushion % | Exp (DTE) | Premium ($) | Collateral ($) | Delta (Δ) | POP % | Ann. ROC % |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **QQQ** | **$710.0** | $714.88 | +0.68% | 2026-09-15 (3d) | +$196 | $71,000 | -0.25 | 74.6% | **34.1%** |
| **SPY** | **$760.0** | $764.29 | +0.56% | 2026-09-15 (3d) | +$133 | $76,000 | -0.203 | 79.5% | **21.9%** |
| **QQQ** | **$705.0** | $714.88 | +1.38% | 2026-09-15 (3d) | +$106 | $70,500 | -0.092 | 90.6% | **18.2%** |
| **SPY** | **$755.0** | $764.29 | +1.22% | 2026-09-15 (3d) | +$66 | $75,500 | -0.041 | 95.9% | **10.9%** |
| **QQQ** | **$700.0** | $714.88 | +2.08% | 2026-09-15 (3d) | +$60 | $70,000 | -0.024 | 97.6% | **10.9%** |
| **SPY** | **$750.0** | $764.29 | +1.87% | 2026-09-15 (3d) | +$36 | $75,000 | -0.004 | 99.0% | **6.1%** |
| **QQQ** | **$695.0** | $714.88 | +2.78% | 2026-09-15 (3d) | +$35 | $69,500 | -0.004 | 99.0% | **6.1%** |

---

## 3. Conservative Covered Call Opportunities (Share Monetization)
> Positioned at or above Upper Bollinger Band allowing capital appreciation room plus upfront cash premium.

| Ticker | Strike ($) | Spot ($) | Upside Room % | Exp (DTE) | Premium ($) | Delta (Δ) | POP % | Static Ann. % | Max Ann. % |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **QQQ** | **$720.0** | $714.88 | +0.72% | 2026-09-15 (3d) | +$130 | 0.267 | 81.3% | **21.9%** | 109.5% |
| **SPY** | **$770.0** | $764.29 | +0.75% | 2026-09-15 (3d) | +$58 | 0.165 | 88.5% | **9.7%** | 101.0% |
| **QQQ** | **$725.0** | $714.88 | +1.42% | 2026-09-15 (3d) | +$30 | 0.104 | 92.7% | **4.9%** | 177.6% |
| **QQQ** | **$730.0** | $714.88 | +2.12% | 2026-09-15 (3d) | +$22 | 0.029 | 95.0% | **3.6%** | 261.6% |
| **SPY** | **$780.0** | $764.29 | +2.06% | 2026-09-15 (3d) | +$15 | 0.003 | 95.0% | **2.4%** | 253.1% |
| **SPY** | **$785.0** | $764.29 | +2.71% | 2026-09-15 (3d) | +$15 | 0.0 | 95.0% | **2.4%** | 332.1% |
| **QQQ** | **$735.0** | $714.88 | +2.81% | 2026-09-15 (3d) | +$15 | 0.006 | 95.0% | **2.4%** | 344.3% |
| **SPY** | **$775.0** | $764.29 | +1.4% | 2026-09-15 (3d) | +$8 | 0.031 | 95.0% | **1.2%** | 171.6% |

---

## 4. Risk Disclosures & Liquidity Tier Guidance
### 🚨 Tier 4 Small-Cap Warning (AXTI, BLZE, ZETA)
- Wider bid-ask spreads can result in 5–15% slippage on entry and early exit.
- Always utilize limit orders at or near the mid price; avoid market orders on Tier 4 options.

### ⚠️ Earnings Calendar Advisory
- No tickers currently have confirmed earnings within the 7-day threshold.