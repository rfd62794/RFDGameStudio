import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  routeCompoundToContainer,
} from '../ts/src/games/voidrift_redux/services/simulation';

describe('VoidRift Redux — Container System (Astroneer Model)', () => {
  it('1. rejects cross-state routing (gas compound into liquid slot)', () => {
    const state = createInitialGameState();
    // Keep only liquid slots
    state.containerSlots = [
      {
        id: 'slot_l1',
        stateType: 'liquid',
        compoundId: null,
        amount: 0,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
    ];

    const result = routeCompoundToContainer(state, 'nitrogen_vapor', 20);
    expect(result.deposited).toBe(0);
    expect(result.overflow).toBe(20);
    expect(state.containerSlots[0].amount).toBe(0);
  });

  it('2. rejects cross-state routing (liquid compound into solid slot)', () => {
    const state = createInitialGameState();
    state.containerSlots = [
      {
        id: 'slot_s1',
        stateType: 'solid',
        compoundId: null,
        amount: 0,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
    ];

    const result = routeCompoundToContainer(state, 'mineral_slurry', 25);
    expect(result.deposited).toBe(0);
    expect(result.overflow).toBe(25);
  });

  it('3. rejects cross-state routing (solid compound into gas slot)', () => {
    const state = createInitialGameState();
    state.containerSlots = [
      {
        id: 'slot_g1',
        stateType: 'gas',
        compoundId: null,
        amount: 0,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
    ];

    const result = routeCompoundToContainer(state, 'silicate_shard', 30);
    expect(result.deposited).toBe(0);
    expect(result.overflow).toBe(30);
  });

  it('4. accepts matching state (gas compound into gas slot)', () => {
    const state = createInitialGameState();
    state.containerSlots = [
      {
        id: 'slot_g1',
        stateType: 'gas',
        compoundId: null,
        amount: 0,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
    ];

    const result = routeCompoundToContainer(state, 'nitrogen_vapor', 35);
    expect(result.deposited).toBe(35);
    expect(result.overflow).toBe(0);
    expect(state.containerSlots[0].amount).toBe(35);
    expect(state.containerSlots[0].compoundId).toBe('nitrogen_vapor');
  });

  it('5. accepts matching state (liquid compound into liquid slot)', () => {
    const state = createInitialGameState();
    state.containerSlots = [
      {
        id: 'slot_l1',
        stateType: 'liquid',
        compoundId: null,
        amount: 10,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
    ];

    const result = routeCompoundToContainer(state, 'mineral_slurry', 40);
    expect(result.deposited).toBe(40);
    expect(result.overflow).toBe(0);
    expect(state.containerSlots[0].amount).toBe(50);
  });

  it('6. accepts matching state (solid compound into solid slot)', () => {
    const state = createInitialGameState();
    state.containerSlots = [
      {
        id: 'slot_s1',
        stateType: 'solid',
        compoundId: 'silicate_shard',
        amount: 20,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
    ];

    const result = routeCompoundToContainer(state, 'silicate_shard', 15);
    expect(result.deposited).toBe(15);
    expect(result.overflow).toBe(0);
    expect(state.containerSlots[0].amount).toBe(35);
  });

  it('7. handles overflow when slot capacity is exceeded', () => {
    const state = createInitialGameState();
    state.containerSlots = [
      {
        id: 'slot_g1',
        stateType: 'gas',
        compoundId: 'nitrogen_vapor',
        amount: 80,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
    ];

    const result = routeCompoundToContainer(state, 'nitrogen_vapor', 50);
    expect(result.deposited).toBe(20);
    expect(result.overflow).toBe(30);
    expect(state.containerSlots[0].amount).toBe(100);
  });

  it('8. routes to existing compound slot before empty slot', () => {
    const state = createInitialGameState();
    state.containerSlots = [
      {
        id: 'slot_empty',
        stateType: 'solid',
        compoundId: null,
        amount: 0,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
      {
        id: 'slot_existing',
        stateType: 'solid',
        compoundId: 'silicate_shard',
        amount: 30,
        capacity: 100,
        integrity: 100,
        isBreached: false,
      },
    ];

    const result = routeCompoundToContainer(state, 'silicate_shard', 20);
    expect(result.deposited).toBe(20);
    expect(result.overflow).toBe(0);
    // Should fill the existing slot first
    expect(state.containerSlots[1].amount).toBe(50);
    expect(state.containerSlots[0].amount).toBe(0);
  });
});
