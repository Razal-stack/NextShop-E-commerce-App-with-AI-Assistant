@echo off
REM NextShop Development Mode with Library Watching
REM Starts all services + watches assistant library for changes

echo.
echo ========================================
echo   NextShop Development Mode (Watch)
echo ========================================
echo.
echo  This will watch for changes in assistant-web-client
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo  Error: Run this from the NextShop root directory
    pause
    exit /b 1
)

echo  Building assistant-web-client library...
pnpm build --filter=@nextshop/assistant-web-client
if %errorlevel% neq 0 (
    echo  Failed to build assistant library
    pause
    exit /b 1
)

echo.
echo  Starting development servers with library watching...
echo.

echo  Starting assistant library in watch mode...
start " Assistant Library (Watch)" cmd /k "cd packages\assistant-web-client && echo Watching assistant library for changes... && pnpm dev"

timeout /t 2 /nobreak >nul

echo  Starting AI Server...
start " NextShop AI Server" cmd /k "cd services\ai-server && echo Starting AI Server... && python -m app.main"

timeout /t 5 /nobreak >nul

echo  Starting Backend API...
start " NextShop Backend" cmd /k "cd apps\backend && echo Starting Backend API... && pnpm dev"

timeout /t 5 /nobreak >nul

echo  Starting Web App...
start " NextShop Web App" cmd /k "cd apps\web && echo Starting Web App... && pnpm dev"

echo.
echo  All services started in development mode!
echo.
echo  Running Services:
echo    Assistant Library: Watching for changes
echo    AI Server:         http://localhost:8001
echo    Backend API:       http://localhost:3001
echo    Web App:          http://localhost:3000
echo.
echo  Changes to assistant library will auto-rebuild
echo  Visit: http://localhost:3000
echo.
pause
