// new: ts/tests/test_planetofgreed_origins_row.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORIGIN_GAMES, originLinks } from '../src/games/planetofgreed/originGames';
import { arcadeGameHref } from '../src/games/planetofgreed/gameLinks';
import { GAME_REGISTRY } from '../src/games/registry';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const appSource = readFileSync(resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'), 'utf-8');

describe('test_planetofgreed_origins_row', () => {
  it('every origin link is a registry entry that Planet of Greed superseded', () => {
    for (const g of ORIGIN_GAMES) {
      const entry = GAME_REGISTRY.find((r) => r.gameId === g.id);
      expect(entry, `${g.id} is not in the registry`).toBeTruthy();
      expect(entry?.supersededBy, `${g.id} supersededBy`).toBe('planetofgreed');
    }
  });

  it('builds ?game= links in the arcade and none in a standalone build', () => {
    expect(arcadeGameHref('arcade', 'https://example.com/play/?game=planetofgreed#x', 'corpworld')).toBe('https://example.com/play/?game=corpworld');
    expect(arcadeGameHref('standalone', 'https://example.com/', 'corpworld')).toBeNull();
    const links = originLinks('arcade', 'https://example.com/play/');
    expect(links.map((l) => l.id)).toEqual(['corpworld', 'kingmaker_squads']);
    expect(links.every((l) => l.href.includes('?game='))).toBe(true);
    expect(originLinks('standalone', 'https://example.com/')).toEqual([]);
  });

  it('the title screen renders the row', () => {
    expect(appSource).toContain('<OriginsRow mode={mode} />');
  });
});
