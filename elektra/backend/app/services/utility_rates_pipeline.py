import csv
import logging
import httpx
from typing import Dict, Optional
from datetime import datetime, timezone
import re
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.du_rate import DURate
from app.services.scraper_service import scrape_aleco_rates

logger = logging.getLogger(__name__)

# Google Sheet GIDs
GSHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/1oGc1iGpacELS6tkHjesvAeKZo8v2iv4UkYFY04e0p-I/export?format=csv&gid="
GIDS = {
    "Residential": "0",
    "Commercial": "441532959",
    "Industrial": "1244383053"
}

PRESYO_URL = "https://presyo.icsc.ngo/national"


def _parse_csv_for_latest_rates(csv_content: str) -> Dict[str, dict]:
    """
    Parses the CSV content to extract the latest rate per DU.
    Returns dict: { "DU Name": {"rate": float, "region": str} }
    """
    lines = csv_content.splitlines()
    reader = csv.reader(lines)
    
    header_idx = -1
    du_idx = -1
    region_idx = -1
    month_indices = []
    
    results = {}

    for i, row in enumerate(reader):
        if not row:
            continue
            
        # Find the header row
        if "DU Name" in row:
            header_idx = i
            du_idx = row.index("DU Name")
            if "Region" in row:
                region_idx = row.index("Region")
                
            # Collect indices for all month columns (e.g., Jan-23, Dec-24)
            for col_i, col_name in enumerate(row):
                if "-" in col_name and len(col_name.split("-")) == 2:
                    month, year = col_name.split("-")
                    if year.isdigit():
                        month_indices.append(col_i)
            continue

        if header_idx != -1 and i > header_idx:
            if len(row) <= du_idx:
                continue
            du_name = row[du_idx].strip()
            if not du_name or du_name in ["LUZON", "VISAYAS", "MINDANAO", "PRIVATEINVESTOR OWNED UTILITIES", "ELECTRIC COOPERATIVES"]:
                continue
            
            region = row[region_idx].strip() if region_idx != -1 and len(row) > region_idx else None
            
            # Find the latest valid rate by scanning month columns from right to left
            latest_rate = None
            for col_i in reversed(month_indices):
                if len(row) > col_i:
                    val = row[col_i].strip()
                    if val and val != "NDA" and val != "0":
                        try:
                            latest_rate = float(val.replace(",", ""))
                            break
                        except ValueError:
                            pass
                            
            if latest_rate is not None:
                results[du_name] = {
                    "rate": latest_rate,
                    "region": region
                }

    return results


def fetch_google_sheet_rates() -> Dict[str, Dict[str, dict]]:
    """
    Returns dict: { "ConsumerClass": { "DU Name": {"rate": float, "region": str} } }
    """
    all_rates = {}
    for consumer_class, gid in GIDS.items():
        url = GSHEET_BASE_URL + gid
        try:
            res = httpx.get(url, timeout=15, follow_redirects=True)
            res.raise_for_status()
            rates = _parse_csv_for_latest_rates(res.text)
            all_rates[consumer_class] = rates
        except Exception as e:
            logger.error(f"Failed to fetch {consumer_class} rates from Google Sheet: {e}")
            all_rates[consumer_class] = {}
            
    return all_rates


def fetch_presyo_rates() -> Dict[str, float]:
    """
    Fetches rates from presyo validation source using Playwright.
    Returns dict: { "DU Name": float }
    """
    rates = {}
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(PRESYO_URL, wait_until="networkidle", timeout=30000)
            
            # FIXME: Since presyo is a dynamic SPA, we extract text and try to match DUs 
            # or extract from specific table selectors once known.
            # Example generic text extraction logic:
            content = page.inner_text("body")
            
            # TODO: Implement regex or DOM parsing here when DOM structure is known.
            # For now, this serves as the fallback framework.
            
            browser.close()
    except ImportError:
        logger.warning("Playwright is not installed. Please run `pip install playwright` and `playwright install`.")
    except Exception as e:
        logger.error(f"Failed to fetch presyo rates: {e}")
        
    return rates


