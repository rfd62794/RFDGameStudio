import {
  Asteroid,
  CollisionEventLog,
  Compound,
  CompoundProductItem,
  ContainerSlot,
  Drone,
  ExpeditionShip,
  LoreEntry,
  ModuleBlueprint,
  ModuleType,
  ReconstructionItem,
  SignalBottle,
  SignalKey,
  StationModule,
  StationStats,
  SynthesisRecipe,
} from '../types';
import {
  INITIAL_COMPOUNDS,
  INITIAL_PRODUCTS,
  LORE_ENTRIES,
  MODULE_BLUEPRINTS,
  RECONSTRUCTION_ITEMS,
  SIGNAL_KEYS,
  SYNTHESIS_RECIPES,
} from '../data/recipes';
import { soundEngine } from './audio';

export interface GameState {
  dust: number;
  maxDust: number;
  modules: StationModule[];
  containerSlots: ContainerSlot[];
  asteroids: Asteroid[];
  drones: Drone[];
  compounds: Compound[];
  products: Record<string, CompoundProductItem>;
  recipes: SynthesisRecipe[];
  signalBottles: SignalBottle[];
  signalKeys: SignalKey[];
  loreEntries: LoreEntry[];
  reconstructionItems: ReconstructionItem[];
  ships: ExpeditionShip[];
  collisionLogs: CollisionEventLog[];
  stats: StationStats;
  totalPowerGenerated: number;
  totalPowerConsumed: number;
  isPaused: boolean;
  gameSpeed: number; // 1, 2, 5
  lastTickTimestamp: number;
  activeTab: 'station' | 'synthesis' | 'storage' | 'signals' | 'reconstruction' | 'catalog' | 'lore';
  selectedModuleId: string | null;
  buildingTypeToPlace: ModuleType | null;
  notification: { message: string; type: 'info' | 'warn' | 'success' | 'danger'; timestamp: number } | null;
}

const STORAGE_KEY = 'voidrift_redux_save_v1';

