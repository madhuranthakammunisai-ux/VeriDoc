import React from 'react';
import { ProcessingStatus } from '../../types';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const statusConfig: Record<ProcessingStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  queued: { label: 'Queued', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', text: 'text-slate-400', icon: <Clock className="w-3 h-3 mr-1" /> },
  processing: { label: 'Processing', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', text: 'text-indigo-400', icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" /> },
  completed: { label: 'Completed', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
  failed: { label: 'Failed', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', text: 'text-rose-400', icon: <AlertCircle className="w-3 h-3 mr-1" /> },
};

export const ProcessingStatusBadge: React.FC<{ status: ProcessingStatus; className?: string }> = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.queued;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

