/**
 * @file src/components/GameOverScreen.tsx
 * End screen displayed when Brand Equity hits 0%.
 */

import React from 'react';
import { KitchenState } from '../types';
import { AlertOctagon, RotateCcw, Calendar, ShoppingBag, DollarSign } from 'lucide-react';

interface GameOverScreenProps {
  state: KitchenState;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ state, onRestart }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-rose-500 selection:text-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        {/* Icon & Title */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto text-3xl">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Game Over</h2>
          <p className="text-sm text-rose-400 font-semibold">
            Brand Equity collapsed to 0%
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Customer trust reached zero due to uncaught quality degradation, safety violations, or line abandonments.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 font-sans">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Days Survived
            </span>
            <span className="font-bold text-slate-200 text-sm">{state.dayNumber}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 font-sans">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" /> Orders Served
            </span>
            <span className="font-bold text-slate-200 text-sm">{state.ordersServed}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1.5 font-sans">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Final Cash
            </span>
            <span className="font-bold text-emerald-400 text-sm">${state.cash.toFixed(2)}</span>
          </div>
        </div>

        {/* Try Again Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-base shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
};
