// @vitest-environment node
// new: ts/tests/test_facility_escape_blurb.ts
//
// Facility Escape — Tier A item A5: the arcade blurb is a player-facing
// line, not a dev note.

import { describe, it, expect } from 'vitest';
import config from '../src/games/facility_escape/config';

describe('test_facility_escape_blurb', () => {
  it('gameId is facility_escape', () => {
    expect(config.gameId).toBe('facility_escape');
  });

  it('description is 60 words or fewer', () => {
    const words = config.description.trim().split(/\s+/).length;
    expect(words).toBeLessThanOrEqual(60);
  });

  it('description contains none of the 5 dev-note terms (prototype, property-based, telecasted, TODO, TBD)', () => {
    const lower = config.description.toLowerCase();
    for (const term of ['prototype', 'property-based', 'telecasted', 'todo', 'tbd']) {
      expect(lower).not.toContain(term);
    }
  });
});
