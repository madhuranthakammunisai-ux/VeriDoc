import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/common/ChartCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { ProcessingStatusBadge } from '../components/common/ProcessingStatusBadge';
import { VerificationStatusBadge } from '../components/common/VerificationStatusBadge';
import { UploadDropzone } from '../components/documents/UploadDropzone';
import {
  Files,
  CheckCircle2,
  Cpu,
  Clock,
  AlertCircle,
  Timer,
  UploadCloud,
  FileCheck,
  Search,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const CATEGORY_COLORS = ['#6366f1', '#3b82f6', '#a855f7', '#f59e0b', '#64748b'];

export const Dashboard: React.FC = () => {
  const { metrics, loading, error, refetch } = useAnalytics();
  const navigate = useNavigate();

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error || !metrics) return <ErrorState message={error || 'Failed to load dashboard data'} onRetry={refetch} />;

  const { cards, categoryDistribution, statusDistribution, monthlyTrends, recentDocuments, recentVerifications } = metrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry and metrics for AI document processing pipeline
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => navigate('/verification')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span>Review Verifications</span>
          </button>
        </div>
      </div>

      {/* 6 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Documents"
          value={cards.totalDocuments}
          icon={<Files className="w-4 h-4" />}
          subtitle="All indexed files"
        />
        <StatCard
          title="Successfully Processed"
          value={cards.successfullyProcessed}
          icon={<CheckCircle2 className="w-4 h-4" />}
          trend={`${cards.totalDocuments > 0 ? Math.round((cards.successfullyProcessed / cards.totalDocuments) * 100) : 100}%`}
          trendUp={true}
        />
        <StatCard
          title="Processing Queue"
          value={cards.processing}
          icon={<Cpu className="w-4 h-4" />}
          subtitle="Queued or active"
        />
        <StatCard
          title="Pending Verification"
          value={cards.pendingVerification}
          icon={<Clock className="w-4 h-4" />}
          subtitle="Awaiting human sign-off"
        />
        <StatCard
          title="Failed Documents"
          value={cards.failedDocuments}
          icon={<AlertCircle className="w-4 h-4" />}
          trend={cards.failedDocuments > 0 ? 'Requires attention' : 'Zero failures'}
          trendUp={cards.failedDocuments === 0}
        />
        <StatCard
          title="Avg Processing Time"
          value={`${cards.averageProcessingTimeSeconds}s`}
          icon={<Timer className="w-4 h-4" />}
          subtitle="Turnaround latency"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Upload Trends */}
        <ChartCard
          title="Monthly Upload & Completion Trends"
          subtitle="Documents submitted over the past 6 months"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={2} name="Total Uploads" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Category Distribution Pie */}
        <ChartCard
          title="Category Distribution"
          subtitle="Breakdown by document classification"
        >
          <div className="h-64 flex flex-col justify-between">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={categoryDistribution.filter(c => c.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={40}
                  paddingAngle={4}
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              {categoryDistribution.map((cat, idx) => (
                <div key={cat.name} className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                  <span className="truncate capitalize">{cat.name.replace('_', ' ')}:</span>
                  <span className="font-semibold text-white">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Quick Upload Dropzone on Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Quick Upload</h3>
          <span className="text-xs text-slate-400">Drag files to enqueue background AI extraction</span>
        </div>
        <UploadDropzone onUploadSuccess={refetch} />
      </div>

      {/* Recent Activity: Recent Documents & Recent Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-white">Recent Documents</h4>
            <button
              onClick={() => navigate('/documents')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {recentDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="hover:bg-slate-800/30 cursor-pointer"
                  >
                    <td className="py-2 px-3 text-slate-200 truncate max-w-[180px]">{doc.original_filename}</td>
                    <td className="py-2 px-3"><CategoryBadge category={doc.category} /></td>
                    <td className="py-2 px-3"><ProcessingStatusBadge status={doc.processing_status} /></td>
                  </tr>
                ))}
                {recentDocuments.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">No documents uploaded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Verification Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-white">Recent Human Verifications</h4>
            <button
              onClick={() => navigate('/verification')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>Open Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentVerifications.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/documents/${item.document_id}`)}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-200">{item.documents?.original_filename || 'Verified Document'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.reviewer_notes || 'Approved in verification review.'}</p>
                </div>
                <VerificationStatusBadge status={item.status} />
              </div>
            ))}
            {recentVerifications.length === 0 && (
              <p className="py-6 text-center text-slate-500 text-xs">No recent verification actions taken.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

