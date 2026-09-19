/**
 * Project "Systemic Extract" - Two-Tier Dual Map Architecture
 * 1. The Overworld: The Sanctuary Area (NO enemies, 4 Cardinal Dungeon Deployment Zones,
 *    4 Corner Specialist Buildings, and Player Home at Center).
 * 2. The Dungeons: 4 Enemy and Treasure Occupied Procedural/Prefab Expedition Maps
 *    (NW: Robotics, NE: Bio-Containment, SW: Foundry, SE: Reality Tear).
 */

import { World } from './ecs';
import {
  EntityId,
  GridPosition,
  HazardState,
  Faction,
  TileState,
  ZoneType,
  MapType,
  DungeonZoneId,
  ITEM_DEFINITIONS,
  SectorId,
  BiomeProfile,
  ResidentId,
} from '../types';
import { BIOME_PROFILES } from '../backend/item-registry';
import { RESIDENT_DEFINITIONS } from './blueprints';

export const MAP_WIDTH = 200;
export const MAP_HEIGHT = 200;

export const SANCTUARY_BOUNDS = {
  minX: 64,
  maxX: 136,
  minY: 64,
  maxY: 136,
  coreX: 100,
  coreY: 100,
};

export interface MapData {
  tiles: TileState[][];
  playerStart: GridPosition;
  sanctuaryBounds: typeof SANCTUARY_BOUNDS;
  playerEntityId: EntityId;
  sanctuaryCoreEntityId: EntityId;
  biomeProfile: BiomeProfile;
  rooms: PrefabRoom[];
  residentEntityIds: EntityId[];
  mapType: MapType;
  dungeonId?: DungeonZoneId;
}

export type RoomType =
  | 'sanctuary'
  | 'player_home'
  | 'engineer_workshop'
  | 'biologist_lab'
  | 'armorer_forge'
  | 'architect_observatory'
  | 'dungeon_gate'
  | 'logistics_bay'
  | 'server_partition'
  | 'assembly_line'
  | 'biolab'
  | 'hazard_containment'
  | 'mutagen_incubator'
  | 'armory_annex'
  | 'thermal_foundry'
  | 'generator_lab'
  | 'apex_vault'
  | 'void_rift'
  | 'resonance_well'
  | 'corridor_hub'
  | 'extraction_bay';

export interface PrefabRoom {
  id: number;
  type: RoomType;
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
  name: string;
  quadrant?: 'HUB' | 'NW' | 'NE' | 'SW' | 'SE';
}

// ============================================================================
// SHARED SPAWNER UTILITIES
// ============================================================================
function createEmptyGrid(): TileState[][] {
  const tiles: TileState[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: TileState[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({
        x,
        y,
        hazard: HazardState.None,
        hazardTimer: 0,
        hazardIntensity: 0,
        isFlammable: false,
        wallEntityId: null,
        lootEntityId: null,
        isExtraction: false,
        zoneType: 'overworld',
      });
    }
    tiles.push(row);
  }
  return tiles;
}

function spawnBulkhead(world: World, tiles: TileState[][], x: number, y: number, color: string = '#1e293b') {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
  if (tiles[y][x].wallEntityId !== null) return;
  const id = world.spawn('ReinforcedWall');
  world.gridPositions.set(id, { x, y });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: color,
  });
  tiles[y][x].wallEntityId = id;
  tiles[y][x].isFlammable = false;
}

function spawnBiomass(world: World, tiles: TileState[][], x: number, y: number, color: string = '#15803d') {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
  if (tiles[y][x].wallEntityId !== null) return;
  const id = world.spawn('DestructibleWall');
  world.gridPositions.set(id, { x, y });
  world.healths.set(id, { current: 50, max: 50 });
  world.flammables.set(id, {
    ignition_threshold: 0.5,
    burn_rate: 10.0,
    is_burning: false,
    fire_timer: 0,
  });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: color,
  });
  tiles[y][x].wallEntityId = id;
  tiles[y][x].isFlammable = true;
}

