import { Router } from 'express';
import { UserController } from '../controllers';
import { validateQuery, validateParams, validateBody } from '../middleware/validation';
import { UserQuerySchema, ProductIdSchema, CreateUserSchema, UpdateUserSchema } from '../schemas/validation';

const router = Router();
const userController = new UserController();

// GET /api/users - Get all users
router.get('/', validateQuery(UserQuerySchema), userController.getUsers);

// GET /api/users/:id - Get single user by ID
router.get('/:id', validateParams(ProductIdSchema), userController.getUser);

// POST /api/users - Create new user (FakeStore standard)
router.post('/', validateBody(CreateUserSchema), userController.createUser);

// PUT /api/users/:id - Update user (FakeStore standard)
router.put('/:id', 
  validateParams(ProductIdSchema),
  validateBody(UpdateUserSchema),
  userController.updateUser
);

// DELETE /api/users/:id - Delete user (FakeStore standard)
router.delete('/:id', validateParams(ProductIdSchema), userController.deleteUser);

const userRoutes: Router = router;
export default userRoutes;
