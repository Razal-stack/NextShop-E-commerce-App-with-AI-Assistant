// Frontend MCP Client for NextShop AI Assistant
export interface NexResponse {
  message: string;
  displayMode: 'chat_only' | 'auto_navigate' | 'dual_view';
  data?: {
    products?: any[];
    totalFound?: number;
    cart?: any;
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

export interface McpClient {
  sendMessage(messages: Array<{ role: string; content: string }>, overrideQuery?: string): Promise<NexResponse>;
  sendImage?(base64String: string): Promise<{ caption: string }>;
}

export function createMcpClient(token?: string | null): McpClient {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return {
    async sendMessage(messages: Array<{ role: string; content: string }>, overrideQuery?: string): Promise<NexResponse> {
      try {
        // Convert messages to a single query string (take last user message or use overrideQuery)
        let query = overrideQuery;
        if (!query && messages && messages.length > 0) {
          // Find the last user message
          const userMessages = messages.filter(m => m.role === 'user');
          query = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
        }
        if (!query) query = '';

        // Convert messages to conversation history format for backend
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        const res = await fetch(`${backendUrl}/api/ai/query`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ query, userId: 1, conversationHistory }),
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data: AIResponse = await res.json();
        
        if (!data.success) {
          throw new Error(data.error || 'AI service error');
        }
        
        return data.result || {
          message: 'Sorry, I couldn\'t process your request.',
          displayMode: 'chat_only'
        };
      } catch (error) {
        console.error('MCP Client Error:', error);
        throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async sendImage(base64String: string): Promise<{ caption: string }> {
      try {
        const res = await fetch(`${backendUrl}/api/ai/image-query`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ image_b64: base64String }),
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        return { caption: data.response || 'Unable to analyze image' };
      } catch (error) {
        console.error('Image Analysis Error:', error);
        return { caption: 'Sorry, I couldn\'t analyze this image.' };
      }
    },
  };
}
