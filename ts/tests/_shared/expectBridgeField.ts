/**
 * Shared L1 test helper: expectBridgeField
 *
 * Verifies that a Lua-to-TS bridge conversion preserves a specific field
 * with the expected value. Useful for asserting that the camelCase <->
 * snake_case field mapping in types.ts works correctly.
 */
import { expect } from 'vitest';

/**
 * Asserts that `obj[field]` equals `expected`, with a clear error message
 * naming the field and showing the actual value. Works on any Record-like
 * object from a Lua bridge conversion.
 */
export function expectBridgeField(
  obj: Record<string, unknown>,
  field: string,
  expected: unknown,
  label?: string,
): void {
  const actual = obj[field];
  const prefix = label ? `[${label}] ` : '';
  expect(actual, `${prefix}bridge field "${field}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`).toEqual(expected);
}
