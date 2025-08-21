import { DynamicTool } from "@langchain/core/tools";
import { z } from "zod";
import { ProductService } from "../../services/productService";
import { QueryParser } from "../../utils/queryParser";
import { ProductScoringEngine } from "../../utils/productScoring";

const listProductsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
  sort: z.enum(['asc', 'desc', 'rating', 'price-low', 'price-high', 'relevance']).default('relevance'),
  budget: z.number().optional(),
  minRating: z.number().min(0).max(5).optional(),
  priceMax: z.number().optional(),
  priceMin: z.number().optional()
});

export const createListProductsTool = (userId: number) =>
  new DynamicTool({
    name: "products.list",
    description: "Search and list products with intelligent scoring and filtering. Supports natural language queries, category filtering, price constraints, and dynamic ranking based on relevance, rating, popularity, and price preferences. Always dynamically fetches available categories first.",
    func: async (input: string) => {
      let searchData: any;
      try {
        searchData = JSON.parse(input);
        const parsed = listProductsSchema.safeParse(searchData);
        if (!parsed.success) {
          return JSON.stringify({
            success: false,
            error: "Invalid search parameters",
            expected: "JSON with optional query, category, limit, sort, budget, minRating, priceMax, priceMin"
          });
        }
        searchData = parsed.data;
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: "Invalid JSON input format"
        });
      }

      try {
        const productService = new ProductService();
        
        // ALWAYS initialize QueryParser with dynamic categories from the store
        const categoriesResult = await productService.getAllCategories();
        const availableCategories = categoriesResult.success ? categoriesResult.data || [] : [];
        await QueryParser.initialize(() => Promise.resolve(availableCategories));
        
        let products: any[] = [];
        
        // Get products based on category or get all products
        if (searchData.category) {
          const result = await productService.getProductsByCategory(searchData.category);
          products = result.success ? result.data || [] : [];
        } else {
          const result = await productService.getAllProducts();
          products = result.success ? result.data || [] : [];
        }

        // If we have a search query, parse it and apply intelligent filtering
        if (searchData.query && searchData.query.trim()) {
          const parsedQuery = QueryParser.parseQuery(searchData.query);
          
          // Filter by categories if detected and not already specified
          if (parsedQuery.categories.length > 0 && !searchData.category) {
            products = products.filter((p: any) => 
              parsedQuery.categories.some(cat => 
                p.category.toLowerCase().includes(cat.toLowerCase())
              )
            );
          }
          
          // Apply budget constraints (use query-parsed or explicit)
          const budget = searchData.budget || searchData.priceMax || parsedQuery.constraints.budget;
          if (budget) {
            products = products.filter((p: any) => p.price <= budget);
          }
          
          // Apply minimum price constraint
          const minPrice = searchData.priceMin;
          if (minPrice) {
            products = products.filter((p: any) => p.price >= minPrice);
          }
          
          // Apply rating constraints
          const minRating = searchData.minRating || parsedQuery.constraints.rating;
          if (minRating) {
            products = products.filter((p: any) => p.rating.rate >= minRating);
          }
          
          // Apply intelligent scoring and sorting
          const intent = parsedQuery.intent === 'search_products' ? 'search_results' : 'general';
          const scoringCriteria = ProductScoringEngine.createScoringCriteria(intent, {
            budget,
            searchQuery: searchData.query
          });
          
          const scoredProducts = ProductScoringEngine.scoreAndSortProducts(
            products, 
            scoringCriteria, 
            {
              searchQuery: searchData.query,
              userBudget: budget,
              category: searchData.category
            }
          );
          
          const resultProducts = scoredProducts.slice(0, searchData.limit);
          
          return JSON.stringify({
            success: true,
            products: resultProducts,
            totalFound: scoredProducts.length,
            availableCategories,
            query: searchData.query,
            parsedQuery: {
              intent: parsedQuery.intent,
              categories: parsedQuery.categories,
              productTypes: parsedQuery.productTypes,
              constraints: parsedQuery.constraints,
              suggestedActions: parsedQuery.suggestedActions,
              confidence: parsedQuery.confidence,
              reasoning: parsedQuery.reasoning
            },
            scoringApplied: true,
            message: `Found ${resultProducts.length} products matching "${searchData.query}", ranked by relevance and quality.`
          });
        } else {
          // No search query - apply simple filtering and sorting
          let filteredProducts: any[] = products;
          
          // Apply budget filter
          const budget = searchData.budget || searchData.priceMax;
          if (budget) {
            filteredProducts = filteredProducts.filter((p: any) => p.price <= budget);
          }
          
          // Apply minimum price filter
          if (searchData.priceMin) {
            filteredProducts = filteredProducts.filter((p: any) => p.price >= searchData.priceMin);
          }
          
          // Apply rating filter
          if (searchData.minRating) {
            filteredProducts = filteredProducts.filter((p: any) => p.rating.rate >= searchData.minRating);
          }
          
          // Apply sorting
          switch (searchData.sort) {
            case 'price-low':
              filteredProducts.sort((a: any, b: any) => a.price - b.price);
              break;
            case 'price-high':
              filteredProducts.sort((a: any, b: any) => b.price - a.price);
              break;
            case 'rating':
              filteredProducts.sort((a: any, b: any) => b.rating.rate - a.rating.rate);
              break;
            case 'asc':
              filteredProducts.sort((a: any, b: any) => a.title.localeCompare(b.title));
              break;
            case 'desc':
              filteredProducts.sort((a: any, b: any) => b.title.localeCompare(a.title));
              break;
            case 'relevance':
            default:
              // Apply general scoring for relevance
              const scoringCriteria = ProductScoringEngine.createScoringCriteria('general', {
                budget: budget
              });
              const scored = ProductScoringEngine.scoreAndSortProducts(
                filteredProducts, 
                scoringCriteria,
                { userBudget: budget }
              );
              filteredProducts = scored;
              break;
          }
          
          const resultProducts = filteredProducts.slice(0, searchData.limit);
          
          return JSON.stringify({
            success: true,
            products: resultProducts,
            totalFound: filteredProducts.length,
            availableCategories,
            filters: {
              category: searchData.category,
              budget: budget,
              priceMin: searchData.priceMin,
              minRating: searchData.minRating,
              sort: searchData.sort
            },
            message: `Found ${resultProducts.length} products${searchData.category ? ` in ${searchData.category}` : ''}.`
          });
        }
        
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: `Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    },
  });
