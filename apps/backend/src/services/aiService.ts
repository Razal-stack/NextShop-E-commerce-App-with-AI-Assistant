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
   * Process image query using AI Server + MCP Tools
   * Combines image analysis with text processing
   */
  async processImageQuery(
    query: string,
    imageData: string,
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

    console.log(`[AI Service] Processing image query: "${query}"`);

    try {
      // Step 1: Get AI analysis from AI server with image
      const aiAnalysis = await this.getAIImageAnalysis(query, imageData, conversationHistory);
      console.log(`[AI Service] AI Image Analysis:`, aiAnalysis);

      // Step 2: Execute appropriate tool based on intent (same as text)
      const toolResult = await this.executeTool(aiAnalysis, query, context);
      console.log(`[AI Service] Tool execution completed`);

      // Step 3: Format and return structured response with image metadata
      const response = this.formatStructuredResponse(toolResult, aiAnalysis, query);
      
      // Add image analysis metadata to the response
      if (response.metadata) {
        response.metadata.imageAnalysis = aiAnalysis.image_description || 'Image analyzed';
        response.metadata.hasImage = true;
      } else {
        response.metadata = {
          imageAnalysis: aiAnalysis.image_description || 'Image analyzed',
          hasImage: true
        };
      }

      return response;

    } catch (error) {
      console.error('[AI Service] Error processing image query:', error);
      return {
        success: false,
        message: 'I apologize, but I encountered an error processing your image request. Please try again.',
        intent: 'error',
        uiHandlers: [],
        metadata: { hasImage: true, imageError: true }
      };
    }
  }

  /**
   * Get AI analysis from AI server (intent classification with dynamic data)
   * Includes smart fallback mechanisms and retry logic
   */
  private async getAIAnalysis(query: string, conversationHistory: ConversationMessage[]) {
    const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:8000';
    const maxRetries = 2;
    const timeoutMs = 240000; // 4 minute timeout for very slow local models
    
    // Smart fallback analysis based on query patterns
    const smartFallback = this.createSmartFallback(query);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI Service] AI Server attempt ${attempt}/${maxRetries}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const response = await fetch(`${aiServerUrl}/app-reason`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_name: "nextshop",
            user_query: query,
            available_categories: this.availableCategories,
            conversation_history: conversationHistory,
            mcp_tools_context: this.mcpToolsContext
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`AI Server responded with status: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        
        // Validate AI server response structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid AI server response format');
        }
        
        // AI Server returns the JSON directly for NextShop (no nesting)
        console.log(`[AI Service] ✅ AI Server success on attempt ${attempt}:`, JSON.stringify(result, null, 2));
        
        // Enhance AI result with fallback validation
        const validatedResult = this.validateAndEnhanceAIResult(result, smartFallback);
        
        return validatedResult;
      } catch (error) {
        console.error(`[AI Service] AI Server attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, use smart fallback
        if (attempt === maxRetries) {
          console.log('[AI Service] 🔄 All AI Server attempts failed, using smart fallback');
          
          return {
            ...smartFallback,
            fallbackUsed: true,
            fallbackReason: error instanceof Error ? error.message : 'AI server communication failed',
            confidence: Math.max(0.3, smartFallback.confidence - 0.2) // Reduce confidence for fallback
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    // This shouldn't be reached, but just in case
    return smartFallback;
  }

  /**
   * Get AI analysis from AI server with image (intent classification + image analysis)
   * Includes smart fallback mechanisms and retry logic for image queries
   */
  private async getAIImageAnalysis(query: string, imageData: string, conversationHistory: ConversationMessage[]) {
    const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:8000';
    const maxRetries = 2;
    const timeoutMs = 240000; // 4 minute timeout for image processing (vision models can be slow on first load)
    
    // Validate image data format first
    if (!imageData.startsWith('data:image/')) {
      console.error('[AI Service] Invalid image data format');
      const fallback = this.createSmartFallback(query);
      return {
        ...fallback,
        image_description: 'Invalid image format - processed text query only',
        imageError: true,
        fallbackUsed: true,
        fallbackReason: 'Invalid image data format'
      };
    }

    // Check image size to prevent oversized uploads
    const imageSizeKB = Math.round((imageData.length * 3/4) / 1024);
    if (imageSizeKB > 5000) { // 5MB limit
      console.warn(`[AI Service] Large image detected: ${imageSizeKB}KB`);
    }
    
    // Smart fallback for image queries
    const smartFallback = this.createSmartFallback(query);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI Service] AI Image Server attempt ${attempt}/${maxRetries} (${imageSizeKB}KB image)`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(`${aiServerUrl}/app-image-reason`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_name: "nextshop",
            user_query: query,
            image_data: imageData,
            image_format: "jpeg", // Could be extracted from data URL
            available_categories: this.availableCategories,
            conversation_history: conversationHistory,
            mcp_tools_context: this.mcpToolsContext
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`AI Server responded with status: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        
        // Validate AI server response structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid AI server response format');
        }
        
        console.log(`[AI Service] ✅ AI Image Server success on attempt ${attempt}`);
        
        // Validate required fields from NextShop config and enhance with fallback
        const validatedResult = this.validateAndEnhanceAIResult(result, smartFallback);
        
        // Add image-specific fields
        validatedResult.image_description = result.image_description || 'Image analyzed successfully';
        validatedResult.hasImage = true;
        
        return validatedResult;
      } catch (error) {
        console.error(`[AI Service] AI Image Server attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, use smart fallback
        if (attempt === maxRetries) {
          console.log('[AI Service] 🔄 All AI Image Server attempts failed, using smart fallback with image context');
          
          return {
            ...smartFallback,
            image_description: 'Image analysis failed, processing text query only',
            imageError: true,
            fallbackUsed: true,
            fallbackReason: error instanceof Error ? error.message : 'AI image server communication failed',
            confidence: Math.max(0.3, smartFallback.confidence - 0.2), // Reduce confidence for fallback
            hasImage: true
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
      }
    }
    
    // This shouldn't be reached, but just in case
    return {
      ...smartFallback,
      image_description: 'Image processing failed completely',
      imageError: true,
      fallbackUsed: true,
      hasImage: true
    };
  }

  /**
   * Execute the appropriate MCP tool based on AI analysis
   * Includes fallback mechanisms when tool execution fails
   */
  private async executeTool(aiAnalysis: any, query: string, context: any) {
    const { intent, confidence } = aiAnalysis;

    console.log(`[AI Service] Executing tool for intent: ${intent} (confidence: ${confidence})`);

    try {
      switch (intent) {
        case 'product_search':
          return await this.executeProductSearchWithFallback(aiAnalysis, query, context);

        case 'ui_handling_action':
          // Handle UI actions like "add to cart", "login", etc.
          return await this.executeUIAction(aiAnalysis, query, context);

        case 'general_chat':
          return {
            success: true,
            result: {
              intent: 'general_chat',
              message: aiAnalysis.message || this.generateChatResponse(query),
              success: true
            }
          };

        default:
          // Default to product search for unknown intents with fallback
          console.log(`[AI Service] Unknown intent "${intent}", defaulting to product search`);
          return await this.executeProductSearchWithFallback({
            ...aiAnalysis,
            intent: 'product_search'
          }, query, context);
      }
    } catch (error) {
      console.error('[AI Service] Tool execution error:', error);
      
      // Final fallback - return basic structure
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        result: {
          intent: 'error',
          message: 'I apologize, but I encountered an error. Please try again.',
          success: false,
          fallbackUsed: true
        }
      };
    }
  }

  /**
   * Execute product search with multiple fallback levels
   */
  private async executeProductSearchWithFallback(aiAnalysis: any, query: string, context: any) {
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI Service] Product search attempt ${attempt}/${maxRetries}`);
        
        const result = await mcpClient.callTool('products.search', {
          query: query,
          intent: 'product_search',
          categories: aiAnalysis.categories || [],
          product_items: aiAnalysis.product_items || [],
          variants: aiAnalysis.variants || [],
          constraints: aiAnalysis.constraints || {},
          ui_handlers: aiAnalysis.ui_handlers || []
        });
        
        // Check if we got meaningful results
        if (result.success && result.result?.data && result.result.totalFound > 0) {
          console.log(`[AI Service] ✅ Product search successful on attempt ${attempt}`);
          return result;
        }
        
        // If no products found but call succeeded, try broader search
        if (result.success && result.result?.totalFound === 0) {
          console.log(`[AI Service] No products found, trying broader search...`);
          
          const broaderResult = await mcpClient.callTool('products.search', {
            query: query,
            intent: 'product_search',
            categories: [], // Remove category filter
            product_items: aiAnalysis.product_items || [], // Don't add raw query to product_items!
            variants: [],
            constraints: {},
            ui_handlers: aiAnalysis.ui_handlers || []
          });
          
          if (broaderResult.success && broaderResult.result?.totalFound > 0) {
            console.log(`[AI Service] ✅ Broader search successful`);
            // Mark that we used fallback
            broaderResult.result.execution = {
              ...broaderResult.result.execution,
              fallbackUsed: true,
              fallbackType: 'broader_search'
            };
            return broaderResult;
          }
        }
        
        throw new Error(`Search attempt ${attempt} failed or returned no results`);
        
      } catch (error) {
        console.error(`[AI Service] Product search attempt ${attempt} error:`, error);
        
        if (attempt === maxRetries) {
          // Final fallback - return empty results with helpful message
          console.log('[AI Service] 🔄 All product search attempts failed, using empty result fallback');
          
          return {
            success: true, // Success = true so UI doesn't show error
            result: {
              intent: 'product_search',
              data: [],
              totalFound: 0,
              message: 'No products found',
              success: false, // Inner success = false to indicate no products
              execution: {
                fallbackUsed: true,
                fallbackType: 'empty_results',
                fallbackReason: error instanceof Error ? error.message : 'Search service unavailable'
              }
            }
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    // This shouldn't be reached but provides final safety net
    return {
      success: false,
      error: 'All search attempts exhausted'
    };
  }

  /**
   * Execute UI action with fallback handling
   */
  private async executeUIAction(aiAnalysis: any, query: string, context: any) {
    try {
      // Analyze what UI action is requested
      if (query.toLowerCase().includes('cart') && query.toLowerCase().includes('add')) {
        return {
          success: true,
          result: {
            intent: 'ui_handling_action',
            action: 'add_to_cart',
            message: 'I can help you add items to your cart. Please specify which product you want to add, or let me search for products first.',
            success: true
          }
        };
      }
      
      if (query.toLowerCase().includes('login') || query.toLowerCase().includes('sign in')) {
        return {
          success: true,
          result: {
            intent: 'ui_handling_action',
            action: 'login',
            message: 'Please use the login button to sign into your account.',
            success: true
          }
        };
      }
      
      // Generic UI action response
      return {
        success: true,
        result: {
          intent: 'ui_handling_action',
          message: 'I understand you want to perform an action. How can I help you specifically?',
          success: true
        }
      };
      
    } catch (error) {
      console.error('[AI Service] UI action execution error:', error);
      return {
        success: false,
        result: {
          intent: 'ui_handling_action',
          message: 'I encountered an issue processing that action. Please try again.',
          success: false
        }
      };
    }
  }

  /**
   * Generate contextual chat response for general conversations
   */
  private generateChatResponse(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('hey')) {
      return 'Hello! I\'m here to help you find great products. What are you looking for today?';
    }
    
    if (lowerQuery.includes('help')) {
      return 'I can help you search for products, add items to your cart, and navigate our store. What would you like to do?';
    }
    
    if (lowerQuery.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you find?';
    }
    
    // Default friendly response
    return 'I\'m here to help you with shopping. You can ask me to search for products, help with your cart, or just chat!';
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; mcp: boolean; tools: string[]; aiServer: boolean }> {
    try {
      const mcpConnected = mcpClient.isClientConnected();
      const availableTools = await mcpClient.listTools();
      
      // Test AI server connection
      let aiServerHealthy = false;
      try {
        const aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:8000';
        const response = await fetch(`${aiServerUrl}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        aiServerHealthy = response.ok;
      } catch (error) {
        console.log('[AI Service] AI server health check failed:', error);
        aiServerHealthy = false;
      }
      
      const overallStatus = mcpConnected && aiServerHealthy ? 'healthy' : 
                           mcpConnected || aiServerHealthy ? 'degraded' : 'error';
      
      return {
        status: overallStatus,
        mcp: mcpConnected,
        aiServer: aiServerHealthy,
        tools: availableTools
      };
    } catch (error) {
      return {
        status: 'error',
        mcp: false,
        aiServer: false,
        tools: []
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
   * Create smart fallback analysis based on query patterns
   * Uses regex and keyword matching to determine likely intent
   */
  private createSmartFallback(query: string): any {
    const lowerQuery = query.toLowerCase().trim();
    console.log(`[AI Service] Creating smart fallback for: "${query}"`);
    
    // Category detection patterns
    const categoryPatterns = [
      { pattern: /\b(electronics?|electronic|tech|phone|laptop|computer|gadget)\b/gi, category: 'electronics' },
      { pattern: /\b(jewelry|jewellery|ring|necklace|bracelet|earring)\b/gi, category: 'jewelery' },
      { pattern: /\b(men['s]*|male|guy|gentleman)\s*(clothing|clothes|shirt|pant|jacket)\b/gi, category: "men's clothing" },
      { pattern: /\b(women['s]*|female|lady|girl)\s*(clothing|clothes|dress|shirt|blouse)\b/gi, category: "women's clothing" },
      // General clothing patterns - both categories for trending/popular items
      { pattern: /\b(trending|fashionable|stylish|popular|hot|latest)\s*(clothes|clothing|fashion|apparel|items)\b/gi, category: "men's clothing" },
      { pattern: /\b(trending|fashionable|stylish|popular|hot|latest)\s*(clothes|clothing|fashion|apparel|items)\b/gi, category: "women's clothing" },
      // Just "clothes" without gender - include both
      { pattern: /\b(clothes|clothing|fashion|apparel)\b/gi, category: "men's clothing" },
      { pattern: /\b(clothes|clothing|fashion|apparel)\b/gi, category: "women's clothing" }
    ];
    
    // Intent detection patterns
    const intentPatterns = [
      { pattern: /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/gi, intent: 'general_chat', confidence: 0.9 },
      { pattern: /\b(help|assist|support|guide)\b/gi, intent: 'general_chat', confidence: 0.8 },
      { pattern: /\b(add.*cart|cart.*add|buy|purchase|checkout)\b/gi, intent: 'ui_handling_action', confidence: 0.8 },
      { pattern: /\b(login|log.*in|sign.*in|account)\b/gi, intent: 'ui_handling_action', confidence: 0.8 },
      { pattern: /\b(search|find|look|show|get|want|need)\b/gi, intent: 'product_search', confidence: 0.7 }
    ];
    
    // UI handler detection patterns
    const uiHandlerPatterns = [
      { pattern: /\b(add.*cart|cart.*add|put.*cart)\b/gi, handler: 'cart.add' },
      { pattern: /\b(remove.*cart|cart.*remove|delete.*cart)\b/gi, handler: 'cart.remove' },
      { pattern: /\b(wishlist|wish.*list|favorite|save.*later)\b/gi, handler: 'wishlist.add' },
      { pattern: /\b(login|log.*in|sign.*in)\b/gi, handler: 'auth.login' },
      { pattern: /\b(logout|log.*out|sign.*out)\b/gi, handler: 'auth.logout' }
    ];
    
    // Detect categories
    const detectedCategories: string[] = [];
    categoryPatterns.forEach(({ pattern, category }) => {
      if (pattern.test(lowerQuery)) {
        detectedCategories.push(category);
      }
    });
    
    // Detect intent
    let detectedIntent = 'product_search'; // Default
    let maxConfidence = 0.5;
    intentPatterns.forEach(({ pattern, intent, confidence }) => {
      if (pattern.test(lowerQuery) && confidence > maxConfidence) {
        detectedIntent = intent;
        maxConfidence = confidence;
      }
    });
    
    // Detect UI handlers
    const detectedHandlers: string[] = [];
    uiHandlerPatterns.forEach(({ pattern, handler }) => {
      if (pattern.test(lowerQuery)) {
        detectedHandlers.push(handler);
      }
    });
    
    // Extract product items (simple keyword extraction)
    const commonWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = lowerQuery
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 3); // Limit to first 3 meaningful words
    
    // Create a more intelligent fallback without adding raw words to product_items
    const fallback = {
      intent: detectedIntent,
      categories: detectedCategories,
      product_items: [], // Don't add raw words - let search engine handle query matching
      constraints: {},
      ui_handlers: detectedHandlers,
      variants: [],
      confidence: maxConfidence,
      execution_plan: {
        steps: [{
          step_number: 1,
          step_type: detectedIntent,
          tool_name: detectedIntent === 'product_search' ? 'products.search' : 'general.chat'
        }]
      },
      smartFallback: true
    };
    
    console.log(`[AI Service] Smart fallback created:`, JSON.stringify(fallback, null, 2));
    return fallback;
  }

  /**
   * Clean product items by removing articles and converting to singular form
   */
  private cleanProductItems(items: string[]): string[] {
    if (!Array.isArray(items)) return [];
    
    const stopWords = ['the', 'a', 'an', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were'];
    
    // Simple plural to singular conversion rules
    const pluralToSingular = (word: string): string => {
      const lower = word.toLowerCase();
      if (lower.endsWith('ies')) return word.slice(0, -3) + 'y'; // batteries → battery
      if (lower.endsWith('ves')) return word.slice(0, -3) + 'f'; // knives → knife  
      if (lower.endsWith('ses') || lower.endsWith('xes') || lower.endsWith('zes')) return word.slice(0, -2); // dresses → dress
      if (lower.endsWith('s') && !lower.endsWith('ss')) return word.slice(0, -1); // jackets → jacket
      return word; // already singular or irregular
    };
    
    const cleaned = items
      .map(item => {
        if (!item || typeof item !== 'string') return '';
        
        // Split into words and filter out articles/stop words
        const cleanWords = item
          .toLowerCase()
          .split(/\s+/)
          .filter(word => {
            // Remove stop words and empty strings
            return word.length > 0 && !stopWords.includes(word.trim());
          })
          .map(word => pluralToSingular(word.trim())); // Convert to singular
        
        // Join back and capitalize first letter
        const cleaned = cleanWords.join(' ');
        return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
      })
      .filter(item => item.length > 0); // Remove empty strings
    
    // Log the cleanup for debugging
    if (items.length !== cleaned.length || JSON.stringify(items) !== JSON.stringify(cleaned)) {
      console.log(`🧹 Product items cleaned: ${JSON.stringify(items)} → ${JSON.stringify(cleaned)}`);
    }
    
    return cleaned;
  }

  /**
   * Validate and enhance AI result with fallback data
   * Ensures all required fields are present and reasonable
   * TRUST AI SERVER RESULTS when they're valid!
   */
  private validateAndEnhanceAIResult(aiResult: any, fallback: any): any {
    // Clean product items before processing
    const cleanedProductItems = this.cleanProductItems(aiResult.product_items);
    
    // Trust AI server's intent if it's valid, only fallback if missing/invalid
    const validIntents = ['product_search', 'ui_handling_action', 'general_chat'];
    const useAIIntent = aiResult.intent && validIntents.includes(aiResult.intent);
    
    const enhanced = {
      intent: useAIIntent ? aiResult.intent : fallback.intent,
      categories: Array.isArray(aiResult.categories) ? aiResult.categories : fallback.categories,
      product_items: cleanedProductItems.length > 0 ? cleanedProductItems : fallback.product_items,
      constraints: (aiResult.constraints && typeof aiResult.constraints === 'object') ? aiResult.constraints : fallback.constraints,
      ui_handlers: Array.isArray(aiResult.ui_handlers) ? aiResult.ui_handlers : fallback.ui_handlers,
      variants: Array.isArray(aiResult.variants) ? aiResult.variants : fallback.variants,
      confidence: typeof aiResult.confidence === 'number' ? aiResult.confidence : fallback.confidence,
      execution_plan: aiResult.execution_plan || fallback.execution_plan,
      // Preserve any additional fields from AI result
      ...Object.keys(aiResult).reduce((acc: any, key) => {
        if (!['intent', 'categories', 'product_items', 'constraints', 'ui_handlers', 'variants', 'confidence', 'execution_plan'].includes(key)) {
          acc[key] = aiResult[key];
        }
        return acc;
      }, {})
    };
    
    // Validate category names against available categories
    if (enhanced.categories.length > 0) {
      enhanced.categories = enhanced.categories.filter((cat: string) => 
        this.availableCategories.includes(cat)
      );
    }
    
    // REMOVED BAD LOGIC: Don't override empty product_items for category searches!
    // Empty product_items is CORRECT for "find electronics" type searches
    
    console.log(`[AI Service] Enhanced AI result:`, JSON.stringify(enhanced, null, 2));
    return enhanced;
  }
}
