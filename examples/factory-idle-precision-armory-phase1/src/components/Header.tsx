import React from 'react';
import { GameState, SectorData } from '../types';
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
  Layers,
  Zap,
  FlaskConical,
  Activity,
  AlertTriangle,
  Lock,
  Flame,
  ArrowUpRight
} from 'lucide-react';

interface HeaderProps {
  state: GameState;
  onTogglePlay: () => void;
  onManualStep: () => void;
  onSetSpeed: (speed: 1 | 2 | 5 | 10) => void;
  onToggleSound: () => void;
  onSwitchSector: (sectorId: string) => void;
  onUnlockSector: (sectorId: string) => void;
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
  onSwitchSector,
  onUnlockSector,
  onLoadPreset,
  onReset,
  onOpenRecipes,
}) => {
  const isBrownout = state.powerRatio < 1.0;
  const powerLoadPct = state.powerCapacity > 0 
    ? Math.min(100, Math.round((state.powerConsumed / state.powerCapacity) * 100)) 
    : 100;

  return (
    <header className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none shadow-md z-30">
      {/* Brand & Sector Navigator */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-950/40">
          <Flame size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-slate-100 tracking-tight flex items-center gap-1">
              FACTORY IDLE
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800/80 text-amber-400 font-bold">
              ARMORY
            </span>
          </div>
          
          {/* Sector Switcher Tabs */}
          <div className="flex items-center gap-1 mt-0.5">
            {(Object.values(state.sectors) as SectorData[]).map((sec) => {
              const isActive = state.activeSectorId === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    if (sec.unlocked) {
                      onSwitchSector(sec.id);
                    } else if (state.funds >= sec.unlockCost) {
                      onUnlockSector(sec.id);
                    }
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : sec.unlocked
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      : 'bg-slate-950/60 text-slate-500 border border-slate-900 hover:border-slate-700'
                  }`}
                >
                  <span>{sec.name.split(':')[0]}</span>
                  {!sec.unlocked && (
                    <span className="text-[9px] text-amber-400 flex items-center">
                      <Lock size={9} /> ${sec.unlockCost}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Vital Telemetry (Factory Idle HUD) */}
      <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
        {/* Cash & Net Flow */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <DollarSign size={15} />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <span>Capital</span>
              <span className="text-[9px] font-mono text-emerald-400">
                (+${state.cashflowRate}/s)
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400">
              ${state.funds.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Research Points (RP) */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
            <FlaskConical size={15} />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <span>Research</span>
              <span className="text-[9px] font-mono text-blue-400">
                (+{state.researchRate} RP/s)
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-blue-300">
              {Math.floor(state.researchPoints)} <span className="text-[10px] text-blue-400 font-normal">RP</span>
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Power Grid (MW/kW) */}
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded border ${
            isBrownout 
              ? 'bg-rose-950/80 text-rose-400 border-rose-800/80 animate-pulse' 
              : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
          }`}>
            <Zap size={15} />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400 flex items-center justify-between gap-1">
              <span>Power Grid</span>
              <span className={`text-[9px] font-mono font-bold ${isBrownout ? 'text-rose-400' : 'text-slate-300'}`}>
                {isBrownout ? '⚡ BROWNOUT' : `${powerLoadPct}% Load`}
              </span>
            </div>
            <div className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-1">
              <span className={state.powerConsumed > state.powerCapacity ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {state.powerConsumed}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-amber-400 font-bold">{state.powerCapacity} kW</span>
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        {/* Overall Efficiency */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <Activity size={15} />
          </div>
          <div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Efficiency</div>
            <div className="text-xs font-mono font-bold text-cyan-300">
              {state.metrics.currentEfficiency}%
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Speed Multipliers */}
      <div className="flex items-center gap-2">
        {/* Speed Controls */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-md border border-slate-800">
          {([1, 2, 5, 10] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => onSetSpeed(spd)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                state.speed === spd
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Play/Pause & Step */}
        <button
          onClick={onTogglePlay}
          className={`p-1.5 rounded-md font-semibold text-xs flex items-center gap-1 transition-all ${
            state.isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-xs'
          }`}
          title={state.isRunning ? 'Pause Simulation' : 'Run Simulation'}
        >
          {state.isRunning ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          onClick={onManualStep}
          disabled={state.isRunning}
          className={`p-1.5 rounded-md text-xs border border-slate-800 transition-all ${
            state.isRunning
              ? 'text-slate-600 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
          }`}
          title="Step Forward (1 Tick)"
        >
          <SkipForward size={14} />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-md text-xs border border-slate-800 transition-all ${
            state.soundEnabled
              ? 'bg-slate-900 text-cyan-400'
              : 'bg-slate-900 text-slate-600'
          }`}
          title={state.soundEnabled ? 'Mute SFX' : 'Enable SFX'}
        >
          {state.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        {/* Preset Layouts Dropdown */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              onLoadPreset(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded-md px-2 py-1 focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
        >
          <option value="" disabled>Load Layout Blueprint...</option>
          {PRESET_FACTORIES.map((p) => (
            <option key={p.id} value={p.id}>
              📐 {p.name}
            </option>
          ))}
        </select>

        {/* Recipe Reference Book */}
        <button
          onClick={onOpenRecipes}
          className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all"
        >
          <BookOpen size={13} className="text-amber-400" />
          <span>Manual</span>
        </button>

        {/* Reset Floor */}
        <button
          onClick={onReset}
          className="p-1.5 rounded-md text-xs bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 border border-slate-800 transition-all"
          title="Clear Entire Factory Floor"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </header>
  );
};
