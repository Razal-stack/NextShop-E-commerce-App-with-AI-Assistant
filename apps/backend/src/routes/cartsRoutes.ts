import { Router } from 'express';
import { CartsController } from '../controllers';
import { validateParams, validateBody, validateQuery } from '../middleware/validation';
import { 
  CartIdSchema, 
  UserIdSchema, 
  CreateCartSchema, 
  UpdateCartSchema,
  CartQuerySchema 
} from '../schemas/validation';

const router = Router();
const cartsController = new CartsController();

// GET /api/carts - Get all carts (with optional query params)
router.get('/', validateQuery(CartQuerySchema), cartsController.getAllCarts);

// GET /api/carts/user/:userId - Get carts for specific user (FakeStore standard)
router.get('/user/:userId', validateParams(UserIdSchema), cartsController.getUserCarts);

// GET /api/carts/:id - Get single cart by ID
router.get('/:id', validateParams(CartIdSchema), cartsController.getCartById);

// POST /api/carts - Create new cart
router.post('/', validateBody(CreateCartSchema), cartsController.createCart);

// PUT /api/carts/:id - Update cart
router.put('/:id', 
  validateParams(CartIdSchema),
  validateBody(UpdateCartSchema),
  cartsController.updateCart
);

// DELETE /api/carts/:id - Delete cart
router.delete('/:id', validateParams(CartIdSchema), cartsController.deleteCart);

const cartsRoutes = router;
export default cartsRoutes;
