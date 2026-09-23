/**
 * @file src/sessionLoop.ts
 * Core session loop orchestrator — integrates Layer 1 utility scoring,
 * Layer 2 steering physics, station assignment, demand escalation, customer entities, and live stats.
 */

import { removeCustomerForAbandonedOrder, spawnCustomerForOrder, updateCustomers } from './customers';
import {
  BATCH_QUALITY_DECAY_PER_SECOND_IDLE,
  BATCH_QUALITY_MAX,
  BATCH_QUALITY_MIN,
  BLADDER_FAILURE_THRESHOLD_SECONDS,
  BRAND_EQUITY_ABANDONED_ORDER_PENALTY,
  BREAK_TASK_MIN_LOCK_SECONDS,
  CLEAN_MESS_DURATION_SECONDS,
  COFFEE_BOOST_DECAY_RATE,
  COFFEE_BREW_RATE_PER_SECOND,
  COFFEE_POT_CAPACITY,
  COFFEE_STAMINA_BOOST,
  COFFEE_WORKER_PORTION_SIZE,
  CONTAGION_DECAY_RATE,
  DAY_DURATION_SECONDS_DEFAULT,
  GAME_OVER_BRAND_EQUITY_THRESHOLD,
  INITIAL_BRAND_EQUITY,
  INITIAL_WORKERS,
  MANAGER_DEFAULT_POS,
  PATTY_SPOILAGE_TIME_SEC,
  SITUATION_ESCALATION_INTERVAL_SECONDS,
  STAFF_AREA,
  STATION_CONFIGS,
  STOCK_UNITS_CAPACITY,
  THIRST_DECAY_PER_SECOND,
  TOTAL_DAYS,
  UTILITY_TICK_RATE_HZ,
  WASTE_PER_ABANDONED_ORDER,
  WASTE_PER_SPOILAGE,
  WAVE_INTENSITY_MULTIPLIER,
} from './data';
import { createOrder, getArrivalInterval, getEscalationInterval, updateDemandCurve } from './demandCurve';
import { chooseStation } from './stationAssignment';
import { checkAutoRestock } from './stockEconomy';
import {
  applyCustomerPhysics,
  applyManagerPhysics,
  applyWorkerPhysics,
  computeCustomerSteering,
  computeManagerSteering,
  computeWorkerSteering,
} from './steering';
import { processWorkerExecution } from './taskExecution';
import { KitchenState, LogEvent, ManagerTaskType, Order, Station, StationId, TaskType, Worker } from './types';
import { evaluateManagerTick, evaluateWorkerTick } from './utilityScoring';
import { accumulateWaste } from './wasteEconomy';

/**
 * Creates a clean initial KitchenState for an open-ended session.
 */
