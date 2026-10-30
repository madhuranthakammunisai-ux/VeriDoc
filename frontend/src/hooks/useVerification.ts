import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DocumentItem } from '../types';

export function useVerification(statusFilter?: string) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerificationList = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.verification.list({ page, limit: 10, status: statusFilter });
      setDocuments(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load verification list');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchVerificationList(1);
  }, [fetchVerificationList]);

  const approve = async (documentId: string, notes?: string) => {
    await api.verification.approve(documentId, notes);
    await fetchVerificationList(pagination.page);
  };

  const reject = async (documentId: string, reason?: string) => {
    await api.verification.reject(documentId, reason);
    await fetchVerificationList(pagination.page);
  };

  return {
    documents,
    pagination,
    loading,
    error,
    refetch: fetchVerificationList,
    approve,
    reject,
  };
}

