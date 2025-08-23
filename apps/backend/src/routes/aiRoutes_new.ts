import express, { Router } from 'express';
import { AIService } from '../services/aiService';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';

const router: Router = express.Router();

// Enhanced request schemas
const chatRequestSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  userId: z.number().int().positive("User ID must be a positive integer"),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([])
});

const imageSearchSchema = z.object({
  image_b64: z.string().min(1, "Image data is required"),
  userId: z.number().int().positive("User ID must be a positive integer")
});

const handlerConfirmationSchema = z.object({
  handlerType: z.string().min(1, "Handler type is required"),
  handlerData: z.any().optional(),
  userId: z.number().int().positive("User ID must be a positive integer")
});

// Main chat endpoint with enhanced AI reasoning
router.post('/chat', validateRequest({ body: chatRequestSchema }), async (req, res) => {
  try {
    const { query, userId, conversationHistory } = req.body;
    const aiService = new AIService(userId);
    
    console.log(`Processing AI chat request for user ${userId}: ${query.substring(0, 50)}...`);
    
    const response = await aiService.run(query, conversationHistory);
    
    // Log execution plan if available
    if (response.executionPlan) {
      console.log(`Execution plan generated with ${response.executionPlan.steps.length} steps`);
    }
    
    // Log UI handlers if available
    if (response.uiHandlers && response.uiHandlers.length > 0) {
      console.log(`UI handlers created: ${response.uiHandlers.map(h => h.type).join(', ')}`);
    }
    
    res.json({
      success: true,
      data: response,
      metadata: {
        timestamp: new Date().toISOString(),
        userId,
        queryLength: query.length,
        responseType: response.displayMode,
        hasExecutionPlan: !!response.executionPlan,
        hasUIHandlers: !!(response.uiHandlers && response.uiHandlers.length > 0)
      }
    });
    
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallback: {
        message: "I'm experiencing some technical difficulties. Please try rephrasing your question or try again later.",
        displayMode: 'chat_only'
      }
    });
  }
});

// Image search endpoint
router.post('/image-search', validateRequest({ body: imageSearchSchema }), async (req, res) => {
  try {
    const { image_b64, userId } = req.body;
    const aiService = new AIService(userId);
    
    console.log(`Processing image search for user ${userId}`);
    
    const response = await aiService.imageSearch(image_b64);
    
    res.json({
      success: true,
      data: response,
      metadata: {
        timestamp: new Date().toISOString(),
        userId,
        imageProcessed: true
      }
    });
    
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Image processing failed',
      fallback: {
        message: "I couldn't analyze that image. Please try a different image or describe what you're looking for in text.",
        displayMode: 'chat_only'
      }
    });
  }
});

// UI Handler confirmation endpoint
router.post('/confirm-handler', validateRequest({ body: handlerConfirmationSchema }), async (req, res) => {
  try {
    const { handlerType, handlerData, userId } = req.body;
    
    console.log(`Processing UI handler confirmation: ${handlerType} for user ${userId}`);
    
    // Process the handler based on type
    let result: { success: boolean; message: string; redirect?: string } = { 
      success: false, 
      message: 'Unknown handler type' 
    };
    
    switch (handlerType) {
      case 'add_to_cart':
        // Integrate with cart service
        if (handlerData?.products && Array.isArray(handlerData.products)) {
          const cartService = require('../services/cartService');
          const addResults = await Promise.all(
            handlerData.products.map((product: any) => 
              cartService.addItem(userId, product.id, product.quantity || 1)
            )
          );
          const successCount = addResults.filter(r => r.success).length;
          result = {
            success: successCount === handlerData.products.length,
            message: `Successfully added ${successCount}/${handlerData.products.length} products to cart`
          };
        }
        break;
        
      case 'remove_from_cart':
        if (handlerData?.product_ids && Array.isArray(handlerData.product_ids)) {
          const cartService = require('../services/cartService');
          const removeResults = await Promise.all(
            handlerData.product_ids.map((productId: string) => 
              cartService.removeItem(userId, productId)
            )
          );
          const successCount = removeResults.filter(r => r.success).length;
          result = {
            success: successCount === handlerData.product_ids.length,
            message: `Successfully removed ${successCount}/${handlerData.product_ids.length} products from cart`
          };
        }
        break;
        
      case 'show_product_details':
        result = {
          success: true,
          message: 'Product details request acknowledged',
          redirect: `/products/${handlerData?.product_id}`
        };
        break;
        
      case 'login_required':
        result = {
          success: true,
          message: 'Login redirect initiated',
          redirect: '/auth/login'
        };
        break;
        
      default:
        result = {
          success: false,
          message: `Handler type '${handlerType}' is not supported`
        };
    }
    
    res.json({
      success: result.success,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        userId,
        handlerType,
        processed: true
      }
    });
    
  } catch (error) {
    console.error('Handler confirmation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Handler processing failed'
    });
  }
});

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    // Check AI reasoning server connectivity
    const axios = require('axios');
    const AI_INFERENCE_URL = process.env.AI_INFERENCE_URL || 'http://localhost:8000';
    
    const healthCheck = await axios.get(`${AI_INFERENCE_URL}/health`, { timeout: 5000 });
    
    res.json({
      success: true,
      status: 'healthy',
      aiServer: {
        connected: true,
        status: healthCheck.data?.status || 'unknown',
        url: AI_INFERENCE_URL
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI service health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'AI reasoning server unavailable',
      aiServer: {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
