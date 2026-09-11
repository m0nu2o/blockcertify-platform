
import { Router } from 'express';
import {
  approveInstitution,
  getAuditLogs,
  getBlockchainTransactions,
  getInstitutions,
  getUsers,
  getVerificationLogs,
  suspendInstitution,
  updateSettings,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getSettings } from '../controllers/settingsController.js';

const router = Router();

router.use(authenticate, authorize('admin'));
router.get('/users', getUsers);
router.get('/institutions', getInstitutions);
router.patch('/institutions/:id/approve', approveInstitution);
router.patch('/institutions/:id/suspend', suspendInstitution);
router.get('/audit-logs', getAuditLogs);
router.get('/blockchain-transactions', getBlockchainTransactions);
router.get('/verification-logs', getVerificationLogs);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

export default router;
