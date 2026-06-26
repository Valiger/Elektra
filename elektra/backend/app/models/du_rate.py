from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.database import Base


class DURate(Base):
    __tablename__ = "du_rates"

    id = Column(Integer, primary_key=True, index=True)
    du_name = Column(String, nullable=False)
    rate_per_kwh = Column(Float, nullable=False)
    effective_date = Column(DateTime, nullable=True)
    region = Column(String, nullable=True)
    consumer_class = Column(String, nullable=False, default="Residential")
    _now = lambda: datetime.now(timezone.utc)  # noqa: E731
    updated_at = Column(
        DateTime,
        default=_now,
        onupdate=_now,
    )
