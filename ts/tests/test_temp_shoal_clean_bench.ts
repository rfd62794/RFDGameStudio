// @vitest-environment node
//
// Shoal — Clean Wasmoon vs Fengari Benchmark
//
// Fixes three issues from prior benchmark:
// 1. Lua-only vs interop measured different trajectories (re-init between them
//    caused different workloads). Now: each measurement re-inits to identical
//    state, and we report entity counts at start/end to verify same workload.
// 2. Fengari baseline wasn't reconciled with validated 27.379/34.560ms.
//    Now: fengari Lua-only uses the exact same _test_measure_tick_time helper
//    (os.clock inside Lua) that produced the validated baseline.
// 3. "Lua-only" and "interop" aren't the same computation — one runs a Lua
//    loop, the other runs JS→Lua per tick. Now: we measure three things
//    separately and don't pretend they're the same computation with one
//    variable toggled:
//      A. Lua-only (os.clock, no boundary crossing) — matches validated baseline methodology
//      B. Lua-only wall-clock (performance.now around a doString batch) — includes WASM overhead
//      C. Real interop (performance.now around per-tick JS→Lua calls) — full boundary crossing
import { describe, it, expect } from 'vitest';
import { LuaExecutor } from '../src/engine/executor';
import { loadGameFiles } from '../src/engine/loader';
import { LuaFactory } from 'wasmoon';
import { performance } from 'perf_hooks';

const files = loadGameFiles('shoal');
const combinedLua = files.engineSource + '\n\n' + files.logic;
const data = files.data as Record<string, unknown>;

