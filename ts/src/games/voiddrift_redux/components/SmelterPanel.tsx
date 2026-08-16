import React from 'react';
import { ConversionProcess, ResourceType, SimulationStats } from '../types';
import { Flame, Database, ArrowRight, Layers, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface SmelterPanelProps {
  stats: SimulationStats;
  onStartSmelt: (inputAmount: number) => void;
}

export const SmelterPanel: React.FC<SmelterPanelProps> = ({ stats, onStartSmelt }) => {
  const metal = stats.resources?.Metal || 0;
  const rawAluminum = stats.resources?.RawAluminum || 0;
  const aluminum = stats.resources?.Aluminum || 0;

  const conversions = stats.conversions || [];
  const activeProcessing = conversions.filter((c) => c.status === 'processing');

  const canSmelt1 = rawAluminum >= 10;
  const canSmelt2 = rawAluminum >= 20;

  return (
    <div id="smelter-resource-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-100 uppercase font-mono">
            Resource Storage & Smelting Foundation
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-400">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Phase 3 Active
        </div>
      </div>

      {/* Multi-Resource Inventory Grid */}
      <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
        {/* Metal */}
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Metal</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-amber-400">{metal}</span>
            <span className="text-[10px] text-slate-500">MT</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-1">Ring 1 Ore</span>
        </div>

        {/* Raw Aluminum */}
        <div className="bg-slate-950/80 border border-purple-500/30 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Raw Aluminum</span>
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-purple-300">{rawAluminum}</span>
            <span className="text-[10px] text-slate-500">MT</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-1">Ring 2 Tugged Ore</span>
        </div>

        {/* Refined Aluminum */}
        <div className="bg-slate-950/80 border border-cyan-500/30 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
            <span>Refined Al</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-cyan-300">{aluminum}</span>
            <span className="text-[10px] text-slate-500">MT</span>
          </div>
          <span className="text-[9px] text-cyan-500/80 mt-1">Smelted In Hub</span>
        </div>
      </div>

      {/* Smelter Recipe Execution Unit */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 font-mono">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">Aluminum Smelter Conversion Unit</span>
          </div>
          <span className="text-[10px] text-slate-400">Recipe: 10 RawAl $\rightarrow$ 5 Al (8s)</span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 text-[11px]">
            <span className="bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2 py-1 rounded">
              10 Raw Aluminum
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-2 py-1 rounded">
              5 Refined Aluminum
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="start-smelt-1-batch-btn"
              onClick={() => onStartSmelt(10)}
              disabled={!canSmelt1}
              className={`px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ${
                canSmelt1
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Flame className="w-3 h-3" />
              Smelt (10 RawAl)
            </button>

            <button
              id="start-smelt-2-batch-btn"
              onClick={() => onStartSmelt(20)}
              disabled={!canSmelt2}
              className={`px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 ${
                canSmelt2
                  ? 'bg-purple-600 hover:bg-purple-500 text-slate-100 shadow-md cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              x2 (20)
            </button>
          </div>
        </div>

        {!canSmelt1 && (
          <p className="text-[10px] text-slate-500 italic">
            * Requires at least 10 Raw Aluminum. Tug Ring 2 Medium Asteroids into Ring 1 and mine them to acquire Raw Aluminum.
          </p>
        )}
      </div>

      {/* Active Conversion Processes */}
      {conversions.length > 0 && (
        <div className="flex flex-col gap-2 font-mono text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Active & Recent Smelting Queue ({activeProcessing.length} Processing)
          </span>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {conversions.slice(0, 4).map((proc) => {
              const pct = Math.min(100, Math.round((proc.elapsedSec / proc.durationSec) * 100));
              const isProcessing = proc.status === 'processing';

              return (
                <div key={proc.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      {isProcessing ? (
                        <Flame className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {proc.inputAmount} {proc.inputResource} $\rightarrow$ {proc.outputAmount} {proc.outputResource}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isProcessing ? 'bg-amber-950 text-amber-300 border border-amber-800/80 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                    }`}>
                      {isProcessing ? `${proc.elapsedSec.toFixed(1)}s / ${proc.durationSec.toFixed(1)}s (${pct}%)` : 'COMPLETE'}
                    </span>
                  </div>

                  {/* Timed Conversion Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-100 ${
                        isProcessing ? 'bg-gradient-to-r from-amber-500 to-cyan-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
