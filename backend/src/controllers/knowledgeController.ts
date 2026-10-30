import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { KnowledgeService } from '../services/knowledgeService.js';
import { askKnowledgeSchema } from '../validators/documentValidators.js';
import { ValidationError } from '../utils/errors.js';

export class KnowledgeController {
  static async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string || '';
      const documentId = req.query.document_id as string | undefined;

      const results = await KnowledgeService.searchKnowledge(
        req.user!.id,
        q,
        documentId,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  static async ask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = askKnowledgeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid question payload', parsed.error.format());
      }

      const answer = await KnowledgeService.askKnowledge(
        req.user!.id,
        parsed.data.question,
        parsed.data.document_id,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: answer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async related(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentId = req.params.documentId as string;
      const relations = await KnowledgeService.getDocumentRelations(
        req.user!.id,
        documentId,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: relations,
      });
    } catch (error) {
      next(error);
    }
  }
}
