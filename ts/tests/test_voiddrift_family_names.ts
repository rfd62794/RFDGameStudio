import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findGame, STANDALONE_BUILD_GAMES } from '../src/games/registry';

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const PLAYER_FACING_FILES = [
  'src/games/voiddrift/config.ts',
  'src/games/voiddrift_redux/config.ts',
  'src/games/voiddrift_redux/App.tsx',
  'src/games/grainworks/config.ts',
  'src/games/grainworks/App.tsx',
  'src/games/grainworks/TitleGate.tsx',
  'src/games/grainworks/components/Header.tsx',
  'src/games/grainworks/components/HelpModal.tsx',
  'src/standalone/voiddrift_redux/index.html',
  'src/standalone/grainworks/index.html',
];

describe('VoidDrift family names', () => {
  it('gives the three cabinet entries one spelling and visibly different labels', () => {
    expect(findGame('voiddrift')?.label).toBe('VoidDrift');
    expect(findGame('voiddrift_redux')?.label).toBe('VoidDrift: Core Loop');
    expect(findGame('grainworks')?.label).toBe('GrainWorks');
  });

  it('keeps ids and the itch address unchanged', () => {
    expect(findGame('voiddrift')?.externalUrl).toBe('https://rdug627.itch.io/voidrift');
    expect(findGame('voiddrift_redux')).toBeDefined();
    expect(findGame('grainworks')).toBeDefined();
  });

  it('no player-facing string still says VoidRift, VOIDRIFT or VoidDrift Redux', () => {
    for (const rel of PLAYER_FACING_FILES) {
      const text = read(rel);
      expect(text, `${rel} has VoidRift`).not.toContain('VoidRift');
      expect(text, `${rel} has VOIDRIFT`).not.toContain('VOIDRIFT');
      expect(text, `${rel} has VoidDrift Redux`).not.toContain('VoidDrift Redux');
    }
  });

  it('the generated standalone menu list uses the new Core Loop label', () => {
    expect(STANDALONE_BUILD_GAMES.find((g) => g.id === 'voiddrift_redux')?.label).toBe('VoidDrift: Core Loop');
  });
});
