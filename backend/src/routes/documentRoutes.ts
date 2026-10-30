import { Router } from 'express';
import { DocumentController } from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Protect all document endpoints with authentication
router.use(requireAuth);

router.post('/upload', uploadLimiter, upload.array('files', 10), DocumentController.upload);
router.get('/', DocumentController.list);
router.get('/:id', DocumentController.getById);
router.delete('/:id', DocumentController.delete);
router.get('/:id/download', DocumentController.download);
router.post('/:id/reprocess', DocumentController.reprocess);

export default router;

