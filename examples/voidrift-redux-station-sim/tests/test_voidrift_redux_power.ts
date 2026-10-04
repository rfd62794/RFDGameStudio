import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  computePowerBalance,
} from '../ts/src/games/voidrift_redux/services/simulation';

describe('VoidRift Redux — Station Power Grid System', () => {
  it('1. computePowerBalance calculates total generated power from power cells', () => {
    const state = createInitialGameState();
    // In initial state, 1 power cell generates 8 kW
    const result = computePowerBalance(state);
    expect(result.generated).toBe(8);
  });

  it('2. computePowerBalance calculates total consumed power from consumers', () => {
    const state = createInitialGameState();
    const result = computePowerBalance(state);
    expect(result.consumed).toBeGreaterThanOrEqual(7);
  });

  it('3. computePowerBalance reports sufficient = true when generated >= consumed', () => {
    const state = createInitialGameState();
    // Add 2 more power cells
    state.modules.push(
      {
        id: 'mod_pc2',
        type: 'power_cell',
        x: 2,
        y: 0,
        level: 1,
        health: 90,
        maxHealth: 90,
        isPowered: true,
        efficiency: 1.0,
      },
      {
        id: 'mod_pc3',
        type: 'power_cell',
        x: 3,
        y: 0,
        level: 1,
        health: 90,
        maxHealth: 90,
        isPowered: true,
        efficiency: 1.0,
      }
    );

    const result = computePowerBalance(state);
    expect(result.generated).toBe(24);
    expect(result.sufficient).toBe(true);
  });

  it('4. computePowerBalance reports sufficient = false when consumed > generated', () => {
    const state = createInitialGameState();
    // Remove power cells
    state.modules = state.modules.filter((m) => m.type !== 'power_cell');

    const result = computePowerBalance(state);
    expect(result.generated).toBe(0);
    expect(result.sufficient).toBe(false);
  });

  it('5. sets isPowered = false on consumer modules when power is insufficient', () => {
    const state = createInitialGameState();
    state.modules = state.modules.filter((m) => m.type !== 'power_cell');

    computePowerBalance(state);
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    expect(chamber.isPowered).toBe(false);
  });

  it('6. damaged power cell scales generated output by health ratio', () => {
    const state = createInitialGameState();
    // Keep 1 power cell at 50% health (45 / 90)
    const pc = state.modules.find((m) => m.type === 'power_cell')!;
    pc.health = 45;
    pc.maxHealth = 90;
    state.modules = [pc];

    const result = computePowerBalance(state);
    // 8 kW * (45/90) = 4 kW
    expect(result.generated).toBe(4);
  });
});
