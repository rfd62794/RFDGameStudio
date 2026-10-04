// new: ts/tests/test_mbb_tabs.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TABS } from '../src/games/mutant_battle_ball/tabs';

const app = readFileSync(resolve(import.meta.dirname, '../src/games/mutant_battle_ball/App.tsx'), 'utf8');

describe('mutant_battle_ball navigation', () => {
  it('lists only the four tabs that have something behind them, in order, shortcuts 1-4', () => {
    expect(TABS.map(t => t.id)).toEqual(['roster', 'workshop', 'match', 'shop']);
    expect(TABS.map(t => t.shortcut)).toEqual(['1', '2', '3', '4']);
  });
  it('has no Infirmary tab while the Infirmary is a stub', () => {
    expect(TABS.some(t => /infirmary/i.test(t.id + t.label))).toBe(false);
  });
  it('App.tsx takes its tabs from tabs.ts and no longer renders the stub', () => {
    expect(app).toContain("import { TABS } from './tabs'");
    expect(app).not.toContain('<InfirmaryTab');
    expect(app).not.toMatch(/const TABS\s*=/);
  });
});
