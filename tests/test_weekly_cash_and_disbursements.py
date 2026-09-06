#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit tests for Weekly Cash Ledger, Living Expense Disbursements, 20-Delta Covered Calls,
and Gemini AI Markdown Response Parsing according to the steps.txt workflow.
"""

import unittest
import math
import re


class TestWeeklyCashAndDisbursements(unittest.TestCase):
    def test_cash_waterfall_with_default_weekly_disbursement(self):
        # Step 6 & 7: Total Cash - Encumbered Disbursements ($5k default) - Committed CSPs = Free Cash
        total_cash = 100000.0
        weekly_living_expense = 5000.0
        other_disbursements = 1500.0
        total_encumbered_disbursements = weekly_living_expense + other_disbursements
        
        open_csps = [
            {"symbol": "SPY", "strike": 530.0, "quantity": 1},   # $53,000
            {"symbol": "NVDA", "strike": 120.0, "quantity": 2},  # $24,000
        ]
        committed_csp_collateral = sum(p["strike"] * 100 * p["quantity"] for p in open_csps)
        self.assertEqual(committed_csp_collateral, 77000.0)

        true_free_cash = max(0.0, total_cash - total_encumbered_disbursements - committed_csp_collateral)
        expected_free_cash = 100000.0 - 6500.0 - 77000.0
        self.assertEqual(true_free_cash, expected_free_cash)
        self.assertEqual(true_free_cash, 16500.0)

    def test_dynamic_position_sizing_with_high_net_worth_free_cash(self):
        # User scenario: Likely >$500,000 free cash each week for CSP
        total_cash = 555000.0
        weekly_living = 5000.0
        free_cash = total_cash - weekly_living  # $550,000.0
        self.assertEqual(free_cash, 550000.0)

        # Single equity security CSP limit: No more than $200,000
        single_equity_cap = 200000.0

        # Dynamic target allocation: min(200000, max(25000, free_cash // 5)) -> $110,000 / pos
        auto_target_allocation = min(single_equity_cap, max(25000.0, free_cash // 5))
        self.assertEqual(auto_target_allocation, 110000.0)

        # Max concurrent positions permitted: min(5, floor(free_cash / auto_target_allocation))
        max_positions = min(5, max(1, int(free_cash // auto_target_allocation)))
        self.assertEqual(max_positions, 5)

        # Ensure single equity position limit is strictly capped at $200,000
        custom_oversized_allocation = 250000.0
        enforced_allocation = min(single_equity_cap, custom_oversized_allocation)
        self.assertEqual(enforced_allocation, 200000.0)

        # With maximum single position cap ($200,000), free cash of $550k yields floor(550k / 200k) = 2 positions
        positions_at_max_cap = min(5, max(1, int(free_cash // enforced_allocation)))
        self.assertEqual(positions_at_max_cap, 2)

    def test_calendar_ytd_premiums_addition(self):
        # Step 2: Prior YTD balance + Current week harvest
        prior_ytd_balance = 24500.0
        current_week_premiums = 1250.0
        cumulative_ytd = prior_ytd_balance + current_week_premiums
        self.assertEqual(cumulative_ytd, 25750.0)

    def test_prior_year_loss_carryover_offset(self):
        # Step 3: Prior year capital loss carryover netting
        ytd_premiums = 18000.0
        ytd_realized_gains = 4000.0
        ytd_realized_losses = 1000.0
        prior_year_loss_carryover = 12000.0

        net_before_carryforward = (ytd_premiums + ytd_realized_gains) - ytd_realized_losses
        self.assertEqual(net_before_carryforward, 21000.0)

        carryforward_applied = min(prior_year_loss_carryover, max(0.0, net_before_carryforward))
        self.assertEqual(carryforward_applied, 12000.0)

        net_taxable = max(0.0, net_before_carryforward - carryforward_applied)
        self.assertEqual(net_taxable, 9000.0)

        remaining_carryover = prior_year_loss_carryover - carryforward_applied
        self.assertEqual(remaining_carryover, 0.0)

    def test_20_delta_covered_call_strike_selection(self):
        # Step 9b: 20Δ strike selection above spot and resistance
        spot_price = 220.0
        ivr30 = 35.0  # 35% IV
        dte = 5
        resistance = 225.0

        iv_norm = ivr30 / 100.0
        expected_move = spot_price * iv_norm * math.sqrt(dte / 365.0) * 0.84
        raw_strike = spot_price + expected_move
        # Must anchor at or above key resistance
        chosen_strike = max(raw_strike, resistance)
        self.assertGreaterEqual(chosen_strike, spot_price)
        self.assertGreaterEqual(chosen_strike, resistance)

    def test_gemini_markdown_tables_parsing(self):
        sample_markdown = """