export function createInitialGameState(): GameState {
  const initialModules: StationModule[] = [
    {
      id: 'mod_bay_1',
      type: 'drone_bay',
      x: 0,
      y: 0,
      level: 1,
      health: 100,
      maxHealth: 100,
      isPowered: true,
      efficiency: 1.0,
      assignedDroneCount: 2,
    },
    {
      id: 'mod_proc_1',
      type: 'processing_chamber',
      x: 1,
      y: 0,
      level: 1,
      health: 120,
      maxHealth: 120,
      isPowered: true,
      efficiency: 1.0,
      activeRecipeId: 'recipe_fracture_solvent',
      processingProgress: 0,
    },
    {
      id: 'mod_gas_1',
      type: 'containment_gas',
      x: 2,
      y: 0,
      level: 1,
      health: 80,
      maxHealth: 80,
      isPowered: true,
      efficiency: 1.0,
      containerSlotId: 'slot_gas_1',
    },
    {
      id: 'mod_liq_1',
      type: 'containment_liquid',
      x: 1,
      y: 1,
      level: 1,
      health: 80,
      maxHealth: 80,
      isPowered: true,
      efficiency: 1.0,
      containerSlotId: 'slot_liq_1',
    },
    {
      id: 'mod_sol_1',
      type: 'containment_solid',
      x: 0,
      y: 1,
      level: 1,
      health: 120,
      maxHealth: 120,
      isPowered: true,
      efficiency: 1.0,
      containerSlotId: 'slot_sol_1',
    },
    {
      id: 'mod_power_1',
      type: 'power_cell',
      x: -1,
      y: 0,
      level: 1,
      health: 90,
      maxHealth: 90,
      isPowered: true,
      efficiency: 1.0,
    },
    {
      id: 'mod_signal_1',
      type: 'signal_array',
      x: -1,
      y: -1,
      level: 1,
      health: 110,
      maxHealth: 110,
      isPowered: true,
      efficiency: 1.0,
    },
    {
      id: 'mod_dust_1',
      type: 'containment_dust',
      x: 0,
      y: -1,
      level: 1,
      health: 100,
      maxHealth: 100,
      isPowered: true,
      efficiency: 1.0,
      containerSlotId: 'slot_dust_1',
    },
    {
      id: 'mod_plate_1',
      type: 'hull_plating',
      x: 1,
      y: -1,
      level: 1,
      health: 250,
      maxHealth: 250,
      isPowered: true,
      efficiency: 1.0,
    },
  ];

  const initialSlots: ContainerSlot[] = [
    {
      id: 'slot_gas_1',
      stateType: 'gas',
      compoundId: 'nitrogen_vapor',
      amount: 35,
      capacity: 100,
      integrity: 100,
      isBreached: false,
      moduleId: 'mod_gas_1',
    },
    {
      id: 'slot_liq_1',
      stateType: 'liquid',
      compoundId: 'mineral_slurry',
      amount: 40,
      capacity: 100,
      integrity: 100,
      isBreached: false,
      moduleId: 'mod_liq_1',
    },
    {
      id: 'slot_sol_1',
      stateType: 'solid',
      compoundId: 'silicate_shard',
      amount: 30,
      capacity: 100,
      integrity: 100,
      isBreached: false,
      moduleId: 'mod_sol_1',
    },
    {
      id: 'slot_dust_1',
      stateType: 'dust',
      compoundId: null,
      amount: 150,
      capacity: 250,
      integrity: 100,
      isBreached: false,
      moduleId: 'mod_dust_1',
    },
  ];

  const initialDrones: Drone[] = [
    {
      id: 'drone_1',
      bayId: 'mod_bay_1',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      state: 'idle',
      targetAsteroidId: null,
      cargo: { dust: 0, compounds: {} },
      cargoCapacity: 30,
      energy: 100,
    },
    {
      id: 'drone_2',
      bayId: 'mod_bay_1',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      state: 'idle',
      targetAsteroidId: null,
      cargo: { dust: 0, compounds: {} },
      cargoCapacity: 30,
      energy: 100,
    },
  ];

  const initialBottles: SignalBottle[] = [
    {
      id: 'bottle_start_1',
      name: 'Drifting Glass Capsule #01',
      tier: 1,
      worldX: 320,
      worldY: -280,
      vx: -0.2,
      vy: 0.15,
      status: 'retrieved',
      decodingProgress: 25,
      decodingDuration: 12,
      rewardType: 'signal_key',
      rewardKeyId: 'key_tier2_radar',
    },
  ];

  return {
    dust: 150,
    maxDust: 550, // 300 base + 250 from initial dust hopper
    modules: initialModules,
    containerSlots: initialSlots,
    asteroids: [],
    drones: initialDrones,
    compounds: JSON.parse(JSON.stringify(INITIAL_COMPOUNDS)),
    products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
    recipes: JSON.parse(JSON.stringify(SYNTHESIS_RECIPES)),
    signalBottles: initialBottles,
    signalKeys: JSON.parse(JSON.stringify(SIGNAL_KEYS)),
    loreEntries: JSON.parse(JSON.stringify(LORE_ENTRIES)),
    reconstructionItems: JSON.parse(JSON.stringify(RECONSTRUCTION_ITEMS)),
    ships: [],
    collisionLogs: [],
    stats: {
      totalDustMined: 0,
      totalCompoundsProcessed: 0,
      totalAsteroidsMined: 0,
      totalBottlesDecoded: 0,
      totalEntitiesReconstructed: 0,
      totalCollisionsDefended: 0,
      starsReconstructed: 0,
      prestigeMultiplier: 1.0,
      startTime: Date.now(),
    },
    totalPowerGenerated: 8,
    totalPowerConsumed: 9,
    isPaused: false,
    gameSpeed: 1,
    lastTickTimestamp: Date.now(),
    activeTab: 'station',
    selectedModuleId: null,
    buildingTypeToPlace: null,
    notification: {
      message: 'VoidRift Station online. Directives loaded. Reconstruct the universe.',
      type: 'info',
      timestamp: Date.now(),
    },
  };
}

export function saveGameState(state: GameState) {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save game state:', err);
  }
}

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialGameState();
    const parsed = JSON.parse(raw);
    // Merge with any missing properties
    const initial = createInitialGameState();
    return {
      ...initial,
      ...parsed,
      lastTickTimestamp: Date.now(),
    };
  } catch (err) {
    console.error('Failed to load game state:', err);
    return createInitialGameState();
  }
}

