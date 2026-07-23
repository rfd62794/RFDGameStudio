import { describe, expect, it } from 'vitest';
import { existsSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY } from '../src/games/registry';

const EXPECTED_ORDER = [
  'dissonance',
  'slimeworld',
  'shoal',
  'voiddrift',
  'corpworld',
  'brewfield',
  'horse_racing',
  'slither_rogue',
  'mutant_battle_ball',
  'slime_coin',
  'chimera_wilds',
  'scrapcrawl',
  'ledger',
  'trinity_siege',
];

describe('Arcade Registry Directive — July 2026', () => {
  it('test_registry_dissonance_present', () => {
    const entry = GAME_REGISTRY.find(g => g.gameId === 'dissonance');
    expect(entry).toBeDefined();
    expect(entry!.gameId).toBe('dissonance');
    expect(entry!.label).toBe('Dissonance Depths');
    expect(entry!.description).toBeTruthy();
    expect(entry!.description!.length).toBeGreaterThan(0);
    expect(entry!.status).toBe('dev');
  });

  it('test_registry_order_matches_spec', () => {
    const actual = GAME_REGISTRY.map(g => g.gameId);
    expect(actual).toEqual(EXPECTED_ORDER);
  });

  it('test_registry_slimebreeder_slimegarden_absent', () => {
    const ids = GAME_REGISTRY.map(g => g.gameId);
    expect(ids).not.toContain('slimebreeder');
    expect(ids).not.toContain('slimegarden');
  });

  it('test_slimebreeder_slimegarden_source_intact', () => {
    const repoRoot = resolve(import.meta.dirname, '../..');
    for (const id of ['slimebreeder', 'slimegarden']) {
      const dir = resolve(repoRoot, 'ts/src/games', id);
      expect(existsSync(dir), `${id} source dir missing`).toBe(true);
      expect(lstatSync(dir).isDirectory(), `${id} path is not a directory`).toBe(true);
      const config = resolve(dir, 'config.ts');
      expect(existsSync(config), `${id} config.ts missing`).toBe(true);
    }
  });
});
