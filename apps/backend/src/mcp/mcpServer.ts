import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Use our new minimalist product search engine and existing cart tools
import { productTools } from './tools/productTools';
import { createAddToCartTool, createGetCartTool } from './tools/cartTools';

/**
 * MCP SERVER - Clean and efficient
 * No complications, just efficient tool execution
 */
export function createMCPServer() {
  const server = new Server(
    {
      name: 'nextshop-simple-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Get our essential tools only
  const userId = 1; // Default user for now
  const [mainSearchTool] = productTools;
  const addToCartTool = createAddToCartTool(userId);
  const getCartTool = createGetCartTool(userId);

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'products.search',
          description: mainSearchTool.description,
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query or LLM analysis JSON' }
            }
          }
        },
        {
          name: 'cart.add',
          description: addToCartTool.description,
          inputSchema: {
            type: 'object',
            properties: {
              productId: { type: 'number', description: 'Product ID to add' },
              quantity: { type: 'number', description: 'Quantity to add', default: 1 }
            }
          }
        },
        {
          name: 'cart.get',
          description: getCartTool.description,
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  });

  // Handle tool calls - delegate to clean tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case 'products.search':
          console.log(`[MCP Server] Calling products.search with:`, args);
          result = await mainSearchTool.func(JSON.stringify(args || {}));
          break;

        case 'cart.add':
          console.log(`[MCP Server] Calling cart.add with:`, args);
          result = await addToCartTool.func(JSON.stringify(args || {}));
          break;

        case 'cart.get':
          console.log(`[MCP Server] Calling cart.get`);
          result = await getCartTool.func('{}');
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Parse the result to ensure it's valid JSON
      const parsedResult = JSON.parse(result);

      return {
        content: [
          {
            type: 'text',
            text: result
          }
        ]
      };

    } catch (error) {
      console.error(`[MCP Server] Tool execution failed:`, error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        ]
      };
    }
  });

  // Connect function for standalone use
  async function connect() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[MCP Server] Server connected and ready');
  }

  return { server, connect };
}

// For direct usage in our backend (no stdio needed)
export function callToolDirectly(toolName: string, args: any) {
  const userId = 1;
  const [mainSearchTool] = productTools;
  
  switch (toolName) {
    case 'products.search':
    case 'products.list':
    case 'search_products':
      return mainSearchTool.func(JSON.stringify(args));
      
    case 'cart.add':
      const addToCartTool = createAddToCartTool(userId);
      return addToCartTool.func(JSON.stringify(args));
      
    case 'cart.get':
      const getCartTool = createGetCartTool(userId);
      return getCartTool.func('{}');
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
