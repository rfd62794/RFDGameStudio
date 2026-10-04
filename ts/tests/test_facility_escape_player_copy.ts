// new: ts/tests/test_facility_escape_player_copy.ts
// Source-text guard: the embed's player-visible copy carries no lab language.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Comments are not player-visible: drop JSX comments and whole-line // comments before checking.
const app = readFileSync(
  resolve(import.meta.dirname, '../../examples/facility-escape/src/App.tsx'),
  'utf8',
)
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('facility_escape player-facing copy', () => {
  it('has none of the lab-language terms', () => {
    for (const term of ['prototype', 'validation', 'simulator', 'sandbox', 'telecast', 'property-based', 'hardcoded', 'google ai studio']) {
      expect(app.toLowerCase(), term).not.toContain(term);
    }
  });
  it('uses the plain labels', () => {
    for (const label of ['STEALTH', 'START OVER', 'PLAY AGAIN', 'ROOMS CLEARED', 'HOW TO PLAY']) {
      expect(app, label).toContain(label);
    }
  });
});
