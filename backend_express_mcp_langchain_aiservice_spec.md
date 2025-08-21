Of course. This is the definitive blueprint for transforming your existing Express.js backend into a powerful, intelligent **MCP Server**.

This document is designed as a detailed, step-by-step guide. It covers the new folder structure, the integration of LangChain.js, the definition of a comprehensive suite of MCP tools (including advanced features like CSV export and email), Redis caching for performance, and the operational logic for interacting with both the frontend MCP Client and the backend AI Inference Server.

---

# **Definitive Specification & Build Guide: The Express.js MCP Server**

**Version:** 1.0 (Component Specification)
**Project:** NextShop AI Assistant "Nex"
**Component:** MCP Server (Express.js Backend)
**Author:** Gemini AI

## **1. Core Mission & Architecture**

### **1.1. Mission Statement**
The Express.js backend's new mission is to evolve from a simple Business API into an intelligent **MCP Server**. It will serve as the central "brain" and orchestrator for the entire AI assistant experience. It will make decisions, manage complex, multi-step tasks, and leverage its internal business logic to fulfill user requests.

### **1.2. Architectural Philosophy: The Intelligent Orchestrator**
*   **Centralized Intelligence:** This server is where all the decision-making logic resides. It hosts the **LangChain.js Agent**.
*   **Decoupled Computation:** It intelligently delegates raw AI computation (language generation, image analysis) to the specialized **FastAPI AI Inference Server**, treating it as a powerful but simple tool.
*   **Direct Business Logic Access:** The agent's "tools" are TypeScript functions that have direct, high-speed access to your existing business service layer (e.g., `ProductService`, `CartService`). This is far more efficient than making HTTP calls to itself.
*   **Performance via Caching:** A **Redis** caching layer will be implemented to dramatically speed up repetitive requests, reducing both database load and calls to the AI Inference Server.

### **1.3. Execution Flow within the Server**
1.  **Request Arrival:** An authenticated request arrives at an `/api/ai/*` endpoint from the Next.js proxy.
2.  **Service Invocation:** The `aiController` passes the request to the `AIService`.
3.  **Agent Invocation:** The `AIService` invokes the **LangChain Agent Executor** with the user's query.
4.  **The ReAct Loop (Reason and Act):**
    *   **Reason:** The agent needs to think. It calls the `InferenceLLM` class, which makes an HTTP request to the FastAPI server's `/generate` endpoint.
    *   **Act:** The FastAPI server returns a plan (e.g., "Use the `products.list` tool"). The agent selects the corresponding local TypeScript `DynamicTool`.
    *   **Execute Tool (Instant):** The agent executes the tool's function, which directly calls your internal `ProductService`. No internal network call is needed.
    *   **Observe:** The agent gets the data back from the service.
    *   **Repeat:** The loop continues, using tools and reasoning until a final answer is formulated.

## **2. Prerequisites & Setup**

### **Step 1: Install Redis (if not already done)**
Follow the instructions from the AI Server guide to install **Memurai Developer** for a native Windows Redis-compatible cache.

### **Step 2: Install New Dependencies**
Navigate to your backend directory (`apps/backend`) in the terminal and run:
```bash
npm install langchain @langchain/core @langchain/community zod axios redis papaparse nodemailer
npm install -D @types/nodemailer @types/papaparse
```
*   `langchain`: The core orchestration framework.
*   `zod`: For robust, type-safe validation of tool inputs.
*   `axios`: For making HTTP requests to the AI Inference Server.
*   `redis`: The official Node.js client for Redis.
*   `papaparse`: A powerful library for converting JSON to CSV for the export feature.
*   `nodemailer`: The standard for sending emails from Node.js.

## **3. Updated Folder Structure**

This structure integrates the new AI Service Layer cleanly into your existing architecture.

```plaintext
apps/backend/
└── src/
    ├── controllers/
    │   └── ...
    │   └── aiController.ts      # <-- NEW: Handles /api/ai/* requests
    │
    ├── lib/
    │   ├── customLLM.ts         # <-- NEW: LangChain connector for our FastAPI server
    │   └── redisClient.ts       # <-- NEW: Centralized Redis client instance
    │
    ├── mcp/
    │   └── tools/               # <-- NEW: Directory for all MCP tool definitions
    │       ├── index.ts         # (Barrel file to export all tools)
    │       ├── cartTools.ts     # (Tools for cart operations, export, email)
    │       ├── productTools.ts  # (Tools for finding products)
    │       └── notificationTools.ts # (Tools for sending notifications like email)
    │
    ├── routes/
    │   └── ...
    │   └── aiRoutes.ts          # <-- NEW: Defines the /api/ai/* endpoints
    │
    └── services/
        └── ...
        └── aiService.ts         # <-- NEW: The core LangChain agent orchestrator
```

## **4. Step-by-Step Implementation Guide**

