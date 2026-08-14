/**
 * TEMPORARY wasmoon correctness + benchmark harness.
 *
 * Gate 1 (correctness): Run Shoal's real Lua source through both fengari
 * and wasmoon with the same seed, compare render-state output field-by-
 * field. Any divergence halts the benchmark.
 *
 * Gate 2 (performance): If correctness passes, measure wasmoon tick time
 * with the REAL interop pattern (tick_game + full render-state pull every
 * tick), same two scenarios as all prior directives.
 *
 * This file is temporary and MUST be removed after measurement.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { loadGame, call as fengariCall } from '../src/engine/runtime';
import { LuaFactory } from 'wasmoon';

// ── Load Shoal's real Lua source and data ────────────────────────────────────

const repoRoot = resolve(__dirname, '..', '..');
const shoalDir = resolve(repoRoot, 'games', 'shoal');

const shoalDataRaw = readFileSync(resolve(shoalDir, 'data.yaml'), 'utf-8');
const shoalSystemsRaw = readFileSync(resolve(shoalDir, 'systems.yaml'), 'utf-8');
const shoalSystems = yaml.load(shoalSystemsRaw) as Record<string, unknown>;
const luaFileList = shoalSystems['lua_files'] as string[];
const engineSource = ''; // Shoal uses no engine systems (engine_systems: [])

const shoalLuaSource = luaFileList
  .map(f => readFileSync(resolve(shoalDir, f), 'utf-8'))
  .join('\n\n');

const shoalData = yaml.load(shoalDataRaw) as Record<string, unknown>;

// ── Helper: deep-serialize a render state for comparison ─────────────────────

function serializeState(state: unknown): string {
  return JSON.stringify(state, (_key, value) => {
    // Round floats to 6 decimal places to avoid FP representation differences
    if (typeof value === 'number' && !Number.isInteger(value)) {
      return Math.round(value * 1e6) / 1e6;
    }
    return value;
  });
}

// ── Helper: run Shoal through fengari (current production runtime) ───────────

function runFengari(fish: number, sharks: number, ticks: number, seed: number = 42): unknown {
  const session = loadGame('shoal', seed);
  const data = JSON.parse(JSON.stringify(session.files.data)) as Record<string, unknown>;
  const spawn = data['spawn'] as Record<string, unknown>;
  spawn['initial_fish'] = fish;
  spawn['initial_sharks'] = sharks;
  spawn['initial_algae_hubs'] = 6;

  fengariCall(session, 'init_game', data);
  let lastState: unknown = null;
  for (let i = 0; i < ticks; i++) {
    lastState = fengariCall(session, 'tick_game', 0.1, {})[0];
  }
  return lastState;
}

// ── Helper: run Shoal through wasmoon ────────────────────────────────────────

async function runWasmoon(
  fish: number,
  sharks: number,
  ticks: number,
  seed: number = 42
): Promise<unknown> {
  const factory = new LuaFactory();
  const lua = await factory.createEngine();

  try {
    // Seed random the same way the fengari executor does
    await lua.doString(`math.randomseed(${seed})`);
    // Load Shoal's real Lua source
    await lua.doString(shoalLuaSource);

    // Override spawn counts in data
    const data = JSON.parse(JSON.stringify(shoalData)) as Record<string, unknown>;
    const spawn = data['spawn'] as Record<string, unknown>;
    spawn['initial_fish'] = fish;
    spawn['initial_sharks'] = sharks;
    spawn['initial_algae_hubs'] = 6;

    // Push data as a global for init_game
    lua.global.set('SHOAL_DATA', data);
    await lua.doString('init_game(SHOAL_DATA)');

    let lastState: unknown = null;
    for (let i = 0; i < ticks; i++) {
      // Call tick_game and pull the full render state — the real interop pattern
      const tickFn = lua.global.get('tick_game') as (...args: unknown[]) => unknown;
      lastState = tickFn(0.1, {});
    }
    return lastState;
  } finally {
    lua.global.close();
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TEMPORARY wasmoon correctness gate', () => {
  it('test_wasmoon_output_matches_fengari_default', async () => {
    const fengariState = runFengari(60, 8, 20, 42);
    const wasmoonState = await runWasmoon(60, 8, 20, 42);

    const fengariSer = serializeState(fengariState);
    const wasmoonSer = serializeState(wasmoonState);

    // Compare key structural fields first for diagnostics
    const fObj = fengariState as Record<string, unknown>;
    const wObj = wasmoonState as Record<string, unknown>;

    console.log(`\n=== CORRECTNESS GATE — DEFAULT (60 fish, 8 sharks, 20 ticks) ===`);
    console.log(`  fengari fish count: ${(fObj['fish'] as unknown[]).length}`);
    console.log(`  wasmoon fish count: ${(wObj['fish'] as unknown[]).length}`);
    console.log(`  fengari shark count: ${(fObj['sharks'] as unknown[]).length}`);
    console.log(`  wasmoon shark count: ${(wObj['sharks'] as unknown[]).length}`);
    console.log(`  fengari tick_count: ${fObj['tick_count']}`);
    console.log(`  wasmoon tick_count: ${wObj['tick_count']}`);
    console.log(`  fengari stats: ${JSON.stringify(fObj['stats'])}`);
    console.log(`  wasmoon stats: ${JSON.stringify(wObj['stats'])}`);

    if (fengariSer !== wasmoonSer) {
      // Find first divergence for diagnostics
      const fJson = JSON.parse(fengariSer) as Record<string, unknown>;
      const wJson = JSON.parse(wasmoonSer) as Record<string, unknown>;
      const keys = new Set([...Object.keys(fJson), ...Object.keys(wJson)]);
      const diffs: string[] = [];
      for (const key of keys) {
        const f = JSON.stringify(fJson[key]);
        const w = JSON.stringify(wJson[key]);
        if (f !== w) {
          diffs.push(`${key}: fengari=${f?.slice(0, 100)}... wasmoon=${w?.slice(0, 100)}...`);
        }
      }
      console.log(`  DIVERGENCES:\n    ${diffs.join('\n    ')}`);
    }

    expect(wasmoonSer).toBe(fengariSer);
  }, 60000);
});

describe('TEMPORARY wasmoon benchmark', () => {
  it('test_wasmoon_default_tick_time', async () => {
    // First verify correctness with a short run
    const fengariState = runFengari(60, 8, 5, 42);
    const wasmoonState = await runWasmoon(60, 8, 5, 42);
    const fengariSer = serializeState(fengariState);
    const wasmoonSer = serializeState(wasmoonState);
    expect(wasmoonSer).toBe(fengariSer);

    // Now benchmark: measure tick time including real render-state pull
    const factory = new LuaFactory();
    const lua = await factory.createEngine();
    try {
      await lua.doString(`math.randomseed(42)`);
      await lua.doString(shoalLuaSource);
      const data = JSON.parse(JSON.stringify(shoalData)) as Record<string, unknown>;
      const spawn = data['spawn'] as Record<string, unknown>;
      spawn['initial_fish'] = 60;
      spawn['initial_sharks'] = 8;
      spawn['initial_algae_hubs'] = 6;
      lua.global.set('SHOAL_DATA', data);
      await lua.doString('init_game(SHOAL_DATA)');

      // Warm up
      const tickFn = lua.global.get('tick_game') as (...args: unknown[]) => unknown;
      for (let i = 0; i < 10; i++) {
        tickFn(0.1, {});
      }

      // Measure via os.clock() inside Lua (same approach as fengari baseline)
      const result = await lua.doString(`
        local n = 200
        local start = os.clock()
        for _ = 1, n do
          tick_game(0.1, {})
        end
        local elapsed = os.clock() - start
        return (elapsed / n) * 1000
      `);

      // Note: this Lua-only measurement excludes the JS<->Lua boundary
      // crossing for the render-state pull. To get the REAL interop cost,
      // we also measure with the boundary crossing included.
      const n = 200;
      const jsStart = performance.now();
      for (let i = 0; i < n; i++) {
        tickFn(0.1, {});
      }
      const jsElapsed = performance.now() - jsStart;
      const jsAvgMs = jsElapsed / n;

      console.log(`\n=== WASMOON BENCHMARK — DEFAULT (60 fish, 8 sharks) ===`);
      console.log(`  Lua-only (os.clock, no render-state pull): ${result} ms/tick`);
      console.log(`  Real interop (JS perf.now, render-state pull included): ${jsAvgMs.toFixed(3)} ms/tick`);
      console.log(`  Baseline: optimized fengari = 27.379 ms/tick`);
      expect(jsAvgMs).toBeGreaterThan(0);
    } finally {
      lua.global.close();
    }
  }, 120000);

  it('test_wasmoon_high_load_tick_time', async () => {
    const factory = new LuaFactory();
    const lua = await factory.createEngine();
    try {
      await lua.doString(`math.randomseed(42)`);
      await lua.doString(shoalLuaSource);
      const data = JSON.parse(JSON.stringify(shoalData)) as Record<string, unknown>;
      const spawn = data['spawn'] as Record<string, unknown>;
      spawn['initial_fish'] = 83;
      spawn['initial_sharks'] = 19;
      spawn['initial_algae_hubs'] = 6;
      lua.global.set('SHOAL_DATA', data);
      await lua.doString('init_game(SHOAL_DATA)');

      // Warm up
      const tickFn = lua.global.get('tick_game') as (...args: unknown[]) => unknown;
      for (let i = 0; i < 10; i++) {
        tickFn(0.1, {});
      }

      // Lua-only measurement
      const luaResult = await lua.doString(`
        local n = 200
        local start = os.clock()
        for _ = 1, n do
          tick_game(0.1, {})
        end
        local elapsed = os.clock() - start
        return (elapsed / n) * 1000
      `);

      // Real interop measurement (includes render-state pull)
      const n = 200;
      const jsStart = performance.now();
      for (let i = 0; i < n; i++) {
        tickFn(0.1, {});
      }
      const jsElapsed = performance.now() - jsStart;
      const jsAvgMs = jsElapsed / n;

      console.log(`\n=== WASMOON BENCHMARK — HIGH LOAD (83 fish, 19 sharks) ===`);
      console.log(`  Lua-only (os.clock, no render-state pull): ${luaResult} ms/tick`);
      console.log(`  Real interop (JS perf.now, render-state pull included): ${jsAvgMs.toFixed(3)} ms/tick`);
      console.log(`  Baseline: optimized fengari = 34.560 ms/tick`);
      expect(jsAvgMs).toBeGreaterThan(0);
    } finally {
      lua.global.close();
    }
  }, 120000);
});
