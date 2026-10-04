import React from 'react';
import { MaterialType, MATERIAL_DEFS, ReconstructionEntity } from '../types';
import { Sparkles, CheckCircle2, Star } from 'lucide-react';

interface ReconstructionCatalogProps {
  entities: ReconstructionEntity[];
  storedCounts: Record<number, number>;
  onReconstruct: (entityId: string) => void;
  isCompleted: boolean;
  onDismissVictory?: () => void;
}

export const ReconstructionCatalog: React.FC<ReconstructionCatalogProps> = ({
  entities,
  storedCounts,
  onReconstruct,
  isCompleted,
}) => {
  const reconstructedCount = entities.filter((e) => e.reconstructed).length;

  return (
    <div className="w-80 bg-[#0d121f] border-l border-[#1f293d] flex flex-col h-full overflow-hidden text-xs text-slate-300 select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#1f293d] bg-gradient-to-r from-[#10172a] to-[#1a152e]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold text-slate-100 text-sm tracking-wide">
              RECONSTRUCTION
            </span>
          </div>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-semibold">
            {reconstructedCount} / {entities.length}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Synthesize pure refined materials to restore primeval cosmic constructs.
        </p>
      </div>

      {/* Entity Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {entities.map((entity) => {
          let canAfford = true;
          const reqEntries = Object.entries(entity.requirements) as [string, number][];

          return (
            <div
              key={entity.id}
              className={`p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                entity.reconstructed
                  ? 'bg-gradient-to-br from-[#121c2c] to-[#1c1836] border-emerald-500/50 shadow-md shadow-emerald-950/30'
                  : 'bg-[#111728] border-[#222d46] hover:border-slate-600'
              }`}
            >
              {/* Top Row: Name & Status */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{
                      backgroundColor: entity.color,
                      boxShadow: `0 0 10px ${entity.color}`,
                    }}
                  />
                  <span className="font-bold text-slate-100 text-[12px]">{entity.name}</span>
                </div>
                {entity.reconstructed && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Restored
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
                {entity.description}
              </p>

              {/* Material Requirements Progress */}
              <div className="space-y-1.5 bg-[#0b0f19] p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">
                  Material Requirements:
                </span>
                {reqEntries.map(([matStr, reqAmt]) => {
                  const mat = Number(matStr) as MaterialType;
                  const def = MATERIAL_DEFS[mat];
                  const stored = storedCounts[mat] || 0;
                  const satisfied = stored >= reqAmt;
                  if (!satisfied) canAfford = false;

                  const pct = Math.min(100, Math.floor((stored / reqAmt) * 100));

                  return (
                    <div key={mat} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-300 flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: def?.color }}
                          />
                          {def?.name}:
                        </span>
                        <span className={satisfied ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {stored} / {reqAmt}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: def?.color || '#38bdf8',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {!entity.reconstructed && (
                <button
                  disabled={!canAfford}
                  onClick={() => onReconstruct(entity.id)}
                  className={`w-full mt-2.5 py-1.5 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{canAfford ? 'Reconstruct Entity' : 'Accumulating Materials...'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Win Banner (if completed) */}
      {isCompleted && (
        <div className="p-3 bg-gradient-to-t from-emerald-950/80 to-[#10172a] border-t border-emerald-500/40 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-400/50 text-emerald-300 font-semibold text-[11px] mb-1">
            <Star className="w-3.5 h-3.5 text-amber-300" />
            Cosmic Equilibrium Restored
          </div>
          <p className="text-[11px] text-emerald-200/90 italic font-serif leading-tight">
            "The first things exist again. The universe remembers."
          </p>
        </div>
      )}
    </div>
  );
};
