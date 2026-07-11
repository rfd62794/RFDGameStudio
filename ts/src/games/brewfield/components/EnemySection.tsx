import { motion } from 'framer-motion';
import { Heart, Shield, AlertTriangle, Sparkles, Flame, Hammer, Activity } from 'lucide-react';
import type { EnemyState } from '../types';

interface EnemySectionProps {
  enemy: EnemyState;
}

export default function EnemySection({ enemy }: EnemySectionProps) {
  const hpPercent = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));

  const renderEnemyAvatar = () => {
    switch (enemy.archetype) {
      case 'ashling':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center bg-rose-950/40 rounded-full border border-rose-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute inset-2 border border-dashed border-rose-500/20 rounded-full"
            />
            <Flame className="w-12 h-12 text-rose-500 animate-pulse" />
            <span className="absolute bottom-1 bg-rose-950 border border-rose-700/50 text-[8px] font-mono font-extrabold text-rose-300 px-1.5 rounded uppercase tracking-widest">
              Fire Cinder
            </span>
          </div>
        );
      case 'bulwark':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center bg-emerald-950/40 rounded-full border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
              className="absolute inset-2 border border-dashed border-emerald-500/20 rounded-full"
            />
            <Hammer className="w-12 h-12 text-emerald-400" />
            <span className="absolute bottom-1 bg-emerald-950 border border-emerald-700/50 text-[8px] font-mono font-extrabold text-emerald-300 px-1.5 rounded uppercase tracking-widest">
              Earth Stone
            </span>
          </div>
        );
      case 'molten_ashling':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center bg-amber-950/40 rounded-full border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              className="absolute inset-1 border border-dashed border-amber-500/20 rounded-full"
            />
            <Sparkles className="w-12 h-12 text-amber-500 animate-pulse" />
            <span className="absolute bottom-1 bg-amber-950 border border-amber-700/50 text-[8px] font-mono font-extrabold text-amber-300 px-1.5 rounded uppercase tracking-widest">
              Molten Golem
            </span>
          </div>
        );
      case 'rootbound':
        return (
          <div className="relative w-24 h-24 flex items-center justify-center bg-purple-950/40 rounded-full border border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
              className="absolute inset-1 border border-dotted border-purple-500/30 rounded-full"
            />
            <Activity className="w-12 h-12 text-purple-400" />
            <span className="absolute bottom-1 bg-purple-950 border border-purple-700/50 text-[8px] font-mono font-extrabold text-purple-300 px-1.5 rounded uppercase tracking-widest">
              Gale Root
            </span>
          </div>
        );
    }
  };

  const getIntentColorStyle = (action: string) => {
    switch (action) {
      case 'attack':
        return 'bg-rose-950/40 border-rose-800/50 text-rose-400';
      case 'defend':
        return 'bg-blue-950/40 border-blue-800/50 text-blue-400';
      case 'heal':
        return 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400';
      default:
        return 'bg-purple-950/40 border-purple-800/50 text-purple-400';
    }
  };

  return (
    <div
      className="w-full bg-stone-900/60 border border-stone-800/60 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row items-center gap-6"
      id="enemy-section"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-stone-950/20 rounded-full blur-2xl -z-10" />

      <div className="flex flex-col items-center shrink-0">{renderEnemyAvatar()}</div>

      <div className="flex-1 w-full flex flex-col justify-center">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif font-bold text-lg text-stone-200">{enemy.name}</h3>
          <div className="flex items-center gap-2">
            {enemy.shield > 0 && (
              <span className="inline-flex items-center gap-1 bg-blue-950/80 text-blue-400 border border-blue-800/50 px-2 py-0.5 rounded text-xs font-mono font-extrabold shadow-sm animate-bounce">
                <Shield className="w-3.5 h-3.5 fill-blue-400" />
                {enemy.shield} SHIELD
              </span>
            )}
          </div>
        </div>

        <div className="w-full h-4 bg-stone-950 rounded-full overflow-hidden border border-stone-800 flex items-center relative mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hpPercent}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            className="h-full bg-gradient-to-r from-rose-800 to-rose-600 rounded-full"
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-extrabold text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 mr-1 inline" />
            {enemy.hp} / {enemy.maxHp} HP
          </span>
        </div>

        <div className="mt-1">
          <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Telegraphed Intent
          </div>
          <div
            className={`border p-3 rounded-lg flex items-center justify-between text-xs font-mono ${getIntentColorStyle(enemy.intent.action)}`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 font-bold uppercase mb-0.5 tracking-tight">
                NEXT MOVE: {enemy.intent.action.toUpperCase()}
              </span>
              <span className="text-stone-100 font-sans font-semibold text-sm">
                {enemy.intent.description}
              </span>
            </div>
            {enemy.intent.value > 0 && (
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-stone-950 border border-stone-800 shadow-inner">
                <span className="text-xl font-bold font-serif leading-none tracking-tight">
                  {enemy.intent.value}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
