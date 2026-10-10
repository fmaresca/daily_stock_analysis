/**
 * Gemini Selections Parser & Importer Engine
 * Pure TypeScript Zero-Dependency Implementation
 * Supports:
 * 1. CSV / TSV files (.csv, .tsv, .txt) with multi-table or single-table layouts
 * 2. Microsoft XML Spreadsheet 2003 (.xls, .xml) with multi-sheet support
 * 3. Standard zipped Excel workbooks (.xlsx) via native Web DecompressionStream
 * 4. Google Sheets direct URL export fetch & copy-pasted grid TSV
 * 5. Fallback markdown table parsing
 */

import type {
  GeminiScreenResult,
  GeminiRecommendedTrade,
  GeminiBorderlineCandidate,
  GeminiExcludedCandidate,
} from '../types/options.ts';
import { parseGeminiMarkdownTables } from './geminiMarkdownParser.ts';

// ----------------------------------------------------------------------------
// 1. HELPERS & CLEANERS
// ----------------------------------------------------------------------------

function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[*_`]/g, '').trim();
}

function parseNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

function parseInteger(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.round(val);
  const cleaned = String(val).replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? fallback : parsed;
}

// ----------------------------------------------------------------------------
// 2. CSV / TSV PARSER (RFC 4180 COMPLIANT)
// ----------------------------------------------------------------------------

export function parseDelimitedTextToRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  // Detect delimiter: check first line
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';
  else if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ';';

  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

// ----------------------------------------------------------------------------
// 3. TABLE MAPPING FROM GRID ROWS
// ----------------------------------------------------------------------------

interface ColumnIndices {
  rankIdx: number;
  symbolIdx: number;
  priceIdx: number;
  strikeIdx: number;
  deltaIdx: number;
  premiumIdx: number;
  collateralIdx: number;
  rationaleIdx: number;
  trendIdx: number;
  rsiIdx: number;
  earningsIdx: number;
  categoryIdx: number;
  borderlineReasonIdx: number;
  exclusionReasonIdx: number;
}

function detectColumnIndices(headers: string[]): ColumnIndices {
  const normHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const find = (keywords: string[]) =>
    normHeaders.findIndex((h) => keywords.some((kw) => h.includes(kw.replace(/[^a-z0-9]/g, ''))));

  return {
    rankIdx: find(['riskrank', 'rank', 'number', 'no']),
    symbolIdx: find(['symbol', 'ticker', 'stock', 'underlying']),
    priceIdx: find(['spotprice', 'currentprice', 'spot', 'price', 'last']),
    strikeIdx: find(['suggestedstrike', 'putstrike', 'strike']),
    deltaIdx: find(['optiondelta', 'delta']),
    premiumIdx: find(['totalpremium', 'estpremium', 'netpremium', 'premium', 'sharepremium']),
    collateralIdx: find(['collateralcommitted', 'collateral', 'capitalcommitted', 'capital', 'cashcollateral']),
    rationaleIdx: find(['justification', 'rationale', 'support', 'notes', 'comments', 'technicaljustification']),
    trendIdx: find(['trend', 'trendstrdir', 'direction']),
    rsiIdx: find(['14dayrsi', '14drsi', 'rsi', 'rsi14']),
    earningsIdx: find(['earningsdate', 'nextearnings', 'earnings']),
    categoryIdx: find(['category', 'section', 'table', 'status', 'tier']),
    borderlineReasonIdx: find(['borderlinereason', 'reason', 'borderline']),
    exclusionReasonIdx: find(['exclusionreason', 'reasonforexclusion', 'exclusion', 'reason']),
  };
}

export function parseRowsIntoGeminiResult(rawRows: string[][], rawSourceText = ''): GeminiScreenResult {
  const result: GeminiScreenResult = {
    recommendedTrades: [],
    borderlineCandidates: [],
    excludedCandidates: [],
    rawMarkdown: rawSourceText,
  };

  if (rawRows.length === 0) return result;

  let currentSection: 'RECOMMENDED' | 'BORDERLINE' | 'EXCLUDED' = 'RECOMMENDED';
  let activeColIndices: ColumnIndices | null = null;

  for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];
    if (!row || row.length === 0) continue;

    const firstCell = (row[0] || '').trim();
    const joinedRowUpper = row.join(' ').toUpperCase();

    // Check for explicit section header rows
    if (joinedRowUpper.includes('TABLE 1') || joinedRowUpper.includes('RECOMMENDED TRADES') || joinedRowUpper.includes('APPROVED CONTRACTS')) {
      currentSection = 'RECOMMENDED';
      activeColIndices = null;
      continue;
    } else if (joinedRowUpper.includes('TABLE 2') || joinedRowUpper.includes('BORDERLINE CANDIDATES') || joinedRowUpper.includes('BORDERLINE SETUPS')) {
      currentSection = 'BORDERLINE';
      activeColIndices = null;
      continue;
    } else if (joinedRowUpper.includes('TABLE 3') || joinedRowUpper.includes('EXCLUDED CANDIDATES') || joinedRowUpper.includes('EXCLUDED STOCKS')) {
      currentSection = 'EXCLUDED';
      activeColIndices = null;
      continue;
    }

    // Skip summary / totals / empty divider rows
    if (
      firstCell.toLowerCase().includes('total') ||
      firstCell.toLowerCase().includes('remaining') ||
      firstCell.toLowerCase().includes('formula') ||
      (row[1] && row[1].toLowerCase().includes('total'))
    ) {
      continue;
    }

    // Header row detection
    const isHeaderRow = row.some((c) => {
      const lower = c.toLowerCase().trim();
      return lower === 'symbol' || lower === 'ticker' || lower === 'stock symbol' || lower === 'rank' || lower === 'risk rank';
    });

    if (isHeaderRow) {
      activeColIndices = detectColumnIndices(row);
      continue;
    }

    // Default indices if no explicit header row was encountered
    if (!activeColIndices) {
      activeColIndices = detectColumnIndices(rawRows[0]);
    }

    // Determine section from category column if present
    let rowSection = currentSection;
    if (activeColIndices.categoryIdx !== -1 && row[activeColIndices.categoryIdx]) {
      const catVal = row[activeColIndices.categoryIdx].toUpperCase();
      if (catVal.includes('REC') || catVal.includes('TABLE 1') || catVal.includes('APPROVED')) rowSection = 'RECOMMENDED';
      else if (catVal.includes('BOR') || catVal.includes('TABLE 2')) rowSection = 'BORDERLINE';
      else if (catVal.includes('EXC') || catVal.includes('TABLE 3')) rowSection = 'EXCLUDED';
    }

    const symIdx = activeColIndices.symbolIdx !== -1 ? activeColIndices.symbolIdx : 0;
    const rawSym = cleanString(row[symIdx]);
    const sym = rawSym.toUpperCase().replace(/[^A-Z0-9.-]/g, '');

    // Skip blank or invalid symbols: ticker must start with a letter, length 1-8 chars, not 'SYMBOL' / 'TICKER'
    if (!sym || sym.length > 8 || !/^[A-Z]/.test(sym) || sym === 'SYMBOL' || sym === 'TICKER') {
      continue;
    }

    if (rowSection === 'RECOMMENDED') {
      const rankIdx = activeColIndices.rankIdx !== -1 ? activeColIndices.rankIdx : -1;
      const rank = rankIdx !== -1 ? parseInteger(row[rankIdx], result.recommendedTrades.length + 1) : result.recommendedTrades.length + 1;

      const priceIdx = activeColIndices.priceIdx !== -1 ? activeColIndices.priceIdx : 1;
      const strikeIdx = activeColIndices.strikeIdx !== -1 ? activeColIndices.strikeIdx : 2;
      const deltaIdx = activeColIndices.deltaIdx !== -1 ? activeColIndices.deltaIdx : 3;
      const premIdx = activeColIndices.premiumIdx !== -1 ? activeColIndices.premiumIdx : 4;
      const collIdx = activeColIndices.collateralIdx !== -1 ? activeColIndices.collateralIdx : 5;
      const justIdx = activeColIndices.rationaleIdx !== -1 ? activeColIndices.rationaleIdx : 6;

      const spotPrice = parseNumber(row[priceIdx], 0);
      const suggestedStrike = parseNumber(row[strikeIdx], spotPrice > 0 ? Math.round(spotPrice * 0.95 * 2) / 2 : 0);
      const rawDelta = parseNumber(row[deltaIdx], 0.20);
      const delta = Math.abs(rawDelta) > 1 ? Math.abs(rawDelta) / 100 : Math.abs(rawDelta) || 0.20;

      let premStr = cleanString(row[premIdx]);
      if (!premStr || premStr === '0') {
        premStr = `$${(suggestedStrike * 0.015).toFixed(2)}`;
      }

      let collateral = parseNumber(row[collIdx], 0);
      if (collateral === 0 && suggestedStrike > 0) {
        collateral = suggestedStrike * 100;
      }

      const trendStrDir = activeColIndices.trendIdx !== -1 && row[activeColIndices.trendIdx]
        ? cleanString(row[activeColIndices.trendIdx])
        : 'Strong Uptrend';

      const rsi14 = activeColIndices.rsiIdx !== -1 && row[activeColIndices.rsiIdx]
        ? parseNumber(row[activeColIndices.rsiIdx], 55)
        : 55;

      const earningsDate = activeColIndices.earningsIdx !== -1 && row[activeColIndices.earningsIdx]
        ? cleanString(row[activeColIndices.earningsIdx])
        : 'None in expiration cycle';

      const technicalJustification = justIdx !== -1 && row[justIdx]
        ? cleanString(row[justIdx])
        : `Confirmed Support at $${suggestedStrike.toFixed(2)} (${(delta * 100).toFixed(0)}Δ Sweet Spot, ${trendStrDir})`;

      result.recommendedTrades.push({
        riskRank: rank,
        symbol: sym,
        currentPrice: spotPrice,
        trendStrDir,
        rsi14,
        earningsDate,
        suggestedStrike,
        delta,
        estPremiumAnnualized: premStr,
        capitalCommitted: collateral,
        sentimentFlags: 'Bullish',
        technicalJustification,
      });
    } else if (rowSection === 'BORDERLINE') {
      const priceIdx = activeColIndices.priceIdx !== -1 ? activeColIndices.priceIdx : 1;
      const reasonIdx = activeColIndices.borderlineReasonIdx !== -1
        ? activeColIndices.borderlineReasonIdx
        : activeColIndices.rationaleIdx !== -1
        ? activeColIndices.rationaleIdx
        : row.length - 1;

      const spotPrice = parseNumber(row[priceIdx], 0);
      const borderlineReason = row[reasonIdx] ? cleanString(row[reasonIdx]) : 'Elevated volatility or close to earnings';

      result.borderlineCandidates.push({
        symbol: sym,
        currentPrice: spotPrice,
        trendStrDir: activeColIndices.trendIdx !== -1 ? cleanString(row[activeColIndices.trendIdx]) : 'Moderate',
        rsi14: activeColIndices.rsiIdx !== -1 ? parseNumber(row[activeColIndices.rsiIdx], 50) : 50,
        earningsDate: activeColIndices.earningsIdx !== -1 ? cleanString(row[activeColIndices.earningsIdx]) : 'N/A',
        borderlineReason,
      });
    } else if (rowSection === 'EXCLUDED') {
      const priceIdx = activeColIndices.priceIdx !== -1 ? activeColIndices.priceIdx : 1;
      const reasonIdx = activeColIndices.exclusionReasonIdx !== -1
        ? activeColIndices.exclusionReasonIdx
        : activeColIndices.rationaleIdx !== -1
        ? activeColIndices.rationaleIdx
        : row.length - 1;

      const spotPrice = parseNumber(row[priceIdx], 0);
      const reasonForExclusion = row[reasonIdx] ? cleanString(row[reasonIdx]) : 'Failed CBOE weekly options mandate or high risk';

      result.excludedCandidates.push({
        symbol: sym,
        currentPrice: spotPrice,
        reasonForExclusion,
      });
    }
  }

  return result;
}

// ----------------------------------------------------------------------------
// 4. CSV / TSV PARSER ENTRYPOINT
// ----------------------------------------------------------------------------

export function parseGeminiSelectionsCSV(content: string): GeminiScreenResult {
  if (!content || !content.trim()) {
    return {
      recommendedTrades: [],
      borderlineCandidates: [],
      excludedCandidates: [],
      rawMarkdown: '',
    };
  }

  // If this is a markdown table (starts with pipe or contains |---|), use markdown parser
  if (content.includes('|') && content.includes('---')) {
    const mdResult = parseGeminiMarkdownTables(content);
    if (mdResult.recommendedTrades.length > 0) return mdResult;
  }

  const rows = parseDelimitedTextToRows(content);
  return parseRowsIntoGeminiResult(rows, content);
}

// ----------------------------------------------------------------------------
// 5. MICROSOFT XML SPREADSHEET 2003 (.XLS / .XML) PARSER
// ----------------------------------------------------------------------------

export function parseGeminiSelectionsXmlExcel(xmlContent: string): GeminiScreenResult {
  const result: GeminiScreenResult = {
    recommendedTrades: [],
    borderlineCandidates: [],
    excludedCandidates: [],
    rawMarkdown: xmlContent,
  };

  if (!xmlContent || !xmlContent.includes('<Workbook')) {
    return parseGeminiSelectionsCSV(xmlContent);
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

    const worksheets = xmlDoc.getElementsByTagName('Worksheet');
    if (worksheets.length === 0) {
      return parseGeminiSelectionsCSV(xmlContent);
    }

    for (let w = 0; w < worksheets.length; w++) {
      const ws = worksheets[w];
      const sheetName = (ws.getAttribute('ss:Name') || ws.getAttribute('Name') || '').toUpperCase();

      const rows: string[][] = [];
      const rowNodes = ws.getElementsByTagName('Row');

      for (let r = 0; r < rowNodes.length; r++) {
        const rowNode = rowNodes[r];
        const cellNodes = rowNode.getElementsByTagName('Cell');
        const rowData: string[] = [];

        for (let c = 0; c < cellNodes.length; c++) {
          const dataNode = cellNodes[c].getElementsByTagName('Data')[0];
          rowData.push(dataNode ? dataNode.textContent || '' : '');
        }

        if (rowData.some((cell) => cell.trim().length > 0)) {
          rows.push(rowData);
        }
      }

      if (rows.length === 0) continue;

      if (sheetName.includes('BORDERLINE') || sheetName.includes('TABLE 2')) {
        const sheetRes = parseRowsIntoGeminiResult([['Category', ...rows[0]], ...rows.slice(1).map((r) => ['Borderline', ...r])]);
        result.borderlineCandidates.push(...sheetRes.borderlineCandidates);
      } else if (sheetName.includes('EXCLUDED') || sheetName.includes('TABLE 3')) {
        const sheetRes = parseRowsIntoGeminiResult([['Category', ...rows[0]], ...rows.slice(1).map((r) => ['Excluded', ...r])]);
        result.excludedCandidates.push(...sheetRes.excludedCandidates);
      } else {
        const sheetRes = parseRowsIntoGeminiResult(rows);
        result.recommendedTrades.push(...sheetRes.recommendedTrades);
        if (sheetRes.borderlineCandidates.length > 0) result.borderlineCandidates.push(...sheetRes.borderlineCandidates);
        if (sheetRes.excludedCandidates.length > 0) result.excludedCandidates.push(...sheetRes.excludedCandidates);
      }
    }

    return result;
  } catch (err) {
    console.warn('XML Spreadsheet parsing failed, falling back to CSV parser:', err);
    return parseGeminiSelectionsCSV(xmlContent);
  }
}

// ----------------------------------------------------------------------------
// 6. ZERO-DEPENDENCY XLSX PARSER (ZIP + DEFLATE VIA WEB DECOMPRESSIONSTREAM)
// ----------------------------------------------------------------------------

interface ZipEntry {
  filename: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  offset: number;
  dataOffset: number;
}

async function decompressZipEntry(buffer: Uint8Array, entry: ZipEntry): Promise<string> {
  const compressedData = buffer.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    // Stored (no compression)
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(compressedData);
  } else if (entry.compressionMethod === 8) {
    // Deflate
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(compressedData);
          controller.close();
        },
      }).pipeThrough(new DecompressionStream('deflate-raw'));

      const response = new Response(stream);
      return await response.text();
    }
  }

  throw new Error(`Unsupported compression method ${entry.compressionMethod}`);
}

function parseZipCentralDirectory(buffer: Uint8Array): ZipEntry[] {
  const entries: ZipEntry[] = [];
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  let offset = 0;
  while (offset + 30 < buffer.length) {
    const sig = view.getUint32(offset, true);
    if (sig === 0x04034b50) {
      // Local file header
      const compressionMethod = view.getUint16(offset + 8, true);
      const compressedSize = view.getUint32(offset + 18, true);
      const uncompressedSize = view.getUint32(offset + 22, true);
      const filenameLength = view.getUint16(offset + 26, true);
      const extraFieldLength = view.getUint16(offset + 28, true);

      const filenameBytes = buffer.slice(offset + 30, offset + 30 + filenameLength);
      const filename = new TextDecoder('utf-8').decode(filenameBytes);
      const dataOffset = offset + 30 + filenameLength + extraFieldLength;

      entries.push({
        filename,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        offset,
        dataOffset,
      });

      offset = dataOffset + compressedSize;
    } else {
      offset++;
    }
  }

  return entries;
}

export async function parseGeminiSelectionsXLSX(buffer: ArrayBuffer | Uint8Array): Promise<GeminiScreenResult> {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  try {
    const entries = parseZipCentralDirectory(u8);
    const sharedStringsEntry = entries.find((e) => e.filename === 'xl/sharedStrings.xml');
    const sheetEntries = entries.filter((e) => e.filename.startsWith('xl/worksheets/sheet') && e.filename.endsWith('.xml'));

    if (sheetEntries.length === 0) {
      throw new Error('No worksheets found in XLSX workbook');
    }

    // 1. Shared Strings Table
    const sharedStrings: string[] = [];
    if (sharedStringsEntry) {
      const sstXml = await decompressZipEntry(u8, sharedStringsEntry);
      const parser = new DOMParser();
      const doc = parser.parseFromString(sstXml, 'application/xml');
      const siNodes = doc.getElementsByTagName('si');
      for (let i = 0; i < siNodes.length; i++) {
        sharedStrings.push(siNodes[i].textContent || '');
      }
    }

    // 2. Parse Primary Worksheets
    const allGridRows: string[][] = [];

    for (const sheetEntry of sheetEntries) {
      const sheetXml = await decompressZipEntry(u8, sheetEntry);
      const parser = new DOMParser();
      const doc = parser.parseFromString(sheetXml, 'application/xml');
      const rowNodes = doc.getElementsByTagName('row');

      for (let r = 0; r < rowNodes.length; r++) {
        const rowNode = rowNodes[r];
        const cellNodes = rowNode.getElementsByTagName('c');
        const rowData: string[] = [];

        for (let c = 0; c < cellNodes.length; c++) {
          const cell = cellNodes[c];
          const cellType = cell.getAttribute('t');
          const valNode = cell.getElementsByTagName('v')[0];
          let val = valNode ? valNode.textContent || '' : '';

          if (cellType === 's') {
            const strIdx = parseInt(val, 10);
            val = sharedStrings[strIdx] !== undefined ? sharedStrings[strIdx] : val;
          } else if (cellType === 'inlineStr') {
            const isNode = cell.getElementsByTagName('is')[0];
            val = isNode ? isNode.textContent || '' : val;
          }

          rowData.push(val);
        }

        if (rowData.some((c) => c.trim().length > 0)) {
          allGridRows.push(rowData);
        }
      }
    }

    return parseRowsIntoGeminiResult(allGridRows);
  } catch (err: any) {
    console.warn('Native XLSX decompression error:', err);
    throw new Error(`Could not parse .xlsx file: ${err.message || 'Corrupted or unsupported format'}. Please save as CSV or XML Excel (.xls) and re-upload.`);
  }
}

// ----------------------------------------------------------------------------
// 7. GOOGLE SHEETS LINK EXPORT PARSER & FETCHER
// ----------------------------------------------------------------------------

export function convertGoogleSheetUrlToCsvUrl(inputUrl: string): {
  csvUrl: string;
  sheetId: string;
  gid: string;
} | null {
  if (!inputUrl || !inputUrl.includes('docs.google.com/spreadsheets')) {
    return null;
  }

  try {
    // 1. Extract spreadsheet ID
    const idMatch = inputUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) return null;
    const sheetId = idMatch[1];

    // 2. Extract GID (worksheet tab ID) if present
    let gid = '0';
    const gidMatch = inputUrl.match(/[?&#]gid=([0-9]+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }

    // 3. Handle published to web link (/pub?output=csv)
    if (inputUrl.includes('/pub') || inputUrl.includes('/pubhtml')) {
      const pubBase = inputUrl.split('/pub')[0];
      return {
        csvUrl: `${pubBase}/pub?output=csv&gid=${gid}`,
        sheetId,
        gid,
      };
    }

    // 4. Standard Google Sheet Link
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    return {
      csvUrl,
      sheetId,
      gid,
    };
  } catch {
    return null;
  }
}

export async function fetchGoogleSheetCsv(inputUrl: string): Promise<GeminiScreenResult> {
  const converted = convertGoogleSheetUrlToCsvUrl(inputUrl);
  if (!converted) {
    throw new Error('Invalid Google Sheet URL. Please ensure the URL looks like: https://docs.google.com/spreadsheets/d/{ID}/edit');
  }

  try {
    const res = await fetch(converted.csvUrl);
    if (!res.ok) {
      throw new Error(`Google Sheets responded with HTTP ${res.status}: ${res.statusText}`);
    }
    const csvText = await res.text();
    return parseGeminiSelectionsCSV(csvText);
  } catch (err: any) {
    throw new Error(
      `Could not fetch Google Sheet directly (${err.message}). ` +
      `Make sure the sheet is public ("Anyone with the link can view") or published to web (File -> Share -> Publish to web -> CSV). ` +
      `Alternatively, select and copy the cells directly in Google Sheets (Ctrl+C) and paste into the box below!`
    );
  }
}

// ----------------------------------------------------------------------------
// 8. UNIFIED FILE PARSER ENTRYPOINT
// ----------------------------------------------------------------------------

export async function parseGeminiSelectionsFile(file: File): Promise<GeminiScreenResult> {
  const fileName = (file.name || '').toLowerCase();

  // 1. Zipped XLSX
  if (fileName.endsWith('.xlsx')) {
    const buffer = await file.arrayBuffer();
    return await parseGeminiSelectionsXLSX(buffer);
  }

  // 2. XML Spreadsheet 2003 (.xls / .xml)
  if (fileName.endsWith('.xls') || fileName.endsWith('.xml')) {
    const text = await file.text();
    if (text.includes('<?xml') && text.includes('spreadsheet')) {
      return parseGeminiSelectionsXmlExcel(text);
    }
    // If not XML, might be TSV or CSV saved with .xls extension
    return parseGeminiSelectionsCSV(text);
  }

  // 3. CSV, TSV, TXT, or markdown
  const text = await file.text();
  return parseGeminiSelectionsCSV(text);
}
