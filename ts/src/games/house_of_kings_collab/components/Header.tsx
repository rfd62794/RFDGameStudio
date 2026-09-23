import React from 'react';
import { Shield, User, LogOut, CheckCircle2, ShieldCheck, Crown } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  user: FirebaseUser | null;
  activeTab: 'task' | 'verification' | 'admin';
  setActiveTab: (tab: 'task' | 'verification' | 'admin') => void;
  onSignOut: () => void;
  houseName: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onSignOut,
  houseName,
}) => {
  const adminEmail = (import.meta as any).env?.VITE_ADMIN_EMAIL || 'cheater2478@gmail.com';
  const showAdminTab = !!user?.email && user.email.toLowerCase() === adminEmail.toLowerCase();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand logo & House badge */}
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30 text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-base sm:text-lg tracking-tight text-amber-100 flex items-center gap-2">
              House of Kings: Collab
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono border border-amber-500/20">
                Phase 2
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {houseName ? `House: ${houseName}` : 'Server-Authoritative Task Engine'}
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        {user && (
          <nav className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1">
            <button
              onClick={() => setActiveTab('task')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'task'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Special Task
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Verification Suite
            </button>
            {showAdminTab && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Game Master Panel
              </button>
            )}
          </nav>
        )}

        {/* User Account & Sign Out */}
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-200 truncate max-w-[120px]">
                {user.displayName || user.email || 'Noble Lord'}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sign In Required
          </div>
        )}
      </div>
    </header>
  );
};
