/**
 * @file src/roster.ts
 * Worker definitions, roles, types, and type configurations.
 */

import { StationId, WorkerType } from './types';

export interface InitialWorkerConfig {
  id: string;
  name: string;
  role: string;
  type: WorkerType;
  preferredStation?: StationId;
  color: string;
  initialX: number;
  initialY: number;
}

export const WORKER_TYPE_CONFIGS = {
  line_cook: { stationAffinityBonus: 0.35 },
  csr: { stationAffinityBonus: 0.35 },
  janitor_mechanic: { maintenanceAffinityBonus: 0.35 },
};

export const INITIAL_WORKERS: InitialWorkerConfig[] = [
  { id: 'w1', name: 'Alex', role: 'Grill Specialist', type: 'line_cook', preferredStation: 'grill', color: '#6366f1', initialX: 345, initialY: 175 },
  { id: 'w2', name: 'Sam', role: 'Line Prep', type: 'line_cook', preferredStation: 'assembly', color: '#ec4899', initialX: 505, initialY: 175 },
  { id: 'w3', name: 'Jordan', role: 'Expeditor', type: 'csr', preferredStation: 'window', color: '#14b8a6', initialX: 665, initialY: 175 },
  { id: 'w4', name: 'Taylor', role: 'Float Runner', type: 'janitor_mechanic', color: '#8b5cf6', initialX: 135, initialY: 175 },
];
