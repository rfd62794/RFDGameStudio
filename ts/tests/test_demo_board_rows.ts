// new: Phase 1 D1.2, demo board rows are generated from the registry.
import { describe, it, expect } from 'vitest';
import type { GameConfig } from '../src/engine/types';
import { GAME_REGISTRY } from '../src/games/registry';
import { STATUS_BOARD } from '../src/status/board.data';
import { DEMO_OVERLAY } from '../src/status/demoOverlay';
import { buildDemoRows, GENERATED_ROW_DATE } from '../src/status/demoRows';

const demo = (extra: Partial<GameConfig> = {}): GameConfig => ({
  gameId: 'demo_x', label: 'Demo X', description: 'A demo.', source: { kind: 'example', slug: 'demo-x' }, ...extra,
});

describe('buildDemoRows', () => {
  it('generates a row from the config alone', () => {
    expect(buildDemoRows([demo({ status: 'external' })], {})).toEqual([{
      id: 'demo_x', name: 'Demo X', category: 'ai_studio_track', status: 'active',
      currentState: 'A demo.', lastUpdated: GENERATED_ROW_DATE,
    }]);
  });

  it('skips games with no source', () => {
    expect(buildDemoRows([demo({ source: undefined })], {})).toEqual([]);
  });

  it('lets the overlay win except that a retired config is always a retired row', () => {
    const overlay = { demo_x: { status: 'shipped_mature' as const, currentState: 'Hand note.', category: 'separate_infrastructure' as const } };
    expect(buildDemoRows([demo({ status: 'external' })], overlay)[0]).toMatchObject({ status: 'shipped_mature', currentState: 'Hand note.', category: 'separate_infrastructure' });
    expect(buildDemoRows([demo({ status: 'retired' })], overlay)[0]).toMatchObject({ status: 'retired' });
  });
});

describe('the real board', () => {
  const sourced = GAME_REGISTRY.filter(g => g.source);

  it('has exactly one row for every registry game that declares a source', () => {
    for (const g of sourced) {
      expect(STATUS_BOARD.filter(e => e.id === g.gameId), g.gameId).toHaveLength(1);
    }
  });

  it('keeps no overlay entry for a game that is not a sourced registry game', () => {
    const ids = new Set(sourced.map(g => g.gameId));
    expect(Object.keys(DEMO_OVERLAY).filter(id => !ids.has(id))).toEqual([]);
  });

  it('never shows a retired config as anything but a retired row', () => {
    for (const g of sourced.filter(x => x.status === 'retired')) {
      expect(STATUS_BOARD.find(e => e.id === g.gameId)?.status, g.gameId).toBe('retired');
    }
  });
});
