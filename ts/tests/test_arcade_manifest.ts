import { describe, it, expect } from 'vitest';
import { buildArcadeManifest, kebab } from '../src/arcade-manifest/buildManifest';
import { GAME_REGISTRY } from '../src/games/registry';
import { SITE_STATUS_ENTRIES } from '../src/status/site-pages.data';
import type { GameConfig } from '../src/engine/types';

const none = () => null;

describe('buildArcadeManifest', () => {
  it('includes every registry game, in registry order', () => {
    const m = buildArcadeManifest({ registry: GAME_REGISTRY, metadata: {}, statusEntries: [], readText: none });
    expect(m.games.map(g => g.gameId)).toEqual(GAME_REGISTRY.map(g => g.gameId));
    expect(m.protocol).toBe('rfd-arcade/1');
  });

  it('flags component games and derives itch from an itch.io externalUrl', () => {
    const m = buildArcadeManifest({ registry: GAME_REGISTRY, metadata: {}, statusEntries: [], readText: none });
    const byId = Object.fromEntries(m.games.map(g => [g.gameId, g]));
    expect(byId.shoal.hasComponent).toBe(true);
    expect(byId.systemic_extract.hasComponent).toBe(false);
    expect(byId.voiddrift.itch).toEqual({ url: 'https://rdug627.itch.io/voidrift' });
    expect(byId.shoal.devlogTag).toBe('shoal');
    expect(byId.horse_racing.devlogTag).toBe('horse-racing');
  });

  it('merges devlog sources newest first and attaches the status report', () => {
    const game: GameConfig = { gameId: 'shoal', label: 'Shoal', status: 'stable', patchNotesPath: 'shoal/PATCH_NOTES_v2.0.0.md' };
    const files: Record<string, string> = {
      'games/shoal/CHANGELOG.md': '## Migration — COMPLETED\n**Date:** August 14 2026\n## Undated\n',
      'ts/src/games/shoal/PATCH_NOTES_v2.0.0.md': '# Notes\n**August 20, 2026**\n',
      'intake/shoal/MANIFEST.md': '### 0.1.0R1 — 2026-07-01T10:00:00\n- Note: First intake\n',
    };
    const m = buildArcadeManifest({
      registry: [game],
      metadata: { shoal: { version: '﻿2.31.0', last_updated: '2026-08-20T10:00:00-04:00', pipeline_stage: 'itch_published' } },
      statusEntries: SITE_STATUS_ENTRIES,
      readText: p => files[p] ?? null,
    });
    const g = m.games[0];
    expect(g.devlog).toEqual([
      { date: '2026-08-20', title: 'Patch notes v2.0.0', source: 'patch-notes' },
      { date: '2026-08-15', title: 'Development status: Live', source: 'status' },
      { date: '2026-08-14', title: 'Migration', source: 'changelog' },
      { date: '2026-07-01', title: 'v0.1.0R1 — First intake', source: 'intake' },
    ]);
    expect(g.statusReport?.badge).toBe('Live');
    expect(g.version).toBe('2.31.0');
    expect(g.pipelineStage).toBe('itch_published');
    expect(m.skipped).toEqual(['shoal: changelog: Undated']);
  });

  it('kebab-cases ids', () => {
    expect(kebab('7_days_to_fry')).toBe('7-days-to-fry');
  });
});
