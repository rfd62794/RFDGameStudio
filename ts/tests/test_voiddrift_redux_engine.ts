import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  VoidDriftEngine,
  DEFAULT_CONFIG,
} from '../src/games/voiddrift_redux/simulation/engine';
import type {
  MiningFSMState,
  HaulerFSMState,
} from '../src/games/voiddrift_redux/types';

const MINING_STATES: readonly MiningFSMState[] = [
  'Holding',
  'Dispatched',
  'Traveling',
  'Mining',
  'Returning',
];
const HAULER_STATES: readonly HaulerFSMState[] = [
  'Docked',
  'Dispatched',
  'Traveling',
  'Latched',
  'Tugging',
  'Released',
  'Returning',
];

beforeEach(() => {
  // engine.ts uses Math.random() for asteroid/fragment spawn geometry and
  // log ids; pin it so world generation is deterministic.
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VoidDrift Redux engine — fleet init', () => {
  it('spawns the fleet from DEFAULT_CONFIG with miners Holding and haulers Docked', () => {
    const engine = new VoidDriftEngine();

    expect(engine.scouts.length).toBe(DEFAULT_CONFIG.scoutCount);
    expect(engine.miningDrones.length).toBe(DEFAULT_CONFIG.miningDroneCount);
    expect(engine.haulers.length).toBe(DEFAULT_CONFIG.haulerCount);
    for (const drone of engine.miningDrones) {
      expect(drone.state).toBe('Holding');
    }
    for (const hauler of engine.haulers) {
      expect(hauler.state).toBe('Docked');
    }
  });

  it('honours a partial SimulationConfig override', () => {
    const engine = new VoidDriftEngine({
      scoutCount: 2,
      miningDroneCount: 4,
      haulerCount: 1,
    });

    expect(engine.scouts.length).toBe(2);
    expect(engine.miningDrones.length).toBe(4);
    expect(engine.haulers.length).toBe(1);
  });
});

describe('VoidDrift Redux engine — updateFleetSizes', () => {
  it('resizes scouts, miners and haulers to the requested counts', () => {
    const engine = new VoidDriftEngine();

    engine.updateFleetSizes(2, 5, 3);

    expect(engine.config.scoutCount).toBe(2);
    expect(engine.config.miningDroneCount).toBe(5);
    expect(engine.config.haulerCount).toBe(3);
    expect(engine.scouts.length).toBe(2);
    expect(engine.miningDrones.length).toBe(5);
    expect(engine.haulers.length).toBe(3);
  });

  it('is a no-op when counts are unchanged', () => {
    const engine = new VoidDriftEngine();
    const logCount = engine.logs.length;

    engine.updateFleetSizes(
      DEFAULT_CONFIG.scoutCount,
      DEFAULT_CONFIG.miningDroneCount,
      DEFAULT_CONFIG.haulerCount
    );

    expect(engine.logs.length).toBe(logCount);
    expect(engine.miningDrones.length).toBe(DEFAULT_CONFIG.miningDroneCount);
  });
});

describe('VoidDrift Redux engine — manual mining dispatch', () => {
  it('dispatches an idle mining drone to a Ring 1 asteroid', () => {
    const engine = new VoidDriftEngine();
    const target = engine.asteroids.find(
      (a) => a.ring === 1 && a.orbitRadius <= engine.config.ring1OuterRadius
    )!;

    const ok = engine.triggerManualMiningDispatch('miner-1', target.id);

    expect(ok).toBe(true);
    const drone = engine.miningDrones.find((d) => d.id === 'miner-1')!;
    expect(drone.state).not.toBe('Holding');
    expect(drone.state).toBe('Dispatched');
    expect(drone.targetAsteroidId).toBe(target.id);
    expect(target.isTargeted).toBe(true);
  });

  it('returns false for an unknown drone id', () => {
    const engine = new VoidDriftEngine();
    const target = engine.asteroids.find((a) => a.ring === 1)!;

    expect(
      engine.triggerManualMiningDispatch('miner-999', target.id)
    ).toBe(false);
  });

  it('returns false when the drone is already out of Holding', () => {
    const engine = new VoidDriftEngine();
    const first = engine.asteroids[0];
    const second = engine.asteroids.find((a) => a.id !== first.id) ?? first;

    expect(engine.triggerManualMiningDispatch('miner-1', first.id)).toBe(true);
    expect(engine.triggerManualMiningDispatch('miner-1', second.id)).toBe(false);
  });
});

describe('VoidDrift Redux engine — update loop', () => {
  it('steps a bounded sim without throwing and keeps every FSM state legal', () => {
    const engine = new VoidDriftEngine({ autoDispatch: true });
    // Exercise the hauler tug path too: manual tug does not require detection.
    const ring2 = engine.asteroids.find((a) => a.ring === 2);
    if (ring2) {
      engine.triggerManualHaulerTug('hauler-1', ring2.id);
    }

    const dt = 0.1;
    for (let tick = 0; tick < 400; tick++) {
      engine.update(dt);
      for (const drone of engine.miningDrones) {
        expect(MINING_STATES).toContain(drone.state);
      }
      for (const hauler of engine.haulers) {
        expect(HAULER_STATES).toContain(hauler.state);
      }
    }

    // With autoDispatch the scout/miner loop should have run at least once.
    expect(engine.stats.closedLoopsCompleted).toBeGreaterThan(0);
  });
});

describe('VoidDrift Redux engine — smelter', () => {
  it('startSmeltAluminum returns false with no RawAluminum in stock', () => {
    const engine = new VoidDriftEngine();

    expect(engine.stats.resources.RawAluminum).toBe(0);
    expect(engine.startSmeltAluminum()).toBe(false);
    expect(engine.stats.conversions.length).toBe(0);
  });

  it('consumes RawAluminum and completes a 10 -> 5 Aluminum batch', () => {
    const engine = new VoidDriftEngine();
    engine.stats.resources.RawAluminum = 20;

    expect(engine.startSmeltAluminum()).toBe(true);
    expect(engine.stats.resources.RawAluminum).toBe(10);
    expect(engine.stats.conversions.length).toBe(1);
    expect(engine.stats.conversions[0].status).toBe('processing');

    // Recipe duration is 8.0s; step past it and the output lands.
    for (let i = 0; i < 85; i++) {
      engine.update(0.1);
    }
    expect(engine.stats.conversions[0].status).toBe('complete');
    expect(engine.stats.resources.Aluminum).toBe(5);
  });
});
