/**
 * verify_bridge.ts — Permanent regression test for multi-return bridge correctness.
 *
 * Loads each game's logic.lua via the real fengari executor, calls functions
 * that are known to use the `return value, error` idiom with arguments
 * designed to trigger error paths, and asserts that the error string is
 * captured (not truncated to just the first return value).
 *
 * This test runs as part of the normal vitest suite.
 */

import { describe, it, expect } from 'vitest';
import { LuaExecutor } from '../src/engine/executor';
import { readFileSync } from 'fs';
import { join } from 'path';

const GAMES_DIR = join(__dirname, '..', '..', '..', 'games');

function loadExecutor(gameId: string): LuaExecutor {
  const luaPath = join(GAMES_DIR, gameId, 'logic.lua');
  const luaSource = readFileSync(luaPath, 'utf-8');
  return new LuaExecutor(luaSource, 42);
}

describe('Multi-Return Bridge Verification', () => {
  it('test_slimeworld_fulfill_petition_error_path', () => {
    const ex = loadExecutor('slimeworld');
    // Call with empty state — petition/slime not found
    const result = ex.call('fulfill_petition', { slimes: {}, petitions: {}, cycle: 1 }, 'nonexistent', 'nonexistent');
    expect(result).toHaveLength(2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
    expect(result[1]).not.toBe('');
  });

  it('test_slimeworld_recycle_slime_error_path', () => {
    const ex = loadExecutor('slimeworld');
    const result = ex.call('recycle_slime', { slimes: {}, cycle: 1 }, 'nonexistent');
    expect(result).toHaveLength(2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
  });

  it('test_horse_racing_can_unlock_slot_error_path', () => {
    const ex = loadExecutor('horse_racing');
    // Call with insufficient funds — should return false, error_string
    const result = ex.call('can_unlock_slot', 3, 12, 10, 500);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(false);
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
    expect(result[1]).toContain('Insufficient');
  });

  it('test_chimera_wilds_generate_chimera_error_path', () => {
    const ex = loadExecutor('chimera_wilds');
    // Pass empty parts — should trigger missing slot error
    const result = ex.call('generate_chimera', {});
    expect(result).toHaveLength(2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
  });

  it('test_mutant_battle_ball_assemble_mutant_error_path', () => {
    const ex = loadExecutor('mutant_battle_ball');
    // Pass empty parts — should trigger missing part error
    const result = ex.call('assemble_mutant', {});
    expect(result).toHaveLength(2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
  });

  it('test_mutant_battle_ball_call_timeout_error_path', () => {
    const ex = loadExecutor('mutant_battle_ball');
    // Pass 0 timeouts remaining — should return false, error
    const result = ex.call('call_timeout', { timeouts_remaining: 0 });
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(false);
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
    expect(result[1]).toContain('No timeouts');
  });

  it('test_slimeworld_initiate_breeding_success_returns_two_values', () => {
    const ex = loadExecutor('slimeworld');
    // Even on success, initiate_breeding returns child, nil
    // We just verify it returns 2 values (not truncated to 1)
    const result = ex.call('initiate_breeding',
      { slimes: {}, cycle: 1, credits: 1000, breeding_success_rate_modifier: 0 },
      'a', 'b', 0, {}, null, {}, null);
    // Should have at least 2 return values (child, nil)
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
