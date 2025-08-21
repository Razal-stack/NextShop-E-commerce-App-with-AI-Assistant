# NextShop AI Server Setup Guide

This guide will help you set up the new AI-powered architecture for NextShop with a dedicated FastAPI AI server.

## 🎯 Overview

We're implementing a **3-layer microservice architecture**:

1. **FastAPI AI Server** (Port 8009) - The "Brain"
   - Hosts LLM models (Phi-2) and Vision models (BLIP)
   - Contains LangChain agent with tool definitions
   - Manages Redis caching

2. **Express.js Business API** (Port 3001) - The "Body"
   - Simplified to pure business logic
   - No AI code - just data operations
   - Called by FastAPI tools via HTTP

3. **Next.js Frontend + Proxy** (Port 3000) - The "Face"
   - New `@nextshop/ai-assistant` package
   - Secure API proxies to hide internal services
   - Multi-modal UI (text, voice, image)

## 📋 Prerequisites

### 1. Install Python 3.12
1. Download from https://python.org/downloads/
2. **Important**: Check "Add Python.exe to PATH" during installation
3. Verify: Open PowerShell and run `python --version`

### 2. Install Redis (Memurai for Windows)
1. Download from https://www.memurai.com/
2. Install Memurai Developer (free)
3. It runs as a Windows service on port 6379

### 3. Install pnpm (if not already installed)
```powershell
npm install -g pnpm
```

## 🚀 Setup Instructions

### Step 1: Set up the AI Server

1. **Navigate to AI server directory:**
   ```powershell
   cd services/ai-server
   ```

2. **Run the setup script:**
   ```powershell
   .\setup.ps1
   ```
   
   This will:
   - Create a Python virtual environment
   - Install all required dependencies
   - Set up the environment

3. **Manual setup (if script fails):**
   ```powershell
   # Create virtual environment
   python -m venv venv
   
   # Activate it
   .\venv\Scripts\Activate.ps1
   
   # Install dependencies
   pip install -r requirements.txt
   ```

### Step 2: Update Frontend Dependencies

1. **Navigate to root directory:**
   ```powershell
   cd ..\..\  # Go back to root
   ```

2. **Install all dependencies:**
   ```powershell
   pnpm install
   ```

### Step 3: Update Environment Variables

1. **Create/update `.env.local` in `apps/web/`:**
   ```env
   AI_SERVER_URL=http://127.0.0.1:8009
   ```

2. **Verify Redis is running:**
   - Check Windows Services for "Memurai"
   - Or run: `redis-cli ping` (should return "PONG")

### Step 4: Clean up old AI logic (Express Backend)

The old MCP server and AI logic needs to be removed from the Express backend:

1. **Remove these files:**
   - `apps/backend/src/mcp/server.ts`
   - Any AI-related controllers or services

2. **Update Express to be pure business API only**

## 🎯 Running the System

### Start all services in this order:

1. **Start Redis** (should auto-start with Windows)

2. **Start Express Business API:**
   ```powershell
   cd apps/backend
   pnpm dev
   ```

3. **Start AI Server:**
   ```powershell
   cd services/ai-server
   .\venv\Scripts\Activate.ps1
   uvicorn main:app --reload --port 8009
   ```

4. **Start Next.js Frontend:**
   ```powershell
   cd apps/web  
   pnpm dev
   ```

## 🔗 Access Points

- **Frontend**: http://localhost:3000
- **Express API**: http://localhost:3001
- **AI Server**: http://localhost:8009
- **AI Server Docs**: http://localhost:8009/docs
- **AI Health Check**: http://localhost:8009/health

## 🧪 Testing the Setup

1. **Test AI Server health:**
   ```powershell
   curl http://localhost:8009/health
   ```

2. **Test Express API:**
   ```powershell
   curl http://localhost:3001/api/products
   ```

3. **Test Frontend AI Chat:**
   - Open http://localhost:3000
   - Click on the floating AI assistant
   - Send a message like "Show me some products"

## 🎛️ Configuration

### AI Assistant Configuration
Edit `apps/web/src/config/aiAssistant.config.ts` to customize:
- Assistant name and description
- Suggested questions
- Theme colors

### AI Server Configuration  
Edit `services/ai-server/.env` to modify:
- Express API base URL
- Redis connection URL

## 🐛 Troubleshooting

### Python/AI Server Issues:
- **Models not loading**: Check internet connection (models download on first run)
- **Memory issues**: Ensure you have at least 8GB RAM
- **Port conflicts**: Change port in uvicorn command

### Redis Issues:
- **Connection refused**: Start Memurai service in Windows Services
- **Alternative**: Install Docker and run `docker run -d -p 6379:6379 redis:alpine`

### Frontend Issues:
- **Package not found**: Run `pnpm install` in root directory
- **Type errors**: The AI assistant package needs to be built first

## 📚 Next Steps

1. **Test all AI features**: Text chat, voice input, image search
2. **Customize the assistant**: Modify prompts and tools in `services/ai-server/app/`
3. **Add more tools**: Extend the tool definitions in `app/tools.py`
4. **Monitor performance**: Use FastAPI docs at /docs for API testing

## 🏗️ Architecture Benefits

- **Scalable**: Each service can be scaled independently
- **Maintainable**: Clear separation of concerns
- **Secure**: Frontend proxy hides internal services
- **Fast**: Models loaded once, cached responses
- **Flexible**: Easy to add new AI capabilities

Need help? Check the detailed specifications in the other markdown files!
