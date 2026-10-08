/**
 * Client-Side Holdings OCR Parser using Tesseract.js
 * 
 * Free-tier, browser-only OCR: Holdings screenshots NEVER leave the client browser.
 * Extracts symbols, quantities, and cost basis from brokerage screenshots.
 * Provides per-row confidence scoring and human-in-the-loop review gating.
 */

export interface ParsedHoldingsRow {
  id: string;
  symbol: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  account: string;
  confidence: number; // 0 - 100
  isLowConfidence: boolean;
  issues: string[];
}

export interface HoldingsOcrResult {
  rawText: string;
  overallConfidence: number;
  rows: ParsedHoldingsRow[];
  detectedCash: number;
}

const COMMON_HEADER_WORDS = new Set([
  'SYMBOL', 'DESCRIPTION', 'QTY', 'QUANTITY', 'PRICE', 'CHANGE', 'MKT', 'MARKET',
  'VAL', 'VALUE', 'COST', 'BASIS', 'GAIN', 'LOSS', 'RATINGS', 'REINVEST', 'ASSET',
  'TYPE', 'ACCOUNT', 'POSITIONS', 'TOTAL', 'SHARES', 'PORTFOLIO', 'TODAY'
]);

/**
 * Runs client-side OCR on an image file or blob
 */
export async function performHoldingsOcr(
  imageSource: File | Blob | string,
  onProgress?: (progressPct: number) => void
): Promise<{ text: string; confidence: number }> {
  // @ts-ignore
  const tesseractModule = await import('tesseract.js');
  const createWorkerFn = tesseractModule.createWorker || tesseractModule.default?.createWorker;
  const worker = await createWorkerFn('eng');

  try {
    const ret = await worker.recognize(imageSource);
    const text = ret.data.text || '';
    const confidence = Math.round(ret.data.confidence || 0);
    return { text, confidence };
  } finally {
    await worker.terminate();
  }
}

/**
 * Parses raw OCR text into structured position candidate rows with confidence scoring
 */
export function parseOcrTextToHoldings(ocrText: string, defaultAccount = 'Brokerage Screenshot'): HoldingsOcrResult {
  const rawLines = ocrText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: ParsedHoldingsRow[] = [];
  let detectedCash = 0;
  let lineIdx = 0;

  for (const line of rawLines) {
    lineIdx++;
    // Normalize line tokens
    const tokens = line.replace(/,/g, '').split(/\s+/).filter(Boolean);
    if (tokens.length < 2) continue;

    // Check for Cash row
    if (/cash|money\s+market|spaxx|swvxx|fdrxx/i.test(line)) {
      const numbers = line.match(/\$?([0-9]+(?:\.[0-9]+)?)/g);
      if (numbers && numbers.length > 0) {
        const lastVal = parseFloat(numbers[numbers.length - 1].replace('$', ''));
        if (!isNaN(lastVal) && lastVal > 0) {
          detectedCash = Math.max(detectedCash, lastVal);
        }
      }
      continue;
    }

    // Skip table header lines
    const upperFirst = tokens[0].toUpperCase();
    if (COMMON_HEADER_WORDS.has(upperFirst)) continue;

    // Look for ticker symbol candidate (1 to 5 uppercase letters)
    let symbolCandidate = '';
    let symbolTokenIdx = -1;

    for (let i = 0; i < Math.min(tokens.length, 3); i++) {
      const t = tokens[i].toUpperCase().replace(/[^A-Z]/g, '');
      if (t.length >= 1 && t.length <= 5 && !COMMON_HEADER_WORDS.has(t)) {
        symbolCandidate = t;
        symbolTokenIdx = i;
        break;
      }
    }

    if (!symbolCandidate) continue;

    // Extract numbers after symbol
    const numericCandidates: number[] = [];
    for (let i = symbolTokenIdx + 1; i < tokens.length; i++) {
      const cleanNum = tokens[i].replace(/[$,]/g, '');
      const parsedNum = parseFloat(cleanNum);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        numericCandidates.push(parsedNum);
      }
    }

    let quantity = 0;
    let price = 0;
    let costBasis = 0;
    const issues: string[] = [];

    if (numericCandidates.length >= 1) {
      quantity = numericCandidates[0];
    } else {
      issues.push('Missing quantity');
    }

    if (numericCandidates.length >= 2) {
      price = numericCandidates[1];
      costBasis = price;
    } else {
      issues.push('Missing price/cost basis');
    }

    // Confidence scoring
    let confidence = 85;
    if (issues.length === 1) confidence -= 30;
    if (issues.length >= 2) confidence -= 50;

    // Sanity checks on quantity and symbol
    if (symbolCandidate.length === 1 && !['C', 'F', 'T', 'V', 'K'].includes(symbolCandidate)) {
      confidence -= 20;
      issues.push('Single-letter symbol may be OCR artifact');
    }

    if (quantity <= 0 || isNaN(quantity)) {
      confidence -= 30;
    }

    confidence = Math.max(10, Math.min(99, confidence));
    const isLowConfidence = confidence < 60 || issues.length > 0;

    const marketValue = Math.round(quantity * (price || costBasis) * 100) / 100;

    rows.push({
      id: `ocr_row_${lineIdx}_${symbolCandidate}`,
      symbol: symbolCandidate,
      quantity,
      costBasis: Math.round(costBasis * 100) / 100,
      currentPrice: Math.round(price * 100) / 100,
      marketValue,
      account: defaultAccount,
      confidence,
      isLowConfidence,
      issues,
    });
  }

  const overallConfidence = rows.length > 0
    ? Math.round(rows.reduce((acc, r) => acc + r.confidence, 0) / rows.length)
    : 0;

  return {
    rawText: ocrText,
    overallConfidence,
    rows,
    detectedCash,
  };
}

