import React from 'react';
import { Crown } from 'lucide-react';

interface VictoryScreenProps {
  onRestart: () => void;
}

export function VictoryScreen({ onRestart }: VictoryScreenProps) {
  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-gradient-to-b from-amber-950/80 to-zinc-950 border-2 border-amber-500 rounded-2xl text-center space-y-6 shadow-2xl">
      <div className="w-16 h-16 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
        <Crown className="w-10 h-10 fill-current" />
      </div>
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Campaign Conquered</span>
        <h2 className="text-3xl font-black text-amber-100 font-serif mt-1">THE FRONT IS YOURS</h2>
        <p className="text-sm text-zinc-300 mt-2 max-w-md mx-auto">
          Every district cell has been liberated by your Rebel Cell. The regime has fallen across the entire quarter.
        </p>
      </div>
      <button
        onClick={onRestart}
        className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm uppercase tracking-wider transition shadow-lg"
      >
        Start New Campaign
      </button>
    </div>
  );
}
