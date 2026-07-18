export type SlimeColor = 'Red' | 'Blue' | 'Yellow' | 'Purple' | 'Orange' | 'Green' | 'Gray';
export type SlimePattern = 'Solid' | 'Stripe' | 'Polka' | 'Glow' | 'Crown' | 'Ringed' | 'Nebula' | 'Obsidian';
export type LifeStage = 'Hatchling' | 'Juvenile' | 'Young' | 'Prime' | 'Veteran' | 'Elder';

export interface SlimeStats { hp: number; atk: number; def: number; agi: number; int: number; chm: number; }

export interface Slime {
  id: string;
  name: string;
  color: SlimeColor;
  pattern: SlimePattern;
  level: number;
  xp: number;
  stats: SlimeStats;
  role: 'idle' | 'dispatch' | 'corporate';
  generation: number;
  colorSaturation?: number;
  hue?: number;
  saturation?: number;
  diffusionRatio?: number;
  amplitude?: number;
  accentHue?: number;
  vertexCount?: number;
  irregularity?: number;
  parentA?: string;
  parentB?: string;
  createdAt: number;
  matchedTargetId?: string | null;
  matchedShapeTargetId?: string | null;
  consumedSlimeId?: string | null;
  lockedRole?: 'dispatch' | 'mediation' | 'worker' | 'exploration' | 'garrison' | null;
  garrisonedAt?: string | null;
  stage?: LifeStage;
}

export interface PlanetNode {
  id: string;
  name: string;
  cellShape: string;
  labelX: number;
  labelY: number;
  neighbors: string[];
  ownerColor: SlimeColor | null;
  pressure: Partial<Record<SlimeColor, number>>;
  strength: number;
  isCapitol: boolean;
  isSupplied: boolean;
  distanceFromCenter: number;
  discovered: boolean;
  garrisonSlimeId?: string | null;
}

export interface PlanetRegion { nodes: PlanetNode[]; generatedAt: number; geometryVersion?: number; }
export interface CorporateContract { id: string; title: string; requiredColor: SlimeColor; requiredPattern: SlimePattern; creditsReward: number; cyclesRemaining: number; totalCycles: number; flavorText: string; }
export interface CombatZone { id: string; name: string; requiredColor: SlimeColor; recommendedLevel: number; difficulty: number; creditsReward: number; xpReward: number; isUnlocked: boolean; isFirstClearCompleted: boolean; flavorText: string; }
export interface Mission { id: string; zoneId?: string; targetNodeId?: string; slimeIds: string[]; cyclesRemaining: number; status: 'active' | 'completed' | 'failed'; }
export interface MarketSaleRecord { color: SlimeColor; cycle: number; }

export interface LogEntry {
  id: string;
  cycle: number;
  timestamp: string;
  text: string;
  type: 'system' | 'corporate' | 'breeding' | 'combat' | 'melancholy';
}

export interface LabState {
  cycle: number;
  credits: number;
  slimes: Slime[];
  contracts: CorporateContract[];
  zones: CombatZone[];
  activeDispatch: Mission | null;
  logs: LogEntry[];
  rosterCap: number;
  breedingSuccessRateModifier: number;
  recentMarketSales?: MarketSaleRecord[];
  planetRegion?: PlanetRegion | null;
  wildsRegion?: PlanetRegion | null;
  wildsUnlocked?: boolean;
  activeMediation?: Mission | null;
  activeExploration?: Mission | null;
  hasAutoFeeder?: boolean;
  cultureRelationships?: Record<SlimeColor, number>;
  colorCodex?: Record<SlimeColor, { discovered: boolean }>;
  colorTargetCodex?: Record<string, boolean>;
  shapeCodex?: Record<string, boolean>;
  shapeTargetCodex?: Record<string, boolean>;
  patternCodex?: Record<SlimePattern, { discovered: boolean }>;
  regentInventory?: Partial<Record<SlimePattern, number>>;
  colorRegentInventory?: Partial<Record<SlimeColor, number>>;
  targetRegentInventory?: Record<string, number>;
}

type Raw = Record<string, unknown>;
const number = (raw: Raw, key: string, fallback = 0): number => typeof raw[key] === 'number' ? raw[key] : fallback;
const string = (raw: Raw, key: string, fallback = ''): string => typeof raw[key] === 'string' ? raw[key] : fallback;
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : Object.values((value ?? {}) as Raw);

