/**
 * TEMPORARY profiling harness — get_nearby overhead breakdown.
 *
 * This file is temporary and MUST be removed after profiling.
 * It breaks down get_nearby's per-call cost into:
 *   - alloc_time: time spent allocating the result list table
 *   - key_time:   time spent constructing string bucket keys
 *   - iter_time:  time spent iterating buckets + table.insert
 *   - total_time: total get_nearby time
 *
 * Uses os.clock() accumulation inside Lua, same approach as prior directives.
 */
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';

interface GnProfile {
  calls: number;
  alloc_time: number;
  key_time: number;
  iter_time: number;
  total_time: number;
}

function profileScenario(fish: number, sharks: number, n: number = 200): GnProfile {
  const session = loadGame('shoal', 42);
  const data = session.files.data as Record<string, unknown>;
  const spawn = data['spawn'] as Record<string, unknown>;
  spawn['initial_fish'] = fish;
  spawn['initial_sharks'] = sharks;
  spawn['initial_algae_hubs'] = 6;

  call(session, 'init_game', data);
  call(session, '_test_gn_profile_reset');

  // Run n ticks with profiling active
  for (let i = 0; i < n; i++) {
    call(session, 'tick_game', 0.1, {});
  }

  const report = call(session, '_test_gn_profile_report');
  return report[0] as GnProfile;
}

describe('TEMPORARY get_nearby profiling', () => {
  it('test_get_nearby_overhead_profiled_default', () => {
    const p = profileScenario(60, 8, 200);
    const avgTotal = (p.total_time / p.calls) * 1000; // ms/call
    const avgKey = (p.key_time / p.calls) * 1000;
    const avgAlloc = (p.alloc_time / p.calls) * 1000;
    const avgIter = (p.iter_time / p.calls) * 1000;
    const keyPct = (p.key_time / p.total_time) * 100;
    const allocPct = (p.alloc_time / p.total_time) * 100;
    const iterPct = (p.iter_time / p.total_time) * 100;

    console.log(`\n=== GET_NEARBY PROFILE — DEFAULT (60 fish, 8 sharks, ${p.calls} calls) ===`);
    console.log(`  Total:   ${avgTotal.toFixed(4)} ms/call  (${p.total_time.toFixed(3)}s total)`);
    console.log(`  Alloc:   ${avgAlloc.toFixed(4)} ms/call  (${allocPct.toFixed(1)}%)`);
    console.log(`  Key:     ${avgKey.toFixed(4)} ms/call  (${keyPct.toFixed(1)}%)`);
    console.log(`  Iter:    ${avgIter.toFixed(4)} ms/call  (${iterPct.toFixed(1)}%)`);
    console.log(`  Calls/tick: ${(p.calls / 200).toFixed(1)}`);

    expect(p.calls).toBeGreaterThan(0);
    expect(p.total_time).toBeGreaterThan(0);
  });

  it('test_get_nearby_overhead_profiled_high_load', () => {
    const p = profileScenario(83, 19, 200);
    const avgTotal = (p.total_time / p.calls) * 1000;
    const avgKey = (p.key_time / p.calls) * 1000;
    const avgAlloc = (p.alloc_time / p.calls) * 1000;
    const avgIter = (p.iter_time / p.calls) * 1000;
    const keyPct = (p.key_time / p.total_time) * 100;
    const allocPct = (p.alloc_time / p.total_time) * 100;
    const iterPct = (p.iter_time / p.total_time) * 100;

    console.log(`\n=== GET_NEARBY PROFILE — HIGH LOAD (83 fish, 19 sharks, ${p.calls} calls) ===`);
    console.log(`  Total:   ${avgTotal.toFixed(4)} ms/call  (${p.total_time.toFixed(3)}s total)`);
    console.log(`  Alloc:   ${avgAlloc.toFixed(4)} ms/call  (${allocPct.toFixed(1)}%)`);
    console.log(`  Key:     ${avgKey.toFixed(4)} ms/call  (${keyPct.toFixed(1)}%)`);
    console.log(`  Iter:    ${avgIter.toFixed(4)} ms/call  (${iterPct.toFixed(1)}%)`);
    console.log(`  Calls/tick: ${(p.calls / 200).toFixed(1)}`);

    expect(p.calls).toBeGreaterThan(0);
    expect(p.total_time).toBeGreaterThan(0);
  });
});
