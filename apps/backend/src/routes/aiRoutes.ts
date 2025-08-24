import { Router, Request, Response } from 'express';
import { AIService } from '../services/aiService';

const router: Router = Router();

// Create singleton AI service
const aiService = new AIService();

// Initialize the service
aiService.initialize().catch((error: any) => {
  console.error('[AI Routes] Failed to initialize AI service:', error);
});

/**
 * Main AI Query Endpoint - MCP Architecture
 * Direct AI Analysis + MCP Tool Execution (No LangChain complexity)
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { query, userId, conversationHistory, context } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid query parameter' 
      });
    }

    const startTime = Date.now();
    
    console.log(`[AI Routes] Processing query: "${query}"`);
    console.log(`[AI Routes] User ID: ${userId || 'anonymous'}`);
    console.log(`[AI Routes] History: ${conversationHistory?.length || 0} messages`);
    
    // Add user message to history
    aiService.addToHistory('user', query);

    // Process with AI service (AI Server + MCP Tools)
    const result = await aiService.processQuery(
      query,
      context || { userId: userId || 1 },
      conversationHistory || []
    );

    // Add AI response to history
    aiService.addToHistory('assistant', result.message);

    const processingTime = Date.now() - startTime;
    console.log(`[AI Routes] Query processed in ${processingTime}ms`);
    console.log(`[AI Routes] Intent: ${result.intent}, UI Handlers: ${JSON.stringify(result.uiHandlers)}`);

    // Return structured response format matching frontend MCP client expectations
    res.json({ 
      success: result.success,
      result: {
        message: result.message,
        displayMode: 'dual_view', // Show products + chat
        data: result.data,
        actions: [], // Future: navigation actions
        totalFound: result.data?.totalFound
      },
      metadata: {
        ...result.metadata,
        processingTime,
        timestamp: new Date().toISOString(),
        architecture: 'mcp',
        intent: result.intent
      }
    });

  } catch (error) {
    console.error('[AI Routes] Query processing failed:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: 'AI query processing failed'
    });
  }
});

/**
 * Health check endpoint for AI service
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    console.log('[AI Routes] Health check requested');
    
    // Check AI service health
    const conversationHistory = aiService.getHistory();
    
    res.json({
      success: true,
      status: 'healthy',
      architecture: 'mcp',
      conversation_messages: conversationHistory.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Routes] Health check failed:', error);
    
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Clear conversation history
 */
router.post('/clear-history', async (req: Request, res: Response) => {
  try {
    console.log('[AI Routes] Clearing conversation history');
    
    aiService.clearHistory();
    
    res.json({
      success: true,
      message: 'Conversation history cleared',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Routes] Failed to clear history:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear history'
    });
  }
});

/**
 * Get conversation history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    console.log('[AI Routes] Fetching conversation history');
    
    const history = aiService.getHistory();
    
    res.json({
      success: true,
      history,
      count: history.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Routes] Failed to fetch history:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch history'
    });
  }
});

export default router;
