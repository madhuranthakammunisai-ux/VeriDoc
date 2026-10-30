import { Router } from 'express';
import { ReportsController } from '../controllers/reportsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', ReportsController.listReports);
router.post('/generate', ReportsController.generate);
router.get('/:id', ReportsController.getById);
router.get('/:id/download', ReportsController.download);

export default router;