function spawnScrap(world: World, tiles: TileState[][], x: number, y: number) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
  if (tiles[y][x].wallEntityId !== null || tiles[y][x].lootEntityId !== null) return;
  const id = world.spawn('ScrapPile');
  world.gridPositions.set(id, { x, y });
  world.loots.set(id, {
    itemId: 'scrap_matter',
    itemName: 'Inert Scrap Matter',
    collected: false,
  });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: '#f59e0b',
  });
  tiles[y][x].lootEntityId = id;
}

function spawnLoot(world: World, tiles: TileState[][], x: number, y: number, itemId: string, itemName?: string) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
  if (tiles[y][x].wallEntityId !== null || tiles[y][x].lootEntityId !== null) return;
  const itemDef = ITEM_DEFINITIONS[itemId];
  const resolvedName = itemName || itemDef?.name || itemId;
  const id = world.spawn('LootCrate');
  world.gridPositions.set(id, { x, y });
  world.loots.set(id, {
    itemId,
    itemName: resolvedName,
    collected: false,
  });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: '#a855f7',
  });
  tiles[y][x].lootEntityId = id;
}

function spawnPatrol(world: World, x: number, y: number, patrolPoints: GridPosition[]) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
  const id = world.spawn('Security');
  world.gridPositions.set(id, { x, y });
  world.transforms.set(id, { x, y, vx: 0, vy: 0, radius: 0.28 });
  world.healths.set(id, { current: 40, max: 40 });
  world.factions.set(id, Faction.Security);
  world.aiComponents.set(id, {
    state: 'patrol',
    patrolRoute: patrolPoints.length > 0 ? patrolPoints : [{ x, y }],
    currentRouteIndex: 0,
    attackCooldown: 0,
    visionRange: 7.0,
    lastKnownPlayerPos: null,
    alertTimer: 0,
  });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: '#ef4444',
  });
  world.resistances.set(id, {
    kineticMult: 0.8,
    plasmaMult: 1.5,
    armor: 5,
  });
}

function spawnCrawlerEnemy(world: World, x: number, y: number) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
  const id = world.spawn('Crawler');
  world.gridPositions.set(id, { x, y });
  world.transforms.set(id, { x, y, vx: 0, vy: 0, radius: 0.26 });
  world.healths.set(id, { current: 18, max: 18 });
  world.factions.set(id, Faction.Security);
  world.aiComponents.set(id, {
    state: 'patrol',
    patrolRoute: [{ x, y }],
    currentRouteIndex: 0,
    attackCooldown: 0,
    visionRange: 6.0,
    lastKnownPlayerPos: null,
    alertTimer: 0,
  });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: '#d97706',
  });
  world.resistances.set(id, {
    kineticMult: 1.4,
    plasmaMult: 0.7,
    armor: 0,
  });
}

function spawnHiveEnemy(world: World, x: number, y: number) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
  const id = world.spawn('HiveBlob');
  world.gridPositions.set(id, { x, y });
  world.transforms.set(id, { x, y, vx: 0, vy: 0, radius: 0.45 });
  world.healths.set(id, { current: 75, max: 75 });
  world.factions.set(id, Faction.Security);
  world.flammables.set(id, {
    ignition_threshold: 0.3,
    burn_rate: 15.0,
    is_burning: false,
    fire_timer: 0,
  });
  world.spawners.set(id, {
    spawnTimer: 0,
    spawnInterval: 6.0,
    maxActive: 3,
    activeSpawnIds: [],
  });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: '#84cc16',
  });
  world.resistances.set(id, {
    kineticMult: 1.6,
    plasmaMult: 0.6,
    armor: 0,
  });
}

function spawnApexBoss(world: World, x: number, y: number) {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
  const id = world.spawn('ApexEcho');
  world.gridPositions.set(id, { x, y });
  world.transforms.set(id, { x, y, vx: 0, vy: 0, radius: 0.65 });
  world.healths.set(id, { current: 240, max: 240 });
  world.factions.set(id, Faction.Security);
  world.aiComponents.set(id, {
    state: 'patrol',
    patrolRoute: [{ x, y }, { x: x + 4, y }, { x: x + 4, y: y + 4 }, { x, y: y + 4 }],
    currentRouteIndex: 0,
    attackCooldown: 0,
    visionRange: 10.0,
    lastKnownPlayerPos: null,
    alertTimer: 0,
  });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: '#dc2626',
  });
  world.resistances.set(id, {
    kineticMult: 0.6,
    plasmaMult: 1.6,
    armor: 12,
  });
}

