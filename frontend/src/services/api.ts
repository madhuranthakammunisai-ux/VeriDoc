import axios from 'axios';
import { supabase } from './supabase';
import { 
  DocumentItem, 
  DocumentDetail, 
  ProcessingJob, 
  DashboardMetrics, 
  KnowledgeAnswer 
} from '../types';

// Read API base URL from env, ensuring no trailing slash and /api included properly
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
const baseURL = rawBaseUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Supabase Auth JWT token
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Centralized API endpoints
export const api = {
  // Auth
  auth: {
    getMe: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data.data;
    },
  },

  // Documents
  documents: {
    upload: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const res = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    list: async (params?: {
      page?: number;
      limit?: number;
      category?: string;
      processing_status?: string;
      verification_status?: string;
      search?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }) => {
      const res = await apiClient.get('/documents', { params });
      return res.data;
    },
    getById: async (id: string): Promise<DocumentDetail> => {
      const res = await apiClient.get(`/documents/${id}`);
      return res.data.data;
    },
    delete: async (id: string) => {
      const res = await apiClient.delete(`/documents/${id}`);
      return res.data;
    },
    getDownloadUrl: async (id: string) => {
      const res = await apiClient.get(`/documents/${id}/download`);
      return res.data.data;
    },
    reprocess: async (id: string) => {
      const res = await apiClient.post(`/documents/${id}/reprocess`);
      return res.data;
    },
  },

  // Processing
  processing: {
    list: async (): Promise<ProcessingJob[]> => {
      const res = await apiClient.get('/processing');
      return res.data.data;
    },
    getById: async (jobId: string): Promise<ProcessingJob> => {
      const res = await apiClient.get(`/processing/${jobId}`);
      return res.data.data;
    },
    retry: async (jobId: string) => {
      const res = await apiClient.post(`/processing/${jobId}/retry`);
      return res.data;
    },
  },

  // Verification
  verification: {
    list: async (params?: { page?: number; limit?: number; status?: string }) => {
      const res = await apiClient.get('/verification', { params });
      return res.data;
    },
    getById: async (documentId: string) => {
      const res = await apiClient.get(`/verification/${documentId}`);
      return res.data.data;
    },
    update: async (documentId: string, payload: { corrected_data: any; reviewer_notes?: string; status?: string }) => {
      const res = await apiClient.put(`/verification/${documentId}`, payload);
      return res.data;
    },
    approve: async (documentId: string, notes?: string) => {
      const res = await apiClient.post(`/verification/${documentId}/approve`, { reviewer_notes: notes });
      return res.data;
    },
    reject: async (documentId: string, reason?: string) => {
      const res = await apiClient.post(`/verification/${documentId}/reject`, { reason });
      return res.data;
    },
  },

  // Analytics
  analytics: {
    getDashboard: async (): Promise<DashboardMetrics> => {
      const res = await apiClient.get('/analytics/dashboard');
      return res.data.data;
    },
    getCategories: async () => {
      const res = await apiClient.get('/analytics/categories');
      return res.data.data;
    },
    getTrends: async () => {
      const res = await apiClient.get('/analytics/trends');
      return res.data.data;
    },
    getProcessing: async () => {
      const res = await apiClient.get('/analytics/processing');
      return res.data.data;
    },
  },

  // Reports
  reports: {
    list: async () => {
      const res = await apiClient.get('/reports');
      return res.data.data;
    },
    generate: async (payload: { report_type: string; start_date?: string; end_date?: string; category?: string }) => {
      const res = await apiClient.post('/reports/generate', payload);
      return res.data.data;
    },
    getById: async (id: string) => {
      const res = await apiClient.get(`/reports/${id}`);
      return res.data.data;
    },
    downloadUrl: (id: string) => `${baseURL}/reports/${id}/download`,
  },

  // Knowledge & Q&A
  knowledge: {
    search: async (queryText: string, documentId?: string) => {
      const res = await apiClient.get('/knowledge/search', { params: { q: queryText, document_id: documentId } });
      return res.data.data;
    },
    ask: async (question: string, documentId?: string): Promise<KnowledgeAnswer> => {
      const res = await apiClient.post('/knowledge/ask', { question, document_id: documentId });
      return res.data.data;
    },
    getRelated: async (documentId: string) => {
      const res = await apiClient.get(`/knowledge/related/${documentId}`);
      return res.data.data;
    },
  },
};
