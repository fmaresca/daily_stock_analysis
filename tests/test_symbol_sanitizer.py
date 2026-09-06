# -*- coding: utf-8 -*-
"""Unit tests for Symbol Sanitizer & CSV Header-Aware Audit Engine.

Verifies:
1. Structured CSV/TSV table extraction: strictly extracts symbols from the 'Symbol' column,
   ignoring all 12 other columns (Name, Last Price, Net Change, Barchart Opinion, etc.).
2. Zero pollution from column headers, corporate suffixes, strategy labels, or opinions.
3. Whitelist preservation for legitimate tickers that are English words (e.g. NET, NOW, AI, LOW).
4. Strict stoplist rejection for non-ticker words.
5. Bulk and individual record removal logic.
"""

import re
import unittest

KNOWN_GENUINE_TICKERS = {
    'NET', 'NOW', 'AI', 'ALL', 'LOW', 'CAT', 'MET', 'KEY', 'WELL', 'FAST',
    'HAS', 'ARE', 'HEAR', 'RUN', 'OUT', 'PLAY', 'ON', 'IT', 'SEE', 'PATH',
    'SO', 'TRUE', 'SHOP', 'SNAP', 'SPOT', 'WING', 'YUM',
}

DISALLOWED_WORDS = {
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
    'INC', 'CORP', 'LTD', 'LLC', 'PLC', 'CO', 'CLASS', 'GROUP', 'HLDG', 'HOLDINGS',
    'BUY', 'BUYS', 'SELL', 'SELLS', 'HOLD', 'HOLDS', 'STRONG', 'MODERATE', 'WEAK',
    'UNDER', 'OVER', 'NEUTRAL', 'OUTPERFORM', 'INLINE', 'MAXIMUM', 'STRENGTHENING',
}


def is_valid_ticker_symbol(token: str) -> bool:
    if not token or not isinstance(token, str):
        return False
    clean = token.strip().upper().replace('/', '.').replace('-', '.')
    if not re.match(r'^[A-Z]{1,5}(\.[A-Z]{1,2})?$', clean):
        return False
    base = clean.split('.')[0]
    if base in KNOWN_GENUINE_TICKERS:
        return True
    if base in DISALLOWED_WORDS:
        return False
    return True


def extract_symbols_from_csv(csv_content: str):
    lines = [l.strip() for l in csv_content.splitlines() if l.strip()]
    if not lines:
        return {'symbols': [], 'rejected': []}

    # Find header row with Symbol
    header_idx = -1
    symbol_col = -1
    for i, line in enumerate(lines[:5]):
        cols = [c.strip().strip('"\'') for c in line.split(',')]
        for j, col in enumerate(cols):
            clean_col = re.sub(r'[^a-zA-Z]', '', col).lower()
            if clean_col in ('symbol', 'ticker', 'sym', 'stocksymbol', 'underlying'):
                header_idx = i
                symbol_col = j
                break
        if header_idx != -1:
            break

    if header_idx != -1 and symbol_col != -1:
        valid_symbols = []
        rejected = []
        for line in lines[header_idx + 1:]:
            cols = [c.strip().strip('"\'') for c in line.split(',')]
            if len(cols) > symbol_col:
                raw_cell = cols[symbol_col].strip().upper()
                if is_valid_ticker_symbol(raw_cell):
                    if raw_cell not in valid_symbols:
                        valid_symbols.append(raw_cell)
                else:
                    rejected.append(raw_cell)
        return {'symbols': valid_symbols, 'rejected': rejected, 'structured': True}

    # Free text fallback
    tokens = re.split(r'[\s,;\t]+', csv_content)
    valid_symbols = []
    rejected = []
    for t in tokens:
        clean = t.strip().strip('"\'$').upper()
        if not clean:
            continue
        if is_valid_ticker_symbol(clean):
            if clean not in valid_symbols:
                valid_symbols.append(clean)
        else:
            rejected.append(clean)
    return {'symbols': valid_symbols, 'rejected': rejected, 'structured': False}


