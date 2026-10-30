-- ==============================================================================
-- VeriDoc AI - Durable Job Queue RPC: claim_next_document_job
-- Version: 20260101000001
-- ==============================================================================

-- Stale job reclamation threshold default (e.g., 20 minutes)
-- Stale jobs that are still marked 'processing' but have not updated heartbeat in 20 minutes
-- and have attempt_count < 3 can be reset to 'queued' or reclaimed directly.

CREATE OR REPLACE FUNCTION public.reclaim_stale_jobs(stale_threshold_interval INTERVAL DEFAULT INTERVAL '20 minutes')
RETURNS INTEGER AS $$
DECLARE
    reclaimed_count INTEGER;
BEGIN
    UPDATE public.document_jobs
    SET 
        status = 'queued',
        current_stage = 'recovered_from_stale',
        locked_at = NULL,
        worker_id = NULL
    WHERE 
        status = 'processing'
        AND heartbeat_at < (NOW() - stale_threshold_interval)
        AND attempt_count < 3;

    GET DIAGNOSTICS reclaimed_count = ROW_COUNT;

    -- Also mark jobs that exceeded 3 attempts as failed
    UPDATE public.document_jobs
    SET 
        status = 'failed',
        current_stage = 'failed_stale_exceeded_attempts',
        last_error_code = 'ERR_STALE_MAX_ATTEMPTS',
        last_error_message = 'Job heartbeat timed out and attempt limit exceeded'
    WHERE 
        status = 'processing'
        AND heartbeat_at < (NOW() - stale_threshold_interval)
        AND attempt_count >= 3;

    RETURN reclaimed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The primary atomic claim RPC
CREATE OR REPLACE FUNCTION public.claim_next_document_job(
    p_worker_id TEXT,
    p_stale_minutes INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    user_id UUID,
    status TEXT,
    current_stage TEXT,
    attempt_count INT,
    worker_id TEXT,
    locked_at TIMESTAMPTZ,
    heartbeat_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_error_code TEXT,
    last_error_message TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    v_job_id UUID;
    v_stale_interval INTERVAL;
BEGIN
    v_stale_interval := (p_stale_minutes || ' minutes')::INTERVAL;

    -- 1. First reclaim any stale jobs that haven't heartbeated
    PERFORM public.reclaim_stale_jobs(v_stale_interval);

    -- 2. Atomically select and lock one queued job
    SELECT dj.id INTO v_job_id
    FROM public.document_jobs dj
    WHERE dj.status = 'queued'
      AND dj.attempt_count < 3
    ORDER BY dj.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    -- 3. If a job is found, update it and return it
    IF v_job_id IS NOT NULL THEN
        RETURN QUERY
        UPDATE public.document_jobs dj
        SET
            status = 'processing',
            current_stage = 'claimed',
            worker_id = p_worker_id,
            locked_at = NOW(),
            heartbeat_at = NOW(),
            started_at = COALESCE(dj.started_at, NOW()),
            attempt_count = dj.attempt_count + 1,
            updated_at = NOW()
        WHERE dj.id = v_job_id
        RETURNING
            dj.id,
            dj.document_id,
            dj.user_id,
            dj.status,
            dj.current_stage,
            dj.attempt_count,
            dj.worker_id,
            dj.locked_at,
            dj.heartbeat_at,
            dj.started_at,
            dj.completed_at,
            dj.last_error_code,
            dj.last_error_message,
            dj.created_at,
            dj.updated_at;

        -- Also update the parent document's status to 'processing'
        UPDATE public.documents
        SET processing_status = 'processing', updated_at = NOW()
        WHERE documents.id = (SELECT dj2.document_id FROM public.document_jobs dj2 WHERE dj2.id = v_job_id);

    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Heartbeat function for active workers
CREATE OR REPLACE FUNCTION public.update_job_heartbeat(
    p_job_id UUID,
    p_worker_id TEXT,
    p_current_stage TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE public.document_jobs
    SET
        heartbeat_at = NOW(),
        current_stage = COALESCE(p_current_stage, current_stage),
        updated_at = NOW()
    WHERE id = p_job_id
      AND worker_id = p_worker_id
      AND status = 'processing';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated & service_role
REVOKE EXECUTE ON FUNCTION public.claim_next_document_job(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_next_document_job(TEXT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_job_heartbeat(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_job_heartbeat(UUID, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.reclaim_stale_jobs(INTERVAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reclaim_stale_jobs(INTERVAL) TO service_role;

