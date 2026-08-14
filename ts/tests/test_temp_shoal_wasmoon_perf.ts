// @vitest-environment node
//
// Shoal — Wasmoon Performance Benchmark (Post Portable Randomness Fix)
// Measures wasmoon tick time with real interop (tick_game + build_render_state
// pull every tick), comparing against the fengari baseline:
//   - Default load: 27.379 ms/tick
//   - High load:    34.560 ms/tick
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

interface BenchmarkResult {
  scenario: string;
  luaOnlyMs: number;
  realInteropMs: number;
  fishCount: number;
  sharkCount: number;
  algaeCount: number;
}

async function benchmarkWasmoon(
  scenario: string,
  initialFish: number,
  initialSharks: number,
  initialAlgaeHubs: number,
  ticks: number = 200,
  warmupTicks: number = 10
): Promise<BenchmarkResult> {
  const factory = new LuaFactory();
  const engine = await factory.createEngine();

  // Inject a benchmark helper that runs N ticks entirely in Lua,
  // returning the elapsed time via a global variable. This avoids
  // per-tick JS↔Lua boundary crossing for the Lua-only measurement.
  const benchmarkLua = combinedLua + `

function _bench_ticks(ticks, dt)
    local start = os.clock()
    for i = 1, ticks do
        tick_game(dt, {})
    end
    return os.clock() - start
end
`;
  await engine.doString(benchmarkLua);

  const d = cloneData();
  (d.spawn as Record<string, unknown>).seed = 42;
  (d.spawn as Record<string, unknown>).initial_fish = initialFish;
  (d.spawn as Record<string, unknown>).initial_sharks = initialSharks;
  (d.spawn as Record<string, unknown>).initial_algae_hubs = initialAlgaeHubs;

  // Cache function references
  const initFn = (await engine.global.get('init_game')) as (data: unknown) => Promise<unknown>;
  const tickFn = (await engine.global.get('tick_game')) as (dt: number, input: unknown) => Promise<unknown>;
  const benchFn = (await engine.global.get('_bench_ticks')) as (ticks: number, dt: number) => Promise<number>;

  // Init
  await initFn(d);

  // Warm up (with interop, to get realistic entity counts)
  for (let i = 0; i < warmupTicks; i++) {
    await tickFn(0.05, {});
  }

  // Get entity counts
  const warmupState = (await tickFn(0, {})) as Record<string, unknown>;
  const stats = warmupState.stats as Record<string, unknown>;

  // ── Lua-only measurement: run N ticks entirely in Lua ──────────────────
  // Re-init to get the same starting state (deterministic with seed)
  await initFn(d);
  for (let i = 0; i < warmupTicks; i++) {
    await tickFn(0.05, {});
  }
  const luaElapsed = await benchFn(ticks, 0.05);
  const luaOnlyMs = (luaElapsed / ticks) * 1000;

  // ── Real interop measurement: JS calls tick_game per tick ──────────────
  // Re-init again for fair comparison
  await initFn(d);
  for (let i = 0; i < warmupTicks; i++) {
    await tickFn(0.05, {});
  }
  const realStart = performance.now();
  for (let i = 0; i < ticks; i++) {
    await tickFn(0.05, {});
  }
  const realEnd = performance.now();
  const realInteropMs = (realEnd - realStart) / ticks;

  return {
    scenario,
    luaOnlyMs,
    realInteropMs,
    fishCount: stats.fish_count as number,
    sharkCount: stats.shark_count as number,
    algaeCount: stats.algae_count as number,
  };
}

function benchmarkFengari(
  scenario: string,
  initialFish: number,
  initialSharks: number,
  initialAlgaeHubs: number,
  ticks: number = 200,
  warmupTicks: number = 10
): BenchmarkResult {
  const executor = new LuaExecutor(combinedLua, 42, '');

  const d = cloneData();
  (d.spawn as Record<string, unknown>).seed = 42;
  (d.spawn as Record<string, unknown>).initial_fish = initialFish;
  (d.spawn as Record<string, unknown>).initial_sharks = initialSharks;
  (d.spawn as Record<string, unknown>).initial_algae_hubs = initialAlgaeHubs;

  executor.call('init_game', d);

  // Warm up
  for (let i = 0; i < warmupTicks; i++) {
    executor.call('tick_game', 0.05, {});
  }

  // Get entity counts
  const warmupState = executor.call('tick_game', 0, {})[0] as Record<string, unknown>;
  const stats = warmupState.stats as Record<string, unknown>;

  // Real interop measurement
  executor.call('init_game', d);
  for (let i = 0; i < warmupTicks; i++) {
    executor.call('tick_game', 0.05, {});
  }
  const realStart = performance.now();
  for (let i = 0; i < ticks; i++) {
    executor.call('tick_game', 0.05, {});
  }
  const realEnd = performance.now();
  const realInteropMs = (realEnd - realStart) / ticks;

  // Lua-only measurement via a doString that runs ticks in Lua
  executor.call('init_game', d);
  for (let i = 0; i < warmupTicks; i++) {
    executor.call('tick_game', 0.05, {});
  }
  // Use a Lua-side benchmark function
  const luaElapsed = executor.call('_bench_ticks', ticks, 0.05)[0] as number;
  const luaOnlyMs = (luaElapsed / ticks) * 1000;

  return {
    scenario,
    luaOnlyMs,
    realInteropMs,
    fishCount: stats.fish_count as number,
    sharkCount: stats.shark_count as number,
    algaeCount: stats.algae_count as number,
  };
}

