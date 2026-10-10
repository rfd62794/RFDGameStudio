import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY, findGame } from '../src/games/registry';

const GAME_DIR = resolve(import.meta.dirname, '../src/games/grainworks');

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

describe('GrainWorks — registry registration', () => {
  it('is registered in GAME_REGISTRY as a dev game', () => {
    const entry = GAME_REGISTRY.find((g) => g.gameId === 'grainworks');
    expect(entry).toBeDefined();
    expect(entry!.label).toBe('GrainWorks');
    expect(entry!.status).toBe('dev');
    expect(entry!.description).toBeTruthy();
    expect(entry!.component).toBeDefined();
  });

  it('declares the AI Studio example as its demo source', () => {
    const entry = GAME_REGISTRY.find((g) => g.gameId === 'grainworks');
    expect(entry!.source).toEqual({ kind: 'example', slug: 'grainworks' });
  });

  it('has a unique gameId across GAME_REGISTRY', () => {
    const ids = GAME_REGISTRY.map((g) => g.gameId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id === 'grainworks')).toHaveLength(1);
  });

  it('does not collide with the sibling voiddrift_redux registration', () => {
    const redux = GAME_REGISTRY.find((g) => g.gameId === 'voiddrift_redux');
    const sandbox = GAME_REGISTRY.find((g) => g.gameId === 'grainworks');
    expect(redux).toBeDefined();
    expect(sandbox).toBeDefined();
    expect(sandbox!.gameId).not.toBe(redux!.gameId);
  });

  it('is collected by the registry glob, with no hand-written import in registry.ts', () => {
    const registryText = readFileSync(resolve(GAME_DIR, '../registry.ts'), 'utf-8');
    expect(registryText).not.toContain('grainworks');
    expect(typeof findGame('grainworks')?.order).toBe('number');
  });
});

describe('GrainWorks — source organization', () => {
  it('has the expected ported file layout', () => {
    const expected = [
      'types.ts',
      'config.ts',
      'App.tsx',
      'simulation/grid.ts',
      'simulation/asteroids.ts',
      'simulation/buildingDefs.ts',
      'simulation/routing.ts',
      'simulation/flowParticles.ts',
      'simulation/buildingOps.ts',
      'simulation/buildingFlow.ts',
      'simulation/buildingManager.ts',
      'simulation/buildings.ts',
      'simulation/renderer.ts',
      'simulation/rendererOverlays.ts',
      'components/Header.tsx',
      'components/BuildPanel.tsx',
      'components/buildPanelHelpers.tsx',
      'components/FilterPopup.tsx',
      'components/InspectPanel.tsx',
      'components/ReconstructionCatalog.tsx',
      'components/HelpModal.tsx',
      'hooks/useSimulationLoop.ts',
      'hooks/useCanvasInput.ts',
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

  it('App.tsx mounts the shared GameShell', () => {
    const appText = readFileSync(resolve(GAME_DIR, 'App.tsx'), 'utf-8');
    expect(appText).toContain('GameShell');
    expect(appText).toContain('GameRendererProps');
  });
});
