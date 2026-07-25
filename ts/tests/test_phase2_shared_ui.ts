import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

function src(...parts: string[]) {
  return readFileSync(resolve(import.meta.dirname, '../src', ...parts), 'utf8');
}

function doc(...parts: string[]) {
  return readFileSync(resolve(import.meta.dirname, '../../docs', ...parts), 'utf8');
}

function readSource(game: string, file: string) {
  return src('games', game, file);
}

describe('Phase 2 shared UI retrofits', () => {
  it('test_slimeworld_shared_ui_audit', () => {
    const audit = doc('analysis', 'ui-component-audit-phase2.md');
    expect(audit).toContain('### `slimeworld`');
    expect(audit).toContain('### `shoal`');
    expect(audit).toContain('### `mutant_battle_ball`');
    expect(audit).toContain('### `scrapcrawl`');
    expect(audit).toContain('TabBar');
    expect(audit).toContain('Button');
    expect(audit).toContain('Badge');
  });

  it('test_slimeworld_tabbar_retrofit', () => {
    const app = readSource('slimeworld', 'App.tsx');
    const roster = readSource('slimeworld', 'components/RosterTab.tsx');
    const missions = readSource('slimeworld', 'components/MissionsTab.tsx');

    expect(app).toMatch(/import\s*\{[^}]*TabBar[^}]*\}\s*from\s*['"]\.\.\/\.\.\/ui\/components['"]/);
    expect(app).toContain('<TabBar');
    expect(app).toContain("{ id: 'roster', label: 'ROSTER' }");
    expect(app).toContain("{ id: 'missions', label: 'MISSIONS' }");
    expect(app).toContain("{ id: 'economy', label: 'ECONOMY' }");
    expect(app).toContain("{ id: 'lab', label: 'LAB' }");
    expect(roster).toMatch(/import\s*\{[^}]*TabBar[^}]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/ui\/components(\/TabBar)?['"]/);
    expect(missions).toMatch(/import\s*\{[^}]*TabBar[^}]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/ui\/components(\/TabBar)?['"]/);
  });

  it('test_shoal_chrome_retrofit', () => {
    const source = readSource('shoal', 'App.tsx');
    expect(source).toMatch(/import\s*\{[^}]*Button[^}]*\}\s*from\s*['"]\.\.\/\.\.\/ui\/components['"]/);
    expect(source).toContain('<Button');
    expect(source).toContain('shoal-tool');
    expect(source).toContain('canvas');
    expect(source).toContain('function ShoalCanvas');
  });

  it('test_mutant_battle_ball_retrofit', () => {
    const roster = readSource('mutant_battle_ball', 'components/RosterTab.tsx');
    const app = readSource('mutant_battle_ball', 'App.tsx');

    expect(roster).toMatch(/import\s*\{[^}]*Button[^}]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/ui\/components['"]/);
    expect(roster).toMatch(/import\s*\{[^}]*Card[^}]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/ui\/components['"]/);
    expect(roster).toContain('<Card');
    expect(roster).toContain('<Button');
    expect(app).toMatch(/import\s*\{[^}]*Badge[^}]*\}\s*from\s*['"]\.\.\/\.\.\/ui\/components['"]/);
    expect(app).toContain('<Badge');
  });

  it('test_scrapcrawl_retrofit', () => {
    const source = readSource('scrapcrawl', 'App.tsx');
    expect(source).toMatch(/import\s*\{[^}]*Button[^}]*\}\s*from\s*['"]\.\.\/\.\.\/ui\/components['"]/);
    expect(source).toMatch(/import\s*\{[^}]*Badge[^}]*\}\s*from\s*['"]\.\.\/\.\.\/ui\/components['"]/);
    expect(source).toMatch(/import\s*\{[^}]*Card[^}]*\}\s*from\s*['"]\.\.\/\.\.\/ui\/components['"]/);
    expect(source).toMatch(/import\s*\{[^}]*Panel[^}]*\}\s*from\s*['"]\.\.\/\.\.\/ui\/components['"]/);
    expect(source).toMatch(/import\s*\{[^}]*EmptyState[^}]*\}\s*from\s*['"]\.\.\/\.\.\/ui\/components['"]/);
    expect(source).toContain('<Button');
    expect(source).toContain('<Badge');
    expect(source).toContain('<Card');
    expect(source).toContain('<Panel');
    expect(source).toContain('<EmptyState');
  });

  it('test_horse_racing_slither_rogue_untouched', () => {
    const changed = execSync(
      'git diff --name-only -- ts/src/games/horse_racing ts/src/games/slither_rogue games/horse_racing games/slither_rogue',
      { encoding: 'utf8', cwd: resolve(import.meta.dirname, '../..') }
    );
    expect(changed.trim()).toBe('');
  });
});
