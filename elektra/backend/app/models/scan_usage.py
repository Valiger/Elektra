from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from app.db.database import Base

class ScanUsage(Base):
    __tablename__ = "scan_usages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    scanned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
