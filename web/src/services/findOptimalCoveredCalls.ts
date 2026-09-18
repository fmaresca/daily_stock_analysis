import {
  OptionContract,
  StockUnderlying,
  CoveredCallCandidate,
} from '../types/coveredCall';
import {
  evaluateEarlyAssignmentRisk,
  calculateAnnualizedYield,
} from '../utils/optionsMath';

export interface ScreenerFilterOptions {
  minDelta?: number; // default 0.20
  maxDelta?: number; // default 0.30
  minDte?: number; // default 21
  maxDte?: number; // default 45
  minOpenInterest?: number; // default 20
  maxBidAskSpreadPct?: number; // default 0.20 (20% spread limit)
}

/**
 * Optopsy-inspired optimal covered call screener.
 * Filters call options by target Delta and DTE window, ranks strikes by IV Rank,
 * Annualized Yield, and liquidity, and applies early assignment risk health checks.
 */
export function findOptimalCoveredCalls(
  underlying: StockUnderlying,
  rawChain: OptionContract[],
  options?: ScreenerFilterOptions
): CoveredCallCandidate[] {
  const {
    minDelta = 0.20,
    maxDelta = 0.30,
    minDte = 21,
    maxDte = 45,
    minOpenInterest = 20,
    maxBidAskSpreadPct = 0.25,
  } = options || {};

  const stockPrice = underlying.currentPrice;

  // 1. Filter calls adhering to institutional buy-write criteria
  const filteredCalls = rawChain.filter((c) => {
    if (c.type !== 'CALL') return false;
    if (c.dte < minDte || c.dte > maxDte) return false;

    // Delta check between target thresholds
    const absDelta = Math.abs(c.delta);
    if (absDelta < minDelta || absDelta > maxDelta) return false;

    // Liquidity safeguards
    if (c.openInterest < minOpenInterest) return false;
    if (c.bid <= 0.05) return false;

    // Bid-Ask Spread tightness
    const mid = c.mid > 0 ? c.mid : (c.bid + c.ask) / 2;
    if (mid <= 0) return false;
    const spreadPct = (c.ask - c.bid) / mid;
    if (spreadPct > maxBidAskSpreadPct) return false;

    return true;
  });

  // 2. Synthesize quantitative covered call metrics for candidates
  const candidates: CoveredCallCandidate[] = filteredCalls.map((contract) => {
    const premium = contract.mid > 0 ? contract.mid : (contract.bid + contract.ask) / 2;
    const strike = contract.strike;
    const dte = Math.max(1, contract.dte);

    const netDebit = stockPrice - premium;
    const breakevenStockPrice = netDebit;

    // Max Profit achieved if stock closes >= Strike: (Strike - Stock) + Premium
    const maxProfitPerShare = Math.max(0, strike - stockPrice) + premium;
    const maxProfitDollars = maxProfitPerShare * 100;
    const maxProfitPercent = (maxProfitPerShare / netDebit) * 100;

    const downsideProtectionPercent = (premium / stockPrice) * 100;
    const annualizedYieldPercent = calculateAnnualizedYield(maxProfitPercent, dte);
    const staticReturnPercent = (premium / stockPrice) * 100;

    // Early assignment risk analysis
    const earlyAssignment = evaluateEarlyAssignmentRisk(
      stockPrice,
      strike,
      premium,
      contract.expirationDate,
      underlying.dividend
    );

    // Optopsy Composite Ranking Score (0 - 100)
    // a) Sweet spot delta (0.25 target delta) -> 25 pts
    const deltaDiff = Math.abs(Math.abs(contract.delta) - 0.25);
    const deltaScore = Math.max(0, 25 - deltaDiff * 250);

    // b) Elevated IV Rank (harvesting high implied volatility) -> 35 pts
    const ivrScore = (Math.min(100, Math.max(0, underlying.ivRank52w)) / 100) * 35;

    // c) Annualized Yield (benchmarked against 35% annualized target) -> 25 pts
    const yieldScore = Math.min(25, (annualizedYieldPercent / 35) * 25);

    // d) Tight Spread / Liquidity score -> 15 pts
    const spreadRatio = (contract.ask - contract.bid) / Math.max(0.1, premium);
    const liquidityScore = Math.max(0, 15 - spreadRatio * 30);

    // Early assignment penalty
    const penalty =
      earlyAssignment.severity === 'HIGH'
        ? 25
        : earlyAssignment.severity === 'LOW'
        ? 10
        : 0;

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

  // 3. Return candidates sorted descending by composite score
  return candidates.sort((a, b) => b.compositeScore - a.compositeScore);
}
