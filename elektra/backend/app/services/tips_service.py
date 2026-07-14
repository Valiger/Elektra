"""
tips_service.py — Generate energy-saving tips via Google Gemini AI.

Falls back to rule-based tips when:
  • GEMINI_API_KEY is not configured
  • The Gemini API call fails for any reason
"""

import json
import logging
from typing import List, Dict, Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)


# ── Rule-based fallback tips ──────────────────────────────────────

def _rule_based_tips(
    kwh: Optional[float], amount: Optional[float]
) -> List[Dict[str, Any]]:
    """Return 3 generic but useful tips when Gemini is unavailable."""
    tips = [
        {
            "title": "Switch to LED Lighting",
            "description": (
                "Replace incandescent bulbs with LED equivalents. "
                "They use 75% less energy and last 25 times longer."
            ),
            "savings_note": (
                "Potential savings: \u20b1150\u2013\u20b1400/month."
            ),
        },
        {
            "title": "Unplug Idle Appliances",
            "description": (
                "Appliances on standby ('phantom loads') account for"
                " 5-10% of bills. Unplug TVs, chargers, microwaves."
            ),
            "savings_note": (
                "Potential savings: \u20b180\u2013\u20b1250/month."
            ),
        },
        {
            "title": "Use Air Conditioning Wisely",
            "description": (
                "Set your aircon to 24\u201326 \u00b0C instead of"
                " 18\u201320 \u00b0C. Lower temps increase energy"
                " use by 8% per degree."
            ),
            "savings_note": (
                "Potential savings: \u20b1200\u2013\u20b1600/month."
            ),
        },
        {
            "title": "Time Your Heavy Appliance Use",
            "description": (
                "Run washing machines and water heaters during "
                "off-peak hours (late evening or early morning)."
            ),
            "savings_note": "Reduces peak-demand charges and overall bill.",
        },
    ]
    return tips[:3]


# ── Gemini-based tips ─────────────────────────────────────────────

def _gemini_tips(bill_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Call Gemini API, parse structured JSON tips."""
    import google.generativeai as genai  # type: ignore

    genai.configure(api_key=settings.GEMINI_API_KEY)
    # We will instantiate the model after defining the prompt

    kwh = bill_data.get("kwh_consumed")
    amount = bill_data.get("amount_due")
    du = bill_data.get("du_name", "your local distribution utility")
    period = bill_data.get("billing_period", "recent billing period")
    gen = bill_data.get("gen_charge")
    vat = bill_data.get("total_vat_charge")

    prompt = (
        f"You are an expert Philippine energy consultant.\n"
        f"Analyse this electric bill and provide 3 actionable,"
        f" specific energy-saving tips.\n"
        f"\n"
        f"Bill Data:\n"
        f"- Distribution Utility: {du}\n"
        f"- Billing Period: {period}\n"
        f"- kWh Consumed: {kwh} kWh\n"
        f"- Amount Due: \u20b1{amount}\n"
        f"- Generation Charge: \u20b1{gen}\n"
        f"- Total VAT Charge: \u20b1{vat}\n"
        f"\n"
        f"Return ONLY a JSON array of exactly 3 tip objects, each with:\n"
        f'  "title": short title (5 words max)\n'
        f'  "description": advice (2-3 sentences, Philippine context)\n'
        f'  "savings_note": est. savings/month'
        f' (e.g. "Potential savings: \u20b1200")\n'
        f"\n"
        f"JSON array only \u2014 no other text, no markdown fences."
    )

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
    except Exception as e:
        logger.warning(
            f"gemini-2.0-flash failed: {e}. "
            f"Trying gemini-1.5-flash."
        )
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

    raw = response.text.strip()

    # Strip markdown code fences if Gemini adds them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    parsed = json.loads(raw.strip())
    if not isinstance(parsed, list):
        raise ValueError("Expected a JSON array from Gemini")
    return parsed


# ── Public API ────────────────────────────────────────────────────

def generate_tips(bill_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Return 3-4 energy-saving tips for the given bill dict.
    Always succeeds - falls back to rule-based tips on any error.
    """
    kwh = bill_data.get("kwh_consumed")
    amount = bill_data.get("amount_due")

    # Skip Gemini if no API key configured
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set - using rule-based tips.")
        return _rule_based_tips(kwh, amount)

    try:
        tips = _gemini_tips(bill_data)
        logger.info(
            "Gemini tips generated successfully (%d tips).", len(tips)
        )
        return tips
    except Exception as exc:
        logger.warning(
            "Gemini tips failed (%s) - falling back to rule-based.", exc
        )
        return _rule_based_tips(kwh, amount)
