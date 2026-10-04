// new: ts/tests/test_antsim_redux_player_copy.ts
// Source-text guard: the embed shows a player a colony to watch, not a lab notebook.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../src/games/antsim_redux/config';

const read = (rel: string) => readFileSync(resolve(import.meta.dirname, '../../examples/antsim-redux', rel), 'utf8');
const app = read('src/App.tsx');

describe('antsim_redux player-facing copy', () => {
  it('the embed UI has no phase badge, anchors tab, test-name list or lab headings', () => {
    expect(app).not.toMatch(/phase\s*\d/i);
    expect(app).not.toMatch(/anchor/i);
    expect(app).not.toMatch(/trophallaxis/i);
    expect(app).not.toMatch(/core directive/i);
  });
  it('the embed UI shows the player line', () => {
    expect(app).toContain('Drop food and watch the colony find it');
  });
  it('the README points at the project state doc', () => {
    expect(read('README.md')).toContain('docs/state/current.md');
  });
  it('the registry description is player-facing', () => {
    const d = (config.description ?? '').toLowerCase();
    expect(d.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    for (const w of ['phase', 'anchor', 'todo', 'tbd']) expect(d).not.toContain(w);
  });
});
