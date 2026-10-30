import { Router } from 'express';
import authRoutes from './authRoutes.js';
import documentRoutes from './documentRoutes.js';
import processingRoutes from './processingRoutes.js';
import verificationRoutes from './verificationRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import knowledgeRoutes from './knowledgeRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/processing', processingRoutes);
apiRouter.use('/verification', verificationRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/knowledge', knowledgeRoutes);

export default apiRouter;

