// @vitest-environment node
// new: ts/tests/test_bpo_sim_identity.ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import config from '../src/games/bpo_sim/config';
import { GAME_REGISTRY, STANDALONE_BUILD_GAMES } from '../src/games/registry';

const root = (rel: string) => new URL(`../../${rel}`, import.meta.url);
const read = (rel: string) => readFileSync(root(rel), 'utf8');

describe('test_bpo_sim_identity', () => {
  it('registers one demo, bpo_sim, labelled BPO Sim, sourced from examples/bpo-sim', () => {
    expect(config.gameId).toBe('bpo_sim');
    expect(config.label).toBe('BPO Sim');
    expect(config.source).toEqual({ kind: 'example', slug: 'bpo-sim' });
    expect(config.embedUrl).toBe('/arcade/bpo_sim/');
    expect(GAME_REGISTRY.filter((g) => g.gameId === 'bpo_sim').length).toBe(1);
    expect(GAME_REGISTRY.some((g) => g.gameId === 'filipino_bpo_simulator')).toBe(false);
    expect(STANDALONE_BUILD_GAMES.some((g) => g.id === 'filipino_bpo_simulator')).toBe(false);
  });

  it('the card copy is honest, short and country-neutral', () => {
    const text = [config.description, config.shortDescription, config.longDescription].join(' ');
    expect((config.description ?? '').trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    for (const marker of ['LEAST-VERIFIED', 'fabricated', 'TODO', 'TBD']) {
      expect(text).not.toContain(marker);
    }
    expect(/filipino|philippine|call center tycoon/i.test(text)).toBe(false);
  });

  it('the example folder holds the Phase 2b build under the new name', () => {
    expect(existsSync(root('examples/bpo-sim/src/components/DialerControlModal.tsx'))).toBe(true);
    expect(existsSync(root('examples/bpo-sim/src/components/DashboardView.tsx'))).toBe(false);
    expect(existsSync(root('examples/bpo-sim/src/components/FloorView.tsx'))).toBe(false);
    expect(existsSync(root('examples/filipino-bpo-simulator'))).toBe(false);
    expect(existsSync(root('ts/src/games/filipino_bpo_simulator'))).toBe(false);
    expect(read('examples/bpo-sim/src/App.tsx')).not.toContain('activeScreen');
    expect(read('examples/bpo-sim/vite.config.ts')).toContain("base: '/arcade/bpo_sim/'");
  });

  it('the display name reads BPO Sim in the page title, metadata and header', () => {
    expect(read('examples/bpo-sim/index.html')).toContain('<title>BPO Sim</title>');
    expect(JSON.parse(read('examples/bpo-sim/metadata.json')).name).toBe('BPO Sim');
    const app = read('examples/bpo-sim/src/App.tsx');
    expect(app).toContain('CALL CENTER TYCOON');
    expect(app).not.toContain('FILIPINO');
    for (const file of ['examples/bpo-sim/index.html', 'examples/bpo-sim/metadata.json']) {
      expect(/filipino|philippine/i.test(read(file)), file).toBe(false);
    }
  });
});