function spawnResidentSpecialist(world: World, residentId: ResidentId, x: number, y: number): EntityId {
  const def = RESIDENT_DEFINITIONS[residentId];
  const id = world.spawn('Resident');
  world.gridPositions.set(id, { x, y });
  world.transforms.set(id, { x, y, vx: 0, vy: 0, radius: 0.28 });
  world.healths.set(id, { current: 150, max: 150 });
  world.residents.set(id, {
    residentId,
    name: def.name,
    title: def.title,
    roleDescription: def.roleDescription,
    color: def.color,
    quadrant: def.quadrant,
    isRescued: true, // In Overworld Sanctuary, specialists reside in their dedicated Corner Buildings!
    isFollowing: false,
    unlockedStructureId: def.unlockedStructureId,
    homeX: x,
    homeY: y,
  });
  world.visuals.set(id, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: def.color,
  });
  return id;
}

function spawnPlayerOperative(world: World, x: number, y: number): EntityId {
  const playerEntityId = world.spawn('Player');
  world.gridPositions.set(playerEntityId, { x, y });
  world.transforms.set(playerEntityId, {
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 0.28,
  });
  world.healths.set(playerEntityId, { current: 100, max: 100 });
  world.factions.set(playerEntityId, Faction.Player);
  world.visuals.set(playerEntityId, {
    renderX: x,
    renderY: y,
    facingAngle: 0,
    flashTime: 0,
  });
  world.weapons.set(playerEntityId, {
    weaponId: 'kinetic_scattergun',
    name: 'Kinetic Scattergun',
    element: 'kinetic',
    damage: 16,
    fireRate: 2.8,
    range: 7.5,
    projectileSpeed: 15.0,
    cooldownTimer: 0,
    piercing: false,
    knockback: 0.9,
  });
  return playerEntityId;
}

