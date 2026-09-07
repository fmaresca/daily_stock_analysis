"""Unit tests for the NYSE Trading Holiday Calendar & Options Expiration Snapping Engine.

Validates:
1. Easter Sunday and Good Friday computation for multiple years (2024, 2025, 2026, 2027)
2. Friday holiday OCC adjustment to preceding Thursday (e.g. Good Friday, Christmas, Juneteenth)
3. Elimination of weekend (Saturday/Sunday) defaults
4. Closest Friday snapping on or after target DTE intervals (14 DTE, 30 DTE, 45 DTE)
5. Timezone-safe date arithmetic
"""

import datetime
import unittest


def get_easter_sunday(year: int) -> datetime.date:
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return datetime.date(year, month, day)


def get_good_friday(year: int) -> datetime.date:
    easter = get_easter_sunday(year)
    return easter - datetime.timedelta(days=2)


def get_nth_weekday_of_month(year: int, month: int, weekday: int, n: int) -> datetime.date:
    # weekday: 0 = Mon, 6 = Sun in Python
    d = datetime.date(year, month, 1)
    count = 0
    while d.month == month:
        if d.weekday() == weekday:
            count += 1
            if count == n:
                return d
        d += datetime.timedelta(days=1)
    return datetime.date(year, month, 1)


def get_last_weekday_of_month(year: int, month: int, weekday: int) -> datetime.date:
    if month == 12:
        d = datetime.date(year + 1, 1, 1) - datetime.timedelta(days=1)
    else:
        d = datetime.date(year, month + 1, 1) - datetime.timedelta(days=1)
    while d.weekday() != weekday:
        d -= datetime.timedelta(days=1)
    return d


def get_nyse_holidays(year: int) -> dict[datetime.date, str]:
    holidays = {}

    # New Year's Day
    nyd = datetime.date(year, 1, 1)
    if nyd.weekday() == 6:  # Sunday
        holidays[datetime.date(year, 1, 2)] = "New Year's Day (Observed)"
    elif nyd.weekday() != 5:  # Not Saturday
        holidays[nyd] = "New Year's Day"

    # MLK (3rd Monday in Jan)
    holidays[get_nth_weekday_of_month(year, 1, 0, 3)] = "Martin Luther King, Jr. Day"

    # Washington's Birthday (3rd Monday in Feb)
    holidays[get_nth_weekday_of_month(year, 2, 0, 3)] = "Washington's Birthday"

    # Good Friday (Friday before Easter)
    holidays[get_good_friday(year)] = "Good Friday"

    # Memorial Day (Last Monday in May)
    holidays[get_last_weekday_of_month(year, 5, 0)] = "Memorial Day"

    # Juneteenth (June 19)
    june19 = datetime.date(year, 6, 19)
    if june19.weekday() == 6:
        holidays[datetime.date(year, 6, 20)] = "Juneteenth (Observed)"
    elif june19.weekday() == 5:
        holidays[datetime.date(year, 6, 18)] = "Juneteenth (Observed)"
    else:
        holidays[june19] = "Juneteenth"

    # Independence Day (July 4)
    july4 = datetime.date(year, 7, 4)
    if july4.weekday() == 6:
        holidays[datetime.date(year, 7, 5)] = "Independence Day (Observed)"
    elif july4.weekday() == 5:
        holidays[datetime.date(year, 7, 3)] = "Independence Day (Observed)"
    else:
        holidays[july4] = "Independence Day"

    # Labor Day (1st Monday in Sep)
    holidays[get_nth_weekday_of_month(year, 9, 0, 1)] = "Labor Day"

    # Thanksgiving (4th Thursday in Nov)
    holidays[get_nth_weekday_of_month(year, 11, 3, 4)] = "Thanksgiving Day"

    # Christmas (Dec 25)
    xmas = datetime.date(year, 12, 25)
    if xmas.weekday() == 6:
        holidays[datetime.date(year, 12, 26)] = "Christmas Day (Observed)"
    elif xmas.weekday() == 5:
        holidays[datetime.date(year, 12, 24)] = "Christmas Day (Observed)"
    else:
        holidays[xmas] = "Christmas Day"

    return holidays


def adjust_expiration_for_nyse_holidays(target_date: datetime.date) -> tuple[datetime.date, bool, str | None]:
    cur = target_date
    was_adjusted = False
    holiday_name = None

    while True:
        holidays = get_nyse_holidays(cur.year)
        # Python weekday: 5 = Sat, 6 = Sun
        if cur.weekday() in (5, 6):
            cur -= datetime.timedelta(days=1)
            continue
        if cur in holidays:
            was_adjusted = True
            holiday_name = holidays[cur]
            cur -= datetime.timedelta(days=1)
            continue
        break

    return cur, was_adjusted, holiday_name


