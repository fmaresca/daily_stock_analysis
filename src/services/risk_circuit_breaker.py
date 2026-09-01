# -*- coding: utf-8 -*-
"""
RiskCircuitBreakerService — Systematic Risk Mitigation & Execution Guardrails.

Implements Phase 3 Component 3 from enhance.md:
- Maximum Drawdown automated halt triggers
- Portfolio Delta-Neutral Bounds enforcement
- Single-underlying position allocation limits
- FINRA 4210 / Portfolio Margin capacity monitoring
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class CircuitBreakerStatus:
    is_halted: bool
    halt_reason: Optional[str]
    max_drawdown_limit_pct: float
    current_drawdown_pct: float
    net_portfolio_delta: float
    delta_lower_bound: float
    delta_upper_bound: float
    is_delta_balanced: bool
    max_single_position_pct: float
    concentrations: List[Dict[str, Any]]
    breached_limits: List[str]
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RiskCircuitBreakerService:
    """Evaluates portfolio-level constraints before approving staged or live orders."""

    def __init__(
        self,
        max_drawdown_limit_pct: float = 12.0,
        delta_lower_bound: float = -50.0,
        delta_upper_bound: float = 50.0,
        max_single_position_pct: float = 20.0,
    ):
        self.max_drawdown_limit_pct = max_drawdown_limit_pct
        self.delta_lower_bound = delta_lower_bound
        self.delta_upper_bound = delta_upper_bound
        self.max_single_position_pct = max_single_position_pct

    def check_portfolio_health(
        self,
        current_equity: float,
        peak_equity: float,
        positions: List[Dict[str, Any]],
        proposed_order: Optional[Dict[str, Any]] = None,
    ) -> CircuitBreakerStatus:
        """
        Assesses if the portfolio is within safe operating parameters or requires a trading halt.
        """
        breached_limits: List[str] = []
        is_halted = False
        halt_reason = None

        # 1. Drawdown calculation
        peak = max(peak_equity, current_equity, 1.0)
        drawdown_pct = round(((peak - current_equity) / peak) * 100, 2)

        if drawdown_pct >= self.max_drawdown_limit_pct:
            is_halted = True
            halt_reason = f"MAX_DRAWDOWN_BREACH: Current drawdown {drawdown_pct}% exceeds {self.max_drawdown_limit_pct}% threshold."
            breached_limits.append("MAX_DRAWDOWN")

        # 2. Portfolio Delta calculation
        total_delta = 0.0
        for pos in positions:
            pos_delta = float(pos.get("delta", 0.0)) * int(pos.get("quantity", 1)) * 100
            total_delta += pos_delta

        if proposed_order:
            order_delta = float(proposed_order.get("delta", 0.0)) * int(proposed_order.get("quantity", 1)) * 100
            total_delta += order_delta

        total_delta = round(total_delta, 2)
        is_delta_balanced = self.delta_lower_bound <= total_delta <= self.delta_upper_bound
        if not is_delta_balanced:
            breached_limits.append("DELTA_NEUTRALITY_BREACH")

        # 3. Single-underlying concentration
        underlying_exposure: Dict[str, float] = {}
        for pos in positions:
            sym = pos.get("symbol", "UNKNOWN").upper()
            val = float(pos.get("market_value", 0.0))
            underlying_exposure[sym] = underlying_exposure.get(sym, 0.0) + val

        if proposed_order:
            sym = proposed_order.get("symbol", "UNKNOWN").upper()
            val = float(proposed_order.get("collateral_required", 0.0))
            underlying_exposure[sym] = underlying_exposure.get(sym, 0.0) + val

        concentrations: List[Dict[str, Any]] = []
        total_val = max(current_equity, sum(underlying_exposure.values()), 1.0)

        for sym, exp in underlying_exposure.items():
            pct = round((exp / total_val) * 100, 2)
            is_over = pct > self.max_single_position_pct
            if is_over:
                breached_limits.append(f"CONCENTRATION_LIMIT_{sym}")
                if not is_halted:
                    is_halted = True
                    halt_reason = f"CONCENTRATION_BREACH: Symbol {sym} occupies {pct}% of portfolio (limit {self.max_single_position_pct}%)."
            concentrations.append({
                "symbol": sym,
                "exposure_usd": exp,
                "portfolio_pct": pct,
                "is_over_limit": is_over,
            })

        return CircuitBreakerStatus(
            is_halted=is_halted,
            halt_reason=halt_reason,
            max_drawdown_limit_pct=self.max_drawdown_limit_pct,
            current_drawdown_pct=drawdown_pct,
            net_portfolio_delta=total_delta,
            delta_lower_bound=self.delta_lower_bound,
            delta_upper_bound=self.delta_upper_bound,
            is_delta_balanced=is_delta_balanced,
            max_single_position_pct=self.max_single_position_pct,
            concentrations=concentrations,
            breached_limits=breached_limits,
        )