// Procedural Asteroid Generator
export function spawnAsteroid(tier: 1 | 2 | 3, isColliding: boolean = false): Asteroid {
  const angle = Math.random() * Math.PI * 2;
  const distance = isColliding ? 500 : 350 + Math.random() * 300;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  let speed = (0.2 + Math.random() * 0.4) * (isColliding ? 1.4 : 1.0);
  let vx: number;
  let vy: number;

  if (isColliding) {
    // Aim towards center station (0,0) with minor offset
    const targetX = (Math.random() - 0.5) * 60;
    const targetY = (Math.random() - 0.5) * 60;
    const dx = targetX - x;
    const dy = targetY - y;
    const mag = Math.hypot(dx, dy);
    vx = (dx / mag) * speed;
    vy = (dy / mag) * speed;
  } else {
    // Orbital drift perpendicular to center
    const perpAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    vx = Math.cos(perpAngle) * speed;
    vy = Math.sin(perpAngle) * speed;
  }

  const radius = tier === 1 ? 16 + Math.random() * 10 : tier === 2 ? 24 + Math.random() * 12 : 32 + Math.random() * 16;
  const shapePoints: number[] = [];
  const vertexCount = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < vertexCount; i++) {
    shapePoints.push(0.75 + Math.random() * 0.5);
  }

  let name = 'Silicate Chunk';
  let color = '#94a3b8';
  let dustYield = 30 + Math.floor(Math.random() * 30);
  const compoundYields: { compoundId: string; amount: number }[] = [];

  if (tier === 1) {
    const types = [
      { name: 'Silicate Drift', color: '#94a3b8', gas: 5, liq: 8, sol: 18, dust: 45 },
      { name: 'Carbonaceous Porous', color: '#64748b', gas: 14, liq: 10, sol: 10, dust: 55 },
      { name: 'Frozen Slurry Pebble', color: '#7dd3fc', gas: 8, liq: 18, sol: 6, dust: 35 },
    ];
    const picked = types[Math.floor(Math.random() * types.length)];
    name = picked.name;
    color = picked.color;
    dustYield = picked.dust;
    compoundYields.push({ compoundId: 'nitrogen_vapor', amount: picked.gas });
    compoundYields.push({ compoundId: 'mineral_slurry', amount: picked.liq });
    compoundYields.push({ compoundId: 'silicate_shard', amount: picked.sol });
  } else if (tier === 2) {
    name = 'Void-Touched Magnetite';
    color = '#c084fc';
    dustYield = 70 + Math.floor(Math.random() * 50);
    compoundYields.push({ compoundId: 'dark_ion_mist', amount: 15 + Math.floor(Math.random() * 12) });
    compoundYields.push({ compoundId: 'primordial_brine', amount: 18 + Math.floor(Math.random() * 15) });
    compoundYields.push({ compoundId: 'dense_ferrite', amount: 22 + Math.floor(Math.random() * 15) });
  } else {
    name = 'Collapsed Core Fragment';
    color = '#f43f5e';
    dustYield = 150 + Math.floor(Math.random() * 100);
    compoundYields.push({ compoundId: 'chrono_vapor', amount: 25 + Math.floor(Math.random() * 20) });
    compoundYields.push({ compoundId: 'acidic_ether', amount: 25 + Math.floor(Math.random() * 20) });
    compoundYields.push({ compoundId: 'quark_ore', amount: 30 + Math.floor(Math.random() * 25) });
  }

  const totalOre = dustYield + compoundYields.reduce((sum, c) => sum + c.amount, 0);

  return {
    id: 'ast_' + Math.random().toString(36).substr(2, 9),
    name,
    tier,
    x,
    y,
    vx,
    vy,
    radius,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    totalOre,
    currentOre: totalOre,
    dustYield,
    compoundYields,
    color,
    shapePoints,
    targetedByDrones: 0,
    trajectoryTowardsStation: isColliding,
    collisionWarning: isColliding,
  };
}

