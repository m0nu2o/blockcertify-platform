
import { Router } from 'express';
import { adminAnalytics, institutionAnalytics, overviewAnalytics, studentAnalytics } from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.get('/overview', overviewAnalytics);
router.get('/admin', authenticate, authorize('admin'), adminAnalytics);
router.get('/institution', authenticate, authorize('institution', 'admin'), institutionAnalytics);
router.get('/student', authenticate, authorize('student', 'admin'), studentAnalytics);

export default router;