/**
 * Converts confirmed rows to Schwab Positions CSV format so that
 * all existing calculations, cash ledger encumbrances, and watchlist syncs run byte-for-byte.
 */
export function convertConfirmedRowsToSchwabCsv(
  rows: ParsedHoldingsRow[],
  accountName = 'Screenshot Import Account',
  cashAmount = 0
): string {
  const lines: string[] = [
    `"Positions for account ${accountName} as of 04:00 PM ET, 2026/01/01",,,,,,,,,,,,,,,,`,
    ',,,,,,,,,,,,,,,,',
    'Symbol,Description,Qty (Quantity),Price,Price Chng % (Price Change %),Price Chng $ (Price Change $),Mkt Val (Market Value),Cost Basis,Day Chng $ (Day Change $),Day Chng % (Day Change %),Gain $ (Gain/Loss $),Gain % (Gain/Loss %),Ratings,Reinvest?,Reinvest Capital Gains?,% of Acct (% of Account),Asset Type',
  ];

  let totalMktVal = 0;

  for (const r of rows) {
    if (!r.symbol || r.quantity <= 0) continue;
    const price = r.currentPrice || r.costBasis || 100.0;
    const mktVal = Math.round(r.quantity * price * 100) / 100;
    totalMktVal += mktVal;

    lines.push(
      `${r.symbol},${r.symbol} INC,"${r.quantity}",${price.toFixed(2)},0.00%,0.00,"$${mktVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ","$${mktVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ",$0.00 ,0.00%,"$0.00 ",0.00%,--,No,N/A,0.00%,Equity`
    );
  }

  // Include cash if detected or passed
  if (cashAmount > 0) {
    totalMktVal += cashAmount;
    lines.push(
      `Cash & Cash Investments,--,--,--,--,--,"$${cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ",--,$0.00 ,0%,--,--,--,--,--,0.00%,Cash and Money Market`
    );
  }

  lines.push(
    `Positions Total,,--,--,--,--,"$${totalMktVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ","$${totalMktVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ",$0.00 ,0.00%,"$0.00 ",0.00%,--,--,--,--,--`
  );

  return lines.join('\n');
}
