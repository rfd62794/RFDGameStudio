import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  CellCombatState,
  CombatLogEntry,
  Corporation,
  GameDate,
  GameEvent,
  GameEventChoice,
  MapCell,
  Point,
  RecruitmentItem,
  UnitGroup,
  UnitTransit,
  UnitType,
} from '../src/engine/shared/componentTypes';
import type {
  CellCombatState as SrcCellCombatState,
  CombatLogEntry as SrcCombatLogEntry,
  UnitGroup as SrcUnitGroup,
  UnitType as SrcUnitType,
} from '../src/engine/shared/combat/types';
import type {
  Corporation as PogCorporation,
  MapCell as PogMapCell,
} from '../src/games/planetofgreed/types';

/**
 * componentTypes.ts is a type-only module: it defines the interface the
 * shared CorpWorld/Planet of Greed components (AlertQueue, BoardroomHeader,
 * CombatResolutionView, DailyEventModal, PlanetMap) expect from a consuming
 * game, and re-exports the combat types from shared/combat/types.
 *
 * Its real, testable behaviour is therefore:
 *   1. it contributes zero runtime surface (type-only module),
 *   2. its combat re-exports are identical to the source types,
 *   3. its interfaces accept exactly the shapes the shared components read,
 *      including the documented optional fields,
 *   4. its one behavioural member, GameEventChoice.action, has the
 *      (state, cellId) => { log, stateUpdates } signature.
 */
describe('test_componentTypes_module_surface', () => {
  it('is a type-only module and exposes no runtime exports', async () => {
    const mod = await import('../src/engine/shared/componentTypes');
    expect(Object.keys(mod)).toEqual([]);
  });
});

describe('test_componentTypes_combat_reexports', () => {
  it('re-exported combat types are identical to shared/combat/types', () => {
    expectTypeOf<UnitType>().toEqualTypeOf<SrcUnitType>();
    expectTypeOf<UnitGroup>().toEqualTypeOf<SrcUnitGroup>();
    expectTypeOf<CellCombatState>().toEqualTypeOf<SrcCellCombatState>();
    expectTypeOf<CombatLogEntry>().toEqualTypeOf<SrcCombatLogEntry>();
  });
});

describe('test_componentTypes_corporation_contract', () => {
  const baseFields = {
    id: 'corp-1',
    name: 'Meridian Holdings',
    color: '#22ccff',
    borderColor: '#111111',
    bgClass: 'bg-cyan-400',
    textClass: 'text-cyan-900',
    isPlayer: true,
    treasury: 1500,
    scoutedCells: {} as { [cellId: number]: boolean },
  };

  it('accepts a corporation with only the base fields (rank/fragments/cultureId optional)', () => {
    const corp: Corporation = { ...baseFields };
    // BoardroomHeader reads playerCorp.fragments?.length ?? 0 — absence must
    // be safe, which is exactly why the field is optional.
    expect(corp.rank).toBeUndefined();
    expect(corp.fragments).toBeUndefined();
    expect(corp.cultureId).toBeUndefined();
    expect(corp.fragments?.length ?? 0).toBe(0);
  });

  it('accepts the documented extension fields when present', () => {
    const corp: Corporation = {
      ...baseFields,
      rank: 3,
      fragments: ['ember'],
      cultureId: 'ember',
    };
    expect(corp.rank).toBe(3);
    expect(corp.fragments).toEqual(['ember']);
    expect(corp.cultureId).toBe('ember');
  });

  it('scoutedCells is a numeric-keyed boolean record', () => {
    const corp: Corporation = { ...baseFields };
    corp.scoutedCells[7] = true;
    expect(corp.scoutedCells[7]).toBe(true);
    expect(corp.scoutedCells[8]).toBeUndefined();
  });
});

describe('test_componentTypes_mapcell_contract', () => {
  const seed: Point = { x: 120, y: 80 };
  const polygon: Point[] = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
  const units: UnitGroup = { circle: 3, square: 1, triangle: 0 };

  const baseCell = {
    id: 7,
    name: 'Sector 7',
    seed,
    polygon,
    neighbors: [6, 8],
    units,
    fortification: 0,
    recruitmentQueue: [] as RecruitmentItem[],
    preferredProduction: 'square' as UnitType,
    productionProgress: 40,
  };

  it('ownerId accepts null for an unowned cell', () => {
    const cell: MapCell = { ...baseCell, ownerId: null };
    expect(cell.ownerId).toBeNull();
  });

  it('ownerId accepts a corporation id — matching the components\' c.ownerId === corp.id check', () => {
    const cell: MapCell = { ...baseCell, ownerId: 'corp-1' };
    const corp: Corporation = {
      id: 'corp-1',
      name: 'Meridian Holdings',
      color: '#22ccff',
      borderColor: '#111111',
      bgClass: 'bg-cyan-400',
      textClass: 'text-cyan-900',
      isPlayer: false,
      treasury: 0,
      scoutedCells: {},
    };
    expect(cell.ownerId === corp.id).toBe(true);
  });

  it('recruitmentQueue carries RecruitmentItem { type: UnitType, weeksLeft: number }', () => {
    const item: RecruitmentItem = { type: 'circle', weeksLeft: 2 };
    const cell: MapCell = { ...baseCell, ownerId: null, recruitmentQueue: [item] };
    expect(cell.recruitmentQueue).toHaveLength(1);
    expect(cell.recruitmentQueue[0].type).toBe('circle');
    expect(cell.recruitmentQueue[0].weeksLeft).toBe(2);
  });

  it('publicOpinion is optional', () => {
    const cell: MapCell = { ...baseCell, ownerId: null };
    expect(cell.publicOpinion).toBeUndefined();
    const withOpinion: MapCell = { ...baseCell, ownerId: null, publicOpinion: 55 };
    expect(withOpinion.publicOpinion).toBe(55);
  });
});

