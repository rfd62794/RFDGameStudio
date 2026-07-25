import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function dist(game: string) {
  return resolve(import.meta.dirname, '../dist-' + game);
}

function unifiedDist() {
  return resolve(import.meta.dirname, '../dist');
}

function assets(game: string) {
  return readdirSync(resolve(dist(game), 'assets'));
}

function jsName(game: string) {
  return assets(game).find((f) => f.startsWith('index-') && f.endsWith('.js')) ?? '';
}

function jsContent(game: string) {
  return readFileSync(resolve(dist(game), 'assets', jsName(game)), 'utf8');
}

const GAMES = [
  'brewfield',
  'shoal',
  'slimeworld',
  'chimera_wilds',
  'mutant_battle_ball',
  'scrapcrawl',
  'slime_coin',
];

describe('Per-game standalone builds', () => {
  it('test_brewfield_standalone_build_produces_output', () => {
    expect(existsSync(resolve(dist('brewfield'), 'index.html'))).toBe(true);
    const a = assets('brewfield');
    expect(a.some((f) => f.endsWith('.js'))).toBe(true);
    expect(a.some((f) => f.endsWith('.css'))).toBe(true);
  });

  it('test_shoal_standalone_build_produces_output', () => {
    expect(existsSync(resolve(dist('shoal'), 'index.html'))).toBe(true);
    const a = assets('shoal');
    expect(a.some((f) => f.endsWith('.js'))).toBe(true);
    expect(a.some((f) => f.endsWith('.css'))).toBe(true);
  });

  it('test_slimeworld_standalone_build_produces_output', () => {
    expect(existsSync(resolve(dist('slimeworld'), 'index.html'))).toBe(true);
    const a = assets('slimeworld');
    expect(a.some((f) => f.endsWith('.js'))).toBe(true);
    expect(a.some((f) => f.endsWith('.css'))).toBe(true);
  });

  it('test_brewfield_build_excludes_other_games_code', () => {
    const js = jsContent('brewfield');
    expect(js).not.toContain('compute_fish_forces');
    expect(js).not.toContain('create_seed_slime');
    expect(js).not.toContain('spawn_fruit');
  });

  it('test_shoal_build_excludes_other_games_code', () => {
    const js = jsContent('shoal');
    expect(js).not.toContain('resolve_brew');
    expect(js).not.toContain('create_seed_slime');
    expect(js).not.toContain('spawn_fruit');
  });

  it('test_slimeworld_build_excludes_other_games_code', () => {
    const js = jsContent('slimeworld');
    expect(js).not.toContain('resolve_brew');
    expect(js).not.toContain('compute_fish_forces');
    expect(js).not.toContain('spawn_fruit');
  });

  it('test_unified_arcade_build_unaffected', () => {
    expect(existsSync(resolve(unifiedDist(), 'index.html'))).toBe(true);
    const a = readdirSync(resolve(unifiedDist(), 'assets'));
    expect(a.some((f) => f.startsWith('index-') && f.endsWith('.js'))).toBe(true);
    expect(a.some((f) => f.startsWith('MoreGamesByMe-') && f.endsWith('.js'))).toBe(true);
  });

  it('test_publishing_config_entries_valid', () => {
    const cfg = readFileSync(
      resolve(import.meta.dirname, '../../../RFD_IT_Publishing/config/games.yaml'),
      'utf8'
    );
    for (const game of GAMES) {
      expect(cfg).toContain(`${game}:`);
      expect(cfg).toContain(`rdug627/${game}`);
      expect(cfg).toContain(`dist-${game}`);
    }
  });
});
