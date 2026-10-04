import React from 'react';
import { Crown, Play, RotateCcw, Shield } from 'lucide-react';
import { useArmedConfirm } from '../hooks/useArmedConfirm';
import { armedLabel } from '../utils/armedConfirm';

export interface NewGameScreenProps {
  onNewGame: () => void;
  onContinue: () => void;
  hasSaveData: boolean;
}

export function NewGameScreen({ onNewGame, onContinue, hasSaveData }: NewGameScreenProps) {
  const armedNew = useArmedConfirm(onNewGame);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a0f_1px,transparent_1px),linear-gradient(to_bottom,#27272a0f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-lg w-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center gap-6">
        {/* Emblem / Logo Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
          <Crown className="w-8 h-8" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase block">
            A Tactical Dynasty Engine
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-black text-amber-100 tracking-tight">
            KINGMAKER SQUADS
          </h1>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            People don't forget a family that ruled with an iron hand. Reunite the six Houses and reclaim what is rightfully yours.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 pt-4 border-t border-zinc-800/80">
          {hasSaveData && (
            <button
              onClick={onContinue}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition duration-200"
            >
              <Play className="w-4 h-4 fill-current" />
              Continue Campaign
            </button>
          )}

          <button
            onClick={hasSaveData ? armedNew.trigger : onNewGame}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition duration-200 ${
              hasSaveData
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/10'
            }`}
          >
            {hasSaveData ? (
              <>
                <RotateCcw className="w-4 h-4" />
                {armedLabel(armedNew.armed, 'New Campaign', 'Confirm new campaign?')}
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Start New Campaign
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="text-[11px] font-mono text-zinc-500 pt-2">
          Six Houses • Voronoi City Districts • Tactical Chess Squads
        </div>
      </div>
    </div>
  );
}
