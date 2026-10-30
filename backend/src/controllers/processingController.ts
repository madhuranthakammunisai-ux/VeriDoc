import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { JobService } from '../services/jobService.js';

export class ProcessingController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const jobs = await JobService.listJobs(req.user!.id, req.supabase!);
      return res.status(200).json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const jobId = req.params.jobId as string;
      const job = await JobService.getJobById(req.user!.id, jobId, req.supabase!);
      return res.status(200).json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  }

  static async retry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const jobId = req.params.jobId as string;
      const job = await JobService.retryJob(req.user!.id, jobId, req.supabase!);
      return res.status(200).json({
        success: true,
        message: 'Job re-queued for processing',
        data: job,
      });
    } catch (error) {
      next(error);
    }
  }
}
