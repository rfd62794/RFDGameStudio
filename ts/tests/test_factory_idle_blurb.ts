import { describe, it, expect } from 'vitest';
import config from '../src/games/factory_idle/config';

describe('factory_idle blurb', () => {
  it('has gameId factory_idle', () => {
    expect(config.gameId).toBe('factory_idle');
  });

  it('has a description of 60 words or fewer', () => {
    const description = config.description ?? '';
    expect(description.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
  });

  it('has a description free of internal markers (LEAST-VERIFIED, fabricated, TODO, TBD)', () => {
    const description = config.description ?? '';
    for (const marker of ['LEAST-VERIFIED', 'fabricated', 'TODO', 'TBD']) {
      expect(description).not.toContain(marker);
    }
  });

  it('labels the build honestly as Phase 2', () => {
    const description = config.description ?? '';
    expect(description).toContain('Phase 2');
  });

  it('points at the Phase 2 example source', () => {
    expect(config.source).toEqual({ kind: 'example', slug: 'factory-idle-precision-armory-phase2' });
  });
});
