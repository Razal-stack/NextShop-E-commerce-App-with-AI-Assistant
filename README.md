# NextShop E-commerce App with AI Assistant

A modern e-commerce application with a smart shopping assistant built using Next.js, Express.js, and Python AI services.

> **FIRST TIME USERS: Read this entire README first!**  
> **DETAILED SETUP: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## Quick Start (Recommended)

### **Windows Users:**
```bash
git clone https://github.com/Razal-stack/NextShop-E-commerce-App-with-AI-Assistant.git
cd NextShop-E-commerce-App-with-AI-Assistant
pnpm install
pnpm run setup:full
dev-start.bat
```

### **Mac/Linux Users:**
```bash
git clone https://github.com/Razal-stack/NextShop-E-commerce-App-with-AI-Assistant.git
cd NextShop-E-commerce-App-with-AI-Assistant
pnpm install
pnpm run setup:full
chmod +x dev-start.sh
./dev-start.sh
```

**This will open 3 terminal windows automatically:**
- AI Server (Port 8001)
- Backend API (Port 3001) 
- Web App (Port 3000)

**Visit: http://localhost:3000** - Look for the assistant icon in bottom-right corner!

## Important: Library Dependencies

This application has **4 components** that must be set up correctly:

| Component | Purpose | Build Required | Port |
|-----------|---------|----------------|------|
| Assistant Library | UI components for the assistant | YES - Must build first | N/A |
| AI Server | Generic & Dynamic service: AI - LLM Image analysis & AI responses | No | 8001 |
| Backend API | Product data & user management | No | 3001 |
| Web App | User interface & shopping experience | No | 3000 |

**The assistant-web-client library MUST be built before the web app can start!**

### Build Order (Automatic in scripts):
```bash
1. pnpm install                                    # Install all dependencies
2. pnpm build --filter=@nextshop/assistant-web-client  # Build library
3. Start services (AI Server → Backend → Web App)
```

## Important: All 3 Services Must Run

This application requires **3 separate services** running simultaneously:

| Service | Port | Purpose | Status Check |
|---------|------|---------|--------------|
| AI Server | 8001 | Product analysis & AI responses | http://localhost:8001/health |
| Backend API | 3001 | Product data & user management | http://localhost:3001/health |
| Web App | 3000 | User interface & shopping experience | http://localhost:3000 |

**Success indicators:**
- All 3 terminal windows show "Server running" messages
- Web app loads without errors
- Assistant icon appears in bottom-right corner
- Assistant responds to queries like "find electronics"

## Manual Setup (If Automated Fails)

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

### Prerequisites
- Node.js 18+, pnpm
- Python 3.11+

### One-line setup:
```bash
git clone https://github.com/Razal-stack/NextShop-E-commerce-App-with-AI-Assistant.git && cd NextShop-E-commerce-App-with-AI-Assistant && pnpm install && pnpm run setup:full
```

## Architecture

```
NextShop/
├── apps/
│   ├── web/              # Next.js frontend (localhost:3000)
│   │   ├── src/lib/mcpClient.ts      # Frontend MCP client
│   │   └── src/services/mcpService.ts # AI communication service
│   └── backend/          # Express.js API (localhost:3001)
│       ├── src/lib/mcpClient.ts      # Backend MCP client
│       └── src/mcp/                  # MCP server & tools
├── packages/
│   ├── assistant-web-client/  # Shared AI assistant UI components
│
└── services/
    └── ai-server/        # Python FastApi AI service (localhost:8001)
```

## Features

- **AI Assistant**: Natural language product search with voice and image support
- **E-commerce**: Full shopping cart, wishlist, user authentication
- **Responsive**: Works seamlessly on desktop and mobile
- **Fast**: Optimized with modern tech stack and efficient AI models
- **Smart Search**: Find products using natural language like "trending clothes under £100"

## Development

### Available Scripts

```bash
# Setup
pnpm run setup:full              # Install deps + build assistant package

# Development (Standard)
dev-start.bat                    # Windows: Start all services  
./dev-start.sh                   # Mac/Linux: Start all services

# Development (With Library Watching)
dev-watch.bat                    # Windows: Start all + watch assistant library
./dev-watch.sh                   # Mac/Linux: Start all + watch assistant library

# Individual Services
pnpm run dev:web                 # Start web app only
pnpm run dev:backend            # Start backend only
pnpm run build:assistant        # Build assistant package only

# Build & Deploy
pnpm run build                  # Build all packages
pnpm run clean                  # Clean all build files
```

### Development Modes

** Standard Mode** (`dev-start.bat`):
- Assistant library is built once
- Changes to library require manual rebuild
- Faster startup, good for most development

** Watch Mode** (`dev-watch.bat`):  
- Assistant library rebuilds automatically on changes
- Perfect when modifying assistant components
- Slightly slower, but more convenient for library development

### Testing the Assistant

1. Start all services using `dev-start.bat` (Windows) or `./dev-start.sh` (Linux/Mac)
2. Go to http://localhost:3000
3. Find the assistant icon in the bottom-right corner
4. Try these queries:
   - "find electronics under £100"
   - "show me trending clothes"
   - "search for jewelry and add to cart"
   - "what's popular in men's clothing?"

## Configuration

- **AI Models**: Configured in `services/ai-server/configs/nextshop.yaml`
- **Backend API**: Environment variables in `apps/backend/.env`
- **Frontend**: Next.js config in `apps/web/next.config.js`

## Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Detailed setup instructions
- [API Documentation](./NEXTSHOP_API_DOCUMENTATION.md) - Backend API reference
- [AI Server Guide](./services/ai-server/README.md) - AI service configuration

## What Makes This Special

- **MCP Integration**: Uses Model Context Protocol for efficient AI tool execution
- **Draggable Assistant**: Bottom-right positioned, draggable AI assistant interface
- **Smart Fallbacks**: Robust error handling and intelligent fallback mechanisms
- **Modern Stack**: TypeScript, Nextjs, React, Express.js, Python - FastAPI, with latest AI models (MCP, Huggingface)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make changes and test thoroughly
4. Submit a pull request

---

**Made with ❤️ by Rasal Varaprath**
