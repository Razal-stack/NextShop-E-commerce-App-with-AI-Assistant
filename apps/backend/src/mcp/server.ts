import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
  ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { FakeStoreAPI } from '../services/fakeStore';
import { SessionManager } from '../services/session';

// Tool schemas
const LoginSchema = z.object({
  username: z.string(),
  password: z.string()
});

const AddToCartSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).default(1)
});

const UpdateCartSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(0)
});

const ProductFiltersSchema = z.object({
  category: z.string().optional(),
  limit: z.number().min(1).max(50).default(20).optional(),
  sort: z.enum(['asc', 'desc']).default('asc').optional()
});

export function createMCPServer() {
  const server = new Server(
    {
      name: 'nextshop-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const fakeStore = new FakeStoreAPI();
  const sessionManager = new SessionManager();

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'auth.login',
          description: 'Authenticate user with FakeStore API',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'Username for authentication' },
              password: { type: 'string', description: 'Password for authentication' }
            },
            required: ['username', 'password']
          }
        },
        {
          name: 'products.list',
          description: 'Get list of products with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Filter by category' },
              limit: { type: 'number', description: 'Limit number of results (1-50)', minimum: 1, maximum: 50 },
              sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' }
            }
          }
        },
        {
          name: 'products.get',
          description: 'Get a specific product by ID',
          inputSchema: {
            type: 'object',
            properties: {
              productId: { type: 'number', description: 'Product ID to fetch' }
            },
            required: ['productId']
          }
        },
        {
          name: 'products.categories',
          description: 'Get all available product categories',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'cart.get',
          description: 'Get current user cart',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'cart.add',
          description: 'Add product to cart',
          inputSchema: {
            type: 'object',
            properties: {
              productId: { type: 'number', description: 'Product ID to add' },
              quantity: { type: 'number', description: 'Quantity to add', minimum: 1 }
            },
            required: ['productId']
          }
        },
        {
          name: 'cart.update',
          description: 'Update product quantity in cart',
          inputSchema: {
            type: 'object',
            properties: {
              productId: { type: 'number', description: 'Product ID to update' },
              quantity: { type: 'number', description: 'New quantity (0 to remove)', minimum: 0 }
            },
            required: ['productId', 'quantity']
          }
        },
        {
          name: 'cart.remove',
          description: 'Remove product from cart',
          inputSchema: {
            type: 'object',
            properties: {
              productId: { type: 'number', description: 'Product ID to remove' }
            },
            required: ['productId']
          }
        },
        {
          name: 'cart.clear',
          description: 'Clear all items from cart',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;
    const sessionId = 'default'; // Simplified for now
    
    try {
      switch (name) {
        case 'auth.login': {
          const { username, password } = LoginSchema.parse(args);
          const result = await fakeStore.login(username, password);
          
          if (result.token) {
            sessionManager.setSession(sessionId, {
              token: result.token,
              userId: result.userId,
              username
            });
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Login successful',
                  userId: result.userId
                })
              }
            ]
          };
        }

        case 'products.list': {
          const filters = ProductFiltersSchema.parse(args || {});
          const products = await fakeStore.getProducts(filters);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  products,
                  count: products.length
                })
              }
            ]
          };
        }

        case 'products.get': {
          const { productId } = z.object({ productId: z.number() }).parse(args);
          const product = await fakeStore.getProduct(productId);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  product
                })
              }
            ]
          };
        }

        case 'products.categories': {
          const categories = await fakeStore.getCategories();
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  categories
                })
              }
            ]
          };
        }

        case 'cart.get': {
          const session = sessionManager.getSession(sessionId);
          if (!session?.userId) {
            throw new Error('Authentication required');
          }
          
          const cart = await fakeStore.getCart(session.userId);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  cart
                })
              }
            ]
          };
        }

        case 'cart.add': {
          const session = sessionManager.getSession(sessionId);
          if (!session?.userId) {
            throw new Error('Authentication required');
          }
          
          const { productId, quantity = 1 } = AddToCartSchema.parse(args);
          const result = await fakeStore.addToCart(session.userId, productId, quantity);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Product added to cart',
                  cart: result
                })
              }
            ]
          };
        }

        case 'cart.update': {
          const session = sessionManager.getSession(sessionId);
          if (!session?.userId) {
            throw new Error('Authentication required');
          }
          
          const { productId, quantity } = UpdateCartSchema.parse(args);
          const result = await fakeStore.updateCartItem(session.userId, productId, quantity);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: quantity === 0 ? 'Product removed from cart' : 'Cart updated',
                  cart: result
                })
              }
            ]
          };
        }

        case 'cart.remove': {
          const session = sessionManager.getSession(sessionId);
          if (!session?.userId) {
            throw new Error('Authentication required');
          }
          
          const { productId } = z.object({ productId: z.number() }).parse(args);
          const result = await fakeStore.removeFromCart(session.userId, productId);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Product removed from cart',
                  cart: result
                })
              }
            ]
          };
        }

        case 'cart.clear': {
          const session = sessionManager.getSession(sessionId);
          if (!session?.userId) {
            throw new Error('Authentication required');
          }
          
          const result = await fakeStore.clearCart(session.userId);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Cart cleared',
                  cart: result
                })
              }
            ]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        ],
        isError: true
      };
    }
  });

  return {
    server,
    async connect() {
      const transport = new StdioServerTransport();
      await server.connect(transport);
    }
  };
}
