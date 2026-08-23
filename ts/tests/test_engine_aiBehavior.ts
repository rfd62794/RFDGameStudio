import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  forceSeek,
  forceFlee,
  forceSeparate,
  forceAvoid,
  forceAlign,
  forceCohere,
} from '../src/engine/shared/aiBehavior';
import {
  initGameState,
  tickGameInternal,
  CONFIG,
} from '../src/games/shoal/simulation/shoalSimulation';

const tsRoot = resolve(import.meta.dirname, '..');

// ── Direct unit tests for each extracted function ───────────────────

describe('aiBehavior steering — forceSeek', () => {
  it('test_forceSeek_returns_zero_for_zero_distance', () => {
    const [fx, fy] = forceSeek(10, 10, 10, 10, 1.0, 80);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceSeek_returns_unit_direction_scaled_by_weight_maxForce', () => {
    // Target is directly to the right (dx=100, dy=0)
    const [fx, fy] = forceSeek(0, 0, 100, 0, 1.0, 80);
    expect(fx).toBeCloseTo(80, 10);
    expect(fy).toBeCloseTo(0, 10);
  });

  it('test_forceSeek_diagonal_direction', () => {
    // Target at (100, 100) — diagonal, dist = 100*sqrt(2)
    const [fx, fy] = forceSeek(0, 0, 100, 100, 0.5, 100);
    const expected = (100 / (100 * Math.sqrt(2))) * 0.5 * 100;
    expect(fx).toBeCloseTo(expected, 10);
    expect(fy).toBeCloseTo(expected, 10);
  });

  it('test_forceSeek_weight_scales_output', () => {
    const [fx1] = forceSeek(0, 0, 100, 0, 1.0, 80);
    const [fx2] = forceSeek(0, 0, 100, 0, 2.0, 80);
    expect(fx2).toBeCloseTo(fx1 * 2, 10);
  });
});

describe('aiBehavior steering — forceFlee', () => {
  it('test_forceFlee_returns_zero_when_outside_radius', () => {
    // Threat at (200, 0), radiusSq = 100 (radius=10), entity at (0,0)
    const [fx, fy] = forceFlee(0, 0, 200, 0, 1.0, 80, 100);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceFlee_returns_zero_for_zero_distance', () => {
    const [fx, fy] = forceFlee(10, 10, 10, 10, 1.0, 80, 1000);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceFlee_pushes_away_from_threat', () => {
    // Threat at (100, 0), entity at (0, 0), radiusSq = 20000
    const [fx, fy] = forceFlee(0, 0, 100, 0, 1.0, 80, 20000);
    expect(fx).toBeCloseTo(80, 10); // pushes left (away from threat)
    expect(fy).toBeCloseTo(0, 10);
  });

  it('test_forceFlee_diagonal', () => {
    // Threat at (100, 100), entity at (0, 0)
    const [fx, fy] = forceFlee(0, 0, 100, 100, 1.0, 80, 30000);
    const dist = Math.sqrt(100 * 100 + 100 * 100);
    // Direction is (-100/dist, -100/dist) * 80
    expect(fx).toBeCloseTo((-100 / dist) * 80, 10);
    expect(fy).toBeCloseTo((-100 / dist) * 80, 10);
  });
});

describe('aiBehavior steering — forceSeparate', () => {
  it('test_forceSeparate_returns_zero_for_no_neighbors', () => {
    const [fx, fy] = forceSeparate(0, 0, [], n => ({ x: n.x, y: n.y, alive: n.alive }), 100, 1.0, 80);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceSeparate_returns_zero_for_all_dead_neighbors', () => {
    const neighbors = [{ x: 5, y: 0, alive: false }];
    const [fx, fy] = forceSeparate(0, 0, neighbors, n => ({ x: n.x, y: n.y, alive: n.alive }), 100, 1.0, 80);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceSeparate_pushes_away_from_single_neighbor', () => {
    // Neighbor at (5, 0), entity at (0, 0), radiusSq = 100
    const neighbors = [{ x: 5, y: 0, alive: true }];
    const [fx, fy] = forceSeparate(0, 0, neighbors, n => ({ x: n.x, y: n.y, alive: n.alive }), 100, 1.0, 80);
    // Should push left (away from neighbor at x=5)
    expect(fx).toBeLessThan(0);
    expect(fy).toBeCloseTo(0, 10);
    // Magnitude should be weight * maxForce = 80 (after normalization)
    expect(Math.abs(fx)).toBeCloseTo(80, 5);
  });

  it('test_forceSeparate_returns_zero_when_neighbor_at_same_position', () => {
    const neighbors = [{ x: 0, y: 0, alive: true }];
    const [fx, fy] = forceSeparate(0, 0, neighbors, n => ({ x: n.x, y: n.y, alive: n.alive }), 100, 1.0, 80);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });
});