Here is the systematic analysis based on the strict filtering criteria:

TABLE 1: RECOMMENDED TRADES (FINAL 5)
| Ticker | Current Price | Put Strike | Expiration | DTE | Delta | Bid/Ask | Net Premium | Collateral | Ann. ROC (%) | Cushion (%) | Rationale / Key Support Level |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NVDA | 125.50 | 118.00 | 2026-09-11 | 6 | -0.18 | $1.40 / $1.50 | $1.45 | $11,800 | 32.5% | 6.0% | Strong support at 50-day EMA and rising RSI (58) |
| MSFT | 445.00 | 425.00 | 2026-09-11 | 6 | -0.19 | $2.10 / $2.20 | $2.15 | $42,500 | 25.1% | 4.5% | Institutional volume shelf at 420 |
| AAPL | 225.00 | 215.00 | 2026-09-11 | 6 | -0.21 | $1.80 / $1.90 | $1.85 | $21,500 | 27.8% | 4.4% | Horizontal breakout retest |
| AMZN | 185.00 | 175.00 | 2026-09-11 | 6 | -0.22 | $1.65 / $1.75 | $1.70 | $17,500 | 29.4% | 5.4% | Trend continuation |
| GOOGL | 165.00 | 155.00 | 2026-09-11 | 6 | -0.19 | $1.30 / $1.40 | $1.35 | $15,500 | 26.2% | 6.1% | Double bottom support |

TABLE 2: BORDERLINE CANDIDATES (Missed top 5 due to lower ROC or closer support)
| Ticker | Strike | Delta | Reason for Demotion |
|---|---|---|---|
| TSLA | 210.00 | -0.24 | Excessive volatility and binary macro exposure |
| AMD | 145.00 | -0.23 | ROC slightly below top 5 cutoff |

TABLE 3: EXCLUDED CANDIDATES (Failed hard filters)
| Ticker | Filter Failed |
|---|---|
| NFLX | Earnings announcement within expiration cycle |
| INTC | Below 9 EMA and 18 EMA (Downtrend) |
"""
        # Test table detection
        self.assertIn("TABLE 1: RECOMMENDED TRADES", sample_markdown)
        self.assertIn("TABLE 2: BORDERLINE CANDIDATES", sample_markdown)
        self.assertIn("TABLE 3: EXCLUDED CANDIDATES", sample_markdown)

        # Parse Table 1 rows
        t1_rows = []
        in_t1 = False
        for line in sample_markdown.splitlines():
            line = line.strip()
            if "TABLE 1" in line:
                in_t1 = True
                continue
            if "TABLE 2" in line or "TABLE 3" in line:
                in_t1 = False
            if in_t1 and line.startswith("|") and not line.startswith("|---") and not "Ticker" in line:
                cols = [c.strip() for c in line.split("|")[1:-1]]
                if len(cols) >= 8:
                    t1_rows.append(cols)

        self.assertEqual(len(t1_rows), 5)
        self.assertEqual(t1_rows[0][0], "NVDA")
        self.assertEqual(t1_rows[0][2], "118.00")
        self.assertEqual(t1_rows[4][0], "GOOGL")

    def test_gemini_institutional_15_column_table_parsing(self):
        # Format matching the adapted prompt for Gemini Pro / Gemini Thinking
        sample_markdown = """
