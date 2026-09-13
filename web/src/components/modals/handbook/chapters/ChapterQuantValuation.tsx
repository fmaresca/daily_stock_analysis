import React from 'react';
import { DollarSign, BrainCircuit } from '../../../icons';
import { DirectActionBanner } from './DirectActionBanner';

interface ChapterQuantValuationProps {
  onOpenValuation?: (ticker: string) => void;
  onNavigate?: (tab: any, section?: any, subTab?: any) => void;
  onOpenSimulator?: () => void;
}

export const ChapterQuantValuation: React.FC<ChapterQuantValuationProps> = ({
  onOpenValuation,
  onNavigate,
  onOpenSimulator,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-teal-400 pl-4 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
            Terminal v3.4 Upgrade
          </span>
          <span className="text-xs text-slate-400 font-mono">Fundamental &amp; Technical Quantitative Engineering</span>
        </div>
        <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
          <span>14. Quantitative Equity Valuation, DCF Intrinsic Models &amp; Dynamic Volatility Risk-Reward</span>
        </h3>
        <p className="text-slate-300 mt-1">
          DeltaHarvest v3.4 introduces the institutional <strong>Fundamental Valuation &amp; DCF Intrinsic Value Simulator</strong>. While our derivatives models harvest systematic options premium, this valuation engine establishes whether underlying equity assets possess genuine economic margin of safety, uncompromised balance sheets, and favorable asymmetric risk-reward hurdles.
        </p>
      </div>

      {/* Direct Action Quick Launch Banner */}
      <DirectActionBanner
        title="Launch Live Quantitative Valuation Models"
        actions={[
          {
            label: 'Launch DCF Valuation Terminal',
            location: 'Full Screen Modal',
            onClick: () => onOpenValuation?.('NVDA'),
          },
          {
            label: 'Fundamental Solvency & CEF Audit',
            location: 'Equities > Fundamentals',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'FUNDAMENTAL_HEALTH'),
          },
          {
            label: 'Equities Technical Screener (ATR)',
            location: 'Equities > Technical Screener',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'TECHNICAL_SCREENER'),
          },
          {
            label: 'Options Trade Quality Simulator',
            location: 'Tactical Tools',
            onClick: () => onOpenSimulator?.(),
          },
        ]}
      />

      {/* SECTION 1: DISCOUNTED CASH FLOW WITH MIDPOINT TIMING & GORDON BOUND */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-teal-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-teal-400" />
            <span>14.1 Discounted Cash Flow (DCF) with Midpoint Timing &amp; Economic Gordon Bound</span>
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
            Institutional Standard
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Most retail DCF calculators incorrectly assume that all cash flows arrive at the exact end of each calendar year (t=1, 2, 3...), discounting by (1 + WACC)^t. This mathematically penalizes high-growth companies by assuming zero cash arrives from January 1 through December 30. In institutional valuation, revenue and operating cash flows arrive continuously across 365 operating days, requiring <strong>Midpoint Discounting</strong> (t - 0.5):
        </p>

        <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-teal-300 border border-slate-800 space-y-1">
          <p><strong>Discrete Period Present Value (Midpoint Timing):</strong></p>
          <p className="text-slate-200">PV(FCF_t) = FCF_t / (1 + WACC)^(t - 0.5)</p>
          <p className="text-slate-400 text-[11px]">Where t &isin; [1, 5] years, WACC = Weighted Average Cost of Capital.</p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          For the perpetual horizon beyond Year 5, DeltaHarvest implements the <strong>Gordon Growth Terminal Value</strong> discounted to present value. To eliminate mathematical singularities and negative intrinsic values, our engine strictly enforces the physical economic constraint that perpetual terminal growth g cannot exceed WACC:
        </p>

        <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-teal-300 border border-slate-800 space-y-1">
          <p><strong>Terminal Value (TV) &amp; Gordon Growth Bound:</strong></p>
          <p className="text-slate-200">TV_5 = [FCF_5 &times; (1 + g)] / (WACC - g), &nbsp; subject to: g &lt; WACC</p>
          <p className="text-slate-200">PV(TV) = TV_5 / (1 + WACC)^5</p>
          <p className="text-slate-400 text-[11px]">If terminal growth g &ge; WACC, the model caps g at WACC - 0.5% to prevent infinite/negative values.</p>
        </div>

        <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-teal-300 border border-slate-800 space-y-1">
          <p><strong>Enterprise Value to Equity Value &amp; Margin of Safety:</strong></p>
          <p className="text-slate-200">Enterprise Value (EV) = &sum;[t=1..5] PV(FCF_t) + PV(TV)</p>
          <p className="text-slate-200">Equity Value = EV + Total Cash &amp; Short-Term Equivalents - Total Debt</p>
          <p className="text-slate-200">Intrinsic Value Per Share = Equity Value / Diluted Shares Outstanding</p>
          <p className="text-emerald-400 font-bold">Margin of Safety % = [(Intrinsic Value - Current Market Price) / Current Market Price] &times; 100%</p>
        </div>
      </div>

      {/* SECTION 2: DUPONT 3-STEP & 5-STEP STRUCTURAL ROE DECOMPOSITION */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <span>🔬</span>
            <span>14.2 DuPont 3-Step &amp; 5-Step Structural ROE Decomposition</span>
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Quality of Earnings
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          A high Return on Equity (ROE) can be deceptively manufactured through extreme balance-sheet leverage rather than genuine operating efficiency. DeltaHarvest runs automated <strong>3-Step and 5-Step DuPont Decompositions</strong> to isolate whether capital returns originate from pricing power, asset velocity, or dangerous financial engineering:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
            <div className="font-bold text-emerald-400">3-Step DuPont Formula</div>
            <p className="font-mono text-slate-200">ROE = Net Profit Margin &times; Asset Turnover &times; Equity Multiplier</p>
            <ul className="text-[11px] text-slate-400 space-y-0.5 mt-1 list-disc list-inside">
              <li><strong>Net Margin (NI / Rev):</strong> Measures pricing power and cost discipline.</li>
              <li><strong>Asset Turnover (Rev / Assets):</strong> Measures asset capital efficiency.</li>
              <li><strong>Equity Multiplier (Assets / Equity):</strong> Quantifies leverage multiplier.</li>
            </ul>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
            <div className="font-bold text-teal-400">5-Step DuPont Formula</div>
            <p className="font-mono text-slate-200">ROE = Tax Burden &times; Interest Burden &times; Operating Margin &times; Asset Turnover &times; Leverage</p>
            <ul className="text-[11px] text-slate-400 space-y-0.5 mt-1 list-disc list-inside">
              <li><strong>Tax Burden (NI / EBT):</strong> Tax retention efficiency.</li>
              <li><strong>Interest Burden (EBT / EBIT):</strong> Debt service headroom.</li>
              <li><strong>Operating Margin (EBIT / Rev):</strong> Pure operational profitability.</li>
            </ul>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
          <strong>Diagnostic Verdict:</strong> If an underlying company displays ROE &gt; 25% but Operating Margin &lt; 5% with Equity Multiplier &gt; 5.0x, the company is highly leveraged. DeltaHarvest flags this as a <em>High Leverage Vulnerability</em>, warning options sellers against writing aggressive CSPs due to solvency tail-risk.
        </div>
      </div>

      {/* SECTION 3: VALUATION MULTIPLES & NEGATIVE EARNINGS HANDLING */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <span>📊</span>
            <span>14.3 Valuation Multiples &amp; Negative Earnings Handling (Earnings Yield)</span>
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
            Defensive Mathematics
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          When a growth company incurs temporary losses or heavy R&amp;D investments (e.g. early-stage semiconductors or quantum computing), raw Price-to-Earnings (P/E) ratios fail, showing negative values or &quot;N/A&quot;. DeltaHarvest handles this through the mathematically continuous <strong>Earnings Yield</strong>:
        </p>

        <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-amber-300 border border-slate-800 space-y-1">
          <p><strong>Continuous Earnings Yield Formula:</strong></p>
          <p className="text-slate-200">Earnings Yield (E/P) = (Diluted EPS / Spot Price) &times; 100%</p>
          <p className="text-slate-400 text-[11px]">Unlike P/E which asymptotes toward &plusmn;&infin; near zero earnings, Earnings Yield is continuous, smooth across zero, and can be benchmarked directly against the 10-Year US Treasury yield.</p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          For companies with negative EPS, DeltaHarvest safely displays <code>P/E: Neg. Earnings</code> with an amber cautionary badge, suppressing nonsensical negative PEG numbers and directing valuation screening toward <strong>Price-to-Sales (P/S)</strong> and <strong>Enterprise Value to Revenue (EV/Sales)</strong>.
        </p>
      </div>

      {/* SECTION 4: DYNAMIC VOLATILITY RISK-REWARD (k x ATR, R/R >= 2.0) */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <span>🎯</span>
            <span>14.4 Dynamic Volatility Risk-Reward Hurdle Planner (k &times; ATR, R/R &ge; 2.0)</span>
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Trade Execution Rules
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Fixed dollar stop-losses fail in equity markets because high-beta tickers (e.g. TSLA, NVDA) easily trigger normal noise stops, while low-beta names receive unnecessarily wide stops. DeltaHarvest calculates <strong>Wilder&apos;s 14-period Average True Range (ATR)</strong> to place dynamic volatility-adjusted stops and profit targets:
        </p>

        <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-cyan-300 border border-slate-800 space-y-1">
          <p><strong>Dynamic Volatility Brackets:</strong></p>
          <p className="text-slate-200">True Range (TR) = max(High - Low, |High - PrevClose|, |Low - PrevClose|)</p>
          <p className="text-slate-200">ATR_14 = (ATR_prev &times; 13 + TR) / 14</p>
          <p className="text-slate-200">Dynamic Stop Loss = Entry Price - (k &times; ATR_14), &nbsp; where k = 1.5 default</p>
          <p className="text-slate-200">Dynamic Target Price = Entry Price + (m &times; ATR_14), &nbsp; where m = 3.0 default</p>
          <p className="text-emerald-400 font-bold">Calculated Risk-Reward Ratio (R/R) = (Target - Entry) / (Entry - Stop) = m / k</p>
        </div>

        <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300">
          <strong>The Institutional Hurdle Rule:</strong> A long stock or defined-risk option position will only receive green approval if <strong>R/R &ge; 2.0</strong>. At a 2.0 R/R ratio, an investor can maintain positive portfolio expectancy even with a modest 40% historical win rate.
        </div>
      </div>

      {/* SECTION 5: PREDICTION MARKET CALIBRATION */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-violet-400 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-violet-400" />
            <span>14.5 Prediction Market Probability Calibration &amp; Vig Elimination</span>
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
            Polymarket &amp; Kalshi
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Raw prediction market prices contain broker fees, liquidity spreads, and over-round (vig) such that prices across complementary outcomes sum to greater than 1.00 (P_A + P_B &gt; 1.00). To use prediction market signals as valid Bayesian priors in options pricing, DeltaHarvest calibrates prices using vig-stripping:
        </p>

        <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-violet-300 border border-slate-800 space-y-1">
          <p><strong>Over-Round Vig Elimination:</strong></p>
          <p className="text-slate-200">P_calibrated(i) = P_raw(i) / &sum;[k=1..N] P_raw(k)</p>
          <p className="text-slate-400 text-[11px]">This guarantees mathematically sound probabilities strictly bounded between [0.00, 1.00] summing to exactly 1.00.</p>
        </div>
      </div>

      {/* SECTION 6: QUICK LAUNCHER FOR LIVING TRUST ASSETS */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-teal-950/40 p-4 rounded-xl border border-teal-500/30 space-y-3">
        <div className="text-sm font-bold text-white flex items-center gap-2">
          <span>⚡</span>
          <span>Quick-Launch DCF &amp; Valuation Simulator on Core Account Assets</span>
        </div>
        <p className="text-xs text-slate-300">
          Click any ticker below to immediately pop open the interactive DCF Simulator with pre-calibrated FCF and WACC assumptions:
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 font-bold">Schwab Living Trust Lots:</span>
          {['AXTI', 'BLZE', 'IONQ', 'LUNR', 'NET', 'RTX', 'TSLA'].map((ticker) => (
            <button
              key={ticker}
              onClick={() => onOpenValuation?.(ticker)}
              className="px-2.5 py-1 rounded-lg bg-teal-900/40 hover:bg-teal-700/50 border border-teal-500/40 text-teal-200 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
            >
              ${ticker}
            </button>
          ))}
          <span className="text-[11px] font-mono text-slate-400 font-bold ml-2">Universe Leaders:</span>
          {['NVDA', 'AAPL', 'MSFT', 'PLTR'].map((ticker) => (
            <button
              key={ticker}
              onClick={() => onOpenValuation?.(ticker)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
            >
              ${ticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
