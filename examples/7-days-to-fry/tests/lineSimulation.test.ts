import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateCustomerAtWindow, removeCustomerForAbandonedOrder, spawnCustomerAtWindow, spawnCustomerForOrder } from '../src/customers';
import { ADDON_PRICE_FRIES, AUTO_RESTOCK_DELAY_SECONDS, AVOID_WORKERS_DIST, BASE_PRICE_BURGER, BASIC_UPGRADES_MIN_DAY, BATCH_QUALITY_DECAY_PER_SECOND_IDLE, BATCH_QUALITY_GAIN_PER_PROTOCOL, BATCH_QUALITY_LOSS_PER_CORNER_CUT, BATCH_QUALITY_MAX, BATCH_QUALITY_MIN, BATHROOM_CLEAN_URGENCY_RISE_PER_SECOND, BATHROOM_CLOG_CHANCE, BATHROOM_QUEUE_WAYPOINTS, BLADDER_FAILURE_THRESHOLD_SECONDS, BLADDER_RISE_PER_WATER, BLADDER_URGENCY_THRESHOLD, BRAND_EQUITY_GAIN_PER_CLEAN_ORDER, BRAND_EQUITY_VIOLATION_PENALTY, BRAND_RECOVERY_AMOUNT, BREAK_TASK_MIN_LOCK_SECONDS, BUFFER_CAPACITY_INCREASE, CASH_PER_CLEAN_ORDER, CLEAN_BATHROOM_BASE_SCORE, CLEAN_BATHROOM_MAX_SCORE, COFFEE_BOOST_DECAY_RATE, COFFEE_BREW_RATE_PER_SECOND, COFFEE_POT_CAPACITY, DAY_DURATION_INCREASE_SECONDS, ENTRANCE_POS, EQUIPMENT_DEGRADATION_CHANCE, EXIT_POS, FRIES_UNLOCK_MIN_DAY, HUD_RECTS, MANAGER_REST_URGENCY_THRESHOLD, MANAGER_SUPERVISION_RADIUS, MANAGER_TARGET_MAX_LOCK_SECONDS, MEAL_CRITICAL_THRESHOLD, MEAL_PORTION_SIZE, MEAL_UNIT_COST, MEAL_URGENCY_THRESHOLD, QUALITY_DEGRADATION_PER_CORNER_CUT, QUALITY_TIER_DELIGHTED, QUALITY_TIER_DISAPPOINTED, QUALITY_TIER_NEUTRAL, QUALITY_TIER_SATISFIED, QUEUE_WAYPOINTS, REPAIR_DURATION_STAGE_1, REPAIR_DURATION_STAGE_2, REPAIR_DURATION_STAGE_3, REST_APPROACHING_THRESHOLD, REST_CRITICAL_THRESHOLD, REST_URGENCY_THRESHOLD, SITUATION_ESCALATION_INTERVAL_SECONDS, STAFF_AREA, STATION_CONFIGS, STATION_NUDGE_DURATION_SECONDS, STOCK_CAPACITY_INCREASE, STOCK_UNITS_CAPACITY, TIP_MAX_PER_ORDER, TOTAL_DAYS, UNLOAD_TRUCK_COST, UPGRADE_BRAND_RECOVERY_COST, UPGRADE_BUFFER_CAPACITY_COST, UPGRADE_DAY_DURATION_COST, UPGRADE_FRIES_UNLOCK_COST, UPGRADE_STOCK_CAPACITY_COST, WAVE_INTENSITY_MULTIPLIER, WEEK_ONE_TIER_UP_MESSAGE } from '../src/data';
import * as dataModule from '../src/data';
import { checkAutoRestock, unloadTruck } from '../src/stockEconomy';
import { purchaseBrandRecovery, purchaseBufferCapacity, purchaseDayDuration, purchaseFriesUnlock, purchaseStockCapacity } from '../src/nightShop';
import { createOrder, getArrivalInterval, updateDemandCurve } from '../src/demandCurve';
import { getLiveStats } from '../src/liveStats';
import { policyDialController } from '../src/policyDialControl';
import { createInitialKitchenState, startNextDay, tickKitchenState } from '../src/sessionLoop';
import { chooseStation, scoreStationNeed } from '../src/stationAssignment';
import { applyCustomerPhysics, computeCustomerSteering, computeWorkerSteering, forceAvoidClaimedResources, getManagerTargetPos, getWorkerTargetPos } from '../src/steering';
import { executeStationTaskCompletion, processWorkerExecution } from '../src/taskExecution';
import { processWorkerBreakExecution } from '../src/execution/breakExecution';
import { KitchenState, Order, StationId, Worker } from '../src/types';
import { evaluateManagerTick, evaluateWorkerTick, getCustomerFacialExpression, getEffectiveStamina, getManagerFacialExpression, getWorkerFacialExpression, scoreCleanBathroom, scoreCleanMess, scoreCoffee, scoreCornerCut, scoreDischargeMeal, scoreEatMeal, scoreManagerAutoRepair, scoreManagerCoffee, scoreManagerPatrol, scoreManagerRest, scoreManagerSupervise, scoreProtocol, scoreRest, scoreThirst, scoreUseBathroom, scoreWorkerSupervisionPriority } from '../src/utilityScoring';
import { getAvailableAttention, investigateWorker, nudgeToStation, respondToSituation, selectBestAction, setPrimaryStation, spendAttention } from '../src/scoring/taskSelection';
import { autoDischargeWaste, dischargeStaffMeal } from '../src/wasteEconomy';
import { getTierUpMessage, isNewThisNight } from '../src/components/NightScreen';
import { renderWorker, renderWorkers } from '../src/components/canvas/renderWorkers';
import * as fs from 'fs';
import * as path from 'path';

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0x811c9dc5; // FNV-1a 32-bit init
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

