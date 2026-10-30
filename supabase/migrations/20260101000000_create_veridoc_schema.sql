-- ==============================================================================
-- VeriDoc AI - Initial Database Migration Schema
-- Version: 20260101000000
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on auth.user created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. DOCUMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    safe_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    page_count INT NOT NULL DEFAULT 1,
    storage_path TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'unknown' CHECK (category IN ('invoices', 'bank_statements', 'purchase_orders', 'large_pdf_documents', 'unknown')),
    processing_status TEXT NOT NULL DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed')),
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'needs_correction')),
    confidence_score NUMERIC(5,4) DEFAULT NULL,
    summary TEXT DEFAULT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON public.documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_verification_status ON public.documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 3. DOCUMENT_EXTRACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    schema_version TEXT NOT NULL DEFAULT '1.0',
    model_name TEXT NOT NULL,
    confidence_score NUMERIC(5,4) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_extractions_doc UNIQUE (document_id)
);

CREATE INDEX IF NOT EXISTS idx_document_extractions_user_id ON public.document_extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_extractions_document_id ON public.document_extractions(document_id);

CREATE TRIGGER update_document_extractions_updated_at
    BEFORE UPDATE ON public.document_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4. DOCUMENT_CHUNKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_start INT NOT NULL,
    page_end INT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_summary TEXT DEFAULT NULL,
    token_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_chunks_idx UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);

-- ------------------------------------------------------------------------------
-- 5. DOCUMENT_TRANSACTIONS TABLE (for Bank Statements)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_number TEXT DEFAULT NULL,
    debit_amount NUMERIC(15,2) DEFAULT NULL,
    credit_amount NUMERIC(15,2) DEFAULT NULL,
    running_balance NUMERIC(15,2) DEFAULT NULL,
    source_page INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_transactions_user_id ON public.document_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_transactions_doc_id ON public.document_transactions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_transactions_date ON public.document_transactions(transaction_date);

-- ------------------------------------------------------------------------------
-- 6. DOCUMENT_LINE_ITEMS TABLE (for Invoices & Purchase Orders)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL DEFAULT 'invoice' CHECK (item_type IN ('invoice', 'purchase_order')),
    product_code TEXT DEFAULT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(12,4) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    source_page INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_line_items_user_id ON public.document_line_items(user_id);
CREATE INDEX IF NOT EXISTS idx_document_line_items_doc_id ON public.document_line_items(document_id);

-- ------------------------------------------------------------------------------
-- 7. DOCUMENT_JOBS TABLE (Job Queue for AI Worker)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    current_stage TEXT NOT NULL DEFAULT 'queued',
    attempt_count INT NOT NULL DEFAULT 0,
    worker_id TEXT DEFAULT NULL,
    locked_at TIMESTAMPTZ DEFAULT NULL,
    heartbeat_at TIMESTAMPTZ DEFAULT NULL,
    started_at TIMESTAMPTZ DEFAULT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    last_error_code TEXT DEFAULT NULL,
    last_error_message TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_jobs_user_id ON public.document_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_jobs_doc_id ON public.document_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_jobs_status_locked ON public.document_jobs(status, locked_at);

CREATE TRIGGER update_document_jobs_updated_at
    BEFORE UPDATE ON public.document_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 8. VERIFICATION_RECORDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs_correction')),
    original_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    corrected_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    reviewer_notes TEXT DEFAULT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_verification_records_doc UNIQUE (document_id)
);

CREATE INDEX IF NOT EXISTS idx_verification_records_user_id ON public.verification_records(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_doc_id ON public.verification_records(document_id);

CREATE TRIGGER update_verification_records_updated_at
    BEFORE UPDATE ON public.verification_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 9. AUDIT_LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_doc_id ON public.audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- ------------------------------------------------------------------------------
-- 10. DOCUMENT_RELATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    related_document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('invoice_po', 'statement_invoice', 'reference', 'duplicate', 'related')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_relations UNIQUE (source_document_id, related_document_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_document_relations_user_id ON public.document_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_document_relations_source ON public.document_relations(source_document_id);
CREATE INDEX IF NOT EXISTS idx_document_relations_related ON public.document_relations(related_document_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- 3. document_extractions
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own document extractions"
    ON public.document_extractions FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own document extractions"
    ON public.document_extractions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own document extractions"
    ON public.document_extractions FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own document extractions"
    ON public.document_extractions FOR DELETE
    USING (auth.uid() = user_id);

-- 4. document_chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own document chunks"
    ON public.document_chunks FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own document chunks"
    ON public.document_chunks FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own document chunks"
    ON public.document_chunks FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own document chunks"
    ON public.document_chunks FOR DELETE
    USING (auth.uid() = user_id);

-- 5. document_transactions
ALTER TABLE public.document_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions"
    ON public.document_transactions FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions"
    ON public.document_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions"
    ON public.document_transactions FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions"
    ON public.document_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- 6. document_line_items
ALTER TABLE public.document_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own line items"
    ON public.document_line_items FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own line items"
    ON public.document_line_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own line items"
    ON public.document_line_items FOR UPDATE
    USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own line items"
    ON public.document_line_items FOR DELETE
    USING (auth.uid() = user_id);

-- 7. document_jobs
ALTER TABLE public.document_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own jobs"
    ON public.document_jobs FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs"
    ON public.document_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs"
    ON public.document_jobs FOR UPDATE
    USING (auth.uid() = user_id);

-- 8. verification_records
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own verification records"
    ON public.verification_records FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own verification records"
    ON public.verification_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own verification records"
    ON public.verification_records FOR UPDATE
    USING (auth.uid() = user_id);

-- 9. audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 10. document_relations
ALTER TABLE public.document_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own document relations"
    ON public.document_relations FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own document relations"
    ON public.document_relations FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own document relations"
    ON public.document_relations FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (Private "documents" bucket)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    FALSE,
    26214400, -- 25MB
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/tiff', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 26214400;

-- Storage RLS policies for documents bucket
CREATE POLICY "Users can upload their own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read their own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own documents"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

