import { Router } from 'express';
import { AIService } from '../services/aiServiceNew';
import { ConversationMessage } from '../services/aiOrchestrator';
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

// AI query endpoint using new LangChain orchestration
router.post('/ai/query', async (req, res) => {
	try {
		const { query, userId, conversationHistory } = req.body;
		
		if (!query) {
			return res.status(400).json({ 
				success: false, 
				error: 'Missing query parameter' 
			});
		}

		console.log(`🔍 [Backend API] Processing AI query: "${query}"`);
		console.log(`👤 [Backend API] User ID: ${userId || 'undefined'}`);
		console.log(`💬 [Backend API] Conversation history: ${conversationHistory?.length || 0} messages`);

		// Use new AI service with orchestration
		const aiService = new AIService();
		const result = await aiService.processQuery(
			query, 
			conversationHistory || [], 
			userId
		);

		console.log(`✅ [Backend API] AI service result:`, JSON.stringify(result, null, 2));

		// Convert orchestrator result to frontend-expected format
		const response = convertToNexResponse(result, query);
		
		res.json({ 
			success: true, 
			result: response 
		});

	} catch (error) {
		console.error('❌ [Backend API] AI query failed:', error);
		res.status(500).json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		});
	}
});

/**
 * Convert AIOrchestrator result to frontend NexResponse format
 */
function convertToNexResponse(orchestratorResult: any, originalQuery: string): any {
	if (!orchestratorResult.success) {
		return {
			message: orchestratorResult.message || 'Sorry, I encountered an error.',
			displayMode: 'chat_only' as const,
			data: null,
			actions: []
		};
	}

	const { intent, data, message } = orchestratorResult;

	switch (intent) {
		case 'product_search':
			return {
				message: message || `Here are the products I found for "${originalQuery}"`,
				displayMode: 'dual_view' as const,
				data: {
					products: data?.products || [],
					totalFound: data?.totalFound || 0
				},
				actions: data?.products?.length ? [
					{
						type: 'filter_products' as const,
						payload: {
							appliedFilters: data.appliedFilters,
							query: originalQuery
						}
					}
				] : []
			};

		case 'ui_handling_action':
			return {
				message: message || 'Let me help you with that.',
				displayMode: 'auto_navigate' as const,
				data: data || null,
				actions: [
					{
						type: 'navigate' as const,
						payload: data || { action: 'unknown' }
					}
				]
			};

		case 'general_chat':
		default:
			return {
				message: message || 'How can I help you with your shopping today?',
				displayMode: 'chat_only' as const,
				data: null,
				actions: []
			};
	}
}

export default router;
