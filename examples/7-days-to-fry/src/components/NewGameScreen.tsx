/**
 * @file src/components/NewGameScreen.tsx
 * Initial landing screen for starting a new game session.
 */

import React from 'react';
import { Play, Utensils, ShieldAlert, Award, ArrowRight } from 'lucide-react';

interface NewGameScreenProps {
  onStartGame: () => void;
}

export const NewGameScreen: React.FC<NewGameScreenProps> = ({ onStartGame }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-8 text-center relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Badge */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" /> Fast-Food Utility AI Simulation
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-amber-500/20">
              7F
            </span>
            7 Days to Fry
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Manage worker burnout, policy backpressure, and behavioral contagion under high-volume demand.
          </p>
        </div>

        {/* Restaurant Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-left space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-800 pb-2">
            <span>LOCATION #104</span>
            <span className="text-amber-400 font-mono">STATUS: READY</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              7 Days to Fry Burger Stand
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Standard 4-person line: Grill, Assembly, Expediter, Float Runner. Balance protocol compliance against throughput targets.
            </p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartGame}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-lg shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer group"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Start Shift</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
