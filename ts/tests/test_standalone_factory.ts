import { describe, expect, it } from 'vitest';
import { makeStandaloneConfig } from '../vite.standalone.factory';

describe('vite standalone factory', () => {
  it('parameterizes root and outDir by gameId', () => {
    const config = makeStandaloneConfig('demo');
    expect(config.base).toBe('./');
    expect(config.root).toContain('src/standalone/demo');
    expect(config.build?.outDir).toContain('dist-demo');
  });

  it('sets standalone define flags', () => {
    const config = makeStandaloneConfig('demo');
    const defs = config.define as Record<string, string>;
    expect(defs['import.meta.env.VITE_STANDALONE']).toBe('"true"');
    expect(defs['import.meta.env.VITE_ARCADE_BASE_URL']).toContain(
      'rfditservices.com/games/rfdgamestudio/'
    );
  });
});
