// new: ts/src/games/tuning-registry.ts
import type { GameTuning } from '../engine/tuning/types';
// One import line plus one map entry per game that adopts tuning (added by the Tuning_Adopt_* directives).
import scrapcrawl from './scrapcrawl/tuning';
export const TUNING_REGISTRY: Record<string, GameTuning> = { scrapcrawl };
export function getTuning(gameId: string): GameTuning | undefined { return TUNING_REGISTRY[gameId]; }
