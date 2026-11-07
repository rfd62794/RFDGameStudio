// @vitest-environment node
// new: ts/tests/test_seeded_random_single_copy.ts
//
// Characterization + guard for roadmap M7.2: exactly one mulberry32
// implementation, in ts/src/engine/shared/seededRandom.ts.
//
// The characterization digests were recorded against the pre-refactor
// private copies (championLadder's ladderRandom, scrapcrawl's seeded) and
// must not change when those copies delegate to the shared mulberry32.
// The guard scans every .ts/.tsx under ts/src for the mulberry32 step
// constant and fails on any file outside the allow-list.

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARENA_TIERS } from '../src/games/gladiator_arena/simulation/championLadder';
import { simulateRun } from '../src/games/scrapcrawl/utils/simulateRun';
import { createScrapcrawlAdapter, scrapcrawlPolicy } from '../src/games/scrapcrawl/playtest';
import { playRun } from '../src/engine/playtest';
import type { Policy } from '../src/engine/playtest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = resolve(repoRoot, 'ts', 'src');
const MULBERRY32_CONSTANT = /0x6d2b79f5/i;

const sha256Json = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

// The only files under ts/src allowed to contain the mulberry32 step constant.
const MULBERRY32_ALLOW_LIST = [
  'ts/src/engine/shared/seededRandom.ts', // the canonical implementation
  'ts/src/engine/paperDoll/techniqueUtils.ts', // documented stateless single-step variant
  'ts/src/standalone/bezier_poc/bezier_blob.ts', // standalone proof-of-concept folder
  'ts/src/standalone/technique_comparison/shared.ts', // standalone proof-of-concept folder
  'ts/src/tests/helpers/seededRandom.ts', // test helper, not game code
];

const ARENA_TIERS_DIGEST = '4560ce93bd71af67e21f6bfd698d90f2c41fd240892db79e8155a80c82de2e83';
const SIMULATE_RUN_DIGESTS: Record<string, string> = {
  '1/false': '87ee31b468d00f296eec23994e5abfa2c4a2c68221700a1d61d2162492e9e1b6',
  '1/true': '4de749ad78f8e66714be45e263678f45193e065be07036dcb7ec1fb4cbc69379',
  '2/false': '87ee31b468d00f296eec23994e5abfa2c4a2c68221700a1d61d2162492e9e1b6',
  '2/true': 'fffe203998828630a1e2d493bd42821d434e8b6d93d2fdf4bb7b787ab98c9e1a',
  '3/false': '87ee31b468d00f296eec23994e5abfa2c4a2c68221700a1d61d2162492e9e1b6',
  '3/true': '60f80b1a8f2d702edae5e8cfe69d44d0bc5790a484f83123552c1c50b55a616b',
};
const PLAY_RUN_DIGEST = '9eeb67b1527ed08e93b68a47290f5f0665c869ecd2c29992ffdba53898a8baad';

const policy = scrapcrawlPolicy as (useCraft: boolean) => Policy;

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...collectSourceFiles(full));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

describe('characterization: gladiator_arena champion ladder', () => {
  it('ARENA_TIERS is unchanged', () => {
    const actual = sha256Json(ARENA_TIERS);
    console.log('RECORDED ARENA_TIERS sha256:', actual);
    expect(actual).toBe(ARENA_TIERS_DIGEST);
  });
});

describe('characterization: scrapcrawl seeded runs', () => {
  for (const seed of [1, 2, 3]) {
    for (const useCraft of [false, true]) {
      it(`simulateRun(seed=${seed}, useCraft=${useCraft}) is unchanged`, () => {
        const actual = sha256Json(simulateRun(seed, useCraft));
        console.log(`RECORDED simulateRun ${seed}/${useCraft} sha256:`, actual);
        expect(actual).toBe(SIMULATE_RUN_DIGESTS[`${seed}/${useCraft}`]);
      });
    }
  }

  it('one adapter + policy playRun is unchanged', () => {
    const result = playRun(createScrapcrawlAdapter(), policy(true), 1, { maxSteps: 800 });
    const actual = sha256Json(result);
    console.log('RECORDED playRun seed=1 useCraft=true sha256:', actual);
    expect(actual).toBe(PLAY_RUN_DIGEST);
  });
});

describe('guard: one canonical mulberry32', () => {
  it('the mulberry32 step constant appears only in allow-listed files', () => {
    const hits = collectSourceFiles(SRC_DIR)
      .filter(file => MULBERRY32_CONSTANT.test(readFileSync(file, 'utf-8')))
      .map(file => relative(repoRoot, file).split(sep).join('/'))
      .sort();
    expect(hits).toEqual([...MULBERRY32_ALLOW_LIST].sort());
  });
});
