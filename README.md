# Elektra ⚡

> **Philippine Electric Bill Scanner & AI Energy-Tip App**
>
> Scan your MERALCO / cooperative bill, track consumption month-over-month, and get personalised Gemini-powered energy-saving tips — on web and mobile.

---

## Table of Contents
1. [Features](#features)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Database Migrations](#database-migrations)
7. [Running Tests](#running-tests)
8. [Deployment](#deployment)
9. [Mobile App (Expo)](#mobile-app-expo)
10. [Contributing](#contributing)
11. [License](#license)

---

## Features

| Feature | Description |
|---|---|
| Bill Scanning | Upload image or PDF; Google Cloud Vision OCR extracts all charge line-items |
| AI Energy Tips | Google Gemini summarises trends & suggests energy-saving actions |
| Dashboard | Month-over-month comparison, cost breakdown charts, trend analysis |
| Cooperative Directory | Browsable list of PH electric cooperatives with province mapping |
| JWT Auth | Secure sign-up / login / profile management |
| Mobile App | React Native (Expo) app for iOS & Android |

---

## Architecture

```
Elektra/
├── elektra/
│   ├── backend/        # FastAPI Python backend
│   │   ├── app/
│   │   │   ├── main.py         # App entrypoint, middleware, routes
│   │   │   ├── config.py       # Pydantic settings (env-driven)
│   │   │   ├── routes/         # auth, receipts, rates, cooperatives
│   │   │   ├── models/         # SQLAlchemy ORM models
│   │   │   ├── schemas/        # Pydantic request/response schemas
│   │   │   └── services/       # OCR, Gemini, bill-parsing logic
│   │   ├── alembic/            # Database migration scripts
│   │   └── tests/              # pytest test suite
│   │
│   ├── frontend/       # React 19 + Vite + TailwindCSS SPA
│   │   └── src/
│   │       ├── pages/          # Route-level page components
│   │       ├── components/     # Reusable UI components
│   │       ├── hooks/          # Custom React hooks
│   │       └── utils/          # Shared utilities / API client
│   │
│   └── elektra-mobile/ # React Native Expo app (iOS & Android)
│       └── app/                # Expo Router file-based routes
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | ≥ 3.11 | Backend runtime |
| Node.js | ≥ 20 LTS | Frontend & mobile tooling |
| npm | ≥ 10 | Package manager |
| Expo CLI | latest | `npm install -g expo-cli` |
| Git | any | Version control |

You will also need:
- A **Google Cloud** project with the **Vision API** enabled and a service-account JSON key.
- A **Google Gemini** API key (AI Studio or Vertex AI).

---

## Quick Start

### Backend

```bash
cd elektra/backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env      # fill in your values

# Apply migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd elektra/frontend
npm install
cp .env.example .env.local   # set VITE_API_URL=http://localhost:8000

npm run dev
```

App will be available at `http://localhost:5173`.

---

## Environment Variables

See [`elektra/backend/.env.example`](elektra/backend/.env.example) and
[`elektra/frontend/.env.example`](elektra/frontend/.env.example) for the full list with descriptions.

> **Security Note:** Never commit `.env` or `.env.local` files. Both are listed in `.gitignore`.

---

## Database Migrations

Elektra uses **Alembic** for schema migrations.

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Roll back one step
alembic downgrade -1
```

---

## Running Tests

```bash
cd elektra/backend
pytest tests/ -v
```

---

## Deployment

### Backend (Render / Railway / Fly.io)

1. Set all environment variables from `.env.example` in your hosting dashboard.
2. Set the **start command** to:
   ```
   alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. Use a **PostgreSQL** database (update `DATABASE_URL` accordingly).
4. Upload your Google service-account key as a secret file; point `GOOGLE_APPLICATION_CREDENTIALS` at its path.

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel.
2. Set **root directory** to `elektra/frontend`.
3. Add `VITE_API_URL` = your deployed backend URL as an environment variable.
4. Deploy — Vercel auto-detects Vite.

---

## Mobile App (Expo)

```bash
cd elektra/elektra-mobile
npm install
npx expo start
```

### Building for Stores

See [Expo EAS Build docs](https://docs.expo.dev/build/introduction/) for full instructions.

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure the project (first time)
eas build:configure

# Build for Android (Play Store)
eas build --platform android --profile production

# Build for iOS (App Store)
eas build --platform ios --profile production
```

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Commit with conventional commits: `git commit -m "feat: add new feature"`.
4. Open a Pull Request against `main`.

---

## License

MIT © 2026 Elektra Contributors
