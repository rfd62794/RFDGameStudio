import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getDefaultAction,
  getThreatLevel,
  sortRegionsByThreat,
} from '../src/games/planetofgreed/defaultAction';
import { HOUSE_DESCRIPTIONS, ENDING_TEXT, EVENT_FLAVOR_NOTE } from '../src/games/planetofgreed/flavorText';
import type { MapCell, Corporation } from '../src/games/planetofgreed/types';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const appSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'),
  'utf-8'
);
const walkthroughSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/components/GuidedWalkthrough.tsx'),
  'utf-8'
);

// Test fixtures — minimal cells and corps for heuristic testing
function makeCell(overrides: Partial<MapCell> & { id: number }): MapCell {
  return {
    id: overrides.id,
    name: overrides.name ?? `Cell-${overrides.id}`,
    seed: { x: 0, y: 0 },
    polygon: [],
    neighbors: overrides.neighbors ?? [],
    ownerId: overrides.ownerId !== undefined ? overrides.ownerId : 'player',
    units: overrides.units ?? { circle: 0, square: 0, triangle: 0 },
    fortification: overrides.fortification ?? 0,
    recruitmentQueue: [],
    preferredProduction: overrides.preferredProduction ?? 'circle',
    productionProgress: 0,
    publicOpinion: overrides.publicOpinion ?? 50,
  };
}

function makePlayerCorp(overrides: Partial<Corporation> = {}): Corporation {
  return {
    id: 'player',
    name: 'Ember Ironworks',
    color: '#ef4444',
    borderColor: '#7f1d1d',
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
    isPlayer: true,
    treasury: overrides.treasury ?? 100000,
    scoutedCells: {},
    cultureId: 'ember',
    rank: 6,
    fragments: ['ember'],
  };
}

function makeRivalCorp(id: string, cultureId: any, name: string): Corporation {
  return {
    id,
    name,
    color: '#3b82f6',
    borderColor: '#1e3a8a',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
    isPlayer: false,
    treasury: 100000,
    scoutedCells: {},
    cultureId,
    rank: 1,
    fragments: [cultureId],
  };
}

describe('test_guided_walkthrough_visits_every_region', () => {
  it('sortRegionsByThreat returns all owned cells, none skipped', () => {
    const player = makePlayerCorp();
    const cells = [
      makeCell({ id: 1, ownerId: 'player' }),
      makeCell({ id: 2, ownerId: 'player' }),
      makeCell({ id: 3, ownerId: 'rival1' }),
      makeCell({ id: 4, ownerId: 'player' }),
      makeCell({ id: 5, ownerId: null }),
    ];
    const corps = [player, makeRivalCorp('rival1', 'tundra', 'Tundra Bastion')];

    const result = sortRegionsByThreat(cells, cells, corps, player);
    expect(result).toHaveLength(3);
    expect(result.every(c => c.ownerId === 'player')).toBe(true);
    // All player cells present, no skipping
    const ids = result.map(c => c.id).sort();
    expect(ids).toEqual([1, 2, 4]);
  });

  it('walkthrough component iterates through all regions via index', () => {
    // Structural test: the component uses currentRegionIndex to step
    // through ownedRegions, and calls onAllRegionsProcessed when done.
    expect(walkthroughSource).toContain('currentRegionIndex');
    expect(walkthroughSource).toContain('ownedRegions.length');
    expect(walkthroughSource).toContain('onAllRegionsProcessed');
    expect(walkthroughSource).toContain('Region {currentRegionIndex + 1} of {ownedRegions.length}');
  });
});

