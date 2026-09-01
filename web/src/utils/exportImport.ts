/**
 * Export and Import Utilities for DeltaHarvest
 * Supports CSV, Excel (.xlsx via SheetJS), and Print/PDF reporting.
 */

import * as XLSX from 'xlsx';
import { TickerMeta, OptionOpportunity, ScreenerSummary } from '../types/options';

// ----------------------------------------------------------------------------
// 1. CSV EXPORT HELPERS
// ----------------------------------------------------------------------------

export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTickersToCSV(tickers: TickerMeta[], filename = 'deltaharvest_equities_analysis.csv') {
  const headers = [
    'Symbol',
    'Name',
    'Sector',
    'Liquidity Tier',
    'Spot Price',
    'Avg Volume 30D',
    'SMA 20D',
    'Lower Bollinger Band',
    'Upper Bollinger Band',
    'Bollinger Width %',
    '14D RSI',
    'RSI Flag',
    'HV 30D %',
    'Implied Volatility %',
    'IV Rank %',
    'Options Cadence',
    'Has Weekly Options',
    'Nearest Expiration',
    'Days to Expiration',
    'Earnings <= 7D',
    'Next Earnings Date',
  ];

  const rows = tickers.map((t) => [
    t.symbol,
    `"${(t.name || '').replace(/"/g, '""')}"`,
    `"${(t.sector || '').replace(/"/g, '""')}"`,
    `"${(t.liquidity_tier || '').replace(/"/g, '""')}"`,
    t.spot_price.toFixed(2),
    t.avg_volume_30,
    t.sma_20.toFixed(2),
    t.lower_bb.toFixed(2),
    t.upper_bb.toFixed(2),
    t.bb_width_pct.toFixed(2),
    t.rsi_14.toFixed(1),
    t.rsi_flag,
    t.hv_30.toFixed(1),
    t.iv_current.toFixed(1),
    t.iv_rank,
    t.expiration_cadence || t.options_cadence || (t.has_weeklys === false ? 'Monthly Only' : 'Weekly'),
    t.has_weeklys === false ? 'No' : 'Yes',
    t.nearest_expiration_date || t.target_exp || 'N/A',
    t.days_to_nearest_expiration ?? t.target_dte ?? '',
    t.earnings_within_7d ? 'YES' : 'NO',
    t.next_earnings_date || 'N/A',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportOpportunitiesToCSV(
  opps: OptionOpportunity[],
  filename = 'deltaharvest_options_opportunities.csv'
) {
  const headers = [
    'Strategy',
    'Symbol',
    'Name',
    'Type',
    'Strike ($)',
    'Spot Price ($)',
    'Expiration',
    'DTE',
    'Bid ($)',
    'Ask ($)',
    'Mid Premium ($)',
    'Collateral ($)',
    'Total Premium ($)',
    'Cushion / Buffer %',
    'ROC %',
    'Annualized ROC %',
    'Delta (abs)',
    'Theta ($/day)',
    'POP %',
    'Implied Volatility %',
    'IV Rank %',
    'Safety Tier',
    'Liquidity Tier',
    'Tags',
  ];

  const rows = opps.map((o) => [
    o.strategy,
    o.symbol,
    `"${(o.name || '').replace(/"/g, '""')}"`,
    o.type.toUpperCase(),
    o.strike.toFixed(2),
    o.current_price.toFixed(2),
    o.expiration,
    o.dte,
    o.bid.toFixed(2),
    o.ask.toFixed(2),
    o.mid.toFixed(2),
    o.collateral_required.toFixed(2),
    o.premium_total.toFixed(2),
    o.cushion_pct.toFixed(2),
    o.roc_pct.toFixed(2),
    o.annualized_roc.toFixed(1),
    Math.abs(o.delta).toFixed(3),
    o.theta.toFixed(2),
    o.pop_pct.toFixed(1),
    o.iv.toFixed(1),
    o.iv_rank,
    `"${(o.safety_tier || '').replace(/"/g, '""')}"`,
    `"${(o.liquidity_tier || '').replace(/"/g, '""')}"`,
    `"${(o.tags || []).join('; ')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// ----------------------------------------------------------------------------
// 2. EXCEL (.XLSX) MULTI-SHEET EXPORT (SheetJS)
// ----------------------------------------------------------------------------

export function exportToExcel(
  data: {
    tickers: TickerMeta[];
    opportunities: OptionOpportunity[];
    summary?: ScreenerSummary | null;
  },
  filename = 'deltaharvest_complete_report.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. Tickers & Technicals Sheet
  const tickersData = data.tickers.map((t) => ({
    Symbol: t.symbol,
    Company: t.name,
    Sector: t.sector,
    'Liquidity Tier': t.liquidity_tier,
    'Spot ($)': t.spot_price,
    '30D Vol': t.avg_volume_30,
    '20D SMA ($)': t.sma_20,
    'Lower BB ($)': t.lower_bb,
    'Upper BB ($)': t.upper_bb,
    'BB Width %': t.bb_width_pct,
    '14D RSI': t.rsi_14,
    'RSI Flag': t.rsi_flag,
    '30D HV %': t.hv_30,
    'Current IV %': t.iv_current,
    'IV Rank %': t.iv_rank,
    'Options Cadence': t.expiration_cadence || t.options_cadence || (t.has_weeklys === false ? 'Monthly Only' : 'Weekly'),
    'Weekly Options': t.has_weeklys === false ? 'No' : 'Yes',
    'Nearest Expiration': t.nearest_expiration_date || t.target_exp || 'N/A',
    'Days to Expiration': t.days_to_nearest_expiration ?? t.target_dte ?? null,
    'Earnings <= 7D': t.earnings_within_7d ? 'YES' : 'NO',
    'Next Earnings Date': t.next_earnings_date || 'N/A',
  }));

  const wsTickers = XLSX.utils.json_to_sheet(tickersData);
  XLSX.utils.book_append_sheet(wb, wsTickers, 'Equities Technicals');

  // 2. Options Opportunities Sheet
  const oppsData = data.opportunities.map((o) => ({
    Strategy: o.strategy,
    Symbol: o.symbol,
    Company: o.name,
    Type: o.type.toUpperCase(),
    'Strike ($)': o.strike,
    'Spot ($)': o.current_price,
    Expiration: o.expiration,
    DTE: o.dte,
    'Bid ($)': o.bid,
    'Ask ($)': o.ask,
    'Mid ($)': o.mid,
    'Collateral ($)': o.collateral_required,
    'Total Cash Premium ($)': o.premium_total,
    'Buffer Cushion %': o.cushion_pct,
    'Return on Capital %': o.roc_pct,
    'Annualized Yield %': o.annualized_roc,
    Delta: o.delta,
    Theta: o.theta,
    'POP %': o.pop_pct,
    'IV %': o.iv,
    'IV Rank': o.iv_rank,
    'Safety Tier': o.safety_tier,
    'Liquidity Tier': o.liquidity_tier,
    Tags: (o.tags || []).join('; '),
  }));

  const wsOpps = XLSX.utils.json_to_sheet(oppsData);
  XLSX.utils.book_append_sheet(wb, wsOpps, 'Options Opportunities');

  // 3. Executive Summary Sheet
  if (data.summary) {
    const summaryData = [
      { Metric: 'Generated Timestamp (UTC)', Value: data.summary.generated_at },
      { Metric: 'Total Screened Tickers', Value: data.summary.total_screened_tickers },
      { Metric: 'Total Qualified Opportunities', Value: data.summary.total_opportunities },
      { Metric: 'Cash-Secured Puts (CSPs)', Value: data.summary.csp_count },
      { Metric: 'Covered Calls (CCs)', Value: data.summary.cc_count },
      { Metric: 'Average Annualized CSP Yield %', Value: `${data.summary.avg_annualized_yield_csp}%` },
      { Metric: 'Average Annualized CC Yield %', Value: `${data.summary.avg_annualized_yield_cc}%` },
      { Metric: 'Ultra-Liquid Tier 1 Tickers', Value: data.summary.tier_breakdown?.tier_1_count ?? 0 },
      { Metric: 'Small-Cap Tier 4 Tickers', Value: data.summary.tier_breakdown?.tier_4_count ?? 0 },
      { Metric: 'Imminent Earnings Warnings (<= 7D)', Value: data.summary.tier_breakdown?.earnings_warning_count ?? 0 },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');
  }

  // Write file
  XLSX.writeFile(wb, filename);
}

// ----------------------------------------------------------------------------
// 3. FILE IMPORT (CSV & EXCEL) FOR WATCHLIST INGESTION
// ----------------------------------------------------------------------------

export interface ImportedTickerRow {
  symbol: string;
  name?: string;
  sector?: string;
  notes?: string;
}

export async function parseUploadedFile(file: File): Promise<{
  tickers: string[];
  rows: ImportedTickerRow[];
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          return resolve({ tickers: [], rows: [], errors: ['File was empty'] });
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length === 0) {
          return resolve({ tickers: [], rows: [], errors: ['No data found in sheet'] });
        }

        // Find header row or assume row 0 is headers
        let symbolColIdx = 0;
        let nameColIdx = -1;
        let sectorColIdx = -1;
        let notesColIdx = -1;
        let startRowIdx = 0;

        const headerRow = rawJson[0];
        if (Array.isArray(headerRow)) {
          headerRow.forEach((col, idx) => {
            if (typeof col === 'string') {
              const clean = col.trim().toLowerCase();
              if (clean.includes('symbol') || clean.includes('ticker') || clean === 'code') {
                symbolColIdx = idx;
                startRowIdx = 1;
              } else if (clean.includes('name') || clean.includes('company')) {
                nameColIdx = idx;
              } else if (clean.includes('sector') || clean.includes('industry')) {
                sectorColIdx = idx;
              } else if (clean.includes('note')) {
                notesColIdx = idx;
              }
            }
          });
        }

        const validSymbols: Set<string> = new Set();
        const rows: ImportedTickerRow[] = [];
        const errors: string[] = [];

        for (let i = startRowIdx; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!Array.isArray(row) || row.length === 0) continue;

          const rawSymbol = row[symbolColIdx];
          if (rawSymbol === undefined || rawSymbol === null) continue;

          const cleanSym = String(rawSymbol).trim().toUpperCase().replace(/[^A-Z]/g, '');

          // Standard US equity ticker validation (1 to 5 alpha chars)
          if (cleanSym.length >= 1 && cleanSym.length <= 5) {
            if (!validSymbols.has(cleanSym)) {
              validSymbols.add(cleanSym);
              rows.push({
                symbol: cleanSym,
                name: nameColIdx >= 0 && row[nameColIdx] ? String(row[nameColIdx]).trim() : undefined,
                sector: sectorColIdx >= 0 && row[sectorColIdx] ? String(row[sectorColIdx]).trim() : undefined,
                notes: notesColIdx >= 0 && row[notesColIdx] ? String(row[notesColIdx]).trim() : undefined,
              });
            }
          } else {
            errors.push(`Row ${i + 1}: Skipped invalid ticker "${rawSymbol}"`);
          }
        }

        resolve({
          tickers: Array.from(validSymbols),
          rows,
          errors: errors.slice(0, 5), // return first 5 sample errors if any
        });
      } catch (err: any) {
        reject(new Error(`Failed to parse file: ${err.message || err}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsBinaryString(file);
  });
}

export function downloadSampleTemplate(format: 'csv' | 'xlsx' = 'csv') {
  const sampleData = [
    { Ticker: 'AAPL', Name: 'Apple Inc.', Sector: 'Consumer Electronics', Notes: 'Core Growth' },
    { Ticker: 'MSFT', Name: 'Microsoft Corp', Sector: 'Software - Infrastructure', Notes: 'Cloud & AI' },
    { Ticker: 'NVDA', Name: 'NVIDIA Corp', Sector: 'Semiconductors', Notes: 'High IVR Play' },
    { Ticker: 'AMD', Name: 'Advanced Micro Devices', Sector: 'Semiconductors', Notes: 'Weekly Options' },
    { Ticker: 'SPY', Name: 'SPDR S&P 500 ETF', Sector: 'Broad Market ETF', Notes: 'Index Buffer' },
  ];

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Watchlist');
    XLSX.writeFile(wb, 'deltaharvest_watchlist_sample.xlsx');
  } else {
    const headers = ['Ticker', 'Name', 'Sector', 'Notes'];
    const rows = sampleData.map((d) => [d.Ticker, `"${d.Name}"`, `"${d.Sector}"`, `"${d.Notes}"`]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    downloadFile(csv, 'deltaharvest_watchlist_sample.csv', 'text/csv;charset=utf-8;');
  }
}

// ----------------------------------------------------------------------------
// 4. PRINT / PDF EXPORT TRIGGER
// ----------------------------------------------------------------------------

export function triggerPrintReport() {
  window.print();
}
