import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * test_voiddrift_redux_restart
 *
 * Tier A (A3, A7) for VoidDrift Core Loop: a text Restart control that returns
 * to the title screen, and a standalone build script. Asserted at source level
 * per suite convention (see test_voiddrift_redux_chrome).
 */

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const appSource = read('src/games/voiddrift_redux/App.tsx');
const panelSource = read('src/games/voiddrift_redux/components/SimulationControlsPanel.tsx');
const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> };

describe('VoidDrift Core Loop restart', () => {
  it('shows a text Restart button on the reset control', () => {
    expect(panelSource).toContain('id="sim-reset-btn"');
    expect(panelSource).toMatch(/<RotateCcw[^>]*\/>\s*Restart\s*<\/button>/);
  });

  it('restart resets the world and returns to the title screen', () => {
    expect(appSource).toContain('const handleRestart = () => {');
    expect(appSource).toMatch(/handleRestart = \(\) => \{\s*handleResetSimulation\(\);\s*setScreen\('title'\);/);
    expect(appSource).toContain('onResetSimulation={handleRestart}');
  });
});

describe('VoidDrift Core Loop standalone build', () => {
  it('has the three standalone files', () => {
    expect(existsSync(resolve(root, 'vite.voiddrift_redux.config.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/voiddrift_redux/entry.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/voiddrift_redux/index.html'))).toBe(true);
  });

  it('points the entry at the game App and the config at the factory', () => {
    expect(read('src/standalone/voiddrift_redux/entry.tsx')).toContain("'../../games/voiddrift_redux/App'");
    expect(read('vite.voiddrift_redux.config.ts')).toContain("makeStandaloneConfig('voiddrift_redux')");
  });

  it('registers the build:voiddrift_redux script', () => {
    expect(packageJson.scripts['build:voiddrift_redux']).toBe('vite build --config vite.voiddrift_redux.config.ts');
  });
});
