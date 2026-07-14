# Elektra: Architecture & Core Algorithms

Elektra is a full-stack, production-ready application that scans Philippine electric bills, extracts structured financial data, and provides AI-driven energy-saving tips.

---

## 🚀 Current Project Status (v1.0.0 Release)

The project is fully tested, hardened, and prepared for production deployment.

### Tech Stack & Security Posture
- **Backend:** FastAPI (Python) connected to a PostgreSQL database via SQLAlchemy and Alembic.
- **Frontend:** React + Vite + Tailwind CSS.
- **Mobile App:** React Native + Expo (EAS configured for Play Store and App Store).
- **Authentication & Sessions:** JWT-based auth utilizing **PyJWT** (migrated from `python-jose` to resolve 3 critical CVEs) and **bcrypt** for secure password hashing. JWTs are signed asymmetrically using **RS256** and tied to a `token_version` in the database to allow for secure, global session invalidation (e.g. on logout or password reset).
- **Security Hardening:** 
  - **IDOR Prevention:** All user-facing routes utilize UUIDs (`public_id`) instead of sequential IDs to prevent enumeration.
  - **Data Privacy:** PII fields (like province and cooperative data) are encrypted at rest using **Fernet** symmetric encryption via a custom SQLAlchemy TypeDecorator.
  - **API Protections:** Implemented brute-force login lockout, strict file upload validation via magic bytes (`filetype`), and explicit whitespace trimming on all Pydantic schemas.
  - **Monitoring:** Integrated structured logging via `structlog` and error tracking via `sentry-sdk`.
  - All dependencies strictly audited, rate limiting enabled, and all live credentials successfully rotated and blocked from git history.

### Deployment Configuration
- **Render (Backend):** Configured via `render.yaml` using Render's native Python runtime, automated Alembic DB migrations and seed data on startup, and a `/health` endpoint for continuous uptime monitoring. Playwright (Chromium) is installed at build time for the utility rates scraping pipeline.
- **Vercel (Frontend):** Configured via `vercel.json` with SPA routing rewrites, aggressive asset caching, and strict HTTP security headers. Production builds are optimized in `vite.config.js`.
- **Expo EAS (Mobile):** Configured via `eas.json` and `app.json` with proper bundle identifiers (`com.valiger.elektra`) for both Apple App Store and Google Play Store submission.

---

## Stage 1 — OCR (`ocr_service.py`)

The core intelligence of the Elektra backend is a **single-stage LLM pipeline**: it sends a compressed image directly to the Gemini API and receives structured JSON output — no intermediate text extraction or regex required.

The goal is simple: turn a photo of an electric bill directly into structured data. The service uses **Google Gemini** (`gemini-2.0-flash`) with a defined JSON schema.

```
Image Bytes
    │
    ▼
Compress image (Pillow: resize to ≤1024px wide, JPEG 85%)  ← reduces token cost
    │
    ▼
Is GEMINI_API_KEY set?  ──No──► Error
    │ Yes
    ▼
Daily quota ≤ 3 scans (per user, rolling 24h)?  ──No──► 429 Too Many Requests
    │ Yes
    ▼
Call Gemini API (gemini-2.0-flash) with image + JSON schema
    │
    ├── Success ──► return structured JSON + per-field confidence scores
    └── Any error ──► raise HTTPException(500)
```

### Primary Engine: Google Gemini (`gemini-2.0-flash`)

```python
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[image_part, prompt],
    config=GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=schema,
        temperature=0.0,
    ),
)
```

- Uses **structured JSON output** via `response_schema` — Gemini returns valid JSON directly, no regex parsing of raw text needed.
- `temperature=0.0` ensures deterministic, consistent extractions.
- Returns **per-field confidence scores** (0.0–1.0) so the frontend can flag uncertain fields for manual review.
- **Image compression** (via Pillow) resizes large phone photos to ≤1024px wide and re-encodes to JPEG at 85% quality before sending, significantly reducing token usage and API cost.
- **Daily rate limiter**: capped at **3 scans per user per 24 hours** (tracked in the `scan_usage` DB table) to protect API quota.

---

## Stage 2 — Bill Parsing (`bill_parser.py`)

This stage receives the raw OCR text string and extracts **11+ named financial fields** from it using pure Python regex. It's purpose-built for **Philippine electric bills** (MERALCO, VECO, CEPALCO, and 14+ other DUs).

### Pre-processing / OCR Noise Correction

Before any extraction runs, the text is cleaned:

```python
upper = upper.replace("PER IOD", "PERIOD")    # split-word OCR error
upper = upper.replace("AWT", "AMT")            # character misread
upper = re.sub(r"(\d)\s*[,;_\.\s]\s+(\d{2,4})\b", r"\1.\2", upper)  # decimal fix
upper = re.sub(r"\b(\d+)\.(\d{3})\.(\d{2})\b", r"\1\2.\3", upper)   # 1.039.75 → 1039.75
```

The comma-as-period fix (`1.039.75 → 1039.75`) is especially important: some OCR engines confuse the thousands separator comma with a decimal point.

### Core Extraction Helper: `_nums_in_window()`

This is the heart of the parser. Rather than trying to parse tabular structure (which OCR destroys), it:

1. Finds the **label** (e.g. `"GENERATION CHARGE"`) in the text.
2. Grabs the next **160 characters** as a "window".
3. **Stops early** if it encounters the next known charge keyword — so values don't bleed across rows.
4. Extracts all numbers matching `[\d,]+\.\d+` from the window.

