import React from 'react';
import { Shield, Heart, Coins, Award, Landmark } from 'lucide-react';
import { RunState, BankedEssence } from '../types';

interface StatsHeaderProps {
  persistentEssence: number;
  runState: RunState | null;
  bankedEssence?: BankedEssence;
}

export default function StatsHeader({ persistentEssence, runState, bankedEssence }: StatsHeaderProps) {
  return (
    <div 
      className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono shadow-md gap-2"
      id="stats-persistent-header"
    >
      <div className="flex flex-wrap items-center gap-4">
        {bankedEssence && bankedEssence.available && bankedEssence.amount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/70 border border-amber-500/50 rounded-md text-amber-300 text-[11px]" id="header-banked-essence-badge">
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Banked: <strong className="font-bold text-amber-200">{bankedEssence.amount} ESS</strong> <span className="text-amber-400/80 text-[10px]">(available this run only)</span></span>
          </div>
        )}

        {runState && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Run Essence:</span>
            <span className="text-emerald-400 font-bold">{runState.essence} ESS</span>
          </div>
        )}
      </div>

      {runState ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Integrity:</span>
            <span className="text-rose-400 font-bold">
              {runState.playerHp} / {runState.playerMaxHp}
            </span>
          </div>
          {runState.playerShield > 0 && (
            <div className="flex items-center gap-1.5 text-blue-400">
              <Shield className="w-4 h-4" />
              <span>Shield: {runState.playerShield}</span>
            </div>
          )}
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="text-slate-400">
            <span>Node: </span>
            <span className="text-slate-200 font-bold capitalize">{runState.currentNodeId}</span>
          </div>
        </div>
      ) : (
        <div className="text-slate-500 italic text-[10px]">
          No active sequence calibration in progress
        </div>
      )}
    </div>
  );
}
