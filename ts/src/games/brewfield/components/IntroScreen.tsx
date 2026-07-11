import { motion } from 'framer-motion';
import {
  Sparkles,
  Flame,
  Droplets,
  Compass,
  Shield,
  Swords,
} from 'lucide-react';

interface IntroScreenProps {
  onStartGame: () => void;
}

export default function IntroScreen({ onStartGame }: IntroScreenProps) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-950/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-950/20 rounded-full blur-3xl -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl w-full bg-stone-900/80 border-2 border-amber-800/40 rounded-2xl p-8 shadow-2xl relative backdrop-blur-md"
        id="intro-container"
      >
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-600/60" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-600/60" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-600/60" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-600/60" />

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-amber-700/30 bg-amber-950/30 text-amber-500 text-xs tracking-widest uppercase mb-3 font-mono"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Alchemical Battler
          </motion.div>
          <h1
            className="text-5xl font-extrabold tracking-wider bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent font-serif"
            id="game-title"
          >
            BREWFIELD
          </h1>
          <p className="text-stone-400 text-sm mt-2 max-w-md mx-auto italic font-mono">
            &ldquo;Every brew is a committed uncertainty, a calculated risk about to become
            irreversible.&rdquo;
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 flex gap-3">
            <div className="p-2 h-fit rounded-lg bg-rose-950/50 text-rose-500 border border-rose-800/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-200 mb-1">Elemental Chemistry</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Combine up to 2 Elements from your hand with an infinite Component (Strike,
                Ward, Mend, Blight). Same elements amplify; adjacent hybridize; opposed trigger
                volatile 50%/150% power flips.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 flex gap-3">
            <div className="p-2 h-fit rounded-lg bg-sky-950/50 text-sky-500 border border-sky-800/30">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-200 mb-1">The Residue Field</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Unspent chemicals accumulate in the cauldron. Burning deals DoT, Soaked weakens
                intents, Fortified blocks overrides, and Windswept doubles other effects. Opposed
                elements cleanse the field.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 flex gap-3">
            <div className="p-2 h-fit rounded-lg bg-emerald-950/50 text-emerald-500 border border-emerald-800/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-200 mb-1">Descending the Halls</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Survive a 9-node linear descent through the ruined alchemical cauldron floors.
                Forage new element combinations, rest at purge furnaces, and defeat the final
                Rootbound Guardian.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 flex gap-3">
            <div className="p-2 h-fit rounded-lg bg-purple-950/50 text-purple-500 border border-purple-800/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-200 mb-1">No Free Refills</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                No mana resource exists. Your hand is your fuel. Remaining elements discard each
                turn. Anticipate telegraphed enemy values precisely to survive.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartGame}
            className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-lg tracking-wide rounded-xl shadow-lg shadow-amber-950/40 border border-amber-400 flex items-center gap-2 cursor-pointer transition-all"
            id="btn-start"
          >
            <Swords className="w-5 h-5" />
            DESCEND THE CAULDRON HALL
          </motion.button>

          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest text-stone-500 font-mono">
              Starting deck: 2 Fire · 2 Water · 2 Earth · 2 Air
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
