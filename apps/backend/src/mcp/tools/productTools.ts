/**
 * PRODUCT SEARCH TOOLS - CLEAN MINIMALIST VERSION
 * Uses single ProductSearchEngine for all functionality
 */

import { DynamicTool } from "langchain/tools";
import { ProductSearchEngine } from './productSearchEngine';

/**
 * MAIN PRODUCT SEARCH TOOL
 * Handles all product search requests efficiently
 */
export const searchProductsTool = new DynamicTool({
  name: "search_products",
  description: `Advanced product search with filtering, fallback, and AI integration.
  
  Supports: category filtering, price/rating constraints, search with fallback,
  variant filtering, intelligent scoring, gift mode, UI handlers.
  
  Input JSON Schema:
  {
    "query": "search query",
    "intent": "product_search|ui_handling_action|general_chat",
    "categories": ["electronics", "jewelery", "men's clothing", "women's clothing"],
    "product_items": ["specific product names"],
    "constraints": {
      "price": {"min": number, "max": number},
      "rating": number,
      "limit": number,
      "gift": boolean,
      "occasion": "birthday|christmas|anniversary"
    },
    "variants": ["red", "large", "cotton"],
    "ui_handlers": ["cart.add", "wishlist.add"]
  }`,
  
  func: async (input: string): Promise<string> => {
    try {
      console.log('\n[PRODUCT SEARCH] Processing request');
      
      let searchData: any;
      try {
        searchData = JSON.parse(input);
      } catch (parseError) {
        console.error('[ERROR] Invalid JSON input:', parseError);
        return JSON.stringify({
          success: false,
          error: "Invalid JSON input",
          data: []
        });
      }
      
      // Validate basic requirements
      if (!searchData.intent && !searchData.query) {
        return JSON.stringify({
          success: false,
          error: "No intent or query provided",
          data: []
        });
      }
      
      // Execute search
      const result = await ProductSearchEngine.search(searchData);
      
      console.log(`[SEARCH COMPLETE] ${result.data.length} products in ${result.execution.timeMs}ms`);
      return JSON.stringify(result);
      
    } catch (error) {
      console.error('[ERROR] Product search failed:', error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      });
    }
  }
});

// Export only the main search tool
export const productTools = [
  searchProductsTool
];
