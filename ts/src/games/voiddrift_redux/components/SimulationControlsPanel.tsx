import React from 'react';
import { SimulationConfig, SimulationStats } from '../types';
import { Settings, Play, Pause, RotateCcw, Anchor, Zap } from 'lucide-react';

interface SimulationControlsPanelProps {
  config: SimulationConfig;
  stats: SimulationStats;
  onUpdateConfig: (cfg: Partial<SimulationConfig>) => void;
  onUpdateFleet: (scouts: number, miners: number, haulers: number) => void;
  onTogglePlayPause: () => void;
  onSetSimSpeed: (speed: number) => void;
  onResetSimulation: () => void;
}

export const SimulationControlsPanel: React.FC<SimulationControlsPanelProps> = ({
  config,
  stats,
  onUpdateConfig,
  onUpdateFleet,
  onTogglePlayPause,
  onSetSimSpeed,
  onResetSimulation,
}) => {
  return (
    <div id="simulation-controls-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Panel Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-100 uppercase">
            Simulation Parameters & Fleet Config
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="sim-play-pause-btn"
            onClick={onTogglePlayPause}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition ${
              stats.isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {stats.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {stats.isRunning ? 'PAUSE' : 'RESUME'}
          </button>

          <button
            id="sim-reset-btn"
            onClick={onResetSimulation}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 border border-slate-800 rounded transition"
            title="Reset World"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Speed Multipliers & Auto-Dispatch Toggle */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1.5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Sim Speed</span>
          <div className="flex items-center gap-1">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                id={`sim-speed-${s}x-btn`}
                onClick={() => onSetSimSpeed(s)}
                className={`flex-1 py-1 rounded text-[11px] font-bold border transition ${
                  stats.simSpeed === s
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Auto-Dispatch FSM</span>
          <button
            id="toggle-auto-dispatch-btn"
            onClick={() => onUpdateConfig({ autoDispatch: !config.autoDispatch })}
            className={`w-full py-1 rounded text-[11px] font-bold border transition ${
              config.autoDispatch
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            {config.autoDispatch ? 'AUTO DISPATCH: ON' : 'MANUAL ONLY'}
          </button>
        </div>
      </div>

      {/* Fleet Size Sliders */}
      <div className="space-y-3 font-mono text-xs">
        {/* Mining Drones */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Mining Drones (Ring 1)
            </span>
            <span className="text-amber-400 font-bold">{config.miningDroneCount}</span>
          </div>
          <input
            id="slider-mining-count"
            type="range"
            min={1}
            max={6}
            value={config.miningDroneCount}
            onChange={(e) =>
              onUpdateFleet(config.scoutCount, parseInt(e.target.value, 10), config.haulerCount)
            }
            className="w-full accent-amber-500 bg-slate-950 h-1.5 rounded cursor-pointer"
          />
        </div>

        {/* Tug Haulers */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-slate-300">
            <span className="flex items-center gap-1">
              <Anchor className="w-3.5 h-3.5 text-purple-400" /> Tug Haulers (Ring 2)
            </span>
            <span className="text-purple-300 font-bold">{config.haulerCount}</span>
          </div>
          <input
            id="slider-hauler-count"
            type="range"
            min={1}
            max={4}
            value={config.haulerCount}
            onChange={(e) =>
              onUpdateFleet(config.scoutCount, config.miningDroneCount, parseInt(e.target.value, 10))
            }
            className="w-full accent-purple-500 bg-slate-950 h-1.5 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
