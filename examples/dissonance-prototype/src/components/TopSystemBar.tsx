import React from 'react';
import { Sparkles } from 'lucide-react';

interface TopSystemBarProps {
  essence: number;
  showDebug: boolean;
  onToggleDebug: () => void;
}

export default function TopSystemBar({
  essence,
  showDebug,
  onToggleDebug
}: TopSystemBarProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-900 border border-slate-800 rounded-2xl gap-4 shadow-xl" id="top-system-bar">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.25)]">
          <Sparkles className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-900/50 uppercase font-bold tracking-wider">
              Proto Build v5.0
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              RUNG-BASED PROCEDURAL MAPS
            </span>
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight text-slate-100 mt-1">
            DISSONANCE
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-end">
        <div className="px-4 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl font-mono text-xs text-right shrink-0">
          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Banked Essence</span>
          <span className="text-emerald-400 font-bold text-sm">{essence} ESS</span>
        </div>

        <button 
          onClick={onToggleDebug}
          className={`px-3 py-2 text-[10px] font-mono transition-all border rounded-xl flex items-center gap-1.5 ${
            showDebug 
              ? 'bg-amber-550/15 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
              : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-750/70 hover:text-slate-300'
          }`}
          id="toggle-debug-btn"
        >
          🛠️ Diagnostics
        </button>
      </div>
    </header>
  );
}
