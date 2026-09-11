
import { Router } from 'express';
import {
  verifyByHashController,
  verifyByIdController,
  verifyByQrController,
  verifyByTransactionController,
  verifyBulkController,
} from '../controllers/verificationController.js';

const router = Router();

router.post('/id', verifyByIdController);
router.post('/hash', verifyByHashController);
router.post('/transaction', verifyByTransactionController);
router.post('/qr', verifyByQrController);
router.post('/bulk', verifyBulkController);

export default router;
