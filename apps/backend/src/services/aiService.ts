import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { InferenceChatModel } from "../lib/customLLM";
import * as toolFactory from '../mcp/tools';
import axios from 'axios';
import redisClient from '../lib/redisClient';

const AI_INFERENCE_URL = process.env.AI_INFERENCE_URL ?? 'http://localhost:8009';

interface NexResponse {
    message: string;
    displayMode: 'chat_only' | 'auto_navigate' | 'dual_view';
    data?: {
        products?: any[];
        totalFound?: number;
        cart?: any;
    };
    actions?: {
        type: 'navigate' | 'filter_products' | 'add_to_cart' | 'add_to_wishlist';
        payload: any;
    }[];
}

export class AIService {
    private executor: AgentExecutor;
    private userId: number;
    private tools: any[];

    constructor(userId: number) {
        this.userId = userId;
        const llm = new InferenceChatModel({});
        this.tools = Object.values(toolFactory).map(createTool => createTool(userId));
        // Fix: Provide required input variables for agent prompt
        const prompt = ChatPromptTemplate.fromMessages([
          ["system", `You are NextShop's AI assistant. Your job is to select the right tools and parameters to answer user queries about products, carts, and orders. 

Available tools:
- products.list: Search for products by category, price, or keywords. Args: category (optional), priceMax (optional), query (optional)
- cart.add: Add a product to cart. Args: productId (required), quantity (required)  
- cart.get: View current cart contents. Args: none
- cart.exportCSV: Export cart to CSV. Args: none
- notifications.emailCart: Email cart summary. Args: email (required)

Do not answer directly. Instead, specify which tool to call with exact tool names and arguments. Output only tool call instructions in JSON format, e.g.:
{{"tool": "products.list", "args": {{"category": "electronics", "priceMax": 50}}}}`],
          ["human", "{input}"],
          ["ai", "{agent_scratchpad}"]
        ]);
        const agent = createToolCallingAgent({ llm, tools: this.tools, prompt });
        this.executor = new AgentExecutor({ agent, tools: this.tools, verbose: true });
    }

    public async run(query: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<NexResponse> {
      // Redis caching removed for development/testing
      const result = await this.executor.invoke({ input: query });
      
      // Check if the result contains a tool call JSON
      let toolCallResult = result.output;
      
      try {
        // Try to parse the output as JSON tool call
        const toolCall = JSON.parse(toolCallResult);
        if (toolCall.tool && toolCall.args) {
          // Find the matching tool and execute it
          const matchingTool = this.tools.find(tool => tool.name === toolCall.tool);
          
          if (matchingTool) {
            // Execute the tool with the provided args
            const toolResult = await matchingTool.func(JSON.stringify(toolCall.args));
            return this.formatResponse(query, toolCall.tool, toolResult);
          }
        }
      } catch (e) {
        // No fallback parsing - require proper AI server response
        console.log('Failed to parse AI response as JSON tool call:', e);
      }
      
      // Return simple response if no tool call was detected
      return {
        message: result.output,
        displayMode: 'chat_only'
      };
    }

    private formatResponse(query: string, toolName: string, toolResult: string): NexResponse {
      try {
        const parsedResult = JSON.parse(toolResult);
        
        if (toolName === 'products.list' && parsedResult.success && parsedResult.products) {
          const products = parsedResult.products.slice(0, 10); // Limit to 10 products
          const totalFound = parsedResult.products.length;
          
          let message = `I found ${totalFound} products`;
          if (query.includes('under') || query.includes('below')) {
            const priceMatch = query.match(/\$?(\d+)/);
            if (priceMatch) message += ` under $${priceMatch[1]}`;
          }
          message += `! Here are the top ${Math.min(products.length, 5)}:`;

          return {
            message,
            displayMode: products.length > 3 ? 'auto_navigate' : 'chat_only',
            data: {
              products,
              totalFound
            },
            actions: products.length > 3 ? [{
              type: 'navigate',
              payload: { page: '/products' }
            }] : []
          };
        }

        if (toolName === 'cart.get' && parsedResult.success) {
          const cartItems = parsedResult.cart?.products || [];
          const message = cartItems.length > 0 
            ? `Your cart has ${cartItems.length} item${cartItems.length > 1 ? 's' : ''}:`
            : `Your cart is empty. Ready to start shopping?`;

          return {
            message,
            displayMode: 'chat_only',
            data: {
              cart: parsedResult.cart
            }
          };
        }

        // Default fallback
        return {
          message: toolResult,
          displayMode: 'chat_only'
        };

      } catch (e) {
        return {
          message: `Based on your query "${query}", here's what I found:\n\n${toolResult}`,
          displayMode: 'chat_only'
        };
      }
    }
    
    public async imageSearch(image_b64: string): Promise<NexResponse> {
        const response = await axios.post(`${AI_INFERENCE_URL}/describe-image`, { image_b64 });
        const caption = response.data.caption;
        if (!caption) {
          return {
            message: "I'm sorry, I couldn't understand that image.",
            displayMode: 'chat_only'
          };
        }
        const searchQuery = `Find products that look like: ${caption}. Also, tell the user you understood the image by mentioning what you saw.`;
        return this.run(searchQuery);
    }
}
