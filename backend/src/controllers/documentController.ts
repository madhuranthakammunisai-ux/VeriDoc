import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { DocumentService } from '../services/documentService.js';
import { listDocumentsQuerySchema } from '../validators/documentValidators.js';
import { ValidationError } from '../utils/errors.js';

export class DocumentController {
  /**
   * POST /api/documents/upload
   * Accepts multipart files, validates them, saves to storage & DB,
   * creates background processing jobs, and returns HTTP 202 Accepted.
   */
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const singleFile = req.file as Express.Multer.File | undefined;

      const uploadFiles: Express.Multer.File[] = [];
      if (files && Array.isArray(files) && files.length > 0) {
        uploadFiles.push(...files);
      } else if (singleFile) {
        uploadFiles.push(singleFile);
      }

      if (uploadFiles.length === 0) {
        throw new ValidationError('No files uploaded. Please attach at least one document.');
      }

      const results = await DocumentService.uploadDocuments(
        uploadFiles,
        req.user!,
        req.supabase!
      );

      return res.status(202).json({
        success: true,
        message: `${results.length} document(s) accepted for background processing.`,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents
   */
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = listDocumentsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new ValidationError('Invalid query parameters', parsed.error.format());
      }

      const result = await DocumentService.listDocuments(
        req.user!.id,
        parsed.data,
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

  /**
   * GET /api/documents/:id
   */
  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.id as string;
      const document = await DocumentService.getDocumentById(
        req.user!.id,
        documentId,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/documents/:id
   */
  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.id as string;
      await DocumentService.deleteDocument(
        req.user!.id,
        documentId,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/documents/:id/download
   */
  static async download(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.id as string;
      const result = await DocumentService.getDownloadSignedUrl(
        req.user!.id,
        documentId,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/documents/:id/reprocess
   */
  static async reprocess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.id as string;
      const job = await DocumentService.reprocessDocument(
        req.user!.id,
        documentId,
        req.supabase!
      );

      return res.status(202).json({
        success: true,
        message: 'Document queued for reprocessing',
        data: job,
      });
    } catch (error) {
      next(error);
    }
  }
}