**Executive Summary:**
Total Premium Captured: $4,850.00
Portfolio Weekly ROC: 1.62% (84.2% Annualized)
Remaining Deployable Cash: $120,500.00

TABLE 1: RECOMMENDED TRADES (FINAL CANDIDATES)
| Risk Rank | Stock Symbol | Current Price | IV | 14-Day RSI | Suggested Strike | Option Delta | OTM Cushion | Contracts | Collateral Committed | % of Pool | Est. Premium / Share | Total Premium | Weekly ROC | Annualized ROC |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | NVDA | $125.50 | 38.2% | 58 | $118.00 | -0.18 | 6.0% | 10 | $118,000.00 | 39.3% | $1.45 | $1,450.00 | 1.23% | 63.9% |
| 2 | MSFT | $445.00 | 22.5% | 52 | $425.00 | -0.19 | 4.5% | 1 | $42,500.00 | 14.2% | $2.15 | $215.00 | 0.51% | 26.3% |
| 3 | AAPL | $225.00 | 21.0% | 61 | $215.00 | -0.20 | 4.4% | 1 | $21,500.00 | 7.2% | $1.85 | $185.00 | 0.86% | 44.7% |
| TOTALS | - | - | - | - | - | - | - | 12 | $182,000.00 | 60.7% | - | $1,850.00 | 1.02% | 52.8% |
| REMAINING UNALLOCATED CASH: $118,000.00 | - | - | - | - | - | - | - | - | - | - | - | - | - | - |

TABLE 2: BORDERLINE CANDIDATES
| Symbol | Current Price | Trend Str/Dir | 14D RSI | Earnings Date | Reason |
| :---: | :---: | :---: | :---: | :---: | :---: |
| TSLA | $210.00 | Up 80% | 68 | 2026-10-18 | Approaching 70 RSI overbought threshold |
| AMD | $145.00 | Up 75% | 54 | 2026-10-25 | Lower IV Rank compared to NVDA |

