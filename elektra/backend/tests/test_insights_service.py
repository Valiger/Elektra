"""
tests/test_insights_service.py

Pytest suite for app.services.insights_service.get_insights().

Uses an in-memory SQLite database so no external state is required.
"""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models.bill import Bill
from app.models.user import User
from app.services.insights_service import (
    GRAPH_FIELDS,
    _AVG_FIELDS,
    _safe_float,
    get_insights,
)

# ---------------------------------------------------------------------------
# In-memory DB fixtures
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="module")
def engine():
    eng = create_engine(
        TEST_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture
def db(engine):
    """Provide a fresh session that is rolled back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _make_user(db) -> User:
    user = User(
        email="test@example.com",
        password_hash="x",
        username="tester",
        establishment_type="residential",
        location_type="urban",
        province="Metro Manila",
        cooperative="Meralco",
    )
    db.add(user)
    db.flush()
    return user


def _make_bill(db, user_id: int, days_ago: int, **field_overrides) -> Bill:
    """
    Create a Bill with sensible defaults.  *days_ago* sets scanned_at so
    that bills can be ordered deterministically.
    """
    defaults = {
        "user_id": user_id,
        "scanned_at": datetime(2025, 6, 1) - timedelta(days=days_ago),
        "billing_period": "Jan 2025",
        "kwh_consumed": 150.0,
        "gen_charge": 700.0,
        "transdel_charge": 200.0,
        "system_loss_charge": 50.0,
        "distsys_charge": 80.0,
        "supplysys_charge": 30.0,
        "mtrngsys_charge": 20.0,
        "total_vat_charge": 100.0,
    }
    defaults.update(field_overrides)
    bill = Bill(**defaults)
    db.add(bill)
    db.flush()
    return bill


# ---------------------------------------------------------------------------
# Unit tests for helpers
# ---------------------------------------------------------------------------

class TestSafeFloat:
    def test_none_returns_zero(self):
        assert _safe_float(None) == 0.0

    def test_valid_float(self):
        assert _safe_float(3.14) == pytest.approx(3.14)

    def test_valid_int(self):
        assert _safe_float(5) == pytest.approx(5.0)

    def test_string_number(self):
        assert _safe_float("12.5") == pytest.approx(12.5)

    def test_bad_string_returns_zero(self):
        assert _safe_float("abc") == 0.0


# ---------------------------------------------------------------------------
# Empty bill list
# ---------------------------------------------------------------------------

class TestEmptyBillList:
    def test_returns_empty_periods(self, db):
        user = _make_user(db)
        result = get_insights(user.id, "all_time", db)
        assert result["periods"] == []

    def test_all_aggregates_are_zero(self, db):
        user = _make_user(db)
        result = get_insights(user.id, "all_time", db)
        for field in GRAPH_FIELDS:
            assert result["graphs"][field]["aggregate"] == pytest.approx(0.0)
            assert result["graphs"][field]["values"] == []

    def test_filter_key_present(self, db):
        user = _make_user(db)
        result = get_insights(user.id, "monthly", db)
        assert result["filter"] == "monthly"


# ---------------------------------------------------------------------------
# Single bill
# ---------------------------------------------------------------------------

class TestSingleBill:
    def test_periods_has_one_entry(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=0)
        result = get_insights(user.id, "monthly", db)
        assert len(result["periods"]) == 1

    def test_values_list_has_one_element(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=0, kwh_consumed=200.0)
        result = get_insights(user.id, "monthly", db)
        assert result["graphs"]["kwh_consumed"]["values"] == [200.0]

    def test_kwh_aggregate_equals_only_value(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=0, kwh_consumed=200.0)
        result = get_insights(user.id, "monthly", db)
        agg = result["graphs"]["kwh_consumed"]["aggregate"]
        assert agg == pytest.approx(200.0)

    def test_peso_aggregate_equals_only_value(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=0, gen_charge=800.0)
        result = get_insights(user.id, "monthly", db)
        agg = result["graphs"]["gen_charge"]["aggregate"]
        assert agg == pytest.approx(800.0)


# ---------------------------------------------------------------------------
# Monthly filter
# ---------------------------------------------------------------------------

class TestMonthlyFilter:
    def test_returns_only_most_recent_bill(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=60, kwh_consumed=100.0)  # older
        _make_bill(db, user.id, days_ago=30, kwh_consumed=150.0)  # older
        _make_bill(db, user.id, days_ago=0,  kwh_consumed=200.0)  # newest
        result = get_insights(user.id, "monthly", db)
        assert len(result["periods"]) == 1
        assert result["graphs"]["kwh_consumed"]["values"] == [200.0]

    def test_filter_key_is_monthly(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=0)
        result = get_insights(user.id, "monthly", db)
        assert result["filter"] == "monthly"


# ---------------------------------------------------------------------------
# Quarterly filter
# ---------------------------------------------------------------------------

class TestQuarterlyFilter:
    def test_returns_at_most_3_bills(self, db):
        user = _make_user(db)
        for i in range(5):
            _make_bill(db, user.id, days_ago=i * 30)
        result = get_insights(user.id, "quarterly", db)
        assert len(result["periods"]) == 3

    def test_most_recent_3_are_selected(self, db):
        user = _make_user(db)
        # days_ago 120 = oldest, 0 = newest
        _make_bill(db, user.id, days_ago=120, kwh_consumed=50.0)
        _make_bill(db, user.id, days_ago=90,  kwh_consumed=100.0)
        _make_bill(db, user.id, days_ago=60,  kwh_consumed=150.0)
        _make_bill(db, user.id, days_ago=30,  kwh_consumed=200.0)
        _make_bill(db, user.id, days_ago=0,   kwh_consumed=250.0)
        result = get_insights(user.id, "quarterly", db)
        # Should be the 3 newest (days_ago 0, 30, 60), oldest→newest order
        vals = result["graphs"]["kwh_consumed"]["values"]
        assert vals == [150.0, 200.0, 250.0]

    def test_kwh_aggregate_is_average(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=60, kwh_consumed=100.0)
        _make_bill(db, user.id, days_ago=30, kwh_consumed=200.0)
        _make_bill(db, user.id, days_ago=0,  kwh_consumed=300.0)
        result = get_insights(user.id, "quarterly", db)
        agg = result["graphs"]["kwh_consumed"]["aggregate"]
        assert agg == pytest.approx(200.0)

    def test_peso_aggregate_is_sum(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=60, gen_charge=500.0)
        _make_bill(db, user.id, days_ago=30, gen_charge=600.0)
        _make_bill(db, user.id, days_ago=0,  gen_charge=700.0)
        result = get_insights(user.id, "quarterly", db)
        agg = result["graphs"]["gen_charge"]["aggregate"]
        assert agg == pytest.approx(1800.0)

    def test_fewer_than_3_bills_returns_all(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=10)
        _make_bill(db, user.id, days_ago=0)
        result = get_insights(user.id, "quarterly", db)
        assert len(result["periods"]) == 2


# ---------------------------------------------------------------------------
# All-time filter
# ---------------------------------------------------------------------------

class TestAllTimeFilter:
    def test_returns_all_bills(self, db):
        user = _make_user(db)
        for i in range(6):
            _make_bill(db, user.id, days_ago=i * 30)
        result = get_insights(user.id, "all_time", db)
        assert len(result["periods"]) == 6

    def test_kwh_aggregate_is_average(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=60, kwh_consumed=100.0)
        _make_bill(db, user.id, days_ago=30, kwh_consumed=200.0)
        _make_bill(db, user.id, days_ago=0,  kwh_consumed=300.0)
        result = get_insights(user.id, "all_time", db)
        agg = result["graphs"]["kwh_consumed"]["aggregate"]
        assert agg == pytest.approx(200.0)

    def test_peso_aggregate_is_sum(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=60, total_vat_charge=100.0)
        _make_bill(db, user.id, days_ago=30, total_vat_charge=150.0)
        _make_bill(db, user.id, days_ago=0,  total_vat_charge=200.0)
        result = get_insights(user.id, "all_time", db)
        agg = result["graphs"]["total_vat_charge"]["aggregate"]
        assert agg == pytest.approx(450.0)

    def test_bills_ordered_oldest_to_newest(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=60)
        _make_bill(db, user.id, days_ago=30)
        _make_bill(db, user.id, days_ago=0)
        result = get_insights(user.id, "all_time", db)
        dates = [datetime.strptime(p, "%b %Y") for p in result["periods"]]
        assert dates == sorted(dates)

    def test_filter_key_is_all_time(self, db):
        user = _make_user(db)
        result = get_insights(user.id, "all_time", db)
        assert result["filter"] == "all_time"


# ---------------------------------------------------------------------------
# Null field values
# ---------------------------------------------------------------------------

class TestNullFields:
    def test_null_kwh_treated_as_zero(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=0, kwh_consumed=None)
        result = get_insights(user.id, "monthly", db)
        assert result["graphs"]["kwh_consumed"]["values"] == [0.0]
        agg = result["graphs"]["kwh_consumed"]["aggregate"]
        assert agg == pytest.approx(0.0)

    def test_null_peso_field_treated_as_zero(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=0, gen_charge=None)
        result = get_insights(user.id, "monthly", db)
        assert result["graphs"]["gen_charge"]["values"] == [0.0]
        agg = result["graphs"]["gen_charge"]["aggregate"]
        assert agg == pytest.approx(0.0)

    def test_mixed_null_and_values_sum_correctly(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=30, transdel_charge=None)
        _make_bill(db, user.id, days_ago=0,  transdel_charge=300.0)
        result = get_insights(user.id, "quarterly", db)
        agg = result["graphs"]["transdel_charge"]["aggregate"]
        assert agg == pytest.approx(300.0)


# ---------------------------------------------------------------------------
# Return shape
# ---------------------------------------------------------------------------

class TestReturnShape:
    def test_all_graph_fields_present(self, db):
        user = _make_user(db)
        result = get_insights(user.id, "all_time", db)
        for field in GRAPH_FIELDS:
            assert field in result["graphs"]

    def test_each_graph_has_values_and_aggregate(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=0)
        result = get_insights(user.id, "monthly", db)
        for field in GRAPH_FIELDS:
            assert "values" in result["graphs"][field]
            assert "aggregate" in result["graphs"][field]

    def test_values_and_periods_same_length(self, db):
        user = _make_user(db)
        for i in range(4):
            _make_bill(db, user.id, days_ago=i * 30)
        result = get_insights(user.id, "all_time", db)
        n = len(result["periods"])
        for field in GRAPH_FIELDS:
            assert len(result["graphs"][field]["values"]) == n

    def test_top_level_keys(self, db):
        user = _make_user(db)
        result = get_insights(user.id, "monthly", db)
        assert set(result.keys()) == {"filter", "periods", "graphs"}


# ---------------------------------------------------------------------------
# Aggregate rules matrix
# ---------------------------------------------------------------------------

class TestAggregateRules:
    """kwh_consumed must always average; all ₱ fields must always sum."""

    def test_kwh_is_in_avg_fields(self):
        assert "kwh_consumed" in _AVG_FIELDS

    def test_peso_fields_not_in_avg_fields(self):
        peso_fields = [f for f in GRAPH_FIELDS if f != "kwh_consumed"]
        for f in peso_fields:
            assert f not in _AVG_FIELDS

    def test_kwh_average_all_time(self, db):
        user = _make_user(db)
        _make_bill(db, user.id, days_ago=60, kwh_consumed=100.0)
        _make_bill(db, user.id, days_ago=30, kwh_consumed=200.0)
        result = get_insights(user.id, "all_time", db)
        agg = result["graphs"]["kwh_consumed"]["aggregate"]
        assert agg == pytest.approx(150.0)

    def test_all_peso_fields_sum_quarterly(self, db):
        user = _make_user(db)
        kwargs = {f: 100.0 for f in GRAPH_FIELDS if f != "kwh_consumed"}
        _make_bill(db, user.id, days_ago=60, kwh_consumed=0.0, **kwargs)
        _make_bill(db, user.id, days_ago=30, kwh_consumed=0.0, **kwargs)
        _make_bill(db, user.id, days_ago=0,  kwh_consumed=0.0, **kwargs)
        result = get_insights(user.id, "quarterly", db)
        for field in GRAPH_FIELDS:
            if field == "kwh_consumed":
                continue
            agg = result["graphs"][field]["aggregate"]
            assert agg == pytest.approx(300.0), (
                f"{field} should sum to 300.0"
            )
