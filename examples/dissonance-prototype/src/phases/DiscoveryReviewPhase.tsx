import React from 'react';
import { Sparkles, ArrowRight, Shield, Award, CheckCircle, Flame } from 'lucide-react';
import { TypedBoon, Relic } from '../types';
import { buildEmberCardPool, getElementColor, getElementIcon, previewCardEffect } from '../utils';

interface DiscoveryReviewPhaseProps {
  newCardIds: string[];
  boonsAcquired: TypedBoon[];
  relicsAcquired: Relic[];
  essenceGained: number;
  isVictory: boolean;
  onDone: () => void;
}

export default function DiscoveryReviewPhase({
  newCardIds,
  boonsAcquired,
  relicsAcquired,
  essenceGained,
  isVictory,
  onDone
}: DiscoveryReviewPhaseProps) {
  const cardPool = buildEmberCardPool();
  const newCards = newCardIds
    .map(id => cardPool.find(c => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const totalNewDiscoveries = newCards.length + boonsAcquired.length + relicsAcquired.length;
  const hasNothingNew = totalNewDiscoveries === 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative" id="viewport-discovery-review-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 gap-4">
        <div>
          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">End-of-Run Summary & Catalog Integration</span>
          <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-0.5">
            <Sparkles className="text-amber-400 w-6 h-6 animate-spin-slow" />
            Codex Discovery Settlement
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review cards, boons, and relics acquired during your run as they settle into your permanent reference pool.
          </p>
        </div>

        <button 
          onClick={onDone}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 uppercase tracking-wide text-xs shrink-0 shadow-lg cursor-pointer"
          id="complete-discovery-review-btn"
        >
          <span>Complete Review & Return to Roster Hub</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ESSENCE & STATUS BANNER */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-xs" id="discovery-status-banner">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded font-bold uppercase ${isVictory ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-rose-950/80 text-rose-400 border border-rose-800'}`}>
            {isVictory ? 'Victory Sequence' : 'Sequence Collapse'}
          </span>
          <span className="text-slate-400">
            {totalNewDiscoveries} New Discovery Item{totalNewDiscoveries === 1 ? '' : 's'} Settled
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase">Committed Essence:</span>
          <span className="text-amber-400 font-bold">+{essenceGained} ESS</span>
        </div>
      </div>

      {/* HONEST EMPTY STATE */}
      {hasNothingNew ? (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3 my-4" id="discovery-empty-state">
          <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-750 flex items-center justify-center text-slate-400 mb-2">
            <Shield className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="text-lg font-display font-bold text-slate-200">
            Nothing new this time — the deck holds.
          </h3>
          <p className="text-xs text-slate-400 max-w-md font-mono leading-relaxed">
            No new cards, boons, or relics were added to your permanent catalog during this attempt. Your existing Roster and frequency alignments remain untouched.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6" id="discovery-items-container">
          {/* NEW CARDS DISCOVERED */}
          {newCards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Newly Unlocked Cards ({newCards.length}) — Settled into Roster:
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {newCards.map((card) => {
                  const preview = previewCardEffect(card);
                  return (
                    <div 
                      key={`discovery-card-${card.id}`}
                      className="p-4 rounded-xl border border-amber-400/80 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex flex-col justify-between h-36 relative overflow-hidden group"
                    >
                      <div className="absolute top-2 right-2">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/30 border border-amber-400/50 text-amber-300 font-mono text-[8px] uppercase font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> New
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase tracking-wider block">
                          {card.relationType} Tier
                        </span>
                        <h4 className="text-sm font-bold text-slate-100 mt-1 capitalize truncate">
                          {card.name}
                        </h4>
                        <span className="text-xs font-mono font-bold text-amber-300 block mt-0.5 truncate">
                          {preview.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block mt-1">
                          {card.el1} {card.el2 ? `+ ${card.el2}` : 'Single'} • {card.component}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[9px] font-mono text-emerald-400 font-bold">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Added to Roster
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BOONS DISCOVERED */}
          {boonsAcquired.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                  Harmonic Boons Integrated ({boonsAcquired.length}):
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {boonsAcquired.map((boon, idx) => (
                  <div 
                    key={`discovery-boon-${boon.id}-${idx}`}
                    className="p-4 rounded-xl border border-sky-500/60 bg-sky-950/20 shadow-[0_0_12px_rgba(14,165,233,0.15)] flex flex-col justify-between h-32"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono text-sky-400 font-bold uppercase">{boon.tier} Tier Boon</span>
                        <span className="text-[8px] font-mono text-slate-400 uppercase">
                          {boon.modifier ? `+${boon.modifier}` : 'Qualitative'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 mt-1 capitalize">{boon.id.replace(/_/g, ' ')}</h4>
                      <p className="text-[10px] font-mono text-slate-300 mt-1 line-clamp-2">
                        Target: {boon.targetType} ({boon.targetId}){boon.qualitativeEffect ? ` • ${boon.qualitativeEffect}` : ''}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-sky-400 uppercase font-bold pt-1 border-t border-slate-800">
                      Catalog Recorded
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RELICS DISCOVERED */}
          {relicsAcquired.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                  Relics Cataloged ({relicsAcquired.length}):
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {relicsAcquired.map((relic, idx) => (
                  <div 
                    key={`discovery-relic-${relic.id}-${idx}`}
                    className="p-4 rounded-xl border border-purple-500/60 bg-purple-950/20 shadow-[0_0_12px_rgba(168,85,247,0.15)] flex flex-col justify-between h-32"
                  >
                    <div>
                      <span className="text-[9px] font-mono text-purple-400 font-bold uppercase block">{relic.category} Relic</span>
                      <h4 className="text-sm font-bold text-slate-100 mt-1">{relic.name}</h4>
                      <p className="text-[10px] font-mono text-slate-300 mt-1 line-clamp-2">{relic.description}</p>
                    </div>
                    <span className="text-[9px] font-mono text-purple-400 uppercase font-bold pt-1 border-t border-slate-800">
                      Catalog Recorded
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
