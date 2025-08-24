/**
 * AI SERVICE - PROFESSIONAL MCP ARCHITECTURE
 * AI Server (JSON Analysis) + MCP Client (Tool Execution) - EXPERT LEVEL
 */

import { mcpClient } from '../lib/mcpClient';
import { CategoryService } from './categoryService';
import { getMCPToolsContext } from '../mcp/toolDefinitions';
import { UIHandlerFallback } from './uiHandlerFallback';

export interface ConversationMessage {
  role: string;
  content: string;
}

/**
 * Main AI Service using Professional MCP Architecture
 * 1. AI Server provides JSON analysis/intent classification
 * 2. MCP Client executes the appropriate tools
 * 3. Dynamic category loading from CategoryService
 * 4. Real MCP tool context from centralized definitions
 */
export class AIService {
  private conversationHistory: ConversationMessage[] = [];
  private isInitialized = false;
  private categoryService: CategoryService;
  private availableCategories: string[] = [];
  private mcpToolsContext: any[] = [];

  constructor() {
    this.categoryService = new CategoryService();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[AI Service] Initializing professional MCP architecture...');
    
    try {
      // Initialize MCP client
      await mcpClient.connect();
      
      // Load dynamic categories from CategoryService
      await this.loadAvailableCategories();
      
      // Build MCP tools context from actual tool definitions
      this.buildMCPToolsContext();
      
      this.isInitialized = true;
      console.log('[AI Service] Professional MCP architecture initialized successfully');
      console.log(`[AI Service] Loaded ${this.availableCategories.length} categories`);
      console.log(`[AI Service] Built ${this.mcpToolsContext.length} MCP tool definitions`);
    } catch (error) {
      console.error('[AI Service] Failed to initialize:', error);
      // Set fallback defaults
      this.availableCategories = ["electronics", "jewelery", "men's clothing", "women's clothing"];
      this.mcpToolsContext = [
        { name: "search_products", description: "Search products with filters" },
        { name: "add_to_cart", description: "Add products to cart" }
      ];
      throw new Error('Failed to initialize AI service');
    }
  }

  /**
   * Load available categories dynamically from CategoryService
   */
  private async loadAvailableCategories(): Promise<void> {
    try {
      const result = await this.categoryService.getAllCategories();
      if (result.success && Array.isArray(result.data)) {
        this.availableCategories = result.data;
        console.log('[AI Service] Loaded dynamic categories:', this.availableCategories);
      } else {
        throw new Error('Failed to fetch categories from CategoryService');
      }
    } catch (error) {
      console.error('[AI Service] Error loading categories:', error);
      // Use fallback categories
      this.availableCategories = ["electronics", "jewelery", "men's clothing", "women's clothing"];
    }
  }

  /**
   * Build MCP tools context from centralized tool definitions
   */
  private buildMCPToolsContext(): void {
    try {
      this.mcpToolsContext = getMCPToolsContext();
      console.log('[AI Service] Built MCP tools context from centralized definitions:', this.mcpToolsContext.length, 'tools');
    } catch (error) {
      console.error('[AI Service] Error building MCP tools context:', error);
      // Fallback MCP tools context
      this.mcpToolsContext = [
        { name: "products.search", description: "Advanced product search with filtering" },
        { name: "cart.add", description: "Add products to user cart" },
        { name: "cart.get", description: "Get user cart contents" }
      ];
    }
  }

  /**
   * Process query using AI Server + MCP Tools
   * Returns structured response with UI handlers for frontend
   */
  async processQuery(
    query: string,
    context: { userId?: number } = {},
    conversationHistory: ConversationMessage[] = []
  ): Promise<{
    success: boolean;
    message: string;
    intent: string;
    data?: any;
    uiHandlers?: string[];
    metadata?: any;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`[AI Service] Processing query: "${query}"`);

