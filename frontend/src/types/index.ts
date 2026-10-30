export type DocumentCategory = 
  | 'invoices' 
  | 'bank_statements' 
  | 'purchase_orders' 
  | 'large_pdf_documents' 
  | 'unknown';

export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type VerificationStatus = 'pending' | 'approved' | 'needs_correction';

export interface DocumentItem {
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

export interface DocumentDetail extends DocumentItem {
  extraction: {
    id: string;
    category: DocumentCategory;
    extracted_data: Record<string, any>;
    schema_version: string;
    model_name: string;
    confidence_score: number | null;
    created_at: string;
  } | null;
  verification: {
    id: string;
    status: VerificationStatus;
    original_data: Record<string, any>;
    corrected_data: Record<string, any>;
    reviewer_notes: string | null;
    reviewed_at: string | null;
  } | null;
  line_items: Array<{
    id: string;
    item_type: string;
    product_code: string | null;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    source_page: number;
  }>;
  transactions: Array<{
    id: string;
    transaction_date: string;
    description: string;
    reference_number: string | null;
    debit_amount: number | null;
    credit_amount: number | null;
    running_balance: number | null;
    source_page: number;
  }>;
  chunks: Array<{
    id: string;
    chunk_index: number;
    page_start: number;
    page_end: number;
    chunk_text?: string;
    chunk_summary: string | null;
    token_count: number;
  }>;
  jobs: Array<{
    id: string;
    status: ProcessingStatus;
    current_stage: string;
    attempt_count: number;
    worker_id: string | null;
    started_at: string | null;
    completed_at: string | null;
    last_error_code: string | null;
    last_error_message: string | null;
    created_at: string;
  }>;
}

export interface ProcessingJob {
  id: string;
  document_id: string;
  user_id: string;
  status: ProcessingStatus;
  current_stage: string;
  attempt_count: number;
  worker_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
  documents?: {
    original_filename: string;
    category: DocumentCategory;
    file_size_bytes: number;
  };
}

export interface DashboardMetrics {
  cards: {
    totalDocuments: number;
    successfullyProcessed: number;
    processing: number;
    pendingVerification: number;
    failedDocuments: number;
    averageProcessingTimeSeconds: number;
    averageConfidence: number;
  };
  categoryDistribution: Array<{ name: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  monthlyTrends: Array<{ month: string; uploads: number; completed: number }>;
  recentDocuments: DocumentItem[];
  recentVerifications: Array<{
    id: string;
    document_id: string;
    status: VerificationStatus;
    reviewer_notes: string | null;
    reviewed_at: string;
    documents?: {
      original_filename: string;
      category: string;
    };
  }>;
}

export interface KnowledgeCitation {
  documentId: string;
  documentTitle: string;
  pageStart: number;
  pageEnd: number;
  chunkIndex: number;
  snippet: string;
}

export interface KnowledgeAnswer {
  question: string;
  answer: string;
  citations: KnowledgeCitation[];
}
