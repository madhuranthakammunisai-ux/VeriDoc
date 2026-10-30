import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledgeController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/search', KnowledgeController.search);
router.post('/ask', KnowledgeController.ask);
router.get('/related/:documentId', KnowledgeController.related);

export default router;

