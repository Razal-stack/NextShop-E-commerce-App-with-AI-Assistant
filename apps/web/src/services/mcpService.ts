/**
 * MCP (Model Context Protocol) Service
 * Handles all AI-related communication using the centralized HTTP service
 */

import { aiHttpService, httpService, ProgressCallback } from './httpService';

export interface NexResponse {
  message: string;
  displayMode: 'chat_only' | 'auto_navigate' | 'dual_view';
  data?: {
    products?: any[];
    totalFound?: number;
    cart?: any;
    uiActions?: {
      instructions: string[];
      handlers: string[];
    };
  };
  actions?: {
    type: 'navigate' | 'filter_products' | 'add_to_cart' | 'add_to_wishlist';
    payload: any;
  }[];
}

export interface AIResponse {
  success: boolean;
  result?: NexResponse;
  error?: string;
}

export interface ConversationMessage {
  role: string;
  content: string;
}

export interface McpClient {
  sendMessage(
    messages: ConversationMessage[], 
    overrideQuery?: string,
    progressCallback?: ProgressCallback
  ): Promise<NexResponse>;
  sendImage?(base64String: string): Promise<{ caption: string }>;
}

class McpService implements McpClient {
  /**
   * Send message to AI service
   */
  async sendMessage(
    messages: ConversationMessage[], 
    overrideQuery?: string,
    progressCallback?: ProgressCallback
  ): Promise<NexResponse> {
    try {
      // Convert messages to a single query string (take last user message or use overrideQuery)
      let query = overrideQuery;
      if (!query && messages && messages.length > 0) {
        const userMessages = messages.filter(m => m.role === 'user');
        query = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
      }
      if (!query) query = '';

      // Convert messages to conversation history format for backend
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Use aiHttpService for AI requests with progress callback
      const response = await aiHttpService.aiRequest<AIResponse>(
        '/api/ai/query',
        { 
          query, 
          userId: 1, 
          conversationHistory 
        },
        {}, // Additional config if needed
        progressCallback
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'AI service error');
      }
      
      return response.data.result || {
        message: 'Sorry, I couldn\'t process your request.',
        displayMode: 'chat_only'
      };

    } catch (error: any) {
      console.error('MCP Service Error:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to get AI response. Please try again.';
      
      if (error.isTimeout) {
        errorMessage = 'The AI is processing your request (this can take 2-3 minutes on first use while the model loads). Please wait a moment and try again, or try a simpler question.';
      } else if (error.isNetworkError) {
        errorMessage = 'Unable to connect to the AI service. Please check your internet connection and try again.';
      } else if (error.status === 408) {
        errorMessage = 'Request timeout - The AI is taking longer than usual. This might be due to a complex query. Please try again with a simpler request or wait a moment and retry.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Send image for analysis
   */
  async sendImage(base64String: string): Promise<{ caption: string }> {
    try {
      const response = await httpService.post<{ response?: string }>(
        '/api/ai/image-query',
        { image_b64: base64String }
      );
      
      return { caption: response.data.response || 'Unable to analyze image' };
    } catch (error) {
      console.error('Image Analysis Error:', error);
      return { caption: 'Sorry, I couldn\'t analyze this image.' };
    }
  }
}

// Create singleton instance
export const mcpService = new McpService();

/**
 * Factory function to create MCP client (backward compatibility)
 */
export function createMcpClient(token?: string | null): McpClient {
  return mcpService;
}

export default mcpService;
