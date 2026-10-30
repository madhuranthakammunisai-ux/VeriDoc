import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { ProcessingJob } from '../types';

export function useProcessing(pollIntervalMs: number = 4000) {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setError(null);
      const data = await api.processing.list();
      setJobs(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to fetch processing jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchJobs, pollIntervalMs]);

  const retryJob = async (jobId: string) => {
    await api.processing.retry(jobId);
    await fetchJobs();
  };

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    retryJob,
  };
}

