import {
  GameState,
  StationModule,
  ContainerSlot,
  Drone,
  Asteroid,
  SignalBottle,
  ReconstructionItem,
  CollisionEventLog,
  ModuleBlueprint,
} from '../types';
import { COMPOUNDS, COMPOUNDS_BY_ID } from '../data/compounds';
import { INITIAL_RECIPES, INITIAL_PRODUCTS, MODULE_BLUEPRINTS } from '../data/recipes';
import { RECONSTRUCTION_ITEMS } from '../data/reconstruction';
import { INITIAL_SIGNAL_KEYS, INITIAL_LORE_ENTRIES, INITIAL_BOTTLES } from '../data/signalkeys';

export function createInitialGameState(): GameState {
  const initialModules: StationModule[] = [
    {
      id: 'mod_core_power',
      type: 'power_cell',
      x: 0,
      y: 0,
      level: 1,
      health: 90,
      maxHealth: 90,
      isPowered: true,
      efficiency: 1.0,
    },
    {
      id: 'mod_drone_bay',
      type: 'drone_bay',
      x: 1,
      y: 0,
      level: 1,
      health: 100,
      maxHealth: 100,
      isPowered: true,
      efficiency: 1.0,
    },
    {
      id: 'mod_synthesis_1',
      type: 'processing_chamber',
      x: -1,
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
      id: 'mod_gas_tank_1',
      type: 'containment_gas',
      x: -1,
      y: 1,
      level: 1,
      health: 80,
      maxHealth: 80,
      isPowered: true,
      efficiency: 1.0,
      containerSlotId: 'slot_gas_1',
    },
    {
      id: 'mod_liquid_flask_1',
      type: 'containment_liquid',
      x: -1,
      y: -1,
      level: 1,
      health: 80,
      maxHealth: 80,
      isPowered: true,
      efficiency: 1.0,
      containerSlotId: 'slot_liquid_1',
    },
    {
      id: 'mod_solid_bin_1',
      type: 'containment_solid',
      x: 0,
      y: -1,
      level: 1,
      health: 100,
      maxHealth: 100,
      isPowered: true,
      efficiency: 1.0,
      containerSlotId: 'slot_solid_1',
    },
    {
      id: 'mod_dust_hopper_1',
      type: 'containment_dust',
      x: 0,
      y: 1,
      level: 1,
      health: 100,
      maxHealth: 100,
      isPowered: true,
      efficiency: 1.0,
      containerSlotId: 'slot_dust_1',
    },
    {
      id: 'mod_signal_array_1',
      type: 'signal_array',
      x: 1,
      y: 1,
      level: 1,
      health: 100,
      maxHealth: 100,
      isPowered: true,
      efficiency: 1.0,
    },
  ];

  const initialSlots: ContainerSlot[] = [
    {
      id: 'slot_gas_1',
      stateType: 'gas',
      compoundId: 'nitrogen_vapor',
      amount: 40,
      capacity: 100,
      integrity: 100,
      isBreached: false,
      moduleId: 'mod_gas_tank_1',
    },
    {
      id: 'slot_liquid_1',
      stateType: 'liquid',
      compoundId: 'mineral_slurry',
      amount: 35,
      capacity: 100,
      integrity: 100,
      isBreached: false,
      moduleId: 'mod_liquid_flask_1',
    },
    {
      id: 'slot_solid_1',
      stateType: 'solid',
      compoundId: 'silicate_shard',
      amount: 30,
      capacity: 100,
      integrity: 100,
      isBreached: false,
      moduleId: 'mod_solid_bin_1',
    },
    {
      id: 'slot_dust_1',
      stateType: 'dust',
      compoundId: null,
      amount: 150,
      capacity: 500,
      integrity: 100,
      isBreached: false,
      moduleId: 'mod_dust_hopper_1',
    },
  ];

  const initialDrones: Drone[] = [
    {
      id: 'drone_alpha',
      name: 'Drone Alpha',
      state: 'idle',
      x: 35,
      y: 0,
      vx: 0,
      vy: 0,
      cargo: { dust: 0, compounds: {} },
      maxCargo: 50,
      miningSpeed: 8,
      assignedBayId: 'mod_drone_bay',
    },
    {
      id: 'drone_beta',
      name: 'Drone Beta',
      state: 'idle',
      x: 35,
      y: 15,
      vx: 0,
      vy: 0,
      cargo: { dust: 0, compounds: {} },
      maxCargo: 50,
      miningSpeed: 8,
      assignedBayId: 'mod_drone_bay',
    },
  ];

  const initialAsteroids: Asteroid[] = [
    {
      id: 'ast_1',
      x: 180,
      y: -80,
      vx: -4,
      vy: 2,
      radius: 18,
      health: 80,
      maxHealth: 80,
      tier: 1,
      mineralType: 'Nitrogen-Rich Chondrite',
      composition: {
        dust: 30,
        compoundId: 'nitrogen_vapor',
        compoundAmount: 25,
      },
    },
    {
      id: 'ast_2',
      x: -160,
      y: 120,
      vx: 3,
      vy: -2,
      radius: 22,
      health: 100,
      maxHealth: 100,
      tier: 1,
      mineralType: 'Silicate Slurry Cluster',
      composition: {
        dust: 40,
        compoundId: 'mineral_slurry',
        compoundAmount: 30,
      },
    },
    {
      id: 'ast_3',
      x: 140,
      y: 160,
      vx: -3,
      vy: -3,
      radius: 20,
      health: 90,
      maxHealth: 90,
      tier: 1,
      mineralType: 'Crystalline Silicate Core',
      composition: {
        dust: 35,
        compoundId: 'silicate_shard',
        compoundAmount: 25,
      },
    },
  ];

  return {
    dust: 250,
    maxDust: 1000,
    powerGenerated: 8,
    powerConsumed: 8,
    modules: initialModules,
    containerSlots: initialSlots,
    drones: initialDrones,
    asteroids: initialAsteroids,
    signalBottles: JSON.parse(JSON.stringify(INITIAL_BOTTLES)),
    signalKeys: JSON.parse(JSON.stringify(INITIAL_SIGNAL_KEYS)),
    loreEntries: JSON.parse(JSON.stringify(INITIAL_LORE_ENTRIES)),
    products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
    reconstructionItems: JSON.parse(JSON.stringify(RECONSTRUCTION_ITEMS)),
    collisionLogs: [],
    stats: {
      totalDustMined: 0,
      totalCompoundsHarvested: 0,
      totalSynthesisRuns: 0,
      totalBottlesDecoded: 0,
      totalReconstructedEntities: 0,
      collisionsDeflected: 0,
    },
    selectedModuleId: null,
    buildingTypeToPlace: null,
    isPaused: false,
    gameSpeed: 1.0,
    prestigeMultiplier: 1.0,
    nextBottleSpawnTimer: 30,
    nextAsteroidSpawnTimer: 10,
    notification: {
      message: 'VoidRift Station initialized. Rebuilding forward.',
      type: 'info',
      timestamp: Date.now(),
    },
  };
}

