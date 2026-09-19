/**
 * Project "Systemic Extract" - Core Types & ECS Component Specifications
 * Directly matches the Bevy ECS and Python/FastAPI Backend architecture specs.
 */

// ==========================================
// 1. BEVY ECS ARCHITECTURE & COMPONENTS
// ==========================================

export enum HazardState {
  None = 'None',
  Fire = 'Fire',
  PoisonGas = 'PoisonGas',
  Water = 'Water',
}

export enum Faction {
  Player = 'Player',
  Security = 'Security',
  Syndicate = 'Syndicate',
  Civilian = 'Civilian',
}

export type EntityId = number;

export interface GridPosition {
  x: number;
  y: number;
}

export interface TransformComponent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Health {
  current: number;
  max: number;
}

export interface Flammable {
  ignition_threshold: number; // e.g. 1.0
  burn_rate: number;          // HP loss per second when on fire (10 per tick)
  is_burning: boolean;
  fire_timer: number;         // timer for spreading
}

export interface AIComponent {
  state: 'patrol' | 'chase' | 'flee' | 'alert';
  patrolRoute: GridPosition[];
  currentRouteIndex: number;
  attackCooldown: number;
  visionRange: number;
  lastKnownPlayerPos: GridPosition | null;
  alertTimer: number;
}

export interface ExplosiveComponent {
  fuseTime: number;          // countdown in seconds (e.g. 3.0)
  blastRadius: number;       // AoE radius (e.g. 2 tiles)
  damage: number;            // 50 damage
  isArmed: boolean;
  sourcePlayer: boolean;
}

export interface LootComponent {
  itemId: string;
  itemName: string;
  collected: boolean;
}

export type EntityKind =
  | 'Player'
  | 'Security'
  | 'DestructibleWall'
  | 'ReinforcedWall'
  | 'BreachingCharge'
  | 'ScrapPile'
  | 'LootCrate'
  | 'ExtractionZone'
  | 'HiveBlob'
  | 'Crawler'
  | 'ResonanceSpark'
  | 'ApexEcho'
  | 'Projectile'
  | 'Resident'
  | 'Structure'
  | 'SanctuaryCore';

// ==========================================
// ADR 011: RESIDENTS, ESCORT & MEGABASE CONSTRUCTION
// ==========================================

export type ResidentId = 'engineer' | 'biologist' | 'armorer' | 'architect';

export interface ResidentComponent {
  residentId: ResidentId;
  name: string;
  title: string;
  roleDescription: string;
  color: string;
  quadrant: 'NW' | 'NE' | 'SW' | 'SE';
  isRescued: boolean;
  isFollowing: boolean;
  unlockedStructureId: string;
  homeX: number;
  homeY: number;
}

export interface FollowTargetComponent {
  targetEntityId: EntityId;
  desiredDistance: number;
  speed: number;
}

export type StructureBuffType = 'damage' | 'regen' | 'armor' | 'speed';

export interface StructureBlueprint {
  id: string;
  name: string;
  description: string;
  cost: number;
  residentRequired: ResidentId;
  color: string;
  accentColor: string;
  width: number;
  height: number;
  buffType: StructureBuffType;
  buffValue: number;
  icon: string;
}

export interface StructureComponent {
  blueprintId: string;
  name: string;
  originX: number;
  originY: number;
  width: number;
  height: number;
  level: number;
  color: string;
  accentColor: string;
  buffType: StructureBuffType;
  buffValue: number;
}

export interface ActiveBuffs {
  damageBonus: number; // e.g. 0.25 = +25%
  regenRate: number;   // e.g. 4 HP/sec
  armorRating: number; // e.g. 20 flat armor
  speedMultiplier: number; // e.g. 1.20 = +20%
}

export type DamageElement = 'kinetic' | 'plasma';

// ==========================================
// ADR 007: AUTONOMOUS BALLISTICS & RESISTANCE
// ==========================================