describe('test_componentTypes_transit_and_date_contracts', () => {
  it('UnitTransit tracks daysLeft against totalDays between two cell ids', () => {
    const transit: UnitTransit = {
      id: 'transit-1',
      corpId: 'corp-1',
      originCellId: 1,
      targetCellId: 7,
      units: { circle: 2, square: 0, triangle: 1 },
      totalDays: 5,
      daysLeft: 2,
    };
    expect(transit.daysLeft).toBeLessThanOrEqual(transit.totalDays);
    expect(transit.originCellId).not.toBe(transit.targetCellId);
  });

  it('GameDate carries the year/month/week/day fields the cadence widget renders', () => {
    const date: GameDate = { year: 2, month: 4, week: 3, day: 6 };
    // BoardroomHeader renders 12 month ticks, 4 week ticks, 7 day ticks.
    expect(date.month).toBeGreaterThanOrEqual(1);
    expect(date.month).toBeLessThanOrEqual(12);
    expect(date.week).toBeGreaterThanOrEqual(1);
    expect(date.week).toBeLessThanOrEqual(4);
    expect(date.day).toBeGreaterThanOrEqual(1);
    expect(date.day).toBeLessThanOrEqual(7);
  });
});

describe('test_componentTypes_event_contract', () => {
  it('GameEventChoice.action has the (state, cellId) => { log, stateUpdates } signature', () => {
    const choice: GameEventChoice = {
      text: 'Bribe the inspectors',
      cost: 500,
      effectText: 'The audit goes away',
      action: (state, cellId) => ({
        log: `bribed at cell ${cellId}`,
        stateUpdates: { ...state, bribed: true },
      }),
    };
    const event: GameEvent = {
      id: 'evt-1',
      title: 'Surprise Audit',
      description: 'Inspectors have arrived.',
      targetCellId: 7,
      choices: [choice],
    };
    const result = event.choices[0].action({ treasury: 1000 }, event.targetCellId);
    expect(result.log).toBe('bribed at cell 7');
    expect(result.stateUpdates.bribed).toBe(true);
  });

  it('unitsCost is optional; DailyEventModal treats its absence as meeting the unit cost', () => {
    const freeChoice: GameEventChoice = {
      text: 'Do nothing',
      cost: 0,
      effectText: 'Nothing changes',
      action: () => ({ log: 'ignored', stateUpdates: {} }),
    };
    expect(!freeChoice.unitsCost).toBe(true);

    const unitChoice: GameEventChoice = {
      text: 'Deploy enforcers',
      cost: 0,
      unitsCost: { circle: 2, square: 0, triangle: 1 },
      effectText: 'Spend units to resolve',
      action: () => ({ log: 'deployed', stateUpdates: {} }),
    };
    expect(unitChoice.unitsCost?.circle).toBe(2);
  });
});

/**
 * The module header documents the contract: "Each game's own types.ts should
 * be structurally compatible with these (or re-export them)." Planet of Greed
 * is the known consumer — its Corporation extends the base and its MapCell is
 * the shared MapCell verbatim.
 */
describe('test_componentTypes_consumer_compatibility', () => {
  it('Planet of Greed Corporation is assignable to the shared Corporation', () => {
    const pogCorp: PogCorporation = {
      id: 'house-ember',
      name: 'House Ember',
      color: '#ff5500',
      borderColor: '#220000',
      bgClass: 'bg-orange-600',
      textClass: 'text-orange-100',
      isPlayer: false,
      treasury: 900,
      scoutedCells: {},
      rank: 1,
      fragments: ['ember'],
      cultureId: 'ember',
    };
    const asShared: Corporation = pogCorp;
    expect(asShared.name).toBe('House Ember');
    expect(asShared.rank).toBe(1);
  });

  it('Planet of Greed MapCell is identical to the shared MapCell', () => {
    expectTypeOf<PogMapCell>().toEqualTypeOf<MapCell>();
  });
});
