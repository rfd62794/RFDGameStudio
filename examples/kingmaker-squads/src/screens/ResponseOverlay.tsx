import React from 'react';
import { DeclaredAction, TerritoryCell } from '../types';
import { AlertTriangle, Shield, Swords } from 'lucide-react';

interface ResponseOverlayProps {
  declaredActions: DeclaredAction[];
  cells: TerritoryCell[];
  selectedCellId: string | null;
  gold: number;
  reinforcementPenaltyGold: number;
  onRespondAction: (targetCellId: string) => void;
  onProceedToCombat: () => void;
}

export function ResponseOverlay({
  declaredActions,
  cells,
  selectedCellId,
  gold,
  reinforcementPenaltyGold,
  onRespondAction,
  onProceedToCombat,
}: ResponseOverlayProps) {
  const selectedCell = cells.find((c) => c.id === selectedCellId) || cells[0];

  // Check if player cell is targeted by AI declared action
  const targetedPlayerCellActions = declaredActions.filter((a) => {
    if (a.factionId === 'player' || a.actionIntent !== 'attack') return false;
    const target = cells.find((c) => c.id === a.targetCellId);
    return target && target.owner === 'player';
  });

  return (
    <div className="p-4 bg-zinc-950/95 border border-amber-500/40 rounded-2xl shadow-2xl space-y-3 animate-fade-in">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-serif flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" /> Response Window
        </h3>
        <span className="text-[11px] font-mono text-zinc-400">
          Reinforcement Fee: {reinforcementPenaltyGold} Gold
        </span>
      </div>

      {targetedPlayerCellActions.length > 0 && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold text-rose-300 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>INCOMING ATTACK DETECTED!</span>
          </div>
          <p className="text-[11px] text-rose-300/80">
            Enemy forces are marching on your territory. Respond now to reinforce or position an escort! (Cost: {reinforcementPenaltyGold} Gold)
          </p>
          <button
            onClick={() => onRespondAction(selectedCell.id)}
            disabled={gold < reinforcementPenaltyGold}
            className="mt-2 w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-zinc-100 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" /> Pay Reinforcement Response ({reinforcementPenaltyGold}g)
          </button>
        </div>
      )}

      <button
        onClick={onProceedToCombat}
        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
      >
        <Swords className="w-4 h-4" />
        Lock Commitments & Resolve Combat
      </button>
    </div>
  );
}
