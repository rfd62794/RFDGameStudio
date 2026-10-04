import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  tickSimulation,
} from '../ts/src/games/voidrift_redux/services/simulation';

describe('VoidRift Redux — Synthesis Chamber System (SS13 Chemistry)', () => {
  it('1. halts synthesis when isPowered is false', () => {
    const state = createInitialGameState();
    // Remove all power generators
    state.modules = state.modules.filter((m) => m.type !== 'power_cell');
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    chamber.processingProgress = 10;

    const updated = tickSimulation(state, 1.0);
    const updatedChamber = updated.modules.find((m) => m.type === 'processing_chamber')!;
    expect(updatedChamber.isPowered).toBe(false);
    expect(updatedChamber.processingProgress).toBe(10);
  });

  it('2. does not advance progress without power regardless of compound availability', () => {
    const state = createInitialGameState();
    // Ensure huge amounts of compounds available
    for (const slot of state.containerSlots) {
      slot.amount = 100;
    }
    state.modules = state.modules.filter((m) => m.type !== 'power_cell');
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    chamber.processingProgress = 0;

    const updated = tickSimulation(state, 5.0);
    const updatedChamber = updated.modules.find((m) => m.type === 'processing_chamber')!;
    expect(updatedChamber.processingProgress).toBe(0);
  });

  it('3. halts synthesis when compound inputs are insufficient', () => {
    const state = createInitialGameState();
    // Clear all compounds
    for (const slot of state.containerSlots) {
      slot.amount = 0;
    }
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    chamber.processingProgress = 0;

    const updated = tickSimulation(state, 1.0);
    const updatedChamber = updated.modules.find((m) => m.type === 'processing_chamber')!;
    expect(updatedChamber.processingProgress).toBe(0);
  });

  it('4. advances processingProgress on valid powered tick with sufficient compounds', () => {
    const state = createInitialGameState();
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    chamber.processingProgress = 0;

    const updated = tickSimulation(state, 2.0);
    const updatedChamber = updated.modules.find((m) => m.type === 'processing_chamber')!;
    expect(updatedChamber.processingProgress).toBeGreaterThan(0);
  });

  it('5. deducts input compounds from containers upon recipe completion', () => {
    const state = createInitialGameState();
    const gasSlot = state.containerSlots.find((s) => s.stateType === 'gas')!;
    const liquidSlot = state.containerSlots.find((s) => s.stateType === 'liquid')!;
    gasSlot.amount = 40;
    liquidSlot.amount = 35;

    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    // Fracture Solvent needs 15 nitrogen_vapor + 10 mineral_slurry
    chamber.processingProgress = 99.0;

    const updated = tickSimulation(state, 1.0);
    expect(gasSlot.amount).toBe(25); // 40 - 15
    expect(liquidSlot.amount).toBe(25); // 35 - 10
  });

  it('6. increments product count in state.products on completion', () => {
    const state = createInitialGameState();
    state.dust = 0; // Prevent auto-reconstruction from consuming product
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    chamber.processingProgress = 99.0;
    expect(state.products.fracture_solvent.count).toBe(0);

    const updated = tickSimulation(state, 1.0);
    expect(updated.products.fracture_solvent.count).toBe(1);
  });

  it('7. increments state.stats.totalSynthesisRuns on completion', () => {
    const state = createInitialGameState();
    state.dust = 0;
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    chamber.processingProgress = 99.0;
    const prevRuns = state.stats.totalSynthesisRuns;

    const updated = tickSimulation(state, 1.0);
    expect(updated.stats.totalSynthesisRuns).toBe(prevRuns + 1);
  });

  it('8. resets processingProgress to 0 upon recipe completion', () => {
    const state = createInitialGameState();
    state.dust = 0;
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    chamber.processingProgress = 99.9;

    const updated = tickSimulation(state, 1.0);
    const updatedChamber = updated.modules.find((m) => m.type === 'processing_chamber')!;
    // Progress wraps around / resets after generating product
    expect(updatedChamber.processingProgress).toBeLessThan(50);
  });

  it('9. speeds up progress when fracture_solvent product is active', () => {
    const stateNoBonus = createInitialGameState();
    stateNoBonus.dust = 0;
    stateNoBonus.products.fracture_solvent.count = 0;
    const chamber1 = stateNoBonus.modules.find((m) => m.type === 'processing_chamber')!;
    chamber1.processingProgress = 0;
    tickSimulation(stateNoBonus, 1.0);

    const stateWithBonus = createInitialGameState();
    stateWithBonus.dust = 0;
    stateWithBonus.products.fracture_solvent.count = 1;
    const chamber2 = stateWithBonus.modules.find((m) => m.type === 'processing_chamber')!;
    chamber2.processingProgress = 0;
    tickSimulation(stateWithBonus, 1.0);

    expect(chamber2.processingProgress).toBeGreaterThan(chamber1.processingProgress);
  });

  it('10. multiple synthesis cycles accumulate outputs in state.products', () => {
    const state = createInitialGameState();
    state.dust = 0;
    state.products.fracture_solvent.count = 2;
    const chamber = state.modules.find((m) => m.type === 'processing_chamber')!;
    chamber.processingProgress = 99.0;

    const updated = tickSimulation(state, 1.0);
    expect(updated.products.fracture_solvent.count).toBe(3);
  });
});
