import { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../utils/errors.js';

export class ReportService {
  static async generateReport(
    userId: string,
    params: {
      report_type: 'category_summary' | 'processing_metrics' | 'financial_audit' | 'compliance_verification';
      start_date?: string;
      end_date?: string;
      category?: string;
    },
    supabase: SupabaseClient
  ) {
    let docQuery = supabase
      .from('documents')
      .select('id, original_filename, category, processing_status, verification_status, confidence_score, uploaded_at, processed_at, file_size_bytes')
      .eq('user_id', userId);

    if (params.category) {
      docQuery = docQuery.eq('category', params.category);
    }
    if (params.start_date) {
      docQuery = docQuery.gte('uploaded_at', params.start_date);
    }
    if (params.end_date) {
      docQuery = docQuery.lte('uploaded_at', params.end_date);
    }

    const { data: documents, error } = await docQuery;
    if (error) {
      throw new AppError(`Report generation error: ${error.message}`, 500);
    }

    const docs = documents || [];
    const reportId = crypto.randomUUID();
    const generatedAt = new Date().toISOString();

    let reportData: any = {};

    switch (params.report_type) {
      case 'category_summary': {
        const counts: Record<string, number> = {};
        for (const doc of docs) {
          counts[doc.category] = (counts[doc.category] || 0) + 1;
        }
        reportData = {
          totalDocuments: docs.length,
          categories: counts,
          documents: docs.map(d => ({
            id: d.id,
            filename: d.original_filename,
            category: d.category,
            confidence: d.confidence_score,
            status: d.processing_status,
          })),
        };
        break;
      }

      case 'financial_audit': {
        // Fetch line items and transactions for these documents
        const docIds = docs.map(d => d.id);
        const { data: lineItems } = docIds.length > 0
          ? await supabase.from('document_line_items').select('*').in('document_id', docIds)
          : { data: [] };
        const { data: transactions } = docIds.length > 0
          ? await supabase.from('document_transactions').select('*').in('document_id', docIds)
          : { data: [] };

        const totalInvoiceVolume = (lineItems || []).reduce((sum, item) => sum + Number(item.line_total || 0), 0);
        const totalDebits = (transactions || []).reduce((sum, tx) => sum + Number(tx.debit_amount || 0), 0);
        const totalCredits = (transactions || []).reduce((sum, tx) => sum + Number(tx.credit_amount || 0), 0);

        reportData = {
          auditScope: {
            documentsAudited: docs.length,
            totalLineItems: (lineItems || []).length,
            totalTransactions: (transactions || []).length,
          },
          reconciliation: {
            totalInvoiceVolume: Number(totalInvoiceVolume.toFixed(2)),
            totalDebits: Number(totalDebits.toFixed(2)),
            totalCredits: Number(totalCredits.toFixed(2)),
          },
          lineItems: lineItems || [],
          transactions: transactions || [],
        };
        break;
      }

      case 'processing_metrics': {
        const completed = docs.filter(d => d.processing_status === 'completed');
        const failed = docs.filter(d => d.processing_status === 'failed');
        const processing = docs.filter(d => d.processing_status === 'processing' || d.processing_status === 'queued');

        reportData = {
          summary: {
            total: docs.length,
            completed: completed.length,
            failed: failed.length,
            processing: processing.length,
            successRatePercentage: docs.length > 0 ? Number(((completed.length / docs.length) * 100).toFixed(1)) : 100,
          },
          documents: docs,
        };
        break;
      }

      case 'compliance_verification': {
        const approved = docs.filter(d => d.verification_status === 'approved');
        const pending = docs.filter(d => d.verification_status === 'pending');
        const needsCorrection = docs.filter(d => d.verification_status === 'needs_correction');

        reportData = {
          complianceSummary: {
            total: docs.length,
            approvedCount: approved.length,
            pendingCount: pending.length,
            needsCorrectionCount: needsCorrection.length,
            complianceApprovalRate: docs.length > 0 ? Number(((approved.length / docs.length) * 100).toFixed(1)) : 0,
          },
          records: docs,
        };
        break;
      }
    }

    return {
      reportId,
      reportType: params.report_type,
      generatedAt,
      parameters: params,
      data: reportData,
    };
  }
}

