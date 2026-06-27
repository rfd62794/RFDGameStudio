import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Magnet, 
  Shield, 
  Maximize2, 
  Compass, 
  Ghost, 
  Sparkles, 
  Flame,
  Hourglass
} from 'lucide-react';
import { EvolutionCard } from '../types';

interface EvolutionModalProps {
  cards: EvolutionCard[];
  onSelect: (cardId: string) => void;
  level: number;
}

const iconMap: Record<string, React.ReactNode> = {
  speed: <Zap className="w-8 h-8 text-amber-400" />,
  magnet: <Magnet className="w-8 h-8 text-sky-400" />,
  shield: <Shield className="w-8 h-8 text-emerald-400" />,
  wide: <Maximize2 className="w-8 h-8 text-violet-400" />,
  sense: <Compass className="w-8 h-8 text-rose-400" />,
  ghost: <Ghost className="w-8 h-8 text-indigo-400" />,
  regen: <Sparkles className="w-8 h-8 text-fuchsia-400" />,
  venom: <Flame className="w-8 h-8 text-orange-400" />
};

export default function EvolutionModal({ cards, onSelect, level }: EvolutionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full" />

        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
            <Sparkles className="w-4.5 h-4.5 animate-pulse" /> Level {level} Triggered
          </div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight sm:text-4xl">
            Choose Your Evolution
          </h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-lg mx-auto">
            Your body undergoes rapid mutation. Select one gene modification to proceed. Evolutions persist even when segments are lost!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {cards.map((card, idx) => {
            const isEpic = card.rarity === 'epic';
            const isRare = card.rarity === 'rare';
            
            let cardBg = 'bg-slate-950/60 hover:bg-slate-950/80 border-slate-800';
            let glowColor = '';
            let rarityLabel = 'Common';
            let rarityColor = 'text-slate-500 bg-slate-500/10 border-slate-500/20';

            if (isEpic) {
              cardBg = 'bg-gradient-to-b from-slate-950/80 to-purple-950/20 border-purple-500/30 hover:border-purple-500/50';
              glowColor = 'shadow-[0_0_20px_rgba(168,85,247,0.15)]';
              rarityLabel = 'Epic';
              rarityColor = 'text-purple-400 bg-purple-500/15 border-purple-500/25';
            } else if (isRare) {
              cardBg = 'bg-gradient-to-b from-slate-950/80 to-cyan-950/20 border-cyan-500/30 hover:border-cyan-500/50';
              glowColor = 'shadow-[0_0_15px_rgba(6,182,212,0.1)]';
              rarityLabel = 'Rare';
              rarityColor = 'text-cyan-400 bg-cyan-500/15 border-cyan-500/25';
            }

            return (
              <motion.button
                key={card.id}
                onClick={() => onSelect(card.id)}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.1 } }}
                className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 relative ${cardBg} ${glowColor} group outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                {/* Visual border pulse on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 group-hover:border-slate-700 transition-colors">
                    {iconMap[card.iconName] || <Sparkles className="w-8 h-8 text-slate-400" />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rarityColor} uppercase tracking-wider`}>
                    {rarityLabel}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-white transition-colors">
                  {card.title}
                </h3>
                
                <p className="text-slate-400 text-sm leading-relaxed flex-grow">
                  {card.description}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-800/60 w-full flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                  <span>Equip Mutation</span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
