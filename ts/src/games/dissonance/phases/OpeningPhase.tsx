import { useState } from 'react';
import { Sparkles, ArrowRight, PackageOpen, HelpCircle } from 'lucide-react';
import type { OpeningPackItem } from '../types';

interface OpeningPhaseProps {
  pack: OpeningPackItem[];
  onComplete: () => void;
}

export default function OpeningPhase({ pack, onComplete }: OpeningPhaseProps) {
  const [flippedCount, setFlippedCount] = useState(0);

  const flipNext = () => {
    if (flippedCount < pack.length) setFlippedCount((prev) => prev + 1);
  };

  const allFlipped = flippedCount >= pack.length;

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 flex flex-col items-center text-center gap-8 shadow-2xl relative max-w-4xl mx-auto my-4 overflow-hidden"
      id="viewport-opening-phase"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-slate-900/50 to-slate-950 pointer-events-none rounded-2xl" />

      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/80 border border-amber-500/40 rounded-full text-[10px] font-mono text-amber-400 uppercase tracking-widest shadow-md">
          <PackageOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>ECHO Core Initialization — First Pack Reveal</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-100 tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
          RESONANCE CAPSULE OPENING
        </h2>
      </div>

      {!allFlipped && (
        <button
          onClick={flipNext}
          className="relative z-10 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          id="opening-flip-next-btn"
        >
          <Sparkles className="w-4 h-4" />
          <span>Flip Top Card ({flippedCount + 1}/{pack.length})</span>
        </button>
      )}

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {pack.map((item, idx) => {
          const isFlipped = idx < flippedCount;
          return (
            <div
              key={item.action}
              className={`relative h-52 rounded-xl border transition-all duration-500 flex flex-col justify-between p-4 text-left select-none ${
                isFlipped
                  ? 'bg-slate-800/80 border-amber-500/40 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800/80 border-dashed text-slate-600'
              }`}
              id={`opening-hand-card-${item.action}`}
            >
              {!isFlipped ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-50">
                  <HelpCircle className="w-6 h-6 text-slate-700" />
                  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                    Slot {idx + 1} Empty
                  </span>
                </div>
              ) : (
                <div className="flex flex-col h-full justify-between gap-2">
                  <div className="flex justify-between items-center text-[10px] font-mono capitalize text-slate-300">
                    <span className="font-bold">{item.element}</span>
                    <span className="px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-300 uppercase font-bold text-[9px]">
                      {item.action}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 leading-snug text-center my-auto">
                    {item.name}
                  </h3>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allFlipped && (
        <button
          onClick={onComplete}
          className="relative z-10 w-full max-w-md py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-xl flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs cursor-pointer"
          id="opening-continue-btn"
        >
          <span>Begin Run — Enter Floor 1 Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
