import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY, findGame } from '../src/games/registry';
import {
  BOARD_THEMES,
  COIN_TYPES,
  LEVEL_SETTINGS,
  POCKET_COIN_TYPES,
  WHEEL_REWARDS,
} from '../src/games/coin_pusher_arcade/data';

const GAME_DIR = resolve(import.meta.dirname, '../src/games/coin_pusher_arcade');

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

describe('Coin Pusher Arcade — registry registration', () => {
  it('is registered in GAME_REGISTRY as a dev game', () => {
    const entry = GAME_REGISTRY.find(g => g.gameId === 'coin_pusher_arcade');
    expect(entry).toBeDefined();
    expect(entry!.label).toBe('Coin Pusher Arcade');
    expect(entry!.status).toBe('dev');
    expect(entry!.description).toBeTruthy();
    expect(entry!.component).toBeDefined();
  });

  it('declares the AI Studio example as its demo source', () => {
    const entry = GAME_REGISTRY.find(g => g.gameId === 'coin_pusher_arcade');
    expect(entry!.source).toEqual({ kind: 'example', slug: 'coin-pusher-arcade' });
  });

  it('has a unique gameId across GAME_REGISTRY', () => {
    const ids = GAME_REGISTRY.map(g => g.gameId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter(id => id === 'coin_pusher_arcade')).toHaveLength(1);
  });

  it('is collected by the registry glob, with no hand-written import in registry.ts', () => {
    const registryText = readFileSync(resolve(GAME_DIR, '../registry.ts'), 'utf-8');
    expect(registryText).not.toContain('coin_pusher_arcade');
    expect(typeof findGame('coin_pusher_arcade')?.order).toBe('number');
  });
});

describe('Coin Pusher Arcade — source organization', () => {
  it('has the expected ported file layout', () => {
    const expected = [
      'types.ts',
      'data.ts',
      'config.ts',
      'App.tsx',
      'logic/physics.ts',
      'logic/coins.ts',
      'logic/combo.ts',
      'logic/wheel.ts',
      'utils/sound.ts',
      'components/render.ts',
      'components/BoardCanvas.tsx',
      'components/SidePanel.tsx',
      'components/PocketHand.tsx',
      'components/HelpModal.tsx',
      'components/RewardWheelModal.tsx',
      'components/PocketCoinPickerModal.tsx',
    ];
    for (const rel of expected) {
      expect(existsSync(resolve(GAME_DIR, rel)), `missing ${rel}`).toBe(true);
    }
  });

  it('keeps every created file under 600 lines', () => {
    const files = listFiles(GAME_DIR);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const lines = readFileSync(file, 'utf-8').split('\n').length;
      expect(lines, `${file} has ${lines} lines`).toBeLessThanOrEqual(600);
    }
  });

  it('keeps logic modules pure: no DOM, timing, I/O, or ambient randomness', () => {
    const logicDir = resolve(GAME_DIR, 'logic');
    const files = readdirSync(logicDir).filter(f => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThanOrEqual(4);
    const forbidden = [
      'Math.random',
      'Date.now',
      'localStorage',
      'document.',
      'window.',
      'AudioContext',
      'setTimeout',
      'setInterval',
      'requestAnimationFrame',
    ];
    for (const file of files) {
      const text = readFileSync(resolve(logicDir, file), 'utf-8');
      for (const needle of forbidden) {
        expect(text.includes(needle), `${file} references ${needle}`).toBe(false);
      }
    }
  });

  it('App.tsx mounts the shared GameShell and shared persistence helpers', () => {
    const appText = readFileSync(resolve(GAME_DIR, 'App.tsx'), 'utf-8');
    expect(appText).toContain('GameShell');
    expect(appText).toContain('loadSave');
    expect(appText).toContain('writeSave');
    expect(appText).toContain('coin_pusher_arcade_meta_stats');
  });
});

describe('Coin Pusher Arcade — data parity with the example', () => {
  it('keeps the example coin roster, rewards, pocket types, levels, and themes', () => {
    expect(COIN_TYPES.map(c => c.id)).toEqual([
      'gold',
      'steel',
      'emerald',
      'ruby',
      'obsidian',
      'cosmic',
    ]);
    expect(WHEEL_REWARDS.map(r => r.id)).toEqual([
      'coin_bird',
      'coin_tower',
      'bumper',
      'multiplier_pad',
      'gutter_shield',
    ]);
    expect(POCKET_COIN_TYPES.map(c => c.id)).toEqual([
      'tnt',
      'magnet',
      'double_drop',
      'giga_gold',
    ]);
    expect(LEVEL_SETTINGS.map(l => l.level)).toEqual([1, 2, 3, 4]);
    expect(BOARD_THEMES.map(t => t.id)).toEqual(['neon', 'pharaoh', 'cosmic', 'retro']);
  });

  it('keeps the example level tuning values', () => {
    const l1 = LEVEL_SETTINGS[0];
    expect(l1.pushTarget).toBe(100);
    expect(l1.boardWidth).toBe(440);
    expect(l1.startingCoinsCount).toBe(20);
    expect(l1.comboWindowMs).toBe(2000);
    expect(l1.gutterWidth).toBe(35);
    expect(l1.pusherSpeed).toBe(1.5);

    const l4 = LEVEL_SETTINGS[3];
    expect(l4.pushTarget).toBe(1000);
    expect(l4.boardWidth).toBe(560);
    expect(l4.startingCoinsCount).toBe(65);
    expect(l4.comboWindowMs).toBe(1200);
    expect(l4.gutterWidth).toBe(50);
    expect(l4.pusherSpeed).toBe(2.6);
  });

  it('keeps the example unlock thresholds', () => {
    expect(COIN_TYPES.find(c => c.id === 'ruby')!.unlockedAtPushed).toBe(100);
    expect(COIN_TYPES.find(c => c.id === 'obsidian')!.unlockedAtPushed).toBe(300);
    expect(COIN_TYPES.find(c => c.id === 'cosmic')!.unlockedAtPushed).toBe(600);
    expect(WHEEL_REWARDS.find(r => r.id === 'bumper')!.unlockedAtRounds).toBe(1);
    expect(WHEEL_REWARDS.find(r => r.id === 'gutter_shield')!.unlockedAtRounds).toBe(3);
    expect(POCKET_COIN_TYPES.find(c => c.id === 'double_drop')!.unlockedAtPushed).toBe(200);
    expect(POCKET_COIN_TYPES.find(c => c.id === 'giga_gold')!.unlockedAtPushed).toBe(500);
    expect(BOARD_THEMES.find(t => t.id === 'retro')!.unlockedAtCoins).toBe(500);
  });
});
