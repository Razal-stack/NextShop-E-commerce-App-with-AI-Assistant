import { z } from "zod";
import axios from "axios";
import { Product, ProductFilters } from "../types";
import { ProductService } from "./productService";

// LLM Analysis Schema - matches AI server nested constraints format
const LLMAnalysisSchema = z.object({
  intent: z.enum(['product_search', 'ui_handling_action', 'general_chat']),
  categories: z.array(z.string()).optional(),
  product_items: z.array(z.string()).optional(),
  variants: z.array(z.string()).optional(),
  constraints: z.object({
    price: z.object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional()
    }).optional(),
    rating: z.number().nullable().optional()
  }).optional(),
  ui_handlers: z.array(z.string()).optional(),
  confidence: z.number(),
  message: z.string().nullable().optional() // For general chat responses
});

type LLMAnalysis = z.infer<typeof LLMAnalysisSchema>;

export interface ConversationMessage {
  role: string;
  content: string;
}

/**
 * LangChain-based AI Orchestrator
 * This handles all AI reasoning, tool orchestration, and execution planning
 * The AI server is just used for LLM inference
 */
export class AIOrchestrator {
  private aiServerUrl: string;
  private productService: ProductService;

  constructor() {
    this.aiServerUrl = process.env.AI_SERVER_URL || 'http://localhost:8000';
    this.productService = new ProductService();
  }

