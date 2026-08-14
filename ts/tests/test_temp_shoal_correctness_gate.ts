// @vitest-environment node
//
// Shoal — Portable Randomness Fix: Correctness Gate
// Verifies that after routing all math.random calls through make_prng,
// fengari (Lua 5.3) and wasmoon (Lua 5.4) produce field-identical
// render state under the same fixed seed.
//
// This is the gate the Wasmoon Swap-Test directive needed to pass.
import { describe, it, expect } from 'vitest';
import { LuaExecutor } from '../src/engine/executor';
import { loadGameFiles } from '../src/engine/loader';
import { LuaFactory } from 'wasmoon';
import * as fs from 'fs';
import * as path from 'path';

// ── Load Shoal game files via the real loader ────────────────────────────────
const files = loadGameFiles('shoal');
const combinedLua = files.engineSource + '\n\n' + files.logic;
const data = files.data as Record<string, unknown>;

// Deep-clone data so each VM gets its own copy
function cloneData(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

// ── Fengari path (existing executor) ─────────────────────────────────────────
function makeFengariSession() {
  const executor = new LuaExecutor(combinedLua, 42, '');
  return executor;
}

// ── Wasmoon path ─────────────────────────────────────────────────────────────
async function makeWasmoonSession() {
  const factory = new LuaFactory();
  const engine = await factory.createEngine();
  await engine.doString(combinedLua);
  return engine;
}

// ── Call helper for wasmoon: push args, call fn, pull result ─────────────────
type WasmoonEngine = Awaited<ReturnType<LuaFactory['createEngine']>>;
async function wasmoonCall(engine: WasmoonEngine, fnName: string, ...args: unknown[]): Promise<unknown> {
  const fn = (await engine.global.get(fnName)) as ((...a: unknown[]) => Promise<unknown>);
  if (typeof fn !== 'function') throw new Error(`Function not found: ${fnName}`);
  return fn(...args);
}

// ── Normalize numbers for comparison (round to 6 decimal places) ─────────────
function normalize(obj: unknown): unknown {
  if (typeof obj === 'number') {
    return Math.round(obj * 1e6) / 1e6;
  }
  if (Array.isArray(obj)) {
    return obj.map(normalize);
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = normalize(v);
    }
    return result;
  }
  return obj;
}

// ── Normalize table-like objects to arrays (wasmoon returns 0-indexed, fengari 1-indexed) ──
function toArr(val: unknown): Record<string, unknown>[] {
  if (Array.isArray(val)) return val as Record<string, unknown>[];
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return [];
    // Check if all keys are numeric
    const isNumeric = keys.every(k => /^\d+$/.test(k));
    if (isNumeric) {
      // Sort by numeric key value
      return keys
        .map(k => parseInt(k, 10))
        .sort((a, b) => a - b)
        .map(k => obj[String(k)] as Record<string, unknown>);
    }
  }
  return [];
}

// ── Extract a comparable subset of render state ──────────────────────────────
function extractComparable(state: unknown): Record<string, unknown> {
  const s = state as Record<string, unknown>;
  return {
    tick_count: s.tick_count,
    stats: s.stats,
    fish: toArr(s.fish).map(f => ({
      id: f.id,
      x: f.x,
      depth: f.depth,
      vx: f.vx,
      vd: f.vd,
      age: f.age,
      fed: f.fed,
      hunger: f.hunger,
      alive: f.alive,
      mature: f.mature,
    })),
    sharks: toArr(s.sharks).map(sh => ({
      id: sh.id,
      x: sh.x,
      depth: sh.depth,
      vx: sh.vx,
      vd: sh.vd,
      age: sh.age,
      fed: sh.fed,
      hunger: sh.hunger,
      alive: sh.alive,
    })),
    algae: toArr(s.algae).map(core => ({
      id: core.id,
      x: core.x,
      depth: core.depth,
      nodule_count: toArr(core.nodules).filter((n: Record<string, unknown>) => n.live).length,
    })),
    chunks: toArr(s.chunks).map(c => ({
      id: c.id,
      x: c.x,
      depth: c.depth,
    })),
  };
}

describe('Shoal Portable Randomness — Correctness Gate', () => {
  it('test_fengari_wasmoon_output_matches_post_fix', async () => {
    // ── Fengari: init + 20 ticks ──────────────────────────────────────────────
    const fengari = makeFengariSession();
    const fData = cloneData();
    (fData.spawn as Record<string, unknown>).seed = 42;
    (fData.spawn as Record<string, unknown>).initial_fish = 60;
    (fData.spawn as Record<string, unknown>).initial_sharks = 8;
    (fData.spawn as Record<string, unknown>).initial_algae_hubs = 6;

    fengari.call('init_game', fData);
    let fState: unknown = null;
    for (let i = 0; i < 20; i++) {
      fState = fengari.call('tick_game', 0.05, {})[0];
    }

    // ── Wasmoon: init + 20 ticks ──────────────────────────────────────────────
    const wasmoon = await makeWasmoonSession();
    const wData = cloneData();
    (wData.spawn as Record<string, unknown>).seed = 42;
    (wData.spawn as Record<string, unknown>).initial_fish = 60;
    (wData.spawn as Record<string, unknown>).initial_sharks = 8;
    (wData.spawn as Record<string, unknown>).initial_algae_hubs = 6;

    await wasmoonCall(wasmoon, 'init_game', wData);
    let wState: unknown = null;
    for (let i = 0; i < 20; i++) {
      wState = await wasmoonCall(wasmoon, 'tick_game', 0.05, {});
    }

    // ── Compare ───────────────────────────────────────────────────────────────
    const fCmp = normalize(extractComparable(fState)) as Record<string, unknown>;
    const wCmp = normalize(extractComparable(wState)) as Record<string, unknown>;

    // Top-level stats must match
    expect(wCmp.tick_count).toBe(fCmp.tick_count);
    expect(wCmp.stats).toEqual(fCmp.stats);

    // Fish: same count, same positions
    const fFish = fCmp.fish as Record<string, unknown>[];
    const wFish = wCmp.fish as Record<string, unknown>[];
    expect(wFish.length).toBe(fFish.length);
    for (let i = 0; i < fFish.length; i++) {
      expect(wFish[i]).toEqual(fFish[i]);
    }

    // Sharks: same count, same positions
    const fSharks = fCmp.sharks as Record<string, unknown>[];
    const wSharks = wCmp.sharks as Record<string, unknown>[];
    expect(wSharks.length).toBe(fSharks.length);
    for (let i = 0; i < fSharks.length; i++) {
      expect(wSharks[i]).toEqual(fSharks[i]);
    }

    // Algae: same count, same nodule counts
    const fAlgae = fCmp.algae as Record<string, unknown>[];
    const wAlgae = wCmp.algae as Record<string, unknown>[];
    expect(wAlgae.length).toBe(fAlgae.length);
    for (let i = 0; i < fAlgae.length; i++) {
      expect(wAlgae[i]).toEqual(fAlgae[i]);
    }

    // Chunks: same count
    const fChunks = fCmp.chunks as Record<string, unknown>[];
    const wChunks = wCmp.chunks as Record<string, unknown>[];
    expect(wChunks.length).toBe(fChunks.length);
    for (let i = 0; i < fChunks.length; i++) {
      expect(wChunks[i]).toEqual(fChunks[i]);
    }
  }, 60000);
});
