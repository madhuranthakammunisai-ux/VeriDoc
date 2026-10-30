import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Files,
  Cpu,
  CheckSquare,
  BarChart3,
  FileText,
  Search,
  Settings,
  User,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

const mainNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Quick Upload', path: '/upload', icon: UploadCloud },
  { name: 'Documents', path: '/documents', icon: Files },
  { name: 'Processing Queue', path: '/processing', icon: Cpu },
  { name: 'Verification Center', path: '/verification', icon: CheckSquare },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Knowledge Discovery', path: '/knowledge', icon: Search },
];

const secondaryNavItems = [
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Help & Docs', path: '/help', icon: HelpCircle },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md shadow-indigo-600/30">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-wide">VeriDoc</span>
          <span className="text-xs font-semibold text-indigo-400 ml-1.5 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Intelligent Processing
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            System & Support
          </div>
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Enterprise Security Footer */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL RLS Active</span>
        </span>
        <span className="text-slate-600 font-mono">v1.0.0</span>
      </div>
    </aside>
  );
};

