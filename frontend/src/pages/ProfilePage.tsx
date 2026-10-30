import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">User Profile</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Account details and Supabase authentication identity
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {user?.user_metadata?.full_name || 'Enterprise Analyst'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mt-2 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 mr-1" /> Verified Authenticated Identity
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">User ID (UUID)</span>
            <p className="font-mono text-slate-300 break-all">{user?.id}</p>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Account Created</span>
            <p className="text-slate-300">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

