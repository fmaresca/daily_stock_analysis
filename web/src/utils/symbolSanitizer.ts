/**
 * Quantitative Financial Symbol Sanitizer & CSV Header-Aware Audit Engine
 *
 * Provides:
 * 1. Intelligent tabular parsing that isolates the 'Symbol' column and ignores all other columns
 *    (e.g., Name, Last Price, Net Change, Barchart Opinion, Stability, Cadence, Strategy).
 * 2. Strict ticker format validation (1-5 uppercase alphabetic characters, optional .A/.B class).
 * 3. Comprehensive stoplist filtering out table headers, financial metrics, opinions, and English words.
 * 4. Whitelist preservation for legitimate ticker symbols that happen to be common words (e.g. NET, NOW, AI, LOW).
 * 5. Full telemetry audit results (valid symbols, detected headers, rejected non-ticker words).
 */

export interface SymbolExtractionAudit {
  validSymbols: string[];
  totalTokensScanned: number;
  validCount: number;
  rejectedTokens: string[];
  detectedHeaders: string[];
  wasStructuredCsv: boolean;
  auditMessage: string;
}

/**
 * Genuine stock and ETF tickers that are also dictionary words or abbreviations.
 * These must NEVER be rejected when they appear as standalone tickers or in a Symbol column.
 */
export const KNOWN_GENUINE_TICKERS = new Set<string>([
  'NET',   // Cloudflare Inc
  'NOW',   // ServiceNow Inc
  'AI',    // C3.ai Inc
  'ALL',   // Allstate Corp
  'LOW',   // Lowe's Companies Inc
  'CAT',   // Caterpillar Inc
  'MET',   // MetLife Inc
  'KEY',   // KeyCorp
  'WELL',  // Welltower Inc
  'FAST',  // Fastenal Co
  'HAS',   // Hasbro Inc
  'ARE',   // Alexandria Real Estate
  'HEAR',  // Turtle Beach Corp
  'RUN',   // Sunrun Inc
  'OUT',   // Outfront Media Inc
  'PLAY',  // Dave & Buster's Entertainment
  'ON',    // ON Semiconductor Corp
  'IT',    // Gartner Inc
  'SEE',   // Sealed Air Corp
  'PATH',  // UiPath Inc
  'SO',    // Southern Co
  'TRUE',  // TrueCar Inc
  'BEAT',  // HeartBeam Inc
  'BOOT',  // Boot Barn Holdings
  'CASH',  // Meta Financial Group
  'COOK',  // Traeger Inc
  'DECK',  // Deckers Outdoor Corp
  'FORM',  // FormFactor Inc
  'FOUR',  // Shift4 Payments
  'FUN',   // Cedar Fair LP
  'GAP',   // The Gap Inc
  'GLAD',  // Gladstone Capital
  'GOLD',  // Barrick Gold Corp
  'GOOD',  // Gladstone Commercial
  'GROW',  // U.S. Global Investors
  'HOPE',  // Hope Bancorp
  'HURT',  // Hertz Global (OTC/Historic)
  'JACK',  // Jack in the Box
  'JOB',   // Gee Group
  'LUV',   // Southwest Airlines Co
  'MAN',   // ManpowerGroup Inc
  'MO',    // Altria Group Inc
  'O',     // Realty Income Corp
  'POOL',  // Pool Corp
  'POST',  // Post Holdings
  'PSTG',  // Pure Storage
  'RIDE',  // Lordstown Motors
  'ROAD',  // Construction Partners
  'ROCK',  // Gibraltar Industries
  'ROOF',  // ETF Series
  'SAVE',  // Spirit Airlines
  'SEAS',  // SeaWorld Entertainment
  'SHAK',  // Shake Shack Inc
  'SHOP',  // Shopify Inc
  'SKIN',  // Beauty Health Co
  'SNAP',  // Snap Inc
  'SPOT',  // Spotify Technology
  'STEP',  // StepStone Group
  'SWIM',  // Latham Group
  'TALK',  // Talkspace Inc
  'TOWN',  // TowneBank
  'TREE',  // LendingTree Inc
  'TRIP',  // TripAdvisor Inc
  'WING',  // Wingstop Inc
  'WORK',  // Slack (Historic)
  'YELP',  // Yelp Inc
  'YUM',   // Yum! Brands Inc
]);

/**
 * Exhaustive stoplist of non-ticker words, table headers, column titles,
 * financial terms, strategy descriptors, opinions, and corporate entities.
 */
