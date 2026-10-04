import React from 'react';
import { MaterialType, MATERIAL_DEFS, ReconstructionTarget } from '../types';
import { Sparkles, Lock } from 'lucide-react';

interface ReconstructionCatalogProps {
  targets: ReconstructionTarget[];
  currentTier: number;
  storedCounts: Record<number, number>;
  onAssemble: (id: string) => void;
}

export const ReconstructionCatalog: React.FC<ReconstructionCatalogProps> = ({
  targets,
  currentTier,
  storedCounts,
  onAssemble,
}) => {
  const isTier4 = currentTier >= 4;

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Reconstruction</span>
        </div>
        <span className="text-[9px] font-mono text-slate-500 uppercase">
          {isTier4 ? 'ACTIVE' : `TIER 4 REQUIRED`}
        </span>
      </div>

      {!isTier4 && (
        <div className="flex items-center gap-2 p-2 rounded bg-[#13182b] border border-slate-700/60 text-slate-400 text-[10px] font-mono">
          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            Complete Tier 3 goal to unlock exotic Reconstruction Assembly patterns.
          </span>
        </div>
      )}

      <div className={`space-y-2 ${!isTier4 ? 'opacity-50 pointer-events-none' : ''}`}>
        {targets.map((t) => {
          const canAssemble =
            isTier4 &&
            !t.assembled &&
            Object.entries(t.requirements).every(([matId, amount]) => {
              return (storedCounts[Number(matId)] || 0) >= amount;
            });

          return (
            <div
              key={t.id}
              className={`p-2.5 rounded border font-mono text-[10px] transition-colors relative overflow-hidden group ${
                t.assembled
                  ? 'bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border-emerald-500/60 shadow-inner'
                  : 'bg-[#121828] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start gap-1">
                <span
                  className={`font-bold text-[11px] ${t.assembled ? 'text-emerald-300' : 'text-slate-200'}`}
                >
                  {t.name}
                </span>
                {t.assembled && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/50">
                    ASSEMBLED
                  </span>
                )}
              </div>

              <div className="text-slate-500 mt-1 leading-snug">{t.description}</div>

              <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(t.requirements).map(([matId, amount]) => {
                  const mId = Number(matId) as MaterialType;
                  const def = MATERIAL_DEFS[mId];
                  const stored = storedCounts[mId] || 0;
                  const sufficient = stored >= amount;

                  return (
                    <div
                      key={mId}
                      className="flex items-center gap-1 text-[9px]"
                      title={`${def.name}: ${stored} stored / ${amount} required`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: def?.color || '#fff' }}
                      />
                      <span className="text-slate-400">{def?.name || `Mat ${mId}`}:</span>
                      <span className={`font-bold ${sufficient ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stored}
                      </span>
                      <span className="text-slate-600">/ {amount}</span>
                    </div>
                  );
                })}
              </div>

              {!t.assembled && (
                <button
                  onClick={() => onAssemble(t.id)}
                  disabled={!canAssemble}
                  className={`mt-2.5 w-full py-1 rounded font-bold uppercase tracking-wider text-[9px] transition-colors ${
                    canAssemble
                      ? 'bg-cyan-700 hover:bg-cyan-600 text-white cursor-pointer'
                      : 'bg-slate-800/80 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canAssemble ? 'Assemble Pattern' : 'Insufficient Stock'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