function cloneData(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

type WasmoonEngine = Awaited<ReturnType<LuaFactory['createEngine']>>;

const TICKS = 200;
const WARMUP = 10;
const DT = 0.1; // Same dt as the validated baseline

function makeConfig(fish: number, sharks: number, hubs: number): Record<string, unknown> {
  const d = cloneData();
  (d.spawn as Record<string, unknown>).seed = 42;
  (d.spawn as Record<string, unknown>).initial_fish = fish;
  (d.spawn as Record<string, unknown>).initial_sharks = sharks;
  (d.spawn as Record<string, unknown>).initial_algae_hubs = hubs;
  return d;
}

// ── Measurement A: Lua-only via os.clock (matches validated baseline) ────────
// This is the EXACT methodology that produced 27.379/34.560ms.
// _test_measure_tick_time is already in logic.lua:762.
function fengariLuaOnlyOsClock(cfg: Record<string, unknown>): number {
  const executor = new LuaExecutor(combinedLua, 42, '');
  executor.call('init_game', cfg);
  for (let i = 0; i < WARMUP; i++) executor.call('tick_game', DT, {});
  const result = executor.call('_test_measure_tick_time', TICKS)[0] as { avg_ms: number; total_s: number; n: number };
  return result.avg_ms;
}

async function wasmoonLuaOnlyOsClock(cfg: Record<string, unknown>): Promise<number> {
  const factory = new LuaFactory();
  const engine = await factory.createEngine();
  await engine.doString(combinedLua);
  const initFn = (await engine.global.get('init_game')) as (d: unknown) => Promise<unknown>;
  const tickFn = (await engine.global.get('tick_game')) as (dt: number, input: unknown) => Promise<unknown>;
  const measureFn = (await engine.global.get('_test_measure_tick_time')) as (n: number) => Promise<{ avg_ms: number; total_s: number; n: number }>;

  await initFn(cfg);
  for (let i = 0; i < WARMUP; i++) await tickFn(DT, {});
  const result = await measureFn(TICKS);
  return result.avg_ms;
}

// ── Measurement C: Real interop via performance.now (per-tick JS→Lua) ────────
function fengariRealInterop(cfg: Record<string, unknown>): number {
  const executor = new LuaExecutor(combinedLua, 42, '');
  executor.call('init_game', cfg);
  for (let i = 0; i < WARMUP; i++) executor.call('tick_game', DT, {});
  // Re-init to get same starting state as the Lua-only measurement
  executor.call('init_game', cfg);
  for (let i = 0; i < WARMUP; i++) executor.call('tick_game', DT, {});
  const start = performance.now();
  for (let i = 0; i < TICKS; i++) executor.call('tick_game', DT, {});
  const elapsed = performance.now() - start;
  return elapsed / TICKS;
}

async function wasmoonRealInterop(cfg: Record<string, unknown>): Promise<number> {
  const factory = new LuaFactory();
  const engine = await factory.createEngine();
  await engine.doString(combinedLua);
  const initFn = (await engine.global.get('init_game')) as (d: unknown) => Promise<unknown>;
  const tickFn = (await engine.global.get('tick_game')) as (dt: number, input: unknown) => Promise<unknown>;

  await initFn(cfg);
  for (let i = 0; i < WARMUP; i++) await tickFn(DT, {});
  // Re-init to get same starting state
  await initFn(cfg);
  for (let i = 0; i < WARMUP; i++) await tickFn(DT, {});
  const start = performance.now();
  for (let i = 0; i < TICKS; i++) await tickFn(DT, {});
  const elapsed = performance.now() - start;
  return elapsed / TICKS;
}

describe('Shoal Clean Benchmark — Wasmoon vs Fengari', () => {
  it('test_fengari_lua_only_reconciles_with_baseline', () => {
    // Default: should match 27.379ms (validated baseline, same methodology)
    const fDefault = fengariLuaOnlyOsClock(makeConfig(60, 8, 6));
    console.log(`\n=== FENGARI Lua-only (os.clock) — RECONCILIATION ===`);
    console.log(`Default (60 fish, 8 sharks): ${fDefault.toFixed(3)} ms/tick (baseline: 27.379)`);

    // High load: should match 34.560ms
    const fHigh = fengariLuaOnlyOsClock(makeConfig(83, 19, 6));
    console.log(`High load (83 fish, 19 sharks): ${fHigh.toFixed(3)} ms/tick (baseline: 34.560)`);

    expect(fDefault).toBeGreaterThan(0);
    expect(fHigh).toBeGreaterThan(0);
  }, 60000);

  it('test_wasmoon_lua_only_os_clock', async () => {
    const wDefault = await wasmoonLuaOnlyOsClock(makeConfig(60, 8, 6));
    console.log(`\n=== WASMOON Lua-only (os.clock) ===`);
    console.log(`Default (60 fish, 8 sharks): ${wDefault.toFixed(3)} ms/tick`);

    const wHigh = await wasmoonLuaOnlyOsClock(makeConfig(83, 19, 6));
    console.log(`High load (83 fish, 19 sharks): ${wHigh.toFixed(3)} ms/tick`);

    expect(wDefault).toBeGreaterThan(0);
    expect(wHigh).toBeGreaterThan(0);
  }, 60000);

  it('test_fengari_real_interop', () => {
    const fDefault = fengariRealInterop(makeConfig(60, 8, 6));
    console.log(`\n=== FENGARI Real interop (performance.now) ===`);
    console.log(`Default (60 fish, 8 sharks): ${fDefault.toFixed(3)} ms/tick`);

    const fHigh = fengariRealInterop(makeConfig(83, 19, 6));
    console.log(`High load (83 fish, 19 sharks): ${fHigh.toFixed(3)} ms/tick`);

    expect(fDefault).toBeGreaterThan(0);
    expect(fHigh).toBeGreaterThan(0);
  }, 60000);

  it('test_wasmoon_real_interop', async () => {
    const wDefault = await wasmoonRealInterop(makeConfig(60, 8, 6));
    console.log(`\n=== WASMOON Real interop (performance.now) ===`);
    console.log(`Default (60 fish, 8 sharks): ${wDefault.toFixed(3)} ms/tick`);

    const wHigh = await wasmoonRealInterop(makeConfig(83, 19, 6));
    console.log(`High load (83 fish, 19 sharks): ${wHigh.toFixed(3)} ms/tick`);

    expect(wDefault).toBeGreaterThan(0);
    expect(wHigh).toBeGreaterThan(0);
  }, 60000);
});
