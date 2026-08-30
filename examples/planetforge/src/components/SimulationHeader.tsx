import React from 'react';
import { ResourceLedger } from '../types';
import {
  Play,
  Pause,
  SkipForward,
  FastForward,
  RotateCcw,
  Wheat,
  Zap,
  Boxes,
  CheckCircle,
  FlaskConical,
  Sparkles,
} from 'lucide-react';

interface SimulationHeaderProps {
  currentTick: number;
  isPlaying: boolean;
  speed: number;
  ledger: ResourceLedger;
  onTogglePlay: () => void;
  onStepTick: (ticks: number) => void;
  onSetSpeed: (speed: number) => void;
  onResetWorld: () => void;
  onOpenTests: () => void;
}

export const SimulationHeader: React.FC<SimulationHeaderProps> = ({
  currentTick,
  isPlaying,
  speed,
  ledger,
  onTogglePlay,
  onStepTick,
  onSetSpeed,
  onResetWorld,
  onOpenTests,
}) => {
  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md px-4 lg:px-8 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title & Phase Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-950/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                SlimeWorld
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                Phase: Soil Upgrade + Monument
              </span>
            </div>
            <p className="text-xs text-slate-400">
              32-Tile Ring Engine • ADR 002 Deterministic Simulation
            </p>
          </div>
        </div>

        {/* Resource Ledger HUD */}
        <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
          <div className="flex items-center gap-1.5" title="Food Resource">
            <div className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Wheat className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Food</div>
              <div className="text-sm font-mono font-black text-emerald-300">
                {ledger.food}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5" title="Energy Resource">
            <div className="p-1 rounded bg-rose-950 text-rose-400 border border-rose-800">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Energy</div>
              <div className="text-sm font-mono font-black text-rose-300">
                {ledger.energy}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5" title="Material Resource">
            <div className="p-1 rounded bg-amber-950 text-amber-400 border border-amber-800">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] uppercase font-bold text-slate-400">Material</div>
              <div className="text-sm font-mono font-black text-amber-300">
                {ledger.material}
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Controls & Test Suite Button */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Tick Indicator */}
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-200">
            Tick <span className="text-amber-400">#{currentTick}</span>
          </div>

          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Run Sim
              </>
            )}
          </button>

          {/* Step 1 */}
          <button
            onClick={() => onStepTick(1)}
            disabled={isPlaying}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40"
            title="Step 1 Tick"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Step 10 */}
          <button
            onClick={() => onStepTick(10)}
            disabled={isPlaying}
            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 disabled:opacity-40 flex items-center gap-1"
            title="Step 10 Ticks"
          >
            <FastForward className="w-3.5 h-3.5" />
            +10t
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-mono">
            {[1, 2, 5].map((s) => (
              <button
                key={`speed-${s}`}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 rounded transition-all ${
                  speed === s
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Reset World */}
          <button
            onClick={onResetWorld}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
            title="Reset Simulation World"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Test Suite Runner Button */}
          <button
            onClick={onOpenTests}
            className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-950/40"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            Test Suite (3/3)
          </button>
        </div>
      </div>
    </header>
  );
};
