"""
insights_service.py — Aggregates bill data for the Insights page.

Filter types:
- "monthly"    → most recent 1 bill
- "quarterly"  → most recent 3 bills (by scanned_at DESC)
- "all_time"   → all bills for the user

Aggregate rules:
- kwh_consumed : average across all selected bills
- all ₱ fields : sum (quarterly / all_time), single value (monthly)
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.bill import Bill

# The 8 graph fields defined in AGENTS.md
GRAPH_FIELDS: list[str] = [
    "kwh_consumed",
    "gen_charge",
    "transdel_charge",
    "system_loss_charge",
    "distsys_charge",
    "supplysys_charge",
    "mtrngsys_charge",
    "total_vat_charge",
]

# kwh_consumed uses average; all ₱ fields use sum
_AVG_FIELDS: frozenset[str] = frozenset({"kwh_consumed"})


def _safe_float(value: Any) -> float:
    """Return float(value) or 0.0 if value is None or un-castable."""
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _format_period(bill: Bill) -> str:
    """
    Format a bill's scanned_at timestamp as "Mon YYYY" (e.g. "Jan 2025").
    Falls back to billing_period string if scanned_at is unavailable.
    """
    if bill.scanned_at is not None:
        return bill.scanned_at.strftime("%b %Y")
    if bill.billing_period:
        return bill.billing_period
    return "Unknown"


def _fetch_bills(user_id: int, filter_type: str, db: Session) -> list[Bill]:
    """Return the relevant bills for *user_id* ordered oldest → newest."""
    base_query = (
        db.query(Bill)
        .filter(Bill.user_id == user_id)
        .order_by(Bill.scanned_at.desc())
    )

    if filter_type == "monthly":
        bills = base_query.limit(1).all()
    elif filter_type == "quarterly":
        bills = base_query.limit(3).all()
    else:  # all_time
        bills = base_query.all()

    # Reverse so the list runs oldest → newest (good for chart X-axis)
    return list(reversed(bills))


def _compute_aggregate(field: str, values: list[float]) -> float:
    """Return aggregate value: average for kwh_consumed, sum for ₱ fields."""
    if not values:
        return 0.0
    if field in _AVG_FIELDS:
        return round(sum(values) / len(values), 4)
    return round(sum(values), 4)


def get_insights(user_id: int, filter_type: str, db: Session) -> dict:
    """
    Build the insights payload for the given user and filter.

    Parameters
    ----------
    user_id     : authenticated user's ID
    filter_type : "monthly" | "quarterly" | "all_time"
    db          : SQLAlchemy session

    Returns
    -------
    {
        "filter": str,
        "periods": ["Jan 2025", ...],
        "graphs": {
            "<field>": {"values": [...], "aggregate": float},
            ...
        }
    }
    """
    bills = _fetch_bills(user_id, filter_type, db)

    periods: list[str] = [_format_period(b) for b in bills]

    graphs: dict[str, dict] = {}
    for field in GRAPH_FIELDS:
        values = [_safe_float(getattr(b, field, None)) for b in bills]
        aggregate = _compute_aggregate(field, values)
        graphs[field] = {"values": values, "aggregate": aggregate}

    return {
        "filter": filter_type,
        "periods": periods,
        "graphs": graphs,
    }
