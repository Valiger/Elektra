"""
seed_data.py — Populate province_cooperatives and du_rates tables.

Run with:
    python -m app.db.seed_data
from the /backend directory with the venv activated.
"""

import sys
import os

from app.db.database import SessionLocal, engine, Base
from app.models.province_cooperative import ProvinceCooperative
from app.models.du_rate import DURate

# Make sure the app package is importable when run as main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


# ---------------------------------------------------------------------------
# Province → Cooperative data (comprehensive Philippine DU registry)
# ---------------------------------------------------------------------------

PROVINCE_COOPERATIVES = [
    # NCR / Metro Manila
    ("Metro Manila", "Meralco", "Mainland"),
    ("Manila", "Meralco", "Mainland"),
    ("Quezon City", "Meralco", "Mainland"),
    ("Makati", "Meralco", "Mainland"),
    ("Pasig", "Meralco", "Mainland"),
    ("Caloocan", "Meralco", "Mainland"),
    ("Marikina", "Meralco", "Mainland"),
    ("Taguig", "Meralco", "Mainland"),
    ("Paranaque", "Meralco", "Mainland"),
    ("Las Pinas", "Meralco", "Mainland"),
    ("Muntinlupa", "Meralco", "Mainland"),
    ("Mandaluyong", "Meralco", "Mainland"),
    ("San Juan", "Meralco", "Mainland"),
    ("Pasay", "Meralco", "Mainland"),
    ("Malabon", "Meralco", "Mainland"),
    ("Navotas", "Meralco", "Mainland"),
    ("Valenzuela", "Meralco", "Mainland"),
    ("Pateros", "Meralco", "Mainland"),

    # Cavite
    ("Cavite", "CFELCO", "Mainland"),
    ("Cavite City", "CFELCO", "Mainland"),
    ("Bacoor", "MERALCO", "Mainland"),
    ("Imus", "MERALCO", "Mainland"),
    ("Dasmariñas", "MERALCO", "Mainland"),
    ("General Trias", "MERALCO", "Mainland"),

    # Laguna
    ("Laguna", "FLECO", "Mainland"),
    ("Laguna", "QUEZELCO I", "Mainland"),
    ("San Pablo", "FLECO", "Mainland"),
    ("Santa Rosa", "MERALCO", "Mainland"),
    ("Binan", "MERALCO", "Mainland"),
    ("Calamba", "MERALCO", "Mainland"),

    # Batangas
    ("Batangas", "BATELEC I", "Mainland"),
    ("Batangas", "BATELEC II", "Mainland"),
    ("Batangas City", "BATELEC I", "Mainland"),
    ("Lipa", "BATELEC I", "Mainland"),
    ("Nasugbu", "BATELEC II", "Mainland"),

    # Rizal
    ("Rizal", "MERALCO", "Mainland"),
    ("Antipolo", "MERALCO", "Mainland"),

    # Quezon (Province)
    ("Quezon", "QUEZELCO I", "Mainland"),
    ("Quezon", "QUEZELCO II", "Mainland"),
    ("Lucena", "QUEZELCO I", "Mainland"),

    # Pampanga
    ("Pampanga", "PELCO I", "Mainland"),
    ("Pampanga", "PELCO II", "Mainland"),
    ("Pampanga", "PELCO III", "Mainland"),
    ("San Fernando", "PELCO I", "Mainland"),
    ("Angeles", "PELCO I", "Mainland"),
    ("Mabalacat", "PELCO I", "Mainland"),

    # Bulacan
    ("Bulacan", "MERALCO", "Mainland"),
    ("Malolos", "MERALCO", "Mainland"),
    ("Meycauayan", "MERALCO", "Mainland"),
    ("San Jose del Monte", "MERALCO", "Mainland"),

    # Nueva Ecija
    ("Nueva Ecija", "NEECO I", "Mainland"),
    ("Nueva Ecija", "NEECO II", "Mainland"),
    ("Nueva Ecija", "NEECO III", "Mainland"),
    ("Nueva Ecija", "NEECO IV", "Mainland"),
    ("Cabanatuan", "NEECO I", "Mainland"),
    ("San Jose", "NEECO II", "Mainland"),

    # Tarlac
    ("Tarlac", "TARELCO I", "Mainland"),
    ("Tarlac", "TARELCO II", "Mainland"),
    ("Tarlac City", "TARELCO I", "Mainland"),

    # Pangasinan
    ("Pangasinan", "PANELCO I", "Mainland"),
    ("Pangasinan", "PANELCO II", "Mainland"),
    ("Pangasinan", "PANELCO III", "Mainland"),
    ("Dagupan", "PANELCO I", "Mainland"),
    ("San Carlos", "PANELCO II", "Mainland"),
    ("Alaminos", "PANELCO III", "Mainland"),

    # Zambales
    ("Zambales", "ZAMECO I", "Mainland"),
    ("Zambales", "ZAMECO II", "Mainland"),
    ("Olongapo", "ZAMECO I", "Mainland"),

    # Bataan
    ("Bataan", "BATELCO", "Mainland"),
    ("Balanga", "BATELCO", "Mainland"),

    # La Union
    ("La Union", "LUELCO", "Mainland"),
    ("San Fernando", "LUELCO", "Mainland"),

    # Ilocos Norte
    ("Ilocos Norte", "INEC", "Mainland"),
    ("Laoag", "INEC", "Mainland"),

    # Ilocos Sur
    ("Ilocos Sur", "ISECO", "Mainland"),
    ("Vigan", "ISECO", "Mainland"),

    # Benguet
    ("Benguet", "BEC", "Mainland"),
    ("Baguio", "BEC", "Mainland"),

    # Nueva Vizcaya
    ("Nueva Vizcaya", "NUVELCO", "Mainland"),
    ("Bayombong", "NUVELCO", "Mainland"),

    # Quirino
    ("Quirino", "QUIRELCO", "Mainland"),

    # Cagayan
    ("Cagayan", "CAGELCO I", "Mainland"),
    ("Cagayan", "CAGELCO II", "Mainland"),
    ("Tuguegarao", "CAGELCO I", "Mainland"),

    # Isabela
    ("Isabela", "ISELCO I", "Mainland"),
    ("Isabela", "ISELCO II", "Mainland"),
    ("Ilagan", "ISELCO I", "Mainland"),
    ("Santiago", "ISELCO II", "Mainland"),

    # Aurora
    ("Aurora", "ASELCO", "Mainland"),
    ("Baler", "ASELCO", "Mainland"),

    # Batanes
    ("Batanes", "BATANECO", "Island"),
    ("Basco", "BATANECO", "Island"),

    # Camarines Norte
    ("Camarines Norte", "CANORECO", "Mainland"),
    ("Daet", "CANORECO", "Mainland"),

    # Camarines Sur
    ("Camarines Sur", "CASURECO I", "Mainland"),
    ("Camarines Sur", "CASURECO II", "Mainland"),
    ("Camarines Sur", "CASURECO III", "Mainland"),
    ("Camarines Sur", "CASURECO IV", "Mainland"),
    ("Naga", "CASURECO II", "Mainland"),

    # Albay
    ("Albay", "ALECO", "Mainland"),
    ("Legazpi", "ALECO", "Mainland"),

    # Sorsogon
    ("Sorsogon", "SORECO1", "Mainland"),
    ("Sorsogon", "SORECO2", "Mainland"),
    ("Sorsogon City", "SORECO1", "Mainland"),
    ("Sorsogon City", "SORECO2", "Mainland"),

    # Masbate
    ("Masbate", "MASELCO", "Island"),
    ("Masbate City", "MASELCO", "Island"),

    # Catanduanes
    ("Catanduanes", "CATELCO", "Island"),
    ("Virac", "CATELCO", "Island"),

    # Eastern Samar
    ("Eastern Samar", "ESAMELCO", "Island"),
    ("Borongan", "ESAMELCO", "Island"),

    # Western Samar / Samar
    ("Samar", "SAMELCO I", "Island"),
    ("Samar", "SAMELCO II", "Island"),
    ("Catbalogan", "SAMELCO I", "Island"),

    # Northern Samar
    ("Northern Samar", "NORSAMELCO", "Island"),
    ("Catarman", "NORSAMELCO", "Island"),

    # Leyte
    ("Leyte", "LEYTE IV", "Island"),
    ("Leyte", "LEYECO", "Island"),
    ("Tacloban", "LEYTE IV", "Island"),

    # Southern Leyte
    ("Southern Leyte", "SOLECO", "Island"),
    ("Maasin", "SOLECO", "Island"),

    # Biliran
    ("Biliran", "BILELCO", "Island"),
    ("Naval", "BILELCO", "Island"),

    # Iloilo
    ("Iloilo", "ILECO I", "Mainland"),
    ("Iloilo", "ILECO II", "Mainland"),
    ("Iloilo", "ILECO III", "Mainland"),
    ("Iloilo City", "MORE Electric", "Mainland"),

    # Capiz
    ("Capiz", "CAPELCO", "Mainland"),
    ("Roxas", "CAPELCO", "Mainland"),

    # Aklan
    ("Aklan", "AKELCO", "Mainland"),
    ("Kalibo", "AKELCO", "Mainland"),

    # Antique
    ("Antique", "ANTECO", "Mainland"),
    ("San Jose", "ANTECO", "Mainland"),

    # Guimaras
    ("Guimaras", "GUIMELCO", "Island"),
    ("Jordan", "GUIMELCO", "Island"),

    # Cebu
    ("Cebu", "CEBECO I", "Mainland"),
    ("Cebu", "CEBECO II", "Mainland"),
    ("Cebu", "CEBECO III", "Mainland"),
    ("Cebu City", "VECO", "Mainland"),
    ("Mandaue", "VECO", "Mainland"),
    ("Lapu-Lapu", "VECO", "Mainland"),
    ("Talisay", "CEBECO I", "Mainland"),
    ("Danao", "CEBECO II", "Mainland"),
    ("Toledo", "CEBECO III", "Mainland"),

    # Bohol
    ("Bohol", "BOHECO I", "Island"),
    ("Bohol", "BOHECO II", "Island"),
    ("Tagbilaran", "BOHECO I", "Island"),

    # Siquijor
    ("Siquijor", "SIQUIJOR ELECTRIC", "Island"),
    ("Siquijor", "SICELCO", "Island"),

    # Negros Occidental
    ("Negros Occidental", "CENECO", "Mainland"),
    ("Negros Occidental", "NOCECO", "Mainland"),
    ("Bacolod", "CENECO", "Mainland"),
    ("San Carlos", "NOCECO", "Mainland"),

    # Negros Oriental
    ("Negros Oriental", "NORECO I", "Mainland"),
    ("Negros Oriental", "NORECO II", "Mainland"),
    ("Dumaguete", "NORECO I", "Mainland"),

    # Zamboanga del Norte
    ("Zamboanga del Norte", "ZANECO", "Mainland"),
    ("Dipolog", "ZANECO", "Mainland"),

    # Zamboanga del Sur
    ("Zamboanga del Sur", "ZAMSURECO I", "Mainland"),
    ("Zamboanga del Sur", "ZAMSURECO II", "Mainland"),
    ("Pagadian", "ZAMSURECO I", "Mainland"),

    # Zamboanga City
    ("Zamboanga City", "ZAMCELCO", "Mainland"),
    ("Zamboanga", "ZAMCELCO", "Mainland"),

    # Zamboanga Sibugay
    ("Zamboanga Sibugay", "ZAMSIBECO", "Mainland"),
    ("Ipil", "ZAMSIBECO", "Mainland"),

    # Misamis Occidental
    ("Misamis Occidental", "MOELCI I", "Mainland"),
    ("Misamis Occidental", "MOELCI II", "Mainland"),
    ("Ozamiz", "MOELCI I", "Mainland"),
    ("Oroquieta", "MOELCI II", "Mainland"),

    # Misamis Oriental
    ("Misamis Oriental", "MORESCO I", "Mainland"),
    ("Misamis Oriental", "MORESCO II", "Mainland"),
    ("Cagayan de Oro", "CEPALCO", "Mainland"),
    ("Gingoog", "MORESCO I", "Mainland"),

    # Lanao del Norte
    ("Lanao del Norte", "LANECO", "Mainland"),
    ("Iligan", "LANECO", "Mainland"),

    # Lanao del Sur
    ("Lanao del Sur", "LASURECO", "Mainland"),
    ("Marawi", "LASURECO", "Mainland"),

    # Bukidnon
    ("Bukidnon", "BUSECO", "Mainland"),
    ("Malaybalay", "BUSECO", "Mainland"),

    # Camiguin
    ("Camiguin", "CAMELCO", "Island"),
    ("Mambajao", "CAMELCO", "Island"),

    # Davao del Norte
    ("Davao del Norte", "DANECO", "Mainland"),
    ("Tagum", "DANECO", "Mainland"),

    # Davao del Sur
    ("Davao del Sur", "DASURECO", "Mainland"),
    ("Digos", "DASURECO", "Mainland"),

    # Davao City
    ("Davao City", "DLPC", "Mainland"),
    ("Davao", "DLPC", "Mainland"),

    # Davao Oriental
    ("Davao Oriental", "DORECO", "Mainland"),
    ("Mati", "DORECO", "Mainland"),

    # Davao Occidental
    ("Davao Occidental", "DAVAO OCC EC", "Mainland"),
    ("Malita", "DAVAO OCC EC", "Mainland"),

    # Compostela Valley / Davao de Oro
    ("Davao de Oro", "COTELCO", "Mainland"),
    ("Compostela Valley", "COTELCO", "Mainland"),
    ("Nabunturan", "COTELCO", "Mainland"),

    # South Cotabato
    ("South Cotabato", "SOCOTECO I", "Mainland"),
    ("South Cotabato", "SOCOTECO II", "Mainland"),
    ("Koronadal", "SOCOTECO I", "Mainland"),

    # Cotabato / Maguindanao
    ("North Cotabato", "COTABATO LIGHT", "Mainland"),
    ("Cotabato", "COTELCO", "Mainland"),
    ("Maguindanao", "MAGELCO", "Mainland"),
    ("Cotabato City", "COTABATO LIGHT", "Mainland"),

    # Sultan Kudarat
    ("Sultan Kudarat", "SUKELCO", "Mainland"),
    ("Isulan", "SUKELCO", "Mainland"),

    # Sarangani
    ("Sarangani", "SARANGGANI ELECTRIC", "Mainland"),
    ("Alabel", "SARANGGANI ELECTRIC", "Mainland"),

    # General Santos
    ("General Santos", "SOCOTECO II", "Mainland"),
    ("GenSan", "SOCOTECO II", "Mainland"),

    # Surigao del Norte
    ("Surigao del Norte", "SURNECO", "Mainland"),
    ("Surigao", "SURNECO", "Mainland"),

    # Surigao del Sur
    ("Surigao del Sur", "SURSECO I", "Mainland"),
    ("Surigao del Sur", "SURSECO II", "Mainland"),
    ("Tandag", "SURSECO I", "Mainland"),

    # Agusan del Norte
    ("Agusan del Norte", "ANECO", "Mainland"),
    ("Butuan", "ANECO", "Mainland"),

    # Agusan del Sur
    ("Agusan del Sur", "ASUECO", "Mainland"),
    ("Prosperidad", "ASUECO", "Mainland"),

    # Dinagat Islands
    ("Dinagat Islands", "DIELCO", "Island"),
    ("San Jose", "DIELCO", "Island"),

    # Basilan
    ("Basilan", "BASELCO", "Island"),
    ("Isabela City", "BASELCO", "Island"),

    # Sulu
    ("Sulu", "SULECO", "Island"),
    ("Jolo", "SULECO", "Island"),

    # Tawi-Tawi
    ("Tawi-Tawi", "TAWELCO", "Island"),
    ("Bongao", "TAWELCO", "Island"),

    # Palawan
    ("Palawan", "PALECO", "Island"),
    ("Puerto Princesa", "PALECO", "Island"),

    # Marinduque
    ("Marinduque", "MARELCO", "Island"),
    ("Boac", "MARELCO", "Island"),

    # Romblon
    ("Romblon", "ROMELCO", "Island"),
    ("Romblon", "ROMELCO", "Island"),

    # Mindoro
    ("Oriental Mindoro", "ORMECO", "Island"),
    ("Calapan", "ORMECO", "Island"),
    ("Occidental Mindoro", "OMECO", "Island"),
    ("Mamburao", "OMECO", "Island"),

    # Abra
    ("Abra", "ABRECO", "Mainland"),
    ("Bangued", "ABRECO", "Mainland"),

    # Apayao
    ("Apayao", "APAYAO ELECTRIC", "Mainland"),
    ("Kabugao", "APAYAO ELECTRIC", "Mainland"),

    # Ifugao
    ("Ifugao", "IFUGAO ELECTRIC", "Mainland"),
    ("Lagawe", "IFUGAO ELECTRIC", "Mainland"),

    # Kalinga
    ("Kalinga", "KAELCO", "Mainland"),
    ("Tabuk", "KAELCO", "Mainland"),

    # Mountain Province
    ("Mountain Province", "MOPRECO", "Mainland"),
    ("Bontoc", "MOPRECO", "Mainland"),
]


