import { Router } from 'express';
import { AuthController } from '../controllers';
import { validateBody } from '../middleware/validation';
import { LoginSchema } from '../schemas/validation';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login - User authentication (FakeStore standard)
router.post('/login', validateBody(LoginSchema), authController.loginUser);

const authRoutes = router;
export default authRoutes;
