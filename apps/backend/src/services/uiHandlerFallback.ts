/**
 * UI Handler Fallback System
 * 
 * This system provides pattern-based detection of UI actions when the LLM fails to detect them.
 * It serves as a safety net to ensure user intents are captured even if the AI misses them.
 */

export interface UIActionPattern {
  handler: string;
  patterns: string[];
  priority: number; // Higher priority = checked first
  requiresProduct: boolean; // Whether this action needs products to make sense
  description: string;
}

export interface UIActionMatch {
  handler: string;
  confidence: number;
  matchedPattern: string;
  requiresProduct: boolean;
}

export class UIHandlerFallback {
  private static actionPatterns: UIActionPattern[] = [
    // CART ACTIONS
    {
      handler: 'cart.add',
      patterns: [
        'add to cart',
        'add to my cart', 
        'put in cart',
        'add to basket',
        'add to shopping cart',
        'buy this',
        'purchase this',
        'add it to cart',
        'cart add',
        'add cart',
        'to cart',
        'buy now'
      ],
      priority: 100,
      requiresProduct: true,
      description: 'Add items to shopping cart'
    },
    {
      handler: 'cart.remove',
      patterns: [
        'remove from cart',
        'delete from cart',
        'remove from my cart',
        'cart remove',
        'remove cart',
        'delete cart',
        'take out of cart',
        'remove from shopping cart',
        'cart delete'
      ],
      priority: 95,
      requiresProduct: false,
      description: 'Remove items from shopping cart'
    },
    {
      handler: 'cart.view',
      patterns: [
        'show cart',
        'view cart',
        'see my cart',
        'check cart',
        'cart contents',
        'what\'s in my cart',
        'my shopping cart',
        'show my cart',
        'display cart',
        'open cart'
      ],
      priority: 90,
      requiresProduct: false,
      description: 'Display shopping cart contents'
    },
    {
      handler: 'cart.clear',
      patterns: [
        'clear cart',
        'empty cart',
        'clear my cart',
        'remove all from cart',
        'delete all cart',
        'cart clear',
        'empty shopping cart'
      ],
      priority: 85,
      requiresProduct: false,
      description: 'Clear all items from cart'
    },

    // WISHLIST ACTIONS
    {
      handler: 'wishlist.add',
      patterns: [
        'add to wishlist',
        'save to wishlist',
        'add to favorites',
        'add to my wishlist',
        'wishlist add',
        'add wishlist',
        'save for later',
        'add to saved',
        'bookmark this',
        'favorite this',
        'save this',
        'add to wish list'
      ],
      priority: 100,
      requiresProduct: true,
      description: 'Add items to wishlist'
    },
    {
      handler: 'wishlist.remove',
      patterns: [
        'remove from wishlist',
        'delete from wishlist',
        'remove from favorites',
        'wishlist remove',
        'remove wishlist',
        'delete wishlist',
        'unfavorite',
        'unsave',
        'remove from saved'
      ],
      priority: 95,
      requiresProduct: false,
      description: 'Remove items from wishlist'
    },
    {
      handler: 'wishlist.view',
      patterns: [
        'show wishlist',
        'view wishlist',
        'see my wishlist',
        'check wishlist',
        'my favorites',
        'show favorites',
        'my saved items',
        'display wishlist',
        'open wishlist',
        'show wish list'
      ],
      priority: 90,
      requiresProduct: false,
      description: 'Display wishlist contents'
    },
    {
      handler: 'wishlist.clear',
      patterns: [
        'clear wishlist',
        'empty wishlist',
        'clear my wishlist',
        'remove all from wishlist',
        'delete all wishlist',
        'wishlist clear'
      ],
      priority: 85,
      requiresProduct: false,
      description: 'Clear all items from wishlist'
    },

    // AUTH ACTIONS
    {
      handler: 'auth.login',
      patterns: [
        'log in',
        'login',
        'sign in',
        'sign me in',
        'log me in',
        'authenticate',
        'access account',
        'enter account'
      ],
      priority: 80,
      requiresProduct: false,
      description: 'User login/authentication'
    },
    {
      handler: 'auth.logout',
      patterns: [
        'log out',
        'logout',
        'sign out',
        'sign me out',
        'log me out',
        'exit account',
        'leave account'
      ],
      priority: 80,
      requiresProduct: false,
      description: 'User logout'
    },
    {
      handler: 'auth.register',
      patterns: [
        'register',
        'sign up',
        'create account',
        'new account',
        'join',
        'signup'
      ],
      priority: 75,
      requiresProduct: false,
      description: 'User registration'
    },

    // CHECKOUT ACTIONS
    {
      handler: 'checkout.start',
      patterns: [
        'checkout',
        'proceed to checkout',
        'buy now',
        'purchase',
        'complete purchase',
        'finish order',
        'place order',
        'check out'
      ],
      priority: 70,
      requiresProduct: false,
      description: 'Start checkout process'
    },

    // ORDER ACTIONS
    {
      handler: 'orders.view',
      patterns: [
        'show orders',
        'view orders',
        'my orders',
        'order history',
        'past orders',
        'previous orders',
        'show my orders',
        'check orders'
      ],
      priority: 65,
      requiresProduct: false,
      description: 'View order history'
    },
    {
      handler: 'orders.track',
      patterns: [
        'track order',
        'track my order',
        'order status',
        'where is my order',
        'delivery status',
        'shipping status',
        'track package',
        'check delivery'
      ],
      priority: 65,
      requiresProduct: false,
      description: 'Track order status'
    }
  ];

