import { Router } from 'express';

// Import routes individually to avoid potential issues
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

export default router;
