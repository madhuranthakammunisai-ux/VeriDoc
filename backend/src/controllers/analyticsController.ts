import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AnalyticsService } from '../services/analyticsService.js';

export class AnalyticsController {
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getDashboardMetrics(req.user!.id, req.supabase!);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getDashboardMetrics(req.user!.id, req.supabase!);
      return res.status(200).json({
        success: true,
        data: data.categoryDistribution,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTrends(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getDashboardMetrics(req.user!.id, req.supabase!);
      return res.status(200).json({
        success: true,
        data: data.monthlyTrends,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProcessing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getDashboardMetrics(req.user!.id, req.supabase!);
      return res.status(200).json({
        success: true,
        data: {
          statusDistribution: data.statusDistribution,
          averageProcessingTimeSeconds: data.cards.averageProcessingTimeSeconds,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

