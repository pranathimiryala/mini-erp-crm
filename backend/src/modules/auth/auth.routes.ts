import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new AuthController();

router.post('/login', AuthValidation.login, validate, controller.login);
router.post('/register', AuthValidation.register, validate, controller.register);
router.get('/me', authenticate, controller.getMe);

export default router;
