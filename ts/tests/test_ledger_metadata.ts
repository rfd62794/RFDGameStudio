// new: ts/tests/test_ledger_metadata.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const metadata = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../examples/ledger/metadata.json'), 'utf8'),
) as { name: string; description: string; majorCapabilities: string[] };

describe('ledger metadata', () => {
  it('names the game and describes the 10-day run in 60 words or fewer', () => {
    expect(metadata.name).toBe('Ledger');
    expect(metadata.description).toContain('10 days');
    expect(metadata.description.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(60);
  });

  it('claims no capability the game does not use (it makes no Gemini call)', () => {
    expect(metadata.majorCapabilities).toEqual([]);
  });
});
