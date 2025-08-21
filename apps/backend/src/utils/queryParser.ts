/**
 * Smart Query Parser for E-commerce AI Assistant
 * Analyzes user queries to extract categories, products, and filters
 */

export interface ParsedQuery {
  categories: string[];
  productTypes: string[];
  priceMax?: number;
  priceMin?: number;
  intent: string;
  confidence: number;
  reasoning: string;
  // Dynamic extracted attributes
  colors?: string[];
  sizes?: string[];
  brands?: string[];
  variants?: string[];
  // Constraints from data
  constraints: {
    budget?: number;
    rating?: number;
    availability?: boolean;
    sortBy?: string;
  };
  // Next action handlers for frontend
  suggestedActions: {
    type: 'search' | 'filter' | 'add_to_cart' | 'add_to_wishlist' | 'view_product' | 'go_to_category';
    payload: any;
    handler: string; // Frontend handler name
  }[];
}

interface PriceConstraints {
  min?: number;
  max?: number;
}

export class QueryParser {
  // Dynamic categories - will be fetched from the store API
  private static availableCategories: string[] = [];
  
  // Initialize with dynamic categories
  static async initialize(categoriesFetcher?: () => Promise<string[]>): Promise<void> {
    try {
      if (categoriesFetcher) {
        this.availableCategories = await categoriesFetcher();
      } else {
        // No fallback - require dynamic categories
        this.availableCategories = [];
      }
    } catch (error) {
      console.warn('Failed to fetch categories:', error);
      this.availableCategories = [];
    }
  }
  
  static get AVAILABLE_CATEGORIES(): string[] {
    return this.availableCategories;
  }

  // Product category mapping - should be populated dynamically
  static readonly PRODUCT_CATEGORY_MAP: Record<string, string[]> = {};

  // Gender indicators
  static readonly GENDER_INDICATORS: Record<string, string[]> = {
    male: ["men's", "mens", "male", "guys", "boys", "masculine"],
    female: ["women's", "womens", "female", "ladies", "girls", "feminine"]
  };

  static parseQuery(query: string): ParsedQuery {
    const queryLower = query.toLowerCase().trim();

    // Extract price constraints
    const priceConstraints = this.extractPriceConstraints(queryLower);
    
    // Determine gender preference
    const genderPreference = this.determineGenderPreference(queryLower);
    
    // Extract product types
    const productTypes = this.extractProductTypes(queryLower);
    
    // Determine categories based on gender + products
    const categories = this.determineCategories(queryLower, genderPreference, productTypes);
    
    // Determine intent
    const intent = this.determineIntent(queryLower, categories, productTypes, priceConstraints);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(categories, productTypes, genderPreference);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(query, categories, productTypes, genderPreference, priceConstraints);

    // Extract additional attributes
    const colors = this.extractColors(queryLower);
    const sizes = this.extractSizes(queryLower);
    const brands = this.extractBrands(queryLower);
    const variants = this.extractVariants(queryLower, productTypes);
    
    // Build constraints from extracted data
    const constraints = this.buildConstraints(queryLower, priceConstraints);
    
    // Generate suggested actions for frontend
    const suggestedActions = this.generateSuggestedActions(intent, categories, productTypes, constraints);

    return {
      categories,
      productTypes,
      priceMax: priceConstraints.max,
      priceMin: priceConstraints.min,
      intent,
      confidence,
      reasoning,
      colors,
      sizes,
      brands,
      variants,
      constraints,
      suggestedActions
    };
  }

  private static extractPriceConstraints(query: string): PriceConstraints {
    const constraints: PriceConstraints = {};

    // Extract "under £X" or "below £X"
    const underMatch = query.match(/(?:under|below|less than)\s*[£$](\d+)/i);
    if (underMatch) {
      constraints.max = parseInt(underMatch[1]);
    }

    // Extract "over £X" or "above £X"  
    const overMatch = query.match(/(?:over|above|more than)\s*[£$](\d+)/i);
    if (overMatch) {
      constraints.min = parseInt(overMatch[1]);
    }

    // Extract range "between £X and £Y"
    const rangeMatch = query.match(/between\s*[£$](\d+)\s*and\s*[£$](\d+)/i);
    if (rangeMatch) {
      constraints.min = parseInt(rangeMatch[1]);
      constraints.max = parseInt(rangeMatch[2]);
    }

    return constraints;
  }

