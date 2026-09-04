import { WeeklyScreenerRecord, ScreenerSourceType } from '../types/weeklyScreeners';

/**
 * Parses raw CSV text (from Barchart, MarketChameleon, or standard screener exports)
 * into typed WeeklyScreenerRecord array.
 */
export function parseScreenerCSV(
  csvText: string,
  sourceType: ScreenerSourceType = 'BARCHART'
): WeeklyScreenerRecord[] {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Find header line
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lineLower = lines[i].toLowerCase();
    if (
      lineLower.includes('symbol') ||
      lineLower.includes('ticker') ||
      lineLower.includes('last') ||
      lineLower.includes('price')
    ) {
      headerIdx = i;
      break;
    }
  }

  // Parse CSV line handling quotes
  const parseLine = (line: string): string[] => {
    const res: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        res.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    res.push(current.trim());
    return res.map((s) => s.replace(/^["']|["']$/g, '').trim());
  };

  const headers = parseLine(lines[headerIdx]).map((h) => h.toLowerCase());
  const records: WeeklyScreenerRecord[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    const getCol = (...aliases: string[]): string => {
      for (const a of aliases) {
        const lower = a.toLowerCase();
        if (row[lower] !== undefined && row[lower] !== '') {
          return row[lower];
        }
      }
      return '';
    };

    const symbol = getCol('symbol', 'ticker').toUpperCase();
    if (!symbol) continue;

    const name = getCol('name', 'symbolname', 'company', 'description') || symbol;
    const lastStr = getCol('last_price', 'last', 'price', 'dailylastprice', 'stock price') || '0';
    const chgStr = getCol('price_change', 'change', 'dailypricechange', 'net change', 'chg') || '0';
    const pctStr = getCol('percent_change', '%change', '% chg', 'dailypercentchange', 'percent change') || '0';
    const opinion = getCol('opinion', 'dailyopinion', 'signal', 'overall signal') || '100% Buy';
    const opinionPrev = getCol('opinion_previous', 'dailyopinionprevious', 'prev opinion');
    const opinionLw = getCol('opinion_last_week', 'dailyopinionlastweek', 'last week');
    const opinionLm = getCol('opinion_last_month', 'dailyopinionlastmonth', 'last month');

    const cleanNum = (str: string): number => {
      const cleaned = str.replace(/[$,%]/g, '').trim();
      const val = parseFloat(cleaned);
      return isNaN(val) ? 0 : val;
    };

    const lastPrice = cleanNum(lastStr);
    const priceChange = cleanNum(chgStr);
    let percentChange = cleanNum(pctStr);
    if (Math.abs(percentChange) < 0.2 && !pctStr.includes('%') && percentChange !== 0) {
      percentChange = Math.round(percentChange * 10000) / 100;
    }

    // Weekly Options column check
    const weeklyStr = getCol('has_weekly_options', 'hasweeklyoptions', 'weekly options', 'weeklys', 'has options');
    const hasWeekly =
      weeklyStr === '' ||
      weeklyStr.toLowerCase() === 'true' ||
      weeklyStr.toLowerCase() === 'yes' ||
      weeklyStr === '1';

    // Opinion percentage calculation
    let opinionPct = 100;
    const match = opinion.match(/(-?\d+)/);
    if (match) {
      opinionPct = parseFloat(match[1]);
      if (opinion.toLowerCase().includes('sell') && opinionPct > 0) {
        opinionPct = -opinionPct;
      }
    }

    const signalStrength =
      opinionPct >= 90 ? 'Maximum (Top 1%)' : opinionPct >= 60 ? 'Strong' : 'Moderate';
    const signalDirection =
      opinionPct >= 80 ? 'Strong Bullish' : opinionPct > 0 ? 'Bullish' : opinionPct === 0 ? 'Neutral' : 'Bearish';

    let recStrat = 'BULL_PUT_SPREAD';
    if (opinionPct >= 80 && hasWeekly) {
      recStrat = 'BULL_PUT_SPREAD';
    } else if (opinionPct >= 60) {
      recStrat = 'CSP';
    } else if (opinionPct <= -60) {
      recStrat = 'BEAR_CALL_SPREAD';
    } else {
      recStrat = 'IRON_CONDOR';
    }

    records.push({
      symbol,
      name,
      last_price: lastPrice,
      price_change: priceChange,
      percent_change: percentChange,
      opinion,
      opinion_pct: opinionPct,
      opinion_previous: opinionPrev,
      opinion_last_week: opinionLw,
      opinion_last_month: opinionLm,
      has_options: true,
      has_weekly_options: hasWeekly,
      signal_strength: signalStrength,
      signal_direction: signalDirection,
      source: sourceType === 'BARCHART' ? 'barchart' : sourceType === 'MARKETCHAMELEON' ? 'marketchameleon' : 'custom_upload',
      source_url: '',
      updated_at: new Date().toISOString(),
      recommended_strategy: recStrat,
      notes: `Ingested ${sourceType} Screener`,
    });
  }

  return records;
}
