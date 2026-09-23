/**
 * @file src/components/VictoryScreen.tsx
 * Victory screen displayed when the player completes Day 7 ("7 Days to Fry").
 */

import React from 'react';
import { KitchenState } from '../types';
import { Trophy, RotateCcw, Calendar, ShoppingBag, DollarSign, Award } from 'lucide-react';

interface VictoryScreenProps {
  state: KitchenState;
  onRestart: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ state, onRestart }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        {/* Icon & Title */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-amber-500/20">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">7 Days to Fry — Survived!</h2>
          <p className="text-sm text-amber-400 font-semibold">
            You successfully managed the kitchen through all 7 days!
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your strategic balance between speed, quality, morale, and supply logistics kept the kitchen operational under extreme demand ramps.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 font-sans">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Days Completed
            </span>
            <span className="font-bold text-slate-200 text-sm">7 / 7</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 font-sans">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Final Brand Equity
            </span>
            <span className="font-bold text-amber-400 text-sm">{Math.round(state.brandEquity)}%</span>
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

        {/* Start New Run Button */}
        <button
          onClick={onRestart}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Run</span>
        </button>
      </div>
    </div>
  );
};
