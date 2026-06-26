@echo off
echo ============================================================
echo  Elektra Backend — Cloud Vision Mode
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Running Alembic migrations...
venv\Scripts\python.exe -m alembic upgrade head
if %ERRORLEVEL% neq 0 (
    echo ERROR: Alembic migration failed.
    pause
    exit /b 1
)
echo Done.

echo.
echo [2/3] Seeding database...
venv\Scripts\python.exe -m app.db.seed_data
echo Done.

echo.
echo [3/3] Starting FastAPI (Cloud Vision + EasyOCR fallback)...
echo       Swagger UI: http://localhost:8000/docs
echo       Press Ctrl+C to stop.
echo.
venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --reload --port 8000
