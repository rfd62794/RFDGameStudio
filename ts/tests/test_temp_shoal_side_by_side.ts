// @vitest-environment node
//
// Shoal — Wasmoon vs Fengari Side-by-Side Performance Benchmark
// Runs both VMs back-to-back with identical config, 500 ticks each,
// measuring real interop time (performance.now around tick_game calls).
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

const TICKS = 500;
const WARMUP = 20;

async function benchWasmoon(initialFish: number, initialSharks: number, initialAlgaeHubs: number): Promise<{ luaMs: number; interopMs: number; fish: number; sharks: number; algae: number }> {
  const factory = new LuaFactory();
  const engine = await factory.createEngine();
  await engine.doString(combinedLua);

  const d = cloneData();
  (d.spawn as Record<string, unknown>).seed = 42;
  (d.spawn as Record<string, unknown>).initial_fish = initialFish;
  (d.spawn as Record<string, unknown>).initial_sharks = initialSharks;
  (d.spawn as Record<string, unknown>).initial_algae_hubs = initialAlgaeHubs;

  const initFn = (await engine.global.get('init_game')) as (data: unknown) => Promise<unknown>;
  const tickFn = (await engine.global.get('tick_game')) as (dt: number, input: unknown) => Promise<unknown>;

  await initFn(d);
  for (let i = 0; i < WARMUP; i++) await tickFn(0.05, {});

  // Get entity counts
  const state = (await tickFn(0, {})) as Record<string, unknown>;
  const stats = state.stats as Record<string, unknown>;

  // Lua-only: run all ticks in a single doString
  await initFn(d);
  for (let i = 0; i < WARMUP; i++) await tickFn(0.05, {});
  const luaStart = performance.now();
  await engine.doString(`
    for i = 1, ${TICKS} do tick_game(0.05, {}) end
  `);
  const luaEnd = performance.now();
  const luaMs = (luaEnd - luaStart) / TICKS;

  // Real interop: JS calls tick_game per tick
  await initFn(d);
  for (let i = 0; i < WARMUP; i++) await tickFn(0.05, {});
  const interopStart = performance.now();
  for (let i = 0; i < TICKS; i++) await tickFn(0.05, {});
  const interopEnd = performance.now();
  const interopMs = (interopEnd - interopStart) / TICKS;

  return {
    luaMs,
    interopMs,
    fish: stats.fish_count as number,
    sharks: stats.shark_count as number,
    algae: stats.algae_count as number,
  };
}

function benchFengari(initialFish: number, initialSharks: number, initialAlgaeHubs: number): { luaMs: number; interopMs: number; fish: number; sharks: number; algae: number } {
  const executor = new LuaExecutor(combinedLua, 42, '');

  const d = cloneData();
  (d.spawn as Record<string, unknown>).seed = 42;
  (d.spawn as Record<string, unknown>).initial_fish = initialFish;
  (d.spawn as Record<string, unknown>).initial_sharks = initialSharks;
  (d.spawn as Record<string, unknown>).initial_algae_hubs = initialAlgaeHubs;

  executor.call('init_game', d);
  for (let i = 0; i < WARMUP; i++) executor.call('tick_game', 0.05, {});

  const state = executor.call('tick_game', 0, {})[0] as Record<string, unknown>;
  const stats = state.stats as Record<string, unknown>;

  // Lua-only: run all ticks in a single doString
  executor.call('init_game', d);
  for (let i = 0; i < WARMUP; i++) executor.call('tick_game', 0.05, {});
  const luaStart = performance.now();
  executor.call('tick_game_batch', TICKS);
  const luaEnd = performance.now();
  const luaMs = (luaEnd - luaStart) / TICKS;

  // Real interop: JS calls tick_game per tick
  executor.call('init_game', d);
  for (let i = 0; i < WARMUP; i++) executor.call('tick_game', 0.05, {});
  const interopStart = performance.now();
  for (let i = 0; i < TICKS; i++) executor.call('tick_game', 0.05, {});
  const interopEnd = performance.now();
  const interopMs = (interopEnd - interopStart) / TICKS;

  return {
    luaMs,
    interopMs,
    fish: stats.fish_count as number,
    sharks: stats.shark_count as number,
    algae: stats.algae_count as number,
  };
}

// Inject batch helper
const combinedLuaWithBatch = combinedLua + `
function tick_game_batch(n)
  for i = 1, n do tick_game(0.05, {}) end
end
`;

