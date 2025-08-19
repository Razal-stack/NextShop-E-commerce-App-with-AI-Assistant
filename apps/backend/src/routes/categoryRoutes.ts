import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';

const router = Router();
const categoryController = new CategoryController();

// GET /api/categories - Get all categories
router.get('/', categoryController.getAllCategories);

export default router;
