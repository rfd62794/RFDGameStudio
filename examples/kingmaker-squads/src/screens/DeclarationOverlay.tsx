import React from 'react';
import { DeclaredAction, FactionId, TerritoryCell, UnitState } from '../types';
import { FACTIONS } from '../data/archetypes';
import { Zap } from 'lucide-react';

interface DeclarationOverlayProps {
  declaredActions: DeclaredAction[];
  turnOrder: FactionId[];
  gold: number;
  cells: TerritoryCell[];
  selectedCellId: string | null;
  squadUnits: UnitState[];
  onDeclareAction: (targetCellId: string, intent: 'attack' | 'reinforce') => void;
  onProceedToResponsePhase: () => void;
}

export function DeclarationOverlay({
  declaredActions,
  turnOrder,
  cells,
  selectedCellId,
  squadUnits,
  onDeclareAction,
  onProceedToResponsePhase,
}: DeclarationOverlayProps) {
  const selectedCell = cells.find((c) => c.id === selectedCellId) || cells[0];
  const isPlayerOwned = selectedCell?.owner === 'player';

  return (
    <div className="p-4 bg-zinc-950/95 border border-amber-500/40 rounded-2xl shadow-2xl space-y-3 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-serif">
            Pre-Turn Declaration Phase
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Order: {turnOrder.map((f) => FACTIONS[f]?.name.split(' ')[0]).join(' → ')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Intent Action Button */}
        <button
          onClick={() =>
            onDeclareAction(selectedCell.id, isPlayerOwned ? 'reinforce' : 'attack')
          }
          disabled={squadUnits.length === 0}
          className={`py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
            isPlayerOwned
              ? 'bg-blue-600 hover:bg-blue-500 text-zinc-100 shadow-blue-950/50'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-950/50'
          }`}
        >
          <Zap className="w-4 h-4" />
          {isPlayerOwned
            ? `Declare Reinforcement [${selectedCell.name}]`
            : `Declare Attack Target [${selectedCell.name}]`}
        </button>

        {/* Proceed Button */}
        <button
          onClick={onProceedToResponsePhase}
          className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider transition border border-zinc-700 flex items-center justify-center gap-1.5"
        >
          <span>Lock Declarations & Open Response Window</span>
        </button>
      </div>

      {declaredActions.length > 0 && (
        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 pt-1">
          <span className="text-amber-400 font-bold">Active Declarations:</span>
          <span>
            {declaredActions.map((a) => `${FACTIONS[a.factionId]?.name}: ${a.actionIntent}`).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
