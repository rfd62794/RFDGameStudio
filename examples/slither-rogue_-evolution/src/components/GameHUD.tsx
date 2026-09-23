import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Magnet, 
  Shield, 
  Maximize2, 
  Compass, 
  Ghost, 
  Sparkles, 
  Flame,
  Clock,
  ChevronRight
} from 'lucide-react';

interface GameHUDProps {
  score: number;
  fruitsToNextEvolution: number;
  peakLength: number;
  currentLength: number;
  shieldCharges: number;
  evolutionsCount: number;
  timeLeft: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onReturnToMenu: () => void;
  activeEvolutions: Record<string, number>;
}

export default function GameHUD({
  score,
  fruitsToNextEvolution,
  peakLength,
  currentLength,
  shieldCharges,
  evolutionsCount,
  timeLeft,
  isPaused,
  onTogglePause,
  onReset,
  onReturnToMenu,
  activeEvolutions
}: GameHUDProps) {
  
  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = timeLeft <= 30;

  // Render mutation badging on HUD
  const renderMutationBadge = (id: string, count: number) => {
    if (count <= 0) return null;
    let icon = <Sparkles className="w-4 h-4 text-emerald-400" />;
    let label = '';
    let colorClass = 'bg-slate-800 border-slate-700 text-slate-300';

    switch (id) {
      case 'speed':
        icon = <Zap className="w-3.5 h-3.5 text-amber-400" />;
        label = `Speed +${count * 15}%`;
        colorClass = 'bg-amber-500/10 border-amber-500/20 text-amber-300';
        break;
      case 'magnet':
        icon = <Magnet className="w-3.5 h-3.5 text-sky-400" />;
        label = `Magnet +${count * 60}px`;
        colorClass = 'bg-sky-500/10 border-sky-500/20 text-sky-300';
        break;
      case 'shield':
        icon = <Shield className="w-3.5 h-3.5 text-emerald-400" />;
        label = `Shield (${shieldCharges} Chrg)`;
        colorClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
        break;
      case 'wide':
        icon = <Maximize2 className="w-3.5 h-3.5 text-violet-400" />;
        label = `Girth +${count * 3}px`;
        colorClass = 'bg-violet-500/10 border-violet-500/20 text-violet-300';
        break;
      case 'sense':
        icon = <Compass className="w-3.5 h-3.5 text-rose-400" />;
        label = `Radar +${count * 200}px`;
        colorClass = 'bg-rose-500/10 border-rose-500/20 text-rose-300';
        break;
      case 'ghost':
        icon = <Ghost className="w-3.5 h-3.5 text-indigo-400" />;
        label = `Ghost tail: ${count} seg`;
        colorClass = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300';
        break;
      case 'regen':
        icon = <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />;
        label = `Growth (${count}x)`;
        colorClass = 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300';
        break;
      case 'venom':
        icon = <Flame className="w-3.5 h-3.5 text-orange-400" />;
        label = `Acid trail (${count}x)`;
        colorClass = 'bg-orange-500/10 border-orange-500/20 text-orange-300';
        break;
    }

    return (
      <div key={id} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${colorClass} shadow-sm animate-fade-in`}>
        {icon}
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 select-none">
      
      {/* Primary Stats Panel */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left Side: Logo & Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
              S
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-100 tracking-tight uppercase leading-none">
                Snake Roguelike
              </h1>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase">
                Slither & Mutate
              </span>
            </div>
          </div>

          {/* Glowing Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-lg font-bold shadow-inner transition-colors duration-300 ${
            isTimeCritical 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' 
              : 'bg-slate-950/40 border-slate-800 text-slate-200'
          }`}>
            <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400 animate-spin' : 'text-slate-400'}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Middle Side: Roguelike Evolution Trigger Progress */}
        <div className="flex-1 max-w-sm flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Genetic Progress
            </span>
            <span className="font-mono text-emerald-400">{3 - fruitsToNextEvolution}/3 fruits</span>
          </div>
          
          <div className="w-full h-2.5 bg-slate-950/50 rounded-full border border-slate-800 overflow-hidden p-0.5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              style={{ width: `${((3 - fruitsToNextEvolution) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Right Side: Score Stats & Active Game Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3.5">
          {/* Stats Display Block */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fruits Eaten</span>
              <span className="font-mono font-black text-slate-200 text-base">{score}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Length (Peak)</span>
              <div className="font-mono text-slate-200 text-base flex items-center justify-end gap-1">
                <span>{currentLength}</span>
                <span className="text-xs text-slate-500">({peakLength})</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800" />

            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Evolutions</span>
              <span className="font-mono font-black text-slate-200 text-base text-violet-400">{evolutionsCount}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Quick HUD Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePause}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-lg border border-slate-700 transition-colors shadow-sm outline-none focus:ring-1 focus:ring-emerald-500"
              title={isPaused ? "Resume Run" : "Pause Run"}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={onReset}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 rounded-lg border border-slate-700 transition-colors shadow-sm outline-none focus:ring-1 focus:ring-emerald-500"
              title="Restart Run"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={onReturnToMenu}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-sm outline-none"
            >
              Menu
            </button>
          </div>
        </div>

      </div>

      {/* Active Mutations Tray */}
      {Object.values(activeEvolutions).some(v => v > 0) && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Active Mutated Genes:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(activeEvolutions).map(([id, count]) => renderMutationBadge(id, count))}
          </div>
        </div>
      )}

    </div>
  );
}
