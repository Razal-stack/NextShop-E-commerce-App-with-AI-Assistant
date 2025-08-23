// UI Handler Types and Interfaces for NextShop AI Assistant

export interface UIHandler {
    type: string; // "add_to_cart", "remove_from_cart", "login", "confirmation", "show_product_details"
    description: string;
    data?: any;
    requiresConfirmation?: boolean;
}

export interface ExecutionStep {
    step_number: number;
    step_type: string; // "data_fetch", "filter", "search", "ui_action"
    tool_name: string;
    description: string;
    parameters: any;
    depends_on?: number[];
    optional?: boolean;
}

export interface NexResponse {
    message: string;
    displayMode: 'chat_only' | 'auto_navigate' | 'dual_view';
    data?: {
        products?: any[];
        totalFound?: number;
        cart?: any;
    };
    actions?: {
        type: 'navigate' | 'filter_products' | 'add_to_cart' | 'add_to_wishlist' | 'ui_handler';
        payload: any;
    }[];
    executionPlan?: {
        steps: ExecutionStep[];
        requiresUserConfirmation?: boolean;
    };
    uiHandlers?: UIHandler[];
}

export interface AppReasoningRequest {
    app_name: string;
    user_query: string;
    available_categories?: string[];
    conversation_history?: Array<{role: string, content: string, timestamp?: string}>;
    mcp_tools_context?: any[];
    ui_handlers_context?: any[];
    current_filters?: any;
    user_session?: any;
}

export interface AppReasoningResponse {
    query_analysis: {
        intent: string;
        confidence: number;
        detected_entities: any;
        requires_conversation_context: boolean;
    };
    execution_plan: ExecutionStep[];
    fallback_response?: string;
    expected_result_format: string;
    ui_guidance?: string;
    processing_time_ms: number;
    model_used: string;
    app_config_used: string;
}

// UI Handler Processing Functions
export class UIHandlerProcessor {
    
    static async processAddToCart(products: any[]): Promise<{ success: boolean, message: string }> {
        try {
            // Integration with cart service
            const results = await Promise.all(
                products.map(product => 
                    fetch('/api/cart/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            productId: product.id, 
                            quantity: product.quantity || 1 
                        })
                    }).then(res => res.json())
                )
            );
            
            const successCount = results.filter(r => r.success).length;
            return {
                success: successCount === products.length,
                message: `Successfully added ${successCount}/${products.length} products to cart`
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to add products to cart'
            };
        }
    }
    
    static async processRemoveFromCart(productIds: string[]): Promise<{ success: boolean, message: string }> {
        try {
            const results = await Promise.all(
                productIds.map(id => 
                    fetch(`/api/cart/remove/${id}`, {
                        method: 'DELETE'
                    }).then(res => res.json())
                )
            );
            
            const successCount = results.filter(r => r.success).length;
            return {
                success: successCount === productIds.length,
                message: `Successfully removed ${successCount}/${productIds.length} products from cart`
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to remove products from cart'
            };
        }
    }
    
    static async processLoginRequired(): Promise<{ success: boolean, message: string }> {
        try {
            // Redirect to login page
            window.location.href = '/auth/login';
            return {
                success: true,
                message: 'Redirecting to login...'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to redirect to login'
            };
        }
    }
    
    static async processShowProductDetails(productId: string): Promise<{ success: boolean, message: string }> {
        try {
            // Navigate to product page
            window.location.href = `/products/${productId}`;
            return {
                success: true,
                message: 'Opening product details...'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to open product details'
            };
        }
    }
    
    static async processHandler(handler: UIHandler): Promise<{ success: boolean, message: string }> {
        switch (handler.type) {
            case 'add_to_cart':
                return this.processAddToCart(handler.data?.products || []);
            case 'remove_from_cart':
                return this.processRemoveFromCart(handler.data?.product_ids || []);
            case 'login_required':
                return this.processLoginRequired();
            case 'show_product_details':
                return this.processShowProductDetails(handler.data?.product_id);
            default:
                return {
                    success: false,
                    message: `Unknown handler type: ${handler.type}`
                };
        }
    }
}

// UI Handler Display Utilities
export class UIHandlerUtils {
    
    static getHandlerIcon(type: string): string {
        switch (type) {
            case 'add_to_cart':
            case 'remove_from_cart':
                return '🛒';
            case 'login_required':
                return '🔐';
            case 'show_product_details':
                return '👁️';
            case 'confirmation_required':
                return '❓';
            default:
                return '⚡';
        }
    }
    
    static getHandlerColor(type: string): string {
        switch (type) {
            case 'add_to_cart':
                return 'green';
            case 'remove_from_cart':
                return 'red';
            case 'login_required':
                return 'blue';
            case 'show_product_details':
                return 'purple';
            case 'confirmation_required':
                return 'orange';
            default:
                return 'gray';
        }
    }
    
    static formatHandlerTitle(type: string): string {
        return type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    static formatHandlerData(handler: UIHandler): string {
        if (!handler.data) return '';
        
        switch (handler.type) {
            case 'add_to_cart':
                if (handler.data.products) {
                    const count = handler.data.products.length;
                    return `${count} product${count > 1 ? 's' : ''}`;
                }
                break;
            case 'remove_from_cart':
                if (handler.data.product_ids) {
                    const count = handler.data.product_ids.length;
                    return `${count} product${count > 1 ? 's' : ''}`;
                }
                break;
            case 'show_product_details':
                return `Product ID: ${handler.data.product_id}`;
            case 'confirmation_required':
                return 'Action requires confirmation';
        }
        
        return '';
    }
}
