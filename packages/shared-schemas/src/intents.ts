import { z } from 'zod';

// Define all possible intents that the AI assistant can understand
export const INTENTS = {
  // Product discovery
  SEARCH_PRODUCTS: 'search_products',
  FILTER_PRODUCTS: 'filter_products',
  BROWSE_CATEGORY: 'browse_category',
  GET_PRODUCT_DETAILS: 'get_product_details',
  COMPARE_PRODUCTS: 'compare_products',
  
  // Cart operations
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  UPDATE_CART_QUANTITY: 'update_cart_quantity',
  VIEW_CART: 'view_cart',
  CLEAR_CART: 'clear_cart',
  
  // Wishlist operations
  ADD_TO_WISHLIST: 'add_to_wishlist',
  REMOVE_FROM_WISHLIST: 'remove_from_wishlist',
  VIEW_WISHLIST: 'view_wishlist',
  
  // User authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Recommendations
  GET_RECOMMENDATIONS: 'get_recommendations',
  GET_TRENDING: 'get_trending',
  GET_DEALS: 'get_deals',
  
  // Visual and voice
  VISUAL_SEARCH: 'visual_search',
  VOICE_COMMAND: 'voice_command',
  
  // Smart lists
  CREATE_SMART_LIST: 'create_smart_list',
  ADD_TO_SMART_LIST: 'add_to_smart_list',
  VIEW_SMART_LISTS: 'view_smart_lists',
  
  // Help and general
  GENERAL_HELP: 'general_help',
  GET_STORE_INFO: 'get_store_info',
  
  // Price and filtering
  PRICE_RANGE_FILTER: 'price_range_filter',
  RATING_FILTER: 'rating_filter',
  AVAILABILITY_CHECK: 'availability_check',
} as const;

export type Intent = typeof INTENTS[keyof typeof INTENTS];

// Entity types that can be extracted from user input
export const EntitySchema = z.object({
  type: z.enum([
    'product_name',
    'category', 
    'price_range',
    'brand',
    'color',
    'size',
    'rating',
    'quantity',
    'product_id',
    'username',
    'password',
    'sort_order',
    'comparison_criteria'
  ]),
  value: z.any(),
  confidence: z.number().min(0).max(1),
  position: z.object({
    start: z.number(),
    end: z.number(),
  }).optional(),
});

export type Entity = z.infer<typeof EntitySchema>;

// Intent classification result
export const IntentClassificationSchema = z.object({
  intent: z.enum(Object.values(INTENTS) as [Intent, ...Intent[]]),
  confidence: z.number().min(0).max(1),
  entities: z.array(EntitySchema).optional(),
  parameters: z.record(z.any()).optional(),
  requiredAuth: z.boolean().default(false),
  multiStep: z.boolean().default(false),
});

export type IntentClassification = z.infer<typeof IntentClassificationSchema>;

// Planning schemas for multi-step operations
export const PlanStepSchema = z.object({
  id: z.string(),
  action: z.string(),
  description: z.string(),
  tool: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  dependencies: z.array(z.string()).optional(),
  estimatedTime: z.string().optional(),
  optional: z.boolean().default(false),
});

export type PlanStep = z.infer<typeof PlanStepSchema>;

export const ExecutionPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  intent: z.enum(Object.values(INTENTS) as [Intent, ...Intent[]]),
  steps: z.array(PlanStepSchema),
  estimatedTotal: z.number().optional(),
  affectedProducts: z.array(z.number()).optional(),
  requiresConfirmation: z.boolean().default(true),
  confidence: z.number().min(0).max(1),
  createdAt: z.date().default(() => new Date()),
});

export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

// Common parameter schemas for different intents
export const SearchParametersSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minRating: z.number().optional(),
  sortBy: z.enum(['price', 'rating', 'popularity', 'newest']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(50).optional(),
});

export const FilterParametersSchema = z.object({
  category: z.string().optional(),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
  rating: z.number().min(1).max(5).optional(),
  brand: z.string().optional(),
  availability: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const CartParametersSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1).optional(),
  variant: z.record(z.any()).optional(),
});

// Export all schemas
export const schemas = {
  Entity: EntitySchema,
  IntentClassification: IntentClassificationSchema,
  PlanStep: PlanStepSchema,
  ExecutionPlan: ExecutionPlanSchema,
  SearchParameters: SearchParametersSchema,
  FilterParameters: FilterParametersSchema,
  CartParameters: CartParametersSchema,
} as const;
