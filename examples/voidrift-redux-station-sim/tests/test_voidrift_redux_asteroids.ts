import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  tickSimulation,
  routeCompoundToContainer,
} from '../ts/src/games/voidrift_redux/services/simulation';

describe('VoidRift Redux — Asteroid & Mining Physics', () => {
  it('1. asteroid breakdown produces dust AND compounds as separate independent tracks', () => {
    const state = createInitialGameState();
    const asteroid = state.asteroids[0];
    expect(asteroid.composition.dust).toBeGreaterThan(0);
    expect(asteroid.composition.compoundId).toBeDefined();
    expect(asteroid.composition.compoundAmount).toBeGreaterThan(0);
    // Dust and compounds are tracked on independent properties
    expect(typeof asteroid.composition.dust).toBe('number');
    expect(typeof asteroid.composition.compoundAmount).toBe('number');
  });

  it('2. mined dust goes directly to state.dust upon drone dock deposit', () => {
    const state = createInitialGameState();
    const drone = state.drones[0];
    drone.state = 'returning';
    drone.x = 40;
    drone.y = 0;
    drone.cargo = { dust: 40, compounds: {} };
    const prevDust = state.dust;

    const updated = tickSimulation(state, 0.5);
    expect(updated.dust).toBe(prevDust + 40);
    expect(drone.cargo.dust).toBe(0);
  });

  it('3. mined compounds route through container function to matching slots', () => {
    const state = createInitialGameState();
    const drone = state.drones[0];
    drone.state = 'returning';
    drone.x = 40;
    drone.y = 0;
    drone.cargo = { dust: 0, compounds: { nitrogen_vapor: 20 } };

    const gasSlot = state.containerSlots.find((s) => s.stateType === 'gas')!;
    const prevGas = gasSlot.amount;

    const updated = tickSimulation(state, 0.5);
    expect(gasSlot.amount).toBe(prevGas + 20);
    expect(drone.cargo.compounds.nitrogen_vapor).toBeUndefined();
  });

  it('4. compound overflow does not add to dust', () => {
    const state = createInitialGameState();
    // Fill all gas slots to max
    for (const slot of state.containerSlots.filter((s) => s.stateType === 'gas')) {
      slot.amount = slot.capacity;
    }
    const prevDust = state.dust;

    const res = routeCompoundToContainer(state, 'nitrogen_vapor', 30);
    expect(res.overflow).toBe(30);
    expect(res.deposited).toBe(0);
    // State dust remains unaffected by compound overflow
    expect(state.dust).toBe(prevDust);
  });

  it('5. drone laser mining reduces asteroid health', () => {
    const state = createInitialGameState();
    const drone = state.drones[0];
    const asteroid = state.asteroids[0];
    drone.state = 'mining';
    drone.targetAsteroidId = asteroid.id;
    drone.x = asteroid.x;
    drone.y = asteroid.y;
    const prevHealth = asteroid.health;

    const updated = tickSimulation(state, 1.0);
    expect(asteroid.health).toBeLessThan(prevHealth);
  });

  it('6. asteroid is removed from state when health reaches 0', () => {
    const state = createInitialGameState();
    const drone = state.drones[0];
    const asteroid = state.asteroids[0];
    drone.state = 'mining';
    drone.targetAsteroidId = asteroid.id;
    drone.x = asteroid.x;
    drone.y = asteroid.y;
    asteroid.health = 1; // 1 HP left

    const updated = tickSimulation(state, 1.0);
    expect(updated.asteroids.some((a) => a.id === asteroid.id)).toBe(false);
  });
});
