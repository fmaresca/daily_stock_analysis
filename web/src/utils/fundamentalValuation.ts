/**
 * Quantitative Fundamental Valuation & Financial Modeling Engine
 * 
 * Implements rigorous corporate valuation algorithms:
 * 1. Valuation Multiples (P/E with negative earnings handling & continuous Earnings Yield,
 *    PEG ratio with decimal/percentage auto-scaling and negative growth rejection).
 * 2. Enterprise Value (EV) accounting for cash, debt, lease liabilities, preferred stock, and minority interest.
 * 3. Free Cash Flow (FCF = CFO - CapEx).
 * 4. DuPont 3-Step and 5-Step ROE Decomposition.
 * 5. Discounted Cash Flow (DCF) with Midpoint Discounting, Gordon Growth terminal value,
 *    and strict terminal growth rate boundary enforcement (g < WACC).
 */

import { isFiniteNumber, safeDivide } from './financeMath';

export interface ValuationMultiplesResult {
  peRatio: number | null;
  earningsYieldPct: number | null;
  forwardPeRatio: number | null;
  pegRatio: number | null;
  evToEbitda: number | null;
}

/**
 * Computes P/E ratio, Earnings Yield, and PEG ratio with defensive financial guards.
 * Negative earnings are flagged with peRatio = null ("N/A") while preserving continuous Earnings Yield.
 * Growth rate is auto-scaled (whether supplied as 0.15 or 15.0 for 15%).
 */
export function calculateValuationMultiples(params: {
  spotPrice: number;
  epsTrailing?: number | null;
  epsForward?: number | null;
  projectedGrowthRate?: number | null; // e.g. 15 for 15%, or 0.15
  enterpriseValue?: number | null;
  ebitda?: number | null;
}): ValuationMultiplesResult {
  const { spotPrice, epsTrailing, epsForward, projectedGrowthRate, enterpriseValue, ebitda } = params;

  // 1. Trailing P/E & Earnings Yield
  let peRatio: number | null = null;
  let earningsYieldPct: number | null = null;

  if (isFiniteNumber(spotPrice) && spotPrice > 0 && isFiniteNumber(epsTrailing)) {
    earningsYieldPct = Math.round((epsTrailing / spotPrice) * 10000) / 100;
    if (epsTrailing > 0) {
      peRatio = Math.round((spotPrice / epsTrailing) * 100) / 100;
    }
    // Negative or zero EPS returns peRatio = null ("N/A")
  }

  // 2. Forward P/E
  let forwardPeRatio: number | null = null;
  if (isFiniteNumber(spotPrice) && spotPrice > 0 && isFiniteNumber(epsForward) && epsForward > 0) {
    forwardPeRatio = Math.round((spotPrice / epsForward) * 100) / 100;
  }

  // 3. PEG Ratio (P/E / Growth Rate)
  let pegRatio: number | null = null;
  if (peRatio !== null && isFiniteNumber(projectedGrowthRate)) {
    // Normalize growth rate: if passed as decimal (e.g. 0.15 for 15%), convert to percentage 15.0
    let normalizedGrowth = projectedGrowthRate;
    if (Math.abs(normalizedGrowth) <= 1.0 && normalizedGrowth !== 0) {
      normalizedGrowth = normalizedGrowth * 100;
    }

    // Growth rate must be positive for standard PEG interpretation
    if (normalizedGrowth > 0) {
      pegRatio = Math.round((peRatio / normalizedGrowth) * 100) / 100;
    }
  }

  // 4. EV / EBITDA
  let evToEbitda: number | null = null;
  if (isFiniteNumber(enterpriseValue) && isFiniteNumber(ebitda) && ebitda > 0) {
    evToEbitda = Math.round((enterpriseValue / ebitda) * 100) / 100;
  }

  return {
    peRatio,
    earningsYieldPct,
    forwardPeRatio,
    pegRatio,
    evToEbitda,
  };
}

export interface EnterpriseValueComponents {
  marketCap: number;
  totalDebt: number;
  leaseLiabilities?: number;
  preferredStock?: number;
  minorityInterest?: number;
  cashAndEquivalents: number;
  shortTermInvestments?: number;
}

/**
 * Computes Enterprise Value (EV):
 * EV = Market Cap + Total Debt + Lease Liabilities + Preferred Stock + Minority Interest
 *      - Cash & Cash Equivalents - Short Term Investments
 */
