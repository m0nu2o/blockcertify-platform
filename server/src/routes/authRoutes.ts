
import { Router } from 'express';
import { forgotPassword, login, me, register, resetPassword, updateSubscription } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);
router.patch('/subscription', authenticate, updateSubscription);

export default router;
