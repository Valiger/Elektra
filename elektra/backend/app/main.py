import os
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.routes import auth, cooperatives, rates, receipts
from app.config import settings
from app.limiter import limiter
from app.db.database import SessionLocal
from app.services.utility_rates_pipeline import sync_utility_rates
from apscheduler.schedulers.background import BackgroundScheduler
import sentry_sdk
import structlog

# Initialize Sentry
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# Configure Structlog
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger()


def scheduled_rates_sync():
    logger.info("Running scheduled utility rates sync...")
    db = SessionLocal()
    try:
        sync_utility_rates(db)
    except Exception as e:
        logger.error(f"Scheduled sync failed: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler(timezone='UTC')
    # Run immediately in the background on startup
    scheduler.add_job(scheduled_rates_sync)
    # Run at 00:00 on the 26th of every month
    scheduler.add_job(scheduled_rates_sync, 'cron', day=26, hour=0, minute=0)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="Elektra Backend API",
    description=(
        "Backend for the Elektra Philippine electric bill "
        "scanner and AI energy tips app."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error"},
    )

# CORS Middleware Setup
allowed_origins = [settings.FRONTEND_URL]
if settings.ALLOWED_ORIGINS:
    allowed_origins.extend([o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*\.(loca\.lt|ngrok-free\.app|ngrok-free\.dev|ngrok\.app|ngrok\.io|vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = getattr(settings, "UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["receipts"])
app.include_router(rates.router, prefix="/api/rates", tags=["rates"])
app.include_router(
    cooperatives.router, prefix="/api/cooperatives", tags=["cooperatives"]
)

@app.get("/")
def root():
    return {"message": "Welcome to the Elektra API"}


@app.get("/health", tags=["health"])
def health_check():
    """Liveness probe — returns 200 when the API is up."""
    return {
        "status": "ok",
        "version": app.version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
