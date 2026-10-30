import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DocumentDetail } from '../types';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { ProcessingStatusBadge } from '../components/common/ProcessingStatusBadge';
import { VerificationStatusBadge } from '../components/common/VerificationStatusBadge';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { ExtractedDataViewer } from '../components/documents/ExtractedDataViewer';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Trash2, 
  FileText, 
  Layers, 
  CheckSquare, 
  Cpu, 
  HelpCircle,
  Send,
  MessageSquareQuote
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'summary' | 'jobs' | 'qa'>('data');
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaAnswer, setQaAnswer] = useState<{ answer: string; citations: any[] } | null>(null);

  const fetchDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.documents.getById(id);
      setDocument(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;
    try {
      const res = await api.documents.getDownloadUrl(id);
      if (res?.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      alert('Failed to get download URL');
    }
  };

  const handleReprocess = async () => {
    if (!id) return;
    try {
      await api.documents.reprocess(id);
      navigate('/processing');
    } catch (err) {
      alert('Failed to queue reprocessing');
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Delete this document and all its records?')) return;
    try {
      await api.documents.delete(id);
      navigate('/documents');
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !qaQuestion.trim()) return;
    try {
      setQaLoading(true);
      const res = await api.knowledge.ask(qaQuestion, id);
      setQaAnswer(res);
    } catch (err) {
      alert('Failed to answer question');
    } finally {
      setQaLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !document) return <ErrorState message={error || 'Document not found'} onRetry={fetchDocument} />;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/documents')}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold text-white truncate max-w-md" title={document.original_filename}>
                {document.original_filename}
              </h1>
              <CategoryBadge category={document.category} />
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              ID: {document.id} • {document.page_count} pages • {(document.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={handleReprocess}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reprocess</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Processing</span>
            <ProcessingStatusBadge status={document.processing_status} />
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Verification</span>
            <VerificationStatusBadge status={document.verification_status} />
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">AI Confidence</span>
            <ConfidenceIndicator score={document.confidence_score} />
          </div>
        </div>

        <button
          onClick={() => navigate('/verification')}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Open in Verification Center</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('data')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'data' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Extracted Data & Items
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'summary' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Summary & Chunks
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'qa' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Document Q&A
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'jobs' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Worker Queue History
        </button>
      </div>

      {/* Tab 1: Extracted Data */}
      {activeTab === 'data' && (
        <ExtractedDataViewer
          document={document}
          isVerificationMode={true}
          onSaved={fetchDocument}
        />
      )}

      {/* Tab 2: Summary & Chunks */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-2">Executive Summary</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {document.summary || 'Summary is being generated by the background worker.'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Page Chunks & Full-Text Index</h3>
            <div className="space-y-3">
              {document.chunks?.map((chunk: any) => (
                <div key={chunk.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs">
                  <div className="flex justify-between text-indigo-400 font-semibold mb-1">
                    <span>Chunk #{chunk.chunk_index + 1} (Pages {chunk.page_start} - {chunk.page_end})</span>
                    <span className="text-slate-500 text-[10px]">{chunk.token_count} est. tokens</span>
                  </div>
                  <p className="text-slate-300 whitespace-pre-wrap">{chunk.chunk_text || chunk.chunk_summary}</p>
                </div>
              ))}
              {(!document.chunks || document.chunks.length === 0) && (
                <p className="text-xs text-slate-500">No chunks indexed.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Q&A */}
      {activeTab === 'qa' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Ask Questions Grounded on this Document</h3>
            <p className="text-xs text-slate-400">
              Answers are cited with exact source page numbers and verification snippets.
            </p>
          </div>

          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., What are the payment terms and line item totals?"
              value={qaQuestion}
              onChange={(e) => setQaQuestion(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={qaLoading}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>

          {qaAnswer && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/20 space-y-3">
              <div className="flex items-start space-x-2 text-indigo-400">
                <MessageSquareQuote className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {qaAnswer.answer}
                </p>
              </div>

              {qaAnswer.citations && qaAnswer.citations.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Source Grounded Citations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {qaAnswer.citations.map((cite, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                        <span className="text-indigo-400 font-semibold block">
                          Pages {cite.pageStart}-{cite.pageEnd}
                        </span>
                        <p className="text-slate-400 mt-1 italic">"{cite.snippet}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Worker Queue History */}
      {activeTab === 'jobs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">PostgreSQL Durable Job Pipeline Log</h3>
          <div className="space-y-3">
            {document.jobs?.map((job: any) => (
              <div key={job.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Stage: {job.current_stage}</span>
                  <ProcessingStatusBadge status={job.status} />
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Worker: {job.worker_id || 'unassigned'} • Attempt #{job.attempt_count}
                </div>
                {job.last_error_message && (
                  <p className="text-rose-400 font-mono text-[11px] mt-1 bg-rose-500/10 p-2 rounded">
                    Error: {job.last_error_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
