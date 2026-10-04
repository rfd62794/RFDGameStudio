import React from 'react';
import { GameState } from '../types';
import { INITIAL_RECIPES } from '../data/recipes';
import { FlaskConical, Zap, ArrowRight, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react';

interface Props {
  gameState: GameState;
  onSetRecipe?: (moduleId: string, recipeId: string) => void;
}

export const SynthesisPanel: React.FC<Props> = ({ gameState, onSetRecipe }) => {
  const chambers = gameState.modules.filter((m) => m.type === 'processing_chamber');

  return (
    <div className="flex flex-col gap-5 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
      {/* Active Multipliers Display */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-400" />
          Active Synthesis Synergies (SS13 Multipliers)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2.5">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 flex items-start gap-2.5">
            <FlaskConical className="w-4 h-4 text-purple-400 mt-0.5" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Fracture Solvent</span>
                <span className="text-xs font-mono font-bold text-purple-400">
                  x{gameState.products.fracture_solvent?.count || 0}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                +75% Drone mining speed, +50% compound yield
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Void Stabilizer</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  x{gameState.products.void_stabilizer?.count || 0}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Stabilizes volatile gas containers and prevents leaks
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/30 flex items-start gap-2.5">
            <Wrench className="w-4 h-4 text-cyan-400 mt-0.5" />
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Hull Binder</span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  x{gameState.products.hull_binder?.count || 0}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Doubles passive station repair rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Chambers */}
      <div>
        <h3 className="text-xs font-semibold text-slate-300 mb-2">
          Processing Chambers ({chambers.length} Active)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {chambers.map((chamber) => {
            const recipe = INITIAL_RECIPES.find((r) => r.id === chamber.activeRecipeId);
            const progress = chamber.processingProgress || 0;

            return (
              <div
                key={chamber.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">
                      Chamber at ({chamber.x}, {chamber.y})
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Active: {recipe?.name || 'Idle'}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      chamber.isPowered
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                        : 'bg-red-950 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {chamber.isPowered ? 'Powered' : 'Unpowered'}
                  </span>
                </div>

                {recipe && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Synthesis Progress:</span>
                      <span className="text-purple-300 font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {onSetRecipe && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Set Recipe:</span>
                    <select
                      value={chamber.activeRecipeId || ''}
                      onChange={(e) => onSetRecipe(chamber.id, e.target.value)}
                      className="text-[11px] bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                    >
                      {INITIAL_RECIPES.filter((r) => r.unlockedByDefault).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