# ---------------------------------------------------------------------------
# DU Rates (₱/kWh  — approximate 2025 ERC-approved rates)
# ---------------------------------------------------------------------------

DU_RATES = [
    ("Meralco",             "NCR",              11.8338),
    ("MORE Electric",       "Western Visayas",  12.1234),
    ("VECO",                "Central Visayas",  10.9200),
    ("CEPALCO",             "Northern Mindanao", 10.2100),
    ("DLPC",                "Davao Region",     10.5880),
    ("SORECO1",             "Bicol",             9.8700),
    ("SORECO2",             "Bicol",             9.8700),
    ("CASURECO I",          "Bicol",             9.6200),
    ("CASURECO II",         "Bicol",             9.7400),
    ("CASURECO III",        "Bicol",             9.8100),
    ("CASURECO IV",         "Bicol",             9.9300),
    ("CAGELCO I",           "Cagayan Valley",    9.4500),
    ("CAGELCO II",          "Cagayan Valley",    9.5100),
    ("ISELCO I",            "Cagayan Valley",    9.3800),
    ("ISELCO II",           "Cagayan Valley",    9.4200),
    ("PELCO I",             "Central Luzon",    10.8800),
    ("PELCO II",            "Central Luzon",    10.9200),
    ("PELCO III",           "Central Luzon",    10.9700),
    ("BATELEC I",           "CALABARZON",       10.4500),
    ("BATELEC II",          "CALABARZON",       10.5100),
    ("FLECO",               "CALABARZON",       10.3800),
    ("QUEZELCO I",          "CALABARZON",       10.1200),
    ("QUEZELCO II",         "CALABARZON",       10.2400),
    ("CEBECO I",            "Central Visayas",  10.6700),
    ("CEBECO II",           "Central Visayas",  10.7300),
    ("CEBECO III",          "Central Visayas",  10.7900),
    ("BOHECO I",            "Central Visayas",  11.1200),
    ("BOHECO II",           "Central Visayas",  11.2100),
    ("CENECO",              "Western Visayas",  11.5400),
    ("NOCECO",              "Western Visayas",  11.3200),
    ("NORECO I",            "Central Visayas",  11.4500),
    ("NORECO II",           "Central Visayas",  11.5200),
    ("ILECO I",             "Western Visayas",  10.8900),
    ("ILECO II",            "Western Visayas",  10.9400),
    ("ILECO III",           "Western Visayas",  10.9900),
    ("AKELCO",              "Western Visayas",  11.2200),
    ("CAPELCO",             "Western Visayas",  10.7800),
    ("ANTECO",              "Western Visayas",  11.0100),
    ("LEYTE IV",            "Eastern Visayas",  10.2300),
    ("LEYECO",              "Eastern Visayas",  10.1900),
    ("PANELCO I",           "Ilocos",            9.7800),
    ("PANELCO II",          "Ilocos",            9.8200),
    ("PANELCO III",         "Ilocos",            9.8800),
    ("NEECO I",             "Central Luzon",    10.5600),
    ("NEECO II",            "Central Luzon",    10.6100),
    ("NEECO III",           "Central Luzon",    10.6600),
    ("NEECO IV",            "Central Luzon",    10.7100),
    ("TARELCO I",           "Central Luzon",    10.4500),
    ("TARELCO II",          "Central Luzon",    10.5000),
    ("INEC",                "Ilocos",            9.6600),
    ("ISECO",               "Ilocos",            9.7200),
    ("LUELCO",              "Ilocos",            9.7500),
    ("ZAMECO I",            "Central Luzon",    10.3300),
    ("ZAMECO II",           "Central Luzon",    10.3800),
    ("BATELCO",             "Central Luzon",    10.4200),
    ("DANECO",              "Davao Region",     10.4500),
    ("DASURECO",            "Davao Region",     10.5200),
    ("DORECO",              "Davao Region",     10.6100),
    ("COTELCO",             "Davao Region",     10.7300),
    ("SOCOTECO I",          "SOCCSKSARGEN",     10.3400),
    ("SOCOTECO II",         "SOCCSKSARGEN",     10.4100),
    ("BUSECO",              "Northern Mindanao", 10.1800),
    ("MORESCO I",           "Northern Mindanao", 10.2800),
    ("MORESCO II",          "Northern Mindanao", 10.3300),
    ("LANECO",              "Northern Mindanao", 10.5500),
    ("ZANECO",              "Zamboanga Peninsula", 10.4800),
    ("ZAMSURECO I",         "Zamboanga Peninsula", 10.5500),
    ("ZAMSURECO II",        "Zamboanga Peninsula", 10.6200),
    ("ANECO",               "Caraga",           10.1200),
    ("ASUECO",              "Caraga",           10.2100),
    ("SURNECO",             "Caraga",           10.3100),
    ("SURSECO I",           "Caraga",           10.2500),
    ("SURSECO II",          "Caraga",           10.3000),
    ("PALECO",              "MIMAROPA",         12.3400),
    ("ORMECO",              "MIMAROPA",         11.8800),
    ("OMECO",               "MIMAROPA",         12.1100),
    ("MARELCO",             "MIMAROPA",         11.9900),
    ("MASELCO",             "Bicol",             10.6400),
    ("CANORECO",            "Bicol",             9.7800),
    ("ALECO",               "Albay",             10.3404),
    ("ALECO-Island",        "Albay",             11.1097),
    ("ALECO-LV",            "Albay",              9.3600),
    ("ALECO-LV-Island",     "Albay",             10.5411),
    ("ALECO-HV",            "Albay",              7.2815),
    ("CAMELCO",             "Northern Mindanao", 11.2200),
    ("MOELCI I",            "Northern Mindanao", 10.4200),
    ("MOELCI II",           "Northern Mindanao", 10.4700),
]


