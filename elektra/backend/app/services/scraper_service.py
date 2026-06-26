import re
import httpx
from bs4 import BeautifulSoup  # type: ignore

ALECO_URL = "https://web.alecoinc.com.ph/"

RATE_LABEL_MAP = {
    ("residential", "mainland"): "Residential Mainland",
    ("residential", "island"):   "Residential Island",
    ("low_voltage",  "mainland"): "Low Voltage Mainland",
    ("low_voltage",  "island"):   "Low Voltage Island",
    ("high_voltage", "mainland"): "High Voltage",
    ("high_voltage", "island"):   "High Voltage",
    ("commercial",   "mainland"): "Residential Mainland",
    ("commercial",   "island"):   "Residential Island",
}


def scrape_aleco_rates() -> dict:
    """Scrapes ALECO homepage. Returns dict keyed by rate label."""
    try:
        res = httpx.get(ALECO_URL, timeout=15, follow_redirects=True)
        res.raise_for_status()
    except Exception as e:
        raise RuntimeError(f"Failed to fetch ALECO page: {e}")

    soup = BeautifulSoup(res.text, "html.parser")
    full_text = soup.get_text(separator=" ")
    full_text = re.sub(r'\s+', ' ', full_text)

    rates = {}
    for label in set(RATE_LABEL_MAP.values()):
        label_pattern = r'\s*'.join(re.escape(word) for word in label.split())
        pattern = re.compile(
            label_pattern + r'\s*[\u20b1P]?\s*([\d,]+\.[\d]+)\s*/\s*kWh',
            re.IGNORECASE
        )
        match = pattern.search(full_text)
        if match:
            rates[label] = float(match.group(1).replace(",", ""))

    if not rates:
        raise RuntimeError(
            "ALECO rate data not found - site structure may have changed"
        )
    return rates


def get_aleco_rate_for_user(
    establishment_type: str, location_type: str
) -> float | None:
    """Returns correct ALECO rate for a user's establish/location type."""
    key = (establishment_type.lower(), location_type.lower())
    label = RATE_LABEL_MAP.get(key)
    if not label:
        return None
    return scrape_aleco_rates().get(label)
