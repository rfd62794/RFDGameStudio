import React from 'react';
import { Radio, RefreshCw, PackageCheck } from 'lucide-react';
import { HideoutState } from '../../types';
import { ITEM_REGISTRY } from '../../backend/item-registry';

interface DeconstructorPanelProps {
  hideout: HideoutState;
  now: number;
  selectedBrainstormItemId: string | null;
  setSelectedBrainstormItemId: (id: string | null) => void;
  onDeconstructItem: (itemId: string) => void;
  onClaimDeconstruction: (jobId: string) => void;
}

export const DeconstructorPanel: React.FC<DeconstructorPanelProps> = ({
  hideout,
  now,
  selectedBrainstormItemId,
  setSelectedBrainstormItemId,
  onDeconstructItem,
  onClaimDeconstruction,
}) => {
  return (
    <section className="lg:col-span-5 flex flex-col gap-6">
      {/* INVENTORY OF EXTRACTED TAGGED ITEMS */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#38bdf8]/20 flex items-center justify-center">
              <Radio className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm text-white">
                RECOVERED SALVAGE INVENTORY
              </h2>
              <span className="text-[10px] font-mono text-[#64748b]">
                EXTRACTED JUNK WITH EMBEDDED TAGS
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#94a3b8] bg-[#1e293b] px-2 py-0.5 rounded">
            {hideout.inventory.reduce((acc, i) => acc + i.count, 0)} Items
          </span>
        </div>

        {/* Items List */}
        <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1 flex-1">
          {hideout.inventory.length === 0 ? (
            <div className="text-center py-10 text-xs font-mono text-[#64748b] bg-[#141d2b]/40 rounded-xl border border-dashed border-[#1e293b]">
              <p>No tagged salvage in stash.</p>
              <p className="text-[10px] text-[#475569] mt-1">
                Deploy to Sector 50x50 and extract high-value containers!
              </p>
            </div>
          ) : (
            hideout.inventory.map((entry) => {
              const def = ITEM_REGISTRY[entry.item_id];
              if (!def) return null;
              const isSelected = selectedBrainstormItemId === entry.item_id;

              return (
                <div
                  key={entry.item_id}
                  className={`p-3 rounded-xl border transition flex flex-col gap-2 font-mono ${
                    isSelected
                      ? 'bg-[#1e293b] border-[#38bdf8]'
                      : 'bg-[#141d2b] border-[#1e293b] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{def.name}</span>
                        <span className="text-xs font-bold text-[#fbbf24]">x{entry.count}</span>
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-0.5">{def.description}</p>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        def.rarity === 'Rare'
                          ? 'bg-[#9333ea]/20 text-[#c084fc] border border-[#9333ea]/40'
                          : def.rarity === 'Uncommon'
                          ? 'bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40'
                          : 'bg-[#334155]/40 text-[#94a3b8]'
                      }`}
                    >
                      {def.rarity}
                    </span>
                  </div>

                  {/* Research Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[9px] text-[#64748b]">TAGS:</span>
                    {Object.entries(def.research_tags).map(([tag, val]) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-[#090d13] text-[#38bdf8] text-[10px] font-bold border border-[#1e293b]"
                      >
                        [{tag}: {val}]
                      </span>
                    ))}
                  </div>

                  {/* Deconstruction Yield Preview & Actions */}
                  <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[10px]">
                    <span className="text-[#94a3b8]">
                      YIELDS:{' '}
                      {Object.entries(def.deconstruct_yield)
                        .map(([r, a]) => `+${a} ${r}`)
                        .join(', ')}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBrainstormItemId(entry.item_id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#38bdf8] text-[#090d13]'
                            : 'bg-[#1e293b] text-[#38bdf8] hover:bg-[#334155]'
                        }`}
                      >
                        SELECT FOR BRAINSTORM
                      </button>
                      <button
                        onClick={() => onDeconstructItem(entry.item_id)}
                        className="px-2 py-1 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Feed to SS13 Deconstructor for elemental resources"
                      >
                        <RefreshCw className="w-3 h-3" />
                        DECONSTRUCT (1x)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SS13 IDLE DECONSTRUCTION QUEUE */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl font-mono">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ea580c]/20 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[#fb923c]" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white">SS13 IDLE DECONSTRUCTOR</h3>
              <span className="text-[10px] text-[#64748b]">POST /hideout/deconstruct</span>
            </div>
          </div>
          <span className="text-[10px] text-[#34d399] font-bold">ONLINE</span>
        </div>

        {hideout.deconstructionQueue.length === 0 ? (
          <div className="text-center py-5 text-xs text-[#64748b] bg-[#141d2b]/30 rounded-xl border border-dashed border-[#1e293b]">
            <p>Deconstruction hopper empty.</p>
            <p className="text-[10px] text-[#475569] mt-0.5">
              Select an extracted item above to decompose into Silicon, Copper &amp; Plasma.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {hideout.deconstructionQueue.map((job) => {
              const isDone = now >= job.finishAt;
              const progress = Math.min(
                100,
                Math.max(0, ((now - job.startedAt) / (job.finishAt - job.startedAt)) * 100)
              );
              const remaining = Math.max(0, Math.ceil((job.finishAt - now) / 1000));

              return (
                <div key={job.id} className="p-3 bg-[#141d2b] border border-[#1e293b] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold">{job.itemName} (x{job.quantity})</span>
                    <span className={isDone ? 'text-[#34d399] font-bold' : 'text-[#fb923c]'}>
                      {isDone ? 'COMPLETE' : `${remaining}s remaining`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-[#0b0e14] rounded-full overflow-hidden border border-[#1e293b]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isDone ? 'bg-[#10b981]' : 'bg-[#ea580c]'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-[10px] text-[#94a3b8]">
                    <div className="flex items-center justify-between">
                      <span>
                        Materials: {Object.entries(job.yields).map(([r, a]) => `+${a} ${r}`).join(', ')}
                      </span>

                      {isDone && (
                        <button
                          onClick={() => onClaimDeconstruction(job.id)}
                          className="px-2.5 py-1 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded shadow transition flex items-center gap-1 cursor-pointer"
                        >
                          <PackageCheck className="w-3 h-3" />
                          CLAIM DATA &amp; MATERIALS
                        </button>
                      )}
                    </div>

                    {job.tagsYielded && Object.keys(job.tagsYielded).length > 0 && (
                      <div className="text-[#c084fc] flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#94a3b8]">Tags Stripped:</span>
                        {Object.entries(job.tagsYielded).map(([t, val]) => (
                          <span key={t} className="bg-[#9333ea]/20 border border-[#9333ea]/40 px-1.5 py-0.5 rounded font-mono text-[9px]">
                            +{val} [{t}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
