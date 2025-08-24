/**
 * STEP-BY-STEP MODULAR PRODUCT SEARCH SYSTEM
 * Each step handles specific functionality efficiently
 */

import { ProductService } from "../../services/productService";
import { QueryParser } from "../../utils/queryParser";
import { ProductScoringEngine } from "../../utils/productScoring";

// Types for step data passing
export interface SearchContext {
  originalQuery?: string;
  allProducts: any[];
  backupProducts: any[];
  currentProducts: any[];
  allCategories: string[];
  searchData: any;
  appliedFilters: any;
  metadata: any;
}

export interface StepResult {
  success: boolean;
  products: any[];
  context: SearchContext;
  stepInfo: {
    step: string;
    applied: string[];
    count: number;
    fallbackUsed?: boolean;
  };
}

/**
 * STEP 1: INITIALIZATION & DATA LOADING
 * - Load all products and categories
 * - Create backup copies
 * - Initialize context
 */
export class Step1_Initialize {
  static async execute(searchData: any): Promise<StepResult> {
    console.log(`[STEP 1] Initialize & Load Data`);
    
    try {
      const productService = new ProductService();
      
      // Get ALL products and categories
      const allProductsResult = await productService.getAllProducts();
      const allProducts = allProductsResult.success ? allProductsResult.data || [] : [];
      const backupProducts = [...allProducts]; // CRITICAL BACKUP
      
      const categoriesResult = await productService.getAllCategories();
      const allCategories = categoriesResult.success ? categoriesResult.data || [] : [];
      
      // Initialize Query Parser with dynamic categories
      await QueryParser.initialize(async () => allCategories);
      
      console.log(`[STEP 1] Loaded ${allProducts.length} products, ${allCategories.length} categories`);
      
      const context: SearchContext = {
        originalQuery: searchData.query,
        allProducts,
        backupProducts,
        currentProducts: [...allProducts],
        allCategories,
        searchData,
        appliedFilters: {
          categories: null,
          constraints: {},
          searchQuery: null,
          variants: null,
          fallbackUsed: false
        },
        metadata: {
          totalOriginal: allProducts.length,
          steps: [],
          advancedFeatures: {
            giftMode: false,
            fallbackEnabled: searchData.fallback !== false,
            backupSearchEnabled: searchData.backup_search !== false
          }
        }
      };
      
      return {
        success: true,
        products: allProducts,
        context,
        stepInfo: {
          step: "initialization",
          applied: ["data_loading", "backup_creation", "parser_init"],
          count: allProducts.length
        }
      };
      
    } catch (error) {
      console.error(`[STEP 1] Initialization failed:`, error);
      throw error;
    }
  }
}

/**
 * STEP 2: CATEGORY FILTERING
 * - Apply smart category filtering
 * - Handle subset detection
 * - Maintain backup state
 */
export class Step2_CategoryFilter {
  static execute(stepResult: StepResult): StepResult {
    console.log(`[STEP 2] Category Filtering`);
    
    const { context } = stepResult;
    const { searchData, allCategories } = context;
    
    let products = [...context.currentProducts];
    const applied: string[] = [];
    
    // Extract category data
    const llmCategories = searchData.categories;
    const singleCategory = searchData.category;
    
    if (singleCategory) {
      products = products.filter((p: any) => p.category === singleCategory);
      applied.push(`single_category:${singleCategory}`);
      context.appliedFilters.categories = [singleCategory];
      console.log(`[STEP 2] Applied single category "${singleCategory}": ${products.length} products`);
    } 
    else if (llmCategories && llmCategories.length > 0) {
      // Smart subset detection
      const isSubset = llmCategories.length < allCategories.length && 
                      llmCategories.every((cat: string) => allCategories.includes(cat));
      
      if (isSubset) {
        products = products.filter((p: any) => llmCategories.includes(p.category));
        applied.push(`category_subset:${llmCategories.join(',')}`);
        context.appliedFilters.categories = llmCategories;
        console.log(`[STEP 2] Applied category subset ${llmCategories.join(', ')}: ${products.length} products`);
      } else {
        applied.push(`category_filter_skipped:all_categories`);
        console.log(`[STEP 2] Skipped category filter (all categories requested)`);
      }
    } else {
      applied.push("no_category_filter");
    }
    
    // Update context
    context.currentProducts = products;
    context.metadata.steps.push("category_filter");
    
    return {
      success: true,
      products,
      context,
      stepInfo: {
        step: "category_filter",
        applied,
        count: products.length
      }
    };
  }
}

