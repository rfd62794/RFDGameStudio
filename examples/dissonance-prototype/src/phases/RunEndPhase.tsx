import React, { useState } from 'react';
import { CheckCircle, ArrowRight, Skull, RotateCcw, ArrowUpRight } from 'lucide-react';
import { RunState } from '../types';
import { buildEmberCardPool, getElementColor, getElementIcon } from '../utils';

interface RunEndPhaseProps {
  runState: RunState;
  bossRewards: string[] | null;
  hasClaimedReward: boolean;
  onCommitResults: (claimedRewards: string[]) => void;
  totalPersistentEssence: number;
}

export default function RunEndPhase({
  runState,
  bossRewards,
  hasClaimedReward,
  onCommitResults,
  totalPersistentEssence
}: RunEndPhaseProps) {
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const handleConfirmVictory = () => {
    const rewards = selectedRewardId ? [selectedRewardId] : [];
    onCommitResults(rewards);
  };

  const handleConfirmDefeat = () => {
    onCommitResults([]);
  };

  const isVictory = runState.status === 'victory';

  return (
    <div className="w-full flex flex-col gap-6" id="viewport-run-end">
      {isVictory ? (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-100 tracking-tight">
            Stability Re-established!
          </h2>
          <p className="text-sm text-emerald-300/80 max-w-md mx-auto mt-2 leading-relaxed font-mono text-xs">
            Resonance successfully achieved. The Fracture has been held and balanced back to unity.
          </p>

          <div className="mt-8 p-4 bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full text-left font-mono text-xs flex flex-col gap-2">
            <div className="text-slate-400 uppercase font-bold border-b border-slate-800 pb-1 flex justify-between">
              <span>Sequence Summary</span>
              <span className="text-emerald-400">SUCCESS</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Node reached:</span>
              <span>{runState.currentNodeId} / {runState.nodes.length} (Sequence Completed)</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Integrity (HP):</span>
              <span className="text-emerald-400 font-bold">{runState.playerHp} / {runState.playerMaxHp}</span>
            </div>
            <div className="flex justify-between border-t border-slate-900 pt-1.5 text-slate-300 font-bold">
              <span>Committed Banked Essence:</span>
              <span className="text-emerald-400">+{runState.essence}</span>
            </div>
          </div>

          {/* BOSS REWARDS SECTION */}
          {!hasClaimedReward && bossRewards && bossRewards.length > 0 && (
            <div className="p-5 bg-rose-950/10 border border-rose-500/20 rounded-xl flex flex-col gap-3 mt-6 max-w-md w-full text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold">🌟 Resonance Upgrade Reward</span>
                <span className="text-[9px] font-mono text-slate-400">
                  Resonance Upgrade
                </span>
              </div>
              <h3 className="text-xs text-slate-200 font-mono">
                Select one upgraded card to add permanently to your collection:
              </h3>
              <div className="grid grid-cols-1 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {bossRewards.map(cardId => {
                  const cardPool = buildEmberCardPool();
                  const card = cardPool.find(c => c.id === cardId);
                  if (!card) return null;
                  const isSelected = selectedRewardId === cardId;
                  return (
                    <button
                      key={cardId}
                      onClick={() => setSelectedRewardId(isSelected ? null : cardId)}
                      className={`p-3 text-left transition-all rounded-xl border flex flex-col gap-1.5 shadow-md ${
                        isSelected 
                          ? 'bg-rose-950/40 border-rose-500 text-rose-200' 
                          : 'bg-slate-950 border-slate-800 hover:bg-rose-950/20 hover:border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-200 truncate capitalize leading-tight">
                          {card.name}
                        </span>
                        <ArrowUpRight className="w-3 h-3 text-slate-500" />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`px-1 py-0.5 rounded text-[8px] font-mono border ${getElementColor(card.el1)}`}>
                          {card.el1.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">+</span>
                        <span className={`px-1 py-0.5 rounded text-[8px] font-mono border ${card.el2 ? getElementColor(card.el2) : ''}`}>
                          {card.el2?.toUpperCase()}
                        </span>
                        <span className="text-[8px] font-mono text-indigo-400 uppercase font-bold ml-1">
                          {card.component}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button 
            onClick={handleConfirmVictory}
            className="mt-8 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all font-display uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20"
            id="restart-run-victory-btn"
          >
            {selectedRewardId ? 'Claim Upgrade & Complete Sequence' : 'Decline Upgrade & Complete Sequence'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-rose-950 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-rose-950/50 border border-rose-500/40 flex items-center justify-center mb-6">
            <Skull className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-100 tracking-tight">
            Critical Dissonance Collapse
          </h2>
          <p className="text-sm text-rose-400/80 max-w-md mx-auto mt-2 leading-relaxed font-mono text-xs">
            Your molecular integrity reached absolute 0. The unspent Essence held has scattered back into the void.
          </p>

          <div className="mt-8 p-4 bg-slate-950 border border-slate-850 rounded-xl max-w-md w-full text-left font-mono text-xs flex flex-col gap-2">
            <div className="text-slate-400 uppercase font-bold border-b border-slate-800 pb-1 flex justify-between">
              <span>Sequence Summary</span>
              <span className="text-rose-500">COLLAPSED</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Defeated on Node:</span>
              <span>{runState.currentNodeId} / {runState.nodes.length}</span>
            </div>
            <div className="flex justify-between text-rose-400/80">
              <span>Unspent Run Essence lost:</span>
              <span>{runState.essence} Lost (Reset to 0)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Persistent Essence status:</span>
              <span className="text-emerald-400 font-bold">Maintained ({totalPersistentEssence} total)</span>
            </div>
          </div>

          <button 
            onClick={handleConfirmDefeat}
            className="mt-8 px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-slate-100 font-bold rounded-xl transition-all font-display uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg"
            id="restart-run-loss-btn"
          >
            <RotateCcw className="w-4 h-4 animate-spin" />
            Return to Pre-Run Hub
          </button>
        </div>
      )}
    </div>
  );
}
