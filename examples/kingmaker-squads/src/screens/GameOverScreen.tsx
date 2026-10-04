import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface GameOverScreenProps {
  onRestart: () => void;
}

export function GameOverScreen({ onRestart }: GameOverScreenProps) {
  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-gradient-to-b from-rose-950/80 to-zinc-950 border-2 border-rose-600 rounded-2xl text-center space-y-6 shadow-2xl">
      <div className="w-16 h-16 rounded-full bg-rose-600 text-zinc-100 flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <div>
        <span className="text-xs font-mono uppercase tracking-widest text-rose-400">All Forces Fallen</span>
        <h2 className="text-3xl font-black text-rose-100 font-serif mt-1">THE REBELLION CRUSHED</h2>
        <p className="text-sm text-zinc-300 mt-2 max-w-md mx-auto">
          Your last Cell Leader was eliminated on the Front line with no survivors left to take up leadership.
        </p>
      </div>
      <button
        onClick={onRestart}
        className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-zinc-100 font-black text-sm uppercase tracking-wider transition shadow-lg"
      >
        Try Again
      </button>
    </div>
  );
}
