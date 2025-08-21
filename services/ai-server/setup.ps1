
# NextShop AI Inference Server Setup Script
# Minimal comments, only error/done icons

if (!(Test-Path "requirements.txt")) {
    Write-Host "❌ requirements.txt not found. Make sure you're in the ai-server directory" -ForegroundColor Red
    exit 1
}

$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCheck) {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found. Please install Python 3.12 or newer from https://python.org" -ForegroundColor Red
    exit 1
}

python -m venv venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
    exit 1
}

& .\venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}

python -m pip install --upgrade pip
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ AI Inference Server setup complete!" -ForegroundColor Green
Write-Host "To start the server:"
Write-Host "   .\venv\Scripts\Activate.ps1"
Write-Host "   python main.py"
