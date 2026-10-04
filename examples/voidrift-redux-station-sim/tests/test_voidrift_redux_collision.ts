import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  handleStationCollision,
} from '../ts/src/games/voidrift_redux/services/simulation';
import { Asteroid } from '../ts/src/games/voidrift_redux/types';

describe('VoidRift Redux — Station Collision & Defense', () => {
  const dummyAsteroid: Asteroid = {
    id: 'ast_test_col',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 20,
    health: 80,
    maxHealth: 80,
    tier: 1,
    mineralType: 'Heavy Basalt',
    composition: {
      dust: 50,
      compoundId: 'silicate_shard',
      compoundAmount: 20,
    },
  };

  it('1. Hull Plating halves collision damage', () => {
    const state = createInitialGameState();
    // Clear all modules, place 1 hull plating
    state.modules = [
      {
        id: 'mod_plating_1',
        type: 'hull_plating',
        x: 0,
        y: 0,
        level: 1,
        health: 200,
        maxHealth: 200,
        isPowered: true,
        efficiency: 1.0,
      },
    ];

    const prevHealth = state.modules[0].health;
    const updated = handleStationCollision(state, { ...dummyAsteroid });
    const damageTaken = prevHealth - updated.modules[0].health;
    // Base damage is (20 * 1.5 + 1 * 8) * 0.7 = 26.6 -> 27. Halved with plating = 13 or 14.
    expect(damageTaken).toBeLessThanOrEqual(14);
    expect(damageTaken).toBeGreaterThan(0);
    expect(updated.stats.collisionsDeflected).toBe(1);
  });

  it('2. Unprotected module takes full un-halved collision damage', () => {
    const state = createInitialGameState();
    // Place single drone bay with no plating
    state.modules = [
      {
        id: 'mod_unprotected',
        type: 'drone_bay',
        x: 5,
        y: 5,
        level: 1,
        health: 100,
        maxHealth: 100,
        isPowered: true,
        efficiency: 1.0,
      },
    ];

    const prevHealth = state.modules[0].health;
    const updated = handleStationCollision(state, { ...dummyAsteroid });
    const damageTaken = prevHealth - updated.modules[0].health;
    expect(damageTaken).toBeGreaterThan(20);
  });

  it('3. Container breach occurs when container module health drops below 40%', () => {
    const state = createInitialGameState();
    const gasMod = state.modules.find((m) => m.type === 'containment_gas')!;
    // Set health to 10 HP (well below 40% of 80 HP)
    gasMod.health = 10;
    state.modules = [gasMod];

    const gasSlot = state.containerSlots.find((s) => s.id === gasMod.containerSlotId)!;
    gasSlot.amount = 80;
    gasSlot.isBreached = false;

    const updated = handleStationCollision(state, { ...dummyAsteroid });
    const updatedSlot = updated.containerSlots.find((s) => s.id === gasMod.containerSlotId)!;
    expect(updatedSlot.isBreached).toBe(true);
  });

  it('4. Breached container loses 30% stored compound', () => {
    const state = createInitialGameState();
    const gasMod = state.modules.find((m) => m.type === 'containment_gas')!;
    gasMod.health = 5;
    state.modules = [gasMod];

    const gasSlot = state.containerSlots.find((s) => s.id === gasMod.containerSlotId)!;
    gasSlot.amount = 100;

    const updated = handleStationCollision(state, { ...dummyAsteroid });
    const updatedSlot = updated.containerSlots.find((s) => s.id === gasMod.containerSlotId)!;
    expect(updatedSlot.amount).toBe(70); // 100 - 30% = 70
  });

  it('5. Collision logs an event entry in state.collisionLogs', () => {
    const state = createInitialGameState();
    state.collisionLogs = [];

    const updated = handleStationCollision(state, { ...dummyAsteroid });
    expect(updated.collisionLogs.length).toBe(1);
    expect(updated.collisionLogs[0].damage).toBeGreaterThan(0);
    expect(updated.collisionLogs[0].debrisDustAwarded).toBe(25); // 50 * 0.5
  });

  it('6. Bonus dust from debris is credited to state.dust', () => {
    const state = createInitialGameState();
    const prevDust = state.dust;

    const updated = handleStationCollision(state, { ...dummyAsteroid });
    expect(updated.dust).toBe(prevDust + 25);
  });
});
