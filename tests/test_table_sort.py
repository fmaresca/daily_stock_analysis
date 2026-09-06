"""Unit tests for universal table sorting normalization and logic."""

import unittest
import re
from datetime import datetime


def normalize_sort_value(val):
    if val is None or val == "":
        return None

    if isinstance(val, (int, float)):
        return val

    if isinstance(val, str):
        s = val.strip()

        # Currency / price: $1,234.56 or -$45.00
        clean_currency = re.sub(r"^\+?\$?", "", s).replace(",", "")
        if clean_currency.startswith("-$"):
            clean_currency = "-" + clean_currency[2:]
        try:
            num = float(clean_currency)
            return num
        except ValueError:
            pass

        # Percentage: 15.4% or +3.2%
        if s.endswith("%"):
            try:
                num = float(s[:-1].replace(",", "").replace("+", "").strip())
                return num
            except ValueError:
                pass

        # Compact metric units: 150k or 2.5M
        metric_match = re.match(r"^([\d,.]+)\s*([kKmMbBtT])$", s)
        if metric_match:
            try:
                base = float(metric_match.group(1).replace(",", ""))
                unit = metric_match.group(2).lower()
                multiplier = {
                    "k": 1e3,
                    "m": 1e6,
                    "b": 1e9,
                    "t": 1e12,
                }.get(unit, 1)
                return base * multiplier
            except ValueError:
                pass

        # ISO Date check: YYYY-MM-DD
        date_match = re.match(r"^\d{4}-\d{2}-\d{2}", s)
        if date_match:
            try:
                dt = datetime.fromisoformat(s[:10])
                return dt.timestamp()
            except ValueError:
                pass

        return s.lower()

    return val


def compare_items(a_val, b_val, direction="asc"):
    norm_a = normalize_sort_value(a_val)
    norm_b = normalize_sort_value(b_val)

    if norm_a is None and norm_b is None:
        return 0
    if norm_a is None:
        return 1
    if norm_b is None:
        return -1

    if isinstance(norm_a, (int, float)) and isinstance(norm_b, (int, float)):
        diff = norm_a - norm_b
        return diff if direction == "asc" else -diff

    str_a = str(norm_a)
    str_b = str(norm_b)
    comp = (str_a > str_b) - (str_a < str_b)
    return comp if direction == "asc" else -comp


class TestTableSortLogic(unittest.TestCase):
    def test_numeric_currency_sorting(self):
        items = ["$125.50", "$20.00", "$1,450.00", "$5.10"]
        sorted_asc = sorted(items, key=lambda x: normalize_sort_value(x))
        self.assertEqual(sorted_asc, ["$5.10", "$20.00", "$125.50", "$1,450.00"])

    def test_percentage_sorting(self):
        items = ["+25.4%", "-5.2%", "0.0%", "100.5%"]
        sorted_asc = sorted(items, key=lambda x: normalize_sort_value(x))
        self.assertEqual(sorted_asc, ["-5.2%", "0.0%", "+25.4%", "100.5%"])

    def test_metric_suffix_sorting(self):
        items = ["1.5M", "500k", "2.1B", "10k"]
        sorted_asc = sorted(items, key=lambda x: normalize_sort_value(x))
        self.assertEqual(sorted_asc, ["10k", "500k", "1.5M", "2.1B"])

    def test_date_sorting(self):
        items = ["2026-09-08", "2026-09-01", "2026-10-15"]
        sorted_asc = sorted(items, key=lambda x: normalize_sort_value(x))
        self.assertEqual(sorted_asc, ["2026-09-01", "2026-09-08", "2026-10-15"])

    def test_null_handling(self):
        # Null values must sink to the bottom
        comp_asc = compare_items(None, "$50.00", direction="asc")
        self.assertEqual(comp_asc, 1)

        comp_desc = compare_items(None, "$50.00", direction="desc")
        self.assertEqual(comp_desc, 1)

        comp_valid = compare_items("$100.00", "$50.00", direction="asc")
        self.assertGreater(comp_valid, 0)

        comp_valid_desc = compare_items("$100.00", "$50.00", direction="desc")
        self.assertLess(comp_valid_desc, 0)


if __name__ == "__main__":
    unittest.main()
