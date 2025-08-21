import { z } from 'zod';

// Product schema
export const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({
    rate: z.number(),
    count: z.number(),
  }),
  // Additional properties from backend API
  score: z.number().optional(),
  displayPrice: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// Cart item schema
export const CartItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  image: z.string(),
  quantity: z.number(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

// User session schema
export const UserSessionSchema = z.object({
  token: z.string(),
  userId: z.number(),
  username: z.string(),
  isAuthenticated: z.boolean(),
});

export type UserSession = z.infer<typeof UserSessionSchema>;

// MCP request/response schemas
export const MCPToolCallSchema = z.object({
  tool: z.string(),
  arguments: z.record(z.any()),
});

export type MCPToolCall = z.infer<typeof MCPToolCallSchema>;

export const MCPResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type MCPResponse = z.infer<typeof MCPResponseSchema>;

// AI Intent schemas for the planner
export const IntentSchema = z.enum([
  'search_products',
  'filter_products', 
  'get_product_details',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'clear_cart',
  'login',
  'get_categories',
  'price_range_filter',
  'rating_filter',
  'visual_search',
  'voice_command',
  'general_help'
]);

export type Intent = z.infer<typeof IntentSchema>;

export const IntentParametersSchema = z.object({
  intent: IntentSchema,
  parameters: z.record(z.any()),
  confidence: z.number().min(0).max(1),
  entities: z.array(z.object({
    type: z.string(),
    value: z.any(),
    confidence: z.number(),
  })).optional(),
});

export type IntentParameters = z.infer<typeof IntentParametersSchema>;

// Smart List schema for saved shopping lists
export const SmartListSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  products: z.array(z.object({
    productId: z.number(),
    quantity: z.number(),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()).optional(),
});

export type SmartList = z.infer<typeof SmartListSchema>;

// Assistant message schema
export const AssistantMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  sender: z.enum(['user', 'assistant']),
  timestamp: z.date(),
  type: z.enum(['text', 'image', 'voice', 'plan']).default('text'),
  metadata: z.record(z.any()).optional(),
});

export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

// Plan preview schema
export const PlanPreviewSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  steps: z.array(z.object({
    action: z.string(),
    description: z.string(),
    parameters: z.record(z.any()),
    estimated_time: z.string().optional(),
  })),
  products: z.array(ProductSchema).optional(),
  estimated_total: z.number().optional(),
  confidence: z.number().min(0).max(1),
});

export type PlanPreview = z.infer<typeof PlanPreviewSchema>;