export function calculateEnterpriseValue(components: EnterpriseValueComponents): number {
  const {
    marketCap,
    totalDebt,
    leaseLiabilities = 0,
    preferredStock = 0,
    minorityInterest = 0,
    cashAndEquivalents,
    shortTermInvestments = 0,
  } = components;

  const totalLiquidAssets = (cashAndEquivalents || 0) + (shortTermInvestments || 0);
  const totalClaims = (totalDebt || 0) + (leaseLiabilities || 0) + (preferredStock || 0) + (minorityInterest || 0);

  const ev = (marketCap || 0) + totalClaims - totalLiquidAssets;
  return Math.round(ev * 100) / 100;
}

/**
 * Computes Free Cash Flow (FCF = Operating Cash Flow - Capital Expenditures)
 */
export function calculateFreeCashFlow(operatingCashFlow: number, capitalExpenditures: number): number {
  const safeOcf = isFiniteNumber(operatingCashFlow) ? operatingCashFlow : 0;
  const safeCapex = isFiniteNumber(capitalExpenditures) ? Math.abs(capitalExpenditures) : 0;
  return Math.round((safeOcf - safeCapex) * 100) / 100;
}

export interface DuPont3StepResult {
  netProfitMarginPct: number;
  assetTurnover: number;
  financialLeverage: number;
  roePct: number;
}

/**
 * Computes DuPont 3-Step ROE Decomposition:
 * ROE = (Net Income / Revenue) * (Revenue / Assets) * (Assets / Equity)
 */
export function calculateDuPont3Step(params: {
  netIncome: number;
  revenue: number;
  totalAssets: number;
  shareholdersEquity: number;
}): DuPont3StepResult {
  const { netIncome, revenue, totalAssets, shareholdersEquity } = params;

  const netProfitMargin = revenue > 0 ? safeDivide(netIncome, revenue, 0) : 0;
  const assetTurnover = totalAssets > 0 ? safeDivide(revenue, totalAssets, 0) : 0;
  const financialLeverage = shareholdersEquity > 0 ? safeDivide(totalAssets, shareholdersEquity, 0) : 0;

  const roe = netProfitMargin * assetTurnover * financialLeverage;

  return {
    netProfitMarginPct: Math.round(netProfitMargin * 10000) / 100,
    assetTurnover: Math.round(assetTurnover * 1000) / 1000,
    financialLeverage: Math.round(financialLeverage * 100) / 100,
    roePct: Math.round(roe * 10000) / 100,
  };
}

export interface DuPont5StepResult {
  taxBurdenPct: number;       // Net Income / EBT
  interestBurdenPct: number;  // EBT / EBIT
  operatingMarginPct: number; // EBIT / Sales
  assetTurnover: number;      // Sales / Assets
  financialLeverage: number;  // Assets / Equity
  roePct: number;
}

/**
 * Computes DuPont 5-Step ROE Decomposition:
 * ROE = (NI / EBT) * (EBT / EBIT) * (EBIT / Sales) * (Sales / Assets) * (Assets / Equity)
 */
export function calculateDuPont5Step(params: {
  netIncome: number;
  ebt: number;
  ebit: number;
  sales: number;
  totalAssets: number;
  shareholdersEquity: number;
}): DuPont5StepResult {
  const { netIncome, ebt, ebit, sales, totalAssets, shareholdersEquity } = params;

  const taxBurden = ebt !== 0 ? safeDivide(netIncome, ebt, 1.0) : 1.0;
  const interestBurden = ebit !== 0 ? safeDivide(ebt, ebit, 1.0) : 1.0;
  const operatingMargin = sales > 0 ? safeDivide(ebit, sales, 0) : 0;
  const assetTurnover = totalAssets > 0 ? safeDivide(sales, totalAssets, 0) : 0;
  const financialLeverage = shareholdersEquity > 0 ? safeDivide(totalAssets, shareholdersEquity, 0) : 0;

  const roe = taxBurden * interestBurden * operatingMargin * assetTurnover * financialLeverage;

  return {
    taxBurdenPct: Math.round(taxBurden * 10000) / 100,
    interestBurdenPct: Math.round(interestBurden * 10000) / 100,
    operatingMarginPct: Math.round(operatingMargin * 10000) / 100,
    assetTurnover: Math.round(assetTurnover * 1000) / 1000,
    financialLeverage: Math.round(financialLeverage * 100) / 100,
    roePct: Math.round(roe * 10000) / 100,
  };
}

