@echo off
REM NextShop Development Startup Script for Windows
REM Starts all 3 required services in separate windows

echo.
echo ========================================
echo    NextShop E-commerce Setup
echo ========================================
echo.
echo 🚀 Starting all required services...
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo ❌ Error: Run this from the NextShop root directory
    echo    Make sure you're in: NextShop-E-commerce-App-with-AI-Assistant/
    pause
    exit /b 1
)

REM Check if assistant-web-client is built
echo 🔍 Checking assistant-web-client library...
if not exist "packages\assistant-web-client\dist\index.js" (
    echo ⚠️  Assistant library not built. Building now...
    pnpm build --filter=@nextshop/assistant-web-client
    if %errorlevel% neq 0 (
        echo ❌ Failed to build assistant library
        pause
        exit /b 1
    )
    echo ✅ Assistant library built successfully
) else (
    echo ✅ Assistant library already built
)
echo.

echo 🤖 [1/3] Starting AI Server on port 8001...
start "🤖 NextShop AI Server" cmd /k "cd services\ai-server && echo Starting AI Server... && python -m app.main"

echo ⏳ Waiting 5 seconds for AI server to initialize...
timeout /t 5 /nobreak >nul

echo 🛠️ [2/3] Starting Backend API on port 3001...  
start "🛠️ NextShop Backend" cmd /k "cd apps\backend && echo Starting Backend API... && pnpm dev"

echo ⏳ Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo 🌐 [3/3] Starting Web App on port 3000...
start "🌐 NextShop Web App" cmd /k "cd apps\web && echo Starting Web App... && pnpm dev"

echo.
echo ✅ All 3 services are starting in separate windows!
echo.
echo � Service Status:
echo   🤖 AI Server:  http://localhost:8001/health
echo   🛠️ Backend:    http://localhost:3001/health  
echo   🌐 Web App:    http://localhost:3000
echo.
echo 🎯 Wait ~30 seconds, then visit: http://localhost:3000
echo 💡 Look for the assistant icon in the bottom-right corner!
echo.
echo 🔄 To restart: Close all windows and run dev-start.bat again
echo 🛑 To stop: Close all the opened terminal windows
echo.
pause
