import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scanned_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    billing_period = Column(String, nullable=True)
    du_name = Column(String, nullable=True)
    image_filename = Column(String, nullable=True)

    # ── Consumption ────────────────────────────────────────────────
    kwh_consumed = Column(Float, nullable=True)

    # ── Charge amounts (₱) ────────────────────────────────────────
    amount_due = Column(Float, nullable=True)       # Current Bill
    gen_charge = Column(Float, nullable=True)
    transdel_charge = Column(Float, nullable=True)
    system_loss_charge = Column(Float, nullable=True)
    distsys_charge = Column(Float, nullable=True)
    supplysys_charge = Column(Float, nullable=True)
    mtrngsys_charge = Column(Float, nullable=True)
    total_vat_charge = Column(Float, nullable=True)

    # ── Charge rates (₱/kWh) ──────────────────────────────────────
    gen_charge_rate = Column(Float, nullable=True)
    transdel_charge_rate = Column(Float, nullable=True)
    system_loss_rate = Column(Float, nullable=True)
    distsys_charge_rate = Column(Float, nullable=True)
    supplysys_charge_rate = Column(Float, nullable=True)
    mtrngsys_charge_rate = Column(Float, nullable=True)

    # ── CB surcharges & grand total ───────────────────────────────
    cb_surcharge = Column(Float, nullable=True)
    cb_vat_surcharge = Column(Float, nullable=True)
    total_amt_after_due = Column(Float, nullable=True)

    # ── Meter readings & metadata ─────────────────────────────────
    prev_reading = Column(Float, nullable=True)
    curr_reading = Column(Float, nullable=True)
    image_path = Column(String, nullable=True)
    raw_ocr_text = Column(Text, nullable=True)
    tips_json = Column(Text, nullable=True)
    custom_fields_json = Column(Text, nullable=True)
    manually_corrected = Column(Boolean, default=False)

    user = relationship("User", backref="bills")

    @property
    def custom_fields(self):
        if self.custom_fields_json:
            try:
                return json.loads(self.custom_fields_json)
            except:
                pass
        return None
