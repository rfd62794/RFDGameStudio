/**
 * Types & Data Contracts for Armory: Storefront & Spindle
 * Pure deterministic state and declarative presentation types.
 */

export type CardinalDirection = 'N' | 'E' | 'S' | 'W';

export type RawPartId = 'chassis' | 'barrel' | 'magazine' | 'optic' | 'stock';

export type WeaponId = 
  | 'pistol' 
  | 'shotgun' 
  | 'rifle' 
  | 'smg' 
  | 'dmr';

export interface PartDefinition {
  id: RawPartId;
  name: string;
  shortName: string;
  cost: number;
  color: string;
  accentColor: string;
  icon: string;
  description: string;
  unlockedByDefault: boolean;
}

export interface WeaponRecipe {
  id: WeaponId;
  name: string;
  category: 'Handgun' | 'Scatter' | 'Rifle' | 'Special Ops' | 'Precision';
  requiredParts: Record<RawPartId, number>;
  baseCost: number;
  salePrice: number;
  margin: number;
  color: string;
  icon: string;
  description: string;
  requiredTechId?: string;
}

export type TileType = 
  | 'empty' 
  | 'conveyor' 
  | 'fitter' 
  | 'packer' 
  | 'spawner'
  | 'trash';

export interface ItemPacket {
  id: string;
  kind: 'part' | 'weapon';
  itemId: RawPartId | WeaponId;
  x: number;
  y: number;
  progress: number; // 0 to 1 for visual smooth interpolation
  createdTick: number;
}

export interface GridTile {
  x: number;
  y: number;
  type: TileType;
  direction: CardinalDirection; // For conveyor, spawner, and fitter output
  // For spawner: which part to emit
  spawnerPart?: RawPartId;
  // For fitter: internal item buffer
  fitterBuffer?: RawPartId[];
  fitterTargetRecipe?: WeaponId;
  // For statistics
  totalPassed?: number;
  totalAssembled?: number;
  totalPacked?: number;
  lastActiveTick?: number;
}

export interface CustomerOrder {
  id: string;
  customerName: string;
  customerRole: string;
  weaponId: WeaponId;
  quantity: number;
  maxPatienceTicks: number;
  remainingPatienceTicks: number;
  bonusMultiplier: number;
  avatarBg: string;
}

export interface StorefrontStock {
  pistol: number;
  shotgun: number;
  rifle: number;
  smg: number;
  dmr: number;
}

export interface TechUpgrade {
  id: string;
  name: string;
  tier: number;
  cost: number;
  purchased: boolean;
  description: string;
  icon: string;
  prerequisiteId?: string;
}

export interface GameMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  fulfilledOrders: number;
  missedSalesCount: number;
  totalWeaponsCrafted: number;
  totalPartsUsed: number;
  currentEfficiency: number; // percentage of fulfilled vs total demand
}

export interface GameState {
  tick: number;
  funds: number;
  reputation: number; // 0 to 100
  gridWidth: number;
  gridHeight: number;
  grid: GridTile[][];
  items: ItemPacket[];
  
  // Warehouse Hoppers (Un-spawned parts inventory)
  hopperStock: Record<RawPartId, number>;
  
  // Storefront Shelf (Finished weapons waiting for customers)
  shelfStock: StorefrontStock;
  shelfCapacity: number;
  
  // Automated Customer Queue
  activeCustomers: CustomerOrder[];
  nextCustomerSpawnInTicks: number;
  
  // Upgrades
  upgrades: TechUpgrade[];
  
  // Simulation settings
  tickRateMs: number;
  isRunning: boolean;
  speed: 1 | 2 | 3;
  soundEnabled: boolean;
  
  // Logs & Metrics
  metrics: GameMetrics;
  recentLogs: Array<{ id: string; text: string; type: 'sale' | 'craft' | 'miss' | 'info'; tick: number }>;
}

export type ToolMode = 
  | 'inspect' 
  | 'conveyor' 
  | 'fitter' 
  | 'packer' 
  | 'spawner' 
  | 'trash' 
  | 'clear';

export type GameAction =
  | { type: 'TICK' }
  | { type: 'SET_RUNNING'; isRunning: boolean }
  | { type: 'SET_SPEED'; speed: 1 | 2 | 3 }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'PLACE_TILE'; x: number; y: number; tileType: TileType; direction: CardinalDirection; spawnerPart?: RawPartId }
  | { type: 'CLEAR_TILE'; x: number; y: number }
  | { type: 'ROTATE_TILE'; x: number; y: number }
  | { type: 'SET_SPAWNER_PART'; x: number; y: number; partId: RawPartId }
  | { type: 'BUY_PART'; partId: RawPartId; quantity: number }
  | { type: 'BUY_UPGRADE'; upgradeId: string }
  | { type: 'LOAD_PRESET'; presetId: string }
  | { type: 'CLEAR_ALL_TILES' }
  | { type: 'RESET_GAME' };
