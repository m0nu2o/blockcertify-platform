
import { Router } from 'express';
import { listNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', listNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
router.delete('/:id', deleteNotification);

export default router;
