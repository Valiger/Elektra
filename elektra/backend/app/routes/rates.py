from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.du_rate import DURate
from app.routes.deps import get_current_user
from app.schemas.rates_schema import DURateOut, RatesResponse
from app.services.utility_rates_pipeline import sync_utility_rates

router = APIRouter()

ESTABLISHMENT_TO_CLASS = {
    "residential": "Residential",
    "commercial": "Commercial",
    "low_voltage": "Commercial",
    "industrial": "Industrial",
    "high_voltage": "Industrial"
}

@router.get("", response_model=RatesResponse)
def get_rates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_rates_query = db.query(DURate).all()
    all_rates_out = [DURateOut.model_validate(r) for r in all_rates_query]

    user_rate = None
    if current_user.cooperative:
        estab_type = current_user.establishment_type.lower().replace(" ", "_") if current_user.establishment_type else "residential"
        consumer_class = ESTABLISHMENT_TO_CLASS.get(estab_type, "Residential")
        
        # We also still have the specific ALECO handling for historical mapping if needed
        # but now we can just search by DU name and Consumer Class
        for rate in all_rates_out:
            # We match by DU Name and Consumer Class
            if rate.du_name.lower() == current_user.cooperative.lower() and rate.consumer_class == consumer_class:
                user_rate = rate
                break
        
        # Fallback if specific class not found but DU exists
        if not user_rate:
            for rate in all_rates_out:
                if rate.du_name.lower() == current_user.cooperative.lower():
                    user_rate = rate
                    break

    return RatesResponse(user_rate=user_rate, all_rates=all_rates_out)


@router.post("/sync", status_code=200)
def sync_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers the master utility rates ingestion pipeline.
    Fetches from Google Sheets (Primary), presyo (Validation), and Fallbacks.
    """
    try:
        updated = sync_utility_rates(db)
        return {"updated_count": len(updated), "updated": updated, "synced_at": datetime.utcnow().isoformat()}
    except Exception as e:
        raise HTTPException(502, f"Sync pipeline failed: {e}")
