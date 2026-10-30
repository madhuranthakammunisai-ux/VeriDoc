import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DocumentItem } from '../types';

export interface DocumentQueryParams {
  page: number;
  limit: number;
  category?: string;
  processing_status?: string;
  verification_status?: string;
  search?: string;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export function useDocuments(initialParams?: Partial<DocumentQueryParams>) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<DocumentQueryParams>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialParams,
  });

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.documents.list(params);
      setDocuments(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = async (id: string) => {
    await api.documents.delete(id);
    await fetchDocuments();
  };

  const reprocessDocument = async (id: string) => {
    await api.documents.reprocess(id);
    await fetchDocuments();
  };

  return {
    documents,
    pagination,
    loading,
    error,
    params,
    setParams,
    refetch: fetchDocuments,
    deleteDocument,
    reprocessDocument,
  };
}
