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

    // Fengari (Lua 5.3, 32-bit integers)
    const session = loadGame('shoal', 42);
    const fengariResult = call(session, '_test_lcg', 42, 10);
    // Fengari doesn't have _test_lcg, so run inline
    const fengariLCG = call(session, 'string', 'dump')[0]; // placeholder
    // Actually, let's just run the LCG via fengari's call mechanism
    // We need to define a function. Let's use doString equivalent.
    // The fengari executor doesn't expose doString directly, but we can
    // call a function that we define via the executor.
    // Actually, the LuaExecutor class has a method to run strings.
    // Let's just check the integer width via a known function.

    console.log('\n=== LCG DIVERGENCE CHECK (seed=42, 10 iterations) ===');
    console.log('  wasmoon LCG values:', wasmoonResult);
    console.log('  wasmoon math.maxinteger:', wasmoonMaxInt);
    console.log('  wasmoon 42 * 1103515245:', wasmoonMul);

    // Fengari's integer width: 32-bit (confirmed from fengari docs)
    // "In Fengari, integers are 32bit while numbers are doubles"
    // So fengari would compute 42 * 1103515245 as:
    //   32-bit: (42 * 1103515245) mod 2^32 = 46347640290 mod 4294967296
    //   = 46347640290 - 10*4294967296 = 46347640290 - 42949672960 = 3479673330
    //   But 3479673330 > 2^31-1 (2147483647), so as a SIGNED 32-bit int it wraps to:
    //   3479673330 - 4294967296 = -815293966
    const fengariMul32bit = ((42 * 1103515245) | 0); // JS 32-bit signed multiply
    console.log('  fengari 42 * 1103515245 (32-bit signed):', fengariMul32bit);

    // The LCG: s = (s * 1103515245 + 12345) % 2147483648
    // In fengari (32-bit), s * 1103515245 overflows and wraps to 32-bit signed.
    // Then + 12345, then % 2147483648 (which is 2^31, positive in both).
    // Let's simulate fengari's 32-bit LCG:
    let s = 42;
    const fengariVals: number[] = [];
    for (let i = 0; i < 10; i++) {
      // 32-bit signed multiply (matches fengari's integer arithmetic)
      s = Math.imul(s, 1103515245);
      s = (s + 12345) | 0; // 32-bit signed add
      // % 2147483648 — in Lua, this is mathematical modulo on integers
      // For negative numbers, Lua's % always returns non-negative when divisor is positive
      s = ((s % 2147483648) + 2147483648) % 2147483648;
      fengariVals.push(s);
    }
    console.log('  fengari LCG values (simulated 32-bit):', fengariVals.join(', '));

    expect(wasmoonResult).toBeDefined();
  }, 30000);
});
