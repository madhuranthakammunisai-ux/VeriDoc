import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', VerificationController.list);
router.get('/:documentId', VerificationController.getById);
router.put('/:documentId', VerificationController.update);
router.post('/:documentId/approve', VerificationController.approve);
router.post('/:documentId/reject', VerificationController.reject);

export default router;

