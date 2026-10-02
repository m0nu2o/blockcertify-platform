
import { Router } from 'express';
import {
  approveInstitution,
  createAdminUser,
  getAuditLogs,
  getBlockchainTransactions,
  getInstitutions,
  getUsers,
  getVerificationLogs,
  suspendInstitution,
  updateSettings,
  reconcileCertificatesController,
  getAdminSubscriptions,
  approveAdminSubscription,
  rejectAdminSubscription,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getSettings } from '../controllers/settingsController.js';

const router = Router();

router.use(authenticate, authorize('admin'));
router.get('/users', getUsers);
router.post('/users', createAdminUser);
router.get('/institutions', getInstitutions);
router.patch('/institutions/:id/approve', approveInstitution);
router.patch('/institutions/:id/suspend', suspendInstitution);
router.get('/subscriptions', getAdminSubscriptions);
router.post('/subscriptions/:id/approve', approveAdminSubscription);
router.patch('/subscriptions/:id/approve', approveAdminSubscription);
router.post('/subscriptions/:id/reject', rejectAdminSubscription);
router.patch('/subscriptions/:id/reject', rejectAdminSubscription);
router.get('/audit-logs', getAuditLogs);
router.get('/blockchain-transactions', getBlockchainTransactions);
router.get('/verification-logs', getVerificationLogs);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.post('/reconcile', reconcileCertificatesController);

export default router;
