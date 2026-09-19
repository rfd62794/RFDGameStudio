import React from 'react';
import { FlaskConical, Database, Unlock, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { HideoutState, ResearchBlueprint } from '../../types';
import { ITEM_REGISTRY } from '../../backend/item-registry';

interface ResearchBenchPanelProps {
  hideout: HideoutState;
  selectedBlueprintId: string | null;
  setSelectedBlueprintId: (id: string) => void;
  selectedBlueprint: ResearchBlueprint | undefined;
  selectedBrainstormItemId: string | null;
  setSelectedBrainstormItemId: (id: string) => void;
  researchFeedback: string | null;
  onInvestTag: (blueprintId: string, tag: string, amount: number) => void;
  onInvestAllNeededTags: (blueprintId: string) => void;
  onBrainstormSubmit: () => void;
}

export const ResearchBenchPanel: React.FC<ResearchBenchPanelProps> = ({
  hideout,
  selectedBlueprintId,
  setSelectedBlueprintId,
  selectedBlueprint,
  selectedBrainstormItemId,
  setSelectedBrainstormItemId,
  researchFeedback,
  onInvestTag,
  onInvestAllNeededTags,
  onBrainstormSubmit,
}) => {
  return (
    <section className="lg:col-span-7 flex flex-col gap-6">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#9333ea]/20 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-[#c084fc]" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm text-white">
                ABIOTIC FACTOR RESEARCH BENCH
              </h2>
              <span className="text-[10px] font-mono text-[#64748b]">
                ANOMALOUS TAG BRAINSTORMING &bull; SCHEMATIC SYNTHESIS
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#c084fc] bg-[#9333ea]/10 border border-[#9333ea]/30 px-2 py-0.5 rounded">
            {hideout.blueprints.filter((b) => b.unlocked).length} / {hideout.blueprints.length} SCHEMATICS
          </span>
        </div>

        <p className="text-xs text-[#94a3b8] font-mono mb-4 leading-relaxed">
          Analyze and sacrifice recovered salvage at the workbench to extract embedded data tags.
          Fulfilling all required tags synthesizes permanent tactical equipment blueprints.
        </p>

        {/* ADR 002 Component Data Tags Bank */}
        <div className="bg-[#141d2b] border border-[#334155]/60 rounded-xl p-3.5 mb-4 font-mono">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#38bdf8]" />
              DATA TAGS BANK (DECONSTRUCTED SALVAGE ARCHIVE)
            </span>
            <span className="text-[10px] text-[#94a3b8]">
              STRIPPED VIA DECONSTRUCTOR QUEUE
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(hideout.componentTags || {}).map(([tag, count]) => {
              const countNum = Number(count) || 0;
              return (
                <div key={tag} className="bg-[#0b0e14] border border-[#1e293b] rounded-lg p-2 flex flex-col items-center">
                  <span className="text-[9px] text-[#94a3b8] uppercase tracking-wider">[{tag}]</span>
                  <span className={`text-sm font-bold ${countNum > 0 ? 'text-[#c084fc]' : 'text-[#64748b]'}`}>
                    {countNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blueprint Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 font-mono">
          {hideout.blueprints.map((bp) => {
            const isSelected = selectedBlueprintId === bp.blueprint_id;
            let totalRequired = 0;
            let totalContributed = 0;
            for (const [tag, reqVal] of Object.entries(bp.requirements_to_unlock)) {
              const req = Number(reqVal);
              totalRequired += req;
              totalContributed += Math.min(req, Number(bp.contributed_tags[tag] || 0));
            }
            const percent = totalRequired > 0 ? Math.round((totalContributed / totalRequired) * 100) : 100;

            return (
              <div
                key={bp.blueprint_id}
                onClick={() => setSelectedBlueprintId(bp.blueprint_id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1e293b] border-[#c084fc] shadow-lg shadow-[#9333ea]/10'
                    : 'bg-[#141d2b] border-[#1e293b] hover:border-[#334155]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {bp.unlocked ? (
                        <Unlock className="w-3.5 h-3.5 text-[#34d399]" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-[#94a3b8]" />
                      )}
                      {bp.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        bp.unlocked
                          ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30'
                          : 'bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/30'
                      }`}
                    >
                      {bp.unlocked ? 'UNLOCKED' : `${percent}%`}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#94a3b8] leading-tight">{bp.description}</p>
                </div>

                {/* Required Tags Matrix */}
                <div className="mt-3 pt-2 border-t border-[#1e293b] space-y-1.5">
                  <span className="text-[9px] text-[#64748b] block">TAGS REQUIRED:</span>
                  <div className="space-y-1">
                    {Object.entries(bp.requirements_to_unlock).map(([tag, req]) => {
                      const current = bp.contributed_tags[tag] || 0;
                      const isMet = current >= req;
                      const bankCount = hideout.componentTags[tag] || 0;

                      return (
                        <div key={tag} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className={isMet ? 'text-[#34d399]' : 'text-[#cbd5e1]'}>
                              [{tag}]
                            </span>
                            <span className="text-[9px] text-[#64748b]">
                              (Bank: {bankCount})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={isMet ? 'text-[#34d399] font-bold' : 'text-[#f59e0b]'}>
                              {current} / {req}
                            </span>
                            {!bp.unlocked && !isMet && bankCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onInvestTag(bp.blueprint_id, tag, 1);
                                }}
                                className="px-1.5 py-0.5 bg-[#9333ea] hover:bg-[#7e22ce] text-white rounded text-[9px] font-bold transition shadow cursor-pointer"
                                title={`Inject 1 [${tag}] tag from bank`}
                              >
                                +1 TAG
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BRAINSTORM FEEDING INTERACTION BENCH */}
        {selectedBlueprint && (
          <div className="bg-[#141d2b] border border-[#1e293b] rounded-xl p-4 font-mono space-y-3 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c084fc]" />
                BRAINSTORM WORKBENCH: TARGET [{selectedBlueprint.name}]
              </span>
              <span className="text-[10px] text-[#94a3b8]">POST /research/brainstorm</span>
            </div>

            {selectedBlueprint.unlocked ? (
              <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg text-xs text-[#34d399] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Schematic fully discovered! Proceed to Node 2 (Munitions Fabricator) to manufacture this equipment.
              </div>
            ) : (
              <div className="space-y-3">
                {/* ADR 002 Quick Batch Inject from Deconstructor Data Bank */}
                <div className="flex items-center justify-between p-3 bg-[#0b0e14] border border-[#1e293b] rounded-lg">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#38bdf8]" />
                      Direct Tag Synthesis
                    </div>
                    <div className="text-[10px] text-[#94a3b8]">
                      Allocate all matching data tags from Deconstructed Salvage Bank into this schematic.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInvestAllNeededTags(selectedBlueprint.blueprint_id)}
                    className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    INJECT ALL MATCHING TAGS
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#94a3b8] block mb-1">
                      SELECT DONOR ITEM FROM INVENTORY:
                    </label>
                    <select
                      value={selectedBrainstormItemId || ''}
                      onChange={(e) => setSelectedBrainstormItemId(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c084fc]"
                    >
                      {hideout.inventory.map((i) => {
                        const def = ITEM_REGISTRY[i.item_id];
                        return (
                          <option key={i.item_id} value={i.item_id}>
                            {def?.name || i.item_id} (Available: {i.count})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    onClick={onBrainstormSubmit}
                    disabled={hideout.inventory.length === 0}
                    className={`sm:self-end px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      hideout.inventory.length > 0
                        ? 'bg-[#9333ea] hover:bg-[#7e22ce] text-white'
                        : 'bg-[#1e293b] text-[#64748b] cursor-not-allowed'
                    }`}
                  >
                    <FlaskConical className="w-4 h-4" />
                    BRAINSTORM (-1 ITEM)
                  </button>
                </div>

                {/* Donor Item Tag Preview */}
                {selectedBrainstormItemId && ITEM_REGISTRY[selectedBrainstormItemId] && (
                  <div className="text-[10px] text-[#94a3b8] bg-[#0b0e14] p-2.5 rounded border border-[#1e293b] flex items-center justify-between">
                    <span>
                      Contributes:{' '}
                      {Object.entries(ITEM_REGISTRY[selectedBrainstormItemId].research_tags)
                        .map(([t, v]) => `+${v} [${t}]`)
                        .join(', ')}
                    </span>
                    <span className="text-[#38bdf8]">Consumed upon analysis</span>
                  </div>
                )}

                {/* Feedback banner */}
                {researchFeedback && (
                  <div className="p-2.5 bg-[#0284c7]/20 border border-[#0284c7]/40 rounded text-xs text-[#38bdf8] animate-pulse">
                    {researchFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