### **Step 1: Configure Environment (`apps/backend/.env`)**
Add these new variables to your backend's `.env` file.
```env
# URL for the Python AI Inference Server
AI_INFERENCE_URL="http://localhost:8009"

# Connection URL for Redis
REDIS_URL="redis://localhost:6379"

# Email credentials for Nodemailer (use a service like Mailtrap for dev)
EMAIL_HOST="smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_USER="your_mailtrap_user"
EMAIL_PASS="your_mailtrap_pass"
EMAIL_FROM="Nex Assistant <no-reply@nextshop.com>"
```

### **Step 2: Create the Redis Client**
A centralized client prevents multiple connections.

```typescript
// apps/backend/src/lib/redisClient.ts
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Connect to Redis immediately. The client will handle reconnects.
redisClient.connect().catch(console.error);

export default redisClient;
```

### **Step 3: Create the Custom LLM Connector**
This class teaches LangChain.js how to talk to our FastAPI server.

```typescript
// apps/backend/src/lib/customLLM.ts
import { LLM } from "@langchain/core/language_models/llms";
import axios from 'axios';
import redisClient from './redisClient';

const AI_INFERENCE_URL = process.env.AI_INFERENCE_URL ?? 'http://localhost:8009';

export class InferenceLLM extends LLM {
  _llmType() { return "InferenceServerLLM"; }

  async _call(prompt: string): Promise<string> {
    const cacheKey = `llm:qa:${prompt}`;
    
    // 1. Check cache first
    const cachedResponse = await redisClient.get(cacheKey);
    if (cachedResponse) {
      console.log("INFO: LLM QA Cache HIT");
      return cachedResponse;
    }
    console.log("INFO: LLM QA Cache MISS");

    // 2. If not in cache, call the inference server
    const response = await axios.post(`${AI_INFERENCE_URL}/generate`, { prompt });

    // 3. Store the result in cache with a 5-minute TTL
    await redisClient.set(cacheKey, response.data.response, { EX: 300 });

    return response.data.response;
  }
}
```

### **Step 4: Define the MCP Tools**
This is where you give the AI its "superpowers."

#### **Product Tools**
```typescript
// apps/backend/src/mcp/tools/productTools.ts
import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import { ProductService } from "../../services/productService"; // Your existing service

export const createListProductsTool = (userId: number) =>
  new DynamicTool({
    name: "products.list",
    description: "Searches for products based on category, price, or keywords. Indispensable for finding items.",
    schema: z.object({
      category: z.string().optional().describe("The product category, e.g., 'electronics'."),
      priceMax: z.number().optional().describe("The maximum price of the products."),
      query: z.string().optional().describe("A keyword search query, e.g., 'red t-shirt'."),
    }),
    func: async (filters) => {
      const productService = new ProductService();
      const products = await productService.find(filters);
      // Return a concise summary. The LLM will decide how to present it.
      if (products.length === 0) return "No products found matching those criteria.";
      return `Found ${products.length} products. Here are the top 3: ${JSON.stringify(products.slice(0, 3))}`;
    },
  });
```

#### **Cart, Export, and Notification Tools**
```typescript
// apps/backend/src/mcp/tools/cartTools.ts & notificationTools.ts
import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import { CartService } from "../../services/cartService";
import Papa from 'papaparse';
import nodemailer from 'nodemailer';

// In cartTools.ts
export const createAddToCartTool = (userId: number) => new DynamicTool({ /* ... */ });
export const createGetCartTool = (userId: number) => new DynamicTool({ /* ... */ });

export const createExportCartToCSVTool = (userId: number) =>
  new DynamicTool({
    name: "cart.exportCSV",
    description: "Exports the user's current cart to a CSV formatted string. Use this when the user wants to download their cart.",
    schema: z.object({}),
    func: async () => {
      const cartService = new CartService();
      const cart = await cartService.getUserCartWithProductDetails(userId); // Assumes this method exists
      if (!cart || cart.products.length === 0) return "The cart is empty.";
      
      const csvData = cart.products.map(item => ({
        productId: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }));
      
      return Papa.unparse(csvData);
    },
  });

// In notificationTools.ts
export const createEmailCartTool = (userId: number) =>
  new DynamicTool({
    name: "notifications.emailCart",
    description: "Emails the user's cart summary to a specified email address. You must ask the user for their email address first if you don't know it.",
    schema: z.object({
      email: z.string().email().describe("The recipient's email address."),
    }),
    func: async ({ email }) => {
      const cartService = new CartService();
      const cart = await cartService.getUserCartWithProductDetails(userId);
      if (!cart || cart.products.length === 0) return "Cannot send email because the cart is empty.";

      const transporter = nodemailer.createTransport({ /* ... nodemailer config from .env ... */ });

      const textBody = `Hello! Here is your NextShop cart summary...\n\n` + 
                       cart.products.map(p => `${p.quantity}x ${p.title} - £${p.price}`).join('\n');

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Your NextShop Cart Summary",
        text: textBody,
      });

      return `Successfully sent the cart summary to ${email}.`;
    },
  });
```

