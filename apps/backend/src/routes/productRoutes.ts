import { Router } from 'express';
import { ProductController } from '../controllers';
import { validateQuery, validateParams } from '../middleware/validation';
import { ProductQuerySchema, ProductIdSchema, CategoryParamSchema } from '../schemas/validation';

const router = Router();
const productController = new ProductController();

// GET /api/products - Get all products with optional filters
router.get('/', validateQuery(ProductQuerySchema), productController.getAllProducts);

// GET /api/products/categories - Get all categories (MUST come before /:id)
router.get('/categories', productController.getCategories);

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', 
  validateParams(CategoryParamSchema),
  validateQuery(ProductQuerySchema),
  productController.getProductsByCategory
);

// GET /api/products/:id - Get single product by ID (MUST come after /categories)
router.get('/:id', validateParams(ProductIdSchema), productController.getProductById);

const productRoutes: Router = router;
export default productRoutes;
