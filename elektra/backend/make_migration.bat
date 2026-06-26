@echo off
cd /d "%~dp0"
echo Generating new Alembic migration...
venv\Scripts\python.exe -m alembic revision --autogenerate -m "Add legal terms"
echo.
echo Upgrading database...
venv\Scripts\python.exe -m alembic upgrade head
echo.
echo Done! You can now close this window and restart your start.bat server.
pause
