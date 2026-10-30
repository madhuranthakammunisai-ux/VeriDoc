import { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError, AppError } from '../utils/errors.js';

export class JobService {
  static async listJobs(userId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('document_jobs')
      .select('*, documents(original_filename, safe_filename, category, file_size_bytes)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new AppError(`Failed to fetch jobs: ${error.message}`, 500);
    }
    return data || [];
  }

  static async getJobById(userId: string, jobId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from('document_jobs')
      .select('*, documents(original_filename, safe_filename, category, file_size_bytes)')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Job not found');
    }
    return data;
  }

  static async retryJob(userId: string, jobId: string, supabase: SupabaseClient) {
    const { data: job, error: jobErr } = await supabase
      .from('document_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobErr || !job) {
      throw new NotFoundError('Job not found');
    }

    const { data: updated, error: updateErr } = await supabase
      .from('document_jobs')
      .update({
        status: 'queued',
        current_stage: 'retry_queued',
        attempt_count: 0,
        locked_at: null,
        worker_id: null,
        last_error_code: null,
        last_error_message: null,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateErr) {
      throw new AppError(`Failed to retry job: ${updateErr.message}`, 500);
    }

    // Update parent document status
    await supabase
      .from('documents')
      .update({ processing_status: 'queued' })
      .eq('id', job.document_id);

    return updated;
  }
}