// Inject the benchmark helper into the combined Lua source for fengari too
const combinedLuaWithBench = combinedLua + `

function _bench_ticks(ticks, dt)
    local start = os.clock()
    for i = 1, ticks do
        tick_game(dt, {})
    end
    return os.clock() - start
end
`;

describe('Shoal Wasmoon Performance Benchmark', () => {
  it('test_wasmoon_perf_default_vs_fengari_baseline', async () => {
    const wasmoonResult = await benchmarkWasmoon('default', 60, 8, 6);
    console.log('\n=== DEFAULT LOAD (60 fish, 8 sharks, 6 algae hubs) ===');
    console.log(`Wasmoon: ${wasmoonResult.luaOnlyMs.toFixed(3)} ms/tick (Lua-only), ${wasmoonResult.realInteropMs.toFixed(3)} ms/tick (real interop)`);
    console.log(`  Entities: ${wasmoonResult.fishCount} fish, ${wasmoonResult.sharkCount} sharks, ${wasmoonResult.algaeCount} algae nodules`);
    console.log(`Fengari baseline: 27.379 ms/tick (real interop)`);
    console.log(`Speedup: ${(27.379 / wasmoonResult.realInteropMs).toFixed(2)}x faster`);

    expect(wasmoonResult.realInteropMs).toBeGreaterThan(0);
    expect(wasmoonResult.fishCount).toBeGreaterThan(0);
  }, 120000);

  it('test_wasmoon_perf_high_load_vs_fengari_baseline', async () => {
    const wasmoonResult = await benchmarkWasmoon('high_load', 83, 19, 6);
    console.log('\n=== HIGH LOAD (83 fish, 19 sharks, 6 algae hubs) ===');
    console.log(`Wasmoon: ${wasmoonResult.luaOnlyMs.toFixed(3)} ms/tick (Lua-only), ${wasmoonResult.realInteropMs.toFixed(3)} ms/tick (real interop)`);
    console.log(`  Entities: ${wasmoonResult.fishCount} fish, ${wasmoonResult.sharkCount} sharks, ${wasmoonResult.algaeCount} algae nodules`);
    console.log(`Fengari baseline: 34.560 ms/tick (real interop)`);
    console.log(`Speedup: ${(34.560 / wasmoonResult.realInteropMs).toFixed(2)}x faster`);

    expect(wasmoonResult.realInteropMs).toBeGreaterThan(0);
    expect(wasmoonResult.fishCount).toBeGreaterThan(0);
  }, 120000);

  it('test_fengari_perf_default_for_cross_check', () => {
    // Use the executor with the benchmark helper injected
    const executor = new LuaExecutor(combinedLuaWithBench, 42, '');
    const d = cloneData();
    (d.spawn as Record<string, unknown>).seed = 42;
    (d.spawn as Record<string, unknown>).initial_fish = 60;
    (d.spawn as Record<string, unknown>).initial_sharks = 8;
    (d.spawn as Record<string, unknown>).initial_algae_hubs = 6;

    executor.call('init_game', d);
    for (let i = 0; i < 10; i++) {
      executor.call('tick_game', 0.05, {});
    }

    // Real interop
    executor.call('init_game', d);
    for (let i = 0; i < 10; i++) {
      executor.call('tick_game', 0.05, {});
    }
    const realStart = performance.now();
    for (let i = 0; i < 200; i++) {
      executor.call('tick_game', 0.05, {});
    }
    const realEnd = performance.now();
    const realInteropMs = (realEnd - realStart) / 200;

    // Lua-only
    executor.call('init_game', d);
    for (let i = 0; i < 10; i++) {
      executor.call('tick_game', 0.05, {});
    }
    const luaElapsed = executor.call('_bench_ticks', 200, 0.05)[0] as number;
    const luaOnlyMs = (luaElapsed / 200) * 1000;

    console.log('\n=== FENGARI CROSS-CHECK (default load) ===');
    console.log(`Fengari: ${luaOnlyMs.toFixed(3)} ms/tick (Lua-only), ${realInteropMs.toFixed(3)} ms/tick (real interop)`);

    expect(realInteropMs).toBeGreaterThan(0);
  }, 120000);
});
