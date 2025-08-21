/**
 * Frontend AI Result Preprocessor
 * Analyzes AI results and provides smart user experience enhancements
 */

export interface CategoryBreakdown {
  category: string;
  count: number;
  topProduct: any;
  avgPrice: number;
}

export interface SmartActionSuggestion {
  type: 'category_filter' | 'price_filter' | 'view_all' | 'compare' | 'refine_search';
  label: string;
  action: () => void;
  icon?: string;
  description?: string;
}

export interface PreprocessedResult {
  originalProducts: any[];
  displayProducts: any[];
  hasMultipleCategories: boolean;
  categoryBreakdown: CategoryBreakdown[];
  smartActions: SmartActionSuggestion[];
  enhancedMessage: string;
  shouldShowCategoryDialog: boolean;
  showViewMoreButton: boolean;
  insights: string[];
}

export class AIResultPreprocessor {
  
  static preprocess(
    aiResult: any, 
    originalQuery: string,
    onCategoryFilter: (category: string) => void,
    onViewAll: () => void,
    onRefineSearch: (newQuery: string) => void
  ): PreprocessedResult {
    
    // Safely handle undefined or malformed responses
    if (!aiResult || typeof aiResult !== 'object') {
      console.warn('AIResultPreprocessor: Invalid aiResult:', aiResult);
      return this.createFallbackResult(originalQuery);
    }
    
    // Debug logging to understand the response structure
    console.log('AIResultPreprocessor received:', aiResult);
    console.log('aiResult.data:', aiResult.data);
    console.log('aiResult.data?.products:', aiResult.data?.products);
    
    // Extract products from various possible response structures
    let products: any[] = [];
    let totalFound = 0;
    let message = '';
    
    if (aiResult.data?.products) {
      products = aiResult.data.products;
      totalFound = aiResult.data.totalFound || products.length;
      message = aiResult.message || '';
    } else if (aiResult.products) {
      products = aiResult.products;
      totalFound = aiResult.totalFound || products.length;
      message = aiResult.message || '';
    } else if (Array.isArray(aiResult)) {
      products = aiResult;
      totalFound = products.length;
      message = `Found ${products.length} products`;
    } else {
      // If no products found, create fallback
      message = aiResult.message || 'No products found for your search.';
      products = [];
      totalFound = 0;
    }
    
    // Analyze category distribution
    const categoryBreakdown = this.analyzeCategoryDistribution(products);
    const hasMultipleCategories = categoryBreakdown.length > 1;
    
    // Generate smart actions based on analysis
    const smartActions = this.generateSmartActions(
      categoryBreakdown, 
      originalQuery, 
      totalFound,
      onCategoryFilter,
      onViewAll,
      onRefineSearch
    );
    
    // Enhance the AI message with smart insights
    const enhancedMessage = this.enhanceMessage(
      message, 
      categoryBreakdown, 
      originalQuery,
      totalFound
    );
    
    // Determine if we should show category dialog
    const shouldShowCategoryDialog = this.shouldShowCategoryDialog(
      categoryBreakdown, 
      originalQuery
    );
    
    // Show top 3 products by default, with view more for others
    const displayProducts = products.slice(0, 3);
    const showViewMoreButton = products.length > 3;
    
    // Generate insights for user
    const insights = this.generateInsights(categoryBreakdown, products, originalQuery);
    
    return {
      originalProducts: products,
      displayProducts,
      hasMultipleCategories,
      categoryBreakdown,
      smartActions,
      enhancedMessage,
      shouldShowCategoryDialog,
      showViewMoreButton,
      insights
    };
  }
  
  private static analyzeCategoryDistribution(products: any[]): CategoryBreakdown[] {
    const categoryMap = new Map<string, any[]>();
    
    // Group products by category
    products.forEach(product => {
      const category = product.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(product);
    });
    
    // Create breakdown with insights
    return Array.from(categoryMap.entries()).map(([category, categoryProducts]) => {
      const avgPrice = categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length;
      const topProduct = categoryProducts.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      
      return {
        category,
        count: categoryProducts.length,
        topProduct,
        avgPrice: Math.round(avgPrice * 100) / 100
      };
    }).sort((a, b) => b.count - a.count); // Sort by count descending
  }
  
  private static generateSmartActions(
    categoryBreakdown: CategoryBreakdown[],
    originalQuery: string,
    totalFound: number,
    onCategoryFilter: (category: string) => void,
    onViewAll: () => void,
    onRefineSearch: (newQuery: string) => void
  ): SmartActionSuggestion[] {
    
    const actions: SmartActionSuggestion[] = [];
    
    // Category filter actions for multiple categories
    if (categoryBreakdown.length > 1) {
      categoryBreakdown.forEach(breakdown => {
        actions.push({
          type: 'category_filter',
          label: `${this.formatCategoryName(breakdown.category)} (${breakdown.count})`,
          description: `Show only ${breakdown.category} items - avg £${breakdown.avgPrice}`,
          action: () => onCategoryFilter(breakdown.category),
          icon: this.getCategoryIcon(breakdown.category)
        });
      });
    }
    
    // View all action if more products available
    if (totalFound > 3) {
      actions.push({
        type: 'view_all',
        label: `View All ${totalFound} Products`,
        description: 'Open detailed product browser',
        action: onViewAll,
        icon: '📱'
      });
    }
    
    // Smart refinement suggestions based on query
    const refinements = this.generateRefinementSuggestions(originalQuery, categoryBreakdown);
    refinements.forEach(refinement => {
      actions.push({
        type: 'refine_search',
        label: refinement.label,
        description: refinement.description,
        action: () => onRefineSearch(refinement.query),
        icon: '🔍'
      });
    });
    
    return actions;
  }
  
