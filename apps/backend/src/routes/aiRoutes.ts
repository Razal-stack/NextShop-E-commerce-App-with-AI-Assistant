import { Router } from 'express';
import { handleTextQuery, handleImageQuery } from '../controllers/aiController';

const router = Router();

router.post('/api/ai/query', handleTextQuery);
router.post('/api/ai/image-query', handleImageQuery);

export default router;
