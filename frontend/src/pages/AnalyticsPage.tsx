import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/common/ChartCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle,
  FileBarChart,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

export const AnalyticsPage: React.FC = () => {
  const { metrics, loading, error, refetch } = useAnalytics();

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error || !metrics) return <ErrorState message={error || 'Failed to load analytics'} onRetry={refetch} />;

  const { cards, categoryDistribution, statusDistribution, monthlyTrends } = metrics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Intelligence & Pipeline Analytics</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time metrics, extraction accuracy, throughput, and audit trends
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents Indexed"
          value={cards.totalDocuments}
          icon={<FileBarChart className="w-4 h-4" />}
          subtitle="Processed across all categories"
        />
        <StatCard
          title="Overall Success Rate"
          value={`${cards.totalDocuments > 0 ? Math.round((cards.successfullyProcessed / cards.totalDocuments) * 100) : 100}%`}
          icon={<CheckCircle className="w-4 h-4" />}
          trend="Production Standard"
          trendUp={true}
        />
        <StatCard
          title="Average Confidence Score"
          value={`${Math.round(cards.averageConfidence * 100)}%`}
          icon={<ShieldCheck className="w-4 h-4" />}
          subtitle="Mathematical validation passed"
        />
        <StatCard
          title="Average Processing Duration"
          value={`${cards.averageProcessingTimeSeconds}s`}
          icon={<Clock className="w-4 h-4" />}
          subtitle="OCR & Gemini pipeline"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Ingestion Volume */}
        <ChartCard
          title="Monthly Document Ingestion Volume"
          subtitle="Upload cadence and completion throughput"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="uploads" stroke="#6366f1" fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Category Breakdown Bar Chart */}
        <ChartCard
          title="Distribution by Document Category"
          subtitle="Categorized volume: Invoices, Statements, POs, Large PDFs"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

