import { Router } from 'express';
import { createStudent, listStudents, getStudentById } from '../controllers/studentController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.post('/', authorize('institution', 'admin'), createStudent);
router.get('/', authorize('institution', 'admin'), listStudents);
router.get('/:id', authorize('institution', 'admin'), getStudentById);

export default router;
