import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  checkAutoReconstruction,
  tickSimulation,
} from '../ts/src/games/voidrift_redux/services/simulation';

describe('VoidRift Redux — Reconstruction System (Cosmic Catalog)', () => {
  it('1. checkAutoReconstruction does not trigger when products are insufficient', () => {
    const state = createInitialGameState();
    state.dust = 1000;
    // Clear products
    state.products.fracture_solvent.count = 0;
    const voidBloom = state.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;
    voidBloom.isReconstructing = false;

    checkAutoReconstruction(state);
    expect(voidBloom.isReconstructing).toBe(false);
  });

  it('2. checkAutoReconstruction does not trigger when dust is insufficient', () => {
    const state = createInitialGameState();
    state.dust = 0; // 0 dust
    state.products.fracture_solvent.count = 5;
    const voidBloom = state.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;
    voidBloom.isReconstructing = false;

    checkAutoReconstruction(state);
    expect(voidBloom.isReconstructing).toBe(false);
  });

  it('3. checkAutoReconstruction triggers when both products and dust meet requirements', () => {
    const state = createInitialGameState();
    state.dust = 100;
    state.products.fracture_solvent.count = 2;
    const voidBloom = state.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;

    checkAutoReconstruction(state);
    expect(voidBloom.isReconstructing).toBe(true);
    expect(voidBloom.progress).toBe(0);
  });

  it('4. deducts products and dust upon triggering reconstruction', () => {
    const state = createInitialGameState();
    state.dust = 200;
    state.products.fracture_solvent.count = 3;
    const voidBloom = state.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;
    const prevDust = state.dust;
    const prevProducts = state.products.fracture_solvent.count;

    checkAutoReconstruction(state);
    expect(state.dust).toBe(prevDust - voidBloom.dustCost);
    expect(state.products.fracture_solvent.count).toBe(prevProducts - 1);
  });

  it('5. sets isReconstructing = true and progress = 0', () => {
    const state = createInitialGameState();
    state.dust = 500;
    state.products.fracture_solvent.count = 1;
    const voidBloom = state.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;

    checkAutoReconstruction(state);
    expect(voidBloom.isReconstructing).toBe(true);
    expect(voidBloom.progress).toBe(0);
  });

  it('6. advances reconstruction progress during simulation tick', () => {
    const state = createInitialGameState();
    const voidBloom = state.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;
    voidBloom.isReconstructing = true;
    voidBloom.progress = 10;

    const updated = tickSimulation(state, 2.0);
    const updatedItem = updated.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;
    expect(updatedItem.progress).toBeGreaterThan(10);
  });

  it('7. marks isCompleted = true and increments totalReconstructedEntities on completion', () => {
    const state = createInitialGameState();
    const voidBloom = state.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;
    voidBloom.isReconstructing = true;
    voidBloom.progress = 99.0;
    const prevReconstructed = state.stats.totalReconstructedEntities;

    const updated = tickSimulation(state, 2.0);
    const updatedItem = updated.reconstructionItems.find((i) => i.id === 'rec_void_bloom')!;
    expect(updatedItem.isCompleted).toBe(true);
    expect(updatedItem.isReconstructing).toBe(false);
    expect(updated.stats.totalReconstructedEntities).toBe(prevReconstructed + 1);
  });

  it('8. Star completion increments prestigeMultiplier by 0.25', () => {
    const state = createInitialGameState();
    const star = state.reconstructionItems.find((i) => i.id === 'rec_sol_restored')!;
    star.isReconstructing = true;
    star.progress = 99.0;
    const prevMult = state.prestigeMultiplier;

    const updated = tickSimulation(state, 5.0);
    const updatedStar = updated.reconstructionItems.find((i) => i.id === 'rec_sol_restored')!;
    expect(updatedStar.isCompleted).toBe(true);
    expect(updated.prestigeMultiplier).toBe(prevMult + 0.25);
  });
});
