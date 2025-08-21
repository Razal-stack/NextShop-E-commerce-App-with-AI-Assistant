import { Router } from 'express';
import { AIService } from '../services/aiService';
import productRoutes from './productRoutes';
import cartRoutes from './cartRoutes';  
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Mount all route modules
router.use('/products', productRoutes);
router.use('/carts', cartRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);

// Test endpoint for agent+LLM+MCP tool orchestration
router.post('/ai/query', async (req, res) => {
	try {
		const { query, userId, conversationHistory } = req.body;
		if (!query) {
			return res.status(400).json({ success: false, error: 'Missing query' });
		}
		// Use userId if provided, else default to 1
		const aiService = new AIService(userId ?? 1);
		const result = await aiService.run(query, conversationHistory || []);
		res.json({ success: true, result });
	} catch (error) {
		console.error('AI Service Error:', error);
		res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
	}
});

export default router;
