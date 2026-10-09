import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SAVE_KEY, hasSavedCareer, wipeSavedCareer } from '../src/games/horse_racing/utils/careerSave';

const appSource = readFileSync(resolve(import.meta.dirname, '../src/games/horse_racing/App.tsx'), 'utf8');
const root = resolve(import.meta.dirname, '..');

describe('horse_racing Continue / New Game', () => {
  beforeEach(() => localStorage.clear());

  it('uses the same save key the game has always used', () => {
    expect(SAVE_KEY).toBe('derby_sim_state_v1');
  });

  it('hasSavedCareer is false with no save or an empty stable, true with a horse', () => {
    expect(hasSavedCareer()).toBe(false);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ funds: 5, horses: [], race_history: [], unlocked_slots: 3 }));
    expect(hasSavedCareer()).toBe(false);
    localStorage.setItem(SAVE_KEY, '{broken');
    expect(hasSavedCareer()).toBe(false);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ funds: 5, horses: [{ id: 'h1' }], race_history: [], unlocked_slots: 3 }));
    expect(hasSavedCareer()).toBe(true);
  });

  it('wipeSavedCareer clears the career but keeps the tutorial-seen flag', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ horses: [{ id: 'h1' }] }));
    localStorage.setItem('derby_sim_tutorial_seen', 'true');
    wipeSavedCareer();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(hasSavedCareer()).toBe(false);
    expect(localStorage.getItem('derby_sim_tutorial_seen')).toBe('true');
  });

  it('the title offers Continue and a two-step New Game when a career exists', () => {
    expect(appSource).toContain("id: 'continue', label: 'Continue'");
    expect(appSource).toContain('Erase my stable and start over?');
    expect(appSource).toContain('wipeSavedCareer()');
    expect(appSource).toContain('const handleStartOver');
  });

  it('a first-time player still sees a single New Game button', () => {
    expect(appSource).toContain("{ id: 'new-game', label: 'New Game', variant: 'primary', onClick: handleNewGame }");
  });

  it('has a standalone build wired: script, vite config, entry and page', () => {
    const pkg = readFileSync(resolve(root, 'package.json'), 'utf8');
    expect(pkg).toContain('"build:horse_racing": "vite build --config vite.horse_racing.config.ts"');
    expect(readFileSync(resolve(root, 'vite.horse_racing.config.ts'), 'utf8')).toContain("makeStandaloneConfig('horse_racing')");
    const entry = readFileSync(resolve(root, 'src/standalone/horse_racing/entry.tsx'), 'utf8');
    expect(entry).toContain("import App from '../../games/horse_racing/App'");
    expect(entry).toContain("const gameId = 'horse_racing'");
    expect(readFileSync(resolve(root, 'src/standalone/horse_racing/index.html'), 'utf8')).toContain('<title>Derby Sim</title>');
  });
});
