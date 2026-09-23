import React from 'react';
import { Bomb, Sparkles } from 'lucide-react';
import { HideoutState } from '../../types';

interface FabricatorPanelProps {
  hideout: HideoutState;
  now: number;
  onStartCraft: (blueprintId: string) => void;
  onClaimCraft: (jobId: string) => void;
}

export const FabricatorPanel: React.FC<FabricatorPanelProps> = ({
  hideout,
  now,
  onStartCraft,
  onClaimCraft,
}) => {
  return (
    <section className="lg:col-span-6 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col justify-between font-mono">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ef4444]/20 flex items-center justify-center">
              <Bomb className="w-4 h-4 text-[#f87171]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">MUNITIONS FABRICATOR</h2>
              <span className="text-[10px] text-[#64748b]">POST /hideout/craft</span>
            </div>
          </div>
          <span className="text-[10px] text-[#94a3b8]">DISCRETE MATERIAL ASSEMBLY</span>
        </div>

        {/* Fabricable Schematics List */}
        <div className="space-y-3">
          {hideout.blueprints
            .filter((b) => b.unlocked)
            .map((bp) => {
              const costs = Object.entries(bp.requirements_to_craft);
              const canAfford = costs.every(([mat, cost]) => ((hideout.resources as any)[mat] || 0) >= cost);

              return (
                <div key={bp.blueprint_id} className="p-3.5 bg-[#141d2b] border border-[#1e293b] rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                        {bp.name}
                      </span>
                      <p className="text-[10px] text-[#94a3b8] mt-0.5">{bp.description}</p>
                    </div>
                    <button
                      onClick={() => onStartCraft(bp.blueprint_id)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer ${
                        canAfford
                          ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow'
                          : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                      }`}
                    >
                      CRAFT ({bp.craftDurationSeconds}s)
                    </button>
                  </div>

                  {/* Material Cost Tags */}
                  <div className="flex items-center gap-3 text-[10px] pt-1">
                    <span className="text-[#64748b]">COST:</span>
                    {costs.map(([mat, cost]) => {
                      const have = (hideout.resources as any)[mat] || 0;
                      const hasEnough = have >= cost;
                      return (
                        <span
                          key={mat}
                          className={`px-1.5 py-0.5 rounded border ${
                            hasEnough
                              ? 'bg-[#090d13] text-[#34d399] border-[#10b981]/30'
                              : 'bg-[#090d13] text-[#ef4444] border-[#ef4444]/30'
                          }`}
                        >
                          {cost} {mat} (have {have})
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Active Crafting Queue */}
        <div className="bg-[#0b0e14] border border-[#1e293b] rounded-xl p-3.5 space-y-2">
          <span className="text-[10px] text-[#64748b] block font-bold">ACTIVE ASSEMBLY JOBS</span>
          {hideout.craftingQueue.length === 0 ? (
            <p className="text-xs text-[#64748b] text-center py-2">No assembly jobs in progress.</p>
          ) : (
            hideout.craftingQueue.map((job) => {
              const isDone = now >= job.finishAt;
              const progress = Math.min(
                100,
                Math.max(0, ((now - job.startedAt) / (job.finishAt - job.startedAt)) * 100)
              );
              const remaining = Math.max(0, Math.ceil((job.finishAt - now) / 1000));

              return (
                <div key={job.id} className="p-2.5 bg-[#141d2b] rounded-lg border border-[#1e293b] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold">{job.itemName}</span>
                    <span className={isDone ? 'text-[#34d399] font-bold' : 'text-[#38bdf8]'}>
                      {isDone ? 'READY' : `${remaining}s`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#0b0e14] rounded-full overflow-hidden border border-[#1e293b]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isDone ? 'bg-[#10b981]' : 'bg-[#0284c7]'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {isDone && (
                    <button
                      onClick={() => onClaimCraft(job.id)}
                      className="w-full py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded shadow transition cursor-pointer"
                    >
                      CLAIM TO STASH
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
