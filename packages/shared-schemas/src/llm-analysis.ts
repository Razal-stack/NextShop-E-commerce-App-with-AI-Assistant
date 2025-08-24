import { z } from "zod";

// Shared LLM Analysis Schema used by both AI server and backend
export const LLMAnalysisSchema = z.object({
  intent: z.enum(['product_search', 'ui_handling_action', 'general_chat']),
  categories: z.array(z.string()).optional().default([]),
  product_items: z.array(z.string()).optional().default([]),
  variants: z.array(z.string()).optional().default([]),
  constraints: z.object({
    price: z.object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional()
    }).optional(),
    rating: z.number().nullable().optional()
  }).optional().default({}),
  ui_handlers: z.array(z.string()).optional().default([]),
  confidence: z.number().min(0).max(1),
  message: z.string().nullable().optional() // For general chat responses
});

export type LLMAnalysis = z.infer<typeof LLMAnalysisSchema>;

// Helper function to validate and normalize LLM response
export function validateLLMAnalysis(data: any): LLMAnalysis {
  return LLMAnalysisSchema.parse(data);
}
