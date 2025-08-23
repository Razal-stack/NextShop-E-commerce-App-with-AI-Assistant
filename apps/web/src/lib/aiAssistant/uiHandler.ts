import { Product } from '@/lib/types';
import { ProcessedResponse, ResponsePreprocessor } from './responsePreprocessor';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'nex';
  timestamp: Date;
  products?: Product[];
  displayMode?: 'chat_only' | 'auto_navigate' | 'dual_view';
  totalFound?: number;
  steps?: Array<{
    step: number;
    description: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

export interface UIHandlerConfig {
  onNavigate?: (payload: any) => void;
  onProductAction?: (action: 'add_to_cart' | 'add_to_wishlist', product: Product) => void;
  onError?: (error: string) => void;
}

export class AIAssistantUIHandler {
  private config: UIHandlerConfig;

  constructor(config: UIHandlerConfig = {}) {
    this.config = config;
  }

  /**
   * Process raw response and create chat message
   */
  processResponse(rawResponse: any, userMessage: string): ChatMessage {
    const processedResponse = ResponsePreprocessor.processResponse(rawResponse);
    
    // Handle navigation if required
    if (ResponsePreprocessor.shouldNavigate(processedResponse) && this.config.onNavigate) {
      const payload = ResponsePreprocessor.getNavigationPayload(processedResponse);
      setTimeout(() => {
        this.config.onNavigate?.(payload);
      }, 1000); // Delay navigation to show response first
    }

    // Create chat message
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      text: ResponsePreprocessor.formatMessageForDisplay(processedResponse.message),
      sender: 'nex',
      timestamp: new Date(),
      products: processedResponse.products,
      displayMode: processedResponse.displayMode,
      totalFound: processedResponse.totalFound,
      steps: processedResponse.steps
    };

    return message;
  }

  /**
   * Handle product actions (add to cart, wishlist, etc.)
   */
  handleProductAction(action: 'add_to_cart' | 'add_to_wishlist', product: Product) {
    try {
      this.config.onProductAction?.(action, product);
      
      // Show success toast
      const actionText = action === 'add_to_cart' ? 'cart' : 'wishlist';
      toast.success(`${product.title} added to ${actionText}!`);
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      this.config.onError?.(`Failed to add item to ${action === 'add_to_cart' ? 'cart' : 'wishlist'}`);
      toast.error('Failed to add item. Please try again.');
    }
  }

  /**
   * Format typing indicator message
   */
  createTypingMessage(): ChatMessage {
    return {
      id: 'typing-indicator',
      text: 'Nex is thinking...',
      sender: 'nex',
      timestamp: new Date()
    };
  }

  /**
   * Create error message
   */
  createErrorMessage(error: string): ChatMessage {
    return {
      id: crypto.randomUUID(),
      text: `😅 ${error}`,
      sender: 'nex',
      timestamp: new Date()
    };
  }

  /**
   * Create user message
   */
  createUserMessage(text: string): ChatMessage {
    return {
      id: crypto.randomUUID(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };
  }

  /**
   * Validate message before sending
   */
  validateMessage(text: string): { valid: boolean; error?: string } {
    const trimmed = text.trim();
    
    if (!trimmed) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    if (trimmed.length > 1000) {
      return { valid: false, error: 'Message too long (max 1000 characters)' };
    }

    return { valid: true };
  }

  /**
   * Build conversation history for API with product context
   */
  buildConversationHistory(messages: ChatMessage[]): Array<{ role: string; content: string; products?: any[]; timestamp?: string }> {
    return messages
      .filter(msg => msg.id !== 'typing-indicator') // Exclude typing indicator
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
        products: msg.products || [],
        timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
        metadata: {
          displayMode: msg.displayMode,
          totalFound: msg.totalFound,
          hasProducts: !!(msg.products && msg.products.length > 0)
        }
      }));
  }

  /**
   * Handle quick suggestions
   */
  processQuickSuggestion(suggestionText: string): string {
    // Remove "Ask:" or "Try:" prefixes for actual processing
    return suggestionText.replace(/^(Ask|Try):\s*/i, '');
  }

  /**
   * Determine if products should be shown in expanded view
   */
  shouldShowExpandedProducts(message: ChatMessage): boolean {
    return !!(message.products && message.products.length > 0 && message.displayMode !== 'chat_only');
  }

  /**
   * Get display limit for products in chat
   */
  getProductDisplayLimit(message: ChatMessage): number {
    if (!message.products) return 0;
    
    // Show more products in dual view, fewer in chat-only
    if (message.displayMode === 'dual_view') return 6;
    if (message.displayMode === 'auto_navigate') return 4;
    return 3; // chat_only
  }

  /**
   * Format product count message
   */
  formatProductCountMessage(total: number, shown: number): string {
    if (total <= shown) return '';
    
    const remaining = total - shown;
    return `... and ${remaining} more product${remaining > 1 ? 's' : ''}`;
  }
}
