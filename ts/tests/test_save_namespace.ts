// NEW: save namespacing + migrations, see docs/superpowers/specs/2026-10-04-engine-tooling-roadmap.md
import { describe, it, expect, beforeEach } from 'vitest';
import { saveKey } from '../src/engine/shared/saveNamespace';
import { createMigrationRegistry } from '../src/engine/shared/saveMigrations';
import { loadSave, writeSave, registryMigrate } from '../src/engine/shared/persistence';

const bump = (k: string) => (d: unknown) => ({ ...(d as object), [k]: true });

beforeEach(() => localStorage.clear());

describe('saveKey', () => {
  it('formats rfd:<gameId>:<slot>:save, defaulting slot to main', () => {
    expect(saveKey('shoal')).toBe('rfd:shoal:main:save');
    expect(saveKey('shoal', 'extra')).toBe('rfd:shoal:extra:save');
  });
  it('throws Error on invalid gameId or slot', () => {
    expect(() => saveKey('Shoal')).toThrow(Error);
    expect(() => saveKey('bad-id')).toThrow(Error);
    expect(() => saveKey('')).toThrow(Error);
    expect(() => saveKey('shoal', 'two words')).toThrow(Error);
  });
});

describe('createMigrationRegistry', () => {
  it('runs steps 1->3 in order', () => {
    const order: number[] = [];
    const reg = createMigrationRegistry({
      1: (d) => (order.push(1), bump('s1')(d)),
      2: (d) => (order.push(2), bump('s2')(d)),
    });
    expect(reg.migrate({ a: 1 }, 1, 3)).toEqual({ a: 1, s1: true, s2: true });
    expect(order).toEqual([1, 2]);
  });
  it('returns null when a step is missing', () => {
    expect(createMigrationRegistry({ 2: bump('s2') }).migrate({ a: 1 }, 1, 3)).toBeNull();
  });
  it('returns null when a step throws', () => {
    const boom = (): unknown => { throw new Error('boom'); };
    expect(createMigrationRegistry({ 1: boom, 2: bump('s2') }).migrate({}, 1, 3)).toBeNull();
  });
  it('returns null when fromVersion > toVersion', () => {
    expect(createMigrationRegistry({ 1: bump('s1') }).migrate({}, 3, 1)).toBeNull();
  });
});

describe('loadSave + registryMigrate', () => {
  it('loads a v1 envelope as v3 data', () => {
    const key = saveKey('shoal');
    writeSave(key, { a: 1 }, { version: 1 });
    const reg = createMigrationRegistry({ 1: bump('b'), 2: bump('c') });
    const got = loadSave(key, { version: 3, migrate: registryMigrate(reg, 3) });
    expect(got).toEqual({ a: 1, b: true, c: true });
  });
  it('a legacy un-namespaced key still loads through the old API', () => {
    writeSave('legacy_key', { score: 7 });
    expect(loadSave('legacy_key')).toEqual({ score: 7 });
  });
});
