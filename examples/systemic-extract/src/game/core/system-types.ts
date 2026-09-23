import { World } from '../ecs';
import { TileState } from '../../types';
import type { Simulation } from '../simulation/simulation';

export interface CombatEvent {
  id: string;
  type: 'damage' | 'fire' | 'explosion' | 'breach' | 'loot' | 'alert' | 'extract';
  text: string;
  timestamp: number;
}

export interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  type: 'flame' | 'smoke' | 'blast' | 'spark' | 'rubble';
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

/**
 * ADR 003 Requirement 1: The ISystem Contract
 * Discrete, decoupled pipeline unit operating on World, TileState map, and Simulation context.
 */
export interface ISystem {
  readonly name: string;
  update(dt: number, world: World, map: TileState[][], sim: Simulation): void;
}

/**
 * ADR 003: Central Schedule with System Tick Hierarchy
 * Enforces execution frequencies (60Hz, 10Hz, 2Hz) to protect main-thread frame budget.
 */
export interface ScheduledSystemEntry {
  system: ISystem;
  targetInterval: number; // 0 for 60Hz (every frame), 0.1 for 10Hz, 0.5 for 2Hz
  accumulator: number;
}

export class Schedule {
  private systems: ScheduledSystemEntry[] = [];

  public addSystem(system: ISystem, frequencyHz: number = 60): this {
    const targetInterval = frequencyHz >= 60 ? 0 : 1 / frequencyHz;
    this.systems.push({
      system,
      targetInterval,
      accumulator: 0,
    });
    return this;
  }

  public run(dt: number, world: World, map: TileState[][], sim: Simulation): void {
    for (const entry of this.systems) {
      if (entry.targetInterval <= 0) {
        // 60Hz Tier: Execute every frame
        entry.system.update(dt, world, map, sim);
      } else {
        // Sub-frequency Tier: Accumulate delta time
        entry.accumulator += dt;
        if (entry.accumulator >= entry.targetInterval) {
          entry.system.update(entry.accumulator, world, map, sim);
          entry.accumulator = 0;
        }
      }
    }
  }
}