// ============================================================================
// MAP TYPE 1: OVERWORLD (THE SANCTUARY AREA - NO ENEMIES)
// ============================================================================
export function createOverworldMap(
  world: World,
  _initialDisruptors: number = 1,
  _initialMedkits: number = 1
): MapData {
  world.clear();
  const tiles = createEmptyGrid();
  const carvedFloors = new Set<string>();

  const markFloor = (x: number, y: number) => {
    if (x < 1 || x >= MAP_WIDTH - 1 || y < 1 || y >= MAP_HEIGHT - 1) return;
    carvedFloors.add(`${x},${y}`);
    if (tiles[y]?.[x]) {
      tiles[y][x].zoneType = 'sanctuary';
    }
  };

  const carveRoom = (rx: number, ry: number, rw: number, rh: number) => {
    for (let cy = ry; cy < ry + rh; cy++) {
      for (let cx = rx; cx < rx + rw; cx++) {
        markFloor(cx, cy);
      }
    }
  };

  const carveAvenue = (x1: number, y1: number, x2: number, y2: number, width: number = 4) => {
    const halfW = Math.floor(width / 2);
    let curX = x1;
    let curY = y1;
    while (curX !== x2) {
      for (let w = -halfW; w <= halfW; w++) markFloor(curX, curY + w);
      curX += curX < x2 ? 1 : -1;
    }
    while (curY !== y2) {
      for (let w = -halfW; w <= halfW; w++) markFloor(curX + w, curY);
      curY += curY < y2 ? 1 : -1;
    }
    for (let w = -halfW; w <= halfW; w++) {
      markFloor(x2 + w, y2);
      markFloor(x2, y2 + w);
    }
  };

  // 1. Carve Broad Central Sanctuary Plaza (68..132, 68..132)
  carveRoom(68, 68, 65, 65);

  // 2. PLAYER HOME AT CENTER (93..107, 93..107, center 100, 100)
  const homeRoom: PrefabRoom = {
    id: 1,
    type: 'player_home',
    x: 93,
    y: 93,
    w: 15,
    h: 15,
    centerX: 100,
    centerY: 100,
    name: 'Operative Home & Sanctuary Core',
    quadrant: 'HUB',
  };

  // Tag Player Home tiles
  for (let hy = 93; hy <= 107; hy++) {
    for (let hx = 93; hx <= 107; hx++) {
      if (tiles[hy]?.[hx]) {
        tiles[hy][hx].isPlayerHome = true;
        tiles[hy][hx].zoneType = 'sanctuary';
      }
    }
  }

  // 3. 4 CORNER BUILDINGS
  // NW Corner: Robotics & Logistics Engineering Facility (Dr. Frank Vance)
  const nwBuilding: PrefabRoom = {
    id: 2,
    type: 'engineer_workshop',
    x: 74,
    y: 74,
    w: 16,
    h: 16,
    centerX: 82,
    centerY: 82,
    name: 'NW Workshop: Munitions Engineering',
    quadrant: 'NW',
  };
  // NE Corner: Hydroponic Bio-Containment Lab (Dr. Elena Rostova)
  const neBuilding: PrefabRoom = {
    id: 3,
    type: 'biologist_lab',
    x: 110,
    y: 74,
    w: 16,
    h: 16,
    centerX: 118,
    centerY: 82,
    name: 'NE Facility: Hydroponic Bio-Lab',
    quadrant: 'NE',
  };
  // SW Corner: Tactical Munitions Forge & Armory (Sgt. Marcus Kane)
  const swBuilding: PrefabRoom = {
    id: 4,
    type: 'armorer_forge',
    x: 74,
    y: 110,
    w: 16,
    h: 16,
    centerX: 82,
    centerY: 118,
    name: 'SW Bastion: Tactical Munitions Forge',
    quadrant: 'SW',
  };
  // SE Corner: Resonance Anchor & Reality Observatory (Dr. Aris Thorne)
  const seBuilding: PrefabRoom = {
    id: 5,
    type: 'architect_observatory',
    x: 110,
    y: 110,
    w: 16,
    h: 16,
    centerX: 118,
    centerY: 118,
    name: 'SE Observatory: Dimensional Relay',
    quadrant: 'SE',
  };

  // 4. CARDINAL DIRECTION DUNGEON ZONES / GATES
  // NORTH Gate (Dungeon I: Robotics & Logistics)
  const northGate: PrefabRoom = {
    id: 6,
    type: 'dungeon_gate',
    x: 94,
    y: 64,
    w: 13,
    h: 8,
    centerX: 100,
    centerY: 68,
    name: 'NORTH GATE: Dungeon I (Robotics Sector)',
    quadrant: 'NW',
  };
  // EAST Gate (Dungeon II: Bio-Containment Labs)
  const eastGate: PrefabRoom = {
    id: 7,
    type: 'dungeon_gate',
    x: 128,
    y: 94,
    w: 8,
    h: 13,
    centerX: 132,
    centerY: 100,
    name: 'EAST GATE: Dungeon II (Bio-Containment)',
    quadrant: 'NE',
  };
  // SOUTH Gate (Dungeon III: Volatile Foundry)
  const southGate: PrefabRoom = {
    id: 8,
    type: 'dungeon_gate',
    x: 94,
    y: 128,
    w: 13,
    h: 8,
    centerX: 100,
    centerY: 132,
    name: 'SOUTH GATE: Dungeon III (Volatile Foundry)',
    quadrant: 'SW',
  };
  // WEST Gate (Dungeon IV: The Reality Tear)
  const westGate: PrefabRoom = {
    id: 9,
    type: 'dungeon_gate',
    x: 64,
    y: 94,
    w: 8,
    h: 13,
    centerX: 68,
    centerY: 100,
    name: 'WEST GATE: Dungeon IV (The Reality Tear)',
    quadrant: 'SE',
  };

  // Carve paved avenues connecting center to gates and corners
  carveAvenue(100, 100, 100, 68, 6); // Center to North Gate
  carveAvenue(100, 100, 100, 132, 6); // Center to South Gate
  carveAvenue(100, 100, 132, 100, 6); // Center to East Gate
  carveAvenue(100, 100, 68, 100, 6); // Center to West Gate
  carveAvenue(100, 100, 82, 82, 4); // Center to NW Corner
  carveAvenue(100, 100, 118, 82, 4); // Center to NE Corner
  carveAvenue(100, 100, 82, 118, 4); // Center to SW Corner
  carveAvenue(100, 100, 118, 118, 4); // Center to SE Corner

  // Tag Dungeon Gate Entrance Pads
  const tagGatePad = (
    centerX: number,
    centerY: number,
    dungeonId: DungeonZoneId,
    dungeonName: string
  ) => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = centerX + dx;
        const ty = centerY + dy;
        if (tiles[ty]?.[tx]) {
          tiles[ty][tx].zoneType = 'overworld';
          tiles[ty][tx].isDungeonEntrance = true;
          tiles[ty][tx].dungeonTargetId = dungeonId;
          tiles[ty][tx].dungeonId = dungeonId;
          tiles[ty][tx].dungeonName = dungeonName;
        }
      }
    }
  };

  tagGatePad(100, 68, 'nw_robotics', 'Dungeon I: Robotics Labs');
  tagGatePad(132, 100, 'ne_biolab', 'Dungeon II: Bio-Containment Labs');
  tagGatePad(100, 132, 'sw_foundry', 'Dungeon III: Volatile Foundry');
  tagGatePad(68, 100, 'se_void', 'Dungeon IV: The Reality Tear');

  // Build Sanctuary Exterior Enclosure Bulkheads (Enclosing the Sanctuary safe haven)
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      // Outside sanctuary bounds is indestructible solid perimeter
      if (x < 62 || x > 138 || y < 62 || y > 138) {
        spawnBulkhead(world, tiles, x, y, '#0b1320');
        continue;
      }
      if (!carvedFloors.has(`${x},${y}`)) {
        spawnBulkhead(world, tiles, x, y, '#1e293b');
      }
    }
  }

  // Build Internal Home Walls with open archways
  for (let x = 93; x <= 107; x++) {
    if (x < 98 || x > 102) {
      spawnBulkhead(world, tiles, x, 93, '#0284c7');
      spawnBulkhead(world, tiles, x, 107, '#0284c7');
    }
  }
  for (let y = 93; y <= 107; y++) {
    if (y < 98 || y > 102) {
      spawnBulkhead(world, tiles, 93, y, '#0284c7');
      spawnBulkhead(world, tiles, 107, y, '#0284c7');
    }
  }

  // Spawn Sanctuary Core at (100, 100)
  const sanctuaryCoreEntityId = world.spawn('SanctuaryCore');
  world.gridPositions.set(sanctuaryCoreEntityId, { x: 100, y: 100 });
  world.visuals.set(sanctuaryCoreEntityId, {
    renderX: 100,
    renderY: 100,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: '#38bdf8',
  });

  // Spawn Player Operative at Player Home (100, 103)
  const playerEntityId = spawnPlayerOperative(world, 100, 103);

  // Spawn the 4 Specialists in their respective Corner Buildings
  const residentEntityIds: EntityId[] = [];
  residentEntityIds.push(spawnResidentSpecialist(world, 'engineer', 82, 82));
  residentEntityIds.push(spawnResidentSpecialist(world, 'biologist', 118, 82));
  residentEntityIds.push(spawnResidentSpecialist(world, 'armorer', 82, 118));
  residentEntityIds.push(spawnResidentSpecialist(world, 'architect', 118, 118));

  // Safe Scrap testing caches in Sanctuary (NO ENEMIES!)
  spawnScrap(world, tiles, 96, 96);
  spawnScrap(world, tiles, 104, 96);
  spawnScrap(world, tiles, 96, 104);
  spawnScrap(world, tiles, 104, 104);

  const rooms: PrefabRoom[] = [
    homeRoom,
    nwBuilding,
    neBuilding,
    swBuilding,
    seBuilding,
    northGate,
    eastGate,
    southGate,
    westGate,
  ];

  return {
    tiles,
    playerStart: { x: 100, y: 103 },
    sanctuaryBounds: SANCTUARY_BOUNDS,
    playerEntityId,
    sanctuaryCoreEntityId,
    biomeProfile: BIOME_PROFILES.sector_01,
    rooms,
    residentEntityIds,
    mapType: 'overworld',
  };
}

