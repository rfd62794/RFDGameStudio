import { Heart, Layers, Gem, Sparkles, ArrowRight } from 'lucide-react';
import type { RewardSlot } from '../types';

interface RewardPhaseProps {
  slots: RewardSlot[];
  onClaimAll: () => void;
}

const SLOT_ICON: Record<RewardSlot['kind'], typeof Heart> = {
  heal: Heart,
  card: Layers,
  benefit: Sparkles,
  relic: Gem,
};

function slotLabel(slot: RewardSlot): string {
  switch (slot.kind) {
    case 'heal':
      return `+${slot.amount} HP`;
    case 'card':
      return `Card: ${slot.cardId}`;
    case 'benefit':
      return `Boon: ${slot.boonId}`;
    case 'relic':
      return `Relic: ${slot.relicId}`;
  }
}

export default function RewardPhase({ slots, onClaimAll }: RewardPhaseProps) {
  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 flex flex-col items-center text-center gap-6 shadow-2xl max-w-3xl mx-auto my-4"
      id="viewport-reward-phase"
    >
      <h2 className="text-2xl font-black text-slate-100 tracking-wider">VICTORY — CLAIM REWARDS</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {slots.map((slot, i) => {
          const Icon = SLOT_ICON[slot.kind];
          return (
            <div
              key={i}
              className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 flex flex-col items-center gap-2"
              id={`reward-slot-${i}`}
            >
              <Icon className="w-6 h-6 text-amber-400" />
              <span className="text-xs font-bold text-slate-100">{slotLabel(slot)}</span>
            </div>
          );
        })}
      </div>

      <button
        onClick={onClaimAll}
        className="w-full max-w-md py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs cursor-pointer"
        id="reward-claim-all-btn"
      >
        <span>Claim All — Return to Map</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
