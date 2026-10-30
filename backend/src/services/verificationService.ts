import { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError, AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class VerificationService {
  static async listPendingVerifications(
    userId: string,
    params: { page: number; limit: number; status?: string },
    supabase: SupabaseClient
  ) {
    let query = supabase
      .from('documents')
      .select('*, document_extractions(extracted_data, confidence_score)', { count: 'exact' })
      .eq('user_id', userId)
      .eq('processing_status', 'completed');

    if (params.status && params.status !== 'all') {
      query = query.eq('verification_status', params.status);
    } else {
      query = query.in('verification_status', ['pending', 'needs_correction']);
    }

    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      throw new AppError(`Failed to fetch verification list: ${error.message}`, 500);
    }

    return {
      documents: data || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit),
      },
    };
  }

  static async getVerificationDetails(userId: string, documentId: string, supabase: SupabaseClient) {
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docError || !document) {
      throw new NotFoundError('Document not found');
    }

    const [extractionRes, verificationRes] = await Promise.all([
      supabase.from('document_extractions').select('*').eq('document_id', documentId).maybeSingle(),
      supabase.from('verification_records').select('*').eq('document_id', documentId).maybeSingle(),
    ]);

    return {
      document,
      extraction: extractionRes.data || null,
      verification: verificationRes.data || null,
    };
  }

  static async updateVerification(
    userId: string,
    documentId: string,
    payload: {
      corrected_data: Record<string, any>;
      reviewer_notes?: string;
      status?: 'pending' | 'approved' | 'needs_correction';
    },
    supabase: SupabaseClient
  ) {
    // 1. Verify document ownership
    const { data: doc, error: docErr } = await supabase
      .from('documents')
      .select('id, user_id, verification_status')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docErr || !doc) {
      throw new NotFoundError('Document not found');
    }

    // Get original data from extraction
    const { data: extraction } = await supabase
      .from('document_extractions')
      .select('extracted_data')
      .eq('document_id', documentId)
      .maybeSingle();

    const originalData = extraction?.extracted_data || {};
    const newStatus = payload.status || doc.verification_status;

    // Upsert verification record
    const { data: record, error: recordErr } = await supabase
      .from('verification_records')
      .upsert(
        {
          document_id: documentId,
          user_id: userId,
          status: newStatus,
          original_data: originalData,
          corrected_data: payload.corrected_data,
          reviewer_notes: payload.reviewer_notes || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'document_id' }
      )
      .select()
      .single();

    if (recordErr) {
      throw new AppError(`Failed to save verification record: ${recordErr.message}`, 500);
    }

    // If status changed, update documents table
    if (payload.status) {
      await supabase
        .from('documents')
        .update({
          verification_status: payload.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      document_id: documentId,
      action: 'VERIFICATION_UPDATED',
      details: {
        status: newStatus,
        has_corrections: Object.keys(payload.corrected_data || {}).length > 0,
      },
    });

    return record;
  }

  static async approveDocument(
    userId: string,
    documentId: string,
    reviewerNotes: string | undefined,
    supabase: SupabaseClient
  ) {
    return this.updateVerification(
      userId,
      documentId,
      {
        corrected_data: {},
        reviewer_notes: reviewerNotes || 'Verified and approved by user',
        status: 'approved',
      },
      supabase
    );
  }

  static async rejectDocument(
    userId: string,
    documentId: string,
    reason: string | undefined,
    supabase: SupabaseClient
  ) {
    return this.updateVerification(
      userId,
      documentId,
      {
        corrected_data: {},
        reviewer_notes: reason || 'Flagged for correction',
        status: 'needs_correction',
      },
      supabase
    );
  }
}

