/**
 * SlimeWorld God-Game Engine
 * Implements ADR 002 + Phase Directive (SectorZone Soil Upgrade & Monument Construction)
 */

import {
  AspectId,
  MONUMENT_BASE_FOCUS,
  MONUMENT_COST,
  NUM_SECTORS,
  ResourceLedger,
  RING_SIZE,
  SectorZone,
  SOIL_STABILITY_TICKS,
  SoilType,
  TileState,
  TILES_PER_SECTOR,
  WorldState,
  GameLogEvent,
} from '../types';

/**
 * Single enforcement point for elemental tier values. Every write to a
 * tier must go through this function so the discrete, bounded state space
 * ([0, 3]) remains testable and UI-agnostic.
 */
export function clampTier(value: number): number {
  return Math.max(0, Math.min(3, Math.trunc(value)));
}

/**
 * 2.2 — Soil ladder (Director's ruling — VolcanicAsh is recoverable, not a dead end)
 */
export function soil_upgrade_target(current: SoilType): SoilType | null {
  switch (current) {
    case 'BarrenRock':
      return 'Clay';
    case 'Clay':
      return 'FertileLoam';
    case 'FertileLoam':
      return null; // top of the primary ladder — no further upgrade
    case 'VolcanicAsh':
      return 'Clay'; // LOCKED: recoverable, loops back onto the primary ladder
    default: {
      const exhaustive: never = current;
      throw new Error(`Unhandled SoilType: ${exhaustive}`);
    }
  }
}

/**
 * 2.3 — Sector stability check + upgrade
 */
export function update_sector_soil(
  sector: SectorZone,
  tiles: TileState[],
): boolean {
  const all_stable = sector.tile_indices.every(
    (idx) => (tiles[idx]?.ticks_stable ?? 0) >= SOIL_STABILITY_TICKS,
  );

  if (!all_stable) {
    return false;
  }

  const next = soil_upgrade_target(sector.soil_profile);
  if (next !== null) {
    sector.soil_profile = next;
    return true;
  }

  return false;
}

/**
 * 2.4 — Monument construction (Director's ruling — bonus_focus is flat for this phase, not soil-tier-scaled)
 */
export function attempt_construct_monument(
  sector: SectorZone,
  settlement_ledger: ResourceLedger,
): boolean {
  if (sector.structure.type !== 'None') {
    return false;
  }

  const affordable =
    settlement_ledger.food >= MONUMENT_COST.food &&
    settlement_ledger.energy >= MONUMENT_COST.energy &&
    settlement_ledger.material >= MONUMENT_COST.material;

  if (!affordable) {
    return false;
  }

  settlement_ledger.food -= MONUMENT_COST.food;
  settlement_ledger.energy -= MONUMENT_COST.energy;
  settlement_ledger.material -= MONUMENT_COST.material;

  sector.structure = {
    type: 'Monument',
    bonus_focus: MONUMENT_BASE_FOCUS,
  };
  return true;
}

/**
 * Calculates circular distance on a 1D ring of RING_SIZE (32)
 */
export function ring_distance(idxA: number, idxB: number): number {
  const diff = Math.abs(idxA - idxB);
  return Math.min(diff, RING_SIZE - diff);
}

/**
 * Evaluates the resource yield of a tile based on its element tiers, aspects, and sector soil
 */
export function evaluate_tile_yield(tile: TileState, soil: SoilType): ResourceLedger {
  // [Water, Earth, Fire, Air]
  const [water, earth, fire, air] = tile.tiers;

  // Base yields from tiers
  let baseFood = water * 2.5 + earth * 1.5;
  let baseEnergy = fire * 2.0 + air * 1.5;
  let baseMaterial = earth * 2.0 + fire * 1.0;

  // Aspect modifiers
  for (const aspect of tile.aspect_slots) {
    if (!aspect) continue;
    switch (aspect) {
      case 'LushFlora':
        baseFood += 8;
        baseEnergy += 2;
        break;
      case 'MineralVein':
        baseMaterial += 10;
        baseEnergy += 4;
        break;
      case 'GeothermalVent':
        baseEnergy += 12;
        baseMaterial += 2;
        break;
      case 'BreezeAura':
        baseFood += 3;
        baseEnergy += 3;
        baseMaterial += 3;
        break;
      case 'CrystalSpire':
        baseMaterial += 6;
        baseEnergy += 6;
        break;
      case 'SlimeNodule':
        baseFood += 5;
        baseMaterial += 5;
        break;
    }
  }

  // Soil multipliers
  let soilMultFood = 1.0;
  let soilMultEnergy = 1.0;
  let soilMultMaterial = 1.0;

  switch (soil) {
    case 'BarrenRock':
      soilMultFood = 0.5;
      soilMultMaterial = 1.2;
      soilMultEnergy = 0.8;
      break;
    case 'Clay':
      soilMultFood = 1.0;
      soilMultEnergy = 1.0;
      soilMultMaterial = 1.0;
      break;
    case 'FertileLoam':
      soilMultFood = 2.0;
      soilMultEnergy = 1.2;
      soilMultMaterial = 1.0;
      break;
    case 'VolcanicAsh':
      soilMultFood = 0.2;
      soilMultEnergy = 2.5;
      soilMultMaterial = 1.8;
      break;
  }

  return {
    food: Math.round(baseFood * soilMultFood),
    energy: Math.round(baseEnergy * soilMultEnergy),
    material: Math.round(baseMaterial * soilMultMaterial),
  };
}

