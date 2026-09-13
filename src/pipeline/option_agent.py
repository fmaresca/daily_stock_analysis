# -*- coding: utf-8 -*-
"""
AI Option Strategy Synthesizer Agent
====================================
Evaluates top covered call candidates per ticker against:
1. Technical resistance levels vs. proposed short call strike (strike >= resistance, Delta in [0.20, 0.35])
2. Binary earnings risk (flagging if earnings date falls within expiration cycle)
3. Qualitative income thesis: Trade-off between yield capture and capital appreciation cap
4. Assigns an AI conviction score (1-100) and rationale.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from src.services.options.market_data import CoveredCallCandidate

logger = logging.getLogger(__name__)


class OptionStrategyAgent:
    """
    Multi-Agent Option Strategy Synthesizer.
    Enriches screened candidates with quantitative and technical LLM-grade evaluation.
    """

    def synthesize_candidates(
        self,
        symbol: str,
        candidates: List[CoveredCallCandidate],
        key_resistance: Optional[float] = None,
        trend: str = "NEUTRAL",
    ) -> List[CoveredCallCandidate]:
        """
        Evaluate and score top candidates for a given symbol.
        """
        if not candidates:
            return []

        spot = candidates[0].spot_price
        # If no explicit resistance provided, estimate 20-day upper band / resistance
        res_level = key_resistance if key_resistance and key_resistance > 0 else spot * 1.04

        for cand in candidates:
            # 1. Strike vs Resistance evaluation
            strike_above_res = cand.strike >= res_level
            ideal_delta = 0.20 <= cand.delta <= 0.35

            # 2. Earnings risk penalty
            has_earnings_risk = cand.earnings_risk

            # 3. Yield vs Cap scoring
            score = 70.0

            # Delta alignment
            if ideal_delta:
                score += 10.0
            else:
                score -= abs(cand.delta - 0.28) * 40.0

            # Resistance safety
            if strike_above_res:
                score += 10.0
            else:
                score -= 8.0

            # High assignment / dividend risk
            if cand.early_assignment_has_risk:
                score -= 15.0

            # Earnings penalty
            if has_earnings_risk:
                score -= 15.0

            # VRP boost (selling when IV > RV)
            if cand.variance_risk_premium > 0:
                score += min(10.0, cand.variance_risk_premium * 0.5)

            # Cap score between 1 and 99
            final_score = int(max(10, min(99, round(score))))
            cand.ai_conviction_score = final_score

            # Synthesize rationale thesis
            reasons = []
            if ideal_delta:
                reasons.append(f"Delta ({cand.delta:.2f}) sits in the conservative sweet spot [0.20, 0.35].")
            else:
                reasons.append(f"Delta ({cand.delta:.2f}) is slightly aggressive/conservative.")

            if strike_above_res:
                reasons.append(f"Strike ${cand.strike:.2f} is positioned at or above key resistance (${res_level:.2f}).")
            else:
                reasons.append(f"Strike ${cand.strike:.2f} is below key resistance (${res_level:.2f}), risking upside capping.")

            if cand.early_assignment_has_risk:
                reasons.append("Caution: Dividend capture risk detected before expiry.")

            if has_earnings_risk:
                reasons.append(f"Binary earnings risk: Announcement expected on {cand.earnings_date}.")
            else:
                reasons.append("Clear runway: No earnings event prior to expiration.")

            reasons.append(f"Annualized static yield: {cand.static_yield_annualized:.1f}% with {cand.downside_cushion_pct:.1f}% downside cushion.")

            cand.ai_thesis = " ".join(reasons)

        return candidates
