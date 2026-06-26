"""
bill_parser.py — Regex extractor for Philippine electric bill OCR text.

Extracts charge amounts, rates (₱/kWh), CB surcharges, and grand total.
Never raises on bad/partial input. Confidence: 1.0 found, 0.0 not found.
"""

import re
from typing import Dict, Any, Tuple, Optional

KNOWN_DUS = [
    "MERALCO", "VECO", "CEPALCO", "DLPC", "SORSECO", "CASURECO",
    "CAGELCO", "MORE", "CENECO", "LEYECO", "BOHECO", "FLECO",
    "QUEZELCO", "BATELEC", "PELCO", "PANELCO", "ISELCO", "ALECO",
]

MONTHS = (
    "JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|"
    "JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|"
    "JAN|FEB|MAR|APR|JUN|JUL|AUG|SEP|OCT|NOV|DEC"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _nums_in_window(text: str, label_pattern: str, chars: int = 160) -> list:
    """
    Return all decimal numbers within `chars` characters after
    label_pattern. Uses [\\s\\S] so it spans newlines - works for both
    EasyOCR (space-joined) and Cloud Vision (newline-separated) output.
    Stops early at the next charge-field keyword to avoid bleed-over.
    """
    m = re.search(label_pattern, text, re.IGNORECASE)
    if not m:
        return []
    window = text[m.end(): m.end() + chars]
    # Stop before the next charge label
    stop = re.search(
        r'\b(?:GENERATION\s+CHARGE|GEN\.?\s*(?:CHARGE|CHG)|'
        r'TRANSDEL|TRANSMISSION\s+AND\s+DELIVERY|'
        r'SYSTEM\s+LOSS|'
        r'DISTSYS|DISTRIBUTION\s+SYSTEM|'
        r'SUPLYSYS|SUPPLY\s+SYSTEM|'
        r'MTRNGSYS|METERING\s+SYSTEM|METERNG\s+SYS|'
        r'VAT\s+GEN|VAT\s+TRANS|'
        r'VAT\s+SYS\s*LOSS|VAT\s+SYSLOSS|VAT\s+DSM|'
        r'VAT\s+OTHER\s+CHARGES?|'
        r'CB\s+(?:VAT\s+)?SURCHARGE|CURRENT\s+BILL|'
        r'TOTAL\s+AMT|AMOUNT\s+DUE|METERING\s+RETAIL)',
        window, re.IGNORECASE,
    )
    if stop:
        window = window[:stop.start()]
    nums = re.findall(r'[\d,]+\.\d+', window)
    return [n.replace(',', '') for n in nums]


def _rate_and_amount(
    text: str, label_pattern: str
) -> Tuple[Optional[str], Optional[str]]:
    """
    Return (rate, amount) from a row: LABEL  <rate>  <amount>.
    If only one number found, treats it as the amount (no rate col).
    """
    nums = _nums_in_window(text, label_pattern)
    if len(nums) >= 2:
        return nums[0], nums[-1]
    if len(nums) == 1:
        return None, nums[0]
    return None, None


def _amount(text: str, label_pattern: str) -> Optional[str]:
    """Return just the amount (last number in window after label)."""
    _, amt = _rate_and_amount(text, label_pattern)
    return amt


def _kwh(text: str) -> Optional[str]:
    """Extract kWh consumption figure."""
    for pat in [
        r"(?:KWH\s+CONSUMED|CONSUMPTION)\s+([\d,]+(?:\.\d+)?)",
        r"CONSUMPTION\s+([\d,]+(?:\.\d+)?)\s+KWH",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1).replace(",", "")

    # ALECO: "KWH USED" header then values on same or next line
    m = re.search(r"KWH\s+USED([\s\S]{0,120})", text, re.IGNORECASE)
    if m:
        nums = re.findall(r"[\d,]+(?:\.\d+)?", m.group(1))
        nums = [n.replace(",", "") for n in nums]
        if len(nums) >= 3:
            try:
                if abs(float(nums[0]) - float(nums[1])) == float(nums[2]):
                    return nums[2]
            except Exception:
                pass
        if nums:
            return nums[0]

    # ALECO: PRESENT/PREVIOUS readings on adjacent line (Cloud Vision)
    m_pres = re.search(r"PRESENT[^\d]{0,20}(\d[\d,]*)", text, re.IGNORECASE)
    m_prev = re.search(r"PREVIOUS[^\d]{0,20}(\d[\d,]*)", text, re.IGNORECASE)
    if m_pres and m_prev:
        try:
            diff = float(m_pres.group(1).replace(",", "")) - float(
                m_prev.group(1).replace(",", "")
            )
            if diff > 0:
                return str(diff)
        except Exception:
            pass

    return None


def _billing_period(text: str) -> Optional[str]:
    """Extract billing period string."""
    m = re.search(
        r"PERIOD:\s*(\d{2})/(\d{2})/[*\s]*(\d{4})"
        r"[\s\-]+(\d{2})/(\d{2})/(\d{4})",
        text,
        re.IGNORECASE,
    )
    if m:
        month_num = int(m.group(1))
        year = m.group(3)
        names = [
            "", "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ]
        if 1 <= month_num <= 12:
            return f"{names[month_num]} {year}"

    pattern = (
        r"(?:BILLING\s+PERIOD|BILLING\s+MONTH|PERIOD\s+OF\s+COVERAGE)"
        r"\s+(" + MONTHS + r")\s+(\d{4})"
    )
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        return f"{m.group(1).capitalize()} {m.group(2)}"
    return None


def _du_name(text: str) -> Optional[str]:
    """Return first known DU name found in text."""
    for du in KNOWN_DUS:
        if re.search(r"\b" + re.escape(du) + r"\b", text, re.IGNORECASE):
            return du
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_bill(text: str) -> Dict[str, Any]:
    """
    Parse OCR text → dict of bill fields + per-field confidence scores.
    Returns {} for blank input. Guaranteed never to raise.
    """
    if not text or not text.strip():
        return {}

    try:
        upper = text.upper()

        # Common OCR typo fixes
        upper = upper.replace("PER IOD", "PERIOD")
        upper = upper.replace("GEN: CHARGE", "GEN. CHARGE")
        upper = upper.replace("TRANSDE|", "TRANSDEL")
        upper = upper.replace("TRANSDE |", "TRANSDEL")
        upper = upper.replace("TRANSDEL ,", "TRANSDEL.")
        upper = upper.replace("AWT", "AMT")
        upper = upper.replace("VAT GEN;", "VAT GEN.")
        upper = re.sub(r"(\d)\s*[,;_\.\s]\s+(\d{2,4})\b", r"\1.\2", upper)
        upper = re.sub(r"\b0[,;_\.](\d+)\b", r"0.\1", upper)

        # OCR misreads comma-thousands-separator as period:
        # e.g.  "1.039.75" → "1039.75"  (d.ddd.dd  pattern)
        #       "1.039"    → "1039"     (d.ddd     whole number)
        upper = re.sub(
            r"\b(\d)(\.(\d{3}))+\.(\d{2})\b",
            lambda m: m.group(0).replace(
                ".", "", m.group(0).count(".") - 1
            ),
            upper
        )
        # Simpler targeted fix for the very common X.YYY.ZZ case:
        upper = re.sub(r"\b(\d+)\.(\d{3})\.(\d{2})\b", r"\1\2.\3", upper)

        fields: Dict[str, Any] = {}
        confidence: Dict[str, float] = {}

        def _set(key: str, value):
            if value is not None:
                fields[key] = value
                confidence[key] = 1.0
            else:
                confidence[key] = 0.0

        # ── Consumption ───────────────────────────────────────────
        _set("kwh_consumed", _kwh(upper))

        # ── Charge amounts + rates ────────────────────────────────
        charge_defs = [
            (
                "gen_charge", "gen_charge_rate",
                r"GENERATION\s+CHARGE|GEN\.?\s*CHARGE|GEN\.\s*CHG",
            ),
            (
                "transdel_charge", "transdel_charge_rate",
                r"TRANSDEL\.?\s*(?:CHG|CHARGE)?|"
                r"TRANSMISSION\s+AND\s+DELIVERY",
            ),
            (
                "system_loss_charge", "system_loss_rate",
                r"SYSTEM\s+LOSS(?:\s+CHARGE)?",
            ),
            (
                "distsys_charge", "distsys_charge_rate",
                r"DISTSYS\.?\s*(?:CHG|CHARGE)?|"
                r"DISTRIBUTION\s+SYSTEM\s+CHARGE",
            ),
            (
                "supplysys_charge", "supplysys_charge_rate",
                r"SUPLYSYS\.?\s*(?:CHG|CHARGE)?|"
                r"SUPPLY\s+SYSTEM\s+CHARGE",
            ),
            (
                "mtrngsys_charge", "mtrngsys_charge_rate",
                r"MTRNGSYS\.?\s*(?:CHG|CHARGE)?|"
                r"METERING\s+SYSTEM\s+CHARGE|METERNG\s+SYS",
            ),
        ]

        for amt_key, rate_key, pat in charge_defs:
            rate, amt = _rate_and_amount(upper, pat)
            _set(amt_key, amt)
            _set(rate_key, rate)

        # ── VAT components (amounts only — no rate col on VAT rows) ──
        # Always sum all 5 components: VAT GEN + VAT TRANS + VAT SYSLOSS +
        # VAT DSM + VAT OTHER CHARGES — never rely on a pre-printed label.
        vat_patterns = [
            r"VAT\s+GEN\.?",
            r"VAT\s+TRANS\.?",
            r"VAT\s+SYS\s*LOSS|VAT\s+SYSLOSS",
            r"VAT\s+DSM",
            r"VAT\s+OTHER\s+CHARGES?",
        ]
        vat_sum = 0.0
        found_any = False
        for pat in vat_patterns:
            v = _amount(upper, pat)
            if v:
                try:
                    vat_sum += float(v)
                    found_any = True
                except ValueError:
                    pass
        total_vat = f"{vat_sum:.2f}" if found_any else None
        _set("total_vat_charge", total_vat)

        # ── CB surcharges ─────────────────────────────────────────
        # Must come AFTER main VAT block — CB VAT is NOT part of VAT sum
        _set(
            "cb_surcharge",
            _amount(upper, r"CB\s+SURCHARGE(?!\s+VAT)"),
        )
        _set(
            "cb_vat_surcharge",
            _amount(upper, r"CB\s+VAT\s+SURCHARGE"),
        )

        # ── Bill totals ───────────────────────────────────────────
        _set(
            "amount_due",
            _amount(
                upper,
                r"CURRENT\s+BILL|AMOUNT\s+DUE|TOTAL\s+AMOUNT\s+DUE"
                r"|BILL\s+AMOUNT",
            ),
        )
        _set(
            "total_amt_after_due",
            _amount(
                upper,
                r"TOTAL\s+AMT\.?\s+AFTER\s+DUE"
                r"|TOTAL\s+AMOUNT\s+AFTER\s+DUE",
            ),
        )

        # ── Meta ──────────────────────────────────────────────────
        _set("billing_period", _billing_period(upper))
        _set("du_name", _du_name(upper))

        fields["_confidence"] = confidence
        return fields

    except Exception:
        try:
            import traceback
            with open("ocr_debug_error.txt", "w") as f:
                f.write(traceback.format_exc())
        except Exception:
            pass
        return {}