export function createInitialKitchenState(): KitchenState {
  const unlockedStations: Record<StationId, boolean> = {
    queue: true,
    grill: true,
    assembly: true,
    window: true,
    coffee: true,   // staff infrastructure, unconditional
    bathroom: true, // staff infrastructure, unconditional
    fryer: false,   // locked until Directive #4
  };

  const initialQueueOrders: Order[] = [
    createOrder(unlockedStations.fryer ? undefined : false),
    createOrder(unlockedStations.fryer ? undefined : false),
  ];
  const initialFryerOrders: Order[] = initialQueueOrders.filter((o) => o.wantsFries);

  const stations: Station[] = (Object.keys(STATION_CONFIGS) as StationId[]).map((id) => {
    const config = STATION_CONFIGS[id];
    let initialOrders: Order[] = [];
    if (id === 'queue') initialOrders = initialQueueOrders;
    else if (id === 'fryer') initialOrders = initialFryerOrders;

    return {
      id: config.id,
      name: config.name,
      occupiedBy: null,
      occupiedByWorkerId: null,
      orders: initialOrders,
      bufferCapacity: config.bufferCapacity,
      x: config.x,
      y: config.y,
      width: config.width,
      height: config.height,
      color: config.color,
      degradationStage: 0,
      batchQuality: BATCH_QUALITY_MAX,
      isOutOfOrder: false,
      brokenElapsedSeconds: 0,
    };
  });

  const stationIds: StationId[] = ['queue', 'grill', 'assembly', 'window'];

  const workers: Worker[] = INITIAL_WORKERS.map((iw, idx) => ({
    id: iw.id,
    name: iw.name,
    role: iw.role,
    type: iw.type,
    preferredStation: iw.preferredStation,
    primaryStation: stationIds[idx % stationIds.length],
    x: iw.initialX,
    y: iw.initialY,
    vx: 0,
    vy: 0,
    stamina: 0.9 + Math.random() * 0.1,
    morale: 0.85 + Math.random() * 0.1,
    thirst: 1.0,
    bladderPressure: 0.0,
    currentTask: 'protocol',
    currentStation: null,
    claimedResource: null,
    taskProgress: 0,
    color: iw.color,
    coffeeBoostRemaining: 0,
    stationNudgeBoostRemaining: 0,
    stationStats: {
      queue: { protocols: 0, cornerCuts: 0 },
      grill: { protocols: 0, cornerCuts: 0 },
      assembly: { protocols: 0, cornerCuts: 0 },
      window: { protocols: 0, cornerCuts: 0 },
      fryer: { protocols: 0, cornerCuts: 0 },
      coffee: { protocols: 0, cornerCuts: 0 },
      bathroom: { protocols: 0, cornerCuts: 0 },
    },
    totalCornerCuts: 0,
    totalProtocols: 0,
    totalRestTicks: 0,
    totalMealTicks: 0,
    breakTaskLockedSeconds: 0,
    bladderCriticalElapsedSeconds: 0,
  }));

  const state: KitchenState = {
    workers,
    stations,
    messes: [],
    purchasedUpgrades: {},
    stockCapacityBonus: 0,
    unlockedStations,
    coffeeSalesUnlocked: false,
    brandEquity: INITIAL_BRAND_EQUITY,
    peerCorrCutNorm: 0.0,
    wasteBuffer: 0,
    mealAvailable: false,
    mealUnits: 0,
    coffeePotUnits: COFFEE_POT_CAPACITY,
    stockUnits: STOCK_UNITS_CAPACITY,
    stockDepletedSeconds: 0,
    autoRestockEnabled: true,
    demandTier: 1,
    storeTier: 1,
    nextEscalationTimer: getEscalationInterval(),
    customers: [],
    policyDial: 0.2, // Default moderate policy
    gamePhase: 'day',
    dayNumber: 1,
    cash: 0,
    cashEarnedToday: 0,
    tipsEarnedToday: 0,
    cashSpentToday: 0,
    elapsedSeconds: 0,
    dayElapsedSeconds: 0,
    dayDurationSeconds: DAY_DURATION_SECONDS_DEFAULT,
    manager: {
      x: MANAGER_DEFAULT_POS.x,
      y: MANAGER_DEFAULT_POS.y,
      vx: 0,
      vy: 0,
      stamina: 1.0,
      coffeeBoostRemaining: 0,
      currentTask: 'supervise',
      taskProgress: 0,
      currentSuperviseTargetId: null,
      currentSuperviseTargetLockedSeconds: 0,
    },
    emergencyCallActive: false,
    ordersServed: 0,
    totalViolationsCaught: 0,
    totalAbandonedOrders: 0,
    totalCornerCutsTaken: 0,
    totalProtocolTasks: 0,
    logEvents: [
      {
        id: 'init-1',
        timestamp: 0,
        message: 'Shift starting! Workers assigned to primary stations. Demand will escalate over time.',
        type: 'info',
      },
    ],
    isPaused: false,
    speedMultiplier: 1,
    shopItemsEverAvailable: {},
    hasSeenCautionHint: false,
    committedRepairTask: null,
    situationQueue: [],
    bathroomQueue: [],
  };

  for (const o of initialQueueOrders) {
    spawnCustomerForOrder(state, o);
  }

  return state;
}

