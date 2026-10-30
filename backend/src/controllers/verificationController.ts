import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { VerificationService } from '../services/verificationService.js';
import { updateVerificationSchema } from '../validators/documentValidators.js';
import { ValidationError } from '../utils/errors.js';

export class VerificationController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '10', 10);
      const status = req.query.status as string | undefined;

      const result = await VerificationService.listPendingVerifications(
        req.user!.id,
        { page, limit, status },
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: result.documents,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.documentId as string;
      const details = await VerificationService.getVerificationDetails(
        req.user!.id,
        documentId,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.documentId as string;
      const parsed = updateVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid verification payload', parsed.error.format());
      }

      const result = await VerificationService.updateVerification(
        req.user!.id,
        documentId,
        parsed.data,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        message: 'Verification corrections saved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.documentId as string;
      const reviewerNotes = req.body.reviewer_notes;

      const result = await VerificationService.approveDocument(
        req.user!.id,
        documentId,
        reviewerNotes,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        message: 'Document successfully approved',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.documentId as string;
      const reason = req.body.reason || req.body.reviewer_notes;

      const result = await VerificationService.rejectDocument(
        req.user!.id,
        documentId,
        reason,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        message: 'Document marked as needing correction',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
