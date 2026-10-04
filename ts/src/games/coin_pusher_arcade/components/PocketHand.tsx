// components/PocketHand.tsx — the physical card hand of pocket coins.

import type { PocketCoinInstance } from '../types';
import { POCKET_COIN_TYPES } from '../data';

interface PocketHandProps {
  hand: PocketCoinInstance[];
  isGameOver: boolean;
  onDropPocketCoin: (instanceId: string, typeId: string) => void;
}

export default function PocketHand({ hand, isGameOver, onDropPocketCoin }: PocketHandProps) {
  return (
    <div className="bg-slate-950/60 border-t border-pink-500/10 p-4">
      <span className="text-[10px] text-pink-400/80 uppercase tracking-widest font-black block mb-3 text-center">
        ACTIVE POCKET COINS HAND (CLICK CARD TO DROP)
      </span>

      <div className="flex flex-wrap justify-center gap-3">
        {hand.map((cInstance) => {
          const type = POCKET_COIN_TYPES.find(p => p.id === cInstance.typeId);
          if (!type) return null;

          const isUsed = cInstance.isUsed;
          let icon = '🪙';
          if (type.id === 'tnt') icon = '🧨';
          if (type.id === 'magnet') icon = '🧲';
          if (type.id === 'double_drop') icon = '⚡';
          if (type.id === 'giga_gold') icon = '👑';

          let badgeBg = 'bg-slate-700';
          let shadowClass = '';
          if (!isUsed) {
            if (type.id === 'tnt') {
              badgeBg = 'bg-red-600';
              shadowClass = 'shadow-[0_0_10px_rgba(220,38,38,0.5)]';
            } else if (type.id === 'magnet') {
              badgeBg = 'bg-cyan-500';
              shadowClass = 'shadow-[0_0_10px_rgba(6,182,212,0.5)]';
            } else if (type.id === 'double_drop') {
              badgeBg = 'bg-amber-500';
              shadowClass = 'shadow-[0_0_10px_rgba(245,158,11,0.5)]';
            } else if (type.id === 'giga_gold') {
              badgeBg = 'bg-yellow-500';
              shadowClass = 'shadow-[0_0_10px_rgba(234,179,8,0.5)]';
            }
          }

          return (
            <button
              key={cInstance.id}
              disabled={isUsed || isGameOver}
              onClick={() => onDropPocketCoin(cInstance.id, type.id)}
              id={`pocket-hand-${cInstance.id}`}
              className={`group p-3 rounded-xl border flex gap-3 items-center transition-all cursor-pointer focus:outline-none ${
                isUsed
                  ? 'bg-slate-900/40 border-slate-950 text-slate-600 opacity-40 cursor-not-allowed'
                  : 'bg-slate-800 border-white/5 hover:bg-slate-700 text-white hover:border-pink-500/30 active:scale-95'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform ${!isUsed && 'group-hover:scale-110'} ${badgeBg} ${shadowClass}`}>
                {icon}
              </div>

              <div className="flex flex-col text-left">
                <span className={`text-xs font-bold leading-none ${isUsed ? 'text-slate-500' : 'text-white'}`}>
                  {type.name.toUpperCase()}
                </span>
                <span className={`text-[9px] uppercase font-mono mt-0.5 leading-none ${isUsed ? 'text-slate-600' : 'text-pink-400'}`}>
                  {isUsed ? 'Used: 1 Available: 0' : 'Ready to Use'}
                </span>
              </div>
            </button>
          );
        })}

        {hand.length === 0 && (
          <p className="text-xs text-slate-500 font-semibold italic uppercase tracking-wider py-2">
            No active cards. Push coins to unlock card choices!
          </p>
        )}
      </div>
    </div>
  );
}
