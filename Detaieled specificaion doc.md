You are absolutely right. I will now deliver the ultimate, single-source-of-truth specification document. This is a fresh, deep dive that synthesizes all of our requirements into one cohesive, highly-detailed, and actionable blueprint.

It is designed to be the definitive guide for you and your AI coding assistant, leaving no ambiguity. We will cover every layer, every technology, and every advanced feature (CSV export, email, etc.) from the ground up, built upon the correct and final **MCP-centric architecture**.

---

# **Definitive Master Specification: NextShop AI Assistant "Nex" (v5.0 - Complete Blueprint)**

**Version:** 5.0 (Final & Complete)
**Project Goal:** To develop and integrate "Nex," a multi-modal AI assistant, into the NextShop platform. The system will be architected around an intelligent **Express.js MCP Server**, fulfilling all project requirements including advanced features like CSV export, email notifications, and image search.
**Guiding Principles:** Adherence to Project Constraints, Modularity, Performance, and Extensibility.

---

## **1. Master Architecture & Philosophy**

The architecture is **MCP-centric**, with the Express.js backend serving as the intelligent "brain" and central orchestrator. This design directly fulfills the core requirement of the assignment.

*   **Express.js MCP Server (The Brain):** This is the intelligent core. It hosts the **LangChain.js** agent, defines the **MCP Tools** (e.g., `listProducts`, `addToCart`, `exportCartToCSV`, `emailCart`), and manages the entire conversation flow. It makes decisions.
*   **FastAPI AI Inference Server (The Specialized Calculator):** This is a powerful but "dumb" service. Its only job is to perform the heavy lifting of AI computation (language generation via **Hugging Face Phi-2**, image description via **Hugging Face BLIP**) when requested by the MCP Server. It does not make decisions.
*   **Next.js Frontend & The MCP Client:** The frontend renders the UI. It contains two critical, distinct pieces:
    1.  The **AI Assistant Library (`@nextshop/ai-assistant`)**: A generic, reusable UI package for the chat interface.
    2.  The **MCP Client (`mcpClient.ts`)**: The specific "driver" within the main Next.js app that configures the UI library and enables it to communicate with our Express MCP Server.

### **Final Architecture Diagram**

```mermaid
graph TD
    subgraph "User's Browser (Client)"
        A[Next.js Frontend App on :3000];
        subgraph "AI Assistant UI Library (@nextshop/ai-assistant)"
            B[UI & State];
            B_VOICE[Voice Input (react-speech-recognition)];
        end
        C[MCP Client Module & Next.js API Proxy];
        A -- "Integrates" --> B;
        B -- "Uses" --> C;
    end

    subgraph "The MCP Server (Express.js on :3001)"
        E[AI Gateway: /api/ai/*];
        F[AI Service (LangChain.js Agent)];
        G[MCP Tools (TypeScript)];
        H[Core Business Services];
        E --> F;
        F -- "Executes" --> G;
        G -- "Calls" --> H;
    end
    
    subgraph "AI Inference Server (FastAPI on :8009)"
        I[Inference Endpoints: /generate, /describe-image];
        J[Hugging Face Models (Phi-2, BLIP)];
        I <--> J;
    end

    C -- "1. Proxied API Call to MCP Server" --> E;
    F -- "2. Needs AI Reasoning (HTTP)" --> I;
    I -- "3. Returns AI Computation" --> F;
    F -- "4. Uses Tool (Direct Function Call)" --> G;
    E -- "5. Returns Final Answer" --> C;
```

---

## **2. Layer 1: The Reusable AI Assistant Library**

**Role:** A standalone, framework-agnostic UI library for a chat assistant.

**Location:** `packages/ai-assistant/`

### **2.1. Core Features**
*   **Generic UI:** Provides the complete chat window, message bubbles, input bar, and floating action button. Styled with Tailwind CSS for easy themeing.
*   **Voice Support:** Integrated with `react-speech-recognition` to provide a microphone button for seamless speech-to-text input.
*   **Image Upload Support:** Provides a UI button to trigger a file input, handling the client-side logic of reading the image.
*   **Configuration-Driven:** All text (welcome message, suggestions) and themes (colors, position) are passed in via a `config` object.

### **2.2. Dependencies (`packages/ai-assistant/package.json`)**
```json
{
  "name": "@nextshop/ai-assistant",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "dependencies": {
    "react-speech-recognition": "^3.10.0",
    "@heroicons/react": "^2.1.4",
    "framer-motion": "^11.2.12"
  }
}
```