export function computePowerBalance(state: GameState): {
  generated: number;
  consumed: number;
  sufficient: boolean;
} {
  let generated = 0;
  let consumed = 0;

  for (const mod of state.modules) {
    const bp = MODULE_BLUEPRINTS[mod.type];
    if (!bp) continue;

    if (bp.powerCost < 0) {
      // Power generator (e.g. power_cell generates -8kW)
      // Damage scales output by health ratio
      const healthRatio = mod.maxHealth > 0 ? mod.health / mod.maxHealth : 1;
      generated += Math.abs(bp.powerCost) * healthRatio;
    } else if (bp.powerCost > 0) {
      consumed += bp.powerCost;
    }
  }

  const sufficient = generated >= consumed;

  // Update powered state on modules
  for (const mod of state.modules) {
    const bp = MODULE_BLUEPRINTS[mod.type];
    if (bp && bp.powerCost < 0) {
      mod.isPowered = true;
    } else {
      mod.isPowered = sufficient;
    }
  }

  state.powerGenerated = generated;
  state.powerConsumed = consumed;

  return { generated, consumed, sufficient };
}

export function routeCompoundToContainer(
  state: GameState,
  compoundId: string,
  amount: number
): { deposited: number; overflow: number } {
  if (amount <= 0) return { deposited: 0, overflow: 0 };

  const compound = COMPOUNDS_BY_ID[compoundId];
  if (!compound) {
    // Unknown compound: cannot route, return full overflow
    return { deposited: 0, overflow: amount };
  }

  // Filter slots strictly matching compound state (Astroneer model)
  const validSlots = state.containerSlots.filter(
    (slot) => slot.stateType === compound.state && !slot.isBreached
  );

  if (validSlots.length === 0) {
    return { deposited: 0, overflow: amount };
  }

  let remaining = amount;
  let totalDeposited = 0;

  // Priority 1: Existing slots containing this compound
  for (const slot of validSlots) {
    if (slot.compoundId === compoundId && slot.amount < slot.capacity) {
      const space = slot.capacity - slot.amount;
      const toAdd = Math.min(space, remaining);
      slot.amount += toAdd;
      remaining -= toAdd;
      totalDeposited += toAdd;
      if (remaining <= 0) break;
    }
  }

  // Priority 2: Empty slots of matching state
  if (remaining > 0) {
    for (const slot of validSlots) {
      if ((slot.compoundId === null || slot.amount === 0) && slot.amount < slot.capacity) {
        slot.compoundId = compoundId;
        const space = slot.capacity - slot.amount;
        const toAdd = Math.min(space, remaining);
        slot.amount += toAdd;
        remaining -= toAdd;
        totalDeposited += toAdd;
        if (remaining <= 0) break;
      }
    }
  }

  return { deposited: totalDeposited, overflow: remaining };
}

