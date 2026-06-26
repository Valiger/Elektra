from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Boolean
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    establishment_type = Column(String, nullable=True)
    location_type = Column(String, nullable=True)
    province = Column(String, nullable=True)
    cooperative = Column(String, nullable=True)
    budget_goal = Column(Float, nullable=True)
    kwh_limit = Column(Float, nullable=True)
    tos_accepted_version = Column(String, nullable=True)
    privacy_accepted_version = Column(String, nullable=True)
    marketing_consent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_tip_date = Column(Date, nullable=True)
