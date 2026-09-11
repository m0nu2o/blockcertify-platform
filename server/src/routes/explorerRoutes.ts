import { Router } from 'express';
import { getLatestLedger } from '../controllers/explorerController.js';

const router = Router();

router.get('/latest', getLatestLedger);

export default router;