  private static determineGenderPreference(query: string): string {
    const maleScore = this.GENDER_INDICATORS.male.reduce((score, indicator) => 
      query.includes(indicator) ? score + 1 : score, 0
    );
    
    const femaleScore = this.GENDER_INDICATORS.female.reduce((score, indicator) => 
      query.includes(indicator) ? score + 1 : score, 0
    );

    if (maleScore > femaleScore) return 'male';
    if (femaleScore > maleScore) return 'female';
    return 'both';
  }

  private static extractProductTypes(query: string): string[] {
    const foundProducts: string[] = [];

    // Check for known product types
    Object.keys(this.PRODUCT_CATEGORY_MAP).forEach(product => {
      // Check for exact word matches (not substrings)
      const regex = new RegExp(`\\b${product}s?\\b`, 'i'); // Allow plural
      if (regex.test(query)) {
        foundProducts.push(product);
      }
    });

    return foundProducts;
  }

  private static determineCategories(
    query: string, 
    genderPreference: string, 
    productTypes: string[]
  ): string[] {
    const categories = new Set<string>();

    // Determine categories from product types (if any mapping exists)
    productTypes.forEach(product => {
      const possibleCategories = this.PRODUCT_CATEGORY_MAP[product] || [];
      possibleCategories.forEach(category => {
        // Filter by gender preference if it's clothing
        if (category.includes('clothing')) {
          if (genderPreference === 'male' && category === "men's clothing") {
            categories.add(category);
          } else if (genderPreference === 'female' && category === "women's clothing") {
            categories.add(category);
          } else if (genderPreference === 'both') {
            categories.add(category);
          }
        } else {
          // Non-clothing categories
          categories.add(category);
        }
      });
    });

    return Array.from(categories);
  }

  private static hasClothingKeywords(query: string): boolean {
    const clothingKeywords = ['wear', 'outfit', 'fashion', 'style', 'size', 'fit'];
    return clothingKeywords.some(keyword => query.includes(keyword));
  }

  private static determineIntent(
    query: string, 
    categories: string[], 
    productTypes: string[], 
    priceConstraints: PriceConstraints
  ): string {
    if (productTypes.length > 0 || priceConstraints.min || priceConstraints.max) {
      return 'search_products';
    }
    if (categories.length > 0 && productTypes.length === 0) {
      return 'browse_category';
    }
    if (priceConstraints.min || priceConstraints.max) {
      return 'price_filter';
    }
    return 'general';
  }

  private static calculateConfidence(
    categories: string[], 
    productTypes: string[], 
    genderPreference: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence for clear category detection
    if (categories.length > 0) confidence += 0.2;
    
    // Boost confidence for clear product detection
    if (productTypes.length > 0) confidence += 0.3;
    
    // Boost confidence for clear gender preference
    if (genderPreference !== 'both') confidence += 0.1;
    
    // Reduce confidence for ambiguous queries
    if (categories.length > 2) confidence -= 0.1;

    return Math.min(Math.max(confidence, 0), 1);
  }

  private static generateReasoning(
    originalQuery: string,
    categories: string[],
    productTypes: string[],
    genderPreference: string,
    priceConstraints: PriceConstraints
  ): string {
    const parts: string[] = [];

    parts.push(`Query: "${originalQuery}"`);
    
    if (genderPreference !== 'both') {
      parts.push(`Gender preference: ${genderPreference}`);
    }
    
    if (categories.length > 0) {
      parts.push(`Categories: ${categories.join(', ')}`);
    }
    
    if (productTypes.length > 0) {
      parts.push(`Product types: ${productTypes.join(', ')}`);
    }
    
    if (priceConstraints.max) {
      parts.push(`Max price: £${priceConstraints.max}`);
    }
    
    if (priceConstraints.min) {
      parts.push(`Min price: £${priceConstraints.min}`);
    }

    return parts.join(' | ');
  }

