# -*- coding: utf-8 -*-
"""
Options & Derivatives Analytics Endpoints.

Provides REST endpoints for:
- Live options screener snapshots
- Closed-End Fund (CEF) NAV discount/premium & Z-Score analytics
- Options backtest simulation
- Risk circuit breaker & margin capacity queries
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from api.deps import get_config_dep
from src.config import Config
from src.services.cef_analytics_service import CEFAnalyticsService
from src.services.risk_circuit_breaker import RiskCircuitBreakerService
from data_provider.schwab_fetcher import SchwabFetcher, SchwabAuthManager

logger = logging.getLogger(__name__)

router = APIRouter()

_SNAPSHOT_PATH = Path("web/public/data/options_data.json")


class BacktestRequest(BaseModel):
    symbol: str = Field("SPY", min_length=1, max_length=10)
    strategy_key: str = Field("30D_CSP_15DELTA", max_length=64)
    years: int = Field(2, ge=1, le=5)
    initial_capital: float = Field(100000.0, ge=1000.0)


class ProposedOrderCheckRequest(BaseModel):
    symbol: str
    delta: float
    quantity: int = 1
    collateral_required: float
    current_equity: float = 100000.0
    peak_equity: float = 100000.0
    positions: List[Dict[str, Any]] = Field(default_factory=list)


@router.get("/snapshot")
def get_options_snapshot(
    config: Config = Depends(get_config_dep),
) -> Dict[str, Any]:
    """
    Returns the full Options & Volatility Screener dataset.
    Loads real calculated snapshot if available, with fallback to bundled dataset.
    """
    # 1. Try reading from project root data or web public
    candidate_paths = [
        Path("data/options_data.json"),
        Path("web/public/data/options_data.json"),
        Path("../web/public/data/options_data.json"),
    ]

    for p in candidate_paths:
        if p.is_file():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data
            except Exception as e:
                logger.warning(f"Failed to read snapshot from {p}: {e}")

class RecalculateRequest(BaseModel):
    tickers: Optional[List[str]] = Field(default=None, description="Optional custom tickers list to calculate. Defaults to active watchlist.")
    enrich: bool = Field(default=False, description="Whether to fetch deep sentiment & prediction market data.")


@router.post("/recalculate")
def recalculate_options_data(
    request: Optional[RecalculateRequest] = None,
    config: Config = Depends(get_config_dep),
) -> Dict[str, Any]:
    """
    On-demand live calculation of real market prices, technical indicators (SMA, Bollinger Bands, RSI, HV),
    and Black-Scholes options chains for all watchlist tickers.
    """
    tickers = request.tickers if request and request.tickers else None
    enrich = request.enrich if request else False

    try:
        try:
            from scripts.generate_options_data import generate_options_dataset
        except ImportError:
            import sys
            sys.path.insert(0, str(Path(".").resolve()))
            from scripts.generate_options_data import generate_options_dataset

        payload = generate_options_dataset(
            tickers=tickers,
            output_json_web="web/public/data/options_data.json",
            output_json_root="data/options_data.json",
            output_audit="reports/latest_options_audit.md",
            enrich=enrich,
        )
        return payload
    except Exception as e:
        logger.exception(f"Failed to recalculate options dataset: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Live options calculation failed: {str(e)}"
        )


@router.get("/cef/{symbol}")
def get_cef_valuation(
    symbol: str,
    market_price: Optional[float] = Query(None, ge=0.01),
    nav_price: Optional[float] = Query(None, ge=0.01),
    distribution_yield: Optional[float] = Query(None, ge=0.0),
    config: Config = Depends(get_config_dep),
) -> Dict[str, Any]:
    """
    Computes real-time Closed-End Fund (CEF) discount/premium, 52-week Z-Score, and ROC quality.
    """
    service = CEFAnalyticsService()
    result = service.analyze_fund(
        symbol=symbol,
        market_price=market_price,
        nav_price=nav_price,
        distribution_yield_pct=distribution_yield,
    )
    return {
        "symbol": result.symbol,
        "name": result.name,
        "is_fund_or_cef": result.is_fund_or_cef,
        "market_price": result.market_price,
        "nav_price": result.nav_price,
        "discount_premium_pct": result.discount_premium_pct,
        "cef_z_score_52w": result.cef_z_score_52w,
        "distribution_yield_pct": result.distribution_yield_pct,
        "roc_pct": result.roc_pct,
        "roc_type": result.roc_type,
        "valuation_status": result.valuation_status,
        "mean_52w_discount": result.mean_52w_discount,
        "std_52w_discount": result.std_52w_discount,
        "nii_coverage_pct": result.nii_coverage_pct,
        "notes": result.notes,
    }


@router.post("/risk/check-order")
def check_order_circuit_breaker(
    request: ProposedOrderCheckRequest,
    config: Config = Depends(get_config_dep),
) -> Dict[str, Any]:
    """
    Evaluates proposed order against drawdown limits, delta bounds, and concentration rules.
    """
    breaker = RiskCircuitBreakerService()
    status = breaker.check_portfolio_health(
        current_equity=request.current_equity,
        peak_equity=request.peak_equity,
        positions=request.positions,
        proposed_order={
            "symbol": request.symbol,
            "delta": request.delta,
            "quantity": request.quantity,
            "collateral_required": request.collateral_required,
        },
    )
    return {
        "is_halted": status.is_halted,
        "halt_reason": status.halt_reason,
        "current_drawdown_pct": status.current_drawdown_pct,
        "max_drawdown_limit_pct": status.max_drawdown_limit_pct,
        "net_portfolio_delta": status.net_portfolio_delta,
        "is_delta_balanced": status.is_delta_balanced,
        "concentrations": status.concentrations,
        "breached_limits": status.breached_limits,
        "timestamp": status.timestamp,
    }


@router.get("/chain/{symbol}")
def get_live_option_chain(
    symbol: str,
    contract_type: str = Query("ALL", regex="^(ALL|CALL|PUT)$"),
    strike_count: int = Query(15, ge=1, le=50),
    config: Config = Depends(get_config_dep),
) -> Dict[str, Any]:
    """
    Fetches real-time option chain with Greeks from Charles Schwab Developer API if configured.
    """
    auth = SchwabAuthManager()
    if not auth.is_configured():
        return {
            "status": "UNCONFIGURED",
            "message": "Schwab API keys are not configured. Configure via Web UI Settings or .env.",
            "symbol": symbol.upper(),
            "chain": {},
        }

    fetcher = SchwabFetcher(auth_manager=auth)
    if not fetcher.is_available():
        return {
            "status": "TOKEN_PENDING",
            "message": "Schwab OAuth token requires authorization in Web UI.",
            "symbol": symbol.upper(),
            "chain": {},
        }

    try:
        chain = fetcher.fetch_option_chains(
            symbol=symbol,
            contract_type=contract_type,
            strike_count=strike_count,
        )
        return {
            "status": "SUCCESS",
            "symbol": symbol.upper(),
            "chain": chain,
        }
    except Exception as e:
        logger.warning(f"Schwab option chain fetch failed for {symbol}: {e}")
        raise HTTPException(status_code=502, detail=f"Schwab fetch failed: {str(e)}")