let nextArrivalTime = 2.0;
let nextUtilityTickTime = 0.5;
let stationHoldTimers: Record<StationId, number> = {
  queue: 0,
  grill: 0,
  assembly: 0,
  window: 0,
  fryer: 0,
  coffee: 0,
  bathroom: 0,
};

/**
 * Resets day timer and transitions gamePhase back to day.
 */
export function startNextDay(state: KitchenState): void {
  state.gamePhase = 'day';
  state.dayElapsedSeconds = 0;
  state.demandTier = state.storeTier || 1; // real, flat weekly baseline
  state.nextEscalationTimer = getEscalationInterval(); // fresh escalation timer
  state.cashEarnedToday = 0;
  state.tipsEarnedToday = 0;
  state.cashSpentToday = 0;
  for (const s of state.stations) {
    s.batchQuality = BATCH_QUALITY_MAX;
  }
}

/**
 * Main tick update for the open-ended kitchen simulation.
 * Called at ~60Hz with deltaTime `dt` (in seconds).
 */
export function tickKitchenState(state: KitchenState, dt: number): void {
  if (
    state.isPaused ||
    state.gamePhase === 'night' ||
    state.gamePhase === 'intro' ||
    state.gamePhase === 'game_over' ||
    state.gamePhase === 'victory'
  ) return;

  if (state.brandEquity <= GAME_OVER_BRAND_EQUITY_THRESHOLD) {
    state.gamePhase = 'game_over';
    return;
  }

  const actualDt = dt * state.speedMultiplier;
  state.elapsedSeconds += actualDt;
  state.dayElapsedSeconds += actualDt;

  if (state.dayElapsedSeconds >= state.dayDurationSeconds) {
    const wasWaveDay = state.dayNumber % 7 === 0;
    if (state.dayNumber >= TOTAL_DAYS) {
      state.gamePhase = 'victory'; // Day 7 just completed — real win, not a continuation to Day 8
      if (wasWaveDay) {
        state.storeTier = (state.storeTier || 1) + 1;
        for (const s of state.stations) {
          s.degradationStage = 0;
        }
        state.situationQueue = [];
        state.committedRepairTask = null;
      }
      return;
    }
    state.gamePhase = 'night';
    state.dayNumber += 1; // real day just completed; Night now represents "preparing Day N+1"
    if (wasWaveDay) {
      state.storeTier = (state.storeTier || 1) + 1;
      for (const s of state.stations) {
        s.degradationStage = 0;
      }
      state.situationQueue = [];
      state.committedRepairTask = null;
    }
    return;
  }

  // Update Manager committed repair task
  if (state.committedRepairTask && state.committedRepairTask.remainingSeconds > 0) {
    state.committedRepairTask.remainingSeconds -= actualDt;
    state.manager.currentTask = 'repair';
    if (state.committedRepairTask.remainingSeconds <= 0) {
      const st = state.stations.find((s) => s.id === state.committedRepairTask!.stationId);
      if (st) {
        st.degradationStage = 0;
      }
      state.committedRepairTask = null;
      state.manager.currentTask = 'supervise';
    }
  }

  // Update pending Situation queue escalation timers
  updateSituationEscalation(state, actualDt);

  // 1. Demand Curve & Escalation Update
  const isWaveDay = state.dayNumber % 7 === 0;
  const currentStoreTier = state.storeTier || 1;
  if (isWaveDay) {
    const wavePeak = currentStoreTier * WAVE_INTENSITY_MULTIPLIER;
    const progress = Math.min(1, state.dayElapsedSeconds / state.dayDurationSeconds);
    state.demandTier = currentStoreTier + (wavePeak - currentStoreTier) * progress; // real, linear build-up
  } else {
    state.demandTier = currentStoreTier;
  }

  // Emergency Call status trigger condition (Brand Equity low OR multiple violations)
  state.emergencyCallActive = state.brandEquity < 40 || state.totalViolationsCaught >= 3;

  // 2. Customer Arrivals
  nextArrivalTime -= actualDt;
  if (nextArrivalTime <= 0) {
    const queueStation = state.stations.find((s) => s.id === 'queue');
    if (queueStation) {
      if (queueStation.orders.length < queueStation.bufferCapacity) {
        const order = createOrder(state.unlockedStations.fryer ? undefined : false);
        queueStation.orders.push(order);
        spawnCustomerForOrder(state, order);
        if (order.wantsFries) {
          const fryerStation = state.stations.find((s) => s.id === 'fryer');
          if (fryerStation) {
            fryerStation.orders.push(order);
          }
        }
      } else {
        // Queue overflow -> Order Abandonment!
        state.totalAbandonedOrders++;
        state.brandEquity = Math.max(0, state.brandEquity - BRAND_EQUITY_ABANDONED_ORDER_PENALTY);
        accumulateWaste(state, WASTE_PER_ABANDONED_ORDER, 'Customer abandoned queue due to overflow');

        const abandonedOrder = queueStation.orders.shift();
        if (abandonedOrder) {
          removeCustomerForAbandonedOrder(state, abandonedOrder.id);
          const fryerStation = state.stations.find((s) => s.id === 'fryer');
          if (fryerStation) {
            fryerStation.orders = fryerStation.orders.filter((o) => o.id !== abandonedOrder.id);
          }
        }

        addLog(
          state,
          `ORDER ABANDONED! Queue overflowed (-${BRAND_EQUITY_ABANDONED_ORDER_PENALTY} Brand Equity)`,
          'violation'
        );
      }
    }
    nextArrivalTime = getArrivalInterval(state.demandTier);
  }

  // 3. Update Customer Entities (Steering Physics, Linger & Despawn)
  if (state.customers) {
    for (const c of state.customers) {
      const force = computeCustomerSteering(c, state);
      applyCustomerPhysics(c, force, actualDt);
    }
  }
  state.customers = updateCustomers(state.customers, actualDt);

  // 4. Peer Contagion Decay & Coffee Pot Passive Regen
  state.peerCorrCutNorm = Math.max(0.0, state.peerCorrCutNorm - CONTAGION_DECAY_RATE * actualDt);
  state.coffeePotUnits = Math.min(COFFEE_POT_CAPACITY, state.coffeePotUnits + COFFEE_BREW_RATE_PER_SECOND * actualDt);

  // Station Idle Batch Quality Decay
  updateStationIdleDecay(state, actualDt);

  // Worker Coffee Boost, Station Nudge Boost Decay & Bladder Failure tracking
  updateWorkerNeeds(state, actualDt);

  // Manager Coffee Boost Decay
  if (state.manager.coffeeBoostRemaining > 0) {
    state.manager.coffeeBoostRemaining = Math.max(0, state.manager.coffeeBoostRemaining - COFFEE_BOOST_DECAY_RATE * actualDt);
  }

  // 5. Layer 1 Discrete Task & Station Selection (2Hz evaluation)
  nextUtilityTickTime -= actualDt;
  const isUtilityTick = nextUtilityTickTime <= 0;
  if (isUtilityTick) {
    nextUtilityTickTime = 1.0 / UTILITY_TICK_RATE_HZ;

    // Manager 2Hz Layer 1 evaluation
    if (state.manager.taskProgress <= 0) {
      const mgrDecision = evaluateManagerTick(state.manager, state);
      state.manager.currentTask = mgrDecision.name as ManagerTaskType;
    }

    const reservedThisTick = new Set<StationId>();

    for (const worker of state.workers) {
      const isLockedBreakTask =
        worker.currentTask !== 'protocol' &&
        worker.currentTask !== 'corner_cut' &&
        worker.breakTaskLockedSeconds < BREAK_TASK_MIN_LOCK_SECONDS;

      if (worker.taskProgress > 0 || isLockedBreakTask) continue; // committed — resolve current task before re-deciding anything

      const previousTask = worker.currentTask;

      // Evaluate task winner via utility scoring argmax
      const decision = evaluateWorkerTick(worker, state);
      worker.currentTask = decision.name as TaskType;

      if (worker.currentTask !== previousTask) {
        worker.breakTaskLockedSeconds = 0;
      }

      const isNewNonStation =
        worker.currentTask === 'rest' ||
        worker.currentTask === 'eat_meal' ||
        worker.currentTask === 'drink_coffee' ||
        worker.currentTask === 'drink_water' ||
        worker.currentTask === 'use_bathroom' ||
        worker.currentTask === 'clean_bathroom' ||
        worker.currentTask === 'discharge_meal' ||
        worker.currentTask === 'clean_mess';

      if (isNewNonStation) {
        worker.claimedResource = null;
        worker.currentStation = null;
      } else {
        // Choose station using magnitude utility scoring argmax (excluding stage 3 unusable/broken and out-of-order stations)
        const availableForSelection = state.stations.filter(
          (s) => state.unlockedStations[s.id] && (s.degradationStage || 0) < 3 && !s.isOutOfOrder
        );
        const chosenStation = chooseStation(worker, availableForSelection, reservedThisTick);
        worker.claimedResource = chosenStation || worker.claimedResource || 'grill';
        if (worker.claimedResource) {
          reservedThisTick.add(worker.claimedResource);
        }
      }
    }
  }

  // Maintain Bathroom Queue & Single-Occupancy state
  updateBathroomQueueAndOccupancy(state);

  // 6. Layer 2 Steering & Task Execution (60Hz)
  for (const st of state.stations) {
    st.occupiedBy = null;
  }

  for (const worker of state.workers) {
    const force = computeWorkerSteering(worker, state);
    applyWorkerPhysics(worker, force, actualDt);
    processWorkerExecution(worker, state, actualDt);
  }

  // Manager 60Hz Physics & Stamina Update
  const previousSuperviseTargetId = state.manager.currentSuperviseTargetId;
  const mgrForce = computeManagerSteering(state.manager, state);
  applyManagerPhysics(state.manager, mgrForce, actualDt);

  if (state.manager.currentSuperviseTargetId === previousSuperviseTargetId) {
    state.manager.currentSuperviseTargetLockedSeconds += actualDt;
  } else {
    state.manager.currentSuperviseTargetLockedSeconds = 0;
  }

  if (state.manager.currentTask === 'rest') {
    const inRestArea =
      Math.abs(state.manager.x - (STAFF_AREA.x + STAFF_AREA.width / 2)) < 50 &&
      Math.abs(state.manager.y - (STAFF_AREA.y + STAFF_AREA.height / 2)) < 50;
    if (inRestArea) {
      state.manager.stamina = Math.min(1.0, state.manager.stamina + 0.12 * actualDt);
      if (state.manager.stamina >= 0.99) {
        state.manager.taskProgress = 0;
      }
    } else {
      state.manager.taskProgress = Math.min(1.0, state.manager.taskProgress + actualDt / 4.0);
    }
  } else if (state.manager.currentTask === 'drink_coffee') {
    const coffeeStation = STATION_CONFIGS.coffee;
    const inCoffeeArea =
      Math.abs(state.manager.x - (coffeeStation.x + coffeeStation.width / 2)) < 50 &&
      Math.abs(state.manager.y - (coffeeStation.y + coffeeStation.height / 2)) < 50;
    if (inCoffeeArea && state.coffeePotUnits >= COFFEE_WORKER_PORTION_SIZE) {
      state.coffeePotUnits -= COFFEE_WORKER_PORTION_SIZE;
      state.manager.coffeeBoostRemaining = Math.min(1.0, state.manager.coffeeBoostRemaining + COFFEE_STAMINA_BOOST);
      state.manager.taskProgress = 0;
    } else {
      state.manager.taskProgress = Math.min(1.0, state.manager.taskProgress + actualDt / 4.0);
    }
  } else if (state.manager.currentTask === 'clean_mess') {
    state.manager.stamina = Math.max(0.0, state.manager.stamina - 0.012 * actualDt);
    if (!state.messes || state.messes.length === 0) {
      state.manager.taskProgress = 0;
    } else {
      let nearestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < state.messes.length; i++) {
        const mess = state.messes[i];
        const dx = state.manager.x - mess.x;
        const dy = state.manager.y - mess.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      if (minDist < 50) {
        state.manager.taskProgress += actualDt / CLEAN_MESS_DURATION_SECONDS;
        if (state.manager.taskProgress >= 1.0) {
          state.messes.splice(nearestIdx, 1);
          state.manager.taskProgress = 0;
        }
      } else {
        state.manager.taskProgress = Math.min(1.0, state.manager.taskProgress + actualDt / 4.0);
      }
    }
  } else {
    state.manager.stamina = Math.max(0.0, state.manager.stamina - 0.012 * actualDt);
    state.manager.taskProgress = Math.min(1.0, state.manager.taskProgress + actualDt / 4.0);
    if (state.manager.taskProgress >= 1.0) {
      state.manager.taskProgress = 0;
    }
  }

  // 7. Station Spoilage / Holding Buffer Check
  for (const station of state.stations) {
    if (station.id === 'grill' || station.id === 'assembly') {
      if (station.orders.length > 0) {
        stationHoldTimers[station.id] += actualDt;
        if (stationHoldTimers[station.id] >= PATTY_SPOILAGE_TIME_SEC) {
          stationHoldTimers[station.id] = 0;
          station.orders.shift();
          accumulateWaste(
            state,
            WASTE_PER_SPOILAGE,
            `Spoilage: Item sat too long at ${station.name}`
          );
        }
      } else {
        stationHoldTimers[station.id] = 0;
      }
    }
  }

  // Auto-restock check
  checkAutoRestock(state, actualDt);

  // Final Game Over check for mutations that occurred during this tick
  if (state.brandEquity <= GAME_OVER_BRAND_EQUITY_THRESHOLD) {
    state.gamePhase = 'game_over';
  }
}

