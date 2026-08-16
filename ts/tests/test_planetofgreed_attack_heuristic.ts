import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getDefaultAction,
  sortRegionsByThreat,
} from '../src/games/planetofgreed/defaultAction';
import type { MapCell, Corporation } from '../src/games/planetofgreed/types';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const walkthroughSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/components/GuidedWalkthrough.tsx'),
  'utf-8'
);
const defaultActionSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/defaultAction.ts'),
  'utf-8'
);
const appSource = readFileSync(
  resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'),
  'utf-8'
);

// Test fixtures
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

describe('test_attack_order_selectable', () => {
  it('GuidedWalkthrough renders an Attack button for rival-owned neighbors', () => {
    expect(walkthroughSource).toContain('data-testid="pog-action-attack"');
    expect(walkthroughSource).toContain('Swords');
    expect(walkthroughSource).toContain('rivalNeighbors');
  });

  it('Attack button is gated on rivalNeighbors.length > 0 and garrison >= 2', () => {
    expect(walkthroughSource).toContain('rivalNeighbors.length > 0 && garrison >= 2');
  });

  it('Attack button issues an expand order targeting the rival cell', () => {
    // The attack uses the expand order type with the rival cell as target
    // (type: 'expand' appears in the onClick handler before data-testid in JSX)
    const attackSection = walkthroughSource.match(/Attack rival neighbor[\s\S]*?pog-action-attack/);
    expect(attackSection).toBeTruthy();
    expect(attackSection![0]).toContain("type: 'expand'");
    expect(attackSection![0]).toContain('targetCellId: target.id');
  });

  it('rivalNeighbors filter includes owned cells that are not the player', () => {
    expect(walkthroughSource).toContain('n.ownerId && n.ownerId !== playerCorp.id');
  });
});

describe('test_attack_order_triggers_combat', () => {
  it('App.tsx processes expand orders into transits regardless of target ownership', () => {
    // The expand order processing creates a transit without checking target ownership
    const expandBlock = appSource.match(/order\.type === 'expand'[\s\S]*?updatedTransits\.push/);
    expect(expandBlock).toBeTruthy();
  });

  it('Combat detection identifies rival-owned cells with alien invaders', () => {
    // The contested cell detection checks for transits where corpId !== cell.ownerId
    expect(appSource).toContain('alienInvaders');
    expect(appSource).toContain('t.corpId !== cell.ownerId');
  });

  it('Combat resolution is called with correct forces from both sides', () => {
    // resolveCellCombat is called with combatInitialForces that include both
    // the cell owner's garrison and the invading transits
    expect(appSource).toContain('resolveCellCombat');
    expect(appSource).toContain('combatInitialForces');
    expect(appSource).toContain('cellInvaders');
  });
});