// Bottle Spawner
export function spawnSignalBottle(state: GameState): SignalBottle {
  const angle = Math.random() * Math.PI * 2;
  const distance = 450 + Math.random() * 150;
  const worldX = Math.cos(angle) * distance;
  const worldY = Math.sin(angle) * distance;

  // Aim inwards
  const speed = 0.35 + Math.random() * 0.2;
  const vx = -Math.cos(angle) * speed;
  const vy = -Math.sin(angle) * speed;

  // Determine reward
  const unobtainedKeys = state.signalKeys.filter((k) => !k.unlocked);
  let rewardType: 'signal_key' | 'coordinates' | 'lore' = 'lore';
  let rewardKeyId: string | undefined;
  let rewardLoreId: string | undefined;

  if (unobtainedKeys.length > 0 && Math.random() < 0.6) {
    rewardType = 'signal_key';
    rewardKeyId = unobtainedKeys[Math.floor(Math.random() * unobtainedKeys.length)].id;
  } else if (Math.random() < 0.5) {
    rewardType = 'coordinates';
  } else {
    rewardType = 'lore';
    const unreadLore = state.loreEntries.filter((l) => !l.discovered);
    if (unreadLore.length > 0) {
      rewardLoreId = unreadLore[Math.floor(Math.random() * unreadLore.length)].id;
    }
  }

  const tier = (state.products['resonance_primer']?.count > 0 ? 2 : 1) as 1 | 2;
  const bottleId = 'bottle_' + Math.random().toString(36).substr(2, 9);

  return {
    id: bottleId,
    name: `Void Capsule #${bottleId.slice(-4).toUpperCase()}`,
    tier,
    worldX,
    worldY,
    vx,
    vy,
    status: 'drifting',
    decodingProgress: 0,
    decodingDuration: tier === 1 ? 15 : 30,
    rewardType,
    rewardKeyId,
    rewardLoreId,
    rewardCoordinates:
      rewardType === 'coordinates'
        ? {
            name: 'Disturbed Singularity Pocket',
            description: 'A cluster of compressed primordial matter trapped in a gravitational eddy.',
            distance: 1200 + Math.floor(Math.random() * 800),
            estimatedYield: 'High Liquid & Rare Solids',
            tier: 2,
          }
        : undefined,
  };
}

// Power Grid & Adjacency Calculation
export function updatePowerAndAdjacency(state: GameState) {
  let generated = 0;
  let consumed = 0;

  // Calculate maximum dust capacity based on Dust Hoppers
  const dustHoppers = state.modules.filter((m) => m.type === 'containment_dust' && m.health > 0);
  state.maxDust = 300 + dustHoppers.length * 250;

  // Calculate power
  state.modules.forEach((mod) => {
    const bp = MODULE_BLUEPRINTS[mod.type];
    if (bp.powerCost < 0) {
      // generator
      const genAmount = Math.abs(bp.powerCost) * (mod.health / mod.maxHealth);
      generated += genAmount;
    } else {
      consumed += bp.powerCost;
    }
  });

  state.totalPowerGenerated = Math.round(generated);
  state.totalPowerConsumed = Math.round(consumed);
  const powerSufficient = state.totalPowerGenerated >= state.totalPowerConsumed;

  // Adjacency check for Gas next to Liquid without Plating buffer
  const gridMap = new Map<string, StationModule>();
  state.modules.forEach((m) => {
    gridMap.set(`${m.x},${m.y}`, m);
  });

  state.modules.forEach((mod) => {
    mod.isPowered = powerSufficient || MODULE_BLUEPRINTS[mod.type].powerCost <= 0;
    mod.warning = null;

    if (mod.type === 'containment_gas') {
      const neighbors = [
        gridMap.get(`${mod.x + 1},${mod.y}`),
        gridMap.get(`${mod.x - 1},${mod.y}`),
        gridMap.get(`${mod.x},${mod.y + 1}`),
        gridMap.get(`${mod.x},${mod.y - 1}`),
      ].filter(Boolean) as StationModule[];

      const hasReactiveLiquid = neighbors.some((n) => n.type === 'containment_liquid');
      const hasPlatingBuffer = neighbors.some((n) => n.type === 'hull_plating');

      if (hasReactiveLiquid && !hasPlatingBuffer && (state.products['void_stabilizer']?.count || 0) <= 0) {
        mod.warning = 'Volatile: Gas tank adjacent to reactive liquid without Hull Plating buffer!';
      }
    }
  });
}

