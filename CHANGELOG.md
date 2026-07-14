# Changelog

All notable changes to **Elektra** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Security
- **IDOR Prevention:** Replaced sequential integer IDs with UUIDs (`public_id`) in API responses and frontend routing for Users and Bills.
- **JWT Upgrade:** Migrated from `HS256` symmetric signing to `RS256` asymmetric signing using RSA keypairs.
- **Session Management:** Added `token_version` tracking and a `/logout` endpoint to properly invalidate old sessions (including after password resets).
- **Brute Force Protection:** Implemented in-memory lockout for the `/login` endpoint after 5 consecutive failed attempts.
- **Data Encryption:** Added Fernet encryption for personally identifiable information (PII) at rest (province and cooperative fields).
- **File Validation:** Integrated `filetype` magic byte checking to strictly enforce upload file types regardless of extension.
- **Logging & Monitoring:** Configured `structlog` for structured logging and integrated `sentry-sdk` for error tracking.

---

## [1.0.0] – 2026-06-25

### Added
- **Receipt Scanning** – Upload Philippine electric bills (image or PDF); Google Cloud Vision OCR extracts all charge line-items automatically.
- **AI Energy Tips** – Google Gemini-powered insights summarise consumption trends and suggest energy-saving actions.
- **User Authentication** – JWT-based sign-up / login / profile management with bcrypt password hashing.
- **Rate Management** – Admin-managed distribution utility (DU) rate tables with per-kWh charge breakdown.
- **Cooperative Directory** – Browsable list of Philippine electric cooperatives with province mapping.
- **Current Insights Dashboard** – Month-over-month comparison cards, cost breakdown charts, and trend analysis.
- **React Frontend** – Vite + React 19 SPA with TailwindCSS, Recharts visualisations, and React Router v7.
- **Expo Mobile App** – React Native / Expo Router app targeting iOS and Android (v1.0.0).
- **Security Headers** – `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, `CSP`, `Referrer-Policy` on every response.
- **Rate Limiting** – slowapi-based per-IP throttling on public API endpoints.
- **Health Endpoint** – `GET /health` returns API status and version for load-balancer probes.
- **Database Migrations** – Alembic migration chain (initial tables → image filename → rate surcharge fields → consumer class → scan tracking → legal terms).
- **Legal Pages** – Privacy Policy, Terms of Service, Cookie Policy pages in the frontend.

### Security
- Service-account credentials excluded from repository via `.gitignore`.
- All secrets loaded from environment variables; no hardcoded credentials in source.
- CORS configured to allow only the registered frontend origin(s).

---

[1.0.0]: https://github.com/valiger/elektra/releases/tag/v1.0.0
