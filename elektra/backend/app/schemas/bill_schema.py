"""
bill_schema.py — Pydantic schemas for receipt CRUD and scan responses.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)



# ── Scan response ─────────────────────────────────────────────────

class ScanResponse(BaseSchema):
    """Returned by POST /api/receipts/scan"""
    confidence: float
    data: Dict[str, Any]
    needs_review: bool
    image_filename: Optional[str] = None
    scans_remaining: int


# ── Bill create / save ────────────────────────────────────────────

class BillCreate(BaseSchema):
    billing_period: Optional[str] = None
    du_name: Optional[str] = None
    image_filename: Optional[str] = None

    # Consumption
    kwh_consumed: Optional[float] = None

    # Charge amounts (₱)
    amount_due: Optional[float] = None
    gen_charge: Optional[float] = None
    transdel_charge: Optional[float] = None
    system_loss_charge: Optional[float] = None
    distsys_charge: Optional[float] = None
    supplysys_charge: Optional[float] = None
    mtrngsys_charge: Optional[float] = None
    total_vat_charge: Optional[float] = None

    # Charge rates (₱/kWh)
    gen_charge_rate: Optional[float] = None
    transdel_charge_rate: Optional[float] = None
    system_loss_rate: Optional[float] = None
    distsys_charge_rate: Optional[float] = None
    supplysys_charge_rate: Optional[float] = None
    mtrngsys_charge_rate: Optional[float] = None

    # CB surcharges & grand total
    cb_surcharge: Optional[float] = None
    cb_vat_surcharge: Optional[float] = None
    total_amt_after_due: Optional[float] = None

    # Meter readings
    prev_reading: Optional[float] = None
    curr_reading: Optional[float] = None
    raw_ocr_text: Optional[str] = None
    manually_corrected: Optional[bool] = False
    custom_fields: Optional[Dict[str, Any]] = None


class BillResponse(BillCreate):
    id: int
    public_id: str
    user_id: int
    scanned_at: Optional[datetime] = None
    tips_json: Optional[str] = None

    class Config:
        from_attributes = True


class PaginatedBills(BaseSchema):
    items: List[BillResponse]
    total: int
    page: int


# ── Tips ──────────────────────────────────────────────────────────

class TipItem(BaseSchema):
    title: str
    description: str
    savings_note: Optional[str] = None


class TipsRequest(BaseSchema):
    bill_id: Optional[str] = None
    billing_period: Optional[str] = None
    du_name: Optional[str] = None
    kwh_consumed: Optional[float] = None
    amount_due: Optional[float] = None
    gen_charge: Optional[float] = None
    transdel_charge: Optional[float] = None
    system_loss_charge: Optional[float] = None
    distsys_charge: Optional[float] = None
    supplysys_charge: Optional[float] = None
    mtrngsys_charge: Optional[float] = None
    total_vat_charge: Optional[float] = None
    cb_surcharge: Optional[float] = None
    total_amt_after_due: Optional[float] = None


class TipsResponse(BaseSchema):
    tips: List[TipItem]