  private static enhanceMessage(
    originalMessage: string, 
    categoryBreakdown: CategoryBreakdown[], 
    originalQuery: string,
    totalFound: number
  ): string {
    
    let enhanced = originalMessage;
    
    // Add category insights for multiple categories
    if (categoryBreakdown.length > 1) {
      const categoryText = categoryBreakdown
        .map(b => `${b.count} ${this.formatCategoryName(b.category)}`)
        .join(', ');
      
      enhanced += ` I found products across multiple categories: ${categoryText}.`;
      
      // Ask for clarification if query was ambiguous
      if (this.isAmbiguousQuery(originalQuery)) {
        enhanced += ` Would you like me to show specific categories?`;
      }
    }
    
    // Add value insights
    if (categoryBreakdown.length > 0) {
      const bestValue = categoryBreakdown.reduce((best, current) => 
        current.avgPrice < best.avgPrice ? current : best
      );
      
      if (categoryBreakdown.length > 1) {
        enhanced += ` Best value appears to be in ${this.formatCategoryName(bestValue.category)} (avg £${bestValue.avgPrice}).`;
      }
    }
    
    return enhanced;
  }
  
  private static shouldShowCategoryDialog(
    categoryBreakdown: CategoryBreakdown[], 
    originalQuery: string
  ): boolean {
    // Show dialog if:
    // 1. Multiple categories found (2+)
    // 2. Query was ambiguous (no gender/specific category mentioned)
    // 3. Significant product count in multiple categories
    
    if (categoryBreakdown.length < 2) return false;
    
    const isAmbiguous = this.isAmbiguousQuery(originalQuery);
    const hasSignificantDistribution = categoryBreakdown.every(b => b.count >= 2);
    
    return isAmbiguous && hasSignificantDistribution;
  }
  
  private static generateInsights(
    categoryBreakdown: CategoryBreakdown[], 
    products: any[], 
    originalQuery: string
  ): string[] {
    
    const insights: string[] = [];
    
    // Price insights
    if (products.length > 0) {
      const prices = products.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (maxPrice - minPrice > 20) {
        insights.push(`Price range: £${minPrice} - £${maxPrice}`);
      }
    }
    
    // Rating insights
    const highRatedProducts = products.filter(p => p.rating?.rate >= 4.5);
    if (highRatedProducts.length > 0) {
      insights.push(`${highRatedProducts.length} highly rated products (4.5+ stars)`);
    }
    
    // Category insights
    if (categoryBreakdown.length > 1) {
      const topCategory = categoryBreakdown[0];
      insights.push(`Most results in ${this.formatCategoryName(topCategory.category)}`);
    }
    
    return insights;
  }
  
  private static generateRefinementSuggestions(
    originalQuery: string, 
    categoryBreakdown: CategoryBreakdown[]
  ): Array<{label: string; description: string; query: string}> {
    
    const suggestions: Array<{label: string; description: string; query: string}> = [];
    
    // Budget-based refinements
    if (!originalQuery.includes('under') && !originalQuery.includes('below')) {
      suggestions.push({
        label: 'Under £50',
        description: 'Show budget-friendly options',
        query: `${originalQuery} under £50`
      });
      
      if (categoryBreakdown.some(b => b.avgPrice > 50)) {
        suggestions.push({
          label: 'Under £100',
          description: 'Mid-range options',
          query: `${originalQuery} under £100`
        });
      }
    }
    
    // Gender-specific refinements for clothing
    if (categoryBreakdown.some(b => b.category.includes('clothing')) && 
        !this.hasGenderSpecifier(originalQuery)) {
      suggestions.push({
        label: "Men's Only",
        description: 'Show only men\'s clothing',
        query: `men's ${originalQuery}`
      });
      
      suggestions.push({
        label: "Women's Only", 
        description: 'Show only women\'s clothing',
        query: `women's ${originalQuery}`
      });
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }
  
  private static isAmbiguousQuery(query: string): boolean {
    const ambiguousTerms = ['jacket', 'clothing', 'clothes', 'wear', 'outfit'];
    const queryLower = query.toLowerCase();
    
    return ambiguousTerms.some(term => queryLower.includes(term)) && 
           !this.hasGenderSpecifier(queryLower);
  }
  
  private static hasGenderSpecifier(query: string): boolean {
    const genderKeywords = ['men', 'women', 'male', 'female', 'ladies', 'guys', 'girls', 'boys'];
    return genderKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }
  
  private static formatCategoryName(category: string): string {
    return category.replace(/'/g, '').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  private static getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      "men's clothing": '👔',
      "women's clothing": '👗', 
      'electronics': '📱',
      'jewelery': '💎'
    };
    
    return iconMap[category] || '🛍️';
  }

  /**
   * Create a fallback result when processing fails
   */
  private static createFallbackResult(originalQuery: string): PreprocessedResult {
    return {
      originalProducts: [],
      displayProducts: [],
      hasMultipleCategories: false,
      categoryBreakdown: [],
      smartActions: [],
      enhancedMessage: `I couldn't find any products matching "${originalQuery}". Please try rephrasing your search or check your spelling.`,
      shouldShowCategoryDialog: false,
      showViewMoreButton: false,
      insights: [`No products found for "${originalQuery}"`, 'Try using different keywords', 'Check your spelling']
    };
  }
}
