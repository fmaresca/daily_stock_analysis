/**
 * Broker Order Staging & 1-Click Execution Payloads for DeltaHarvest
 *
 * Supports:
 * 1. Charles Schwab Retail Trader API (REST JSON schema with orderLegCollection & TRIGGER brackets)
 * 2. Interactive Brokers (TWS BasketTrader CSV & Client Portal Web API JSON)
 * 3. Thinkorswim (ToS) copyable execution syntax
 *
 * Enforces Core Platform Rules:
 * - 80% Profit-Taking Buy-to-Close GTC Limit (0.20 * Premium)
 * - 0.50 Delta / 200% Premium Defensive Roll Trigger
 * - Max 10% Single-Underlying Concentration Guardrail
 */

import { OptionOpportunity, MultiLegSpread, TickerMeta } from '../types/options';

export type BrokerType = 'SCHWAB' | 'IBKR' | 'THINKORSWIM';
export type AccountType = 'REG_T_MARGIN' | 'CASH_ACCOUNT' | 'PORTFOLIO_MARGIN';
export type PriceExecutionType = 'MIDPOINT' | 'NATURAL' | 'CUSTOM';

export interface OrderLeg {
  instruction: 'BUY_TO_OPEN' | 'SELL_TO_OPEN' | 'BUY_TO_CLOSE' | 'SELL_TO_CLOSE';
  assetType: 'OPTION' | 'EQUITY';
  symbol: string;
  underlyingSymbol: string;
  strike: number;
  type: 'PUT' | 'CALL';
  expiration: string;
  dte: number;
  quantity: number;
  delta: number;
  estPrice: number;
}

export interface StagedBracketOrder {
  id: string;
  strategyName: string;
  underlyingSymbol: string;
  spotPrice: number;
  quantity: number;
  broker: BrokerType;
  accountType: AccountType;
  pricingType: PriceExecutionType;

  // Pricing & Cash Impact
  limitPrice: number;
  netCreditPerContract: number;
  totalNetCredit: number;
  takeProfitPrice: number; // 80% decay (buy back at 20% initial price)
  stopLossPrice: number;   // 200% of initial price

  // Collateral & Margin
  marginRequiredPerContract: number;
  totalMarginRequired: number;
  capitalSavedByPm?: number;

  // Order Legs
  entryLegs: OrderLeg[];
  takeProfitLegs: OrderLeg[];
  stopLossLegs: OrderLeg[];

  // Risk Circuit Breakers
  concentrationPct: number;
  concentrationWarning: boolean;
  earningsWarning: boolean;
  earningsDate?: string;
  dteWarning: boolean;

  // Generated Payloads
  schwabJsonPayload: string;
  ibkrBasketCsv: string;
  ibkrApiJson: string;
  thinkorswimString: string;
}

/**
 * Formats standard OCC option symbol (e.g., AAPL  261018P00220000)
 */
export function formatOccSymbol(symbol: string, expStr: string, type: 'PUT' | 'CALL', strike: number): string {
  // expStr in YYYY-MM-DD
  const parts = expStr.split('-');
  const yy = parts[0] ? parts[0].slice(2) : '26';
  const mm = parts[1] || '01';
  const dd = parts[2] || '01';
  const typeLetter = type === 'PUT' ? 'P' : 'C';
  const strikePadded = Math.round(strike * 1000).toString().padStart(8, '0');
  const symPadded = symbol.padEnd(6, ' ');
  return `${symPadded}${yy}${mm}${dd}${typeLetter}${strikePadded}`;
}

/**
 * Formats Thinkorswim option symbol (e.g., .SPY261018P550)
 */
export function formatToSSymbol(symbol: string, expStr: string, type: 'PUT' | 'CALL', strike: number): string {
  const parts = expStr.split('-');
  const yy = parts[0] ? parts[0].slice(2) : '26';
  const mm = parts[1] || '01';
  const dd = parts[2] || '01';
  const typeLetter = type === 'PUT' ? 'P' : 'C';
  return `.${symbol}${yy}${mm}${dd}${typeLetter}${strike}`;
}

