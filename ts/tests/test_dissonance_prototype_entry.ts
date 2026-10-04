// new: ts/tests/test_dissonance_prototype_entry.ts
import { describe, it, expect } from 'vitest';
import config from '../src/games/dissonance_prototype/config';

describe('dissonance_prototype registry entry', () => {
  const text = (config.description ?? '').toLowerCase();

  it('is still an Origin entry that points at the game it became', () => {
    expect(config.status).toBe('external');
    expect(config.supersededBy).toBe('dissonance');
    expect(config.embedUrl).toBe('/arcade/dissonance_prototype/');
  });

  it('has a description of 60 words or fewer that names Dissonance Depths', () => {
    expect(text.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(60);
    expect(text).toContain('dissonance depths');
  });

  it('leaks no repo path, tool name or developer wording to players', () => {
    for (const banned of ['ts/src', 'examples/', 'tmp/', 'gemini', 'ai studio', 'prototype', 'directive', 'todo']) {
      expect(text).not.toContain(banned);
    }
  });
});
