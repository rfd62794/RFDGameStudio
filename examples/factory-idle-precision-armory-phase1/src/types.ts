/**
 * Types & Data Contracts for Factory Idle: Precision Armory
 * Deep industrial simulation with logistics balancers, underground tunnels,
 * power grids, research centers, multi-sector expansion, and market exports.
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
  craftTimeTicks: number; // Duration to assemble
  requiredTechId?: string;
}

export type TileType = 
  | 'empty' 
  | 'conveyor' 
  | 'splitter'
  | 'merger'
  | 'underground_entry'
  | 'underground_exit'
  | 'crossing'
  | 'filter'
  | 'switch'
  | 'spawner'
  | 'fitter' 
  | 'packer' 
  | 'seller'
  | 'lab'
  | 'power_gen'
  | 'trash';

export interface ItemPacket {
  id: string;
  kind: 'part' | 'weapon';
  itemId: RawPartId | WeaponId;
  x: number;
  y: number;
  progress: number; // 0 to 1 for visual smooth interpolation
  createdTick: number;
  undergroundRemaining?: number; // Ticks remaining in underground transit
  sourceDirection?: CardinalDirection;
}

export interface GridTile {
  x: number;
  y: number;
  type: TileType;
  direction: CardinalDirection; // Primary flow direction
  isEnabled?: boolean; // Controls power / flow state
  tier?: 1 | 2 | 3; // Machine upgrade level (Mk1, Mk2, Mk3)
  
  // Operational Status
  lastStatus?: 'ok' | 'starved' | 'jammed' | 'no_power' | 'disabled' | 'idle';
  cycleProgress?: number; // 0 to 1 for machine progress bar
  cycleDuration?: number;
  
  // Power & Economics
  powerUsage?: number; // kW consumed (e.g., Assembler 2kW, Lab 3kW)
  powerOutput?: number; // kW produced (e.g., Generator 20kW)
  operatingCost?: number; // $/tick maintenance
  
  // For Spawner / Buyer
  spawnerPart?: RawPartId;
  spawnerAutoBuy?: boolean; // Auto-purchase from cash reserves
  
  // For Fitter / Assembler
  fitterBuffer?: RawPartId[];
  fitterTargetRecipe?: WeaponId;
  
  // For Splitter & Merger
  splitterState?: number; // 0, 1, 2 (index of next output direction)
  
  // For Filter / Sorter Gate
  filterPart?: RawPartId | WeaponId;
  
  // For Switch Conveyor
  switchDirection?: CardinalDirection;
  switchState?: 0 | 1;
  
  // For Underground Tunnel
  undergroundTarget?: { x: number; y: number };
  
  // Statistics
  totalPassed?: number;
  totalAssembled?: number;
  totalPacked?: number;
  totalSold?: number;
  totalRPGenerated?: number;
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
  cost: number; // Cash cost
  rpCost: number; // Research Points cost
  purchased: boolean;
  category: 'logistics' | 'production' | 'power' | 'weapons' | 'market';
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
  totalRPProduced: number;
  directSalesCount: number;
  currentEfficiency: number; // percentage
}

export interface SectorData {
  id: string;
  name: string;
  tagline: string;
  gridWidth: number;
  gridHeight: number;
  grid: GridTile[][];
  items: ItemPacket[];
  unlocked: boolean;
  unlockCost: number;
}

export interface GameState {
  tick: number;
  funds: number;
  researchPoints: number;
  reputation: number; // 0 to 100
  
  // Live Telemetry Rates (calculated per second)
  cashflowRate: number; // $/s net
  grossIncomeRate: number; // $/s gross sales
  operatingCostRate: number; // $/s maintenance + auto buys
  researchRate: number; // RP/s
  powerCapacity: number; // Total kW generated
  powerConsumed: number; // Total kW demanded
  powerRatio: number; // capacity / consumed (1.0 = normal, <1.0 = brownout)
  
  // Sectors
  activeSectorId: string;
  sectors: Record<string, SectorData>;
  
  // Backward compatibility convenience accessors for active sector
  gridWidth: number;
  gridHeight: number;
  grid: GridTile[][];
  items: ItemPacket[];
  
  // Warehouse Hoppers (Parts inventory)
  hopperStock: Record<RawPartId, number>;
  
  // Storefront Shelf (Finished weapons waiting for customers)
  shelfStock: StorefrontStock;
  shelfCapacity: number;
  
  // Automated Customer Queue
  activeCustomers: CustomerOrder[];
  nextCustomerSpawnInTicks: number;
  
  // Research Matrix Upgrades
  upgrades: TechUpgrade[];
  
  // Simulation settings
  tickRateMs: number;
  isRunning: boolean;
  speed: 1 | 2 | 5 | 10;
  soundEnabled: boolean;
  
  // Logs & Metrics
  metrics: GameMetrics;
  recentLogs: Array<{ id: string; text: string; type: 'sale' | 'craft' | 'miss' | 'research' | 'power' | 'info'; tick: number }>;
}

export type ToolMode = 
  | 'inspect' 
  | 'conveyor' 
  | 'splitter'
  | 'merger'
  | 'underground'
  | 'crossing'
  | 'filter'
  | 'switch'
  | 'spawner'
  | 'fitter' 
  | 'packer' 
  | 'seller'
  | 'lab'
  | 'power_gen'
  | 'trash' 
  | 'clear';

export type GameAction =
  | { type: 'TICK' }
  | { type: 'SET_RUNNING'; isRunning: boolean }
  | { type: 'SET_SPEED'; speed: 1 | 2 | 5 | 10 }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'SWITCH_SECTOR'; sectorId: string }
  | { type: 'UNLOCK_SECTOR'; sectorId: string }
  | { type: 'PLACE_TILE'; x: number; y: number; tileType: TileType; direction: CardinalDirection; spawnerPart?: RawPartId; filterPart?: RawPartId | WeaponId }
  | { type: 'CLEAR_TILE'; x: number; y: number }
  | { type: 'ROTATE_TILE'; x: number; y: number }
  | { type: 'CYCLE_TILE_DIRECTION'; x: number; y: number }
  | { type: 'TOGGLE_TILE_ENABLED'; x: number; y: number }
  | { type: 'TOGGLE_TILE_POWER'; x: number; y: number }
  | { type: 'UPGRADE_TILE_TIER'; x: number; y: number }
  | { type: 'SET_SPAWNER_PART'; x: number; y: number; partId: RawPartId }
  | { type: 'TOGGLE_SPAWNER_AUTOBUY'; x: number; y: number }
  | { type: 'SET_FITTER_TARGET'; x: number; y: number; recipeId?: WeaponId }
  | { type: 'SET_FILTER_PART'; x: number; y: number; part: RawPartId | WeaponId }
  | { type: 'TOGGLE_SWITCH_TILE'; x: number; y: number }
  | { type: 'BUY_PART'; partId: RawPartId; quantity: number }
  | { type: 'BUY_UPGRADE'; upgradeId: string }
  | { type: 'LOAD_PRESET'; presetId: string }
  | { type: 'CLEAR_ALL_TILES' };
