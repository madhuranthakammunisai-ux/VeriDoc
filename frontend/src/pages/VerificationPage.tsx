import React, { useState, useEffect } from 'react';
import { useVerification } from '../hooks/useVerification';
import { api } from '../services/api';
import { DocumentDetail } from '../types';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { VerificationStatusBadge } from '../components/common/VerificationStatusBadge';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { ExtractedDataViewer } from '../components/documents/ExtractedDataViewer';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { 
  CheckCheck, 
  ShieldAlert, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const { documents, loading, error, refetch, approve, reject } = useVerification(selectedStatus);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  // Auto-select first document
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    } else if (documents.length === 0) {
      setSelectedDocId(null);
      setSelectedDoc(null);
    }
  }, [documents, selectedDocId]);

  // Fetch full details of selected document
  useEffect(() => {
    if (!selectedDocId) return;
    const fetchDoc = async () => {
      try {
        setDocLoading(true);
        const data = await api.documents.getById(selectedDocId);
        setSelectedDoc(data);
      } catch (err) {
        console.error(err);
      } finally {
        setDocLoading(false);
      }
    };
    fetchDoc();
  }, [selectedDocId]);

  const handleApprove = async () => {
    if (!selectedDocId) return;
    await approve(selectedDocId, actionNotes || 'Approved by reviewer');
    setActionNotes('');
    setSelectedDocId(null);
  };

  const handleReject = async () => {
    if (!selectedDocId) return;
    await reject(selectedDocId, actionNotes || 'Rejected during verification audit');
    setActionNotes('');
    setSelectedDocId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Verification Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Human-in-the-loop review, field correction, and compliance authorization
          </p>
        </div>

        {/* Filter buttons */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              selectedStatus === 'pending' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setSelectedStatus('needs_correction')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              selectedStatus === 'needs_correction' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Needs Correction
          </button>
          <button
            onClick={() => setSelectedStatus('approved')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              selectedStatus === 'approved' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved Archive
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents pending verification"
          description="All completed documents have been reviewed and approved."
          icon={<CheckCheck className="w-8 h-8 text-emerald-400" />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Document queue list (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 h-[750px] overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
              Queue ({documents.length} documents)
            </div>

            <div className="space-y-2">
              {documents.map((doc) => {
                const isSelected = doc.id === selectedDocId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className={`font-semibold truncate max-w-[170px] ${isSelected ? 'text-indigo-400' : 'text-slate-200'}`}>
                        {doc.original_filename}
                      </p>
                      <ConfidenceIndicator score={doc.confidence_score} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <CategoryBadge category={doc.category} />
                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Inspection & Human Verification Studio (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 h-[750px] overflow-y-auto space-y-6">
            {docLoading || !selectedDoc ? (
              <LoadingSkeleton rows={6} />
            ) : (
              <>
                {/* Header with approve/reject buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white truncate max-w-md">
                      {selectedDoc.original_filename}
                    </h2>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400">
                      <CategoryBadge category={selectedDoc.category} />
                      <VerificationStatusBadge status={selectedDoc.verification_status} />
                      <span>Confidence: {Math.round((selectedDoc.confidence_score || 0) * 100)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleReject}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Mark Needs Correction</span>
                    </button>
                    <button
                      onClick={handleApprove}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Approve & Authorize</span>
                    </button>
                  </div>
                </div>

                {/* Validation warnings banner if present */}
                {selectedDoc.verification?.reviewer_notes && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Audit Validation Notes:</span>
                      <p className="mt-0.5 whitespace-pre-line text-slate-300">
                        {selectedDoc.verification.reviewer_notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Extracted Data Form Viewer in Verification Mode */}
                <ExtractedDataViewer
                  document={selectedDoc}
                  isVerificationMode={true}
                  onSaved={refetch}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

