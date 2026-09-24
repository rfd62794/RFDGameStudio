import { describe, it, expect, beforeEach } from 'vitest';
import { loadSave, writeSave, clearSave } from '../src/engine/shared/persistence';

describe('engine/shared persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null for a missing key', () => {
    expect(loadSave('no_such_key')).toBeNull();
  });

  it('returns null for malformed JSON instead of throwing', () => {
    localStorage.setItem('k', '{broken');
    expect(loadSave('k')).toBeNull();
  });

  it('round-trips an unversioned value', () => {
    writeSave('k', { a: 1, b: ['x', 'y'] });
    expect(loadSave('k')).toEqual({ a: 1, b: ['x', 'y'] });
  });

  it('stores unversioned values as raw JSON (no envelope)', () => {
    writeSave('k', { a: 1 });
    expect(localStorage.getItem('k')).toBe('{"a":1}');
  });

  it('writes and reads versioned values via the {v, data} envelope', () => {
    writeSave('k', { a: 1 }, { version: 2 });
    expect(localStorage.getItem('k')).toBe('{"v":2,"data":{"a":1}}');
    expect(loadSave('k', { version: 2 })).toEqual({ a: 1 });
  });

  it('returns null on a version mismatch when no migrate is given', () => {
    writeSave('k', { a: 1 }, { version: 1 });
    expect(loadSave('k', { version: 2 })).toBeNull();
  });

  it('runs migrate with (old.data, old.v) on a stale version', () => {
    writeSave('k', { a: 1 }, { version: 1 });
    const migrated = loadSave<{ a: number; b: number }>('k', {
      version: 2,
      migrate: (old, fromVersion) => {
        expect(fromVersion).toBe(1);
        return { ...(old as { a: number }), b: 99 };
      },
    });
    expect(migrated).toEqual({ a: 1, b: 99 });
  });

  it('returns null when a versioned read finds a non-envelope', () => {
    writeSave('k', { a: 1 });
    expect(loadSave('k', { version: 1 })).toBeNull();
  });

  it('clearSave removes the key', () => {
    writeSave('k', 1);
    clearSave('k');
    expect(localStorage.getItem('k')).toBeNull();
    expect(loadSave('k')).toBeNull();
  });
});
