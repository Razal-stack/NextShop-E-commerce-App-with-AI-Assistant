/**
 * MCP TOOL DEFINITIONS - CENTRALIZED SOURCE OF TRUTH
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema?: any;
}

/**
 * Centralized tool definitions used by both MCP server and AI service
 * This ensures consistency and professional architecture
 */
export const MCP_TOOL_DEFINITIONS: MCPToolDefinition[] = [
  {
    name: 'auth.login',
    description: 'Authenticate user with FakeStore API credentials'
  },
  {
    name: 'products.list',
    description: 'Advanced product search with AI analysis support. Supports natural language queries, category filtering, price constraints, variants, and intelligent ranking'
  },
  {
    name: 'products.search',
    description: 'Smart product search with filtering, fallback, and AI integration. Handles category filtering, price/rating constraints, gift mode, and UI handlers'
  },
  {
    name: 'products.get',
    description: 'Get a specific product by ID with detailed information'
  },
  {
    name: 'products.categories',
    description: 'Get all available product categories dynamically'
  },
  {
    name: 'cart.get',
    description: 'Get current user cart contents with product details'
  },
  {
    name: 'cart.add',
    description: 'Add products to user cart with quantity specification'
  },
  {
    name: 'cart.update',
    description: 'Update product quantities in user cart'
  },
  {
    name: 'cart.remove',
    description: 'Remove specific products from user cart'
  },
  {
    name: 'cart.clear',
    description: 'Clear all products from user cart'
  }
];

/**
 * Get MCP tool context for AI server communication
 */
export function getMCPToolsContext(): Array<{ name: string; description: string }> {
  return MCP_TOOL_DEFINITIONS.map(tool => ({
    name: tool.name,
    description: tool.description
  }));
}

/**
 * Get tool definition by name
 */
export function getToolDefinition(toolName: string): MCPToolDefinition | undefined {
  return MCP_TOOL_DEFINITIONS.find(tool => tool.name === toolName);
}

/**
 * Get all available tool names
 */
export function getAvailableToolNames(): string[] {
  return MCP_TOOL_DEFINITIONS.map(tool => tool.name);
}