    try {
      // Step 1: Get AI analysis from AI server (just intent classification)
      const aiAnalysis = await this.getAIAnalysis(query, conversationHistory);
      console.log(`[AI Service] AI Analysis:`, aiAnalysis);

      // Step 2: Execute appropriate tool based on intent
      const toolResult = await this.executeTool(aiAnalysis, query, context);
      console.log(`[AI Service] Tool execution completed`);

      // Step 3: Format and return structured response with UI handlers
      return this.formatStructuredResponse(toolResult, aiAnalysis, query);

    } catch (error) {
      console.error('[AI Service] Error processing query:', error);
      return {
        success: false,
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        intent: 'error',
        uiHandlers: []
      };
    }
  }

  /**
   * Get AI analysis from AI server (intent classification with dynamic data)
   */
  private async getAIAnalysis(query: string, conversationHistory: ConversationMessage[]) {
    const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${aiServerUrl}/app-reason`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: "nextshop",
          user_query: query,
          available_categories: this.availableCategories,
          conversation_history: conversationHistory,
          mcp_tools_context: this.mcpToolsContext
        })
      });

      const result = await response.json();
      
      // AI Server returns the JSON directly for NextShop (no nesting)
      console.log('[AI Service] Raw AI Server response:', JSON.stringify(result, null, 2));
      
      // Return the result directly since AI server returns LLM JSON for NextShop
      return result || {
        intent: 'product_search',
        confidence: 0.7,
        message: null
      };
    } catch (error) {
      console.error('[AI Service] AI Server error:', error);
      // Fallback to basic product search
      return {
        intent: 'product_search',
        categories: [],
        product_items: [query],
        confidence: 0.5,
        message: null
      };
    }
  }

  /**
   * Execute the appropriate MCP tool based on AI analysis
   */
  private async executeTool(aiAnalysis: any, query: string, context: any) {
    const { intent, confidence } = aiAnalysis;

    console.log(`[AI Service] Executing tool for intent: ${intent}`);

    try {
      switch (intent) {
        case 'product_search':
          return await mcpClient.callTool('products.search', {
            query: query,
            intent: 'product_search',
            categories: aiAnalysis.categories || [],
            product_items: aiAnalysis.product_items || [],
            variants: aiAnalysis.variants || [],
            constraints: aiAnalysis.constraints || {},
            ui_handlers: aiAnalysis.ui_handlers || []
          });

        case 'ui_handling_action':
          // Handle UI actions like "add to cart", "login", etc.
          if (query.toLowerCase().includes('cart') && query.toLowerCase().includes('add')) {
            return {
              success: true,
              result: {
                intent: 'ui_handling_action',
                action: 'add_to_cart',
                message: 'I can help you add items to your cart. Please specify which product you want to add.'
              }
            };
          }
          break;

        case 'general_chat':
          return {
            success: true,
            result: {
              intent: 'general_chat',
              message: aiAnalysis.message || 'I am here to help you with shopping. What can I help you find today?'
            }
          };

        default:
          // Default to product search for unknown intents
          return await mcpClient.callTool('products.search', {
            query: query,
            intent: 'product_search',
            categories: [],
            product_items: [query],
            constraints: {},
            ui_handlers: []
          });
      }
    } catch (error) {
      console.error('[AI Service] Tool execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      };
    }
  }

  /**
   * Format tool result as structured response with UI handlers
   */
  private formatStructuredResponse(toolResult: any, aiAnalysis: any, query: string): {
    success: boolean;
    message: string;
    intent: string;
    data?: any;
    uiHandlers?: string[];
    metadata?: any;
  } {
    if (!toolResult.success) {
      return {
        success: false,
        message: 'I apologize, but I encountered an issue while searching. Please try again.',
        intent: aiAnalysis.intent || 'error',
        uiHandlers: []
      };
    }

    const result = toolResult.result;
    const llmHandlers = aiAnalysis.ui_handlers || result.uiHandlers || [];

    // Apply UI Handler Fallback - detect missed patterns in user query
    const hasProducts = result.success && result.data && result.totalFound > 0;
    const fallbackResult = UIHandlerFallback.applyFallbackHandlers(
      llmHandlers, 
      query, 
      hasProducts
    );
    
    const uiHandlers = fallbackResult.handlers;
    
    // Log fallback activity
    if (fallbackResult.appliedFallback) {
      console.log(`[AI Service] UI Fallback Applied - Original: [${llmHandlers.join(', ')}], Final: [${uiHandlers.join(', ')}]`);
      fallbackResult.fallbackMatches.forEach((match: any) => {
        console.log(`  - Detected: ${match.handler} (${match.confidence}% confidence) from "${match.matchedPattern}"`);
      });
    } else {
      console.log(`[AI Service] UI Fallback - No new handlers added`);
    }

    switch (result.intent || aiAnalysis.intent) {
      case 'product_search':
        if (result.success && result.data && result.totalFound > 0) {
          const products = result.data;
          // Use actual products count being returned, not the total found
          const actualProductsCount = Array.isArray(products) ? products.length : 0;
          const totalFound = result.totalFound;
          
          let message = `I found ${actualProductsCount} product${actualProductsCount > 1 ? 's' : ''} for you.`;
          
          // Add note if there are more products available than being shown
          if (totalFound > actualProductsCount) {
            message += ` (${totalFound} total matches available)`;
          }
          
          // Add context about filters applied
          if (aiAnalysis.categories?.length > 0) {
            message += ` Showing ${aiAnalysis.categories.join(', ')} category.`;
          }
          if (aiAnalysis.product_items?.length > 0) {
            message += ` Matching "${aiAnalysis.product_items.join(', ')}".`;
          }
          if (aiAnalysis.variants?.length > 0) {
            message += ` With variants: ${aiAnalysis.variants.join(', ')}.`;
          }

          return {
            success: true,
            message,
            intent: 'product_search',
            data: {
              products,
              totalFound: actualProductsCount, // Use actual products count 
              totalAvailable: totalFound, // Keep original for reference
              appliedFilters: result.filters,
              execution: result.execution,
              // Add uiActions if UI handlers were detected
              ...(uiHandlers.length > 0 && {
                uiActions: {
                  instructions: this.generateUIInstructions(uiHandlers),
                  handlers: uiHandlers
                }
              })
            },
            uiHandlers, // Keep for backward compatibility
            metadata: {
              confidence: aiAnalysis.confidence,
              processingSteps: result.execution?.steps,
              fallbackUsed: result.execution?.fallbackUsed
            }
          };
        } else {
          return {
            success: false,
            message: 'I couldn\'t find any products matching your search. Please try different keywords or browse our categories.',
            intent: 'product_search',
            data: { products: [], totalFound: 0 },
            uiHandlers
          };
        }

      case 'general_chat':
        return {
          success: true,
          message: result.message || 'How can I help you with shopping today?',
          intent: 'general_chat',
          uiHandlers
        };

      case 'ui_handling_action':
        return {
          success: true,
          message: result.message || 'I can help you with that action. What specifically would you like me to do?',
          intent: 'ui_handling_action',
          data: {
            ...(result.action && { action: result.action }),
            // Add uiActions for UI handler actions
            ...(uiHandlers.length > 0 && {
              uiActions: {
                instructions: this.generateUIInstructions(uiHandlers),
                handlers: uiHandlers
              }
            })
          },
          uiHandlers // Critical: UI handlers for frontend to process
        };

      default:
        return {
          success: true,
          message: 'I understand your request. How else can I help you today?',
          intent: 'general',
          uiHandlers
        };
    }
  }

  /**
   * Generate human-readable UI instructions from handlers
   */
  private generateUIInstructions(handlers: string[]): string[] {
    return handlers.map(handler => {
      switch (handler) {
        case 'cart.add':
          return 'Add products to cart';
        case 'cart.remove':
          return 'Remove products from cart';
        case 'wishlist.add':
          return 'Add products to wishlist';
        case 'wishlist.remove':
          return 'Remove products from wishlist';
        case 'auth.login':
          return 'Please log in to continue';
        case 'auth.logout':
          return 'Log out of account';
        default:
          return `Execute ${handler} action`;
      }
    });
  }

  /**
   * Add message to conversation history
   */
  addToHistory(role: string, content: string): void {
    this.conversationHistory.push({ role, content });
    
    // Keep only last 10 messages to prevent memory issues
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log('[AI Service] Conversation history cleared');
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; mcp: boolean; tools: string[] }> {
    try {
      const mcpConnected = mcpClient.isClientConnected();
      const availableTools = await mcpClient.listTools();
      
      return {
        status: mcpConnected ? 'healthy' : 'degraded',
        mcp: mcpConnected,
        tools: availableTools
      };
    } catch (error) {
      return {
        status: 'error',
        mcp: false,
        tools: []
      };
    }
  }
}