### **Step 5: Build the AI Service and Agent**
This service ties everything together.

```typescript
// apps/backend/src/services/aiService.ts
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { InferenceLLM } from "../lib/customLLM";
import * as toolFactory from '../mcp/tools';
import axios from 'axios';
import redisClient from '../lib/redisClient';

const AI_INFERENCE_URL = process.env.AI_INFERENCE_URL ?? 'http://localhost:8009';

export class AIService {
    private executor: AgentExecutor;

    constructor(userId: number) {
        const llm = new InferenceLLM();
        // Create an instance of every tool for the current user
        const tools = Object.values(toolFactory).map(createTool => createTool(userId));
        const prompt = ChatPromptTemplate.fromMessages([/* ... */]);
        const agent = createToolCallingAgent({ llm, tools, prompt });
        this.executor = new AgentExecutor({ agent, tools, verbose: true });
    }

    public async run(query: string): Promise<string> {
      const cacheKey = `agent_run:${query}`;
      const cachedResponse = await redisClient.get(cacheKey);
      if(cachedResponse) {
        console.log("INFO: Full Agent Run Cache HIT");
        return cachedResponse;
      }
      console.log("INFO: Full Agent Run Cache MISS");

      const result = await this.executor.invoke({ input: query });
      
      await redisClient.set(cacheKey, result.output, { EX: 120 }); // Cache full run for 2 mins
      return result.output;
    }
    
    public async imageSearch(image_b64: string): Promise<string> {
        // 1. Get the image description from the inference server
        const response = await axios.post(`${AI_INFERENCE_URL}/describe-image`, { image_b64 });
        const caption = response.data.caption;
        if (!caption) return "I'm sorry, I couldn't understand that image.";

        // 2. Formulate a new prompt and run the main agent
        const searchQuery = `Find products that look like: ${caption}. Also, tell the user you understood the image by mentioning what you saw.`;
        return this.run(searchQuery);
    }
}
```

### **Step 6: Expose the AI Gateway**
Finally, create the controller and routes to expose the `AIService` to the frontend.

```typescript
// apps/backend/src/controllers/aiController.ts
import { Request, Response } from 'express';
import { AIService } from '../services/aiService';

export const handleTextQuery = async (req: Request, res: Response) => {
  const { query } = req.body;
  const userId = (req as any).user?.id; // Assuming auth middleware adds user
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const aiService = new AIService(userId);
  const response = await aiService.run(query);
  res.json({ response });
};

export const handleImageQuery = async (req: Request, res: Response) => {
  const { image_b64 } = req.body;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const aiService = new AIService(userId);
  const response = await aiService.imageSearch(image_b64);
  res.json({ response });
};
```
Then, in `aiRoutes.ts`, wire these controller functions to the `POST /api/ai/query` and `POST /api/ai/image-query` endpoints.

## **7. Detailed Execution Flow Example**

**User Goal:** "Can you email me a CSV of my current cart? My email is example@test.com"

1.  **[Frontend]** User types the query. `mcpClient.sendMessage()` sends it to the `/api/ai/query` proxy, which forwards it to the Express MCP Server.
2.  **[MCP Server - Express]** The `aiService.run()` method is called.
3.  **[Agent Loop 1 - Decide First Action]**
    *   **Reason:** The agent asks the **FastAPI Server** for a plan. The Phi-2 model responds: "The user wants a CSV and wants to email it. I should do this in two steps. First, I need to generate the CSV. The `cart.exportCSV` tool seems perfect."
    *   **Act:** The agent executes its local TypeScript `cart.exportCSV` tool.
    *   **Observe:** The tool calls the `CartService`, uses `papaparse` to create a CSV string (e.g., `"productId,title\n1,Fjallraven Backpack"`), and returns this string to the agent.
4.  **[Agent Loop 2 - Decide Second Action]**
    *   **Reason:** The agent sends the CSV string back to the **FastAPI Server**, saying, "I have the CSV data. The user's email is example@test.com. What's the next step?" Phi-2 responds, "Now, use the `notifications.emailCart` tool with the email 'example@test.com'."
    *   **Act:** The agent executes its local TypeScript `notifications.emailCart` tool. The CSV data is not passed directly, the tool will regenerate it for data integrity.
    *   **Observe:** The tool calls the `CartService` again, formats an email, uses `Nodemailer` to send it, and returns a success message: "Successfully sent the cart summary to example@test.com."
5.  **[Agent Loop 3 - Final Response]**
    *   **Reason:** The agent reports its success to the **FastAPI Server** and asks for a final message.
    *   **Act:** The Phi-2 model generates the text: "All done! I've just sent a CSV export of your current cart to example@test.com. Let me know if there is anything else I can help with."
6.  **[MCP Server -> Frontend]** The `aiService` returns this final text, which is sent back to the user's browser, completing the complex, multi-tool task.