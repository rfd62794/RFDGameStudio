export interface Part {
  id: string;
  slot: string;
  name: string;
  accuracy: number;
  endurance: number;
  power: number;
  speed: number;
  description?: string;
  price?: number;
}

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
