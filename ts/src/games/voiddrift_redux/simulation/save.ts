import { clearSave, loadSave, writeSave } from '../../../engine/shared/persistence';
import type { VoidDriftEngine } from './engine';
import type {
  Asteroid,
  ConversionProcess,
  DispatchLog,
  Drone,
  Fragment,
  Scout,
  SimulationConfig,
} from '../types';

export const SAVE_KEY = 'voiddrift_redux_save';
export const SAVE_VERSION = 1;
export const AUTOSAVE_INTERVAL_MS = 5000;

export interface VoidDriftSave {
  config: SimulationConfig;
  scouts: Scout[];
  miningDrones: Drone[];
  haulers: Drone[];
  asteroids: Asteroid[];
  fragments: Fragment[];
  logs: DispatchLog[];
  resources: Record<string, number>;
  conversions: ConversionProcess[];
  counters: {
    closedLoopsCompleted: number;
    successfulTugsCompleted: number;
    avgCycleTimeSec: number;
  };
  simSpeed: number;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function snapshotEngine(engine: VoidDriftEngine): VoidDriftSave {
  return clone({
    config: engine.config,
    scouts: engine.scouts,
    miningDrones: engine.miningDrones,
    haulers: engine.haulers,
    asteroids: engine.asteroids,
    fragments: engine.fragments,
    logs: engine.logs,
    resources: engine.stats.resources,
    conversions: engine.stats.conversions,
    counters: {
      closedLoopsCompleted: engine.stats.closedLoopsCompleted,
      successfulTugsCompleted: engine.stats.successfulTugsCompleted,
      avgCycleTimeSec: engine.stats.avgCycleTimeSec,
    },
    simSpeed: engine.stats.simSpeed,
  });
}

export function applySnapshot(engine: VoidDriftEngine, save: VoidDriftSave): void {
  const snap = clone(save);
  engine.config = snap.config;
  engine.scouts = snap.scouts;
  engine.miningDrones = snap.miningDrones;
  engine.haulers = snap.haulers;
  engine.asteroids = snap.asteroids;
  engine.fragments = snap.fragments;
  engine.logs = snap.logs;
  engine.stats.resources = snap.resources as typeof engine.stats.resources;
  engine.stats.conversions = snap.conversions;
  engine.stats.closedLoopsCompleted = snap.counters.closedLoopsCompleted;
  engine.stats.successfulTugsCompleted = snap.counters.successfulTugsCompleted;
  engine.stats.avgCycleTimeSec = snap.counters.avgCycleTimeSec;
  engine.stats.simSpeed = snap.simSpeed;
}

export function isValidSave(value: unknown): value is VoidDriftSave {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<VoidDriftSave>;
  return (
    Array.isArray(v.scouts) &&
    Array.isArray(v.miningDrones) &&
    Array.isArray(v.haulers) &&
    Array.isArray(v.asteroids) &&
    Array.isArray(v.fragments) &&
    Array.isArray(v.logs) &&
    Array.isArray(v.conversions) &&
    typeof v.config === 'object' && v.config !== null &&
    typeof v.resources === 'object' && v.resources !== null &&
    typeof v.counters === 'object' && v.counters !== null
  );
}

export function saveEngine(engine: VoidDriftEngine): void {
  writeSave(SAVE_KEY, snapshotEngine(engine), { version: SAVE_VERSION });
}

/** Restores a saved world into the engine. Returns false (engine untouched) when there is no usable save. */
export function restoreEngine(engine: VoidDriftEngine): boolean {
  const save = loadSave<VoidDriftSave>(SAVE_KEY, { version: SAVE_VERSION });
  if (!isValidSave(save)) return false;
  applySnapshot(engine, save);
  return true;
}

export function clearEngineSave(): void {
  clearSave(SAVE_KEY);
}
