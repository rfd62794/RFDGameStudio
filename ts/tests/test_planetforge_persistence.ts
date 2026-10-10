// @vitest-environment node
// new: ts/tests/test_planetforge_persistence.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { create_initial_world, resolve_tick } from '../../examples/planetforge/src/engine/slimeEngine';
import {
  SAVE_KEY, serializeWorld, restoreWorld, loadWorld, saveWorld, clearSave, type StorageLike,
} from '../../examples/planetforge/src/persistence';
import { firstStepHint } from '../../examples/planetforge/src/hint';

const read = (rel: string) => readFileSync(new URL(`../../examples/planetforge/src/${rel}`, import.meta.url), 'utf8');

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => { data.set(k, v); },
    removeItem: (k) => { data.delete(k); },
  };
}

describe('test_planetforge_persistence', () => {
  it('round-trips a world that has been played', () => {
    let w = create_initial_world();
    for (let i = 0; i < 12; i++) w = resolve_tick(w);
    w.sectors[1].structure = { type: 'Monument', bonus_focus: 5 };
    const back = restoreWorld(serializeWorld(w), create_initial_world());
    expect(back.current_tick).toBe(12);
    expect(back.sectors[1].structure.type).toBe('Monument');
    expect(back.tiles.length).toBe(32);
    expect(back.settlement_ledger).toEqual(w.settlement_ledger);
  });

  it('returns the fallback for null, garbage, another version and the wrong shape', () => {
    const fallback = create_initial_world();
    expect(restoreWorld(null, fallback)).toBe(fallback);
    expect(restoreWorld('{oops', fallback)).toBe(fallback);
    expect(restoreWorld(JSON.stringify({ v: 2, world: {} }), fallback)).toBe(fallback);
    expect(restoreWorld(JSON.stringify({ v: 1, world: { current_tick: 3, tiles: [] } }), fallback)).toBe(fallback);
  });

  it('saves, loads and clears through a storage object', () => {
    const storage = memoryStorage();
    const w = { ...create_initial_world(), current_tick: 77 };
    expect(saveWorld(storage, w)).toBe(true);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    expect(loadWorld(storage, create_initial_world()).current_tick).toBe(77);
    clearSave(storage);
    expect(loadWorld(storage, create_initial_world()).current_tick).toBe(0);
  });

  it('never throws when storage is missing or blocked', () => {
    const blocked: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('full'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const w = create_initial_world();
    expect(saveWorld(null, w)).toBe(false);
    expect(saveWorld(blocked, w)).toBe(false);
    expect(loadWorld(null, w)).toBe(w);
    expect(loadWorld(blocked, w)).toBe(w);
    expect(() => clearSave(blocked)).not.toThrow();
  });

  it('shows the first-step hint only before the ring has started', () => {
    expect(firstStepHint(0, false)).toContain('Press Play');
    expect(firstStepHint(0, true)).toBeNull();
    expect(firstStepHint(5, false)).toBeNull();
  });

  it('the header uses the PlanetForge name and no engineering jargon', () => {
    const header = read('components/SimulationHeader.tsx');
    expect(header).toContain('PlanetForge');
    expect(header).not.toContain('SlimeWorld');
    expect(header).not.toContain('ADR 002');
    expect(header).not.toContain('Phase: ');
  });

  it('the app loads the saved world and autosaves', () => {
    const app = read('App.tsx');
    expect(app).toContain('loadWorld(browserStorage(), create_initial_world())');
    expect(app).toContain('saveWorld(browserStorage(), worldRef.current)');
    expect(app).toContain('clearSave(browserStorage())');
  });
});
