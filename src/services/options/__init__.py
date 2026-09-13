# -*- coding: utf-8 -*-
"""
Options Services Package
"""

from src.services.options.pricing import (
    black_scholes_price,
    binomial_american_price,
    calculate_greeks,
    solve_implied_volatility,
    OptionGreeks,
)
from src.services.options.volatility import (
    calculate_realized_volatility,
    calculate_iv_rank_and_percentile,
    calculate_variance_risk_premium,
)
from src.services.options.dividend_guard import (
    evaluate_early_assignment_risk,
    AssignmentRiskAssessment,
)
from src.services.options.yield_calculator import (
    calculate_covered_call_yields,
    calculate_roll_opportunity,
    CoveredCallYieldMetrics,
    RollOpportunity,
)
from src.services.options.market_data import (
    OptionsMarketDataService,
    CoveredCallCandidate,
)

__all__ = [
    "black_scholes_price",
    "binomial_american_price",
    "calculate_greeks",
    "solve_implied_volatility",
    "OptionGreeks",
    "calculate_realized_volatility",
    "calculate_iv_rank_and_percentile",
    "calculate_variance_risk_premium",
    "evaluate_early_assignment_risk",
    "AssignmentRiskAssessment",
    "calculate_covered_call_yields",
    "calculate_roll_opportunity",
    "CoveredCallYieldMetrics",
    "RollOpportunity",
    "OptionsMarketDataService",
    "CoveredCallCandidate",
]
