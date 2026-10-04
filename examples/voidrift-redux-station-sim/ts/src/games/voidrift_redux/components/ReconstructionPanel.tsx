import React from 'react';
import { GameState } from '../types';
import { Sparkles, Flower2, RadioTower, Waves, Milestone, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  gameState: GameState;
}

export const ReconstructionPanel: React.FC<Props> = ({ gameState }) => {
  const tier1Items = gameState.reconstructionItems.filter((i) => i.tier === 1);

  const getIcon = (type: string, color: string) => {
    switch (type) {
      case 'Flower2': return <Flower2 className="w-5 h-5" style={{ color }} />;
      case 'RadioTower': return <RadioTower className="w-5 h-5" style={{ color }} />;
      case 'Waves': return <Waves className="w-5 h-5" style={{ color }} />;
      case 'Milestone': return <Milestone className="w-5 h-5" style={{ color }} />;
      default: return <Sparkles className="w-5 h-5" style={{ color }} />;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            The Cosmic Catalog (Tier 1 Reconstruction)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-reconstructs entities once required synthesis products and dust are accumulated.
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400">
          {tier1Items.filter((i) => i.isCompleted).length} / {tier1Items.length} Restored
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tier1Items.map((item) => {
          const hasDust = gameState.dust >= item.dustCost;
          let hasInputs = true;

          const reqs = item.requiredInputs.map((req) => {
            const prod = gameState.products[req.inputId];
            const count = prod?.count || 0;
            if (count < req.amount) hasInputs = false;
            return {
              name: prod?.name || req.inputId,
              have: count,
              need: req.amount,
            };
          });

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                item.isCompleted
                  ? 'bg-slate-950/90 border-emerald-500/50 shadow-sm'
                  : item.isReconstructing
                  ? 'bg-slate-950/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center border"
                      style={{
                        backgroundColor: `${item.visualDetails?.color}15`,
                        borderColor: `${item.visualDetails?.color}40`,
                      }}
                    >
                      {getIcon(item.iconType, item.visualDetails?.color || '#38bdf8')}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{item.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.type} • Tier {item.tier}
                      </span>
                    </div>
                  </div>

                  {item.isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      RESTORED
                    </span>
                  ) : item.isReconstructing ? (
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded animate-pulse">
                      FORGING...
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-slate-400 leading-snug">{item.description}</p>
              </div>

              {item.isCompleted ? (
                <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-slate-800/80">
                  ★ Restored to Cosmos
                </div>
              ) : item.isReconstructing ? (
                <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-[10px] font-mono text-cyan-300">
                    <span>Reconstruction:</span>
                    <span>{Math.round(item.progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dust Cost:</span>
                    <span className={hasDust ? 'text-slate-200' : 'text-red-400'}>
                      {Math.round(gameState.dust)} / {item.dustCost}
                    </span>
                  </div>
                  {reqs.map((r) => (
                    <div key={r.name} className="flex justify-between">
                      <span className="text-slate-400">{r.name}:</span>
                      <span className={r.have >= r.need ? 'text-slate-200' : 'text-red-400'}>
                        {r.have} / {r.need}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
