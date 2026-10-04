import React from 'react';
import type { GridTile, Agent } from '../types';
import { IsometricOfficeCanvas } from './IsometricOfficeCanvas';

interface Props {
  grid: GridTile[];
  agents: Agent[];
  selectedAgent: Agent | null;
  selectedTile: GridTile | null;
  gameTimeMinutes: number;
  buildPlacementItem: { name: string } | null;
  onSelectAgent: (agent: Agent) => void;
  onSelectTile: (tile: GridTile) => void;
  onPlaceBuildItem: (x: number, y: number) => void;
  onGoToDashboard: () => void;
}

export const FloorView: React.FC<Props> = ({
  grid,
  agents,
  selectedAgent,
  selectedTile,
  gameTimeMinutes,
  buildPlacementItem,
  onSelectAgent,
  onSelectTile,
  onPlaceBuildItem,
  onGoToDashboard,
}) => {
  return (
    <div className="w-full h-full relative bg-slate-950">
      <div className="absolute top-3 left-3 z-30">
        <button
          onClick={onGoToDashboard}
          className="px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-xs font-semibold text-white shadow"
        >
          Back to Dashboard
        </button>
      </div>
      <IsometricOfficeCanvas
        grid={grid}
        agents={agents}
        onSelectAgent={onSelectAgent}
        onSelectTile={onSelectTile}
        selectedAgentId={selectedAgent?.id}
        selectedTileId={selectedTile?.id}
        gameTimeMinutes={gameTimeMinutes}
        buildModeItem={buildPlacementItem?.name ?? null}
        onPlaceBuildItem={onPlaceBuildItem}
      />
    </div>
  );
};
