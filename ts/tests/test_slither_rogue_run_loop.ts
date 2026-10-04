// new: ts/tests/test_slither_rogue_run_loop.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';

// Regression: LuaExecutor.call() returns ALL Lua results as an array. The
// slither_rogue UI used the array itself as the render state, so time_left was
// undefined -> "Time NaN" and a black canvas. The UI must take element [0].

interface RS { time_left: number; score: number; events?: Array<{ type: string }> }
const INPUT = { control_type: 'keyboard', mouse_x: 0, mouse_y: 0, keys: { arrowright: true } };

function startRun(duration: number) {
  const session = loadGame('slither_rogue');
  const data = session.files.data as Record<string, unknown>;
  call(session, 'init_game', {
    arena: data['arena'], fruit: data['fruit'], player_stats: data['player_stats'],
    player_preset: (data['player_presets'] as unknown[])[0],
    npc_profiles: data['npc_profiles'], npc_stats: data['npc_stats'],
    evolution_cards: data['evolution_cards'],
    active_evolutions: { speed: 0, magnet: 0, shield: 0, wide: 0, sense: 0, ghost: 0, regen: 0, venom: 0 },
    game_duration: duration,
  });
  return session;
}
const tick = (s: ReturnType<typeof startRun>, dt: number) => call(s, 'tick_game', dt, INPUT)[0] as RS;

describe('slither_rogue run loop', () => {
  it('time is finite and counts down after init and N ticks', () => {
    const s = startRun(60);
    let prev = 60;
    for (let i = 0; i < 30; i++) {
      const rs = tick(s, 0.05);
      expect(Number.isFinite(rs.time_left)).toBe(true);
      expect(rs.time_left).toBeLessThan(prev);
      prev = rs.time_left;
    }
    expect(prev).toBeCloseTo(60 - 30 * 0.05, 5);
  });

  it('the run ends at 0 with a game_over event and a finite score', () => {
    const s = startRun(2);
    let rs = tick(s, 0.1);
    let over = false;
    for (let i = 0; i < 40 && !over; i++) {
      rs = tick(s, 0.1);
      over = (rs.events ?? []).some(e => e.type === 'game_over');
    }
    expect(over).toBe(true);
    expect(rs.time_left).toBe(0);
    expect(Number.isFinite(rs.score)).toBe(true);
  });

  it('the UI unwraps the multi-result call() array at every slither_rogue call site', () => {
    const base = resolve(import.meta.dirname, '../src/games/slither_rogue');
    const sites: Array<[string, string]> = [
      ['App.tsx', 'select_evolution_pool'],
      ['App.tsx', 'check_evolution_trigger'],
      ['components/GameCanvas.tsx', 'tick_game'],
      ['components/GameOverModal.tsx', 'calculate_grade'],
    ];
    for (const [f, fn] of sites) {
      const src = readFileSync(resolve(base, f), 'utf8');
      const m = src.match(new RegExp(String.raw`call\(session, '${fn}'[\s\S]*?\)\s*(\[0\])?\s*as`));
      expect(m, `${f}:${fn} call site`).not.toBeNull();
      expect(m![1], `${f}:${fn}`).toBe('[0]');
    }
  });
});
