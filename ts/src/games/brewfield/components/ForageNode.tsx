import { motion } from 'framer-motion';
import { Flame, Droplet, Shield, Wind, Sparkles } from 'lucide-react';
import type { ElementType } from '../types';
import { getElementColor } from '../gameLogic';

interface ForageNodeProps {
  options: ElementType[];
  onSelectIngredient: (element: ElementType) => void;
}

export default function ForageNode({ options, onSelectIngredient }: ForageNodeProps) {
  const getIngredientQuote = (el: ElementType) => {
    switch (el) {
      case 'fire':
        return 'You discover a cluster of cinder-bloom. Its petals remain hot to the touch, ready to ignite.';
      case 'water':
        return 'Deep water condensed on the cavern roof has gathered here. It flows with pure, calm, cooling power.';
      case 'earth':
        return 'A heavy chunk of ironized clay rests on the hearth. It feels dense, permanent, and protective.';
      case 'air':
        return 'You find a hollow reed whistled by drafts. Feathers of vapor swirl lightly inside its stem.';
    }
  };

  const getElementIcon = (el: ElementType, sizeClass = 'w-10 h-10') => {
    switch (el) {
      case 'fire':
        return <Flame className={`${sizeClass} text-rose-500 fill-rose-500/10`} />;
      case 'water':
        return <Droplet className={`${sizeClass} text-sky-400 fill-sky-400/10`} />;
      case 'earth':
        return <Shield className={`${sizeClass} text-emerald-500 fill-emerald-500/10`} />;
      case 'air':
        return <Wind className={`${sizeClass} text-fuchsia-400`} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-stone-900 border border-amber-800/30 rounded-2xl p-8 shadow-xl relative"
        id="forage-card"
      >
        <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-amber-600/40" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-amber-600/40" />

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-900/40 text-amber-500 text-xs font-mono mb-4 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          Forage Wilderness
        </div>

        <h2 className="text-2xl font-bold text-stone-100 font-serif mb-2">Gathering Wild Compounds</h2>
        <p className="text-stone-400 text-xs max-w-md mx-auto mb-8 font-mono">
          Search the ancient, moist ruins of the cauldron floor. Select exactly ONE raw element to
          bind permanently into your pool:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {options.map((el, idx) => {
            const color = getElementColor(el);
            return (
              <motion.button
                key={idx}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectIngredient(el)}
                className="bg-stone-950/60 hover:bg-stone-950 border border-stone-800 hover:border-amber-700/50 p-5 rounded-xl text-center flex flex-col items-center gap-4 cursor-pointer transition-all h-full justify-between"
              >
                <div
                  className="p-3 bg-stone-900 rounded-full border border-stone-800 shadow-inner"
                  style={{ color }}
                >
                  {getElementIcon(el)}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-serif font-bold capitalize" style={{ color }}>
                    {el} Element
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-0.5">
                    {el === 'fire' && 'Aggressive'}
                    {el === 'water' && 'Responsive'}
                    {el === 'earth' && 'Defensive'}
                    {el === 'air' && 'Evasive'}
                  </span>
                </div>

                <p className="text-[10px] text-stone-400 leading-relaxed font-mono italic mt-2 border-t border-stone-900 pt-3">
                  {getIngredientQuote(el)}
                </p>

                <div className="mt-4 w-full py-1.5 rounded-lg border border-stone-850 bg-stone-900/40 text-[10px] font-mono text-stone-400 hover:text-stone-200 uppercase font-semibold">
                  CHOOSE ELEMENT
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="text-center">
          <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">
            Your deck size will grow permanently by +1 element.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
