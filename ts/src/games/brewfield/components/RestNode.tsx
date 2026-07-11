import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Heart, Plus, RefreshCw } from 'lucide-react';
import type { ElementType } from '../types';
import { getElementColor } from '../gameLogic';

interface RestNodeProps {
  playerHp: number;
  playerMaxHp: number;
  deck: ElementType[];
  onStokeFurnace: () => void;
  onSynthesizeElement: (element: ElementType) => void;
}

export default function RestNode({
  playerHp,
  playerMaxHp,
  deck,
  onStokeFurnace,
  onSynthesizeElement,
}: RestNodeProps) {
  const [view, setView] = useState<'main' | 'synthesize'>('main');

  const deckCounts = deck.reduce<Record<ElementType, number>>((acc, el) => {
    acc[el] = (acc[el] || 0) + 1;
    return acc;
  }, { fire: 0, water: 0, earth: 0, air: 0 });

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-stone-900 border border-amber-800/30 rounded-2xl p-8 shadow-xl relative"
        id="rest-card"
      >
        <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-amber-600/40" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-amber-600/40" />

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-900/40 text-amber-500 text-xs font-mono mb-4 uppercase tracking-widest">
          <Flame className="w-3.5 h-3.5" />
          Furnace Rest Node
        </div>

        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold text-stone-100 font-serif mb-2">The Purge Furnaces</h2>
              <p className="text-stone-400 text-xs max-w-md mx-auto mb-8 font-mono">
                The air is warm and comforting here. Stabilize your alchemical matrix before
                descending deeper. Choose one action:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStokeFurnace}
                  className="bg-stone-950/60 hover:bg-stone-950 border border-stone-800 hover:border-emerald-700/50 p-6 rounded-xl text-center flex flex-col items-center gap-3 cursor-pointer transition-all"
                >
                  <div className="p-3 bg-emerald-950/40 text-emerald-400 rounded-full border border-emerald-800/20">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-serif font-bold text-emerald-400">Stoke Furnace Flames</h3>
                  <p className="text-[10px] text-stone-400 leading-relaxed font-mono">
                    Restores <span className="text-emerald-400 font-bold">12 HP</span> and cleanses
                    all internal toxins. Current HP: {playerHp}/{playerMaxHp}.
                  </p>
                  <div className="mt-4 px-4 py-1.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800/30 uppercase font-semibold">
                    REST & HEAL
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('synthesize')}
                  className="bg-stone-950/60 hover:bg-stone-950 border border-stone-800 hover:border-amber-700/50 p-6 rounded-xl text-center flex flex-col items-center gap-3 cursor-pointer transition-all"
                >
                  <div className="p-3 bg-amber-950/40 text-amber-500 rounded-full border border-amber-800/20">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-serif font-bold text-amber-400">Synthesize Ingredient</h3>
                  <p className="text-[10px] text-stone-400 leading-relaxed font-mono">
                    Re-bind the residual fumes. Duplicate any Element in your deck to increase its
                    pool density.
                  </p>
                  <div className="mt-4 px-4 py-1.5 rounded bg-amber-950 text-amber-400 text-[10px] font-mono border border-amber-800/30 uppercase font-semibold">
                    TRANSMUTE / SYNTHESIZE
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="synthesize"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-xl font-bold text-stone-100 font-serif mb-2">
                Select Element to Synthesize
              </h2>
              <p className="text-stone-400 text-xs max-w-md mx-auto mb-6 font-mono">
                Click on any of your current elements to synthesize an exact alchemical clone (+1
                copy added to your pool):
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-6">
                {(['fire', 'water', 'earth', 'air'] as ElementType[]).map((el) => {
                  const color = getElementColor(el);
                  const count = deckCounts[el] || 0;

                  return (
                    <motion.button
                      key={el}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSynthesizeElement(el)}
                      className="bg-stone-950/60 hover:bg-stone-950 border border-stone-800 hover:border-amber-700/50 p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all"
                    >
                      <span className="text-2xl font-extrabold capitalize font-serif" style={{ color }}>
                        {el[0].toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-bold capitalize text-stone-300">{el}</span>
                      <span className="text-[9px] font-mono text-stone-500">({count} in Deck)</span>
                      <div className="mt-2 text-[9px] font-mono inline-flex items-center gap-0.5 text-amber-500 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/20">
                        <Plus className="w-2.5 h-2.5" /> Clone
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <button
                onClick={() => setView('main')}
                className="px-4 py-2 border border-stone-800 rounded bg-stone-900 text-stone-400 hover:text-stone-200 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Go Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
