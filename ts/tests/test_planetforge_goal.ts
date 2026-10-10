// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { evaluate_goal, goalLine, WIN_TITLE } from '../../examples/planetforge/src/goal';
import { create_initial_world, resolve_tick, attempt_construct_monument } from '../../examples/planetforge/src/engine/slimeEngine';
import { NUM_SECTORS, SOIL_STABILITY_TICKS } from '../../examples/planetforge/src/types';

describe('test_planetforge_goal', () => {
  it('a fresh world is still playing with no monuments', () => {
    const g = evaluate_goal(create_initial_world());
    expect(g.status).toBe('playing');
    expect(g.monuments).toBe(0);
    expect(g.sectors).toBe(NUM_SECTORS);
  });

  it('monuments alone are not a win until every sector has settled', () => {
    const w = create_initial_world();
    w.sectors.forEach((s) => { s.structure = { type: 'Monument', bonus_focus: 5 }; });
    w.tiles.forEach((t) => { t.ticks_stable = 0; });
    const g = evaluate_goal(w);
    expect(g.monuments).toBe(NUM_SECTORS);
    expect(g.settledSectors).toBe(0);
    expect(g.status).toBe('playing');
  });

  it('wins when all eight sectors hold a Monument and every tile has held steady', () => {
    const w = create_initial_world();
    w.sectors.forEach((s) => { s.structure = { type: 'Monument', bonus_focus: 5 }; });
    w.tiles.forEach((t) => { t.ticks_stable = SOIL_STABILITY_TICKS; });
    expect(evaluate_goal(w)).toEqual({ status: 'won', monuments: NUM_SECTORS, settledSectors: NUM_SECTORS, sectors: NUM_SECTORS });
  });

  it('one perturbed tile keeps the win away', () => {
    const w = create_initial_world();
    w.sectors.forEach((s) => { s.structure = { type: 'Monument', bonus_focus: 5 }; });
    w.tiles.forEach((t) => { t.ticks_stable = SOIL_STABILITY_TICKS; });
    w.tiles[7].ticks_stable = 0;
    const g = evaluate_goal(w);
    expect(g.status).toBe('playing');
    expect(g.settledSectors).toBe(NUM_SECTORS - 1);
  });

  it('loses only when every tile is drained to tier 0', () => {
    const w = create_initial_world();
    w.tiles.forEach((t) => { t.tiers = [0, 0, 0, 0]; });
    expect(evaluate_goal(w).status).toBe('lost');
    w.tiles[3].tiers = [0, 0, 1, 0];
    expect(evaluate_goal(w).status).toBe('playing');
  });

  it('real engine: passive play, building a Monument as soon as one is affordable, reaches the win', () => {
    let w = create_initial_world();
    let ticks = 0;
    while (evaluate_goal(w).status === 'playing' && ticks < 200) {
      w = resolve_tick(w);
      ticks++;
      for (const s of w.sectors) {
        if (s.structure.type === 'None' && attempt_construct_monument(s, w.settlement_ledger)) break;
      }
    }
    expect(evaluate_goal(w).status).toBe('won');
    expect(ticks).toBeLessThan(100);
  });

  it('player copy is plain', () => {
    expect(goalLine({ status: 'playing', monuments: 3, settledSectors: 5, sectors: 8 })).toBe(
      'Goal: raise a Monument in every sector and let the ring settle. Monuments 3 of 8, settled sectors 5 of 8.',
    );
    expect(WIN_TITLE).toBe('Your ring is in balance');
  });
});
