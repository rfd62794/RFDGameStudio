import { describe, it, expect } from 'vitest';
import config from '../src/games/trinity_siege/config';

describe('trinity_siege blurb', () => {
  it('has gameId trinity_siege', () => {
    expect(config.gameId).toBe('trinity_siege');
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
});