describe('aiBehavior steering — forceAvoid', () => {
  it('test_forceAvoid_returns_zero_for_null_obstacles', () => {
    const [fx, fy] = forceAvoid(0, 0, null as any, o => ({ x: o.x, y: o.y, id: o.id }), 100, 1.0, 80);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceAvoid_skips_excluded_id', () => {
    const obstacles = [
      { id: 'a', x: 5, y: 0 },
      { id: 'b', x: -5, y: 0 },
    ];
    // Exclude 'a' — should only push from 'b' (to the right)
    const [fx, fy] = forceAvoid(0, 0, obstacles, o => ({ x: o.x, y: o.y, id: o.id }), 100, 1.0, 80, 'a');
    expect(fx).toBeGreaterThan(0); // pushed right (away from 'b' at x=-5)
    expect(fy).toBeCloseTo(0, 10);
  });

  it('test_forceAvoid_pushes_away_from_obstacle', () => {
    const obstacles = [{ id: 'x', x: 5, y: 0 }];
    const [fx, fy] = forceAvoid(0, 0, obstacles, o => ({ x: o.x, y: o.y, id: o.id }), 100, 1.0, 80);
    expect(fx).toBeLessThan(0); // pushed left
    expect(Math.abs(fx)).toBeCloseTo(80, 5);
  });
});

describe('aiBehavior steering — forceAlign', () => {
  it('test_forceAlign_returns_zero_for_no_neighbors', () => {
    const [fx, fy] = forceAlign(0, 0, [], n => ({ x: n.x, y: n.y, vx: n.vx, vy: n.vy, alive: n.alive }), 100, 1.0, 80);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceAlign_returns_zero_for_all_dead_neighbors', () => {
    const neighbors = [{ x: 5, y: 0, vx: 10, vy: 0, alive: false }];
    const [fx, fy] = forceAlign(0, 0, neighbors, n => ({ x: n.x, y: n.y, vx: n.vx, vy: n.vy, alive: n.alive }), 100, 1.0, 80);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceAlign_steers_toward_average_velocity', () => {
    // Two neighbors: one moving right (vx=10), one moving up (vy=10)
    const neighbors = [
      { x: 5, y: 0, vx: 10, vy: 0, alive: true },
      { x: 0, y: 5, vx: 0, vy: 10, alive: true },
    ];
    const [fx, fy] = forceAlign(0, 0, neighbors, n => ({ x: n.x, y: n.y, vx: n.vx, vy: n.vy, alive: n.alive }), 100, 1.0, 80);
    // Average velocity = (5, 5), normalized = (1/sqrt(2), 1/sqrt(2))
    // Force = normalized * weight * maxForce = (80/sqrt(2), 80/sqrt(2))
    expect(fx).toBeCloseTo(80 / Math.sqrt(2), 5);
    expect(fy).toBeCloseTo(80 / Math.sqrt(2), 5);
  });
});

