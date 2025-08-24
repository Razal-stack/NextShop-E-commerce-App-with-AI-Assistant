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
  uiActions?: {
    instructions: string[];
    handlers: string[];
  };
  awaitingConfirmation?: boolean;
  pendingAction?: {
    type: 'cart.add' | 'cart.remove' | 'wishlist.add' | 'wishlist.remove' | 'auth.login' | 'auth.logout';
    products?: Product[];
  };
  showCartButton?: boolean;
  showWishlistButton?: boolean;
  steps?: Array<{
    step: number;
    description: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

export interface UIHandlerConfig {
  onNavigate?: (payload: any) => void;
  onProductAction?: (action: 'add_to_cart' | 'add_to_wishlist', product: Product) => void;
  onUIAction?: (action: string, products?: Product[]) => void;
  onAuthAction?: (action: 'login' | 'logout') => void;
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
      // Execute navigation immediately - no delay needed
      this.config.onNavigate?.(payload);
    }

    // Check for UI actions from backend
    // Backend returns: { success: true, result: { data: { uiActions } } }
    const uiActions = rawResponse.result?.data?.uiActions || rawResponse.data?.uiActions;
    
    let awaitingConfirmation = false;
    let pendingAction = undefined;

    if (uiActions && uiActions.handlers && uiActions.handlers.length > 0) {
      // Determine if we need confirmation
      const needsConfirmation = this.needsUIActionConfirmation(uiActions.handlers);
      
      if (needsConfirmation) {
        // Set confirmation on the main message (not separate)
        awaitingConfirmation = true;
        pendingAction = this.createPendingAction(uiActions.handlers, processedResponse.products);
      } else {
        // Execute immediately for actions that don't need confirmation
        this.executeUIActions(uiActions.handlers, processedResponse.products);
      }
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
      uiActions: uiActions,
      awaitingConfirmation: awaitingConfirmation,
      pendingAction: pendingAction,
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
      text: `Sorry, ${error}`,
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

  createMessage(text: string, sender: 'user' | 'nex'): ChatMessage {
    return {
      id: crypto.randomUUID(),
      text: text,
      sender: sender,
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

  /**
   * Determine if UI action needs confirmation
   */
  private needsUIActionConfirmation(handlers: string[]): boolean {
    const confirmationActions = ['cart.add', 'cart.remove', 'wishlist.add', 'wishlist.remove'];
    return handlers.some(handler => confirmationActions.includes(handler));
  }

  /**
   * Create pending action object
   */
  private createPendingAction(handlers: string[], products?: Product[]): any {
    const handler = handlers[0]; // Use first handler for now
    return {
      type: handler,
      products: products || []
    };
  }

  /**
   * Execute UI actions immediately (for actions that don't need confirmation)
   */
  private executeUIActions(handlers: string[], products?: Product[]): void {
    handlers.forEach(handler => {
      switch (handler) {
        case 'auth.login':
          this.config.onAuthAction?.('login');
          break;
        case 'auth.logout':
          this.config.onAuthAction?.('logout');
          break;
        case 'cart.view':
        case 'wishlist.view':
        case 'orders.view':
          // These don't need confirmation, just trigger the UI
          this.config.onUIAction?.(handler, products);
          break;
      }
    });
  }

  /**
   * Execute confirmed UI action
   */
  executeConfirmedAction(action: any, products?: Product[]): void {
    switch (action.type) {
      case 'cart.add':
        products?.forEach(product => {
          this.config.onProductAction?.('add_to_cart', product);
        });
        break;
      case 'wishlist.add':
        products?.forEach(product => {
          this.config.onProductAction?.('add_to_wishlist', product);
        });
        break;
      case 'cart.remove':
        toast.info('Remove from cart functionality would be implemented here');
        break;
      case 'wishlist.remove':
        toast.info('Remove from wishlist functionality would be implemented here');
        break;
    }
  }

  /**
   * Create confirmation message for UI actions
   */
  createConfirmationMessage(action: any, products?: Product[]): ChatMessage {
    let confirmationText = '';
    
    switch (action.type) {
      case 'cart.add':
        confirmationText = `Would you like me to add the above listed product(s) to your cart?`;
        break;
      case 'wishlist.add':
        confirmationText = `Would you like me to add the above listed product(s) to your wishlist?`;
        break;
      case 'cart.remove':
        confirmationText = 'Would you like me to remove these items from your cart?';
        break;
      case 'wishlist.remove':
        confirmationText = 'Would you like me to remove these items from your wishlist?';
        break;
      default:
        confirmationText = 'Would you like me to proceed with this action?';
    }

    return {
      id: crypto.randomUUID(),
      text: confirmationText,
      sender: 'nex',
      timestamp: new Date(),
      awaitingConfirmation: true,
      pendingAction: action
      // NOTE: Don't include products here to avoid showing them again
    };
  }
}