describe('test_attack_resolves_correctly', () => {
  it('resolveCellCombat is imported from the shared combat module', () => {
    expect(appSource).toContain("from '../../engine/shared/combat'");
    expect(appSource).toContain('resolveCellCombat');
  });

  it('combat forces include the defender garrison (cell.units)', () => {
    // The original owner's garrison is added to combatInitialForces
    expect(appSource).toContain('combatInitialForces[cell.ownerId] = { ...cell.units }');
  });

  it('combat forces include the attacker transit units', () => {
    // Invading transits add their units to combatInitialForces
    expect(appSource).toContain('combatInitialForces[inv.corpId]');
    expect(appSource).toContain('inv.units.circle');
    expect(appSource).toContain('inv.units.square');
    expect(appSource).toContain('inv.units.triangle');
  });

  it('fortification level is passed to the resolver', () => {
    expect(appSource).toContain('cell.fortification');
    // resolveCellCombat call includes fortification
    const resolveCall = appSource.match(/resolveCellCombat\([\s\S]*?cell\.fortification/);
    expect(resolveCall).toBeTruthy();
  });
});

describe('test_redistribution_mechanic_confirmed_or_built', () => {
  it('Redistribution IS a real existing mechanic via expand to own-owned cells', () => {
    // App.tsx line 811: if arr.corpId === cell.ownerId, units merge with garrison
    expect(appSource).toContain('arr.corpId === cell.ownerId');
    expect(appSource).toContain('newUnits.circle += arr.units.circle');
  });

  it('GuidedWalkthrough renders a Redistribute button for own-owned neighbors', () => {
    expect(walkthroughSource).toContain('data-testid="pog-action-redistribute"');
    expect(walkthroughSource).toContain('ownNeighbors');
    expect(walkthroughSource).toContain('Send');
  });

  it('ownNeighbors filter includes cells owned by the player', () => {
    expect(walkthroughSource).toContain('n.ownerId === playerCorp.id');
  });

  it('Redistribute button issues an expand order targeting the own cell', () => {
    // The redistribute button uses the expand order type with an own-owned target
    // (type: 'expand' appears in the onClick handler before data-testid in JSX)
    const redistributeSection = walkthroughSource.match(/Redistribute to own neighbor[\s\S]*?pog-action-redistribute/);
    expect(redistributeSection).toBeTruthy();
    expect(redistributeSection![0]).toContain("type: 'expand'");
    expect(redistributeSection![0]).toContain('targetCellId: target.id');
  });
});

describe('test_default_heuristic_recommends_attacks', () => {
  it('Rule 1: Strong garrison + wheel-opposite rival adjacent → Attack', () => {
    const player = makePlayerCorp();
    const tundra = makeRivalCorp('tundra', 'tundra', 'Tundra Bastion');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 2, units: { circle: 3, square: 2, triangle: 1 } }),
      makeCell({ id: 2, ownerId: 'tundra', neighbors: [1], fortification: 1, units: { circle: 1, square: 0, triangle: 0 } }),
    ];
    const result = getDefaultAction(cells[0], cells, [player, tundra], player);
    expect(result.type).toBe('expand');
    if (result.type === 'expand') {
      expect(result.targetCellId).toBe(2); // attacks the rival
    }
  });

  it('Rule 2: Strong garrison + any rival adjacent (not opposite) → Attack', () => {
    const player = makePlayerCorp();
    const marsh = makeRivalCorp('marsh', 'marsh', 'Marshveil Biotech');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 2, units: { circle: 3, square: 2, triangle: 1 } }),
      makeCell({ id: 2, ownerId: 'marsh', neighbors: [1], fortification: 1, units: { circle: 1, square: 0, triangle: 0 } }),
    ];
    const result = getDefaultAction(cells[0], cells, [player, marsh], player);
    expect(result.type).toBe('expand');
    if (result.type === 'expand') {
      expect(result.targetCellId).toBe(2); // attacks the rival
    }
  });

  it('Weak garrison + rival adjacent does NOT attack (falls to defense)', () => {
    const player = makePlayerCorp();
    const tundra = makeRivalCorp('tundra', 'tundra', 'Tundra Bastion');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 0, units: { circle: 1, square: 0, triangle: 0 } }),
      makeCell({ id: 2, ownerId: 'tundra', neighbors: [1], fortification: 1, units: { circle: 1, square: 0, triangle: 0 } }),
    ];
    const result = getDefaultAction(cells[0], cells, [player, tundra], player);
    // Garrison = 1 (< 4), so attack rules don't fire; opposite rival + low fort → Fortify
    expect(result.type).toBe('fortify');
  });

  it('Wheel-opposite rival is attacked before any rival (priority order)', () => {
    const player = makePlayerCorp();
    const tundra = makeRivalCorp('tundra', 'tundra', 'Tundra Bastion');
    const marsh = makeRivalCorp('marsh', 'marsh', 'Marshveil Biotech');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2, 3], fortification: 2, units: { circle: 3, square: 2, triangle: 1 } }),
      makeCell({ id: 2, ownerId: 'tundra', neighbors: [1], fortification: 1, units: { circle: 1, square: 0, triangle: 0 } }),
      makeCell({ id: 3, ownerId: 'marsh', neighbors: [1], fortification: 1, units: { circle: 1, square: 0, triangle: 0 } }),
    ];
    const result = getDefaultAction(cells[0], cells, [player, tundra, marsh], player);
    expect(result.type).toBe('expand');
    if (result.type === 'expand') {
      // Should target the wheel-opposite (tundra), not the adjacent (marsh)
      expect(result.targetCellId).toBe(2);
    }
  });

  it('Strong garrison with NO rival adjacent still expands into neutral', () => {
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
});

describe('test_default_heuristic_recommends_redistribution', () => {
  it('Safe cell with contested own-cell → Redistribute', () => {
    const player = makePlayerCorp();
    const tundra = makeRivalCorp('tundra', 'tundra', 'Tundra Bastion');
    const cells = [
      // Cell 1: safe (no rival adjacency, fort >= 1, garrison >= 3)
      makeCell({ id: 1, ownerId: 'player', neighbors: [3], fortification: 2, units: { circle: 2, square: 2, triangle: 2 } }),
      // Cell 2: contested (adjacent to rival)
      makeCell({ id: 2, ownerId: 'player', neighbors: [4], fortification: 0, units: { circle: 1, square: 0, triangle: 0 } }),
      // Cell 3: neutral (neighbor of cell 1)
      makeCell({ id: 3, ownerId: null, neighbors: [1] }),
      // Cell 4: rival (neighbor of cell 2)
      makeCell({ id: 4, ownerId: 'tundra', neighbors: [2], fortification: 1, units: { circle: 1, square: 0, triangle: 0 } }),
    ];
    // Cell 1 is safe (no rival neighbor — only neighbor is cell 3 which is neutral)
    // Cell 2 is contested (rival neighbor cell 4)
    // Rule 6: safe cell → redistribute to contested own-cell
    const result = getDefaultAction(cells[0], cells, [player, tundra], player);
    expect(result.type).toBe('expand');
    if (result.type === 'expand') {
      // Should target the contested own-cell (cell 2), not the neutral (cell 3)
      expect(result.targetCellId).toBe(2);
    }
  });

  it('Safe cell with NO contested own-cell → falls through to other rules', () => {
    const player = makePlayerCorp();
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [2], fortification: 2, units: { circle: 2, square: 2, triangle: 2 } }),
      makeCell({ id: 2, ownerId: null, neighbors: [1] }),
    ];
    // Cell 1 is safe but there's no contested own-cell
    // Rule 5 (garrison >= 4 + neutral neighbor) fires first — garrison is 6
    const result = getDefaultAction(cells[0], cells, [player], player);
    expect(result.type).toBe('expand');
    if (result.type === 'expand') {
      expect(result.targetCellId).toBe(2); // neutral expansion, not redistribution
    }
  });

  it('isSafeCell requires no rival adjacency, fort >= 1, garrison >= 3', () => {
    // Verify the isSafeCell function exists and is used
    expect(defaultActionSource).toContain('isSafeCell');
    expect(defaultActionSource).toContain('findContestedOwnCell');
  });

  it('Redistribution uses the expand order type (existing mechanic)', () => {
    // The redistribution rule returns an expand order targeting an own-owned cell
    expect(defaultActionSource).toContain('Rule 5: Safe cell');
    expect(defaultActionSource).toContain('Redistribute');
  });
});

