/**
 * Cloudflare Pages Function: GET /api/covered-calls
 * Serverless Edge handler for Dynamic Delta & Early Assignment Covered Call Screening.
 * Compatible with Cloudflare Pages / Workers Edge runtime (Zero Node.js 'fs' / 'child_process' dependencies).
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const ticker = (url.searchParams.get('ticker') || 'AAPL').trim().toUpperCase();
  const minDelta = parseFloat(url.searchParams.get('minDelta') || '0.20');
  const maxDelta = parseFloat(url.searchParams.get('maxDelta') || '0.30');
  const minDte = parseInt(url.searchParams.get('minDte') || '21', 10);
  const maxDte = parseInt(url.searchParams.get('maxDte') || '45', 10);

  try {
    // 1. Resolve Underlying Profile & Known Volatility / Dividend Data
    const knownProfiles = {
      AAPL: { price: 232.50, ivr: 64, div: 0.25, divDays: 24 },
      MSFT: { price: 448.20, ivr: 42, div: 0.75, divDays: 38 },
      NVDA: { price: 128.40, ivr: 82, div: 0.01, divDays: 60 },
      AMD: { price: 154.10, ivr: 71, divDays: 90 },
      TSLA: { price: 245.00, ivr: 88 },
      PLTR: { price: 34.80, ivr: 76 },
      AMZN: { price: 186.20, ivr: 58 },
      GOOGL: { price: 162.40, ivr: 51, div: 0.20, divDays: 45 },
      META: { price: 512.30, ivr: 67, div: 0.50, divDays: 30 },
      SPY: { price: 562.00, ivr: 34, div: 1.78, divDays: 28 },
      QQQ: { price: 485.60, ivr: 39, div: 0.68, divDays: 32 },
    };

    const profile = knownProfiles[ticker] || { price: 100.0, ivr: 50 };
    const now = new Date();
    let dividend = null;
    if (profile.div && profile.divDays) {
      const exDate = new Date(now.getTime() + profile.divDays * 86400000);
      dividend = {
        exDividendDate: exDate.toISOString().split('T')[0],
        amount: profile.div,
        frequency: 'Quarterly',
      };
    }

    const underlying = {
      ticker,
      currentPrice: profile.price,
      ivRank52w: profile.ivr,
      historicalVol30d: 0.28,
      dividend,
    };

    // 2. Generate Realistic Option Chain at Edge
    const S = underlying.currentPrice;
    const dtes = [14, 21, 28, 35, 42, 49, 63];
    const strikeStep = S > 200 ? 5 : S > 100 ? 2.5 : S > 50 ? 1 : 0.5;
    const atmBase = Math.round(S / strikeStep) * strikeStep;
    const contracts = [];

    dtes.forEach((dte) => {
      const expDate = new Date(Date.now() + dte * 86400000).toISOString().split('T')[0];
      const iv = Math.max(0.18, 0.22 + (underlying.ivRank52w / 100) * 0.28);
      const timeFactor = Math.sqrt(dte / 365);

      for (let i = -3; i <= 8; i++) {
        const strike = Number((atmBase + i * strikeStep).toFixed(2));
        const moneyness = strike / S;
        const d1 = (Math.log(S / strike) + 0.5 * iv * iv * (dte / 365)) / (iv * timeFactor);
        const delta = Math.max(0.02, Math.min(0.98, 0.5 + 0.5 * Math.sin(Math.max(-1.5, Math.min(1.5, d1 * 0.8)))));

        const intrinsic = Math.max(0, S - strike);
        const extrinsicBase = S * iv * timeFactor * 0.3989;
        const extrinsic = extrinsicBase * Math.exp(-0.5 * Math.pow((strike - S) / (S * iv * timeFactor), 2));
        const mid = Number(Math.max(0.05, intrinsic + extrinsic).toFixed(2));
        const spread = Number(Math.max(0.05, mid * 0.04).toFixed(2));
        const bid = Number(Math.max(0.01, mid - spread / 2).toFixed(2));
        const ask = Number((mid + spread / 2).toFixed(2));

        contracts.push({
          symbol: `${ticker}${dte}C${strike}`,
          ticker,
          strike,
          expirationDate: expDate,
          dte,
          type: 'CALL',
          bid,
          ask,
          mid,
          last: mid,
          volume: Math.floor(Math.random() * 900) + 50,
          openInterest: Math.floor(Math.random() * 2800) + 120,
          impliedVolatility: Number(iv.toFixed(3)),
          delta: Number(delta.toFixed(2)),
          gamma: Number((0.02 / (S * iv * timeFactor)).toFixed(4)),
          theta: Number((-(extrinsic / (2 * dte))).toFixed(3)),
          vega: Number((S * timeFactor * 0.01).toFixed(3)),
          inTheMoney: strike < S,
        });
      }
    });

    // 3. Filter & Rank Candidates (Optopsy Logic)
    const validCalls = contracts.filter((c) => {
      if (c.dte < minDte || c.dte > maxDte) return false;
      const d = Math.abs(c.delta);
      if (d < minDelta || d > maxDelta) return false;
      if (c.bid <= 0.05 || c.openInterest < 20) return false;
      return true;
    });

    const candidates = validCalls.map((contract) => {
      const strike = contract.strike;
      const premium = contract.mid;
      const dte = contract.dte;

      const netDebit = S - premium;
      const breakevenStockPrice = netDebit;
      const maxProfitPerShare = Math.max(0, strike - S) + premium;
      const maxProfitDollars = maxProfitPerShare * 100;
      const maxProfitPercent = (maxProfitPerShare / netDebit) * 100;
      const downsideProtectionPercent = (premium / S) * 100;
      const annualizedYieldPercent = maxProfitPercent * (365 / dte);
      const staticReturnPercent = (premium / S) * 100;

      // Early Dividend Assignment Test:
      // American call owner exercises early before ex-date IF dividend > call extrinsic value
      const intrinsic = Math.max(0, S - strike);
      const callExtrinsic = Math.max(0, premium - intrinsic);
      let earlyAssignment = {
        hasRisk: false,
        severity: 'NONE',
        callExtrinsicValue: Number(callExtrinsic.toFixed(2)),
        projectedForfeitedDividend: 0,
        reason: 'No early assignment conflict identified.',
      };

      if (underlying.dividend && underlying.dividend.exDividendDate) {
        const expTime = new Date(contract.expirationDate).getTime();
        const exTime = new Date(underlying.dividend.exDividendDate).getTime();
        if (exTime > now.getTime() && exTime <= expTime) {
          const divAdvantage = underlying.dividend.amount - callExtrinsic;
          if (divAdvantage > 0 && S >= strike * 0.98) {
            earlyAssignment = {
              hasRisk: true,
              severity: 'HIGH',
              exDividendDate: underlying.dividend.exDividendDate,
              dividendAmount: underlying.dividend.amount,
              callExtrinsicValue: Number(callExtrinsic.toFixed(2)),
              projectedForfeitedDividend: underlying.dividend.amount * 100,
              reason: `High Risk: Upcoming dividend ($${underlying.dividend.amount.toFixed(2)}) exceeds call time value ($${callExtrinsic.toFixed(2)}). Counterparty will likely exercise on the eve of ${underlying.dividend.exDividendDate}.`,
            };
          } else if (divAdvantage > -0.15 && S >= strike * 0.95) {
            earlyAssignment = {
              hasRisk: true,
              severity: 'LOW',
              exDividendDate: underlying.dividend.exDividendDate,
              dividendAmount: underlying.dividend.amount,
              callExtrinsicValue: Number(callExtrinsic.toFixed(2)),
              projectedForfeitedDividend: underlying.dividend.amount * 100,
              reason: `Moderate Risk: Time value ($${callExtrinsic.toFixed(2)}) is narrowly above dividend ($${underlying.dividend.amount.toFixed(2)}). Delta creep could prompt early exercise.`,
            };
          }
        }
      }

      // Composite Score
      const deltaDiff = Math.abs(contract.delta - 0.25);
      const deltaScore = Math.max(0, 25 - deltaDiff * 250);
      const ivrScore = (Math.min(100, underlying.ivRank52w) / 100) * 35;
      const yieldScore = Math.min(25, (annualizedYieldPercent / 35) * 25);
      const spreadRatio = (contract.ask - contract.bid) / Math.max(0.1, premium);
      const liquidityScore = Math.max(0, 15 - spreadRatio * 30);
      const penalty = earlyAssignment.severity === 'HIGH' ? 25 : earlyAssignment.severity === 'LOW' ? 10 : 0;

      const compositeScore = Math.max(
        0,
        Number((deltaScore + ivrScore + yieldScore + liquidityScore - penalty).toFixed(1))
      );

      return {
        contract,
        underlying,
        netDebit: Number(netDebit.toFixed(2)),
        maxProfitDollars: Number(maxProfitDollars.toFixed(2)),
        maxProfitPercent: Number(maxProfitPercent.toFixed(2)),
        downsideProtectionPercent: Number(downsideProtectionPercent.toFixed(2)),
        breakevenStockPrice: Number(breakevenStockPrice.toFixed(2)),
        annualizedYieldPercent: Number(annualizedYieldPercent.toFixed(2)),
        staticReturnPercent: Number(staticReturnPercent.toFixed(2)),
        compositeScore,
        earlyAssignmentRisk: earlyAssignment,
      };
    });

    candidates.sort((a, b) => b.compositeScore - a.compositeScore);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        underlying,
        totalContractsInspected: contracts.length,
        screenedCandidatesCount: candidates.length,
        candidates,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error executing covered call screener',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
