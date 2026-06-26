# Elektra: Architecture & Core Algorithms

Elektra is a full-stack, production-ready application that scans Philippine electric bills, extracts structured financial data, and provides AI-driven energy-saving tips.

---

## 🚀 Current Project Status (v1.0.0 Release)

The project is fully tested, hardened, and prepared for production deployment.

### Tech Stack & Security Posture
- **Backend:** FastAPI (Python) connected to a PostgreSQL database via SQLAlchemy and Alembic.
- **Frontend:** React + Vite + Tailwind CSS.
- **Mobile App:** React Native + Expo (EAS configured for Play Store and App Store).
- **Authentication:** JWT-based auth utilising **PyJWT** (migrated from `python-jose` to resolve 3 critical CVEs) and **bcrypt** for secure password hashing.
- **Security Hardening:** All dependencies strictly audited (0 high/critical vulnerabilities via `npm overrides`), rate limiting enabled, and all live credentials (Gemini API, GCP Service Accounts) successfully rotated and blocked from git history.

### Deployment Configuration
- **Railway (Backend):** Configured via `railway.json` using Nixpacks, automated Alembic DB migrations on startup, and a `/health` endpoint for continuous uptime monitoring.
- **Vercel (Frontend):** Configured via `vercel.json` with SPA routing rewrites, aggressive asset caching, and strict HTTP security headers. Production builds are optimized in `vite.config.js`.
- **Expo EAS (Mobile):** Configured via `eas.json` and `app.json` with proper bundle identifiers (`com.valiger.elektra`) for both Apple App Store and Google Play Store submission.

---

## Stage 1 — OCR (`ocr_service.py`)

The core intelligence of the Elektra backend is a **two-stage pipeline**: first it reads text off an image using OCR, then it extracts structured financial fields from that text using regex.

The goal here is simple: turn a photo of an electric bill into a string of text. The service uses a **hybrid engine** with smart fallback logic.

```
Image Bytes
    │
    ▼
Is google-cloud-vision installed?  ──No──► Error
    │ Yes
    ▼
Is GOOGLE_APPLICATION_CREDENTIALS set?  ──No──► Error
    │ Yes
    ▼
Daily quota ≤ 3 scans?  ──No──► Max Limit Reached
    │ Yes
    ▼
Call Google Cloud Vision API
    │
    ├── Success ──► return text + confidence
    └── Any error ──► rollback counter 
```

### Primary Engine: Google Cloud Vision

```python
response = client.document_text_detection(image=image)
text = response.full_text_annotation.text
```

- Uses the `document_text_detection` method (designed for dense, structured text like bills/forms — better than plain `text_detection`).
- Extracts **full page confidence** by averaging over all pages in the annotation.
- Returns the raw text uppercased for case-insensitive downstream processing.
- **Daily rate limiter**: capped at **10 scans/day** (in-memory counter reset at midnight) to protect API credits.

### Fallback Engine: EasyOCR (local, offline)

```python
reader = easyocr.Reader(["en"], gpu=False)
results = reader.readtext(tmp_path, detail=1)
```

Before EasyOCR runs, the image is preprocessed by `preprocess()`:

| Step | What it does |
|---|---|
| Grayscale (`convert("L")`) | Removes color noise |
| Contrast ×2.0 | Makes print sharper |
| Sharpen filter | Improves edge clarity |
| Resize to max 1600px | Prevents memory issues |
| Save as temp PNG | EasyOCR needs a file path, not bytes |

EasyOCR returns individual text bounding boxes + per-box confidence. The service joins all boxes into a single space-separated string and computes the average confidence.

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
  extract_text(image_bytes)          ← ocr_service.py
  └─► Google Vision  OR  EasyOCR
        │
        ▼ { text: "...", confidence: 0.97 }
        │
        ▼
  parse_bill(text)                   ← bill_parser.py
  └─► regex extraction of 11+ fields
        │
        ▼ { gen_charge: 890.10, kwh_consumed: 245, ... _confidence: {...} }
        │
        ▼
  Save image file to disk (UUID filename)
        │
        ▼
  Return ScanResponse to frontend:
    { confidence, data, needs_review, image_filename }
```

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| **Google Vision first, EasyOCR fallback** | Cloud Vision handles messy/tilted photos far better; EasyOCR works fully offline for cost-free usage |
| **10 scan/day rate cap** | Google Vision free tier is limited; prevents accidental billing |
| **Uppercase everything** | Makes all regex patterns case-insensitive without the `re.IGNORECASE` overhead on every pattern |
| **Window-based extraction** | Philippine bill formats vary wildly by DU; this approach avoids needing a perfect table parser |
| **VAT fields always summed** | Pre-printed totals on bills can differ due to rounding; summing the components is more reliable |
| **Never raises on bad input** | The outer `try/except` in `parse_bill` ensures a broken bill image never crashes the API |
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
