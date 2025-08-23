# PowerShell script to run the AI server with Python 3.13.7
Write-Host "🚀 Starting NextShop AI Server with Python 3.13.7..." -ForegroundColor Green

$pythonPath = ".\venv\Scripts\python.exe"
$mainFile = "main.py"

# Check if virtual environment exists
if (-not (Test-Path $pythonPath)) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment with Python 3.13.7..." -ForegroundColor Yellow
    py -3.13 -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & $pythonPath -m pip install -r requirements.txt
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Verify Python version
$pythonVersion = & $pythonPath --version
Write-Host "Using: $pythonVersion" -ForegroundColor Cyan

# Start the server
Write-Host "Starting FastAPI server..." -ForegroundColor Yellow
& $pythonPath $mainFile
