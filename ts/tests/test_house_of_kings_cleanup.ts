// @vitest-environment node
// new: ts/tests/test_house_of_kings_cleanup.ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const root = (rel: string) => new URL(`../../${rel}`, import.meta.url);

describe('test_house_of_kings_cleanup', () => {
  it('the player-facing shell carries no development-phase footer', () => {
    const app = readFileSync(root('ts/src/games/house_of_kings_collab/App.tsx'), 'utf8');
    expect(app).not.toContain('Phase 1 First Real Content');
    expect(app).not.toContain('August 2026');
    expect(app).not.toContain('footer={');
  });

  it('the generated server bundle is marked as generated and hidden from diffs', () => {
    const attributes = readFileSync(root('.gitattributes'), 'utf8');
    expect(attributes).toContain('ts/src/games/house_of_kings_collab/server/bundle.js linguist-generated=true -diff');
  });

  it('the Dockerfile still copies the bundle it needs', () => {
    expect(existsSync(root('ts/src/games/house_of_kings_collab/server/bundle.js'))).toBe(true);
    const dockerfile = readFileSync(root('ts/src/games/house_of_kings_collab/server/Dockerfile'), 'utf8');
    expect(dockerfile).toContain('COPY bundle.js ./bundle.js');
  });
});