describe('Shoal Wasmoon vs Fengari Side-by-Side', () => {
  it('test_side_by_side_default_load', async () => {
    console.log('\n=== DEFAULT LOAD (60 fish, 8 sharks, 6 algae hubs) — 500 ticks ===');

    const w = await benchWasmoon(60, 8, 6);
    console.log(`Wasmoon:  ${w.luaMs.toFixed(3)} ms/tick (Lua-only), ${w.interopMs.toFixed(3)} ms/tick (real interop)`);
    console.log(`  Entities: ${w.fish} fish, ${w.sharks} sharks, ${w.algae} algae nodules`);

    // Use the batch-injected source for fengari
    const fExecutor = new LuaExecutor(combinedLuaWithBatch, 42, '');
    const d = cloneData();
    (d.spawn as Record<string, unknown>).seed = 42;
    (d.spawn as Record<string, unknown>).initial_fish = 60;
    (d.spawn as Record<string, unknown>).initial_sharks = 8;
    (d.spawn as Record<string, unknown>).initial_algae_hubs = 6;

    fExecutor.call('init_game', d);
    for (let i = 0; i < WARMUP; i++) fExecutor.call('tick_game', 0.05, {});
    const fState = fExecutor.call('tick_game', 0, {})[0] as Record<string, unknown>;
    const fStats = fState.stats as Record<string, unknown>;

    // Fengari Lua-only
    fExecutor.call('init_game', d);
    for (let i = 0; i < WARMUP; i++) fExecutor.call('tick_game', 0.05, {});
    const fLuaStart = performance.now();
    fExecutor.call('tick_game_batch', TICKS);
    const fLuaEnd = performance.now();
    const fLuaMs = (fLuaEnd - fLuaStart) / TICKS;

    // Fengari real interop
    fExecutor.call('init_game', d);
    for (let i = 0; i < WARMUP; i++) fExecutor.call('tick_game', 0.05, {});
    const fInteropStart = performance.now();
    for (let i = 0; i < TICKS; i++) fExecutor.call('tick_game', 0.05, {});
    const fInteropEnd = performance.now();
    const fInteropMs = (fInteropEnd - fInteropStart) / TICKS;

    console.log(`Fengari:  ${fLuaMs.toFixed(3)} ms/tick (Lua-only), ${fInteropMs.toFixed(3)} ms/tick (real interop)`);
    console.log(`  Entities: ${fStats.fish_count} fish, ${fStats.shark_count} sharks, ${fStats.algae_count} algae nodules`);
    console.log(`\nLua-only ratio:  wasmoon/fengari = ${(w.luaMs / fLuaMs).toFixed(2)}x`);
    console.log(`Real interop ratio: wasmoon/fengari = ${(w.interopMs / fInteropMs).toFixed(2)}x`);

    expect(w.interopMs).toBeGreaterThan(0);
    expect(fInteropMs).toBeGreaterThan(0);
  }, 180000);

  it('test_side_by_side_high_load', async () => {
    console.log('\n=== HIGH LOAD (83 fish, 19 sharks, 6 algae hubs) — 500 ticks ===');

    const w = await benchWasmoon(83, 19, 6);
    console.log(`Wasmoon:  ${w.luaMs.toFixed(3)} ms/tick (Lua-only), ${w.interopMs.toFixed(3)} ms/tick (real interop)`);
    console.log(`  Entities: ${w.fish} fish, ${w.sharks} sharks, ${w.algae} algae nodules`);

    // Fengari
    const fExecutor = new LuaExecutor(combinedLuaWithBatch, 42, '');
    const d = cloneData();
    (d.spawn as Record<string, unknown>).seed = 42;
    (d.spawn as Record<string, unknown>).initial_fish = 83;
    (d.spawn as Record<string, unknown>).initial_sharks = 19;
    (d.spawn as Record<string, unknown>).initial_algae_hubs = 6;

    fExecutor.call('init_game', d);
    for (let i = 0; i < WARMUP; i++) fExecutor.call('tick_game', 0.05, {});
    const fState = fExecutor.call('tick_game', 0, {})[0] as Record<string, unknown>;
    const fStats = fState.stats as Record<string, unknown>;

    // Fengari Lua-only
    fExecutor.call('init_game', d);
    for (let i = 0; i < WARMUP; i++) fExecutor.call('tick_game', 0.05, {});
    const fLuaStart = performance.now();
    fExecutor.call('tick_game_batch', TICKS);
    const fLuaEnd = performance.now();
    const fLuaMs = (fLuaEnd - fLuaStart) / TICKS;

    // Fengari real interop
    fExecutor.call('init_game', d);
    for (let i = 0; i < WARMUP; i++) fExecutor.call('tick_game', 0.05, {});
    const fInteropStart = performance.now();
    for (let i = 0; i < TICKS; i++) fExecutor.call('tick_game', 0.05, {});
    const fInteropEnd = performance.now();
    const fInteropMs = (fInteropEnd - fInteropStart) / TICKS;

    console.log(`Fengari:  ${fLuaMs.toFixed(3)} ms/tick (Lua-only), ${fInteropMs.toFixed(3)} ms/tick (real interop)`);
    console.log(`  Entities: ${fStats.fish_count} fish, ${fStats.shark_count} sharks, ${fStats.algae_count} algae nodules`);
    console.log(`\nLua-only ratio:  wasmoon/fengari = ${(w.luaMs / fLuaMs).toFixed(2)}x`);
    console.log(`Real interop ratio: wasmoon/fengari = ${(w.interopMs / fInteropMs).toFixed(2)}x`);

    expect(w.interopMs).toBeGreaterThan(0);
    expect(fInteropMs).toBeGreaterThan(0);
  }, 180000);
});
