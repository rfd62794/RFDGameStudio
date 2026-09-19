import { describe, expect, it } from 'vitest';
import { World } from '../ecs';
import { createStaticMap } from '../map';
import { Simulation } from './simulation';
import type { DungeonZoneId } from '../../types';

const DT = 1 / 60;
const DUNGEONS: DungeonZoneId[] = ['nw_robotics', 'ne_biolab', 'sw_foundry', 'se_void'];

/** Build a Simulation exactly the way useRaidSimulation does. */
function bootSim(): Simulation {
  const world = new World();
  const map = createStaticMap(world, 3, 2, 'sector_01');
  return new Simulation(world, map.tiles, map.playerEntityId, map.biomeProfile);
}

function idle(sim: Simulation, seconds: number): void {
  for (let t = 0; t < seconds; t += DT) sim.update(DT);
}

describe('Simulation (headless)', () => {
  it('boots into the overworld sanctuary and survives idling', () => {
    const sim = bootSim();
    expect(sim.currentMapType).toBe('overworld');
    idle(sim, 10);
    expect(sim.currentMapType).toBe('overworld');
    expect(sim.isRaidActive).toBe(true);
    expect(sim.world.healths.get(sim.playerEntityId)?.current).toBeGreaterThan(0);
  });

  it.each(DUNGEONS)('deploying to %s starts a dungeon expedition', (dungeonId) => {
    const sim = bootSim();
    sim.deployToDungeon(dungeonId);
    expect(sim.currentMapType).toBe('dungeon');
    expect(sim.activeDungeonId).toBe(dungeonId);
    expect(sim.extractionTimer).toBe(0);
  });

  // Dungeon spawns sit next to the extraction tether. Guard that the spawn
  // stays off the tether tiles: idling past EXTRACTION_REQUIRED_TIME must
  // not end the expedition on its own.
  it.each(DUNGEONS)('an idle operative is not auto-extracted from %s', (dungeonId) => {
    const sim = bootSim();
    sim.deployToDungeon(dungeonId);
    idle(sim, sim.EXTRACTION_REQUIRED_TIME + 1);
    expect(sim.currentMapType).toBe('dungeon');
  });
});
