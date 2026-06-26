from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.province_cooperative import ProvinceCooperative

router = APIRouter()


@router.get("", response_model=List[str])
def get_cooperatives(province: str, db: Session = Depends(get_db)):
    coops = (
        db.query(ProvinceCooperative)
        .filter(
            ProvinceCooperative.province.ilike(f"%{province}%")
        )
        .all()
    )
    return [c.cooperative for c in coops]
