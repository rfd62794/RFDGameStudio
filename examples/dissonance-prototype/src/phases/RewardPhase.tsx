import React, { useState, useEffect } from 'react';
import { Award, Sparkles, Zap, Heart, Shield } from 'lucide-react';
import { 
  buildEmberCardPool, 
  getElementColor, 
  getElementIcon, 
  generateFixedReward, 
  previewCardEffect, 
  BOON_POOL, 
  RELIC_POOL,
  RewardSlot 
} from '../utils';
import { Card, TypedBoon, Relic } from '../types';

interface RewardPhaseProps {
  unlockedCardIds: string[];
  heldBoonIds?: string[];
  heldRelicIds?: string[];
  enemyTier: 'basic' | 'advanced' | 'elite' | 'master';
  playerMaxHp?: number;
  onRewardClaimed: (choice: { kind: 'card' | 'benefit' | 'heal' | 'relic'; cardId?: string; boonId?: string; healAmount?: number; relicId?: string }) => void;
}

interface LoadedRewardSlot {
  slot: RewardSlot;
  card?: Card;
  boon?: TypedBoon;
  relic?: Relic;
}

export default function RewardPhase({
  unlockedCardIds,
  heldBoonIds = [],
  heldRelicIds = [],
  enemyTier,
  playerMaxHp = 20,
  onRewardClaimed
}: RewardPhaseProps) {
  const [options, setOptions] = useState<LoadedRewardSlot[]>([]);
  const [isResolved, setIsResolved] = useState<boolean>(false);

  useEffect(() => {
    const rawSlots = generateFixedReward(playerMaxHp, unlockedCardIds, heldBoonIds, heldRelicIds, enemyTier);
    const cardPool = buildEmberCardPool();

    const loaded: LoadedRewardSlot[] = rawSlots.map(slot => {
      if (slot.kind === 'card') {
        const card = cardPool.find(c => c.id === slot.cardId);
        return { slot, card };
      } else if (slot.kind === 'benefit') {
        const boon = BOON_POOL.find(b => b.id === slot.boonId);
        return { slot, boon };
      } else if (slot.kind === 'relic') {
        const relic = RELIC_POOL.find(r => r.id === slot.relicId);
        return { slot, relic };
      } else {
        return { slot };
      }
    });

    setOptions(loaded);
  }, [unlockedCardIds, heldBoonIds, heldRelicIds, enemyTier, playerMaxHp]);

  const handleClaim = (choice: { kind: 'card' | 'benefit' | 'heal' | 'relic'; cardId?: string; boonId?: string; healAmount?: number; relicId?: string }) => {
    if (isResolved) return;
    setIsResolved(true);
    onRewardClaimed(choice);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative" id="viewport-reward-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none rounded-2xl" />
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 text-center sm:text-left">
        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">Frequency Calibration Restored</span>
        <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center justify-center sm:justify-start gap-2 mt-1">
          <Award className="text-emerald-400 w-6 h-6" />
          Harmonic Reward Selection
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          You successfully stabilized the {enemyTier} threat. Select exactly one reward below to adapt your core permanently.
        </p>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4" id="mixed-reward-grid">
        {options.map((opt, idx) => {
          if (opt.slot.kind === 'card' && opt.card) {
            const card = opt.card;
            const effectPreview = previewCardEffect(card);

            return (
              <div 
                key={`reward-slot-${idx}-${card.id}`}
                id={`reward-slot-card-${card.id}`}
                onClick={() => !isResolved && handleClaim({ kind: 'card', cardId: card.id })}
                className={`group relative p-5 bg-slate-950/40 border border-slate-800 rounded-2xl transition-all duration-300 flex flex-col justify-between h-72 text-left ${
                  isResolved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-950/10'
                }`}
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 bg-slate-950 p-1.5 rounded border border-slate-850 w-fit">
                      <span className={`p-1 rounded text-xs ${getElementColor(card.el1)}`}>
                        {getElementIcon(card.el1)}
                      </span>
                      {card.el2 && (
                        <span className={`p-1 rounded text-xs ${getElementColor(card.el2)}`}>
                          {getElementIcon(card.el2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                      Card Slot
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 capitalize mt-4 group-hover:text-emerald-400 transition-colors">
                    {card.name}
                  </h3>
                  
                  <span className="text-[11px] font-mono font-bold text-amber-400 mt-1 block">
                    {effectPreview.label}
                  </span>

                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold mt-1 block tracking-wider">
                    {card.component} Action ({card.relationType})
                  </span>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Unlocks this frequency combination and sets Discovery status permanently.
                  </p>
                </div>

                <div className="border-t border-slate-850/60 pt-3 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider font-bold">Card Reward</span>
                  <button 
                    disabled={isResolved}
                    className="px-3 py-1.5 bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 font-mono text-[10px] font-bold rounded-lg uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Claim Card
                  </button>
                </div>
              </div>
            );
          } else if (opt.slot.kind === 'benefit' && opt.boon) {
            const boon = opt.boon;
            const title = boon.effectShape === 'flat'
              ? `+${boon.modifier} ${boon.targetId.replace('_', ' ').toUpperCase()} Power`
              : 'Rule Calibration';
            
            const description = boon.qualitativeEffect
              ? boon.qualitativeEffect
              : `Permanently boosts all ${boon.targetType} (${boon.targetId.toUpperCase()}) combat actions by +${boon.modifier} for this run.`;

            return (
              <div 
                key={`reward-slot-${idx}-${boon.id}`}
                id={`reward-slot-benefit-${boon.id}`}
                onClick={() => !isResolved && handleClaim({ kind: 'benefit', boonId: boon.id })}
                className={`group relative p-5 bg-slate-950/40 border border-slate-800 rounded-2xl transition-all duration-300 flex flex-col justify-between h-72 text-left ${
                  isResolved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-amber-500/50 hover:bg-amber-950/10'
                }`}
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="bg-amber-950/50 text-amber-400 p-2 rounded-xl border border-amber-800/50 w-fit">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-amber-950/80 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold">
                      Benefit Slot ({boon.tier})
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 capitalize mt-4 group-hover:text-amber-400 transition-colors">
                    {title}
                  </h3>
                  
                  <span className="text-[10px] font-mono text-amber-300 uppercase font-bold mt-1 block tracking-wider">
                    {boon.tier} Tier Benefit • Grant (0 ESS)
                  </span>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-mono">
                    {description}
                  </p>
                </div>

                <div className="border-t border-slate-850/60 pt-3 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">Benefit Reward</span>
                  <button 
                    disabled={isResolved}
                    className="px-3 py-1.5 bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 font-mono text-[10px] font-bold rounded-lg uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Acquire Benefit
                  </button>
                </div>
              </div>
            );
          } else if (opt.slot.kind === 'heal') {
            const amount = opt.slot.amount;

            return (
              <div 
                key={`reward-slot-${idx}-heal`}
                id={`reward-slot-heal-${idx}`}
                onClick={() => !isResolved && handleClaim({ kind: 'heal', healAmount: amount })}
                className={`group relative p-5 bg-slate-950/40 border border-slate-800 rounded-2xl transition-all duration-300 flex flex-col justify-between h-72 text-left ${
                  isResolved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-950/10'
                }`}
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="w-4 h-4 text-emerald-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="bg-emerald-950/50 text-emerald-400 p-2 rounded-xl border border-emerald-800/50 w-fit">
                      <Heart className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                      Vitality Heal
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 capitalize mt-4 group-hover:text-emerald-400 transition-colors">
                    Core Restoration (+{amount} HP)
                  </h3>
                  
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold mt-1 block tracking-wider">
                    Instant Recovery • +{amount} HP
                  </span>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-mono">
                    Instantly repair core vital integrity, restoring up to +{amount} HP to prepare for impending encounters.
                  </p>
                </div>

                <div className="border-t border-slate-850/60 pt-3 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">Heal Reward</span>
                  <button 
                    disabled={isResolved}
                    className="px-3 py-1.5 bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 font-mono text-[10px] font-bold rounded-lg uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Claim Heal
                  </button>
                </div>
              </div>
            );
          } else if (opt.slot.kind === 'relic' && opt.relic) {
            const relic = opt.relic;

            return (
              <div 
                key={`reward-slot-${idx}-${relic.id}`}
                id={`reward-slot-relic-${relic.id}`}
                onClick={() => !isResolved && handleClaim({ kind: 'relic', relicId: relic.id })}
                className={`group relative p-5 bg-purple-950/20 border border-purple-500/40 rounded-2xl transition-all duration-300 flex flex-col justify-between h-72 text-left ${
                  isResolved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-400 hover:bg-purple-950/30'
                }`}
              >
                <div className="absolute top-3 right-3 opacity-100">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="bg-purple-900/50 text-purple-300 p-2 rounded-xl border border-purple-700/50 w-fit">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded font-bold">
                      ✨ Rare Relic Slot
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 capitalize mt-4 group-hover:text-purple-300 transition-colors">
                    {relic.name}
                  </h3>
                  
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold mt-1 block tracking-wider">
                    Ancient Relic Artifact
                  </span>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed font-mono">
                    {relic.description}
                  </p>
                </div>

                <div className="border-t border-purple-800/40 pt-3 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold">Relic Upgrade</span>
                  <button 
                    disabled={isResolved}
                    className="px-3 py-1.5 bg-purple-900/80 group-hover:bg-purple-400 group-hover:text-slate-950 text-purple-200 font-mono text-[10px] font-bold rounded-lg uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Acquire Relic
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