/**
 * Stages order for a Single-Leg Option Opportunity (CSP or CC)
 */
export function stageSingleLegOrder(
  opportunity: OptionOpportunity,
  tickerMeta: TickerMeta | undefined,
  quantity: number = 1,
  broker: BrokerType = 'SCHWAB',
  accountType: AccountType = 'REG_T_MARGIN',
  pricingType: PriceExecutionType = 'MIDPOINT',
  customPrice?: number,
  portfolioEquity: number = 100000
): StagedBracketOrder {
  const isPut = opportunity.strategy === 'CSP';
  const optType: 'PUT' | 'CALL' = isPut ? 'PUT' : 'CALL';
  const spot = opportunity.current_price;
  const strike = opportunity.strike;
  const exp = opportunity.expiration;
  const dte = opportunity.dte;
  const delta = opportunity.delta;

  // Determine Entry Price
  let limitPrice = opportunity.mid;
  if (pricingType === 'NATURAL') {
    limitPrice = opportunity.bid; // conservative fill
  } else if (pricingType === 'CUSTOM' && customPrice !== undefined) {
    limitPrice = customPrice;
  }
  limitPrice = Math.max(0.05, Math.round(limitPrice * 100) / 100);

  // 80% Max Profit Rule: Buy to close when 80% premium has decayed (price is 20% of limit)
  const takeProfitPrice = Math.max(0.01, Math.round(limitPrice * 0.20 * 100) / 100);
  // Defensive Stop / Roll trigger at 200% of collected premium
  const stopLossPrice = Math.round(limitPrice * 2.0 * 100) / 100;

  const netCreditPerContract = Math.round(limitPrice * 100);
  const totalNetCredit = netCreditPerContract * quantity;

  // Margin calculation: Reg-T CSP requires 100% strike cash
  // CC requires 100 shares of stock
  let marginPerContract = isPut ? Math.round(strike * 100) : Math.round(spot * 100);
  if (accountType === 'PORTFOLIO_MARGIN' && isPut) {
    // TIMS Portfolio Margin typically requires ~15% - 18% of spot
    marginPerContract = Math.round(spot * 100 * 0.18);
  }
  const totalMarginRequired = marginPerContract * quantity;
  const capitalSavedByPm = accountType === 'PORTFOLIO_MARGIN' && isPut
    ? Math.round((strike * 100 - marginPerContract) * quantity)
    : 0;

  // Risk Circuit Breakers
  const concentrationPct = Math.round((totalMarginRequired / portfolioEquity) * 1000) / 10;
  const concentrationWarning = concentrationPct > 10.0;
  const earningsWarning = !!tickerMeta?.earnings_within_7d;
  const earningsDate = tickerMeta?.next_earnings_date;
  const dteWarning = dte < 5 || dte > 60;

  const occSymbol = formatOccSymbol(opportunity.symbol, exp, optType, strike);
  const tosSymbol = formatToSSymbol(opportunity.symbol, exp, optType, strike);

  // Entry Leg
  const entryLegs: OrderLeg[] = [
    {
      instruction: 'SELL_TO_OPEN',
      assetType: 'OPTION',
      symbol: occSymbol,
      underlyingSymbol: opportunity.symbol,
      strike,
      type: optType,
      expiration: exp,
      dte,
      quantity,
      delta,
      estPrice: limitPrice,
    },
  ];

  // Take-Profit Leg (Buy to close)
  const takeProfitLegs: OrderLeg[] = [
    {
      instruction: 'BUY_TO_CLOSE',
      assetType: 'OPTION',
      symbol: occSymbol,
      underlyingSymbol: opportunity.symbol,
      strike,
      type: optType,
      expiration: exp,
      dte,
      quantity,
      delta,
      estPrice: takeProfitPrice,
    },
  ];

  // Stop-Loss Leg
  const stopLossLegs: OrderLeg[] = [
    {
      instruction: 'BUY_TO_CLOSE',
      assetType: 'OPTION',
      symbol: occSymbol,
      underlyingSymbol: opportunity.symbol,
      strike,
      type: optType,
      expiration: exp,
      dte,
      quantity,
      delta,
      estPrice: stopLossPrice,
    },
  ];

  // 1. Generate Charles Schwab REST Order JSON
  const schwabPayloadObj = {
    orderType: 'LIMIT',
    session: 'NORMAL',
    price: limitPrice,
    duration: 'DAY',
    orderStrategyType: 'TRIGGER',
    orderLegCollection: [
      {
        instruction: 'SELL_TO_OPEN',
        quantity,
        instrument: {
          symbol: occSymbol,
          assetType: 'OPTION',
        },
      },
    ],
    childOrderStrategies: [
      {
        orderType: 'LIMIT',
        session: 'NORMAL',
        price: takeProfitPrice,
        duration: 'GOOD_TILL_CANCEL',
        orderStrategyType: 'SINGLE',
        orderLegCollection: [
          {
            instruction: 'BUY_TO_CLOSE',
            quantity,
            instrument: {
              symbol: occSymbol,
              assetType: 'OPTION',
            },
          },
        ],
      },
    ],
  };

  // 2. Generate IBKR BasketTrader CSV row
  // Format: Action,Quantity,Symbol,SecType,Exchange,Currency,TimeInForce,OrderType,LmtPrice,Strike,Right,Expiry
  const expIbkr = exp.replace(/-/g, '');
  const rightLetter = optType === 'PUT' ? 'P' : 'C';
  const ibkrBasketCsv = [
    'Action,Quantity,Symbol,SecType,Exchange,Currency,TimeInForce,OrderType,LmtPrice,Strike,Right,Expiry',
    `SELL,${quantity},${opportunity.symbol},OPT,SMART,USD,DAY,LMT,${limitPrice.toFixed(2)},${strike},${rightLetter},${expIbkr}`,
    `BUY,${quantity},${opportunity.symbol},OPT,SMART,USD,GTC,LMT,${takeProfitPrice.toFixed(2)},${strike},${rightLetter},${expIbkr}`,
  ].join('\n');

  // 3. Generate IBKR Web API JSON
  const ibkrApiJson = JSON.stringify(
    {
      orders: [
        {
          conid: 0,
          secType: 'OPT',
          symbol: opportunity.symbol,
          strike,
          right: rightLetter,
          expiry: expIbkr,
          orderType: 'LMT',
          price: limitPrice,
          side: 'SELL',
          tif: 'DAY',
          quantity,
          useAdaptive: true,
        },
      ],
    },
    null,
    2
  );

  // 4. Thinkorswim Syntax: SELL -1 SPY 100 18 OCT 26 550 PUT @2.85 LMT
  // Formatted expiry e.g. 18 OCT 26
  const dateObj = new Date(exp + 'T00:00:00');
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const formattedToSDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear().toString().slice(2)}`;
  const thinkorswimString = `SELL -${quantity} ${opportunity.symbol} 100 ${formattedToSDate} ${strike} ${optType} @${limitPrice.toFixed(2)} LMT [BRACKET: 80% PROFIT @${takeProfitPrice.toFixed(2)} LMT GTC / DEFENSIVE STOP @${stopLossPrice.toFixed(2)}]`;

  return {
    id: `STG_${opportunity.id}_${Date.now()}`,
    strategyName: isPut ? `Cash-Secured Put (${strike}P)` : `Covered Call (${strike}C)`,
    underlyingSymbol: opportunity.symbol,
    spotPrice: spot,
    quantity,
    broker,
    accountType,
    pricingType,
    limitPrice,
    netCreditPerContract,
    totalNetCredit,
    takeProfitPrice,
    stopLossPrice,
    marginRequiredPerContract: marginPerContract,
    totalMarginRequired,
    capitalSavedByPm,
    entryLegs,
    takeProfitLegs,
    stopLossLegs,
    concentrationPct,
    concentrationWarning,
    earningsWarning,
    earningsDate,
    dteWarning,
    schwabJsonPayload: JSON.stringify(schwabPayloadObj, null, 2),
    ibkrBasketCsv,
    ibkrApiJson,
    thinkorswimString,
  };
}

/**
 * Stages order for a Defined-Risk Multi-Leg Spread (Bull Put Spread, Bear Call Spread, Iron Condor)
 */
export function stageMultiLegSpreadOrder(
  spread: MultiLegSpread,
  quantity: number = 1,
  broker: BrokerType = 'SCHWAB',
  accountType: AccountType = 'REG_T_MARGIN',
  pricingType: PriceExecutionType = 'MIDPOINT',
  customPrice?: number,
  portfolioEquity: number = 100000
): StagedBracketOrder {
  const spot = spread.current_price ?? (spread.short_strike || 100);
  const exp = spread.expiration;
  const dte = spread.dte;

  let limitPrice = spread.net_credit;
  if (pricingType === 'CUSTOM' && customPrice !== undefined) {
    limitPrice = customPrice;
  }
  limitPrice = Math.max(0.05, Math.round(limitPrice * 100) / 100);

  // 80% Max Profit Rule for credit spreads
  const takeProfitPrice = Math.max(0.02, Math.round(limitPrice * 0.20 * 100) / 100);
  const stopLossPrice = Math.round((spread.spread_width - limitPrice) * 0.75 * 100) / 100;

  const netCreditPerContract = Math.round(limitPrice * 100);
  const totalNetCredit = netCreditPerContract * quantity;

  // Max Loss = Spread Width - Net Credit
  const marginPerContract = Math.round(spread.max_loss * 100);
  const totalMarginRequired = marginPerContract * quantity;

  // Risk Circuit Breakers
  const concentrationPct = Math.round((totalMarginRequired / portfolioEquity) * 1000) / 10;
  const concentrationWarning = concentrationPct > 10.0;
  const earningsWarning = false; // Spreads are defined-risk, but tracked
  const dteWarning = dte < 5 || dte > 60;

  const shortOcc = formatOccSymbol(spread.symbol, exp, spread.short_type.toUpperCase() as 'PUT' | 'CALL', spread.short_strike);
  const longOcc = formatOccSymbol(spread.symbol, exp, spread.long_type.toUpperCase() as 'PUT' | 'CALL', spread.long_strike);

  const entryLegs: OrderLeg[] = [
    {
      instruction: 'SELL_TO_OPEN',
      assetType: 'OPTION',
      symbol: shortOcc,
      underlyingSymbol: spread.symbol,
      strike: spread.short_strike,
      type: spread.short_type.toUpperCase() as 'PUT' | 'CALL',
      expiration: exp,
      dte,
      quantity,
      delta: spread.short_delta,
      estPrice: spread.net_credit * 1.3,
    },
    {
      instruction: 'BUY_TO_OPEN',
      assetType: 'OPTION',
      symbol: longOcc,
      underlyingSymbol: spread.symbol,
      strike: spread.long_strike,
      type: spread.long_type.toUpperCase() as 'PUT' | 'CALL',
      expiration: exp,
      dte,
      quantity,
      delta: spread.long_delta,
      estPrice: spread.net_credit * 0.3,
    },
  ];

  // If Iron Condor, add Call Wing
  if (spread.strategy === 'IRON_CONDOR' && spread.call_short_strike && spread.call_long_strike) {
    const callShortOcc = formatOccSymbol(spread.symbol, exp, 'CALL', spread.call_short_strike);
    const callLongOcc = formatOccSymbol(spread.symbol, exp, 'CALL', spread.call_long_strike);
    entryLegs.push(
      {
        instruction: 'SELL_TO_OPEN',
        assetType: 'OPTION',
        symbol: callShortOcc,
        underlyingSymbol: spread.symbol,
        strike: spread.call_short_strike,
        type: 'CALL',
        expiration: exp,
        dte,
        quantity,
        delta: spread.call_short_delta || 0.15,
        estPrice: spread.net_credit * 0.6,
      },
      {
        instruction: 'BUY_TO_OPEN',
        assetType: 'OPTION',
        symbol: callLongOcc,
        underlyingSymbol: spread.symbol,
        strike: spread.call_long_strike,
        type: 'CALL',
        expiration: exp,
        dte,
        quantity,
        delta: spread.call_long_delta || 0.05,
        estPrice: spread.net_credit * 0.15,
      }
    );
  }

  // 1. Generate Charles Schwab Complex Vertical/Condor Order Payload
  const schwabStrategyType = spread.strategy === 'IRON_CONDOR' ? 'IRON_CONDOR' : 'VERTICAL';
  const schwabPayloadObj = {
    orderType: 'NET_CREDIT',
    session: 'NORMAL',
    price: limitPrice,
    duration: 'DAY',
    complexOrderStrategyType: schwabStrategyType,
    orderStrategyType: 'TRIGGER',
    orderLegCollection: entryLegs.map((leg) => ({
      instruction: leg.instruction,
      quantity: leg.quantity,
      instrument: {
        symbol: leg.symbol,
        assetType: 'OPTION',
      },
    })),
    childOrderStrategies: [
      {
        orderType: 'NET_DEBIT',
        session: 'NORMAL',
        price: takeProfitPrice,
        duration: 'GOOD_TILL_CANCEL',
        complexOrderStrategyType: schwabStrategyType,
        orderStrategyType: 'SINGLE',
        orderLegCollection: entryLegs.map((leg) => ({
          instruction: leg.instruction === 'SELL_TO_OPEN' ? 'BUY_TO_CLOSE' : 'SELL_TO_CLOSE',
          quantity: leg.quantity,
          instrument: {
            symbol: leg.symbol,
            assetType: 'OPTION',
          },
        })),
      },
    ],
  };

  // 2. Generate IBKR BasketTrader CSV
  const expIbkr = exp.replace(/-/g, '');
  const ibkrRows = [
    'Action,Quantity,Symbol,SecType,Exchange,Currency,TimeInForce,OrderType,LmtPrice,Strike,Right,Expiry',
    ...entryLegs.map(
      (leg) =>
        `${leg.instruction === 'SELL_TO_OPEN' ? 'SELL' : 'BUY'},${leg.quantity},${spread.symbol},OPT,SMART,USD,DAY,LMT,${limitPrice.toFixed(2)},${leg.strike},${leg.type === 'PUT' ? 'P' : 'C'},${expIbkr}`
    ),
  ];
  const ibkrBasketCsv = ibkrRows.join('\n');

  // 3. Generate Thinkorswim syntax
  const dateObj = new Date(exp + 'T00:00:00');
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const formattedToSDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear().toString().slice(2)}`;
  const thinkorswimString =
    spread.strategy === 'IRON_CONDOR'
      ? `SELL -${quantity} IRON CONDOR ${spread.symbol} 100 ${formattedToSDate} ${spread.long_strike}/${spread.short_strike}/${spread.call_short_strike}/${spread.call_long_strike} @${limitPrice.toFixed(2)} Crd LMT [BRACKET: 80% PROFIT @${takeProfitPrice.toFixed(2)} Dbt GTC]`
      : `SELL -${quantity} VERTICAL ${spread.symbol} 100 ${formattedToSDate} ${spread.short_strike}/${spread.long_strike} ${spread.short_type.toUpperCase()} @${limitPrice.toFixed(2)} Crd LMT [BRACKET: 80% PROFIT @${takeProfitPrice.toFixed(2)} Dbt GTC]`;

  return {
    id: `STG_${spread.id}_${Date.now()}`,
    strategyName: spread.strategy_name,
    underlyingSymbol: spread.symbol,
    spotPrice: spot,
    quantity,
    broker,
    accountType,
    pricingType,
    limitPrice,
    netCreditPerContract,
    totalNetCredit,
    takeProfitPrice,
    stopLossPrice,
    marginRequiredPerContract: marginPerContract,
    totalMarginRequired,
    capitalSavedByPm: 0,
    entryLegs,
    takeProfitLegs: [],
    stopLossLegs: [],
    concentrationPct,
    concentrationWarning,
    earningsWarning,
    dteWarning,
    schwabJsonPayload: JSON.stringify(schwabPayloadObj, null, 2),
    ibkrBasketCsv,
    ibkrApiJson: JSON.stringify({ strategy: spread.strategy, legs: entryLegs, limitPrice, quantity }, null, 2),
    thinkorswimString,
  };
}

