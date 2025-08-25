# NextShop E-commerce AI Assistant - Complete Technical Specification

**Version:** 7.0 (Current Architecture)  
**Project:** NextShop AI Assistant "Nex"  
**Architecture:** Generic AI Server + MCP SDK Tools  
**Status:** Production-Ready with Advanced Features  

---

## 1. System Overview & Architecture

### 1.1 Mission Statement
NextShop is a modern e-commerce platform featuring an intelligent AI shopping assistant built on a **clean AI analysis + MCP tool execution** architecture. The system combines natural language processing, computer vision, and structured tool execution with a generic, reusable AI server.

### 1.2 Core Architecture Principles
- **Generic AI Server**: Python FastAPI server with auto-model detection for dynamic reasoning
- **MCP SDK Integration**: Professional Model Context Protocol implementation for tool management
- **Direct Tool Execution**: Express.js backend executes tools directly based on AI analysis
- **Reusable Components**: Generic AI assistant library for any web application
- **Dynamic Configuration**: YAML-based app configs for customizable behavior
- **Auto Model Detection**: Automatically detects and loads AI models from local directory

### 1.3 System Flow
```
User Query → Frontend UI → MCP Client → Express Backend → AI Analysis → Direct Tool Execution → Response
                                                           ↓
                                                  Generic AI Server (Auto-detected Models + Config)
```

## 2. Architecture Overview

### 2.1 Service Architecture
```
NextShop E-commerce Platform
├── Frontend Layer (Port 3000)
│   ├── Next.js 15.0.3 Web Application
│   ├── @nextshop/assistant-web-client 2.0.0 (Generic UI Library)
│   └── Simple MCP Client (API proxy)
│
├── Backend Layer (Port 3001) 
│   ├── Express.js 4.18.2 API Server
│   ├── AI Service (Intent Processing + Tool Execution)
│   ├── Model Context Protocol SDK 0.5.0
│   └── MCP Server (Tool Definitions via SDK)
│
└── AI Layer (Port 8001)
    ├── Python 3.11+ FastAPI Server
    ├── Auto Model Detection System
    ├── Generic YAML Config System
    └── Vision + Text Models (Auto-loaded)
```

### 2.2 Technology Stack Summary

**Frontend Stack:**
- Node.js 22.0.0+ with pnpm 8.15.1
- Next.js 15.0.3 with React 19.0.0
- TypeScript 5.3.3
- Tailwind CSS 3.4.0
- Framer Motion 11.18.2
- Web Speech API (native browser)

**Backend Stack:**  
- Express.js 4.18.2 with TypeScript 5.3.3
- Model Context Protocol SDK 0.5.0
- Zod 3.25.76 for validation
- Axios 1.11.0 for HTTP clients

**AI Server Stack:**
- Python 3.11+ with FastAPI
- PyTorch 2.0.0+ for models
- Transformers 4.30.0+ from Hugging Face
- Pillow 10.0.0+ for image processing
- Auto model detection system

### 2.3 Request Processing Flow
1. **User Input**: Text, voice (Web Speech API), or image through React UI
2. **Frontend MCP Client**: Simple proxy to backend (no business logic)
3. **AI Intent Analysis**: Express calls generic AI server for intent classification
4. **Direct Tool Execution**: Based on intent, directly call appropriate MCP tool via SDK
5. **Business Logic**: Tools execute services (ProductService, CartService)
6. **Response Generation**: Formatted response with UI handlers
7. **UI Update**: Frontend displays results with appropriate components

---

## 3. Layer 1: Frontend & Generic UI Library

### 3.1 Next.js Web Application (`apps/web/`)

**Simple MCP Client Implementation:**
The frontend uses a minimal proxy pattern to communicate with the backend:

```typescript
// Simplified proxy - no business logic
export function createMcpClient(): McpClient {
  return {
    async sendMessage(messages: Array<{ role: string; content: string }>) {
      const query = messages[messages.length - 1]?.content || '';
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      return res.json();
    }
  };
}
```

### 3.2 Assistant Web Client Library (`packages/assistant-web-client/`)

**Purpose**: Generic, reusable React component library for AI assistant interfaces that can be used in any web application.

**Key Features:**
- **Voice Processing**: Native Web Speech API integration without external dependencies
- **Image Handling**: Client-side base64 conversion and preview
- **Conversation Modes**: Support for different interaction patterns
- **Drag & Drop**: File upload with visual feedback
- **Generic Configuration**: Can be configured for any application via props
- **TypeScript Support**: Full type safety and IntelliSense

The library is designed to be application-agnostic and can be used by any web app that needs AI assistant capabilities.

---

## 4. Layer 2: Express.js Backend with MCP SDK

### 4.1 Core Architecture (`apps/backend/`)

**MCP SDK Integration:**
The backend uses the official Model Context Protocol SDK for professional tool management:

```typescript
// MCP Server setup using official SDK
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
```

**AI Service Architecture:**
The AI service follows a simple pattern: analyze intent, execute appropriate tool, format response. No complex orchestration or agent loops.

### 4.2 MCP Tool Execution

