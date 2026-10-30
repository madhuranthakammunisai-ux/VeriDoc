import { SupabaseClient, User } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sanitizeFilename } from '../utils/sanitize.js';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { supabaseAdmin } from '../config/supabase.js';

export interface UploadResult {
  documentId: string;
  originalFilename: string;
  safeFilename: string;
  storagePath: string;
  jobId: string;
  status: string;
}

export class DocumentService {
  /**
   * Uploads files to private Supabase Storage and creates document + job records.
   */
  static async uploadDocuments(
    files: Express.Multer.File[],
    user: User,
    supabase: SupabaseClient
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const documentId = crypto.randomUUID();
      const safeName = sanitizeFilename(file.originalname);
      const storagePath = `${user.id}/${documentId}/${safeName}`;

      // 1. Upload to Supabase Storage bucket 'documents'
      // Use user-scoped client if user has storage rights or admin fallback
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (storageError) {
        // Fallback to supabaseAdmin if needed, while verifying ownership
        const { error: adminUploadError } = await supabaseAdmin.storage
          .from('documents')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (adminUploadError) {
          logger.error('Failed to upload file to storage', adminUploadError, {
            storagePath,
            user_id: user.id,
          });
          throw new AppError(`Storage upload failed: ${adminUploadError.message}`, 500);
        }
      }

      // 2. Insert document record in PostgreSQL
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          user_id: user.id,
          original_filename: file.originalname,
          safe_filename: safeName,
          mime_type: file.mimetype,
          file_size_bytes: file.size,
          storage_path: storagePath,
          category: 'unknown',
          processing_status: 'queued',
          verification_status: 'pending',
        })
        .select()
        .single();

      if (docError || !docData) {
        logger.error('Failed to create document record', docError);
        // Clean up uploaded storage file on failure
        await supabaseAdmin.storage.from('documents').remove([storagePath]);
        throw new AppError(`Database error creating document: ${docError?.message}`, 500);
      }

      // 3. Create document processing job
      const { data: jobData, error: jobError } = await supabase
        .from('document_jobs')
        .insert({
          document_id: documentId,
          user_id: user.id,
          status: 'queued',
          current_stage: 'queued',
          attempt_count: 0,
        })
        .select()
        .single();

      if (jobError || !jobData) {
        logger.error('Failed to create document job', jobError);
        throw new AppError(`Failed to queue processing job: ${jobError?.message}`, 500);
      }

      // 4. Log audit event
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        document_id: documentId,
        action: 'DOCUMENT_UPLOADED',
        details: {
          original_filename: file.originalname,
          file_size_bytes: file.size,
          mime_type: file.mimetype,
        },
      });

      results.push({
        documentId,
        originalFilename: file.originalname,
        safeFilename: safeName,
        storagePath,
        jobId: jobData.id,
        status: 'queued',
      });
    }

    return results;
  }

  /**
   * Retrieves paginated, filtered documents for the authenticated user.
   */
  static async listDocuments(
    userId: string,
    params: {
      page: number;
      limit: number;
      category?: string;
      processing_status?: string;
      verification_status?: string;
      search?: string;
      sort_by: string;
      sort_order: 'asc' | 'desc';
    },
    supabase: SupabaseClient
  ) {
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    if (params.processing_status && params.processing_status !== 'all') {
      query = query.eq('processing_status', params.processing_status);
    }
    if (params.verification_status && params.verification_status !== 'all') {
      query = query.eq('verification_status', params.verification_status);
    }
    if (params.search && params.search.trim().length > 0) {
      query = query.ilike('original_filename', `%${params.search.trim()}%`);
    }

    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;

    query = query
      .order(params.sort_by, { ascending: params.sort_order === 'asc' })
      .range(from, to);

    const { data, count, error } = await query;
    if (error) {
      logger.error('Failed to list documents', error);
      throw new AppError(`Failed to retrieve documents: ${error.message}`, 500);
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

  /**
   * Retrieves detailed document record including extractions, transactions, line items, and verification.
   */
  static async getDocumentById(userId: string, documentId: string, supabase: SupabaseClient) {
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docError || !document) {
      throw new NotFoundError('Document not found or access denied');
    }

    // Fetch extraction, verification record, line items, transactions, and chunks in parallel
    const [extractionRes, verificationRes, lineItemsRes, transactionsRes, chunksRes, jobsRes] = await Promise.all([
      supabase.from('document_extractions').select('*').eq('document_id', documentId).maybeSingle(),
      supabase.from('verification_records').select('*').eq('document_id', documentId).maybeSingle(),
      supabase.from('document_line_items').select('*').eq('document_id', documentId).order('source_page', { ascending: true }),
      supabase.from('document_transactions').select('*').eq('document_id', documentId).order('transaction_date', { ascending: true }),
      supabase.from('document_chunks').select('id, chunk_index, page_start, page_end, chunk_summary, token_count').eq('document_id', documentId).order('chunk_index', { ascending: true }),
      supabase.from('document_jobs').select('*').eq('document_id', documentId).order('created_at', { ascending: false }).limit(5),
    ]);

    return {
      ...document,
      extraction: extractionRes.data || null,
      verification: verificationRes.data || null,
      line_items: lineItemsRes.data || [],
      transactions: transactionsRes.data || [],
      chunks: chunksRes.data || [],
      jobs: jobsRes.data || [],
    };
  }

  /**
   * Generates a temporary signed URL for securely downloading the private document.
   */
  static async getDownloadSignedUrl(userId: string, documentId: string, supabase: SupabaseClient) {
    const { data: document, error } = await supabase
      .from('documents')
      .select('storage_path, user_id, original_filename')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error || !document) {
      throw new NotFoundError('Document not found or access denied');
    }

    // 15-minute download URL expiry (900 seconds)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(document.storage_path, 900, {
        download: document.original_filename,
      });

    if (signError || !signedData) {
      throw new AppError(`Failed to generate signed download URL: ${signError?.message}`, 500);
    }

    return {
      downloadUrl: signedData.signedUrl,
      expiresIn: 900,
    };
  }

  /**
   * Deletes a document and its storage file.
   */
  static async deleteDocument(userId: string, documentId: string, supabase: SupabaseClient) {
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Delete from storage
    await supabaseAdmin.storage.from('documents').remove([document.storage_path]);

    // Delete record (cascading deletes associated tables)
    const { error: delError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (delError) {
      throw new AppError(`Failed to delete document: ${delError.message}`, 500);
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      document_id: documentId,
      action: 'DOCUMENT_DELETED',
    });

    return { success: true };
  }

  /**
   * Reprocesses a failed or existing document.
   */
  static async reprocessDocument(userId: string, documentId: string, supabase: SupabaseClient) {
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (docError || !document) {
      throw new NotFoundError('Document not found');
    }

    // Update document status
    await supabase
      .from('documents')
      .update({
        processing_status: 'queued',
        confidence_score: null,
      })
      .eq('id', documentId);

    // Create a new job in document_jobs
    const { data: job, error: jobError } = await supabase
      .from('document_jobs')
      .insert({
        document_id: documentId,
        user_id: userId,
        status: 'queued',
        current_stage: 'reprocess_queued',
        attempt_count: 0,
      })
      .select()
      .single();

    if (jobError) {
      throw new AppError(`Failed to reprocess: ${jobError.message}`, 500);
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      document_id: documentId,
      action: 'DOCUMENT_REPROCESSED',
      details: { job_id: job.id },
    });

    return job;
  }
}

