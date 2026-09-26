// PlanetForge — core world model and sector logic
// Ported from ADR 001/002 (originally specified in Rust). No Lua, no bridge —
// plain TypeScript, per RFDGameStudio's current TS-native chassis (ADR-010).

export const RING_SIZE = 32;
export const TILES_PER_SECTOR = 4;
export const SECTOR_COUNT = RING_SIZE / TILES_PER_SECTOR;

export enum ElementType {
  Heat = 0,
  Moisture = 1,
  Charge = 2,
  Purity = 3,
}

export type AspectId =
  | 'BasicSoil'
  | 'FertileLoam'
  | 'ScrubFlora'
  | 'LushFlora'
  | 'GrazerFauna'
  | 'MineralVein'
  | 'ResonanceSpire';

export interface ResourceLedger {
  food: number;
  energy: number;
  material: number;
}

export function emptyLedger(): ResourceLedger {
  return { food: 0, energy: 0, material: 0 };
}

export type SoilType = 'BarrenRock' | 'Clay' | 'FertileLoam' | 'VolcanicAsh';

// Discriminated union — the TS equivalent of Rust's data-carrying enum.
export type StructureSlot =
  | { kind: 'None' }
  | { kind: 'Monument'; bonusFocus: number }
  | { kind: 'Aqueduct'; moistureBoost: number }
  | { kind: 'MineShaft'; extractionMult: number };

// Rust's u8 tier fields enforced compile-time bounds implicitly via type +
// explicit clamping at write sites. TypeScript has neither — this function
// is the single enforcement point. Every write to a tier value must go
// through this. A tier written without it is a silent-drift bug waiting
// to happen, exactly the failure mode the discrete-tier design was chosen
// to avoid in the first place.
export function clampTier(value: number): number {
  return Math.max(0, Math.min(3, Math.trunc(value)));
}

export interface TileState {
  tiers: [number, number, number, number]; // [Heat, Moisture, Charge, Purity] — always clampTier'd, 0-3
  resistances: [number, number, number, number]; // 0-3, per element
  aspectSlots: (AspectId | null)[]; // fixed length 4
  ticksStable: number; // increments when tiers unchanged this resolve, resets to 0 on any tier delta
}

export function makeTileState(): TileState {
  return {
    tiers: [0, 0, 0, 0],
    resistances: [0, 0, 0, 0],
    aspectSlots: [null, null, null, null],
    ticksStable: 0,
  };
}

export interface SectorZone {
  sectorId: number;
  soilProfile: SoilType;
  structure: StructureSlot;
  tileIndices: [number, number, number, number];
}

export interface WorldState {
  tiles: TileState[]; // length RING_SIZE
  sectors: SectorZone[]; // length SECTOR_COUNT
}

export function makeWorldState(): WorldState {
  const tiles = Array.from({ length: RING_SIZE }, () => makeTileState());
  const sectors: SectorZone[] = Array.from({ length: SECTOR_COUNT }, (_, i) => ({
    sectorId: i,
    soilProfile: 'BarrenRock',
    structure: { kind: 'None' },
    tileIndices: [
      i * TILES_PER_SECTOR,
      i * TILES_PER_SECTOR + 1,
      i * TILES_PER_SECTOR + 2,
      i * TILES_PER_SECTOR + 3,
    ],
  }));
  return { tiles, sectors };
}

// ---------------------------------------------------------
// 1. Yield calculation
// ---------------------------------------------------------

export function evaluateTileYield(tile: TileState, sector: SectorZone): ResourceLedger {
  const total = emptyLedger();
  for (const aspect of tile.aspectSlots) {
    if (aspect === null) continue;
    switch (aspect) {
      case 'BasicSoil':
        total.food += 1;
        break;
      case 'FertileLoam':
        total.food += 3;
        if (sector.soilProfile === 'FertileLoam') total.food += 1; // sector synergy
        break;
      case 'ScrubFlora':
        total.material += 1;
        break;
      case 'LushFlora':
        total.food += 2;
        total.material += 2;
        break;
      case 'GrazerFauna':
        total.food += 4;
        break;
      case 'MineralVein':
        total.material += 3;
        total.energy += 1;
        break;
      case 'ResonanceSpire':
        total.energy += 4;
        break;
      default: {
        // Exhaustiveness check — the TS equivalent of Rust's compile-time
        // guarantee that every enum variant is handled. If AspectId gains
        // a new variant and this switch isn't updated, this line fails to
        // compile. Do not remove this default case.
        const exhaustive: never = aspect;
        throw new Error(`Unhandled AspectId: ${exhaustive}`);
      }
    }
  }
  return total;
}

