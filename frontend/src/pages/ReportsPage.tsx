import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { 
  FileText, 
  Download, 
  Play, 
  CheckCircle2, 
  Calendar, 
  Filter, 
  Layers 
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState('category_summary');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await api.reports.list();
        setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleGenerate = async (type: string) => {
    try {
      setGenerating(true);
      const res = await api.reports.generate({
        report_type: type as any,
        category: categoryFilter ? (categoryFilter as any) : undefined,
      });
      setActiveReport(res);
    } catch (err) {
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!activeReport) return;
    const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridoc_${activeReport.reportType}_report.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Compliance & Financial Reports</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate auditable reports from verified documents, transactions, and extraction logs
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center space-x-2.5 text-indigo-400 mb-2">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-sm font-semibold text-white">{tmpl.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">{tmpl.description}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-500 uppercase">{tmpl.type}</span>
                <button
                  onClick={() => handleGenerate(tmpl.type)}
                  disabled={generating}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generated Report Display */}
      {activeReport && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">
                {activeReport.reportType.replace('_', ' ')} Report
              </h3>
              <p className="text-xs text-slate-400">
                Generated at {new Date(activeReport.generatedAt).toLocaleString()} • Report ID: {activeReport.reportId.slice(0, 8)}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-lg text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-[11px] text-emerald-300 font-mono max-h-96">
            {JSON.stringify(activeReport.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