describe('test_default_action_heuristic_justified', () => {
  it('Rule 1: opposite rival adjacent + low fort → Fortify', () => {
    // Ember's opposite is Tundra. If Tundra is next door and fort < 2 → Fortify.
    const player = makePlayerCorp();
    const tundra = makeRivalCorp('tundra', 'tundra', 'Tundra Bastion');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 0 }),
      makeCell({ id: 2, ownerId: 'tundra', neighbors: [1] }),
    ];
    const result = getDefaultAction(cells[0], cells, [player, tundra], player);
    expect(result.type).toBe('fortify');
  });

  it('Rule 2: any rival adjacent + low garrison → Reinforce', () => {
    // Not opposite rival (Marsh is adjacent on wheel), low garrison → Reinforce
    const player = makePlayerCorp();
    const marsh = makeRivalCorp('marsh', 'marsh', 'Marshveil Biotech');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 2, units: { circle: 1, square: 0, triangle: 0 } }),
      makeCell({ id: 2, ownerId: 'marsh', neighbors: [1] }),
    ];
    const result = getDefaultAction(cells[0], cells, [player, marsh], player);
    expect(result.type).toBe('reinforce');
    if (result.type === 'reinforce') {
      expect(result.reinforceType).toBe('circle'); // preferredProduction
    }
  });

  it('Rule 3: strong garrison + neutral neighbor → Expand', () => {
    const player = makePlayerCorp();
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 2, units: { circle: 3, square: 2, triangle: 1 } }),
      makeCell({ id: 2, ownerId: null, neighbors: [1] }),
    ];
    const result = getDefaultAction(cells[0], cells, [player], player);
    expect(result.type).toBe('expand');
    if (result.type === 'expand') {
      expect(result.targetCellId).toBe(2);
    }
  });

  it('Rule 4: low public opinion → Civic Unrest', () => {
    const player = makePlayerCorp();
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [], fortification: 2, units: { circle: 2, square: 2, triangle: 2 }, publicOpinion: 25 }),
    ];
    const result = getDefaultAction(cells[0], cells, [player], player);
    expect(result.type).toBe('civic');
    if (result.type === 'civic') {
      expect(result.focus).toBe('unrest');
    }
  });

  it('Rule 5: low fortification + can afford → Fortify', () => {
    const player = makePlayerCorp();
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [], fortification: 0, units: { circle: 2, square: 2, triangle: 2 }, publicOpinion: 50 }),
    ];
    const result = getDefaultAction(cells[0], cells, [player], player);
    expect(result.type).toBe('fortify');
  });

  it('Rule 6: safe region → Hold', () => {
    const player = makePlayerCorp();
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [], fortification: 2, units: { circle: 2, square: 2, triangle: 2 }, publicOpinion: 50 }),
    ];
    const result = getDefaultAction(cells[0], cells, [player], player);
    expect(result.type).toBe('hold');
  });

  it('treasury affordability: falls through if cannot afford', () => {
    // Fortify costs $20k, Reinforce $30k, Civic Unrest $10k
    // Player has $5k, cell is low-fort with no rivals → would default
    // to Fortify but can't afford → falls to Hold
    const player = makePlayerCorp({ treasury: 5000 });
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [], fortification: 0, units: { circle: 2, square: 2, triangle: 2 }, publicOpinion: 50 }),
    ];
    const result = getDefaultAction(cells[0], cells, [player], player);
    expect(result.type).toBe('hold');
  });

  it('threat level: opposite rival neighbor = 3 (highest)', () => {
    const player = makePlayerCorp();
    const tundra = makeRivalCorp('tundra', 'tundra', 'Tundra Bastion');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 2 }),
      makeCell({ id: 2, ownerId: 'tundra', neighbors: [1] }),
    ];
    expect(getThreatLevel(cells[0], cells, [player, tundra], player)).toBe(3);
  });

  it('threat level: any rival neighbor = 2', () => {
    const player = makePlayerCorp();
    const marsh = makeRivalCorp('marsh', 'marsh', 'Marshveil Biotech');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 2 }),
      makeCell({ id: 2, ownerId: 'marsh', neighbors: [1] }),
    ];
    expect(getThreatLevel(cells[0], cells, [player, marsh], player)).toBe(2);
  });

  it('threat level: low fort or opinion = 1', () => {
    const player = makePlayerCorp();
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [], fortification: 0, publicOpinion: 50 }),
    ];
    expect(getThreatLevel(cells[0], cells, [player], player)).toBe(1);
  });

  it('threat level: safe = 0', () => {
    const player = makePlayerCorp();
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [], fortification: 2, publicOpinion: 50 }),
    ];
    expect(getThreatLevel(cells[0], cells, [player], player)).toBe(0);
  });
});

