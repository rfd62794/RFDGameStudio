import { describe, it, expect } from 'vitest';
import { GAME_REGISTRY } from '../src/games/registry';
import { buildRegistryExport } from '../src/arcade-manifest/registryExport';

const SOURCES: Record<string, unknown> = {
  ledger: { kind: 'example', slug: 'ledger' },
  trinity_siege: { kind: 'example', slug: 'trinity-siege' },
  slimebreeder: { kind: 'sibling', repo: 'SlimeBreeder' },
  corpworld: { kind: 'example', slug: 'corpworld' },
  slimegarden: { kind: 'example', slug: 'slimegarden' },
  slimeworld: { kind: 'example', slug: 'slimeworld' },
  '7_days_to_fry': { kind: 'example', slug: '7-days-to-fry' },
  kingmaker_squads: { kind: 'example', slug: 'kingmaker-squads' },
  antsim_redux: { kind: 'example', slug: 'antsim-redux' },
  facility_escape: { kind: 'example', slug: 'facility-escape' },
  systemic_extract: { kind: 'example', slug: 'systemic-extract' },
};

describe('registry export', () => {
  const exp = buildRegistryExport(GAME_REGISTRY, () => 'T');

  it('lists every registry game in order', () => {
    expect(exp.games.map(g => g.gameId)).toEqual(GAME_REGISTRY.map(g => g.gameId));
    expect(exp.generatedAt).toBe('T');
  });

  it('carries source for exactly the example/sibling demos', () => {
    const withSource = Object.fromEntries(exp.games.filter(g => g.source).map(g => [g.gameId, g.source]));
    expect(withSource).toEqual(SOURCES);
  });

  it('flags component games and keeps embedUrl', () => {
    const byId = Object.fromEntries(exp.games.map(g => [g.gameId, g]));
    expect(byId.shoal.hasComponent).toBe(true);
    expect(byId.systemic_extract.hasComponent).toBe(false);
    expect(byId.systemic_extract.embedUrl).toBe('/arcade/systemic_extract/');
  });
});
