import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface CardInfo {
  id: string;
  name: string;
  el1: string;
  el2: string | null;
  component: string;
  relationType: string;
}

interface DeckBuildPhaseProps {
  unlockedCardIds: string[];
  cardPool: CardInfo[];
  deckSize: number;
  onConfirm: (selectedIds: string[]) => void;
}

export default function DeckBuildPhase({ unlockedCardIds, cardPool, deckSize, onConfirm }: DeckBuildPhaseProps) {
  const [selected, setSelected] = useState<string[]>(unlockedCardIds.slice(0, deckSize));
  const byId = new Map(cardPool.map((c) => [c.id, c]));

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= deckSize) return prev;
      return [...prev, id];
    });
  };

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 flex flex-col items-center text-center gap-6 shadow-2xl max-w-4xl mx-auto my-4"
      id="viewport-deck-build-phase"
    >
      <h2 className="text-2xl md:text-3xl font-black text-slate-100 tracking-wider">BUILD YOUR DECK</h2>
      <p className="text-xs font-mono text-slate-400">
        Select up to {deckSize} cards from your unlocked pool ({selected.length}/{deckSize} selected)
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full max-h-96 overflow-y-auto p-1">
        {unlockedCardIds.map((id) => {
          const card = byId.get(id);
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`relative p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                isSelected
                  ? 'bg-amber-950/60 border-amber-500/60'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
              }`}
              id={`deck-build-card-${id}`}
            >
              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 absolute top-2 right-2" />}
              <span className="text-[9px] font-mono uppercase text-slate-500">{card?.component ?? id}</span>
              <span className="text-xs font-bold text-slate-100">{card?.name ?? id}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onConfirm(selected)}
        disabled={selected.length === 0}
        className="w-full max-w-md py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        id="deck-build-confirm-btn"
      >
        <span>Confirm Deck — Begin Run</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
