import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ReportService } from '../services/reportService.js';
import { generateReportSchema } from '../validators/documentValidators.js';
import { ValidationError } from '../utils/errors.js';

export class ReportsController {
  static async listReports(_req: AuthenticatedRequest, res: Response, _next: NextFunction) {
    const reportTemplates = [
      {
        id: 'category_summary',
        name: 'Document Category & Processing Summary',
        description: 'Comprehensive breakdown of all documents uploaded by category, status, and confidence.',
        type: 'category_summary',
      },
      {
        id: 'financial_audit',
        name: 'Financial Audit & Line-Item Reconciliation',
        description: 'Full transactional audit report aggregating invoices, purchase orders, and bank statement lines.',
        type: 'financial_audit',
      },
      {
        id: 'processing_metrics',
        name: 'AI Extraction Performance Metrics',
        description: 'Analysis of pipeline throughput, turnaround duration, error rates, and retry counts.',
        type: 'processing_metrics',
      },
      {
        id: 'compliance_verification',
        name: 'Human-in-the-Loop Verification Audit',
        description: 'Compliance tracking of document approvals, user corrections, and verification history.',
        type: 'compliance_verification',
      },
    ];

    return res.status(200).json({
      success: true,
      data: reportTemplates,
    });
  }

  static async generate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = generateReportSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid report parameters', parsed.error.format());
      }

      const report = await ReportService.generateReport(
        req.user!.id,
        parsed.data,
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reportType = (req.params.id as any) || 'category_summary';
      const report = await ReportService.generateReport(
        req.user!.id,
        { report_type: reportType },
        req.supabase!
      );

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async download(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reportType = (req.params.id as any) || 'category_summary';
      const report = await ReportService.generateReport(
        req.user!.id,
        { report_type: reportType },
        req.supabase!
      );

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=veridoc_${reportType}_report.json`);
      return res.status(200).send(JSON.stringify(report, null, 2));
    } catch (error) {
      next(error);
    }
  }
}

