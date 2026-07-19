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
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const GAMES_DIR = join(__dirname, '..', '..', 'games');

function loadExecutor(gameId: string): LuaExecutor {
  const systemsPath = join(GAMES_DIR, gameId, 'systems.yaml');
  let luaSource: string;
  if (existsSync(systemsPath)) {
    const systems = yaml.load(readFileSync(systemsPath, 'utf-8')) as Record<string, unknown>;
    const luaFiles = systems['lua_files'] as string[] | undefined;
    if (luaFiles && luaFiles.length > 0) {
      luaSource = luaFiles.map(f => readFileSync(join(GAMES_DIR, gameId, f), 'utf-8')).join('\n\n');
    } else {
      luaSource = readFileSync(join(GAMES_DIR, gameId, 'logic.lua'), 'utf-8');
    }
  } else {
    luaSource = readFileSync(join(GAMES_DIR, gameId, 'logic.lua'), 'utf-8');
  }
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
    // Pass empty part_ids — should trigger missing part for slot error
    const result = ex.call('assemble_mutant', 'test', 'red', {}, []);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
    expect(result[1]).toContain('Missing part');
  });

  it('test_horse_racing_can_unlock_slot_max_capacity', () => {
    const ex = loadExecutor('horse_racing');
    // Call with current=12, max=12 — should return false, "already at maximum capacity"
    const result = ex.call('can_unlock_slot', 12, 12, 10, 500);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(false);
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
    expect(result[1]).toContain('maximum capacity');
  });

  it('test_slimeworld_initiate_breeding_error_returns_two_values', () => {
    const ex = loadExecutor('slimeworld');
    // Same parent IDs — should return nil, "Parents must differ"
    const result = ex.call('initiate_breeding',
      { slimes: {}, cycle: 1, credits: 1000, breeding_success_rate_modifier: 0, roster_cap: 10 },
      'same_id', 'same_id', 0, {}, null, {}, null);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeTruthy();
    expect(typeof result[1]).toBe('string');
    expect(result[1]).toContain('Parents must differ');
  });
});
