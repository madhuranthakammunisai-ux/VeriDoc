import React from 'react';
import { DocumentCategory } from '../../types';

const categoryConfig: Record<DocumentCategory, { label: string; bg: string; text: string; border: string }> = {
  invoices: { label: 'Invoice', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  bank_statements: { label: 'Bank Statement', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  purchase_orders: { label: 'Purchase Order', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  large_pdf_documents: { label: 'Large PDF', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  unknown: { label: 'Unknown', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

export const CategoryBadge: React.FC<{ category: DocumentCategory; className?: string }> = ({ category, className = '' }) => {
  const config = categoryConfig[category] || categoryConfig.unknown;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {config.label}
    </span>
  );
};

