import { Swords, Shield, Skull } from 'lucide-react';
import type { DeckCard, RunState } from '../types';

interface CombatPhaseProps {
  run: RunState;
  onPlayCard: (card: DeckCard) => void;
}

const COMPONENT_LABEL: Record<string, string> = {
  sever: 'Damage',
  mend: 'Heal',
  guard: 'Shield',
  unmake: 'DoT',
};

export default function CombatPhase({ run, onPlayCard }: CombatPhaseProps) {
  const enemy = run.enemy;
  if (!enemy) return null;

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 shadow-2xl relative max-w-5xl mx-auto my-4"
      id="viewport-combat-phase"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">You</span>
          <div className="flex items-center gap-3 text-sm font-bold text-slate-100">
            <span>HP {run.playerHp}/{run.playerMaxHp}</span>
            {run.playerShield > 0 && (
              <span className="flex items-center gap-1 text-sky-400">
                <Shield className="w-4 h-4" /> {run.playerShield}
              </span>
            )}
          </div>
        </div>
        <Swords className="w-6 h-6 text-amber-500" />
        <div className="flex flex-col gap-1 items-end">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{enemy.name}</span>
          <span className="text-sm font-bold text-rose-400">HP {enemy.hp}/{enemy.maxHp}</span>
        </div>
      </div>

      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-xs font-mono text-amber-300">
        <Skull className="w-4 h-4" />
        <span>Enemy Intent: {enemy.intent.description}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" id="combat-hand">
        {run.deckState.hand.map((card) => (
          <button
            key={card.id}
            onClick={() => onPlayCard(card)}
            className="p-3 rounded-xl border border-slate-700 bg-slate-800/70 hover:border-amber-500/60 hover:bg-slate-800 transition-all flex flex-col gap-1.5 text-left cursor-pointer"
            id={`combat-card-${card.id}`}
          >
            <span className="text-[9px] font-mono uppercase text-amber-400">
              {COMPONENT_LABEL[card.component] ?? card.component}
            </span>
            <span className="text-xs font-bold text-slate-100">{card.name}</span>
            <span className="text-[9px] font-mono text-slate-500 capitalize">
              {card.el1}{card.el2 ? ` + ${card.el2}` : ''} · {card.relationType}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto flex flex-col gap-1 text-[10px] font-mono text-slate-400" id="combat-log">
        {run.logs.slice(-12).map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}