// ---------------------------------------------------------
// 2. ScanRadius scoring
// ---------------------------------------------------------

export interface DemandProfile {
  weightFood: number;
  weightEnergy: number;
  weightMaterial: number;
}

export function calculateScanScore(
  yields: ResourceLedger,
  demand: DemandProfile,
  distance: number,
  distancePenalty: number
): number {
  const raw =
    yields.food * demand.weightFood +
    yields.energy * demand.weightEnergy +
    yields.material * demand.weightMaterial;
  return raw - distance * distancePenalty;
}

// JS's % operator is not Euclidean — it can return negative values for
// negative inputs. Rust's rem_euclid() in the original design does not
// have this problem. This wrapper is required, not optional, or ring
// wraparound breaks silently for any origin/direction combo that goes
// negative before wrapping.
function ringIndex(i: number): number {
  return ((i % RING_SIZE) + RING_SIZE) % RING_SIZE;
}

export function selectHarvestTarget(
  world: WorldState,
  originTile: number,
  radius: number,
  demand: DemandProfile
): number | null {
  let bestTile: number | null = null;
  let highestScore = -Infinity;

  for (let d = 0; d <= radius; d++) {
    for (const dir of [-1, 1]) {
      const targetIdx = ringIndex(originTile + d * dir);
      const sectorIdx = Math.floor(targetIdx / TILES_PER_SECTOR);
      const tile = world.tiles[targetIdx];
      const sector = world.sectors[sectorIdx];
      const yields = evaluateTileYield(tile, sector);
      const score = calculateScanScore(yields, demand, d, 2);
      if (score > highestScore) {
        highestScore = score;
        bestTile = targetIdx;
      }
      if (d === 0) break; // origin tile only needs evaluating once, not twice
    }
  }
  return bestTile;
}

// ---------------------------------------------------------
// 3. Soil ladder
// ---------------------------------------------------------

export function soilUpgradeTarget(current: SoilType): SoilType | null {
  switch (current) {
    case 'BarrenRock':
      return 'Clay';
    case 'Clay':
      return 'FertileLoam';
    case 'FertileLoam':
      return null; // top of the primary ladder
    case 'VolcanicAsh':
      return 'Clay'; // LOCKED this phase: recoverable, loops onto the primary ladder
    default: {
      const exhaustive: never = current;
      throw new Error(`Unhandled SoilType: ${exhaustive}`);
    }
  }
}

// ---------------------------------------------------------
// 4. Sector soil upgrade pass
// ---------------------------------------------------------

export const SOIL_STABILITY_TICKS = 20; // placeholder — tune after playtest, not a locked balance number

export function updateSectorSoil(sector: SectorZone, tiles: TileState[]): boolean {
  const allStable = sector.tileIndices.every(
    (idx) => tiles[idx].ticksStable >= SOIL_STABILITY_TICKS
  );
  if (!allStable) return false;

  const next = soilUpgradeTarget(sector.soilProfile);
  if (next === null) return false;

  sector.soilProfile = next;
  return true;
}

// ---------------------------------------------------------
// 5. Monument construction
// ---------------------------------------------------------

export const MONUMENT_COST: ResourceLedger = { food: 10, energy: 5, material: 15 };
export const MONUMENT_BASE_FOCUS = 5; // LOCKED flat this phase — does not scale with soil tier

export function attemptConstructMonument(sector: SectorZone, ledger: ResourceLedger): boolean {
  if (sector.structure.kind !== 'None') return false;

  const affordable =
    ledger.food >= MONUMENT_COST.food &&
    ledger.energy >= MONUMENT_COST.energy &&
    ledger.material >= MONUMENT_COST.material;

  if (!affordable) return false;

  ledger.food -= MONUMENT_COST.food;
  ledger.energy -= MONUMENT_COST.energy;
  ledger.material -= MONUMENT_COST.material;

  sector.structure = { kind: 'Monument', bonusFocus: MONUMENT_BASE_FOCUS };
  return true;
}
