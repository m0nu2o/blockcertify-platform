import { Router } from 'express';
import {
  requestSubscriptionHandler,
  getCurrentSubscriptionHandler,
  cancelSubscriptionHandler,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/current', getCurrentSubscriptionHandler);
router.post('/request', requestSubscriptionHandler);
router.post('/cancel', cancelSubscriptionHandler);

export default router;
