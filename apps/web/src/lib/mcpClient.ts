// apps/web/src/lib/mcpClient.ts
import { McpClient } from '@nextshop/ai-assistant';

export function createMcpClient(token?: string | null): McpClient {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return {
    async sendMessage(messages: Array<{ role: string; content: string }>, overrideQuery?: string) {
      // Convert messages to a single query string (take last user message or use overrideQuery)
      let query = overrideQuery;
      if (!query && messages && messages.length > 0) {
        // Find the last user message
        const userMessages = messages.filter(m => m.role === 'user');
        query = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
      }
      if (!query) query = '';
      
      console.log('🔗 MCP Client - Sending query:', query);
      
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error('Failed to fetch from AI query proxy');
      const data = await res.json();
      
      console.log('🔗 MCP Client - Received response:', data);
      
      // Return the full response structure from backend
      // Backend sends: { success: true, result: { message, data: { products }, displayMode, steps } }
      return data; // Return complete response, not data.response
    },

    async sendImage(base64String: string) {
      const res = await fetch('/api/ai/image-query', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image_b64: base64String }),
      });
      if (!res.ok) throw new Error('Failed to fetch from AI image proxy');
      const data = await res.json();
      return { caption: data.response };
    },
  };
}
