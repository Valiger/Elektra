from datetime import datetime
from typing import Optional, Sequence
from pydantic import BaseModel, field_validator


class DURateOut(BaseModel):
    du_name: str
    rate_per_kwh: float
    effective_date: Optional[datetime] = None
    region: Optional[str] = None
    consumer_class: str = "Residential"
    updated_at: Optional[datetime] = None

    @field_validator("consumer_class", mode="before")
    def set_consumer_class(cls, v):
        return v if v is not None else "Residential"

    class Config:
        from_attributes = True


class RatesResponse(BaseModel):
    user_rate: Optional[DURateOut] = None
    all_rates: Sequence[DURateOut]