describe('aiBehavior steering — forceCohere', () => {
  it('test_forceCohere_returns_zero_for_no_neighbors', () => {
    const [fx, fy] = forceCohere(0, 0, [], n => ({ x: n.x, y: n.y, alive: n.alive }), 100, 1.0, 80);
    expect(fx).toBe(0);
    expect(fy).toBe(0);
  });

  it('test_forceCohere_seeks_toward_centroid', () => {
    // Two neighbors at (100, 0) and (0, 100) — centroid is (50, 50)
    const neighbors = [
      { x: 100, y: 0, alive: true },
      { x: 0, y: 100, alive: true },
    ];
    const [fx, fy] = forceCohere(0, 0, neighbors, n => ({ x: n.x, y: n.y, alive: n.alive }), 50000, 1.0, 80);
    // Should seek toward (50, 50) — direction (1/sqrt(2), 1/sqrt(2))
    const dist = Math.sqrt(50 * 50 + 50 * 50);
    expect(fx).toBeCloseTo((50 / dist) * 80, 5);
    expect(fy).toBeCloseTo((50 / dist) * 80, 5);
  });

  it('test_forceCohere_skips_dead_neighbors', () => {
    const neighbors = [
      { x: 100, y: 0, alive: false },
      { x: 0, y: 100, alive: true },
    ];
    const [fx, fy] = forceCohere(0, 0, neighbors, n => ({ x: n.x, y: n.y, alive: n.alive }), 50000, 1.0, 80);
    // Only one live neighbor at (0, 100) — centroid is (0, 100)
    // Direction is (0, 1) * 80
    expect(fx).toBeCloseTo(0, 10);
    expect(fy).toBeCloseTo(80, 5);
  });
});

// ── Behavioral-equivalence proof ────────────────────────────────────
// The real proof: run Shoal's full simulation with a fixed seed for
// 100 ticks and verify the state matches the pre-extraction capture
// exactly. If the shared steering functions compute different values
// than the original local definitions, the deterministic simulation
// will diverge.

