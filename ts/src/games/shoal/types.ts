export interface World {
  width: number;
  height: number;
}

export interface ShoalCreature {
  id: string;
  x: number;
  depth: number;
  radius: number;
  color: string;
  angle: number;
  mature: boolean;
}

export interface Nodule {
  x: number;
  depth: number;
  radius: number;
}

export interface AlgaeCore {
  id: string;
  x: number;
  depth: number;
  nodules: Nodule[];
}

export interface FleshChunk {
  x: number;
  depth: number;
  radius: number;
}

export interface Stats {
  fish_count: number;
  shark_count: number;
  algae_count: number;
  chunk_count: number;
}

export interface RenderState {
  world: World;
  fish: ShoalCreature[];
  sharks: ShoalCreature[];
  algae: AlgaeCore[];
  chunks: FleshChunk[];
  stats: Stats;
  events: unknown[];
  tick_count: number;
}

export type ToolMode = 'fish' | 'shark' | 'algae' | 'cull';

export interface InputState {
  tool?: ToolMode;
  x?: number;
  y?: number;
  clicked?: boolean;
}
