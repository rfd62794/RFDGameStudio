/**
 * SlimeWorld (God-Game) - Core Type Definitions
 * Based on ADR 002 & Phase Directive: SectorZone Soil Upgrade Pass + Monument Construction
 */

export type ElementType = 'Water' | 'Earth' | 'Fire' | 'Air';

export const ELEMENT_NAMES: ElementType[] = ['Water', 'Earth', 'Fire', 'Air'];
export const ELEMENT_COLORS: Record<ElementType, string> = {
  Water: '#38bdf8', // sky-400
  Earth: '#4ade80', // green-400
  Fire: '#fb7185',  // rose-400
  Air: '#fbbf24',   // amber-400
};

export type AspectId =
  | 'LushFlora'
  | 'MineralVein'
  | 'GeothermalVent'
  | 'BreezeAura'
  | 'CrystalSpire'
  | 'SlimeNodule';

export type SoilType = 'BarrenRock' | 'Clay' | 'FertileLoam' | 'VolcanicAsh';

export type StructureSlot =
  | { type: 'None' }
  | { type: 'Monument'; bonus_focus: number }
  | { type: 'Settlement'; name: string; scan_radius: number; demand: ResourceLedger };

export interface ResourceLedger {
  food: number;
  energy: number;
  material: number;
}

export interface TileState {
  tiers: [number, number, number, number]; // [Water, Earth, Fire, Air] (0-3)
  resistances: [number, number, number, number];
  aspect_slots: [AspectId | null, AspectId | null, AspectId | null, AspectId | null];
  ticks_stable: number; // increments when tiers unchanged this resolve, resets to 0 on any tier delta
}

export interface SectorZone {
  sector_id: number;
  soil_profile: SoilType;
  structure: StructureSlot;
  tile_indices: [number, number, number, number];
}

export interface Settlement {
  id: string;
  name: string;
  tile_index: number;
  scan_radius: number;
  demand_profile: ResourceLedger;
  last_harvest_target: number | null;
  last_harvest_yield: ResourceLedger | null;
}

export interface WorldState {
  tiles: TileState[];
  sectors: SectorZone[];
  current_tick: number;
  settlement_ledger: ResourceLedger;
  settlement: Settlement;
  logs: GameLogEvent[];
}

export interface GameLogEvent {
  id: string;
  tick: number;
  type: 'soil_upgrade' | 'monument_built' | 'harvest' | 'perturbation' | 'stability' | 'info';
  message: string;
  sector_id?: number;
  tile_id?: number;
}

export const RING_SIZE = 32;
export const TILES_PER_SECTOR = 4;
export const NUM_SECTORS = 8;
export const SOIL_STABILITY_TICKS = 20;

export const MONUMENT_COST: ResourceLedger = {
  food: 10,
  energy: 5,
  material: 15,
};

export const MONUMENT_BASE_FOCUS = 5; // Flat value for this phase
