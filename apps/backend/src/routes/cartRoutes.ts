import { Router } from 'express';
import { CartController } from '../controllers';
import { validateParams, validateBody, validateQuery } from '../middleware/validation';
import { 
  CartIdSchema, 
  UserIdSchema, 
  CreateCartSchema, 
  UpdateCartSchema,
  CartQuerySchema 
} from '../schemas/validation';

const router = Router();
const cartController = new CartController();

// GET /api/carts - Get all carts (with optional query params)
router.get('/', validateQuery(CartQuerySchema), cartController.getAllCarts);

// GET /api/carts/user/:userId - Get carts for specific user (FakeStore standard)
router.get('/user/:userId', validateParams(UserIdSchema), cartController.getUserCarts);

// GET /api/carts/:id - Get single cart by ID
router.get('/:id', validateParams(CartIdSchema), cartController.getCartById);

// POST /api/carts - Create new cart
router.post('/', validateBody(CreateCartSchema), cartController.createCart);

// PUT /api/carts/:id - Update cart
router.put('/:id', 
  validateParams(CartIdSchema),
  validateBody(UpdateCartSchema),
  cartController.updateCart
);

// DELETE /api/carts/:id - Delete cart
router.delete('/:id', validateParams(CartIdSchema), cartController.deleteCart);

const cartsRoutes = router;
export default cartsRoutes;
