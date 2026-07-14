"""
ocr_service.py — LLM OCR: Google GenAI (Gemini)
Extracts structured bill data directly from an image.
"""

import os
import io
import json
import logging
from typing import Dict, Any

from PIL import Image
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

_genai_client = None


def _get_genai_client():
    """Return the Google GenAI client, initialising on first call."""
    global _genai_client
    if _genai_client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise Exception("GEMINI_API_KEY environment variable is not set.")
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client


def _compress_image(image_bytes: bytes, max_width: int = 1024) -> bytes:
    """Resize and re-encode image as JPEG to reduce token usage."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.width > max_width:
            ratio = max_width / img.width
            new_size = (max_width, int(img.height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        if img.mode in ("RGBA", "P", "LA"):
            img = img.convert("RGB")
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=85)
        compressed = out.getvalue()
        logger.debug(
            "Image compressed: %d bytes -> %d bytes",
            len(image_bytes),
            len(compressed),
        )
        return compressed
    except Exception as e:
        logger.warning("Image compression failed (%s), using original.", e)
        return image_bytes


def extract_text(image_bytes: bytes) -> Dict[str, Any]:
    """
    Attempt Gemini extraction to output strict JSON structured data.
    Image is compressed before sending to reduce API token usage.
    """
    image_bytes = _compress_image(image_bytes)
    client = _get_genai_client()

    # We define the JSON schema we want Gemini to return
    schema = {
        "type": "OBJECT",
        "properties": {
            "billing_period": {
                "type": "STRING",
                "description": "e.g., 'January 2026'",
            },
            "du_name": {
                "type": "STRING",
                "description": "Utility name (e.g. MERALCO, ALECO)",
            },
            "kwh_consumed": {
                "type": "STRING",
                "description": "Total consumption in kWh",
            },
            "gen_charge": {"type": "STRING"},
            "gen_charge_rate": {"type": "STRING"},
            "transdel_charge": {"type": "STRING"},
            "transdel_charge_rate": {"type": "STRING"},
            "system_loss_charge": {"type": "STRING"},
            "system_loss_rate": {"type": "STRING"},
            "distsys_charge": {"type": "STRING"},
            "distsys_charge_rate": {"type": "STRING"},
            "supplysys_charge": {"type": "STRING"},
            "supplysys_charge_rate": {"type": "STRING"},
            "mtrngsys_charge": {"type": "STRING"},
            "mtrngsys_charge_rate": {"type": "STRING"},
            "total_vat_charge": {"type": "STRING"},
            "cb_surcharge": {"type": "STRING"},
            "cb_vat_surcharge": {"type": "STRING"},
            "amount_due": {
                "type": "STRING",
                "description": "Total amount due/Current bill",
            },
            "total_amt_after_due": {
                "type": "STRING",
                "description": (
                    "Total amount after due date, "
                    "including penalty or surcharge"
                ),
            },
            "_confidence": {
                "type": "OBJECT",
                "description": "Map each key to a float score 0.0 to 1.0",
                "properties": {
                    "billing_period": {"type": "NUMBER"},
                    "du_name": {"type": "NUMBER"},
                    "kwh_consumed": {"type": "NUMBER"},
                    "gen_charge": {"type": "NUMBER"},
                    "gen_charge_rate": {"type": "NUMBER"},
                    "transdel_charge": {"type": "NUMBER"},
                    "transdel_charge_rate": {"type": "NUMBER"},
                    "system_loss_charge": {"type": "NUMBER"},
                    "system_loss_rate": {"type": "NUMBER"},
                    "distsys_charge": {"type": "NUMBER"},
                    "distsys_charge_rate": {"type": "NUMBER"},
                    "supplysys_charge": {"type": "NUMBER"},
                    "supplysys_charge_rate": {"type": "NUMBER"},
                    "mtrngsys_charge": {"type": "NUMBER"},
                    "mtrngsys_charge_rate": {"type": "NUMBER"},
                    "total_vat_charge": {"type": "NUMBER"},
                    "cb_surcharge": {"type": "NUMBER"},
                    "cb_vat_surcharge": {"type": "NUMBER"},
                    "amount_due": {"type": "NUMBER"},
                    "total_amt_after_due": {"type": "NUMBER"}
                }
            },
        },
    }

    prompt = (
        "Extract the electric utility bill data from the image into the "
        "structured JSON format provided. If a value is not present on "
        "the bill, omit the key or return null."
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(
                    data=image_bytes, mime_type="image/jpeg"
                ),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.0,
            ),
        )

        parsed_json = response.text
        parsed = json.loads(parsed_json)

        # Calculate an average confidence if available
        avg_conf = 1.0
        confs = parsed.get("_confidence", {})
        if confs:
            valid_confs = [
                float(v) for v in confs.values() if v is not None
            ]
            if valid_confs:
                avg_conf = sum(valid_confs) / len(valid_confs)

        return {
            "text": "Parsed via LLM",
            "confidence": round(avg_conf, 4),
            "parsed": parsed,
        }
    except Exception as exc:
        logger.error("GenAI failed: %s", exc)
        raise
