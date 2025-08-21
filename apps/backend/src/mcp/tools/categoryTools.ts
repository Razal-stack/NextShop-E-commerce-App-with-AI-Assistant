import { DynamicTool } from "@langchain/core/tools";
import { ProductService } from "../../services/productService";

export const createGetCategoriesTools = () =>
  new DynamicTool({
    name: "categories.list",
    description: "Get all available product categories from the store. Use this FIRST before any product search to get dynamic category constraints for better filtering.",
    func: async (input: string) => {
      try {
        const productService = new ProductService();
        const result = await productService.getAllCategories();
        
        if (result.success) {
          return JSON.stringify({
            success: true,
            categories: result.data || [],
            message: `Found ${(result.data || []).length} categories available in the store.`,
            usage: "Use these categories to filter products or provide category-specific recommendations."
          });
        } else {
          return JSON.stringify({
            success: false,
            error: result.error || 'Failed to fetch categories'
          });
        }
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
  });
