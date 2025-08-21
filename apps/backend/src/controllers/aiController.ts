import { Request, Response } from 'express';
import { AIService } from '../services/aiService';

export const handleTextQuery = async (req: Request, res: Response) => {
  const { query } = req.body;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const aiService = new AIService(userId);
  const response = await aiService.run(query);
  res.json({ response });
};

export const handleImageQuery = async (req: Request, res: Response) => {
  const { image_b64 } = req.body;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const aiService = new AIService(userId);
  const response = await aiService.imageSearch(image_b64);
  res.json({ response });
};
