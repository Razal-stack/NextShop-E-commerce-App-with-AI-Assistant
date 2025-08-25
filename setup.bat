@echo off
REM NextShop Quick Setup Script for Windows
REM Run this script to set up the entire NextShop application

echo 🚀 Setting up NextShop E-commerce App...

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pnpm is not installed. Please install pnpm first:
    echo npm install -g pnpm
    exit /b 1
)

REM Check if python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.11+ first
    exit /b 1
)

echo 📦 Installing dependencies...
pnpm install

echo 🔨 Building assistant web client package...
pnpm build --filter=@nextshop/assistant-web-client

echo 🤖 Setting up AI server...
cd services\ai-server
python install.py
cd ..\..

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. Start AI server:    cd services\ai-server ^&^& python -m app.main
echo 2. Start backend:      cd apps\backend ^&^& pnpm dev
echo 3. Start web app:      cd apps\web ^&^& pnpm dev
echo.
echo Then visit: http://localhost:3000
echo.
echo 📋 Or use the development script: dev-start.bat
