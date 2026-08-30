/**
 * @file src/utilityScoring.ts
 * Re-export wrapper module maintaining backward compatibility while delegating
 * to the modularized scoring subsystems in src/scoring/.
 */

export * from './scoring/utilityScoring';
export * from './scoring/facialExpressions';
export * from './scoring/taskSelection';