export interface WeaponHardpoint {
  weaponId: string;
  name: string;
  element: DamageElement;
  damage: number;
  fireRate: number;        // shots per second (e.g. 2.5)
  range: number;           // max targeting radius in tiles (e.g. 8.0)
  projectileSpeed: number; // velocity in tiles/sec (e.g. 14.0)
  cooldownTimer: number;   // countdown timer in seconds until next shot
  piercing: boolean;       // if true (Plasma), penetrates through targets
  knockback: number;       // knockback impulse in tiles (e.g. 1.0 for Kinetic)
}

export interface ResistanceComponent {
  kineticMult: number;     // e.g. 1.6 for organics, 0.5 for armored Echoes
  plasmaMult: number;      // e.g. 0.5 for organics, 1.8 for armored Echoes & Apex Boss
  armor: number;           // flat damage reduction prior to elemental multiplier
}

export interface ProjectileComponent {
  isActive: boolean;
  element: DamageElement;
  damage: number;
  knockback: number;
  piercing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  vx: number;
  vy: number;
  range: number;
  distanceTraveled: number;
  sourceEntityId: EntityId;
  hitEntityIds: Set<EntityId>;
  isHostile: boolean;
}

export interface SpawnerComponent {
  spawnTimer: number;
  spawnInterval: number;
  maxActive: number;
  activeSpawnIds: EntityId[];
}

export interface VisualComponent {
  renderX: number;           // Smooth interpolated visual position
  renderY: number;
  facingAngle: number;       // Radians
  flashTime: number;         // Hit flash duration
  colorOverride?: string;
}

export interface CombatEvent {
  id: string;
  type: 'damage' | 'breach' | 'fire' | 'extract' | 'loot' | 'alert' | 'explosion' | 'info';
  text: string;
  timestamp: number;
}

export interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  type: 'spark' | 'flame' | 'rubble' | 'smoke' | 'blast';
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// ==========================================
// 2. TILE & GRID MATRIX SPECIFICATION
// ==========================================

export type ZoneType = 'sanctuary' | 'overworld' | 'dungeon';
export type MapType = 'overworld' | 'dungeon';
export type DungeonZoneId = 'nw_robotics' | 'ne_biolab' | 'sw_foundry' | 'se_void';

export interface TileState {
  x: number;
  y: number;
  hazard: HazardState;
  hazardTimer: number;       // For fire duration or spread cadence
  hazardIntensity: number;   // 0.0 - 1.0
  isFlammable: boolean;
  wallEntityId: EntityId | null;
  lootEntityId: EntityId | null;
  isExtraction: boolean;
  zoneType?: ZoneType;
  dungeonId?: DungeonZoneId;
  dungeonName?: string;
  isDungeonEntrance?: boolean;
  dungeonTargetId?: DungeonZoneId;
  isPlayerHome?: boolean;
}

// ==========================================
// 3. ADR 002: RESEARCH & REFINEMENT SCHEMAS
// ==========================================

export interface ItemDefinition {
  item_id: string;
  name: string;
  type: 'Extractable_Junk' | 'Component' | 'Equipment';
  description: string;
  research_tags: Record<string, number>;    // e.g. {"digital": 5, "corporate": 3, "encrypted": 1}
  deconstruct_yield: Record<string, number>; // e.g. {"silicon": 10, "copper": 5}
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Exotic';
}

/**
 * ADR 002 (DIVERT): Static JSON dictionary of Item Definitions in types.ts
 * Maps directly to PostgreSQL/JSONB schema for offline/idle parsing
 */
