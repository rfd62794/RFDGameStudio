import React from 'react';
import { GameState } from '../types';
import { PRESET_FACTORIES } from '../engine/recipes';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  BookOpen, 
  ShieldCheck, 
  DollarSign, 
  Cpu,
  Layers
} from 'lucide-react';

interface HeaderProps {
  state: GameState;
  onTogglePlay: () => void;
  onManualStep: () => void;
  onSetSpeed: (speed: 1 | 2 | 3) => void;
  onToggleSound: () => void;
  onLoadPreset: (presetId: string) => void;
  onReset: () => void;
  onOpenRecipes: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onTogglePlay,
  onManualStep,
  onSetSpeed,
  onToggleSound,
  onLoadPreset,
  onReset,
  onOpenRecipes,
}) => {
  return (
    <header className="bg-slate-950/90 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md select-none">
      {/* Brand & Studio Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-950/50">
          <Cpu size={22} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-100 tracking-tight">
              ARMORY
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-semibold">
              STOREFRONT & SPINDLE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Declarative SVG Conveyor Factory & Automated Store Fulfillment
          </p>
        </div>
      </div>

      {/* Center Vital Metrics (Funds, Rep, Ticks) */}
      <div className="flex items-center gap-6 bg-slate-900/90 px-4 py-1.5 rounded-xl border border-slate-800 shadow-inner">
        {/* Working Capital */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <DollarSign size={16} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Working Capital</div>
            <div className="text-base font-mono font-bold text-emerald-400">
              ${state.funds.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="w-px h-7 bg-slate-800" />

        {/* Reputation */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Reputation</div>
            <div className="text-sm font-mono font-bold text-cyan-300">
              {state.reputation}%
            </div>
          </div>
        </div>

        <div className="w-px h-7 bg-slate-800" />

        {/* Sim Tick */}
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Sim Clock</div>
          <div className="text-sm font-mono font-semibold text-slate-200">
            T+{state.tick}
          </div>
        </div>
      </div>

      {/* Right Controls: Sim Speed, Sound, Presets, Info */}
      <div className="flex items-center gap-3">
        {/* Play/Pause & Step */}
        <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-1">
          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded-md transition-all ${
              state.isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500 text-slate-950 shadow-sm'
            }`}
            title={state.isRunning ? 'Pause Simulation' : 'Run Simulation'}
          >
            {state.isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            onClick={onManualStep}
            disabled={state.isRunning}
            className="p-1.5 rounded-md text-slate-300 hover:text-cyan-400 hover:bg-slate-800 disabled:opacity-40 disabled:hover:text-slate-300 transition-colors ml-0.5"
            title="Single Step Pulse"
          >
            <SkipForward size={16} />
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center ml-1.5 border-l border-slate-800 pl-1.5 gap-0.5">
            {([1, 2, 3] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSpeed(spd)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                  state.speed === spd
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Blueprint Presets Dropdown */}
        <div className="relative group">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onLoadPreset(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 appearance-none cursor-pointer hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 pr-7 font-medium"
          >
            <option value="" disabled>Load Blueprint...</option>
            {PRESET_FACTORIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Layers size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Recipe Reference Book */}
        <button
          onClick={onOpenRecipes}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
          title="Open Weapon Blueprints & Schematics"
        >
          <BookOpen size={16} />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
          title={state.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          {state.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
          title="Reset Simulation"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </header>
  );
};
