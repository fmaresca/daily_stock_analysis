import { GeminiScreenResult } from '../types/options';

/**
 * Parses Gemini AI Pro Markdown Output into 3 Structured Tables (Recommended, Borderline, Excluded)
 */
export function parseGeminiMarkdownTables(text: string): GeminiScreenResult {
  const result: GeminiScreenResult = {
    recommendedTrades: [],
    borderlineCandidates: [],
    excludedCandidates: [],
    rawMarkdown: text,
  };

  if (!text || !text.includes('|')) return result;

  const lines = text.split('\n');
  let currentTable: 'RECOMMENDED' | 'BORDERLINE' | 'EXCLUDED' | null = null;
  let currentHeaders: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section headers
    if (line.toUpperCase().includes('RECOMMENDED TRADES') || line.toUpperCase().includes('TABLE 1')) {
      currentTable = 'RECOMMENDED';
      currentHeaders = [];
      continue;
    } else if (line.toUpperCase().includes('BORDERLINE') || line.toUpperCase().includes('TABLE 2')) {
      currentTable = 'BORDERLINE';
      currentHeaders = [];
      continue;
    } else if (line.toUpperCase().includes('EXCLUDED') || line.toUpperCase().includes('TABLE 3')) {
      currentTable = 'EXCLUDED';
      currentHeaders = [];
      continue;
    }

    // Skip markdown table dividers e.g. |---|---|
    if (line.includes('---') || !line.startsWith('|')) continue;

    const cols = line.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length);
    if (cols.length < 2) continue;

    // Detect or skip header rows
    const firstColLower = cols[0].toLowerCase();
    if (
      firstColLower.includes('ticker') ||
      firstColLower.includes('symbol') ||
      firstColLower.includes('risk rank') ||
      firstColLower.includes('rank')
    ) {
      currentHeaders = cols.map((c) => c.toLowerCase().trim());
      continue;
    }

    // Skip summary, totals, or definition rows
    if (
      firstColLower.includes('total') ||
      firstColLower.includes('remaining') ||
      firstColLower.includes('formula') ||
      (cols[1] && cols[1].toLowerCase().includes('total'))
    ) {
      continue;
    }

    try {
      if (currentTable === 'RECOMMENDED') {
        const findColIdx = (keywords: string[]) =>
          currentHeaders.findIndex((h) => keywords.some((kw) => h.includes(kw)));

        const symIdx = findColIdx(['stock symbol', 'symbol', 'ticker']);
        const strikeIdx = findColIdx(['suggested strike', 'put strike', 'strike']);

        if (currentHeaders.length > 0 && symIdx !== -1 && strikeIdx !== -1) {
          // Dynamic Header-Driven Column Extraction
          const priceIdx = findColIdx(['current price', 'price', 'spot']);
          const deltaIdx = findColIdx(['option delta', 'delta']);
          const rsiIdx = findColIdx(['14-day rsi', '14d rsi', 'rsi']);
          const premIdx = findColIdx(['total premium', 'est. premium', 'net premium', 'premium']);
          const collateralIdx = findColIdx(['collateral committed', 'collateral', 'capital']);
          const contractsIdx = findColIdx(['contracts']);
          const cushionIdx = findColIdx(['otm cushion', 'cushion']);
          const rocIdx = findColIdx(['annualized roc', 'ann. roc', 'weekly roc', 'roc']);
          const justIdx = findColIdx(['justification', 'rationale', 'support', 'reason']);

          const sym = (cols[symIdx] || '').replace(/[*_`]/g, '').trim();
          if (!sym || sym.toLowerCase().includes('total')) continue;

          const rankIdx = findColIdx(['risk rank', 'rank']);
          const rank = rankIdx !== -1 && /^\d+$/.test(cols[rankIdx]) ? parseInt(cols[rankIdx], 10) : result.recommendedTrades.length + 1;
          const currentPrice = priceIdx !== -1 ? parseFloat((cols[priceIdx] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
          const strike = parseFloat((cols[strikeIdx] || '0').replace(/[^0-9.]/g, '')) || 0;
          const delta = deltaIdx !== -1 ? Math.abs(parseFloat((cols[deltaIdx] || '0.20').replace(/[^0-9.-]/g, '')) || 0.20) : 0.20;
          const rsi = rsiIdx !== -1 ? parseFloat((cols[rsiIdx] || '55').replace(/[^0-9.]/g, '')) || 55 : 55;
          const prem = premIdx !== -1 ? cols[premIdx] : '$1.50';
          const contracts = contractsIdx !== -1 ? parseInt((cols[contractsIdx] || '1').replace(/[^0-9]/g, ''), 10) || 1 : 1;
          let collateral = collateralIdx !== -1 ? parseFloat((cols[collateralIdx] || '0').replace(/[^0-9.]/g, '')) || 0 : 0;
          if (collateral === 0 && strike > 0) collateral = strike * 100 * contracts;

          const cushion = cushionIdx !== -1 ? cols[cushionIdx] : '';
          const roc = rocIdx !== -1 ? cols[rocIdx] : '';
          const justification = justIdx !== -1 ? cols[justIdx] : `Confirmed Support (Contracts: ${contracts}, ROC: ${roc}, Cushion: ${cushion})`;

          result.recommendedTrades.push({
            riskRank: rank,
            symbol: sym,
            currentPrice,
            trendStrDir: 'Strong Uptrend',
            rsi14: rsi,
            earningsDate: 'None in expiration cycle',
            suggestedStrike: strike,
            delta,
            estPremiumAnnualized: prem,
            capitalCommitted: collateral,
            sentimentFlags: 'Bullish',
            technicalJustification: justification,
          });
        } else {
          // Fallback Heuristics
          const hasRankCol = /^\d+$/.test(cols[0].trim());
          const offset = hasRankCol ? 1 : 0;
          const rank = hasRankCol ? parseInt(cols[0], 10) : result.recommendedTrades.length + 1;
          const sym = (cols[offset] || '').replace(/[*_`]/g, '').trim();
          if (!sym || sym.toLowerCase().includes('total')) continue;

          const currentPrice = parseFloat((cols[offset + 1] || '0').replace(/[^0-9.]/g, '')) || 0;
          const strike = parseFloat((cols[offset + 2] || '0').replace(/[^0-9.]/g, '')) || 0;
          
          const col3 = cols[offset + 3] || '';
          const isExpDate = /\d{4}-\d{2}-\d{2}|\w{3}\s+\d{1,2}/.test(col3) || col3.toLowerCase().includes('dte');
          
          let delta = 0.20;
          let prem = '$1.50';
          let collateral = strike > 0 ? strike * 100 : 10000;
          let justification = '';

          if (isExpDate) {
            delta = parseFloat((cols[offset + 5] || '0.20').replace(/[^0-9.-]/g, '')) || 0.20;
            prem = cols[offset + 7] || cols[offset + 6] || '$1.50';
            collateral = parseFloat((cols[offset + 8] || `${strike * 100}`).replace(/[^0-9.]/g, '')) || (strike * 100);
            const roc = cols[offset + 9] || '';
            const cushion = cols[offset + 10] || '';
            const rationale = cols[offset + 11] || cols[cols.length - 1] || 'Optimal risk-reward';
            justification = `${rationale} (ROC: ${roc}, Cushion: ${cushion})`;
          } else {
            delta = parseFloat((cols[offset + 6] || '0.20').replace(/[^0-9.-]/g, '')) || 0.20;
            prem = cols[offset + 7] || '$1.50';
            collateral = parseFloat((cols[offset + 8] || `${strike * 100}`).replace(/[^0-9.]/g, '')) || (strike * 100);
            justification = cols[offset + 10] || cols[cols.length - 1] || 'Confirmed by technicals';
          }

          result.recommendedTrades.push({
            riskRank: rank,
            symbol: sym,
            currentPrice,
            trendStrDir: 'Strong Uptrend',
            rsi14: 55,
            earningsDate: 'None in 14d',
            suggestedStrike: strike,
            delta: Math.abs(delta),
            estPremiumAnnualized: prem,
            capitalCommitted: collateral,
            sentimentFlags: 'Bullish',
            technicalJustification: justification,
          });
        }
      } else if (currentTable === 'BORDERLINE') {
        const sym = (cols[0] || '').replace(/[*_`]/g, '').trim();
        if (!sym || sym.toLowerCase().includes('symbol') || sym.toLowerCase().includes('ticker')) continue;
        const reason = cols.length >= 4 ? cols[cols.length - 1] : (cols[1] || 'Borderline risk profile');
        result.borderlineCandidates.push({
          symbol: sym,
          currentPrice: parseFloat((cols[1] || '0').replace(/[^0-9.]/g, '')) || 0,
          trendStrDir: 'Moderate',
          rsi14: 50,
          earningsDate: 'N/A',
          borderlineReason: reason,
        });
      } else if (currentTable === 'EXCLUDED') {
        const sym = (cols[0] || '').replace(/[*_`]/g, '').trim();
        if (!sym || sym.toLowerCase().includes('symbol') || sym.toLowerCase().includes('ticker')) continue;
        const reason = cols[cols.length - 1] || cols[1] || 'Failed hard filters';
        result.excludedCandidates.push({
          symbol: sym,
          currentPrice: 0,
          reasonForExclusion: reason,
        });
      }
    } catch (err) {
      console.warn('Error parsing markdown line:', rawLine, err);
    }
  }

  return result;
}