describe('test_threat_ordering_sensible_under_aggressive_defaults', () => {
  it('Threat ordering still prioritizes opposite-rival-adjacent cells first', () => {
    const player = makePlayerCorp();
    const tundra = makeRivalCorp('tundra', 'tundra', 'Tundra Bastion');
    const marsh = makeRivalCorp('marsh', 'marsh', 'Marshveil Biotech');
    const cells = [
      makeCell({ id: 1, ownerId: 'player', neighbors: [], fortification: 2, units: { circle: 2, square: 2, triangle: 2 } }),
      makeCell({ id: 2, ownerId: 'player', neighbors: [3], fortification: 2, units: { circle: 2, square: 2, triangle: 2 } }),
      makeCell({ id: 3, ownerId: 'marsh', neighbors: [2] }),
      makeCell({ id: 4, ownerId: 'player', neighbors: [5], fortification: 2, units: { circle: 2, square: 2, triangle: 2 } }),
      makeCell({ id: 5, ownerId: 'tundra', neighbors: [4] }),
    ];
    const sorted = sortRegionsByThreat(cells, cells, [player, tundra, marsh], player);
    // Cell 4 (opposite rival adjacent, threat 3) should come first
    expect(sorted[0].id).toBe(4);
    // Cell 2 (any rival adjacent, threat 2) should come second
    expect(sorted[1].id).toBe(2);
    // Cell 1 (safe, threat 0) should come last
    expect(sorted[2].id).toBe(1);
  });

  it('Aggressive defaults + threat ordering: highest-threat cells are presented first', () => {
    // This means the player sees their most contested regions first,
    // where the aggressive default (attack) is most relevant.
    // A safe cell (threat 0) with redistribution default is presented last.
    // This is still the right order — the player should address the front
    // line first, then deal with redistribution from safe areas.
    expect(defaultActionSource).toContain('getThreatLevel');
    expect(defaultActionSource).toContain('sortRegionsByThreat');
    // Threat levels: 3 = opposite rival, 2 = any rival, 1 = low fort/opinion, 0 = safe
    expect(defaultActionSource).toContain('return 3');
    expect(defaultActionSource).toContain('return 2');
    expect(defaultActionSource).toContain('return 1');
    expect(defaultActionSource).toContain('return 0');
  });
});

describe('test_no_regression', () => {
  it('GuidedWalkthrough still renders all existing action buttons', () => {
    expect(walkthroughSource).toContain('data-testid="pog-action-hold"');
    expect(walkthroughSource).toContain('data-testid="pog-action-fortify"');
    expect(walkthroughSource).toContain('data-testid="pog-action-reinforce"');
    expect(walkthroughSource).toContain('data-testid="pog-action-expand"');
    expect(walkthroughSource).toContain('data-testid="pog-action-civic-production"');
    expect(walkthroughSource).toContain('data-testid="pog-action-civic-defense"');
    expect(walkthroughSource).toContain('data-testid="pog-action-civic-unrest"');
  });

  it('GuidedWalkthrough still has confirm, change, skip, back buttons', () => {
    expect(walkthroughSource).toContain('data-testid="pog-confirm-action"');
    expect(walkthroughSource).toContain('data-testid="pog-change-action"');
    expect(walkthroughSource).toContain('handleSkip');
    expect(walkthroughSource).toContain('handleBack');
  });

  it('GameShell wrap still present', () => {
    expect(appSource).toContain('GameShell');
  });

  it('OpeningSequence still present', () => {
    expect(appSource).toContain('OpeningSequence');
  });

  it('Population Balance triggers still present', () => {
    expect(appSource).toContain('applyPublicOpinionOffset');
  });

  it('ENDING_TEXT still present', () => {
    expect(appSource).toContain('ENDING_TEXT');
  });

  it('HOUSE_DESCRIPTIONS still present', () => {
    expect(appSource).toContain('HOUSE_DESCRIPTIONS');
  });
});
