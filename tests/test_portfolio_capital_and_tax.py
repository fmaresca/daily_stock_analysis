#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit tests for Portfolio Capital, Collateral Budgeting, and Tax-Alpha Carryforward mathematics.
"""

import unittest


class TestPortfolioCapitalAndTax(unittest.TestCase):
    def test_committed_csp_collateral_calculation(self):
        # 100% Cash-Secured calculation: Strike * 100 * Contracts
        positions = [
            {"symbol": "SPY", "type": "CSP", "strike": 535.0, "quantity": 1},  # 53,500
            {"symbol": "AAPL", "type": "CSP", "strike": 215.0, "quantity": 2}, # 43,000
            {"symbol": "NVDA", "type": "COVERED_CALL", "strike": 135.0, "quantity": 1}, # CC does not commit cash
            {"symbol": "GOOGL", "type": "STOCK", "strike": 0.0, "quantity": 100}, # Stock
        ]
        
        committed = sum(p["strike"] * 100 * p["quantity"] for p in positions if p["type"] == "CSP")
        self.assertEqual(committed, 53500 + 43000)

    def test_free_cash_deployable(self):
        total_cash = 120000.0
        committed_collateral = 96500.0
        free_cash = max(0.0, total_cash - committed_collateral)
        self.assertEqual(free_cash, 23500.0)

    def test_affordable_positions_rule(self):
        free_cash = 35000.0
        max_per_position = 15000.0 # User's $15k per position rule
        affordable = min(5, int(free_cash // max_per_position))
        self.assertEqual(affordable, 2)

    def test_tax_loss_carryforward_netting(self):
        ytd_premiums = 4850.0
        ytd_realized_gains = 2150.0
        ytd_realized_losses = 800.0
        prior_year_carryforward = 3000.0

        net_before_carryforward = (ytd_premiums + ytd_realized_gains) - ytd_realized_losses
        self.assertEqual(net_before_carryforward, 6200.0)

        carryforward_applied = min(prior_year_carryforward, max(0.0, net_before_carryforward))
        self.assertEqual(carryforward_applied, 3000.0)

        net_taxable_income = max(0.0, net_before_carryforward - carryforward_applied)
        self.assertEqual(net_taxable_income, 3200.0)

        remaining_carryforward = prior_year_carryforward - carryforward_applied
        self.assertEqual(remaining_carryforward, 0.0)


if __name__ == "__main__":
    unittest.main()