export const DISALLOWED_WORDS = new Set<string>([
  // Table headers & screener columns
  'SYMBOL', 'SYMBOLS', 'TICKER', 'TICKERS', 'NAME', 'COMPANY', 'DESCRIPTION', 'DESC',
  'PRICE', 'PRICES', 'LAST', 'LASTPRICE', 'NET', 'NETCHG', 'CHANGE', 'CHG', 'PCT',
  'PERCENT', 'PERCENTAGE', 'PERCCHG', 'HIGH', 'LOW', 'OPEN', 'CLOSE', 'VOLUME', 'VOL',
  'AVGVOL', 'MARKET', 'CAP', 'MCAP', 'MARKETCAP', 'PE', 'EPS', 'DIV', 'YIELD',
  'DIVIDEND', 'DATE', 'TIME', 'EXP', 'EXPIRY', 'EXPIRATION', 'DTE', 'STRIKE', 'STRIKES',
  'CALL', 'CALLS', 'PUT', 'PUTS', 'BID', 'ASK', 'MID', 'MARK', 'SPREAD', 'SIZE',
  'DELTA', 'GAMMA', 'THETA', 'VEGA', 'RHO', 'IV', 'IVR', 'IVP', 'IV30', 'HV', 'HV10',
  'HV20', 'HV30', 'RANK', 'SCORE', 'RSI', 'SMA', 'EMA', 'MACD', 'BB',
  'BULL', 'BEAR', 'IRON', 'CONDOR', 'STRAT', 'STRATEGY', 'ACTION', 'ACTIONS', 'NOTES',
  'STATUS', 'VALUE', 'TYPE', 'SECTOR', 'INDUSTRY', 'EXCH', 'EXCHANGE', 'NYSE', 'NASDAQ',
  'AMEX', 'CBOE', 'INDEX', 'TOTAL', 'COUNT', 'AVG', 'AVERAGE', 'HEADER', 'COLUMN',
  'COLUMNS', 'ROW', 'ROWS', 'DATA', 'VIEW', 'CADENCE', 'SIGNAL', 'SIGNALS', 'STRENGTH',
  'DIRECTION', 'OPINION', 'OPINIONS', 'PREV', 'PREVIOUS', 'WEEK', 'WEEKS', 'WEEKLY',
  'MONTH', 'MONTHS', 'MONTHLY', 'DAILY', 'CAD', 'DIR', 'STR', 'YES', 'NO',
  'NULL', 'NONE', 'NA', 'NAN', 'N/A', 'UNDEFINED', 'SOURCE', 'UPDATED', 'TIMESTAMP',
  'ORDER', 'ORDERBY', 'ORDERDIR', 'TIMEFRAME', 'HASWEEKLYOPTIONS', 'WATCHLIST',
  'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'OVERALL',

  // Corporate entity suffixes & words commonly occurring in company names
  'INC', 'CORP', 'LTD', 'LLC', 'PLC', 'CO', 'CLASS', 'GROUP', 'HLDG', 'HLDGS',
  'HOLDING', 'HOLDINGS', 'TRUST', 'FUND', 'FUNDS', 'ETF', 'ETFS', 'COMM', 'ORD',
  'PREF', 'PARTNERS', 'ENERGY', 'TECH', 'SYS', 'SYSTEMS', 'CORP.', 'INC.', 'SERVICES',
  'CAPITAL', 'FINANCIAL', 'GLOBAL', 'INTERNATIONAL', 'HEALTH', 'BIOTECH', 'PHARMA',

  // Barchart Opinions / Ratings / Actions / Sentiments
  'BUY', 'BUYS', 'SELL', 'SELLS', 'HOLD', 'HOLDS', 'STRONG', 'MODERATE', 'WEAK',
  'UNDER', 'OVER', 'NEUTRAL', 'OUTPERFORM', 'INLINE', 'MAXIMUM', 'STRENGTHENING',
  'WEAKENING', 'SHORT', 'LONG', 'RECOMMENDED', 'CONSENSUS', 'STABILITY'
]);

/**
 * Validates whether a token looks like a genuine US equity / ETF ticker symbol.
 * - Format: 1 to 5 uppercase letters, optionally followed by .A, .B, -A, -B (e.g. BRK.B).
 * - Must not be a disallowed table header or generic English financial term (unless in KNOWN_GENUINE_TICKERS).
 */
export function isValidTickerSymbol(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const clean = token.trim().toUpperCase().replace(/[-/]/g, '.');

  // Must match standard ticker symbol regex: 1 to 5 alpha chars, optional 1-2 char share class
  if (!/^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(clean)) {
    return false;
  }

  // Pure letter part for stoplist check
  const baseSymbol = clean.split('.')[0];

  // Whitelisted genuine tickers always pass
  if (KNOWN_GENUINE_TICKERS.has(baseSymbol)) {
    return true;
  }

  // Disallowed stoplist words fail
  if (DISALLOWED_WORDS.has(baseSymbol)) {
    return false;
  }

  return true;
}

/**
 * Sanitizes a list or comma/space/newline-separated string of symbols.
 * Returns only unique, valid tickers and a list of rejected tokens.
 */
