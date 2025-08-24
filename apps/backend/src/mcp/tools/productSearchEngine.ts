/**
 * MINIMALIST PRODUCT SEARCH ENGINE
 * All functionality in one efficient file
 */

import { ProductService } from "../../services/productService";
import { QueryParser } from "../../utils/queryParser";
import { ProductScoringEngine } from "../../utils/productScoring";

export interface SearchResult {
  success: boolean;
  data: any[];
  totalFound: number;
  filters: {
    categories?: string[];
    priceRange?: { min?: number; max?: number };
    rating?: number;
    searchQuery?: string;
    variants?: string[];
  };
  execution: {
    timeMs: number;
    steps: string[];
    fallbackUsed: boolean;
  };
  uiHandlers?: string[];
}

export class ProductSearchEngine {
  private static productService = new ProductService();
  private static initialized = false;

  static async initialize() {
    if (!this.initialized) {
      const categoriesResult = await this.productService.getAllCategories();
      const categories = categoriesResult.success ? categoriesResult.data || [] : [];
      await QueryParser.initialize(async () => categories);
      this.initialized = true;
    }
  }

  static async search(searchData: any): Promise<SearchResult> {
    const startTime = Date.now();
    let fallbackUsed = false;
    const steps: string[] = [];

    try {
      // Initialize if needed
      await this.initialize();

      // Get all products
      const allProductsResult = await this.productService.getAllProducts();
      let products = allProductsResult.success ? allProductsResult.data || [] : [];
      const originalCount = products.length;
      steps.push("data_load");

      // Category filtering
      if (searchData.category) {
        products = products.filter((p: any) => p.category === searchData.category);
        steps.push("single_category");
      } else if (searchData.categories?.length > 0) {
        const categoriesResult = await this.productService.getAllCategories();
        const allCategories = categoriesResult.success ? categoriesResult.data || [] : [];
        
        // Only filter if it's a meaningful subset
        if (searchData.categories.length < allCategories.length) {
          products = products.filter((p: any) => searchData.categories.includes(p.category));
          steps.push("category_subset");
        }
      }

      // Price constraints
      const priceMax = searchData.constraints?.price?.max || searchData.budget || searchData.priceMax;
      const priceMin = searchData.constraints?.price?.min || searchData.priceMin;
      
      if (priceMax) {
        products = products.filter((p: any) => p.price <= priceMax);
        steps.push("price_max");
      }
      if (priceMin) {
        products = products.filter((p: any) => p.price >= priceMin);
        steps.push("price_min");
      }

      // Rating constraints - handle both direct rating and nested rating.min
      const ratingMin = searchData.constraints?.rating?.min || searchData.constraints?.rating || searchData.minRating;
      if (ratingMin) {
        products = products.filter((p: any) => p.rating?.rate >= ratingMin);
        steps.push("rating_filter");
      }

      // Gift search special handling
      const isGiftSearch = searchData.constraints?.gift || false;
      if (isGiftSearch) {
        products = products.filter((p: any) => p.rating?.rate >= 3.5);
        steps.push("gift_quality");
      }

      // Search filtering with fallback
      const productItems = searchData.product_items || [];
      const searchQuery = productItems.length > 0 ? productItems.join(' ') : (searchData.query || '');
      const preSearchProducts = [...products];
      
      if (searchQuery && searchQuery.trim()) {
        const searchTerm = searchQuery.toLowerCase();
        const genericTerms = ['product', 'products', 'item', 'items'];
        const isGeneric = genericTerms.some(term => searchQuery.toLowerCase().includes(term));
        
        if (!isGeneric) {
          products = products.filter((p: any) => {
            const title = p.title.toLowerCase();
            const description = p.description.toLowerCase();
            return title.includes(searchTerm) || description.includes(searchTerm);
          });
          
          steps.push("search_applied");
          
          // Fallback if no results
          if (products.length === 0 && searchData.fallback !== false) {
            products = preSearchProducts;
            fallbackUsed = true;
            steps.push("fallback_restored");
          }
        }
      }

      // Variant filtering
      const variants = searchData.variants || [];
      if (variants.length > 0) {
        const preVariantProducts = [...products];
        variants.forEach((variant: string) => {
          const variantLower = variant.toLowerCase();
          products = products.filter((p: any) => {
            const title = p.title.toLowerCase();
            const description = p.description.toLowerCase();
            return title.includes(variantLower) || description.includes(variantLower);
          });
        });
        
        // Variant fallback
        if (products.length === 0 && preVariantProducts.length > 0) {
          products = preVariantProducts;
          fallbackUsed = true;
          steps.push("variant_fallback");
        } else {
          steps.push("variants_applied");
        }
      }

      // Scoring and sorting
      if (products.length > 1) {
        const scoringCriteria = ProductScoringEngine.createScoringCriteria(
          searchData.intent || 'search_results',
          {
            budget: priceMax,
            isGift: isGiftSearch,
            query: searchQuery
          }
        );

        const scoredProducts = ProductScoringEngine.scoreAndSortProducts(
          products,
          scoringCriteria,
          {
            searchQuery: searchQuery,
            userBudget: priceMax,
            category: searchData.category
          }
        );

        products = scoredProducts.map(p => {
          const { score, ...product } = p;
          return product;
        });
        steps.push("scored_sorted");
      }

      // Apply limit
      const totalFound = products.length;
      const limit = searchData.constraints?.limit || searchData.limit || 10;
      products = products.slice(0, limit);
      steps.push("limited");

      // Build result
      const result: SearchResult = {
        success: true,
        data: products,
        totalFound,
        filters: {
          categories: searchData.categories,
          priceRange: { min: priceMin, max: priceMax },
          rating: ratingMin,
          searchQuery: searchQuery || undefined,
          variants: variants.length > 0 ? variants : undefined
        },
        execution: {
          timeMs: Date.now() - startTime,
          steps,
          fallbackUsed
        },
        uiHandlers: searchData.ui_handlers
      };

      return result;

    } catch (error) {
      return {
        success: false,
        data: [],
        totalFound: 0,
        filters: {},
        execution: {
          timeMs: Date.now() - startTime,
          steps,
          fallbackUsed
        },
        uiHandlers: []
      };
    }
  }

  // Specialized search methods
  static async searchGifts(occasion = 'general', budget?: number, categories?: string[]): Promise<SearchResult> {
    return this.search({
      query: `gifts for ${occasion}`,
      intent: 'product_search',
      categories: categories || [],
      constraints: {
        gift: true,
        occasion,
        ...(budget && { price: { max: budget } }),
        limit: 10
      }
    });
  }

  static async compareProducts(productItems: string[], categories?: string[]): Promise<SearchResult> {
    return this.search({
      query: `compare ${productItems.join(' ')}`,
      intent: 'product_search',
      categories: categories || [],
      product_items: productItems,
      constraints: {
        special_search: 'compare',
        limit: 20
      }
    });
  }

  static async searchWithAI(userQuery: string, aiAnalysis: any, additionalOptions: any = {}): Promise<SearchResult> {
    const searchData = {
      query: userQuery,
      intent: aiAnalysis.intent,
      categories: aiAnalysis.categories,
      product_items: aiAnalysis.product_items,
      constraints: aiAnalysis.constraints,
      ui_handlers: aiAnalysis.ui_handlers,
      variants: aiAnalysis.variants,
      ...additionalOptions
    };
    
    return this.search(searchData);
  }
}