  /**
   * Main orchestration method - handles the entire query lifecycle
   */
  async processQuery(
    query: string,
    conversationHistory: ConversationMessage[] = [],
    userId?: number
  ) {
    console.log(`🧠 [AI Orchestrator] Processing query: "${query}"`);

    try {
      // Step 1: Get available categories dynamically
      const categories = await this.getAvailableCategories();
      console.log(`🏷️ [AI Orchestrator] Available categories: ${JSON.stringify(categories)}`);

      // Step 2: Get LLM analysis from AI server (just intent classification)
      const llmAnalysis = await this.getLLMAnalysis(query, categories, conversationHistory);
      console.log(`🤖 [AI Orchestrator] LLM Analysis: ${JSON.stringify(llmAnalysis, null, 2)}`);

      // Step 3: LangChain orchestration - decide what to do based on intent
      return await this.orchestrateExecution(query, llmAnalysis, conversationHistory);

    } catch (error) {
      console.error(`❌ [AI Orchestrator] Error processing query:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        intent: 'error',
        message: 'Sorry, I encountered an error processing your request.'
      };
    }
  }

  /**
   * Get LLM analysis from AI server (just intent classification, no execution planning)
   */
  private async getLLMAnalysis(
    query: string, 
    categories: string[], 
    conversationHistory: ConversationMessage[]
  ): Promise<LLMAnalysis> {
    console.log(`🔍 [AI Orchestrator] Requesting LLM analysis for: "${query}"`);
    
    try {
      const response = await axios.post(`${this.aiServerUrl}/app-reason`, {
        app_name: "nextshop",
        user_query: query,
        available_categories: categories,
        conversation_history: conversationHistory,
        mcp_tools_context: [{ name: "products.list", description: "Search products" }],
        ui_handlers_context: []
      });

      const analysis = response.data.query_analysis.detected_entities;
      
      // Validate the LLM response
      const parsed = LLMAnalysisSchema.safeParse(analysis);
      if (!parsed.success) {
        console.error(`❌ [AI Orchestrator] Invalid LLM analysis:`, parsed.error);
        throw new Error('Invalid LLM analysis format');
      }

      console.log(`✅ [AI Orchestrator] Valid LLM analysis received`);
      return parsed.data;

    } catch (error) {
      console.error(`❌ [AI Orchestrator] LLM analysis failed:`, error);
      throw new Error(`LLM analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * LangChain orchestration - decide execution path based on intent
   */
  private async orchestrateExecution(
    query: string, 
    analysis: LLMAnalysis, 
    conversationHistory: ConversationMessage[]
  ) {
    console.log(`🎯 [AI Orchestrator] Orchestrating execution for intent: ${analysis.intent}`);

    switch (analysis.intent) {
      case 'product_search':
        return await this.handleProductSearch(query, analysis);

      case 'ui_handling_action':
        return await this.handleUIAction(query, analysis);

      case 'general_chat':
        return await this.handleGeneralChat(query, analysis);

      default:
        return {
          success: true,
          intent: 'general_chat',
          message: 'I can help you with shopping questions. What are you looking for?',
          data: null
        };
    }
  }

  /**
   * Handle product search using MCP tools
   */
  private async handleProductSearch(query: string, analysis: LLMAnalysis) {
    console.log(`🛍️ [AI Orchestrator] Handling product search`);

    try {
      // Build search parameters from LLM analysis
      const searchParams = {
        intent: 'product_search',
        categories: analysis.categories || [],
        product_items: analysis.product_items || [],
        variants: analysis.variants || [],
        constraints: analysis.constraints || {},
        confidence: analysis.confidence,
        ui_handlers: analysis.ui_handlers || []
      };

      console.log(`🔧 [AI Orchestrator] Search parameters:`, JSON.stringify(searchParams, null, 2));

      // Import and use the MCP tool directly
      const { createListProductsTool } = await import('../mcp/tools/productTools');
      const productsTool = createListProductsTool(1); // userId = 1 for now
      
      // Execute the tool with JSON string input
      const toolResult = await productsTool.func(JSON.stringify(searchParams));
      const searchResult = JSON.parse(toolResult);

      if (searchResult.success) {
        const products = searchResult.products || [];
        const totalFound = searchResult.totalFound || 0;
        
        // Calculate price range
        let priceRange = '';
        if (totalFound > 0) {
          const prices = products.map((p: any) => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          priceRange = totalFound > 1 ? `£${minPrice} - £${maxPrice}` : `£${minPrice}`;
        }

        console.log(`✅ [AI Orchestrator] Found ${totalFound} products`);

        return {
          success: true,
          intent: 'product_search',
          data: {
            products: products,
            totalFound: totalFound,
            appliedFilters: searchResult.appliedFilters || {
              categories: analysis.categories,
              product_items: analysis.product_items,
              variants: analysis.variants,
              constraints: analysis.constraints
            },
            priceRange: priceRange
          },
          message: searchResult.message || `Found ${totalFound} product${totalFound !== 1 ? 's' : ''}${analysis.categories?.length ? ` in ${analysis.categories.join(', ')}` : ''}${analysis.product_items?.length ? ` matching "${analysis.product_items.join(', ')}"` : ''}${analysis.variants?.length ? ` with variants: ${analysis.variants.join(', ')}` : ''}.`
        };
      } else {
        throw new Error(searchResult.error || 'Product search failed');
      }

    } catch (error) {
      console.error(`❌ [AI Orchestrator] Product search failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        intent: 'product_search',
        message: 'Sorry, I couldn\'t search for products right now.'
      };
    }
  }

  /**
   * Handle UI actions (cart, login, etc.)
   */
  private async handleUIAction(query: string, analysis: LLMAnalysis) {
    console.log(`🎮 [AI Orchestrator] Handling UI action`);

    return {
      success: true,
      intent: 'ui_handling_action',
      data: {
        action: 'ui_action',
        query: query,
        instructions: 'Handle UI action on frontend'
      },
      message: 'I can help you with that. Let me guide you through the process.'
    };
  }

  /**
   * Handle general chat
   */
  private async handleGeneralChat(query: string, analysis: LLMAnalysis) {
    console.log(`💬 [AI Orchestrator] Handling general chat`);

    const message = analysis.message || 'I\'m here to help you with shopping. What can I help you find?';

    return {
      success: true,
      intent: 'general_chat',
      data: null,
      message: message
    };
  }

  /**
   * Get available categories dynamically
   */
  private async getAvailableCategories(): Promise<string[]> {
    console.log(`🏷️ [AI Orchestrator] Fetching dynamic categories...`);
    
    try {
      // Try categories.list tool first
      console.log(`🏷️ [AI Orchestrator] Using dedicated categories.list tool`);
      const categoriesResult = await this.productService.getAllCategories();
      
      if (categoriesResult.success && categoriesResult.data) {
        const categories = categoriesResult.data;
        console.log(`✅ [AI Orchestrator] Got dynamic categories from categories.list: ${JSON.stringify(categories)}`);
        return categories;
      }

      // Fallback: get categories from products
      console.log(`🏷️ [AI Orchestrator] Fallback: getting categories from products`);
      const productsResult = await this.productService.getAllProducts();
      
      if (productsResult.success && productsResult.data) {
        const uniqueCategories = [...new Set(productsResult.data.map((p: any) => p.category))];
        console.log(`✅ [AI Orchestrator] Got categories from products: ${JSON.stringify(uniqueCategories)}`);
        return uniqueCategories;
      }

      throw new Error('Failed to fetch categories');
    } catch (error) {
      console.error(`❌ [AI Orchestrator] Failed to get categories:`, error);
      return ['electronics', 'jewelery', "men's clothing", "women's clothing"]; // Hardcoded fallback
    }
  }
}