export interface DCFModelResult {
  forecastFCF: number[];
  presentValueFCF: number[];
  sumPVForecast: number;
  terminalValue: number;
  presentValueTerminalValue: number;
  enterpriseValue: number;
  equityValue: number;
  intrinsicValuePerShare: number;
  marginOfSafetyPct: number;
}

/**
 * Computes Discounted Cash Flow (DCF) Valuation with Midpoint Discounting and Gordon Growth Terminal Value.
 * Terminal growth rate g is strictly bounded to prevent asymptotic division errors (g < WACC).
 */
export function calculateDCFIntrinsicValue(params: {
  baseFCF: number;
  forecastGrowthRates: number[]; // e.g. [0.15, 0.12, 0.10, 0.08, 0.05] for 5 years
  wacc: number;                  // Cost of Capital (e.g. 0.09 = 9%)
  terminalGrowthRate: number;    // Long-term GDP/risk-free proxy (e.g. 0.025 = 2.5%)
  totalDebt: number;
  cashAndEquivalents: number;
  sharesOutstanding: number;
  currentSpotPrice?: number;
}): DCFModelResult {
  const {
    baseFCF,
    forecastGrowthRates,
    totalDebt,
    cashAndEquivalents,
    sharesOutstanding,
    currentSpotPrice,
  } = params;

  const safeWacc = Math.max(0.04, params.wacc);
  // Strict bound: terminal growth rate must be strictly less than WACC (g <= WACC - 1.0%)
  const maxAllowedTerminalG = safeWacc - 0.01;
  const safeTerminalG = Math.min(maxAllowedTerminalG, Math.max(0.0, params.terminalGrowthRate));

  const forecastFCF: number[] = [];
  const presentValueFCF: number[] = [];

  let currentFCF = baseFCF;
  let sumPVForecast = 0;

  for (let t = 1; t <= forecastGrowthRates.length; t++) {
    const g = forecastGrowthRates[t - 1];
    currentFCF = currentFCF * (1 + g);
    forecastFCF.push(Math.round(currentFCF * 100) / 100);

    // Midpoint discounting: cash flows occur evenly across the fiscal year (t - 0.5)
    const discountFactor = Math.pow(1 + safeWacc, t - 0.5);
    const pv = currentFCF / discountFactor;
    presentValueFCF.push(Math.round(pv * 100) / 100);
    sumPVForecast += pv;
  }

  // Terminal Value using Gordon Growth Model
  const n = forecastGrowthRates.length;
  const terminalFCF = currentFCF * (1 + safeTerminalG);
  const terminalValue = terminalFCF / (safeWacc - safeTerminalG);

  // Discount Terminal Value to present (at year n)
  const terminalDiscountFactor = Math.pow(1 + safeWacc, n);
  const presentValueTerminalValue = terminalValue / terminalDiscountFactor;

  // Enterprise & Equity Value
  const enterpriseValue = sumPVForecast + presentValueTerminalValue;
  const equityValue = enterpriseValue + cashAndEquivalents - totalDebt;

  // Intrinsic Price Per Share
  const intrinsicValuePerShare =
    sharesOutstanding > 0 ? Math.max(0, Math.round((equityValue / sharesOutstanding) * 100) / 100) : 0;

  let marginOfSafetyPct = 0;
  if (currentSpotPrice && currentSpotPrice > 0) {
    marginOfSafetyPct = Math.round(((intrinsicValuePerShare - currentSpotPrice) / currentSpotPrice) * 1000) / 10;
  }

  return {
    forecastFCF,
    presentValueFCF,
    sumPVForecast: Math.round(sumPVForecast * 100) / 100,
    terminalValue: Math.round(terminalValue * 100) / 100,
    presentValueTerminalValue: Math.round(presentValueTerminalValue * 100) / 100,
    enterpriseValue: Math.round(enterpriseValue * 100) / 100,
    equityValue: Math.round(equityValue * 100) / 100,
    intrinsicValuePerShare,
    marginOfSafetyPct,
  };
}
