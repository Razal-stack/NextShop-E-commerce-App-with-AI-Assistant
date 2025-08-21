import { Product } from '@/lib/types';

export interface ProcessedResponse {
  message: string;
  products?: Product[];
  displayMode: 'chat_only' | 'auto_navigate' | 'dual_view';
  actions?: Array<{
    type: 'navigate' | 'filter_products' | 'add_to_cart' | 'add_to_wishlist';
    payload: any;
  }>;
  totalFound?: number;
  steps?: Array<{
    step: number;
    description: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

export class ResponsePreprocessor {
  /**
   * Process raw API response into a standardized format for UI consumption
   */
  static processResponse(rawResponse: any): ProcessedResponse {
    try {
      // Handle string response
      if (typeof rawResponse === 'string') {
        return {
          message: rawResponse,
          displayMode: 'chat_only'
        };
      }

      // Handle structured response from backend
      if (rawResponse && typeof rawResponse === 'object') {
        // Check for the structured backend response format
        if (rawResponse.success && rawResponse.result) {
          const result = rawResponse.result;
          
          return {
            message: result.message || 'I found some information for you!',
            displayMode: result.displayMode || 'chat_only',
            products: this.extractProducts(result.data),
            actions: result.actions || [],
            totalFound: result.data?.totalFound,
            steps: result.steps
          };
        }

        // Handle direct response object
        return {
          message: rawResponse.message || rawResponse.text || rawResponse.content || 'I found some information for you!',
          displayMode: rawResponse.displayMode || 'chat_only',
          products: this.extractProducts(rawResponse.data || rawResponse),
          actions: rawResponse.actions || [],
          totalFound: rawResponse.totalFound,
          steps: rawResponse.steps
        };
      }

      // Fallback for unexpected response format
      return {
        message: 'I received your message but had trouble processing the response. Please try again.',
        displayMode: 'chat_only'
      };

    } catch (error) {
      console.error('❌ Response preprocessing error:', error);
      return {
        message: 'Sorry, I encountered an error while processing the response.',
        displayMode: 'chat_only'
      };
    }
  }

  /**
   * Extract products from various data structures
   */
  private static extractProducts(data: any): Product[] | undefined {
    if (!data) return undefined;

    // Direct products array
    if (Array.isArray(data)) {
      return data;
    }

    // Nested products in data object
    if (data.products && Array.isArray(data.products)) {
      return data.products;
    }

    // Other possible structures
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }

    if (data.items && Array.isArray(data.items)) {
      return data.items;
    }

    return undefined;
  }

  /**
   * Determine if response should trigger navigation
   */
  static shouldNavigate(processedResponse: ProcessedResponse): boolean {
    return processedResponse.displayMode === 'auto_navigate' || 
           (!!processedResponse.products && processedResponse.products.length > 3);
  }

  /**
   * Get navigation payload from response
   */
  static getNavigationPayload(processedResponse: ProcessedResponse): any {
    const navigateAction = processedResponse.actions?.find(action => action.type === 'navigate');
    return navigateAction?.payload || { page: '/products' };
  }

  /**
   * Format message for display with emojis and styling
   */
  static formatMessageForDisplay(message: string): string {
    // Add emojis based on content
    if (message.includes('found') && message.includes('products')) {
      return `🎉 ${message}`;
    }
    if (message.includes('cart')) {
      return `🛒 ${message}`;
    }
    if (message.includes('wishlist')) {
      return `❤️ ${message}`;
    }
    if (message.includes('error') || message.includes('sorry')) {
      return `😅 ${message}`;
    }
    if (message.includes('help') || message.includes('assist')) {
      return `🤝 ${message}`;
    }
    
    return message;
  }
}