export function luaSlimeToTs(raw: Raw): Slime {
  const stats = (raw['stats'] ?? {}) as Raw;
  return {
    id: string(raw, 'id'), name: string(raw, 'name'), color: string(raw, 'color', 'Gray') as SlimeColor,
    pattern: string(raw, 'pattern', 'Solid') as SlimePattern, level: number(raw, 'level', 1), xp: number(raw, 'xp'),
    stats: { hp: number(stats, 'hp'), atk: number(stats, 'atk'), def: number(stats, 'def'), agi: number(stats, 'agi'), int: number(stats, 'int'), chm: number(stats, 'chm') },
    role: string(raw, 'role', 'idle') as Slime['role'], generation: number(raw, 'generation'),
    colorSaturation: number(raw, 'color_saturation'), hue: number(raw, 'hue'), saturation: number(raw, 'saturation'),
    diffusionRatio: number(raw, 'diffusion_ratio'), amplitude: number(raw, 'amplitude'), accentHue: number(raw, 'accent_hue'),
    vertexCount: number(raw, 'vertex_count'), irregularity: number(raw, 'irregularity'), parentA: string(raw, 'parent_a') || undefined,
    parentB: string(raw, 'parent_b') || undefined, createdAt: number(raw, 'created_at'),
    matchedTargetId: (raw['matched_target_id'] ?? null) as string | null,
    matchedShapeTargetId: (raw['matched_shape_target_id'] ?? null) as string | null,
    consumedSlimeId: (raw['consumed_slime_id'] ?? null) as string | null,
    lockedRole: (raw['locked_role'] ?? null) as Slime['lockedRole'], garrisonedAt: (raw['garrisoned_at'] ?? null) as string | null,
    stage: raw['stage'] as LifeStage | undefined,
  };
}

export function luaNodeToTs(raw: Raw): PlanetNode {
  return {
    id: string(raw, 'id'), name: string(raw, 'name'), cellShape: string(raw, 'cell_shape'), labelX: number(raw, 'label_x'), labelY: number(raw, 'label_y'),
    neighbors: array(raw['neighbors']).map(String), ownerColor: (raw['owner_color'] ?? null) as SlimeColor | null,
    pressure: (raw['pressure'] ?? {}) as Partial<Record<SlimeColor, number>>, strength: number(raw, 'strength'),
    isCapitol: raw['is_capitol'] === true, isSupplied: raw['is_supplied'] === true, distanceFromCenter: number(raw, 'distance_from_center'),
    discovered: raw['discovered'] === true, garrisonSlimeId: (raw['garrison_slime_id'] ?? null) as string | null,
  };
}

export function slimeToLua(slime: Slime): Raw {
  return { id: slime.id, name: slime.name, color: slime.color, pattern: slime.pattern, level: slime.level, xp: slime.xp, stats: slime.stats, role: slime.role, generation: slime.generation, color_saturation: slime.colorSaturation, hue: slime.hue, saturation: slime.saturation, diffusion_ratio: slime.diffusionRatio, amplitude: slime.amplitude, accent_hue: slime.accentHue, vertex_count: slime.vertexCount, irregularity: slime.irregularity, parent_a: slime.parentA, parent_b: slime.parentB, created_at: slime.createdAt, matched_target_id: slime.matchedTargetId, matched_shape_target_id: slime.matchedShapeTargetId, consumed_slime_id: slime.consumedSlimeId, locked_role: slime.lockedRole, garrisoned_at: slime.garrisonedAt, stage: slime.stage };
}

export function nodeToLua(node: PlanetNode): Raw {
  return { id: node.id, name: node.name, cell_shape: node.cellShape, label_x: node.labelX, label_y: node.labelY, neighbors: node.neighbors, owner_color: node.ownerColor, pressure: node.pressure, strength: node.strength, is_capitol: node.isCapitol, is_supplied: node.isSupplied, distance_from_center: node.distanceFromCenter, discovered: node.discovered, garrison_slime_id: node.garrisonSlimeId };
}

export function stateToLua(state: LabState): Raw {
  return { cycle: state.cycle, credits: state.credits, slimes: state.slimes.map(slimeToLua), contracts: state.contracts.map(contract => ({ id: contract.id, credits_reward: contract.creditsReward, cycles_remaining: contract.cyclesRemaining })), zones: state.zones, roster_cap: state.rosterCap, breeding_success_rate_modifier: state.breedingSuccessRateModifier, recent_market_sales: state.recentMarketSales, planet_region: state.planetRegion ? { nodes: state.planetRegion.nodes.map(nodeToLua), generated_at: state.planetRegion.generatedAt, geometry_version: state.planetRegion.geometryVersion } : null, active_dispatch: state.activeDispatch, active_mediation: state.activeMediation, active_exploration: state.activeExploration, has_auto_feeder: state.hasAutoFeeder, culture_relationships: state.cultureRelationships };
}
