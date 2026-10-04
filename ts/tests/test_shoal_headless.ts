// new: ts/tests/test_shoal_headless.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createShoalSimulation } from '../src/games/shoal/simulation/shoalSimulation';
import type { RenderState } from '../src/games/shoal/types';

// The four title-screen scenarios (ts/src/games/shoal/components/TitleScreen.tsx SCENARIOS).
const SCENARIOS = [
  { name: 'balanced', fish: 60, sharks: 8, hubs: 6 },
  { name: 'sparse', fish: 30, sharks: 4, hubs: 4 },
  { name: 'frenzy', fish: 50, sharks: 16, hubs: 5 },
  { name: 'lush', fish: 70, sharks: 4, hubs: 10 },
];

const TICKS = 2000;
const DT = 0.05;

function runReef(seed: number, fish: number, sharks: number, hubs: number): RenderState[] {
  const sim = createShoalSimulation();
  sim.initGame(seed, { initialFish: fish, initialSharks: sharks, initialAlgaeHubs: hubs });
  const frames: RenderState[] = [];
  for (let i = 0; i < TICKS; i++) frames.push(sim.tickGame(DT, null));
  return frames;
}

function expectSane(frames: RenderState[]): void {
  for (const rs of frames) {
    const { fish_count, shark_count, algae_count, chunk_count } = rs.stats;
    for (const n of [fish_count, shark_count, algae_count, chunk_count]) {
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
    }
    for (const c of [...rs.fish, ...rs.sharks]) {
      expect(Number.isFinite(c.x)).toBe(true);
      expect(Number.isFinite(c.depth)).toBe(true);
    }
  }
}

describe('Shoal headless run', () => {
  for (const s of SCENARIOS) {
    it(`${s.name}: ${TICKS} ticks, no NaN, no negative counts, fish survive`, () => {
      const frames = runReef(42, s.fish, s.sharks, s.hubs);
      expect(frames).toHaveLength(TICKS);
      expectSane(frames);
      expect(frames[TICKS - 1].stats.fish_count).toBeGreaterThan(0);
    }, 60000);
  }

  it('extinction is reachable: one fish, eight sharks, no algae ends with no life', () => {
    const frames = runReef(3, 1, 8, 0);
    expectSane(frames);
    const last = frames[TICKS - 1].stats;
    expect(last.fish_count + last.shark_count).toBe(0);
  });

  it('survival is reachable: the balanced reef still has fish at the end', () => {
    const last = runReef(42, 60, 8, 6)[TICKS - 1].stats;
    expect(last.fish_count + last.shark_count).toBeGreaterThan(0);
  });
});