// Deposit items into typed container slots
export function depositCompound(
  state: GameState,
  compoundId: string,
  amount: number
): { deposited: number; overflow: number } {
  const comp = state.compounds.find((c) => c.id === compoundId);
  if (!comp) return { deposited: 0, overflow: amount };

  // Find a container slot of appropriate state
  const matchingSlots = state.containerSlots.filter((s) => s.stateType === comp.state && !s.isBreached);

  // First try slots with same compound
  let targetSlot = matchingSlots.find((s) => s.compoundId === compoundId && s.amount < s.capacity);
  // Otherwise try empty slots
  if (!targetSlot) {
    targetSlot = matchingSlots.find((s) => s.compoundId === null || s.amount === 0);
    if (targetSlot) {
      targetSlot.compoundId = compoundId;
    }
  }

  if (!targetSlot) {
    return { deposited: 0, overflow: amount };
  }

  const space = targetSlot.capacity - targetSlot.amount;
  const toAdd = Math.min(space, amount);
  targetSlot.amount += toAdd;
  const overflow = amount - toAdd;

  state.stats.totalCompoundsProcessed += toAdd;

  return { deposited: toAdd, overflow };
}

// Main Simulation Tick (delta in seconds)
export function runSimulationTick(state: GameState, deltaSec: number): GameState {
  if (state.isPaused) return state;

  const effDelta = deltaSec * state.gameSpeed * state.stats.prestigeMultiplier;

  // 1. Maintain Asteroid population (min 6-10 asteroids around station)
  const maxAsteroids = 8;
  if (state.asteroids.length < maxAsteroids && Math.random() < 0.05 * effDelta) {
    const hasPrimer = (state.products['resonance_primer']?.count || 0) > 0;
    const hasCatalyst = (state.products['collapse_catalyst']?.count || 0) > 0;

    let tier: 1 | 2 | 3 = 1;
    const roll = Math.random();
    if (hasCatalyst && roll < 0.2) {
      tier = 3;
    } else if (hasPrimer && roll < 0.45) {
      tier = 2;
    }

    // 10% chance of a collision trajectory asteroid
    const isColliding = Math.random() < 0.12;
    state.asteroids.push(spawnAsteroid(tier, isColliding));
  }

  // 2. Spawn Signal Bottles periodically (scaled by signal array efficiency)
  const signalArrays = state.modules.filter((m) => m.type === 'signal_array' && m.isPowered && m.health > 0);
  const bottleArrivalChance = (0.015 + signalArrays.length * 0.02) * effDelta;
  if (state.signalBottles.length < 5 && Math.random() < bottleArrivalChance) {
    state.signalBottles.push(spawnSignalBottle(state));
    soundEngine.playBottleChime();
    state.notification = {
      message: 'New Signal Bottle detected tumbling from the void horizon!',
      type: 'info',
      timestamp: Date.now(),
    };
  }

  // 3. Update Drifting Asteroids & Handle Collisions
  const remainingAsteroids: Asteroid[] = [];
  state.asteroids.forEach((ast) => {
    ast.x += ast.vx * effDelta * 60;
    ast.y += ast.vy * effDelta * 60;
    ast.rotation += ast.rotationSpeed * effDelta * 60;

    // Check collision with station radius (~60px around origin)
    const distToCenter = Math.hypot(ast.x, ast.y);
    if (distToCenter < 60) {
      // Collision event!
      handleStationCollision(state, ast);
      soundEngine.playImpactClang();
    } else if (distToCenter > 900) {
      // Drifts too far out, remove
    } else {
      remainingAsteroids.push(ast);
    }
  });
  state.asteroids = remainingAsteroids;

  // 4. Update Signal Bottles movement & auto-retrieval
  state.signalBottles.forEach((bottle) => {
    if (bottle.status === 'drifting') {
      bottle.worldX += bottle.vx * effDelta * 60;
      bottle.worldY += bottle.vy * effDelta * 60;

      // Auto-retrieve if near station (< 90px)
      if (Math.hypot(bottle.worldX, bottle.worldY) < 90) {
        bottle.status = 'retrieved';
      }
    } else if (bottle.status === 'retrieved' || bottle.status === 'decoding') {
      if (signalArrays.length > 0) {
        bottle.status = 'decoding';
        bottle.decodingProgress += (100 / bottle.decodingDuration) * (1 + (signalArrays.length - 1) * 0.5) * effDelta;
        if (bottle.decodingProgress >= 100) {
          bottle.status = 'decoded';
          handleDecodedBottle(state, bottle);
        }
      }
    }
  });

  // 5. Autonomous Drones AI
  const hasFractureSolvent = (state.products['fracture_solvent']?.count || 0) > 0;
  const miningRateMultiplier = hasFractureSolvent ? 1.75 : 1.0;
  const yieldMultiplier = hasFractureSolvent ? 1.5 : 1.0;

  // Ensure drones exist for each operational bay (2 per bay)
  const activeBays = state.modules.filter((m) => m.type === 'drone_bay' && m.health > 0);
  const targetDroneCount = activeBays.length * 2;
  while (state.drones.length < targetDroneCount) {
    const bay = activeBays[Math.floor(state.drones.length / 2)] || activeBays[0];
    state.drones.push({
      id: 'drone_' + Math.random().toString(36).substr(2, 6),
      bayId: bay.id,
      x: bay.x * 48,
      y: bay.y * 48,
      vx: 0,
      vy: 0,
      state: 'idle',
      targetAsteroidId: null,
      cargo: { dust: 0, compounds: {} },
      cargoCapacity: 30,
      energy: 100,
    });
  }

  state.drones.forEach((drone) => {
    const bay = state.modules.find((m) => m.id === drone.bayId) || activeBays[0];
    const bayX = bay ? bay.x * 48 : 0;
    const bayY = bay ? bay.y * 48 : 0;

    if (drone.state === 'idle') {
      // Find nearest non-depleted asteroid
      let bestAst: Asteroid | null = null;
      let minDist = Infinity;
      state.asteroids.forEach((ast) => {
        if (ast.currentOre > 0) {
          const d = Math.hypot(ast.x - drone.x, ast.y - drone.y);
          if (d < minDist) {
            minDist = d;
            bestAst = ast;
          }
        }
      });

      if (bestAst) {
        drone.targetAsteroidId = (bestAst as Asteroid).id;
        drone.state = 'flying_to_target';
      }
    } else if (drone.state === 'flying_to_target') {
      const ast = state.asteroids.find((a) => a.id === drone.targetAsteroidId);
      if (!ast || ast.currentOre <= 0) {
        drone.state = 'idle';
        drone.targetAsteroidId = null;
        return;
      }

      const dx = ast.x - drone.x;
      const dy = ast.y - drone.y;
      const dist = Math.hypot(dx, dy);

      if (dist < ast.radius + 20) {
        drone.state = 'mining';
      } else {
        drone.vx = (dx / dist) * 2.8;
        drone.vy = (dy / dist) * 2.8;
        drone.x += drone.vx * effDelta * 60;
        drone.y += drone.vy * effDelta * 60;
      }
    } else if (drone.state === 'mining') {
      const ast = state.asteroids.find((a) => a.id === drone.targetAsteroidId);
      if (!ast || ast.currentOre <= 0) {
        drone.state = 'returning';
        drone.targetAsteroidId = null;
        return;
      }

      // Keep relative position
      drone.x = ast.x - Math.cos(drone.laserAngle || 0) * (ast.radius + 15);
      drone.y = ast.y - Math.sin(drone.laserAngle || 0) * (ast.radius + 15);
      drone.laserAngle = (drone.laserAngle || 0) + 0.05 * effDelta * 60;

      // Extract ore
      const extractAmount = 6 * miningRateMultiplier * effDelta;
      const actualExtract = Math.min(ast.currentOre, extractAmount);
      ast.currentOre -= actualExtract;

      // Calculate yield split
      const dustRatio = ast.dustYield / ast.totalOre;
      const dustGained = actualExtract * dustRatio * yieldMultiplier;
      drone.cargo.dust += dustGained;

      ast.compoundYields.forEach((cy) => {
        const cRatio = cy.amount / ast.totalOre;
        const cGained = actualExtract * cRatio * yieldMultiplier;
        drone.cargo.compounds[cy.compoundId] = (drone.cargo.compounds[cy.compoundId] || 0) + cGained;
      });

      // Cargo check
      const totalCargo =
        drone.cargo.dust + Object.values(drone.cargo.compounds).reduce((sum, v) => sum + v, 0);

      if (totalCargo >= drone.cargoCapacity || ast.currentOre <= 0) {
        if (ast.currentOre <= 0) {
          state.stats.totalAsteroidsMined += 1;
        }
        drone.state = 'returning';
      }
    } else if (drone.state === 'returning') {
      const dx = bayX - drone.x;
      const dy = bayY - drone.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 15) {
        // Unload cargo
        state.dust = Math.min(state.maxDust, state.dust + drone.cargo.dust);
        state.stats.totalDustMined += drone.cargo.dust;
        drone.cargo.dust = 0;

        // Unload compounds into typed container slots
        Object.entries(drone.cargo.compounds).forEach(([cId, amt]) => {
          depositCompound(state, cId, amt);
        });
        drone.cargo.compounds = {};

        drone.state = 'idle';
      } else {
        drone.vx = (dx / dist) * 3.2;
        drone.vy = (dy / dist) * 3.2;
        drone.x += drone.vx * effDelta * 60;
        drone.y += drone.vy * effDelta * 60;
      }
    }
  });

  // 6. Synthesis Processing Chambers
  const processingChambers = state.modules.filter(
    (m) => m.type === 'processing_chamber' && m.isPowered && m.health > 0
  );
  processingChambers.forEach((chamber) => {
    if (!chamber.activeRecipeId) return;
    const recipe = state.recipes.find((r) => r.id === chamber.activeRecipeId);
    if (!recipe) return;

    // Check if player has inputs
    const hasDust = !recipe.dustCost || state.dust >= recipe.dustCost;

    let hasAllCompounds = true;
    for (const input of recipe.inputs) {
      const slotsWithComp = state.containerSlots.filter(
        (s) => s.compoundId === input.compoundId && !s.isBreached
      );
      const totalAvail = slotsWithComp.reduce((sum, s) => sum + s.amount, 0);
      if (totalAvail < input.amount) {
        hasAllCompounds = false;
        break;
      }
    }

    if (hasDust && hasAllCompounds) {
      chamber.processingProgress = (chamber.processingProgress || 0) + (100 / recipe.durationSeconds) * effDelta;

      if (chamber.processingProgress >= 100) {
        chamber.processingProgress = 0;

        // Deduct inputs
        if (recipe.dustCost) {
          state.dust -= recipe.dustCost;
        }

        for (const input of recipe.inputs) {
          let needed = input.amount;
          const slotsWithComp = state.containerSlots.filter(
            (s) => s.compoundId === input.compoundId && !s.isBreached
          );
          for (const slot of slotsWithComp) {
            const take = Math.min(slot.amount, needed);
            slot.amount -= take;
            needed -= take;
            if (needed <= 0) break;
          }
        }

        // Grant output product
        const prod = state.products[recipe.outputProduct.id];
        if (prod) {
          prod.count += recipe.outputProduct.amount;
        }
        soundEngine.playContainerHiss();

        // Check if Reconstruction items can advance
        checkAutoReconstruction(state);
      }
    }
  });

  // 7. Reconstruction Progress Tick
  state.reconstructionItems.forEach((item) => {
    if (item.isReconstructing && !item.isCompleted) {
      item.progress += (100 / item.reconstructionDuration) * effDelta;
      if (item.progress >= 100) {
        item.progress = 100;
        item.isCompleted = true;
        item.isReconstructing = false;
        item.completedAt = Date.now();
        state.stats.totalEntitiesReconstructed += 1;

        if (item.type === 'Star') {
          state.stats.starsReconstructed += 1;
          state.stats.prestigeMultiplier += 0.25; // Permanent cascade boost!
          state.notification = {
            message: `★ COSMIC CASCADE IGNITED! ${item.name} completed! Universal speed & yield +25%!`,
            type: 'success',
            timestamp: Date.now(),
          };
        } else {
          state.notification = {
            message: `Reconstruction complete: ${item.name} cataloged into existence!`,
            type: 'success',
            timestamp: Date.now(),
          };
        }
        soundEngine.playReconstructFanfare();
      }
    }
  });

  // 8. Auto-repair damaged modules using Dust
  const hasHullBinder = (state.products['hull_binder']?.count || 0) > 0;
  const repairSpeed = hasHullBinder ? 10 : 4;
  const repairCostRatio = hasHullBinder ? 0.5 : 1.0;

  state.modules.forEach((mod) => {
    if (mod.health < mod.maxHealth && state.dust > 2) {
      const toHeal = Math.min(mod.maxHealth - mod.health, repairSpeed * effDelta);
      const dustCost = toHeal * 0.25 * repairCostRatio;
      if (state.dust >= dustCost) {
        mod.health += toHeal;
        state.dust -= dustCost;
      }
    }
  });

  // Update power grid
  updatePowerAndAdjacency(state);

  return state;
}

