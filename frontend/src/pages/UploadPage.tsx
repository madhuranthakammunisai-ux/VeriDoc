import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadDropzone } from '../components/documents/UploadDropzone';
import { ShieldCheck, Cpu, ArrowLeft } from 'lucide-react';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Upload Documents</h1>
          <p className="text-xs text-slate-400">
            Submit invoices, bank statements, purchase orders, or large business PDFs
          </p>
        </div>
      </div>

      <UploadDropzone onUploadSuccess={() => navigate('/processing')} />

      {/* Enterprise Processing Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
            <Cpu className="w-4 h-4" />
            <span>Asynchronous Worker</span>
          </div>
          <p className="text-slate-400">
            Files are persisted in private Supabase Storage and claimed atomically by the Python worker via PostgreSQL RPC.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Deterministic Checks</span>
          </div>
          <p className="text-slate-400">
            Every extraction is strictly validated against mathematical rules: line totals, tax reconciliation, and bank balances.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Human-in-the-Loop</span>
          </div>
          <p className="text-slate-400">
            Discrepancies are highlighted in the Verification Center for reviewer approval without changing original AI records.
          </p>
        </div>
      </div>
    </div>
  );
};

