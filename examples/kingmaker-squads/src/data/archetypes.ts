/**
 * Archetype definitions, Factions, and Map Generation for KingMaker Squads
 */

import { Faction, UnitArchetype, UnitStats, TerritoryCell, UnitState, Zodiac, HouseId } from '../types';
import { HOVEL_NAME } from './worldGeometry';

export interface HouseInfo {
  id: HouseId;
  name: string;
  color: string;
  bannerBg: string;
  borderColor: string;
  description: string;
  wheelPosition: 'player' | 'adjacent_player' | 'opposite' | 'adjacent_opposite';
}

export const HOUSES: Record<HouseId, HouseInfo> = {
  ember: {
    id: 'ember',
    name: 'House Ember',
    color: '#EAB308', // Amber / Gold
    bannerBg: 'bg-amber-950/80',
    borderColor: 'border-amber-500',
    description: 'The fallen dynasty fighting to reunite the kingdom from the Hovel.',
    wheelPosition: 'player',
  },
  marsh: {
    id: 'marsh',
    name: 'House Marsh',
    color: '#CA8A04', // Yellow
    bannerBg: 'bg-yellow-950/80',
    borderColor: 'border-yellow-500',
    description: 'Resilient wetlands faction adjacent to the Ember rebellion.',
    wheelPosition: 'adjacent_player',
  },
  gale: {
    id: 'gale',
    name: 'House Gale',
    color: '#22C55E', // Green
    bannerBg: 'bg-emerald-950/80',
    borderColor: 'border-emerald-500',
    description: 'Swift valley faction adjacent to the Ember rebellion.',
    wheelPosition: 'adjacent_player',
  },
  tundra: {
    id: 'tundra',
    name: 'House Tundra',
    color: '#8B5CF6', // Violet
    bannerBg: 'bg-purple-950/80',
    borderColor: 'border-purple-600',
    description: 'The entrenched Crown core holding the secured interior wall.',
    wheelPosition: 'opposite',
  },
  crystal: {
    id: 'crystal',
    name: 'House Crystal',
    color: '#3B82F6', // Blue
    bannerBg: 'bg-blue-950/80',
    borderColor: 'border-blue-600',
    description: 'Crown-loyalist noble bastion enforcing the old regime.',
    wheelPosition: 'adjacent_opposite',
  },
  tide: {
    id: 'tide',
    name: 'House Tide',
    color: '#06B6D4', // Cyan
    bannerBg: 'bg-cyan-950/80',
    borderColor: 'border-cyan-600',
    description: 'Crown-loyalist seafaring and harbor power.',
    wheelPosition: 'adjacent_opposite',
  },
};
import { computeTerritoryAdjacency } from '../utils/territoryAdjacency';