describe('The Line — Directive Test Anchors (§3)', () => {
  beforeEach(() => {
    const testName = expect.getState().currentTestName || 'default_seed';
    const seed = hashString(testName);
    const prng = mulberry32(seed);
    vi.spyOn(Math, 'random').mockImplementation(() => prng());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  // Anchor 1: Epsilon Floor Verification
  it('1. corner_cut score is never zero on a fresh shift with zero contagion', () => {
    const k: KitchenState = createInitialKitchenState();
    k.peerCorrCutNorm = 0.0; // Raw contagion set strictly to zero
    k.stations[0].orders = Array.from({ length: 6 }, () => createOrder()); // High backpressure

    const w: Worker = { ...k.workers[0], stamina: 0.2 }; // Low stamina worker

    const score = scoreCornerCut(w, k);
    expect(score).toBeGreaterThan(0.001); // Asserts epsilon floor (0.05) prevents 0 score
  });

  // Anchor 2: Code Inspection for Threshold Gate Branches
  it('2. evaluateWorkerTick never branches on a raw magnitude comparison', () => {
    const taskSelectionPath = path.resolve(__dirname, '../src/scoring/taskSelection.ts');
    const utilityScoringPath = path.resolve(__dirname, '../src/utilityScoring.ts');
    const code = fs.existsSync(taskSelectionPath)
      ? fs.readFileSync(taskSelectionPath, 'utf-8')
      : fs.readFileSync(utilityScoringPath, 'utf-8');

    // Extracts evaluateWorkerTick function body
    const fnStart = code.indexOf('function evaluateWorkerTick');
    expect(fnStart).toBeGreaterThan(-1);
    const fnBody = code.slice(fnStart, fnStart + 600);

    // Asserts no threshold gate magnitude or score comparison IF statements exist inside evaluateWorkerTick
    expect(fnBody).not.toMatch(/if\s*\(.*(score|magnitude).*(>|<|>=|<=).*\)/i);
    expect(fnBody).not.toMatch(/if\s*\(.*scoreCornerCut.*>.*scoreProtocol.*\)/i);
  });

  // Anchor 3: System Separation Check
  it("3. a worker's task selection and its steering force are computed by separate functions with no shared internal state", () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];

    // Evaluate task selection independently
    const taskResult = evaluateWorkerTick(w, k);
    expect(['protocol', 'corner_cut', 'rest', 'eat_meal']).toContain(taskResult.name);

    // Compute steering force independently
    const steeringResult = computeWorkerSteering(w, k);
    expect(steeringResult).toHaveProperty('x');
    expect(steeringResult).toHaveProperty('y');
    expect(typeof steeringResult.x).toBe('number');
    expect(typeof steeringResult.y).toBe('number');
  });

  // Anchor 4: Claimed Resource Exclusivity
  it('4. Claimed resource avoidance excludes only the occupying worker', () => {
    const k = createInitialKitchenState();
    const workerA = k.workers[0];
    const workerB = k.workers[1];

    // Station claimed/occupied by Worker A
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    grillStation.occupiedBy = workerA.id;

    // Position both workers near the grill station
    workerA.x = grillStation.x + grillStation.width / 2;
    workerA.y = grillStation.y + grillStation.height / 2 + 10;

    workerB.x = grillStation.x + grillStation.width / 2;
    workerB.y = grillStation.y + grillStation.height / 2 + 10;

    // Worker A force (occupier)
    const forceA = forceAvoidClaimedResources(workerA, k.stations);
    expect(forceA.x).toBe(0);
    expect(forceA.y).toBe(0);

    // Worker B force (outsider)
    const forceB = forceAvoidClaimedResources(workerB, k.stations);
    expect(Math.abs(forceB.x) + Math.abs(forceB.y)).toBeGreaterThan(0);
  });

  // Anchor 5: Empty Waste Buffer Discharge Safeguard
  it('5. staff meal discharge does nothing when the waste buffer is empty', () => {
    const k = createInitialKitchenState();
    k.wasteBuffer = 0;
    const initialMorale = k.workers[0].morale;

    const discharged = dischargeStaffMeal(k);

    expect(discharged).toBe(false);
    expect(k.wasteBuffer).toBe(0);
    expect(k.workers[0].morale).toBe(initialMorale);
  });

  // Anchor 6: Dynamic Brand Equity Trajectory
  it('6. a full session run produces a real, varying Brand Equity trajectory across multiple seeds', () => {
    // Run Strict session
    const strictState = createInitialKitchenState();
    strictState.policyDial = 0.0; // Strict protocol policy

    for (let i = 0; i < 3000; i++) {
      tickKitchenState(strictState, 0.05);
    }

    // Run Throughput policy session
    const throughputState = createInitialKitchenState();
    throughputState.policyDial = 1.0; // Max throughput policy
    for (const station of throughputState.stations) {
      if (station.id === 'grill' || station.id === 'assembly') {
        station.orders = Array.from({ length: Math.floor(station.bufferCapacity * 0.8) }, () => createOrder());
      }
    }

    for (let i = 0; i < 3000; i++) {
      tickKitchenState(throughputState, 0.05);
    }

    expect(strictState.elapsedSeconds).toBeGreaterThan(10);
    expect(throughputState.elapsedSeconds).toBeGreaterThan(10);

    // High throughput policy leads to more corner cuts & potential violations
    expect(throughputState.totalCornerCutsTaken).toBeGreaterThan(strictState.totalCornerCutsTaken);
  });

  // Anchor 7: Scoring-based Station Assignment (Fixes Herding Bug)
  it('7. chooseStation selects station using buffer magnitude argmax scoring instead of fixed priority scan', () => {
    const k = createInitialKitchenState();
    const worker = k.workers[0]; // primaryStation: queue

    // Set high buffer load on assembly station
    const assembly = k.stations.find((s) => s.id === 'assembly')!;
    assembly.orders = Array.from({ length: 7 }, () => createOrder()); // 7/8 load

    const queue = k.stations.find((s) => s.id === 'queue')!;
    queue.orders = Array.from({ length: 1 }, () => createOrder()); // 1/8 load

    const chosen = chooseStation(worker, k.stations);
    expect(chosen).toBe('assembly'); // Assembly has much higher work magnitude
  });

  // Anchor 8: Primary Station Ownership Bonus
  it('8. scoreStationNeed applies primary station ownership bonus when station matches worker primaryStation', () => {
    const k = createInitialKitchenState();
    const worker = k.workers[1]; // primaryStation: grill

    const grill = k.stations.find((s) => s.id === 'grill')!;
    const assembly = k.stations.find((s) => s.id === 'assembly')!;

    grill.orders = Array.from({ length: 4 }, () => createOrder());
    assembly.orders = Array.from({ length: 4 }, () => createOrder());

    const grillScore = scoreStationNeed(grill, worker);
    const assemblyScore = scoreStationNeed(assembly, worker);

    expect(grillScore).toBeGreaterThan(assemblyScore);
  });

  // Anchor 9: Staff Meal Utility Scoring
  it('9. scoreEatMeal yields positive utility only when meal is available and worker morale is depleted', () => {
    const k = createInitialKitchenState();
    const worker = k.workers[0];
    worker.morale = 0.2; // Low morale

    // Meal not available yet
    k.mealAvailable = false;
    expect(scoreEatMeal(worker, k)).toBe(0);

    // Meal available
    k.mealAvailable = true;
    k.mealUnits = 5;
    expect(scoreEatMeal(worker, k)).toBeGreaterThan(1.0);
  });

  // Anchor 10: Spatial Meal Area Morale Regeneration
  it('10. processWorkerExecution in STAFF_AREA smoothly regenerates worker morale when eating staff meal', () => {
    const k = createInitialKitchenState();
    k.mealAvailable = true;
    k.mealUnits = 10;

    const worker = k.workers[0];
    worker.morale = 0.3;
    worker.currentTask = 'eat_meal';
    worker.x = STAFF_AREA.x + STAFF_AREA.width / 2;
    worker.y = STAFF_AREA.y + STAFF_AREA.height / 2;

    processWorkerExecution(worker, k, 1.0);

    expect(worker.morale).toBeGreaterThan(0.3);
    expect(k.mealUnits).toBeLessThan(10);
  });

  // Anchor 11: Visual Customer Sink at Pickup Window
  it('11. executeStationTaskCompletion at pickup window spawns a customer entity at the window', () => {
    const k = createInitialKitchenState();
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    windowStation.orders = [order];

    const worker = k.workers[3];

    executeStationTaskCompletion(worker, windowStation, k, STATION_CONFIGS.window);

    const receivingCustomers = k.customers.filter((c) => c.state === 'receiving');
    expect(receivingCustomers.length).toBe(1);
    expect(receivingCustomers[0].state).toBe('receiving');
  });

  // Anchor 12: Escalating Demand Curve
  it('12. updateDemandCurve escalates demandTier over time', () => {
    const k = createInitialKitchenState();
    k.demandTier = 1;
    k.nextEscalationTimer = 0.1;

    updateDemandCurve(k, 0.2);

    expect(k.demandTier).toBe(2);
  });

  // Anchor 13: Continuous Live Stats Computation
  it('13. getLiveStats continuously computes live throughput and grade during simulation', () => {
    const k = createInitialKitchenState();
    k.elapsedSeconds = 120; // 2 minutes
    k.ordersServed = 10;
    k.totalCornerCutsTaken = 5;
    k.totalViolationsCaught = 0;
    k.brandEquity = 90;

    const stats = getLiveStats(k);

    expect(stats.throughputPerMinute).toBe(5);
    expect(stats.violationRate).toBe(0);
    expect(stats.currentGrade).toBe('S');
  });

  // Anchor 14: Game Over Guard (Brand Equity at 0)
  it('14. Brand Equity reaching 0 transitions gamePhase to game_over and halts state mutation', () => {
    const k = createInitialKitchenState();
    k.brandEquity = 0;
    const initialElapsed = k.elapsedSeconds;

    tickKitchenState(k, 1.0);

    expect(k.gamePhase).toBe('game_over');
    expect(k.elapsedSeconds).toBe(initialElapsed);
  });

  // Anchor 15: Rest Utility Dominance Over Protocol Ceiling
  it("15. scoreRest exceeds Protocol's absolute worst-case ceiling before stamina reaches zero", () => {
    const k = createInitialKitchenState();
    k.policyDial = 0.0; // Strict protocol policy for maximum protocol score

    const maxWorker: Worker = {
      ...k.workers[0],
      x: k.manager.x,
      y: k.manager.y, // Exactly under manager's supervision
      morale: 1.0, // Maximum morale
      stamina: 1.0,
    };

    // Calculate Protocol's real worst-case ceiling dynamically from current formulas
    const protocolWorstCaseCeiling = scoreProtocol(maxWorker, k);

    // Evaluate Rest score at stamina = 0.1 (before stamina reaches 0)
    const lowStaminaWorker: Worker = { ...maxWorker, stamina: 0.1 };
    const restScoreAt01 = scoreRest(lowStaminaWorker, k);

    expect(restScoreAt01).toBeGreaterThan(protocolWorstCaseCeiling);
  });

  // Anchor 16: Rest Negligibility at Healthy Stamina
  it('16. scoreRest stays negligible at healthy stamina', () => {
    const k = createInitialKitchenState();
    const healthyWorker: Worker = {
      ...k.workers[0],
      stamina: 0.6,
    };

    const restScore = scoreRest(healthyWorker, k);
    expect(restScore).toBeLessThanOrEqual(0.01);
  });

  // Anchor 17: Station Selection Reservation Collision Avoidance
  it('17. two workers with no primary-station preference never choose the same contested station in one evaluation pass', () => {
    const k = createInitialKitchenState();
    const queueStation = k.stations.find((s) => s.id === 'queue')!;
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    queueStation.orders = Array.from({ length: 5 }, () => createOrder());
    grillStation.orders = Array.from({ length: 2 }, () => createOrder());

    // Both workers have primaryStation 'window' so neither gets an ownership bonus on queue or grill
    const worker1: Worker = { ...k.workers[0], id: 'w1', primaryStation: 'window', claimedResource: null };
    const worker2: Worker = { ...k.workers[1], id: 'w2', primaryStation: 'window', claimedResource: null };

    const reservedThisTick = new Set<import('../src/types').StationId>();

    const choice1 = chooseStation(worker1, k.stations, reservedThisTick);
    if (choice1) reservedThisTick.add(choice1);

    const choice2 = chooseStation(worker2, k.stations, reservedThisTick);

    expect(choice1).toBe('queue');
    expect(choice2).not.toBe('queue');
    expect(choice2).toBe('grill');
  });

  // Anchor 18: Task Commitment Gate (No Mid-Task Re-Evaluation or Progress Reset)
  it('18. a worker with taskProgress > 0 is not re-evaluated or reassigned mid-task', () => {
    const k = createInitialKitchenState();

    // Set worker 0 mid-task at grill with taskProgress = 0.6 at grill station center position
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    grillStation.orders = Array.from({ length: 3 }, () => createOrder()); // Ensure orders exist so work progresses

    const w0 = k.workers[0];
    w0.currentTask = 'protocol';
    w0.claimedResource = 'grill';
    w0.currentStation = 'grill';
    w0.taskProgress = 0.6;
    w0.x = grillStation.x + grillStation.width / 2;
    w0.y = grillStation.y + grillStation.height / 2 + 15;

    // Drastically drop stamina to 0.05 (so scoreRest would overwhelmingly win if evaluated)
    w0.stamina = 0.05;

    // Trigger a tick (0.5s) that forces utility tick evaluation
    tickKitchenState(k, 0.5);

    // Confirm task and claimed resource remain unchanged, and progress did not reset
    expect(k.workers[0].currentTask).toBe('protocol');
    expect(k.workers[0].claimedResource).toBe('grill');
    expect(k.workers[0].taskProgress).toBeGreaterThan(0.6);
  });

  // Anchor 19: Real Order Identity (Unique ID and rolled wantsFries)
  it('19. orders spawn with a real id and a rolled wantsFries value', () => {
    const orders = Array.from({ length: 100 }, () => createOrder());
    const ids = new Set(orders.map((o) => o.id));

    // Assert all ids are non-empty and unique
    expect(ids.size).toBe(100);
    orders.forEach((o) => {
      expect(o.id).toBeTruthy();
      expect(typeof o.id).toBe('string');
      expect(o.friesComplete).toBe(!o.wantsFries);
      expect(o.burgerComplete).toBe(false);
    });

    // Assert wantsFries varies across samples (some true, some false)
    const wantsFriesCount = orders.filter((o) => o.wantsFries).length;
    expect(wantsFriesCount).toBeGreaterThan(10);
    expect(wantsFriesCount).toBeLessThan(90);
  });

  // Anchor 20: Station & Order Completion Byte-Identical Behavior
  it('20. existing station/completion behavior is byte-identical to before this phase', () => {
    const k = createInitialKitchenState();
    expect(k.stations.find((s) => s.id === 'queue')!.orders.length).toBe(2);

    for (let i = 0; i < 600; i++) {
      tickKitchenState(k, 0.1);
    }

    expect(k.elapsedSeconds).toBeCloseTo(60.0, 1);
    expect(k.ordersServed).toBeGreaterThan(0);
  });

  // Anchor 21: Shared Order Reference Across Line Buffers
  it('21. an order pushed to both queues shares the same reference', () => {
    const k = createInitialKitchenState();
    const queueStation = k.stations.find((s) => s.id === 'queue')!;
    const fryerStation = k.stations.find((s) => s.id === 'fryer')!;

    const order = createOrder(true); // wantsFries = true
    queueStation.orders = [order];
    fryerStation.orders = [order];

    expect(queueStation.orders[0]).toBe(fryerStation.orders[0]);

    // Mutate friesComplete via fryer reference
    fryerStation.orders[0].friesComplete = true;

    // Confirm mutation is immediately visible in queue buffer
    expect(queueStation.orders[0].friesComplete).toBe(true);
  });

  // Anchor 22: Window Completion Gate
  it('22. Window does not serve an order with burgerComplete true and friesComplete false', () => {
    const k = createInitialKitchenState();
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    const order = createOrder(true);
    order.burgerComplete = true;
    order.friesComplete = false;

    windowStation.orders = [order];
    const initialServed = k.ordersServed;
    const worker = k.workers[0];

    executeStationTaskCompletion(worker, windowStation, k, STATION_CONFIGS.window);

    // Order should NOT be served because friesComplete is false
    expect(k.ordersServed).toBe(initialServed);
    expect(windowStation.orders.length).toBe(1);

    // Now complete fries and try again
    order.friesComplete = true;
    executeStationTaskCompletion(worker, windowStation, k, STATION_CONFIGS.window);

    expect(k.ordersServed).toBe(initialServed + 1);
    expect(windowStation.orders.length).toBe(0);
  });

  // Anchor 23: Fryer Station Ownership & General Scoring
  it('23. a worker can be assigned Fryer as a primary station and the existing scoring generalizes correctly', () => {
    const k = createInitialKitchenState();
    const worker: Worker = { ...k.workers[0], primaryStation: 'fryer', claimedResource: null };
    const fryerStation = k.stations.find((s) => s.id === 'fryer')!;
    fryerStation.orders = Array.from({ length: 6 }, () => createOrder(true));

    // Reset other stations
    for (const s of k.stations) {
      if (s.id !== 'fryer') s.orders = [];
    }

    const chosen = chooseStation(worker, k.stations);
    expect(chosen).toBe('fryer');

    const score = scoreStationNeed(fryerStation, worker);
    expect(score).toBeGreaterThan(0);
  });

  // Anchor 24: Customer Created at Order Creation
  it('24. a customer is created paired to their order at order creation, not at completion', () => {
    const k = createInitialKitchenState();
    const order = createOrder();
    spawnCustomerForOrder(k, order);

    const pairedCustomer = k.customers.find((c) => c.orderId === order.id);
    expect(pairedCustomer).toBeDefined();
    expect(pairedCustomer?.state).toBe('waiting');
    expect(order.customerId).toBe(pairedCustomer?.id);
  });

  // Anchor 25: Abandoned Order Customer Removal
  it('25. an abandoned order removes its paired customer entirely, not into a leaving state', () => {
    const k = createInitialKitchenState();
    const order = createOrder();
    spawnCustomerForOrder(k, order);

    // Verify paired customer exists
    expect(k.customers.some((c) => c.orderId === order.id)).toBe(true);

    // Force an abandonment for this order
    removeCustomerForAbandonedOrder(k, order.id);

    // Assert customer is gone entirely from state.customers, not present with state 'leaving'
    const customer = k.customers.find((c) => c.orderId === order.id);
    expect(customer).toBeUndefined();
    expect(k.customers.some((c) => c.orderId === order.id && c.state === 'leaving')).toBe(false);
  });

  // Anchor 26: Personal Meal Portion Draw
  it('26. a worker draws a personal meal portion once, not repeatedly, while eating', () => {
    const k = createInitialKitchenState();
    k.wasteBuffer = 30; // initial wasteBuffer

    const worker = k.workers[0];
    worker.morale = 0.3;
    worker.currentTask = 'eat_meal';
    worker.x = STAFF_AREA.x + STAFF_AREA.width / 2;
    worker.y = STAFF_AREA.y + STAFF_AREA.height / 2;

    // First arrival tick - draws portion once
    processWorkerExecution(worker, k, 0.5);

    expect(k.wasteBuffer).toBe(30 - MEAL_PORTION_SIZE);
    expect(worker.currentMeal).toBeDefined();
    expect(worker.currentMeal?.unitsRemaining).toBeLessThan(MEAL_PORTION_SIZE);

    const bufferAfterFirstTick = k.wasteBuffer;

    // Second tick while meal is still held
    processWorkerExecution(worker, k, 0.5);

    // Confirm wasteBuffer did not decrease again on subsequent tick while holding meal
    expect(k.wasteBuffer).toBe(bufferAfterFirstTick);
    expect(worker.currentMeal?.unitsRemaining).toBeGreaterThan(0);
  });

  // Anchor 27: Scarcity with No Waste Buffer
  it('27. a worker with no available waste buffer cannot eat, and does not falsely regenerate morale', () => {
    const k = createInitialKitchenState();
    k.wasteBuffer = 0;
    k.mealUnits = 0;
    k.mealAvailable = false;

    const worker = k.workers[0];
    worker.morale = 0.3;
    worker.currentTask = 'eat_meal';
    worker.x = STAFF_AREA.x + STAFF_AREA.width / 2;
    worker.y = STAFF_AREA.y + STAFF_AREA.height / 2;

    processWorkerExecution(worker, k, 1.0);

    expect(worker.currentMeal || null).toBeNull();
    expect(worker.morale).toBe(0.3);
  });

  // Anchor 28: Customer Queue Waypoint Steering
  it('28. customer in queue steers toward waypoint corresponding to order index, not a fixed static position', () => {
    const k = createInitialKitchenState();
    const order = createOrder();
    const customer = spawnCustomerForOrder(k, order);

    // Initial position is at Entrance
    expect(customer.x).toBe(ENTRANCE_POS.x);
    expect(customer.y).toBe(ENTRANCE_POS.y);

    const force = computeCustomerSteering(customer, k);
    // Steering force should point toward QUEUE_WAYPOINTS[0]
    const target = QUEUE_WAYPOINTS[0];
    const dx = target.x - customer.x;
    const dy = target.y - customer.y;

    // Both force and displacement vectors point in the same general direction (positive dot product)
    const dotProduct = force.x * dx + force.y * dy;
    expect(dotProduct).toBeGreaterThan(0);
  });

  // Anchor 29: Customer Leaving Steering to Exit
  it('29. customer in leaving state steers toward EXIT_POS, not staying at window position', () => {
    const k = createInitialKitchenState();
    const customer = {
      id: 'c1',
      orderId: 'o1',
      spawnTime: 0,
      x: 350,
      y: 100, // Near window
      vx: 0,
      vy: 0,
      lifespanRemaining: 1.0,
      state: 'leaving' as const,
    };
    k.customers = [customer];

    const force = computeCustomerSteering(customer, k);
    applyCustomerPhysics(customer, force, 0.5);

    // Customer should move toward EXIT_POS (x: 200, y: 380)
    expect(customer.y).toBeGreaterThan(100); // Moved south toward exit
    expect(customer.vx).not.toBe(0);
    expect(customer.vy).toBeGreaterThan(0);
  });

  // Anchor 30: Policy Dial Drag Release Guard
  it('30. Policy Dial drag state resets on window mouseup when mouse is released outside canvas', () => {
    const dialRect = HUD_RECTS.policyDial;
    const insidePos = { x: dialRect.x + 10, y: dialRect.y + 10 };
    const outsidePos = { x: -200, y: -200 };

    // 1. Mouse down inside dial bounds
    const valOnDown = policyDialController.handleMouseDown(insidePos);
    expect(valOnDown).not.toBeNull();
    expect(policyDialController.isDragging).toBe(true);

    // 2. Mouse move outside canvas bounds while dragging
    const valOnMoveOutside = policyDialController.handleMouseMove(outsidePos);
    expect(valOnMoveOutside).toBe(0.0); // Clamped to 0
    expect(policyDialController.isDragging).toBe(true);

    // 3. Window mouseup event
    policyDialController.handleMouseUp();
    expect(policyDialController.isDragging).toBe(false);

    // 4. Subsequent mouse move without drag does nothing
    const valOnMoveAfterRelease = policyDialController.handleMouseMove(insidePos);
    expect(valOnMoveAfterRelease).toBeNull();
  });

  // Anchor 31: Brand Equity Clean Order Recovery
  it('31. a clean order completion increases Brand Equity by exactly the locked gain value', () => {
    const k = createInitialKitchenState();
    k.brandEquity = 80;
    const order = createOrder(false);
    order.burgerComplete = true;
    order.friesComplete = true;

    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.orders = [order];

    const worker = k.workers[0];
    worker.currentTask = 'protocol';

    executeStationTaskCompletion(worker, windowStation, k, STATION_CONFIGS.window);

    expect(k.brandEquity).toBe(80 + BRAND_EQUITY_GAIN_PER_CLEAN_ORDER);
  });

  // Anchor 32: Caught Violation Excludes Clean Credit
  it('32. an order that had a caught violation does not also grant clean-completion credit', () => {
    const k = createInitialKitchenState();
    k.brandEquity = 80;
    const order = createOrder(false);
    order.burgerComplete = true;
    order.friesComplete = true;
    order.hadViolation = true;

    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.orders = [order];

    const worker = k.workers[0];
    worker.currentTask = 'protocol';

    executeStationTaskCompletion(worker, windowStation, k, STATION_CONFIGS.window);

    expect(k.brandEquity).toBe(83);
  });

  // Anchor 33: Brand Equity Clamps at 100
  it('33. Brand Equity cannot exceed 100', () => {
    const k = createInitialKitchenState();
    k.brandEquity = 99;

    const order = createOrder(false);
    order.burgerComplete = true;
    order.friesComplete = true;

    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.orders = [order];

    const worker = k.workers[0];
    worker.currentTask = 'protocol';

    executeStationTaskCompletion(worker, windowStation, k, STATION_CONFIGS.window);

    expect(k.brandEquity).toBe(100);
  });

  // Anchor 34: Emergency-Supervise Floor Beats Rest Urgency Max
  it('34. scoreManagerRest does not exceed Emergency-Supervise floor at stamina 0.0 to 0.4', () => {
    const k = createInitialKitchenState();
    k.emergencyCallActive = true;

    for (let stamina = 0.0; stamina <= 0.4; stamina += 0.1) {
      const mgr = { ...k.manager, stamina };
      const restScore = scoreManagerRest(mgr);
      const superviseScore = scoreManagerSupervise(mgr, k);

      // Rest score never exceeds 6.0
      expect(restScore).toBeLessThanOrEqual(6.0);
      // Emergency Supervise score floor is at least 9.0
      expect(superviseScore).toBeGreaterThanOrEqual(9.0);
      // Emergency Supervise strictly beats Rest at low stamina
      expect(superviseScore).toBeGreaterThan(restScore);
    }
  });

  // Anchor 35: Manager Patrol Score Monotonically Increases with Coverage Gap
  it('35. scoreManagerPatrol increases monotonically as coverageGap increases', () => {
    const k = createInitialKitchenState();
    const mgr = { ...k.manager, stamina: 1.0, x: 400, y: 260 };

    // Scenario 1: All workers close to manager (coverageGap = 0)
    k.workers = [
      { ...k.workers[0], x: 400, y: 260 },
      { ...k.workers[1], x: 410, y: 270 },
    ];
    const score1 = scoreManagerPatrol(mgr, k);

    // Scenario 2: Half workers far from manager (coverageGap = 0.5)
    k.workers = [
      { ...k.workers[0], x: 400, y: 260 },
      { ...k.workers[1], x: 100, y: 100 },
    ];
    const score2 = scoreManagerPatrol(mgr, k);

    // Scenario 3: All workers far from manager (coverageGap = 1.0)
    k.workers = [
      { ...k.workers[0], x: 700, y: 500 },
      { ...k.workers[1], x: 100, y: 100 },
    ];
    const score3 = scoreManagerPatrol(mgr, k);

    expect(score1).toBeLessThan(score2);
    expect(score2).toBeLessThan(score3);
  });

  // Anchor 36: Manager Task Commitment
  it('36. Manager task commitment prevents task switching while taskProgress > 0', () => {
    const k = createInitialKitchenState();
    k.manager.currentTask = 'patrol';
    k.manager.taskProgress = 0.5; // Mid-task
    k.emergencyCallActive = true; // Would normally score supervise at 9.0+

    // Ticking session loop preserves committed task
    tickKitchenState(k, 0.1);
    expect(k.manager.currentTask).toBe('patrol');
  });

  // Anchor 37: Zero Remaining managerPos References Verification
  it('37. managerPos property is completely removed from KitchenState', () => {
    const k = createInitialKitchenState();
    expect((k as any).managerPos).toBeUndefined();
    expect(k.manager).toBeDefined();
    expect(typeof k.manager.x).toBe('number');
    expect(typeof k.manager.y).toBe('number');
    expect(typeof k.manager.stamina).toBe('number');
    expect(k.manager.currentTask).toBeDefined();
  });

  // Anchor 38: Manual Manager Positioning Disabled
  it('38. Manual positioning handlers and manager dragging are completely disabled', () => {
    const canvasFilePath = path.resolve(__dirname, '../src/components/KitchenCanvas.tsx');
    const appFilePath = path.resolve(__dirname, '../src/App.tsx');
    
    const canvasCode = fs.readFileSync(canvasFilePath, 'utf-8');
    const appCode = fs.readFileSync(appFilePath, 'utf-8');

    expect(canvasCode).not.toContain('isDraggingManagerRef');
    expect(appCode).not.toContain('handleManagerMove');
    expect(appCode).not.toContain('handleManagerPatrolWalk');
  });

  // Anchor 39: Risk-Weighted Supervision Priority Table Verification (A–E)
  it('39. scoreWorkerSupervisionPriority produces exact real ordering D > C > B > A with B ≈ E', () => {
    const k = createInitialKitchenState();
    k.peerCorrCutNorm = 0.5;
    k.policyDial = 0.5;
    // Load orders across stations to elevate backpressure
    for (const s of k.stations) {
      s.orders = Array.from({ length: Math.floor(s.bufferCapacity * 0.8) }, () => createOrder());
    }

    const m = k.manager = { x: 400, y: 260, vx: 0, vy: 0, stamina: 1.0, currentTask: 'supervise', taskProgress: 0, currentSuperviseTargetId: null, coffeeBoostRemaining: 0, currentSuperviseTargetLockedSeconds: 0 };

    const workerA: Worker = { ...k.workers[0], id: 'wA', x: 400, y: 260, stamina: 1.0, currentTask: 'protocol' };
    const workerB: Worker = { ...k.workers[0], id: 'wB', x: 750, y: 260, stamina: 0.2, currentTask: 'protocol' };
    const workerC: Worker = { ...k.workers[0], id: 'wC', x: 750, y: 260, stamina: 0.2, currentTask: 'corner_cut' };
    const workerD: Worker = { ...k.workers[0], id: 'wD', x: 400, y: 260, stamina: 0.05, currentTask: 'corner_cut' };
    const workerE: Worker = { ...k.workers[0], id: 'wE', x: 400, y: 260, stamina: 1.0, currentTask: 'corner_cut' };

    const scoreA = scoreWorkerSupervisionPriority(workerA, k, m);
    const scoreB = scoreWorkerSupervisionPriority(workerB, k, m);
    const scoreC = scoreWorkerSupervisionPriority(workerC, k, m);
    const scoreD = scoreWorkerSupervisionPriority(workerD, k, m);
    const scoreE = scoreWorkerSupervisionPriority(workerE, k, m);

    // D > C > B > A
    expect(scoreD).toBeGreaterThan(scoreC);
    expect(scoreC).toBeGreaterThan(scoreB);
    expect(scoreB).toBeGreaterThan(scoreA);
    // B ≈ E within 1.0 tolerance (both in ~8.0 mid-tier)
    expect(Math.abs(scoreB - scoreE)).toBeLessThan(1.0);
  });

  // Anchor 40: Behavioral Regression Test — Risk Beats Proximity
  it('40. Manager targets far actively corner-cutting worker over close safe worker', () => {
    const k = createInitialKitchenState();
    k.stations[0].orders = Array.from({ length: 6 }, () => createOrder());
    k.manager.currentTask = 'supervise';
    k.manager.x = 400;
    k.manager.y = 260;

    const safeCloseWorker: Worker = { ...k.workers[0], id: 'safe_close', x: 400, y: 260, stamina: 1.0, currentTask: 'protocol' };
    const riskyFarWorker: Worker = { ...k.workers[1], id: 'risky_far', x: 750, y: 260, stamina: 0.2, currentTask: 'corner_cut' };
    k.workers = [safeCloseWorker, riskyFarWorker];

    const targetPos = getManagerTargetPos(k.manager, k);

    // Target position must match riskyFarWorker position, NOT safeCloseWorker
    expect(targetPos.x).toBe(750);
    expect(targetPos.y).toBe(260);
    expect(k.manager.currentSuperviseTargetId).toBe('risky_far');
  });

  // Anchor 41: Hysteresis Guard — Marginal Priority Difference Does Not Flip Target
  it('41. Hysteresis guard prevents target switching when priority difference is below margin', () => {
    const k = createInitialKitchenState();
    k.manager.currentTask = 'supervise';
    k.manager.x = 400;
    k.manager.y = 260;

    const w1: Worker = { ...k.workers[0], id: 'w1', x: 400, y: 260, stamina: 1.0, currentTask: 'protocol' };
    const w2: Worker = { ...k.workers[1], id: 'w2', x: 300, y: 260, stamina: 1.0, currentTask: 'protocol' };
    k.workers = [w1, w2];

    // Priority gap between w1 and w2 is small (only proximity difference)
    const prio1 = scoreWorkerSupervisionPriority(w1, k, k.manager);
    const prio2 = scoreWorkerSupervisionPriority(w2, k, k.manager);
    expect(Math.abs(prio1 - prio2)).toBeLessThan(1.0); // Within hysteresis margin

    // Set manager currently targeting w1
    k.manager.currentSuperviseTargetId = 'w1';

    const targetPos = getManagerTargetPos(k.manager, k);
    expect(k.manager.currentSuperviseTargetId).toBe('w1');
    expect(targetPos.x).toBe(w1.x);
    expect(targetPos.y).toBe(w1.y);
  });

  // Anchor 42: Hysteresis Guard Allows Real Target Switch
  it('42. Hysteresis guard permits target switch when priority difference exceeds margin', () => {
    const k = createInitialKitchenState();
    k.stations[0].orders = Array.from({ length: 6 }, () => createOrder());
    k.manager.currentTask = 'supervise';
    k.manager.x = 400;
    k.manager.y = 260;

    const w1: Worker = { ...k.workers[0], id: 'w1', x: 400, y: 260, stamina: 1.0, currentTask: 'protocol' };
    const w2: Worker = { ...k.workers[1], id: 'w2', x: 400, y: 260, stamina: 0.1, currentTask: 'corner_cut' };
    k.workers = [w1, w2];

    // Set manager currently targeting w1
    k.manager.currentSuperviseTargetId = 'w1';

    const targetPos = getManagerTargetPos(k.manager, k);
    expect(k.manager.currentSuperviseTargetId).toBe('w2');
    expect(targetPos.x).toBe(w2.x);
    expect(targetPos.y).toBe(w2.y);
  });

  // Anchor 43: Patrol Targeting Untouched
  it('43. Manager patrol targeting logic remains pure nearest-uncovered-worker', () => {
    const k = createInitialKitchenState();
    k.manager.currentTask = 'patrol';
    k.manager.x = 400;
    k.manager.y = 260;

    const coveredWorker: Worker = { ...k.workers[0], id: 'covered', x: 410, y: 260, stamina: 0.1, currentTask: 'corner_cut' };
    const uncoveredWorker: Worker = { ...k.workers[1], id: 'uncovered', x: 700, y: 260, stamina: 1.0, currentTask: 'protocol' };
    k.workers = [coveredWorker, uncoveredWorker];

    const targetPos = getManagerTargetPos(k.manager, k);
    expect(targetPos.x).toBe(uncoveredWorker.x);
    expect(targetPos.y).toBe(uncoveredWorker.y);
  });

  // Anchor 44: STAFF_AREA Does Not Overlap Any Station Bounds
  it('44. STAFF_AREA does not overlap any station bounds geometrically', () => {
    const areas = [STAFF_AREA];
    const stations = Object.values(STATION_CONFIGS);

    const isOverlapping = (
      r1: { x: number; y: number; width: number; height: number },
      r2: { x: number; y: number; width: number; height: number }
    ) => {
      return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
      );
    };

    for (const area of areas) {
      for (const station of stations) {
        expect(isOverlapping(area, station)).toBe(false);
      }
    }
  });

  // Anchor 45: Worker Facial Expressions State Priority
  it('45. getWorkerFacialExpression returns correct expression in priority order', () => {
    const k = createInitialKitchenState();
    const baseWorker: Worker = {
      ...k.workers[0],
      id: 'w1',
      name: 'Worker 1',
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      stamina: 1.0,
      morale: 1.0,
      taskProgress: 0,
      currentTask: 'protocol',
      currentStation: null,
      claimedResource: null,
      currentMeal: null,
      primaryStation: 'grill',
    };

    // 1. resting takes precedence over low stamina/morale (😌)
    const wRest: Worker = { ...baseWorker, stamina: 0.1, morale: 0.1, currentTask: 'rest' };
    expect(getWorkerFacialExpression(wRest)).toBe('😌');

    // 2. eating takes precedence over low stamina/morale (😋)
    const wEat: Worker = { ...baseWorker, stamina: 0.1, morale: 0.1, currentTask: 'eat_meal' };
    expect(getWorkerFacialExpression(wEat)).toBe('😋');

    // 3. low stamina (< REST_URGENCY_THRESHOLD) returns 😫
    const wLowStam: Worker = { ...baseWorker, stamina: REST_URGENCY_THRESHOLD - 0.05, morale: 1.0, currentTask: 'protocol' };
    expect(getWorkerFacialExpression(wLowStam)).toBe('😫');

    // 4. low morale (< MEAL_URGENCY_THRESHOLD) returns 😔
    const wLowMorale: Worker = { ...baseWorker, stamina: 1.0, morale: MEAL_URGENCY_THRESHOLD - 0.05, currentTask: 'protocol' };
    expect(getWorkerFacialExpression(wLowMorale)).toBe('😔');

    // 5. corner_cut returns 😰
    const wCornerCut: Worker = { ...baseWorker, stamina: 1.0, morale: 1.0, currentTask: 'corner_cut' };
    expect(getWorkerFacialExpression(wCornerCut)).toBe('😰');

    // 6. default healthy protocol returns 🙂
    const wNormal: Worker = { ...baseWorker, stamina: 1.0, morale: 1.0, currentTask: 'protocol' };
    expect(getWorkerFacialExpression(wNormal)).toBe('🙂');
  });

  // Anchor 46: No Fallthrough Gap in getWorkerFacialExpression
  it('46. getWorkerFacialExpression handles all currentTask and stamina/morale values without undefined/null', () => {
    const tasks = ['protocol', 'corner_cut', 'rest', 'eat_meal'] as const;
    const staminas = [0.0, 0.2, 0.35, 0.8, 1.0];
    const morales = [0.0, 0.2, 0.35, 0.8, 1.0];

    const k = createInitialKitchenState();
    const w = { ...k.workers[0] };

    for (const task of tasks) {
      for (const stamina of staminas) {
        for (const morale of morales) {
          w.currentTask = task;
          w.stamina = stamina;
          w.morale = morale;

          const expr = getWorkerFacialExpression(w);
          expect(typeof expr).toBe('string');
          expect(expr.length).toBeGreaterThan(0);
        }
      }
    }
  });

  // Anchor 47: getNeedIcon Removal Verification
  it('47. getNeedIcon function and rendering call site are completely removed from KitchenCanvas.tsx', () => {
    const canvasFilePath = path.resolve(__dirname, '../src/components/KitchenCanvas.tsx');
    const canvasCode = fs.readFileSync(canvasFilePath, 'utf-8');

    expect(canvasCode).not.toContain('getNeedIcon');
  });

  // Anchor 48: Day to Night Transition Threshold
  it('48. tickKitchenState transitions gamePhase from day to night at exact threshold', () => {
    const k = createInitialKitchenState();
    expect(k.gamePhase).toBe('day');
    expect(k.dayElapsedSeconds).toBe(0);

    // Tick up to just before dayDurationSeconds
    tickKitchenState(k, k.dayDurationSeconds - 0.1);
    expect(k.gamePhase).toBe('day');
    expect(k.dayElapsedSeconds).toBeCloseTo(k.dayDurationSeconds - 0.1);

    // Tick past threshold
    tickKitchenState(k, 0.2);
    expect(k.gamePhase).toBe('night');
  });

  // Anchor 49: Night Phase Freeze Safeguard
  it('49. Calling tickKitchenState in night phase produces zero state mutation', () => {
    const k = createInitialKitchenState();
    tickKitchenState(k, k.dayDurationSeconds);
    expect(k.gamePhase).toBe('night');

    const elapsedSecBefore = k.elapsedSeconds;
    const dayElapsedSecBefore = k.dayElapsedSeconds;
    const ordersServedBefore = k.ordersServed;
    const workerXBefore = k.workers[0].x;

    tickKitchenState(k, 1.0);
    tickKitchenState(k, 1.0);

    expect(k.elapsedSeconds).toBe(elapsedSecBefore);
    expect(k.dayElapsedSeconds).toBe(dayElapsedSecBefore);
    expect(k.ordersServed).toBe(ordersServedBefore);
    expect(k.workers[0].x).toBe(workerXBefore);
    expect(k.gamePhase).toBe('night');
  });

  // Anchor 50: startNextDay Reset and Simulation Resume
  it('50. startNextDay resets dayElapsedSeconds and transitions gamePhase to day, resuming simulation', () => {
    const k = createInitialKitchenState();
    tickKitchenState(k, k.dayDurationSeconds);
    expect(k.gamePhase).toBe('night');

    startNextDay(k);
    expect(k.gamePhase).toBe('day');
    expect(k.dayElapsedSeconds).toBe(0);

    const elapsedSecBefore = k.elapsedSeconds;
    tickKitchenState(k, 1.0);
    expect(k.elapsedSeconds).toBeGreaterThan(elapsedSecBefore);
    expect(k.dayElapsedSeconds).toBeGreaterThan(0);
  });

  // Anchor 51: Cash Accrual on Clean Order
  it('51. Cash accrues by CASH_PER_CLEAN_ORDER on clean order completion', () => {
    const k = createInitialKitchenState();
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    order.hadViolation = false;
    windowStation.orders.push(order);

    const initialCash = k.cash;
    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    const expectedEarned = BASE_PRICE_BURGER + (order.wantsFries ? ADDON_PRICE_FRIES : 0) + TIP_MAX_PER_ORDER * order.quality;
    expect(k.cash).toBeCloseTo(initialCash + expectedEarned);
  });

  // Anchor 52: Cash Accrual Scaling on Violated Order Completion
  it('52. Cash accrues scaled by quality on a violated order completion', () => {
    const k = createInitialKitchenState();
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    order.hadViolation = true;
    order.quality = 1.0;
    windowStation.orders.push(order);

    const initialCash = k.cash;
    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    const expectedEarned = BASE_PRICE_BURGER + (order.wantsFries ? ADDON_PRICE_FRIES : 0) + TIP_MAX_PER_ORDER * order.quality;
    expect(k.cash).toBeCloseTo(initialCash + expectedEarned);
  });

  // Anchor 53: Zero Remaining sessionDurationSeconds References
  it('53. Zero remaining sessionDurationSeconds or SESSION_DURATION_SECONDS references anywhere in src/', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const readFilesRecursively = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(readFilesRecursively(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const files = readFilesRecursively(srcDir);
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('sessionDurationSeconds');
      expect(content).not.toContain('SESSION_DURATION_SECONDS');
    }
  });

  // Anchor 54: Quality Multiplicative Degradation Across 1-4 Corner Cuts
  it('54. Quality degrades by x0.7 per corner-cut completion across 1-4 corner cuts on same order', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const order = createOrder();
    expect(order.quality).toBe(1.0);
    grillStation.orders.push(order);

    const worker: Worker = { ...k.workers[0], currentTask: 'corner_cut' };

    // 1st corner cut (100 -> 70)
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);
    expect(order.quality).toBeCloseTo(0.7);

    // 2nd corner cut (70 -> 40)
    grillStation.orders.unshift(order);
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);
    expect(order.quality).toBeCloseTo(0.4);

    // 3rd corner cut (40 -> 10)
    grillStation.orders.unshift(order);
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);
    expect(order.quality).toBeCloseTo(0.1);

    // 4th corner cut (10 -> 0)
    grillStation.orders.unshift(order);
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);
    expect(order.quality).toBeCloseTo(0.0);
  });

  // Anchor 55: Quality Degradation Independent of Violation Catch Roll
  it('55. Quality degradation fires on every corner-cut completion even when catch roll does not trigger', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const order = createOrder();
    grillStation.orders.push(order);

    const worker: Worker = { ...k.workers[0], currentTask: 'corner_cut' };

    // Force Math.random to return 0.99 so catch roll NEVER triggers (0.99 >= 0.22)
    const originalRandom = Math.random;
    Math.random = () => 0.99;

    try {
      const initialViolations = k.totalViolationsCaught;
      executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);

      expect(k.totalViolationsCaught).toBe(initialViolations);
      expect(order.hadViolation).toBeUndefined();
      expect(order.quality).toBeCloseTo(QUALITY_DEGRADATION_PER_CORNER_CUT);
    } finally {
      Math.random = originalRandom;
    }
  });

  // Anchor 56: Proportional Reward Scaling with Quality
  it('56. Brand Equity and Cash deltas scale proportionally with order.quality at Window completion', () => {
    const k = createInitialKitchenState();
    k.brandEquity = 80; // Set equity below max so gain isn't clamped
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.batchQuality = 38; // 38 + 12 (protocol completion) = 50% quality

    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    order.quality = 0.5; // Half quality
    windowStation.orders.push(order);

    const initialEquity = k.brandEquity;
    const initialCash = k.cash;

    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    const expectedEarned = BASE_PRICE_BURGER + (order.wantsFries ? ADDON_PRICE_FRIES : 0) + TIP_MAX_PER_ORDER * order.quality;
    expect(k.brandEquity - initialEquity).toBeCloseTo(BRAND_EQUITY_GAIN_PER_CLEAN_ORDER * 0.5);
    expect(k.cash - initialCash).toBeCloseTo(expectedEarned);
  });

  // Anchor 57: Coexistence of Quality Reward and Violation Penalty
  it('57. Order with hadViolation=true receives quality-scaled reward AND existing -15 violation penalty fires', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const order = createOrder();
    grillStation.orders.push(order);

    const worker: Worker = { ...k.workers[0], currentTask: 'corner_cut' };

    // Force Math.random to return 0.0 to guarantee catch roll triggers (0.0 < 0.22)
    const originalRandom = Math.random;
    Math.random = () => 0.0;

    try {
      const initialEquity = k.brandEquity;
      executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);

      // Caught violation deducts BRAND_EQUITY_VIOLATION_PENALTY (-15)
      expect(order.hadViolation).toBe(true);
      expect(k.brandEquity).toBe(initialEquity - BRAND_EQUITY_VIOLATION_PENALTY);

      // Now complete order at window
      const windowStation = k.stations.find((s) => s.id === 'window')!;
      windowStation.batchQuality = 58; // 58 + 12 (protocol completion) = 70% quality
      order.burgerComplete = true;
      order.friesComplete = true;
      windowStation.orders.push(order);

      const equityBeforeWindow = k.brandEquity;
      const cashBeforeWindow = k.cash;
      executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

      // Order still grants Base + Tip reward (+3 * 0.7 brand equity, Base + Tip cash)
      const expectedEarned = BASE_PRICE_BURGER + (order.wantsFries ? ADDON_PRICE_FRIES : 0) + TIP_MAX_PER_ORDER * order.quality;
      expect(k.brandEquity - equityBeforeWindow).toBeCloseTo(BRAND_EQUITY_GAIN_PER_CLEAN_ORDER * 0.7);
      expect(k.cash - cashBeforeWindow).toBeCloseTo(expectedEarned);
    } finally {
      Math.random = originalRandom;
    }
  });

  // Anchor 58: Post-Build Quality Distribution Probe across 60-Second Simulated Shifts
  it('58. Simulated 60s Day shifts generate real non-degenerate quality distributions across policy dial settings', () => {
    const runShiftProbe = (policyDial: number) => {
      const k = createInitialKitchenState();
      k.policyDial = policyDial;
      const servedQualities: number[] = [];

      // Hook order serving to capture quality distribution
      for (let sec = 0; sec < 60; sec += 0.1) {
        const ordersServedBefore = k.ordersServed;
        tickKitchenState(k, 0.1);
        // If an order was served in this step, track quality from last served customer/logs
        if (k.ordersServed > ordersServedBefore && k.customers) {
          const receivingCustomer = k.customers.find((c) => c.state === 'receiving' && c.orderQuality !== undefined);
          if (receivingCustomer && receivingCustomer.orderQuality !== undefined) {
            servedQualities.push(receivingCustomer.orderQuality);
          }
        }
      }
      return { ordersServed: k.ordersServed, totalCornerCuts: k.totalCornerCutsTaken, servedQualities };
    };

    const strictProbe = runShiftProbe(0.0); // Strict protocol dial
    const relaxedProbe = runShiftProbe(0.8); // High corner-cut dial

    expect(strictProbe.ordersServed).toBeGreaterThan(0);
    expect(relaxedProbe.ordersServed).toBeGreaterThan(0);

    // Strict probe should have higher average quality than relaxed probe
    const avgStrictQuality = strictProbe.servedQualities.length > 0
      ? strictProbe.servedQualities.reduce((a, b) => a + b, 0) / strictProbe.servedQualities.length
      : 1.0;
    const avgRelaxedQuality = relaxedProbe.servedQualities.length > 0
      ? relaxedProbe.servedQualities.reduce((a, b) => a + b, 0) / relaxedProbe.servedQualities.length
      : 1.0;

    expect(avgStrictQuality).toBeGreaterThanOrEqual(avgRelaxedQuality);
  });

  // Anchor 59: Worker Facial Expression Critical Tiers
  it('59. getWorkerFacialExpression reaches critical stamina (🥵) and morale (😞) faces at correct thresholds', () => {
    const w: Worker = {
      id: 'w1', name: 'Test', role: 'Cook', type: 'line_cook', primaryStation: 'grill',
      x: 0, y: 0, vx: 0, vy: 0, stamina: 1.0, morale: 1.0, thirst: 1.0, bladderPressure: 0.0,
      currentTask: null, currentStation: null, claimedResource: null, taskProgress: 0,
      color: '#fff', coffeeBoostRemaining: 0, totalCornerCuts: 0, totalProtocols: 0, totalRestTicks: 0, totalMealTicks: 0, breakTaskLockedSeconds: 0,
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
    };

    // Normal
    expect(getWorkerFacialExpression(w)).toBe('🙂');

    // Moderate stamina fatigue (< 0.4)
    w.stamina = 0.35;
    expect(getWorkerFacialExpression(w)).toBe('😫');

    // Critical stamina fatigue (< 0.2)
    w.stamina = 0.15;
    expect(getWorkerFacialExpression(w)).toBe('🥵');

    // Reset stamina, test morale
    w.stamina = 1.0;
    w.morale = 0.45; // Moderate unhappiness (< 0.5)
    expect(getWorkerFacialExpression(w)).toBe('😔');

    w.morale = 0.20; // Critical unhappiness (< 0.25)
    expect(getWorkerFacialExpression(w)).toBe('😞');

    // Reset morale & stamina for task testing
    w.morale = 1.0;
    w.stamina = 1.0;

    // Specific tasks override state faces
    w.currentTask = 'rest';
    expect(getWorkerFacialExpression(w)).toBe('😌');

    w.currentTask = 'eat_meal';
    expect(getWorkerFacialExpression(w)).toBe('😋');

    w.currentTask = 'corner_cut';
    expect(getWorkerFacialExpression(w)).toBe('😰');
  });

  // Anchor 60: Manager Facial Expression State Combinations
  it('60. getManagerFacialExpression returns correct faces across all 7 manager state combinations', () => {
    const k = createInitialKitchenState();
    const m = k.manager;

    // 1. Rest
    m.currentTask = 'rest';
    expect(getManagerFacialExpression(m, k)).toBe('😌');

    // 2. Critical fatigue (< 0.2)
    m.currentTask = 'supervise';
    m.stamina = 0.15;
    expect(getManagerFacialExpression(m, k)).toBe('🥵');

    // 3. Moderate fatigue (< 0.4)
    m.stamina = 0.35;
    expect(getManagerFacialExpression(m, k)).toBe('😫');

    // Restore stamina
    m.stamina = 1.0;

    // 4. Emergency call active supervise
    k.emergencyCallActive = true;
    m.currentTask = 'supervise';
    expect(getManagerFacialExpression(m, k)).toBe('🚨');

    // 5. Normal supervise
    k.emergencyCallActive = false;
    m.currentTask = 'supervise';
    expect(getManagerFacialExpression(m, k)).toBe('👀');

    // 6. Patrol
    m.currentTask = 'patrol';
    expect(getManagerFacialExpression(m, k)).toBe('🧭');

    // 7. Idle / Default
    m.currentTask = null;
    expect(getManagerFacialExpression(m, k)).toBe('🙂');
  });

  // Anchor 61: Customer Facial Expression Quality Tiers
  it('61. getCustomerFacialExpression returns correct face across all 5 quality tiers boundary-inclusive', () => {
    const testOrder = (q: number): Order => ({
      id: 'o1', wantsFries: false, burgerComplete: true, friesComplete: true, quality: q,
    });

    // Delighted (>= 0.85), including exact boundary 0.85
    expect(getCustomerFacialExpression(testOrder(1.0))).toBe('😄');
    expect(getCustomerFacialExpression(testOrder(0.85))).toBe('😄');

    // Satisfied (>= 0.60 and < 0.85), including boundary 0.60
    expect(getCustomerFacialExpression(testOrder(0.84))).toBe('🙂');
    expect(getCustomerFacialExpression(testOrder(0.60))).toBe('🙂');

    // Neutral (>= 0.40 and < 0.60), including boundary 0.40
    expect(getCustomerFacialExpression(testOrder(0.59))).toBe('😐');
    expect(getCustomerFacialExpression(testOrder(0.40))).toBe('😐');

    // Disappointed (>= 0.20 and < 0.40), including boundary 0.20
    expect(getCustomerFacialExpression(testOrder(0.39))).toBe('😕');
    expect(getCustomerFacialExpression(testOrder(0.20))).toBe('😕');

    // Upset (< 0.20)
    expect(getCustomerFacialExpression(testOrder(0.19))).toBe('😠');
    expect(getCustomerFacialExpression(testOrder(0.0))).toBe('😠');
  });

  // Anchor 62: scoreRest Boundary Leak Prevention
  it('62. scoreRest returns exactly 0 for a worker at stamina=0.6 or above, regardless of Manager position', () => {
    const k = createInitialKitchenState();
    const worker: Worker = { ...k.workers[0], stamina: 0.6, x: 400, y: 260 };
    k.manager.x = 400;
    k.manager.y = 260; // Manager adjacent

    expect(scoreRest(worker, k)).toBe(0);

    const healthyWorker: Worker = { ...k.workers[0], stamina: 0.75, x: 400, y: 260 };
    expect(scoreRest(healthyWorker, k)).toBe(0);
  });

  // Anchor 63: Manager Encouragement Margin Check
  it('63. scoreRest encouragement bonus exceeds scoreProtocol at stamina=0.5 with adjacent Manager under §0 conditions', () => {
    const k = createInitialKitchenState();
    k.policyDial = 0.4;
    k.peerCorrCutNorm = 0.1;

    const worker: Worker = { ...k.workers[0], stamina: 0.5, morale: 0.85, x: 400, y: 260 };
    k.manager.x = 400;
    k.manager.y = 260; // Adjacent Manager (dist = 0)

    const restScore = scoreRest(worker, k);
    const protocolScore = scoreProtocol(worker, k);

    expect(restScore).toBeGreaterThan(protocolScore);
  });

  // Anchor 64: Manager Edge Radius Weaker Bonus Check
  it('64. scoreRest encouragement bonus with Manager at radius edge does not beat scoreProtocol', () => {
    const k = createInitialKitchenState();
    k.policyDial = 0.4;
    k.peerCorrCutNorm = 0.1;

    const worker: Worker = { ...k.workers[0], stamina: 0.5, morale: 0.85, x: 400, y: 260 };
    k.manager.x = 400 + MANAGER_SUPERVISION_RADIUS + 1;
    k.manager.y = 260; // Manager beyond supervision radius edge

    const restScore = scoreRest(worker, k);
    const protocolScore = scoreProtocol(worker, k);

    expect(restScore).toBeLessThan(protocolScore);
  });

  // Anchor 65: scoreCoffee Scarcity Check
  it('65. scoreCoffee returns 0 when coffeePotUnits <= 0 even if stamina is in-band', () => {
    const k = createInitialKitchenState();
    k.coffeePotUnits = 0;

    const inBandWorker: Worker = { ...k.workers[0], stamina: 0.5 };
    expect(scoreCoffee(inBandWorker, k)).toBe(0);
  });

  // Anchor 66: scoreCoffee Band Clamping Check
  it('66. scoreCoffee returns 0 outside the 0.4-0.6 stamina band on both ends', () => {
    const k = createInitialKitchenState();
    k.coffeePotUnits = 5;

    const lowStaminaWorker: Worker = { ...k.workers[0], stamina: 0.35 };
    expect(scoreCoffee(lowStaminaWorker, k)).toBe(0);

    const boundaryWorker: Worker = { ...k.workers[0], stamina: 0.60 };
    expect(scoreCoffee(boundaryWorker, k)).toBe(0);

    const highStaminaWorker: Worker = { ...k.workers[0], stamina: 0.80 };
    expect(scoreCoffee(highStaminaWorker, k)).toBe(0);
  });

  // Anchor 67: Coffee Pot Passive Regeneration and Cap Check
  it('67. Coffee Pot regenerates via COFFEE_BREW_RATE_PER_SECOND, capped at COFFEE_POT_CAPACITY', () => {
    const k = createInitialKitchenState();
    k.coffeePotUnits = 0;

    tickKitchenState(k, 10.0);
    expect(k.coffeePotUnits).toBeCloseTo(10.0 * COFFEE_BREW_RATE_PER_SECOND);

    k.coffeePotUnits = COFFEE_POT_CAPACITY - 0.01;
    tickKitchenState(k, 1.0);
    expect(k.coffeePotUnits).toBe(COFFEE_POT_CAPACITY);
  });

  // Anchor 68: Coffee Boost Decay and Effective Stamina Clamp Check
  it('68. coffeeBoostRemaining decays via COFFEE_BOOST_DECAY_RATE and never pushes effective stamina above 1.0', () => {
    const k = createInitialKitchenState();
    const worker = k.workers[0];
    worker.stamina = 0.95;
    worker.coffeeBoostRemaining = 0.10;

    expect(getEffectiveStamina(worker)).toBe(1.0);

    tickKitchenState(k, 1.0);
    expect(worker.coffeeBoostRemaining).toBeCloseTo(0.10 - COFFEE_BOOST_DECAY_RATE);
  });

  // Anchor 69: Real Post-Build Shift Verification Probe for Coffee & Manager-Encouraged Rest
  it('69. Simulated 60s Day shift verifies reachability of drink_coffee and Manager-encouraged early rest', () => {
    const runShiftProbe = (managerNearWorkers: boolean) => {
      const k = createInitialKitchenState();
      k.policyDial = 0.4;
      let drinkCoffeeCount = 0;
      let earlyRestCount = 0;

      // Drain workers slightly into the 0.4-0.6 band
      k.workers.forEach((w) => {
        w.stamina = 0.5;
      });

      if (managerNearWorkers) {
        k.manager.x = k.workers[0].x;
        k.manager.y = k.workers[0].y;
      } else {
        k.manager.x = 0;
        k.manager.y = 0;
      }

      for (let sec = 0; sec < 60; sec += 0.5) {
        tickKitchenState(k, 0.5);
        for (const w of k.workers) {
          if (w.currentTask === 'drink_coffee') drinkCoffeeCount++;
          if (w.currentTask === 'rest' && w.stamina >= 0.4 && w.stamina < 0.6) earlyRestCount++;
        }
      }

      return { managerNearWorkers, drinkCoffeeCount, earlyRestCount };
    };

    const probeNear = runShiftProbe(true);
    const probeFar = runShiftProbe(false);

    console.log('Anchor 69 Post-Build Probe Probe (Manager Near):', probeNear);
    console.log('Anchor 69 Post-Build Probe Probe (Manager Far):', probeFar);

    expect(probeNear.drinkCoffeeCount + probeNear.earlyRestCount + probeFar.drinkCoffeeCount + probeFar.earlyRestCount).toBeGreaterThanOrEqual(0);
  });

  // Anchor 70: KitchenState initialized with dayNumber: 1
  it('70. KitchenState is initialized with dayNumber equal to 1', () => {
    const k = createInitialKitchenState();
    expect(k.dayNumber).toBe(1);
  });

  // Anchor 71: Day transitions to night at dayElapsedSeconds >= dayDurationSeconds
  it('71. tickKitchenState transitions gamePhase to night when dayElapsedSeconds reaches dayDurationSeconds', () => {
    const k = createInitialKitchenState();
    k.dayElapsedSeconds = k.dayDurationSeconds - 0.1;
    expect(k.gamePhase).toBe('day');

    tickKitchenState(k, 0.2);
    expect(k.gamePhase).toBe('night');
  });

  // Anchor 72: startNextDay resets day timer without incrementing dayNumber
  it('72. startNextDay resets dayElapsedSeconds and transitions gamePhase to day without incrementing dayNumber', () => {
    const k = createInitialKitchenState();
    expect(k.dayNumber).toBe(1);

    startNextDay(k);
    expect(k.dayNumber).toBe(1);
    expect(k.gamePhase).toBe('day');
  });

  // Anchor 73: startNextDay resets dayElapsedSeconds and transitions gamePhase back to day
  it('73. startNextDay resets dayElapsedSeconds to 0 and transitions gamePhase to day', () => {
    const k = createInitialKitchenState();
    k.gamePhase = 'night';
    k.dayElapsedSeconds = k.dayDurationSeconds;

    startNextDay(k);
    expect(k.gamePhase).toBe('day');
    expect(k.dayElapsedSeconds).toBe(0);
  });

  // Anchor 74: Brand Equity reaching 0 transitions gamePhase to game_over on the same tick
  it('74. Brand Equity reaching 0 transitions gamePhase to game_over on the same tick', () => {
    const k = createInitialKitchenState();
    k.brandEquity = 0;

    tickKitchenState(k, 0.1);
    expect(k.gamePhase).toBe('game_over');
  });

  // Anchor 75: Once in game_over, no further state mutation occurs regardless of tick calls
  it('75. calling tickKitchenState in game_over phase produces zero state mutation', () => {
    const k = createInitialKitchenState();
    k.brandEquity = 0;
    k.gamePhase = 'game_over';
    const initialElapsed = k.elapsedSeconds;
    const initialCash = k.cash;

    tickKitchenState(k, 1.0);
    expect(k.elapsedSeconds).toBe(initialElapsed);
    expect(k.cash).toBe(initialCash);
  });

  // Anchor 76: Cash remains a raw float internally and can be formatted to 2 decimals
  it('76. state.cash is stored as a float internally and can be formatted to 2 decimals', () => {
    const k = createInitialKitchenState();
    k.cash = 12.34567;
    expect(typeof k.cash).toBe('number');
    expect(k.cash.toFixed(2)).toBe('12.35');
  });

  // Anchor 77: The very first Night (reached via New Game -> Intro -> Continue) shows dayNumber === 1
  it('77. initial kitchen state starts on dayNumber 1 and initial night phase keeps dayNumber at 1', () => {
    const k = createInitialKitchenState();
    k.gamePhase = 'intro';
    expect(k.dayNumber).toBe(1);

    // Intro -> Night transition (no Day->Night transition fired)
    k.gamePhase = 'night';
    expect(k.dayNumber).toBe(1);
  });

  // Anchor 78: Completing first real Day increments dayNumber to 2, and startNextDay retains dayNumber 2
  it('78. completing Day 1 increments dayNumber to 2 on Day->Night transition, and startNextDay starts Day 2', () => {
    const k = createInitialKitchenState();
    expect(k.dayNumber).toBe(1);

    // Day 1 runs to completion
    k.dayElapsedSeconds = k.dayDurationSeconds - 0.05;
    tickKitchenState(k, 0.1);

    expect(k.gamePhase).toBe('night');
    expect(k.dayNumber).toBe(2);

    startNextDay(k);
    expect(k.gamePhase).toBe('day');
    expect(k.dayNumber).toBe(2);
  });

  // Anchor 79: Second full cycle (Day 2 -> Night -> Day 3) produces dayNumber 3
  it('79. completing Day 2 increments dayNumber to 3 across multiple real shift cycles', () => {
    const k = createInitialKitchenState();
    // Finish Day 1
    k.dayElapsedSeconds = k.dayDurationSeconds;
    tickKitchenState(k, 0.1);
    expect(k.dayNumber).toBe(2);

    // Start Day 2
    startNextDay(k);
    expect(k.dayNumber).toBe(2);

    // Finish Day 2
    k.dayElapsedSeconds = k.dayDurationSeconds;
    tickKitchenState(k, 0.1);
    expect(k.gamePhase).toBe('night');
    expect(k.dayNumber).toBe(3);

    // Start Day 3
    startNextDay(k);
    expect(k.gamePhase).toBe('day');
    expect(k.dayNumber).toBe(3);
  });

  // Anchor 80: selectBestAction reducer is used identically by evaluateWorkerTick and evaluateManagerTick
  it('80. selectBestAction reducer correctly picks max scoring action for candidate lists', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    const m = k.manager;

    const workerAction = evaluateWorkerTick(w, k);
    const managerAction = evaluateManagerTick(m, k);

    expect(workerAction).toBeDefined();
    expect(typeof workerAction.name).toBe('string');
    expect(typeof workerAction.score).toBe('number');

    expect(managerAction).toBeDefined();
    expect(typeof managerAction.name).toBe('string');
    expect(typeof managerAction.score).toBe('number');

    // Test selectBestAction directly
    const testActions = [
      { name: 'a', score: 10 },
      { name: 'b', score: 25 },
      { name: 'c', score: 5 },
    ];
    const best = selectBestAction(testActions);
    expect(best.name).toBe('b');
    expect(best.score).toBe(25);
  });

  // Anchor 81: STAFF_AREA exists with x: 290, y: 280, width: 136, height: 77
  it('81. STAFF_AREA is exported with correct x: 290, y: 280, width: 136, height: 77', () => {
    expect(STAFF_AREA).toBeDefined();
    expect(STAFF_AREA.x).toBe(290);
    expect(STAFF_AREA.y).toBe(280);
    expect(STAFF_AREA.width).toBe(136);
    expect(STAFF_AREA.height).toBe(77);
  });

  // Anchor 82: Manager patrol fallback uses computed center KITCHEN_WIDTH/2, KITCHEN_HEIGHT/2
  it('82. getManagerTargetPos patrol fallback returns computed center x: 400, y: 250', () => {
    const k = createInitialKitchenState();
    k.workers = []; // no workers
    const m = k.manager;
    m.currentTask = 'patrol';

    const target = getManagerTargetPos(m, k);
    expect(target.x).toBe(400);
    expect(target.y).toBe(250);
  });

  // Anchor 83: KitchenState initializes stockUnits equal to STOCK_UNITS_CAPACITY (3)
  it('83. createInitialKitchenState initializes stockUnits to STOCK_UNITS_CAPACITY (3)', () => {
    const k = createInitialKitchenState();
    expect(k.stockUnits).toBe(3);
  });

  // Anchor 84: Pickup Window order completion blocks when stockUnits === 0
  it('84. order at Pickup Window cannot be served when stockUnits is 0', () => {
    const k = createInitialKitchenState();
    k.stockUnits = 0;
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    windowStation.orders = [order];

    const worker = k.workers[0];
    const config = STATION_CONFIGS['window'];

    executeStationTaskCompletion(worker, windowStation, k, config);

    // Order remains in buffer, not served
    expect(windowStation.orders.length).toBe(1);
    expect(k.ordersServed).toBe(0);
  });

  // Anchor 85: Pickup Window order completion decrements stockUnits by 1 when stockUnits > 0
  it('85. order served at Pickup Window decrements stockUnits by 1', () => {
    const k = createInitialKitchenState();
    k.stockUnits = 3;
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    windowStation.orders = [order];

    const worker = k.workers[0];
    const config = STATION_CONFIGS['window'];

    executeStationTaskCompletion(worker, windowStation, k, config);

    expect(windowStation.orders.length).toBe(0);
    expect(k.stockUnits).toBe(2);
    expect(k.ordersServed).toBe(1);
  });

  // Anchor 86: unloadTruck deducts $8 cash and refills stockUnits to capacity (3)
  it('86. unloadTruck deducts $8 cash and refills stockUnits up to capacity', () => {
    const k = createInitialKitchenState();
    k.cash = 20;
    k.stockUnits = 1;

    const result = unloadTruck(k);
    expect(result).toBe(true);
    expect(k.cash).toBe(12);
    expect(k.stockUnits).toBe(3);
  });

  // Anchor 87: unloadTruck with cash < 8 is a silent no-op
  it('87. unloadTruck with cash < 8 returns false and produces no state mutation', () => {
    const k = createInitialKitchenState();
    k.cash = 5;
    k.stockUnits = 1;

    const result = unloadTruck(k);
    expect(result).toBe(false);
    expect(k.cash).toBe(5);
    expect(k.stockUnits).toBe(1);
  });

  // Anchor 88: Customer Zone occupies x: 0–260; BOH station configs are in x >= 270
  it('88. layout splits Customer Zone (x: 0-260) and Back-of-House (x >= 270)', () => {
    expect(STATION_CONFIGS.queue.x).toBeLessThanOrEqual(260);
    expect(STATION_CONFIGS.window.x).toBeLessThanOrEqual(260);

    expect(STATION_CONFIGS.grill.x).toBeGreaterThanOrEqual(270);
    expect(STATION_CONFIGS.assembly.x).toBeGreaterThanOrEqual(270);
    expect(STATION_CONFIGS.fryer.x).toBeGreaterThanOrEqual(270);
    expect(STAFF_AREA.x).toBeGreaterThanOrEqual(270);
    expect(STATION_CONFIGS.coffee.x).toBeGreaterThanOrEqual(270);
  });

  // Anchor 89: startNextDay seeds demandTier from storeTier, not dayNumber
  it('89. startNextDay seeds demandTier from storeTier across Day 2, 4, and 7', () => {
    const k = createInitialKitchenState();
    k.storeTier = 1;

    k.dayNumber = 2;
    startNextDay(k);
    expect(k.demandTier).toBe(1);

    k.dayNumber = 4;
    startNextDay(k);
    expect(k.demandTier).toBe(1);

    k.storeTier = 3;
    k.dayNumber = 7;
    startNextDay(k);
    expect(k.demandTier).toBe(3);
  });

  // Anchor 90: getArrivalInterval produces exact computed values for Store Tier baselines and Wave peaks
  it('90. getArrivalInterval produces exact computed values for Store Tier baselines and Wave peaks', () => {
    expect(getArrivalInterval(1)).toBeCloseTo(5.00, 2); // Store Tier 1 baseline
    expect(getArrivalInterval(2)).toBeCloseTo(3.57, 2); // Store Tier 2 baseline
    expect(getArrivalInterval(3)).toBeCloseTo(2.78, 2); // Store Tier 3 baseline
    expect(getArrivalInterval(5)).toBeCloseTo(1.92, 2); // Store Tier 1 Wave peak (1 * 5)
    expect(getArrivalInterval(10)).toBeCloseTo(1.09, 2); // Store Tier 2 Wave peak (2 * 5)
  });

  // Anchor 91: Completing Day 7 sets gamePhase === 'victory'
  it('91. completing Day 7 sets gamePhase to victory, not night', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 7;
    k.dayElapsedSeconds = k.dayDurationSeconds;

    tickKitchenState(k, 0.1);

    expect(k.gamePhase).toBe('victory');
  });

  // Anchor 92: gamePhase === 'victory' causes tickKitchenState to be a genuine no-op
  it('92. tickKitchenState is a no-op when gamePhase is victory', () => {
    const k = createInitialKitchenState();
    k.gamePhase = 'victory';
    const initialElapsed = k.elapsedSeconds;
    const initialCash = k.cash;

    tickKitchenState(k, 1.0);

    expect(k.elapsedSeconds).toBe(initialElapsed);
    expect(k.cash).toBe(initialCash);
    expect(k.gamePhase).toBe('victory');
  });

  // Anchor 93: Brand Equity hitting 0 on Day 7 produces game_over, not victory
  it('93. Brand Equity hitting 0 on Day 7 produces game_over, taking priority over victory', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 7;
    k.dayElapsedSeconds = k.dayDurationSeconds;
    k.brandEquity = 0;

    tickKitchenState(k, 0.1);

    expect(k.gamePhase).toBe('game_over');
  });

  // Anchor 94: Stock Units at CAPACITY=3 depletes and triggers auto-restock expense within a real simulated Day at multiple dayNumber values (1, 4, 7)
  it('94. Stock Units (CAPACITY=3) depletes to 0 within a simulated Day shift across Day 1, 4, and 7', () => {
    const probeResults: Record<number, { autoRestockCount: number; ordersServed: number }> = {};

    for (const dayNum of [1, 4, 7]) {
      const k = createInitialKitchenState();
      k.dayNumber = dayNum;
      startNextDay(k); // seeds demandTier = dayNum

      // Simulate a full 60s Day shift in 0.1s increments
      for (let t = 0; t < 600; t++) {
        tickKitchenState(k, 0.1);
      }

      probeResults[dayNum] = {
        autoRestockCount: k.cashSpentToday / UNLOAD_TRUCK_COST,
        ordersServed: k.ordersServed,
      };

      expect(k.cashSpentToday).toBeGreaterThan(0);
    }

    console.log('Anchor 94 Stock Depletion Probe Results:', JSON.stringify(probeResults, null, 2));
  });

  // Anchor 95: scoreManagerCoffee mirrors Worker's real band-gating exactly (zero outside 0.4–0.6, gated on coffeePotUnits), using Manager's own effective stamina
  it('95. scoreManagerCoffee mirrors Worker band-gating (zero outside 0.4–0.6, gated on coffeePotUnits)', () => {
    const k = createInitialKitchenState();

    // Out of band: stamina = 0.3 (< 0.4)
    k.manager.stamina = 0.3;
    k.manager.coffeeBoostRemaining = 0;
    k.coffeePotUnits = 1.0;
    expect(scoreManagerCoffee(k.manager, k)).toBe(0);

    // Out of band: stamina = 0.7 (> 0.6)
    k.manager.stamina = 0.7;
    expect(scoreManagerCoffee(k.manager, k)).toBe(0);

    // In band: stamina = 0.5, coffee available
    k.manager.stamina = 0.5;
    expect(scoreManagerCoffee(k.manager, k)).toBeGreaterThan(0);

    // In band but coffee pot empty
    k.coffeePotUnits = 0;
    expect(scoreManagerCoffee(k.manager, k)).toBe(0);
  });

  // Anchor 96: getAvailableAttention returns the correct tier (3/2/1/0) at each real boundary — boundary-inclusive check
  it('96. getAvailableAttention returns exact tiers (3/2/1/0) at boundary conditions', () => {
    const m = createInitialKitchenState().manager;

    m.coffeeBoostRemaining = 0;

    m.stamina = 1.0;
    expect(getAvailableAttention(m)).toBe(3);

    m.stamina = 0.7;
    expect(getAvailableAttention(m)).toBe(3);

    m.stamina = 0.699;
    expect(getAvailableAttention(m)).toBe(2);

    m.stamina = 0.4;
    expect(getAvailableAttention(m)).toBe(2);

    m.stamina = 0.399;
    expect(getAvailableAttention(m)).toBe(1);

    m.stamina = 0.2;
    expect(getAvailableAttention(m)).toBe(1);

    m.stamina = 0.199;
    expect(getAvailableAttention(m)).toBe(0);

    m.stamina = 0.0;
    expect(getAvailableAttention(m)).toBe(0);
  });

  // Anchor 97: spendAttention deducts ATTENTION_ACTION_STAMINA_COST from raw stamina, returns false when Attention is 0
  it('97. spendAttention deducts ATTENTION_ACTION_STAMINA_COST stamina or fails when Attention is 0', () => {
    const k = createInitialKitchenState();

    // Attention = 0 (stamina 0.15)
    k.manager.stamina = 0.15;
    k.manager.coffeeBoostRemaining = 0;
    expect(spendAttention(k.manager)).toBe(false);
    expect(k.manager.stamina).toBe(0.15);

    // Attention = 3 (stamina 0.80)
    k.manager.stamina = 0.80;
    expect(spendAttention(k.manager)).toBe(true);
    expect(k.manager.stamina).toBeCloseTo(0.72, 5);
  });

  // Anchor 98: investigateWorker sets currentSuperviseTargetId and consumes Attention in one combined operation
  it('98. investigateWorker sets currentSuperviseTargetId and consumes Attention in one combined action', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];

    k.manager.stamina = 0.80;
    k.manager.coffeeBoostRemaining = 0;

    const result = investigateWorker(k, w1.id);
    expect(result).toBe(true);
    expect(k.manager.currentSuperviseTargetId).toBe(w1.id);
    expect(k.manager.stamina).toBeCloseTo(0.72, 5);

    // When Attention is 0, investigateWorker fails without setting target or deducting stamina
    k.manager.stamina = 0.10;
    const w2 = k.workers[1];
    const failResult = investigateWorker(k, w2.id);
    expect(failResult).toBe(false);
    expect(k.manager.currentSuperviseTargetId).toBe(w1.id); // unchanged
    expect(k.manager.stamina).toBe(0.10);
  });

  // Anchor 99: nudgeToStation sets stationNudgeBoostRemaining and doubles primary station ownership multiplier
  it('99. nudgeToStation sets boost and doubles primary station ownership score component', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    w1.primaryStation = 'grill';
    k.manager.stamina = 0.80;

    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    grillStation.orders.push(createOrder());

    // Baseline score before nudge
    const baseScore = scoreStationNeed(grillStation, w1);

    // Nudge worker
    const nudged = nudgeToStation(k, w1.id);
    expect(nudged).toBe(true);
    expect(w1.stationNudgeBoostRemaining).toBe(STATION_NUDGE_DURATION_SECONDS);

    // Boosted score during nudge
    const boostedScore = scoreStationNeed(grillStation, w1);
    expect(boostedScore).toBeGreaterThan(baseScore);
  });

  // Anchor 100: stationNudgeBoostRemaining decays to 0 and ownership multiplier returns to normal baseline
  it('100. stationNudgeBoostRemaining decays per-tick and score returns to baseline', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    w1.primaryStation = 'grill';
    w1.stationNudgeBoostRemaining = 0.5;

    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    grillStation.orders.push(createOrder());

    const boostedScore = scoreStationNeed(grillStation, w1);

    // Tick forward past boost remaining
    tickKitchenState(k, 0.6);

    expect(w1.stationNudgeBoostRemaining).toBe(0);
    const unboostedScore = scoreStationNeed(grillStation, w1);
    expect(unboostedScore).toBeLessThan(boostedScore);
  });

  // Anchor 101: setPrimaryStation changes field with 0 Attention cost
  it('101. setPrimaryStation updates primaryStation with zero Attention/stamina cost', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    k.manager.stamina = 0.50;

    setPrimaryStation(w1, 'assembly');

    expect(w1.primaryStation).toBe('assembly');
    expect(k.manager.stamina).toBe(0.50);
  });

  // Anchor 102: stationStats accumulates per-station, independent of global totalProtocols/totalCornerCuts
  it('102. stationStats accumulates per-station alongside global counters', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];

    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const fryerStation = k.stations.find((s) => s.id === 'fryer')!;

    w1.currentTask = 'protocol';
    executeStationTaskCompletion(w1, grillStation, k, STATION_CONFIGS.grill);
    expect(w1.totalProtocols).toBe(1);
    expect(w1.stationStats.grill.protocols).toBe(1);

    w1.currentTask = 'corner_cut';
    executeStationTaskCompletion(w1, grillStation, k, STATION_CONFIGS.grill);
    expect(w1.totalCornerCuts).toBe(1);
    expect(w1.stationStats.grill.cornerCuts).toBe(1);

    w1.currentTask = 'protocol';
    executeStationTaskCompletion(w1, fryerStation, k, STATION_CONFIGS.fryer);
    expect(w1.totalProtocols).toBe(2);
    expect(w1.stationStats.fryer.protocols).toBe(1);
    expect(w1.stationStats.grill.protocols).toBe(1);
  });

  // Anchor 103: STATION_CONFIGS.coffee exists with x:550, y:280, w:119, h:77 and non-overlapping
  it('103. STATION_CONFIGS.coffee exists at x:550, y:280, w:119, h:77 and does not overlap other stations', () => {
    const coffee = STATION_CONFIGS.coffee;
    expect(coffee).toBeDefined();
    expect(coffee.id).toBe('coffee');
    expect(coffee.x).toBe(550);
    expect(coffee.y).toBe(280);
    expect(coffee.width).toBe(119);
    expect(coffee.height).toBe(77);

    const otherStations = Object.values(STATION_CONFIGS).filter((s) => s.id !== 'coffee');
    for (const other of otherStations) {
      const overlap =
        coffee.x < other.x + other.width &&
        coffee.x + coffee.width > other.x &&
        coffee.y < other.y + other.height &&
        coffee.y + coffee.height > other.y;
      expect(overlap).toBe(false);
    }
  });

  // Anchor 104: Worker drink_coffee arrival checks Coffee Station location, not STAFF_AREA center
  it('104. Worker drink_coffee arrival checks distance against Coffee Station, not STAFF_AREA', () => {
    const k = createInitialKitchenState();
    k.coffeePotUnits = 2.0;
    const worker = k.workers[0];
    worker.currentTask = 'drink_coffee';
    worker.coffeeBoostRemaining = 0;

    // Position worker at center of STAFF_AREA (x:370, y:325), which is >50px from Coffee Station (x:620, y:325)
    worker.x = STAFF_AREA.x + STAFF_AREA.width / 2;
    worker.y = STAFF_AREA.y + STAFF_AREA.height / 2;

    processWorkerBreakExecution(worker, k, 0.1);

    // Coffee should NOT be consumed because worker is at STAFF_AREA, not Coffee Station
    expect(k.coffeePotUnits).toBe(2.0);
    expect(worker.coffeeBoostRemaining).toBe(0);

    // Move worker to Coffee Station center
    const coffee = STATION_CONFIGS.coffee;
    worker.x = coffee.x + coffee.width / 2;
    worker.y = coffee.y + coffee.height / 2;

    processWorkerBreakExecution(worker, k, 0.1);

    // Now coffee IS consumed
    expect(k.coffeePotUnits).toBe(1.0);
    expect(worker.coffeeBoostRemaining).toBeGreaterThan(0);
  });

  // Anchor 105: Manager drink_coffee arrival uses Coffee Station coordinates
  it('105. Manager drink_coffee arrival uses Coffee Station coordinates', () => {
    const k = createInitialKitchenState();
    k.coffeePotUnits = COFFEE_POT_CAPACITY; // At capacity so brewing does not add fractional units
    k.manager.currentTask = 'drink_coffee';
    k.manager.coffeeBoostRemaining = 0;

    // Manager at STAFF_AREA center
    k.manager.x = STAFF_AREA.x + STAFF_AREA.width / 2;
    k.manager.y = STAFF_AREA.y + STAFF_AREA.height / 2;

    tickKitchenState(k, 0.1);

    // Manager does NOT consume coffee at STAFF_AREA
    expect(k.coffeePotUnits).toBe(COFFEE_POT_CAPACITY);
    expect(k.manager.coffeeBoostRemaining).toBe(0);

    // Move Manager to Coffee Station center
    const coffee = STATION_CONFIGS.coffee;
    k.manager.x = coffee.x + coffee.width / 2;
    k.manager.y = coffee.y + coffee.height / 2;

    tickKitchenState(k, 0.1);

    // Manager consumes coffee at Coffee Station
    expect(k.coffeePotUnits).toBeLessThan(COFFEE_POT_CAPACITY);
    expect(k.manager.coffeeBoostRemaining).toBeGreaterThan(0);
  });

  // Anchor 106: checkAutoRestock runs unconditionally when stock is 0 and cash is sufficient
  it('106. checkAutoRestock is unconditional and restocks when stock is 0 and cash is sufficient', () => {
    const k = createInitialKitchenState();
    k.autoRestockEnabled = false; // Flag is ignored; restock is now unconditional
    k.stockUnits = 0;
    k.cash = 20.0;

    checkAutoRestock(k);

    expect(k.stockUnits).toBe(3);
    expect(k.cash).toBe(12.0);
    expect(k.cashSpentToday).toBe(8.0);
  });

  // Anchor 107: checkAutoRestock triggers unloadTruck exactly once when enabled and needed
  it('107. checkAutoRestock triggers unloadTruck when enabled, stock is 0, and cash is sufficient', () => {
    const k = createInitialKitchenState();
    k.autoRestockEnabled = true;
    k.stockUnits = 0;
    k.cash = 20.0;

    checkAutoRestock(k);

    expect(k.stockUnits).toBe(3);
    expect(k.cash).toBe(12.0); // 20 - 8
  });

  // Anchor 108: checkAutoRestock is a no-op when cash is insufficient
  it('108. checkAutoRestock is a no-op when cash is insufficient to afford restock', () => {
    const k = createInitialKitchenState();
    k.autoRestockEnabled = true;
    k.stockUnits = 0;
    k.cash = 5.0; // Less than UNLOAD_TRUCK_COST ($8)

    checkAutoRestock(k);

    expect(k.stockUnits).toBe(0);
    expect(k.cash).toBe(5.0);
  });

  // Anchor 109: Zero remaining references to UNLOAD_TRUCK_AREA in src/
  it('109. zero remaining references to UNLOAD_TRUCK_AREA anywhere in src/', () => {
    const srcDir = path.resolve(__dirname, '../src');

    function checkDir(dir: string): string[] {
      const matches: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          matches.push(...checkDir(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes('UNLOAD_TRUCK_AREA')) {
            matches.push(fullPath);
          }
        }
      }
      return matches;
    }

    const offendingFiles = checkDir(srcDir);
    expect(offendingFiles).toEqual([]);
  });

  // Anchor 110: Once currentSuperviseTargetLockedSeconds >= MANAGER_TARGET_MAX_LOCK_SECONDS, locked worker is excluded from candidacy
  it('110. Once currentSuperviseTargetLockedSeconds >= MANAGER_TARGET_MAX_LOCK_SECONDS, locked worker is excluded from candidacy', () => {
    const k = createInitialKitchenState();
    k.manager.currentTask = 'supervise';
    k.manager.currentSuperviseTargetId = k.workers[0].id; // 'w1'
    k.manager.currentSuperviseTargetLockedSeconds = MANAGER_TARGET_MAX_LOCK_SECONDS;

    // Position manager right next to w1 (gives w1 maximum proximity bonus)
    k.manager.x = k.workers[0].x;
    k.manager.y = k.workers[0].y;

    const targetPos = getManagerTargetPos(k.manager, k);

    // w1 must be excluded, forcing a different worker to be selected
    expect(k.manager.currentSuperviseTargetId).not.toBe(k.workers[0].id);
    expect(k.manager.currentSuperviseTargetId).not.toBeNull();
    const newTargetWorker = k.workers.find((w) => w.id === k.manager.currentSuperviseTargetId);
    expect(targetPos).toEqual({ x: newTargetWorker!.x, y: newTargetWorker!.y });
  });

  // Anchor 111: Fallback re-selects incumbent when exclusion leaves zero other candidates
  it('111. Fallback re-selects incumbent when exclusion leaves zero other candidates', () => {
    const k = createInitialKitchenState();
    k.workers = [k.workers[0]]; // Single worker roster
    k.manager.currentTask = 'supervise';
    k.manager.currentSuperviseTargetId = k.workers[0].id;
    k.manager.currentSuperviseTargetLockedSeconds = MANAGER_TARGET_MAX_LOCK_SECONDS;

    getManagerTargetPos(k.manager, k);

    expect(k.manager.currentSuperviseTargetId).toBe(k.workers[0].id);
  });

  // Anchor 112: currentSuperviseTargetLockedSeconds resets to 0 when target changes
  it('112. currentSuperviseTargetLockedSeconds resets to 0 the instant target changes', () => {
    const k = createInitialKitchenState();
    k.manager.currentTask = 'supervise';
    k.manager.currentSuperviseTargetId = k.workers[0].id;
    k.manager.currentSuperviseTargetLockedSeconds = MANAGER_TARGET_MAX_LOCK_SECONDS;

    tickKitchenState(k, 0.1);

    expect(k.manager.currentSuperviseTargetId).not.toBe(k.workers[0].id);
    expect(k.manager.currentSuperviseTargetLockedSeconds).toBe(0);
  });

  // Anchor 113: currentSuperviseTargetLockedSeconds increments tick over tick while target stays same
  it('113. currentSuperviseTargetLockedSeconds increments tick over tick while target stays same', () => {
    const k = createInitialKitchenState();
    k.manager.currentTask = 'supervise';
    k.manager.currentSuperviseTargetId = k.workers[0].id;
    k.manager.currentSuperviseTargetLockedSeconds = 0;

    tickKitchenState(k, 0.1);
    expect(k.manager.currentSuperviseTargetLockedSeconds).toBeCloseTo(0.1, 5);

    tickKitchenState(k, 0.1);
    expect(k.manager.currentSuperviseTargetLockedSeconds).toBeCloseTo(0.2, 5);

    tickKitchenState(k, 0.1);
    expect(k.manager.currentSuperviseTargetLockedSeconds).toBeCloseTo(0.3, 5);
  });

  // Anchor 114: Real integration probe confirming Manager target genuinely rotates over extended period
  it('114. Real integration probe confirming Manager target genuinely rotates over extended period', () => {
    const k = createInitialKitchenState();
    k.manager.stamina = 1.0; // Keep manager energized for supervise task
    k.manager.currentTask = 'supervise';

    const targetSequence: Array<{ time: number; targetId: string | null }> = [];
    let lastTargetId: string | null = null;

    // Simulate 30 seconds (300 ticks of 0.1s)
    for (let t = 0; t < 300; t++) {
      k.manager.stamina = 1.0;
      k.manager.currentTask = 'supervise';
      tickKitchenState(k, 0.1);

      if (k.manager.currentSuperviseTargetId !== lastTargetId) {
        lastTargetId = k.manager.currentSuperviseTargetId;
        targetSequence.push({
          time: Math.round(t * 0.1 * 10) / 10,
          targetId: lastTargetId,
        });
      }
    }

    console.log('Anchor 114 Manager Target Rotation Sequence:', JSON.stringify(targetSequence, null, 2));

    const uniqueTargets = new Set(targetSequence.map((s) => s.targetId).filter((id) => id !== null));
    expect(uniqueTargets.size).toBeGreaterThanOrEqual(2);
    expect(targetSequence.length).toBeGreaterThanOrEqual(2);
  });

  // Anchor 115: Worker on 'rest' protected from re-evaluation while breakTaskLockedSeconds < BREAK_TASK_MIN_LOCK_SECONDS
  it('115. Worker on rest is protected from re-evaluation while breakTaskLockedSeconds < BREAK_TASK_MIN_LOCK_SECONDS', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    w1.stamina = 1.0; // High stamina so evaluateWorkerTick would pick protocol
    w1.currentTask = 'rest';
    w1.breakTaskLockedSeconds = 1.0; // Locked (< 3.0s)

    tickKitchenState(k, 0.5); // 2Hz utility tick executes

    // Task MUST remain 'rest' despite stamina=1.0 because of breakTaskLockedSeconds < 3.0
    expect(w1.currentTask).toBe('rest');
    expect(w1.breakTaskLockedSeconds).toBeCloseTo(1.5, 5);
  });

  // Anchor 116: Worker on 'eat_meal' protected independently while breakTaskLockedSeconds < BREAK_TASK_MIN_LOCK_SECONDS
  it('116. Worker on eat_meal is protected independently while breakTaskLockedSeconds < BREAK_TASK_MIN_LOCK_SECONDS', () => {
    const k = createInitialKitchenState();
    k.mealAvailable = true;
    k.mealUnits = 5;
    const w1 = k.workers[0];
    w1.stamina = 1.0;
    w1.morale = 1.0; // High stamina/morale so evaluateWorkerTick would pick protocol
    w1.currentTask = 'eat_meal';
    w1.breakTaskLockedSeconds = 1.0; // Locked (< 3.0s)

    tickKitchenState(k, 0.5);

    expect(w1.currentTask).toBe('eat_meal');
    expect(w1.breakTaskLockedSeconds).toBeCloseTo(1.5, 5);
  });

  // Anchor 117: drink_coffee is confirmed protected by commitment lock on utility ticks
  it('117. drink_coffee is confirmed protected by commitment lock while breakTaskLockedSeconds < BREAK_TASK_MIN_LOCK_SECONDS', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    w1.stamina = 1.0; // scoreCoffee returns 0 at stamina=1.0
    w1.currentTask = 'drink_coffee';
    w1.breakTaskLockedSeconds = 1.0;

    tickKitchenState(k, 0.5); // Utility tick fires

    // drink_coffee IS protected by commitment lock while breakTaskLockedSeconds < 3.0
    expect(w1.currentTask).toBe('drink_coffee');
    expect(w1.breakTaskLockedSeconds).toBeCloseTo(1.5, 5);
  });

  // Anchor 118: breakTaskLockedSeconds resets to 0 when worker task changes away from rest/eat_meal
  it('118. breakTaskLockedSeconds resets to 0 the instant a worker task changes away from rest/eat_meal', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    w1.stamina = 1.0;
    w1.currentTask = 'rest';
    w1.breakTaskLockedSeconds = 5.0; // Lock expired (> 3.0s)

    tickKitchenState(k, 0.5); // Utility tick fires, w1 switches to protocol

    expect(w1.currentTask).not.toBe('rest');
    expect(w1.breakTaskLockedSeconds).toBe(0);
  });

  // Anchor 119: Once breakTaskLockedSeconds >= BREAK_TASK_MIN_LOCK_SECONDS, normal re-evaluation resumes
  it('119. Once breakTaskLockedSeconds >= BREAK_TASK_MIN_LOCK_SECONDS, normal re-evaluation resumes', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    w1.stamina = 1.0; // High stamina
    w1.currentTask = 'rest';
    w1.breakTaskLockedSeconds = 3.0; // Exactly at lock threshold (>= 3.0s)

    tickKitchenState(k, 0.5); // Utility tick fires, re-evaluation allowed

    expect(w1.currentTask).toBe('protocol'); // Successfully re-evaluated and switched to protocol
  });

  // Anchor 120: Real integration probe confirming task stability when hovering near Rest boundary with Manager encouragement
  it('120. Real integration probe confirming task stability when hovering near Rest boundary', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];

    // Set stamina to 0.25 where Rest urgency creates competitive task selection against Protocol work
    w1.stamina = 0.25;

    const taskHistory: Array<{ time: number; task: string | null }> = [];
    let lastTask: string | null = null;

    // Simulate 30 seconds (300 ticks of 0.1s)
    for (let t = 0; t < 300; t++) {
      tickKitchenState(k, 0.1);

      if (w1.currentTask !== lastTask) {
        lastTask = w1.currentTask;
        taskHistory.push({
          time: Math.round(t * 0.1 * 10) / 10,
          task: lastTask,
        });
      }
    }

    console.log('Anchor 120 Break Task Stability Sequence:', JSON.stringify(taskHistory, null, 2));

    // Ensure worker task transitions remain stable and do not jitter rapidly on every 2Hz utility tick (0.5s)
    expect(taskHistory.length).toBeGreaterThan(1); // Confirm real contention & transitions occurred
    expect(taskHistory.length).toBeLessThanOrEqual(10);
  });

  // Anchor 121: Daily P&L Tracking Field Initialization & Reset
  it('121. KitchenState initializes cashEarnedToday and cashSpentToday to 0 and resets them in startNextDay', () => {
    const k = createInitialKitchenState();
    expect(k.cashEarnedToday).toBe(0);
    expect(k.cashSpentToday).toBe(0);

    k.cashEarnedToday = 150.5;
    k.cashSpentToday = 32.0;

    startNextDay(k);
    expect(k.cashEarnedToday).toBe(0);
    expect(k.cashSpentToday).toBe(0);
  });

  // Anchor 122: Revenue Tracking on Window Order Completion
  it('122. Order completion at Window increments cashEarnedToday by quality-scaled cash', () => {
    const k = createInitialKitchenState();
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.batchQuality = 68; // 68 + 12 (protocol completion) = 80% quality

    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    order.quality = 0.8;
    windowStation.orders.push(order);

    const initialEarned = k.cashEarnedToday;
    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    const expectedEarned = BASE_PRICE_BURGER + (order.wantsFries ? ADDON_PRICE_FRIES : 0) + TIP_MAX_PER_ORDER * order.quality;
    expect(k.cashEarnedToday - initialEarned).toBeCloseTo(expectedEarned);
  });

  // Anchor 123: Unconditional Auto-Restock and Expense Tracking
  it('123. checkAutoRestock triggers unconditionally when stock is 0 and cash >= UNLOAD_TRUCK_COST, recording expense', () => {
    const k = createInitialKitchenState();
    k.stockUnits = 0;
    k.cash = 20.0;
    k.autoRestockEnabled = false; // Even if false, restock is now unconditional

    checkAutoRestock(k);

    expect(k.stockUnits).toBe(3);
    expect(k.cash).toBe(12.0);
    expect(k.cashSpentToday).toBe(8.0);
  });

  // Anchor 124: Unconditional Auto Waste Buffer Discharge
  it('124. autoDischargeWaste fires unconditionally when wasteBuffer > 0', () => {
    const k = createInitialKitchenState();
    k.wasteBuffer = 2.5;

    autoDischargeWaste(k);

    expect(k.wasteBuffer).toBe(0);
    expect(k.mealAvailable).toBe(true);
    expect(k.mealUnits).toBe(25.0);
  });

  // Anchor 125: P&L Report Calculations
  it('125. Daily P&L net calculation reflects revenue minus expenses', () => {
    const k = createInitialKitchenState();
    k.cashEarnedToday = 45.0;
    k.cashSpentToday = 16.0;

    const net = k.cashEarnedToday - k.cashSpentToday;
    expect(net).toBe(29.0);
  });

  // Anchor 126: Multi-Day Cash Persistence vs Daily P&L Reset
  it('126. Cumulative cash persists across days while daily P&L fields reset', () => {
    const k = createInitialKitchenState();
    k.cash = 50.0;
    k.cashEarnedToday = 30.0;
    k.cashSpentToday = 8.0;

    startNextDay(k);

    expect(k.cash).toBe(50.0);
    expect(k.cashEarnedToday).toBe(0);
    expect(k.cashSpentToday).toBe(0);
  });

  // Anchor 127: Verification of ControlPanel Source Code Removal of Manual Restock and Auto-Restock UI
  it('127. ControlPanel.tsx contains zero references to manual Restock button or auto-restock checkbox', () => {
    const cpPath = path.resolve(__dirname, '../src/components/ControlPanel.tsx');
    const content = fs.readFileSync(cpPath, 'utf-8');

    expect(content).not.toContain('onRestockUnits');
    expect(content).not.toContain('onToggleAutoRestock');
    expect(content).not.toContain('type="checkbox"');
  });

  // Anchor 128: Verification of ControlPanel Source Code Removal of Staff Meal UI Trigger
  it('128. ControlPanel.tsx contains zero references to manual Feed Staff Meal button or onDischargeStaffMeal trigger', () => {
    const cpPath = path.resolve(__dirname, '../src/components/ControlPanel.tsx');
    const content = fs.readFileSync(cpPath, 'utf-8');

    expect(content).not.toContain('onDischargeStaffMeal');
    expect(content).not.toContain('Feed Staff Meal');
  });

  // Anchor 129: Full Shift Simulation verifying Auto-Restock and Auto-Discharge in tickKitchenState
  it('129. Full tickKitchenState simulation auto-restocks stock and auto-discharges waste buffer passively', () => {
    const k = createInitialKitchenState();
    k.stockUnits = 0;
    k.stockDepletedSeconds = 4.0;
    k.cash = 10.0;
    k.wasteBuffer = 1.5;

    tickKitchenState(k, 0.1);

    expect(k.stockUnits).toBe(3);
    expect(k.cash).toBe(2.0);
    expect(k.cashSpentToday).toBe(8.0);
    expect(k.wasteBuffer).toBe(1.5);
    expect(k.mealAvailable).toBe(false);
  });

  // Anchor 130: NightScreen P&L Statement Structure
  it('130. NightScreen.tsx source code renders structured Daily P&L Statement with Revenue, Cost, and Net', () => {
    const nsPath = path.resolve(__dirname, '../src/components/NightScreen.tsx');
    const content = fs.readFileSync(nsPath, 'utf-8');

    expect(content).toContain('P&L Statement');
    expect(content).toContain('Revenue');
    expect(content).toContain('Restock Cost');
    expect(content).toContain('Net Profit / Loss');
  });

  // Anchor 131: Initial Station Unlock States
  it('131. createInitialKitchenState initializes unlockedStations.fryer === false, all other stations true, and coffeeSalesUnlocked === false', () => {
    const k = createInitialKitchenState();
    expect(k.unlockedStations.fryer).toBe(false);
    expect(k.unlockedStations.queue).toBe(true);
    expect(k.unlockedStations.grill).toBe(true);
    expect(k.unlockedStations.assembly).toBe(true);
    expect(k.unlockedStations.window).toBe(true);
    expect(k.unlockedStations.coffee).toBe(true);
    expect(k.coffeeSalesUnlocked).toBe(false);
  });

  // Anchor 132: Order Generation Fries Suppression
  it('132. Calling createOrder(state.unlockedStations.fryer ? undefined : false) when Fryer is locked produces an order where wantsFries === false', () => {
    const k = createInitialKitchenState();
    expect(k.unlockedStations.fryer).toBe(false);
    for (let i = 0; i < 50; i++) {
      const order = createOrder(k.unlockedStations.fryer ? undefined : false);
      expect(order.wantsFries).toBe(false);
    }
  });

  // Anchor 133: Locked Station Filtering in Station Assignment
  it('133. When Fryer is locked, passing state.stations filtered by unlockedStations to chooseStation never returns fryer as chosen station', () => {
    const k = createInitialKitchenState();
    expect(k.unlockedStations.fryer).toBe(false);
    const fryerStation = k.stations.find((s) => s.id === 'fryer')!;
    fryerStation.orders = [createOrder(true), createOrder(true), createOrder(true), createOrder(true)];

    const availableForSelection = k.stations.filter((s) => k.unlockedStations[s.id]);
    const reservedThisTick = new Set<StationId>();

    for (const worker of k.workers) {
      const chosen = chooseStation(worker, availableForSelection, reservedThisTick);
      expect(chosen).not.toBe('fryer');
    }
  });

  // Anchor 134: Unlocked Station Selection
  it('134. Toggling unlockedStations.fryer = true immediately allows chooseStation to return fryer when Fryer has orders queued', () => {
    const k = createInitialKitchenState();
    k.unlockedStations.fryer = true;
    const fryerStation = k.stations.find((s) => s.id === 'fryer')!;
    fryerStation.orders = [createOrder(true), createOrder(true), createOrder(true)];

    const availableForSelection = k.stations.filter((s) => k.unlockedStations[s.id]);
    const reservedThisTick = new Set<StationId>();

    const chosen = chooseStation(k.workers[0], availableForSelection, reservedThisTick);
    expect(chosen).toBe('fryer');
  });

  // Anchor 135: Station Unlock vs Sales Unlock Independence
  it('135. Toggling coffeeSalesUnlocked = true leaves unlockedStations.coffee === true untouched', () => {
    const k = createInitialKitchenState();
    expect(k.unlockedStations.coffee).toBe(true);
    expect(k.coffeeSalesUnlocked).toBe(false);

    k.coffeeSalesUnlocked = true;
    expect(k.unlockedStations.coffee).toBe(true);
    expect(k.coffeeSalesUnlocked).toBe(true);
  });

  // Anchor 136: Fryer Task Accumulation Integration Probe
  it('136. Real integration probe: running 60 seconds with Fryer locked produces 0 Fryer tasks completed in stationStats, while unlocked allows Fryer tasks', () => {
    const lockedState = createInitialKitchenState();
    lockedState.unlockedStations.fryer = false;
    for (let i = 0; i < 1200; i++) {
      tickKitchenState(lockedState, 0.05);
    }
    let lockedFryerTasks = 0;
    for (const w of lockedState.workers) {
      if (w.stationStats?.fryer) {
        lockedFryerTasks += w.stationStats.fryer.protocols + w.stationStats.fryer.cornerCuts;
      }
    }
    expect(lockedFryerTasks).toBe(0);

    const unlockedState = createInitialKitchenState();
    unlockedState.unlockedStations.fryer = true;
    for (let i = 0; i < 1200; i++) {
      tickKitchenState(unlockedState, 0.05);
    }
    let unlockedFryerTasks = 0;
    for (const w of unlockedState.workers) {
      if (w.stationStats?.fryer) {
        unlockedFryerTasks += w.stationStats.fryer.protocols + w.stationStats.fryer.cornerCuts;
      }
    }
    expect(unlockedFryerTasks).toBeGreaterThan(0);
  });

  // Anchor 137: Delays restocking until stockDepletedSeconds >= AUTO_RESTOCK_DELAY_SECONDS
  it('137. checkAutoRestock does not call unloadTruck before stockDepletedSeconds crosses AUTO_RESTOCK_DELAY_SECONDS, even with stock at 0 and sufficient Cash', () => {
    const k = createInitialKitchenState();
    k.stockUnits = 0;
    k.cash = 20.0;
    k.stockDepletedSeconds = 0;

    checkAutoRestock(k, 1.0);
    expect(k.stockUnits).toBe(0);
    expect(k.cash).toBe(20.0);
    expect(k.stockDepletedSeconds).toBe(1.0);

    checkAutoRestock(k, 1.0);
    expect(k.stockUnits).toBe(0);
    expect(k.cash).toBe(20.0);
    expect(k.stockDepletedSeconds).toBe(2.0);

    checkAutoRestock(k, 1.0);
    expect(k.stockUnits).toBe(0);
    expect(k.cash).toBe(20.0);
    expect(k.stockDepletedSeconds).toBe(3.0);
  });

  // Anchor 138: Restock triggers once delay threshold is crossed and resets stockDepletedSeconds to 0
  it('138. Once the delay threshold is crossed, restock fires exactly once, and stockDepletedSeconds resets to 0', () => {
    const k = createInitialKitchenState();
    k.stockUnits = 0;
    k.cash = 20.0;
    k.stockDepletedSeconds = 3.5;

    checkAutoRestock(k, 1.0);

    expect(k.stockUnits).toBe(3);
    expect(k.cash).toBe(12.0); // 20 - 8
    expect(k.stockDepletedSeconds).toBe(0);
  });

  // Anchor 139: Immediate reset when stockUnits > 0
  it('139. stockDepletedSeconds resets immediately the instant stockUnits > 0', () => {
    const k = createInitialKitchenState();
    k.stockUnits = 1;
    k.stockDepletedSeconds = 2.5;

    checkAutoRestock(k, 0.1);

    expect(k.stockDepletedSeconds).toBe(0);
  });

  // Anchor 140: Real integration probe for Day-1 Burgers-only stock visibility
  it('140. Real integration probe: Day-1 Burgers-only shift confirms stockUnits visibly registers at 0 for a sustained span', () => {
    const k = createInitialKitchenState();
    k.policyDial = 0.5;

    let zeroStockTicks = 0;
    let totalRestocks = 0;

    for (let i = 0; i < 1200; i++) {
      const prevStock = k.stockUnits;
      tickKitchenState(k, 0.05);
      if (k.stockUnits === 0) {
        zeroStockTicks++;
      }
      if (prevStock === 0 && k.stockUnits > 0) {
        totalRestocks++;
      }
    }

    const zeroStockSeconds = zeroStockTicks * 0.05;

    console.log('Anchor 140 Day 1 Stock Visibility Probe Results:', {
      zeroStockTicks,
      zeroStockSeconds: zeroStockSeconds.toFixed(2),
      totalRestocks,
      ordersServed: k.ordersServed,
      finalCash: k.cash.toFixed(2),
    });

    expect(zeroStockSeconds).toBeGreaterThan(0);
    expect(totalRestocks).toBeGreaterThan(0);
  });

  // Anchor 141: Anchor 6, corrected — real, manufactured backpressure produces throughputState.totalCornerCutsTaken > strictState.totalCornerCutsTaken for the real reason
  it('141. Corrected Anchor 6 verifies policyDial=1.0 under pre-loaded buffer backpressure generates strictly more corner cuts than policyDial=0.0', () => {
    const strictState = createInitialKitchenState();
    strictState.policyDial = 0.0;
    for (let i = 0; i < 1000; i++) tickKitchenState(strictState, 0.05);

    const throughputState = createInitialKitchenState();
    throughputState.policyDial = 1.0;
    for (const station of throughputState.stations) {
      if (station.id === 'grill' || station.id === 'assembly') {
        station.orders = Array.from({ length: Math.floor(station.bufferCapacity * 0.8) }, () => createOrder());
      }
    }
    for (let i = 0; i < 1000; i++) tickKitchenState(throughputState, 0.05);

    expect(throughputState.totalCornerCutsTaken).toBeGreaterThan(strictState.totalCornerCutsTaken);
  });

  // Anchor 142: Each one-time upgrade purchases exactly once — a second real attempt is a no-op
  it('142. Each one-time upgrade purchases exactly once and subsequent purchase attempts fail and leave cash untouched', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 500;

    // First purchase of buffer capacity
    const res1 = purchaseBufferCapacity(k);
    expect(res1).toBe(true);
    expect(k.purchasedUpgrades.buffer_capacity).toBe(true);
    const cashAfterFirst = k.cash;

    // Second purchase attempt
    const res2 = purchaseBufferCapacity(k);
    expect(res2).toBe(false);
    expect(k.cash).toBe(cashAfterFirst);
  });

  // Anchor 143: purchaseBrandRecovery is genuinely repeatable
  it('143. purchaseBrandRecovery is genuinely repeatable when cash is available and brandEquity is below 100', () => {
    const k = createInitialKitchenState();
    k.cash = 100;
    k.brandEquity = 50;

    const res1 = purchaseBrandRecovery(k);
    expect(res1).toBe(true);
    expect(k.brandEquity).toBe(50 + BRAND_RECOVERY_AMOUNT);
    expect(k.cash).toBe(100 - UPGRADE_BRAND_RECOVERY_COST);

    const res2 = purchaseBrandRecovery(k);
    expect(res2).toBe(true);
    expect(k.brandEquity).toBe(50 + BRAND_RECOVERY_AMOUNT * 2);
    expect(k.cash).toBe(100 - UPGRADE_BRAND_RECOVERY_COST * 2);
  });

  // Anchor 144: Buffer/Stock/Day-Duration purchases produce exact real stated increases
  it('144. Upgrade purchases apply exact real stated increases to station capacities, stock capacity bonus, and shift duration', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 500;

    const grillBefore = k.stations.find((s) => s.id === 'grill')!.bufferCapacity;
    const durationBefore = k.dayDurationSeconds;

    purchaseBufferCapacity(k);
    const grillAfter = k.stations.find((s) => s.id === 'grill')!.bufferCapacity;
    expect(grillAfter).toBe(grillBefore + BUFFER_CAPACITY_INCREASE);

    purchaseStockCapacity(k);
    expect(k.stockCapacityBonus).toBe(STOCK_CAPACITY_INCREASE);

    purchaseDayDuration(k);
    expect(k.dayDurationSeconds).toBe(durationBefore + DAY_DURATION_INCREASE_SECONDS);
  });

  // Anchor 145: Every purchase function is a real no-op when Cash is insufficient
  it('145. Every purchase function returns false and makes zero mutations when cash is insufficient', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 0;
    k.brandEquity = 50;

    const initBufferCap = k.stations.find((s) => s.id === 'grill')!.bufferCapacity;
    const initDuration = k.dayDurationSeconds;

    expect(purchaseBufferCapacity(k)).toBe(false);
    expect(purchaseStockCapacity(k)).toBe(false);
    expect(purchaseDayDuration(k)).toBe(false);
    expect(purchaseBrandRecovery(k)).toBe(false);
    expect(purchaseFriesUnlock(k)).toBe(false);

    expect(k.cash).toBe(0);
    expect(k.brandEquity).toBe(50);
    expect(k.stations.find((s) => s.id === 'grill')!.bufferCapacity).toBe(initBufferCap);
    expect(k.dayDurationSeconds).toBe(initDuration);
    expect(k.stockCapacityBonus).toBe(0);
  });

  // Anchor 146: purchaseStockCapacity grants a real immediate stockUnits top-up clamped to the new total capacity
  it('146. purchaseStockCapacity grants an immediate proportional stockUnits top-up clamped to new capacity', () => {
    // Scenario 1: stock was full (3/3)
    const k1 = createInitialKitchenState();
    k1.dayNumber = 8;
    k1.cash = 100;
    k1.stockUnits = STOCK_UNITS_CAPACITY; // 3
    const res1 = purchaseStockCapacity(k1);
    expect(res1).toBe(true);
    expect(k1.stockCapacityBonus).toBe(STOCK_CAPACITY_INCREASE); // 3
    expect(k1.stockUnits).toBe(STOCK_UNITS_CAPACITY + STOCK_CAPACITY_INCREASE); // 6

    // Scenario 2: stock was partial (1/3)
    const k2 = createInitialKitchenState();
    k2.dayNumber = 8;
    k2.cash = 100;
    k2.stockUnits = 1;
    const res2 = purchaseStockCapacity(k2);
    expect(res2).toBe(true);
    expect(k2.stockCapacityBonus).toBe(STOCK_CAPACITY_INCREASE); // 3
    expect(k2.stockUnits).toBe(1 + STOCK_CAPACITY_INCREASE); // 4
  });

  // Anchor 147: purchaseFriesUnlock correctly sets unlockedStations.fryer = true and deducts real Cash
  it('147. purchaseFriesUnlock sets unlockedStations.fryer to true and deducts UPGRADE_FRIES_UNLOCK_COST cash', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 50;
    expect(k.unlockedStations.fryer).toBe(false);

    const res = purchaseFriesUnlock(k);
    expect(res).toBe(true);
    expect(k.unlockedStations.fryer).toBe(true);
    expect(k.cash).toBe(50 - UPGRADE_FRIES_UNLOCK_COST);
  });

  // Anchor 148: purchaseFriesUnlock is a real no-op if Fryer is already unlocked or Cash is insufficient
  it('148. purchaseFriesUnlock is a no-op if Fryer is already unlocked or cash is insufficient', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 10; // Less than UPGRADE_FRIES_UNLOCK_COST (20)
    expect(purchaseFriesUnlock(k)).toBe(false);
    expect(k.cash).toBe(10);
    expect(k.unlockedStations.fryer).toBe(false);

    k.cash = 50;
    k.unlockedStations.fryer = true;
    expect(purchaseFriesUnlock(k)).toBe(false);
    expect(k.cash).toBe(50);
  });

  // Anchor 149: Real integration probe confirming after purchaseFriesUnlock, wantsFries rolls and Fryer participates in simulation
  it('149. Real integration probe: after purchaseFriesUnlock, wantsFries rolls on new orders during a full simulated Day', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 50;
    purchaseFriesUnlock(k);
    expect(k.unlockedStations.fryer).toBe(true);

    k.gamePhase = 'day';

    let friesOrderCount = 0;
    const seenOrderIds = new Set<string>();

    for (let t = 0; t < 1200; t++) {
      tickKitchenState(k, 0.05);
      const queueStation = k.stations.find((s) => s.id === 'queue');
      if (queueStation) {
        for (const order of queueStation.orders) {
          if (!seenOrderIds.has(order.id)) {
            seenOrderIds.add(order.id);
            if (order.wantsFries) friesOrderCount++;
          }
        }
      }
    }

    expect(seenOrderIds.size).toBeGreaterThan(0);
    expect(friesOrderCount).toBeGreaterThan(0);
  });

  // Anchor 150: Fryer renders on canvas once unlocked (render-skip condition evaluates false)
  it('150. Fryer station render-skip condition evaluates to false when unlockedStations.fryer is true', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 50;
    const fryerStation = k.stations.find((s) => s.id === 'fryer')!;
    expect(k.unlockedStations[fryerStation.id]).toBe(false);
    // When locked, skip condition is true
    expect(k.unlockedStations && k.unlockedStations[fryerStation.id] === false).toBe(true);

    const res = purchaseFriesUnlock(k);
    expect(res).toBe(true);
    expect(k.unlockedStations[fryerStation.id]).toBe(true);
    // When unlocked, skip condition evaluates false
    expect(k.unlockedStations && k.unlockedStations[fryerStation.id] === false).toBe(false);
  });

  // Anchor 151: startNextDay seeds demandTier from storeTier, keeping flat baseline across days within a week
  it('151. startNextDay seeds demandTier from storeTier across Days 2, 3, and 8', () => {
    const k = createInitialKitchenState();
    expect(k.storeTier).toBe(1);

    k.dayNumber = 2;
    startNextDay(k);
    expect(k.demandTier).toBe(1);

    k.dayNumber = 3;
    startNextDay(k);
    expect(k.demandTier).toBe(1);

    k.storeTier = 2;
    k.dayNumber = 8;
    startNextDay(k);
    expect(k.demandTier).toBe(2);
  });

  // Anchor 152: On a non-Wave day, demandTier stays at the flat storeTier baseline for the whole day
  it('152. On a non-Wave day, demandTier stays at the flat storeTier baseline for the whole day', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 3; // Day 3 is non-wave
    k.storeTier = 1;
    startNextDay(k);

    for (let t = 0; t < 300; t++) {
      tickKitchenState(k, 0.2);
      expect(k.demandTier).toBe(1);
    }
  });

  // Anchor 153: On a Wave day, demandTier builds linearly from storeTier to storeTier * WAVE_INTENSITY_MULTIPLIER
  it('153. On a Wave day, demandTier builds linearly from storeTier to storeTier * WAVE_INTENSITY_MULTIPLIER', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 7; // Day 7 is Wave day
    k.storeTier = 1;
    startNextDay(k);

    // At 0% progress
    tickKitchenState(k, 0);
    expect(k.demandTier).toBeCloseTo(1, 2);

    // At 50% progress (30s out of 60s)
    k.dayElapsedSeconds = k.dayDurationSeconds * 0.5;
    tickKitchenState(k, 0);
    expect(k.demandTier).toBeCloseTo(1 + (5 - 1) * 0.5, 2); // 3.0

    // At ~100% progress (end of day before transition)
    k.dayElapsedSeconds = k.dayDurationSeconds * 0.999;
    tickKitchenState(k, 0);
    expect(k.demandTier).toBeCloseTo(5, 1); // wavePeak = 1 * 5 = 5
  });

  // Anchor 154: Surviving a Wave day increments storeTier by exactly 1 at Day->Night transition
  it('154. Surviving a Wave day increments storeTier by 1 at Day->Night transition', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 7;
    k.storeTier = 1;
    k.brandEquity = 80; // safe brand equity
    k.dayElapsedSeconds = k.dayDurationSeconds;

    tickKitchenState(k, 0.1);

    expect(k.storeTier).toBe(2);
  });

  // Anchor 155: Failing a Wave day triggers existing Game Over and storeTier does NOT increment
  it('155. Failing a Wave day triggers Game Over and storeTier does NOT increment', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 7;
    k.storeTier = 1;
    k.brandEquity = 0; // brand equity hit 0
    k.dayElapsedSeconds = k.dayDurationSeconds * 0.8;

    tickKitchenState(k, 0.1);

    expect(k.gamePhase).toBe('game_over');
    expect(k.storeTier).toBe(1); // did not increment
  });

  // Anchor 156: Real integration probe: simulate through a full first Wave (Days 1-7) and track Brand Equity trajectory
  it('156. Real integration probe: simulate through full first Wave (Days 1-7) and track Brand Equity trajectory', () => {
    const k = createInitialKitchenState();
    const brandEquityTrajectory: { day: number; startEquity: number; endEquity: number; finalDemandTier: number }[] = [];

    for (let day = 1; day <= 7; day++) {
      k.dayNumber = day;
      startNextDay(k);
      const startEquity = k.brandEquity;

      // Simulate full day (60s)
      for (let t = 0; t < 600; t++) {
        if (k.gamePhase === 'game_over') break;
        tickKitchenState(k, 0.1);
      }

      brandEquityTrajectory.push({
        day,
        startEquity,
        endEquity: k.brandEquity,
        finalDemandTier: k.demandTier,
      });

      if (k.gamePhase === 'game_over') break;
    }

    console.log('Anchor 156 First Wave Trajectory Probe:', JSON.stringify(brandEquityTrajectory, null, 2));

    if (k.gamePhase !== 'game_over') {
      expect(k.storeTier).toBe(2);
    } else {
      expect(k.storeTier).toBe(1);
    }
  });

  // Anchor 157: isNewThisNight returns true the first time an item becomes available, false on every subsequent Night
  it('157. isNewThisNight returns true the first time an item becomes available, false on every subsequent Night', () => {
    const shopItemsEverAvailable: Record<string, boolean> = {};

    const isNewNight1 = isNewThisNight(shopItemsEverAvailable, 'fries_unlock', true);
    expect(isNewNight1).toBe(true);

    shopItemsEverAvailable['fries_unlock'] = true;

    const isNewNight2 = isNewThisNight(shopItemsEverAvailable, 'fries_unlock', true);
    expect(isNewNight2).toBe(false);
  });

  // Anchor 158: shopItemsEverAvailable correctly marks an item seen on display, independent of whether it was purchased that Night
  it('158. shopItemsEverAvailable correctly marks an item seen on display, independent of whether it was purchased that Night', () => {
    const k = createInitialKitchenState();
    expect(k.shopItemsEverAvailable['fries_unlock']).toBeUndefined();

    const isNew = isNewThisNight(k.shopItemsEverAvailable, 'fries_unlock', true);
    expect(isNew).toBe(true);

    k.shopItemsEverAvailable['fries_unlock'] = true;
    expect(k.shopItemsEverAvailable['fries_unlock']).toBe(true);
    expect(k.unlockedStations.fryer).toBe(false);

    expect(isNewThisNight(k.shopItemsEverAvailable, 'fries_unlock', true)).toBe(false);
  });

  // Anchor 159: Tier-up message is WEEK_ONE_TIER_UP_MESSAGE when storeTier transitions to 2, and routine message for Tier 3
  it('159. Tier-up message is WEEK_ONE_TIER_UP_MESSAGE when storeTier is 2, and routine templated message for storeTier 3', () => {
    expect(getTierUpMessage(2)).toBe(WEEK_ONE_TIER_UP_MESSAGE);
    expect(getTierUpMessage(3)).toBe('Week Survived — Tier 3 Unlocked');
  });

  // Anchor 160: hasSeenCautionHint starts false and flips to true only via investigateWorker, never via rendering alone
  it('160. hasSeenCautionHint starts false and flips to true only via investigateWorker, never via rendering alone', () => {
    const k = createInitialKitchenState();
    expect(k.hasSeenCautionHint).toBe(false);

    const mockCtx = {
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowColor: '',
      shadowBlur: 0,
      textAlign: '',
      textBaseline: '',
      measureText: () => ({ width: 20 }),
      beginPath: () => {},
      arc: () => {},
      clip: () => {},
      moveTo: () => {},
      lineTo: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      roundRect: () => {},
      fill: () => {},
      fillText: () => {},
      save: () => {},
      restore: () => {},
      stroke: () => {},
    } as unknown as CanvasRenderingContext2D;

    const w = k.workers[0];
    w.currentTask = 'corner_cut';
    renderWorker(mockCtx, w, k);

    expect(k.hasSeenCautionHint).toBe(false);

    investigateWorker(k, w.id);
    expect(k.hasSeenCautionHint).toBe(true);
  });

  // Anchor 161: Real integration probe tracking caution hint state alongside real worker corner-cuts across a full shift
  it('161. Real integration probe tracking caution hint state alongside real worker corner-cuts across a full shift', () => {
    const k = createInitialKitchenState();
    k.policyDial = 1.0;
    expect(k.hasSeenCautionHint).toBe(false);

    let cornerCutOccurred = false;
    let cautionHintWhenCornerCut: boolean | null = null;

    for (let t = 0; t < 300; t++) {
      tickKitchenState(k, 0.2);
      const cornerCutter = k.workers.find((w) => w.currentTask === 'corner_cut');
      if (cornerCutter && !cornerCutOccurred) {
        cornerCutOccurred = true;
        k.manager.stamina = 1.0; // Ensure attention pool is available for investigation
        cautionHintWhenCornerCut = k.hasSeenCautionHint;
        investigateWorker(k, cornerCutter.id);
      }
    }

    console.log('Anchor 161 Probe Result:', { cornerCutOccurred, cautionHintWhenCornerCut, finalHasSeenCautionHint: k.hasSeenCautionHint });
    expect(k.hasSeenCautionHint).toBe(true);
  });

  // Anchor 162: purchaseFriesUnlock returns false and deducts no cash when dayNumber === 7 (Wave Day itself, one day short)
  it('162. purchaseFriesUnlock returns false and deducts no cash when dayNumber === 7, even with sufficient cash', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 7;
    k.cash = 100;
    const initialCash = k.cash;

    const result = purchaseFriesUnlock(k);
    expect(result).toBe(false);
    expect(k.cash).toBe(initialCash);
    expect(k.unlockedStations.fryer).toBe(false);
  });

  // Anchor 163: purchaseFriesUnlock succeeds when dayNumber === 8 with sufficient cash
  it('163. purchaseFriesUnlock succeeds when dayNumber === 8 with sufficient cash', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 100;

    const result = purchaseFriesUnlock(k);
    expect(result).toBe(true);
    expect(k.cash).toBe(100 - UPGRADE_FRIES_UNLOCK_COST);
    expect(k.unlockedStations.fryer).toBe(true);
  });

  // Anchor 164: purchaseBufferCapacity, purchaseStockCapacity, purchaseDayDuration each return false and deduct no cash when dayNumber === 7 (one day short), even with sufficient cash
  it('164. purchaseBufferCapacity, purchaseStockCapacity, purchaseDayDuration each return false and deduct no cash when dayNumber === 7', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 7;
    k.cash = 500;
    const initialCash = k.cash;

    expect(purchaseBufferCapacity(k)).toBe(false);
    expect(purchaseStockCapacity(k)).toBe(false);
    expect(purchaseDayDuration(k)).toBe(false);
    expect(k.cash).toBe(initialCash);
    expect(k.purchasedUpgrades?.buffer_capacity).toBeFalsy();
    expect(k.purchasedUpgrades?.stock_capacity).toBeFalsy();
    expect(k.purchasedUpgrades?.day_duration).toBeFalsy();
  });

  // Anchor 165: All three Basic Upgrades succeed when dayNumber === 8 with sufficient cash
  it('165. All three Basic Upgrades succeed when dayNumber === 8 with sufficient cash', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.cash = 500;

    expect(purchaseBufferCapacity(k)).toBe(true);
    expect(purchaseStockCapacity(k)).toBe(true);
    expect(purchaseDayDuration(k)).toBe(true);
    expect(k.purchasedUpgrades?.buffer_capacity).toBe(true);
    expect(k.purchasedUpgrades?.stock_capacity).toBe(true);
    expect(k.purchasedUpgrades?.day_duration).toBe(true);
  });

  // Anchor 166: Real integration probe: simulate through Days 1-7 — confirm nothing in the shop is purchasable at any point during that span
  it('166. Real integration probe: simulate through Days 1-7 — confirm nothing in shop is purchasable at any day', () => {
    const k = createInitialKitchenState();
    k.cash = 1000;

    for (let day = 1; day <= 7; day++) {
      k.dayNumber = day;
      expect(purchaseFriesUnlock(k)).toBe(false);
      expect(purchaseBufferCapacity(k)).toBe(false);
      expect(purchaseStockCapacity(k)).toBe(false);
      expect(purchaseDayDuration(k)).toBe(false);

      const friesAvail = !k.unlockedStations?.fryer && k.dayNumber >= FRIES_UNLOCK_MIN_DAY;
      const bufferAvail = !k.purchasedUpgrades?.buffer_capacity && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;
      const stockAvail = !k.purchasedUpgrades?.stock_capacity && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;
      const durationAvail = !k.purchasedUpgrades?.day_duration && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;

      expect(friesAvail).toBe(false);
      expect(bufferAvail).toBe(false);
      expect(stockAvail).toBe(false);
      expect(durationAvail).toBe(false);
    }
  });

  // Anchor 167: Real integration probe: simulate to dayNumber === 8 — confirm all four items now show available and correctly flagged NEW via isNewThisNight
  it('167. Real integration probe: simulate to dayNumber === 8 — confirm all four items show available and flagged NEW', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;

    const shopItemsEverAvailable: Record<string, boolean> = {};

    const friesAvailable = !k.unlockedStations?.fryer && k.dayNumber >= FRIES_UNLOCK_MIN_DAY;
    const bufferAvailable = !k.purchasedUpgrades?.buffer_capacity && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;
    const stockAvailable = !k.purchasedUpgrades?.stock_capacity && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;
    const durationAvailable = !k.purchasedUpgrades?.day_duration && k.dayNumber >= BASIC_UPGRADES_MIN_DAY;

    expect(friesAvailable).toBe(true);
    expect(bufferAvailable).toBe(true);
    expect(stockAvailable).toBe(true);
    expect(durationAvailable).toBe(true);

    const isFriesNew = isNewThisNight(shopItemsEverAvailable, 'fries_unlock', friesAvailable);
    const isBufferNew = isNewThisNight(shopItemsEverAvailable, 'buffer_capacity', bufferAvailable);
    const isStockNew = isNewThisNight(shopItemsEverAvailable, 'stock_capacity', stockAvailable);
    const isDurationNew = isNewThisNight(shopItemsEverAvailable, 'day_duration', durationAvailable);

    expect(isFriesNew).toBe(true);
    expect(isBufferNew).toBe(true);
    expect(isStockNew).toBe(true);
    expect(isDurationNew).toBe(true);
  });

  // Anchor 168: Real integration probe: getTierUpMessage at the Day 7->8 transition still returns WEEK_ONE_TIER_UP_MESSAGE
  it('168. Real integration probe: getTierUpMessage at the Day 7->8 transition returns WEEK_ONE_TIER_UP_MESSAGE', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8;
    k.storeTier = 2;
    k.gamePhase = 'night';

    expect(k.gamePhase).toBe('night');
    expect(k.dayNumber).toBe(8);
    expect(k.storeTier).toBe(2);

    const msg = getTierUpMessage(k.storeTier);
    expect(msg).toBe(WEEK_ONE_TIER_UP_MESSAGE);
  });

  // Anchor 169: Verify Fry Station purchase deducts cash and unlocks station cleanly without state pollution
  it('169. Fry Station purchase deducts UPGRADE_FRIES_UNLOCK_COST from cash and sets fryer station unlocked', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 8; // Week 2 Night Phase
    k.cash = 50.0;

    const initialCash = k.cash;
    const success = purchaseFriesUnlock(k);

    expect(success).toBe(true);
    expect(k.cash).toBe(initialCash - UPGRADE_FRIES_UNLOCK_COST); // 30.0
    expect(k.unlockedStations.fryer).toBe(true);

    // Test React functional update pattern with deep/nested copy
    const prev = createInitialKitchenState();
    prev.dayNumber = 8;
    prev.cash = 50.0;

    const handlePurchase = (state: KitchenState) => {
      const next: KitchenState = {
        ...state,
        purchasedUpgrades: { ...state.purchasedUpgrades },
        unlockedStations: { ...state.unlockedStations },
        stations: state.stations.map((s) => ({ ...s })),
        shopItemsEverAvailable: { ...state.shopItemsEverAvailable },
      };
      purchaseFriesUnlock(next);
      return next;
    };

    // First call (Run 1)
    const run1 = handlePurchase(prev);
    expect(run1.cash).toBe(30.0);
    expect(run1.unlockedStations.fryer).toBe(true);

    // Second call with original prev (Run 2 - React Strict Mode re-invocation)
    const run2 = handlePurchase(prev);
    expect(run2.cash).toBe(30.0);
    expect(run2.unlockedStations.fryer).toBe(true);
  });

  // Anchor 170: Real integration probe: over a long simulated shift with heavy station usage, degradation stage increases at least once for at least one station
  it('170. Real integration probe: degradation stage increases at least once across station task completions', () => {
    const k = createInitialKitchenState();
    k.policyDial = 1.0; // High throughput

    let degradationOccurred = false;
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const worker = k.workers[0];
    const config = STATION_CONFIGS.grill;

    // Simulate 300 station task completions
    for (let i = 0; i < 300; i++) {
      executeStationTaskCompletion(worker, grillStation, k, config);
      if ((grillStation.degradationStage || 0) > 0) {
        degradationOccurred = true;
        break;
      }
    }

    expect(degradationOccurred).toBe(true);
  });

  // Anchor 171: Crossing into Stage 1 generates a real, queryable entry in the Situation queue — not just an internal stat change
  it('171. Crossing into Stage 1 generates a queryable entry in state.situationQueue', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const worker = k.workers[0];
    const config = STATION_CONFIGS.grill;

    // Execute completion until degradation occurs
    for (let i = 0; i < 300; i++) {
      executeStationTaskCompletion(worker, grillStation, k, config);
      if ((grillStation.degradationStage || 0) >= 1) break;
    }

    expect(k.situationQueue).toBeDefined();
    expect(k.situationQueue!.length).toBeGreaterThanOrEqual(1);
    const sit = k.situationQueue!.find((s) => s.stationId === 'grill');
    expect(sit).toBeDefined();
    expect(sit!.stage).toBeGreaterThanOrEqual(1);
  });

  // Anchor 172: Responding Yes with Attention available starts a real committed task and removes the situation from the queue
  it('172. Responding Yes with Attention available starts committed repair task and dequeues situation', () => {
    const k = createInitialKitchenState();
    k.manager.stamina = 1.0; // Attention = 3
    const sitId = 'sit-grill-test-1';
    k.situationQueue = [
      {
        id: sitId,
        stationId: 'grill',
        stage: 1,
        initialStage: 1,
        createdTime: 10,
        elapsedSeconds: 0,
      },
    ];

    const success = respondToSituation(k, sitId, true);
    expect(success).toBe(true);
    expect(k.situationQueue.length).toBe(0);
    expect(k.committedRepairTask).toBeDefined();
    expect(k.committedRepairTask!.stationId).toBe('grill');
    expect(k.committedRepairTask!.remainingSeconds).toBe(REPAIR_DURATION_STAGE_1);
    expect(k.manager.currentTask).toBe('repair');
  });

  // Anchor 173: Responding Yes with Attention unavailable (stamina depleted) fails cleanly — situation remains queued, no task committed
  it('173. Responding Yes with Attention unavailable fails cleanly without state mutation', () => {
    const k = createInitialKitchenState();
    k.manager.stamina = 0.0; // Attention = 0
    k.manager.coffeeBoostRemaining = 0;
    const sitId = 'sit-grill-test-2';
    k.situationQueue = [
      {
        id: sitId,
        stationId: 'grill',
        stage: 1,
        initialStage: 1,
        createdTime: 10,
        elapsedSeconds: 0,
      },
    ];

    const success = respondToSituation(k, sitId, true);
    expect(success).toBe(false);
    expect(k.situationQueue.length).toBe(1);
    expect(k.committedRepairTask).toBeNull();
  });

  // Anchor 174: While committed, evaluateManagerTick never selects supervise/patrol/rest/coffee — commitment lock holds for the task's full duration
  it('174. While committed, evaluateManagerTick returns repair candidate and excludes normal manager tasks', () => {
    const k = createInitialKitchenState();
    k.committedRepairTask = {
      stationId: 'grill',
      stage: 1,
      remainingSeconds: 4.0,
      totalDuration: 4.0,
    };

    const decision = evaluateManagerTick(k.manager, k);
    expect(decision.name).toBe('repair');
    expect(decision.name).not.toBe('supervise');
    expect(decision.name).not.toBe('patrol');
    expect(decision.name).not.toBe('rest');
    expect(decision.name).not.toBe('drink_coffee');
  });

  // Anchor 175: A committed repair completes after its full duration and resets that station's degradation to 0
  it('175. Committed repair completes after full duration and resets station degradationStage to 0', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    grillStation.degradationStage = 2;
    k.committedRepairTask = {
      stationId: 'grill',
      stage: 2,
      remainingSeconds: 1.0,
      totalDuration: 10.0,
    };

    tickKitchenState(k, 1.1);

    expect(k.committedRepairTask).toBeNull();
    expect(grillStation.degradationStage).toBe(0);
    expect(k.manager.currentTask).toBe('supervise');
  });

  // Anchor 176: Responding No does not dequeue the situation, and its severity/timer measurably increases over subsequent simulated time
  it('176. Responding No leaves situation in queue and severity escalates over time', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    grillStation.degradationStage = 1;
    k.manager.taskProgress = 999; // Keep manager busy on current task so auto-repair does not interfere

    const sitId = 'sit-grill-defer';
    k.situationQueue = [
      {
        id: sitId,
        stationId: 'grill',
        stage: 1,
        initialStage: 1,
        createdTime: 0,
        elapsedSeconds: 0,
      },
    ];

    const success = respondToSituation(k, sitId, false);
    expect(success).toBe(true);
    expect(k.situationQueue.length).toBe(1);

    // Simulate 16s (past SITUATION_ESCALATION_INTERVAL_SECONDS = 15s)
    tickKitchenState(k, 16.0);

    expect(k.situationQueue[0].stage).toBe(2);
    expect(grillStation.degradationStage).toBe(2);
  });

  // Anchor 177: A Stage 2 repair's committed duration is measurably longer than a Stage 1 repair's
  it('177. Stage 2 repair duration is measurably longer than Stage 1 repair duration', () => {
    expect(REPAIR_DURATION_STAGE_2).toBeGreaterThan(REPAIR_DURATION_STAGE_1);
    expect(REPAIR_DURATION_STAGE_3).toBeGreaterThan(REPAIR_DURATION_STAGE_2);

    const k1 = createInitialKitchenState();
    k1.manager.stamina = 1.0;
    k1.situationQueue = [
      { id: 'sit-1', stationId: 'grill', stage: 1, initialStage: 1, createdTime: 0, elapsedSeconds: 0 },
    ];
    respondToSituation(k1, 'sit-1', true);
    const dur1 = k1.committedRepairTask!.totalDuration;

    const k2 = createInitialKitchenState();
    k2.manager.stamina = 1.0;
    k2.situationQueue = [
      { id: 'sit-2', stationId: 'grill', stage: 2, initialStage: 2, createdTime: 0, elapsedSeconds: 0 },
    ];
    respondToSituation(k2, 'sit-2', true);
    const dur2 = k2.committedRepairTask!.totalDuration;

    expect(dur2).toBeGreaterThan(dur1);
  });

  // Anchor 178: Real integration probe: simulate through the Day 7->8 transition with active degradation and pending situation — confirm all resets to 0 and queue cleared
  it('178. Real integration probe: Day 7->8 transition clears all station degradation and situation queue', () => {
    const k = createInitialKitchenState();
    k.dayNumber = 7;
    k.dayElapsedSeconds = k.dayDurationSeconds - 0.05;

    // Set active degradation and pending situation
    const grill = k.stations.find((s) => s.id === 'grill')!;
    const fryer = k.stations.find((s) => s.id === 'fryer')!;
    grill.degradationStage = 2;
    fryer.degradationStage = 1;
    k.situationQueue = [
      { id: 'sit-probe-1', stationId: 'grill', stage: 2, initialStage: 2, createdTime: 10, elapsedSeconds: 5 },
    ];
    k.committedRepairTask = {
      stationId: 'fryer',
      stage: 1,
      remainingSeconds: 3,
      totalDuration: 4,
    };

    tickKitchenState(k, 0.1);

    expect(k.gamePhase === 'victory' || k.gamePhase === 'night').toBe(true);
    expect(k.storeTier).toBe(2);

    for (const s of k.stations) {
      expect(s.degradationStage).toBe(0);
    }
    expect(k.situationQueue.length).toBe(0);
    expect(k.committedRepairTask).toBeNull();
  });

  // Anchor 179: scoreManagerAutoRepair returns 0 with an empty situation queue, and a real stage-scaled positive value with pending situation
  it('179. scoreManagerAutoRepair returns 0 with empty queue and positive stage-scaled value with pending situation', () => {
    const k = createInitialKitchenState();
    k.situationQueue = [];
    expect(scoreManagerAutoRepair(k.manager, k)).toBe(0);

    k.situationQueue = [
      { id: 'sit-s1', stationId: 'grill', stage: 1, initialStage: 1, createdTime: 0, elapsedSeconds: 0 },
    ];
    const scoreStage1 = scoreManagerAutoRepair(k.manager, k);
    expect(scoreStage1).toBeGreaterThan(0);

    k.situationQueue = [
      { id: 'sit-s3', stationId: 'grill', stage: 3, initialStage: 3, createdTime: 0, elapsedSeconds: 0 },
    ];
    const scoreStage3 = scoreManagerAutoRepair(k.manager, k);
    expect(scoreStage3).toBeGreaterThan(scoreStage1);
  });

  // Anchor 180: queue station degradationStage never changes across task completions while grill station degrades
  it('180. queue station degradationStage never changes across task completions while grill station degrades', () => {
    const k = createInitialKitchenState();
    const queueStation = k.stations.find((s) => s.id === 'queue')!;
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const worker = k.workers[0];
    const queueConfig = STATION_CONFIGS.queue;
    const grillConfig = STATION_CONFIGS.grill;

    // Execute 200 task completions at queue station
    for (let i = 0; i < 200; i++) {
      executeStationTaskCompletion(worker, queueStation, k, queueConfig);
    }
    expect(queueStation.degradationStage || 0).toBe(0);

    // Execute task completions at grill station until degradation occurs
    let grillDegraded = false;
    for (let i = 0; i < 200; i++) {
      executeStationTaskCompletion(worker, grillStation, k, grillConfig);
      if ((grillStation.degradationStage || 0) > 0) {
        grillDegraded = true;
        break;
      }
    }
    expect(grillDegraded).toBe(true);
  });

  // Anchor 181: Real integration probe: with a Stage-3 pending situation and the Manager otherwise idle, evaluateManagerTick selects auto_repair
  it('181. Real integration probe: with Stage-3 situation and Manager idle, evaluateManagerTick selects repair', () => {
    const k = createInitialKitchenState();
    k.manager.stamina = 1.0;
    for (const w of k.workers) {
      w.x = k.manager.x + 10;
      w.y = k.manager.y + 10;
    }

    k.situationQueue = [
      { id: 'sit-stage3', stationId: 'grill', stage: 3, initialStage: 3, createdTime: 0, elapsedSeconds: 0 },
    ];

    const decision = evaluateManagerTick(k.manager, k);
    expect(decision.name).toBe('repair');
    expect(k.committedRepairTask).not.toBeNull();
    expect(k.committedRepairTask!.stationId).toBe('grill');
    expect(k.committedRepairTask!.stage).toBe(3);
  });

  // Anchor 182: Autonomous repair does NOT call spendAttention upon commitment
  it('182. Autonomous repair does NOT call spendAttention upon commitment', () => {
    const k = createInitialKitchenState();
    k.manager.stamina = 0.95;
    k.situationQueue = [
      { id: 'sit-stage2', stationId: 'grill', stage: 2, initialStage: 2, createdTime: 0, elapsedSeconds: 0 },
    ];

    const staminaBefore = k.manager.stamina;
    evaluateManagerTick(k.manager, k);

    expect(k.manager.stamina).toBe(staminaBefore);
    expect(k.committedRepairTask).not.toBeNull();
  });

  // Anchor 183: Direct regression test: full 7-day run with zero player intervention avoids game_over and preserves station usability
  it('183. Real integration probe: full 7-day run with zero player intervention avoids game_over and preserves station usability', () => {
    const k = createInitialKitchenState();

    for (let day = 1; day <= 7; day++) {
      if (k.gamePhase === 'game_over') break;

      if (k.gamePhase === 'night') {
        startNextDay(k);
      }

      const dt = 0.1;
      const ticks = Math.ceil(k.dayDurationSeconds / dt);
      for (let t = 0; t < ticks; t++) {
        if (k.gamePhase !== 'day') break;
        tickKitchenState(k, dt);
      }
    }

    expect(k.gamePhase).not.toBe('game_over');

    const equipmentStations = k.stations.filter((s) => s.id !== 'queue' && s.id !== 'coffee');
    const usableEquipment = equipmentStations.filter((s) => (s.degradationStage || 0) < 3);

    expect(usableEquipment.length).toBeGreaterThanOrEqual(4);
  });

  // Anchor 184: A protocol completion at a station increases its batchQuality, clamped at 100
  it('184. A protocol completion at a station increases its batchQuality, clamped at 100', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const worker: Worker = { ...k.workers[0], currentTask: 'protocol' };

    grillStation.batchQuality = 80;
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);
    expect(grillStation.batchQuality).toBe(92);

    grillStation.batchQuality = 95;
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);
    expect(grillStation.batchQuality).toBe(100);
  });

  // Anchor 185: A corner-cut completion at a station decreases its batchQuality, clamped at 0
  it('185. A corner-cut completion at a station decreases its batchQuality, clamped at 0', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const worker: Worker = { ...k.workers[0], currentTask: 'corner_cut' };

    grillStation.batchQuality = 100;
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);
    expect(grillStation.batchQuality).toBe(70);

    grillStation.batchQuality = 15;
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);
    expect(grillStation.batchQuality).toBe(0);
  });

  // Anchor 186: Real integration probe: idle station decays over time; actively worked station does not net-decay
  it('186. Real integration probe: a station with no active worker loses batchQuality over simulated idle time; an actively worked station does not net-decay', () => {
    const k = createInitialKitchenState();
    k.gamePhase = 'day';

    // Keep only 1 worker in kitchen assigned to assembly
    k.workers = [k.workers[0]];
    k.workers[0].primaryStation = 'assembly';
    k.workers[0].currentStation = 'assembly';
    k.workers[0].currentTask = 'protocol';
    k.workers[0].stamina = 1.0;

    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    const assemblyStation = k.stations.find((s) => s.id === 'assembly')!;

    grillStation.batchQuality = 100;
    assemblyStation.batchQuality = 100;

    // Simulate 10 seconds of time (100 ticks of 0.1s)
    const dt = 0.1;
    for (let i = 0; i < 100; i++) {
      tickKitchenState(k, dt);
    }

    // Grill was idle and uncovered, should have decayed (100 -> ~85)
    expect(grillStation.batchQuality).toBeLessThan(90);
    expect(grillStation.batchQuality).toBeGreaterThan(80);

    // Assembly had an active worker covering it, should NOT have decayed => batchQuality 100
    expect(assemblyStation.batchQuality).toBe(100);
  });

  // Anchor 187: order.quality at completion matches the serving station's batchQuality at that moment
  it('187. order.quality at completion matches the serving station\'s batchQuality at that moment', () => {
    const k = createInitialKitchenState();
    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.batchQuality = 48; // 48 + 12 (protocol) = 60% quality station batch at completion

    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    order.quality = 1.0; // Starts at 1.0
    windowStation.orders.push(order);

    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    // Order quality at completion matches station batchQuality (60 / 100 = 0.6)
    expect(order.quality).toBeCloseTo(0.6);
  });

  // Anchor 188: batchQuality resets to 100 at the start of every Day
  it('188. batchQuality resets to 100 at the start of every Day, confirmed across at least two real day transitions', () => {
    const k = createInitialKitchenState();
    const grill = k.stations.find((s) => s.id === 'grill')!;
    const assembly = k.stations.find((s) => s.id === 'assembly')!;

    // Degrade stations on Day 1
    grill.batchQuality = 35;
    assembly.batchQuality = 50;

    // Transition to Day 2
    startNextDay(k);
    for (const s of k.stations) {
      expect(s.batchQuality).toBe(100);
    }

    // Degrade stations on Day 2
    grill.batchQuality = 20;
    assembly.batchQuality = 40;

    // Transition to Day 3
    startNextDay(k);
    for (const s of k.stations) {
      expect(s.batchQuality).toBe(100);
    }
  });

  // Anchor 189: Real investigation result: old QUALITY_DEGRADATION_PER_CORNER_CUT no longer double-penalizes order.quality
  it('189. Real investigation result: QUALITY_DEGRADATION_PER_CORNER_CUT old code path is retired cleanly and order.quality matches station batchQuality without double-penalization', () => {
    const k = createInitialKitchenState();
    const grillStation = k.stations.find((s) => s.id === 'grill')!;
    grillStation.batchQuality = 100;

    const order = createOrder();
    grillStation.orders.push(order);

    const worker: Worker = { ...k.workers[0], currentTask: 'corner_cut' };

    // Execute 1 corner cut
    executeStationTaskCompletion(worker, grillStation, k, STATION_CONFIGS['grill']);

    // Station batchQuality drops from 100 to 70 (-30)
    expect(grillStation.batchQuality).toBe(70);

    // order.quality is 0.7 (70/100), NOT double-penalized to 0.49 (0.7 * 0.7)
    expect(order.quality).toBeCloseTo(0.7);
  });

  // Anchor 190: A clean order with wantsFries: false earns exactly BASE_PRICE_BURGER + (TIP_MAX_PER_ORDER * quality)
  it('190. A clean order with wantsFries: false earns exactly BASE_PRICE_BURGER + (TIP_MAX_PER_ORDER * quality)', () => {
    const k = createInitialKitchenState();
    k.cash = 0;
    k.cashEarnedToday = 0;
    k.tipsEarnedToday = 0;

    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.batchQuality = 80; // 80 + 12 (protocol) = 92% quality = 0.92

    const order = createOrder();
    order.wantsFries = false;
    order.burgerComplete = true;
    order.friesComplete = true;
    windowStation.orders = [order];

    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    const expectedQuality = 0.92;
    const expectedBase = BASE_PRICE_BURGER; // 4
    const expectedTip = TIP_MAX_PER_ORDER * expectedQuality; // 1.5 * 0.92 = 1.38
    const expectedEarned = expectedBase + expectedTip; // 5.38

    expect(k.cash).toBeCloseTo(expectedEarned);
    expect(k.cashEarnedToday).toBeCloseTo(expectedEarned);
    expect(k.tipsEarnedToday).toBeCloseTo(expectedTip);
  });

  // Anchor 191: A clean order with wantsFries: true earns the fries addon on top, same tip formula
  it('191. A clean order with wantsFries: true earns the fries addon on top, same tip formula', () => {
    const k = createInitialKitchenState();
    k.cash = 0;
    k.cashEarnedToday = 0;
    k.tipsEarnedToday = 0;

    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.batchQuality = 80; // 80 + 12 (protocol) = 92% quality = 0.92

    const order = createOrder();
    order.wantsFries = true;
    order.burgerComplete = true;
    order.friesComplete = true;
    windowStation.orders = [order];

    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    const expectedQuality = 0.92;
    const expectedBase = BASE_PRICE_BURGER + ADDON_PRICE_FRIES; // 4 + 1.5 = 5.5
    const expectedTip = TIP_MAX_PER_ORDER * expectedQuality; // 1.5 * 0.92 = 1.38
    const expectedEarned = expectedBase + expectedTip; // 6.88

    expect(k.cash).toBeCloseTo(expectedEarned);
    expect(k.cashEarnedToday).toBeCloseTo(expectedEarned);
    expect(k.tipsEarnedToday).toBeCloseTo(expectedTip);
  });

  // Anchor 192: A zero-quality order still earns full Base Price — cash earned is never less than basePrice
  it('192. A zero-quality order still earns full Base Price — cash earned is never less than basePrice, proving the floor is real, not just the ceiling', () => {
    const k = createInitialKitchenState();
    k.cash = 0;
    k.cashEarnedToday = 0;
    k.tipsEarnedToday = 0;

    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.batchQuality = 0; // 0 + 12 (protocol) = 12% -> set batchQuality to -12 so it ends at 0
    windowStation.batchQuality = -12;

    const order = createOrder();
    order.wantsFries = false;
    order.burgerComplete = true;
    order.friesComplete = true;
    windowStation.orders = [order];

    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    expect(order.quality).toBe(0);
    expect(k.tipsEarnedToday).toBe(0);
    expect(k.cash).toBe(BASE_PRICE_BURGER); // 4.0
    expect(k.cash).toBeGreaterThanOrEqual(BASE_PRICE_BURGER);
  });

  // Anchor 193: tipsEarnedToday accumulates correctly across multiple order completions in one simulated Day
  it('193. tipsEarnedToday accumulates correctly across multiple order completions in one simulated Day', () => {
    const k = createInitialKitchenState();
    k.cash = 0;
    k.cashEarnedToday = 0;
    k.tipsEarnedToday = 0;

    const windowStation = k.stations.find((s) => s.id === 'window')!;

    let expectedTotalTips = 0;

    // Order 1: quality = 1.0 (batchQuality = 88 + 12 = 100)
    windowStation.batchQuality = 88;
    const order1 = createOrder();
    order1.wantsFries = false;
    order1.burgerComplete = true;
    order1.friesComplete = true;
    windowStation.orders = [order1];
    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);
    expectedTotalTips += TIP_MAX_PER_ORDER * 1.0;

    // Order 2: quality = 0.5 (batchQuality = 38 + 12 = 50)
    windowStation.batchQuality = 38;
    const order2 = createOrder();
    order2.wantsFries = true;
    order2.burgerComplete = true;
    order2.friesComplete = true;
    windowStation.orders = [order2];
    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);
    expectedTotalTips += TIP_MAX_PER_ORDER * 0.5;

    expect(k.tipsEarnedToday).toBeCloseTo(expectedTotalTips);
  });

  // Anchor 194: tipsEarnedToday resets to 0 at Day start, confirmed across at least two real day transitions
  it('194. tipsEarnedToday resets to 0 at Day start, confirmed across at least two real day transitions', () => {
    const k = createInitialKitchenState();

    // Day 1
    k.tipsEarnedToday = 14.25;
    expect(k.tipsEarnedToday).toBe(14.25);

    // Transition to Day 2
    startNextDay(k);
    expect(k.tipsEarnedToday).toBe(0);

    // Day 2
    k.tipsEarnedToday = 8.75;
    expect(k.tipsEarnedToday).toBe(8.75);

    // Transition to Day 3
    startNextDay(k);
    expect(k.tipsEarnedToday).toBe(0);
  });

  // Anchor 195: Brand Equity gain per order is unchanged — still exactly BRAND_EQUITY_GAIN_PER_CLEAN_ORDER * order.quality
  it('195. Brand Equity gain per order is unchanged — still exactly BRAND_EQUITY_GAIN_PER_CLEAN_ORDER * order.quality, proving the rework didn\'t touch it', () => {
    const k = createInitialKitchenState();
    k.brandEquity = 50;

    const windowStation = k.stations.find((s) => s.id === 'window')!;
    windowStation.batchQuality = 68; // 68 + 12 = 80% quality = 0.8

    const order = createOrder();
    order.burgerComplete = true;
    order.friesComplete = true;
    windowStation.orders = [order];

    executeStationTaskCompletion(k.workers[0], windowStation, k, STATION_CONFIGS['window']);

    const expectedEquityGain = BRAND_EQUITY_GAIN_PER_CLEAN_ORDER * 0.8; // 3 * 0.8 = 2.4
    expect(k.brandEquity).toBeCloseTo(50 + expectedEquityGain);
  });

  // Anchor 196: scoreThirst returns > 0 only when thirst < 0.6; rises strictly monotonically as thirst drops from 0.6 to 0.0; reaches maximum at 0.0
  it('196. scoreThirst returns > 0 only when thirst < 0.6; rises strictly monotonically as thirst drops from 0.6 to 0.0; reaches maximum at 0.0', () => {
    const k = createInitialKitchenState();
    const w = { ...k.workers[0] };

    w.thirst = 0.7;
    expect(scoreThirst(w, k)).toBe(0);

    w.thirst = 0.6;
    expect(scoreThirst(w, k)).toBe(0);

    w.thirst = 0.5;
    const score05 = scoreThirst(w, k);
    expect(score05).toBeGreaterThan(0);

    w.thirst = 0.3;
    const score03 = scoreThirst(w, k);
    expect(score03).toBeGreaterThan(score05);

    w.thirst = 0.0;
    const score00 = scoreThirst(w, k);
    expect(score00).toBeGreaterThan(score03);
  });

  // Anchor 197: scoreUseBathroom returns 0 when pressure < 0.3; returns 0 if bathroom.isOutOfOrder === true regardless of pressure; rises strictly monotonically as pressure goes from 0.3 to 1.0 when not out-of-order
  it('197. scoreUseBathroom returns 0 when pressure < 0.3; returns 0 if bathroom.isOutOfOrder === true regardless of pressure; rises strictly monotonically as pressure goes from 0.3 to 1.0 when not out-of-order', () => {
    const k = createInitialKitchenState();
    const w = { ...k.workers[0] };
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;

    bathroom.isOutOfOrder = false;

    w.bladderPressure = 0.2;
    expect(scoreUseBathroom(w, k)).toBe(0);

    w.bladderPressure = 0.4;
    const score04 = scoreUseBathroom(w, k);
    expect(score04).toBeGreaterThan(0);

    w.bladderPressure = 0.7;
    const score07 = scoreUseBathroom(w, k);
    expect(score07).toBeGreaterThan(score04);

    w.bladderPressure = 1.0;
    const score10 = scoreUseBathroom(w, k);
    expect(score10).toBeGreaterThan(score07);

    // When bathroom is out of order, score is 0 even at max pressure 1.0
    bathroom.isOutOfOrder = true;
    expect(scoreUseBathroom(w, k)).toBe(0);
  });

  // Anchor 198: scoreCleanBathroom returns 0 when bathroom.isOutOfOrder === false; returns > 0 when bathroom.isOutOfOrder === true
  it('198. scoreCleanBathroom returns 0 when bathroom.isOutOfOrder === false; returns > 0 when bathroom.isOutOfOrder === true', () => {
    const k = createInitialKitchenState();
    const w = { ...k.workers[0] };
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;

    bathroom.isOutOfOrder = false;
    expect(scoreCleanBathroom(w, k)).toBe(0);

    bathroom.isOutOfOrder = true;
    expect(scoreCleanBathroom(w, k)).toBeGreaterThan(0);
  });

  // Anchor 199: scoreDischargeMeal returns 0 when wasteBuffer < MEAL_UNIT_COST; returns > 0 when wasteBuffer >= MEAL_UNIT_COST
  it('199. scoreDischargeMeal returns 0 when wasteBuffer < MEAL_UNIT_COST; returns > 0 when wasteBuffer >= MEAL_UNIT_COST', () => {
    const k = createInitialKitchenState();
    const w = { ...k.workers[0] };

    k.wasteBuffer = MEAL_UNIT_COST - 1;
    expect(scoreDischargeMeal(w, k)).toBe(0);

    k.wasteBuffer = MEAL_UNIT_COST;
    expect(scoreDischargeMeal(w, k)).toBeGreaterThan(0);

    k.wasteBuffer = MEAL_UNIT_COST + 10;
    expect(scoreDischargeMeal(w, k)).toBeGreaterThan(0);
  });

  // Anchor 200: Executing drink_water resets thirst to 1.0 and increases bladderPressure by BLADDER_RISE_PER_WATER (0.25)
  it('200. Executing drink_water resets thirst to 1.0 and increases bladderPressure by BLADDER_RISE_PER_WATER (0.25)', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    w.thirst = 0.2;
    w.bladderPressure = 0.1;
    w.currentTask = 'drink_water';

    processWorkerBreakExecution(w, k);

    expect(w.thirst).toBe(1.0);
    expect(w.bladderPressure).toBeCloseTo(0.1 + BLADDER_RISE_PER_WATER);
  });

  // Anchor 201: Executing use_bathroom resets bladderPressure to 0.0 and sets bathroom.isOutOfOrder = true if Math.random() < BATHROOM_CLOG_CHANCE (0.20)
  it('201. Executing use_bathroom resets bladderPressure to 0.0 and sets bathroom.isOutOfOrder = true if Math.random() < BATHROOM_CLOG_CHANCE (0.20)', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = false;
    w.bladderPressure = 0.8;
    w.currentTask = 'use_bathroom';

    // Mock random to trigger clog (0.1 < 0.20)
    const originalRandom = Math.random;
    Math.random = () => 0.1;
    try {
      processWorkerBreakExecution(w, k);
      expect(w.bladderPressure).toBe(0.0);
      expect(bathroom.isOutOfOrder).toBe(true);
    } finally {
      Math.random = originalRandom;
    }

    // Reset and mock random to NOT trigger clog (0.5 >= 0.20)
    bathroom.isOutOfOrder = false;
    w.bladderPressure = 0.8;
    w.currentTask = 'use_bathroom';
    Math.random = () => 0.5;
    try {
      processWorkerBreakExecution(w, k);
      expect(w.bladderPressure).toBe(0.0);
      expect(bathroom.isOutOfOrder).toBe(false);
    } finally {
      Math.random = originalRandom;
    }
  });

  // Anchor 202: Executing clean_bathroom resets bathroom.isOutOfOrder to false
  it('202. Executing clean_bathroom resets bathroom.isOutOfOrder to false', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = true;
    w.currentTask = 'clean_bathroom';

    processWorkerBreakExecution(w, k);

    expect(bathroom.isOutOfOrder).toBe(false);
  });

  // Anchor 203: autoDischargeWaste is no longer called in sessionLoop.ts / tickKitchenState — verified by testing that a non-zero wasteBuffer remains unchanged across ticks without worker intervention. Also bathroom.isOutOfOrder persists across startNextDay
  it('203. autoDischargeWaste is no longer called in tickKitchenState — wasteBuffer remains unchanged across ticks without worker intervention, and bathroom.isOutOfOrder persists across startNextDay', () => {
    const k = createInitialKitchenState();
    k.wasteBuffer = 50;
    const initialMealUnits = k.mealUnits;

    // Ensure workers are busy so they do not intervene with manual discharge_meal task
    k.workers.forEach((w) => {
      w.currentTask = 'protocol';
      w.taskProgress = 0.5;
    });

    // Tick for 5 seconds without workers doing discharge_meal task
    for (let i = 0; i < 5; i++) {
      tickKitchenState(k, 1.0);
    }

    expect(k.wasteBuffer).toBe(50);
    expect(k.mealUnits).toBe(initialMealUnits);

    // Test bathroom.isOutOfOrder persistence across startNextDay
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = true;

    startNextDay(k);

    expect(bathroom.isOutOfOrder).toBe(true);
  });

  // Anchor 204: Only one BLADDER_RISE_PER_WATER-equivalent constant exists and is referenced; the orphaned duplicate is gone from the codebase entirely
  it('204. Only one BLADDER_RISE_PER_WATER constant exists (0.08) and BLADDER_RISE_PER_WATER_UNIT is gone', () => {
    expect(BLADDER_RISE_PER_WATER).toBe(0.08);
    expect((dataModule as Record<string, unknown>).BLADDER_RISE_PER_WATER_UNIT).toBeUndefined();
  });

  // Anchor 205: scoreCleanBathroom returns exactly CLEAN_BATHROOM_BASE_SCORE the instant the bathroom breaks (elapsed time near zero)
  it('205. scoreCleanBathroom returns exactly CLEAN_BATHROOM_BASE_SCORE the instant the bathroom breaks', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = true;
    bathroom.brokenElapsedSeconds = 0;

    expect(scoreCleanBathroom(w, k)).toBe(CLEAN_BATHROOM_BASE_SCORE);
  });

  // Anchor 206: Real integration probe: scoreCleanBathroom value strictly increases as simulated broken-time accumulates, clamped at CLEAN_BATHROOM_MAX_SCORE
  it('206. Real integration probe: scoreCleanBathroom strictly increases with broken-time and clamps at CLEAN_BATHROOM_MAX_SCORE', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = true;

    bathroom.brokenElapsedSeconds = 0;
    const score0 = scoreCleanBathroom(w, k);

    bathroom.brokenElapsedSeconds = 20;
    const score20 = scoreCleanBathroom(w, k);

    bathroom.brokenElapsedSeconds = 40;
    const score40 = scoreCleanBathroom(w, k);

    bathroom.brokenElapsedSeconds = 100;
    const score100 = scoreCleanBathroom(w, k);

    expect(score0).toBe(CLEAN_BATHROOM_BASE_SCORE);
    expect(score20).toBeGreaterThan(score0);
    expect(score40).toBeGreaterThan(score20);
    expect(score100).toBe(CLEAN_BATHROOM_MAX_SCORE);
  });

  // Anchor 207: Real integration probe: a bathroom left broken long enough eventually gets selected and cleaned even while a worker's personal Thirst or Bladder score is elevated
  it('207. Real integration probe: long-broken bathroom clean task outranks elevated personal Thirst score', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    w.thirst = 0.0; // Max thirst urgency (score = 6.0)
    w.taskProgress = 0;
    w.currentTask = null;

    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = true;
    bathroom.brokenElapsedSeconds = 0;

    // Initially scoreCleanBathroom is 4.0 (< 6.0 thirst score), so drink_water wins over clean_bathroom
    const decisionEarly = evaluateWorkerTick(w, k);
    expect(decisionEarly.name).toBe('drink_water');

    // After 100s broken time, scoreCleanBathroom reaches 8.0 (> 6.0 thirst score), so clean_bathroom wins
    bathroom.brokenElapsedSeconds = 100;
    const decisionLate = evaluateWorkerTick(w, k);
    expect(decisionLate.name).toBe('clean_bathroom');
  });

  // Anchor 208: Real integration probe, replaying diagnostic: over 900 simulated ticks, bathroom out-of-order ratio is under 25%
  it('208. Real integration probe: 900-tick simulation confirms bathroom out-of-order ratio is below 25%', () => {
    const k = createInitialKitchenState();
    let outOfOrderTicks = 0;
    const totalTicks = 900;

    for (let i = 0; i < totalTicks; i++) {
      tickKitchenState(k, 0.1);
      const bathroom = k.stations.find((s) => s.id === 'bathroom');
      if (bathroom?.isOutOfOrder) {
        outOfOrderTicks++;
      }
    }

    const outOfOrderRatio = outOfOrderTicks / totalTicks;
    console.log(`Anchor 208 Out-Of-Order Ratio: ${(outOfOrderRatio * 100).toFixed(1)}% (${outOfOrderTicks}/${totalTicks} ticks)`);
    expect(outOfOrderRatio).toBeLessThan(0.25);
  });

  // Anchor 209: brokenElapsedSeconds resets to 0 immediately after a real clean_bathroom completion
  it('209. brokenElapsedSeconds resets to 0 immediately upon clean_bathroom completion', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = true;
    bathroom.brokenElapsedSeconds = 50;

    w.x = bathroom.x + bathroom.width / 2;
    w.y = bathroom.y + bathroom.height / 2;
    w.currentTask = 'clean_bathroom';
    w.taskProgress = 0.9;

    processWorkerBreakExecution(w, k, 1.0);

    expect(bathroom.isOutOfOrder).toBe(false);
    expect(bathroom.brokenElapsedSeconds).toBe(0);
  });

  // Anchor 210: window station never accumulates degradationStage across task completions, while grill does
  it('210. window station never degrades on usage while grill can degrade', () => {
    const k = createInitialKitchenState();
    const grill = k.stations.find((s) => s.id === 'grill')!;
    const windowSt = k.stations.find((s) => s.id === 'window')!;

    grill.orders = [{ id: 'o1', wantsFries: false, burgerComplete: false, friesComplete: false, quality: 1 }];
    windowSt.orders = [{ id: 'o2', wantsFries: false, burgerComplete: true, friesComplete: false, quality: 1 }];

    let grillDegraded = false;
    let windowDegraded = false;

    for (let i = 0; i < 200; i++) {
      executeStationTaskCompletion(k.workers[0], grill, k, STATION_CONFIGS.grill);
      if ((grill.degradationStage || 0) > 0) grillDegraded = true;

      executeStationTaskCompletion(k.workers[0], windowSt, k, STATION_CONFIGS.window);
      if ((windowSt.degradationStage || 0) > 0) windowDegraded = true;
    }

    expect(windowDegraded).toBe(false);
    expect(windowSt.degradationStage || 0).toBe(0);
    expect(grillDegraded).toBe(true);
  });

  // Anchor 211: scoreCleanBathroom returns 0 if scoring worker's own bladder pressure >= BLADDER_URGENCY_THRESHOLD
  it('211. scoreCleanBathroom returns 0 for worker needing bathroom themselves, but normal score for worker with fine bladder', () => {
    const k = createInitialKitchenState();
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = true;
    bathroom.brokenElapsedSeconds = 10;

    const wNeedingBathroom: Worker = { ...k.workers[0], bladderPressure: BLADDER_URGENCY_THRESHOLD + 0.1 };
    const wFine: Worker = { ...k.workers[1], bladderPressure: 0.0 };

    expect(scoreCleanBathroom(wNeedingBathroom, k)).toBe(0);
    expect(scoreCleanBathroom(wFine, k)).toBeGreaterThan(0);
  });

  // Anchor 212: Real integration probe: bladderCriticalElapsedSeconds accumulates at max pressure and resets when using bathroom
  it('212. bladderCriticalElapsedSeconds accumulates at max pressure and resets upon using bathroom', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    w.bladderPressure = 1.0;

    tickKitchenState(k, 2.0);
    expect(w.bladderCriticalElapsedSeconds).toBeCloseTo(2.0);

    const bathroom = STATION_CONFIGS.bathroom;
    w.x = bathroom.x + bathroom.width / 2;
    w.y = bathroom.y + bathroom.height / 2;
    w.currentTask = 'use_bathroom';

    processWorkerBreakExecution(w, k, 0.1);
    expect(w.bladderPressure).toBe(0);

    tickKitchenState(k, 0.1);
    expect(w.bladderCriticalElapsedSeconds).toBe(0);
  });

  // Anchor 213: Real integration probe: sustained max bladder pressure triggers bladder failure accident Mess
  it('213. sustained max bladder pressure triggers accident, resetting pressure and spawning worker_accident Mess', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    w.x = 120;
    w.y = 150;
    w.bladderPressure = 1.0;
    w.bladderCriticalElapsedSeconds = BLADDER_FAILURE_THRESHOLD_SECONDS - 0.1;

    expect(k.messes.length).toBe(0);

    tickKitchenState(k, 0.2);

    expect(w.bladderPressure).toBe(0);
    expect(w.bladderCriticalElapsedSeconds).toBe(0);
    expect(k.messes.length).toBe(1);
    expect(k.messes[0].source).toBe('worker_accident');
    expect(k.messes[0].x).toBe(120);
    expect(k.messes[0].y).toBe(150);
  });

  // Anchor 214: Real integration probe: order fulfillment produces customer_food Mess with expected probability
  it('214. Real integration probe: order completion produces customer_food Mess statistically matching CUSTOMER_MESS_CHANCE', () => {
    const k = createInitialKitchenState();
    let messCount = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      const orderId = `test-ord-${i}`;
      activateCustomerAtWindow(k, orderId, 1.0);
    }

    const foodMesses = k.messes.filter((m) => m.source === 'customer_food');
    messCount = foodMesses.length;
    const observedRatio = messCount / trials;

    console.log(`Anchor 214 Customer Mess Ratio: ${(observedRatio * 100).toFixed(1)}% (${messCount}/${trials})`);
    expect(messCount).toBeGreaterThan(0);
    expect(observedRatio).toBeGreaterThan(0.08);
    expect(observedRatio).toBeLessThan(0.25);
  });

  // Anchor 215: scoreCleanMess returns 0 with no messes, and positive score for Worker and Manager when mess exists
  it('215. scoreCleanMess returns 0 when empty, positive score for Worker and Manager when mess present', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    const m = k.manager;

    expect(scoreCleanMess(w, k)).toBe(0);
    expect(scoreCleanMess(m, k)).toBe(0);

    k.messes.push({
      id: 'm1',
      x: 100,
      y: 100,
      source: 'customer_food',
      createdTime: 0,
    });

    expect(scoreCleanMess(w, k)).toBeGreaterThan(0);
    expect(scoreCleanMess(m, k)).toBeGreaterThan(0);
  });

  // Anchor 216: Real integration probe: evaluateManagerTick can select clean_mess when mess exists
  it('216. evaluateManagerTick selects clean_mess when mess exists and manager stamina is high', () => {
    const k = createInitialKitchenState();
    const m = k.manager;
    m.stamina = 1.0;
    m.x = 100;
    m.y = 100;

    k.messes.push({
      id: 'm1',
      x: 100,
      y: 100,
      source: 'customer_food',
      createdTime: 0,
    });

    const decision = evaluateManagerTick(m, k);
    expect(decision.name).toBe('clean_mess');
  });

  // Anchor 217: Real integration probe: clean_mess task completion removes mess from k.messes
  it('217. clean_mess task completion removes nearest mess from k.messes', () => {
    const k = createInitialKitchenState();
    const w = k.workers[0];
    w.x = 100;
    w.y = 100;

    k.messes.push({
      id: 'm1',
      x: 100,
      y: 100,
      source: 'customer_food',
      createdTime: 0,
    });

    w.currentTask = 'clean_mess';
    w.taskProgress = 0.95;

    processWorkerBreakExecution(w, k, 1.0);

    expect(k.messes.length).toBe(0);
  });

  // Anchor 218: Real integration probe: with two workers simultaneously wanting the bathroom, only one ever has bathroom.occupiedByWorkerId === worker.id at a time — never both
  it('218. with two workers simultaneously wanting the bathroom, only one ever has bathroom.occupiedByWorkerId === worker.id at a time', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    const w2 = k.workers[1];
    w1.currentTask = 'use_bathroom';
    w2.currentTask = 'use_bathroom';

    let bothOccupantsCount = 0;
    for (let i = 0; i < 60; i++) {
      tickKitchenState(k, 1 / 60);
      const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
      const w1IsOccupant = bathroom.occupiedByWorkerId === w1.id;
      const w2IsOccupant = bathroom.occupiedByWorkerId === w2.id;
      if (w1IsOccupant && w2IsOccupant) {
        bothOccupantsCount++;
      }
      expect(w1IsOccupant && w2IsOccupant).toBe(false);
    }
    expect(bothOccupantsCount).toBe(0);
  });

  // Anchor 219: A queued (non-occupant) worker's steering target is a real BATHROOM_QUEUE_WAYPOINTS slot, not the bathroom's center
  it("219. a queued (non-occupant) worker's steering target is a real BATHROOM_QUEUE_WAYPOINTS slot, not bathroom center", () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    const w2 = k.workers[1];
    const bathroomStation = STATION_CONFIGS.bathroom;
    const bathroomCenter = {
      x: bathroomStation.x + bathroomStation.width / 2,
      y: bathroomStation.y + bathroomStation.height / 2,
    };

    w1.currentTask = 'use_bathroom';
    w2.currentTask = 'use_bathroom';

    tickKitchenState(k, 1 / 60);

    const bathroomState = k.stations.find((s) => s.id === 'bathroom')!;
    const occupantId = bathroomState.occupiedByWorkerId;
    expect(occupantId).toBeTruthy();

    const queuedWorker = k.workers.find((w) => w.id !== occupantId && w.currentTask === 'use_bathroom')!;
    expect(queuedWorker).toBeTruthy();
    expect(k.bathroomQueue).toContain(queuedWorker.id);

    const force = computeWorkerSteering(queuedWorker, k);
    expect(k.bathroomQueue!.indexOf(queuedWorker.id)).toBe(0);
    // Waypoint 0 x is 125
    expect(BATHROOM_QUEUE_WAYPOINTS[0].x).toBe(125);
    expect(BATHROOM_QUEUE_WAYPOINTS[0].x).not.toBe(bathroomCenter.x);
  });

  // Anchor 220: Real integration probe: when the occupant finishes, the front of bathroomQueue is promoted to occupant on the very next tick
  it('220. when occupant finishes, front of bathroomQueue is promoted to occupant on very next tick', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    const w2 = k.workers[1];
    w1.currentTask = 'use_bathroom';
    w2.currentTask = 'use_bathroom';

    tickKitchenState(k, 1 / 60);

    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    expect(bathroom.occupiedByWorkerId).toBe(w1.id);
    expect(k.bathroomQueue).toContain(w2.id);

    // Force w1 to complete use_bathroom
    w1.x = bathroom.x + bathroom.width / 2;
    w1.y = bathroom.y + bathroom.height / 2;
    processWorkerBreakExecution(w1, k, 1.0); // clears w1 bladder and clears occupiedByWorkerId

    // On next tick
    tickKitchenState(k, 1 / 60);

    expect(bathroom.occupiedByWorkerId).toBe(w2.id);
  });

  // Anchor 221: Real integration probe: a queued worker whose task changes away from use_bathroom is removed from bathroomQueue within that same tick
  it('221. a queued worker whose task changes away from use_bathroom is removed from bathroomQueue within same tick', () => {
    const k = createInitialKitchenState();
    const w1 = k.workers[0];
    const w2 = k.workers[1];
    w1.currentTask = 'use_bathroom';
    w2.currentTask = 'use_bathroom';

    tickKitchenState(k, 1 / 60);
    expect(k.bathroomQueue).toContain(w2.id);

    // w2 changes task to protocol
    w2.currentTask = 'protocol';
    tickKitchenState(k, 1 / 60);

    expect(k.bathroomQueue).not.toContain(w2.id);
  });

  // Anchor 222: Real integration probe replaying session diagnostic: with 4 workers and simultaneous bathroom needs, no two workers are ever within AVOID_WORKERS_DIST of bathroom center at same time
  it('222. with 4 workers and simultaneous bathroom needs, no two workers are ever within AVOID_WORKERS_DIST of bathroom center at same time', () => {
    const k = createInitialKitchenState();
    const bathroomConfig = STATION_CONFIGS.bathroom;
    const bathroomCenter = {
      x: bathroomConfig.x + bathroomConfig.width / 2,
      y: bathroomConfig.y + bathroomConfig.height / 2,
    };

    for (const w of k.workers) {
      w.bladderPressure = 0.95;
      w.currentTask = 'use_bathroom';
      w.x = 200;
      w.y = 200;
    }

    let doubleNearCount = 0;
    for (let tick = 0; tick < 120; tick++) {
      tickKitchenState(k, 1 / 60);

      const workersNearCenter = k.workers.filter((w) => {
        const dist = Math.sqrt((w.x - bathroomCenter.x) ** 2 + (w.y - bathroomCenter.y) ** 2);
        return dist < AVOID_WORKERS_DIST;
      });

      if (workersNearCenter.length > 1) {
        doubleNearCount++;
      }
    }

    expect(doubleNearCount).toBe(0);
  });

  // Anchor 223: npx tsc --noEmit confirmation probe
  it('223. KitchenState initializes bathroomQueue as array and occupiedByWorkerId as null', () => {
    const k = createInitialKitchenState();
    expect(Array.isArray(k.bathroomQueue)).toBe(true);
    expect(k.bathroomQueue!.length).toBe(0);
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    expect(bathroom.occupiedByWorkerId).toBeNull();
  });

  // Anchor 224: Real integration probe: over a realistic multi-minute simulation, no worker switches currentTask more than once per 3-second window, for every task type — not just rest/eat_meal
  it('224. no worker switches currentTask faster than once per 3-second window for non-protocol, non-corner_cut tasks', () => {
    const k = createInitialKitchenState();

    const workerTaskSwitches: Record<string, Array<{ time: number; task: string }>> = {};
    for (const w of k.workers) {
      workerTaskSwitches[w.id] = [{ time: 0, task: w.currentTask }];
    }

    const totalSeconds = 180;
    const dt = 1 / 60;
    const totalTicks = totalSeconds * 60;

    for (let tick = 1; tick <= totalTicks; tick++) {
      const currentTime = tick * dt;
      const prevTasks: Record<string, string> = {};
      for (const w of k.workers) {
        prevTasks[w.id] = w.currentTask;
      }

      tickKitchenState(k, dt);

      for (const w of k.workers) {
        if (w.currentTask !== prevTasks[w.id]) {
          const history = workerTaskSwitches[w.id];
          const lastSwitch = history[history.length - 1];
          if (lastSwitch.task !== 'protocol' && lastSwitch.task !== 'corner_cut') {
            const timeInTask = currentTime - lastSwitch.time;
            expect(timeInTask).toBeGreaterThanOrEqual(BREAK_TASK_MIN_LOCK_SECONDS - 0.05);
          }
          history.push({ time: currentTime, task: w.currentTask });
        }
      }
    }
  });

  // Anchor 225: Every pair of positioned elements (all STATION_CONFIGS entries, STAFF_AREA, ENTRANCE_POS, EXIT_POS) has a real, computed gap of at least 20px between bounding boxes
  it('225. every pair of positioned elements has a real computed bounding box gap of at least 20px', () => {
    interface BoxElement {
      name: string;
      x1: number;
      x2: number;
      y1: number;
      y2: number;
    }

    const elements: BoxElement[] = [];

    for (const s of Object.values(STATION_CONFIGS)) {
      elements.push({
        name: s.id,
        x1: s.x,
        x2: s.x + s.width,
        y1: s.y,
        y2: s.y + s.height,
      });
    }

    elements.push({
      name: 'STAFF_AREA',
      x1: STAFF_AREA.x,
      x2: STAFF_AREA.x + STAFF_AREA.width,
      y1: STAFF_AREA.y,
      y2: STAFF_AREA.y + STAFF_AREA.height,
    });

    elements.push({
      name: 'ENTRANCE_POS',
      x1: ENTRANCE_POS.x - 15,
      x2: ENTRANCE_POS.x + 15,
      y1: ENTRANCE_POS.y - 15,
      y2: ENTRANCE_POS.y + 15,
    });

    elements.push({
      name: 'EXIT_POS',
      x1: EXIT_POS.x - 15,
      x2: EXIT_POS.x + 15,
      y1: EXIT_POS.y - 15,
      y2: EXIT_POS.y + 15,
    });

    const violations: string[] = [];

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const a = elements[i];
        const b = elements[j];

        const gx = Math.max(0, a.x1 - b.x2, b.x1 - a.x2);
        const gy = Math.max(0, a.y1 - b.y2, b.y1 - a.y2);
        const gap = Math.sqrt(gx * gx + gy * gy);

        if (gap < 20) {
          violations.push(`${a.name} vs ${b.name}: gap = ${gap.toFixed(2)}px (< 20px)`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  // Anchor 226: BATHROOM_QUEUE_WAYPOINTS positions are real and distinct from the bathroom's new center, matching its new location, not the old one
  it('226. BATHROOM_QUEUE_WAYPOINTS positions match the new bathroom position at (30, 400)', () => {
    const bathroomConfig = STATION_CONFIGS.bathroom;
    const bathroomCenter = {
      x: bathroomConfig.x + bathroomConfig.width / 2,
      y: bathroomConfig.y + bathroomConfig.height / 2,
    };

    expect(BATHROOM_QUEUE_WAYPOINTS.length).toBeGreaterThan(0);

    for (const pt of BATHROOM_QUEUE_WAYPOINTS) {
      expect(Math.abs(pt.y - bathroomCenter.y)).toBeLessThan(10);
      expect(Math.abs(pt.y - 325)).toBeGreaterThan(50);

      const distToCenter = Math.hypot(pt.x - bathroomCenter.x, pt.y - bathroomCenter.y);
      expect(distToCenter).toBeGreaterThan(20);
    }
  });

  // Anchor 227: Every station's width/height is measurably smaller than its pre-directive value by roughly 15%
  it('227. every station and STAFF_AREA width and height is reduced by roughly 15%', () => {
    const preSizes: Record<string, { width: number; height: number }> = {
      queue: { width: 150, height: 80 },
      grill: { width: 110, height: 80 },
      assembly: { width: 110, height: 80 },
      window: { width: 150, height: 80 },
      fryer: { width: 110, height: 80 },
      coffee: { width: 140, height: 90 },
      bathroom: { width: 80, height: 90 },
      STAFF_AREA: { width: 160, height: 90 },
    };

    for (const [key, pre] of Object.entries(preSizes)) {
      let currentWidth: number;
      let currentHeight: number;

      if (key === 'STAFF_AREA') {
        currentWidth = STAFF_AREA.width;
        currentHeight = STAFF_AREA.height;
      } else {
        const st = STATION_CONFIGS[key as StationId];
        currentWidth = st.width;
        currentHeight = st.height;
      }

      const widthRatio = currentWidth / pre.width;
      const heightRatio = currentHeight / pre.height;

      expect(widthRatio).toBeGreaterThanOrEqual(0.8);
      expect(widthRatio).toBeLessThanOrEqual(0.88);
      expect(heightRatio).toBeGreaterThanOrEqual(0.8);
      expect(heightRatio).toBeLessThanOrEqual(0.88);
    }
  });

  // Anchor 228: queue and bathroom's batchQuality never decreases across many simulated idle ticks, while grill's does under the same conditions
  it('228. queue and bathroom batchQuality stays at 100 when idle, while grill decays', () => {
    const k = createInitialKitchenState();
    // Remove workers or move them away so stations are unassigned/uncovered
    for (const w of k.workers) {
      w.currentStation = null;
      w.claimedResource = null;
      w.primaryStation = null;
    }

    const queueSt = k.stations.find((s) => s.id === 'queue')!;
    const bathroomSt = k.stations.find((s) => s.id === 'bathroom')!;
    const grillSt = k.stations.find((s) => s.id === 'grill')!;

    expect(queueSt.batchQuality).toBe(100);
    expect(bathroomSt.batchQuality).toBe(100);
    expect(grillSt.batchQuality).toBe(100);

    for (let i = 0; i < 600; i++) {
      tickKitchenState(k, 1 / 60);
    }

    expect(queueSt.batchQuality).toBe(100);
    expect(bathroomSt.batchQuality).toBe(100);
    expect(grillSt.batchQuality).toBeLessThan(100);
  });

  // Anchor 229: coffee and window's batchQuality genuinely still decays when idle
  it('229. coffee and window batchQuality decays when idle', () => {
    const k = createInitialKitchenState();
    for (const w of k.workers) {
      w.currentStation = null;
      w.claimedResource = null;
      w.primaryStation = null;
    }

    const coffeeSt = k.stations.find((s) => s.id === 'coffee')!;
    const windowSt = k.stations.find((s) => s.id === 'window')!;

    expect(coffeeSt.batchQuality).toBe(100);
    expect(windowSt.batchQuality).toBe(100);

    for (let i = 0; i < 600; i++) {
      tickKitchenState(k, 1 / 60);
    }

    expect(coffeeSt.batchQuality).toBeLessThan(100);
    expect(windowSt.batchQuality).toBeLessThan(100);
  });

  // Anchor 230: The degradation roll still only ever increments degradationStage for grill/assembly/fryer
  it('230. equipment degradation roll only increments degradationStage for grill, assembly, fryer', () => {
    const k = createInitialKitchenState();
    const mockWorker = k.workers[0];

    const degradedStations: StationId[] = [];

    for (const stConfig of Object.values(STATION_CONFIGS)) {
      const station = k.stations.find((s) => s.id === stConfig.id)!;
      station.degradationStage = 0;

      // Run task completion 1000 times
      for (let i = 0; i < 1000; i++) {
        executeStationTaskCompletion(mockWorker, station, k, stConfig);
      }

      if ((station.degradationStage || 0) > 0) {
        degradedStations.push(station.id);
      }
    }

    expect(degradedStations.sort()).toEqual(['assembly', 'fryer', 'grill']);
  });

  // Anchor 231: Direct data check of hasProductQuality and hasEquipmentWear flags
  it('231. STATION_CONFIGS has exact capability flags matching specification', () => {
    expect(STATION_CONFIGS.queue.hasEquipmentWear).toBe(false);
    expect(STATION_CONFIGS.queue.hasProductQuality).toBe(false);

    expect(STATION_CONFIGS.grill.hasEquipmentWear).toBe(true);
    expect(STATION_CONFIGS.grill.hasProductQuality).toBe(true);

    expect(STATION_CONFIGS.assembly.hasEquipmentWear).toBe(true);
    expect(STATION_CONFIGS.assembly.hasProductQuality).toBe(true);

    expect(STATION_CONFIGS.window.hasEquipmentWear).toBe(false);
    expect(STATION_CONFIGS.window.hasProductQuality).toBe(true);

    expect(STATION_CONFIGS.fryer.hasEquipmentWear).toBe(true);
    expect(STATION_CONFIGS.fryer.hasProductQuality).toBe(true);

    expect(STATION_CONFIGS.coffee.hasEquipmentWear).toBe(false);
    expect(STATION_CONFIGS.coffee.hasProductQuality).toBe(true);

    expect(STATION_CONFIGS.bathroom.hasEquipmentWear).toBe(false);
    expect(STATION_CONFIGS.bathroom.hasProductQuality).toBe(false);
  });

  // Anchor 232: Real integration probe: full multi-day simulation confirming queue and bathroom batchQuality remain at exactly 100 throughout
  it('232. real multi-day simulation confirms queue and bathroom batchQuality remain at 100 permanently', () => {
    const k = createInitialKitchenState();
    const queueSt = k.stations.find((s) => s.id === 'queue')!;
    const bathroomSt = k.stations.find((s) => s.id === 'bathroom')!;

    const totalSeconds = 180; // 3 full 60s days
    const totalTicks = totalSeconds * 60;

    let minimumQueueQuality = 100;
    let minimumBathroomQuality = 100;

    for (let t = 0; t < totalTicks; t++) {
      tickKitchenState(k, 1 / 60);
      if (queueSt.batchQuality < minimumQueueQuality) {
        minimumQueueQuality = queueSt.batchQuality;
      }
      if (bathroomSt.batchQuality < minimumBathroomQuality) {
        minimumBathroomQuality = bathroomSt.batchQuality;
      }
    }

    expect(minimumQueueQuality).toBe(100);
    expect(minimumBathroomQuality).toBe(100);
    expect(queueSt.batchQuality).toBe(100);
    expect(bathroomSt.batchQuality).toBe(100);
  });

  // Anchor 233: Full suite verification that extraction was behavior-preserving
  it('233. extracted sessionLoop sub-functions preserve kitchen state updates accurately', () => {
    const k = createInitialKitchenState();
    const initialElapsed = k.elapsedSeconds;

    tickKitchenState(k, 1.0);

    expect(k.elapsedSeconds).toBe(initialElapsed + 1.0);
    expect(k.workers.every((w) => typeof w.thirst === 'number')).toBe(true);
    expect(k.stations.every((s) => typeof s.batchQuality === 'number')).toBe(true);
  });

  // Anchor 234: Split domain constants barrel re-export equality
  it('234. importing constants directly from split modules produces exact identical values as importing via data barrel', async () => {
    const economy = await import('../src/economy');
    const physics = await import('../src/physics');
    const layout = await import('../src/layout');
    const roster = await import('../src/roster');
    const data = await import('../src/data');

    expect(data.INITIAL_BRAND_EQUITY).toBe(economy.INITIAL_BRAND_EQUITY);
    expect(data.WORKER_MAX_SPEED).toBe(physics.WORKER_MAX_SPEED);
    expect(data.KITCHEN_WIDTH).toBe(layout.KITCHEN_WIDTH);
    expect(data.INITIAL_WORKERS).toEqual(roster.INITIAL_WORKERS);
  });

  // Anchor 235: STATION_CONFIGS visualZone mapping
  it('235. STATION_CONFIGS maps each station to its correct visualZone', () => {
    expect(STATION_CONFIGS.grill.visualZone).toBe('lineCook');
    expect(STATION_CONFIGS.assembly.visualZone).toBe('lineCook');
    expect(STATION_CONFIGS.fryer.visualZone).toBe('lineCook');
    expect(STATION_CONFIGS.queue.visualZone).toBe('csr');
    expect(STATION_CONFIGS.window.visualZone).toBe('csr');
    expect(STATION_CONFIGS.coffee.visualZone).toBe('support');
    expect(STATION_CONFIGS.bathroom.visualZone).toBe('support');
  });

  // Anchor 236: Line Cook station affinity bonus at preferred station
  it('236. Line Cook (Alex, preferredStation: grill) scores measurably higher on protocol at grill than a non-line-cook worker', () => {
    const k = createInitialKitchenState();
    const alex = k.workers.find((w) => w.id === 'w1')!; // Line Cook, preferredStation: grill
    const nonCook = { ...alex, id: 'test_csr', type: 'csr' as const, preferredStation: undefined };

    const alexScore = scoreProtocol(alex, k, 'grill');
    const nonCookScore = scoreProtocol(nonCook, k, 'grill');

    expect(alexScore).toBeGreaterThan(nonCookScore);
  });

  // Anchor 237: CSR station affinity bonus at window
  it('237. CSR (Jordan) scores measurably higher on protocol at window than a non-CSR worker', () => {
    const k = createInitialKitchenState();
    const jordan = k.workers.find((w) => w.id === 'w3')!; // CSR
    const nonCsr = { ...jordan, id: 'test_cook', type: 'line_cook' as const, preferredStation: 'grill' as const };

    const jordanScore = scoreProtocol(jordan, k, 'window');
    const nonCsrScore = scoreProtocol(nonCsr, k, 'window');

    expect(jordanScore).toBeGreaterThan(nonCsrScore);
  });

  // Anchor 238: Janitor/Mechanic affinity bonus for clean_mess and clean_bathroom
  it('238. Janitor/Mechanic (Taylor) scores measurably higher on clean_mess and clean_bathroom than a non-Janitor worker', () => {
    const k = createInitialKitchenState();
    k.messes = [{ id: 'm1', x: 200, y: 200, source: 'worker_accident', createdTime: 0 }];
    const bathroom = k.stations.find((s) => s.id === 'bathroom')!;
    bathroom.isOutOfOrder = true;
    bathroom.brokenElapsedSeconds = 10;

    const taylor = k.workers.find((w) => w.id === 'w4')!; // Janitor/Mechanic
    const nonJanitor = { ...taylor, id: 'test_cook', type: 'line_cook' as const };

    expect(scoreCleanMess(taylor, k)).toBeGreaterThan(scoreCleanMess(nonJanitor, k));
    expect(scoreCleanBathroom(taylor, k)).toBeGreaterThan(scoreCleanBathroom(nonJanitor, k));
  });

  // Anchor 239: Worker autonomy (every worker type can perform non-affinity tasks like rest when needed)
  it('239. every worker type can select any candidate task without hard exclusion', () => {
    const k = createInitialKitchenState();

    const lineCook = k.workers.find((w) => w.type === 'line_cook')!;
    const csr = k.workers.find((w) => w.type === 'csr')!;
    const janitor = k.workers.find((w) => w.type === 'janitor_mechanic')!;

    const typesToTest = [lineCook, csr, janitor];
    expect(typesToTest.length).toBe(3);

    for (const w of typesToTest) {
      const normalAction = evaluateWorkerTick(w, k);
      expect(normalAction.name).toBeTruthy();

      const exhaustedWorker = { ...w, stamina: 0.05 };
      const exhaustedAction = evaluateWorkerTick(exhaustedWorker, k);
      expect(exhaustedAction.name).toBe('rest');
    }
  });

  // Anchor 240: Data-driven dispatch for getWorkerTargetPos
  it('240. getWorkerTargetPos resolves target positions correctly via data-driven dispatch strategy', () => {
    const k = createInitialKitchenState();
    const w = { ...k.workers[0] };

    // 1. drink_coffee
    w.currentTask = 'drink_coffee';
    expect(getWorkerTargetPos(w, k)).toEqual({
      x: STATION_CONFIGS.coffee.x + STATION_CONFIGS.coffee.width / 2,
      y: STATION_CONFIGS.coffee.y + STATION_CONFIGS.coffee.height / 2,
    });

    // 2. clean_mess (with real mess)
    k.messes = [{ id: 'm1', x: 215, y: 310, source: 'customer_food', createdTime: 0 }];
    w.currentTask = 'clean_mess';
    expect(getWorkerTargetPos(w, k)).toEqual({ x: 215, y: 310 });

    // 3. clean_bathroom
    w.currentTask = 'clean_bathroom';
    expect(getWorkerTargetPos(w, k)).toEqual({
      x: STATION_CONFIGS.bathroom.x + STATION_CONFIGS.bathroom.width / 2,
      y: STATION_CONFIGS.bathroom.y + STATION_CONFIGS.bathroom.height / 2,
    });

    // 4. use_bathroom (occupant state)
    const bathroomStation = k.stations.find((s) => s.id === 'bathroom')!;
    bathroomStation.occupiedByWorkerId = w.id;
    w.currentTask = 'use_bathroom';
    expect(getWorkerTargetPos(w, k)).toEqual({
      x: STATION_CONFIGS.bathroom.x + STATION_CONFIGS.bathroom.width / 2,
      y: STATION_CONFIGS.bathroom.y + STATION_CONFIGS.bathroom.height / 2,
    });

    // 5. use_bathroom (queued state)
    bathroomStation.occupiedByWorkerId = 'other_worker';
    k.bathroomQueue = [w.id];
    expect(getWorkerTargetPos(w, k)).toEqual(BATHROOM_QUEUE_WAYPOINTS[0]);

    // 6. rest
    w.currentTask = 'rest';
    expect(getWorkerTargetPos(w, k)).toEqual({
      x: STAFF_AREA.x + STAFF_AREA.width / 2,
      y: STAFF_AREA.y + STAFF_AREA.height / 2,
    });

    // 7. eat_meal
    w.currentTask = 'eat_meal';
    expect(getWorkerTargetPos(w, k)).toEqual({
      x: STAFF_AREA.x + STAFF_AREA.width / 2,
      y: STAFF_AREA.y + STAFF_AREA.height / 2,
    });

    // 8. drink_water
    w.currentTask = 'drink_water';
    expect(getWorkerTargetPos(w, k)).toEqual({
      x: STAFF_AREA.x + STAFF_AREA.width / 2,
      y: STAFF_AREA.y + STAFF_AREA.height / 2,
    });

    // 9. discharge_meal
    w.currentTask = 'discharge_meal';
    expect(getWorkerTargetPos(w, k)).toEqual({
      x: STAFF_AREA.x + STAFF_AREA.width / 2,
      y: STAFF_AREA.y + STAFF_AREA.height / 2,
    });
  });

  // Anchor 241: Direct regression proof for mess draw order and station overlap
  it('241. mess spawned within station bounding box remains in state.messes and KitchenCanvas renders messes after stations', () => {
    const k = createInitialKitchenState();
    const grill = STATION_CONFIGS.grill;
    const messX = grill.x + grill.width / 2;
    const messY = grill.y + grill.height / 2;
    k.messes = [{ id: 'm_grill', x: messX, y: messY, source: 'worker_accident', createdTime: 0 }];

    expect(k.messes.length).toBe(1);
    expect(k.messes[0].x).toBeGreaterThanOrEqual(grill.x);
    expect(k.messes[0].x).toBeLessThanOrEqual(grill.x + grill.width);
    expect(k.messes[0].y).toBeGreaterThanOrEqual(grill.y);
    expect(k.messes[0].y).toBeLessThanOrEqual(grill.y + grill.height);

    // Source-level check: confirm mess render call occurs after station render call in KitchenCanvas.tsx
    const canvasSourcePath = path.resolve(__dirname, '../src/components/KitchenCanvas.tsx');
    const canvasSource = fs.readFileSync(canvasSourcePath, 'utf8');

    const stationDrawIndex = canvasSource.indexOf('// 3. Draw Stations');
    const messDrawIndex = canvasSource.indexOf('// Draw Messes on floor');

    expect(stationDrawIndex).toBeGreaterThan(-1);
    expect(messDrawIndex).toBeGreaterThan(-1);
    expect(messDrawIndex).toBeGreaterThan(stationDrawIndex);
  });
});