def sync_utility_rates(db: Session):
    """
    Master pipeline that syncs rates into the database.
    Priority: Google Sheet > Presyo > Direct Scraper.
    """
    logger.info("Starting utility rates sync pipeline...")
    
    # 1. Fetch Primary Data (Google Sheet)
    gsheet_rates = fetch_google_sheet_rates()
    
    # 2. Fetch Validation Data (Presyo) - Only for Residential usually
    presyo_rates = fetch_presyo_rates()
    
    # 3. Direct Scraper Fallback (e.g., ALECO)
    aleco_fallback_rates = {}
    try:
        aleco_fallback_rates = scrape_aleco_rates()
    except Exception as e:
        logger.warning(f"Failed to scrape ALECO fallback: {e}")

    now = datetime.now(timezone.utc)
    updated_records = []

    # Iterate through all consumer classes from primary source
    for consumer_class, dus in gsheet_rates.items():
        for du_name, data in dus.items():
            primary_rate = data["rate"]
            region = data["region"]
            final_rate = primary_rate
            
            # Cross-reference with Presyo (Residential only for now)
            if consumer_class == "Residential" and du_name in presyo_rates:
                validation_rate = presyo_rates[du_name]
                if abs(primary_rate - validation_rate) > 0.01:
                    logger.warning(
                        f"Discrepancy for {du_name} ({consumer_class}): "
                        f"Google Sheet ({primary_rate}) vs Presyo ({validation_rate}). "
                        f"Using Google Sheet value."
                    )
            
            _upsert_rate(db, du_name, final_rate, region, consumer_class, now)
            updated_records.append({"du_name": du_name, "class": consumer_class, "rate": final_rate})

    # Apply Fallback for Presyo if missing in primary source (Google Sheets)
    residential_gsheet = gsheet_rates.get("Residential", {})
    for du_name, rate in presyo_rates.items():
        if du_name not in residential_gsheet:
            logger.info(f"Using Presyo fallback rate for {du_name} (Residential): {rate}")
            # Region is unknown from Presyo currently, default to empty
            _upsert_rate(db, du_name, rate, "", "Residential", now)
            updated_records.append({"du_name": du_name, "class": "Residential", "rate": rate})


    # Apply Fallback for ALECO if missing in primary source
    # ALECO labels map to our classes
    aleco_class_map = {
        "Residential Mainland": "Residential",
        "Residential Island": "Residential",
        "Low Voltage Mainland": "Commercial",
        "High Voltage": "Industrial",
    }
    
    for label, rate in aleco_fallback_rates.items():
        class_name = aleco_class_map.get(label)
        if not class_name:
            continue
            
        du_name = "ALECO"
        
        # Check if already updated from primary source
        if du_name not in gsheet_rates.get(class_name, {}):
            logger.info(f"Using fallback rate for {du_name} ({class_name}): {rate}")
            _upsert_rate(db, du_name, rate, "Albay", class_name, now)
            updated_records.append({"du_name": du_name, "class": class_name, "rate": rate})

    db.commit()
    return updated_records


def _normalize(name: str) -> str:
    n = name.strip().lower()
    aliases = {"more power": "more electric"}
    if n in aliases: n = aliases[n]
    n = re.sub(r'\s*1$', ' i', n)
    n = re.sub(r'\s*2$', ' ii', n)
    n = re.sub(r'\s*3$', ' iii', n)
    n = re.sub(r'\s*4$', ' iv', n)
    return n.replace(" ", "")

def _upsert_rate(db: Session, du_name: str, rate: float, region: str, consumer_class: str, now: datetime):
    all_rates = db.query(DURate).filter(DURate.consumer_class == consumer_class).all()
    target_norm = _normalize(du_name)
    
    row = None
    for r in all_rates:
        if _normalize(r.du_name) == target_norm:
            row = r
            break
            
    if row:
        row.rate_per_kwh = rate
        row.region = region
        row.effective_date = now # type: ignore
        row.updated_at = now # type: ignore
    else:
        db.add(
            DURate(
                du_name=du_name,
                rate_per_kwh=rate,
                region=region,
                consumer_class=consumer_class,
                effective_date=now,
                updated_at=now,
            )
        )