export function depositCompound(
  state: GameState,
  compoundId: string,
  amount: number
): GameState {
  const result = routeCompoundToContainer(state, compoundId, amount);
  state.stats.totalCompoundsHarvested += result.deposited;
  return state;
}

export function checkAutoReconstruction(state: GameState): GameState {
  for (const item of state.reconstructionItems) {
    if (item.isCompleted) continue;

    if (!item.isReconstructing) {
      // Check if dust and all product inputs are met
      const hasDust = state.dust >= item.dustCost;
      let hasAllInputs = true;

      for (const req of item.requiredInputs) {
        const prod = state.products[req.inputId];
        if (!prod || prod.count < req.amount) {
          hasAllInputs = false;
          break;
        }
      }

      if (hasDust && hasAllInputs) {
        // Trigger reconstruction
        state.dust -= item.dustCost;
        for (const req of item.requiredInputs) {
          if (state.products[req.inputId]) {
            state.products[req.inputId].count -= req.amount;
          }
        }
        item.isReconstructing = true;
        item.progress = 0;
      }
    }
  }

  return state;
}

export function handleStationCollision(
  state: GameState,
  asteroid: Asteroid
): GameState {
  if (state.modules.length === 0) return state;

  // Find target module
  const targetMod = state.modules[Math.floor(Math.random() * state.modules.length)];
  const bp = MODULE_BLUEPRINTS[targetMod.type];

  // Base damage from asteroid radius and tier
  let damage = Math.round((asteroid.radius * 1.5 + asteroid.tier * 8) * 0.7);

  // Check if target or adjacent module is Hull Plating
  const hasPlatingProtection =
    targetMod.type === 'hull_plating' ||
    state.modules.some(
      (m) =>
        m.type === 'hull_plating' &&
        Math.abs(m.x - targetMod.x) <= 1 &&
        Math.abs(m.y - targetMod.y) <= 1
    );

  if (hasPlatingProtection) {
    damage = Math.round(damage * 0.5);
    state.stats.collisionsDeflected += 1;
  }

  targetMod.health = Math.max(0, targetMod.health - damage);

  // Container breach check: if container module health < 40%
  let compoundLoss: { compoundId: string; name: string; amount: number } | undefined = undefined;
  if (targetMod.containerSlotId) {
    const slot = state.containerSlots.find((s) => s.id === targetMod.containerSlotId);
    if (slot && targetMod.health < targetMod.maxHealth * 0.4 && slot.amount > 0) {
      const lost = Math.round(slot.amount * 0.3);
      slot.amount = Math.max(0, slot.amount - lost);
      slot.isBreached = true;
      if (slot.compoundId) {
        compoundLoss = {
          compoundId: slot.compoundId,
          name: COMPOUNDS_BY_ID[slot.compoundId]?.name || slot.compoundId,
          amount: lost,
        };
      }
    }
  }

  // Salvage debris dust
  const debrisDust = Math.round(asteroid.composition.dust * 0.5);
  state.dust = Math.min(state.maxDust, state.dust + debrisDust);

  // Log collision event
  const log: CollisionEventLog = {
    id: 'col_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: Date.now(),
    moduleName: bp?.name || targetMod.type,
    modulePos: { x: targetMod.x, y: targetMod.y },
    damage,
    compoundLoss,
    debrisDustAwarded: debrisDust,
    resolved: false,
  };

  state.collisionLogs.unshift(log);
  if (state.collisionLogs.length > 20) {
    state.collisionLogs.pop();
  }

  // Remove asteroid
  state.asteroids = state.asteroids.filter((a) => a.id !== asteroid.id);

  return state;
}

