import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VoidDriftEngine } from '../src/games/voiddrift_redux/simulation/engine';
import {
  AUTOSAVE_INTERVAL_MS,
  SAVE_KEY,
  SAVE_VERSION,
  clearEngineSave,
  isValidSave,
  restoreEngine,
  saveEngine,
  snapshotEngine,
} from '../src/games/voiddrift_redux/simulation/save';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function runEngine(engine: VoidDriftEngine, seconds: number): void {
  for (let i = 0; i < seconds * 10; i++) engine.update(0.1);
}

describe('VoidDrift Core Loop save and restore', () => {
  it('round-trips a running world: fleet, asteroids and resources survive', () => {
    const a = new VoidDriftEngine();
    runEngine(a, 60);
    a.stats.resources.Metal = 42;
    a.stats.closedLoopsCompleted = 3;
    saveEngine(a);

    const b = new VoidDriftEngine();
    expect(restoreEngine(b)).toBe(true);
    expect(b.stats.resources.Metal).toBe(42);
    expect(b.stats.closedLoopsCompleted).toBe(3);
    expect(b.miningDrones.length).toBe(a.miningDrones.length);
    expect(b.haulers.length).toBe(a.haulers.length);
    expect(b.asteroids.length).toBe(a.asteroids.length);
    expect(b.miningDrones.map((d) => d.state)).toEqual(a.miningDrones.map((d) => d.state));
    expect(snapshotEngine(b)).toEqual(snapshotEngine(a));
  });

  it('a restored engine keeps simulating without throwing', () => {
    const a = new VoidDriftEngine();
    runEngine(a, 30);
    saveEngine(a);
    const b = new VoidDriftEngine();
    restoreEngine(b);
    expect(() => runEngine(b, 30)).not.toThrow();
  });

  it('stores a versioned envelope under the voiddrift_redux_save key', () => {
    saveEngine(new VoidDriftEngine());
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as { v: number };
    expect(raw.v).toBe(SAVE_VERSION);
    expect(SAVE_KEY).toBe('voiddrift_redux_save');
  });

  it('returns false and leaves the engine untouched for a missing, corrupt or wrong-version save', () => {
    const engine = new VoidDriftEngine();
    const before = snapshotEngine(engine);
    expect(restoreEngine(engine)).toBe(false);
    localStorage.setItem(SAVE_KEY, '{broken');
    expect(restoreEngine(engine)).toBe(false);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 999, data: before }));
    expect(restoreEngine(engine)).toBe(false);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, data: { scouts: 'x' } }));
    expect(restoreEngine(engine)).toBe(false);
    expect(snapshotEngine(engine)).toEqual(before);
  });

  it('clearEngineSave removes the save', () => {
    saveEngine(new VoidDriftEngine());
    clearEngineSave();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(isValidSave(null)).toBe(false);
  });
});

describe('VoidDrift Core Loop save wiring', () => {
  const appSource = readFileSync(
    resolve(import.meta.dirname, '../src/games/voiddrift_redux/App.tsx'),
    'utf8'
  );

  it('restores a save when the engine is first created', () => {
    expect(appSource).toMatch(/new VoidDriftEngine\(\);\s*restoreEngine\(engineRef\.current\);/);
  });

  it('autosaves on an interval and on pagehide, and cleans up', () => {
    expect(appSource).toContain('setInterval(save, AUTOSAVE_INTERVAL_MS)');
    expect(appSource).toContain("addEventListener('pagehide', save)");
    expect(appSource).toContain("removeEventListener('pagehide', save)");
  });

  it('clears the save when the world is reset', () => {
    expect(appSource).toMatch(/engine\.initWorld\(\);\s*clearEngineSave\(\);/);
  });

  it('autosaves every 5 seconds', () => {
    expect(AUTOSAVE_INTERVAL_MS).toBe(5000);
  });
});