function addLog(state: KitchenState, message: string, type: LogEvent['type']): void {
  const log: LogEvent = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Math.floor(state.elapsedSeconds),
    message,
    type,
  };
  state.logEvents.unshift(log);
  if (state.logEvents.length > 50) state.logEvents.pop();
}

/**
 * Updates situation queue escalation timers.
 */
export function updateSituationEscalation(state: KitchenState, actualDt: number): void {
  if (state.situationQueue && state.situationQueue.length > 0) {
    for (const sit of state.situationQueue) {
      sit.elapsedSeconds += actualDt;
      const intervalsPassed = Math.floor(sit.elapsedSeconds / SITUATION_ESCALATION_INTERVAL_SECONDS);
      const newStage = Math.min(3, sit.initialStage + intervalsPassed);
      if (newStage > sit.stage) {
        sit.stage = newStage;
        const st = state.stations.find((s) => s.id === sit.stationId);
        if (st) {
          st.degradationStage = Math.max(st.degradationStage || 0, sit.stage);
        }
      }
    }
  }
}

/**
 * Handles station idle batch quality decay and broken elapsed seconds tracking.
 */
export function updateStationIdleDecay(state: KitchenState, actualDt: number): void {
  const activeStationIds = new Set<StationId>();
  for (const w of state.workers) {
    if (w.currentStation) {
      activeStationIds.add(w.currentStation);
    }
    if (w.claimedResource) {
      activeStationIds.add(w.claimedResource);
    }
    if (w.primaryStation && w.currentTask !== 'rest' && w.currentTask !== 'eat_meal') {
      activeStationIds.add(w.primaryStation);
    }
  }
  for (const station of state.stations) {
    if (station.isOutOfOrder) {
      station.brokenElapsedSeconds = (station.brokenElapsedSeconds || 0) + actualDt;
    } else {
      station.brokenElapsedSeconds = 0;
    }
    if (station.occupiedBy) {
      activeStationIds.add(station.id);
    }
    const config = STATION_CONFIGS[station.id];
    if (station.batchQuality === undefined) {
      station.batchQuality = BATCH_QUALITY_MAX;
    }
    if (config.hasProductQuality && !activeStationIds.has(station.id)) {
      station.batchQuality = Math.max(
        BATCH_QUALITY_MIN,
        station.batchQuality - BATCH_QUALITY_DECAY_PER_SECOND_IDLE * actualDt
      );
    }
  }
}

