/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OccupantType = 'fish' | 'shark' | 'flesh_chunk';

export interface Fish {
  id: string;
  type: 'fish';
  age: number;
  fed: boolean;
  lineageId: string;
  lineageColor: string;
}

export interface Shark {
  id: string;
  type: 'shark';
  age: number;
  fed: boolean;
  ticksSinceLastMeal: number;
  lineageId: string;
  lineageColor: string;
}

export interface FleshChunk {
  id: string;
  type: 'flesh_chunk';
  ticksRemaining: number;
  maxTicks: number;
}

export type Occupant = Fish | Shark | FleshChunk | null;

export type TerrainType = 'water' | 'kelp';

export interface Cell {
  x: number;
  y: number;
  terrain: TerrainType;
  occupant: Occupant;
}

export interface AlgaeHub {
  id: string;
  cx: number; // center x
  cy: number; // center y
  growthCooldown: number;
}

export type PlacementMode = 'fish' | 'shark' | 'algae' | 'cull';

export interface SimulationStats {
  tickCount: number;
  fishCount: number;
  sharkCount: number;
  algaeCount: number;
  chunkCount: number;
}
