/**
 * SUPER SIMPLIFIED MCP Client
 * Just uses our existing efficient tools directly - No complications!
 */
import { callToolDirectly } from '../mcp/mcpServer';

class SuperSimpleMCPClient {
  private connected = false;
  
  /**
   * Connect (just marks as ready)
   */
  async connect(): Promise<void> {
    console.log(`[Super Simple MCP] Connecting...`);
    this.connected = true;
    console.log(`[Super Simple MCP] Ready! Using existing efficient tools directly.`);
  }

  /**
   * Call tool - Uses our existing smart productTools.ts and cartTools.ts
   */
  async callTool(toolName: string, args: any): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    console.log(`[Super Simple MCP] → ${toolName}:`, args);
    
    try {
      // Use our existing efficient tools directly
      const result = await callToolDirectly(toolName, args);
      const parsedResult = JSON.parse(result);
      
      console.log(`[Super Simple MCP] ← ${toolName}:`, parsedResult.success ? 'SUCCESS' : 'FAILED');
      
      return {
        success: true,
        result: parsedResult
      };
      
    } catch (error) {
      console.error(`[Super Simple MCP] ${toolName} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List tools
   */
  async listTools(): Promise<string[]> {
    return ['products.search', 'cart.add', 'cart.get'];
  }

  isClientConnected(): boolean {
    return this.connected;
  }

  async refreshToolsList(): Promise<string[]> {
    return this.listTools();
  }
}

// Export singleton
export const mcpClient = new SuperSimpleMCPClient();
