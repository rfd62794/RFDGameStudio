// new: ts/src/engine/tuning/store.ts
import type { KnobDef, Overrides } from './types';

const knobRegistry = new Map<string, KnobDef>();
const scopeStack: Overrides[] = [];

export function devTuningEnabled(search: string): boolean {
  return new URLSearchParams(search).get('dev') === '1';
}

export function tuningStorageKey(gameId: string): string {
  return `rfd.tuning.${gameId}`;
}

export function readDevOverrides(
  gameId: string,
  search: string,
  storage?: Pick<Storage, 'getItem'>
): Overrides {
  if (!devTuningEnabled(search)) return {};
  try {
    const store = storage ?? window.localStorage;
    const raw = store.getItem(tuningStorageKey(gameId));
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: Overrides = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (key.startsWith(`${gameId}.`) && typeof value === 'number' && Number.isFinite(value)) {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function writeDevOverrides(
  gameId: string,
  overrides: Overrides,
  storage?: Pick<Storage, 'setItem'>
): void {
  try {
    (storage ?? window.localStorage).setItem(tuningStorageKey(gameId), JSON.stringify(overrides));
  } catch {
    // storage unavailable; dev overrides are best-effort
  }
}

export function clearDevOverrides(
  gameId: string,
  storage?: Pick<Storage, 'removeItem'>
): void {
  try {
    (storage ?? window.localStorage).removeItem(tuningStorageKey(gameId));
  } catch {
    // storage unavailable; dev overrides are best-effort
  }
}

export function withOverrides<T>(overrides: Overrides, fn: () => T): T {
  scopeStack.push(overrides);
  try {
    return fn();
  } finally {
    scopeStack.pop();
  }
}

export function getOverrides(gameId: string): Overrides {
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const merged: Overrides = readDevOverrides(gameId, search);
  for (const scope of scopeStack) {
    for (const [key, value] of Object.entries(scope)) {
      if (key.startsWith(`${gameId}.`)) merged[key] = value;
    }
  }
  return merged;
}

export function defineKnob(def: KnobDef): { get(): number } {
  knobRegistry.set(def.key, def);
  return { get: () => tuned(def.key) };
}

export function tuned(key: string): number {
  const def = knobRegistry.get(key);
  if (!def) throw new Error('unknown knob: ' + key);
  const gameId = key.slice(0, key.indexOf('.'));
  const value = getOverrides(gameId)[key] ?? def.default;
  return Math.min(def.max, Math.max(def.min, value));
}

export function registeredKnobs(gameId?: string): KnobDef[] {
  const all = Array.from(knobRegistry.values());
  return gameId === undefined ? all : all.filter(def => def.key.startsWith(`${gameId}.`));
}
