@echo off
REM Batch script to run the AI server with Python 3.13.7

echo 🚀 Starting NextShop AI Server with Python 3.13.7...

set PYTHON_PATH=.\venv\Scripts\python.exe
set MAIN_FILE=main.py

REM Check if virtual environment exists
if not exist "%PYTHON_PATH%" (
    echo ❌ Virtual environment not found!
    echo Creating virtual environment with Python 3.13.7...
    py -3.13 -m venv venv
    echo ✅ Virtual environment created
    
    echo Installing dependencies...
    "%PYTHON_PATH%" -m pip install -r requirements.txt
    echo ✅ Dependencies installed
)

REM Verify Python version
for /f "tokens=*" %%i in ('"%PYTHON_PATH%" --version') do set PYTHON_VERSION=%%i
echo Using: %PYTHON_VERSION%

REM Start the server
echo Starting FastAPI server...
"%PYTHON_PATH%" "%MAIN_FILE%"

pause