/**
 * Handles worker thirst decay, bladder failure, and boost tracking.
 */
export function updateWorkerNeeds(state: KitchenState, actualDt: number): void {
  for (const w of state.workers) {
    w.thirst = Math.max(0, (w.thirst ?? 1.0) - THIRST_DECAY_PER_SECOND * actualDt);
    if ((w.bladderPressure ?? 0) >= 1.0) {
      w.bladderCriticalElapsedSeconds = (w.bladderCriticalElapsedSeconds ?? 0) + actualDt;
      if (w.bladderCriticalElapsedSeconds >= BLADDER_FAILURE_THRESHOLD_SECONDS) {
        w.bladderPressure = 0;
        w.bladderCriticalElapsedSeconds = 0;
        if (!state.messes) state.messes = [];
        state.messes.push({
          id: `mess-${Math.random().toString(36).substring(2, 7)}`,
          x: w.x,
          y: w.y,
          source: 'worker_accident',
          createdTime: state.elapsedSeconds,
        });
      }
    } else {
      w.bladderCriticalElapsedSeconds = 0;
    }

    if (w.coffeeBoostRemaining > 0) {
      w.coffeeBoostRemaining = Math.max(0, w.coffeeBoostRemaining - COFFEE_BOOST_DECAY_RATE * actualDt);
    }
    if (w.stationNudgeBoostRemaining > 0) {
      w.stationNudgeBoostRemaining = Math.max(0, w.stationNudgeBoostRemaining - actualDt);
    }
    if (w.currentTask !== 'protocol' && w.currentTask !== 'corner_cut') {
      w.breakTaskLockedSeconds += actualDt;
    } else {
      w.breakTaskLockedSeconds = 0;
    }
  }
}