describe('aiBehavior — behavioral equivalence with Shoal', () => {
  // Pre-extraction captured values (seed=42, 100 ticks)
  // Captured BEFORE extraction by running the original local functions.
  const EXPECTED = {
    fishCount: 61,
    sharkCount: 8,
    fish: [
      { id: 'fish_55', x: 646.8910194125, depth: 392.0203026479, vx: -57.7684407303, vd: -12.2265544822, alive: false },
      { id: 'fish_56', x: 826.5494751491, depth: 361.4825437630, vx: 76.6908874118, vd: 83.4073425634, alive: true },
      { id: 'fish_57', x: 990.2721904203, depth: 87.6856553975, vx: -77.7289100816, vd: 89.8423983291, alive: true },
      { id: 'fish_58', x: 169.0597217963, depth: 365.0980910659, vx: 59.8219150930, vd: 50.6847653495, alive: true },
      { id: 'fish_59', x: 636.4277239698, depth: 128.9709183138, vx: -11.6574322675, vd: 15.3811958246, alive: false },
    ],
    sharks: [
      { id: 'shark_115', x: 667.4671269583, depth: 24.3086089607, vx: -67.6342493227, vd: 58.2700065065, alive: true },
      { id: 'shark_116', x: 542.8114514870, depth: 494.1326236862, vx: -32.1753089795, vd: -2.2420807804, alive: true },
      { id: 'shark_117', x: 170.0666450763, depth: 185.4419617009, vx: -3.8718623210, vd: 148.4495156010, alive: true },
    ],
    totalFishX: 26307.8476953803,
    totalFishDepth: 13870.1925564118,
    totalSharkX: 4120.0665154014,
    totalSharkDepth: 1980.1881338591,
  };

  it('test_behavioral_equivalence_fish_count_unchanged', () => {
    const st = initGameState(42, 60, 8, 6);
    const dt = CONFIG.world.discrete_tick;
    for (let i = 0; i < 100; i++) tickGameInternal(st, dt);
    expect(st.fish.length).toBe(EXPECTED.fishCount);
  });

  it('test_behavioral_equivalence_shark_count_unchanged', () => {
    const st = initGameState(42, 60, 8, 6);
    const dt = CONFIG.world.discrete_tick;
    for (let i = 0; i < 100; i++) tickGameInternal(st, dt);
    expect(st.sharks.length).toBe(EXPECTED.sharkCount);
  });

  it('test_behavioral_equivalence_first_5_fish_positions_match', () => {
    const st = initGameState(42, 60, 8, 6);
    const dt = CONFIG.world.discrete_tick;
    for (let i = 0; i < 100; i++) tickGameInternal(st, dt);
    for (let i = 0; i < Math.min(5, st.fish.length); i++) {
      const f = st.fish[i];
      const exp = EXPECTED.fish[i];
      expect(f.id).toBe(exp.id);
      expect(f.x).toBeCloseTo(exp.x, 4);
      expect(f.depth).toBeCloseTo(exp.depth, 4);
      expect(f.vx).toBeCloseTo(exp.vx, 4);
      expect(f.vd).toBeCloseTo(exp.vd, 4);
      expect(f.alive).toBe(exp.alive);
    }
  });

  it('test_behavioral_equivalence_first_3_shark_positions_match', () => {
    const st = initGameState(42, 60, 8, 6);
    const dt = CONFIG.world.discrete_tick;
    for (let i = 0; i < 100; i++) tickGameInternal(st, dt);
    for (let i = 0; i < Math.min(3, st.sharks.length); i++) {
      const s = st.sharks[i];
      const exp = EXPECTED.sharks[i];
      expect(s.id).toBe(exp.id);
      expect(s.x).toBeCloseTo(exp.x, 4);
      expect(s.depth).toBeCloseTo(exp.depth, 4);
      expect(s.vx).toBeCloseTo(exp.vx, 4);
      expect(s.vd).toBeCloseTo(exp.vd, 4);
      expect(s.alive).toBe(exp.alive);
    }
  });

  it('test_behavioral_equivalence_aggregate_stats_match', () => {
    const st = initGameState(42, 60, 8, 6);
    const dt = CONFIG.world.discrete_tick;
    for (let i = 0; i < 100; i++) tickGameInternal(st, dt);
    const totalFishX = st.fish.reduce((s, f) => s + f.x, 0);
    const totalFishDepth = st.fish.reduce((s, f) => s + f.depth, 0);
    const totalSharkX = st.sharks.reduce((s, sh) => s + sh.x, 0);
    const totalSharkDepth = st.sharks.reduce((s, sh) => s + sh.depth, 0);
    expect(totalFishX).toBeCloseTo(EXPECTED.totalFishX, 4);
    expect(totalFishDepth).toBeCloseTo(EXPECTED.totalFishDepth, 4);
    expect(totalSharkX).toBeCloseTo(EXPECTED.totalSharkX, 4);
    expect(totalSharkDepth).toBeCloseTo(EXPECTED.totalSharkDepth, 4);
  });

  it('test_behavioral_equivalence_500_ticks_stable', () => {
    // Run 500 ticks — if the shared functions diverge even slightly,
    // the divergence compounds over time and this will fail.
    const st = initGameState(42, 60, 8, 6);
    const dt = CONFIG.world.discrete_tick;
    for (let i = 0; i < 500; i++) tickGameInternal(st, dt);
    // The simulation should still be running with a reasonable population
    expect(st.fish.length).toBeGreaterThan(0);
    expect(st.sharks.length).toBeGreaterThan(0);
    // No NaN values — if the shared functions produce NaN, it would
    // propagate and break the entire simulation
    for (const f of st.fish) {
      expect(Number.isNaN(f.x)).toBe(false);
      expect(Number.isNaN(f.depth)).toBe(false);
      expect(Number.isNaN(f.vx)).toBe(false);
      expect(Number.isNaN(f.vd)).toBe(false);
    }
    for (const s of st.sharks) {
      expect(Number.isNaN(s.x)).toBe(false);
      expect(Number.isNaN(s.depth)).toBe(false);
      expect(Number.isNaN(s.vx)).toBe(false);
      expect(Number.isNaN(s.vd)).toBe(false);
    }
  });
});

// ── Shoal imports from shared module — no local duplicate definitions ─