export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  corp_server_drive: {
    item_id: 'corp_server_drive',
    name: 'Apex Mainframe Tape Drive',
    type: 'Extractable_Junk',
    description: '198X tape-spooled server drive soaked in sub-space dimensional telemetry from the breach.',
    research_tags: { digital: 5, corporate: 3, encrypted: 1 },
    deconstruct_yield: { silicon: 10, copper: 5 },
    rarity: 'Rare',
  },
  radio_transceiver: {
    item_id: 'radio_transceiver',
    name: 'Cassette Sub-Space Transceiver',
    type: 'Extractable_Junk',
    description: 'Shockproof 1980s tactical radio tuned to fragmented reality frequencies.',
    research_tags: { digital: 4, volatile: 2 },
    deconstruct_yield: { copper: 8, scrap: 12 }, // scrap = Inert Matter
    rarity: 'Uncommon',
  },
  chemical_canister: {
    item_id: 'chemical_canister',
    name: 'Anomalous Resin Solvent',
    type: 'Extractable_Junk',
    description: 'Pressurized volatile cylinder used in chemical scrubbing of anomalous biomass.',
    research_tags: { volatile: 6, chemical: 4 },
    deconstruct_yield: { plasma: 4, scrap: 8 },
    rarity: 'Uncommon',
  },
  biometric_terminal: {
    item_id: 'biometric_terminal',
    name: 'Apex Sub-Space Terminal',
    type: 'Extractable_Junk',
    description: '198X optical cipher console salvaged from the quarantined containment perimeter.',
    research_tags: { corporate: 4, encrypted: 3, digital: 3 },
    deconstruct_yield: { silicon: 12, copper: 6 },
    rarity: 'Rare',
  },
  scrap_metal_salvage: {
    item_id: 'scrap_metal_salvage',
    name: 'Lead-Shielded Inert Matter',
    type: 'Extractable_Junk',
    description: 'Dense structural alloy from the Faraday bunker perimeter scrubbed of radiation.',
    research_tags: { metallic: 5 },
    deconstruct_yield: { scrap: 25, copper: 3 },
    rarity: 'Common',
  },
  biomass_cluster: {
    item_id: 'biomass_cluster',
    name: 'Anomalous Biomass Cluster',
    type: 'Extractable_Junk',
    description: 'Organic pulsating resin nodule harvested from breached Hive Nodes. Rich in volatile bio-synthetics.',
    research_tags: { biomass: 5, volatile: 3 },
    deconstruct_yield: { plasma: 6, scrap: 10 },
    rarity: 'Rare',
  },
  subcore_memory_array: {
    item_id: 'subcore_memory_array',
    name: 'Quantum Sub-Core Memory Array',
    type: 'Extractable_Junk',
    description: 'Superconducting cryo-memory bank extracted from Sector 02 mainframe cores. Rich in digital architecture.',
    research_tags: { digital: 8, encrypted: 6, corporate: 4 },
    deconstruct_yield: { silicon: 18, copper: 10, plasma: 4 },
    rarity: 'Rare',
  },
  quantum_flux_conduit: {
    item_id: 'quantum_flux_conduit',
    name: 'Sub-Space Flux Conduit',
    type: 'Extractable_Junk',
    description: 'Heavy gold-plated bus conduit used to channel sub-space power across the mainframe.',
    research_tags: { digital: 6, volatile: 4, metallic: 8 },
    deconstruct_yield: { copper: 16, silicon: 8, plasma: 6 },
    rarity: 'Exotic',
  },
  dimensional_lure: {
    item_id: 'dimensional_lure',
    name: 'Dimensional Resonant Lure',
    type: 'Equipment',
    description: 'Tachyon beacon synthesized in the Fabricator. In raid, deploy with [T] to immediately rupture reality and summon the Apex Echo.',
    research_tags: { volatile: 8, digital: 8, encrypted: 4 },
    deconstruct_yield: { silicon: 10, plasma: 5, scrap: 15 },
    rarity: 'Rare',
  },
  relic_ontological_core: {
    item_id: 'relic_ontological_core',
    name: 'Apex Ontological Core',
    type: 'Extractable_Junk',
    description: 'Singular condensed temporal anchor torn from the eradicated Apex Echo. Infused with pure sub-space energy. Acts as the permanent Sector 2 Access Key.',
    research_tags: { biomass: 10, digital: 10, encrypted: 10, volatile: 10 },
    deconstruct_yield: { plasma: 25, scrap: 50, silicon: 25, copper: 25 },
    rarity: 'Exotic',
  },
  kinetic_scattergun: {
    item_id: 'kinetic_scattergun',
    name: 'Kinetic Scattergun Hardpoint',
    type: 'Equipment',
    description: 'Shoulder-mounted magnetic auto-turret. High rate of fire with kinetic shockwave knockback. Devastates organic swarms (Crawlers, Blobs).',
    research_tags: { metallic: 6, volatile: 4 },
    deconstruct_yield: { scrap: 20, copper: 6 },
    rarity: 'Uncommon',
  },
  plasma_pulse_array: {
    item_id: 'plasma_pulse_array',
    name: 'Plasma Pulse Array Hardpoint',
    type: 'Equipment',
    description: 'Sub-space ionizing plasma projector. Fires high-intensity piercing beams that melt armored Echo guards and the Apex Boss.',
    research_tags: { digital: 8, silicon: 8, encrypted: 4 },
    deconstruct_yield: { silicon: 14, plasma: 8, scrap: 15 },
    rarity: 'Rare',
  },
};

