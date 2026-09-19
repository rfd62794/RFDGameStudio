/**
 * Systems & Simulation Barrel File
 * Re-exports modular subsystems, core scheduling types, and the simulation orchestrator.
 * Maintained for layered modular organization and backwards compatibility.
 */

export * from './core/system-types';
export * from './systems/index';
export * from './simulation/index';
export type { CombatEvent, ParticleEffect } from '../types';
