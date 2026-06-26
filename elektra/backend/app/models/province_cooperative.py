from sqlalchemy import Column, Integer, String
from app.db.database import Base


class ProvinceCooperative(Base):
    __tablename__ = "province_cooperatives"

    id = Column(Integer, primary_key=True, index=True)
    province = Column(String, nullable=False)
    cooperative = Column(String, nullable=False)
    location_type = Column(String, nullable=True)
