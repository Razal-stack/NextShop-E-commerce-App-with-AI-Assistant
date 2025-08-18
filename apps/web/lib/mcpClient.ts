'use client';

import { MCPToolCall, MCPResponse } from './types';

class MCPClient {
  private baseURL: string;
  private sessionId: string;

  constructor(baseURL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:8001') {
    this.baseURL = baseURL;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  async callTool(tool: string, args: Record<string, any> = {}): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseURL}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Mcp-Session-Id': this.sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID(),
          method: 'tools/call',
          params: {
            name: tool,
            arguments: args,
          },
          meta: {
            sessionId: this.sessionId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        return {
          success: false,
          error: data.error.message || 'Unknown error',
        };
      }

      // Parse the content from MCP response
      const content = data.result?.content?.[0]?.text;
      if (content) {
        try {
          const parsedContent = JSON.parse(content);
          return parsedContent;
        } catch (e) {
          return { success: true, data: content };
        }
      }

      return {
        success: true,
        data: data.result,
      };
    } catch (error) {
      console.error('MCP Client Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async listTools(): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseURL}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Mcp-Session-Id': this.sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: crypto.randomUUID(),
          method: 'tools/list',
          params: {},
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.result?.tools || [],
      };
    } catch (error) {
      console.error('MCP List Tools Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Convenience methods for common operations
  async login(username: string, password: string): Promise<MCPResponse> {
    return this.callTool('auth.login', { username, password });
  }

  async getProducts(filters?: { category?: string; limit?: number; sort?: 'asc' | 'desc' }): Promise<MCPResponse> {
    return this.callTool('products.list', filters || {});
  }

  async getProduct(productId: number): Promise<MCPResponse> {
    return this.callTool('products.get', { productId });
  }

  async getCategories(): Promise<MCPResponse> {
    return this.callTool('products.categories');
  }

  async getCart(): Promise<MCPResponse> {
    return this.callTool('cart.get');
  }

  async addToCart(productId: number, quantity = 1): Promise<MCPResponse> {
    return this.callTool('cart.add', { productId, quantity });
  }

  async updateCart(productId: number, quantity: number): Promise<MCPResponse> {
    return this.callTool('cart.update', { productId, quantity });
  }

  async removeFromCart(productId: number): Promise<MCPResponse> {
    return this.callTool('cart.remove', { productId });
  }

  async clearCart(): Promise<MCPResponse> {
    return this.callTool('cart.clear');
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }
}

// Singleton instance
export const mcpClient = new MCPClient();

// React hooks for MCP operations
export function useMCPClient() {
  return mcpClient;
}
