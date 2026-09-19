import { World } from '../ecs';
import { TileState } from '../../types';
import { ISystem } from '../core/system-types';
import type { Simulation } from '../simulation/simulation';

/**
 * SYSTEM 1: Visual Interpolation Pipeline (60Hz)
 * Smoothly interpolates discrete grid positions to continuous screen coords.
 */
export class VisualInterpolationSystem implements ISystem {
  public readonly name = 'VisualInterpolationSystem';

  public update(dt: number, world: World): void {
    for (const id of world.getAllEntities()) {
      const transform = world.transforms.get(id);
      const pos = world.gridPositions.get(id);
      const visual = world.visuals.get(id);
      if (visual) {
        if (transform) {
          const lerpFactor = Math.min(1, dt * 28);
          visual.renderX += (transform.x - visual.renderX) * lerpFactor;
          visual.renderY += (transform.y - visual.renderY) * lerpFactor;
        } else if (pos) {
          const lerpFactor = Math.min(1, dt * 18);
          visual.renderX += (pos.x - visual.renderX) * lerpFactor;
          visual.renderY += (pos.y - visual.renderY) * lerpFactor;
        }

        if (visual.flashTime > 0) {
          visual.flashTime = Math.max(0, visual.flashTime - dt);
        }
      }
    }
  }
}

/**
 * SYSTEM 2: Particle Simulation Pipeline (60Hz)
 * Moves, fades, and purges ambient and explosive particles.
 */
export class ParticleSystem implements ISystem {
  public readonly name = 'ParticleSystem';

  public update(dt: number, _world: World, _map: TileState[][], sim: Simulation): void {
    for (let i = sim.particles.length - 1; i >= 0; i--) {
      const p = sim.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'flame') {
        p.vy -= 0.5 * dt; // Fire rises
      } else if (p.type === 'smoke') {
        p.vy -= 0.2 * dt;
        p.size += dt * 2;
      }

      if (p.life >= p.maxLife) {
        sim.particles.splice(i, 1);
      }
    }
  }
}
