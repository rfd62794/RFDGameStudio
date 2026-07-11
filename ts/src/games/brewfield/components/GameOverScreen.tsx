import { Trophy, Skull, RefreshCw, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RunStats } from '../types';

interface GameOverScreenProps {
  won: boolean;
  stats: RunStats;
  onRestart: () => void;
}

export default function GameOverScreen({ won, stats, onRestart }: GameOverScreenProps) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl -z-10 opacity-20 ${
          won ? 'bg-amber-900/30' : 'bg-rose-900/30'
        }`}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl w-full bg-stone-900 border-2 rounded-2xl p-8 shadow-2xl relative text-center backdrop-blur-md"
        style={{ borderColor: won ? '#b45309' : '#991b1b' }}
        id="game-over-container"
      >
        <div className="flex justify-center mb-6">
          {won ? (
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="p-4 bg-amber-950/50 text-amber-500 rounded-full border-2 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              <Trophy className="w-16 h-16 fill-amber-500/10" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="p-4 bg-rose-950/50 text-rose-500 rounded-full border-2 border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              <Skull className="w-16 h-16 fill-rose-500/10" />
            </motion.div>
          )}
        </div>

        <h1 className="text-4xl font-extrabold font-serif tracking-wider mb-2" id="outcome-heading">
          {won ? (
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              RUN CLEARED!
            </span>
          ) : (
            <span className="bg-gradient-to-r from-rose-500 to-rose-700 bg-clip-text text-transparent">
              DISSOLVED...
            </span>
          )}
        </h1>
        <p className="text-stone-400 text-sm font-mono max-w-sm mx-auto mb-8">
          {won
            ? 'You successfully navigated the 9 Cauldron Floors and cleansed the ancient Rootbound Guardian!'
            : 'Your physical matrix collapsed under the volatile pressure of the Cauldron Hall.'}
        </p>

        <div className="border border-stone-850 rounded-xl bg-stone-950/40 p-5 mb-8 text-left">
          <div className="flex items-center gap-1.5 text-stone-400 text-[10px] uppercase font-mono font-bold border-b border-stone-850 pb-2 mb-4">
            <BarChart2 className="w-4 h-4 text-amber-500" />
            Alchemical Statistics
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Enemies Cleansed</span>
              <span className="text-stone-200 font-bold text-sm">{stats.enemiesDefeated} / 4</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Brews Synthesized</span>
              <span className="text-stone-200 font-bold text-sm">{stats.brewsCreated}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Total Damage Dealt</span>
              <span className="text-stone-200 font-bold text-sm">{stats.totalDamageDealt} HP</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Aura Shields Warded</span>
              <span className="text-stone-200 font-bold text-sm">{stats.totalShieldGained} HP</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Vitality Mended</span>
              <span className="text-stone-200 font-bold text-sm">{stats.totalHealed} HP</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[9px] uppercase">Volatility Gambles</span>
              <span className="text-stone-200 font-bold text-sm">
                <span className="text-emerald-500 font-semibold">{stats.volatileSuccesses} ⚡</span>
                {' / '}
                <span className="text-rose-500 font-semibold">{stats.volatileFails} 💨</span>
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onRestart}
          className="px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-sm tracking-widest rounded-xl shadow-lg border border-amber-400 flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all uppercase"
          id="btn-restart"
        >
          <RefreshCw className="w-4 h-4" />
          BREW AGAIN
        </motion.button>
      </motion.div>
    </div>
  );
}
