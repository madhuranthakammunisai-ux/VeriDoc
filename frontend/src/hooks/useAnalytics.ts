import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';

export function useAnalytics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.analytics.getDashboard();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}

