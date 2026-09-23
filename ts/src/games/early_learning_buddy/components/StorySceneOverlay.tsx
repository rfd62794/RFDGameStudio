import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, BookOpen } from 'lucide-react';
import { CharacterInstance } from '../types';
import { CharacterVisual } from './CharacterVisual';

interface StorySceneOverlayProps {
  character: CharacterInstance;
  beatIndex: number; // 1, 2, or 3
  beatText: string;
  onDismiss?: () => void;
}

export const StorySceneOverlay: React.FC<StorySceneOverlayProps> = ({
  character,
  beatIndex,
  beatText,
}) => {
  const getBeatTitle = () => {
    if (beatIndex === 1) return 'Beat 1/3 • Getting Ready!';
    if (beatIndex === 2) return `Beat 2/3 • ${character.customAction}!`;
    return 'Beat 3/3 • Story Complete! 🎉';
  };

  const getActionState = () => {
    if (beatIndex === 1) return 'idle';
    if (beatIndex === 2) return 'performing';
    return 'performing';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 border-4 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center"
        >
          {/* Sky/Clouds Background Details */}
          <div className="absolute top-3 left-4 w-12 h-6 bg-white/70 rounded-full blur-[1px]" />
          <div className="absolute top-6 right-6 w-16 h-8 bg-white/70 rounded-full blur-[1px]" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-emerald-300/60 to-transparent pointer-events-none" />

          {/* Header Story Progress Pill */}
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="z-10 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-4 py-1.5 rounded-full border-2 border-amber-300 shadow-sm mb-4"
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
              {getBeatTitle()}
            </span>
            <div className="flex gap-1 ml-1">
              <div className={`w-2.5 h-2.5 rounded-full ${beatIndex >= 1 ? 'bg-amber-400' : 'bg-slate-300'}`} />
              <div className={`w-2.5 h-2.5 rounded-full ${beatIndex >= 2 ? 'bg-amber-400' : 'bg-slate-300'}`} />
              <div className={`w-2.5 h-2.5 rounded-full ${beatIndex >= 3 ? 'bg-amber-400' : 'bg-slate-300'}`} />
            </div>
          </motion.div>

          {/* Central Large Character Stage */}
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="relative z-10 my-2"
          >
            <CharacterVisual
              archetypeId={character.archetypeId}
              variantId={character.variantId}
              actionState={getActionState()}
              actionName={character.customAction}
              size="xl"
              showSparkles={true}
            />
          </motion.div>

          {/* Speech Bubble Narration Caption */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 bg-white border-3 border-amber-300 rounded-2xl p-4 sm:p-5 w-full shadow-lg mt-3"
          >
            {/* Speech bubble pointer triangle */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-amber-300" />

            <div className="flex items-center justify-center gap-2 mb-1 text-purple-600 font-extrabold text-xs uppercase tracking-wide">
              <Volume2 className="w-4 h-4 text-purple-500 animate-pulse" />
              <span>{character.customName}'s Story</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <p className="text-base sm:text-xl font-extrabold text-slate-800 leading-snug">
              "{beatText}"
            </p>
          </motion.div>

          {/* Auto-advancing footer badge */}
          <div className="z-10 mt-4 text-[11px] font-bold text-slate-600 bg-white/80 px-3 py-1 rounded-full border border-slate-200 shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Advancing back to practice...</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
