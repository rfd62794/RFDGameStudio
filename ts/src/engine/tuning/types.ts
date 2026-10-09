// new: ts/src/engine/tuning/types.ts
export type KnobSource =
  | { kind: 'data'; file: string; path: string }   // YAML, e.g. file 'games/chimera_wilds/data.yaml', path 'baseline_player.power'
  | { kind: 'const'; file: string; name: string }; // TS const, e.g. file 'ts/src/games/scrapcrawl/utils/runEnd.ts', name 'LOSS_DAMAGE'

export interface KnobDef {
  key: string;      // '<gameId>.<name>'. For kind 'data' the key MUST be '<gameId>.<path>' (the part after the first dot is the dotted path into data.yaml)
  label: string;
  group: string;
  min: number; max: number; step: number;
  default: number;
  affects: string;  // one sentence: what the player feels when this moves
  source: KnobSource;
}
export type Overrides = Record<string, number>;
export interface Target { id: string; metric: string; scenario?: string; min: number; max: number; note: string }
export type Metrics = Record<string, number>;
export interface GameTuning {
  gameId: string;
  knobs: KnobDef[];
  targets: Target[];
  scenarios?: string[];
  simulate?: (ctx: { seed: number; scenario: string }) => Metrics;
}
