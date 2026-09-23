import React from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { DeckCard, DeckState, EnemyState } from '../types';
import { 
  previewCardEffectWithBoons, 
  getSecondaryType, 
  getTypeMultiplier, 
  getElementColor, 
  getElementIcon 
} from '../utils';

interface CombatHandProps {
  deckState: DeckState;
  boons: any[];
  enemy: EnemyState;
  onPlayCard: (card: DeckCard) => void;
}

export default function CombatHand({
  deckState,
  boons,
  enemy,
  onPlayCard
}: CombatHandProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-4" id="combat-action-selector">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-400" />
          Select Elemental Frequencies from Hand
        </h3>
        <div className="text-[10px] font-mono text-slate-500">
          DECK: {deckState.drawPile.length} DRAW • {deckState.discard.length} DISCARD
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-fade-in" id="combat-player-hand">
        {deckState.hand.map((card) => {
          const cardPreview = previewCardEffectWithBoons(card, boons || []);
          const isBoosted = Boolean(cardPreview.boostedLabel);
          const contributingBoonsText = isBoosted && cardPreview.contributingBoons
            ? `Boosted by: ${cardPreview.contributingBoons.map(b => b.targetId.toUpperCase() || b.id).join(', ')}`
            : undefined;

          const cardSecType = getSecondaryType(card.relationType);
          const typeMult = getTypeMultiplier(cardSecType, {
            vulnerable: enemy.vulnerable,
            resistant: enemy.resistant
          });

          return (
            <button
              key={card.id}
              onClick={() => onPlayCard(card)}
              className={`cursor-pointer p-3 rounded-xl border text-left flex flex-col justify-between h-32 transition-all relative group active:translate-y-0.5 hover:shadow-lg ${
                isBoosted
                  ? 'border-cyan-400/80 bg-cyan-950/25 hover:bg-cyan-950/40 shadow-[0_0_12px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/50 hover:border-cyan-300'
                  : typeMult > 1.0
                  ? 'border-emerald-500/80 bg-emerald-950/20 hover:bg-emerald-950/40 shadow-[0_0_10px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                  : typeMult < 1.0
                  ? 'border-rose-900/60 bg-rose-950/10 hover:bg-rose-950/30'
                  : 'border-slate-800 hover:border-amber-400 bg-slate-950/50 hover:bg-slate-900/40'
              }`}
              id={`hand-card-${card.id}`}
              title={contributingBoonsText}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-[8px] font-mono font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  {card.relationType}
                  {cardSecType && (
                    <span className={`px-1 py-0.2 text-[7px] rounded font-bold uppercase ${
                      cardSecType === 'burst' ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' :
                      cardSecType === 'hybrid' ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60' :
                      'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                    }`}>
                      {cardSecType}
                    </span>
                  )}
                </span>
                {typeMult > 1.0 && (
                  <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 uppercase tracking-wider">
                    1.3x
                  </span>
                )}
                {typeMult < 1.0 && (
                  <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-400/50 uppercase tracking-wider">
                    0.7x
                  </span>
                )}
                {isBoosted && typeMult === 1.0 && (
                  <span 
                    className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 uppercase tracking-wider flex items-center gap-0.5"
                    title={contributingBoonsText}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-pulse" /> Boosted
                  </span>
                )}
              </div>

              <div className="mt-1 overflow-hidden w-full">
                <span className="block text-xs font-bold text-slate-200 group-hover:text-amber-300 truncate capitalize leading-tight">
                  {card.name}
                </span>
                <span 
                  className={`text-[10px] font-mono block mt-0.5 truncate ${
                    isBoosted ? 'text-cyan-300 font-extrabold' : 'text-amber-400 font-bold'
                  }`}
                  title={contributingBoonsText || cardPreview.baseLabel}
                >
                  {isBoosted ? cardPreview.boostedLabel : cardPreview.baseLabel}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block leading-normal mt-0.5 capitalize">
                  {card.el1} {card.el2 ? `+ ${card.el2}` : 'Single'}
                </span>
              </div>

              <div className="flex gap-1 mt-2.5 items-center">
                <div className="flex gap-0.5">
                  <span className={`p-0.5 rounded border text-[10px] ${getElementColor(card.el1)}`}>
                    {getElementIcon(card.el1)}
                  </span>
                  {card.el2 && (
                    <span className={`p-0.5 rounded border text-[10px] ${getElementColor(card.el2)}`}>
                      {getElementIcon(card.el2)}
                    </span>
                  )}
                </div>
                <span className="text-[8px] font-mono uppercase font-bold truncate text-indigo-400">
                  {card.component}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
