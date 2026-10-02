
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
router.get('/id/:certificateId', verifyByIdController);
router.post('/hash', verifyByHashController);
router.get('/hash/:hash', verifyByHashController);
router.post('/transaction', verifyByTransactionController);
router.get('/transaction/:transactionHash', verifyByTransactionController);
router.post('/qr', verifyByQrController);
router.post('/bulk', verifyBulkController);
router.get('/:certificateId', verifyByIdController);

export default router;
