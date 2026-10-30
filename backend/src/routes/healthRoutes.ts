import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'veridoc-ai-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;

