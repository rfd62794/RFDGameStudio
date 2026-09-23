import React, { useState, useMemo } from 'react';
import { ShoppingBag, ArrowRight, Check, Sparkles, Gem } from 'lucide-react';
import { RunState, TypedBoon } from '../types';
import { BOON_POOL } from '../utils';

interface StorePhaseProps {
  runState: RunState;
  setRunState: React.Dispatch<React.SetStateAction<RunState | null>>;
  onDone: () => void;
}

export default function StorePhase({ runState, setRunState, onDone }: StorePhaseProps) {
  const [purchasedSlotIndices, setPurchasedSlotIndices] = useState<number[]>([]);
  const [message, setMessage] = useState<string>('');

  // Draw 4 slots randomly (seeded, deterministic per visit, full refresh every visit)
  const storeSlots = useMemo(() => {
    // Exclude boons already held by the player
    const ownedIds = runState.boons.map(b => b.id);
    const availablePool = BOON_POOL.filter(b => !ownedIds.includes(b.id));

    // Simple LCG hash of seed + currentNodeId + visit timestamp to shuffle
    let hash = runState.seed;
    const key = `${runState.currentNodeId}_store_${Date.now()}`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) & 0x7fffffff;
    }

    const nextRand = () => {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      return hash / 0x7fffffff;
    };

    const shuffled = [...availablePool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(nextRand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 4);
  }, [runState.seed, runState.currentNodeId]);

  const handleBuy = (boon: TypedBoon, slotIndex: number) => {
    if (purchasedSlotIndices.includes(slotIndex)) return;

    if (runState.essence < boon.essenceCost) {
      setMessage(`Insufficient Essence! Needed ${boon.essenceCost} ESS, you have ${runState.essence} ESS.`);
      return;
    }

    // Purchase boon
    setPurchasedSlotIndices(prev => [...prev, slotIndex]);
    setRunState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        essence: prev.essence - boon.essenceCost,
        boons: [...prev.boons, boon],
        logs: [
          ...prev.logs,
          `🛒 Store Room Purchase: Acquired "${boon.targetId.toUpperCase()}" Boon for ${boon.essenceCost} Essence.`
        ]
      };
    });
    setMessage(`Acquired ${boon.targetId.toUpperCase()} Boon for ${boon.essenceCost} ESS!`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative" id="viewport-store-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
          Resonant Construct Emporium
        </span>
        <h2 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2 mt-1">
          <ShoppingBag className="text-amber-400 w-6 h-6" />
          Anomalous Store Room
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          A wandering construct merchant offers 4 freshly tuned resonant Boons. Spend active Run Essence to acquire temporary, run-scoped multipliers.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-950/80 p-4 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Active Run Essence:</span>
          <span className="text-amber-400 font-bold text-sm">{runState.essence} ESS</span>
        </div>
        <div className="flex flex-col sm:items-end text-[10px]">
          <span className="text-xs text-slate-400">
            Unspent Essence resets on death — spend or save is a real bet.
          </span>
          <span className="text-slate-500 text-[10px]">
            Refreshes fully each visit
          </span>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="p-3 bg-slate-950/80 border border-slate-800 text-amber-300 text-xs rounded-xl font-mono flex items-center gap-2">
          <span>💡</span>
          <span>{message}</span>
        </div>
      )}

      {/* Store Slots Grid (4 Slots) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="store-slots-grid">
        {storeSlots.map((boon, index) => {
          const isPurchased = purchasedSlotIndices.includes(index) || runState.boons.some(b => b.id === boon.id);
          const canAfford = runState.essence >= boon.essenceCost;

          return (
            <div
              key={`${boon.id}_slot_${index}`}
              className={`p-4 rounded-xl border flex flex-col justify-between h-40 transition-all ${
                isPurchased
                  ? 'border-emerald-900/40 bg-emerald-950/10'
                  : canAfford
                  ? 'border-slate-800 bg-slate-950/60 hover:border-amber-500/50 hover:bg-slate-900/60'
                  : 'border-slate-850 bg-slate-950/30 opacity-70'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                    boon.tier === 'master' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                    boon.tier === 'elite' ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                    boon.tier === 'advanced' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                    'bg-slate-900 text-slate-300 border-slate-700'
                  }`}>
                    {boon.tier} Tier
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {boon.essenceCost} ESS
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-200 capitalize mt-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {boon.targetId.replace('_', ' ')} Boon
                </h3>

                <p className="text-[11px] font-mono text-slate-400 mt-1 leading-snug">
                  {boon.tier === 'master' 
                    ? boon.qualitativeEffect 
                    : `Adds +${boon.modifier} value to matching ${boon.targetType} activations.`}
                </p>
              </div>

              <button
                onClick={() => handleBuy(boon, index)}
                disabled={isPurchased || !canAfford}
                className={`w-full py-2 rounded-lg text-xs font-bold font-mono transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  isPurchased
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 cursor-default'
                    : canAfford
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed'
                }`}
              >
                {isPurchased ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Acquired
                  </>
                ) : (
                  `Purchase (${boon.essenceCost} ESS)`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Done / Leave Button */}
      <div className="border-t border-slate-800 pt-4 mt-2">
        <button
          onClick={onDone}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider font-display flex items-center justify-center gap-2 transition-all"
        >
          Leave Store Room & Continue Run
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
