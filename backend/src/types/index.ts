import { Request } from 'express';
import { User, SupabaseClient } from '@supabase/supabase-js';

export type DocumentCategory = 
  | 'invoices' 
  | 'bank_statements' 
  | 'purchase_orders' 
  | 'large_pdf_documents' 
  | 'unknown';

export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type VerificationStatus = 'pending' | 'approved' | 'needs_correction';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
  supabase?: SupabaseClient;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  original_filename: string;
  safe_filename: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number;
  storage_path: string;
  category: DocumentCategory;
  processing_status: ProcessingStatus;
  verification_status: VerificationStatus;
  confidence_score: number | null;
  summary: string | null;
  uploaded_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentJobRecord {
  id: string;
  document_id: string;
  user_id: string;
  status: ProcessingStatus;
  current_stage: string;
  attempt_count: number;
  worker_id: string | null;
  locked_at: string | null;
  heartbeat_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentExtractionRecord {
  id: string;
  document_id: string;
  user_id: string;
  category: DocumentCategory;
  extracted_data: Record<string, any>;
  schema_version: string;
  model_name: string;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationRecord {
  id: string;
  document_id: string;
  user_id: string;
  status: VerificationStatus;
  original_data: Record<string, any>;
  corrected_data: Record<string, any>;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

