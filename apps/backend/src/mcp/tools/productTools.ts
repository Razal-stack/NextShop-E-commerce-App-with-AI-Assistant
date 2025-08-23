import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import { ProductService } from "../../services/productService";
import { QueryParser } from "../../utils/queryParser";
import { ProductScoringEngine } from "../../utils/productScoring";

const listProductsSchema = z.object({
  // Simple parameters
  query: z.string().optional(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(10),
  sort: z.enum(['asc', 'desc', 'rating', 'price-low', 'price-high', 'relevance']).default('relevance'),
  budget: z.number().optional(),
  minRating: z.number().min(0).max(5).optional(),
  priceMax: z.number().optional(),
  priceMin: z.number().optional(),
  
  // LLM analysis structure
  intent: z.string().optional(),
  confidence: z.number().optional(),
  constraints: z.object({
    price: z.object({
      min: z.number().optional().nullable(),
      max: z.number().optional().nullable(),
    }).optional(),
    rating: z.number().optional().nullable(),
  }).optional(),
  product_items: z.array(z.string()).optional(),
  variants: z.array(z.string()).optional(), // Simple array of keywords
  ui_handlers: z.array(z.any()).optional(),
});

export const createListProductsTool = (userId: number) =>
  new DynamicTool({
    name: "products.list",
    description: "Search and list products with intelligent scoring and filtering. Supports natural language queries, category filtering, price constraints, and dynamic ranking based on relevance, rating, popularity, and price preferences. Always dynamically fetches available categories first.",
    func: async (input: string) => {
      let searchData: any;
      try {
        console.log(`🔧 [ProductTools] Raw input received: ${input}`);
        searchData = JSON.parse(input);
        console.log(`🔧 [ProductTools] Parsed searchData:`, JSON.stringify(searchData, null, 2));
        
        const parsed = listProductsSchema.safeParse(searchData);
        if (!parsed.success) {
          console.log(`❌ [ProductTools] Schema validation failed:`, parsed.error);
          return JSON.stringify({
            success: false,
            error: "Invalid search parameters",
            expected: "JSON with optional query, category, limit, sort, budget, minRating, priceMax, priceMin"
          });
        }
        searchData = parsed.data;
        console.log(`✅ [ProductTools] Schema validated, final searchData:`, JSON.stringify(searchData, null, 2));
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: "Invalid JSON input format"
        });
      }

      try {
        const productService = new ProductService();
        
        // Get ALL products first
        const allProductsResult = await productService.getAllProducts();
        let products = allProductsResult.success ? allProductsResult.data || [] : [];
        
        console.log(`📦 Start with ALL products: ${products.length}`);
        
        // Get all available categories for comparison
        const categoriesResult = await productService.getAllCategories();
        const allCategories = categoriesResult.success ? categoriesResult.data || [] : [];
        console.log(`📂 All available categories: ${JSON.stringify(allCategories)}`);
        
        // Category filtering logic - only apply if specific categories requested
        const llmCategories = searchData.categories;
        const singleCategory = searchData.category;
        
        if (singleCategory) {
          products = products.filter((p: any) => p.category === singleCategory);
          console.log(`📂 Applied single category "${singleCategory}": ${products.length} products`);
        } else if (llmCategories && llmCategories.length > 0) {
          // CRITICAL FIX: Only filter if LLM categories are SUBSET of all categories
          const isSubset = llmCategories.length < allCategories.length && 
                          llmCategories.every((cat: string) => allCategories.includes(cat));
          
          if (isSubset) {
            products = products.filter((p: any) => llmCategories.includes(p.category));
            console.log(`📂 Applied category subset ${llmCategories.join(', ')}: ${products.length} products`);
          } else {
            console.log(`📂 Skipped category filter (all categories requested or invalid subset)`);
          }
        }

        // IF constraints exist, apply them (prioritize nested price format)
        const constraints = searchData.constraints;
        const priceMax = constraints?.price?.max || constraints?.max || searchData.budget || searchData.priceMax;
        const priceMin = constraints?.price?.min || constraints?.min || searchData.priceMin;
        const ratingMin = constraints?.rating || searchData.minRating;
        
        if (priceMax) {
          products = products.filter((p: any) => p.price <= priceMax);
          console.log(`💰 Applied price max £${priceMax}: ${products.length} products`);
        }
        
        if (priceMin) {
          products = products.filter((p: any) => p.price >= priceMin);
          console.log(`💰 Applied price min £${priceMin}: ${products.length} products`);
        }
        
        if (ratingMin) {
          products = products.filter((p: any) => p.rating.rate >= ratingMin);
          console.log(`⭐ Applied rating min ${ratingMin}: ${products.length} products`);
        }

        // IF product items exist AND are specific products (not generic terms), apply search filter
        const productItems = searchData.product_items || [];
        
        // Filter out product items that match category names (they're redundant)
        const filteredProductItems = productItems.filter((item: string) => {
          const itemLower = item.toLowerCase();
          return !allCategories.some((category: string) => 
            category.toLowerCase() === itemLower || 
            category.toLowerCase().includes(itemLower) ||
            itemLower.includes(category.toLowerCase())
          );
        });
        
        const searchQuery = filteredProductItems.length > 0 ? filteredProductItems.join(' ') : (searchData.query || '');
        
        console.log(`🏷️ Product items: [${productItems.join(', ')}]`);
        console.log(`🧹 Filtered items (removing category names): [${filteredProductItems.join(', ')}]`);
        console.log(`🔍 Final search query: "${searchQuery}"`);
        
        // Skip search if query contains generic terms or is empty
        const genericTerms = ['product', 'products', 'item', 'items', 'thing', 'things', 'stuff'];
        const isGenericQuery = !searchQuery || genericTerms.some(term => 
          searchQuery.toLowerCase().trim() === term || searchQuery.toLowerCase().includes(`${term} `)
        );
        
        if (searchQuery && searchQuery.trim() && !isGenericQuery) {
          const searchTerm = searchQuery.toLowerCase();
          products = products.filter((p: any) => {
            const title = p.title.toLowerCase();
            const description = p.description.toLowerCase();
            return title.includes(searchTerm) || description.includes(searchTerm);
          });
          console.log(`🔍 Applied search "${searchQuery}": ${products.length} products`);
        } else if (searchQuery) {
          console.log(`🔍 Skipped generic/empty search "${searchQuery}"`);
        }

        // IF variants exist, apply variant filter
        const variants = searchData.variants || [];
        
        if (variants.length > 0) {
          variants.forEach((variant: string) => {
            const variantLower = variant.toLowerCase();
            products = products.filter((p: any) => {
              const title = p.title.toLowerCase();
              const description = p.description.toLowerCase();
              return title.includes(variantLower) || description.includes(variantLower);
            });
            console.log(`🎨 Applied variant "${variant}": ${products.length} products`);
          });
        }

        // Final result - slice to limit
        const finalProducts = products.slice(0, searchData.limit);
        console.log(`✅ Final result: ${finalProducts.length} products (from ${products.length} total)`);
        
        return JSON.stringify({
          success: true,
          products: finalProducts,
          totalFound: products.length,
          query: searchQuery,
          appliedFilters: {
            categories: llmCategories || (singleCategory ? [singleCategory] : null),
            constraints: { priceMax, priceMin, ratingMin },
            searchQuery: searchQuery || null,
            variants: variants.length > 0 ? variants : null
          },
          ui_handlers: searchData.ui_handlers || [],
          message: `Found ${finalProducts.length} products${llmCategories ? ` in ${llmCategories.join(', ')}` : ''}${searchQuery ? ` matching "${searchQuery}"` : ''}${variants.length > 0 ? ` with variants: ${variants.join(', ')}` : ''}.`
        });
        
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
  });
