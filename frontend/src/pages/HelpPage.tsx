import React from 'react';
import { HelpCircle, FileCheck, Cpu, Database, BookOpen } from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Help & Documentation</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Architecture, user workflows, and category extraction specifications
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center">
            <Cpu className="w-4 h-4 mr-2 text-indigo-400" />
            1. Asynchronous Architecture Workflow
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When you upload a document via the Frontend, the Node.js Express API validates the MIME type and file size, uploads the binary to your private folder in Supabase Storage, registers the document record in PostgreSQL, enqueues a background job in <span className="font-mono text-indigo-300">document_jobs</span>, and returns <span className="font-semibold text-emerald-400">HTTP 202 Accepted</span> immediately.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center">
            <FileCheck className="w-4 h-4 mr-2 text-emerald-400" />
            2. Four Supported Document Categories
          </h3>
          <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
            <p><strong className="text-slate-200">A. Invoices:</strong> Extracts invoice number, dates, vendor/customer details, subtotal, taxes, discounts, grand total, and individual line items with arithmetic check.</p>
            <p><strong className="text-slate-200">B. Bank Statements:</strong> Extracts bank name, holder, masked account number, opening/closing balances, deposits, withdrawals, normalized transaction table, and duplicate transaction detection.</p>
            <p><strong className="text-slate-200">C. Purchase Orders:</strong> Extracts PO number, buyer/supplier company, delivery dates, terms, line item quantities, unit prices, and grand total.</p>
            <p><strong className="text-slate-200">D. Large PDF Documents:</strong> Performs page-by-page extraction, OCR fallback, token-aware chunking, chunk summaries, overall document executive summary, and knowledge Q&A.</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <h3 className="text-sm font-bold text-white flex items-center">
            <Database className="w-4 h-4 mr-2 text-purple-400" />
            3. Verification & Corrections
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Documents are automatically flagged for review. The Verification Center provides side-by-side verification and allows reviewers to correct fields, enter audit notes, and approve the document. Human edits are stored in <span className="font-mono text-indigo-300">verification_records</span>, preserving original AI output for audit trails.
          </p>
        </div>
      </div>
    </div>
  );
};

