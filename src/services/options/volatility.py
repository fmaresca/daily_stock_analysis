# -*- coding: utf-8 -*-
"""
Volatility Analytics Engine
===========================
Calculates:
- 30-day Realized Volatility (RV_30d)
- 252-day IV Rank (IVR) and IV Percentile (IVP)
- Variance Risk Premium (VRP = IV_atm - RV_30d)
"""

from __future__ import annotations

import math
from typing import List, Optional, Tuple
import numpy as np
import pandas as pd


def calculate_realized_volatility(close_prices: List[float], window: int = 30) -> float:
    """
    Annualized Realized Volatility (RV) over specified window using log returns.
    Returns percentage (e.g. 24.5 for 24.5%).
    """
    if len(close_prices) < window + 1:
        return 25.0

    series = pd.Series(close_prices)
    log_returns = np.log(series / series.shift(1)).dropna()
    window_returns = log_returns.tail(window)
    if len(window_returns) < 5:
        return 25.0

    daily_std = window_returns.std()
    annualized_rv = daily_std * math.sqrt(252) * 100.0
    return round(float(annualized_rv), 2)


def calculate_iv_rank_and_percentile(
    current_iv: float,
    iv_history_252d: Optional[List[float]] = None,
) -> Tuple[float, float]:
    """
    Calculate IV Rank (IVR) and IV Percentile (IVP) over 252 trading days.
    - IVR = (current_iv - min_iv) / (max_iv - min_iv) * 100%
    - IVP = (count of days with IV < current_iv) / 252 * 100%
    """
    if not iv_history_252d or len(iv_history_252d) < 10:
        # Synthetic baseline when full history is unavailable
        base = max(10.0, current_iv)
        min_iv = base * 0.65
        max_iv = base * 1.55
        ivr = ((current_iv - min_iv) / (max_iv - min_iv)) * 100.0
        ivr = max(5.0, min(95.0, ivr))
        ivp = max(5.0, min(95.0, ivr + 2.0))
        return round(ivr, 1), round(ivp, 1)

    arr = np.array(iv_history_252d, dtype=float)
    min_iv = float(np.min(arr))
    max_iv = float(np.max(arr))

    if max_iv - min_iv < 1e-4:
        ivr = 50.0
    else:
        ivr = ((current_iv - min_iv) / (max_iv - min_iv)) * 100.0

    days_below = np.sum(arr < current_iv)
    ivp = (days_below / len(arr)) * 100.0

    return round(float(max(0.0, min(100.0, ivr))), 1), round(float(max(0.0, min(100.0, ivp))), 1)


def calculate_variance_risk_premium(atm_iv: float, rv_30d: float) -> Tuple[float, bool]:
    """
    Variance Risk Premium (VRP):
    VRP = IV_atm - RV_30d
    If VRP > 0, option implied volatility trades at a premium to realized volatility,
    signaling favorable harvest opportunities for short call / income strategies.
    """
    vrp = atm_iv - rv_30d
    favorable_harvest = vrp > 0.0
    return round(vrp, 2), favorable_harvest
