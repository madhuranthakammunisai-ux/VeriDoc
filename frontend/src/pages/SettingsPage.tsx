import React from 'react';
import { Settings, Shield, Cpu, Key, Database } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Workspace security, processing configurations, and connected infrastructure
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        <div className="p-5 flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <Shield className="w-4 h-4 mr-2 text-indigo-400" />
              Row Level Security (RLS)
            </h4>
            <p className="text-xs text-slate-400">
              Supabase PostgreSQL RLS policies restrict all table and storage records to auth.uid().
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
            Enforced
          </span>
        </div>

        <div className="p-5 flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <Cpu className="w-4 h-4 mr-2 text-indigo-400" />
              Durable Job Polling Interval
            </h4>
            <p className="text-xs text-slate-400">
              Python Render Background Worker polls PostgreSQL with SELECT FOR UPDATE SKIP LOCKED every 5 seconds.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            5s interval
          </span>
        </div>

        <div className="p-5 flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <Database className="w-4 h-4 mr-2 text-indigo-400" />
              Storage Bucket
            </h4>
            <p className="text-xs text-slate-400">
              Private Supabase Storage bucket: <span className="font-mono text-indigo-300">documents</span> (Max file size: 25MB)
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
            Private Bucket
          </span>
        </div>
      </div>
    </div>
  );
};