/**
 * STEP 3: CONSTRAINT HANDLING
 * - Apply price constraints
 * - Apply rating constraints
 * - Handle gift mode
 * - Apply limit constraints
 */
export class Step3_ApplyConstraints {
  static execute(stepResult: StepResult): StepResult {
    console.log(`[STEP 3] Apply Constraints`);
    
    const { context } = stepResult;
    const { searchData } = context;
    
    let products = [...context.currentProducts];
    const applied: string[] = [];
    const preConstraintCount = products.length;
    
    // Extract constraints
    const constraints = searchData.constraints || {};
    const isGiftSearch = constraints.gift || false;
    const giftOccasion = constraints.occasion || null;
    const priceMax = constraints?.price?.max || searchData.budget || searchData.priceMax;
    const priceMin = constraints?.price?.min || searchData.priceMin;
    const ratingMin = constraints?.rating || searchData.minRating;
    
    // Update metadata for gift mode
    if (isGiftSearch) {
      context.metadata.advancedFeatures.giftMode = true;
      applied.push(`gift_mode:${giftOccasion || 'general'}`);
      console.log(`[STEP 3] Gift search mode enabled${giftOccasion ? ` for ${giftOccasion}` : ''}`);
    }
    
    // Apply price constraints
    if (priceMax) {
      products = products.filter((p: any) => p.price <= priceMax);
      applied.push(`price_max:${priceMax}`);
      context.appliedFilters.constraints.priceMax = priceMax;
      console.log(`[STEP 3] Applied price max £${priceMax}: ${products.length} products`);
    }
    
    if (priceMin) {
      products = products.filter((p: any) => p.price >= priceMin);
      applied.push(`price_min:${priceMin}`);
      context.appliedFilters.constraints.priceMin = priceMin;
      console.log(`[STEP 3] Applied price min £${priceMin}: ${products.length} products`);
    }
    
    // Apply rating constraints
    if (ratingMin) {
      products = products.filter((p: any) => p.rating?.rate >= ratingMin);
      applied.push(`rating_min:${ratingMin}`);
      context.appliedFilters.constraints.ratingMin = ratingMin;
      console.log(`[STEP 3] Applied rating min ${ratingMin}: ${products.length} products`);
    }
    
    // Gift search special filtering
    if (isGiftSearch) {
      const beforeGiftFilter = products.length;
      products = products.filter((p: any) => p.rating?.rate >= 3.5); // Quality for gifts
      applied.push(`gift_quality_filter:3.5+`);
      console.log(`[STEP 3] Applied gift quality filter: ${products.length} products (was ${beforeGiftFilter})`);
    }
    
    if (applied.length === 0) {
      applied.push("no_constraints");
    }
    
    // Update context
    context.currentProducts = products;
    context.metadata.steps.push("constraints");
    
    return {
      success: true,
      products,
      context,
      stepInfo: {
        step: "constraints",
        applied,
        count: products.length
      }
    };
  }
}

/**
 * STEP 4: SEARCH FILTERING WITH FALLBACK
 * - Apply product item search
 * - Handle backup/fallback logic
 * - Broader search attempts
 */