/**
 * Calculates a scan score for a tile based on settlement demand profile and distance
 */
export function calculate_scan_score(
  tileYield: ResourceLedger,
  demand_profile: ResourceLedger,
  distance: number,
  max_radius: number,
): number {
  if (distance > max_radius) {
    return -Infinity;
  }

  const matchScore =
    tileYield.food * demand_profile.food +
    tileYield.energy * demand_profile.energy +
    tileYield.material * demand_profile.material;

  const distancePenalty = distance * 2.0;
  return matchScore - distancePenalty;
}

/**
 * ADR 002 Harvest Target Selection
 */
export function select_harvest_target(
  settlement_tile_idx: number,
  scan_radius: number,
  demand_profile: ResourceLedger,
  world: { tiles: TileState[]; sectors: SectorZone[] },
): { target_tile_idx: number; yield: ResourceLedger; score: number } | null {
  let bestTarget: number | null = null;
  let bestScore = -Infinity;
  let bestYield: ResourceLedger = { food: 0, energy: 0, material: 0 };

  for (let idx = 0; idx < RING_SIZE; idx++) {
    const dist = ring_distance(settlement_tile_idx, idx);
    if (dist > scan_radius) continue;

    const sectorIdx = Math.floor(idx / TILES_PER_SECTOR);
    const sector = world.sectors[sectorIdx];
    const tile = world.tiles[idx];
    const tileYield = evaluate_tile_yield(tile, sector.soil_profile);
    const score = calculate_scan_score(tileYield, demand_profile, dist, scan_radius);

    if (score > bestScore) {
      bestScore = score;
      bestTarget = idx;
      bestYield = tileYield;
    }
  }

  if (bestTarget === null || bestScore === -Infinity) {
    return null;
  }

  return {
    target_tile_idx: bestTarget,
    yield: bestYield,
    score: bestScore,
  };
}

/**
 * Helper to generate initial world state
 */
export function create_initial_world(): WorldState {
  const tiles: TileState[] = [];
  const sectors: SectorZone[] = [];

  // Initialize 32 tiles
  for (let i = 0; i < RING_SIZE; i++) {
    const sectorId = Math.floor(i / TILES_PER_SECTOR);
    
    // Preset some thematic aspect distributions for rich gameplay
    let aspects: [AspectId | null, AspectId | null, AspectId | null, AspectId | null] = [
      null,
      null,
      null,
      null,
    ];
    let tiers: [number, number, number, number] = [
      clampTier(1),
      clampTier(1),
      clampTier(1),
      clampTier(1),
    ];

    if (i === 2) {
      aspects[0] = 'LushFlora';
      tiers = [clampTier(3), clampTier(2), clampTier(0), clampTier(1)];
    } else if (i === 5) {
      aspects[0] = 'MineralVein';
      tiers = [clampTier(0), clampTier(3), clampTier(2), clampTier(0)];
    } else if (i === 12) {
      aspects[0] = 'GeothermalVent';
      tiers = [clampTier(0), clampTier(1), clampTier(4), clampTier(1)];
    } else if (i === 18) {
      aspects[0] = 'CrystalSpire';
      tiers = [clampTier(1), clampTier(3), clampTier(1), clampTier(2)];
    } else if (i === 25) {
      aspects[0] = 'BreezeAura';
      tiers = [clampTier(2), clampTier(1), clampTier(0), clampTier(3)];
    } else if (i === 29) {
      aspects[0] = 'SlimeNodule';
      tiers = [clampTier(2), clampTier(2), clampTier(1), clampTier(1)];
    }

    tiles.push({
      tiers,
      resistances: [1, 1, 1, 1],
      aspect_slots: aspects,
      ticks_stable: i === 2 || i === 0 || i === 1 || i === 3 ? 15 : 0, // Starting near stability for Sector 0
    });
  }

  // Initialize 8 sectors
  for (let s = 0; s < NUM_SECTORS; s++) {
    const startTile = s * TILES_PER_SECTOR;
    let initialSoil: SoilType = 'BarrenRock';
    if (s === 2) initialSoil = 'VolcanicAsh';
    if (s === 4) initialSoil = 'Clay';

    sectors.push({
      sector_id: s,
      soil_profile: initialSoil,
      structure: { type: 'None' },
      tile_indices: [startTile, startTile + 1, startTile + 2, startTile + 3] as [
        number,
        number,
        number,
        number,
      ],
    });
  }

  const initialLogs: GameLogEvent[] = [
    {
      id: 'init-1',
      tick: 0,
      type: 'info',
      message: 'Planetary 32-tile Ring initialized with 8 SectorZones.',
    },
    {
      id: 'init-2',
      tick: 0,
      type: 'info',
      message: 'Settlement "Apex Core" founded at Tile 0. Harvest scan radius: 4 tiles.',
    },
  ];

  return {
    tiles,
    sectors,
    current_tick: 0,
    settlement_ledger: {
      food: 25,
      energy: 20,
      material: 35,
    },
    settlement: {
      id: 'settlement_0',
      name: 'Apex Core',
      tile_index: 0,
      scan_radius: 4,
      demand_profile: { food: 5, energy: 2, material: 3 },
      last_harvest_target: null,
      last_harvest_yield: null,
    },
    logs: initialLogs,
  };
}

