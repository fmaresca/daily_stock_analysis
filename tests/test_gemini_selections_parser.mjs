import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGeminiSelectionsCSV,
  parseDelimitedTextToRows,
  parseRowsIntoGeminiResult,
  convertGoogleSheetUrlToCsvUrl,
  parseGeminiSelectionsXmlExcel,
} from '../web/src/utils/geminiSelectionsParser.ts';

test('1. parseDelimitedTextToRows correctly parses CSV with quotes and commas', () => {
  const csv = `Symbol,Strike,Justification\n"NVDA",115.00,"Support at $115, 2-SD lower band"\n"MSFT",400.00,"Horizontal support level"`;
  const rows = parseDelimitedTextToRows(csv);
  assert.equal(rows.length, 3);
  assert.equal(rows[1][0], 'NVDA');
  assert.equal(rows[1][1], '115.00');
  assert.equal(rows[1][2], 'Support at $115, 2-SD lower band');
  assert.equal(rows[2][0], 'MSFT');
});

test('2. parseDelimitedTextToRows correctly auto-detects TSV tabs from Google Sheets/Excel paste', () => {
  const tsv = `Symbol\tSpot\tStrike\tDelta\tCollateral\tRationale\nAAPL\t230.00\t220.00\t0.19\t22000\tStrong 50D EMA support\nGOOGL\t185.00\t175.00\t0.18\t17500\tChannel base`;
  const rows = parseDelimitedTextToRows(tsv);
  assert.equal(rows.length, 3);
  assert.equal(rows[1][0], 'AAPL');
  assert.equal(rows[1][2], '220.00');
  assert.equal(rows[2][0], 'GOOGL');
});

test('3. parseGeminiSelectionsCSV parses standard Table 1 recommended trades with messy currency and formatting', () => {
  const csv = `Risk Rank,Stock Symbol,Current Price,Suggested Strike,Option Delta,Est. Premium,Collateral Committed,Technical Justification
1,**NVDA**,"$120.50","$114.00 Put",-0.20,"$1.85 (28.4% Ann.)","$11,400.00","Strike sits below 2-SD lower Bollinger Band"
2,MSFT,$425.00,$405.00,0.18,$3.50,"$40,500","Confirmed horizontal support at $405"
3,AAPL,$230.00,$220.00,0.19,$2.10,"$22,000","High liquidity Tier 1 mega-cap"`;

  const result = parseGeminiSelectionsCSV(csv);
  assert.equal(result.recommendedTrades.length, 3);

  const t1 = result.recommendedTrades[0];
  assert.equal(t1.symbol, 'NVDA');
  assert.equal(t1.currentPrice, 120.5);
  assert.equal(t1.suggestedStrike, 114);
  assert.equal(t1.delta, 0.20);
  assert.equal(t1.capitalCommitted, 11400);
  assert.match(t1.technicalJustification, /Bollinger Band/);

  const t2 = result.recommendedTrades[1];
  assert.equal(t2.symbol, 'MSFT');
  assert.equal(t2.currentPrice, 425);
  assert.equal(t2.suggestedStrike, 405);
  assert.equal(t2.delta, 0.18);
  assert.equal(t2.capitalCommitted, 40500);
});

test('4. parseGeminiSelectionsCSV parses multi-table CSV with section headers (Table 1, 2, 3)', () => {
  const multiSectionCsv = `TABLE 1: RECOMMENDED TRADES
Rank,Symbol,Spot,Strike,Delta,Premium,Collateral,Rationale
1,NVDA,120.50,114.00,0.20,$1.85,11400,Confirmed support
2,MSFT,425.00,405.00,0.18,$3.50,40500,Horizontal base

TABLE 2: BORDERLINE CANDIDATES
Symbol,Spot,Trend,RSI,Earnings,Reason
TSLA,245.00,High Vol,68.5,12d,Elevated RSI and earnings risk

TABLE 3: EXCLUDED CANDIDATES
Symbol,Spot,Reason
AMCX,12.30,Failed CBOE weekly options mandate (Monthly only)
MUFG,10.80,ADR lacks active weekly options chains`;

  const result = parseGeminiSelectionsCSV(multiSectionCsv);
  assert.equal(result.recommendedTrades.length, 2);
  assert.equal(result.borderlineCandidates.length, 1);
  assert.equal(result.excludedCandidates.length, 2);

  assert.equal(result.recommendedTrades[0].symbol, 'NVDA');
  assert.equal(result.recommendedTrades[1].symbol, 'MSFT');

  assert.equal(result.borderlineCandidates[0].symbol, 'TSLA');
  assert.match(result.borderlineCandidates[0].borderlineReason, /Elevated RSI/);

  assert.equal(result.excludedCandidates[0].symbol, 'AMCX');
  assert.match(result.excludedCandidates[0].reasonForExclusion, /weekly options/);
  assert.equal(result.excludedCandidates[1].symbol, 'MUFG');
});

test('5. parseGeminiSelectionsCSV parses unified table with Category column', () => {
  const csvWithCategory = `Category,Symbol,Current Spot,Suggested Strike,Delta,Est. Premium,Cash Collateral,Rationale
Recommended,NVDA,120.50,114.00,0.20,$1.85,11400,Strong uptrend
Recommended,AAPL,230.00,220.00,0.19,$2.10,22000,Mega-cap safety
Borderline,TSLA,245.00,0,0,0,0,RSI near 70 and high IV
Excluded,AMCX,12.30,0,0,0,0,Monthly options cycle only`;

  const result = parseGeminiSelectionsCSV(csvWithCategory);
  assert.equal(result.recommendedTrades.length, 2);
  assert.equal(result.borderlineCandidates.length, 1);
  assert.equal(result.excludedCandidates.length, 1);

  assert.equal(result.recommendedTrades[0].symbol, 'NVDA');
  assert.equal(result.recommendedTrades[1].symbol, 'AAPL');
  assert.equal(result.borderlineCandidates[0].symbol, 'TSLA');
  assert.equal(result.excludedCandidates[0].symbol, 'AMCX');
});

test('6. convertGoogleSheetUrlToCsvUrl extracts Sheet ID and GID into CSV endpoint', () => {
  const url1 = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
  const res1 = convertGoogleSheetUrlToCsvUrl(url1);
  assert.ok(res1);
  assert.equal(res1.sheetId, '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  assert.equal(res1.gid, '0');
  assert.equal(
    res1.csvUrl,
    'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&gid=0'
  );

  const url2 = 'https://docs.google.com/spreadsheets/d/abc12345/edit?gid=987654';
  const res2 = convertGoogleSheetUrlToCsvUrl(url2);
  assert.ok(res2);
  assert.equal(res2.sheetId, 'abc12345');
  assert.equal(res2.gid, '987654');
  assert.equal(
    res2.csvUrl,
    'https://docs.google.com/spreadsheets/d/abc12345/export?format=csv&gid=987654'
  );

  // Non-Google Sheet URL should return null
  assert.equal(convertGoogleSheetUrlToCsvUrl('https://example.com/file.csv'), null);
});

test('7. parseGeminiSelectionsCSV handles empty or garbage input gracefully', () => {
  const emptyRes = parseGeminiSelectionsCSV('');
  assert.equal(emptyRes.recommendedTrades.length, 0);

  const whitespaceRes = parseGeminiSelectionsCSV('   \n\n  ');
  assert.equal(whitespaceRes.recommendedTrades.length, 0);

  const nonDataRes = parseGeminiSelectionsCSV('TOTALS ROW ONLY\n$550,000 cash balance\nFormula: Delta * IV');
  assert.equal(nonDataRes.recommendedTrades.length, 0);
});
