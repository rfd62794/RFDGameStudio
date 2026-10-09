import React from 'react';
import { MaterialType, MATERIAL_DEFS } from '../types';
import { Play, Pause, FastForward, Sparkles, RefreshCw, Zap, Layers, HelpCircle } from 'lucide-react';

interface HeaderProps {
  currentTier: number;
  tierGoalProgress: {
    targetMat: MaterialType;
    current: number;
    goal: number;
    title: string;
  };
  storedCounts: Record<number, number>;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  onStepSim: () => void;
  asteroidEnabled: boolean;
  onToggleAsteroids: () => void;
  onTriggerMeteorShower: () => void;
  onResetGrid: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTier,
  tierGoalProgress,
  storedCounts,
  simSpeed,
  onSetSimSpeed,
  onStepSim,
  asteroidEnabled,
  onToggleAsteroids,
  onTriggerMeteorShower,
  onResetGrid,
  onOpenHelp,
}) => {
  const keyMaterials = [
    MaterialType.STRUCTURAL_SOLID,
    MaterialType.DUST,
    MaterialType.GAS,
    MaterialType.LIQUID,
    MaterialType.VOID_CRYSTAL,
    MaterialType.CONDENSATE,
    MaterialType.LUMINITE,
  ];

  const pct = Math.min(100, Math.floor((tierGoalProgress.current / tierGoalProgress.goal) * 100));

  return (
    <header className="bg-[#0b0f19] border-b border-[#1f293d] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none text-xs text-slate-300">
      {/* Brand & Tier Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            VR
          </div>
          <div>
            <div className="font-bold text-sm text-slate-100 tracking-wider flex items-center gap-1.5">
              VOIDRIFT <span className="text-cyan-400 font-mono text-xs">REDUX</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Tier badge & current goal */}
        <div className="flex items-center gap-2.5 bg-[#121827] border border-[#232f48] px-2.5 py-1 rounded-md">
          <div className="flex items-center gap-1.5 font-semibold">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300">Tier {currentTier}</span>
            <span className="text-slate-500 text-[10px]">
              {currentTier === 1
                ? 'Manual Collection'
                : currentTier === 2
                ? 'Directed Flow'
                : currentTier === 3
                ? 'Refined Processing'
                : 'Reconstruction'}
            </span>
          </div>

          {currentTier < 4 && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="text-slate-400 text-[11px] font-mono">
                Goal: <span className="text-amber-300 font-semibold">{tierGoalProgress.current}</span>
                /{tierGoalProgress.goal} {MATERIAL_DEFS[tierGoalProgress.targetMat]?.name}
              </span>
              <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Material Inventory in Containers */}
      <div className="hidden lg:flex items-center gap-2 bg-[#0e1320] px-2 py-1 rounded border border-[#1b2338]">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Storage:</span>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {keyMaterials.map((mat) => {
            const def = MATERIAL_DEFS[mat];
            const count = storedCounts[mat] || 0;
            return (
              <div
                key={mat}
                className="flex items-center gap-1 bg-[#141b2c] px-1.5 py-0.5 rounded border border-slate-800/80"
                title={`${def.name}: ${count} stored in containers`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: def.color }}
                />
                <span className="text-slate-400">{def.name.split(' ')[0]}:</span>
                <span className="text-slate-100 font-semibold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sim Controls & Actions */}
      <div className="flex items-center gap-2">
        {/* Speed Controls */}
        <div className="flex items-center bg-[#13192a] p-0.5 rounded border border-[#222d46]">
          <button
            onClick={() => onSetSimSpeed(0)}
            className={`p-1.5 rounded transition ${
              simSpeed === 0
                ? 'bg-amber-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Pause Simulation (Space)"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetSimSpeed(1)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition ${
              simSpeed === 1
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="1x Speed"
          >
            1×
          </button>
          <button
            onClick={() => onSetSimSpeed(2)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition ${
              simSpeed === 2
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="2x Speed"
          >
            2×
          </button>
          <button
            onClick={() => onSetSimSpeed(5)}
            className={`px-2 py-1 rounded text-[11px] font-mono transition ${
              simSpeed === 5
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="5x Speed"
          >
            5×
          </button>
          {simSpeed === 0 && (
            <button
              onClick={onStepSim}
              className="px-2 py-1 text-[11px] font-mono text-cyan-300 hover:bg-slate-800 rounded ml-0.5"
              title="Step 1 Tick"
            >
              Step
            </button>
          )}
        </div>

        {/* Asteroid toggles */}
        <div className="flex items-center gap-1 bg-[#13192a] p-1 rounded border border-[#222d46]">
          <button
            onClick={onToggleAsteroids}
            className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition ${
              asteroidEnabled
                ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-700/50'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Asteroid Influx"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Drops {asteroidEnabled ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={onTriggerMeteorShower}
            className="px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 flex items-center gap-1"
            title="Trigger Meteor Surge"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Meteor Surge</span>
          </button>
        </div>

        {/* Help & Reset */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded border border-transparent hover:border-slate-700 transition"
          title="Guide & Reaction Codex"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onResetGrid}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded border border-transparent hover:border-slate-700 transition"
          title="Reset Simulation Canvas"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