### **2.3. Public API (`AIAssistantProvider`)**
The library exposes a single React Context Provider.
```typescript
// packages/ai-assistant/src/index.ts
export interface AIAssistantConfig {
  assistantName: string;
  theme: { primaryColor: string; position: 'bottom-right' | 'bottom-left'; };
  welcomeMessage: string;
  suggestedQuestions: string[];
}

export interface McpClient {
  sendMessage: (query: string) => Promise<string>;
  sendImage: (base64String: string) => Promise<string>;
}

export interface AIAssistantProviderProps {
  config: AIAssistantConfig;
  client: McpClient;
  children: React.ReactNode;
}

// The library also exports the <AIAssistant /> component itself.
```

---

## **3. Layer 2: The Next.js Frontend & MCP Client**

**Role:** To integrate and configure the AI Assistant library, providing the bridge to the backend.

**Location:** `apps/web/`

### **3.1. The MCP Client (`mcpClient.ts`)**
This is the official **MCP Client**. It implements the `McpClient` interface required by the UI library and knows how to talk to our specific backend.

```typescript
// apps/web/src/lib/mcpClient.ts
import { McpClient } from '@nextshop/ai-assistant';

export function createMcpClient(token?: string | null): McpClient {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return {
    async sendMessage(query) {
      const res = await fetch('/api/ai/query', { // Calls our Next.js proxy
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error('Failed to fetch from AI query proxy');
      const data = await res.json();
      return data.response;
    },
    async sendImage(image_b64) {
      const res = await fetch('/api/ai/image-query', { // Calls our Next.js proxy
        method: 'POST',
        headers,
        body: JSON.stringify({ image_b64 }),
      });
      if (!res.ok) throw new Error('Failed to fetch from AI image proxy');
      const data = await res.json();
      return data.response;
    },
  };
}
```

### **3.2. Provider & Proxy Setup**
*   **Configuration (`apps/web/src/config/aiAssistant.config.ts`):** A file defining the `nexAssistantConfig` object with your branding and welcome messages.
*   **Provider Setup (`apps/web/src/app/providers.tsx`):** This file wraps your entire application with the `<AIAssistantProvider>`, passing it the config object and a memoized instance of the `mcpClient`.
*   **API Proxies (`apps/web/app/api/ai/**/route.ts`):** These are crucial for security. They are simple Next.js API routes that forward requests to the **Express MCP Server** (`localhost:3001`), attaching the user's auth token.

---

## **4. Layer 3: The MCP Server (Express.js)**

**Role:** The intelligent **"brain"** and central orchestrator.

**Location:** `apps/backend/`

### **4.1. The AI Service Layer**
This new layer contains all the AI orchestration logic.

*   **Custom LLM Connector (`apps/backend/src/lib/customLLM.ts`):**
    *   **Purpose:** To make the FastAPI Inference Server compatible with LangChain.js.
    *   **Implementation:** An `axios`-based class that extends LangChain's `LLM` base class and implements the `_call` method to `POST` to `http://localhost:8009/generate`.

*   **AI Service (`apps/backend/src/services/aiService.ts`):**
    *   **Purpose:** The core orchestrator.
    *   **Implementation:**
        *   Initializes the `InferenceLLM`.
        *   Initializes all **MCP Tools**.
        *   Creates the **LangChain Agent Executor**.
        *   Exposes a `run(query: string)` method that invokes the agent.
        *   Exposes an `imageSearch(base64: string)` method that:
            1.  `POST`s the image to the FastAPI `/describe-image` endpoint to get a caption.
            2.  Constructs a new text prompt (e.g., "Find products similar to [caption]").
            3.  Calls its own `run()` method with this new prompt.

### **4.2. MCP Tools Specification**
These are the most critical part of the MCP Server. They are TypeScript functions that give the AI its "superpowers."

**Location:** `apps/backend/src/mcp/tools/`

| Tool Name | Description | Input Schema (`zod`) | Implementation Detail |
| :--- | :--- | :--- | :--- |
| **`products.list`** | Searches for products based on category, price, or keywords. | `{ category: z.string().optional(), priceMax: z.number().optional(), query: z.string().optional() }` | Calls `productService.find(filters)`. |
| **`cart.add`** | Adds a specific product to the user's cart. | `{ productId: z.number(), quantity: z.number().min(1).default(1) }` | Calls `cartService.addItemToCart(userId, productId, quantity)`. |
| **`cart.get`** | Fetches the current user's shopping cart. | `{}` | Calls `cartService.getUserCart(userId)`. |
| **`cart.exportCSV`**| Generates a CSV text report of the current user's cart. | `{}` | Fetches the cart, then uses a library like `papaparse` to format a CSV string. Returns the string. |
| **`notifications.emailCart`**| Sends the current cart contents to a specified email address. | `{ email: z.string().email() }` | Fetches the cart, formats an HTML or text summary, and uses `Nodemailer` to send the email. |

