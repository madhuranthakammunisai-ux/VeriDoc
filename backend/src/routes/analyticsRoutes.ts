import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', AnalyticsController.getDashboard);
router.get('/categories', AnalyticsController.getCategories);
router.get('/trends', AnalyticsController.getTrends);
router.get('/processing', AnalyticsController.getProcessing);

export default router;

