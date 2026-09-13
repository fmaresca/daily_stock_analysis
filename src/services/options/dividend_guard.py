# -*- coding: utf-8 -*-
"""
Dividend & Early Assignment Safeguards
======================================
Monitors upcoming ex-dividend dates and projected dividend payouts against
Call Extrinsic Value (Time Value).

Trigger Condition:
If (Ex-Div Date < Expiration Date) and (Call Extrinsic Value < Dividend Amount):
  Flag with HIGH_ASSIGNMENT_RISK: DIVIDEND_CAPTURE
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class AssignmentRiskAssessment:
    has_risk: bool
    status: str
    extrinsic_value: float
    dividend_amount: float
    days_to_ex_div: Optional[int]
    reason: str


def evaluate_early_assignment_risk(
    spot: float,
    strike: float,
    call_premium: float,
    expiration_date: str | date,
    ex_dividend_date: Optional[str | date] = None,
    dividend_amount: float = 0.0,
    current_date: Optional[date] = None,
) -> AssignmentRiskAssessment:
    """
    Evaluates early assignment risk for American covered calls.

    :param spot: Current stock price ($)
    :param strike: Option strike price ($)
    :param call_premium: Current Call market price ($)
    :param expiration_date: Option expiration date (YYYY-MM-DD or date object)
    :param ex_dividend_date: Next upcoming ex-dividend date
    :param dividend_amount: Expected dividend payout per share ($)
    :param current_date: Base evaluation date (defaults to today)
    """
    if current_date is None:
        current_date = date.today()

    if isinstance(expiration_date, str):
        exp_dt = datetime.strptime(expiration_date.split("T")[0], "%Y-%m-%d").date()
    else:
        exp_dt = expiration_date

    # Intrinsic & Extrinsic value
    intrinsic_val = max(0.0, spot - strike)
    extrinsic_val = max(0.0, call_premium - intrinsic_val)

    if not ex_dividend_date or dividend_amount <= 0.0:
        return AssignmentRiskAssessment(
            has_risk=False,
            status="SAFE",
            extrinsic_value=round(extrinsic_val, 4),
            dividend_amount=dividend_amount,
            days_to_ex_div=None,
            reason="No dividend or ex-dividend date scheduled before expiration.",
        )

    if isinstance(ex_dividend_date, str):
        ex_dt = datetime.strptime(ex_dividend_date.split("T")[0], "%Y-%m-%d").date()
    else:
        ex_dt = ex_dividend_date

    days_to_ex = (ex_dt - current_date).days

    # Rule: If Ex-Div occurs before expiration date
    if ex_dt < exp_dt and ex_dt >= current_date:
        # If call time value is less than the dividend amount, rational counterparties exercise early
        if extrinsic_val < dividend_amount:
            return AssignmentRiskAssessment(
                has_risk=True,
                status="HIGH_ASSIGNMENT_RISK: DIVIDEND_CAPTURE",
                extrinsic_value=round(extrinsic_val, 4),
                dividend_amount=round(dividend_amount, 4),
                days_to_ex_div=days_to_ex,
                reason=(
                    f"Ex-dividend date ({ex_dt}) precedes expiration ({exp_dt}) and "
                    f"call extrinsic value (${extrinsic_val:.2f}) < dividend (${dividend_amount:.2f}). "
                    f"Early assignment is economically optimal for long call holder."
                ),
            )
        else:
            return AssignmentRiskAssessment(
                has_risk=False,
                status="MODERATE_MONITORED",
                extrinsic_value=round(extrinsic_val, 4),
                dividend_amount=round(dividend_amount, 4),
                days_to_ex_div=days_to_ex,
                reason=(
                    f"Ex-div ({ex_dt}) precedes expiration, but time value (${extrinsic_val:.2f}) "
                    f"exceeds dividend (${dividend_amount:.2f}). Monitor as expiration nears."
                ),
            )

    return AssignmentRiskAssessment(
        has_risk=False,
        status="SAFE",
        extrinsic_value=round(extrinsic_val, 4),
        dividend_amount=dividend_amount,
        days_to_ex_div=days_to_ex if ex_dt >= current_date else None,
        reason="Ex-dividend date occurs after contract expiration or in the past.",
    )
