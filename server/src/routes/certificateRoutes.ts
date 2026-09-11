
import { Router } from 'express';
import {
  createBulkCertificates,
  createCertificate,
  exportCertificatesController,
  getCertificate,
  listCertificates,
  revokeCertificateController,
  updateCertificateController,
  approveCertificateController,
  exportAuditLogsController,
  revokeBulkController,
} from '../controllers/certificateController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { upload, uploadCsv } from '../middlewares/upload.js';

const router = Router();

router.use(authenticate);
router.get('/', listCertificates);
router.get('/exports/audit-logs/:type', authorize('admin'), exportAuditLogsController);
router.get('/exports/:type', authorize('institution', 'admin'), exportCertificatesController);
router.post('/', authorize('institution', 'admin'), upload.single('certificatePdf'), createCertificate);
router.post('/bulk/upload', authorize('institution', 'admin'), uploadCsv.single('file'), createBulkCertificates);
router.post('/bulk/revoke', authorize('institution', 'admin'), revokeBulkController);
router.get('/:id', getCertificate);
router.post('/:id/approve', authorize('institution', 'admin'), approveCertificateController);
router.patch('/:id/revoke', authorize('institution', 'admin'), revokeCertificateController);
router.patch('/:id/update', authorize('institution', 'admin'), updateCertificateController);

export default router;
