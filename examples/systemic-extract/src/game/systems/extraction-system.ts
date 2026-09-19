import { World } from '../ecs';
import { TileState } from '../../types';
import { ISystem } from '../core/system-types';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 4: Extraction & Tether Point Loop (60Hz)
 * Manages the 5-second dimensional stabilization timer at evacuation zones.
 */
export class ExtractionSystem implements ISystem {
  public readonly name = 'ExtractionSystem';

  public update(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    const playerPos = world.gridPositions.get(sim.playerEntityId);
    if (!playerPos) return;

    // Check if player center or any circle perimeter point overlaps an extraction tile
    const checkCoords = [
      { x: playerPos.x, y: playerPos.y },
      { x: playerPos.x + 0.35, y: playerPos.y },
      { x: playerPos.x - 0.35, y: playerPos.y },
      { x: playerPos.x, y: playerPos.y + 0.35 },
      { x: playerPos.x, y: playerPos.y - 0.35 },
    ];

    let onExtractionTile = false;
    for (const c of checkCoords) {
      const tx = Math.floor(c.x + 0.5);
      const ty = Math.floor(c.y + 0.5);
      if (map[ty]?.[tx]?.isExtraction) {
        onExtractionTile = true;
        break;
      }
    }

    if (onExtractionTile) {
      sim.extractionTimer += dt;
      if (Math.random() < 0.35) {
        sim.spawnParticles(playerPos.x + 0.5, playerPos.y + 0.5, 3, 'spark', '#10b981');
      }

      if (sim.extractionTimer >= sim.EXTRACTION_REQUIRED_TIME && !sim.isExtracted) {
        if (sim.currentMapType === 'dungeon') {
          sim.extractionTimer = 0;
          sim.returnToOverworld(true);
        } else {
          sim.isExtracted = true;
          sim.isRaidActive = false;
          sim.addLog('extract', 'TETHER POINT STABILIZED! Operative anchored to Faraday bunker with secured Ontological Salvage.');
        }
      }
    } else {
      if (sim.extractionTimer > 0) {
        sim.extractionTimer = Math.max(0, sim.extractionTimer - dt * 2);
      }
    }
  }
}
