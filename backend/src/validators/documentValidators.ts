import { z } from 'zod';

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.enum(['invoices', 'bank_statements', 'purchase_orders', 'large_pdf_documents', 'unknown', 'all']).optional(),
  processing_status: z.enum(['queued', 'processing', 'completed', 'failed', 'all']).optional(),
  verification_status: z.enum(['pending', 'approved', 'needs_correction', 'all']).optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'original_filename', 'confidence_score', 'file_size_bytes']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const updateVerificationSchema = z.object({
  corrected_data: z.record(z.any()),
  reviewer_notes: z.string().optional(),
  status: z.enum(['pending', 'approved', 'needs_correction']).optional(),
});

export const askKnowledgeSchema = z.object({
  document_id: z.string().uuid().optional(),
  question: z.string().min(2, 'Question must be at least 2 characters long'),
});

export const generateReportSchema = z.object({
  report_type: z.enum(['category_summary', 'processing_metrics', 'financial_audit', 'compliance_verification']),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  category: z.enum(['invoices', 'bank_statements', 'purchase_orders', 'large_pdf_documents']).optional(),
});