export function sanitizeTickerList(raw: string | string[]): {
  validSymbols: string[];
  rejectedTokens: string[];
} {
  const tokens: string[] = Array.isArray(raw)
    ? raw.flatMap((s) => (s ? s.split(/[\s,;\t\r\n]+/) : []))
    : (raw || '').split(/[\s,;\t\r\n]+/);

  const validSymbols: string[] = [];
  const rejectedTokens: string[] = [];
  const seen = new Set<string>();

  for (const t of tokens) {
    const clean = t.trim().replace(/^["'$]+|["']+$/g, '').toUpperCase().replace(/[-/]/g, '.');
    if (!clean) continue;

    if (isValidTickerSymbol(clean)) {
      if (!seen.has(clean)) {
        seen.add(clean);
        validSymbols.push(clean);
      }
    } else {
      rejectedTokens.push(clean);
    }
  }

  return { validSymbols, rejectedTokens };
}

/**
 * Parses a CSV line respecting quoted fields.
 */
function parseCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((s) => s.replace(/^["']|["']$/g, '').trim());
}

/**
 * Detects the delimiter of a text string (comma, tab, semicolon).
 */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount && semiCount > tabCount) return ';';
  return ',';
}

/**
 * Intelligent CSV and Free-Text Symbol Extractor & Audit Engine.
 *
 * If the input has a structured table header containing 'Symbol' or 'Ticker',
 * it extracts strictly and exclusively from that column across all data rows,
 * preventing any column headers, company names, or opinion text from contaminating
 * the screened symbol list.
 */
export function extractSymbolsFromTextOrCsv(content: string): SymbolExtractionAudit {
  if (!content || typeof content !== 'string') {
    return {
      validSymbols: [],
      totalTokensScanned: 0,
      validCount: 0,
      rejectedTokens: [],
      detectedHeaders: [],
      wasStructuredCsv: false,
      auditMessage: 'No content provided for symbol extraction.',
    };
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      validSymbols: [],
      totalTokensScanned: 0,
      validCount: 0,
      rejectedTokens: [],
      detectedHeaders: [],
      wasStructuredCsv: false,
      auditMessage: 'Content was empty.',
    };
  }

  const delimiter = detectDelimiter(content);

  // Check the first 5 lines for a header row containing 'Symbol' or 'Ticker'
  let headerLineIndex = -1;
  let symbolColIndex = -1;
  let detectedHeaders: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    const symIdx = cols.findIndex((col) => {
      const lower = col.toLowerCase().replace(/[^a-z]/g, '');
      return lower === 'symbol' || lower === 'ticker' || lower === 'sym' || lower === 'stocksymbol' || lower === 'underlying';
    });

    if (symIdx !== -1) {
      headerLineIndex = i;
      symbolColIndex = symIdx;
      detectedHeaders = cols;
      break;
    }
  }

  // --- CASE 1: Structured CSV/TSV with 'Symbol' Column ---
  if (headerLineIndex !== -1 && symbolColIndex !== -1) {
    const validSymbols: string[] = [];
    const rejectedTokens: string[] = [];
    const seen = new Set<string>();
    let totalRows = 0;

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i], delimiter);
      if (cols.length <= symbolColIndex) continue;

      totalRows++;
      const rawCell = cols[symbolColIndex];
      const clean = rawCell.trim().replace(/^["'$]+|["']+$/g, '').toUpperCase().replace(/[-/]/g, '.');

      if (!clean) continue;

      // Check if it's a valid ticker
      if (isValidTickerSymbol(clean)) {
        if (!seen.has(clean)) {
          seen.add(clean);
          validSymbols.push(clean);
        }
      } else {
        rejectedTokens.push(clean);
      }
    }

    const auditMessage = `Safeguard Audit: Detected structured CSV (${detectedHeaders[symbolColIndex]} column). Extracted ${validSymbols.length} valid symbols from ${totalRows} data rows. Completely ignored all other ${detectedHeaders.length - 1} text/data columns.`;

    return {
      validSymbols,
      totalTokensScanned: totalRows,
      validCount: validSymbols.length,
      rejectedTokens,
      detectedHeaders,
      wasStructuredCsv: true,
      auditMessage,
    };
  }

  // --- CASE 2: Unstructured Text / ThinkorSwim Scan / Space-Separated List ---
  // If no header row was detected, extract tokens safely
  const rawTokens = content.split(/[\s,;\t\r\n]+/);
  const validSymbols: string[] = [];
  const rejectedTokens: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawTokens) {
    const clean = raw.trim().replace(/^["'$]+|["']+$/g, '').toUpperCase().replace(/[-/]/g, '.');
    if (!clean) continue;

    if (isValidTickerSymbol(clean)) {
      if (!seen.has(clean)) {
        seen.add(clean);
        validSymbols.push(clean);
      }
    } else {
      rejectedTokens.push(clean);
    }
  }

  const auditMessage = rejectedTokens.length > 0
    ? `Safeguard Audit: Extracted ${validSymbols.length} valid symbols. Automatically filtered out ${rejectedTokens.length} non-ticker words/headers.`
    : `Safeguard Audit: Extracted ${validSymbols.length} valid symbols.`;

  return {
    validSymbols,
    totalTokensScanned: rawTokens.length,
    validCount: validSymbols.length,
    rejectedTokens,
    detectedHeaders: [],
    wasStructuredCsv: false,
    auditMessage,
  };
}