export class Step4_SearchFilter {
  static execute(stepResult: StepResult): StepResult {
    console.log(`[STEP 4] Search Filtering with Fallback`);
    
    const { context } = stepResult;
    const { searchData, allCategories } = context;
    
    let products = [...context.currentProducts];
    const preSearchProducts = [...products]; // BACKUP BEFORE SEARCH
    const applied: string[] = [];
    let fallbackUsed = false;
    
    // Extract search data
    const productItems = searchData.product_items || [];
    
    // Smart filtering of product items (remove category names)
    const filteredProductItems = productItems.filter((item: string) => {
      const itemLower = item.toLowerCase();
      return !allCategories.some((category: string) => 
        category.toLowerCase() === itemLower || 
        category.toLowerCase().includes(itemLower) ||
        itemLower.includes(category.toLowerCase())
      );
    });
    
    const searchQuery = filteredProductItems.length > 0 ? filteredProductItems.join(' ') : (searchData.query || '');
    
    console.log(`[STEP 4] Search query: "${searchQuery}"`);
    console.log(`[STEP 4] Filtered product items: [${filteredProductItems.join(', ')}]`);
    
    // Check for generic terms
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
      
      applied.push(`search_applied:${searchQuery}`);
      context.appliedFilters.searchQuery = searchQuery;
      console.log(`[STEP 4] Applied search "${searchQuery}": ${products.length} products`);
      
      // FALLBACK IF NO RESULTS
      if (products.length === 0 && context.metadata.advancedFeatures.fallbackEnabled) {
        console.log(`[STEP 4] Search produced 0 results, activating fallback...`);
        products = preSearchProducts; // RESTORE BACKUP
        applied.push(`fallback_restore:${products.length}`);
        fallbackUsed = true;
        
        // Try backup search with broader terms
        if (context.metadata.advancedFeatures.backupSearchEnabled) {
          const words = searchQuery.split(' ');
          if (words.length > 1) {
            const broaderResults = products.filter((p: any) => {
              const title = p.title.toLowerCase();
              const description = p.description.toLowerCase();
              return words.some((word: string) => 
                word.length > 2 && (title.includes(word) || description.includes(word))
              );
            });
            
            if (broaderResults.length > 0) {
              products = broaderResults;
              applied.push(`backup_search_success:${products.length}`);
              console.log(`[STEP 4] Backup search found ${products.length} products`);
            } else {
              applied.push(`backup_search_failed`);
            }
          }
        }
        
        console.log(`[STEP 4] Fallback complete: ${products.length} products`);
      }
    } else {
      applied.push(`search_skipped:generic_or_empty`);
      console.log(`[STEP 4] Skipped generic/empty search`);
    }
    
    if (applied.length === 0) {
      applied.push("no_search_filter");
    }
    
    // Update context
    context.currentProducts = products;
    context.appliedFilters.fallbackUsed = fallbackUsed;
    context.metadata.steps.push("search_filter");
    
    return {
      success: true,
      products,
      context,
      stepInfo: {
        step: "search_filter",
        applied,
        count: products.length,
        fallbackUsed
      }
    };
  }
}

/**
 * STEP 5: VARIANT FILTERING
 * - Apply variant filters (colors, sizes, materials)
 * - Handle variant fallback
 */
export class Step5_VariantFilter {
  static execute(stepResult: StepResult): StepResult {
    console.log(`[STEP 5] Variant Filtering`);
    
    const { context } = stepResult;
    const { searchData } = context;
    
    let products = [...context.currentProducts];
    const preVariantProducts = [...products]; // BACKUP BEFORE VARIANTS
    const applied: string[] = [];
    let fallbackUsed = false;
    
    const variants = searchData.variants || [];
    
    if (variants.length > 0) {
      variants.forEach((variant: string) => {
        const variantLower = variant.toLowerCase();
        const beforeCount = products.length;
        
        products = products.filter((p: any) => {
          const title = p.title.toLowerCase();
          const description = p.description.toLowerCase();
          return title.includes(variantLower) || description.includes(variantLower);
        });
        
        applied.push(`variant_${variant}:${products.length}`);
        console.log(`[STEP 5] Applied variant "${variant}": ${products.length} products (was ${beforeCount})`);
      });
      
      // FALLBACK FOR VARIANTS IF NO RESULTS
      if (products.length === 0 && preVariantProducts.length > 0 && context.metadata.advancedFeatures.fallbackEnabled) {
        console.log(`[STEP 5] Variant filtering produced 0 results, restoring...`);
        products = preVariantProducts; // RESTORE PRE-VARIANT STATE
        applied.push(`variant_fallback_restore:${products.length}`);
        fallbackUsed = true;
      }
      
      context.appliedFilters.variants = variants;
    } else {
      applied.push("no_variant_filter");
    }
    
    // Update context
    context.currentProducts = products;
    context.metadata.steps.push("variant_filter");
    
    return {
      success: true,
      products,
      context,
      stepInfo: {
        step: "variant_filter",
        applied,
        count: products.length,
        fallbackUsed
      }
    };
  }
}

