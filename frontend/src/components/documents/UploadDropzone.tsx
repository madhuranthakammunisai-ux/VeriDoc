import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface UploadDropzoneProps {
  onUploadSuccess?: () => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const valid = files.filter(f => {
      const isAllowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff', 'image/webp'].includes(f.type);
      const isUnderSize = f.size <= 25 * 1024 * 1024;
      return isAllowed && isUnderSize;
    });

    if (valid.length < files.length) {
      setUploadMessage({
        type: 'error',
        text: 'Some files were excluded. Only PDF, PNG, JPEG, TIFF, WEBP under 25MB are permitted.',
      });
    }

    setSelectedFiles((prev) => [...prev, ...valid].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      setUploadMessage(null);
      const res = await api.documents.upload(selectedFiles);
      setUploadMessage({
        type: 'success',
        text: res.message || `${selectedFiles.length} file(s) queued for AI background processing.`,
      });
      setSelectedFiles([]);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      setUploadMessage({
        type: 'error',
        text: err?.response?.data?.error?.message || err.message || 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-full mb-3">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            Click to upload or drag and drop files
          </p>
          <p className="text-xs text-slate-400 max-w-sm mb-3">
            Invoices, Bank Statements, Purchase Orders, and Large PDFs (PDF, PNG, JPEG, TIFF up to 25MB)
          </p>
          <span className="text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
            Durable Background AI Worker Pipeline
          </span>
        </div>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Ready to Process ({selectedFiles.length} files)</span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-rose-400 hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs"
              >
                <div className="flex items-center space-x-2 truncate mr-2">
                  <File className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="font-medium text-slate-200 truncate">{file.name}</span>
                  <span className="text-slate-500 text-[10px]">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enqueuing Documents...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Process with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast Banner */}
      {uploadMessage && (
        <div
          className={`mt-4 p-3 rounded-lg flex items-center space-x-2 text-xs font-medium ${
            uploadMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
          }`}
        >
          {uploadMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{uploadMessage.text}</span>
        </div>
      )}
    </div>
  );
};