TABLE 3: EXCLUDED CANDIDATES
| Symbol | Current Price | Specific Exclusion Rule Failed |
| :---: | :---: | :---: |
| NFLX | $680.00 | Earnings announcement within expiration week |
| INTC | $22.00 | Failed 9/18-day EMA uptrend check (Bearish) |
"""
        # Verify section presence
        self.assertIn("TABLE 1: RECOMMENDED TRADES", sample_markdown)
        self.assertIn("TABLE 2: BORDERLINE CANDIDATES", sample_markdown)
        self.assertIn("TABLE 3: EXCLUDED CANDIDATES", sample_markdown)

        # Parse rows, ensuring TOTALS and REMAINING CASH rows are skipped
        t1_trades = []
        in_t1 = False
        headers = []
        for line in sample_markdown.splitlines():
            line = line.strip()
            if "TABLE 1" in line:
                in_t1 = True
                continue
            if "TABLE 2" in line or "TABLE 3" in line:
                in_t1 = False
            if in_t1 and line.startswith("|") and not line.startswith("| :---"):
                cols = [c.strip() for c in line.split("|")[1:-1]]
                if not headers and ("Stock Symbol" in cols or "Risk Rank" in cols):
                    headers = [c.lower() for c in cols]
                    continue
                first_col = cols[0].lower()
                if "total" in first_col or "remaining" in first_col:
                    continue
                if len(cols) >= 10:
                    t1_trades.append(cols)

        # 3 recommended trade rows, totals excluded
        self.assertEqual(len(t1_trades), 3)
        self.assertEqual(t1_trades[0][1], "NVDA")
        self.assertEqual(t1_trades[0][5], "$118.00")
        self.assertEqual(t1_trades[0][8], "10")  # 10 contracts
        self.assertEqual(t1_trades[0][9], "$118,000.00")  # under $200k limit!
        self.assertEqual(t1_trades[1][1], "MSFT")
        self.assertEqual(t1_trades[2][1], "AAPL")

    def test_living_trust_options_account_csp_reconciliation(self):
        # Ground truth for account: Living Trust-Options ...609
        total_account_net_value = 2343519.76
        snyxx = 202775.94  # Schwab New York Municipal Money Ultra
        snaxx = 77341.30   # Schwab Prime Advantage Money Ultra
        core_cash = 293703.52  # Cash & Cash Investments sweep
        
        # 1. Total Cash pool before offsets (all deemed cash to cover CSPs)
        total_cash_to_cover_csp = snyxx + snaxx + core_cash
        self.assertAlmostEqual(total_cash_to_cover_csp, 573820.76, places=2)
        
        # 2. Outstanding open Puts committed collateral offset
        open_puts = [
            {"symbol": "PANW", "strike": 327.50, "contracts": 3},
            {"symbol": "PLTR", "strike": 165.00, "contracts": 10},
        ]
        panw_collateral = 327.50 * 3 * 100  # $98,250
        pltr_collateral = 165.00 * 10 * 100  # $165,000
        self.assertEqual(panw_collateral, 98250.0)
        self.assertEqual(pltr_collateral, 165000.0)
        
        # Both individual positions must adhere to the $200,000 single equity cap
        self.assertLessEqual(panw_collateral, 200000.0)
        self.assertLessEqual(pltr_collateral, 200000.0)
        
        total_committed_collateral = panw_collateral + pltr_collateral
        self.assertEqual(total_committed_collateral, 263250.0)
        
        # 3. Weekly living expenses encumbered
        weekly_living_disbursement = 5000.0
        
        # 4. True Deployable Free Cash
        deployable_free_cash = total_cash_to_cover_csp - total_committed_collateral - weekly_living_disbursement
        self.assertAlmostEqual(deployable_free_cash, 305570.76, places=2)
        
        # 5. Position Sizing (e.g. target $100,000 per position)
        target_allocation = 100000.0
        max_positions = min(5, math.floor(deployable_free_cash / target_allocation))
        self.assertEqual(max_positions, 3)

    def test_80_percent_profit_capture_trigger(self):
        # Verifies 80% profit capture alert triggers on covered calls and CSPs
        positions = [
            {"symbol": "BLZE 17.5C", "gain_pct": 84.9, "expected_alert": True},
            {"symbol": "TSLA 375C", "gain_pct": 85.27, "expected_alert": True},
            {"symbol": "TSLA 370C", "gain_pct": 21.2, "expected_alert": False},
            {"symbol": "AXTI 70C", "gain_pct": 70.56, "expected_alert": False},
        ]
        for p in positions:
            is_80_pct = p["gain_pct"] >= 80.0
            self.assertEqual(is_80_pct, p["expected_alert"])

    def test_schwab_csv_parsing_and_barchart_closing_prices(self):
        # Sample Schwab positions CSV text
        sample_csv = '''"Positions for account Living Trust-Options ...609 as of 09:04 PM ET, 2026/09/05"

"Symbol","Description","Qty (Quantity)","Price","Price Chng % (Price Change %)","Price Chng $ (Price Change $)","Mkt Val (Market Value)","Cost Basis","Day Chng $ (Day Change $)","Day Chng % (Day Change %)","Gain $ (Gain/Loss $)","Gain % (Gain/Loss %)","Ratings","Reinvest?","Reinvest Capital Gains?","% of Acct (% of Account)","Asset Type",
"AXTI","AXT INC","1,500","61.64","9.68%","5.44","$92,460.00","$180,160.13","$8,160.00","9.68%","-$87,700.13","-48.68%","D","No","N/A","3.92%","Equity",
"BLZE","BACKBLAZE INC CLASS A","11,000","13.455","1.09%","0.145","$148,005.00","$188,173.41","$1,595.00","1.09%","-$40,168.41","-21.35%","C","No","N/A","6.27%","Equity",
"IONQ","IONQ INC","1,500","39.52","1.28%","0.50","$59,280.00","$88,315.08","$750.00","1.28%","-$29,035.08","-32.88%","F","No","N/A","2.51%","Equity",
"LUNR","INTUITIVE MACHS INC CLASS A","5,000","14.81","0.75%","0.11","$74,050.00","$143,934.00","$550.00","0.75%","-$69,884.00","-48.55%","F","No","N/A","3.14%","Equity",
"NET","CLOUDFLARE INC CLASS A","1,300","278.92","-1.96%","-5.59","$362,596.00","$380,583.72","-$7,267.00","-1.96%","-$17,987.72","-4.73%","C","No","N/A","15.37%","Equity",
"RTX","RTX CORP","1,700","200.79","-0.66%","-1.34","$341,343.00","$372,209.38","-$2,278.00","-0.66%","-$30,866.38","-8.29%","A","No","N/A","14.47%","Equity",
"TSLA","TESLA INC","2,000","354.08","-5.92%","-22.285","$708,160.00","$786,234.08","-$44,570.00","-5.92%","-$78,074.08","-9.93%","F","Yes","N/A","30.01%","Equity",
"PANW 09/11/2026 327.50 P","PUT PALO ALTO NETWORKS I$327.5 EXP 09/11/26","-3","5.375","-22.38%","-1.55","-$1,612.50","-$1,998.96","$465.00","22.38%","$386.46","19.33%","-","N/A","N/A","-","Option",
"PLTR 09/11/2026 165.00 P","PUT PALANTIR TECHNOLOGIE$165 EXP 09/11/26","-10","1.01","83.64%","0.46","-$1,010.00","-$883.33","-$460.00","-83.64%","-$126.67","-14.34%","-","N/A","N/A","-","Option",
"SNYXX","SCHWAB NEW YORK MUNICIPAL MONEY ULTRA","202,775.94","1.00","0%","0.00","$202,775.94","$202,775.94","$0.00","0%","$0.00","0%","-","Yes","Yes","8.59%","Cash and Money Market",
"SNAXX","SCHWAB PRIME ADVANTAGE MONEY ULTRA","77,341.3","1.00","0%","0.00","$77,341.30","$77,341.30","$0.00","0%","$0.00","0%","-","Yes","Yes","3.28%","Cash and Money Market",
"Cash & Cash Investments","--","--","--","--","--","$293,703.52","--","$0.00","0%","--","--","--","--","--","12.45%","Cash and Money Market",
"Positions Total","","--","--","--","--","$2,343,519.76","$2,368,212.93","-$1,222.69","-0.05%","-$318,396.69","-13.44%","--","--","--","--","--",
'''
        # Parse CSV lines
        lines = [l.strip() for l in sample_csv.strip().splitlines() if l.strip()]
        equities = []
        short_puts = []
        cash_pool = 0.0

        for line in lines:
            if "Positions for account" in line or "Symbol" in line:
                continue
            parts = [p.strip().strip('"') for p in line.split('","')]
            if len(parts) < 17:
                continue
            sym = parts[0]
            qty_str = parts[2].replace(",", "")
            price_str = parts[3].replace(",", "")
            asset_type = parts[16]

            if "Cash and Money Market" in asset_type:
                mkt_val = float(parts[6].replace("$", "").replace(",", "")) if "$" in parts[6] else float(qty_str) if qty_str != "--" else 0.0
                cash_pool += mkt_val
            elif "Equity" in asset_type:
                equities.append({
                    "symbol": sym,
                    "price": float(price_str),
                    "shares": float(qty_str),
                })
            elif "Option" in asset_type and sym.endswith(" P"):
                qty = float(qty_str)
                if qty < 0:
                    strike = float(sym.split()[2])
                    short_puts.append({
                        "symbol": sym.split()[0],
                        "strike": strike,
                        "contracts": abs(qty),
                        "collateral": strike * abs(qty) * 100,
                    })

        self.assertAlmostEqual(cash_pool, 573820.76, places=2)
        self.assertEqual(len(equities), 7)
        self.assertEqual([e["symbol"] for e in equities], ["AXTI", "BLZE", "IONQ", "LUNR", "NET", "RTX", "TSLA"])
        
        # Verify none of the imported equities default to 150.0
        for eq in equities:
            self.assertNotEqual(eq["price"], 150.0)
            self.assertGreater(eq["price"], 0)

        # Verify short puts collateral
        total_put_collateral = sum(p["collateral"] for p in short_puts)
        self.assertEqual(total_put_collateral, 263250.0)

        # Net cash for new CSPs
        living_exp = 5000.0
        net_cash = cash_pool - total_put_collateral - living_exp
        self.assertAlmostEqual(net_cash, 305570.76, places=2)

    def test_schwab_real_options_and_live_transactions(self):
        # 1. Real Schwab options inventory extracted from live positions CSV
        schwab_options = [
            {"symbol": "PANW", "type": "CSP", "strike": 327.50, "qty": 3, "premium": 1998.96},
            {"symbol": "PLTR", "type": "CSP", "strike": 165.00, "qty": 10, "premium": 883.33},
            {"symbol": "TSLA", "type": "COVERED_CALL", "strike": 375.00, "qty": 20, "premium": 19886.25},
            {"symbol": "AXTI", "type": "COVERED_CALL", "strike": 70.00, "qty": 15, "premium": 11464.76},
            {"symbol": "BLZE", "type": "COVERED_CALL", "strike": 17.50, "qty": 110, "premium": 10926.45},
            {"symbol": "TSLA", "type": "COVERED_CALL", "strike": 370.00, "qty": 20, "premium": 2766.63},
            {"symbol": "NET", "type": "COVERED_CALL", "strike": 300.00, "qty": 13, "premium": 2071.31},
            {"symbol": "IONQ", "type": "COVERED_CALL", "strike": 43.50, "qty": 15, "premium": 635.01},
            {"symbol": "RTX", "type": "COVERED_CALL", "strike": 207.50, "qty": 17, "premium": 464.68},
            {"symbol": "LUNR", "type": "COVERED_CALL", "strike": 16.50, "qty": 50, "premium": 416.73},
        ]

        # Verify no dummy test tickers (SPY / AAPL CSPs)
        symbols = [o["symbol"] for o in schwab_options]
        self.assertNotIn("SPY", symbols)
        self.assertNotIn("AAPL", symbols)

        # Verify total option premiums written
        total_premiums = sum(o["premium"] for o in schwab_options)
        self.assertAlmostEqual(total_premiums, 51514.11, places=2)

        # 2. Test live mid-week CSP transaction dynamic impact
        starting_cash = 573820.76
        disbursements = 5000.0
        existing_csp_collateral = 263250.0  # PANW ($98,250) + PLTR ($165,000)
        initial_free_cash = starting_cash - disbursements - existing_csp_collateral
        self.assertAlmostEqual(initial_free_cash, 305570.76, places=2)

        # User enters new mid-week transaction: Sell 5x NVDA $115 Puts @ $2.40
        new_put_strike = 115.0
        new_put_contracts = 5
        new_put_premium_per_share = 2.40
        new_collateral = new_put_strike * new_put_contracts * 100  # $57,500.00
        new_premium_collected = new_put_premium_per_share * new_put_contracts * 100  # $1,200.00

        updated_committed_collateral = existing_csp_collateral + new_collateral
        updated_free_cash = starting_cash - disbursements - updated_committed_collateral
        self.assertEqual(new_collateral, 57500.0)
        self.assertEqual(new_premium_collected, 1200.0)
        self.assertAlmostEqual(updated_free_cash, 248070.76, places=2)

        # Verify single equity security CSP limit ($200,000 maximum)
        max_single_limit = 200000.0
        self.assertLessEqual(new_collateral, max_single_limit)


if __name__ == "__main__":
    unittest.main()
