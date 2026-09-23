import { describe, expect, it } from 'vitest';
import { clampTier, create_initial_world, resolve_tick, soil_upgrade_target } from './slimeEngine';
import { runAllEngineTests } from './tests';

describe('slimeEngine tier clamp', () => {
  it('tier_clamp_rejects_values_above_three', () => {
    expect(clampTier(10)).toBe(3);
    expect(clampTier(3.9)).toBe(3);

    // Initial-world preset tile 12 has Fire tier 4 in source; it must be stored as 3.
    const world = create_initial_world();
    expect(world.tiles[12].tiers[2]).toBe(3);

    // resolve_tick deltas are also clamped.
    const next = resolve_tick(world, new Map([[0, [10, 0, 0, 0]]]));
    expect(next.tiles[0].tiers[0]).toBe(3);
  });

  it('tier_clamp_rejects_negative_values', () => {
    expect(clampTier(-2)).toBe(0);

    const world = create_initial_world();
    const next = resolve_tick(world, new Map([[0, [-5, 0, 0, 0]]]));
    expect(next.tiles[0].tiers[0]).toBe(0);
  });
});

describe('slimeEngine fallback handling', () => {
  it('unhandled_case_throws_not_returns_default', () => {
    expect(() => soil_upgrade_target('UnknownSoil' as any)).toThrow();
  });
});

describe('slimeEngine custom runner', () => {
  it('runs all engine tests without failures', () => {
    const report = runAllEngineTests();
    expect(report.failed).toBe(0);
    for (const r of report.results) {
      expect(r.passed).toBe(true);
    }
  });
});
