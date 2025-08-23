import { Request, Response } from 'express';
import { AIService } from '../services/aiService';

export const handleTextQuery = async (req: Request, res: Response) => {
  try {
    const { query, conversationHistory = [] } = req.body;
    const userId = (req as any).user?.id || 1; // Default to user 1 if not authenticated
    
    console.log(`🎯 [AI Controller] Received query: "${query}" with ${conversationHistory.length} conversation turns`);
    if (conversationHistory.length > 0) {
      console.log(`📜 [AI Controller] Conversation context: ${conversationHistory.slice(-2).map((msg: any) => `${msg.role}: ${msg.content.substring(0, 50)}...`).join(' | ')}`);
    }
    
    const aiService = new AIService(userId);
    const response = await aiService.run(query, conversationHistory);
    
    console.log(`✅ [AI Controller] Response generated: ${response.message.substring(0, 100)}... (products: ${response.data?.products?.length || 0})`);
    
    res.json({ 
      success: true,
      result: response 
    });
  } catch (error) {
    console.error('❌ [AI Controller] Error:', error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
    });
  }
};

export const handleImageQuery = async (req: Request, res: Response) => {
  const { image_b64 } = req.body;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const aiService = new AIService(userId);
  const response = await aiService.imageSearch(image_b64);
  res.json({ response });
};
