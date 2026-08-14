/**
 * @vitest-environment node
 */
import { LuaFactory } from 'wasmoon';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';

const WASM_PATH = pathToFileURL(
  resolve(__dirname, '..', 'node_modules', 'wasmoon', 'dist', 'glue.wasm')
).href;

describe('TEMP LCG divergence check', () => {
  it('check wasmoon vs fengari LCG values', async () => {
    // Wasmoon (Lua 5.4, 64-bit integers)
    const factory = new LuaFactory(WASM_PATH);
    const lua = await factory.createEngine();
    let wasmoonResult: unknown;
    let wasmoonMaxInt: unknown;
    let wasmoonMul: unknown;
    try {
      wasmoonResult = await lua.doString(`
        local s = 42
        local vals = {}
        for i = 1, 10 do
          s = (s * 1103515245 + 12345) % 2147483648
          vals[i] = s
        end
        return table.concat(vals, ', ')
      `);
      wasmoonMaxInt = await lua.doString(`return math.maxinteger`);
      wasmoonMul = await lua.doString(`return 42 * 1103515245`);
    } finally {
      lua.global.close();
    }

    // Fengari (Lua 5.3, 32-bit integers per fengari docs:
    // "In Fengari, integers are 32bit while numbers are doubles")
    // We can't easily run raw Lua via the fengari executor (it only exposes
    // named game functions), so we simulate the 32-bit arithmetic in JS.

    console.log('\n=== LCG DIVERGENCE CHECK (seed=42, 10 iterations) ===');
    console.log('  wasmoon LCG values:', wasmoonResult);
    console.log('  wasmoon math.maxinteger:', wasmoonMaxInt);
    console.log('  wasmoon 42 * 1103515245:', wasmoonMul);

    // Fengari's integer width: 32-bit (confirmed from fengari docs)
    const fengariMul32bit = Math.imul(42, 1103515245);
    console.log('  fengari 42 * 1103515245 (32-bit signed):', fengariMul32bit);

    // Simulate fengari's 32-bit LCG:
    let s = 42;
    const fengariVals: number[] = [];
    for (let i = 0; i < 10; i++) {
      s = Math.imul(s, 1103515245);
      s = (s + 12345) | 0;
      s = ((s % 2147483648) + 2147483648) % 2147483648;
      fengariVals.push(s);
    }
    console.log('  fengari LCG values (simulated 32-bit):', fengariVals.join(', '));

    expect(wasmoonResult).toBeDefined();
  }, 30000);
});
