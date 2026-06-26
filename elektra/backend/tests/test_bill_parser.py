from app.services.bill_parser import parse_bill


# ---------------------------------------------------------------------------
# Field: kwh_consumed
# ---------------------------------------------------------------------------

def test_kwh_meralco():
    text = (
        "KWH CONSUMED 245 MERALCO BILLING PERIOD MARCH 2025"
        " AMOUNT DUE PHP 2,847.50"
    )
    r = parse_bill(text)
    assert r.get("kwh_consumed") == "245"


def test_kwh_with_comma():
    text = "CONSUMPTION 1,245 KWH TOTAL AMOUNT PHP 14,131.75"
    r = parse_bill(text)
    assert r.get("kwh_consumed") == "1245"


def test_kwh_veco():
    text = (
        "VISAYAN ELECTRIC VECO CONSUMPTION 198 KWH"
        " TOTAL AMOUNT DUE PHP 2,019.60"
    )
    r = parse_bill(text)
    assert r.get("kwh_consumed") == "198"


# ---------------------------------------------------------------------------
# Field: amount_due
# ---------------------------------------------------------------------------

def test_amount_meralco():
    text = "AMOUNT DUE PHP 2,847.50"
    r = parse_bill(text)
    assert float(r.get("amount_due", 0)) == 2847.50


# ---------------------------------------------------------------------------
# Field: gen_charge
# ---------------------------------------------------------------------------

def test_gen_charge():
    text = "GENERATION CHARGE PHP 890.10 TRANSMISSION AND DELIVERY PHP 215.30"
    r = parse_bill(text)
    assert float(r.get("gen_charge", 0)) == 890.10


# ---------------------------------------------------------------------------
# Field: transdel_charge
# ---------------------------------------------------------------------------

def test_transdel_charge():
    text = "TRANSMISSION AND DELIVERY CHARGE PHP 215.30 SYSTEM LOSS PHP 48.20"
    r = parse_bill(text)
    assert float(r.get("transdel_charge", 0)) == 215.30


# ---------------------------------------------------------------------------
# Field: system_loss_charge
# ---------------------------------------------------------------------------

def test_system_loss():
    text = "SYSTEM LOSS CHARGE PHP 48.20"
    r = parse_bill(text)
    assert float(r.get("system_loss_charge", 0)) == 48.20


# ---------------------------------------------------------------------------
# Field: distsys_charge
# ---------------------------------------------------------------------------

def test_distsys():
    text = "DISTRIBUTION SYSTEM CHARGE PHP 130.50"
    r = parse_bill(text)
    assert float(r.get("distsys_charge", 0)) == 130.50


# ---------------------------------------------------------------------------
# Field: supplysys_charge
# ---------------------------------------------------------------------------

def test_supplysys():
    text = "SUPPLY SYSTEM CHARGE PHP 42.00"
    r = parse_bill(text)
    assert float(r.get("supplysys_charge", 0)) == 42.00


# ---------------------------------------------------------------------------
# Field: mtrngsys_charge
# ---------------------------------------------------------------------------

def test_mtrngsys():
    text = "METERING SYSTEM CHARGE PHP 35.80"
    r = parse_bill(text)
    assert float(r.get("mtrngsys_charge", 0)) == 35.80


# ---------------------------------------------------------------------------
# Field: total_vat_charge
# ---------------------------------------------------------------------------

def test_total_vat():
    text = "VAT GEN. PHP 31.85 VAT TRANS. PHP 20.00 VAT SYSLOSS PHP 30.00"
    r = parse_bill(text)
    assert float(r.get("total_vat_charge", 0)) == 81.85


# ---------------------------------------------------------------------------
# Field: billing_period
# ---------------------------------------------------------------------------

def test_billing_period():
    text = "BILLING PERIOD MARCH 2025 MERALCO"
    r = parse_bill(text)
    assert "2025" in r.get("billing_period", "")


# ---------------------------------------------------------------------------
# Field: du_name
# ---------------------------------------------------------------------------

def test_du_name_sorseco():
    text = "SORSOGON ELECTRIC COOPERATIVE SORSECO"
    r = parse_bill(text)
    assert r.get("du_name") == "SORSECO"


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

def test_empty_returns_dict():
    assert parse_bill("") == {}


def test_partial_text_no_crash():
    result = parse_bill("RANDOM TEXT NO BILL DATA HERE")
    assert isinstance(result, dict)
