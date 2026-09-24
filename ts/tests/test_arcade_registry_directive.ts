import { describe, expect, it } from 'vitest';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY } from '../src/games/registry';

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

  it('test_registry_planetofgreed_present', () => {
    const entry = GAME_REGISTRY.find(g => g.gameId === 'planetofgreed');
    expect(entry).toBeDefined();
    expect(entry!.gameId).toBe('planetofgreed');
    expect(entry!.label).toBe('Planet of Greed');
    expect(entry!.description).toBeTruthy();
    expect(entry!.description!.length).toBeGreaterThan(0);
    expect(entry!.status).toBe('dev');
    expect(entry!.component).toBeDefined();
  });

  // Legacy/Origin Projects (ADR-023, Aug 23 2026): SlimeGarden and
  // SlimeBreeder merged to become the current, live SlimeWorld. Real
  // origin history, registered honestly as such — not competing new
  // entries. Supersedes the prior "absent" tests from before the Type
  // existed.
  it('test_registry_slimebreeder_slimegarden_present_as_legacy_origin', () => {
    const ids = GAME_REGISTRY.map(g => g.gameId);
    expect(ids).toContain('slimebreeder');
    expect(ids).toContain('slimegarden');
  });

  it('test_slimebreeder_slimegarden_descriptions_name_slimeworld', () => {
    const slimebreeder = GAME_REGISTRY.find(g => g.gameId === 'slimebreeder');
    const slimegarden = GAME_REGISTRY.find(g => g.gameId === 'slimegarden');
    expect(slimebreeder).toBeDefined();
    expect(slimegarden).toBeDefined();
    expect(slimebreeder!.description).toContain('SlimeWorld');
    expect(slimegarden!.description).toContain('SlimeWorld');
    expect(slimebreeder!.status).toBe('external');
    expect(slimegarden!.status).toBe('external');
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

  // Legacy/Origin Projects (ADR-023): CorpWorld and Kingmaker Squads were
  // superseded by the current, live Planet of Greed. Real origin history,
  // registered honestly as such. Supersedes the prior "retired/absent"
  // tests from before the Type existed.
  it('test_registry_corpworld_kingmaker_present_as_legacy_origin', () => {
    const ids = GAME_REGISTRY.map(g => g.gameId);
    expect(ids).toContain('corpworld');
    expect(ids).toContain('kingmaker_squads');
  });

  it('test_corpworld_kingmaker_descriptions_name_planetofgreed', () => {
    const corpworld = GAME_REGISTRY.find(g => g.gameId === 'corpworld');
    const kingmakerSquads = GAME_REGISTRY.find(g => g.gameId === 'kingmaker_squads');
    expect(corpworld).toBeDefined();
    expect(kingmakerSquads).toBeDefined();
    expect(corpworld!.description).toContain('Planet of Greed');
    expect(kingmakerSquads!.description).toContain('Planet of Greed');
    expect(corpworld!.status).toBe('external');
    expect(kingmakerSquads!.status).toBe('external');
  });

  it('test_corpworld_kingmaker_source_intact', () => {
    const repoRoot = resolve(import.meta.dirname, '../..');
    for (const id of ['corpworld', 'kingmaker_squads']) {
      const dir = resolve(repoRoot, 'ts/src/games', id);
      expect(existsSync(dir), `${id} source dir missing`).toBe(true);
      expect(lstatSync(dir).isDirectory(), `${id} path is not a directory`).toBe(true);
      const config = resolve(dir, 'config.ts');
      expect(existsSync(config), `${id} config.ts missing`).toBe(true);
    }
  });

  // Legacy/Origin Projects (ADR-023): the Dissonance Loop Prototype
  // (tmp/dissonance-src/) is the original AI Studio source behind the
  // current, live Dissonance Depths.
  it('test_registry_dissonance_prototype_present_as_legacy_origin', () => {
    const entry = GAME_REGISTRY.find(g => g.gameId === 'dissonance_prototype');
    expect(entry).toBeDefined();
    expect(entry!.status).toBe('external');
    expect(entry!.description).toContain('Dissonance Depths');
  });

  // tmp/ is gitignored: the original AI Studio source only exists in a local
  // checkout, so this skips in a fresh clone or CI.
  it.skipIf(!existsSync(resolve(import.meta.dirname, '../../tmp/dissonance-src')))('test_dissonance_prototype_source_intact', () => {
    const repoRoot = resolve(import.meta.dirname, '../..');
    const dir = resolve(repoRoot, 'tmp/dissonance-src');
    expect(existsSync(dir), 'tmp/dissonance-src missing').toBe(true);
    expect(lstatSync(dir).isDirectory(), 'tmp/dissonance-src is not a directory').toBe(true);
    // Real, original AI Studio source files.
    expect(existsSync(resolve(dir, 'metadata.json'))).toBe(true);
    expect(existsSync(resolve(dir, 'src', 'App.tsx'))).toBe(true);
  });

});

// Game folders with a config.ts that are intentionally NOT in GAME_REGISTRY.
const UNREGISTERED: Record<string, string> = {
  brewfield: 'superseded by Dissonance Depths (owner decision, docs/state/current.md)',
  early_learning_buddy: 'present but never registered; owner to decide',
};

describe('Registry invariants (replace the pinned order/count, Sep 19 2026)', () => {
  const gamesDir = resolve(__dirname, '../src/games');
  const registryText = readFileSync(resolve(gamesDir, 'registry.ts'), 'utf-8');

  it('game ids are unique', () => {
    const ids = GAME_REGISTRY.map(g => g.gameId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every game folder with a config.ts is registered, except known exceptions', () => {
    const registered = new Set(GAME_REGISTRY.map(g => g.gameId));
    const folders = readdirSync(gamesDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(resolve(gamesDir, d.name, 'config.ts')))
      .map(d => d.name);
    const missing = folders.filter(f => !registered.has(f) && !(f in UNREGISTERED));
    expect(missing).toEqual([]);
  });

  it('has exactly one pair of each demos marker', () => {
    for (const marker of ['// demos:imports:begin', '// demos:imports:end', '// demos:begin', '// demos:end']) {
      expect(registryText.split(marker).length - 1, marker).toBe(1);
    }
  });

  it('every entry between the demos markers is an example demo', () => {
    // Skip the rest of the begin-marker line (it carries a comment), stop at the end marker.
    const block = registryText.split('// demos:begin')[1].split('\n').slice(1).join('\n').split('// demos:end')[0];
    const names = block.split(/[\s,]+/).filter(Boolean);
    const importMap: Record<string, string> = Object.fromEntries(
      [...registryText.matchAll(/import\s+(?:\{\s*(\w+)\s*\}|(\w+))\s+from\s+'\.\/(\w+)\/config'/g)]
        .map(m => [m[1] ?? m[2], m[3]]));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const game = GAME_REGISTRY.find(g => g.gameId === importMap[name]);
      expect(game?.source?.kind, name).toBe('example');
    }
  });
});
