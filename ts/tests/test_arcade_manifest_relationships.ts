import { describe, it, expect } from 'vitest';
import { buildArcadeManifest } from '../src/arcade-manifest/buildManifest';
import { GAME_REGISTRY } from '../src/games/registry';
import type { GameConfig } from '../src/engine/types';

const none = () => null;
const game = (over: Partial<GameConfig>): GameConfig => ({ gameId: 'a', label: 'A', ...over });

describe('arcade manifest relationship fields (federated arcade contract)', () => {
  it('passes authored relatedGames and exact story URLs through to the manifest', () => {
    const m = buildArcadeManifest({
      registry: [
        game({
          relatedGames: ['b'],
          studioStoryUrl: 'https://rfditservices.com/projects/studio-status-a/',
          devlogUrl: 'https://rdug627.itch.io/game-a/devlog',
        }),
        game({ gameId: 'b' }),
      ],
      metadata: {},
      statusEntries: [],
      readText: none,
      now: () => 'T',
    });
    const [a, b] = m.games;
    expect(a.relatedGames).toEqual(['b']);
    expect(a.studioStoryUrl).toBe('https://rfditservices.com/projects/studio-status-a/');
    expect(a.devlogUrl).toBe('https://rdug627.itch.io/game-a/devlog');
    expect(b.relatedGames).toBeUndefined();
    expect(b.studioStoryUrl).toBeUndefined();
    expect(b.devlogUrl).toBeUndefined();
  });

  it('fails deterministically when a relatedGames id is not in the authoritative catalog', () => {
    const inputs = {
      registry: [game({ relatedGames: ['ghost'] })],
      metadata: {},
      statusEntries: [],
      readText: none,
    };
    expect(() => buildArcadeManifest(inputs)).toThrowError(/a.*relatedGames.*ghost|relatedGames.*ghost/);
    expect(() => buildArcadeManifest(inputs)).toThrowError('a.relatedGames references unknown gameId \'ghost\'');
  });

  it('serializes absent relationships as absent — never an empty fallback', () => {
    const m = buildArcadeManifest({
      registry: [game({ relatedGames: ['b'] }), game({ gameId: 'b' })],
      metadata: {},
      statusEntries: [],
      readText: none,
      now: () => 'T',
    });
    const json = JSON.parse(JSON.stringify(m)) as { games: Record<string, unknown>[] };
    expect('relatedGames' in json.games[0]).toBe(true);
    expect('relatedGames' in json.games[1]).toBe(false);
    expect('studioStoryUrl' in json.games[0]).toBe(false);
    expect('devlogUrl' in json.games[1]).toBe(false);
  });

  it('real registry: deterministic related-game fixtures resolve for site M12/M13', () => {
    const m = buildArcadeManifest({ registry: GAME_REGISTRY, metadata: {}, statusEntries: [], readText: none });
    const byId = Object.fromEntries(m.games.map(g => [g.gameId, g]));
    expect(byId.planetofgreed.relatedGames).toEqual(['corpworld', 'kingmaker_squads']);
    expect(byId.slimeworld.relatedGames).toEqual(['slimegarden', 'slimebreeder']);
    expect(byId.dissonance.relatedGames).toEqual(['dissonance_prototype']);
    expect(byId.voiddrift_redux.relatedGames).toEqual(['voiddrift']);
    for (const g of m.games) {
      for (const id of g.relatedGames ?? []) expect(byId[id], `${g.gameId} -> ${id}`).toBeTruthy();
    }
  });
});
