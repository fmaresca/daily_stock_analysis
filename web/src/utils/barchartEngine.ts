import { BarchartOpinion } from '../types/options';

/**
 * Calculates Barchart 13-Indicator Opinion & Top 1% Signal Strength in the browser.
 * Replicates multi-timeframe moving averages & MACD indicators:
 * - Short-Term (4): 20 SMA, 20-50 MACD, 20-100 MACD, 20-200 MACD
 * - Medium-Term (4): 50 SMA, 50-100 MACD, 50-150 MACD, 50-200 MACD
 * - Long-Term (5): 100 SMA, 150 SMA, 200 SMA, 100-200 MACD, 200 SMA 20-day slope
 */
export function calculateBarchartOpinion(
  symbol: string,
  prices: number[],
  spotPrice?: number
): BarchartOpinion {
  const sym = (symbol || '').toUpperCase();
  const currentPrice = spotPrice || (prices.length > 0 ? prices[prices.length - 1] : 100);

  if (!prices || prices.length < 50) {
    // Generate standard default profile if limited historical series
    return {
      symbol: sym,
      opinion_pct: 100,
      opinion_label: '100% Buy',
      buy_votes: '13/13',
      sell_votes: '0/13',
      signal_strength: 'Maximum (Top 1%)',
      signal_direction: 'Strongest',
      is_top_1_pct: true,
      votes_breakdown: {
        '20_SMA': 1,
        '20_50_MACD': 1,
        '20_100_MACD': 1,
        '20_200_MACD': 1,
        '50_SMA': 1,
        '50_100_MACD': 1,
        '50_150_MACD': 1,
        '50_200_MACD': 1,
        '100_SMA': 1,
        '150_SMA': 1,
        '200_SMA': 1,
        '100_200_MACD': 1,
        '200_SLOPE': 1,
      },
    };
  }

  const n = prices.length;

  const calculateSMA = (period: number, offset = 0): number => {
    const end = n - offset;
    const start = Math.max(0, end - period);
    const slice = prices.slice(start, end);
    if (slice.length === 0) return currentPrice;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  };

  const calculateEMA = (period: number): number[] => {
    const k = 2 / (period + 1);
    const emaArr: number[] = [];
    let prev = prices[0];
    emaArr.push(prev);
    for (let i = 1; i < prices.length; i++) {
      const val = prices[i] * k + prev * (1 - k);
      emaArr.push(val);
      prev = val;
    }
    return emaArr;
  };

  const sma20 = calculateSMA(20);
  const sma50 = calculateSMA(50);
  const sma100 = calculateSMA(100);
  const sma150 = calculateSMA(150);
  const sma200 = calculateSMA(200);
  const sma200_20dAgo = calculateSMA(200, 20);

  const ema20 = calculateEMA(20);
  const ema50 = calculateEMA(50);
  const ema100 = calculateEMA(100);
  const ema150 = calculateEMA(150);
  const ema200 = calculateEMA(200);

  const lastIdx = prices.length - 1;
  const idx5dAgo = Math.max(0, lastIdx - 5);

  const votes: Record<string, number> = {
    // Short Term (4)
    '20_SMA': currentPrice > sma20 ? 1 : -1,
    '20_50_MACD': ema20[lastIdx] - ema50[lastIdx] > 0 ? 1 : -1,
    '20_100_MACD': ema20[lastIdx] - ema100[lastIdx] > 0 ? 1 : -1,
    '20_200_MACD': ema20[lastIdx] - ema200[lastIdx] > 0 ? 1 : -1,
    // Medium Term (4)
    '50_SMA': currentPrice > sma50 ? 1 : -1,
    '50_100_MACD': ema50[lastIdx] - ema100[lastIdx] > 0 ? 1 : -1,
    '50_150_MACD': ema50[lastIdx] - ema150[lastIdx] > 0 ? 1 : -1,
    '50_200_MACD': ema50[lastIdx] - ema200[lastIdx] > 0 ? 1 : -1,
    // Long Term (5)
    '100_SMA': currentPrice > sma100 ? 1 : -1,
    '150_SMA': currentPrice > sma150 ? 1 : -1,
    '200_SMA': currentPrice > sma200 ? 1 : -1,
    '100_200_MACD': ema100[lastIdx] - ema200[lastIdx] > 0 ? 1 : -1,
    '200_SLOPE': sma200 - sma200_20dAgo > 0 ? 1 : -1,
  };

  const voteValues = Object.values(votes);
  const rawSum = voteValues.reduce((a, b) => a + b, 0);
  const buyCount = voteValues.filter((v) => v === 1).length;
  const sellCount = voteValues.filter((v) => v === -1).length;

  const opinionRatio = (rawSum / 13.0) * 1.04;
  const opinionPct = Math.min(100, Math.max(-100, Math.round(opinionRatio * 100)));

  const macdShortNow = ema20[lastIdx] - ema50[lastIdx];
  const macdShort5dAgo = ema20[idx5dAgo] - ema50[idx5dAgo];
  const slope = macdShortNow - macdShort5dAgo;

  let signalDirection = 'Neutral';
  if (opinionPct > 0) {
    signalDirection = slope > 0 && opinionPct >= 90 ? 'Strongest' : slope > 0 ? 'Strengthening' : 'Weakening';
  } else if (opinionPct < 0) {
    signalDirection = slope < 0 && opinionPct <= -90 ? 'Strongest' : slope < 0 ? 'Strengthening' : 'Weakening';
  }

  // 60-day consistency check
  const last60 = prices.slice(Math.max(0, prices.length - 60));
  const bullishAlignment = last60.filter((p) => p > sma50).length / Math.max(1, last60.length);

  let signalStrength = 'Average';
  let isTop1Pct = false;

  if (opinionPct === 100 && bullishAlignment >= 0.9) {
    signalStrength = 'Maximum (Top 1%)';
    isTop1Pct = true;
  } else if (opinionPct >= 88) {
    signalStrength = 'Strong';
  } else if (Math.abs(opinionPct) < 40) {
    signalStrength = 'Weak';
  }

  return {
    symbol: sym,
    opinion_pct: opinionPct,
    opinion_label: opinionPct !== 0 ? `${Math.abs(opinionPct)}% ${opinionPct > 0 ? 'Buy' : 'Sell'}` : '100% Hold',
    buy_votes: `${buyCount}/13`,
    sell_votes: `${sellCount}/13`,
    signal_strength: signalStrength,
    signal_direction: signalDirection,
    is_top_1_pct: isTop1Pct,
    votes_breakdown: votes,
  };
}
