@echo off
cd /d "%~dp0"
echo Starting Generic AI Reasoning Server...
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install dependencies if needed
if not exist "venv\Scripts\uvicorn.exe" (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Start the server
echo.
echo Server starting at http://127.0.0.1:8000
echo Press Ctrl+C to stop
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
