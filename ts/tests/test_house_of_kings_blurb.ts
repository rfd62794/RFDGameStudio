import { describe, it, expect } from 'vitest';
import config from '../src/games/house_of_kings_collab/config';

describe('house_of_kings_collab blurb', () => {
  it('has gameId house_of_kings_collab', () => {
    expect(config.gameId).toBe('house_of_kings_collab');
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

  it('says sign-in is required', () => {
    expect(config.description ?? '').toContain('sign-in is required');
  });

  it('avoids jargon (zero-trust, Admin SDK)', () => {
    const description = (config.description ?? '').toLowerCase();
    expect(description).not.toContain('zero-trust');
    expect(description).not.toContain('admin sdk');
  });
});