/**
 * STEP 6: INTELLIGENT SCORING & SORTING
 * - Apply ProductScoringEngine
 * - Handle different scoring criteria
 * - Apply custom sorting
 */
export class Step6_ScoringAndSorting {
  static execute(stepResult: StepResult): StepResult {
    console.log(`[STEP 6] Intelligent Scoring & Sorting`);
    
    const { context } = stepResult;
    const { searchData } = context;
    
    let products = [...context.currentProducts];
    const applied: string[] = [];
    
    // Create scoring criteria based on search context
    const intent = searchData.intent || 'search_results';
    const isGiftSearch = context.metadata.advancedFeatures.giftMode;
    const searchQuery = context.appliedFilters.searchQuery;
    const priceMax = context.appliedFilters.constraints.priceMax;
    
    const scoringCriteria = ProductScoringEngine.createScoringCriteria(intent, {
      budget: priceMax,
      isGift: isGiftSearch,
      query: searchQuery
    });
    
    // Score and sort products using the engine
    const scoredProducts = ProductScoringEngine.scoreAndSortProducts(
      products,
      scoringCriteria,
      {
        searchQuery: searchQuery,
        userBudget: priceMax,
        category: context.appliedFilters.categories?.[0]
      }
    );
    
    applied.push(`scoring_applied:${intent}`);
    
    // Convert back to regular products (remove score)
    products = scoredProducts.map(p => {
      const { score, ...product } = p;
      return product;
    });
    
    // Apply custom sorting if specified
    if (searchData.sort && searchData.sort !== 'relevance') {
      console.log(`[STEP 6] Applying custom sort: ${searchData.sort}`);
      
      switch (searchData.sort) {
        case 'price-low':
          products.sort((a: any, b: any) => a.price - b.price);
          applied.push(`custom_sort:price_low`);
          break;
        case 'price-high':
          products.sort((a: any, b: any) => b.price - a.price);
          applied.push(`custom_sort:price_high`);
          break;
        case 'rating':
          products.sort((a: any, b: any) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
          applied.push(`custom_sort:rating`);
          break;
        default:
          applied.push(`custom_sort:${searchData.sort}`);
      }
    } else {
      applied.push("scoring_sort_used");
    }
    
    console.log(`[STEP 6] Scored and sorted ${products.length} products`);
    
    // Update context
    context.currentProducts = products;
    context.metadata.steps.push("scoring_sorting");
    
    return {
      success: true,
      products,
      context,
      stepInfo: {
        step: "scoring_sorting",
        applied,
        count: products.length
      }
    };
  }
}

/**
 * STEP 7: FINAL PROCESSING & UI HANDLERS
 * - Apply limit constraints
 * - Process UI handlers
 * - Generate final result
 */
export class Step7_FinalProcessing {
  static execute(stepResult: StepResult): StepResult {
    console.log(`[STEP 7] Final Processing & UI Handlers`);
    
    const { context } = stepResult;
    const { searchData } = context;
    
    let products = [...context.currentProducts];
    const applied: string[] = [];
    const totalFound = products.length;
    
    // Apply limit constraint
    const limit = searchData.constraints?.limit || searchData.limit || 10;
    const limitedProducts = products.slice(0, limit);
    applied.push(`limit_applied:${limit}`);
    
    // Process UI handlers
    const uiHandlers = searchData.ui_handlers || [];
    if (uiHandlers.length > 0) {
      applied.push(`ui_handlers:${uiHandlers.join(',')}`);
      console.log(`[STEP 7] UI handlers to process: ${uiHandlers.join(', ')}`);
    }
    
    console.log(`[STEP 7] Final result: ${limitedProducts.length} products (from ${totalFound} total)`);
    
    // Update context with final state
    context.currentProducts = limitedProducts;
    context.metadata.steps.push("final_processing");
    context.metadata.finalCount = limitedProducts.length;
    context.metadata.totalFound = totalFound;
    
    return {
      success: true,
      products: limitedProducts,
      context,
      stepInfo: {
        step: "final_processing",
        applied,
        count: limitedProducts.length
      }
    };
  }
}
