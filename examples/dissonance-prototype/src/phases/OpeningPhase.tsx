import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, PackageOpen, CheckCircle2, Layers, HelpCircle } from 'lucide-react';
import { generateOpeningPack, previewCardEffect, getElementColor, getElementIcon, getComponentColor } from '../utils';

interface OpeningPhaseProps {
  unlockCards: (ids: string[], runComboCounts?: Record<string, number>, newDeckCardIds?: string[]) => void;
  onComplete: () => void;
}

export default function OpeningPhase({ unlockCards, onComplete }: OpeningPhaseProps) {
  // Generate pack ONCE on mount
  const [pack] = useState(() => generateOpeningPack());
  const [flippedCount, setFlippedCount] = useState<number>(0);
  const [isAutoFlipping, setIsAutoFlipping] = useState<boolean>(false);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync unlocked cards & starting deck as cards flip
  useEffect(() => {
    if (flippedCount > 0) {
      const revealedIds = pack.slice(0, flippedCount).map(c => c.cardId);
      if (flippedCount === 4) {
        // All 4 revealed -> set as unlocked and pre-select into starting deck
        unlockCards(revealedIds, undefined, revealedIds);
      } else {
        unlockCards(revealedIds);
      }
    }
  }, [flippedCount, pack, unlockCards]);

  // Handle step flip
  const flipNext = () => {
    if (flippedCount < 4) {
      setFlippedCount(prev => prev + 1);
    }
  };

  // Auto flip sequence
  const startAutoOpen = () => {
    if (flippedCount >= 4) return;
    setIsAutoFlipping(true);
    let current = flippedCount;
    
    const interval = setInterval(() => {
      current++;
      setFlippedCount(current);
      if (current >= 4) {
        clearInterval(interval);
        setIsAutoFlipping(false);
      }
    }, 600);

    autoTimerRef.current = interval;
  };

  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 flex flex-col items-center text-center gap-8 shadow-2xl relative max-w-4xl mx-auto my-4 overflow-hidden" id="viewport-opening-phase">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-slate-900/50 to-slate-950 pointer-events-none rounded-2xl" />

      {/* Header / Lead-In */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/80 border border-amber-500/40 rounded-full text-[10px] font-mono text-amber-400 uppercase tracking-widest shadow-md">
          <PackageOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>ECHO Core Initialization — First Pack Reveal</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black text-slate-100 tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
          RESONANCE CAPSULE OPENING
        </h2>
        {/* Lead-in line strictly as specified in §B2 */}
        <p className="text-sm md:text-base font-serif italic text-amber-300/90 max-w-lg mt-1 bg-amber-950/30 px-4 py-2 rounded-lg border border-amber-500/20 shadow-inner">
          "Four pieces. Let's see what's still whole."
        </p>
      </div>

      {/* SINGLE FACE-DOWN STACK (§B1) */}
      <div className="relative z-10 flex flex-col items-center gap-4 w-full my-2">
        {flippedCount < 4 ? (
          <div className="flex flex-col items-center gap-4">
            {/* Stack Visual */}
            <div 
              onClick={flipNext}
              className="relative w-48 h-64 cursor-pointer group select-none transition-transform duration-300 hover:scale-105"
              id="opening-card-stack"
            >
              {/* Stack Depth Layers */}
              {Array.from({ length: Math.min(3, 4 - flippedCount) }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-xl shadow-lg transition-all duration-300"
                  style={{
                    transform: `translate(${(i + 1) * 4}px, ${(i + 1) * 4}px)`,
                    opacity: 0.8 - i * 0.2
                  }}
                />
              ))}

              {/* Top Card Face-Down */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-xl p-4 flex flex-col items-center justify-between text-center shadow-2xl group-hover:border-amber-400">
                <div className="w-full flex justify-between items-center text-[10px] font-mono text-amber-400/70">
                  <span>CAPSULE STACK</span>
                  <span>{4 - flippedCount} LEFT</span>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-8 h-8 animate-pulse" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                    UNKNOWN
                  </span>
                </div>

                <span className="text-[10px] font-mono text-amber-400/90 bg-amber-950/80 px-2 py-1 rounded border border-amber-500/30">
                  Click Stack To Flip
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={flipNext}
                disabled={isAutoFlipping}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                id="opening-flip-next-btn"
              >
                <Sparkles className="w-4 h-4" />
                <span>Flip Top Card ({flippedCount + 1}/4)</span>
              </button>
              {flippedCount === 0 && (
                <button
                  onClick={startAutoOpen}
                  disabled={isAutoFlipping}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  id="opening-reveal-all-btn"
                >
                  Quick Flip All
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 shadow-md animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>All 4 resonance pieces revealed and seated into your Hand.</span>
          </div>
        )}
      </div>

      {/* BOTTOM ROW — PLAYER HAND LAYOUT (§B1) */}
      <div className="relative z-10 w-full flex flex-col gap-3" id="opening-hand-row">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Your Active Hand ({flippedCount}/4 Cards)</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Same Hand layout used in Combat
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {pack.map((item, idx) => {
            const isFlipped = idx < flippedCount;
            const isJustFlipped = idx === flippedCount - 1;
            const preview = previewCardEffect({ el1: item.element, el2: null, component: item.action });

            return (
              <div
                key={item.action}
                className={`relative h-60 rounded-xl border transition-all duration-500 flex flex-col justify-between p-4 text-left select-none ${
                  isFlipped
                    ? `${getElementColor(item.element)} shadow-xl ${
                        isJustFlipped ? 'scale-105 ring-2 ring-amber-400/80' : ''
                      }`
                    : 'bg-slate-950/60 border-slate-800/80 border-dashed text-slate-600'
                }`}
                id={`opening-hand-card-${item.action}`}
              >
                {!isFlipped ? (
                  /* UNREVEALED HAND SLOT */
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-2 opacity-50">
                    <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-700">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                      Slot {idx + 1} Empty
                    </span>
                  </div>
                ) : (
                  /* REVEALED CARD FACING */
                  <div className="flex flex-col h-full justify-between gap-2 animate-fade-in">
                    {/* Top Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-[10px] font-mono capitalize">
                        {getElementIcon(item.element)}
                        <span className="font-bold text-slate-200">{item.element}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase font-bold ${getComponentColor(item.action)}`}>
                        {item.action}
                      </span>
                    </div>

                    {/* Card Name */}
                    <div className="my-auto flex flex-col gap-1 text-center py-2">
                      <span className="text-[9px] font-mono text-amber-400/70 uppercase tracking-wider">STARTING PIECE</span>
                      <h3 className="text-sm font-bold font-display text-slate-100 leading-snug">
                        {item.name}
                      </h3>
                    </div>

                    {/* Bottom Effect Preview */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-center flex flex-col gap-0.5 shadow-inner">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Effect Preview</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {preview.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DIRECT ROUTING TO MAP/NODE 1 (§B3) */}
      {flippedCount === 4 && (
        <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-md pt-2 animate-fade-in" id="opening-completion-container">
          <button
            onClick={onComplete}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-xl hover:shadow-amber-500/20 flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs font-display cursor-pointer"
            id="opening-continue-btn"
          >
            <span>Begin Run — Enter Floor 1 Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
