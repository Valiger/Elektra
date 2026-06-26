import os
import sys
from datetime import datetime

# Add the project root to the python path
sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import SessionLocal  # noqa: E402
from app.models.province_cooperative import ProvinceCooperative  # noqa: E402
from app.models.du_rate import DURate  # noqa: E402


def fix_db():
    db = SessionLocal()
    try:
        # 1. Update ProvinceCooperative
        # Delete SORSECO
        db.query(ProvinceCooperative).filter(
            ProvinceCooperative.cooperative == "SORSECO"
        ).delete()

        # Add SORECO1 and SORECO2 for Sorsogon
        for coop in ["SORECO1", "SORECO2"]:
            for prov in ["Sorsogon", "Sorsogon City"]:
                # Check if exists
                exists = db.query(ProvinceCooperative).filter_by(
                    province=prov, cooperative=coop
                ).first()
                if not exists:
                    db.add(
                        ProvinceCooperative(
                            province=prov,
                            cooperative=coop,
                            location_type="Mainland"
                        )
                    )

        # Ensure MASELCO exists
        for prov in ["Masbate", "Masbate City"]:
            exists = db.query(ProvinceCooperative).filter_by(
                province=prov, cooperative="MASELCO"
            ).first()
            if not exists:
                db.add(
                    ProvinceCooperative(
                        province=prov,
                        cooperative="MASELCO",
                        location_type="Island"
                    )
                )

        # 2. Update DURate
        # Delete SORSECO
        db.query(DURate).filter(DURate.du_name == "SORSECO").delete()

        # Add SORECO1, SORECO2, MASELCO
        now = datetime.now()
        rates_to_add = [
            ("SORECO1", "Bicol", 9.8700),
            ("SORECO2", "Bicol", 9.8700),
            ("MASELCO", "Bicol", 10.6400),
        ]

        for du_name, region, rate in rates_to_add:
            exists = db.query(DURate).filter_by(
                du_name=du_name, consumer_class="Residential"
            ).first()
            if not exists:
                db.add(
                    DURate(
                        du_name=du_name,
                        region=region,
                        rate_per_kwh=rate,
                        consumer_class="Residential",
                        effective_date=now,
                        updated_at=now,
                    )
                )

        db.commit()
        print("Successfully fixed database entries for Sorsogon and Masbate!")

    except Exception as e:
        print(f"Error updating DB: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    fix_db()