describe('test_confirm_and_change_both_work', () => {
  it('confirm path: saves default action and advances', () => {
    // Structural: the component has a confirm button that saves the
    // active order and advances to the next region.
    expect(walkthroughSource).toContain('handleConfirm');
    expect(walkthroughSource).toContain('onSaveOrders');
    expect(walkthroughSource).toContain('data-testid="pog-confirm-action"');
  });

  it('change path: opens full action set and lets player pick', () => {
    expect(walkthroughSource).toContain('showFullActions');
    expect(walkthroughSource).toContain('handleSelectCustomAction');
    expect(walkthroughSource).toContain('data-testid="pog-change-action"');
    expect(walkthroughSource).toContain('data-testid="pog-action-hold"');
    expect(walkthroughSource).toContain('data-testid="pog-action-fortify"');
    expect(walkthroughSource).toContain('data-testid="pog-action-reinforce"');
    expect(walkthroughSource).toContain('data-testid="pog-action-expand"');
    expect(walkthroughSource).toContain('data-testid="pog-action-civic-production"');
    expect(walkthroughSource).toContain('data-testid="pog-action-civic-defense"');
    expect(walkthroughSource).toContain('data-testid="pog-action-civic-unrest"');
  });

  it('skip path: saves Hold explicitly', () => {
    expect(walkthroughSource).toContain('handleSkip');
    expect(walkthroughSource).toContain("type: 'hold'");
  });

  it('back path: returns to previous region', () => {
    expect(walkthroughSource).toContain('handleBack');
  });
});

describe('test_population_balance_triggers_defined', () => {
  it('Civic Unrest Focus raises Population Balance by +8', () => {
    expect(appSource).toContain("applyPublicOpinionOffset(updatedCells[cellIndex], 8)");
  });

  it('Civic Production Focus lowers Population Balance by -2', () => {
    expect(appSource).toContain("applyPublicOpinionOffset(updatedCells[cellIndex], -2)");
  });

  it('Civic Defense Focus lowers Population Balance by -1', () => {
    expect(appSource).toContain("applyPublicOpinionOffset(updatedCells[cellIndex], -1)");
  });

  it('Expand order lowers Population Balance by -3 on target cell', () => {
    expect(appSource).toContain("applyPublicOpinionOffset(updatedCells[targetIdx], -3)");
  });

  it('Combat resolution lowers Population Balance by -5', () => {
    expect(appSource).toContain("applyPublicOpinionOffset(cell, -5)");
  });

  it('Passive erosion: cells drift toward 50 by 1 per week', () => {
    expect(appSource).toContain("current > 50");
    expect(appSource).toContain("cell.publicOpinion = current - 1");
    expect(appSource).toContain("current < 50");
    expect(appSource).toContain("cell.publicOpinion = current + 1");
  });

  it('Low opinion threshold: cells with opinion <30 produce no income', () => {
    expect(appSource).toContain("(cell.publicOpinion ?? 50) >= 30");
  });

  it('computeRank formula uses territory * 10 + avgPublicOpinion', () => {
    expect(appSource).toContain("territory * 10 + avgPublicOpinion");
  });

  it('Population Balance is clamped to [0, 100]', () => {
    expect(appSource).toContain("Math.max(0, Math.min(100, current + offset))");
  });

  it('Population Balance initializes to 50 on every cell', () => {
    expect(appSource).toContain("cell.publicOpinion = 50");
  });
});

