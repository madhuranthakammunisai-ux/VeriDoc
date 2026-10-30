import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../hooks/useDocuments';
import { DocumentTable } from '../components/documents/DocumentTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Pagination } from '../components/common/Pagination';
import { UploadCloud, Search, Filter, RefreshCw } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    documents,
    pagination,
    loading,
    error,
    params,
    setParams,
    refetch,
    deleteDocument,
    reprocessDocument,
  } = useDocuments({ page: 1, limit: 10, sort_by: 'created_at', sort_order: 'desc' });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams((prev) => ({ ...prev, category: e.target.value, page: 1 }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams((prev) => ({ ...prev, processing_status: e.target.value, page: 1 }));
  };

  const handleVerificationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams((prev) => ({ ...prev, verification_status: e.target.value, page: 1 }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams((prev) => ({ ...prev, sort_by: e.target.value }));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Document Repository</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage, inspect, and verify all intelligent enterprise document records
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Documents</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={params.search || ''}
            onChange={handleSearchChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={params.category || 'all'}
          onChange={handleCategoryChange}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          <option value="invoices">Invoices</option>
          <option value="bank_statements">Bank Statements</option>
          <option value="purchase_orders">Purchase Orders</option>
          <option value="large_pdf_documents">Large PDF Documents</option>
        </select>

        {/* Processing Status Filter */}
        <select
          value={params.processing_status || 'all'}
          onChange={handleStatusChange}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Processing Statuses</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        {/* Verification Status Filter */}
        <select
          value={params.verification_status || 'all'}
          onChange={handleVerificationChange}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Verification Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="needs_correction">Needs Correction</option>
        </select>

        {/* Sort By */}
        <select
          value={params.sort_by || 'created_at'}
          onChange={handleSortChange}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="created_at">Sort: Date Uploaded</option>
          <option value="original_filename">Sort: Filename</option>
          <option value="confidence_score">Sort: Confidence Score</option>
          <option value="file_size_bytes">Sort: File Size</option>
        </select>
      </div>

      {/* Content Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents found"
          description="Upload your first invoice, bank statement, or large PDF to begin processing."
          action={
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Upload Document
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          <DocumentTable
            documents={documents}
            onRefresh={refetch}
            onDelete={deleteDocument}
            onReprocess={reprocessDocument}
          />
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page: number) => setParams((prev) => ({ ...prev, page }))}
          />
        </div>
      )}
    </div>
  );
};
