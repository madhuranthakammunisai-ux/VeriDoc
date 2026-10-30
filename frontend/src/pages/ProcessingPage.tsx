import React from 'react';
import { useProcessing } from '../hooks/useProcessing';
import { ProcessingStatusBadge } from '../components/common/ProcessingStatusBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Cpu, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProcessingPage: React.FC = () => {
  const { jobs, loading, error, refetch, retryJob } = useProcessing(3000);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">AI Processing Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Durable PostgreSQL job queue polled by Python background worker
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Real-time jobs list */}
      {loading && jobs.length === 0 ? (
        <LoadingSkeleton rows={5} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs in queue"
          description="All background AI processing jobs have completed or queue is empty."
          action={
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Upload Documents
            </button>
          }
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-[11px] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Queue Status</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Attempt</th>
                  <th className="py-3 px-4">Worker ID</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <button
                        onClick={() => navigate(`/documents/${job.document_id}`)}
                        className="text-indigo-400 hover:underline truncate max-w-[200px] text-left block"
                      >
                        {job.documents?.original_filename || `Doc ${job.document_id.slice(0, 8)}`}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <CategoryBadge category={job.documents?.category || 'unknown'} />
                    </td>
                    <td className="py-3 px-4">
                      <ProcessingStatusBadge status={job.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {job.current_stage}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      #{job.attempt_count} / 3
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                      {job.worker_id || 'unclaimed'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {job.status === 'failed' && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded font-semibold text-[11px] transition-colors"
                        >
                          Retry Job
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

