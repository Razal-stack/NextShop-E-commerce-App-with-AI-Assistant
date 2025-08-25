# NextShop E-commerce App Setup Guide

## Quick Setup Commands (Copy-Paste Ready)

### Prerequisites
- Node.js 18+ and pnpm installed
- Python 3.11+ for AI server
- Git

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/Razal-stack/NextShop-E-commerce-App-with-AI-Assistant.git
cd NextShop-E-commerce-App-with-AI-Assistant

# Install all dependencies (uses pnpm workspaces)
pnpm install
```

### 2. Build Assistant Web Client Package
```bash
# Build the shared assistant web client package first
pnpm build --filter=@nextshop/assistant-web-client
```

### 3. Set Up AI Server (Python)
```bash
# Navigate to AI server directory
cd services/ai-server

# Install Python dependencies and download AI models
python install.py

# Start AI server (runs on port 8001)
python -m app.main
```
*Keep this terminal running*

### 4. Set Up Backend (Node.js)
```bash
# Open new terminal, navigate to backend
cd apps/backend

# Start backend server (runs on port 3001)
pnpm dev
```
*Keep this terminal running*

### 5. Set Up Web App (Next.js)
```bash
# Open new terminal, navigate to web app
cd apps/web

# Start development server (runs on port 3000)
pnpm dev
```
*Keep this terminal running*

## Access the Application
- **Web App**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **AI Server**: http://localhost:8001

## Verification Commands

### Check if everything is running:
```bash
# Check web app
curl http://localhost:3000

# Check backend
curl http://localhost:3001/health

# Check AI server
curl http://localhost:8001/health
```

### Test the Assistant
1. Go to http://localhost:3000
2. Look for the assistant icon in the bottom-right corner
3. Click to expand and test queries like:
   - "find electronics under £100"
   - "show me trending clothes"
   - "search for jewelry"

## Troubleshooting

### If Assistant Web Client Package Issues:
```bash
# Rebuild the package
pnpm build --filter=@nextshop/assistant-web-client

# Clean and rebuild
pnpm clean && pnpm install && pnpm build --filter=@nextshop/assistant-web-client
```

### If Web App Won't Start:
```bash
cd apps/web
# Clear Next.js cache
rm -rf .next
pnpm dev
```

### If Backend Issues:
```bash
cd apps/backend
# Check TypeScript compilation
pnpm build
pnpm dev
```

### If AI Server Issues:
```bash
cd services/ai-server
# Reinstall models
python install.py
# Check if Python packages are installed
pip list | grep torch
```

## Development Commands

### Build all packages:
```bash
pnpm build
```

### Run specific package:
```bash
# Web app only
pnpm dev --filter=web

# Backend only  
pnpm dev --filter=backend

# Assistant package only
pnpm build --filter=@nextshop/assistant-web-client
```

### Clean everything:
```bash
pnpm clean
```

## Architecture Overview

```
NextShop/
├── apps/
│   ├── web/           # Next.js frontend (port 3000)
│   └── backend/       # Express.js API (port 3001)
├── packages/
│   ├── assistant-web-client/  # Shared assistant UI component
│   ├── mcp-client/           # MCP client package
│   └── [other packages]/
└── services/
    └── ai-server/     # Python AI service (port 8001)
```

## Key Features
- **AI Assistant**: Bottom-right draggable assistant with voice and image support
- **Product Search**: Natural language product queries
- **E-commerce**: Full shopping cart, wishlist, authentication
- **Responsive**: Works on desktop and mobile
- **Fast**: Optimized with modern tech stack

## Success Indicators
✅ Web app loads at localhost:3000  
✅ Assistant icon appears in bottom-right  
✅ Assistant responds to product queries  
✅ Products load and display correctly  
✅ Cart and wishlist functions work  

---

**Need help?** Check the individual README files in each directory for more detailed information.