const ZODIAC_SIGNS: Zodiac[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

export function assignRandomZodiac(): Zodiac {
  return ZODIAC_SIGNS[Math.floor(Math.random() * ZODIAC_SIGNS.length)];
}

export interface ArchetypeInfo {
  type: UnitArchetype;
  name: string;
  cost: number;
  baseStats: UnitStats;
  description: string;
  abilityName: string;
  abilityDescription: string;
  tag: string;
}

export const ARCHETYPES: Record<UnitArchetype, ArchetypeInfo> = {
  pawn: {
    type: 'pawn',
    name: 'Pawn',
    cost: 2,
    baseStats: { hp: 45, maxHp: 45, atk: 12, def: 4, speed: 10, range: 1 },
    description: 'Cheap, disposable frontline unit. Gains momentum when swarming with other Pawns.',
    abilityName: 'Phalanx Charge',
    abilityDescription: 'Deals +25% bonus damage for each adjacent ally Pawn.',
    tag: 'Frontline / Swarm',
  },
  knight: {
    type: 'knight',
    name: 'Knight',
    cost: 3,
    baseStats: { hp: 65, maxHp: 65, atk: 22, def: 8, speed: 18, range: 1 },
    description: 'Agile flanker capable of leaping past frontline defenses. Crucial: Can be assigned as Cell Leader Escort.',
    abilityName: 'Galloping Leap',
    abilityDescription: 'Bypasses front row tanks to directly assault backline priority targets or Escort the Cell Leader to safety.',
    tag: 'Flanker / Escort',
  },
  bishop: {
    type: 'bishop',
    name: 'Bishop',
    cost: 3,
    baseStats: { hp: 50, maxHp: 50, atk: 18, def: 3, speed: 12, range: 3 },
    description: 'Ranged spellcaster providing radiant support and backline artillery fire.',
    abilityName: 'Radiant Benediction',
    abilityDescription: 'Restores health to damaged allies or unleashes piercing beam attacks across diagonal lanes.',
    tag: 'Ranged / Support',
  },
  rook: {
    type: 'rook',
    name: 'Rook',
    cost: 4,
    baseStats: { hp: 110, maxHp: 110, atk: 16, def: 18, speed: 6, range: 1 },
    description: 'Immovable siege tank clad in heavy iron armor. Draws enemy aggression.',
    abilityName: 'Bulwark Bastion',
    abilityDescription: 'Taunts enemy attacks and grants 35% damage reduction to allies behind it.',
    tag: 'Heavy Tank / Bastion',
  },
  queen: {
    type: 'queen',
    name: 'Queen',
    cost: 5,
    baseStats: { hp: 90, maxHp: 90, atk: 32, def: 12, speed: 15, range: 2 },
    description: 'Devastating elite combatant. Sweeps across the battle grid dealing high AoE damage.',
    abilityName: 'Royal Cleave',
    abilityDescription: 'Unleashes a sweeping arc of destruction affecting up to 3 adjacent targets.',
    tag: 'Elite Sweeper / Cleave',
  },
};

export const FACTIONS: Record<string, Faction> = {
  player: {
    id: 'player',
    name: 'House Ember',
    color: '#EAB308', // Amber / Gold
    bannerBg: 'bg-amber-950/80',
    borderColor: 'border-amber-500',
    description: 'Your underground forces fighting to liberate city districts and rally uprising leaders.',
  },
  ember: {
    id: 'player',
    name: 'House Ember',
    color: '#EAB308', // Amber / Gold
    bannerBg: 'bg-amber-950/80',
    borderColor: 'border-amber-500',
    description: 'Your underground forces fighting to liberate city districts and rally uprising leaders.',
  },
  marsh: {
    id: 'marsh',
    name: 'House Marsh',
    color: '#CA8A04', // Yellow
    bannerBg: 'bg-yellow-950/80',
    borderColor: 'border-yellow-500',
    description: 'Resilient wetlands faction adjacent to the Ember rebellion.',
  },
  gale: {
    id: 'gale',
    name: 'House Gale',
    color: '#22C55E', // Green
    bannerBg: 'bg-emerald-950/80',
    borderColor: 'border-emerald-500',
    description: 'Swift valley faction adjacent to the Ember rebellion.',
  },
  tundra: {
    id: 'tundra',
    name: 'House Tundra',
    color: '#8B5CF6', // Violet
    bannerBg: 'bg-purple-950/80',
    borderColor: 'border-purple-600',
    description: 'The entrenched Crown core holding the secured interior wall.',
  },
  crystal: {
    id: 'crystal',
    name: 'House Crystal',
    color: '#3B82F6', // Blue
    bannerBg: 'bg-blue-950/80',
    borderColor: 'border-blue-600',
    description: 'Crown-loyalist noble bastion enforcing the old regime.',
  },
  tide: {
    id: 'tide',
    name: 'House Tide',
    color: '#06B6D4', // Cyan
    bannerBg: 'bg-cyan-950/80',
    borderColor: 'border-cyan-600',
    description: 'Crown-loyalist seafaring and harbor power.',
  },
};

const PAWN_NAMES = ['Vance', 'Grimm', 'Gideon', 'Aethel', 'Rowan', 'Torin', 'Cedric', 'Bran', 'Caelen', 'Devin'];
const KNIGHT_NAMES = ['Percival', 'Gareth', 'Tristan', 'Eleanor', 'Cassian', 'Sigrid', 'Roderick', 'Hal'];
const BISHOP_NAMES = ['Alden', 'Malachi', 'Stephen', 'Theresa', 'Lucian', 'Joel'];
const ROOK_NAMES = ['Balthazar', 'Aethelgard', 'Gromm', 'Garrick', 'Kael', 'Stone'];
const QUEEN_NAMES = ['Yvaine', 'Morgana', 'Rosalind', 'Isabella', 'Vivienne', 'Aurelia'];

export function generateUnitName(archetype: UnitArchetype): string {
  const pool = {
    pawn: PAWN_NAMES,
    knight: KNIGHT_NAMES,
    bishop: BISHOP_NAMES,
    rook: ROOK_NAMES,
    queen: QUEEN_NAMES,
  }[archetype];

  const base = pool[Math.floor(Math.random() * pool.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${base} #${num}`;
}

let unitIdSeq = 0;

export function createUnit(
  archetype: UnitArchetype,
  customName?: string,
  rank: 'recruit' | 'veteran' | 'elite' = 'recruit'
): UnitState {
  unitIdSeq += 1;
  const info = ARCHETYPES[archetype];
  const rankMultipliers = {
    recruit: { hp: 1, atk: 1, def: 1 },
    veteran: { hp: 1.35, atk: 1.3, def: 1.25 },
    elite: { hp: 1.75, atk: 1.65, def: 1.5 },
  }[rank];

  const maxHp = Math.round(info.baseStats.hp * rankMultipliers.hp);
  const atk = Math.round(info.baseStats.atk * rankMultipliers.atk);
  const def = Math.round(info.baseStats.def * rankMultipliers.def);

  return {
    id: `unit_${Date.now()}_${unitIdSeq}_${Math.random().toString(36).substring(2, 7)}`,
    name: customName || generateUnitName(archetype),
    archetype,
    rank,
    zodiac: assignRandomZodiac(),
    isPermanent: rank !== 'recruit', // Permanent when Veteran or Elite
    isKing: false,
    hasHonorScar: false,
    survivalFights: rank === 'veteran' ? 3 : rank === 'elite' ? 7 : 0,
    stats: {
      hp: maxHp,
      maxHp,
      atk,
      def,
      speed: info.baseStats.speed,
      range: info.baseStats.range,
    },
    cost: info.cost,
    squadSlot: null,
    isEscort: false,
  };
}

// Generate the initial 9 tessellated territory cells forming "The Front"
export function generateInitialTerritories(): TerritoryCell[] {
  const rawCells: Omit<TerritoryCell, 'neighborIds'>[] = [
    {
      id: 'cell_capital',
      name: HOVEL_NAME,
      x: 180,
      y: 120,
      polygonPoints: [
        [180, 40],
        [280, 80],
        [260, 180],
        [150, 190],
        [100, 100],
      ],
      owner: 'player',
      type: 'capital',
      publicOpinion: 70,
      isoGridAnchor: { x: 180, y: 100 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['keep', 'wall'],
        ['wall', 'gate'],
      ],
      threatLevel: 1,
      troopCount: 4,
      scouted: true,
      hasKing: true,
      settlingTurnsLeft: 0,
      enemyUnits: [],
    },
    {
      id: 'cell_west_pass',
      name: 'Westside Checkpoint',
      x: 100,
      y: 260,
      polygonPoints: [
        [100, 100],
        [150, 190],
        [140, 310],
        [40, 320],
        [30, 180],
      ],
      owner: 'player',
      type: 'pass',
      publicOpinion: 40,
      isoGridAnchor: { x: 80, y: 200 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['watchtower', 'wall'],
        ['gate', 'wall'],
      ],
      threatLevel: 2,
      troopCount: 3,
      scouted: true,
      enemyUnits: [],
    },
    {
      id: 'cell_east_plains',
      name: 'Ash River Square',
      x: 320,
      y: 220,
      polygonPoints: [
        [280, 80],
        [400, 100],
        [430, 240],
        [330, 300],
        [260, 180],
      ],
      owner: 'tundra',
      type: 'plains',
      publicOpinion: 50,
      isoGridAnchor: { x: 330, y: 170 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['bazaar', 'house'],
        ['house', 'fountain'],
      ],
      threatLevel: 2,
      troopCount: 3,
      scouted: false,
      enemyUnits: [
        createUnit('pawn', 'Regime Guard I'),
        createUnit('pawn', 'Regime Guard II'),
        createUnit('knight', 'Legion Flanker'),
      ],
    },
    {
      id: 'cell_central_fort',
      name: 'Central Barricade',
      x: 230,
      y: 330,
      polygonPoints: [
        [150, 190],
        [260, 180],
        [330, 300],
        [240, 420],
        [140, 310],
      ],
      owner: 'tundra',
      type: 'fortress',
      publicOpinion: 60,
      isoGridAnchor: { x: 210, y: 260 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['fortress', 'bastion'],
        ['wall', 'gate'],
      ],
      threatLevel: 3,
      troopCount: 4,
      scouted: false,
      enemyUnits: [
        createUnit('rook', 'Regime Wall'),
        createUnit('bishop', 'Cultist'),
        createUnit('pawn', 'Pawn Vanguard'),
        createUnit('pawn', 'Pawn Charger'),
      ],
    },
    {
      id: 'cell_north_outpost',
      name: 'Northside Outpost',
      x: 350,
      y: 60,
      polygonPoints: [
        [280, 80],
        [350, 20],
        [460, 50],
        [400, 100],
      ],
      owner: 'crystal',
      type: 'outpost',
      publicOpinion: 35,
      isoGridAnchor: { x: 360, y: 55 },
      isoGridCols: 2,
      isoGridRows: 1,
      isoBuildingLayout: [['outpost', 'watchtower']],
      threatLevel: 3,
      troopCount: 3,
      scouted: false,
      hasKing: true,
      enemyUnits: [
        { ...createUnit('rook', 'District Commander', 'veteran'), isKing: true },
        createUnit('bishop', 'Covenant Priest'),
        { ...createUnit('knight', 'Covenant Escort'), isEscort: true },
      ],
    },
    {
      id: 'cell_south_pass',
      name: 'Sewer Tunnel Checkpoint',
      x: 120,
      y: 430,
      polygonPoints: [
        [40, 320],
        [140, 310],
        [240, 420],
        [180, 510],
        [60, 480],
      ],
      owner: 'marsh',
      type: 'pass',
      publicOpinion: 40,
      isoGridAnchor: { x: 120, y: 390 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['tunnel', 'arch'],
        ['gate', 'wall'],
      ],
      threatLevel: 3,
      troopCount: 4,
      scouted: false,
      hasKing: true,
      enemyUnits: [
        createUnit('pawn', 'Blood Raider I'),
        createUnit('pawn', 'Blood Raider II'),
        createUnit('knight', 'Blood Berserker'),
        { ...createUnit('queen', 'Warlord Kaelen', 'elite'), isKing: true },
      ],
    },
    {
      id: 'cell_tundra_citadel',
      name: 'Regime Citadel',
      x: 360,
      y: 390,
      polygonPoints: [
        [330, 300],
        [430, 240],
        [480, 360],
        [380, 490],
        [240, 420],
      ],
      owner: 'tundra',
      type: 'capital',
      publicOpinion: 70,
      isoGridAnchor: { x: 350, y: 340 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['citadel', 'spire'],
        ['wall', 'dread_gate'],
      ],
      threatLevel: 4,
      troopCount: 5,
      scouted: false,
      hasKing: true,
      enemyUnits: [
        createUnit('rook', 'Dread Bastion'),
        { ...createUnit('queen', 'Regime General', 'elite'), isKing: true },
        createUnit('bishop', 'Dread Priest'),
        { ...createUnit('knight', 'Shadow Escort'), isEscort: true },
        createUnit('pawn', 'Tundra Pawn'),
      ],
    },
    {
      id: 'cell_east_spire',
      name: 'Shadow Alley Hideout',
      x: 480,
      y: 200,
      polygonPoints: [
        [400, 100],
        [520, 110],
        [540, 260],
        [480, 360],
        [430, 240],
      ],
      owner: 'gale',
      type: 'outpost',
      publicOpinion: 35,
      isoGridAnchor: { x: 460, y: 200 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['spire', 'hideout'],
        ['wall', 'alley'],
      ],
      threatLevel: 4,
      troopCount: 4,
      scouted: false,
      hasKing: true,
      enemyUnits: [
        { ...createUnit('bishop', 'Cell Leader Vane', 'veteran'), isKing: true },
        createUnit('bishop', 'Shadow Bishop'),
        { ...createUnit('knight', 'Ash Blade'), isEscort: true },
        createUnit('pawn', 'Cult Fodder'),
      ],
    },
    {
      id: 'cell_south_hold',
      name: 'Contested Market Square',
      x: 300,
      y: 500,
      polygonPoints: [
        [240, 420],
        [380, 490],
        [330, 560],
        [180, 510],
      ],
      owner: 'tide',
      type: 'plains',
      publicOpinion: 50,
      isoGridAnchor: { x: 270, y: 480 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['market', 'stall'],
        ['fountain', 'house'],
      ],
      threatLevel: 5,
      troopCount: 5,
      scouted: false,
      enemyUnits: [
        createUnit('pawn', 'Raider Pawn I'),
        createUnit('pawn', 'Raider Pawn II'),
        createUnit('knight', 'Oathtaker Knight'),
        createUnit('rook', 'Blood Wall'),
        createUnit('queen', 'Blood Queen', 'veteran'),
      ],
    },
  ];

  return computeTerritoryAdjacency(rawCells as TerritoryCell[]);
}