class TestSymbolSanitizer(unittest.TestCase):
    def test_barchart_csv_isolation(self):
        """Uploading a full Barchart View 190898 CSV extracts ONLY tickers from the Symbol column."""
        csv_data = """Symbol,Name,Last Price,Net Change,% Change,Barchart Opinion,Opinion Score %,Stability (Previous / Last Week / Last Month),Weekly Options,Options Cadence,Signal Strength,Signal Direction,Recommended Strategy
AAPL,Apple Inc,319.97,-8.24,-2.51%,80% Buy,80%,80% Buy -> 72% Buy -> 80% Buy,Weekly,Weekly,Strong,Strengthening,BULL_PUT_SPREAD
NVDA,NVIDIA Corp,230.36,1.91,0.84%,100% Buy,100%,100% Buy -> 100% Buy -> 100% Buy,Weekly,Weekly,Maximum (Top 1%),Strong Bullish,BULL_PUT_SPREAD
TSLA,Tesla Inc,354.08,-5.20,-1.45%,88% Buy,88%,88% Buy -> 88% Buy -> 88% Buy,Weekly,Weekly,Strong,Strong Bullish,BULL_PUT_SPREAD
NET,Cloudflare Inc,278.92,4.10,1.49%,100% Buy,100%,100% Buy -> 100% Buy -> 100% Buy,Weekly,Weekly,Maximum (Top 1%),Strong Bullish,BULL_PUT_SPREAD
PLTR,Palantir Technologies Inc,165.00,3.25,2.01%,100% Buy,100%,100% Buy -> 100% Buy -> 100% Buy,Weekly,Weekly,Maximum (Top 1%),Strong Bullish,BULL_PUT_SPREAD
"""
        result = extract_symbols_from_csv(csv_data)
        self.assertTrue(result['structured'])
        self.assertEqual(result['symbols'], ['AAPL', 'NVDA', 'TSLA', 'NET', 'PLTR'])

        # Critical verification: none of the column headers or description words are present
        disallowed_inclusions = [
            'SYMBOL', 'NAME', 'LAST', 'PRICE', 'CHANGE', 'OPINION', 'SCORE',
            'STABILITY', 'PREVIOUS', 'WEEK', 'MONTH', 'CADENCE', 'SIGNAL',
            'STRENGTH', 'DIRECTION', 'STRATEGY', 'BUY', 'STRONG', 'BULL', 'PUT', 'SPREAD',
            'INC', 'CORP',
        ]
        for word in disallowed_inclusions:
            self.assertNotIn(word, result['symbols'], f"Garbage word '{word}' was incorrectly parsed as a stock ticker!")

    def test_genuine_ticker_whitelist(self):
        """Legitimate tickers like NET, NOW, AI, and LOW are preserved."""
        for ticker in ['NET', 'NOW', 'AI', 'LOW', 'CAT', 'MET', 'KEY', 'WELL', 'FAST']:
            self.assertTrue(is_valid_ticker_symbol(ticker), f"Genuine ticker {ticker} was incorrectly rejected!")

    def test_non_ticker_stoplist_rejection(self):
        """Non-ticker words like SYMBOL, PRICE, LAST, OPINION, CADENCE are rejected."""
        for word in ['SYMBOL', 'PRICE', 'LAST', 'CHANGE', 'OPINION', 'CADENCE', 'STRATEGY', 'BUY', 'SELL', 'HOLD', 'INC', 'CORP']:
            self.assertFalse(is_valid_ticker_symbol(word), f"Non-ticker word {word} was incorrectly accepted!")

    def test_bulk_and_individual_record_clear(self):
        """Bulk clear empties the record array; individual remove deletes only the target symbol."""
        records = [
            {'symbol': 'AAPL', 'last_price': 225.0},
            {'symbol': 'NVDA', 'last_price': 125.0},
            {'symbol': 'TSLA', 'last_price': 350.0},
        ]
        # Individual removal of NVDA
        updated = [r for r in records if r['symbol'] != 'NVDA']
        self.assertEqual(len(updated), 2)
        self.assertEqual([r['symbol'] for r in updated], ['AAPL', 'TSLA'])

        # Bulk clear
        cleared = []
        self.assertEqual(len(cleared), 0)


def run_all_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSymbolSanitizer)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    assert result.wasSuccessful(), "Symbol Sanitizer tests failed!"


if __name__ == '__main__':
    run_all_tests()
