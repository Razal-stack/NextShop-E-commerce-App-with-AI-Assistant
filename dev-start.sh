#!/bin/bash

# NextShop Development Startup Script
# Starts all 3 required services in separate terminals

echo ""
echo "========================================"
echo "   NextShop E-commerce Setup"
echo "========================================"
echo ""
echo "🚀 Starting all required services..."
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from the NextShop root directory"
    echo "   Make sure you're in: NextShop-E-commerce-App-with-AI-Assistant/"
    exit 1
fi

# Check if assistant-web-client is built
echo "🔍 Checking assistant-web-client library..."
if [ ! -f "packages/assistant-web-client/dist/index.js" ]; then
    echo "⚠️  Assistant library not built. Building now..."
    pnpm build --filter=@nextshop/assistant-web-client
    if [ $? -ne 0 ]; then
        echo "❌ Failed to build assistant library"
        exit 1
    fi
    echo "✅ Assistant library built successfully"
else
    echo "✅ Assistant library already built"
fi
echo ""

# Function to run commands in new terminal tabs/windows
run_in_new_terminal() {
    local cmd="$1"
    local title="$2"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && $cmd\" activate"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        gnome-terminal --tab --title="$title" -- bash -c "cd $(pwd) && $cmd; exec bash"
    else
        echo "⚠️ Unsupported OS. Please run these commands manually in separate terminals:"
        echo "1. cd services/ai-server && python -m app.main"
        echo "2. cd apps/backend && pnpm dev"
        echo "3. cd apps/web && pnpm dev"
        exit 1
    fi
}

echo "🤖 [1/3] Starting AI Server on port 8001..."
run_in_new_terminal "cd services/ai-server && echo 'Starting AI Server...' && python -m app.main" "🤖 NextShop AI Server"

echo "⏳ Waiting 5 seconds for AI server to initialize..."
sleep 5

echo "🛠️ [2/3] Starting Backend API on port 3001..."
run_in_new_terminal "cd apps/backend && echo 'Starting Backend API...' && pnpm dev" "🛠️ NextShop Backend"

echo "⏳ Waiting 5 seconds for backend to initialize..."
sleep 5

echo "🌐 [3/3] Starting Web App on port 3000..."
run_in_new_terminal "cd apps/web && echo 'Starting Web App...' && pnpm dev" "🌐 NextShop Web App"

echo ""
echo "✅ All 3 services are starting in separate terminals!"
echo ""
echo "� Service Status:"
echo "  🤖 AI Server:  http://localhost:8001/health"
echo "  🛠️ Backend:    http://localhost:3001/health"
echo "  🌐 Web App:    http://localhost:3000"
echo ""
echo "🎯 Wait ~30 seconds, then visit: http://localhost:3000"
echo "💡 Look for the assistant icon in the bottom-right corner!"
echo ""
echo "🔄 To restart: Close all terminals and run ./dev-start.sh again"
echo "🛑 To stop: Close all the opened terminal windows"
echo ""
