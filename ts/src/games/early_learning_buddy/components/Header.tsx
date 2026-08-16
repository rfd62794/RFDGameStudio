import React from 'react';
import { Volume2, VolumeX, Sparkles, Settings, Plus, Home, Grid } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  stars: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  stars,
  isMuted,
  onToggleMute,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-200/80 px-4 py-3 shadow-sm">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Title Logo */}
        <div
          onClick={() => onSelectView('practice')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-pink-400 to-purple-500 flex items-center justify-center text-white text-xl font-black shadow-md group-hover:scale-105 transition-transform">
            ✦
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 flex items-center gap-1.5">
              <span>Learning</span>
              <span className="text-amber-500 font-extrabold">Buddy</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Practice &amp; earn magic friends!
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => onSelectView('practice')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
              currentView === 'practice'
                ? 'bg-amber-400 text-slate-900 shadow-sm scale-102'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Practice</span>
          </button>

          <button
            onClick={() => onSelectView('request')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
              currentView === 'request'
                ? 'bg-pink-500 text-white shadow-sm scale-102'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Ask Friend</span>
          </button>

          <button
            onClick={() => onSelectView('playground')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
              currentView === 'playground'
                ? 'bg-purple-600 text-white shadow-sm scale-102'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Playground</span>
          </button>
        </nav>

        {/* Right Action Icons: Stars & Audio & Settings */}
        <div className="flex items-center gap-2">
          {/* Star Counter */}
          <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-2xl text-amber-900 font-black text-sm sm:text-base shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 animate-pulse" />
            <span>{stars}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-emerald-600" />}
          </button>

          {/* Settings gear */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
