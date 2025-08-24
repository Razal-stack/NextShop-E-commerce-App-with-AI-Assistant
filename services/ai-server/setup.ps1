# AI Server Setup Script
Write-Host "Setting up AI Server..." -ForegroundColor Green

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -e .[dev]

Write-Host "Setup complete! ✓" -ForegroundColor Green
Write-Host "Run 'python dev.py' to start the development server" -ForegroundColor Cyan
