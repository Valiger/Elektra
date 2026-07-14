from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Boolean
from app.db.database import Base
from app.services.encryption_service import EncryptedString


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    public_id = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    establishment_type = Column(String, nullable=True)
    location_type = Column(String, nullable=True)
    province = Column(EncryptedString, nullable=True)
    cooperative = Column(EncryptedString, nullable=True)
    budget_goal = Column(Float, nullable=True)
    kwh_limit = Column(Float, nullable=True)
    tos_accepted_version = Column(String, nullable=True)
    privacy_accepted_version = Column(String, nullable=True)
    marketing_consent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_tip_date = Column(Date, nullable=True)
    token_version = Column(Integer, default=0, nullable=False)
    role = Column(String, default="user", nullable=False)