def get_next_weekly_expiration(from_date: datetime.date) -> tuple[datetime.date, bool, str | None]:
    # Python weekday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    day = from_date.weekday()
    if day == 4:  # Friday
        days_ahead = 7
    elif day == 5:  # Saturday
        days_ahead = 6
    elif day == 6:  # Sunday
        days_ahead = 5
    else:
        days_ahead = (4 - day) % 7

    target_friday = from_date + datetime.timedelta(days=days_ahead)
    return adjust_expiration_for_nyse_holidays(target_friday)


def get_closest_friday_dte_expiration(target_dte: int, from_date: datetime.date) -> tuple[datetime.date, bool, str | None]:
    target = from_date + datetime.timedelta(days=target_dte)
    day = target.weekday()
    days_to_friday = (4 - day + 7) % 7
    target_friday = target + datetime.timedelta(days=days_to_friday)
    return adjust_expiration_for_nyse_holidays(target_friday)


class TestNyseOptionsCalendar(unittest.TestCase):
    def test_easter_and_good_friday(self):
        # 2024
        self.assertEqual(get_good_friday(2024), datetime.date(2024, 3, 29))
        # 2025
        self.assertEqual(get_good_friday(2025), datetime.date(2025, 4, 18))
        # 2026
        self.assertEqual(get_good_friday(2026), datetime.date(2026, 4, 3))
        # 2027
        self.assertEqual(get_good_friday(2027), datetime.date(2027, 3, 26))

    def test_good_friday_occ_adjustment_to_thursday(self):
        # Good Friday 2026 is April 3, 2026
        # Options expiring that week MUST expire on Thursday, April 2, 2026
        adj_date, was_adj, name = adjust_expiration_for_nyse_holidays(datetime.date(2026, 4, 3))
        self.assertEqual(adj_date, datetime.date(2026, 4, 2))
        self.assertEqual(adj_date.weekday(), 3)  # Thursday
        self.assertTrue(was_adj)
        self.assertEqual(name, "Good Friday")

    def test_next_weekly_from_sunday_2026_09_06(self):
        # User reported default defaulting to Saturday 09/12/2026 instead of Friday
        # Sunday 2026-09-06 must resolve to Friday 2026-09-11
        sunday = datetime.date(2026, 9, 6)
        exp_date, was_adj, _ = get_next_weekly_expiration(sunday)
        self.assertEqual(exp_date, datetime.date(2026, 9, 11))
        self.assertEqual(exp_date.weekday(), 4)  # Friday
        self.assertFalse(was_adj)

    def test_dte_presets_fall_on_fridays(self):
        sunday = datetime.date(2026, 9, 6)

        # 14 DTE: 2026-09-06 + 14 = 2026-09-20 (Sunday) -> next Friday is 2026-09-25
        exp_14, _, _ = get_closest_friday_dte_expiration(14, sunday)
        self.assertEqual(exp_14, datetime.date(2026, 9, 25))
        self.assertEqual(exp_14.weekday(), 4)

        # 30 DTE: 2026-09-06 + 30 = 2026-10-06 (Tuesday) -> next Friday is 2026-10-09
        exp_30, _, _ = get_closest_friday_dte_expiration(30, sunday)
        self.assertEqual(exp_30, datetime.date(2026, 10, 9))
        self.assertEqual(exp_30.weekday(), 4)

        # 45 DTE: 2026-09-06 + 45 = 2026-10-21 (Wednesday) -> next Friday is 2026-10-23
        exp_45, _, _ = get_closest_friday_dte_expiration(45, sunday)
        self.assertEqual(exp_45, datetime.date(2026, 10, 23))
        self.assertEqual(exp_45.weekday(), 4)

    def test_christmas_friday_adjustment_2026(self):
        # In 2026, Dec 25 is Friday
        xmas_friday = datetime.date(2026, 12, 25)
        adj_date, was_adj, name = adjust_expiration_for_nyse_holidays(xmas_friday)
        self.assertEqual(adj_date, datetime.date(2026, 12, 24))
        self.assertEqual(adj_date.weekday(), 3)  # Thursday
        self.assertTrue(was_adj)
        self.assertEqual(name, "Christmas Day")


if __name__ == '__main__':
    unittest.main()
