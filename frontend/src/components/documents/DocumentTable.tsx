import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentItem } from '../../types';
import { CategoryBadge } from '../common/CategoryBadge';
import { ProcessingStatusBadge } from '../common/ProcessingStatusBadge';
import { VerificationStatusBadge } from '../common/VerificationStatusBadge';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { Eye, Download, RefreshCw, Trash2, FileText } from 'lucide-react';
import { api } from '../../services/api';

interface DocumentTableProps {
  documents: DocumentItem[];
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
  onReprocess?: (id: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onRefresh,
  onDelete,
  onReprocess,
}) => {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDownload = async (docId: string, filename: string) => {
    try {
      const res = await api.documents.getDownloadUrl(docId);
      if (res?.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      alert('Failed to obtain secure download URL');
    }
  };

  const confirmDelete = () => {
    if (deleteId && onDelete) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Document</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Verification</th>
              <th className="py-3.5 px-4">AI Confidence</th>
              <th className="py-3.5 px-4">Pages / Size</th>
              <th className="py-3.5 px-4">Uploaded</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                {/* Filename */}
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-200 truncate max-w-[200px]" title={doc.original_filename}>
                        {doc.original_filename}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">ID: {doc.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3 px-4">
                  <CategoryBadge category={doc.category} />
                </td>

                {/* Processing Status */}
                <td className="py-3 px-4">
                  <ProcessingStatusBadge status={doc.processing_status} />
                </td>

                {/* Verification Status */}
                <td className="py-3 px-4">
                  <VerificationStatusBadge status={doc.verification_status} />
                </td>

                {/* Confidence */}
                <td className="py-3 px-4">
                  <ConfidenceIndicator score={doc.confidence_score} />
                </td>

                {/* Pages & Size */}
                <td className="py-3 px-4 text-slate-400">
                  <span>{doc.page_count} pgs</span>
                  <span className="text-slate-600 mx-1">•</span>
                  <span>{(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                </td>

                {/* Upload Date */}
                <td className="py-3 px-4 text-slate-400">
                  {new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center space-x-1">
                    <button
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      title="View Details"
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc.id, doc.original_filename)}
                      title="Download Original"
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {onReprocess && (
                      <button
                        onClick={() => onReprocess(doc.id)}
                        title="Reprocess with AI"
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => setDeleteId(doc.id)}
                        title="Delete Document"
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationDialog
        isOpen={deleteId !== null}
        title="Delete Document"
        message="Are you sure you want to permanently delete this document and all extracted data? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

