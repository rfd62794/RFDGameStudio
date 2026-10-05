import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../src/games/systemic_extract/config';

const indexHtml = readFileSync(resolve(import.meta.dirname, '../../examples/systemic-extract/index.html'), 'utf8');

describe('systemic_extract blurb and page head', () => {
  const d = config.description ?? '';
  it('description is 60 words or fewer and says the hideout is not open yet', () => {
    expect(d.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    expect(d.toLowerCase()).toContain('not open yet');
  });
  it('description has no dev-speak', () => {
    for (const t of ['ecs', 'bevy', 'ss13', 'abiotic', 'sandbox', 'todo', 'tbd']) expect(d.toLowerCase()).not.toContain(t);
  });
  it('does not advertise base-building while the hideout is unreachable', () => {
    expect(config.tags ?? []).not.toContain('base-building');
  });
  it('the example page declares an icon (no more favicon 404) and the same honest description', () => {
    expect(indexHtml).toMatch(/<link rel="icon"/);
    expect(indexHtml).not.toMatch(/Bevy-style|SS13/);
    expect(indexHtml).toContain('not open yet');
  });
});