// ==========================================
// 4. ADR 006: BIOME ROUTING & RELIC GATES
// ==========================================

export type SectorId = 'sector_01' | 'sector_02';

export interface BiomeProfile {
  id: SectorId;
  name: string;
  code: string;
  subTitle: string;
  description: string;
  dangerLevel: 'MODERATE' | 'EXTREME' | 'LETHAL';
  guaranteedTags: string[];
  primaryLootPool: { itemId: string; weight: number }[];
  palette: {
    wallColor: string;
    partitionColor: string;
    groundGrid: string;
    accentGlow: string;
  };
  hazardProfile: {
    ambientHazardType: 'none' | 'toxic_atmosphere';
    dps: number;
    mitigatedByRig: boolean;
    description: string;
  };
  requiredRelicId?: string;
}

export interface ResearchBlueprint {
  blueprint_id: string;
  name: string;
  description: string;
  unlocked: boolean;
  requirements_to_unlock: Record<string, number>; // e.g. {"digital": 15, "volatile": 5}
  contributed_tags: Record<string, number>;       // Cumulative submitted tags
  requirements_to_craft: Record<string, number>;  // e.g. {"silicon": 5, "copper": 4}
  craftDurationSeconds: number;
  outputItem: string;
  category: 'Demolition' | 'Disruption' | 'Hazard' | 'Tactical' | 'Ballistics';
}

export interface DeconstructionJob {
  id: string;
  item_id: string;
  itemName: string;
  quantity: number;
  yields: Record<string, number>;           // Elemental material yields (silicon, copper, plasma, scrap)
  tagsYielded: Record<string, number>;      // Component data tags stripped into hideout data bank
  durationSeconds: number;
  startedAt: number;
  finishAt: number;
  isClaimed: boolean;
}

export interface CraftingJob {
  id: string;
  blueprint_id: string;
  itemName: string;
  costMaterials: Record<string, number>;
  durationSeconds: number;
  startedAt: number;         // Unix ms
  finishAt: number;          // Unix ms
  isClaimed: boolean;
}

export interface HideoutResources {
  scrap: number;
  silicon: number;
  copper: number;
  plasma: number;
}

export interface InventoryItem {
  item_id: string;
  count: number;
}

export interface FaradayShieldState {
  integrity: number;              // 0% - 100%
  isCompromised: boolean;         // True if resources zero and shields collapsed
  hourlyScrapUpkeep: number;      // 20 Inert Matter / hour
  hourlyPlasmaUpkeep: number;     // 1 Plasma / hour
  lastUpkeepTimestamp: number;
  totalDrainedScrap: number;
  totalDrainedPlasma: number;
  decayedTagsCount: number;
  lastDecayedTag?: string;
}