export interface SubmittedOrderRecord {
  id: string;
  stagedOrderId: string;
  symbol: string;
  strategy: string;
  broker: BrokerType;
  quantity: number;
  netCredit: number;
  limitPrice: number;
  mode: 'SIMULATION' | 'LIVE';
  status: 'SUBMITTED' | 'PREVIEWED' | 'FAILED' | 'FILLED';
  timestamp: string;
  brokerOrderId?: string;
  notes?: string;
}

export function getSubmittedOrders(): SubmittedOrderRecord[] {
  try {
    const saved = localStorage.getItem('deltaharvest_submitted_orders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load submitted orders:', e);
  }
  return [];
}

export function recordSubmittedOrder(order: SubmittedOrderRecord): void {
  try {
    const existing = getSubmittedOrders();
    const updated = [order, ...existing.filter((o) => o.id !== order.id)].slice(0, 100);
    localStorage.setItem('deltaharvest_submitted_orders', JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save submitted order:', e);
  }
}

export function clearSubmittedOrders(): void {
  try {
    localStorage.removeItem('deltaharvest_submitted_orders');
  } catch (e) {
    console.warn('Failed to clear submitted orders:', e);
  }
}

export function addExecutedOrderToPortfolioBook(order: StagedBracketOrder): void {
  try {
    const raw = localStorage.getItem('deltaharvest_portfolio_book');
    const existing = raw ? JSON.parse(raw) : [];

    const shortLeg = order.entryLegs.find((l) => l.instruction === 'SELL_TO_OPEN') || order.entryLegs[0];
    const longLeg = order.entryLegs.find((l) => l.instruction === 'BUY_TO_OPEN');

    const posType =
      order.strategyName.includes('Put') || order.strategyName.includes('CSP')
        ? 'CSP'
        : order.strategyName.includes('Covered Call') || order.strategyName.includes('CC')
        ? 'COVERED_CALL'
        : order.strategyName.includes('PMCC')
        ? 'PMCC'
        : 'CREDIT_SPREAD';

    const newPos = {
      id: `POS_${order.underlyingSymbol}_${Date.now().toString().slice(-4)}`,
      symbol: order.underlyingSymbol,
      type: posType,
      quantity: order.quantity,
      spotPrice: order.spotPrice,
      strike: shortLeg?.strike || 0,
      strike2: longLeg?.strike,
      dte: shortLeg?.dte || 30,
      entryPrice: Math.abs(order.limitPrice),
      currentOptionPrice: Math.abs(order.limitPrice),
      iv: 25,
      delta: shortLeg?.delta || -0.20,
      theta: 0.15,
      vega: -0.15,
      beta: 1.0,
    };

    const updated = [newPos, ...(Array.isArray(existing) ? existing : [])];
    localStorage.setItem('deltaharvest_portfolio_book', JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to sync executed order to portfolio book:', e);
  }
}