  // Dynamic attribute extraction methods
  private static extractColors(query: string): string[] {
    const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'orange', 'silver', 'gold'];
    const foundColors: string[] = [];
    
    colors.forEach(color => {
      if (query.includes(color)) {
        foundColors.push(color);
      }
    });
    
    return foundColors;
  }

  private static extractSizes(query: string): string[] {
    const sizes = ['xs', 'small', 's', 'medium', 'm', 'large', 'l', 'xl', 'xxl', '2xl', '3xl'];
    const foundSizes: string[] = [];
    
    sizes.forEach(size => {
      const regex = new RegExp(`\\b${size}\\b`, 'i');
      if (regex.test(query)) {
        foundSizes.push(size.toUpperCase());
      }
    });
    
    return foundSizes;
  }

  private static extractBrands(query: string): string[] {
    // Brands should be populated dynamically from the product database
    const brands: string[] = [];
    const foundBrands: string[] = [];
    
    brands.forEach(brand => {
      if (query.includes(brand.toLowerCase())) {
        foundBrands.push(brand);
      }
    });
    
    return foundBrands;
  }

  private static extractVariants(query: string, productTypes: string[]): string[] {
    const variants: string[] = [];
    
    // Extract model numbers, versions, etc.
    const modelRegex = /\b(?:v\d+|version\s+\d+|\d+gb|\d+tb|\d+inch|\d+")\b/gi;
    const matches = query.match(modelRegex);
    if (matches) {
      variants.push(...matches);
    }
    
    return variants;
  }

  private static buildConstraints(query: string, priceConstraints: PriceConstraints): ParsedQuery['constraints'] {
    const constraints: ParsedQuery['constraints'] = {};
    
    // Budget constraint
    if (priceConstraints.max) {
      constraints.budget = priceConstraints.max;
    }
    
    // Rating constraint
    const ratingMatch = query.match(/(?:rating|rated|stars?)\s*(?:above|over|more than|>=?)\s*(\d+(?:\.\d+)?)/i);
    if (ratingMatch) {
      constraints.rating = parseFloat(ratingMatch[1]);
    }
    
    // Availability constraint
    if (query.includes('in stock') || query.includes('available')) {
      constraints.availability = true;
    }
    
    // Sort preference
    if (query.includes('cheapest') || query.includes('lowest price')) {
      constraints.sortBy = 'price-low';
    } else if (query.includes('expensive') || query.includes('highest price')) {
      constraints.sortBy = 'price-high';
    } else if (query.includes('best rated') || query.includes('highest rated')) {
      constraints.sortBy = 'rating';
    } else if (query.includes('newest') || query.includes('latest')) {
      constraints.sortBy = 'newest';
    }
    
    return constraints;
  }

  private static generateSuggestedActions(
    intent: string, 
    categories: string[], 
    productTypes: string[], 
    constraints: ParsedQuery['constraints']
  ): ParsedQuery['suggestedActions'] {
    const actions: ParsedQuery['suggestedActions'] = [];
    
    switch (intent) {
      case 'search_products':
        actions.push({
          type: 'search',
          payload: { 
            categories, 
            productTypes, 
            constraints 
          },
          handler: 'handleProductSearch'
        });
        break;
        
      case 'browse_category':
        if (categories.length > 0) {
          categories.forEach(category => {
            actions.push({
              type: 'go_to_category',
              payload: { category },
              handler: 'handleCategoryNavigation'
            });
          });
        }
        break;
        
      case 'price_filter':
        actions.push({
          type: 'filter',
          payload: { priceFilter: constraints },
          handler: 'handlePriceFilter'
        });
        break;
        
      default:
        actions.push({
          type: 'search',
          payload: { general: true },
          handler: 'handleGeneralSearch'
        });
    }
    
    return actions;
  }
}