```
"GENERATION CHARGE  0.1826  890.10  TRANSMISSION AND DELIVERY..."
                    │──── window ────│
                    └── [0.1826, 890.10]
```

### Field Extraction

| Field | Method |
|---|---|
| `kwh_consumed` | Looks for `KWH CONSUMED`, `CONSUMPTION X KWH`, `KWH USED`, or computes `PRESENT − PREVIOUS` meter readings |
| `gen_charge` + `gen_charge_rate` | `_rate_and_amount()` — first number = rate (₱/kWh), last = amount |
| `transdel_charge`, `system_loss_charge`, `distsys_charge`, `supplysys_charge`, `mtrngsys_charge` | Same rate/amount pattern |
| `total_vat_charge` | Sums all 5 VAT component rows: `VAT GEN + VAT TRANS + VAT SYSLOSS + VAT DSM + VAT OTHER CHARGES` |
| `cb_surcharge`, `cb_vat_surcharge` | Separate patterns to avoid CB VAT being included in the main VAT sum |
| `amount_due` | Matches `CURRENT BILL`, `AMOUNT DUE`, `TOTAL AMOUNT DUE` |
| `billing_period` | Regex for `MM/DD/YYYY – MM/DD/YYYY` or `BILLING PERIOD MARCH 2025` |
| `du_name` | Scans for any of the 18 known DU abbreviations |

### Confidence Scoring

Every field gets a binary confidence score:
- **`1.0`** — value was found
- **`0.0`** — value was not found

After parsing, the route checks if **any field** has confidence `< 0.70`. If so, `needs_review: true` is returned to the frontend so the user can manually correct the values.

---

## Full Pipeline (API Route: `POST /api/receipts/scan`)

```
User uploads image
        │
        ▼
  Validate file type & size (≤10MB, JPG/PNG/WebP/PDF)
        │
        ▼
  Compress image (Pillow: ≤1024px, JPEG 85%)  ← token cost reduction
        │
        ▼
  extract_text(image_bytes)          ← ocr_service.py
  └─► Gemini 2.0 Flash (structured JSON schema)
        │
        ▼ { parsed: { gen_charge, kwh_consumed, ... }, _confidence: {...} }
        │
        ▼
  Save image file to disk (UUID filename)
        │
        ▼
  Return ScanResponse to frontend:
    { confidence, data, needs_review, image_filename, scans_remaining }
```

### AI Tips Pipeline (API Route: `POST /api/receipts/tips`)

```
Frontend sends bill_id + bill fields
        │
        ▼
  bill.tips_json already set?  ──Yes──► Return cached tips (0 API calls)
        │ No
        ▼
  User already got AI tips today?  ──Yes──► Return rule-based tips
        │ No
        ▼
  generate_tips(bill_data)           ← tips_service.py
  └─► Gemini 2.0 Flash (Philippine energy consultant prompt)
        │
        ▼
  Save tips_json to bill DB record
        │
        ▼
  Return TipsResponse: [ { title, description, savings_note } × 3 ]
```

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| **Gemini 2.0 Flash for OCR** | Single API call returns structured JSON directly — no separate regex bill parser needed; handles varied DU formats robustly |
| **Image compression before API call** | Pillow resizes to ≤1024px and re-encodes to JPEG 85% before sending — drastically reduces token usage for large phone photos |
| **3 scan/day rate cap (per user, DB-tracked)** | AI Studio free tier is generous but finite; per-user DB tracking is more robust than in-memory counters that reset on redeploy |
| **Tips cached in `tips_json` column** | Re-opening a receipt never triggers a Gemini call again; the stored tips are served from the DB instantly |
| **1 AI tips generation per user per day** | Prevents heavy users from exhausting the daily free quota; falls back to high-quality rule-based tips on subsequent calls |
| **Window-based field extraction (legacy)** | Original regex parser approach for reference; replaced by Gemini's schema-enforced JSON output |
| **VAT fields always summed** | Pre-printed totals on bills can differ due to rounding; summing the components is more reliable |
| **Never raises on bad input** | The outer `try/except` ensures a broken bill image never crashes the API — falls back gracefully |
| **JWT over python-jose** | `python-jose` was abandoned with 3 active CVEs; replaced with `PyJWT` for enterprise-grade security |

---

## Supported Distribution Utilities (DUs)

| Code | Utility |
|---|---|
| MERALCO | Manila Electric Company |
| VECO | Visayan Electric Company |
| CEPALCO | Cagayan Electric Power and Light Co. |
| DLPC | Davao Light and Power Company |
| SORSECO | Sorsogon Electric Cooperative |
| CASURECO | Camarines Sur Electric Cooperative |
| CAGELCO | Cagayan Electric Cooperative |
| MORE | More Electric and Power Corporation |
| CENECO | Central Negros Electric Cooperative |
| LEYECO | Leyte Electric Cooperative |
| BOHECO | Bohol Electric Cooperative |
| FLECO | First Laguna Electric Cooperative |
| QUEZELCO | Quezon Electric Cooperative |
| BATELEC | Batangas Electric Cooperative |
| PELCO | Pampanga Electric Cooperative |
| PANELCO | Pangasinan Electric Cooperative |
| ISELCO | Ilocos Sur Electric Cooperative |
| ALECO | Albay Electric Cooperative |
