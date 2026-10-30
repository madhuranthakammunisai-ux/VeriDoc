import { Router } from 'express';
import { ProcessingController } from '../controllers/processingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', ProcessingController.list);
router.get('/:jobId', ProcessingController.getById);
router.post('/:jobId/retry', ProcessingController.retry);

export default router;