describe('test_flavor_text_matches_locked_narrative', () => {
  it('all six Houses have descriptions', () => {
    const cultures = ['ember', 'marsh', 'gale', 'tundra', 'crystal', 'tide'] as const;
    for (const c of cultures) {
      expect(HOUSE_DESCRIPTIONS[c]).toBeTruthy();
      expect(HOUSE_DESCRIPTIONS[c].length).toBeGreaterThan(50);
    }
  });

  it('House descriptions reference Genesis Ore or the Engine', () => {
    // The locked narrative centers on Genesis Ore and the Seed Engine
    const allText = Object.values(HOUSE_DESCRIPTIONS).join(' ');
    expect(allText).toMatch(/Ore|Engine/i);
  });

  it('House descriptions reflect different relationships to the Ore', () => {
    // True believers, cynical exploiters, suspicious Houses
    const allText = Object.values(HOUSE_DESCRIPTIONS).join(' ').toLowerCase();
    // At least one House believes, at least one is cynical
    expect(allText).toMatch(/believe|suspect|cynical|exploit|worship|understand/i);
  });

  it('ENDING_TEXT has real content, not placeholder', () => {
    expect(ENDING_TEXT.title).toBe('The Seed Engine Fires');
    expect(ENDING_TEXT.body).toContain('arrest');
    expect(ENDING_TEXT.body).toContain('President');
    expect(ENDING_TEXT.fragmentComplete).toContain('Echo wakes whole');
    expect(ENDING_TEXT.fragmentIncomplete).toContain('Echo wakes with gaps');
  });

  it('ENDING_TEXT references the Black Hole (locked narrative)', () => {
    expect(ENDING_TEXT.subtitle).toContain('Black Hole');
  });

  it('EVENT_FLAVOR_NOTE carries Signal presence', () => {
    expect(EVENT_FLAVOR_NOTE).toMatch(/signal/i);
    expect(EVENT_FLAVOR_NOTE.length).toBeGreaterThan(50);
  });

  it('App.tsx uses ENDING_TEXT for the ending screen', () => {
    expect(appSource).toContain('ENDING_TEXT.title');
    expect(appSource).toContain('ENDING_TEXT.body');
    expect(appSource).toContain('ENDING_TEXT.fragmentComplete');
    expect(appSource).toContain('ENDING_TEXT.fragmentIncomplete');
  });

  it('App.tsx uses HOUSE_DESCRIPTIONS on culture selection screen', () => {
    expect(appSource).toContain('HOUSE_DESCRIPTIONS');
  });
});

describe('test_no_regression', () => {
  it('guided walkthrough is rendered during planning phase', () => {
    expect(appSource).toContain('GuidedWalkthrough');
    expect(appSource).toContain('isPlanningPhase');
  });

  it('WeeklyOrdersPanel still available outside planning phase', () => {
    // The free-form panel is kept for non-planning inspection
    expect(appSource).toContain('WeeklyOrdersPanel');
  });

  it('BoardroomHeader uses dark corporate identity (not light)', () => {
    const headerSource = readFileSync(
      resolve(repoRoot, 'ts/src/engine/shared/components/BoardroomHeader.tsx'),
      'utf-8'
    );
    expect(headerSource).toContain('#1a1a2e');
    expect(headerSource).toContain('amber-');
  });

  it('ending screen uses dark identity with amber accents', () => {
    expect(appSource).toContain('#1a1a2e');
    expect(appSource).toContain('amber-600');
  });

  it('CORPWORLD branding is not present anywhere', () => {
    expect(appSource).not.toContain('CORPWORLD');
    expect(appSource).not.toContain('BOOTING CORPWORLD');
  });

  it('Rank display uses corporations.length (dynamic, not hardcoded)', () => {
    const headerSource = readFileSync(
      resolve(repoRoot, 'ts/src/engine/shared/components/BoardroomHeader.tsx'),
      'utf-8'
    );
    expect(headerSource).toContain('corporations.length');
    expect(headerSource).not.toContain('/ 5');
  });

  it('Fragment counter is present in header', () => {
    const headerSource = readFileSync(
      resolve(repoRoot, 'ts/src/engine/shared/components/BoardroomHeader.tsx'),
      'utf-8'
    );
    expect(headerSource).toContain('fragment-counter');
    expect(headerSource).toContain('FRAGMENTS');
  });
});
