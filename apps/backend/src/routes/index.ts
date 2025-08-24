import { Router } from 'express';
import productRoutes from './productRoutes';
import cartRoutes from './cartRoutes';  
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import aiRoutes from './aiRoutes';

const router: Router = Router();

// Mount all route modules
router.use('/products', productRoutes);
router.use('/carts', cartRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);

// Use AI routes (AI Server + MCP, no LangChain complexity)
router.use('/ai', aiRoutes);

export default router;