export function tickSimulation(state: GameState, deltaSeconds: number): GameState {
  if (state.isPaused || deltaSeconds <= 0) return state;

  const dt = deltaSeconds * state.gameSpeed;

  // 1. Power Balance
  const power = computePowerBalance(state);

  // Active Multipliers
  const hasFractureSolvent = (state.products.fracture_solvent?.count || 0) > 0;
  const hasHullBinder = (state.products.hull_binder?.count || 0) > 0;
  const miningSpeedMultiplier = (hasFractureSolvent ? 1.75 : 1.0) * state.prestigeMultiplier;
  const compoundYieldMultiplier = (hasFractureSolvent ? 1.5 : 1.0) * state.prestigeMultiplier;

  // 2. Synthesis Processing Chambers
  for (const mod of state.modules) {
    if (mod.type === 'processing_chamber' && mod.activeRecipeId) {
      if (!mod.isPowered) {
        // Halt synthesis when unpowered
        continue;
      }

      const recipe = INITIAL_RECIPES.find((r) => r.id === mod.activeRecipeId);
      if (!recipe) continue;

      // Check input compound availability
      let canSynthesize = true;
      for (const req of recipe.inputs) {
        const availableInSlots = state.containerSlots
          .filter((s) => s.compoundId === req.compoundId && !s.isBreached)
          .reduce((sum, s) => sum + s.amount, 0);
        if (availableInSlots < req.amount) {
          canSynthesize = false;
          break;
        }
      }

      if (canSynthesize) {
        const synthesisSpeedMultiplier = (hasFractureSolvent ? 1.5 : 1.0) * state.prestigeMultiplier;
        mod.processingProgress =
          (mod.processingProgress || 0) + (dt / recipe.durationSeconds) * 100 * synthesisSpeedMultiplier;

        if (mod.processingProgress >= 100) {
          mod.processingProgress = 0;

          // Deduct inputs from container slots
          for (const req of recipe.inputs) {
            let needed = req.amount;
            for (const slot of state.containerSlots) {
              if (slot.compoundId === req.compoundId && slot.amount > 0) {
                const take = Math.min(slot.amount, needed);
                slot.amount -= take;
                needed -= take;
                if (needed <= 0) break;
              }
            }
          }

          // Output product
          const pId = recipe.outputProduct.productId;
          if (state.products[pId]) {
            state.products[pId].count += recipe.outputProduct.amount;
          }
          state.stats.totalSynthesisRuns += 1;
        }
      }
    }
  }

  // 3. Asteroid Physics & Spawning
  state.nextAsteroidSpawnTimer -= dt;
  if (state.nextAsteroidSpawnTimer <= 0 && state.asteroids.length < 6) {
    state.nextAsteroidSpawnTimer = 12;
    const angle = Math.random() * Math.PI * 2;
    const dist = 220 + Math.random() * 60;
    const compTier1 = ['nitrogen_vapor', 'mineral_slurry', 'silicate_shard'];
    const chosenComp = compTier1[Math.floor(Math.random() * compTier1.length)];

    state.asteroids.push({
      id: 'ast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      vx: -Math.cos(angle) * (2 + Math.random() * 3),
      vy: -Math.sin(angle) * (2 + Math.random() * 3),
      radius: 16 + Math.random() * 8,
      health: 80,
      maxHealth: 80,
      tier: 1,
      mineralType: COMPOUNDS_BY_ID[chosenComp]?.name || 'Chondrite',
      composition: {
        dust: 25 + Math.floor(Math.random() * 20),
        compoundId: chosenComp,
        compoundAmount: 20 + Math.floor(Math.random() * 15),
      },
    });
  }

  for (const ast of state.asteroids) {
    ast.x += ast.vx * dt * 0.5;
    ast.y += ast.vy * dt * 0.5;

    // Check station collision
    const distFromCenter = Math.hypot(ast.x, ast.y);
    if (distFromCenter < 40) {
      handleStationCollision(state, ast);
    }
  }

  // 4. Drone AI & Mining
  for (const drone of state.drones) {
    const totalCargo =
      drone.cargo.dust +
      Object.values(drone.cargo.compounds).reduce((s, v) => s + v, 0);

    if (drone.state === 'idle') {
      if (totalCargo >= drone.maxCargo) {
        drone.state = 'returning';
      } else {
        // Find nearest available asteroid
        const target = state.asteroids.find((a) => a.health > 0);
        if (target) {
          drone.targetAsteroidId = target.id;
          drone.state = 'seeking';
        }
      }
    } else if (drone.state === 'seeking') {
      const target = state.asteroids.find((a) => a.id === drone.targetAsteroidId);
      if (!target || target.health <= 0) {
        drone.state = 'idle';
        drone.targetAsteroidId = null;
      } else {
        const dx = target.x - drone.x;
        const dy = target.y - drone.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 45) {
          drone.state = 'mining';
          drone.vx = 0;
          drone.vy = 0;
        } else {
          drone.vx = (dx / dist) * 45;
          drone.vy = (dy / dist) * 45;
          drone.x += drone.vx * dt;
          drone.y += drone.vy * dt;
        }
      }
    } else if (drone.state === 'mining') {
      const target = state.asteroids.find((a) => a.id === drone.targetAsteroidId);
      if (!target || target.health <= 0) {
        drone.state = 'idle';
        drone.targetAsteroidId = null;
        drone.laserActive = false;
      } else {
        drone.laserActive = true;
        drone.laserTarget = { x: target.x, y: target.y };

        const dmg = drone.miningSpeed * miningSpeedMultiplier * dt;
        target.health -= dmg;

        const ratio = dmg / target.maxHealth;
        const minedDust = Math.round(target.composition.dust * ratio * miningSpeedMultiplier);
        const minedComp = Math.round(target.composition.compoundAmount * ratio * compoundYieldMultiplier);

        drone.cargo.dust += minedDust;
        state.stats.totalDustMined += minedDust;

        if (target.composition.compoundId) {
          const cid = target.composition.compoundId;
          drone.cargo.compounds[cid] = (drone.cargo.compounds[cid] || 0) + minedComp;
        }

        if (target.health <= 0) {
          state.asteroids = state.asteroids.filter((a) => a.id !== target.id);
          drone.laserActive = false;
          drone.state = 'returning';
        } else if (totalCargo >= drone.maxCargo) {
          drone.laserActive = false;
          drone.state = 'returning';
        }
      }
    } else if (drone.state === 'returning') {
      drone.laserActive = false;
      const bay = state.modules.find((m) => m.id === drone.assignedBayId) || { x: 0, y: 0 };
      const bayWorldX = bay.x * 40;
      const bayWorldY = bay.y * 40;

      const dx = bayWorldX - drone.x;
      const dy = bayWorldY - drone.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 10) {
        // Docked: Deposit cargo
        state.dust = Math.min(state.maxDust, state.dust + drone.cargo.dust);

        for (const [cId, cAmount] of Object.entries(drone.cargo.compounds)) {
          depositCompound(state, cId, cAmount);
        }

        drone.cargo = { dust: 0, compounds: {} };
        drone.state = 'idle';
      } else {
        drone.vx = (dx / dist) * 50;
        drone.vy = (dy / dist) * 50;
        drone.x += drone.vx * dt;
        drone.y += drone.vy * dt;
      }
    }
  }

  // 5. Signal Bottle Decryption
  const hasPoweredSignalArray = state.modules.some(
    (m) => m.type === 'signal_array' && m.isPowered
  );

  for (const bottle of state.signalBottles) {
    if (bottle.status === 'retrieved' && hasPoweredSignalArray) {
      bottle.decodingProgress += (dt / bottle.decodingDuration) * 100;
      if (bottle.decodingProgress >= 100) {
        bottle.status = 'decoded';
        state.stats.totalBottlesDecoded += 1;

        if (bottle.payload.keyId) {
          const key = state.signalKeys.find((k) => k.id === bottle.payload.keyId);
          if (key) key.unlocked = true;
        }

        if (bottle.payload.loreId) {
          const lore = state.loreEntries.find((l) => l.id === bottle.payload.loreId);
          if (lore) lore.discovered = true;
        }

        if (bottle.payload.dustBonus) {
          state.dust = Math.min(state.maxDust, state.dust + bottle.payload.dustBonus);
        }
      }
    }
  }

  // 6. Reconstruction Progression
  for (const item of state.reconstructionItems) {
    if (item.isReconstructing) {
      item.progress += (dt / item.reconstructionDuration) * 100;
      if (item.progress >= 100) {
        item.progress = 100;
        item.isReconstructing = false;
        item.isCompleted = true;
        state.stats.totalReconstructedEntities += 1;

        if (item.type === 'Star') {
          state.prestigeMultiplier += 0.25;
        }
      }
    }
  }

  checkAutoReconstruction(state);

  // 7. Passive Auto-Repair
  const repairRate = (hasHullBinder ? 2.0 : 1.0) * dt;
  for (const mod of state.modules) {
    if (mod.health < mod.maxHealth) {
      mod.health = Math.min(mod.maxHealth, mod.health + repairRate * 0.5);
    }
  }

  return state;
}