// ============================================================================
// MAP TYPE 2: DUNGEON EXPEDITION (ENEMY & TREASURE OCCUPIED GENERATION)
// ============================================================================
export function createDungeonMap(
  world: World,
  dungeonId: DungeonZoneId = 'nw_robotics',
  _initialDisruptors: number = 1,
  _initialMedkits: number = 1
): MapData {
  world.clear();
  const tiles = createEmptyGrid();
  const carvedFloors = new Set<string>();

  // Map Dungeon ID to Sector Biome Profile
  const sectorMap: Record<DungeonZoneId, SectorId> = {
    nw_robotics: 'sector_01',
    ne_biolab: 'sector_02',
    sw_foundry: 'sector_01',
    se_void: 'sector_02',
  };
  const sectorId = sectorMap[dungeonId] || 'sector_01';
  const biome = BIOME_PROFILES[sectorId] || BIOME_PROFILES.sector_01;

  const markFloor = (x: number, y: number) => {
    if (x < 1 || x >= MAP_WIDTH - 1 || y < 1 || y >= MAP_HEIGHT - 1) return;
    carvedFloors.add(`${x},${y}`);
    if (tiles[y]?.[x]) {
      tiles[y][x].zoneType = 'dungeon';
      tiles[y][x].dungeonId = dungeonId;
      tiles[y][x].dungeonName = biome.name;
    }
  };

  const carveRoom = (rx: number, ry: number, rw: number, rh: number) => {
    for (let cy = ry; cy < ry + rh; cy++) {
      for (let cx = rx; cx < rx + rw; cx++) {
        markFloor(cx, cy);
      }
    }
  };

  const carveCorridor = (x1: number, y1: number, x2: number, y2: number, width: number = 3) => {
    const halfW = Math.floor(width / 2);
    let curX = x1;
    let curY = y1;
    while (curX !== x2) {
      for (let w = -halfW; w <= halfW; w++) markFloor(curX, curY + w);
      curX += curX < x2 ? 1 : -1;
    }
    while (curY !== y2) {
      for (let w = -halfW; w <= halfW; w++) markFloor(curX + w, curY);
      curY += curY < y2 ? 1 : -1;
    }
    for (let w = -halfW; w <= halfW; w++) {
      markFloor(x2 + w, y2);
      markFloor(x2, y2 + w);
    }
  };

  // Helper for random loot from pool
  const getRandomLoot = (): string => {
    const pool = biome.primaryLootPool;
    const total = pool.reduce((acc, p) => acc + p.weight, 0);
    let rand = Math.random() * total;
    for (const e of pool) {
      if (rand < e.weight) return e.itemId;
      rand -= e.weight;
    }
    return pool[0]?.itemId || 'scrap_matter';
  };

  // Procedural Dungeon Room Schemas (Centered around 100, 100 for high-density navigation)
  let idGen = 1;
  const rooms: PrefabRoom[] = [
    { id: idGen++, type: 'extraction_bay', x: 92, y: 92, w: 16, h: 16, centerX: 100, centerY: 100, name: 'Insertion Airlock & Extraction Pad' },
    { id: idGen++, type: 'logistics_bay', x: 68, y: 72, w: 16, h: 14, centerX: 76, centerY: 79, name: `${biome.name} - Vault Alpha` },
    { id: idGen++, type: 'server_partition', x: 116, y: 72, w: 16, h: 14, centerX: 124, centerY: 79, name: `${biome.name} - Testing Annex` },
    { id: idGen++, type: 'assembly_line', x: 68, y: 114, w: 16, h: 14, centerX: 76, centerY: 121, name: `${biome.name} - Depository Beta` },
    { id: idGen++, type: 'generator_lab', x: 116, y: 114, w: 16, h: 14, centerX: 124, centerY: 121, name: `${biome.name} - Power Conduits` },
    { id: idGen++, type: 'apex_vault', x: 90, y: 52, w: 20, h: 16, centerX: 100, centerY: 60, name: `${biome.name} - Apex Deep Sanctum` },
    { id: idGen++, type: 'armory_annex', x: 90, y: 132, w: 20, h: 16, centerX: 100, centerY: 140, name: `${biome.name} - Heavy Cargo Stash` },
    { id: idGen++, type: 'corridor_hub', x: 48, y: 92, w: 14, h: 16, centerX: 55, centerY: 100, name: `${biome.name} - West Flank Duct` },
    { id: idGen++, type: 'corridor_hub', x: 138, y: 92, w: 14, h: 16, centerX: 145, centerY: 100, name: `${biome.name} - East Sluice Bypass` },
  ];

  // Carve Rooms
  for (const r of rooms) {
    carveRoom(r.x, r.y, r.w, r.h);
  }

  // Carve Connecting Arteries & Flanking Loops
  carveCorridor(100, 100, 100, 60, 4); // Center to North Apex
  carveCorridor(100, 100, 100, 140, 4); // Center to South Stash
  carveCorridor(100, 100, 55, 100, 4); // Center to West Flank
  carveCorridor(100, 100, 145, 100, 4); // Center to East Sluice
  carveCorridor(76, 79, 100, 60, 3);
  carveCorridor(124, 79, 100, 60, 3);
  carveCorridor(76, 121, 100, 140, 3);
  carveCorridor(124, 121, 100, 140, 3);
  carveCorridor(55, 100, 76, 79, 3);
  carveCorridor(55, 100, 76, 121, 3);
  carveCorridor(145, 100, 124, 79, 3);
  carveCorridor(145, 100, 124, 121, 3);

  // Mark Extraction Zone Pad inside Insertion / Extraction Bay (98..102, 98..102)
  for (let ey = 98; ey <= 102; ey++) {
    for (let ex = 98; ex <= 102; ex++) {
      if (tiles[ey]?.[ex]) {
        tiles[ey][ex].isExtraction = true;
      }
    }
  }

  // Construct Perimeter and Internal Solid Bulkheads
  const wallColor = biome.palette.wallColor;
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x < 40 || x > 160 || y < 40 || y > 160) {
        spawnBulkhead(world, tiles, x, y, '#0a0f18');
        continue;
      }
      if (!carvedFloors.has(`${x},${y}`)) {
        spawnBulkhead(world, tiles, x, y, wallColor);
      }
    }
  }

  // Spawn Destructible Biomass/Wooden partitions guarding vaults
  const partitionColor = biome.palette.partitionColor;
  spawnBiomass(world, tiles, 76, 70, partitionColor);
  spawnBiomass(world, tiles, 124, 70, partitionColor);
  spawnBiomass(world, tiles, 76, 130, partitionColor);
  spawnBiomass(world, tiles, 124, 130, partitionColor);
  spawnBiomass(world, tiles, 100, 69, partitionColor);
  spawnBiomass(world, tiles, 100, 131, partitionColor);

  // POPULATE TREASURES (Scrap Piles & Ontological Salvage Caches)
  for (const r of rooms) {
    if (r.type === 'extraction_bay') {
      spawnScrap(world, tiles, r.centerX - 3, r.centerY - 3);
      spawnScrap(world, tiles, r.centerX + 3, r.centerY + 3);
      continue;
    }
    // Multiple Scrap Piles per room
    spawnScrap(world, tiles, r.centerX - 2, r.centerY - 2);
    spawnScrap(world, tiles, r.centerX + 2, r.centerY + 2);
    spawnScrap(world, tiles, r.centerX - 3, r.centerY + 1);
    spawnScrap(world, tiles, r.centerX + 3, r.centerY - 1);

    // High-value Loot Crates
    spawnLoot(world, tiles, r.centerX, r.centerY - 2, getRandomLoot());
    spawnLoot(world, tiles, r.centerX, r.centerY + 2, getRandomLoot());
  }

  // Additional Corridor Treasure Caches
  const extraLootSpots = [
    { x: 88, y: 70 },
    { x: 112, y: 70 },
    { x: 88, y: 130 },
    { x: 112, y: 130 },
    { x: 60, y: 88 },
    { x: 60, y: 112 },
    { x: 140, y: 88 },
    { x: 140, y: 112 },
  ];
  for (const sp of extraLootSpots) {
    if (carvedFloors.has(`${sp.x},${sp.y}`)) {
      spawnScrap(world, tiles, sp.x, sp.y);
      spawnLoot(world, tiles, sp.x + 1, sp.y, getRandomLoot());
    }
  }

  // POPULATE ENEMIES (Themed to Dungeon ID)
  for (const r of rooms) {
    if (r.type === 'extraction_bay') continue; // Insertion airlock is safe

    if (dungeonId === 'nw_robotics') {
      // Robotics Sector: Heavy Patrol Sentries
      spawnPatrol(world, r.centerX, r.centerY, [
        { x: r.centerX - 3, y: r.centerY },
        { x: r.centerX + 3, y: r.centerY },
      ]);
      spawnPatrol(world, r.centerX - 2, r.centerY + 2, [
        { x: r.centerX - 2, y: r.centerY + 2 },
        { x: r.centerX + 2, y: r.centerY - 2 },
      ]);
    } else if (dungeonId === 'ne_biolab') {
      // Bio-Containment: Crawlers and Swarming Hive Blobs
      spawnCrawlerEnemy(world, r.centerX - 2, r.centerY);
      spawnCrawlerEnemy(world, r.centerX + 2, r.centerY);
      spawnHiveEnemy(world, r.centerX, r.centerY + 2);
    } else if (dungeonId === 'sw_foundry') {
      // Volatile Foundry: Armored Sentries and Flame Crawlers
      spawnPatrol(world, r.centerX, r.centerY, [
        { x: r.centerX, y: r.centerY - 3 },
        { x: r.centerX, y: r.centerY + 3 },
      ]);
      spawnCrawlerEnemy(world, r.centerX + 1, r.centerY - 2);
    } else {
      // The Reality Tear: Void Phantoms, Apex Miniboss
      if (r.type === 'apex_vault') {
        spawnApexBoss(world, r.centerX, r.centerY);
      } else {
        spawnPatrol(world, r.centerX, r.centerY, [
          { x: r.centerX - 2, y: r.centerY - 2 },
          { x: r.centerX + 2, y: r.centerY + 2 },
        ]);
        spawnCrawlerEnemy(world, r.centerX - 1, r.centerY + 1);
      }
    }
  }

  // Spawn Player Operative at Insertion Pad (100, 104)
  const playerEntityId = spawnPlayerOperative(world, 100, 104);

  // Sanctuary Core anchor (for dimensional beacon)
  const sanctuaryCoreEntityId = world.spawn('SanctuaryCore');
  world.gridPositions.set(sanctuaryCoreEntityId, { x: 100, y: 100 });
  world.visuals.set(sanctuaryCoreEntityId, {
    renderX: 100,
    renderY: 100,
    facingAngle: 0,
    flashTime: 0,
    colorOverride: '#10b981',
  });

  return {
    tiles,
    playerStart: { x: 100, y: 104 },
    sanctuaryBounds: SANCTUARY_BOUNDS,
    playerEntityId,
    sanctuaryCoreEntityId,
    biomeProfile: biome,
    rooms,
    residentEntityIds: [],
    mapType: 'dungeon',
    dungeonId,
  };
}

// Backward-compatible default entry point
export function createStaticMap(
  world: World,
  initialDisruptors: number = 1,
  initialTraumaPatches: number = 1,
  _sectorId: SectorId = 'sector_01'
): MapData {
  return createOverworldMap(world, initialDisruptors, initialTraumaPatches);
}