/**
 * Resolves one simulation tick
 */
export function resolve_tick(
  world: WorldState,
  tierDeltas?: Map<number, [number, number, number, number]>,
): WorldState {
  const newTick = world.current_tick + 1;
  const newLogs: GameLogEvent[] = [...world.logs];

  // Helper to add log
  const logEvent = (
    type: GameLogEvent['type'],
    message: string,
    sector_id?: number,
    tile_id?: number,
  ) => {
    newLogs.unshift({
      id: `log-${newTick}-${Math.random().toString(36).substring(2, 7)}`,
      tick: newTick,
      type,
      message,
      sector_id,
      tile_id,
    });
    if (newLogs.length > 50) newLogs.pop();
  };

  // 1. Update Tile Tiers & Stability
  const newTiles: TileState[] = world.tiles.map((tile, idx) => {
    const delta = tierDeltas?.get(idx);
    if (delta) {
      // Tiers changed! Reset ticks_stable to 0
      const newTiers: [number, number, number, number] = [
        clampTier(tile.tiers[0] + delta[0]),
        clampTier(tile.tiers[1] + delta[1]),
        clampTier(tile.tiers[2] + delta[2]),
        clampTier(tile.tiers[3] + delta[3]),
      ];
      logEvent('perturbation', `Tile ${idx} elemental tiers perturbed! Stability reset to 0.`, Math.floor(idx / 4), idx);
      return {
        ...tile,
        tiers: newTiers,
        ticks_stable: 0,
      };
    } else {
      // Unchanged this tick -> increment ticks_stable
      return {
        ...tile,
        ticks_stable: tile.ticks_stable + 1,
      };
    }
  });

  // 2. Sector Soil Stability Pass
  const newSectors: SectorZone[] = world.sectors.map((sector) => {
    const sectorCopy: SectorZone = {
      ...sector,
      tile_indices: [...sector.tile_indices] as [number, number, number, number],
      structure: { ...sector.structure },
    };

    const prevSoil = sectorCopy.soil_profile;
    const upgraded = update_sector_soil(sectorCopy, newTiles);

    if (upgraded) {
      logEvent(
        'soil_upgrade',
        `🌟 Sector ${sectorCopy.sector_id} upgraded soil from ${prevSoil} → ${sectorCopy.soil_profile} (all 4 tiles held stable ≥ ${SOIL_STABILITY_TICKS} ticks)!`,
        sectorCopy.sector_id,
      );
    }

    return sectorCopy;
  });

  // 3. Settlement Harvest Cycle
  let newLedger: ResourceLedger = { ...world.settlement_ledger };
  let newSettlement = { ...world.settlement };

  // Settlement harvests every tick or periodic
  const harvestResult = select_harvest_target(
    world.settlement.tile_index,
    world.settlement.scan_radius,
    world.settlement.demand_profile,
    { tiles: newTiles, sectors: newSectors },
  );

  if (harvestResult) {
    newLedger.food += harvestResult.yield.food;
    newLedger.energy += harvestResult.yield.energy;
    newLedger.material += harvestResult.yield.material;

    newSettlement.last_harvest_target = harvestResult.target_tile_idx;
    newSettlement.last_harvest_yield = harvestResult.yield;

    if (newTick % 5 === 0) {
      logEvent(
        'harvest',
        `🌾 Settlement harvested Tile ${harvestResult.target_tile_idx} (+${harvestResult.yield.food}F, +${harvestResult.yield.energy}E, +${harvestResult.yield.material}M, Score: ${harvestResult.score.toFixed(1)}).`,
        Math.floor(harvestResult.target_tile_idx / 4),
        harvestResult.target_tile_idx,
      );
    }
  }

  return {
    tiles: newTiles,
    sectors: newSectors,
    current_tick: newTick,
    settlement_ledger: newLedger,
    settlement: newSettlement,
    logs: newLogs,
  };
}
