import { describe, it, expect } from 'vitest';
import config from '../src/games/slimebreeder/config';

describe('slimebreeder blurb', () => {
  it('has gameId slimebreeder', () => {
    expect(config.gameId).toBe('slimebreeder');
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

  it('has a description with no repo paths (ts/src)', () => {
    const description = config.description ?? '';
    expect(description).not.toContain('ts/src');
  });

  it('has a description that names SlimeWorld and the frozen origin exhibit', () => {
    const description = config.description ?? '';
    expect(description).toContain('SlimeWorld');
    expect(description).toContain('Frozen origin exhibit');
  });

  it('keeps supersededBy set to slimeworld', () => {
    expect(config.supersededBy).toBe('slimeworld');
  });
});