export type WeaponId = 'kinetic_scattergun' | 'plasma_pulse_array';

export interface HideoutState {
  resources: HideoutResources;
  componentTags: Record<string, number>;    // Stripped data tags bank: e.g. { digital: 15, volatile: 8, metallic: 20 }
  inventory: InventoryItem[];               // Scavenged junk items awaiting deconstruction
  blueprints: ResearchBlueprint[];
  deconstructionQueue: DeconstructionJob[];
  craftingQueue: CraftingJob[];
  breachingChargesInStash: number;
  empGrenadesInStash: number;
  thermiteFlaresInStash: number;
  dimensionalLuresInStash: number;          // ADR 006: Dimensional Lures
  equippedCharges: number;
  equippedEmp: number;
  equippedFlares: number;
  equippedLures: number;                    // ADR 006: Equipped Lure
  equippedMedkits: number;
  hasHazmatRig: boolean;                    // ADR 006: Lead-Shielded Rig protection status
  equippedWeapon: 'kinetic_scattergun' | 'plasma_pulse_array'; // ADR 007: Autonomous hardpoint weapon
  unlockedWeapons: ('kinetic_scattergun' | 'plasma_pulse_array')[];
  unlockedSectors: SectorId[];              // ADR 006: Unlocked sectors (['sector_01', 'sector_02'])
  selectedSector: SectorId;                 // Active target deployment sector
  lastTickTimestamp: number;
  deconstructorSpeedMultiplier: number;
  faradayShield: FaradayShieldState;         // ADR 004: Bunker Reality Shield & Attrition state
  stats: {
    totalRaids: number;
    successfulExtractions: number;
    deaths: number;
    scrapExtracted: number;
    itemsExtracted: number;
    wallsBreached: number;
    guardsEliminated: number;
    blueprintsUnlocked: number;
    relicsExtracted: number;
  };
}

export interface ScavengedLootEntry {
  item_id: string;
  name: string;
  count: number;
}

export interface RaidExtractRequest {
  extracted: boolean;
  scrapCollected: number;
  scavengedItems: ScavengedLootEntry[];
  chargesRemaining: number;
  empRemaining?: number;
  flaresRemaining?: number;
  luresRemaining?: number;
  guardsEliminated: number;
  wallsDestroyed: number;
  durationSeconds: number;
}

export interface RaidExtractResponse {
  success: boolean;
  status: 'EXTRACTED' | 'KIA';
  creditedScrap: number;
  creditedItems: ScavengedLootEntry[];
  newResources: HideoutResources;
  inventoryPreserved: boolean;
  timestamp: number;
}

export interface HideoutTickResponse {
  elapsedSeconds: number;
  passiveScrap: number;
  completedDeconstructJobs: string[];
  completedCraftJobs: string[];
  resources: HideoutResources;
  componentTags: Record<string, number>;
  faradayShield: FaradayShieldState;
  timestamp: number;
}

export interface DeconstructRequest {
  item_id: string;
  quantity: number;
}

export interface DeconstructResponse {
  success: boolean;
  job: DeconstructionJob | null;
  remainingInventoryCount: number;
  message: string;
}

export interface ResearchSubmitRequest {
  blueprint_id: string;
  tag?: string;           // Direct component tag allocation from data bank
  tagAmount?: number;
  item_id?: string;       // Or direct item sacrifice analysis
  quantity?: number;
}

export interface ResearchSubmitResponse {
  success: boolean;
  blueprint_id: string;
  tagsAdded: Record<string, number>;
  unlocked: boolean;
  message: string;
}

export interface CraftRequest {
  blueprint_id: string;
}

export interface CraftResponse {
  success: boolean;
  job: CraftingJob | null;
  remainingResources: HideoutResources;
  message: string;
}

export interface ApiTelemetryLog {
  id: string;
  timestamp: number;
  method: 'GET' | 'POST';
  endpoint: string;
  requestBody?: any;
  responseBody: any;
  latencyMs: number;
}
