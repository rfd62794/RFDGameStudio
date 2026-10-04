// components/PocketCoinPickerModal.tsx — pocket coin draft pick modal.
// Ported from the example; the 3-card draw lives in ../logic/wheel.

import { useEffect, useState } from 'react';
import type { PocketCoinType } from '../types';
import { sound } from '../utils/sound';
import { pickDraftChoices } from '../logic/wheel';

interface PocketCoinPickerModalProps {
  unlockedPocketCoins: PocketCoinType[];
  isOpen: boolean;
  onSelect: (selected: PocketCoinType) => void;
}

export default function PocketCoinPickerModal({
  unlockedPocketCoins,
  isOpen,
  onSelect,
}: PocketCoinPickerModalProps) {
  const [choices, setChoices] = useState<PocketCoinType[]>([]);

  useEffect(() => {
    if (isOpen && unlockedPocketCoins.length > 0) {
      sound.playRefill();
      setChoices(pickDraftChoices(unlockedPocketCoins, Math.random));
    }
  }, [isOpen, unlockedPocketCoins]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 flex justify-center items-center z-50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-2xl w-full text-center relative overflow-hidden flex flex-col items-center">
        {/* Colorful top border ribbon */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-teal-400 to-amber-500 animate-pulse" />

        <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mb-2">
          CHOOSE A POCKET COIN!
        </h2>
        <p className="text-sm text-slate-400 mb-8 max-w-md">
          You triggered a reload threshold! Pick one new special coin to add to your hand. All spent pocket coins will also be fully recharged!
        </p>

        {/* 3 cards container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
          {choices.map((coin) => {
            let icon = '🪙';
            if (coin.id === 'tnt') icon = '💣';
            if (coin.id === 'magnet') icon = '🧲';
            if (coin.id === 'double_drop') icon = '🍀';
            if (coin.id === 'giga_gold') icon = '👑';

            return (
              <button
                key={coin.id}
                onClick={() => onSelect(coin)}
                id={`pocket-coin-pick-${coin.id}`}
                className="group relative flex flex-col items-center p-6 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800 hover:border-slate-500 rounded-xl transition-all duration-300 text-left active:scale-95 focus:outline-none"
                style={{
                  boxShadow: `0 4px 20px -5px ${coin.color}20`
                }}
              >
                {/* Glowing ring */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 12px ${coin.color}40, 0 0 12px ${coin.color}20`
                  }}
                />

                {/* Coin Visual Sphere */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border-4 font-black text-3xl mb-4 group-hover:scale-110 transition-transform shadow-lg"
                  style={{
                    backgroundColor: coin.color,
                    borderColor: coin.borderColor,
                    color: coin.textColor,
                    boxShadow: `0 0 15px ${coin.color}40`
                  }}
                >
                  {icon}
                </div>

                <h3 className="font-extrabold text-white text-md uppercase tracking-wide group-hover:text-cyan-400 transition-colors mb-2">
                  {coin.name}
                </h3>

                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                  {coin.description}
                </p>

                {/* Pick indicator footer */}
                <div className="mt-4 text-[10px] font-black uppercase text-slate-500 group-hover:text-cyan-400 tracking-widest">
                  Click to Draft
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