// Check if any Reconstruction Item can start
export function checkAutoReconstruction(state: GameState) {
  state.reconstructionItems.forEach((item) => {
    if (!item.isCompleted && !item.isReconstructing) {
      const hasDust = state.dust >= item.dustCost;
      let hasInputs = true;
      for (const req of item.requiredInputs) {
        const prod = state.products[req.inputId];
        if (!prod || prod.count < req.amount) {
          hasInputs = false;
          break;
        }
      }

      // Auto start if inputs are satisfied!
      if (hasDust && hasInputs) {
        state.dust -= item.dustCost;
        for (const req of item.requiredInputs) {
          state.products[req.inputId].count -= req.amount;
        }
        item.isReconstructing = true;
        item.progress = 0;
        soundEngine.playBuildClink();
        state.notification = {
          message: `Reconstruction initiated: Assembling matter for ${item.name}...`,
          type: 'info',
          timestamp: Date.now(),
        };
      }
    }
  });
}

function handleDecodedBottle(state: GameState, bottle: SignalBottle) {
  state.stats.totalBottlesDecoded += 1;

  if (bottle.rewardType === 'signal_key' && bottle.rewardKeyId) {
    const key = state.signalKeys.find((k) => k.id === bottle.rewardKeyId);
    if (key) {
      key.unlocked = true;
      state.notification = {
        message: `Signal Key Decoded: "${key.name}" — New capabilities unlocked!`,
        type: 'success',
        timestamp: Date.now(),
      };
    }
  } else if (bottle.rewardType === 'lore' && bottle.rewardLoreId) {
    const lore = state.loreEntries.find((l) => l.id === bottle.rewardLoreId);
    if (lore) {
      lore.discovered = true;
      state.notification = {
        message: `Ancient Transmission Decoded: "${lore.title}" archived in Logbook.`,
        type: 'info',
        timestamp: Date.now(),
      };
    }
  } else if (bottle.rewardType === 'coordinates') {
    state.dust = Math.min(state.maxDust, state.dust + 80);
    state.notification = {
      message: 'Deep-Space Coordinates decoded! Harvested 80 units of Carbon Dust.',
      type: 'info',
      timestamp: Date.now(),
    };
  }

  // Remove decoded bottle from active queue after brief time
  state.signalBottles = state.signalBottles.filter((b) => b.id !== bottle.id);
}

