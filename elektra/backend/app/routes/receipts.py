"""
receipts.py — All receipt-related API routes.

Endpoints:
  POST   /api/receipts/scan       Upload image → OCR → parse 11 fields
  POST   /api/receipts/tips       Bill data → generate AI tips
  GET    /api/receipts            Paginated list of user's saved receipts
  POST   /api/receipts            Save a receipt
  DELETE /api/receipts/{id}       Delete a receipt
  GET    /api/receipts/insights   Aggregated graph data (8 fields × 3 filters)
"""

import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.bill import Bill
from app.models.user import User
from app.models.scan_usage import ScanUsage
from app.routes.deps import get_current_user
from app.schemas.bill_schema import (
    BillCreate,
    BillResponse,
    PaginatedBills,
    ScanResponse,
    TipsRequest,
    TipsResponse,
    TipItem,
)
from app.schemas.insights_schema import GraphSeries, InsightsResponse

from app.services.ocr_service import extract_text
from app.services.tips_service import generate_tips
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = getattr(settings, "UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

MONTHS_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
}

def sort_bills_chronologically(bills: list[Bill], reverse: bool = False) -> list[Bill]:
    def get_sort_key(b: Bill):
        if not b.billing_period:
            return (0, 0, b.scanned_at.timestamp() if b.scanned_at else 0)
            
        bp = b.billing_period.strip()
        
        # Try to find dates in MM/DD/YYYY or MM-DD-YYYY format
        # and take the last date found (the end of the billing period)
        date_matches = re.findall(r'(0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])[-/](\d{4})', bp)
        if date_matches:
            last_match = date_matches[-1]
            month = int(last_match[0])
            year = int(last_match[1])
            return (year, month, b.scanned_at.timestamp() if b.scanned_at else 0)
            
        parts = bp.split()
        if len(parts) >= 2:
            month_str = parts[0].lower()
            month = MONTHS_MAP.get(month_str, 0)
            try:
                year = int(parts[1])
            except ValueError:
                year = 0
            return (year, month, b.scanned_at.timestamp() if b.scanned_at else 0)
        return (0, 0, b.scanned_at.timestamp() if b.scanned_at else 0)
    
    return sorted(bills, key=get_sort_key, reverse=reverse)

# Fields tracked in the insights endpoint
AMOUNT_FIELDS = [
    "kwh_consumed",
    "gen_charge",
    "transdel_charge",
    "system_loss_charge",
    "distsys_charge",
    "supplysys_charge",
    "mtrngsys_charge",
    "total_vat_charge",
    "cb_surcharge",
    "total_amt_after_due",
]

RATE_FIELDS = [
    "gen_charge_rate",
    "transdel_charge_rate",
    "system_loss_rate",
    "distsys_charge_rate",
    "supplysys_charge_rate",
    "mtrngsys_charge_rate",
]

ALL_GRAPH_FIELDS = AMOUNT_FIELDS + RATE_FIELDS


# ── POST /api/receipts/scan ─────────────────────────────────────────

@router.post("/scan", response_model=ScanResponse)
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            400,
            "Unsupported file type. Please upload a JPG, PNG, WebP, or PDF.",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum size is 10 MB.")

    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_scans = db.query(ScanUsage).filter(
        ScanUsage.user_id == current_user.id,
        ScanUsage.scanned_at >= cutoff
    ).count()

    if recent_scans >= 3:
        raise HTTPException(
            429, "Daily scan limit reached. Please wait 24 hours."
        )

    try:
        ocr_result = extract_text(contents)
    except Exception as exc:
        logger.error("OCR failed: %s", exc)
        raise HTTPException(
            500, "OCR processing failed. Please try a clearer image."
        )

    text = ocr_result.get("text", "")
    avg_conf = ocr_result.get("confidence", 0.0)

    # Record scan usage
    scan_usage = ScanUsage(
        user_id=current_user.id,
        scanned_at=datetime.now(timezone.utc)
    )
    db.add(scan_usage)
    db.commit()

    scans_remaining = 3 - (recent_scans + 1)

    # Save the image file
    ext = (
        file.filename.split(".")[-1]
        if file.filename and "." in file.filename
        else "jpg"
    )
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Skip parse_bill, use parsed dictionary directly from Gemini.
    parsed = ocr_result.get("parsed", {})
    field_confidences = parsed.pop("_confidence", {})

    # Build response data dict (string values coerced to float where needed)
    data: dict = {}
    for key, val in parsed.items():
        if key in ("billing_period", "du_name"):
            data[key] = val
        else:
            try:
                data[key] = float(val) if val is not None else None
            except (TypeError, ValueError):
                data[key] = None

    # Store raw OCR text in session for optional save
    data["_raw_ocr"] = text
    data["_confidences"] = field_confidences

    needs_review = any(
        conf < 0.70 for conf in field_confidences.values() if conf is not None
    )

    return ScanResponse(
        confidence=round(avg_conf, 4),
        data=data,
        needs_review=needs_review,
        image_filename=filename,
        scans_remaining=scans_remaining,
    )


