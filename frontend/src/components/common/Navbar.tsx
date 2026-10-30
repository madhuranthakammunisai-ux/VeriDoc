import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Bell, Shield, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center space-x-1">
          <Shield className="w-3.5 h-3.5 mr-1" />
          Production Pipeline
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Status notification icon */}
        <div className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
        </div>

        {/* User profile dropdown info */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-semibold text-xs">
            {user?.email?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white truncate max-w-[150px]">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors ml-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