def seed():
    """Create tables and insert all seed rows."""
    # Ensure tables exist (in case alembic hasn't been run)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Province Cooperatives ──────────────────────────────────────────
        existing_pc = db.query(ProvinceCooperative).count()
        if existing_pc == 0:
            rows = [
                ProvinceCooperative(
                    province=prov,
                    cooperative=coop,
                    location_type=loc_type,
                )
                for prov, coop, loc_type in PROVINCE_COOPERATIVES
            ]
            db.bulk_save_objects(rows)
            db.commit()
            print(f"✅ Seeded {len(rows)} province_cooperative rows.")
        else:
            print(f"⏭  Skipping province_cooperatives ({existing_pc} rows).")

        # ── DU Rates ─────────────────────────────────────────────
        existing_rates = db.query(DURate).count()
        if existing_rates == 0:
            from datetime import datetime
            rate_rows = []
            for du_name, region, rate in DU_RATES:
                eff_date = (
                    datetime(2026, 3, 1)
                    if "ALECO" in du_name
                    else datetime(2025, 1, 1)
                )
                rate_rows.append(
                    DURate(
                        du_name=du_name,
                        region=region,
                        rate_per_kwh=rate,
                        effective_date=eff_date,
                        consumer_class="Residential",
                    )
                )
            db.bulk_save_objects(rate_rows)
            db.commit()
            print(f"✅ Seeded {len(rate_rows)} du_rate rows.")
        else:
            print(f"⏭  du_rates already has {existing_rates} rows — skipping.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
