// <!-- new: ts/tests/test_grainworks_flow.ts -->
// Guards pipe-network material flow (updatePipes buffer hand-off, conserved
// totals, terminal spill into the CA grid) and the pipe flow-particle visuals
// (updatePipeFlowParticles / spawnFlowParticle / EMISSIVE_MATERIALS).
// Math.random is stubbed so lateral offsets, opacity and size are deterministic.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MaterialType } from '../src/games/grainworks/types';
import type { PipeDirection, PipeNode } from '../src/games/grainworks/types';
import { CellularGrid } from '../src/games/grainworks/simulation/grid';
import { BuildingManager } from '../src/games/grainworks/simulation/buildingManager';
import { computeRoute } from '../src/games/grainworks/simulation/routing';
import { updatePipes } from '../src/games/grainworks/simulation/buildingFlow';
import {
  EMISSIVE_MATERIALS,
  spawnFlowParticle,
  updatePipeFlowParticles,
} from '../src/games/grainworks/simulation/flowParticles';

afterEach(() => {
  vi.restoreAllMocks();
});

const makePipe = (
  direction: PipeDirection,
  buffer: { material: MaterialType; amount: number }[] = [],
  maxBuffer = 100
): PipeNode => ({
  tileX: 0,
  tileY: 0,
  x: 0,
  y: 0,
  direction,
  buffer,
  maxBuffer,
  connected: { top: null, bottom: null, left: null, right: null },
  flowParticles: [],
});

const bufferTotal = (pipe: PipeNode): number =>
  pipe.buffer.reduce((s, item) => s + item.amount, 0);

describe('GrainWorks — pipe network flow (stub 0.5)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('moves one LIQUID unit per call down a four-pipe RIGHT route and conserves the total', () => {
    const grid = new CellularGrid();
    const mgr = new BuildingManager();
    const route = computeRoute({ tx: 10, ty: 10 }, { tx: 13, ty: 10 }, true, mgr);
    const pipes = mgr.placePipeRoute(grid, route, 'RIGHT');
    expect(pipes.length).toBe(4);
    for (const p of pipes) {
      expect(p.direction).toBe('RIGHT');
    }

    const gridBefore = grid.counts[MaterialType.LIQUID];
    pipes[0].buffer.push({ material: MaterialType.LIQUID, amount: 3 });

    // Each updatePipes call hands one unit from pipe[0] down the chain; the
    // last pipe spills one unit into the open CA grid at tile (14, 10).
    const expectedPipeTotals = [
      [2, 0, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const expectedSpilled = [1, 2, 3, 3];

    for (let i = 0; i < expectedPipeTotals.length; i++) {
      updatePipes(mgr, grid);
      const totals = pipes.map(bufferTotal);
      expect(totals).toEqual(expectedPipeTotals[i]);
      const spilled = grid.counts[MaterialType.LIQUID] - gridBefore;
      expect(spilled).toBe(expectedSpilled[i]);
      // Conservation: units left in pipes + units spilled into the grid = 3.
      expect(totals.reduce((a, b) => a + b, 0) + spilled).toBe(3);
    }
  });
});

describe('GrainWorks — pipe flow particles (stub 0.5)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('spawns Math.round(fillRatio * 6) particles of the buffered material at the entry edge', () => {
    const pipe = makePipe('RIGHT', [{ material: MaterialType.GAS, amount: 50 }], 100);
    updatePipeFlowParticles(pipe, 0);
    expect(pipe.flowParticles.length).toBe(3);
    for (const p of pipe.flowParticles) {
      expect(p.material).toBe(MaterialType.GAS);
      expect(p.progress).toBe(0);
      expect(p.localX).toBe(0);
    }
  });

  it('advances progress by dt * speed * 1.5 with backpressure speed 0.7 at half-full buffer', () => {
    const pipe = makePipe('RIGHT', [{ material: MaterialType.GAS, amount: 50 }], 100);
    updatePipeFlowParticles(pipe, 0);
    updatePipeFlowParticles(pipe, 0.1);
    expect(pipe.flowParticles.length).toBe(3);
    for (const p of pipe.flowParticles) {
      expect(p.progress).toBeCloseTo(0.105, 6);
      expect(p.localX).toBe(p.progress);
      expect(p.speed).toBeCloseTo(0.7, 6);
    }
  });

  it('drops particles once progress passes 1 and stops spawning on an empty buffer', () => {
    const pipe = makePipe('RIGHT', [{ material: MaterialType.GAS, amount: 50 }], 100);
    updatePipeFlowParticles(pipe, 0);
    expect(pipe.flowParticles.length).toBe(3);
    pipe.buffer = [];
    updatePipeFlowParticles(pipe, 10);
    expect(pipe.flowParticles.length).toBe(0);
  });

  it('hasWarning slows existing particles to speed 0.1 on the next update', () => {
    const pipe = makePipe('RIGHT', [{ material: MaterialType.GAS, amount: 50 }], 100);
    updatePipeFlowParticles(pipe, 0);
    pipe.hasWarning = true;
    updatePipeFlowParticles(pipe, 0);
    expect(pipe.flowParticles.length).toBe(3);
    for (const p of pipe.flowParticles) {
      expect(p.speed).toBe(0.1);
    }
  });
});

describe('GrainWorks — spawnFlowParticle start positions (stub 0.5)', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  const buffered = () => makePipe('RIGHT', [{ material: MaterialType.GAS, amount: 10 }]);

  it('RIGHT pipes start particles at localX 0', () => {
    const p = spawnFlowParticle(buffered());
    expect(p.localX).toBe(0);
    expect(p.progress).toBe(0);
  });

  it('LEFT pipes start particles at localX 1', () => {
    const pipe = { ...buffered(), direction: 'LEFT' as PipeDirection };
    const p = spawnFlowParticle(pipe);
    expect(p.localX).toBe(1);
    expect(p.progress).toBe(0);
  });

  it('DOWN pipes start particles at localY 0', () => {
    const pipe = { ...buffered(), direction: 'DOWN' as PipeDirection };
    const p = spawnFlowParticle(pipe);
    expect(p.localY).toBe(0);
    expect(p.progress).toBe(0);
  });

  it('UP pipes start particles at localY 1', () => {
    const pipe = { ...buffered(), direction: 'UP' as PipeDirection };
    const p = spawnFlowParticle(pipe);
    expect(p.localY).toBe(1);
    expect(p.progress).toBe(0);
  });

  it('an empty buffer falls back to MaterialType.DUST', () => {
    const p = spawnFlowParticle(makePipe('RIGHT', []));
    expect(p.material).toBe(MaterialType.DUST);
  });

  it('EMISSIVE_MATERIALS holds exactly PLASMA, VOID_CRYSTAL, REACTIVE_VAPOR and LUMINITE', () => {
    expect(EMISSIVE_MATERIALS).toEqual(
      new Set([
        MaterialType.PLASMA,
        MaterialType.VOID_CRYSTAL,
        MaterialType.REACTIVE_VAPOR,
        MaterialType.LUMINITE,
      ])
    );
  });
});
