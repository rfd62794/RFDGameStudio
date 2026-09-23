/**
 * Test Anchors & Verification Suite for SlimeWorld God-Game
 * Implements §3 Test Anchors strictly per the Phase Directive
 */

import {
  MONUMENT_BASE_FOCUS,
  MONUMENT_COST,
  RING_SIZE,
  SectorZone,
  SOIL_STABILITY_TICKS,
  SoilType,
  StructureSlot,
  TileState,
  ResourceLedger,
} from '../types';
import {
  attempt_construct_monument,
  clampTier,
  create_initial_world,
  evaluate_tile_yield,
  resolve_tick,
  select_harvest_target,
  soil_upgrade_target,
  update_sector_soil,
} from './slimeEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
  assertionsCount: number;
  details: string[];
}

export function runAllEngineTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  // Test 1: test_zone_yield_and_scan_selection (ADR 002 Baseline)
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;
    let error: string | undefined;
    let assertionsCount = 0;

    try {
      const defaultTile: TileState = {
        tiers: [0, 0, 0, 0],
        resistances: [0, 0, 0, 0],
        aspect_slots: [null, null, null, null],
        ticks_stable: 0,
      };

      const tiles: TileState[] = Array.from({ length: RING_SIZE }, () => ({
        ...defaultTile,
      }));

      // Tile 2 has LushFlora (high food) and fertile tiers
      tiles[2] = {
        tiers: [4, 2, 0, 0],
        resistances: [1, 1, 1, 1],
        aspect_slots: ['LushFlora', null, null, null],
        ticks_stable: 10,
      };

      // Tile 5 has MineralVein (high material/energy) but is at distance 5 (outside radius 4)
      tiles[5] = {
        tiers: [0, 3, 3, 0],
        resistances: [1, 1, 1, 1],
        aspect_slots: ['MineralVein', null, null, null],
        ticks_stable: 10,
      };

      const sectors: SectorZone[] = Array.from({ length: 8 }, (_, i) => ({
        sector_id: i,
        soil_profile: i === 0 ? 'Clay' : 'BarrenRock',
        structure: { type: 'None' },
        tile_indices: [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3] as [
          number,
          number,
          number,
          number,
        ],
      }));

      // Settlement at tile 0 scanning with radius 4 and food-heavy demand profile
      const demandProfile: ResourceLedger = { food: 10, energy: 1, material: 1 };
      const harvest = select_harvest_target(0, 4, demandProfile, { tiles, sectors });

      assertionsCount++;
      if (!harvest) {
        throw new Error('Expected select_harvest_target to find a target, but got null');
      }
      details.push(`Found harvest target at Tile ${harvest.target_tile_idx} with score ${harvest.score.toFixed(1)}`);

      assertionsCount++;
      if (harvest.target_tile_idx !== 2) {
        throw new Error(`Expected harvest target to be Tile 2 (LushFlora), but got Tile ${harvest.target_tile_idx}`);
      }
      details.push('Correctly preferred within-radius Tile 2 (LushFlora) over out-of-radius Tile 5');

      assertionsCount++;
      if (harvest.yield.food <= 0) {
        throw new Error(`Expected Tile 2 food yield > 0, got ${harvest.yield.food}`);
      }
      details.push(`Tile 2 food yield is ${harvest.yield.food}, energy: ${harvest.yield.energy}, material: ${harvest.yield.material}`);
    } catch (err: any) {
      passed = false;
      error = err.message || String(err);
    }

    results.push({
      name: 'test_zone_yield_and_scan_selection',
      passed,
      error,
      durationMs: Number((performance.now() - start).toFixed(2)),
      assertionsCount,
      details,
    });
  }

  // Test 2: sector_upgrades_only_when_all_four_tiles_stable (§3)
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;
    let error: string | undefined;
    let assertionsCount = 0;

    try {
      const defaultTile: TileState = {
        tiers: [0, 0, 0, 0],
        resistances: [0, 0, 0, 0],
        aspect_slots: [null, null, null, null],
        ticks_stable: 0,
      };

      const tiles: TileState[] = Array.from({ length: RING_SIZE }, () => ({
        ...defaultTile,
      }));

      const sector: SectorZone = {
        sector_id: 0,
        soil_profile: 'BarrenRock',
        structure: { type: 'None' },
        tile_indices: [0, 1, 2, 3],
      };

      // 3 of 4 stable -> Should NOT upgrade
      tiles[0].ticks_stable = SOIL_STABILITY_TICKS;
      tiles[1].ticks_stable = SOIL_STABILITY_TICKS;
      tiles[2].ticks_stable = SOIL_STABILITY_TICKS;
      tiles[3].ticks_stable = SOIL_STABILITY_TICKS - 1;

      assertionsCount++;
      const upgraded_1 = update_sector_soil(sector, tiles);
      if (upgraded_1) {
        throw new Error('Sector upgraded when only 3 of 4 tiles were stable!');
      }
      assertionsCount++;
      if (sector.soil_profile !== 'BarrenRock') {
        throw new Error(`Soil profile changed prematurely to ${sector.soil_profile}`);
      }
      details.push('3 of 4 tiles stable (20, 20, 20, 19): update_sector_soil returned false, soil remains BarrenRock');

      // All 4 stable -> Upgrades to Clay
      tiles[3].ticks_stable = SOIL_STABILITY_TICKS;
      assertionsCount++;
      const upgraded_now = update_sector_soil(sector, tiles);
      if (!upgraded_now) {
        throw new Error('Sector failed to upgrade when all 4 tiles were stable!');
      }
      assertionsCount++;
      if ((sector.soil_profile as SoilType) !== 'Clay') {
        throw new Error(`Expected soil to upgrade to Clay, got ${sector.soil_profile}`);
      }
      details.push('All 4 tiles stable (20, 20, 20, 20): successfully upgraded BarrenRock → Clay');

      // Further progression: Clay -> FertileLoam
      assertionsCount++;
      const upgraded_next = update_sector_soil(sector, tiles);
      if (!upgraded_next || (sector.soil_profile as SoilType) !== 'FertileLoam') {
        throw new Error(`Expected Clay to upgrade to FertileLoam, got ${sector.soil_profile}`);
      }
      details.push('Subsequent stability check: successfully upgraded Clay → FertileLoam');

      // Top of ladder: FertileLoam has no further upgrade
      assertionsCount++;
      const upgraded_top = update_sector_soil(sector, tiles);
      if (upgraded_top || (sector.soil_profile as SoilType) !== 'FertileLoam') {
        throw new Error(`FertileLoam upgraded past top of ladder!`);
      }
      details.push('Top of ladder check: FertileLoam correctly returns false with no further upgrade');

      // VolcanicAsh recoverable loop test
      sector.soil_profile = 'VolcanicAsh';
      assertionsCount++;
      const upgraded_ash = update_sector_soil(sector, tiles);
      if (!upgraded_ash || (sector.soil_profile as SoilType) !== 'Clay') {
        throw new Error(`Expected VolcanicAsh to recover to Clay, got ${sector.soil_profile}`);
      }
      details.push('VolcanicAsh recovery ladder check: VolcanicAsh → Clay loops back onto primary ladder');
    } catch (err: any) {
      passed = false;
      error = err.message || String(err);
    }

    results.push({
      name: 'sector_upgrades_only_when_all_four_tiles_stable',
      passed,
      error,
      durationMs: Number((performance.now() - start).toFixed(2)),
      assertionsCount,
      details,
    });
  }

  // Test 3: monument_requires_full_cost_and_empty_slot (§3)
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;
    let error: string | undefined;
    let assertionsCount = 0;

    try {
      const sector: SectorZone = {
        sector_id: 0,
        soil_profile: 'FertileLoam',
        structure: { type: 'None' },
        tile_indices: [0, 1, 2, 3],
      };

      const brokeLedger: ResourceLedger = { food: 9, energy: 5, material: 15 };
      assertionsCount++;
      const brokeAttempt = attempt_construct_monument(sector, brokeLedger);
      if (brokeAttempt) {
        throw new Error('Constructed monument with insufficient food (9 < 10)!');
      }
      assertionsCount++;
      if (sector.structure.type !== 'None') {
        throw new Error(`Structure changed despite insufficient funds: ${JSON.stringify(sector.structure)}`);
      }
      details.push('Insufficient resources ({food: 9, energy: 5, material: 15}): returned false, structure unchanged');

      const richLedger: ResourceLedger = { food: 20, energy: 10, material: 30 };
      assertionsCount++;
      const richAttempt = attempt_construct_monument(sector, richLedger);
      if (!richAttempt) {
        throw new Error('Failed to construct monument with sufficient resources!');
      }
      const currentStructure = sector.structure as StructureSlot;
      assertionsCount++;
      if (
        currentStructure.type !== 'Monument' ||
        (currentStructure.type === 'Monument' && currentStructure.bonus_focus !== MONUMENT_BASE_FOCUS)
      ) {
        throw new Error(
          `Expected Monument with bonus_focus ${MONUMENT_BASE_FOCUS}, got ${JSON.stringify(sector.structure)}`,
        );
      }
      assertionsCount++;
      if (richLedger.food !== 10 || richLedger.energy !== 5 || richLedger.material !== 15) {
        throw new Error(`Resources incorrectly deducted: ${JSON.stringify(richLedger)}`);
      }
      details.push(`Constructed Monument with flat bonus_focus=${MONUMENT_BASE_FOCUS}, remaining ledger: {food: 10, energy: 5, material: 15}`);

      // Second attempt on occupied slot must fail
      assertionsCount++;
      const secondAttempt = attempt_construct_monument(sector, richLedger);
      if (secondAttempt) {
        throw new Error('Constructed second monument in an already occupied sector structure slot!');
      }
      details.push('Second construction attempt on occupied slot correctly rejected');
    } catch (err: any) {
      passed = false;
      error = err.message || String(err);
    }

    results.push({
      name: 'monument_requires_full_cost_and_empty_slot',
      passed,
      error,
      durationMs: Number((performance.now() - start).toFixed(2)),
      assertionsCount,
      details,
    });
  }

  // Test 4: tier_clamp_rejects_values_above_three (§3)
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;
    let error: string | undefined;
    let assertionsCount = 0;

    try {
      assertionsCount++;
      const clamped = clampTier(10);
      if (clamped !== 3) {
        throw new Error(`clampTier(10) returned ${clamped}, expected 3`);
      }
      details.push(`clampTier(10) === 3`);

      // The initial world preset at tile 12 has a Fire tier of 4 in source;
      // it must be clamped down to 3 at creation time.
      assertionsCount++;
      const world = create_initial_world();
      const tile12 = world.tiles[12];
      if (tile12.tiers[2] !== 3) {
        throw new Error(`Tile 12 Fire tier ${tile12.tiers[2]} not clamped to 3`);
      }
      details.push(`create_initial_world clamps source Fire tier 4 to 3 (tile 12)`);

      // A +10 delta applied via resolve_tick must also be clamped to the cap.
      assertionsCount++;
      const world2 = create_initial_world();
      const deltas = new Map<number, [number, number, number, number]>();
      deltas.set(0, [10, 0, 0, 0]);
      const next = resolve_tick(world2, deltas);
      if (next.tiles[0].tiers[0] !== 3) {
        throw new Error(`resolve_tick delta +10 produced Water tier ${next.tiles[0].tiers[0]}, expected 3`);
      }
      details.push(`resolve_tick clamps Water delta +10 to tier 3`);
    } catch (err: any) {
      passed = false;
      error = err.message || String(err);
    }

    results.push({
      name: 'tier_clamp_rejects_values_above_three',
      passed,
      error,
      durationMs: Number((performance.now() - start).toFixed(2)),
      assertionsCount,
      details,
    });
  }

  // Test 5: tier_clamp_rejects_negative_values (§3)
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;
    let error: string | undefined;
    let assertionsCount = 0;

    try {
      assertionsCount++;
      const clamped = clampTier(-2);
      if (clamped !== 0) {
        throw new Error(`clampTier(-2) returned ${clamped}, expected 0`);
      }
      details.push(`clampTier(-2) === 0`);

      // A -5 delta applied via resolve_tick must be clamped to the floor.
      assertionsCount++;
      const world = create_initial_world();
      const deltas = new Map<number, [number, number, number, number]>();
      deltas.set(0, [-5, 0, 0, 0]);
      const next = resolve_tick(world, deltas);
      if (next.tiles[0].tiers[0] !== 0) {
        throw new Error(`resolve_tick delta -5 produced Water tier ${next.tiles[0].tiers[0]}, expected 0`);
      }
      details.push(`resolve_tick clamps Water delta -5 to tier 0`);
    } catch (err: any) {
      passed = false;
      error = err.message || String(err);
    }

    results.push({
      name: 'tier_clamp_rejects_negative_values',
      passed,
      error,
      durationMs: Number((performance.now() - start).toFixed(2)),
      assertionsCount,
      details,
    });
  }

  // Test 6: unhandled_case_throws_not_returns_default (§3)
  {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;
    let error: string | undefined;
    let assertionsCount = 0;

    try {
      assertionsCount++;
      let threw = false;
      try {
        soil_upgrade_target('UnknownSoil' as SoilType);
      } catch (err) {
        threw = true;
      }
      if (!threw) {
        throw new Error('soil_upgrade_target did not throw on an unhandled soil type');
      }
      details.push('soil_upgrade_target throws for unhandled soil types instead of returning null/default');
    } catch (err: any) {
      passed = false;
      error = err.message || String(err);
    }

    results.push({
      name: 'unhandled_case_throws_not_returns_default',
      passed,
      error,
      durationMs: Number((performance.now() - start).toFixed(2)),
      assertionsCount,
      details,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    results,
  };
}
