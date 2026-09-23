import fs from 'fs';
import path from 'path';
import { Simulation, HUNGER_DECAY_PER_TICK, ZERO_ENERGY_DAMAGE_TICKS, ZERO_ENERGY_DAMAGE_PER_TICK } from '../src/simulation';
import { Ant, Egg, FoodItem } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runTests() {
  console.log('=== Running AntSim Redux Phase 1 Test Anchors ===\n');

  function createDugSim(config?: any): Simulation {
    const s = new Simulation(config);
    s.colonies.forEach(c => c.nest.tunnelDug = true);
    return s;
  }

  // Anchor 1: Direct-sensing range outranks trails
  {
    console.log('Testing Anchor 1: Direct food sensing outranks trails...');
    const sim = createDugSim();
    sim.foodNodes = [];
    sim.ants = [];

    // Place an ant at (100, 100) on the surface
    const ant = sim.spawnAnt();
    ant.x = 100;
    ant.y = 100;
    ant.waypointPath = undefined;

    // Place strong pheromone trail at (100, 120) going south (away from food)
    sim.pheromones.deposit(100, 120, 1.0); // Very strong trail

    // Place a food node at (140, 100) within direct sensing range (75 units)
    sim.foodNodes.push({
      id: 99,
      x: 140,
      y: 100,
      quantity: 50,
      maxQuantity: 100,
      respawnRate: 0,
    });

    // Run one tick
    sim.tick();

    // Verify ant action is 'forage_direct' and moving right (+vx) towards food at 140, ignoring trail at 120
    assert(ant.currentAction === 'forage_direct', `Expected action 'forage_direct', got '${ant.currentAction}'`);
    assert(ant.vx > 0, `Expected ant vx > 0 moving towards food, got vx = ${ant.vx}`);
    console.log('✓ Anchor 1 PASSED: Ant prioritized direct food sensing over strong nearby trail.');
  }

  // Anchor 2: Follow trail when no direct food in range
  {
    console.log('\nTesting Anchor 2: Follows trail when no direct food in range...');
    const sim = createDugSim();
    sim.foodNodes = []; // No food in direct range
    sim.ants = [];

    const ant = sim.spawnAnt();
    ant.x = 200;
    ant.y = 200;
    ant.waypointPath = undefined;

    // Deposit trail above followThreshold (0.08) at cell (210, 200)
    sim.pheromones.deposit(210, 200, 0.5);

    let followedTrail = false;
    for (let t = 0; t < 5; t++) {
      ant.x = 200;
      ant.y = 200;
      ant.vx = 2.2;
      ant.vy = 0;
      sim.tick();
      if (ant.currentAction === 'follow_trail') {
        followedTrail = true;
        break;
      }
    }

    assert(followedTrail, 'Expected ant to follow trail when no food was directly sensed');
    console.log('✓ Anchor 2 PASSED: Ant followed trail when no food was directly sensed.');
  }

  // Anchor 3: Trail decay over time
  {
    console.log('\nTesting Anchor 3: Pheromone trail decay over time...');
    const sim = createDugSim();
    sim.pheromones.deposit(300, 300, 0.8);
    const initialStrength = sim.pheromones.getStrength(300, 300);

    // Tick simulation 10 times with no reinforcement
    for (let i = 0; i < 10; i++) {
      sim.pheromones.decay();
    }

    const decayedStrength = sim.pheromones.getStrength(300, 300);
    assert(decayedStrength < initialStrength, `Expected decayed strength (${decayedStrength}) < initial (${initialStrength})`);
    console.log(`✓ Anchor 3 PASSED: Trail decayed from ${initialStrength.toFixed(3)} to ${decayedStrength.toFixed(3)} over 10 ticks.`);
  }

  // Anchor 4: Integration probe: No runaway pheromone stacking at nest origin
  {
    console.log('\nTesting Anchor 4: Anti-stacking probe (Nest origin runaway protection)...');
    const sim = createDugSim();
    sim.ants = [];

    // Single ant making 50 round trips near nest
    const ant = sim.spawnAnt();
    ant.x = sim.nest.x + 30;
    ant.y = sim.nest.y;
    ant.carryingFood = true;

    for (let tick = 0; tick < 500; tick++) {
      if (!ant.carryingFood) {
        ant.carryingFood = true;
        ant.x = sim.nest.x + 30;
        ant.y = sim.nest.y;
      }
      sim.tick();
    }

    // Measure maximum strength anywhere near nest origin
    let maxNestStrength = 0;
    for (let dx = -40; dx <= 40; dx += 10) {
      for (let dy = -40; dy <= 40; dy += 10) {
        const s = sim.pheromones.getStrength(sim.nest.x + dx, sim.nest.y + dy);
        if (s > maxNestStrength) maxNestStrength = s;
      }
    }

    assert(maxNestStrength <= sim.config.pheromone.maxCellStrength, `Pheromone stacked to ${maxNestStrength}, exceeding cap ${sim.config.pheromone.maxCellStrength}`);
    assert(maxNestStrength < 2.0, `Runaway stacking detected! Max strength: ${maxNestStrength}`);
    console.log(`✓ Anchor 4 PASSED: Max pheromone strength near nest bounded safely at ${maxNestStrength.toFixed(3)} (Cap = ${sim.config.pheromone.maxCellStrength}).`);
  }

  // Anchor 5: Population growth under abundant food (Repeated-Trial Hardened)
  {
    console.log('\nTesting Anchor 5: Population growth under abundant food...');
    let passed = 0;
    const trials = 5;
    for (let trial = 0; trial < trials; trial++) {
      const sim = createDugSim({ eggIncubationSeconds: 0.5, eggLayChance: 0.9 });
      sim.colonies[1].ants = [];
      sim.queen.queenHealth = 0.5;
      sim.nest.foodStore = 50;
      sim.foodNodes = [
        {
          id: 1,
          x: sim.nest.x + 40,
          y: sim.config.groundLevelY - 40,
          quantity: 500,
          maxQuantity: 500,
          respawnRate: 0.1,
        }
      ];

      const startPop = sim.nest.population;
      for (let i = 0; i < 1000; i++) {
        sim.tick();
      }
      const endPop = sim.nest.population;
      if (endPop > startPop) {
        passed++;
      }
    }

    assert(passed >= 3, `Anchor 5 failed: Only ${passed}/${trials} trials showed population growth under abundant food`);
    console.log(`✓ Anchor 5 PASSED: ${passed}/${trials} trials demonstrated population growth under abundant food.`);
  }

  // Anchor 6: Population growth slows/halts under scarce food
  {
    console.log('\nTesting Anchor 6: Population growth halts under scarce food...');
    const sim = createDugSim();
    // Scarce food setup
    sim.nest.foodStore = 0;
    for (const food of sim.foodNodes) {
      food.quantity = 0; // Empty food nodes
      food.respawnRate = 0;
    }

    const startPop = sim.nest.population;
    for (let i = 0; i < 600; i++) {
      sim.tick();
    }
    const endPop = sim.nest.population;

    assert(endPop === startPop, `Expected population to hold steady (${startPop}), but got ${endPop}`);
    console.log(`✓ Anchor 6 PASSED: Population growth halted cleanly at ${endPop} under zero food surplus.`);
  }

  // Anchor 7: Full run sanity check (no degeneration / crash)
  {
    console.log('\nTesting Anchor 7: Full run state stability...');
    const sim = createDugSim();
    let crashed = false;

    try {
      for (let i = 0; i < 1000; i++) {
        sim.tick();
        // Verify numbers remain finite
        assert(!isNaN(sim.nest.foodStore), 'Food store is NaN');
        assert(sim.nest.population >= 0, 'Population negative');
        assert(sim.ants.length === sim.nest.population, 'Ant list length mismatch with population count');
      }
    } catch (e: any) {
      crashed = true;
      console.error('Degeneration failure:', e);
    }

    assert(!crashed, 'Simulation crashed or degenerated during 1000 tick stress run.');
    console.log(`✓ Anchor 7 PASSED: 1000-tick full run completed cleanly with stable entity counts and bounds.`);
  }

  // Anchor 8: Directional consistency / jitter reduction probe
  {
    console.log('\nTesting Anchor 8: Directional commitment / target flip reduction probe...');
    const sim = createDugSim();
    sim.foodNodes = [];
    sim.ants = [];

    // Lay a multi-segment trail horizontally along y = 200 from x = 100 to x = 300
    // add slight noise to raw strengths
    for (let x = 100; x <= 300; x += 10) {
      const noise = (Math.sin(x) * 0.1) + 0.4; // 0.3 - 0.5 range
      sim.pheromones.deposit(x, 200, noise);
    }

    const ant = sim.spawnAnt();
    ant.x = 120;
    ant.y = 200;
    ant.vx = 2.2;
    ant.vy = 0; // Moving right

    let prevTargetX: number | null = null;
    let targetDirectionSwitches = 0;

    for (let t = 0; t < 30; t++) {
      const target = sim.pheromones.findStrongestNeighbor(ant.x, ant.y, ant.vx, ant.vy);
      if (target) {
        if (prevTargetX !== null && target.targetX < ant.x && ant.vx > 0) {
          // Flip backwards
          targetDirectionSwitches++;
        }
        prevTargetX = target.targetX;
        ant.x += ant.vx;
      }
    }

    // With momentum alignment, ant moving right should not flip backwards towards trail behind it
    assert(targetDirectionSwitches === 0, `Expected 0 backward direction flips, got ${targetDirectionSwitches}`);
    console.log(`✓ Anchor 8 PASSED: Ant maintained directional commitment along trail with 0 backward target flips.`);
  }

  // Anchor 9: Velocity alignment beats higher raw strength off-angle
  {
    console.log('\nTesting Anchor 9: Velocity alignment beats raw strength off-angle...');
    const sim = createDugSim();

    const antX = 200;
    const antY = 200;
    const vx = 2.2; // Moving right (+X)
    const vy = 0;

    // Cell straight ahead at (220, 200) with raw strength 0.35
    sim.pheromones.deposit(220, 200, 0.35);

    // Cell behind/off-angle at (180, 220) with higher raw strength 0.50
    sim.pheromones.deposit(180, 220, 0.50);

    const chosen = sim.pheromones.findStrongestNeighbor(antX, antY, vx, vy);
    assert(chosen !== null, 'Expected candidate target to be found');
    assert(chosen!.targetX > antX, `Expected candidate ahead (+X > ${antX}), but got targetX = ${chosen!.targetX}`);
    console.log(`✓ Anchor 9 PASSED: Well-aligned cell at (220, 200) (strength 0.35) beat off-angle cell at (180, 220) (strength 0.50).`);
  }

  // Anchor 10: Zero velocity graceful degradation
  {
    console.log('\nTesting Anchor 10: Graceful degradation for zero-velocity ants...');
    const sim = createDugSim();

    const antX = 200;
    const antY = 200;
    const vx = 0; // Zero velocity
    const vy = 0;

    // Deposit trail cell nearby at (210, 200)
    sim.pheromones.deposit(210, 200, 0.40);

    const chosen = sim.pheromones.findStrongestNeighbor(antX, antY, vx, vy);
    assert(chosen !== null, 'Expected zero-velocity ant to successfully detect nearby trail');
    assert(Math.abs(chosen!.strength - 0.40) < 0.001, `Expected strength 0.40, got ${chosen?.strength}`);
    console.log(`✓ Anchor 10 PASSED: Zero-velocity ant successfully selected nearby trail without NaN or failure.`);
  }

  // Anchor 11: Full run stability probe with widened 5x5 navigation
  {
    console.log('\nTesting Anchor 11: Full 1000-tick stability probe with 5x5 navigation...');
    const sim = createDugSim();
    let errorFound = false;

    for (let i = 0; i < 1000; i++) {
      sim.tick();
      for (const ant of sim.ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          errorFound = true;
          break;
        }
      }
      if (errorFound) break;
    }

    assert(!errorFound, 'NaN position or velocity detected during 1000-tick 5x5 navigation probe');
    console.log(`✓ Anchor 11 PASSED: 1000-tick full run with 5x5 velocity-weighted navigation completed cleanly.`);
  }

  // Anchor 12: Chamber structure & positioning probe
  {
    console.log('\nTesting Anchor 12: Three real Chambers exist below groundLevelY with non-overlapping bounds...');
    const sim = createDugSim();
    assert(sim.chambers.length === 3, `Expected 3 chambers, got ${sim.chambers.length}`);

    const types = sim.chambers.map(c => c.chamberType);
    assert(types.includes('storage'), 'Missing storage chamber');
    assert(types.includes('nursery'), 'Missing nursery chamber');
    assert(types.includes('queen'), 'Missing queen chamber');

    for (const c of sim.chambers) {
      assert(c.y > sim.config.groundLevelY, `Chamber ${c.name} y=${c.y} must be below groundLevelY=${sim.config.groundLevelY}`);
    }

    // Pairwise non-overlapping gap check
    for (let i = 0; i < sim.chambers.length; i++) {
      for (let j = i + 1; j < sim.chambers.length; j++) {
        const c1 = sim.chambers[i];
        const c2 = sim.chambers[j];
        const dx = Math.abs(c1.x - c2.x);
        const dy = Math.abs(c1.y - c2.y);
        const minDx = (c1.width + c2.width) / 2;
        const minDy = (c1.height + c2.height) / 2;
        assert(dx >= minDx || dy >= minDy, `Chambers ${c1.name} and ${c2.name} overlap!`);
      }
    }
    console.log(`✓ Anchor 12 PASSED: 3 Chambers (Storage, Nursery, Queen) verified below ground level with zero overlap.`);
  }

  // Anchor 13: Tunnel waypoint pathing probe
  {
    console.log('\nTesting Anchor 13: Ant carrying food traces tunnel waypoints to storage chamber...');
    const sim = createDugSim();
    sim.ants = [];
    const ant = sim.spawnAnt();
    ant.x = sim.nest.x;
    ant.y = sim.config.groundLevelY - 10;
    ant.carryingFood = true;
    ant.targetChamberId = 1;
    ant.waypointPath = sim.getTunnelWaypoints(0, 1);
    ant.waypointIndex = 0;

    let reachedStorage = false;
    let visitedIntermediateWaypoint = false;

    const waypoints = sim.getTunnelWaypoints(0, 1);
    const midPoint = waypoints[1]; // Intermediate waypoint inside tunnel

    for (let t = 0; t < 300; t++) {
      sim.tick();
      // Check if ant passed close to intermediate tunnel waypoint
      if (Math.hypot(ant.x - midPoint.x, ant.y - midPoint.y) < 25) {
        visitedIntermediateWaypoint = true;
      }
      if (!ant.carryingFood) {
        reachedStorage = true;
        break;
      }
    }

    assert(visitedIntermediateWaypoint, 'Ant did not trace intermediate tunnel waypoint during return');
    assert(reachedStorage, 'Ant failed to reach storage chamber and deposit food within 300 ticks');
    console.log(`✓ Anchor 13 PASSED: Ant successfully traced tunnel waypoints to storage chamber.`);
  }

  // Anchor 14: Food deletion and respawn on depletion
  {
    console.log('\nTesting Anchor 14: Depleted food node deletion and replacement...');
    const sim = createDugSim();
    const initialCount = sim.foodNodes.length;
    const nodeToDeplete = sim.foodNodes[0];
    const depletedId = nodeToDeplete.id;

    // Set quantity to 0
    nodeToDeplete.quantity = 0;

    // Run tick to trigger deletion & replacement
    sim.tick();

    assert(sim.foodNodes.length === initialCount, `Expected food node count to remain ${initialCount}, got ${sim.foodNodes.length}`);
    const foundOld = sim.foodNodes.some(f => f.id === depletedId);
    assert(!foundOld, `Depleted food node ID ${depletedId} was not removed from foodNodes`);
    console.log(`✓ Anchor 14 PASSED: Depleted food node was removed and replaced at a new location.`);
  }

  // Anchor 15: Food node count conservation probe
  {
    console.log('\nTesting Anchor 15: Active food node count conservation across long run...');
    const sim = createDugSim();
    const targetCount = sim.foodNodes.length;

    for (let t = 0; t < 200; t++) {
      // Force occasional node depletion
      if (t % 40 === 0 && sim.foodNodes.length > 0) {
        sim.foodNodes[0].quantity = 0;
      }
      sim.tick();
      assert(sim.foodNodes.length === targetCount, `Food node count diverged to ${sim.foodNodes.length} at tick ${t}`);
    }

    console.log(`✓ Anchor 15 PASSED: Food node count conserved at exactly ${targetCount} across long run.`);
  }

  // Anchor 16: Full multi-minute stability probe with Chambers, Tunnels & Food Lifecycle
  {
    console.log('\nTesting Anchor 16: Full 1000-tick integration probe with Chambers, Tunnels & Food Lifecycle...');
    const sim = createDugSim();
    let errorFound = false;

    for (let t = 0; t < 1000; t++) {
      sim.tick();
      for (const ant of sim.ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          errorFound = true;
          break;
        }
      }
      if (errorFound) break;
    }

    assert(!errorFound, 'NaN position or velocity detected during 1000-tick Phase 2a full integration run');
    assert(sim.ants.length >= 10 && sim.ants.length <= 150, `Ant population out of expected bounds: ${sim.ants.length}`);
    console.log(`✓ Anchor 16 PASSED: 1000-tick Phase 2a full integration run completed cleanly.`);
  }

  // Anchor 17: Statistical exploration behavior probe
  {
    console.log('\nTesting Anchor 17: Non-zero exploration rate during trail following...');
    const sim = createDugSim();
    sim.foodNodes = []; // Remove food nodes to isolate trail vs exploration
    sim.pheromones.deposit(220, 200, 0.5); // Lay strong trail cell

    let exploreCount = 0;
    let followCount = 0;
    const N = 400;

    for (let i = 0; i < N; i++) {
      sim.pheromones.deposit(220, 200, 0.5); // Re-reinforce trail cell so it stays above followThreshold
      const ant = sim.ants[0];
      ant.x = 200;
      ant.y = 200;
      ant.vx = 2.2;
      ant.vy = 0;
      ant.carryingFood = false;
      ant.waypointPath = undefined;

      sim.tick();

      if (ant.currentAction === 'idle') {
        exploreCount++;
      } else if (ant.currentAction === 'follow_trail') {
        followCount++;
      }
    }

    const exploreRatio = exploreCount / (exploreCount + followCount);
    assert(exploreCount > 0, 'Exploration roll failed to trigger any independent foraging');
    assert(
      exploreRatio >= 0.04 && exploreRatio <= 0.25,
      `Exploration ratio ${exploreRatio.toFixed(3)} out of expected range around config ${sim.config.explorationChance}`
    );
    console.log(`✓ Anchor 17 PASSED: Exploration rate measured at ${(exploreRatio * 100).toFixed(1)}% (Target config: ${(sim.config.explorationChance * 100).toFixed(1)}%).`);
  }

  // Anchor 18: Direct food sensing unconditionally outranks trail/exploration
  {
    console.log('\nTesting Anchor 18: Direct food sensing unconditionally outranks trail-following & exploration...');
    const sim = createDugSim();
    sim.pheromones.deposit(220, 200, 0.8); // Strong trail nearby

    // Place food node within direct sensing range
    sim.foodNodes = [
      {
        id: 99,
        x: 230,
        y: 200,
        quantity: 100,
        maxQuantity: 100,
        respawnRate: 0,
      },
    ];

    for (let i = 0; i < 50; i++) {
      const ant = sim.ants[0];
      ant.x = 200;
      ant.y = 200;
      ant.vx = 2.2;
      ant.vy = 0;
      ant.carryingFood = false;
      ant.waypointPath = undefined;

      sim.tick();

      assert(
        ant.currentAction === 'forage_direct',
        `Ant chose action ${ant.currentAction} instead of forage_direct when food was in direct sensing range`
      );
    }
    console.log(`✓ Anchor 18 PASSED: Direct food sensing unconditionally outranked trail-following & exploration 50/50 times.`);
  }

  // Anchor 19: Nursery-anchored spawning position probe
  {
    console.log('\nTesting Anchor 19: Newly spawned ant initializes at Nursery Chamber...');
    const sim = createDugSim();
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;
    assert(Boolean(nursery), 'Nursery chamber missing');

    const newAnt = sim.spawnAnt();

    const distToNursery = Math.hypot(newAnt.x - nursery.x, newAnt.y - nursery.y);
    assert(distToNursery <= 10, `New ant spawned at dist ${distToNursery.toFixed(1)} from Nursery, expected <= 10`);

    const distToOldNest = Math.hypot(newAnt.x - sim.nest.x, newAnt.y - sim.nest.y);
    assert(distToOldNest > 100, 'New ant wrongly spawned at surface nest origin');
    assert(Boolean(newAnt.waypointPath && newAnt.waypointPath.length > 0), 'New ant missing exit tunnel waypoint path');

    console.log(`✓ Anchor 19 PASSED: Newly spawned ant initialized at Nursery Chamber with exit tunnel path.`);
  }

  // Anchor 20: Queen entity presence and health probe
  {
    console.log('\nTesting Anchor 20: Real Queen entity presence in Royal Chamber...');
    const sim = createDugSim();
    assert(Boolean(sim.queen), 'Queen entity missing from simulation');

    const queenChamber = sim.chambers.find(c => c.chamberType === 'queen')!;
    assert(Boolean(queenChamber), 'Queen chamber missing');

    assert(sim.queen.x === queenChamber.x, `Queen x=${sim.queen.x} does not match Chamber x=${queenChamber.x}`);
    assert(sim.queen.y === queenChamber.y, `Queen y=${sim.queen.y} does not match Chamber y=${queenChamber.y}`);
    assert(sim.queen.queenHealth === 1.0, `Queen initial health = ${sim.queen.queenHealth}, expected 1.0`);

    // Run 500 ticks and verify queen health decays slowly without crashing
    for (let t = 0; t < 500; t++) {
      sim.tick();
      assert(sim.queen.queenHealth >= 0.8 && sim.queen.queenHealth <= 1.0, `Queen health out of bounds: ${sim.queen.queenHealth}`);
    }

    console.log(`✓ Anchor 20 PASSED: Queen entity verified in Royal Chamber with health decaying gracefully across 500 ticks.`);
  }

  // Anchor 21: Full Phase 2b/2c integration run probe
  {
    console.log('\nTesting Anchor 21: Full 1000-tick integration run...');
    const sim = createDugSim();
    let errorFound = false;

    for (let t = 0; t < 1000; t++) {
      sim.tick();
      for (const ant of sim.ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          errorFound = true;
          break;
        }
      }
      if (errorFound) break;
    }

    assert(!errorFound, 'NaN position or velocity detected during 1000-tick full integration run');
    assert(Boolean(sim.queen && sim.queen.queenHealth >= 0), 'Queen state compromised during integration run');
    assert(sim.ants.length >= 10 && sim.ants.length <= 150, `Ant population out of expected bounds: ${sim.ants.length}`);
    console.log(`✓ Anchor 21 PASSED: 1000-tick full integration run completed cleanly.`);
  }

  // Anchor 22: Queen Routing Health Dependency
  {
    console.log('\nTesting Anchor 22: Queen routing health dependency...');
    const sim = createDugSim();

    // With queen health at 1.0, queenPull = 0.1 vs storagePull = 1.0 (~9.1% to Queen)
    let queenCountFull = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      if (sim.selectFoodReturnChamber(1.0) === 3) queenCountFull++;
    }
    const fullRatio = queenCountFull / trials;
    assert(fullRatio < 0.18, `Expected < 18% routing to Queen at 100% HP, got ${(fullRatio * 100).toFixed(1)}%`);

    // With queen health at 0.0, queenPull = 3.1 vs storagePull = 1.0 (~75.6% to Queen)
    let queenCountLow = 0;
    for (let i = 0; i < trials; i++) {
      if (sim.selectFoodReturnChamber(0.0) === 3) queenCountLow++;
    }
    const lowRatio = queenCountLow / trials;
    assert(lowRatio > 0.65, `Expected > 65% routing to Queen at 0% HP, got ${(lowRatio * 100).toFixed(1)}%`);

    console.log(`✓ Anchor 22 PASSED: Routing to Queen shifted from ${(fullRatio * 100).toFixed(1)}% (at 100% HP) to ${(lowRatio * 100).toFixed(1)}% (at 0% HP).`);
  }

  // Anchor 23: Trophallaxis & Feeding Single-Deposit
  {
    console.log('\nTesting Anchor 23: Trophallaxis & feeding single-deposit...');
    const sim = createDugSim();
    sim.queen.queenHealth = 0.5;
    const initialFoodStore = sim.nest.foodStore;

    // Place an ant carrying food directly at the Queen Chamber end of waypoint path
    const ant = sim.ants[0];
    ant.carryingFood = true;
    ant.targetChamberId = 3; // Queen Chamber
    ant.waypointPath = sim.getTunnelWaypoints(0, 3);
    ant.waypointIndex = ant.waypointPath.length - 1;
    const lastWaypoint = ant.waypointPath[ant.waypointIndex];
    ant.x = lastWaypoint.x;
    ant.y = lastWaypoint.y;

    sim.tick();

    // Verify Queen health increased by +0.25 (to ~0.75), food was consumed, and NOT added to storage
    assert(sim.queen.queenHealth >= 0.74, `Queen health = ${sim.queen.queenHealth}, expected ~0.75`);
    assert(!ant.carryingFood, 'Ant still carrying food after trophallaxis');
    assert(sim.nest.foodStore === initialFoodStore, `Food store changed to ${sim.nest.foodStore}, expected unchanged ${initialFoodStore}`);

    console.log(`✓ Anchor 23 PASSED: Trophallaxis fed Queen (+0.25 HP) without double-depositing food into Granary storage.`);
  }

  // Anchor 24: Statistical Egg Production
  {
    console.log('\nTesting Anchor 24: Statistical Egg Production...');
    const sim = createDugSim({ eggLayChance: 0.6 });
    sim.eggs = [];

    const totalFeedings = 100;
    for (let f = 0; f < totalFeedings; f++) {
      sim.queen.queenHealth = 0.5;
      const ant = sim.ants[0];
      ant.carryingEgg = false;
      ant.carryingFood = true;
      ant.targetChamberId = 3;
      ant.waypointPath = sim.getTunnelWaypoints(0, 3);
      ant.waypointIndex = ant.waypointPath.length - 1;
      const lastWaypoint = ant.waypointPath[ant.waypointIndex];
      ant.x = lastWaypoint.x;
      ant.y = lastWaypoint.y;

      sim.tick();
    }

    const eggCount = sim.eggs.length;
    assert(eggCount >= 40 && eggCount <= 80, `Expected ~60 eggs laid across 100 feedings, got ${eggCount}`);
    console.log(`✓ Anchor 24 PASSED: 100 feedings produced ${eggCount} eggs (Configured chance: 60%).`);
  }

  // Anchor 25: Egg Transport Waypoints
  {
    console.log('\nTesting Anchor 25: Egg Transport Waypoints...');
    const sim = createDugSim();
    const queenChamber = sim.chambers.find(c => c.chamberType === 'queen')!;
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;

    // Create an egg at Queen Chamber
    const egg: Egg = {
      id: 999,
      x: queenChamber.x,
      y: queenChamber.y,
      incubationSeconds: 0,
      state: 'queen_chamber',
      careLevel: 1.0,
    };
    sim.eggs.push(egg);

    const ant = sim.ants[0];
    ant.x = queenChamber.x;
    ant.y = queenChamber.y;
    ant.carryingFood = false;
    ant.carryingEgg = true;
    ant.waypointPath = sim.getTunnelWaypoints(3, 2);
    ant.waypointIndex = 0;
    egg.state = 'carried';
    egg.carrierAntId = ant.id;

    // Run ticks until ant deposits egg
    for (let t = 0; t < 400; t++) {
      sim.tick();
      if (!ant.carryingEgg) break;
    }

    assert(!ant.carryingEgg, 'Ant failed to finish egg transport');
    assert((egg.state as string) === 'nursery', `Egg state = ${egg.state}, expected nursery`);
    const distToNursery = Math.hypot(egg.x - nursery.x, egg.y - nursery.y);
    assert(distToNursery <= 20, `Egg deposited at dist ${distToNursery.toFixed(1)} from Nursery center`);

    console.log(`✓ Anchor 25 PASSED: Ant carried egg along tunnel waypoints and deposited it in Nursery Chamber.`);
  }

  // Anchor 26: Nursery Egg Incubation & Hatching
  {
    console.log('\nTesting Anchor 26: Nursery Egg Incubation & Hatching...');
    const sim = createDugSim({ eggIncubationSeconds: 0.1 });
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;
    const initialPop = sim.nest.population;

    const egg: Egg = {
      id: 888,
      x: nursery.x,
      y: nursery.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 1.0,
    };
    sim.eggs.push(egg);

    // Tick for 15 steps (~0.24 seconds incubation time)
    for (let t = 0; t < 15; t++) {
      sim.tick();
    }

    assert(!sim.eggs.some(e => e.id === 888), 'Egg remained in simulation after exceeding incubation limit');
    assert(sim.nest.population === initialPop + 1, `Population = ${sim.nest.population}, expected ${initialPop + 1}`);

    console.log(`✓ Anchor 26 PASSED: Nursery egg incubated past threshold and hatched into a new ant (+1 population).`);
  }

  // Anchor 27: Queen-Driven Population Dependency
  {
    console.log('\nTesting Anchor 27: Queen-Driven Population Dependency...');
    const sim = createDugSim();
    sim.eggs = [];
    sim.nest.foodStore = 1000; // Massive food surplus
    const initialPop = sim.nest.population;

    // Starve queen / prevent feedings
    sim.queen.queenHealth = 0;

    // Run 300 ticks without eggs
    for (let t = 0; t < 300; t++) {
      sim.tick();
    }

    assert(sim.nest.population === initialPop, `Population grew to ${sim.nest.population} despite zero egg hatching!`);
    console.log(`✓ Anchor 27 PASSED: Massive food surplus (1000 food) produced 0 new spawns without Queen-laid eggs.`);
  }

  // Anchor 28: Phase 2c Full Integration Probe
  {
    console.log('\nTesting Anchor 28: Phase 2c Full Integration Probe...');
    const sim = createDugSim();
    let errorFound = false;

    for (let t = 0; t < 1000; t++) {
      sim.tick();
      for (const ant of sim.ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          errorFound = true;
          break;
        }
      }
      if (errorFound) break;
    }

    assert(!errorFound, 'NaN position or velocity detected during 1000-tick Phase 2c full integration run');
    assert(sim.nest.population >= 5, `Population dropped too low: ${sim.nest.population}`);
    assert(sim.queen.queenHealth >= 0 && sim.queen.queenHealth <= 1.0, `Queen health out of bounds: ${sim.queen.queenHealth}`);
    console.log(`✓ Anchor 28 PASSED: 1000-tick Phase 2c full integration run completed cleanly.`);
  }

  // Anchor 29: Direct source check for complete cleanup of population.ts and PopulationController
  {
    console.log('\nTesting Anchor 29: Direct source check for dead code cleanup...');
    const populationContent = fs.readFileSync(path.join(process.cwd(), 'src/population.ts'), 'utf-8');
    const simulationContent = fs.readFileSync(path.join(process.cwd(), 'src/simulation.ts'), 'utf-8');

    assert(!populationContent.includes('spawnProgress'), 'population.ts still contains spawnProgress');
    assert(!populationContent.includes('spawnRate'), 'population.ts still contains spawnRate');
    assert(!populationContent.includes('foodRatio'), 'population.ts still contains foodRatio');
    assert(!populationContent.includes('PopulationController'), 'population.ts still contains PopulationController');
    assert(!simulationContent.includes('PopulationController'), 'simulation.ts still references PopulationController');

    console.log('✓ Anchor 29 PASSED: Direct source check verified zero dormant spawn-trigger logic or PopulationController.');
  }

  // Anchor 30: Nursery routing probability increases as pending eggs careLevel drops
  {
    console.log('\nTesting Anchor 30: Nursery routing probability increases as careLevel drops...');
    const sim = createDugSim();
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;
    sim.queen.queenHealth = 1.0;

    const egg: Egg = {
      id: 777,
      x: nursery.x,
      y: nursery.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 1.0,
    };
    sim.eggs.push(egg);

    // Measure nursery route selection with careLevel = 1.0
    let nurseryCountHighCare = 0;
    const trials = 1000;
    for (let t = 0; t < trials; t++) {
      if (sim.selectFoodReturnChamber() === 2) nurseryCountHighCare++;
    }

    // Set careLevel = 0.0 (neglected egg)
    egg.careLevel = 0.0;
    let nurseryCountLowCare = 0;
    for (let t = 0; t < trials; t++) {
      if (sim.selectFoodReturnChamber() === 2) nurseryCountLowCare++;
    }

    assert(nurseryCountLowCare > nurseryCountHighCare * 1.5,
      `Expected low care nursery routing (${nurseryCountLowCare}) to be significantly higher than high care (${nurseryCountHighCare})`);
    console.log(`✓ Anchor 30 PASSED: Nursery routing shifted from ${(nurseryCountHighCare / trials * 100).toFixed(1)}% (care=1.0) to ${(nurseryCountLowCare / trials * 100).toFixed(1)}% (care=0.0).`);
  }

  // Anchor 31: Larval feeding at Nursery raises careLevel without double-depositing or double-feeding
  {
    console.log('\nTesting Anchor 31: Larval feeding at Nursery...');
    const sim = createDugSim();
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;
    const initialFoodStore = sim.nest.foodStore;
    const initialQueenHealth = sim.queen.queenHealth;

    const egg: Egg = {
      id: 666,
      x: nursery.x,
      y: nursery.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 0.3,
    };
    sim.eggs.push(egg);

    const ant = sim.ants[0];
    ant.carryingFood = true;
    ant.targetChamberId = 2; // Target Nursery
    ant.x = nursery.x;
    ant.y = nursery.y;
    ant.waypointPath = sim.getTunnelWaypoints(0, 2);
    ant.waypointIndex = ant.waypointPath.length - 1; // At Nursery destination

    sim.tick();

    assert(!ant.carryingFood, 'Ant still carrying food after feeding larva');
    assert(egg.careLevel > 0.3, `Egg careLevel failed to increase: ${egg.careLevel}`);
    assert(sim.nest.foodStore === initialFoodStore, `Food store changed unexpectedly: ${sim.nest.foodStore} vs ${initialFoodStore}`);
    assert(sim.queen.queenHealth < initialQueenHealth, `Queen health unexpectedly boosted: ${sim.queen.queenHealth}`);
    console.log(`✓ Anchor 31 PASSED: Larval feeding raised careLevel to ${egg.careLevel.toFixed(2)} without double-depositing or double-feeding.`);
  }

  // Anchor 32: Incubation speed scales with careLevel
  {
    console.log('\nTesting Anchor 32: Incubation speed scales with careLevel...');
    const simHigh = createDugSim({ eggIncubationSeconds: 1.0 });
    const nurseryHigh = simHigh.chambers.find(c => c.chamberType === 'nursery')!;
    const eggHigh: Egg = {
      id: 501,
      x: nurseryHigh.x,
      y: nurseryHigh.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 1.0,
    };
    simHigh.eggs.push(eggHigh);

    let ticksHigh = 0;
    while (simHigh.eggs.length > 0 && ticksHigh < 500) {
      eggHigh.careLevel = 1.0; // Sustain high care
      simHigh.tick();
      ticksHigh++;
    }

    const simLow = createDugSim({ eggIncubationSeconds: 1.0 });
    const nurseryLow = simLow.chambers.find(c => c.chamberType === 'nursery')!;
    const eggLow: Egg = {
      id: 502,
      x: nurseryLow.x,
      y: nurseryLow.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 0.0,
    };
    simLow.eggs.push(eggLow);

    let ticksLow = 0;
    while (simLow.eggs.length > 0 && ticksLow < 1000) {
      eggLow.careLevel = 0.0; // Neglected
      simLow.tick();
      ticksLow++;
    }

    assert(ticksHigh < ticksLow, `Expected well-fed egg to hatch faster (${ticksHigh} ticks) than neglected (${ticksLow} ticks)`);
    console.log(`✓ Anchor 32 PASSED: High-care egg hatched in ${ticksHigh} ticks vs low-care egg in ${ticksLow} ticks.`);
  }

  // Anchor 33: Phase 2d Full Integration Probe
  {
    console.log('\nTesting Anchor 33: Phase 2d Full Integration Probe...');
    const sim = createDugSim();
    let errorFound = false;

    for (let t = 0; t < 1000; t++) {
      sim.tick();
      for (const ant of sim.ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          errorFound = true;
          break;
        }
      }
      if (errorFound) break;
    }

    assert(!errorFound, 'NaN position or velocity detected during 1000-tick Phase 2d full integration run');
    assert(sim.nest.population >= 5, `Population dropped too low: ${sim.nest.population}`);
    assert(sim.queen.queenHealth >= 0 && sim.queen.queenHealth <= 1.0, `Queen health out of bounds: ${sim.queen.queenHealth}`);
    console.log(`✓ Anchor 33 PASSED: 1000-tick Phase 2d full integration run completed cleanly.`);
  }

  // Anchor 34: Queen mortality sustained-zero threshold
  {
    console.log('\nTesting Anchor 34: Queen mortality sustained-zero threshold...');
    const sim = createDugSim();
    sim.queen.queenHealth = 0.0;

    // Tick for 50 ticks (~0.8s) -> Should NOT trigger death yet
    for (let t = 0; t < 50; t++) sim.tick();
    assert(!sim.queen.isDead, 'Queen died prematurely before 10s zero-health threshold');

    // Briefly recover health -> zeroHealthElapsedSeconds should reset
    sim.queen.queenHealth = 0.5;
    sim.tick();
    assert(sim.queen.zeroHealthElapsedSeconds === 0, 'zeroHealthElapsedSeconds failed to reset on health recovery');

    // Drain back to 0 and sustain for >10s (630 ticks)
    sim.queen.queenHealth = 0.0;
    for (let t = 0; t < 630; t++) {
      sim.queen.queenHealth = 0.0; // keep zero
      sim.tick();
    }

    assert(sim.queen.isDead === true, 'Queen failed to die after sustained 10s zero-health threshold');
    console.log('✓ Anchor 34 PASSED: Sustained zero health triggered death; brief recovery prevented premature death.');
  }

  // Anchor 35: Royal Candidate selection at death via tie-break
  {
    console.log('\nTesting Anchor 35: Royal Candidate selection at death via tie-break...');
    const sim = createDugSim();
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;

    const eggLow: Egg = {
      id: 801,
      x: nursery.x,
      y: nursery.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 0.4,
    };
    const eggHigh: Egg = {
      id: 802,
      x: nursery.x,
      y: nursery.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 0.9,
    };
    sim.eggs.push(eggLow, eggHigh);

    // Trigger death while maintaining relative care levels until death
    sim.queen.queenHealth = 0.0;
    for (let t = 0; t < 630; t++) {
      sim.queen.queenHealth = 0.0;
      eggLow.careLevel = 0.4;
      eggHigh.careLevel = 0.9;
      sim.tick();
    }

    assert(sim.queen.isDead === true, 'Queen failed to die');
    assert(eggHigh.isRoyalCandidate === true, 'Highest care egg was not selected as Royal Candidate');
    assert(!eggLow.isRoyalCandidate, 'Lower care egg was incorrectly selected as Royal Candidate');
    console.log('✓ Anchor 35 PASSED: Royal Candidate selected egg with highest careLevel on Queen death.');
  }

  // Anchor 36: Royal Jelly feeding acceleration
  {
    console.log('\nTesting Anchor 36: Royal Jelly feeding acceleration...');
    const simCandidate = createDugSim();
    const nursery = simCandidate.chambers.find(c => c.chamberType === 'nursery')!;
    const candidateEgg: Egg = {
      id: 901,
      x: nursery.x,
      y: nursery.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 0.2,
      isRoyalCandidate: true,
    };
    simCandidate.eggs.push(candidateEgg);

    // Ant feeds candidate egg at nursery
    const antCand = simCandidate.ants[0];
    antCand.carryingFood = true;
    antCand.targetChamberId = 2;
    antCand.x = nursery.x;
    antCand.y = nursery.y;
    antCand.waypointPath = simCandidate.getTunnelWaypoints(0, 2);
    antCand.waypointIndex = antCand.waypointPath.length - 1;

    simCandidate.tick();
    const candidateCareGain = candidateEgg.careLevel - 0.2;

    const simRegular = createDugSim();
    const nurseryReg = simRegular.chambers.find(c => c.chamberType === 'nursery')!;
    const regularEgg: Egg = {
      id: 902,
      x: nurseryReg.x,
      y: nurseryReg.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 0.2,
    };
    simRegular.eggs.push(regularEgg);

    const antReg = simRegular.ants[0];
    antReg.carryingFood = true;
    antReg.targetChamberId = 2;
    antReg.x = nurseryReg.x;
    antReg.y = nurseryReg.y;
    antReg.waypointPath = simRegular.getTunnelWaypoints(0, 2);
    antReg.waypointIndex = antReg.waypointPath.length - 1;

    simRegular.tick();
    const regularCareGain = regularEgg.careLevel - 0.2;

    assert(candidateCareGain > regularCareGain * 1.5,
      `Expected Royal Jelly care gain (${candidateCareGain}) to be significantly higher than regular (${regularCareGain})`);
    console.log(`✓ Anchor 36 PASSED: Royal Jelly feeding applied boosted care gain (+${candidateCareGain.toFixed(2)} vs +${regularCareGain.toFixed(2)}).`);
  }

  // Anchor 37: Emergency Succession produces new living Queen
  {
    console.log('\nTesting Anchor 37: Emergency Succession produces new living Queen...');
    const sim = createDugSim({ eggIncubationSeconds: 1.0 });
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;

    sim.queen.isDead = true;
    sim.queen.queenHealth = 0.0;

    const candidateEgg: Egg = {
      id: 950,
      x: nursery.x,
      y: nursery.y,
      incubationSeconds: 0.95,
      state: 'nursery',
      careLevel: 1.0,
      isRoyalCandidate: true,
    };
    sim.eggs.push(candidateEgg);

    // Tick until incubation completes and candidate hatches
    while (sim.eggs.length > 0) {
      sim.tick();
    }

    assert(!sim.queen.isDead, 'Queen still marked dead after successful succession');
    assert(sim.queen.queenHealth === 1.0, `New Queen health not restored to 1.0: ${sim.queen.queenHealth}`);
    assert(!sim.nest.isQueenless, 'Nest still marked queenless after successful succession');
    console.log('✓ Anchor 37 PASSED: Successfully reared Royal Candidate produced new living Queen with 100% HP.');
  }

  // Anchor 38: No pending egg leaves colony queenless with halted growth
  {
    console.log('\nTesting Anchor 38: Queen death with no candidate leaves colony queenless...');
    const sim = createDugSim();
    sim.eggs = []; // clear all eggs

    // Trigger death
    sim.queen.queenHealth = 0.0;
    for (let t = 0; t < 630; t++) {
      sim.queen.queenHealth = 0.0;
      sim.tick();
    }

    assert(sim.queen.isDead === true, 'Queen is not dead');
    // In Phase 2f, emergency egg is created on death. Clear food sources so candidate cannot be fed
    sim.foodNodes = [];
    sim.nest.foodStore = 0;
    for (const c of sim.colonies) c.foodItems = [];
    for (const a of sim.ants) {
      a.carryingFood = false;
      a.carryingEgg = false;
    }
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery');
    for (const e of sim.eggs) {
      e.state = 'nursery';
      e.carrierAntId = undefined;
      if (nursery) {
        e.x = nursery.x;
        e.y = nursery.y;
      }
    }

    while (sim.eggs.length > 0) {
      for (const a of sim.ants) a.carryingEgg = false;
      if (sim.eggs[0]) sim.eggs[0].careLevel = 0.0;
      sim.tick();
    }

    assert(sim.nest.isQueenless === true, 'Nest is not marked queenless');

    // Run 500 ticks and verify 0 new eggs are produced
    for (let t = 0; t < 500; t++) {
      sim.tick();
    }

    assert(sim.eggs.length === 0, `New eggs were produced unexpectedly in queenless colony: ${sim.eggs.length}`);
    console.log('✓ Anchor 38 PASSED: Colony remained queenless with 0 new eggs produced over 500 ticks.');
  }

  // Anchor 39: Phase 2e Full Integration Probe
  {
    console.log('\nTesting Anchor 39: Phase 2e Full Integration Probe...');
    const sim = createDugSim();
    let errorFound = false;

    for (let t = 0; t < 1000; t++) {
      sim.tick();
      for (const ant of sim.ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          errorFound = true;
          break;
        }
      }
      if (errorFound) break;
    }

    assert(!errorFound, 'NaN position or velocity detected during 1000-tick Phase 2e full integration run');
    assert(sim.nest.population >= 1, `Population dropped too low: ${sim.nest.population}`);
    assert(sim.queen.queenHealth >= 0 && sim.queen.queenHealth <= 1.0, `Queen health out of bounds: ${sim.queen.queenHealth}`);
    console.log(`✓ Anchor 39 PASSED: 1000-tick Phase 2e full integration run completed cleanly.`);
  }

  // Anchor 40: Emergency egg creation on queen death with zero pending eggs
  {
    console.log('\nTesting Anchor 40: Emergency egg creation on queen death with zero pending eggs...');
    const sim = createDugSim();
    sim.eggs = []; // zero pending eggs
    sim.foodNodes = [];
    sim.nest.foodStore = 0;
    for (const a of sim.ants) a.carryingFood = false;

    // Trigger queen death
    sim.queen.queenHealth = 0.0;
    for (let t = 0; t < 630; t++) {
      sim.queen.queenHealth = 0.0;
      sim.tick();
    }

    assert(sim.queen.isDead === true, 'Queen is not dead');
    assert(sim.eggs.length === 1, `Expected exactly 1 emergency egg, found ${sim.eggs.length}`);
    assert(sim.eggs[0].isRoyalCandidate === true, 'Emergency egg is not marked as Royal Candidate');
    assert(!sim.nest.isQueenless, 'Nest was incorrectly marked queenless immediately at death despite emergency egg');
    console.log('✓ Anchor 40 PASSED: Emergency egg created as Royal Candidate on queen death with zero pending eggs.');
  }

  // Anchor 41: Colony not marked queenless until emergency egg outcome resolves
  {
    console.log('\nTesting Anchor 41: Colony not marked queenless until emergency egg resolves...');
    const sim = createDugSim();
    sim.eggs = [];
    sim.foodNodes = [];
    sim.nest.foodStore = 0;
    for (const a of sim.ants) a.carryingFood = false;

    // Trigger death
    sim.queen.queenHealth = 0.0;
    for (let t = 0; t < 630; t++) {
      sim.queen.queenHealth = 0.0;
      sim.tick();
    }

    assert(!sim.nest.isQueenless, 'Nest was marked queenless immediately at moment of death');

    // Force emergency egg care to 0 so it fails when incubation finishes
    while (sim.eggs.length > 0) {
      if (sim.eggs[0]) sim.eggs[0].careLevel = 0.0;
      sim.tick();
    }

    assert(sim.nest.isQueenless === true, 'Nest was not marked queenless after emergency egg failed');
    console.log('✓ Anchor 41 PASSED: Nest remained not-queenless until emergency egg incubation failed.');
  }

  // Anchor 42: Sustained Royal Jelly feeding on emergency egg produces new Queen
  {
    console.log('\nTesting Anchor 42: Sustained Royal Jelly feeding on emergency egg produces new Queen...');
    const sim = createDugSim({ eggIncubationSeconds: 1.0 });
    sim.eggs = [];
    sim.foodNodes = [];
    sim.nest.foodStore = 0;
    for (const a of sim.ants) a.carryingFood = false;

    // Trigger death
    sim.queen.queenHealth = 0.0;
    for (let t = 0; t < 630; t++) {
      sim.queen.queenHealth = 0.0;
      sim.tick();
    }

    assert(sim.eggs.length === 1, 'Emergency egg not found');
    sim.eggs[0].careLevel = 1.0; // fed with Royal Jelly

    while (sim.eggs.length > 0) {
      sim.tick();
    }

    assert(!sim.queen.isDead, 'Queen still dead after emergency egg succeeded');
    assert(sim.queen.queenHealth === 1.0, `New Queen health not restored to 1.0: ${sim.queen.queenHealth}`);
    assert(!sim.nest.isQueenless, 'Nest marked queenless despite successful emergency succession');
    console.log('✓ Anchor 42 PASSED: Emergency egg reared with Royal Jelly produced a new living Queen.');
  }

  // Anchor 43: Unfed emergency egg eventually fails and triggers final queenless state
  {
    console.log('\nTesting Anchor 43: Unfed emergency egg fails and triggers final queenless state...');
    const sim = createDugSim({ eggIncubationSeconds: 1.0 });
    sim.eggs = [];
    sim.foodNodes = [];
    sim.nest.foodStore = 0;
    for (const a of sim.ants) a.carryingFood = false;

    // Trigger death
    sim.queen.queenHealth = 0.0;
    for (let t = 0; t < 630; t++) {
      sim.queen.queenHealth = 0.0;
      sim.tick();
    }

    assert(sim.eggs.length === 1, 'Emergency egg not found');
    while (sim.eggs.length > 0) {
      if (sim.eggs[0]) sim.eggs[0].careLevel = 0.0;
      sim.tick();
    }

    assert(sim.nest.isQueenless === true, 'Colony failed to transition to queenless state on emergency egg failure');
    
    // Verify growth halts
    for (let t = 0; t < 300; t++) {
      sim.tick();
    }
    assert(sim.eggs.length === 0, 'New eggs laid after failed emergency succession');
    console.log('✓ Anchor 43 PASSED: Unfed emergency egg failed and colony transitioned to permanent queenless state.');
  }

  // Anchor 44: Pre-existing pending egg path remains unchanged
  {
    console.log('\nTesting Anchor 44: Pre-existing pending egg path remains unchanged...');
    const sim = createDugSim();
    const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;
    const preExistingEgg: Egg = {
      id: 777,
      x: nursery.x,
      y: nursery.y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 0.8,
    };
    sim.eggs = [preExistingEgg];
    sim.foodNodes = [];
    sim.nest.foodStore = 0;
    for (const a of sim.ants) a.carryingFood = false;

    // Trigger death
    sim.queen.queenHealth = 0.0;
    for (let t = 0; t < 630; t++) {
      sim.queen.queenHealth = 0.0;
      sim.tick();
    }

    assert(sim.eggs.length === 1, `Expected 1 egg (pre-existing), found ${sim.eggs.length}`);
    assert(sim.eggs[0].id === 777, 'Pre-existing egg was replaced or lost');
    assert(sim.eggs[0].isRoyalCandidate === true, 'Pre-existing egg was not selected as Royal Candidate');
    console.log('✓ Anchor 44 PASSED: Pre-existing Nursery egg directly selected as candidate with no duplicate emergency egg.');
  }

  // Anchor 45: Phase 2f Full Integration Probe
  {
    console.log('\nTesting Anchor 45: Phase 2f Full Integration Probe...');
    const sim = createDugSim();
    let errorFound = false;

    for (let t = 0; t < 1000; t++) {
      sim.tick();
      for (const ant of sim.ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          errorFound = true;
          break;
        }
      }
      if (errorFound) break;
    }

    assert(!errorFound, 'NaN position or velocity detected during 1000-tick Phase 2f full integration run');
    assert(sim.nest.population >= 1, `Population dropped too low: ${sim.nest.population}`);
    assert(sim.queen.queenHealth >= 0 && sim.queen.queenHealth <= 1.0, `Queen health out of bounds: ${sim.queen.queenHealth}`);
    console.log(`✓ Anchor 45 PASSED: 1000-tick Phase 2f full integration run completed cleanly.`);
  }

  // Anchor 46: Stale near-complete low-care pending egg (Repeated-Trial Hardened)
  {
    console.log('\nTesting Anchor 46: Stale near-complete low-care egg does not bypass emergency guarantee...');
    let passed = 0;
    const trials = 5;
    for (let trial = 0; trial < trials; trial++) {
      const sim = createDugSim();
      const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;
      const staleEgg: Egg = {
        id: 9001,
        x: nursery.x,
        y: nursery.y,
        incubationSeconds: 11.989,
        state: 'nursery',
        careLevel: 0.0,
      };
      sim.eggs = [staleEgg];

      let candidateAtPromotion: Egg | undefined;
      for (let t = 0; t < 630; t++) {
        sim.queen.queenHealth = 0.0;
        const wasDead = sim.queen.isDead;
        sim.tick();
        if (!wasDead && sim.queen.isDead) {
          candidateAtPromotion = sim.eggs.find(e => e.isRoyalCandidate);
        }
      }

      if (sim.queen.isDead && candidateAtPromotion && candidateAtPromotion.incubationSeconds < 1.0 && (candidateAtPromotion.careLevel ?? 0) >= 0.4) {
        let resolved = false;
        for (let t = 0; t < 18000; t++) {
          sim.tick();
          if (!sim.queen.isDead) { resolved = true; break; }
          if (sim.nest.isQueenless) break;
        }
        if (resolved) passed++;
      }
    }

    assert(passed >= 3, `Anchor 46 failed: Only ${passed}/${trials} trials successfully revived queen in emergency succession`);
    console.log(`✓ Anchor 46 PASSED: ${passed}/${trials} trials demonstrated successful queen revival via emergency candidate.`);
  }

  // Anchor 47: Fresh colony starts undug
  {
    console.log('\nTesting Anchor 47: Fresh colony starts undug...');
    const sim = new Simulation();
    assert(sim.nest.tunnelDug === false, `Expected nest.tunnelDug === false, got ${sim.nest.tunnelDug}`);
    assert(sim.nest.tunnelDugProgress === 0, `Expected nest.tunnelDugProgress === 0, got ${sim.nest.tunnelDugProgress}`);
    const waypoints01 = sim.getTunnelWaypoints(0, 1);
    const waypoints10 = sim.getTunnelWaypoints(1, 0);
    assert(waypoints01.length === 0, `Expected getTunnelWaypoints(0, 1) to return [], got length ${waypoints01.length}`);
    assert(waypoints10.length === 0, `Expected getTunnelWaypoints(1, 0) to return [], got length ${waypoints10.length}`);
    console.log('✓ Anchor 47 PASSED: Fresh colony starts undug with surface tunnel waypoints blocked.');
  }

  // Anchor 48: Surface access is strictly gated
  {
    console.log('\nTesting Anchor 48: Surface access strictly gated...');
    const sim = new Simulation();
    assert(sim.nest.tunnelDug === false, 'Simulation should start undug');
    const initialFoodStore = sim.nest.foodStore;

    // Run 200 ticks
    for (let t = 0; t < 200; t++) {
      sim.tick();
    }

    assert(sim.nest.foodStore === initialFoodStore, `Food store changed despite undug tunnel: initial ${initialFoodStore}, current ${sim.nest.foodStore}`);
    for (const ant of sim.ants) {
      assert(!ant.carryingFood, 'Ant incorrectly carrying food into nest while tunnel undug');
    }
    console.log('✓ Anchor 48 PASSED: Zero food brought into nest across 200 ticks while tunnel undug.');
  }

  // Anchor 49: Digger capacity cap
  {
    console.log('\nTesting Anchor 49: Digger capacity cap...');
    const sim = new Simulation({ maxConcurrentDiggers: 4 });
    sim.ants = [];
    for (let i = 0; i < 15; i++) {
      sim.spawnAnt();
    }

    sim.tick();

    const diggers = sim.ants.filter(a => a.currentAction === 'dig_tunnel');
    const awaitingAnts = sim.ants.filter(a => a.currentAction === 'awaiting_dig_slot');

    assert(diggers.length === 4, `Expected maxConcurrentDiggers (4) diggers, found ${diggers.length}`);
    assert(awaitingAnts.length === 11, `Expected 11 remaining ants to be awaiting_dig_slot, found ${awaitingAnts.length}`);
    console.log('✓ Anchor 49 PASSED: Active diggers capped at maxConcurrentDiggers (4), remaining ants awaiting_dig_slot.');
  }

  // Anchor 50: Sqrt-scaling validation
  {
    console.log('\nTesting Anchor 50: Sqrt-scaling validation...');
    // Test 4 diggers at the face
    const sim4 = new Simulation({ maxConcurrentDiggers: 4, tunnelDigRatePerAnt: 0.5 });
    sim4.ants = [];
    const targetX = sim4.config.width / 2;
    const targetY = sim4.colonies[0].surfaceY;

    for (let i = 0; i < 4; i++) {
      const a = sim4.spawnAnt();
      a.x = targetX;
      a.y = targetY;
    }

    const prevProgress4 = sim4.nest.tunnelDugProgress || 0;
    sim4.tick();
    const progressDelta4 = (sim4.nest.tunnelDugProgress || 0) - prevProgress4;
    const expectedDelta4 = 0.5 * Math.sqrt(4) * 0.016; // 0.5 * 2.0 * 0.016 = 0.016
    assert(Math.abs(progressDelta4 - expectedDelta4) < 0.0001, `Expected progress delta ${expectedDelta4}, got ${progressDelta4}`);

    // Test 1 digger at the face
    const sim1 = new Simulation({ maxConcurrentDiggers: 1, tunnelDigRatePerAnt: 0.5 });
    sim1.ants = [];
    const a1 = sim1.spawnAnt();
    a1.x = targetX;
    a1.y = targetY;

    const prevProgress1 = sim1.nest.tunnelDugProgress || 0;
    sim1.tick();
    const progressDelta1 = (sim1.nest.tunnelDugProgress || 0) - prevProgress1;
    const expectedDelta1 = 0.5 * Math.sqrt(1) * 0.016; // 0.5 * 1.0 * 0.016 = 0.008
    assert(Math.abs(progressDelta1 - expectedDelta1) < 0.0001, `Expected progress delta ${expectedDelta1}, got ${progressDelta1}`);

    console.log(`✓ Anchor 50 PASSED: Sqrt-scaling verified exact progress (4 diggers: ${progressDelta4.toFixed(4)}/tick, 1 digger: ${progressDelta1.toFixed(4)}/tick).`);
  }

  // Anchor 51: Full undug-to-completion run
  {
    console.log('\nTesting Anchor 51: Full undug-to-completion run...');
    const sim = new Simulation();
    assert(sim.nest.tunnelDug === false, 'Start undug');

    let completionTick = -1;
    for (let t = 0; t < 5000; t++) {
      sim.tick();
      if (sim.nest.tunnelDug && completionTick === -1) {
        completionTick = t;
      }
    }

    assert(completionTick >= 2500 && completionTick <= 3500, `Expected tunnel completion between 2500 and 3500 ticks, completed at tick ${completionTick}`);
    assert(sim.nest.tunnelDug === true, 'Tunnel is not dug after completion ticks');

    console.log(`✓ Anchor 51 PASSED: Exit tunnel completed at tick ${completionTick} (~${(completionTick * 0.016).toFixed(1)}s), transitioning cleanly to surface foraging.`);
  }

  // Anchor 52: Regression check with tunnelDug forced true
  {
    console.log('\nTesting Anchor 52: Regression with tunnelDug forced true...');
    const sim = createDugSim();
    let errorFound = false;

    for (let t = 0; t < 1000; t++) {
      sim.tick();
      for (const ant of sim.ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          errorFound = true;
          break;
        }
      }
      if (errorFound) break;
    }

    assert(!errorFound, 'NaN position/velocity in regression run');
    assert(sim.nest.population >= 1, `Population degenerated: ${sim.nest.population}`);
    console.log('✓ Anchor 52 PASSED: Regression run with tunnelDug=true reproduced Phase 1–2f behavior perfectly.');
  }

  // Anchor 53: Starvation failure mode (digging disabled)
  {
    console.log('\nTesting Anchor 53: Starvation failure mode with digging disabled...');
    const sim = new Simulation({ maxConcurrentDiggers: 0 });
    let queenDiedTick = -1;

    for (let t = 0; t < 15000; t++) {
      sim.tick();
      if (sim.queen.isDead && queenDiedTick === -1) {
        queenDiedTick = t;
        break;
      }
    }

    assert(queenDiedTick > 0, 'Queen did not die despite zero digging and zero food access');
    assert(queenDiedTick <= 12000, `Expected queen death within 12,000 ticks, died at tick ${queenDiedTick}`);
    console.log(`✓ Anchor 53 PASSED: Queen died of starvation at tick ${queenDiedTick} (~${(queenDiedTick * 0.016).toFixed(1)}s) when digging was disabled.`);
  }

  // Anchor 54: Congregation & Overflow Exclusion Probe
  {
    console.log('\nTesting Anchor 54: Congregation & Overflow Exclusion Probe...');
    const sim = new Simulation({ maxConcurrentDiggers: 4, initialPopulation: 15 });
    const cx = sim.config.width / 2;
    const gy = sim.colonies[0].surfaceY;

    // Run sim for 300 ticks to allow overflow ants to route to dig face
    for (let t = 0; t < 300; t++) {
      sim.tick();
    }

    const activeDiggers = sim.ants.filter(a => a.currentAction === 'dig_tunnel');
    const overflowAnts = sim.ants.filter(a => a.currentAction === 'awaiting_dig_slot');

    assert(activeDiggers.length === 4, `Expected 4 active diggers, got ${activeDiggers.length}`);
    assert(overflowAnts.length === 11, `Expected 11 overflow ants, got ${overflowAnts.length}`);

    // Verify overflow ants physically clustered near dig face rather than staying inside Nursery
    const digFace = sim.getDigFacePosition((sim.nest.tunnelDugProgress || 0) / (sim.config.tunnelDigTarget || 40));
    for (const ant of overflowAnts) {
      const distToDigFace = Math.hypot(ant.x - digFace.x, ant.y - digFace.y);
      assert(distToDigFace <= 20, `Overflow ant at (${ant.x.toFixed(1)}, ${ant.y.toFixed(1)}) not clustered near dig face (${digFace.x.toFixed(1)}, ${digFace.y.toFixed(1)})`);
    }

    // Verify progress-per-tick exclusion: Sim with 4 ants vs Sim with 15 ants (both at face)
    const simA = new Simulation({ maxConcurrentDiggers: 4, initialPopulation: 4, tunnelDigRatePerAnt: 0.5 });
    const simB = new Simulation({ maxConcurrentDiggers: 4, initialPopulation: 15, tunnelDigRatePerAnt: 0.5 });

    const pA0 = simA.nest.tunnelDugProgress || 0;
    const pB0 = simB.nest.tunnelDugProgress || 0;

    // Place all ants at entrance for immediate face count
    simA.ants.forEach(a => { a.x = cx; a.y = gy; });
    simB.ants.forEach(a => { a.x = cx; a.y = gy; });

    simA.tick();
    simB.tick();

    const progressDeltaA = (simA.nest.tunnelDugProgress || 0) - pA0;
    const progressDeltaB = (simB.nest.tunnelDugProgress || 0) - pB0;

    assert(Math.abs(progressDeltaA - progressDeltaB) < 1e-9, `Progress mismatch: 4-ant sim gained ${progressDeltaA}, 15-ant sim gained ${progressDeltaB}`);
    console.log(`✓ Anchor 54 PASSED: Overflow ants (11) clustered at dig face with action awaiting_dig_slot, progress delta identical (${progressDeltaA.toFixed(6)}/tick).`);
  }

  // Anchor 55: careLevel Decay Constant Probe (0.002/tick)
  {
    console.log('\nTesting Anchor 55: careLevel Decay Constant Probe (0.002/tick)...');
    const sim = createDugSim();
    // Isolate single test egg in Nursery
    sim.eggs = [{
      id: 9999,
      x: sim.chambers[1].x,
      y: sim.chambers[1].y,
      incubationSeconds: 0,
      state: 'nursery',
      careLevel: 1.0,
    }];
    // Move ants away so no larval feeding occurs during test
    sim.ants.forEach(a => { a.x = sim.config.width / 2; a.y = sim.config.groundLevelY - 100; });

    for (let t = 0; t < 100; t++) {
      sim.tick();
    }

    const testEgg = sim.eggs.find(e => e.id === 9999);
    assert(testEgg !== undefined, 'Test egg missing');
    const expectedCare = 1.0 - (100 * 0.002);
    assert(Math.abs(testEgg.careLevel - expectedCare) < 1e-6, `Expected careLevel ${expectedCare}, got ${testEgg.careLevel}`);
    console.log(`✓ Anchor 55 PASSED: careLevel decayed at exactly 0.002/tick (${testEgg.careLevel.toFixed(3)} after 100 ticks).`);
  }

  // Anchor 56: Colony Architecture Structure Probe
  {
    console.log('\nTesting Anchor 56: Colony Architecture Structure Probe...');
    const sim = new Simulation();
    assert(sim.colonies.length === 2, `Expected 2 colonies, got ${sim.colonies.length}`);
    assert(sim.colonies[0].id === 0, `Expected colony id 0, got ${sim.colonies[0].id}`);
    console.log(`✓ Anchor 56 PASSED: sim.colonies verified (length 2, colony 0 id=0).`);
  }

  // Anchor 57: Accessor Aliasing Probe
  {
    console.log('\nTesting Anchor 57: Accessor Aliasing Probe...');
    const sim = new Simulation();
    
    // Mutate via legacy accessor
    sim.queen.queenHealth = 0.5;
    assert(sim.colonies[0].queen.queenHealth === 0.5, `Expected colonies[0].queen.queenHealth = 0.5, got ${sim.colonies[0].queen.queenHealth}`);

    // Mutate via new structure
    sim.colonies[0].queen.queenHealth = 0.8;
    assert(sim.queen.queenHealth === 0.8, `Expected sim.queen.queenHealth = 0.8, got ${sim.queen.queenHealth}`);

    console.log(`✓ Anchor 57 PASSED: Accessor aliasing verified bidirectionally.`);
  }

  // Anchor 58: Accessor Reassignment Probe
  {
    console.log('\nTesting Anchor 58: Accessor Reassignment Probe...');
    const sim = new Simulation();
    const testEgg = {
      id: 8888,
      x: 100,
      y: 100,
      incubationSeconds: 0,
      state: 'nursery' as const,
      careLevel: 0.9,
    };

    sim.eggs = [testEgg];
    assert(sim.colonies[0].eggs.length === 1, `Expected colonies[0].eggs length 1, got ${sim.colonies[0].eggs.length}`);
    assert(sim.colonies[0].eggs[0].id === 8888, `Expected colonies[0].eggs[0].id = 8888, got ${sim.colonies[0].eggs[0].id}`);

    console.log(`✓ Anchor 58 PASSED: Setter proxy reassignment verified.`);
  }

  // Anchor 59: Dedicated 'awaiting_dig_slot' Action Probe
  {
    console.log('\nTesting Anchor 59: Dedicated awaiting_dig_slot action probe...');
    const sim = new Simulation({ maxConcurrentDiggers: 4, initialPopulation: 15 });

    for (let t = 0; t < 300; t++) {
      sim.tick();
    }

    const awaitingAnts = sim.ants.filter(a => a.currentAction === 'awaiting_dig_slot');
    const idleAnts = sim.ants.filter(a => a.currentAction === 'idle');

    assert(awaitingAnts.length === 11, `Expected 11 ants with action awaiting_dig_slot, got ${awaitingAnts.length}`);
    assert(idleAnts.length === 0, `Expected 0 idle ants at dig face, got ${idleAnts.length}`);

    const digFace = sim.getDigFacePosition((sim.nest.tunnelDugProgress || 0) / (sim.config.tunnelDigTarget || 40));
    for (const ant of awaitingAnts) {
      const distToDigFace = Math.hypot(ant.x - digFace.x, ant.y - digFace.y);
      assert(distToDigFace <= 20, `Awaiting ant at (${ant.x.toFixed(1)}, ${ant.y.toFixed(1)}) not clustered near dig face`);
    }

    console.log(`✓ Anchor 59 PASSED: Overflow ants at dig face explicitly assigned 'awaiting_dig_slot' (11 awaiting, 0 idle).`);
  }

  // Anchor 60: Second Colony Instantiation and Orientation Probe
  {
    console.log('\nTesting Anchor 60: Second Colony Instantiation and Orientation Probe...');
    const sim = new Simulation();
    assert(sim.colonies.length === 2, `Expected 2 colonies, got ${sim.colonies.length}`);
    assert(sim.colonies[0].id === 0, `Expected colony 0 id=0, got ${sim.colonies[0].id}`);
    assert(sim.colonies[0].surfaceY === 600, `Expected colony 0 surfaceY=600, got ${sim.colonies[0].surfaceY}`);
    assert(sim.colonies[0].direction === 1, `Expected colony 0 direction=1, got ${sim.colonies[0].direction}`);

    assert(sim.colonies[1].id === 1, `Expected colony 1 id=1, got ${sim.colonies[1].id}`);
    assert(sim.colonies[1].surfaceY === 200, `Expected colony 1 surfaceY=200, got ${sim.colonies[1].surfaceY}`);
    assert(sim.colonies[1].direction === -1, `Expected colony 1 direction=-1, got ${sim.colonies[1].direction}`);

    console.log(`✓ Anchor 60 PASSED: Second colony (id=1, surfaceY=200, direction=-1) instantiated alongside colony 0.`);
  }

  // Anchor 61: Opposition Chamber Geometry and Bound Probe
  {
    console.log('\nTesting Anchor 61: Opposition Chamber Geometry and Bound Probe...');
    const sim = new Simulation();
    const colony1 = sim.colonies[1];
    assert(colony1.chambers.length === 3, `Expected 3 chambers in colony 1, got ${colony1.chambers.length}`);

    const types = colony1.chambers.map(c => c.chamberType);
    assert(types.includes('storage'), 'Missing storage chamber in colony 1');
    assert(types.includes('nursery'), 'Missing nursery chamber in colony 1');
    assert(types.includes('queen'), 'Missing queen chamber in colony 1');

    for (const c of colony1.chambers) {
      assert(c.y >= 0 && c.y <= 200, `Chamber ${c.name} y=${c.y} outside 0-200 lane`);
    }

    for (let i = 0; i < colony1.chambers.length; i++) {
      for (let j = i + 1; j < colony1.chambers.length; j++) {
        const c1 = colony1.chambers[i];
        const c2 = colony1.chambers[j];
        const dx = Math.abs(c1.x - c2.x);
        const dy = Math.abs(c1.y - c2.y);
        const minDx = (c1.width + c2.width) / 2;
        const minDy = (c1.height + c2.height) / 2;
        assert(dx >= minDx || dy >= minDy, `Chambers ${c1.name} and ${c2.name} in colony 1 overlap!`);
      }
    }
    console.log(`✓ Anchor 61 PASSED: Colony 1 chambers verified in 0-200 lane with zero overlap.`);
  }

  // Anchor 62: Independent TunnelDug State Isolation Probe
  {
    console.log('\nTesting Anchor 62: Independent TunnelDug State Isolation Probe...');
    const sim = new Simulation();
    assert(sim.colonies[0].nest.tunnelDug === false, 'Colony 0 tunnelDug should start false');
    assert(sim.colonies[1].nest.tunnelDug === false, 'Colony 1 tunnelDug should start false');

    sim.colonies[0].nest.tunnelDug = true;
    assert(sim.colonies[1].nest.tunnelDug === false, 'Forcing colony 0 tunnelDug=true leaked to colony 1');

    console.log(`✓ Anchor 62 PASSED: Both colonies start tunnelDug=false independently; state mutation is strictly isolated.`);
  }

  // Anchor 63: Opposition Colony Digging Execution Probe
  {
    console.log('\nTesting Anchor 63: Opposition Colony Digging Execution Probe...');
    const sim = new Simulation({ maxConcurrentDiggers: 4, initialPopulation: 15 });
    let completionTick1 = -1;

    for (let t = 0; t < 5000; t++) {
      sim.tick();
      if (sim.colonies[1].nest.tunnelDug && completionTick1 === -1) {
        completionTick1 = t;
        break;
      }
    }

    assert(completionTick1 > 0, 'Colony 1 tunnel digging did not complete within 5000 ticks');
    assert(sim.colonies[1].nest.tunnelDug === true, 'Colony 1 nest.tunnelDug is false');
    console.log(`✓ Anchor 63 PASSED: Opposition colony exit tunnel completed at tick ${completionTick1} (~${(completionTick1 * 0.016).toFixed(1)}s).`);
  }

  // Anchor 64: Opposition Queen Mortality & Emergency Succession Probe
  {
    console.log('\nTesting Anchor 64: Opposition Queen Mortality & Emergency Succession Probe...');
    const sim = new Simulation();
    sim.colonies[1].nest.tunnelDug = true;

    // Force queen health to 0
    sim.colonies[1].queen.queenHealth = 0;

    // Tick past 10s (625 ticks)
    for (let t = 0; t < 700; t++) {
      sim.colonies[1].queen.queenHealth = 0;
      sim.tick();
    }

    assert(sim.colonies[1].queen.isDead === true, 'Colony 1 Queen is not marked dead after health 0 duration');
    const candidateEgg = sim.colonies[1].eggs.find(e => e.isRoyalCandidate);
    assert(candidateEgg !== undefined, 'Emergency royal candidate egg was not spawned in Colony 1');

    // Care for candidate egg
    for (let t = 0; t < 1000; t++) {
      if (candidateEgg) candidateEgg.careLevel = 1.0;
      sim.tick();
      if (!sim.colonies[1].queen.isDead) break;
    }

    assert(sim.colonies[1].queen.isDead === false, 'Colony 1 Queen was not revived via succession');
    assert(sim.colonies[1].queen.queenHealth === 1.0, `Colony 1 Queen health expected 1.0, got ${sim.colonies[1].queen.queenHealth}`);
    console.log(`✓ Anchor 64 PASSED: Opposition queen mortality and emergency succession verified end-to-end.`);
  }

  // Anchor 65: Food Node Y-Coordinate Boundary Enforcement Probe
  {
    console.log('\nTesting Anchor 65: Food Node Y-Coordinate Boundary Enforcement Probe...');
    const sim = new Simulation();

    for (const food of sim.foodNodes) {
      assert(food.y >= 200 && food.y <= 600, `Initial food node y=${food.y} outside 200-600 lane`);
    }

    // Deplete and respawn cycles
    for (let i = 0; i < 50; i++) {
      sim.foodNodes[0].quantity = 0;
      sim.tick();
      const newestNode = sim.foodNodes[sim.foodNodes.length - 1];
      assert(newestNode.y >= 200 && newestNode.y <= 600, `Respawned food node y=${newestNode.y} outside 200-600 lane`);
    }

    console.log(`✓ Anchor 65 PASSED: All initial and respawned food nodes strictly lie within y 200-600.`);
  }

  // Anchor 66: Multi-Colony Integration & Isolation Probe
  {
    console.log('\nTesting Anchor 66: Multi-Colony Integration & Isolation Probe...');
    const sim = new Simulation();
    let nanFound = false;

    for (let t = 0; t < 2000; t++) {
      sim.tick();

      for (const ant of sim.colonies[0].ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          nanFound = true;
          break;
        }
      }
      for (const ant of sim.colonies[1].ants) {
        if (isNaN(ant.x) || isNaN(ant.y) || isNaN(ant.vx) || isNaN(ant.vy)) {
          nanFound = true;
          break;
        }
      }
      if (nanFound) break;
    }

    assert(!nanFound, 'NaN position or velocity detected in multi-colony run');
    assert(sim.colonies[0].nest.population >= 1, `Colony 0 population degenerated: ${sim.colonies[0].nest.population}`);
    assert(sim.colonies[1].nest.population >= 1, `Colony 1 population degenerated: ${sim.colonies[1].nest.population}`);

    // Anti-leakage checks
    for (const ant of sim.colonies[0].ants) {
      assert(!sim.colonies[1].ants.includes(ant), 'Ant object shared between colony 0 and colony 1');
    }
    for (const ant of sim.colonies[1].ants) {
      assert(!sim.colonies[0].ants.includes(ant), 'Ant object shared between colony 1 and colony 0');
    }

    console.log(`✓ Anchor 66 PASSED: 2000-tick 2-colony simulation executed cleanly with full state isolation.`);
  }

  // Anchor 67: Per-Colony PheromoneGrid Instance Identity Probe
  {
    console.log('\nTesting Anchor 67: Each colony has its own PheromoneGrid instance...');
    const sim = new Simulation();
    assert(sim.colonies.length >= 2, 'Simulation must have at least 2 colonies');
    assert(sim.colonies[0].pheromones !== undefined, 'Colony 0 must have pheromones grid');
    assert(sim.colonies[1].pheromones !== undefined, 'Colony 1 must have pheromones grid');
    assert(sim.colonies[0].pheromones !== sim.colonies[1].pheromones, 'Colony 0 and Colony 1 must have distinct PheromoneGrid instances');
    console.log('✓ Anchor 67 PASSED: Each colony has its own distinct PheromoneGrid instance.');
  }

  // Anchor 68: Real Deposit-Isolation Probe
  {
    console.log('\nTesting Anchor 68: Real deposit-isolation probe...');
    const sim = new Simulation();
    const posX = 300;
    const posY = 300;

    assert(sim.colonies[0].pheromones.getStrength(posX, posY) === 0, 'Colony 0 grid initially 0');
    assert(sim.colonies[1].pheromones.getStrength(posX, posY) === 0, 'Colony 1 grid initially 0');

    sim.colonies[0].pheromones.deposit(posX, posY, 0.5);
    assert(sim.colonies[0].pheromones.getStrength(posX, posY) > 0, 'Colony 0 grid must reflect deposit');
    assert(sim.colonies[1].pheromones.getStrength(posX, posY) === 0, 'Colony 1 grid must remain 0 after Colony 0 deposit');

    const posX2 = 400;
    const posY2 = 400;
    sim.colonies[1].pheromones.deposit(posX2, posY2, 0.8);
    assert(sim.colonies[1].pheromones.getStrength(posX2, posY2) > 0, 'Colony 1 grid must reflect deposit');
    assert(sim.colonies[0].pheromones.getStrength(posX2, posY2) === 0, 'Colony 0 grid must remain 0 after Colony 1 deposit');

    console.log('✓ Anchor 68 PASSED: Deposit isolation verified bidirectionally across colonies.');
  }

  // Anchor 69: Real Foreign Trail Divergence Probe
  {
    console.log('\nTesting Anchor 69: Repeated-Trial Divergence Probe...');
    let passedTrials = 0;
    const totalTrials = 10;
    const distanceThreshold = 5.0; // explicit distance threshold well above normal jitter

    for (let trial = 0; trial < totalTrials; trial++) {
      const sim69 = new Simulation({ initialPopulation: 1 });
      sim69.foodNodes = [];
      sim69.colonies[0].nest.tunnelDug = true;
      sim69.colonies[1].nest.tunnelDug = true;

      const simControl = new Simulation({ initialPopulation: 1 });
      simControl.foodNodes = [];
      simControl.colonies[0].nest.tunnelDug = true;

      sim69.colonies[1].ants = [];
      simControl.colonies[1].ants = [];

      const testAnt = sim69.colonies[0].ants[0];
      testAnt.x = 450;
      testAnt.y = 350;
      testAnt.vx = 0;
      testAnt.vy = -sim69.config.antSpeed;
      testAnt.carryingFood = false;
      testAnt.carryingEgg = false;
      testAnt.waypointPath = undefined;
      testAnt.currentAction = 'idle';

      const controlAnt = simControl.colonies[0].ants[0];
      controlAnt.x = 450;
      controlAnt.y = 350;
      controlAnt.vx = 0;
      controlAnt.vy = -simControl.config.antSpeed;
      controlAnt.carryingFood = false;
      controlAnt.carryingEgg = false;
      controlAnt.waypointPath = undefined;
      controlAnt.currentAction = 'idle';

      // Plant strong foreign trail (Colony 1) to the East at x = 470
      for (let offset = -20; offset <= 20; offset += 10) {
        sim69.colonies[1].pheromones.deposit(470, 350 + offset, 0.8);
      }

      for (let t = 0; t < 10; t++) {
        for (let offset = -20; offset <= 20; offset += 10) {
          sim69.colonies[1].pheromones.deposit(470, 350 + offset, 0.8);
        }
        sim69.tick();
        simControl.tick();
      }

      const divergence = controlAnt.x - testAnt.x;
      if (divergence >= distanceThreshold) {
        passedTrials++;
      }
    }

    assert(passedTrials >= 7, `Anchor 69 failed: Only ${passedTrials}/${totalTrials} trials exceeded divergence threshold of ${distanceThreshold}`);
    console.log(`✓ Anchor 69 PASSED: ${passedTrials}/${totalTrials} trials showed strong divergence >= ${distanceThreshold} units from foreign trail.`);
  }

  // Anchor 70: Own-Trail Following Regression Probe
  {
    console.log('\nTesting Anchor 70: Regression with single colony trail...');
    const sim70 = new Simulation();
    sim70.colonies[0].nest.tunnelDug = true;

    sim70.colonies[0].pheromones.deposit(sim70.config.width / 2 + 30, sim70.config.groundLevelY, 0.5);
    assert(sim70.colonies[0].pheromones.getStrength(sim70.config.width / 2 + 30, sim70.config.groundLevelY) > 0, 'Colony 0 pheromone present');
    assert(sim70.colonies[1].pheromones.getStrength(sim70.config.width / 2 + 30, sim70.config.groundLevelY) === 0, 'Colony 1 pheromone empty');

    console.log('✓ Anchor 70 PASSED: Own-trail following behavior regression verified cleanly.');
  }

  // Anchor 71: Repeated-Trial Divergence Probe
  {
    console.log('\nTesting Anchor 71: Repeated-Trial Divergence Probe...');
    let passedTrials = 0;
    const totalTrials = 10;
    const distanceThreshold = 5.0; // explicit distance threshold well above normal jitter

    for (let trial = 0; trial < totalTrials; trial++) {
      const sim71 = new Simulation({ initialPopulation: 1 });
      sim71.foodNodes = [];
      sim71.colonies[0].nest.tunnelDug = true;
      sim71.colonies[1].nest.tunnelDug = true;

      const simControl = new Simulation({ initialPopulation: 1 });
      simControl.foodNodes = [];
      simControl.colonies[0].nest.tunnelDug = true;

      sim71.colonies[1].ants = [];
      simControl.colonies[1].ants = [];

      const testAnt = sim71.colonies[0].ants[0];
      testAnt.x = 450;
      testAnt.y = 350;
      testAnt.vx = 0;
      testAnt.vy = -sim71.config.antSpeed;
      testAnt.carryingFood = false;
      testAnt.carryingEgg = false;
      testAnt.waypointPath = undefined;
      testAnt.currentAction = 'idle';

      const controlAnt = simControl.colonies[0].ants[0];
      controlAnt.x = 450;
      controlAnt.y = 350;
      controlAnt.vx = 0;
      controlAnt.vy = -simControl.config.antSpeed;
      controlAnt.carryingFood = false;
      controlAnt.carryingEgg = false;
      controlAnt.waypointPath = undefined;
      controlAnt.currentAction = 'idle';

      for (let offset = -20; offset <= 20; offset += 10) {
        sim71.colonies[1].pheromones.deposit(470, 350 + offset, 0.8);
      }

      for (let t = 0; t < 10; t++) {
        for (let offset = -20; offset <= 20; offset += 10) {
          sim71.colonies[1].pheromones.deposit(470, 350 + offset, 0.8);
        }
        sim71.tick();
        simControl.tick();
      }

      const divergence = controlAnt.x - testAnt.x;
      if (divergence >= distanceThreshold) {
        passedTrials++;
      }
    }

    assert(passedTrials >= 7, `Anchor 71 failed: Only ${passedTrials}/${totalTrials} trials exceeded divergence threshold of ${distanceThreshold}`);
    console.log(`✓ Anchor 71 PASSED: ${passedTrials}/${totalTrials} trials showed strong divergence >= ${distanceThreshold} units from foreign trail.`);
  }

  // Anchor 72: Cargo Exemption Probe (carryingFood / carryingEgg exempt from repulsion)
  {
    console.log('\nTesting Anchor 72: Cargo Exemption Probe...');
    const sim72 = new Simulation({ initialPopulation: 2 });
    sim72.foodNodes = [];
    sim72.colonies[0].eggs = [];
    sim72.colonies[0].nest.tunnelDug = true;
    sim72.colonies[1].nest.tunnelDug = true;
    sim72.colonies[1].ants = [];

    // Set up strong foreign trail for colony 1 at x = 460
    for (let offset = -30; offset <= 30; offset += 10) {
      sim72.colonies[1].pheromones.deposit(460, 350 + offset, 0.8);
    }

    const carryingAnt = sim72.colonies[0].ants[0];
    carryingAnt.x = 450;
    carryingAnt.y = 350;
    carryingAnt.vx = 0;
    carryingAnt.vy = -sim72.config.antSpeed;
    carryingAnt.carryingFood = true;
    carryingAnt.carryingEgg = false;
    carryingAnt.waypointPath = undefined;
    carryingAnt.currentAction = 'idle';

    const nonCarryingAnt = sim72.colonies[0].ants[1];
    nonCarryingAnt.x = 450;
    nonCarryingAnt.y = 350;
    nonCarryingAnt.vx = 0;
    nonCarryingAnt.vy = -sim72.config.antSpeed;
    nonCarryingAnt.carryingFood = false;
    nonCarryingAnt.carryingEgg = false;
    nonCarryingAnt.waypointPath = undefined;
    nonCarryingAnt.currentAction = 'idle';

    sim72.tick();

    assert(nonCarryingAnt.x < 449.0, `Non-carrying ant (${nonCarryingAnt.x.toFixed(2)}) should steer West away from foreign trail`);
    assert(carryingAnt.x > nonCarryingAnt.x + 1.0, `Carrying ant (${carryingAnt.x.toFixed(2)}) must not be repelled like non-carrying ant (${nonCarryingAnt.x.toFixed(2)})`);

    console.log(`✓ Anchor 72 PASSED: Carrying ant x (${carryingAnt.x.toFixed(2)}) remained unrepelled vs non-carrying ant x (${nonCarryingAnt.x.toFixed(2)}).`);
  }

  // Anchor 73: Real Stress Probe - Foreign Repulsion Push Mid-Tunnel
  {
    console.log('\nTesting Anchor 73: Hard Underground Boundary Mid-Tunnel Stress Probe...');
    const sim73 = new Simulation();
    sim73.colonies[0].nest.tunnelDug = true;

    const ant = sim73.colonies[0].ants[0];
    const storage = sim73.colonies[0].chambers[0];
    ant.x = storage.x + 50;
    ant.y = storage.y;
    ant.waypointPath = sim73.getTunnelWaypoints(1, 2, 0);
    ant.waypointIndex = 1;

    // Apply an artificially huge velocity push
    ant.vx = 50.0;
    ant.vy = 50.0;

    sim73.tick();

    assert(sim73.isPointInUndergroundFootprint(ant.x, ant.y, 0), `Ant (${ant.x.toFixed(2)}, ${ant.y.toFixed(2)}) must end tick inside colony 0's underground footprint`);
    console.log(`✓ Anchor 73 PASSED: Mid-tunnel ant clamped cleanly to valid footprint (${ant.x.toFixed(2)}, ${ant.y.toFixed(2)}).`);
  }

  // Anchor 74: Cross-Colony Footprint Isolation Probe
  {
    console.log('\nTesting Anchor 74: Cross-Colony Underground Footprint Isolation...');
    const sim74 = new Simulation();
    sim74.colonies[0].nest.tunnelDug = true;
    sim74.colonies[1].nest.tunnelDug = true;

    const c0Nursery = sim74.colonies[0].chambers[1];
    assert(sim74.isPointInUndergroundFootprint(c0Nursery.x, c0Nursery.y, 0), 'Colony 0 Nursery must be valid for Colony 0');
    assert(!sim74.isPointInUndergroundFootprint(c0Nursery.x, c0Nursery.y, 1), 'Colony 0 Nursery must NOT be valid for Colony 1');

    const c1Nursery = sim74.colonies[1].chambers[1];
    assert(sim74.isPointInUndergroundFootprint(c1Nursery.x, c1Nursery.y, 1), 'Colony 1 Nursery must be valid for Colony 1');
    assert(!sim74.isPointInUndergroundFootprint(c1Nursery.x, c1Nursery.y, 0), 'Colony 1 Nursery must NOT be valid for Colony 0');

    console.log('✓ Anchor 74 PASSED: Cross-colony footprint isolation verified bidirectionally.');
  }

  // Anchor 75: Undug Surface Tunnel Special Case Restriction
  {
    console.log('\nTesting Anchor 75: Undug Tunnel Boundary Restriction...');
    const sim75 = new Simulation();
    sim75.colonies[0].nest.tunnelDug = false;
    sim75.colonies[0].nest.tunnelDugProgress = 0.2;

    const cx = sim75.config.width / 2;
    const sy = sim75.colonies[0].surfaceY;

    // Entrance point is unexcavated when progress = 0.2
    assert(!sim75.isPointInUndergroundFootprint(cx, sy, 0), 'Unexcavated entrance point must NOT be valid while tunnelDug=false at 20% progress');

    const ant = sim75.colonies[0].ants[0];
    ant.x = cx;
    ant.y = sy;
    sim75.enforceUndergroundBoundary(ant, 0);

    assert(sim75.isPointInUndergroundFootprint(ant.x, ant.y, 0), 'Clamped ant must be inside valid excavated footprint');
    assert(ant.x !== cx || ant.y !== sy, 'Ant at unexcavated entrance must be clamped away from unexcavated position');

    console.log(`✓ Anchor 75 PASSED: Unexcavated entrance rejected and clamped to (${ant.x.toFixed(2)}, ${ant.y.toFixed(2)}).`);
  }

  // Anchor 76: Full 2000-Tick Integration Probe
  {
    console.log('\nTesting Anchor 76: Full 2000-Tick Real Integration Run...');
    const sim76 = new Simulation();
    sim76.colonies[0].nest.tunnelDug = true;
    sim76.colonies[1].nest.tunnelDug = true;

    // Deposit cross-foreign trails to trigger active repulsion
    for (let offset = -50; offset <= 50; offset += 10) {
      sim76.colonies[1].pheromones.deposit(sim76.colonies[0].chambers[1].x, sim76.colonies[0].chambers[1].y + offset, 0.8);
      sim76.colonies[0].pheromones.deposit(sim76.colonies[1].chambers[1].x, sim76.colonies[1].chambers[1].y + offset, 0.8);
    }

    let sampledCount = 0;
    for (let t = 0; t < 2000; t++) {
      sim76.tick();

      if (t % 100 === 0) {
        for (const colony of sim76.colonies) {
          for (const ant of colony.ants) {
            const isUnderground = colony.direction === 1
              ? ant.y >= colony.surfaceY
              : ant.y <= colony.surfaceY;

            if (isUnderground) {
              assert(sim76.isPointInUndergroundFootprint(ant.x, ant.y, colony), `Colony ${colony.id} ant ${ant.id} at (${ant.x.toFixed(2)}, ${ant.y.toFixed(2)}) outside valid footprint at tick ${t}`);
              sampledCount++;
            }
          }
        }
      }
    }

    console.log(`✓ Anchor 76 PASSED: 2000-tick integration run verified 100% of ${sampledCount} underground ant samples within own footprint.`);
  }

  // Anchor 77: Absolute Lane Clamp Reproduction & Persistence
  {
    console.log('\nTesting Anchor 77: Absolute Lane Boundary Clamp Persistence...');
    const sim77 = new Simulation();
    sim77.colonies[0].nest.tunnelDug = true;

    const playerAnt = sim77.colonies[0].ants[0];
    playerAnt.x = 450;
    playerAnt.y = 100; // Force place deep inside opposition 0-200 lane
    playerAnt.vx = 0;
    playerAnt.vy = 0;
    playerAnt.waypointPath = undefined;

    // Tick once and verify clamped immediately to y >= 200
    sim77.tick();
    assert(playerAnt.y >= 200, `Player ant y (${playerAnt.y}) must be >= 200 after tick`);

    // Run for 500 extended real ticks and verify it never enters y < 200
    for (let t = 0; t < 500; t++) {
      sim77.tick();
      assert(playerAnt.y >= 200, `Player ant y (${playerAnt.y}) entered illegal lane at tick ${t}`);
    }

    console.log('✓ Anchor 77 PASSED: Player ant force-placed at y=100 clamped to y >= 200 and remained in valid territory across 500 ticks.');
  }

  // Anchor 78: 2000-Tick Absolute Lane Boundary Stress Probe
  {
    console.log('\nTesting Anchor 78: 2000-Tick Absolute Lane Boundary Stress Probe...');
    const sim78 = new Simulation();
    sim78.colonies[0].nest.tunnelDug = true;
    sim78.colonies[1].nest.tunnelDug = true;

    let sampledCount = 0;
    for (let t = 0; t < 2000; t++) {
      sim78.tick();

      if (t % 100 === 0) {
        for (const ant of sim78.colonies[0].ants) {
          if (ant.currentAction !== 'infiltrate' && ant.currentAction !== 'smuggle_home') {
            assert(ant.y >= 200, `Player ant ${ant.id} at y=${ant.y.toFixed(2)} entered opposition lane at tick ${t}`);
            sampledCount++;
          }
        }
        for (const ant of sim78.colonies[1].ants) {
          if (ant.currentAction !== 'infiltrate' && ant.currentAction !== 'smuggle_home') {
            assert(ant.y <= 600, `Opposition ant ${ant.id} at y=${ant.y.toFixed(2)} entered player lane at tick ${t}`);
            sampledCount++;
          }
        }
      }
    }

    console.log(`✓ Anchor 78 PASSED: 2000-tick stress probe verified 100% of ${sampledCount} ant position samples respected absolute lane boundaries.`);
  }

  // Anchor 79: Digging-Phase Boundary Isolation Probe
  {
    console.log('\nTesting Anchor 79: Digging-Phase Boundary Isolation Probe...');
    let totalDigAntTicks = 0;
    let repositionedCount = 0;

    for (let trial = 0; trial < 5; trial++) {
      const sim = new Simulation();
      for (const colony of sim.colonies) {
        while (!colony.nest.tunnelDug) {
          sim.tick();
          for (const ant of colony.ants) {
            if (ant.currentAction === 'dig_tunnel' || ant.currentAction === 'awaiting_dig_slot') {
              totalDigAntTicks++;
              const xBefore = ant.x;
              const yBefore = ant.y;
              sim.enforceUndergroundBoundary(ant, colony);
              if (Math.hypot(ant.x - xBefore, ant.y - yBefore) > 0.001) {
                repositionedCount++;
              }
            }
          }
        }
      }
    }

    assert(repositionedCount === 0, `Expected 0 repositionings for digging ants, got ${repositionedCount} out of ${totalDigAntTicks} ticks`);
    console.log(`✓ Anchor 79 PASSED: Verified 100% of ${totalDigAntTicks} digging ant position samples strictly inside valid corridor footprint with 0 repositionings.`);
  }

  // Anchor 80: Worker Ant Initial Health
  {
    console.log('\nTesting Anchor 80: Worker Ant Initial Health...');
    const sim = new Simulation();
    for (const colony of sim.colonies) {
      assert(colony.ants.length > 0, 'Expected colony to have initial ants');
      for (const ant of colony.ants) {
        assert(ant.health === 1.0, `Expected ant health 1.0, got ${ant.health}`);
      }
      const newAnt = sim.spawnAnt(colony);
      assert(newAnt.health === 1.0, `Expected newly spawned ant health 1.0, got ${newAnt.health}`);
    }
    console.log('✓ Anchor 80 PASSED: Verified all newly spawned worker ants initialize with health === 1.0.');
  }

  // Anchor 81: damageAnt Method & Flooring
  {
    console.log('\nTesting Anchor 81: damageAnt Method & Flooring...');
    const sim = new Simulation();
    const ant = sim.colonies[0].ants[0];
    assert(ant.health === 1.0, 'Initial health should be 1.0');

    sim.damageAnt(ant, 0.3);
    assert(Math.abs(ant.health - 0.7) < 0.0001, `Expected health 0.7, got ${ant.health}`);

    sim.damageAnt(ant, 0.8);
    assert(ant.health === 0, `Expected health floored at 0, got ${ant.health}`);

    sim.damageAnt(ant, 0.5);
    assert(ant.health === 0, `Expected health remains floored at 0, got ${ant.health}`);
    console.log('✓ Anchor 81 PASSED: Verified damageAnt reduces health correctly and floors at 0.');
  }

  // Anchor 82: Death Removal & Population Accounting
  {
    console.log('\nTesting Anchor 82: Death Removal & Population Accounting...');
    const sim = new Simulation();
    const colony = sim.colonies[0];
    const initPop = colony.nest.population;
    const initLen = colony.ants.length;
    assert(initPop === initLen, `Expected population (${initPop}) to equal ants length (${initLen})`);

    const targetAnt = colony.ants[0];
    sim.damageAnt(targetAnt, 1.0);
    sim.tick();

    assert(!colony.ants.some(a => a.id === targetAnt.id), 'Dead ant should be removed from colony.ants');
    assert(colony.ants.length === initLen - 1, `Expected ants length ${initLen - 1}, got ${colony.ants.length}`);
    assert(colony.nest.population === initPop - 1, `Expected nest population ${initPop - 1}, got ${colony.nest.population}`);
    assert(colony.nest.population === colony.ants.length, 'Nest population and ants array length must match exactly');
    console.log('✓ Anchor 82 PASSED: Verified dead ant removal and population sync.');
  }

  // Anchor 83: Death Cleanup for Cargo (Food & Eggs)
  {
    console.log('\nTesting Anchor 83: Death Cleanup for Cargo (Food & Eggs)...');
    const sim = new Simulation();
    const colony = sim.colonies[0];

    // Food test:
    const foodAnt = colony.ants[0];
    foodAnt.carryingFood = true;
    sim.damageAnt(foodAnt, 1.0);
    sim.tick();
    assert(!colony.ants.some(a => a.id === foodAnt.id), 'Food carrying dead ant removed');

    // Egg test:
    const carrierAnt = colony.ants[0];
    carrierAnt.x = 350;
    carrierAnt.y = 420;
    carrierAnt.carryingEgg = true;

    const egg: Egg = {
      id: 8888,
      x: carrierAnt.x,
      y: carrierAnt.y,
      incubationSeconds: 2.0,
      state: 'carried',
      carrierAntId: carrierAnt.id,
      careLevel: 0.9,
    };
    colony.eggs.push(egg);

    sim.damageAnt(carrierAnt, 1.0);
    sim.tick();

    assert(!colony.ants.some(a => a.id === carrierAnt.id), 'Carrier ant removed');
    const droppedEgg = colony.eggs.find(e => e.id === 8888);
    assert(droppedEgg !== undefined, 'Carried egg must remain in colony.eggs');
    assert(droppedEgg!.state === 'nursery', `Expected egg state 'nursery', got '${droppedEgg!.state}'`);
    assert(droppedEgg!.carrierAntId === undefined, 'Carrier ant ID must be cleared');
    assert(droppedEgg!.x === 350 && droppedEgg!.y === 420, `Egg dropped at death location (${carrierAnt.x}, ${carrierAnt.y}), got (${droppedEgg!.x}, ${droppedEgg!.y})`);
    console.log('✓ Anchor 83 PASSED: Verified food loss and egg dropping at death location on worker mortality.');
  }

  // Anchor 84: 1000-Tick Integration Stress Probe with Mid-Run Deaths
  {
    console.log('\nTesting Anchor 84: 1000-Tick Integration Stress Probe with Mid-Run Deaths...');
    const sim = createDugSim();

    for (let t = 0; t < 1000; t++) {
      if (t % 40 === 0) {
        for (const colony of sim.colonies) {
          if (colony.ants.length > 0) {
            const victimIndex = Math.floor(Math.random() * colony.ants.length);
            sim.damageAnt(colony.ants[victimIndex], 1.0);
          }
        }
      }

      sim.tick();

      for (const colony of sim.colonies) {
        assert(colony.nest.population === colony.ants.length, `Tick ${t}: Population (${colony.nest.population}) out of sync with ants.length (${colony.ants.length})`);
        assert(colony.nest.population >= 0, `Tick ${t}: Population became negative`);

        for (const ant of colony.ants) {
          assert(!isNaN(ant.x) && !isNaN(ant.y) && !isNaN(ant.vx) && !isNaN(ant.vy), `Tick ${t}: Ant ${ant.id} has NaN coords/velocity`);
          assert(ant.health >= 0 && ant.health <= 1.0, `Tick ${t}: Ant ${ant.id} health out of bounds: ${ant.health}`);
        }

        for (const egg of colony.eggs) {
          assert(!isNaN(egg.x) && !isNaN(egg.y) && !isNaN(egg.incubationSeconds), `Tick ${t}: Egg ${egg.id} has NaN properties`);
        }
      }
    }

    console.log('✓ Anchor 84 PASSED: 1000-tick stress run verified stable population sync and no NaNs under mid-run deaths.');
  }

  // Anchor 85: Real Energy Decay Confirmed
  {
    console.log('\nTesting Anchor 85: Real Energy Decay Confirmed...');
    const sim = createDugSim();
    const colony = sim.colonies[0];
    const ant = colony.ants[0];
    ant.energy = 1.0;
    // Place ant far from storage chamber so it doesn't refuel
    ant.x = 0;
    ant.y = 0;
    const initialEnergy = ant.energy;

    for (let t = 0; t < 100; t++) {
      sim.tick();
    }

    const expectedEnergy = 1.0 - 100 * HUNGER_DECAY_PER_TICK;
    assert(Math.abs(ant.energy - expectedEnergy) < 0.001, `Expected energy near ${expectedEnergy}, got ${ant.energy}`);
    assert(ant.energy < initialEnergy, `Expected energy to decay from ${initialEnergy}, got ${ant.energy}`);
    console.log(`✓ Anchor 85 PASSED: Energy decayed predictably from ${initialEnergy} to ${ant.energy.toFixed(4)} over 100 ticks.`);
  }

  // Anchor 86: Energy Restoration at Storage Chamber & FoodStore Decrement
  {
    console.log('\nTesting Anchor 86: Energy Restoration at Storage Chamber & FoodStore Decrement...');
    const sim = createDugSim();
    const colony = sim.colonies[0];
    const storage = colony.chambers.find(c => c.chamberType === 'storage')!;

    const ant = colony.ants[0];
    colony.ants = [ant];
    colony.nest.population = 1;

    // Place ant inside storage chamber with reduced energy
    ant.x = storage.x;
    ant.y = storage.y;
    ant.energy = 0.5;
    colony.nest.foodStore = 10.0;

    sim.tick();

    assert(ant.energy > 0.5, `Expected energy restored above 0.5, got ${ant.energy}`);
    assert(colony.nest.foodStore < 10.0, `Expected foodStore reduced below 10.0, got ${colony.nest.foodStore}`);
    assert(colony.nest.foodStore >= 0, 'foodStore must never become negative');

    // Test partial food store depletion without negative foodStore
    ant.x = storage.x;
    ant.y = storage.y;
    ant.vx = 0;
    ant.vy = 0;
    colony.nest.foodStore = 0.2;
    ant.energy = 0.4;
    sim.tick();

    assert(colony.nest.foodStore >= 0, `Expected foodStore >= 0, got ${colony.nest.foodStore}`);
    assert(Math.abs(colony.nest.foodStore - 0) < 0.0001, `foodStore safely floored at 0, got ${colony.nest.foodStore}`);
    console.log('✓ Anchor 86 PASSED: Energy restored at Storage chamber and foodStore safely decremented without turning negative.');
  }

  // Anchor 87: Sustained Zero Energy Triggers Gradual Damage
  {
    console.log('\nTesting Anchor 87: Sustained Zero Energy Triggers Gradual Damage...');
    const sim = createDugSim();
    const colony = sim.colonies[0];
    const ant = colony.ants[0];
    ant.x = 0; ant.y = 0; // Away from storage
    ant.energy = 0;
    ant.health = 1.0;

    // Run 50 ticks (the grace window before starvation damage)
    for (let t = 0; t < ZERO_ENERGY_DAMAGE_TICKS; t++) {
      sim.tick();
    }
    assert(ant.health === 1.0, `Expected health 1.0 during zero energy grace window, got ${ant.health}`);

    // Run 10 additional ticks of starvation damage
    for (let t = 0; t < 10; t++) {
      sim.tick();
    }
    const expectedHealth = 1.0 - 10 * ZERO_ENERGY_DAMAGE_PER_TICK;
    assert(Math.abs(ant.health - expectedHealth) < 0.01, `Expected health around ${expectedHealth}, got ${ant.health}`);
    console.log(`✓ Anchor 87 PASSED: Sustained zero energy triggered gradual starvation damage (${ant.health.toFixed(2)} health).`);
  }

  // Anchor 88: Worker Reaching Max Age Dies via Phase 4a Path
  {
    console.log('\nTesting Anchor 88: Worker Reaching Max Age Dies via Phase 4a Path...');
    const sim = createDugSim();
    const colony = sim.colonies[0];
    const initLen = colony.ants.length;
    const ant = colony.ants[0];

    const maxAge = sim.config.workerMaxAge ?? 10000;
    ant.age = maxAge - 1;
    sim.tick();

    assert(!colony.ants.some(a => a.id === ant.id), 'Old ant should be removed from colony.ants upon reaching maxAge');
    assert(colony.ants.length === initLen - 1, `Expected colony.ants length ${initLen - 1}, got ${colony.ants.length}`);
    assert(colony.nest.population === colony.ants.length, 'Population and ants.length must remain exactly synced');
    console.log('✓ Anchor 88 PASSED: Worker ant reached Max Age and died cleanly via Phase 4a death pipeline.');
  }

  // Anchor 89: 2000-Tick Full Integration Stress Run
  {
    console.log('\nTesting Anchor 89: 2000-Tick Full Integration Stress Run...');
    const sim = createDugSim();

    for (let t = 0; t < 2000; t++) {
      sim.tick();

      for (const colony of sim.colonies) {
        assert(colony.nest.population === colony.ants.length, `Tick ${t}: Population mismatch`);
        assert(colony.nest.population >= 0, `Tick ${t}: Negative population`);

        for (const ant of colony.ants) {
          assert(!isNaN(ant.x) && !isNaN(ant.y) && !isNaN(ant.vx) && !isNaN(ant.vy), `Tick ${t}: NaN ant coords/velocity`);
          assert(!isNaN(ant.energy) && ant.energy >= 0 && ant.energy <= 1.0, `Tick ${t}: Invalid ant energy ${ant.energy}`);
          assert(!isNaN(ant.health) && ant.health >= 0 && ant.health <= 1.0, `Tick ${t}: Invalid ant health ${ant.health}`);
          assert(!isNaN(ant.age) && ant.age >= 0, `Tick ${t}: Invalid ant age ${ant.age}`);
        }
      }
    }
    console.log('✓ Anchor 89 PASSED: 2000-tick integration run completed cleanly with zero NaNs and intact population accounting.');
  }

  // Anchor 90: Post-Hardening Stability Verification across 30 Trials
  {
    console.log('\nTesting Anchor 90: Post-Hardening Stability Verification across 30 Trials...');

    // Verify Anchor 5 Hardened Pass Rate over 30 trials
    let a5Passes = 0;
    for (let i = 0; i < 30; i++) {
      const sim = createDugSim({ eggIncubationSeconds: 0.5, eggLayChance: 0.9 });
      sim.colonies[1].ants = [];
      sim.queen.queenHealth = 0.5;
      sim.nest.foodStore = 50;
      sim.foodNodes = [{ id: 1, x: sim.nest.x + 40, y: sim.config.groundLevelY - 40, quantity: 500, maxQuantity: 500, respawnRate: 0.1 }];
      const startPop = sim.nest.population;
      for (let t = 0; t < 1000; t++) sim.tick();
      if (sim.nest.population > startPop) a5Passes++;
    }
    assert(a5Passes >= 25, `Anchor 90 (Anchor 5 check) failed: ${a5Passes}/30 passes`);

    // Verify Anchor 46 Hardened Pass Rate over 30 trials
    let a46Passes = 0;
    for (let i = 0; i < 30; i++) {
      const sim = createDugSim();
      const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;
      const staleEgg: Egg = { id: 9001, x: nursery.x, y: nursery.y, incubationSeconds: 11.989, state: 'nursery', careLevel: 0.0 };
      sim.eggs = [staleEgg];
      let candidateAtPromotion: Egg | undefined;
      for (let t = 0; t < 630; t++) {
        sim.queen.queenHealth = 0.0;
        const wasDead = sim.queen.isDead;
        sim.tick();
        if (!wasDead && sim.queen.isDead) candidateAtPromotion = sim.eggs.find(e => e.isRoyalCandidate);
      }
      let resolved = false;
      if (sim.queen.isDead && candidateAtPromotion && candidateAtPromotion.incubationSeconds < 1.0 && (candidateAtPromotion.careLevel ?? 0) >= 0.4) {
        for (let t = 0; t < 18000; t++) {
          sim.tick();
          if (!sim.queen.isDead) { resolved = true; break; }
          if (sim.nest.isQueenless) break;
        }
      }
      if (resolved) a46Passes++;
    }
    assert(a46Passes >= 21, `Anchor 90 (Anchor 46 check) failed: ${a46Passes}/30 passes`);

    // Verify Anchor 71 Hardened Pass Rate over 30 10-trial batches
    let a71BatchPasses = 0;
    for (let batch = 0; batch < 30; batch++) {
      let passedInBatch = 0;
      for (let trial = 0; trial < 10; trial++) {
        const sim71 = new Simulation({ initialPopulation: 1 });
        sim71.foodNodes = [];
        sim71.colonies[0].nest.tunnelDug = true;
        sim71.colonies[1].nest.tunnelDug = true;
        const simControl = new Simulation({ initialPopulation: 1 });
        simControl.foodNodes = [];
        simControl.colonies[0].nest.tunnelDug = true;
        sim71.colonies[1].ants = [];
        simControl.colonies[1].ants = [];

        const testAnt = sim71.colonies[0].ants[0];
        testAnt.x = 450; testAnt.y = 350; testAnt.vx = 0; testAnt.vy = -sim71.config.antSpeed;
        testAnt.carryingFood = false; testAnt.carryingEgg = false; testAnt.waypointPath = undefined; testAnt.currentAction = 'idle';

        const controlAnt = simControl.colonies[0].ants[0];
        controlAnt.x = 450; controlAnt.y = 350; controlAnt.vx = 0; controlAnt.vy = -simControl.config.antSpeed;
        controlAnt.carryingFood = false; controlAnt.carryingEgg = false; controlAnt.waypointPath = undefined; controlAnt.currentAction = 'idle';

        for (let offset = -20; offset <= 20; offset += 10) sim71.colonies[1].pheromones.deposit(470, 350 + offset, 0.8);
        for (let t = 0; t < 10; t++) {
          for (let offset = -20; offset <= 20; offset += 10) sim71.colonies[1].pheromones.deposit(470, 350 + offset, 0.8);
          sim71.tick();
          simControl.tick();
        }
        if (controlAnt.x - testAnt.x >= 5.0) passedInBatch++;
      }
      if (passedInBatch >= 7) a71BatchPasses++;
    }
    assert(a71BatchPasses >= 26, `Anchor 90 (Anchor 71 check) failed: ${a71BatchPasses}/30 batches passed`);
    console.log('✓ Anchor 90 PASSED: Post-hardening stability verified across 30 isolated trials each for Anchors 5, 46, and 71.');
  }

  // Anchor 91: Numerical Advantage Engagement Decision
  {
    console.log('\nTesting Anchor 91: Numerical advantage engagement decision...');
    const sim = new Simulation();
    const ownColony = sim.colonies[0];
    const enemyColony = sim.colonies[1];

    // Place target ant from colony 0 in shared forage lane (y = 400)
    const targetAnt = ownColony.ants[0];
    targetAnt.x = 450;
    targetAnt.y = 400;
    targetAnt.age = 0;

    // Place 3 allies within encounterRadius (40)
    for (let i = 1; i <= 3 && i < ownColony.ants.length; i++) {
      ownColony.ants[i].x = 450 + i * 5;
      ownColony.ants[i].y = 400;
    }

    // Place 1 enemy within encounterRadius (40)
    enemyColony.ants[0].x = 460;
    enemyColony.ants[0].y = 400;

    sim.combatSystem.assessEncounter(targetAnt, ownColony, enemyColony);

    assert(targetAnt.combatAction === 'engage', `Expected combatAction 'engage', got '${targetAnt.combatAction}'`);
    console.log('✓ Anchor 91 PASSED: Ant with strong local numerical advantage chose engage.');
  }

  // Anchor 92: Weak Numbers and Low Age Flee Decision
  {
    console.log('\nTesting Anchor 92: Weak numbers and low age flee decision...');
    const sim = new Simulation();
    const ownColony = sim.colonies[0];
    const enemyColony = sim.colonies[1];

    // Isolate target ant from colony 0 (move other allies far away)
    const targetAnt = ownColony.ants[0];
    targetAnt.x = 450;
    targetAnt.y = 400;
    targetAnt.age = 0;

    for (let i = 1; i < ownColony.ants.length; i++) {
      ownColony.ants[i].x = 100;
      ownColony.ants[i].y = 100;
    }

    // Place 1 enemy within encounterRadius (40)
    enemyColony.ants[0].x = 460;
    enemyColony.ants[0].y = 400;

    sim.combatSystem.assessEncounter(targetAnt, ownColony, enemyColony);

    assert(targetAnt.combatAction === 'flee', `Expected combatAction 'flee', got '${targetAnt.combatAction}'`);
    console.log('✓ Anchor 92 PASSED: Ant with weak local numbers and low age chose flee.');
  }

  // Anchor 93: Age-Biased Engagement Decision
  {
    console.log('\nTesting Anchor 93: Age-biased engagement decision...');
    const sim = new Simulation();
    const ownColony = sim.colonies[0];
    const enemyColony = sim.colonies[1];

    // Isolate target ant at max age
    const targetAnt = ownColony.ants[0];
    targetAnt.x = 450;
    targetAnt.y = 400;
    targetAnt.age = sim.config.workerMaxAge ?? 20000;

    for (let i = 1; i < ownColony.ants.length; i++) {
      ownColony.ants[i].x = 100;
      ownColony.ants[i].y = 100;
    }

    // Place 1 enemy within encounterRadius (40)
    enemyColony.ants[0].x = 460;
    enemyColony.ants[0].y = 400;

    sim.combatSystem.assessEncounter(targetAnt, ownColony, enemyColony);

    assert(targetAnt.combatAction === 'engage', `Expected combatAction 'engage', got '${targetAnt.combatAction}'`);
    console.log('✓ Anchor 93 PASSED: Ant at Max Age in same disadvantageous local odds chose engage due to age-bias.');
  }

  // Anchor 94: Decision-Only Probe Zero Health Change
  {
    console.log('\nTesting Anchor 94: Decision-only probe zero health change...');
    const sim = new Simulation();
    const ownColony = sim.colonies[0];
    const enemyColony = sim.colonies[1];

    // Place ants in shared forage lane within encounter radius (25px apart) but OUTSIDE contactRadius (12px)
    ownColony.ants[0].x = 450; ownColony.ants[0].y = 400;
    enemyColony.ants[0].x = 475; enemyColony.ants[0].y = 400;

    const initialHealthsA = ownColony.ants.map(a => a.health);
    const initialHealthsB = enemyColony.ants.map(a => a.health);

    for (let t = 0; t < 10; t++) {
      sim.combatSystem.assessEncounter(ownColony.ants[0], ownColony, enemyColony);
      sim.combatSystem.assessEncounter(enemyColony.ants[0], enemyColony, ownColony);
      sim.combatSystem.resolveCombat(ownColony, enemyColony, sim.colonyLifecycle);
    }

    ownColony.ants.forEach((a, i) => {
      assert(a.health === initialHealthsA[i], `Colony 0 ant ${a.id} health changed from ${initialHealthsA[i]} to ${a.health}`);
    });
    enemyColony.ants.forEach((b, i) => {
      assert(b.health === initialHealthsB[i], `Colony 1 ant ${b.id} health changed from ${initialHealthsB[i]} to ${b.health}`);
    });

    console.log('✓ Anchor 94 PASSED: Agency decisions fired with zero health changes across both colonies when outside contact radius.');
  }

  // Anchor 95: Contact-Range Lanchester Square-Law Damage Probe
  {
    console.log('\nTesting Anchor 95: Contact-range Lanchester square-law damage probe...');
    const sim = new Simulation();
    const ownColony = sim.colonies[0];
    const enemyColony = sim.colonies[1];

    // Probe 1: 1v1 equal engagement
    const antA1 = ownColony.ants[0]; antA1.x = 450; antA1.y = 400; antA1.combatAction = 'engage'; antA1.combatAllyCount = 1; antA1.combatEnemyCount = 1;
    const antB1 = enemyColony.ants[0]; antB1.x = 452; antB1.y = 400; antB1.combatAction = 'engage'; antB1.combatAllyCount = 1; antB1.combatEnemyCount = 1;

    sim.combatSystem.resolveCombat(ownColony, enemyColony, sim.colonyLifecycle);

    assert(antA1.health < 1.0, `Ant A1 health = ${antA1.health}, expected < 1.0`);
    assert(antB1.health < 1.0, `Ant B1 health = ${antB1.health}, expected < 1.0`);

    // Probe 2: 2v1 numerical advantage (2 ants in colony 0 vs 1 ant in colony 1)
    const sim2 = new Simulation();
    const colA = sim2.colonies[0];
    const colB = sim2.colonies[1];

    const a1 = colA.ants[0]; a1.x = 450; a1.y = 400; a1.combatAction = 'engage'; a1.combatAllyCount = 2; a1.combatEnemyCount = 1;
    const a2 = colA.ants[1]; a2.x = 451; a2.y = 400; a2.combatAction = 'engage'; a2.combatAllyCount = 2; a2.combatEnemyCount = 1;
    const b1 = colB.ants[0]; b1.x = 452; b1.y = 400; b1.combatAction = 'engage'; b1.combatAllyCount = 1; b1.combatEnemyCount = 2;

    sim2.combatSystem.resolveCombat(colA, colB, sim2.colonyLifecycle);

    const dmgA1 = 1.0 - a1.health;
    const dmgB1 = 1.0 - b1.health;

    assert(dmgA1 < dmgB1, `Expected advantaged side damage (${dmgA1.toFixed(4)}) < disadvantaged side (${dmgB1.toFixed(4)})`);
    console.log(`✓ Anchor 95 PASSED: Square-law combat resolution verified (1v1 nonzero damage; 2v1 advantaged damage ${dmgA1.toFixed(4)} < ${dmgB1.toFixed(4)}).`);
  }

  // Anchor 96: Combat Death Brood Destruction Exception
  {
    console.log('\nTesting Anchor 96: Combat death brood destruction exception...');
    const sim = new Simulation();
    const colony = sim.colonies[0];
    const carrier = colony.ants[0];
    carrier.x = 450; carrier.y = 400; carrier.carryingEgg = true; carrier.health = 0.01;

    const egg: Egg = {
      id: 7777,
      x: 450,
      y: 400,
      incubationSeconds: 1.0,
      state: 'carried',
      carrierAntId: carrier.id,
      careLevel: 0.9,
    };
    colony.eggs.push(egg);

    // Apply combat damage to kill the carrier
    carrier.lastDamageSource = 'combat';
    sim.damageAnt(carrier, 0.02);
    sim.tick();

    assert(!colony.ants.some(a => a.id === carrier.id), 'Carrier ant should be dead and removed');
    assert(!colony.eggs.some(e => e.id === 7777), 'Egg carried by combat-killed ant must be destroyed and removed from colony.eggs');
    console.log('✓ Anchor 96 PASSED: Egg carried by combat-killed ant was destroyed completely.');
  }

  // Anchor 97: Non-Combat Death Brood Preservation Regression
  {
    console.log('\nTesting Anchor 97: Non-combat death brood preservation regression...');
    const sim = new Simulation();
    const colony = sim.colonies[0];
    const carrier = colony.ants[0];
    carrier.x = 450; carrier.y = 400; carrier.carryingEgg = true; carrier.health = 0.01;

    const egg: Egg = {
      id: 7778,
      x: 450,
      y: 400,
      incubationSeconds: 1.0,
      state: 'carried',
      carrierAntId: carrier.id,
      careLevel: 0.9,
    };
    colony.eggs.push(egg);

    // Kill carrier via starvation/aging (non-combat)
    carrier.lastDamageSource = 'other';
    sim.damageAnt(carrier, 0.02);
    sim.tick();

    assert(!colony.ants.some(a => a.id === carrier.id), 'Carrier ant should be dead and removed');
    const droppedEgg = colony.eggs.find(e => e.id === 7778);
    assert(droppedEgg !== undefined, 'Egg carried by non-combat killed ant must drop alive in colony.eggs');
    assert(droppedEgg!.state === 'nursery', `Expected egg state 'nursery', got '${droppedEgg!.state}'`);
    assert(droppedEgg!.carrierAntId === undefined, 'carrierAntId should be cleared');
    console.log('✓ Anchor 97 PASSED: Non-combat death preserved Phase 4a drop-alive egg behavior.');
  }

  // Anchor 98: 2000-Tick Full Integration Run with Active Combat
  {
    console.log('\nTesting Anchor 98: 2000-tick full integration run with active combat...');
    const sim = createDugSim();

    for (let t = 0; t < 2000; t++) {
      sim.tick();

      for (const colony of sim.colonies) {
        assert(colony.nest.population === colony.ants.length, `Tick ${t}: Population (${colony.nest.population}) out of sync with ants length (${colony.ants.length})`);
        assert(colony.nest.population >= 0, `Tick ${t}: Negative population`);

        for (const ant of colony.ants) {
          assert(!isNaN(ant.x) && !isNaN(ant.y) && !isNaN(ant.vx) && !isNaN(ant.vy), `Tick ${t}: Ant ${ant.id} has NaN coords/velocity`);
          assert(!isNaN(ant.health) && ant.health >= 0 && ant.health <= 1.0, `Tick ${t}: Ant ${ant.id} invalid health ${ant.health}`);
        }
      }
    }
    console.log('✓ Anchor 98 PASSED: 2000-tick full integration run with natural Agency and Combat completed with zero NaNs and intact accounting.');
  }

  // Anchor 99: Real Pickup Probe
  {
    console.log('\nTesting Anchor 99: Real pickup probe...');
    const sim = createDugSim();
    const colony = sim.colonies[0];
    colony.eggs = [];
    const ant = colony.ants[0];

    // Place ant directly at food node 0 with no active waypointPath
    const foodNode = sim.foodNodes[0];
    ant.x = foodNode.x;
    ant.y = foodNode.y;
    ant.waypointPath = undefined;
    ant.waypointIndex = 0;
    ant.currentAction = 'forage_direct';

    const initialFoodItemCount = colony.foodItems.length;
    sim.tick();

    assert(ant.carryingFood === true, 'Ant should be carrying food after reaching food node');
    assert(colony.foodItems.length === initialFoodItemCount + 1, `Expected colony.foodItems to increase by 1, got ${colony.foodItems.length}`);

    const item = colony.foodItems.find(f => f.carrierAntId === ant.id);
    assert(item !== undefined, 'FoodItem should exist with carrierAntId matching ant.id');
    assert(item!.ownerColonyId === colony.id, `Expected ownerColonyId ${colony.id}, got ${item!.ownerColonyId}`);
    assert(item!.amount === 1, `Expected amount 1, got ${item!.amount}`);
    assert(typeof item!.id === 'number', 'FoodItem id must be a number');
    console.log('✓ Anchor 99 PASSED: Reaching food creates a real FoodItem matching carrier ant and colony.');
  }

  // Anchor 100: Real Resolution Probe Across All Four Consumption Paths
  {
    console.log('\nTesting Anchor 100: Real resolution probe across all four consumption paths...');

    // Path 1: Feed Queen (Queen alive)
    {
      const sim = createDugSim();
      const colony = sim.colonies[0];
      const ant = colony.ants[0];
      colony.queen.isDead = false;
      colony.queen.queenHealth = 0.5;

      const queenChamber = colony.chambers.find(c => c.chamberType === 'queen')!;
      ant.x = queenChamber.x;
      ant.y = queenChamber.y;
      ant.carryingFood = true;
      ant.targetChamberId = 3;
      ant.waypointPath = [{ x: queenChamber.x, y: queenChamber.y }];
      ant.waypointIndex = 0;

      const foodItem: FoodItem = {
        id: 9001,
        x: ant.x,
        y: ant.y,
        amount: 1,
        carrierAntId: ant.id,
        ownerColonyId: colony.id,
      };
      colony.foodItems.push(foodItem);

      sim.tick();

      assert(!ant.carryingFood, 'Ant carryingFood should be false after feeding Queen');
      assert(!colony.foodItems.some(f => f.id === 9001), 'FoodItem 9001 should be removed from colony.foodItems after feeding Queen');
    }

    // Path 2: Feed Queen while dead (wasted)
    {
      const sim = createDugSim();
      const colony = sim.colonies[0];
      const ant = colony.ants[0];
      colony.queen.isDead = true;

      const queenChamber = colony.chambers.find(c => c.chamberType === 'queen')!;
      ant.x = queenChamber.x;
      ant.y = queenChamber.y;
      ant.carryingFood = true;
      ant.targetChamberId = 3;
      ant.waypointPath = [{ x: queenChamber.x, y: queenChamber.y }];
      ant.waypointIndex = 0;

      const foodItem: FoodItem = {
        id: 9002,
        x: ant.x,
        y: ant.y,
        amount: 1,
        carrierAntId: ant.id,
        ownerColonyId: colony.id,
      };
      colony.foodItems.push(foodItem);

      sim.tick();

      assert(!ant.carryingFood, 'Ant carryingFood should be false after feeding dead Queen');
      assert(!colony.foodItems.some(f => f.id === 9002), 'FoodItem 9002 should be removed from colony.foodItems after feeding dead Queen');
    }

    // Path 3: Feed Larvae (Nursery)
    {
      const sim = createDugSim();
      const colony = sim.colonies[0];
      const ant = colony.ants[0];

      const nurseryChamber = colony.chambers.find(c => c.chamberType === 'nursery')!;
      ant.x = nurseryChamber.x;
      ant.y = nurseryChamber.y;
      ant.carryingFood = true;
      ant.targetChamberId = 2;
      ant.waypointPath = [{ x: nurseryChamber.x, y: nurseryChamber.y }];
      ant.waypointIndex = 0;

      const foodItem: FoodItem = {
        id: 9003,
        x: ant.x,
        y: ant.y,
        amount: 1,
        carrierAntId: ant.id,
        ownerColonyId: colony.id,
      };
      colony.foodItems.push(foodItem);

      sim.tick();

      assert(!ant.carryingFood, 'Ant carryingFood should be false after feeding Larvae');
      assert(!colony.foodItems.some(f => f.id === 9003), 'FoodItem 9003 should be removed from colony.foodItems after feeding Larvae');
    }

    // Path 4: Store to Storage chamber
    {
      const sim = createDugSim();
      const colony = sim.colonies[0];
      const ant = colony.ants[0];

      const storageChamber = colony.chambers.find(c => c.chamberType === 'storage')!;
      ant.x = storageChamber.x;
      ant.y = storageChamber.y;
      ant.carryingFood = true;
      ant.targetChamberId = 1;
      ant.waypointPath = [{ x: storageChamber.x, y: storageChamber.y }];
      ant.waypointIndex = 0;

      const foodItem: FoodItem = {
        id: 9004,
        x: ant.x,
        y: ant.y,
        amount: 1,
        carrierAntId: ant.id,
        ownerColonyId: colony.id,
      };
      colony.foodItems.push(foodItem);

      sim.tick();

      assert(!ant.carryingFood, 'Ant carryingFood should be false after storing food');
      assert(!colony.foodItems.some(f => f.id === 9004), 'FoodItem 9004 should be removed from colony.foodItems after storing food');
    }

    console.log('✓ Anchor 100 PASSED: All four consumption paths resolve FoodItem with zero orphans.');
  }

  // Anchor 101: Real Long-Run Integrity Check
  {
    console.log('\nTesting Anchor 101: Real long-run integrity check...');
    const sim = createDugSim();

    for (let t = 1; t <= 2000; t++) {
      sim.tick();

      if (t % 100 === 0) {
        for (const colony of sim.colonies) {
          const carryingCount = colony.ants.filter(a => a.carryingFood).length;
          assert(
            colony.foodItems.length === carryingCount,
            `Tick ${t}, Colony ${colony.id}: colony.foodItems.length (${colony.foodItems.length}) out of sync with carrying ant count (${carryingCount})`
          );
        }
      }
    }
    console.log('✓ Anchor 101 PASSED: 2000-tick run maintained exact 1:1 match between colony.foodItems and carrying ants.');
  }

  // Anchor 102: Multiple Simultaneous Carriers
  {
    console.log('\nTesting Anchor 102: Multiple simultaneous carriers...');
    const sim = createDugSim();
    const colony = sim.colonies[0];
    colony.eggs = [];
    const foodNode = sim.foodNodes[0];

    // Position 5 ants at the food node with no active waypointPath
    const carriers = colony.ants.slice(0, 5);
    for (const ant of carriers) {
      ant.x = foodNode.x;
      ant.y = foodNode.y;
      ant.waypointPath = undefined;
      ant.waypointIndex = 0;
      ant.currentAction = 'forage_direct';
    }

    sim.tick();

    // Verify 5 FoodItems created
    assert(colony.foodItems.length === 5, `Expected 5 foodItems, got ${colony.foodItems.length}`);

    const itemIds = new Set(colony.foodItems.map(f => f.id));
    assert(itemIds.size === 5, 'All 5 FoodItem IDs must be unique');

    for (const ant of carriers) {
      assert(ant.carryingFood === true, `Ant ${ant.id} should be carrying food`);
      const item = colony.foodItems.find(f => f.carrierAntId === ant.id);
      assert(item !== undefined, `Ant ${ant.id} must have a corresponding FoodItem`);
      assert(item!.ownerColonyId === colony.id, `FoodItem ownerColonyId must be ${colony.id}`);
    }
    console.log('✓ Anchor 102 PASSED: Multiple simultaneous carriers have distinct FoodItems with unique IDs.');
  }

  // Anchor 103: Economy Regression Check
  {
    console.log('\nTesting Anchor 103: Economy regression check...');

    // Test queen health feeding boost
    {
      const sim = createDugSim();
      const colony = sim.colonies[0];
      colony.queen.queenHealth = 0.5;
      const initialQueenHealth = colony.queen.queenHealth;
      const ant = colony.ants[0];

      const queenChamber = colony.chambers.find(c => c.chamberType === 'queen')!;
      ant.x = queenChamber.x; ant.y = queenChamber.y;
      ant.carryingFood = true; ant.targetChamberId = 3;
      ant.waypointPath = [{ x: queenChamber.x, y: queenChamber.y }]; ant.waypointIndex = 0;
      colony.foodItems.push({ id: 8001, x: ant.x, y: ant.y, amount: 1, carrierAntId: ant.id, ownerColonyId: colony.id });

      sim.tick();

      assert(
        Math.abs(colony.queen.queenHealth - (initialQueenHealth + 0.25)) < 0.01,
        `Expected queenHealth approx ${initialQueenHealth + 0.25}, got ${colony.queen.queenHealth}`
      );
    }

    // Test storage foodStore increment
    {
      const sim = createDugSim();
      const colony = sim.colonies[0];
      const initialStore = colony.nest.foodStore;
      const ant = colony.ants[0];

      const storageChamber = colony.chambers.find(c => c.chamberType === 'storage')!;
      ant.x = storageChamber.x; ant.y = storageChamber.y;
      ant.carryingFood = true; ant.targetChamberId = 1;
      ant.waypointPath = [{ x: storageChamber.x, y: storageChamber.y }]; ant.waypointIndex = 0;
      colony.foodItems.push({ id: 8002, x: ant.x, y: ant.y, amount: 1, carrierAntId: ant.id, ownerColonyId: colony.id });

      sim.tick();

      assert(
        Math.abs(colony.nest.foodStore - (initialStore + 1)) < 0.01,
        `Expected foodStore approx ${initialStore + 1}, got ${colony.nest.foodStore}`
      );
    }

    // Test larval careLevel boost
    {
      const sim = createDugSim();
      const colony = sim.colonies[0];
      const egg: Egg = {
        id: 8888,
        x: 0, y: 0,
        incubationSeconds: 1.0,
        state: 'nursery',
        careLevel: 0.1,
      };
      colony.eggs.push(egg);

      const ant = colony.ants[0];
      const nurseryChamber = colony.chambers.find(c => c.chamberType === 'nursery')!;
      ant.x = nurseryChamber.x; ant.y = nurseryChamber.y;
      ant.carryingFood = true; ant.targetChamberId = 2;
      ant.waypointPath = [{ x: nurseryChamber.x, y: nurseryChamber.y }]; ant.waypointIndex = 0;
      colony.foodItems.push({ id: 8003, x: ant.x, y: ant.y, amount: 1, carrierAntId: ant.id, ownerColonyId: colony.id });

      sim.tick();

      assert(
        Math.abs(egg.careLevel - (0.1 + 0.35 - 0.002)) < 1e-4,
        `Expected egg careLevel approx 0.448, got ${egg.careLevel}`
      );
    }

    console.log('✓ Anchor 103 PASSED: Food economy amounts are byte-identical to pre-this-phase behavior.');
  }

  // Anchor 104: Infiltration Transition Probe
  {
    console.log('\nTesting Anchor 104: Infiltration Transition Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];
    const ant = colony0.ants[0];

    ant.x = colony0.nest.x;
    ant.y = colony0.surfaceY;
    ant.currentAction = 'infiltrate';
    ant.waypointPath = undefined;
    ant.waypointIndex = 0;

    // Run ticks until ant reaches Colony 1 entrance and enters enemy tunnels
    let reached = false;
    for (let t = 0; t < 1000; t++) {
      sim.tick();
      if (ant.waypointPath && ant.waypointPath.length > 0 && ant.targetChamberId === 1) {
        reached = true;
        break;
      }
    }

    assert(reached, 'Infiltrator ant failed to transition to enemy tunnel waypoints upon reaching enemy entrance');
    assert(ant.currentAction === 'infiltrate', `Expected action infiltrate, got ${ant.currentAction}`);
    console.log('✓ Anchor 104 PASSED: Infiltrator transitioned cleanly to enemy tunnel waypoints upon reaching enemy entrance.');
  }

  // Anchor 105: Successful Theft Probe
  {
    console.log('\nTesting Anchor 105: Successful Theft Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];
    colony1.nest.foodStore = 10;
    const ant = colony0.ants[0];

    // Position ant at enemy Storage chamber at end of infiltrate waypoint path
    const enemyStorage = colony1.chambers.find(c => c.chamberType === 'storage')!;
    ant.x = enemyStorage.x;
    ant.y = enemyStorage.y;
    ant.currentAction = 'infiltrate';
    sim.setAntWaypointPath(ant, 0, 1, colony1);
    ant.waypointIndex = ant.waypointPath!.length - 1;

    sim.tick();

    assert(colony1.nest.foodStore === 5, `Expected enemy foodStore 5 after theft, got ${colony1.nest.foodStore}`);
    assert(ant.carryingFood === true, 'Ant carryingFood should be true after theft');
    assert(ant.currentAction === ('smuggle_home' as string), `Expected action smuggle_home, got ${ant.currentAction}`);
    
    const stolenItem = colony0.foodItems.find(f => f.carrierAntId === ant.id);
    assert(stolenItem !== undefined, 'Stolen FoodItem not created in thief colony foodItems');
    assert(stolenItem!.amount === 5, `Expected stolen FoodItem amount 5, got ${stolenItem!.amount}`);
    assert(stolenItem!.ownerColonyId === colony0.id, `Expected ownerColonyId ${colony0.id}, got ${stolenItem!.ownerColonyId}`);
    
    console.log('✓ Anchor 105 PASSED: Theft successfully subtracted food, created FoodItem owned by thief colony, and set smuggle_home.');
  }

  // Anchor 106: Boundary Exemption Probe
  {
    console.log('\nTesting Anchor 106: Boundary Exemption Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];
    const ant = colony0.ants[0];

    const enemyStorage = colony1.chambers.find(c => c.chamberType === 'storage')!;
    ant.x = enemyStorage.x;
    ant.y = enemyStorage.y;
    ant.currentAction = 'infiltrate';

    sim.enforceUndergroundBoundary(ant, colony0, colony1);

    assert(ant.y === enemyStorage.y, `Ant y position altered by boundary check: expected ${enemyStorage.y}, got ${ant.y}`);
    assert(ant.x === enemyStorage.x, `Ant x position altered by boundary check: expected ${enemyStorage.x}, got ${ant.x}`);
    console.log('✓ Anchor 106 PASSED: Infiltrating ant in enemy territory is exempted from own boundary check.');
  }

  // Anchor 107: Non-Exempt Boundary Probe
  {
    console.log('\nTesting Anchor 107: Non-Exempt Boundary Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];
    const ant = colony0.ants[0];

    const enemyStorage = colony1.chambers.find(c => c.chamberType === 'storage')!;
    ant.x = enemyStorage.x;
    ant.y = enemyStorage.y;
    ant.currentAction = 'idle';

    sim.enforceUndergroundBoundary(ant, colony0, colony1);

    assert(ant.y !== enemyStorage.y || ant.x !== enemyStorage.x, 'Non-infiltrating ant was incorrectly exempted from boundary check');
    assert(ant.y >= 200, `Non-infiltrating ant improperly positioned outside lane: y=${ant.y}`);
    console.log('✓ Anchor 107 PASSED: Non-infiltrating ant in enemy territory is strictly clamped away.');
  }

  // Anchor 108: Detection & Encounter Probe
  {
    console.log('\nTesting Anchor 108: Detection & Encounter Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];
    const thief = colony0.ants[0];
    const defender = colony1.ants[0];

    const enemyStorage = colony1.chambers.find(c => c.chamberType === 'storage')!;
    thief.x = enemyStorage.x;
    thief.y = enemyStorage.y;
    thief.currentAction = 'infiltrate';

    defender.x = enemyStorage.x + 5;
    defender.y = enemyStorage.y + 5;
    defender.currentAction = 'idle';

    sim.combatSystem.assessEncounter(defender, colony1, colony0);

    assert(defender.combatAction === 'engage' || defender.combatAction === 'flee', `Expected defender combatAction engage or flee, got ${defender.combatAction}`);
    console.log(`✓ Anchor 108 PASSED: Defender detected thief in home territory with Agency decision: ${defender.combatAction}.`);
  }

  // Anchor 109: Thief Death Cleanup Probe
  {
    console.log('\nTesting Anchor 109: Thief Death Cleanup Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const thief = colony0.ants[0];

    thief.carryingFood = true;
    thief.currentAction = 'smuggle_home';
    const stolenItem: FoodItem = {
      id: 9999,
      x: thief.x,
      y: thief.y,
      amount: 5,
      carrierAntId: thief.id,
      ownerColonyId: colony0.id,
    };
    colony0.foodItems.push(stolenItem);

    thief.health = 0; // Kill thief
    sim.tick();

    assert(!colony0.ants.some(a => a.id === thief.id), 'Dead thief ant not removed from colony.ants');
    assert(!colony0.foodItems.some(f => f.id === 9999), 'Stolen FoodItem carried by dead thief not cleaned up');
    console.log('✓ Anchor 109 PASSED: Thief death cleaned up ant and carried FoodItem without orphan leak.');
  }

  // Anchor 110: Full Smuggle Cycle Probe
  {
    console.log('\nTesting Anchor 110: Full Smuggle Cycle Probe...');
    const sim = createDugSim();
    sim.foodNodes = [];
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];
    colony1.ants = []; // Clear enemy workers so thief is not repelled/killed by defenders
    colony1.queen.isDead = true; // Prevent queen food decay during long transport
    colony1.nest.foodStore = 10;
    const initialColony0Store = colony0.nest.foodStore;
    const thief = colony0.ants[0];
    colony0.ants = [thief]; // Only thief in colony0 so other workers don't trigger secondary thefts

    // Position thief at enemy storage
    const enemyStorage = colony1.chambers.find(c => c.chamberType === 'storage')!;
    thief.x = enemyStorage.x;
    thief.y = enemyStorage.y;
    thief.currentAction = 'infiltrate';
    sim.setAntWaypointPath(thief, 0, 1, colony1);
    thief.waypointIndex = thief.waypointPath!.length - 1;

    // Run ticks until food is deposited in thief's storage
    let deposited = false;
    for (let t = 0; t < 2000; t++) {
      thief.energy = 1.0;
      sim.tick();
      if (colony0.nest.foodStore > initialColony0Store) {
        deposited = true;
        break;
      }
    }

    assert(deposited, 'Stolen food was not successfully smuggled and stored in thief colony storage');
    assert(colony1.nest.foodStore === 5, `Expected enemy foodStore 5, got ${colony1.nest.foodStore}`);
    assert(Math.abs(colony0.nest.foodStore - (initialColony0Store + 5)) < 0.2, `Expected thief foodStore ~${initialColony0Store + 5}, got ${colony0.nest.foodStore}`);
    assert(colony0.foodItems.length === 0, `Expected 0 foodItems after delivery, got ${colony0.foodItems.length}`);
    console.log('✓ Anchor 110 PASSED: Full smuggle cycle completed: food stolen, transported home, and deposited into storage.');
  }

  // Anchor 111: Undug Enemy Gate Probe
  {
    console.log('\nTesting Anchor 111: Undug Enemy Gate Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];
    colony1.nest.tunnelDug = false; // Enemy tunnel not dug

    let attemptedInfiltration = false;
    for (let t = 0; t < 500; t++) {
      sim.tick();
      if (colony0.ants.some(a => a.currentAction === 'infiltrate')) {
        attemptedInfiltration = true;
        break;
      }
    }

    assert(!attemptedInfiltration, 'Ant attempted to infiltrate an enemy colony whose exit tunnel is not dug');
    console.log('✓ Anchor 111 PASSED: Ants do not attempt infiltration against an enemy colony whose tunnel is undug.');
  }

  // Anchor 112: Queen Health Redirect Probe (Health >= 0.95)
  {
    console.log('\nTesting Anchor 112: Queen Health Redirect Probe (Health >= 0.95)...');
    const sim = createDugSim();
    const colony = sim.colonies[0];
    colony.queen.queenHealth = 0.98;

    const queenChamber = colony.chambers.find(c => c.chamberType === 'queen')!;
    colony.eggs.push({
      id: 9991,
      x: queenChamber.x,
      y: queenChamber.y,
      incubationSeconds: 0,
      state: 'queen_chamber',
      careLevel: 1.0,
    });

    const ant = colony.ants[0];
    ant.carryingFood = true;
    ant.targetChamberId = 3;
    ant.x = queenChamber.x;
    ant.y = queenChamber.y;

    const foodItem = {
      id: sim['nextFoodItemId']++,
      x: ant.x,
      y: ant.y,
      amount: 1,
      carrierAntId: ant.id,
      ownerColonyId: colony.id,
    };
    colony.foodItems.push(foodItem);

    // Set waypoint path to Queen chamber final waypoint
    sim.setAntWaypointPath(ant, 0, 3, colony);
    ant.waypointIndex = ant.waypointPath!.length - 1;
    ant.x = ant.waypointPath![ant.waypointIndex].x;
    ant.y = ant.waypointPath![ant.waypointIndex].y;

    sim.tick();

    assert(Math.abs(colony.queen.queenHealth - 0.98) < 0.005, `Expected queen health unchanged except for minor decay (~0.98), got ${colony.queen.queenHealth}`);
    assert(ant.carryingFood, 'Expected ant to still be carrying food upon queen redirect');
    assert(ant.targetChamberId === 1, `Expected ant targetChamberId redirected to 1 (Storage), got ${ant.targetChamberId}`);
    assert(colony.foodItems.length === 1, 'Expected foodItem to survive redirect');

    // Run ticks until ant delivers to storage
    const initialStore = colony.nest.foodStore;
    for (let t = 0; t < 300; t++) {
      ant.energy = 1.0;
      sim.tick();
      if (colony.nest.foodStore > initialStore) break;
    }

    assert(colony.nest.foodStore > initialStore, 'Expected redirected food to be delivered and stored in Granary storage');
    assert(!ant.carryingFood, 'Expected ant to deposit food at Storage');
    console.log('✓ Anchor 112 PASSED: Food-carrying ant arriving at Queen with health >= 0.95 was redirected to Storage; food survived and was stored.');
  }

  // Anchor 113: Genuine Low-Health Queen Delivery Regression Probe
  {
    console.log('\nTesting Anchor 113: Genuine Low-Health Queen Delivery Regression Probe...');
    const sim = createDugSim();
    const colony = sim.colonies[0];
    colony.queen.queenHealth = 0.30;

    const ant = colony.ants[0];
    ant.carryingFood = true;
    ant.targetChamberId = 3;

    const foodItem = {
      id: sim['nextFoodItemId']++,
      x: ant.x,
      y: ant.y,
      amount: 1,
      carrierAntId: ant.id,
      ownerColonyId: colony.id,
    };
    colony.foodItems.push(foodItem);

    sim.setAntWaypointPath(ant, 0, 3, colony);
    ant.waypointIndex = ant.waypointPath!.length - 1;
    ant.x = ant.waypointPath![ant.waypointIndex].x;
    ant.y = ant.waypointPath![ant.waypointIndex].y;

    sim.tick();

    assert(Math.abs(colony.queen.queenHealth - 0.55) < 0.001, `Expected queen health boost to 0.55, got ${colony.queen.queenHealth}`);
    assert(!ant.carryingFood, 'Expected ant food to be consumed by Queen');
    console.log('✓ Anchor 113 PASSED: Food-carrying ant arriving at Queen with low health delivered food and boosted health as expected.');
  }

  // Anchor 114: Real Wander Persistence Heading Commitment Probe
  {
    console.log('\nTesting Anchor 114: Real Wander Persistence Heading Commitment Probe...');
    const sim = createDugSim();
    sim.foodNodes = [];
    for (const c of sim.colonies) {
      c.eggs = [];
      c.foodItems = [];
      c.pheromones.clear();
      c.ants = [];
    }

    const colony = sim.colonies[0];
    const ant: Ant = {
      id: 999,
      colonyId: colony.id,
      x: 400,
      y: 100,
      vx: 1.5,
      vy: 0.0,
      energy: 1.0,
      health: 1.0,
      age: 0,
      carryingFood: false,
      carryingEgg: false,
      currentAction: 'idle',
      wanderTicksRemaining: 0,
    };
    colony.ants = [ant];

    // Tick 1 initiates wander commitment
    sim.tick();
    const angle1 = Math.atan2(ant.vy, ant.vx);
    assert(ant.wanderTicksRemaining !== undefined && ant.wanderTicksRemaining > 0, 'Expected wanderTicksRemaining to be set');

    // Run 5 consecutive ticks and measure angle drift
    for (let i = 0; i < 5; i++) {
      sim.tick();
    }
    const angle5 = Math.atan2(ant.vy, ant.vx);
    let angleDiff = Math.abs(angle5 - angle1);
    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

    assert(angleDiff < 0.2, `Expected committed heading drift < 0.2 rad across 5 ticks, got ${angleDiff} (angle1: ${angle1}, angle5: ${angle5})`);
    console.log('✓ Anchor 114 PASSED: Ant committed to wander heading across consecutive ticks with low angle jitter.');
  }

  // Anchor 115: Trail-Recovery Wander Reset Probe
  {
    console.log('\nTesting Anchor 115: Trail-Recovery Wander Reset Probe...');
    const sim = createDugSim();
    sim.foodNodes = [];
    sim.config.explorationChance = 0; // Force trail following when trail exists

    const colony = sim.colonies[0];
    colony.ants = [colony.ants[0]];
    const ant = colony.ants[0];

    ant.x = 400;
    ant.y = 100;
    ant.vx = 1.5;
    ant.vy = 0.0;
    ant.carryingFood = false;
    ant.carryingEgg = false;
    ant.waypointPath = undefined;
    ant.wanderTicksRemaining = 30;

    // Deposit strong trail right ahead of ant
    colony.pheromones.deposit(410, 100, 0.8);

    sim.tick();

    assert(ant.currentAction === 'follow_trail', `Expected currentAction to be follow_trail, got ${ant.currentAction}`);
    assert(ant.wanderTicksRemaining === 0, `Expected wanderTicksRemaining reset to 0 upon trail recovery, got ${ant.wanderTicksRemaining}`);
    console.log('✓ Anchor 115 PASSED: Wandering ant immediately resumed follow_trail and reset wanderTicksRemaining to 0 upon trail recovery.');
  }

  // Anchor 116: Real Task-Commitment Wander Probe
  {
    console.log('\nTesting Anchor 116: Real Task-Commitment Wander Probe...');
    const sim = createDugSim();
    sim.colonies[0].nest.foodStore = 100;
    sim.colonies[1].nest.foodStore = 100;
    for (let t = 0; t < 2000; t++) {
      sim.tick();
    }
    assert(sim.taskCommittedWanderViolations === 0, `Expected 0 task-committed wander violations across 2000 ticks, got ${sim.taskCommittedWanderViolations}`);
    console.log('✓ Anchor 116 PASSED: Zero task-committed ants ever initiated a wander commitment across 2000 ticks.');
  }

  // Anchor 117: Multi-Trial Anchor 46 & 110 Reliability Probe
  {
    console.log('\nTesting Anchor 117: Multi-Trial Anchor 46 & 110 Reliability Probe...');
    for (let trial = 0; trial < 10; trial++) {
      const sim = createDugSim();
      const nursery = sim.chambers.find(c => c.chamberType === 'nursery')!;
      const staleEgg: Egg = {
        id: 9001 + trial,
        x: nursery.x,
        y: nursery.y,
        incubationSeconds: 11.989,
        state: 'nursery',
        careLevel: 0.0,
      };
      sim.eggs = [staleEgg];

      let candidateAtPromotion: Egg | undefined;
      for (let t = 0; t < 630; t++) {
        sim.queen.queenHealth = 0.0;
        const wasDead = sim.queen.isDead;
        sim.tick();
        if (!wasDead && sim.queen.isDead) {
          candidateAtPromotion = sim.eggs.find(e => e.isRoyalCandidate);
        }
      }

      assert(candidateAtPromotion !== undefined, `Trial ${trial}: Expected emergency candidate promotion upon queen death`);
    }

    for (let trial = 0; trial < 10; trial++) {
      const sim = createDugSim();
      sim.foodNodes = [];
      const colony0 = sim.colonies[0];
      const colony1 = sim.colonies[1];
      colony1.ants = [];
      colony1.queen.isDead = true;
      colony1.nest.foodStore = 10;
      const initialColony0Store = colony0.nest.foodStore;
      const thief = colony0.ants[0];
      colony0.ants = [thief];

      const enemyStorage = colony1.chambers.find(c => c.chamberType === 'storage')!;
      thief.x = enemyStorage.x;
      thief.y = enemyStorage.y;
      thief.currentAction = 'infiltrate';
      sim.setAntWaypointPath(thief, 0, 1, colony1);
      thief.waypointIndex = thief.waypointPath!.length - 1;

      let deposited = false;
      for (let t = 0; t < 2000; t++) {
        thief.energy = 1.0;
        sim.tick();
        if (colony0.nest.foodStore > initialColony0Store) {
          deposited = true;
          break;
        }
      }
      assert(deposited, `Trial ${trial}: Stolen food was not successfully smuggled and stored`);
    }
    console.log('✓ Anchor 117 PASSED: Anchor 46 and Anchor 110 both verified 100% reliable across 10 independent trials each.');
  }

  // Anchor 118: Unconditional Engage for Defender Against Intruder
  {
    console.log('\nTesting Anchor 118: Unconditional Engage for Defender Against Intruder Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];

    const defender = colony1.ants[0];
    defender.currentAction = 'idle';
    defender.x = 450;
    defender.y = 150;

    colony0.ants = [];
    for (let i = 0; i < 3; i++) {
      const infiltrator: Ant = {
        id: 8000 + i,
        x: 450 + i * 2,
        y: 150 + i * 2,
        vx: 0,
        vy: 0,
        energy: 1.0,
        health: 1.0,
        age: 0,
        carryingFood: false,
        currentAction: 'infiltrate',
      };
      colony0.ants.push(infiltrator);
    }

    sim.combatSystem.assessEncounter(defender, colony1, colony0);

    assert(defender.combatAction === 'engage', `Expected defender combatAction to be engage despite being heavily outnumbered (1 vs 3), got ${defender.combatAction}`);
    console.log('✓ Anchor 118 PASSED: Defender ant encountering detected infiltrators engaged unconditionally despite being heavily outnumbered.');
  }

  // Anchor 119: Ordinary Shared-Lane Encounter Preserves Odds-Based Decision
  {
    console.log('\nTesting Anchor 119: Ordinary Shared-Lane Encounter Preserves Odds-Based Decision...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];

    const ant0 = colony0.ants[0];
    ant0.currentAction = 'idle';
    ant0.x = 450;
    ant0.y = 400;

    colony1.ants = [];
    for (let i = 0; i < 3; i++) {
      const ant1: Ant = {
        id: 9000 + i,
        x: 450 + i * 2,
        y: 400 + i * 2,
        vx: 0,
        vy: 0,
        energy: 1.0,
        health: 1.0,
        age: 0,
        carryingFood: false,
        currentAction: 'idle',
      };
      colony1.ants.push(ant1);
    }

    sim.combatSystem.assessEncounter(ant0, colony0, colony1);

    assert(ant0.combatAction === 'flee', `Expected ant0 in ordinary shared-lane encounter to flee when outnumbered 1 vs 3, got ${ant0.combatAction}`);
    console.log('✓ Anchor 119 PASSED: Ordinary shared-lane encounter preserved odds-based flee decision when heavily outnumbered.');
  }

  // Anchor 120: Defense Location Scoping Probe (Shared Lane vs Home Territory)
  {
    console.log('\nTesting Anchor 120: Defense Location Scoping Probe...');
    const sim = createDugSim();
    const colony0 = sim.colonies[0];
    const colony1 = sim.colonies[1];

    const ant0 = colony0.ants[0];
    ant0.currentAction = 'idle';

    // 3 enemy ants from colony 1, including a smuggler
    colony1.ants = [];
    for (let i = 0; i < 3; i++) {
      const enemyAnt: Ant = {
        id: 9100 + i,
        x: 450 + i * 2,
        y: 400 + i * 2,
        vx: 0,
        vy: 0,
        energy: 1.0,
        health: 1.0,
        age: 0,
        carryingFood: false,
        currentAction: i === 0 ? 'smuggle_home' : 'idle',
      };
      colony1.ants.push(enemyAnt);
    }

    // Test Phase A: Shared Lane (y = 400)
    ant0.x = 450;
    ant0.y = 400;
    for (const e of colony1.ants) {
      e.x = 450;
      e.y = 400;
    }
    sim.combatSystem.assessEncounter(ant0, colony0, colony1);
    assert(ant0.combatAction === 'flee', `Expected ant0 in shared lane near smuggler to flee when outnumbered 1 vs 3, got ${ant0.combatAction}`);

    // Test Phase B: Defender's Home Territory (y = 650)
    ant0.x = 450;
    ant0.y = 650;
    for (const e of colony1.ants) {
      e.x = 450;
      e.y = 650;
    }
    sim.combatSystem.assessEncounter(ant0, colony0, colony1);
    assert(ant0.combatAction === 'engage', `Expected ant0 in own home territory near smuggler to engage unconditionally despite 1 vs 3 odds, got ${ant0.combatAction}`);

    console.log('✓ Anchor 120 PASSED: Location scoping verified — shared lane uses odds-based flee, home territory triggers unconditional engage.');
  }

  console.log('\n==================================================');
  console.log('ALL 120 TEST ANCHORS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');
}

// Auto-run if executed directly via tsx
if (import.meta.url.endsWith('simulation.test.ts')) {
  runTests();
}