/**
 * Updates bathroom queue membership and occupancy promotion.
 */
export function updateBathroomQueueAndOccupancy(state: KitchenState): void {
  const bathroom = state.stations.find((s) => s.id === 'bathroom');
  if (!bathroom) return;

  if (!state.bathroomQueue) {
    state.bathroomQueue = [];
  }
  if (bathroom.occupiedByWorkerId === undefined) {
    bathroom.occupiedByWorkerId = null;
  }

  // 1. Clear occupancy or queue spot for workers who abandoned or finished use_bathroom
  for (const w of state.workers) {
    if (w.currentTask !== 'use_bathroom') {
      if (bathroom.occupiedByWorkerId === w.id) {
        bathroom.occupiedByWorkerId = null;
      }
      const qIdx = state.bathroomQueue.indexOf(w.id);
      if (qIdx !== -1) {
        state.bathroomQueue.splice(qIdx, 1);
      }
    }
  }

  // 2. Add workers wanting bathroom to queue if not occupant and not in queue
  for (const w of state.workers) {
    if (w.currentTask === 'use_bathroom') {
      if (bathroom.occupiedByWorkerId !== w.id && !state.bathroomQueue.includes(w.id)) {
        state.bathroomQueue.push(w.id);
      }
    }
  }

  // 3. Promote front of queue if bathroom is unoccupied
  if (bathroom.occupiedByWorkerId === null && state.bathroomQueue.length > 0) {
    bathroom.occupiedByWorkerId = state.bathroomQueue.shift()!;
  }
}
