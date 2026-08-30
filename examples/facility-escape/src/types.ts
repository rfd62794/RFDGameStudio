export type Property = 'flammable' | 'conductive' | 'loud' | 'reflective' | 'adhesive';
export type Carrier = 'heat' | 'electric';
export type FacilityTheme = 'block' | 'processing' | 'security' | 'maintenance' | 'perimeter';
export type Material = 'stone' | 'metal' | 'wood' | 'cloth' | 'glass' | 'plastic';

export interface GameObject {
  id: string;
  name: string;
  properties: Property[];
  carriers?: Carrier[]; // e.g. Lighter carries 'heat'
  isPickable: boolean;
  status: 'normal' | 'ignited' | 'electrified' | 'immobilized';
  burnTurnsLeft?: number;
  immobilizedTurnsLeft?: number;
  mirrorAngle?: '/' | '\\'; // '/' or '\' diagonal mirror orientation
  isIrrelevant?: boolean;
}

export type GuardType = 'watcher' | 'patrol';

export interface GuardEntity {
  id: string;
  type: 'guard';
  guardType: GuardType;
  x: number;
  y: number;
  facing: 'U' | 'D' | 'L' | 'R';
  immobilizedTurns: number;
  patrolPath?: { x: number; y: number }[];
  patrolIndex?: number;
  investigateTarget?: { x: number; y: number };
  // Threat telecasted BEFORE the player action resolves
  intent: {
    actionType: 'shoot' | 'watch' | 'idle' | 'move';
    targetTiles: { x: number; y: number }[];
    description: string;
    nextPos?: { x: number; y: number }; // Specific to patrol moves
  };
  isIrrelevant?: boolean;
}

export interface PlayerEntity {
  x: number;
  y: number;
  hearts: number;
  maxHearts: number;
  inventory: GameObject[];
}

export interface TileState {
  x: number;
  y: number;
  isExit: boolean;
  isWall: boolean;
  environmentObject?: GameObject; // fixed on the tile (e.g. curtains, puddle)
  item?: GameObject; // pickable on the tile (e.g. lighter, battery)
  status: 'normal' | 'ignited' | 'electrified';
  burnTurnsLeft?: number;
  isGated?: 'flammable' | 'conductive';
  isGatedUnlocked?: boolean;
}

export interface TurnLogEntry {
  id: string;
  turn: number;
  text: string;
  type: 'info' | 'player' | 'enemy' | 'system' | 'success' | 'damage';
}

export interface GameState {
  roomNumber: number;
  maxRooms: number;
  grid: TileState[][];
  player: PlayerEntity;
  guards: GuardEntity[];
  gameState: 'start' | 'playing' | 'escaped' | 'gameover';
  selectedItemIndex: number | null; // index of item selected in inventory
  activeCarrierAction: Carrier | 'adhesive' | null; // what the player is about to apply
  logs: TurnLogEntry[];
  turnCount: number;
}
