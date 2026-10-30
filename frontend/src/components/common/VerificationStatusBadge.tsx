import React from 'react';
import { VerificationStatus } from '../../types';
import { CheckCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

const verifConfig: Record<VerificationStatus, { label: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending Verification', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCheck className="w-3 h-3 mr-1" /> },
  needs_correction: { label: 'Needs Correction', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <ShieldAlert className="w-3 h-3 mr-1" /> },
};

export const VerificationStatusBadge: React.FC<{ status: VerificationStatus; className?: string }> = ({ status, className = '' }) => {
  const config = verifConfig[status] || verifConfig.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

