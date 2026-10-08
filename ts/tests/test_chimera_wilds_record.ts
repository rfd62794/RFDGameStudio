import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RECORD_KEY, RECORD_LIMIT, clearRecord, loadRecord, saveRecord } from '../src/games/chimera_wilds/utils/record';
import type { EncounterResult } from '../src/games/chimera_wilds/types';

const appSource = readFileSync(resolve(import.meta.dirname, '../src/games/chimera_wilds/App.tsx'), 'utf8');

function entry(won: boolean, roll = 10): EncounterResult {
  return { won, score: 185, chimera_score: 180, roll, chimera: { parts: {}, part_ids: {}, total_power: 100, total_endurance: 80 } };
}

describe('chimera_wilds persisted record', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a saved record, newest first', () => {
    saveRecord([entry(true, 20), entry(false, 3)]);
    const loaded = loadRecord();
    expect(loaded.map(e => e.roll)).toEqual([20, 3]);
    expect(loaded.map(e => e.won)).toEqual([true, false]);
  });

  it('keeps at most RECORD_LIMIT entries', () => {
    saveRecord(Array.from({ length: RECORD_LIMIT + 10 }, (_, i) => entry(i % 2 === 0, (i % 20) + 1)));
    expect(loadRecord()).toHaveLength(RECORD_LIMIT);
  });

  it('returns an empty record for missing or malformed data', () => {
    expect(loadRecord()).toEqual([]);
    localStorage.setItem(RECORD_KEY, '{not json');
    expect(loadRecord()).toEqual([]);
    localStorage.setItem(RECORD_KEY, JSON.stringify({ v: 1, data: [{ nope: 1 }, entry(true)] }));
    expect(loadRecord()).toHaveLength(1);
  });

  it('clearRecord removes the saved record', () => {
    saveRecord([entry(true)]);
    clearRecord();
    expect(localStorage.getItem(RECORD_KEY)).toBeNull();
    expect(loadRecord()).toEqual([]);
  });

  it('App wires load, save and a two-step Reset record button', () => {
    expect(appSource).toContain('history: loadRecord()');
    expect(appSource).toContain('saveRecord(state.history)');
    expect(appSource).toContain('Reset record');
    expect(appSource).toContain('Yes, start fresh');
    expect(appSource).toContain('Keep playing');
  });
});