  /**
   * Detect UI handlers from user query using pattern matching
   */
  static detectUIHandlers(query: string, hasProducts: boolean = false): UIActionMatch[] {
    const normalizedQuery = query.toLowerCase().trim();
    const matches: UIActionMatch[] = [];

    console.log(`[UI Fallback] Analyzing query: "${query}"`);
    console.log(`[UI Fallback] Has products context: ${hasProducts}`);

    // Sort patterns by priority (highest first)
    const sortedPatterns = [...this.actionPatterns].sort((a, b) => b.priority - a.priority);

    for (const actionPattern of sortedPatterns) {
      // Skip product-dependent actions if no products available
      if (actionPattern.requiresProduct && !hasProducts) {
        console.log(`[UI Fallback] Skipping ${actionPattern.handler} - requires products but none available`);
        continue;
      }

      for (const pattern of actionPattern.patterns) {
        if (normalizedQuery.includes(pattern.toLowerCase())) {
          const confidence = this.calculateConfidence(normalizedQuery, pattern, actionPattern);
          
          matches.push({
            handler: actionPattern.handler,
            confidence,
            matchedPattern: pattern,
            requiresProduct: actionPattern.requiresProduct
          });

          console.log(`[UI Fallback] Found match: ${actionPattern.handler} (confidence: ${confidence}) - pattern: "${pattern}"`);
          
          // Only take the first match per action type to avoid duplicates
          break;
        }
      }
    }

    // Sort matches by confidence (highest first)
    const sortedMatches = matches.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`[UI Fallback] Final matches: ${sortedMatches.length}`);
    sortedMatches.forEach(match => {
      console.log(`  - ${match.handler}: ${match.confidence}% (${match.matchedPattern})`);
    });

    return sortedMatches;
  }

  /**
   * Calculate confidence score for a pattern match
   */
  private static calculateConfidence(query: string, pattern: string, actionPattern: UIActionPattern): number {
    let confidence = 60; // Base confidence for any match

    // Boost for exact phrase matches
    if (query.includes(pattern)) {
      confidence += 20;
    }

    // Boost for higher priority patterns
    if (actionPattern.priority >= 100) {
      confidence += 15;
    } else if (actionPattern.priority >= 90) {
      confidence += 10;
    } else if (actionPattern.priority >= 80) {
      confidence += 5;
    }

    // Boost for longer, more specific patterns
    if (pattern.length > 10) {
      confidence += 10;
    } else if (pattern.length > 6) {
      confidence += 5;
    }

    // Boost if the pattern appears early in the query
    const patternIndex = query.toLowerCase().indexOf(pattern.toLowerCase());
    if (patternIndex === 0) {
      confidence += 10; // Starts with the pattern
    } else if (patternIndex < query.length / 2) {
      confidence += 5; // Appears in first half
    }

    // Cap at 95% (never 100% certain)
    return Math.min(confidence, 95);
  }

  /**
   * Convert UI action matches to handler strings
   */
  static matchesToHandlers(matches: UIActionMatch[], confidenceThreshold: number = 70): string[] {
    return matches
      .filter(match => match.confidence >= confidenceThreshold)
      .map(match => match.handler);
  }

  /**
   * Get action pattern by handler name
   */
  static getActionPattern(handler: string): UIActionPattern | undefined {
    return this.actionPatterns.find(pattern => pattern.handler === handler);
  }

  /**
   * Check if a handler exists in our patterns
   */
  static isValidHandler(handler: string): boolean {
    return this.actionPatterns.some(pattern => pattern.handler === handler);
  }

  /**
   * Get all available handlers
   */
  static getAllHandlers(): string[] {
    return this.actionPatterns.map(pattern => pattern.handler);
  }

  /**
   * Apply fallback UI handlers if LLM missed them
   */
  static applyFallbackHandlers(
    llmHandlers: string[], 
    query: string, 
    hasProducts: boolean = false
  ): { handlers: string[], appliedFallback: boolean, fallbackMatches: UIActionMatch[] } {
    
    console.log(`[UI Fallback] Applying fallback for LLM handlers: ${JSON.stringify(llmHandlers)}`);

    // If LLM already detected handlers, check if we should add more
    const fallbackMatches = this.detectUIHandlers(query, hasProducts);
    const fallbackHandlers = this.matchesToHandlers(fallbackMatches);

    // Merge LLM handlers with fallback handlers (remove duplicates)
    const mergedHandlers = Array.from(new Set([...llmHandlers, ...fallbackHandlers]));
    
    const appliedFallback = fallbackHandlers.length > 0 && 
                           !fallbackHandlers.every(handler => llmHandlers.includes(handler));

    if (appliedFallback) {
      console.log(`[UI Fallback] Applied fallback handlers: ${fallbackHandlers.join(', ')}`);
      console.log(`[UI Fallback] Final merged handlers: ${mergedHandlers.join(', ')}`);
    } else {
      console.log(`[UI Fallback] No new handlers to add`);
    }

    return {
      handlers: mergedHandlers,
      appliedFallback,
      fallbackMatches
    };
  }
}

export default UIHandlerFallback;