# ── POST /api/receipts/tips ─────────────────────────────────────────

@router.post("/tips", response_model=TipsResponse)
def get_tips(
    request: TipsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Count how many bills from today have tips generated
    tips_generated_today = db.query(Bill).filter(
        Bill.user_id == current_user.id,
        Bill.scanned_at >= today_start,
        Bill.tips_json.is_not(None)
    ).count()

    if tips_generated_today >= 1:
        return TipsResponse(tips=[])

    bill_data = request.model_dump(exclude={"bill_id"})
    raw_tips = generate_tips(bill_data)

    tip_items = []
    for t in raw_tips:
        if isinstance(t, str):
            tip_items.append(TipItem(title="Tip", description=t))
        else:
            tip_items.append(
                TipItem(
                    title=t.get("title", "Energy Tip"),
                    description=t.get("description", ""),
                    savings_note=t.get("savings_note"),
                )
            )

    # Optionally attach tips to an existing bill record
    if request.bill_id:
        bill = db.query(Bill).filter(
            Bill.id == request.bill_id,
            Bill.user_id == current_user.id,
        ).first()
        if bill:
            bill.tips_json = json.dumps(
                [t.model_dump() for t in tip_items]
            )  # type: ignore
            db.commit()

    # Update last tip date
    current_user.last_tip_date = today_start.date()
    db.commit()

    return TipsResponse(tips=tip_items)


# ── GET /api/receipts ───────────────────────────────────────────────

@router.get("", response_model=PaginatedBills)
def list_receipts(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit
    total = db.query(Bill).filter(Bill.user_id == current_user.id).count()
    bills_q = (
        db.query(Bill)
        .filter(Bill.user_id == current_user.id)
        .all()
    )
    
    # Sort descending by billing_period (newest first)
    sorted_bills = sort_bills_chronologically(bills_q, reverse=True)
    bills = sorted_bills[offset:offset + limit]

    return PaginatedBills(
        items=[BillResponse.model_validate(b) for b in bills],
        total=total,
        page=page,
    )


# ── GET /api/receipts/insights ──────────────────────────────────────
# NOTE: must be defined BEFORE /{id} routes to avoid router conflict

@router.get("/stats", response_model=InsightsResponse)
def get_insights(
    filter: str = "monthly",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bills_q = (
        db.query(Bill)
        .filter(Bill.user_id == current_user.id)
        .all()
    )

    if not bills_q:
        return InsightsResponse(filter=filter, periods=[], graphs={})

    # Sort chronologically (oldest first)
    bills_q = sort_bills_chronologically(bills_q, reverse=False)

    # Slice by filter
    if filter == "monthly":
        bills_q = bills_q[-1:]
    elif filter == "quarterly":
        bills_q = bills_q[-3:]
    # all_time → use all

    periods = [
        str(b.billing_period) if b.billing_period else (
            b.scanned_at.strftime("%b %Y") if b.scanned_at else "—"
        )
        for b in bills_q
    ]

    graphs: dict = {}
    for field in ALL_GRAPH_FIELDS:
        values = [
            float(getattr(b, field) or 0) for b in bills_q
        ]
        if field == "kwh_consumed":
            aggregate = (
                round(sum(values) / len(values), 1) if values else 0.0
            )
        elif field in RATE_FIELDS:
            # Rate: show average across period
            aggregate = (
                round(sum(values) / len(values), 4) if values else 0.0
            )
        else:
            aggregate = round(sum(values), 2)
        graphs[field] = GraphSeries(values=values, aggregate=aggregate)

    return InsightsResponse(
        filter=filter, periods=periods, graphs=graphs
    )  # type: ignore


# ── POST /api/receipts ──────────────────────────────────────────────

@router.post("", response_model=BillResponse, status_code=201)
def save_receipt(
    bill_in: BillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bill_dict = bill_in.model_dump()
    custom_fields = bill_dict.pop("custom_fields", None)

    bill = Bill(
        user_id=current_user.id,
        scanned_at=datetime.now(timezone.utc),
        custom_fields_json=json.dumps(custom_fields) if custom_fields else None,
        **bill_dict,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return BillResponse.model_validate(bill)


# ── DELETE /api/receipts/{id} ───────────────────────────────────────

@router.delete("/{bill_id}", status_code=204)
def delete_receipt(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.user_id == current_user.id,
    ).first()
    if not bill:
        raise HTTPException(404, "Receipt not found.")
    if bill.image_filename:
        filepath = os.path.join(UPLOAD_DIR, bill.image_filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                logger.error(f"Failed to delete image file {filepath}: {e}")

    db.delete(bill)
    db.commit()