---

## **5. Layer 4: The AI Inference Server (FastAPI)**

**Role:** A specialized, high-performance "calculator" for AI tasks.

**Location:** `services/ai-server/`

### **5.1. The Hugging Face Models**
This server leverages the power of open-source models from Hugging Face.

*   **`microsoft/phi-2`:** A powerful and surprisingly compact Large Language Model (LLM). It excels at understanding instructions and reasoning, which is perfect for driving the LangChain agent's decisions.
*   **`Salesforce/blip-image-captioning-base`:** A state-of-the-art Vision Model. Its sole purpose is to look at an image and generate a high-quality text description, which we then use for searching.

### **5.2. Implementation Details**
The server will have a modular structure with separate files for configuration, model loading, tools, etc., as detailed in the previous AI Server specification. This ensures the code is clean, maintainable, and scalable.

---

## **6. Complete Project Folder Structure**

```plaintext
NextShop-Monorepo/
├── 📄 .env                  # Store EXPRESS_API_URL, AI_INFERENCE_URL, EMAIL_HOST, etc.
│
├── 📁 apps/
│   ├── 📁 backend/           # (Role: The MCP Server)
│   │   └── src/
│   │       ├── controllers/
│   │       │   └── aiController.ts      # <-- NEW
│   │       ├── lib/
│   │       │   └── customLLM.ts         # <-- NEW
│   │       ├── mcp/
│   │       │   └── tools/               # <-- NEW
│   │       │       ├── index.ts, cartTools.ts, productTools.ts, notificationTools.ts
│   │       ├── routes/
│   │       │   └── aiRoutes.ts          # <-- NEW
│   │       └── services/
│   │           └── aiService.ts         # <-- NEW
│   │
│   └── 📁 web/               # (Role: Frontend & MCP Client Host)
│       ├── app/
│       │   └── api/ai/                  # <-- NEW: Proxy routes
│       │       ├── query/route.ts
│       │       └── image-query/route.ts
│       ├── src/
│       │   ├── config/
│       │   │   └── aiAssistant.config.ts # <-- NEW
│       │   └── lib/
│       │       └── mcpClient.ts         # <-- NEW: The official MCP Client
│
├── 📁 packages/
│   └── 📁 ai-assistant/      # <-- NEW: The reusable AI chat UI library
│
└── 📁 services/
    └── 📁 ai-server/         # <-- NEW: The AI Inference Server
        ├── 📄 main.py
        └── 📄 requirements.txt
        └── 📁 app/
```

---

## **7. Detailed Execution Flow Example**

**User Goal:** "Find me a leather jacket under £150 and add the best one to my cart."

1.  **[Frontend]** User types the query. `mcpClient.sendMessage()` sends it to the `/api/ai/query` proxy.
2.  **[MCP Server - Express]** The `aiController` receives the query and calls `aiService.run()`.
3.  **[Agent Loop 1 - Find Products]**
    *   **Reason:** The agent asks the **FastAPI Inference Server** for a plan. The server's Phi-2 model responds: "Use the `products.list` tool with query 'leather jacket' and priceMax 150."
    *   **Act:** The agent executes its local TypeScript `products.list` tool.
    *   **Observe:** The tool returns a JSON array of leather jackets.
4.  **[Agent Loop 2 - Decide & Add to Cart]**
    *   **Reason:** The agent sends the product list back to the **FastAPI Inference Server**, asking, "Which of these is the best, and what should I do next?" The Phi-2 model analyzes the ratings and responds, "Product ID 42 is the best. Now, use the `cart.add` tool with productId 42."
    *   **Act:** The agent executes its local TypeScript `cart.add` tool.
    *   **Observe:** The tool returns a success message.
5.  **[Agent Loop 3 - Final Response]**
    *   **Reason:** The agent reports its success to the **FastAPI Inference Server** and asks for a final message.
    *   **Act:** The Phi-2 model generates the text: "Done! I've found the top-rated leather jacket under £150 and added it to your cart. Anything else?"
6.  **[MCP Server -> Frontend]** The `aiService` returns this final text. The `aiController` sends it back through the proxy to the user's browser, completing the multi-step task.