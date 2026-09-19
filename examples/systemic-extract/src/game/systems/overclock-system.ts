import { World } from '../ecs';
import { TileState } from '../../types';
import { ISystem } from '../core/system-types';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 8: Rig Overclock Scaling Loop (10Hz - ADR 005 "Brotato" Curve)
 * Decays resonance stacks over time and emits high-voltage discharge particles.
 */
export class OverclockSystem implements ISystem {
  public readonly name = 'OverclockSystem';

  public update(dt: number, world: World, _map: TileState[][], sim: Simulation): void {
    if (sim.overclockStacks > 0) {
      sim.overclockTimer -= dt;
      if (sim.overclockTimer <= 0) {
        sim.overclockStacks--;
        if (sim.overclockStacks > 0) {
          sim.overclockTimer = 4.0; // Decay one stack at a time
          sim.addLog('alert', `OVERCLOCK DECAY: Rig resonance fading (x${sim.overclockStacks} stacks left).`);
        } else {
          sim.overclockTimer = 0;
          sim.addLog('alert', 'OVERCLOCK DISCHARGED: Mech kinetic output returned to baseline.');
        }
      }

      // High-voltage crackle particles around operative
      const pPos = world.gridPositions.get(sim.playerEntityId);
      if (pPos && Math.random() < 0.25 * sim.overclockStacks) {
        sim.spawnParticles(
          pPos.x + 0.5,
          pPos.y + 0.5,
          1,
          'spark',
          sim.overclockStacks >= 5 ? '#f43f5e' : '#06b6d4'
        );
      }
    }
  }
}
