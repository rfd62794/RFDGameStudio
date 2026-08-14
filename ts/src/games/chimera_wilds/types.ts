export type { Part, PartSlot } from '../../engine/shared/partSlots';

import type { Part } from '../../engine/shared/partSlots';

export interface Chimera {
  parts: Record<string, Part>;
  part_ids: Record<string, string>;
  total_power: number;
  total_endurance: number;
}

export interface EncounterResult {
  won: boolean;
  score: number;
  chimera_score: number;
  roll: number;
  chimera: Chimera;
}

export interface ChimeraWildsGameState {
  player: { power: number; endurance: number };
  currentChimera: Chimera | null;
  lastResult: EncounterResult | null;
  history: EncounterResult[];
}