function handleStationCollision(state: GameState, ast: Asteroid) {
  state.stats.totalCollisionsDefended += 1;

  // Find module closest to impact
  const hitAngle = Math.atan2(ast.y, ast.x);
  const targetGridX = Math.round(Math.cos(hitAngle));
  const targetGridY = Math.round(Math.sin(hitAngle));

  const targetMod = state.modules.find((m) => m.x === targetGridX && m.y === targetGridY) || state.modules[0];
  if (!targetMod) return;

  const baseDamage = ast.tier === 1 ? 25 : ast.tier === 2 ? 55 : 90;
  const isPlating = targetMod.type === 'hull_plating';
  const actualDamage = isPlating ? baseDamage * 0.5 : baseDamage;

  targetMod.health = Math.max(0, targetMod.health - actualDamage);

  // If container module damaged, breach and leak
  let compoundLoss: { name: string; amount: number } | undefined;
  if (targetMod.containerSlotId && targetMod.health < 40) {
    const slot = state.containerSlots.find((s) => s.id === targetMod.containerSlotId);
    if (slot && slot.amount > 0) {
      const lostAmt = Math.round(slot.amount * 0.3);
      slot.amount -= lostAmt;
      const comp = state.compounds.find((c) => c.id === slot.compoundId);
      compoundLoss = {
        name: comp?.name || 'Raw Matter',
        amount: lostAmt,
      };
    }
  }

  // Record collision log
  state.collisionLogs.unshift({
    id: 'col_' + Date.now(),
    timestamp: Date.now(),
    moduleName: MODULE_BLUEPRINTS[targetMod.type].name,
    modulePos: { x: targetMod.x, y: targetMod.y },
    damage: Math.round(actualDamage),
    compoundLoss,
    dustRepaired: 0,
    resolved: false,
  });

  // Spawn salvageable debris field right at impact!
  const bonusDust = Math.round(ast.dustYield * 0.5);
  state.dust = Math.min(state.maxDust, state.dust + bonusDust);

  state.notification = {
    message: `COLLISION IMPACT! ${ast.name} struck ${MODULE_BLUEPRINTS[targetMod.type].name}. Salvaged +${bonusDust} Dust from debris!`,
    type: 'danger',
    timestamp: Date.now(),
  };
}