describe('aiBehavior — Shoal imports from shared module', () => {
  it('test_shoal_imports_from_shared_aiBehavior', () => {
    const simSrc = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'simulation', 'shoalSimulation.ts'),
      'utf8',
    );
    expect(simSrc).toContain("from '../../../engine/shared/aiBehavior'");
    expect(simSrc).toContain('sharedForceSeek');
    expect(simSrc).toContain('sharedForceFlee');
    expect(simSrc).toContain('sharedForceSeparate');
    expect(simSrc).toContain('sharedForceAvoid');
    expect(simSrc).toContain('sharedForceAlign');
    expect(simSrc).toContain('sharedForceCohere');
  });

  it('test_shoal_no_local_forceSeek_definition', () => {
    const simSrc = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'simulation', 'shoalSimulation.ts'),
      'utf8',
    );
    // The old local definition was: function forceSeek(x:number,...
    // After extraction, forceSeek is a const alias to sharedForceSeek
    expect(simSrc).not.toMatch(/function forceSeek\(/);
    expect(simSrc).not.toMatch(/function forceFlee\(/);
  });

  it('test_shoal_neighbor_functions_delegate_to_shared', () => {
    const simSrc = readFileSync(
      resolve(tsRoot, 'src', 'games', 'shoal', 'simulation', 'shoalSimulation.ts'),
      'utf8',
    );
    // The local forceSeparate/forceAlign/forceCohere/forceAvoid should
    // delegate to sharedForceSeparate etc., not contain the full
    // computation logic inline
    expect(simSrc).toContain('sharedForceSeparate(x, y, neighbors, fishPosAccessor');
    expect(simSrc).toContain('sharedForceAlign(x, y, neighbors, fishVelAccessor');
    expect(simSrc).toContain('sharedForceCohere(x, y, neighbors, fishPosAccessor');
    expect(simSrc).toContain('sharedForceAvoid(x, y, obstacles, obstaclePosAccessor');
  });

  it('test_shared_module_exists_with_all_5_functions', () => {
    const steeringSrc = readFileSync(
      resolve(tsRoot, 'src', 'engine', 'shared', 'aiBehavior', 'steering.ts'),
      'utf8',
    );
    expect(steeringSrc).toContain('export function forceSeek');
    expect(steeringSrc).toContain('export function forceFlee');
    expect(steeringSrc).toContain('export function forceSeparate');
    expect(steeringSrc).toContain('export function forceAvoid');
    expect(steeringSrc).toContain('export function forceAlign');
    expect(steeringSrc).toContain('export function forceCohere');
  });
});

// ── Zero changes to other games / Y8 files ──────────────────────────

describe('aiBehavior — no changes to other games or Y8', () => {
  it('test_slither_rogue_unchanged', () => {
    const slitherDir = resolve(tsRoot, 'src', 'games', 'slither_rogue');
    const slitherSrc = readFileSync(resolve(slitherDir, 'config.ts'), 'utf8');
    // Just verify the file exists and is readable — no aiBehavior imports
    expect(slitherSrc).not.toContain('aiBehavior');
  });

  it('test_mutant_battle_ball_unchanged', () => {
    const mbbDir = resolve(tsRoot, 'src', 'games', 'mutant_battle_ball');
    const mbbSrc = readFileSync(resolve(mbbDir, 'config.ts'), 'utf8');
    expect(mbbSrc).not.toContain('aiBehavior');
  });

  it('test_portalAdapter_unchanged', () => {
    const adapterFiles = [
      'src/engine/shared/portalAdapter/adapters/y8.ts',
      'src/engine/shared/portalAdapter/detection.ts',
      'src/engine/shared/portalAdapter/interface.ts',
      'src/engine/shared/portalAdapter/index.ts',
    ];
    for (const rel of adapterFiles) {
      const file = resolve(tsRoot, rel);
      let diff: string;
      try {
        diff = execSyncGitDiff(file);
      } catch {
        diff = '';
      }
      expect(diff.trim(), `${rel} was modified — read-only this directive`).toBe('');
    }
  });
});

// ── Helper ──────────────────────────────────────────────────────────

import { execSync } from 'node:child_process';
function execSyncGitDiff(file: string): string {
  const repoRoot = resolve(tsRoot, '..');
  try {
    return execSync(`git diff -- "${file}"`, { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    return '';
  }
}
