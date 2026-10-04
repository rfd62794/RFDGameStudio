import React from 'react';
import { DeclaredAction, DefenseForce, FactionId, TerritoryCell, UnitState } from '../types';
import { TerritoryScreen } from './TerritoryScreen';
import { DeclarationOverlay } from './DeclarationOverlay';
import { ResponseOverlay } from './ResponseOverlay';
import { Swords } from 'lucide-react';

interface MapPhaseLayoutProps {
  gamePhase: 'pre_turn_declaration' | 'pre_turn_response' | 'map';
  cells: TerritoryCell[];
  selectedCellId: string | null;
  gold: number;
  squadUnits: UnitState[];
  kingUnit: UnitState | null;
  kingSettlingTurns: number;
  declaredActions: DeclaredAction[];
  turnOrder: FactionId[];
  reinforcementPenaltyGold: number;
  defenseForces?: DefenseForce[];
  marshOutline?: [number, number][];
  onSelectCell: (cellId: string) => void;
  onScoutCell: (cellId: string) => void;
  onEngageBattle: (cellId: string) => void;
  onDeclareAction: (targetCellId: string, intent: 'attack' | 'reinforce') => void;
  onRespondAction: (targetCellId: string) => void;
  onProceedToResponsePhase: () => void;
  onProceedToCombat: () => void;
  onBackToShop: () => void;
}

export function MapPhaseLayout({
  gamePhase,
  cells,
  selectedCellId,
  gold,
  squadUnits,
  kingUnit,
  kingSettlingTurns,
  declaredActions,
  turnOrder,
  reinforcementPenaltyGold,
  defenseForces = [],
  marshOutline,
  onSelectCell,
  onScoutCell,
  onEngageBattle,
  onDeclareAction,
  onRespondAction,
  onProceedToResponsePhase,
  onProceedToCombat,
  onBackToShop,
}: MapPhaseLayoutProps) {
  const selectedCell = cells.find((c) => c.id === selectedCellId) || cells[0];
  const isPlayerOwned = selectedCell?.owner === 'player';

  return (
    <div className="relative flex flex-col gap-4 p-4 max-w-7xl mx-auto pb-24">
      {/* Territory Map Display */}
      <TerritoryScreen
        cells={cells}
        selectedCellId={selectedCellId}
        gold={gold}
        squadUnits={squadUnits}
        kingUnit={kingUnit}
        kingSettlingTurns={kingSettlingTurns}
        declaredActions={declaredActions}
        defenseForces={defenseForces}
        marshOutline={marshOutline}
        onSelectCell={onSelectCell}
        onScoutCell={onScoutCell}
        onBackToShop={onBackToShop}
        onEngageBattle={onEngageBattle}
        onDeclareAction={onDeclareAction}
        onRespondAction={onRespondAction}
        gamePhase={gamePhase}
      />

      {/* Phase-Specific Overlay Panel */}
      {gamePhase === 'pre_turn_declaration' && (
        <DeclarationOverlay
          declaredActions={declaredActions}
          turnOrder={turnOrder}
          gold={gold}
          cells={cells}
          selectedCellId={selectedCellId}
          squadUnits={squadUnits}
          onDeclareAction={onDeclareAction}
          onProceedToResponsePhase={onProceedToResponsePhase}
        />
      )}

      {gamePhase === 'pre_turn_response' && (
        <ResponseOverlay
          declaredActions={declaredActions}
          cells={cells}
          selectedCellId={selectedCellId}
          gold={gold}
          reinforcementPenaltyGold={reinforcementPenaltyGold}
          onRespondAction={onRespondAction}
          onProceedToCombat={onProceedToCombat}
        />
      )}

      {gamePhase === 'map' && (
        <div className="p-4 bg-zinc-950/95 border border-amber-500/40 rounded-2xl shadow-2xl flex items-center justify-between">
          <span className="text-xs font-mono text-amber-300 font-bold">
            Targeting Cell: <strong className="text-zinc-100">{selectedCell?.name}</strong>
          </span>
          <button
            onClick={() => onEngageBattle(selectedCell ? selectedCell.id : cells[0].id)}
            disabled={squadUnits.length === 0}
            className={`py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
              isPlayerOwned
                ? 'bg-blue-600 hover:bg-blue-500 text-zinc-100 shadow-blue-950/50'
                : 'bg-rose-600 hover:bg-rose-500 text-zinc-100 shadow-rose-950/50'
            }`}
          >
            <Swords className="w-4 h-4" />
            {isPlayerOwned ? 'Fortify & Defend Cell' : 'Attack Contested Territory'}
          </button>
        </div>
      )}
    </div>
  );
}