**Direct Tool Execution Pattern:**
Instead of complex orchestration, the system uses direct tool calls based on intent classification:

```typescript
// Simple intent-based tool selection
switch (intent) {
  case 'product_search':
    return await mcpClient.callTool('products.search', params);
  case 'ui_handling_action':
    return await this.executeUIAction(aiAnalysis, query, context);
  case 'general_chat':
    return { success: true, result: { message: response }};
}
```

The MCP Server defines tool schemas using the SDK and handles execution through clean business services.

---

## 5. Layer 3: Generic AI Server

### 5.1 Architecture Overview (`services/ai-server/`)

**Purpose**: Generic, dynamic AI reasoning server that can be used by any application. Features:

- **Auto Model Detection**: Automatically scans `models/` directory and loads available models
- **Dynamic Configuration**: Uses YAML config files in `configs/` for app-specific behavior  
- **Generic Reasoning**: Not tied to any specific domain or application
- **Image Analysis**: Vision model support for multimodal interactions
- **Scalable Design**: Can handle multiple applications with different configs

**Configuration System:**
Each application adds its own YAML config in `configs/` directory. For NextShop:

```yaml
# configs/nextshop.yaml
app:
  name: "nextshop"
  description: "NextShop E-commerce AI Assistant"

llm:
  parameters:
    max_tokens: 600
    temperature: 0.01
  system_prompt: |
    You are the AI Assistant for NextShop...
    # App-specific prompt and behavior
```

**Auto Model Detection:**
The AI server automatically detects and loads models from the `models/` directory:

```python
class AIModelManager:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # Auto-detect available models from models/ directory
        self.available_models = self.scan_models_directory()
        
    async def initialize_text_model(self):
        # Auto-select best available model
        model_path = self.find_best_text_model()
        if model_path:
            self.load_model(model_path)
            
    async def initialize_vision_model(self):
        # Auto-detect vision models (Microsoft GIT, BLIP, etc.)
        vision_model = self.find_best_vision_model()
        if vision_model:
            self.load_vision_model(vision_model)
```

### 5.2 Generic API Endpoints

The AI server provides generic endpoints that work with any application:

- **`/app-reason`**: Generic reasoning with app-specific config
- **`/app-image-reason`**: Image analysis with text reasoning  
- **`/config/{app_name}`**: Get app-specific configuration
- **`/health`**: Server status and available models

**Generic Processing Pattern:**
1. Load app-specific config from YAML
2. Apply config to model parameters and prompts
3. Process request using auto-detected models
4. Return structured response per app schema

---

## 6. Execution Flow Examples

### 6.1 Text Query Processing
**User Query**: "find electronics under £100"

1. **Frontend**: React UI captures input, calls createMcpClient().sendMessage()
2. **Express Proxy**: `/api/ai/query` endpoint receives request
3. **AI Service**: Calls generic AI server with NextShop config
4. **Generic AI Server**: 
   - Loads `nextshop.yaml` configuration
   - Uses auto-detected Qwen 2.5 3B model
   - Applies NextShop-specific system prompt
   - Returns structured JSON with intent and parameters
5. **Tool Execution**: AI Service calls MCP SDK tool based on intent
6. **MCP Tool**: `products.search` executes business logic
7. **Response**: Structured results with UI handlers returned
8. **Frontend**: Generic assistant library displays results

### 6.2 Image Query Processing  
**User Action**: Uploads image + asks "find similar items"

1. **Frontend**: Generic image uploader converts to base64
2. **Express Proxy**: `/api/ai/image-query` receives image data  
3. **AI Service**: Calls `/app-image-reason` endpoint
4. **Generic AI Server**:
   - Auto-detected vision model (Microsoft GIT/BLIP) analyzes image
   - Text model processes combined image description + query
   - Uses NextShop config for response formatting
5. **Tool Execution**: Standard MCP tool execution with image context
6. **Response**: Products similar to analyzed image with metadata
7. **Frontend**: Generic library displays results with image context

---

## 7. Key Architectural Benefits

### 7.1 Generic AI Server Benefits
- **Reusable**: Can serve multiple applications with different configs
- **Auto Model Detection**: No manual model configuration required
- **Dynamic**: Add new apps by dropping YAML config files
- **Scalable**: Single server can handle diverse reasoning tasks
- **Maintainable**: Clean separation between AI logic and business logic

### 7.2 MCP SDK Integration Benefits  
- **Professional**: Uses official Model Context Protocol SDK
- **Standard**: Follows MCP specifications and best practices
- **Clean**: Tool definitions are separate from execution logic
- **Type Safe**: Full TypeScript support with proper schemas
- **Maintainable**: Clear separation of concerns

### 7.3 Generic UI Library Benefits
- **Reusable**: Can be used in any React application
- **Configurable**: Behavior customizable via props
- **Professional**: Modern UI with animations and interactions
- **Accessible**: Built-in accessibility support
- **Type Safe**: Full TypeScript support for all components

This architecture provides a solid foundation for AI-powered applications with clean separation of concerns, reusable components, and professional implementation patterns.
