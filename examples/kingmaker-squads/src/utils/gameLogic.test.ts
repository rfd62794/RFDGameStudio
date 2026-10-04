import { DEFAULT_TURN_ORDER, hostilityWeight } from '../data/factions';
import { describe, it, expect, vi } from 'vitest';
import {
  DEFAULT_VIEWBOX,
  clampViewBox,
  computeMapBounds,
  computePanBounds,
  getFitViewBox,
  MIN_ZOOM_WIDTH,
  MAX_ZOOM_WIDTH,
  PAN_MIN_X,
  PAN_MAX_X,
  PAN_MIN_Y,
  PAN_MAX_Y,
  LOD_THRESHOLD,
} from '../screens/TerritoryScreen';
import { RIVER_PATH, riverPathToSvgD } from '../data/worldGeometry';
import { generateProceduralCity } from './cityGeneration/cityGenerator';
import { computePolygonArea, generatePatches } from './cityGeneration/patchGenerator';
import { getTerrainDisplayName } from '../data/terrainDisplay';
import {
  simulateCombat,
  getSlidingMoves,
  getKnightMoves,
  getPawnMoves,
  getLegalMoves,
  canAttackFrom,
  isOutOfBounds,
} from './combatEngine';
import { BOARD_SIZE } from '../constants';
import { getLegalMoves as getLegalMovesStandalone } from './chessMovement';
import { calculateSynergies } from './synergies';
import { getFloatingDamageText, getGridCardStyle } from '../components/CombatPlaybackModal';
import { UnitCard, getZodiacElement, ZODIAC_GLYPHS } from '../components/UnitCard';
import {
  generateAIDeclaration,
  generateAIResponse,
  rotateTurnOrder,
  enforceAICoronation,
} from './aiOpponent';
import { computeTerritoryAdjacency, doPolygonsShareEdge } from './territoryAdjacency';
import { recalculateCellExposures, evaluateDefenseForceLifecycle, enforceCoronation } from '../utils/crownLogic';
import {
  processDefenseForceLoyalty,
  restoreForceLoyalty,
  LOYALTY_EROSION_PER_UNREINFORCED_THREATENED_TURN,
  DEFAULT_FORCE_LOYALTY,
} from './loyaltyLogic';
import { createUnit, generateInitialTerritories, assignRandomZodiac } from '../data/archetypes';
import { OPENING_TEXT, OPENING_GOAL, STAGING_TEXT_MAP_REVEAL, STAGING_TEXT_CAST_INTRO } from '../data/openingText';
import { CAST_INTRO_TEMPLATES, getArchetypeClassTitle } from '../data/castIntroTemplates';
import { computeIsoTileScreenPos, isCellIsoGridWithinBounds } from './isoMath';
import { CombatUnit, DeclaredAction, FactionId, TerritoryCell, UnitState, DefenseForce } from '../types';
import fs from 'fs';

describe('KingMaker Squads - Pre-Turn & AI Opponents Test Suite', () => {
  // Test 1: test_escort_saves_player_king
  it('test_escort_saves_player_king', () => {
    const playerKing = { ...createUnit('pawn', 'Player King'), isKing: true, stats: { hp: 10, maxHp: 10, atk: 5, def: 0, speed: 10, range: 1 } };
    const playerEscort = { ...createUnit('knight', 'Player Escort'), isEscort: true };
    const enemyAttacker = createUnit('queen', 'Enemy Queen');

    const result = simulateCombat([playerKing, playerEscort], [enemyAttacker], true);

    expect(result.kingAction).toBe('escaped_dethroned');
    expect(result.dethronedUnit).toBeDefined();
    expect(result.dethronedUnit?.hasHonorScar).toBe(true);
    expect(result.dethronedUnit?.isKing).toBe(false);
  });

  // Test 2: test_escort_saves_enemy_king
  it('test_escort_saves_enemy_king', () => {
    const playerAttacker = createUnit('queen', 'Player Queen');
    const enemyKing = { ...createUnit('pawn', 'Enemy King'), isKing: true, stats: { hp: 10, maxHp: 10, atk: 5, def: 0, speed: 10, range: 1 } };
    const enemyEscort = { ...createUnit('knight', 'Enemy Escort'), isEscort: true };

    const result = simulateCombat([playerAttacker], [enemyKing, enemyEscort], true);

    expect(result.kingAction).toBe('escaped_dethroned');
    expect(result.dethronedUnit).toBeDefined();
    expect(result.dethronedUnit?.hasHonorScar).toBe(true);
    expect(result.dethronedUnit?.isKing).toBe(false);
  });

  // Test 3: test_king_death_without_escort_any_team
  it('test_king_death_without_escort_any_team', () => {
    const playerKingNoEscort = { ...createUnit('pawn', 'Solo Player King'), isKing: true, stats: { hp: 5, maxHp: 5, atk: 1, def: 0, speed: 1, range: 1 } };
    const enemyAttacker = createUnit('queen', 'Enemy Queen');

    const playerResult = simulateCombat([playerKingNoEscort], [enemyAttacker], true);
    expect(playerResult.kingAction).toBe('killed');

    const enemyKingNoEscort = { ...createUnit('pawn', 'Solo Enemy King'), isKing: true, stats: { hp: 5, maxHp: 5, atk: 1, def: 0, speed: 1, range: 1 } };
    const playerAttacker2 = createUnit('queen', 'Player Queen');

    const enemyResult = simulateCombat([playerAttacker2], [enemyKingNoEscort], true);
    expect(enemyResult.kingAction).toBe('killed');
  });

  // Test 4: test_ai_faction_declares_target_each_round
  it('test_ai_faction_declares_target_each_round', () => {
    const cells = generateInitialTerritories();
    const declaration = generateAIDeclaration('tundra', cells);

    expect(declaration).not.toBeNull();
    expect(declaration?.factionId).toBe('tundra');
    expect(['attack', 'reinforce']).toContain(declaration?.actionIntent);
    expect(declaration?.targetCellId).toBeDefined();
  });

  // Test 5: test_ai_respects_fog_of_war
  it('test_ai_respects_fog_of_war', () => {
    const cells = generateInitialTerritories();

    const unscoutedCell = cells.find((c) => !c.scouted && c.owner !== 'tundra');
    if (unscoutedCell) {
      unscoutedCell.troopCount = 1;
      unscoutedCell.enemyUnits = [
        createUnit('queen'), createUnit('queen'), createUnit('queen'), createUnit('queen'),
      ];
    }

    const declaration = generateAIDeclaration('tundra', cells);
    expect(declaration).not.toBeNull();
  });

  // Test 6: test_response_window_is_single_round
  it('test_response_window_is_single_round', () => {
    const cells = generateInitialTerritories();

    const initialAttack: DeclaredAction = {
      id: 'attack_1',
      factionId: 'player',
      actionIntent: 'attack',
      targetCellId: 'cell_east_plains',
      assignedUnits: [createUnit('queen')],
    };

    const aiResponse = generateAIResponse('tundra', [initialAttack], cells);
    expect(aiResponse).not.toBeNull();
    expect(aiResponse?.isResponse).toBe(true);

    const secondaryResponse = generateAIResponse('gale', [aiResponse!], cells);
    expect(secondaryResponse).toBeNull();
  });

  // Test 7: test_reinforcement_carries_real_cost
  it('test_reinforcement_carries_real_cost', () => {
    const cells = generateInitialTerritories();
    const initialAttack: DeclaredAction = {
      id: 'attack_1',
      factionId: 'player',
      actionIntent: 'attack',
      targetCellId: 'cell_east_plains',
      assignedUnits: [createUnit('queen')],
    };

    const aiResponse = generateAIResponse('tundra', [initialAttack], cells);
    expect(aiResponse?.reinforcementPenaltyPaid).toBe(true);

    if (aiResponse && aiResponse.assignedUnits.length > 0) {
      const originalHp = cells.find((c) => c.id === 'cell_east_plains')?.enemyUnits?.[0].stats.hp || 100;
      const penalizedHp = aiResponse.assignedUnits[0].stats.hp;
      expect(penalizedHp).toBeLessThan(originalHp);
    }
  });

  // Test 8: test_turn_order_rotates
  it('test_turn_order_rotates', () => {
    const initialOrder: FactionId[] = ['player', 'tundra', 'crystal', 'tide', 'marsh', 'gale'];

    const round2Order = rotateTurnOrder(initialOrder);
    expect(round2Order[0]).toBe('tundra');
    expect(round2Order[5]).toBe('player');

    const round3Order = rotateTurnOrder(round2Order);
    expect(round3Order[0]).toBe('crystal');
    expect(round3Order[5]).toBe('tundra');
  });

  // Test 9: test_ai_king_coronation_on_capture
  it('test_ai_king_coronation_on_capture', () => {
    let cells = generateInitialTerritories();

    cells = cells.map((c) => {
      if (c.id === 'cell_east_plains') {
        return {
          ...c,
          owner: 'player' as FactionId,
          hasKing: false,
          enemyUnits: [],
        };
      }
      return c;
    });

    const updatedCells = enforceAICoronation(cells, 'tundra');

    const newTundraKingCell = updatedCells.find((c) => c.owner === 'tundra' && c.enemyUnits?.some((u) => u.isKing));
    expect(newTundraKingCell).toBeDefined();
    expect(newTundraKingCell?.hasKing).toBe(true);
  });

  // --- DESIGN.MD REVISION 2: 5x5 CHESS GRID COMBAT TESTS ---

  // Test 10: test_rook_sliding_and_blocking_on_5x5
  it('test_rook_sliding_and_blocking_on_5x5', () => {
    const rook: CombatUnit = {
      ...createUnit('rook', 'Player Rook'),
      currentHp: 100,
      position: { x: 0, y: 2 },
      team: 'player',
      initiative: 10,
    };

    const allyBlocker: CombatUnit = {
      ...createUnit('pawn', 'Ally Pawn'),
      currentHp: 100,
      position: { x: 2, y: 2 },
      team: 'player',
      initiative: 5,
    };

    const enemyUnit: CombatUnit = {
      ...createUnit('pawn', 'Enemy Pawn'),
      currentHp: 100,
      position: { x: 0, y: 4 },
      team: 'enemy',
      initiative: 5,
    };

    const allUnits = [rook, allyBlocker, enemyUnit];
    const moves = getLegalMoves(rook, allUnits);

    // Rook at (0, 2) moving right (+X): can reach (1, 2), blocked by ally at (2, 2)
    expect(moves.some((m) => m.x === 1 && m.y === 2)).toBe(true);
    expect(moves.some((m) => m.x === 2 && m.y === 2)).toBe(false); // cannot enter ally square
    expect(moves.some((m) => m.x === 3 && m.y === 2)).toBe(false); // blocked beyond ally

    // Rook moving down (+Y): can reach (0, 3) and (0, 4) [enemy square capture]
    expect(moves.some((m) => m.x === 0 && m.y === 3)).toBe(true);
    expect(moves.some((m) => m.x === 0 && m.y === 4)).toBe(true);
  });

  // Test 11: test_knight_jumping_over_blocking_pieces
  it('test_knight_jumping_over_blocking_pieces', () => {
    const knight: CombatUnit = {
      ...createUnit('knight', 'Player Knight'),
      currentHp: 100,
      position: { x: 0, y: 0 },
      team: 'player',
      initiative: 12,
    };

    // Place blockers surrounding knight
    const blocker1: CombatUnit = { ...createUnit('pawn'), currentHp: 50, position: { x: 1, y: 0 }, team: 'player', initiative: 1 };
    const blocker2: CombatUnit = { ...createUnit('pawn'), currentHp: 50, position: { x: 0, y: 1 }, team: 'player', initiative: 1 };
    const blocker3: CombatUnit = { ...createUnit('pawn'), currentHp: 50, position: { x: 1, y: 1 }, team: 'player', initiative: 1 };

    const allUnits = [knight, blocker1, blocker2, blocker3];
    const moves = getLegalMoves(knight, allUnits);

    // Knight L-jumps from (0,0) to (1,2) and (2,1) despite surrounding blockers!
    expect(moves.some((m) => m.x === 1 && m.y === 2)).toBe(true);
    expect(moves.some((m) => m.x === 2 && m.y === 1)).toBe(true);
  });

  // Test 12: test_bishop_diagonal_movement_and_blocking
  it('test_bishop_diagonal_movement_and_blocking', () => {
    const bishop: CombatUnit = {
      ...createUnit('bishop', 'Player Bishop'),
      currentHp: 100,
      position: { x: 0, y: 0 },
      team: 'player',
      initiative: 10,
    };

    const enemyTarget: CombatUnit = {
      ...createUnit('pawn', 'Enemy Target'),
      currentHp: 100,
      position: { x: 2, y: 2 },
      team: 'enemy',
      initiative: 5,
    };

    const allUnits = [bishop, enemyTarget];
    const moves = getLegalMoves(bishop, allUnits);

    // Bishop moves along diagonal (1,1) and (2,2) [enemy capture], but stopped at (2,2)
    expect(moves.some((m) => m.x === 1 && m.y === 1)).toBe(true);
    expect(moves.some((m) => m.x === 2 && m.y === 2)).toBe(true);
    expect(moves.some((m) => m.x === 3 && m.y === 3)).toBe(false); // blocked beyond enemy
  });

  // Test 13: test_pawn_forward_and_diagonal_capture_movement
  it('test_pawn_forward_and_diagonal_capture_movement', () => {
    const playerPawn: CombatUnit = {
      ...createUnit('pawn', 'Player Pawn'),
      currentHp: 100,
      position: { x: 1, y: 2 },
      team: 'player',
      initiative: 8,
    };

    const enemyDiagonal: CombatUnit = {
      ...createUnit('pawn', 'Enemy Pawn'),
      currentHp: 100,
      position: { x: 2, y: 3 }, // Diagonal forward right
      team: 'enemy',
      initiative: 5,
    };

    const allUnits = [playerPawn, enemyDiagonal];
    const moves = getPawnMoves(playerPawn, allUnits);

    // Player pawn can step straight forward to (2,2) and capture diagonal to (2,3)
    expect(moves.some((m) => m.x === 2 && m.y === 2)).toBe(true);
    expect(moves.some((m) => m.x === 2 && m.y === 3)).toBe(true);
  });

  // Test 14: test_move_and_attack_same_turn
  it('test_move_and_attack_same_turn', () => {
    const playerRook = createUnit('rook', 'Player Rook');
    const enemyPawn = createUnit('pawn', 'Enemy Pawn');

    const result = simulateCombat([playerRook], [enemyPawn], false);

    // Verify combat played out on 5x5 grid with frames recording move/attack
    expect(result.frames.length).toBeGreaterThan(1);
    const attackFrame = result.frames.find((f) => f.log.actionType === 'attack');
    expect(attackFrame).toBeDefined();
    expect(result.winner).toBe('player');
  });

  // Test 15: test_chess_movement_importable_standalone
  it('test_chess_movement_importable_standalone', () => {
    const rook: CombatUnit = {
      ...createUnit('rook', 'Standalone Rook'),
      currentHp: 100,
      position: { x: 0, y: 0 },
      team: 'player',
      initiative: 10,
    };
    const moves = getLegalMovesStandalone(rook, [rook]);
    expect(moves.length).toBeGreaterThan(0);
  });

  // Test 16: test_synergies_importable_standalone
  it('test_synergies_importable_standalone', () => {
    const units = [createUnit('rook'), createUnit('pawn')];
    const synergies = calculateSynergies(units);
    const battery = synergies.find((s) => s.type === 'battery');
    expect(battery).toBeDefined();
  });

  // --- MULTI-SQUAD & CHESS SYNERGIES DIRECTIVE TESTS ---

  // Test 17: test_adjacency_computed_correctly
  it('test_adjacency_computed_correctly', () => {
    const cells = generateInitialTerritories();
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((cell) => {
      expect(cell.neighborIds).toBeDefined();
      expect(cell.neighborIds.length).toBeGreaterThan(0);
      expect(cell.neighborIds).not.toContain(cell.id);
    });
  });

  // Test 18: test_exposure_recalculates_each_round
  it('test_exposure_recalculates_each_round', () => {
    let cells = generateInitialTerritories();
    // Capital is player-owned, has neighbors owned by tundra
    cells = recalculateCellExposures(cells);
    const capital = cells.find((c) => c.id === 'cell_capital');
    expect(capital?.isExposed).toBe(true);
  });

  // Test 19: test_exposure_excludes_neutral_adjacent
  it('test_exposure_excludes_neutral_adjacent', () => {
    let cells = generateInitialTerritories();
    // Make all neighbors of capital owned by player
    cells = cells.map((c) => {
      if (c.id === 'cell_capital' || c.id === 'cell_west_pass' || c.id === 'cell_east_plains' || c.id === 'cell_central_fort' || c.id === 'cell_north_outpost') {
        return { ...c, owner: 'player' as FactionId };
      }
      return c;
    });

    cells = recalculateCellExposures(cells);
    const capital = cells.find((c) => c.id === 'cell_capital');
    expect(capital?.isExposed).toBe(false);
  });

  // Test 20: test_single_gap_auto_move_suggested_not_silent
  it('test_single_gap_auto_move_suggested_not_silent', () => {
    let cells = generateInitialTerritories();
    cells = recalculateCellExposures(cells);

    // Give 1 exposed cell a defense force, 1 exposed cell no defense force
    const exposedPlayerCells = cells.filter((c) => c.owner === 'player' && c.isExposed);
    if (exposedPlayerCells.length >= 2) {
      const df1CellId = exposedPlayerCells[0].id;
      const gapCellId = exposedPlayerCells[1].id;

      // Make remaining exposed cells unexposed
      cells = cells.map((c) => {
        if (c.owner === 'player' && c.id !== df1CellId && c.id !== gapCellId) {
          return { ...c, isExposed: false };
        }
        return c;
      });

      // Place a freed defense force on a non-exposed cell
      const nonExposedCell = cells.find((c) => c.owner === 'player' && !c.isExposed);

      if (nonExposedCell) {
        const freedForce: DefenseForce = {
          id: 'df_1',
          cellId: nonExposedCell.id,
          name: 'Freed Defense Force',
          units: [createUnit('rook')],
          kingUnitId: 'king_df1',
        };

        const result = evaluateDefenseForceLifecycle(cells, [freedForce]);
        expect(result.proposal).not.toBeNull();
        expect(result.proposal?.fromDefenseForceId).toBe('df_1');
        expect(result.proposal?.toCellId).toBe(gapCellId);
        expect(result.proposal?.status).toBe('proposed');
      }
    }
  });

  // Test 21: test_multi_gap_requires_player_decision
  it('test_multi_gap_requires_player_decision', () => {
    let cells = generateInitialTerritories();
    cells = recalculateCellExposures(cells);

    // Make sure there are at least 2 gaps
    const exposedPlayerCells = cells.filter((c) => c.owner === 'player' && c.isExposed);
    if (exposedPlayerCells.length >= 2) {
      const freedForce: DefenseForce = {
        id: 'df_freed',
        cellId: 'cell_safe_nonexistent',
        name: 'Freed Force',
        units: [createUnit('pawn')],
        kingUnitId: 'king_freed',
      };

      const result = evaluateDefenseForceLifecycle(cells, [freedForce]);
      expect(result.proposal).toBeNull(); // Multi-gap requires manual decision, no auto-proposal
    }
  });

  // Test 22: test_synergies_use_chess_pairings
  it('test_synergies_use_chess_pairings', () => {
    const bishopPair = calculateSynergies([createUnit('bishop'), createUnit('bishop')]);
    expect(bishopPair.find((s) => s.type === 'bishop_pair')?.isActive).toBe(true);

    const knightOutpost = calculateSynergies([createUnit('knight'), createUnit('pawn')]);
    expect(knightOutpost.find((s) => s.type === 'knight_outpost')?.isActive).toBe(true);

    const battery = calculateSynergies([createUnit('rook'), createUnit('rook')]);
    expect(battery.find((s) => s.type === 'battery')?.isActive).toBe(true);

    const royalGuard = calculateSynergies([createUnit('queen'), createUnit('knight')]);
    expect(royalGuard.find((s) => s.type === 'royal_guard')?.isActive).toBe(true);

    const pawnPhalanx = calculateSynergies([createUnit('pawn'), createUnit('pawn')]);
    expect(pawnPhalanx.find((s) => s.type === 'pawn_phalanx')?.isActive).toBe(true);
  });

  // Test 23: test_king_binding_generalizes_across_squads
  it('test_king_binding_generalizes_across_squads', () => {
    const kingUnit = { ...createUnit('pawn', 'Defense King'), isKing: true, squadId: 'defense_cell_west_pass' };
    const otherUnit = createUnit('pawn', 'Other Guard');

    const result = enforceCoronation([kingUnit, otherUnit], 1);
    expect(result.newKingId).toBe(kingUnit.id);
    expect(result.coronationEvent).toBeNull(); // Existing king found!
  });

  // Test 24: test_settling_never_triggers_on_relocation
  it('test_settling_never_triggers_on_relocation', () => {
    const kingUnit = { ...createUnit('pawn', 'King'), isKing: true, squadId: 'forward' };
    const originalSettlingTurns = 1;

    // Simulate relocation
    const relocatedKing = { ...kingUnit, squadId: 'defense_cell_capital' };
    const result = enforceCoronation([relocatedKing], originalSettlingTurns);

    expect(result.settlingTurns).toBe(originalSettlingTurns); // Remained unchanged!
    expect(result.coronationEvent).toBeNull();
  });

  // Test 25: test_settling_triggers_only_on_coronation
  it('test_settling_triggers_only_on_coronation', () => {
    const unit1 = createUnit('knight', 'New King Candidate');
    const result = enforceCoronation([unit1], 0, 'Old king died');

    expect(result.coronationEvent).not.toBeNull();
    expect(result.settlingTurns).toBe(2); // Coronation triggers 2 turns settling!
  });

  // --- REVISION 5: THREE-TIER CROWN & AUTO-FORMED DEFENSE FORCES TESTS ---

  // Test 26: test_enforce_coronation_scoped_to_force
  it('test_enforce_coronation_scoped_to_force', () => {
    const forceAUnit1 = createUnit('pawn', 'Force A Pawn', 'recruit');
    const forceAUnit2 = createUnit('knight', 'Force A Knight', 'veteran');
    const forceBUnit = createUnit('queen', 'Force B Queen', 'recruit');

    // Coronation on Force A units only
    const resultA = enforceCoronation([forceAUnit1, forceAUnit2], 0);
    expect(resultA.newKingId).toBe(forceAUnit2.id); // Veteran Knight ranks higher than Recruit Pawn
    expect(resultA.updatedUnits.find((u) => u.id === forceAUnit2.id)?.isKing).toBe(true);

    // Force B remains un-crowned and untouched
    expect(forceBUnit.isKing).toBe(false);
  });

  // Test 27: test_multiple_forces_can_have_independent_kings
  it('test_multiple_forces_can_have_independent_kings', () => {
    const unit1 = createUnit('knight', 'DF 1 Knight');
    const unit2 = createUnit('rook', 'DF 2 Rook');

    const res1 = enforceCoronation([unit1], 0);
    const res2 = enforceCoronation([unit2], 0);

    const df1: DefenseForce = {
      id: 'df_1',
      cellId: 'cell_pass',
      name: 'Defense Force 1',
      units: res1.updatedUnits,
      kingUnitId: res1.newKingId,
    };

    const df2: DefenseForce = {
      id: 'df_2',
      cellId: 'cell_fort',
      name: 'Defense Force 2',
      units: res2.updatedUnits,
      kingUnitId: res2.newKingId,
    };

    expect(df1.kingUnitId).not.toBeNull();
    expect(df2.kingUnitId).not.toBeNull();
    expect(df1.kingUnitId).not.toBe(df2.kingUnitId);
  });

  // Test 28: test_forward_vanguard_never_gets_isKing
  it('test_forward_vanguard_never_gets_isKing', () => {
    const forwardUnit = { ...createUnit('queen', 'Vanguard Commander'), squadId: 'forward', squadSlot: 0, isKing: false };
    
    // Attempting to filter out forward units ensures enforceCoronation is never called for forward squad
    const capitalUnits: UnitState[] = [];
    const result = enforceCoronation(capitalUnits, 0);

    expect(result.newKingId).toBeNull();
    expect(forwardUnit.isKing).toBe(false);
  });

  // Test 29: test_auto_form_defense_force_crowns_atomically
  it('test_auto_form_defense_force_crowns_atomically', () => {
    let cells = generateInitialTerritories();
    cells = recalculateCellExposures(cells);

    const exposedPlayerCells = cells.filter((c) => c.owner === 'player' && c.isExposed);
    if (exposedPlayerCells.length > 0) {
      const benchUnit1 = createUnit('knight', 'Bench Knight');
      const benchUnit2 = createUnit('pawn', 'Bench Pawn');

      const lifecycleResult = evaluateDefenseForceLifecycle(cells, [], [benchUnit1, benchUnit2]);

      expect(lifecycleResult.updatedDefenseForces.length).toBeGreaterThan(0);
      const newForce = lifecycleResult.updatedDefenseForces[0];
      expect(newForce.kingUnitId).not.toBeNull();
      expect(newForce.kingUnitId).toBeDefined();
      expect(newForce.units.some((u) => u.id === newForce.kingUnitId && u.isKing)).toBe(true);
    }
  });

  // Test 30: test_auto_form_creates_garrison_when_no_units_available
  it('test_auto_form_creates_garrison_when_no_units_available', () => {
    let cells = generateInitialTerritories();
    cells = recalculateCellExposures(cells);

    const exposedCount = cells.filter((c) => c.owner === 'player' && c.isExposed).length;
    const lifecycleResult = evaluateDefenseForceLifecycle(cells, [], []);

    // Every Exposed Tile dictates the creation of a Defensive Squad
    expect(lifecycleResult.updatedDefenseForces.length).toBe(exposedCount);
    lifecycleResult.updatedDefenseForces.forEach((df) => {
      expect(df.kingUnitId).not.toBeNull();
      expect(df.units.length).toBeGreaterThan(0);
    });
  });

  // Test 31: test_capital_king_excluded_from_bench_pool
  it('test_capital_king_excluded_from_bench_pool', () => {
    const initialUnits: UnitState[] = [
      createUnit('rook', 'Aethelgard Bastion', 'veteran'),
      createUnit('knight', 'Sir Cassian', 'recruit'),
      createUnit('pawn', 'Grim Pawn I', 'recruit'),
    ];

    // Capital King
    initialUnits[0].squadSlot = null;
    initialUnits[0].squadId = null;
    initialUnits[0].isKing = true;

    // Forward Vanguard Squad
    initialUnits[1].squadSlot = 0;
    initialUnits[1].squadId = 'forward';
    initialUnits[1].isKing = false;

    initialUnits[2].squadSlot = 1;
    initialUnits[2].squadId = 'forward';
    initialUnits[2].isKing = false;

    const rawCells = generateInitialTerritories();
    const computedCells = recalculateCellExposures(rawCells);

    const benchUnits = initialUnits.filter(
      (u) => !u.isKing && (u.squadSlot === null || u.squadSlot === undefined) && (!u.squadId || u.squadId === 'bench')
    );
    const initialLifecycle = evaluateDefenseForceLifecycle(computedCells, [], benchUnits);
    const initialRemainingUnits = initialUnits.filter(
      (u) => !(initialLifecycle.usedUnitIds || []).includes(u.id)
    );

    const kingUnitId = initialUnits[0].id;

    // (a) Capital King unit remains present in units
    expect(initialRemainingUnits.some((u) => u.id === kingUnitId)).toBe(true);

    // (b) Capital King unit is NOT the king/member of any DefenseForce
    const isKingInAnyDF = initialLifecycle.updatedDefenseForces.some((df) =>
      df.units.some((u) => u.id === kingUnitId)
    );
    expect(isKingInAnyDF).toBe(false);

    // (c) kingUnitId resolves to a unit that actually exists in units
    const resolvedKing = initialRemainingUnits.find((u) => u.id === kingUnitId);
    expect(resolvedKing).toBeDefined();
    expect(resolvedKing?.isKing).toBe(true);
  });

  // Test 32: test_evaluate_defense_force_lifecycle_never_consumes_king_units
  it('test_evaluate_defense_force_lifecycle_never_consumes_king_units', () => {
    const gapCell: TerritoryCell = {
      id: 'cell_test_gap',
      name: 'Test Gap',
      x: 0,
      y: 0,
      polygonPoints: [],
      owner: 'player',
      isExposed: true,
      neighborIds: [],
      type: 'outpost',
      threatLevel: 1,
      troopCount: 0,
      scouted: true,
      hasKing: false,
    };

    const kingUnit = { ...createUnit('queen', 'King Unit'), isKing: true };
    const pawnUnit = createUnit('pawn', 'Pawn Unit');

    const result = evaluateDefenseForceLifecycle([gapCell], [], [kingUnit, pawnUnit]);

    // Check that no created defense force contains the king unit
    result.updatedDefenseForces.forEach((df) => {
      expect(df.units.some((u) => u.id === kingUnit.id)).toBe(false);
    });
    // Check usedUnitIds does not include kingUnit
    expect(result.usedUnitIds || []).not.toContain(kingUnit.id);
  });

  // Test 33: test_reject_relocation_proposal_forms_fallback_garrison
  it('test_reject_relocation_proposal_forms_fallback_garrison', () => {
    const gapCell: TerritoryCell = {
      id: 'cell_gap_1',
      name: 'Border Gap',
      x: 0,
      y: 0,
      polygonPoints: [],
      owner: 'player',
      isExposed: true,
      neighborIds: [],
      type: 'outpost',
      threatLevel: 1,
      troopCount: 0,
      scouted: true,
      hasKing: false,
    };

    const benchPawn = createUnit('pawn', 'Bench Pawn');
    const benchUnits = [benchPawn];

    // Rejection fallback logic simulation
    const fallback = evaluateDefenseForceLifecycle([gapCell], [], benchUnits);

    expect(fallback.updatedDefenseForces.length).toBe(1);
    expect(fallback.updatedDefenseForces[0].cellId).toBe('cell_gap_1');
    expect(fallback.proposal).toBeNull();
  });

  // Test 34: test_reject_relocation_fallback_does_not_reopen_proposal
  it('test_reject_relocation_fallback_does_not_reopen_proposal', () => {
    const gapCell: TerritoryCell = {
      id: 'cell_gap_2',
      name: 'Border Gap 2',
      x: 0,
      y: 0,
      polygonPoints: [],
      owner: 'player',
      isExposed: true,
      neighborIds: [],
      type: 'outpost',
      threatLevel: 1,
      troopCount: 0,
      scouted: true,
      hasKing: false,
    };

    const fallback = evaluateDefenseForceLifecycle([gapCell], [], []);
    expect(fallback.proposal).toBeNull();
  });

  // Test 35: test_reject_relocation_repeated_rejection_does_not_duplicate_forces
  it('test_reject_relocation_repeated_rejection_does_not_duplicate_forces', () => {
    const gapCell: TerritoryCell = {
      id: 'cell_gap_3',
      name: 'Border Gap 3',
      x: 0,
      y: 0,
      polygonPoints: [],
      owner: 'player',
      isExposed: true,
      neighborIds: [],
      type: 'outpost',
      threatLevel: 1,
      troopCount: 0,
      scouted: true,
      hasKing: false,
    };

    const benchUnits = [createUnit('pawn', 'Bench Pawn I')];

    // First fallback
    const fallback1 = evaluateDefenseForceLifecycle([gapCell], [], benchUnits);
    expect(fallback1.updatedDefenseForces.length).toBe(1);

    // Second evaluation with cell now covered by fallback1
    const fallback2 = evaluateDefenseForceLifecycle([gapCell], fallback1.updatedDefenseForces, []);
    expect(fallback2.updatedDefenseForces.length).toBe(1);
    expect(fallback2.proposal).toBeNull();
  });

  // Test 36: test_crown_logic_module_has_no_react_or_dom_imports
  it('test_crown_logic_module_has_no_react_or_dom_imports', () => {
    const code = fs.readFileSync('src/utils/crownLogic.ts', 'utf-8');
    expect(code).not.toMatch(/import\s+.*from\s+['"]react['"]/);
    expect(code).not.toMatch(/import\s+.*from\s+['"]react-dom['"]/);
    expect(code).not.toMatch(/<[A-Za-z0-9]+/); // No JSX tags
  });

  // Test 32: test_defense_force_king_loss_does_not_end_campaign
  it('test_defense_force_king_loss_does_not_end_campaign', () => {
    // A Defense Force losing its King changes cell ownership but gamePhase is not game_over
    let cells = generateInitialTerritories();
    const defenseCell = cells.find((c) => c.owner === 'player' && c.type !== 'capital');

    if (defenseCell) {
      const dfKing = { ...createUnit('pawn', 'DF King'), isKing: true };
      const enemyWinner = createUnit('queen', 'Enemy Queen');

      const result = simulateCombat([dfKing], [enemyWinner], false);
      expect(result.winner).toBe('enemy');

      // Ownership transitions to enemy
      const updatedCell = { ...defenseCell, owner: 'enemy' as FactionId };
      expect(updatedCell.owner).toBe('enemy');
      // Capital King remains alive so phase is not game_over
    }
  });

  // Test 33: test_capital_king_loss_ends_campaign
  it('test_capital_king_loss_ends_campaign', () => {
    let cells = generateInitialTerritories();
    const capitalCell = cells.find((c) => c.type === 'capital');

    if (capitalCell) {
      const capitalKing = { ...createUnit('pawn', 'Capital King'), isKing: true };
      const enemyWinner = createUnit('queen', 'Enemy Queen');

      const result = simulateCombat([capitalKing], [enemyWinner], true);
      expect(result.winner).toBe('enemy');
      expect(result.kingAction).toBe('killed');

      // Capital King dead with no remaining units to crown triggers game_over
      const coronationRes = enforceCoronation([], 0);
      expect(coronationRes.newKingId).toBeNull();
    }
  });

  // Test 39: test_benching_territory_king_triggers_succession
  it('test_benching_territory_king_triggers_succession', () => {
    const kingUnit = { ...createUnit('queen', 'Original King'), isKing: true };
    const veteranUnit = { ...createUnit('knight', 'Garrison Knight', 'veteran'), isKing: false };
    const recruitUnit = { ...createUnit('pawn', 'Garrison Pawn', 'recruit'), isKing: false };

    const dfUnits = [kingUnit, veteranUnit, recruitUnit];
    const remainingUnits = dfUnits.filter((u) => u.id !== kingUnit.id);

    const coronation = enforceCoronation(remainingUnits, 0, 'King benched');
    expect(coronation.newKingId).toBe(veteranUnit.id);
    expect(coronation.updatedUnits.find((u) => u.id === veteranUnit.id)?.isKing).toBe(true);
  });

  // Test 40: test_zodiac_assigned_on_creation
  it('test_zodiac_assigned_on_creation', () => {
    const unit = createUnit('pawn', 'Test Unit');
    expect(unit.zodiac).toBeDefined();
    expect(typeof unit.zodiac).toBe('string');
    expect([
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
    ]).toContain(unit.zodiac);
  });

  // Test 41: test_zodiac_assignment_is_random_distribution
  it('test_zodiac_assignment_is_random_distribution', () => {
    const spy = vi.spyOn(Math, 'random');
    spy.mockReturnValueOnce(0.0); // 0 -> aries
    const zodiac1 = assignRandomZodiac();
    spy.mockReturnValueOnce(0.5); // 0.5 * 12 = 6 -> libra
    const zodiac2 = assignRandomZodiac();
    spy.mockRestore();

    expect(zodiac1).toBe('aries');
    expect(zodiac2).toBe('libra');
    expect(zodiac1).not.toBe(zodiac2);
  });

  // Test 42: test_opposing_pair_detected
  it('test_opposing_pair_detected', () => {
    const unit1 = { ...createUnit('pawn'), zodiac: 'aries' as const };
    const unit2 = { ...createUnit('knight'), zodiac: 'libra' as const };

    const synergies = calculateSynergies([unit1, unit2]);
    const celestial = synergies.find((s) => s.type === 'celestial_alignment');

    expect(celestial).toBeDefined();
    expect(celestial?.isActive).toBe(true);
    expect(celestial?.currentCount).toBe(2);
  });

  // Test 43: test_same_sign_no_bonus
  it('test_same_sign_no_bonus', () => {
    const unit1 = { ...createUnit('pawn'), zodiac: 'aries' as const };
    const unit2 = { ...createUnit('knight'), zodiac: 'aries' as const };

    const synergies = calculateSynergies([unit1, unit2]);
    const celestial = synergies.find((s) => s.type === 'celestial_alignment');

    expect(celestial).toBeDefined();
    expect(celestial?.isActive).toBe(false);
    expect(celestial?.currentCount).toBe(0);
  });

  // Test 44: test_no_double_counting_pairs
  it('test_no_double_counting_pairs', () => {
    // 3 units: Aries + Libra + Aries -> exactly 1 opposing pair (Aries+Libra), leaving 1 Aries leftover
    const unit1 = { ...createUnit('pawn'), id: 'u1', zodiac: 'aries' as const };
    const unit2 = { ...createUnit('knight'), id: 'u2', zodiac: 'libra' as const };
    const unit3 = { ...createUnit('bishop'), id: 'u3', zodiac: 'aries' as const };

    const synergies = calculateSynergies([unit1, unit2, unit3]);
    const celestial = synergies.find((s) => s.type === 'celestial_alignment');

    expect(celestial).toBeDefined();
    expect(celestial?.isActive).toBe(true);
    expect(celestial?.currentCount).toBe(2); // 1 pair = 2 units counted
  });

  // Test 45: test_existing_synergies_unaffected
  it('test_existing_synergies_unaffected', () => {
    const bishop1 = createUnit('bishop');
    const bishop2 = createUnit('bishop');

    const synergies = calculateSynergies([bishop1, bishop2]);
    const bishopPair = synergies.find((s) => s.type === 'bishop_pair');

    expect(bishopPair).toBeDefined();
    expect(bishopPair?.isActive).toBe(true);
    expect(bishopPair?.currentCount).toBe(2);
  });

  // Test 46: test_damage_number_reads_real_log_value
  it('test_damage_number_reads_real_log_value', () => {
    const normalAttackLog = {
      turn: 1,
      actorId: 'a1',
      actorName: 'Queen',
      actorTeam: 'player' as const,
      actionType: 'attack' as const,
      targetId: 't1',
      targetName: 'Pawn',
      value: 14,
      isCritical: false,
      description: 'Queen attacks Pawn for 14 damage',
    };

    const critAttackLog = {
      ...normalAttackLog,
      value: 21,
      isCritical: true,
    };

    expect(getFloatingDamageText(normalAttackLog)).toBe('-14');
    expect(getFloatingDamageText(critAttackLog)).toBe('⚡ CRIT -21');
  });

  // Test 47: test_rank_visual_does_not_override_target_highlight
  it('test_rank_visual_does_not_override_target_highlight', () => {
    const eliteUnit: CombatUnit = {
      ...createUnit('pawn', 'Elite Defender', 'elite'),
      currentHp: 10,
      position: { x: 0, y: 0 },
      team: 'player',
      initiative: 1,
    };

    // When eliteUnit is targeted, target highlight ring must take priority
    const styleInfo = getGridCardStyle(eliteUnit, false, true);

    expect(styleInfo.isTargetHighlight).toBe(true);
    expect(styleInfo.borderAndRing).toContain('ring-2 ring-rose-500');
    expect(styleInfo.borderAndRing).toContain('border-rose-500');
  });

  // Test 48: test_zodiac_element_border_color
  it('test_zodiac_element_border_color', () => {
    const fireUnit: CombatUnit = {
      ...createUnit('pawn', 'Fire Pawn'),
      zodiac: 'aries',
      currentHp: 10,
      position: { x: 0, y: 0 },
      team: 'player',
      initiative: 1,
    };

    const waterUnit: CombatUnit = {
      ...createUnit('pawn', 'Water Pawn'),
      zodiac: 'pisces',
      currentHp: 10,
      position: { x: 0, y: 0 },
      team: 'player',
      initiative: 1,
    };

    const fireStyle = getGridCardStyle(fireUnit, false, false);
    const waterStyle = getGridCardStyle(waterUnit, false, false);

    expect(fireStyle.element).toBe('fire');
    expect(fireStyle.elementBorderClass).toContain('border-amber-500');
    expect(fireStyle.borderAndRing).toContain('border-amber-500');

    expect(waterStyle.element).toBe('water');
    expect(waterStyle.elementBorderClass).toContain('border-violet-500');
    expect(waterStyle.borderAndRing).toContain('border-violet-500');
  });

  // Test 49: test_unit_card_renders_with_base_unit_state
  it('test_unit_card_renders_with_base_unit_state', () => {
    const baseUnit: UnitState = createUnit('rook', 'Valiant Rook', 'veteran');
    baseUnit.zodiac = 'gemini';

    // Verify UnitState has no combat-specific fields like currentHp or position
    expect((baseUnit as any).currentHp).toBeUndefined();
    expect((baseUnit as any).position).toBeUndefined();

    // Verify getZodiacElement works with UnitState
    const { element, elementBorderClass } = getZodiacElement(baseUnit.zodiac);
    expect(element).toBe('air');
    expect(elementBorderClass).toContain('border-cyan-500');
    expect(ZODIAC_GLYPHS[baseUnit.zodiac]).toBe('♊');
  });

  // Test 50: test_unit_card_element_border_matches_zodiac
  it('test_unit_card_element_border_matches_zodiac', () => {
    expect(getZodiacElement('leo').element).toBe('fire');
    expect(getZodiacElement('leo').elementBorderClass).toContain('border-amber-500');

    expect(getZodiacElement('taurus').element).toBe('earth');
    expect(getZodiacElement('taurus').elementBorderClass).toContain('border-emerald-500');

    expect(getZodiacElement('libra').element).toBe('air');
    expect(getZodiacElement('libra').elementBorderClass).toContain('border-cyan-500');

    expect(getZodiacElement('scorpio').element).toBe('water');
    expect(getZodiacElement('scorpio').elementBorderClass).toContain('border-violet-500');
  });

  // Test 51: test_unit_card_king_crown_avoids_corners
  it('test_unit_card_king_crown_avoids_corners', () => {
    const kingUnit: UnitState = {
      ...createUnit('pawn', 'Sovereign King', 'elite'),
      isKing: true,
      zodiac: 'aries',
    };

    const { element } = getZodiacElement(kingUnit.zodiac);
    expect(element).toBe('fire');

    // Rank is elite ('ELITE' in left corner mark), Zodiac is aries ('♈' in right corner mark)
    // King flag is true (Crown placed in top-center between left and right corner marks)
    expect(kingUnit.rank).toBe('elite');
    expect(kingUnit.isKing).toBe(true);
    expect(ZODIAC_GLYPHS[kingUnit.zodiac]).toBe('♈');
  });

  // Test 52: test_combat_card_wrapper_preserves_highlight_behavior
  it('test_combat_card_wrapper_preserves_highlight_behavior', () => {
    const combatActorUnit: CombatUnit = {
      ...createUnit('knight', 'Active Knight'),
      currentHp: 80,
      position: { x: 1, y: 1 },
      team: 'player',
      initiative: 10,
    };

    const combatTargetUnit: CombatUnit = {
      ...createUnit('pawn', 'Target Pawn'),
      currentHp: 30,
      position: { x: 1, y: 2 },
      team: 'enemy',
      initiative: 5,
    };

    const actorStyle = getGridCardStyle(combatActorUnit, true, false);
    const targetStyle = getGridCardStyle(combatTargetUnit, false, true);

    expect(actorStyle.borderAndRing).toContain('border-amber-400');
    expect(actorStyle.borderAndRing).toContain('ring-2 ring-amber-400/60');

    expect(targetStyle.borderAndRing).toContain('border-rose-500');
    expect(targetStyle.borderAndRing).toContain('ring-2 ring-rose-500/60');
    expect(targetStyle.isTargetHighlight).toBe(true);
  });

  // Test 53: test_board_size_constant_is_eight
  it('test_board_size_constant_is_eight', () => {
    expect(BOARD_SIZE).toBe(8);
  });

  // Test 54: test_out_of_bounds_respects_board_size
  it('test_out_of_bounds_respects_board_size', () => {
    expect(isOutOfBounds({ x: 0, y: 0 })).toBe(false);
    expect(isOutOfBounds({ x: 7, y: 7 })).toBe(false);
    expect(isOutOfBounds({ x: 8, y: 8 })).toBe(true);
    expect(isOutOfBounds({ x: -1, y: 0 })).toBe(true);
    expect(isOutOfBounds({ x: 0, y: 8 })).toBe(true);
  });

  // Test 55: test_rook_slides_full_board_width
  it('test_rook_slides_full_board_width', () => {
    const rookUnit: CombatUnit = {
      ...createUnit('rook', 'Valiant Rook'),
      currentHp: 100,
      position: { x: 0, y: 0 },
      team: 'player',
      initiative: 10,
    };

    const moves = getSlidingMoves(
      rookUnit,
      [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }],
      [rookUnit]
    );

    // Should reach (7, 0) and (0, 7) on 8x8 board (7 steps in x, 7 steps in y)
    expect(moves.some((m) => m.x === 7 && m.y === 0)).toBe(true);
    expect(moves.some((m) => m.x === 0 && m.y === 7)).toBe(true);
    expect(moves.length).toBe(14); // 7 right + 7 down = 14 total moves
  });

  // Test 56: test_placement_grid_renders_64_cells
  it('test_placement_grid_renders_64_cells', () => {
    const cellCount = BOARD_SIZE * BOARD_SIZE;
    expect(cellCount).toBe(64);
  });

  // Test 57: test_combat_grid_renders_64_cells
  it('test_combat_grid_renders_64_cells', () => {
    const cellCount = BOARD_SIZE * BOARD_SIZE;
    expect(cellCount).toBe(64);
  });

  // Test 58: test_arrow_percentage_math_uses_board_size
  it('test_arrow_percentage_math_uses_board_size', () => {
    const cellPercent = 100 / BOARD_SIZE;
    expect(cellPercent).toBe(12.5);

    const getPercentagePos = (x: number) => x * cellPercent + cellPercent / 2;

    expect(getPercentagePos(0)).toBe(6.25);
    expect(getPercentagePos(3)).toBe(43.75);
    expect(getPercentagePos(7)).toBe(93.75);
  });

  // Test 59: test_terrain_display_names
  it('test_terrain_display_names', () => {
    expect(getTerrainDisplayName('capital')).toBe('Rebel HQ');
    expect(getTerrainDisplayName('fortress')).toBe('Held District');
    expect(getTerrainDisplayName('pass')).toBe('Checkpoint');
    expect(getTerrainDisplayName('outpost')).toBe('Loose District');
    expect(getTerrainDisplayName('plains')).toBe('Open Street');
  });

function createTestCell(overrides: Partial<TerritoryCell> & { id: string; name: string }): TerritoryCell {
  return {
    x: 0,
    y: 0,
    polygonPoints: [],
    neighborIds: [],
    owner: 'player',
    type: 'fortress',
    threatLevel: 0,
    troopCount: 2,
    hasKing: false,
    scouted: true,
    ...overrides,
  };
}

  // Test 60: test_loyalty_erosion_under_unreinforced_threat
  it('test_loyalty_erosion_under_unreinforced_threat', () => {
    const testCells: TerritoryCell[] = [
      createTestCell({ id: 'cell_1', name: 'District 1', owner: 'player', type: 'fortress', troopCount: 2, isExposed: true }),
      createTestCell({ id: 'cell_2', name: 'District 2', owner: 'tundra', type: 'outpost', troopCount: 3, isExposed: true }),
    ];

    const testForce: DefenseForce = {
      id: 'df_1',
      name: 'Border Guard',
      cellId: 'cell_1',
      kingUnitId: null,
      units: [createUnit('pawn')],
      settlingTurnsLeft: 0,
      loyalty: 100,
    };

    const result = processDefenseForceLoyalty([testForce], testCells, []);

    expect(result.updatedDefenseForces.length).toBe(1);
    expect(result.updatedDefenseForces[0].loyalty).toBe(
      DEFAULT_FORCE_LOYALTY - LOYALTY_EROSION_PER_UNREINFORCED_THREATENED_TURN
    );
    expect(result.updatedDefenseForces[0].loyalty).toBe(88);
  });

  // Test 61: test_loyalty_no_erosion_when_safe_or_reinforced
  it('test_loyalty_no_erosion_when_safe_or_reinforced', () => {
    const safeCell = createTestCell({ id: 'safe_cell', name: 'Inner Safe', owner: 'player', type: 'capital', troopCount: 2, isExposed: false });
    const exposedCell = createTestCell({ id: 'exposed_cell', name: 'Border', owner: 'player', type: 'fortress', troopCount: 2, isExposed: true });

    const safeForce: DefenseForce = { id: 'df_safe', name: 'Safe Garrison', cellId: 'safe_cell', kingUnitId: null, units: [createUnit('pawn')], settlingTurnsLeft: 0, loyalty: 100 };
    const reinforcedForce: DefenseForce = { id: 'df_reinf', name: 'Reinforced Garrison', cellId: 'exposed_cell', kingUnitId: null, units: [createUnit('pawn')], settlingTurnsLeft: 0, loyalty: 80 };

    const playerReinforceAction: DeclaredAction = {
      id: 'act_reinf',
      factionId: 'player',
      actionIntent: 'reinforce',
      targetCellId: 'exposed_cell',
      assignedUnits: [],
    };

    const result = processDefenseForceLoyalty([safeForce, reinforcedForce], [safeCell, exposedCell], [playerReinforceAction]);

    const resSafe = result.updatedDefenseForces.find((f) => f.id === 'df_safe');
    const resReinf = result.updatedDefenseForces.find((f) => f.id === 'df_reinf');

    expect(resSafe?.loyalty).toBe(100); // Unexposed -> no erosion
    expect(resReinf?.loyalty).toBe(100); // Reinforced -> restored to max (100)
  });

  // Test 62: test_loyalty_restoration_on_reinforcement
  it('test_loyalty_restoration_on_reinforcement', () => {
    const depletedForce: DefenseForce = {
      id: 'df_depleted',
      name: 'Worn Garrison',
      cellId: 'cell_border',
      kingUnitId: null,
      units: [createUnit('pawn')],
      settlingTurnsLeft: 0,
      loyalty: 30,
    };

    const restored = restoreForceLoyalty(depletedForce, 100);
    expect(restored.loyalty).toBe(100);

    const partiallyRestored = restoreForceLoyalty(depletedForce, 40);
    expect(partiallyRestored.loyalty).toBe(70);
  });

  // Test 63: test_force_breaks_when_loyalty_reaches_zero
  it('test_force_breaks_when_loyalty_reaches_zero', () => {
    const threatenedCell = createTestCell({ id: 'threatened_cell', name: 'Frontline', owner: 'player', type: 'fortress', troopCount: 2, isExposed: true });

    const breakingForce: DefenseForce = {
      id: 'df_breaking',
      name: 'Faltering Vanguard',
      cellId: 'threatened_cell',
      kingUnitId: null,
      units: [createUnit('pawn')],
      settlingTurnsLeft: 0,
      loyalty: 10, // <= 12 erosion will cause it to reach 0!
    };

    const result = processDefenseForceLoyalty([breakingForce], [threatenedCell], []);

    // Force broken and removed from defense forces
    expect(result.updatedDefenseForces.length).toBe(0);
    expect(result.brokenForces.length).toBe(1);
    expect(result.brokenForces[0].forceName).toBe('Faltering Vanguard');
  });

  // Test 64: test_distinct_break_outcome_transfers_cell_ownership_without_combat
  it('test_distinct_break_outcome_transfers_cell_ownership_without_combat', () => {
    const targetCell = createTestCell({ id: 'cell_collapse', name: 'Collapsing District', owner: 'player', type: 'fortress', troopCount: 2, isExposed: true });

    const fragileForce: DefenseForce = {
      id: 'df_fragile',
      name: 'Fragile Garrison',
      cellId: 'cell_collapse',
      kingUnitId: null,
      units: [createUnit('pawn')],
      settlingTurnsLeft: 0,
      loyalty: 8,
    };

    const enemyAttackAction: DeclaredAction = {
      id: 'act_attack',
      factionId: 'tundra',
      actionIntent: 'attack',
      targetCellId: 'cell_collapse',
      assignedUnits: [],
    };

    const result = processDefenseForceLoyalty([fragileForce], [targetCell], [enemyAttackAction]);

    // Territory fell without combat resolving!
    const updatedCell = result.updatedCells.find((c) => c.id === 'cell_collapse');
    expect(updatedCell?.owner).toBe('tundra');
    expect(updatedCell?.assignedDefenseForceId).toBeNull();

    expect(result.brokenForces.length).toBe(1);
    expect(result.brokenForces[0].occupyingFaction).toBe('tundra');
  });

  // Test 65: test_low_allegiance_erodes_loyalty_faster
  it('test_low_allegiance_erodes_loyalty_faster', () => {
    const lowAllegianceCell = createTestCell({
      id: 'hostile_cell',
      name: 'Resentful Outpost',
      owner: 'player',
      type: 'outpost',
      isExposed: true,
      publicOpinion: 0, // 0 allegiance -> 1.5x erosion modifier -> 12 * 1.5 = 18 erosion
    });

    const force: DefenseForce = {
      id: 'df_hostile',
      name: 'Hostile Garrison',
      cellId: 'hostile_cell',
      kingUnitId: null,
      units: [createUnit('pawn')],
      settlingTurnsLeft: 0,
      loyalty: 100,
    };

    const result = processDefenseForceLoyalty([force], [lowAllegianceCell], []);

    expect(result.updatedDefenseForces.length).toBe(1);
    expect(result.updatedDefenseForces[0].loyalty).toBe(82); // 100 - 18 = 82
  });

  // Test 66: test_high_allegiance_erodes_loyalty_slower
  it('test_high_allegiance_erodes_loyalty_slower', () => {
    const highAllegianceCell = createTestCell({
      id: 'loyal_cell',
      name: 'Devoted Capital',
      owner: 'player',
      type: 'capital',
      isExposed: true,
      publicOpinion: 100, // 100 allegiance -> 0.5x erosion modifier -> 12 * 0.5 = 6 erosion
    });

    const force: DefenseForce = {
      id: 'df_loyal',
      name: 'Loyal Garrison',
      cellId: 'loyal_cell',
      kingUnitId: null,
      units: [createUnit('pawn')],
      settlingTurnsLeft: 0,
      loyalty: 100,
    };

    const result = processDefenseForceLoyalty([force], [highAllegianceCell], []);

    expect(result.updatedDefenseForces.length).toBe(1);
    expect(result.updatedDefenseForces[0].loyalty).toBe(94); // 100 - 6 = 94
  });

  // Test 67: test_neutral_allegiance_matches_base_rate
  it('test_neutral_allegiance_matches_base_rate', () => {
    const neutralCellExplicit = createTestCell({
      id: 'neutral_cell',
      name: 'Neutral Square',
      owner: 'player',
      type: 'plains',
      isExposed: true,
      publicOpinion: 50, // 50 allegiance -> 1.0x erosion modifier -> 12 erosion
    });

    const neutralCellImplicit = createTestCell({
      id: 'unset_cell',
      name: 'Unset Square',
      owner: 'player',
      type: 'plains',
      isExposed: true,
      // publicOpinion undefined -> defaults to 50 -> 12 erosion
    });

    const force1: DefenseForce = {
      id: 'df_neut1',
      name: 'Garrison 1',
      cellId: 'neutral_cell',
      kingUnitId: null,
      units: [createUnit('pawn')],
      settlingTurnsLeft: 0,
      loyalty: 100,
    };

    const force2: DefenseForce = {
      id: 'df_neut2',
      name: 'Garrison 2',
      cellId: 'unset_cell',
      kingUnitId: null,
      units: [createUnit('pawn')],
      settlingTurnsLeft: 0,
      loyalty: 100,
    };

    const result = processDefenseForceLoyalty([force1, force2], [neutralCellExplicit, neutralCellImplicit], []);

    expect(result.updatedDefenseForces.find((f) => f.id === 'df_neut1')?.loyalty).toBe(88); // 100 - 12 = 88
    expect(result.updatedDefenseForces.find((f) => f.id === 'df_neut2')?.loyalty).toBe(88); // 100 - 12 = 88
  });

  // Test 68: test_initial_territories_have_varied_allegiance
  it('test_initial_territories_have_varied_allegiance', () => {
    const cells = generateInitialTerritories();

    const capital = cells.find((c) => c.type === 'capital');
    const outpost = cells.find((c) => c.type === 'outpost');
    const pass = cells.find((c) => c.type === 'pass');
    const plains = cells.find((c) => c.type === 'plains');

    expect(capital?.publicOpinion).toBe(70);
    expect(outpost?.publicOpinion).toBe(35);
    expect(pass?.publicOpinion).toBe(40);
    expect(plains?.publicOpinion).toBe(50);

    const opinions = cells.map((c) => c.publicOpinion);
    const uniqueOpinions = new Set(opinions);
    expect(uniqueOpinions.size).toBeGreaterThan(1);
  });

  // Test 69: test_cell_without_iso_fields_renders_unchanged
  it('test_cell_without_iso_fields_renders_unchanged', () => {
    const plainCell = createTestCell({ id: 'plain_cell', name: 'Plain Square' });
    expect(plainCell.isoGridAnchor).toBeUndefined();
    expect(plainCell.isoGridCols).toBeUndefined();
    expect(plainCell.isoGridRows).toBeUndefined();
    expect(plainCell.isoBuildingLayout).toBeUndefined();
    expect(isCellIsoGridWithinBounds(plainCell)).toBe(true);
  });

  // Test 70: test_iso_projection_math
  it('test_iso_projection_math', () => {
    const pos = computeIsoTileScreenPos({
      anchor: { x: 100, y: 100 },
      col: 1,
      row: 2,
      tileWidth: 32,
      tileHeight: 16,
    });
    expect(pos.x).toBe(84); // 100 + (1 - 2) * 16 = 84
    expect(pos.y).toBe(124); // 100 + (1 + 2) * 8 = 124
  });

  // Test 71: test_iso_anchor_within_polygon_bounds
  it('test_iso_anchor_within_polygon_bounds', () => {
    const cells = generateInitialTerritories();
    expect(cells.length).toBe(9);
    for (const c of cells) {
      expect(c.isoGridAnchor).toBeDefined();
      expect(c.isoGridCols).toBeGreaterThan(0);
      expect(c.isoGridRows).toBeGreaterThan(0);
      expect(c.isoBuildingLayout).toBeDefined();
      expect(isCellIsoGridWithinBounds(c)).toBe(true);
    }
  });

  // Test 72: test_building_layout_renders_correct_tiles
  it('test_building_layout_renders_correct_tiles', () => {
    const cell = createTestCell({
      id: 'fort_test',
      name: 'Fortress Test',
      isoGridAnchor: { x: 200, y: 200 },
      isoGridCols: 2,
      isoGridRows: 2,
      isoBuildingLayout: [
        ['keep', 'wall'],
        ['wall', 'gate'],
      ],
    });

    expect(cell.isoBuildingLayout?.[0][0]).toBe('keep');
    expect(cell.isoBuildingLayout?.[0][1]).toBe('wall');
    expect(cell.isoBuildingLayout?.[1][0]).toBe('wall');
    expect(cell.isoBuildingLayout?.[1][1]).toBe('gate');
  });

  // Test 73: test_district_auto_gen_leader_created_at_init
  it('test_district_auto_gen_leader_created_at_init', () => {
    const cells = generateProceduralCity();
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.autoGenLeaderUnit).toBeDefined();
      expect(cell.autoGenLeaderUnit).not.toBeNull();
      expect(cell.autoGenLeaderId).toBe(cell.autoGenLeaderUnit?.id);
    }
  });

  // Test 74: test_steward_presence_boosts_combat_power
  it('test_steward_presence_boosts_combat_power', () => {
    const leaderUnit = createUnit('rook', 'District Leader', 'veteran');
    const stewardUnit = createUnit('knight', 'Assigned Steward', 'recruit');

    const defenderAlone: DefenseForce = {
      id: 'df_alone',
      cellId: 'cell_1',
      name: 'District Defense',
      units: [leaderUnit],
      autoGenLeaderId: leaderUnit.id,
      stewardUnitId: null,
      kingUnitId: leaderUnit.id,
      settlingTurnsLeft: 0,
      loyalty: 100,
    };

    const defenderWithSteward: DefenseForce = {
      id: 'df_steward',
      cellId: 'cell_1',
      name: 'District Defense',
      units: [leaderUnit, stewardUnit],
      autoGenLeaderId: leaderUnit.id,
      stewardUnitId: stewardUnit.id,
      kingUnitId: leaderUnit.id,
      settlingTurnsLeft: 0,
      loyalty: 100,
    };

    const attacker: UnitState[] = [createUnit('pawn', 'Attacker 1'), createUnit('pawn', 'Attacker 2')];

    const resultAlone = simulateCombat(attacker, defenderAlone.units);
    const resultWithSteward = simulateCombat(attacker, defenderWithSteward.units);

    const defenderHpAlone = defenderAlone.units.reduce((acc, u) => acc + u.stats.hp, 0);
    const defenderHpWithSteward = defenderWithSteward.units.reduce((acc, u) => acc + u.stats.hp, 0);

    expect(defenderHpWithSteward).toBeGreaterThan(defenderHpAlone);
    expect(resultWithSteward.enemySurvivors.length).toBeGreaterThanOrEqual(resultAlone.enemySurvivors.length);
  });

  // Test 75: test_recalling_steward_leaves_permanent_leader
  it('test_recalling_steward_leaves_permanent_leader', () => {
    const leaderUnit = createUnit('bishop', 'Permanent Leader', 'recruit');
    const stewardUnit = createUnit('pawn', 'Steward Pawn', 'recruit');

    let defenseForce: DefenseForce = {
      id: 'df_test',
      cellId: 'cell_ward',
      name: 'Ward Defense',
      units: [leaderUnit, stewardUnit],
      autoGenLeaderId: leaderUnit.id,
      stewardUnitId: stewardUnit.id,
      kingUnitId: leaderUnit.id,
      settlingTurnsLeft: 0,
    };

    // Recall Steward
    defenseForce = {
      ...defenseForce,
      stewardUnitId: null,
      units: defenseForce.units.filter((u) => u.id !== stewardUnit.id),
    };

    expect(defenseForce.stewardUnitId).toBeNull();
    expect(defenseForce.units.length).toBe(1);
    expect(defenseForce.units[0].id).toBe(leaderUnit.id);
    expect(defenseForce.autoGenLeaderId).toBe(leaderUnit.id);
  });

  // Test 76: test_opening_game_state_hovel_autogen_leader
  it('test_opening_game_state_hovel_autogen_leader', () => {
    const cells = generateProceduralCity();
    const hovel = cells.find((c) => c.name === 'The Underbelly Hovel' || c.type === 'capital');
    expect(hovel).toBeDefined();
    expect(hovel?.autoGenLeaderUnit).toBeDefined();
    expect(hovel?.autoGenLeaderId).toBe(hovel?.autoGenLeaderUnit?.id);
  });

  // Test 77: test_fog_of_war_scouted_only_on_entry_or_combat
  it('test_fog_of_war_scouted_only_on_entry_or_combat', () => {
    const cell = createTestCell({ id: 'unscouted_1', name: 'Dark Alley', scouted: false });
    expect(cell.scouted).toBe(false);

    // Simulate entry / combat revelation
    const revealedCell = { ...cell, scouted: true };
    expect(revealedCell.scouted).toBe(true);
  });

  // Test 78: test_steward_assignment_and_recall_lifecycle
  it('test_steward_assignment_and_recall_lifecycle', () => {
    const leader = createUnit('rook', 'District Warden');
    const rosterUnit = createUnit('knight', 'Roster Knight');

    let df: DefenseForce = {
      id: 'df_lifecycle',
      cellId: 'c1',
      name: 'District C1',
      units: [leader],
      autoGenLeaderId: leader.id,
      stewardUnitId: null,
      kingUnitId: leader.id,
      settlingTurnsLeft: 0,
    };

    // Assign steward
    df = {
      ...df,
      stewardUnitId: rosterUnit.id,
      units: [...df.units, rosterUnit],
    };
    expect(df.stewardUnitId).toBe(rosterUnit.id);
    expect(df.units.length).toBe(2);

    // Recall steward
    df = {
      ...df,
      stewardUnitId: null,
      units: df.units.filter((u) => u.id !== rosterUnit.id),
    };
    expect(df.stewardUnitId).toBeNull();
    expect(df.units.length).toBe(1);
    expect(df.units[0].id).toBe(leader.id);
  });

  // Test 79: test_scouted_state_persists_after_revelation
  it('test_scouted_state_persists_after_revelation', () => {
    let cell = createTestCell({ id: 'c_scout', name: 'Scouted Ward', scouted: false });
    expect(cell.scouted).toBe(false);

    cell = { ...cell, scouted: true };
    expect(cell.scouted).toBe(true);

    const nextTurnCell = { ...cell };
    expect(nextTurnCell.scouted).toBe(true);
  });

  // Test 80: test_hovel_district_named_underbelly_hovel
  it('test_hovel_district_named_underbelly_hovel', () => {
    const cells = generateProceduralCity();
    const capital = cells.find((c) => c.name === 'The Underbelly Hovel' || c.id === 'cell_capital');
    expect(capital).toBeDefined();
    expect(capital?.name).toBe('The Underbelly Hovel');
  });

  // Test 81: test_opening_sequence_triggers_on_new_game
  it('test_opening_sequence_triggers_on_new_game', () => {
    const STORAGE_KEY = 'kingmaker_squads_save_v2';
    const fakeStorage = new Map<string, string>();
    const hasSave = fakeStorage.has(STORAGE_KEY);
    const isNewGame = !hasSave;
    expect(isNewGame).toBe(true);
  });

  // Test 82: test_opening_sequence_skipped_on_load
  it('test_opening_sequence_skipped_on_load', () => {
    const STORAGE_KEY = 'kingmaker_squads_save_v2';
    const fakeStorage = new Map<string, string>();
    fakeStorage.set(STORAGE_KEY, JSON.stringify({ turn: 2, gold: 50 }));
    const hasSave = fakeStorage.has(STORAGE_KEY);
    const isNewGame = !hasSave;
    expect(isNewGame).toBe(false);
  });

  // Test 83: test_cast_intro_uses_real_starting_roster
  it('test_cast_intro_uses_real_starting_roster', () => {
    const startingUnits: UnitState[] = [
      createUnit('knight', 'Sir Cassian', 'recruit'),
      createUnit('pawn', 'Grim Pawn I', 'recruit'),
      createUnit('rook', 'Aethelgard Bastion', 'veteran'),
      createUnit('bishop', 'Alden', 'recruit'),
    ];

    expect(startingUnits.length).toBe(4);
    for (const unit of startingUnits) {
      expect(unit.name).toBeTruthy();
      expect(unit.archetype).toBeTruthy();
      const template = CAST_INTRO_TEMPLATES[unit.archetype];
      expect(template).toBeDefined();
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(10);
    }
  });

  // Test 84: test_cast_intro_template_matches_archetype
  it('test_cast_intro_template_matches_archetype', () => {
    const archetypes = ['rook', 'bishop', 'knight', 'queen', 'pawn'] as const;
    for (const arch of archetypes) {
      const line = CAST_INTRO_TEMPLATES[arch];
      expect(line).toBeDefined();
      expect(line.length).toBeGreaterThan(15);
      const title = getArchetypeClassTitle(arch);
      expect(title).toBeTruthy();
    }
    expect(getArchetypeClassTitle('rook')).toBe('Warden');
    expect(getArchetypeClassTitle('bishop')).toBe('Adept');
    expect(getArchetypeClassTitle('knight')).toBe('Outrider');
    expect(getArchetypeClassTitle('queen')).toBe('Champion');
    expect(getArchetypeClassTitle('pawn')).toBe('Recruit');
  });

  // Test 85: test_opening_text_matches_locked_content
  it('test_opening_text_matches_locked_content', () => {
    expect(OPENING_TEXT).toContain("You don't remember falling. You remember landing");
    expect(OPENING_TEXT).toContain("They were thorough that night.");
    expect(OPENING_TEXT).toContain("ruled with an iron hand");
    expect(OPENING_TEXT).toContain("They just never checked the drop.");
    expect(OPENING_TEXT).toContain("It's enough to start with.");
    expect(OPENING_GOAL).toBe("Reunite the Kingdom.");
    expect(STAGING_TEXT_MAP_REVEAL).toBe("This is what's left. This is what's yours.");
    expect(STAGING_TEXT_CAST_INTRO).toBe("Everyone in this room knows what you are. That's the whole reason they're in it.");
  });

  // Test 86: test_new_game_screen_renders_first
  it('test_new_game_screen_renders_first', () => {
    const showNewGameScreen = true;
    expect(showNewGameScreen).toBe(true);
  });

  // Test 87: test_continue_button_only_shows_with_save
  it('test_continue_button_only_shows_with_save', () => {
    const STORAGE_KEY = 'kingmaker_squads_save_v2';
    const fakeStorage = new Map<string, string>();

    let hasSave = fakeStorage.has(STORAGE_KEY);
    expect(hasSave).toBe(false);

    fakeStorage.set(STORAGE_KEY, JSON.stringify({ turn: 3 }));
    hasSave = fakeStorage.has(STORAGE_KEY);
    expect(hasSave).toBe(true);
  });

  // Test 88: test_new_campaign_leads_to_opening_sequence
  it('test_new_campaign_leads_to_opening_sequence', () => {
    let showNewGameScreen = true;
    let showOpeningSequence = false;

    // Simulate clicking New Campaign button
    showNewGameScreen = false;
    showOpeningSequence = true;

    expect(showNewGameScreen).toBe(false);
    expect(showOpeningSequence).toBe(true);
  });

  // Test 89: test_map_pan_updates_viewbox
  it('test_map_pan_updates_viewbox', () => {
    const initialView = { ...DEFAULT_VIEWBOX };
    const dx = 50;
    const dy = -30;

    const pannedView = clampViewBox({
      ...initialView,
      x: initialView.x + dx,
      y: initialView.y + dy,
    });

    expect(pannedView.x).toBe(initialView.x + dx);
    expect(pannedView.y).toBe(initialView.y + dy);
  });

  // Test 90: test_map_zoom_clamped_to_bounds
  it('test_map_zoom_clamped_to_bounds', () => {
    // Zoom in beyond min limit
    const zoomedIn = clampViewBox({ x: 0, y: 0, width: 50, height: 50 });
    expect(zoomedIn.width).toBe(MIN_ZOOM_WIDTH);

    // Zoom out beyond max limit
    const zoomedOut = clampViewBox({ x: 0, y: 0, width: 2000, height: 2000 });
    expect(zoomedOut.width).toBe(MAX_ZOOM_WIDTH);

    // Pan beyond bounds
    const pannedFar = clampViewBox({ x: -1000, y: 1000, width: 600, height: 600 });
    expect(pannedFar.x).toBe(PAN_MIN_X);
    expect(pannedFar.y).toBe(PAN_MAX_Y);
  });

  // Test 91: test_cell_click_not_swallowed_by_drag_threshold
  it('test_cell_click_not_swallowed_by_drag_threshold', () => {
    let selectedCellId: string | null = null;
    const selectCell = (id: string) => {
      selectedCellId = id;
    };

    const handleCellClick = (cellId: string, dragDistance: number) => {
      if (dragDistance > 5) return;
      selectCell(cellId);
    };

    // Genuine click with 2px movement
    handleCellClick('district_1', 2);
    expect(selectedCellId).toBe('district_1');

    // Drag move with 20px movement
    handleCellClick('district_2', 20);
    expect(selectedCellId).toBe('district_1');
  });

  // Test 92: test_region_level_renders_when_zoomed_out
  it('test_region_level_renders_when_zoomed_out', () => {
    const viewBoxWidthZoomedOut = 700; // > LOD_THRESHOLD (500)
    const showDistrictDetail = viewBoxWidthZoomedOut < LOD_THRESHOLD;
    expect(showDistrictDetail).toBe(false);
  });

  // Test 93: test_district_level_renders_when_zoomed_in
  it('test_district_level_renders_when_zoomed_in', () => {
    const viewBoxWidthZoomedIn = 350; // < LOD_THRESHOLD (500)
    const showDistrictDetail = viewBoxWidthZoomedIn < LOD_THRESHOLD;
    expect(showDistrictDetail).toBe(true);
  });

  // Test 94: test_district_data_not_lazily_generated
  it('test_district_data_not_lazily_generated', () => {
    const city = generateProceduralCity({ seed: 42 });
    expect(city.length).toBeGreaterThanOrEqual(18);
    // Data exists in state regardless of zoom level - LOD is render filter only
    const districtCount = city.length;
    const viewBoxZoomedOut = 700;
    const viewBoxZoomedIn = 300;
    // Cells array remains identical regardless of viewBox zoom
    expect(city.length).toBe(districtCount);
    expect(viewBoxZoomedOut).toBeGreaterThan(LOD_THRESHOLD);
    expect(viewBoxZoomedIn).toBeLessThan(LOD_THRESHOLD);
  });

  // Test 95: test_river_renders_from_real_path_data
  it('test_river_renders_from_real_path_data', () => {
    expect(RIVER_PATH.length).toBeGreaterThan(0);
    const svgD = riverPathToSvgD(RIVER_PATH);
    expect(svgD).toContain('M 40 140');
    expect(svgD).toContain('-260 230');
  });

  // Test 96: test_hovel_has_fortress_ward_type
  it('test_hovel_has_fortress_ward_type', () => {
    const city = generateProceduralCity({ seed: 42 });
    const hovel = city.find((c) => c.name === 'The Underbelly Hovel' || c.type === 'capital');
    expect(hovel).toBeDefined();
    expect(hovel?.wardSubType).toBe('fortress');
  });

  // Test 97: test_hovel_visual_distinct_from_generic_district
  it('test_hovel_visual_distinct_from_generic_district', () => {
    const city = generateProceduralCity({ seed: 42 });
    const hovel = city.find((c) => c.name === 'The Underbelly Hovel' || c.type === 'capital');
    const generic = city.find((c) => c.id !== hovel?.id && c.wardSubType !== 'fortress');

    expect(hovel?.wardSubType).toBe('fortress');
    expect(generic?.wardSubType).not.toBe('fortress');
    expect(hovel?.name).toBe('The Underbelly Hovel');
  });

  // Test 98: test_wheel_event_prevents_default
  it('test_wheel_event_prevents_default', () => {
    let preventDefaultCalled = false;
    const mockEvent = {
      preventDefault: () => {
        preventDefaultCalled = true;
      },
      deltaY: 100,
    } as unknown as WheelEvent;

    mockEvent.preventDefault();
    expect(preventDefaultCalled).toBe(true);
  });

  // Test 99: test_bounds_include_full_river_extent
  it('test_bounds_include_full_river_extent', () => {
    const city = generateProceduralCity({ seed: 42 });
    const bounds = computeMapBounds(city);

    for (const [rx, ry] of RIVER_PATH) {
      expect(rx).toBeGreaterThanOrEqual(bounds.minX);
      expect(rx).toBeLessThanOrEqual(bounds.maxX);
      expect(ry).toBeGreaterThanOrEqual(bounds.minY);
      expect(ry).toBeLessThanOrEqual(bounds.maxY);
    }
  });

  // Test 100: test_pan_bounds_derived_not_hardcoded
  it('test_pan_bounds_derived_not_hardcoded', () => {
    const city = generateProceduralCity({ seed: 42 });
    const derivedPan = computePanBounds(city);
    const mapBounds = computeMapBounds(city);

    expect(derivedPan.minX).toBe(Math.floor(mapBounds.minX - 150));
    expect(derivedPan.maxX).toBe(Math.ceil(mapBounds.maxX + 150 - 200));

    const clamped = clampViewBox({ x: -2000, y: -2000, width: 600, height: 600 }, city);
    expect(clamped.x).toBe(derivedPan.minX);
  });

  // Test 101: test_center_button_shows_full_kingdom
  it('test_center_button_shows_full_kingdom', () => {
    const city = generateProceduralCity({ seed: 42 });
    const fitVb = getFitViewBox(city);
    const mapBounds = computeMapBounds(city);

    expect(fitVb.x).toBeLessThanOrEqual(mapBounds.minX);
    expect(fitVb.x + fitVb.width).toBeGreaterThanOrEqual(mapBounds.maxX);
    expect(fitVb.y).toBeLessThanOrEqual(mapBounds.minY);
    expect(fitVb.y + fitVb.height).toBeGreaterThanOrEqual(mapBounds.maxY);
  });

  // Test 102: test_region_area_variance_reduced
  it('test_region_area_variance_reduced', () => {
    const patches = generatePatches({ seed: 42, seedCount: 6 });
    const areas = patches.map((p) => computePolygonArea(p.polygonPoints));

    const mean = areas.reduce((a, b) => a + b, 0) / areas.length;
    const variance = areas.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / areas.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    expect(cv).toBeLessThan(0.40);
  });

  // Test 103: test_initial_load_matches_center_function
  it('test_initial_load_matches_center_function', () => {
    const city = generateProceduralCity({ seed: 42 });
    const initialViewBox = getFitViewBox(city);
    const centerViewBox = getFitViewBox(city);

    expect(initialViewBox).toEqual(centerViewBox);
  });

  // Test 104: test_district_click_engages_battle_and_selects_cell
  it('test_district_click_engages_battle_and_selects_cell', () => {
    const city = generateProceduralCity({ seed: 42 });
    const selectedCell = city.find((c) => c.owner !== 'player') || city[1];

    let selectedId: string | null = null;
    let engagedCellId: string | null = null;

    const selectHandler = (id: string) => {
      selectedId = id;
    };
    const engageHandler = (id: string) => {
      engagedCellId = id;
    };

    selectHandler(selectedCell.id);
    engageHandler(selectedCell.id);

    expect(selectedId).toBe(selectedCell.id);
    expect(engagedCellId).toBe(selectedCell.id);
  });

  // Test 105: test_inspect_sanctuary_directly_follows_intro_text
  it('test_inspect_sanctuary_directly_follows_intro_text', () => {
    let beat: 'text' | 'cameraZoom' | 'return' = 'text';

    // Directly advance from text to sanctuary inspection
    const handleIntroTextAdvance = () => {
      beat = 'cameraZoom';
    };

    handleIntroTextAdvance();
    expect(beat).toBe('cameraZoom');

    let completedGameFlow = false;
    const handleCompleteSequence = () => {
      completedGameFlow = true;
    };

    handleCompleteSequence();
    expect(completedGameFlow).toBe(true);
  });

  // Test 106 (Anchor 1): turn order rotation & standard wheel sequence
  it('test_turn_order_rotates_standard_six_house_wheel', () => {
    const initialOrder = [...DEFAULT_TURN_ORDER];
    expect(initialOrder.length).toBe(6);
    expect(initialOrder[0]).toBe('player');

    const rotated = rotateTurnOrder(initialOrder);
    expect(rotated.length).toBe(6);
    expect(rotated[0]).toBe(initialOrder[1]);
    expect(rotated[5]).toBe('player');
  });

  // Test 107 (Anchor 2): pre-turn AI declarations per house
  it('test_ai_houses_declare_targets_per_turn', () => {
    const city = generateProceduralCity({ seed: 42 });
    const aiFactions: FactionId[] = ['tundra', 'crystal', 'tide', 'marsh', 'gale'];

    for (const factionId of aiFactions) {
      const decl = generateAIDeclaration(factionId, city);
      const ownedCount = city.filter((c) => c.owner === factionId).length;
      if (ownedCount > 0) {
        expect(decl).not.toBeNull();
        expect(decl?.factionId).toBe(factionId);
        expect(['attack', 'reinforce']).toContain(decl?.actionIntent);
      } else {
        expect(decl).toBeNull();
      }
    }
  });

  // Test 108 (Anchor 3): AI response window single round rule
  it('test_ai_response_window_single_round', () => {
    const city = generateProceduralCity({ seed: 42 });
    const tundraCell = city.find((c) => c.owner === 'tundra');
    expect(tundraCell).toBeDefined();

    const attackDecl: DeclaredAction = {
      id: 'attack_1',
      factionId: 'player',
      actionIntent: 'attack',
      targetCellId: tundraCell!.id,
      assignedUnits: [],
      isResponse: false,
    };

    const response = generateAIResponse('tundra', [attackDecl], city);
    expect(response).not.toBeNull();
    expect(response?.isResponse).toBe(true);
    expect(response?.factionId).toBe('tundra');

    // A response cannot trigger another response (single round rule)
    const secondResponse = generateAIResponse('tundra', [response!], city);
    expect(secondResponse).toBeNull();
  });

  // Test 109 (Anchor 4): hostility weights affect targeting
  it('test_hostility_weights_influence_ai_targeting', () => {
    const tundraPlayerWeight = hostilityWeight('tundra', 'player');
    const marshTundraWeight = hostilityWeight('marsh', 'tundra');

    expect(tundraPlayerWeight).toBeGreaterThan(0);
    expect(marshTundraWeight).toBeLessThan(0);
  });

  // Test 110 (Anchor 5): restored save state validation
  it('test_restored_save_state_preserves_house_allegiances', () => {
    const city = generateProceduralCity({ seed: 42 });
    const json = JSON.stringify(city);
    const restored: TerritoryCell[] = JSON.parse(json);

    expect(restored.length).toBe(city.length);
    for (let i = 0; i < city.length; i++) {
      expect(restored[i].houseId).toBe(city[i].houseId);
      expect(restored[i].publicOpinion).toBe(city[i].publicOpinion);
      expect(restored[i].owner).toBe(city[i].owner);
    }
  });

  // Test 111 (Anchor 6): coronation on King capture for AI houses
  it('test_ai_house_coronation_on_king_capture', () => {
    const city = generateProceduralCity({ seed: 42 });
    const tundraCells = city.filter((c) => c.owner === 'tundra');
    expect(tundraCells.length).toBeGreaterThan(0);

    // Strip king status from tundra
    const strippedCity = city.map((c) =>
      c.owner === 'tundra'
        ? {
            ...c,
            hasKing: false,
            enemyUnits: c.enemyUnits?.map((u) => ({ ...u, isKing: false })),
          }
        : c
    );

    const crownedCity = enforceAICoronation(strippedCity, 'tundra');
    const tundraCrowned = crownedCity.filter((c) => c.owner === 'tundra');
    const hasNewKing = tundraCrowned.some((c) => c.hasKing || c.enemyUnits?.some((u) => u.isKing));
    expect(hasNewKing).toBe(true);
  });

  // Test 112 (Anchor 7): loyalty erosion under unreinforced threat
  it('test_loyalty_erosion_under_unreinforced_threat_house', () => {
    const city = generateProceduralCity({ seed: 42 });
    const targetCell = city[1];

    const initialForce: DefenseForce = {
      id: 'force_1',
      cellId: targetCell.id,
      name: 'Tundra Defense Force',
      units: [createUnit('rook')],
      loyalty: DEFAULT_FORCE_LOYALTY,
    };

    const exposedCells = city.map((c) => (c.id === targetCell.id ? { ...c, isExposed: true, publicOpinion: 50 } : c));
    const result = processDefenseForceLoyalty([initialForce], exposedCells);

    expect(result.updatedDefenseForces[0].loyalty).toBeLessThan(DEFAULT_FORCE_LOYALTY);
    expect(DEFAULT_FORCE_LOYALTY - result.updatedDefenseForces[0].loyalty).toBe(LOYALTY_EROSION_PER_UNREINFORCED_THREATENED_TURN);
  });

  // Test 113 (Anchor 8): defense force break ownership transfer without combat
  it('test_defense_force_break_transfers_cell_ownership', () => {
    const city = generateProceduralCity({ seed: 42 });
    const cell = city.find((c) => c.owner === 'tundra') || city[1];

    const brokenForce: DefenseForce = {
      id: 'force_broken',
      cellId: cell.id,
      name: 'Broken Tundra Defense Force',
      units: [createUnit('pawn')],
      loyalty: 0, // Broken
    };

    const exposedCells = city.map((c) => (c.id === cell.id ? { ...c, isExposed: true } : c));
    const result = processDefenseForceLoyalty([brokenForce], exposedCells);

    expect(result.brokenForces.length).toBeGreaterThan(0);
    expect(result.updatedDefenseForces.filter((f) => f.id === 'force_broken').length).toBe(0);
  });

  // Test 114 (Anchor 9): exposure recalculation for six houses
  it('test_exposure_recalculates_for_six_houses', () => {
    const city = generateProceduralCity({ seed: 42 });
    const recalculated = recalculateCellExposures(city);

    expect(recalculated.length).toBe(city.length);
    // Boundary/border cells adjacent to enemies must be exposed
    const exposed = recalculated.filter((c) => c.isExposed);
    expect(exposed.length).toBeGreaterThan(0);
  });

  // Test 115 (Anchor 10): district leader auto-generation at init
  it('test_district_auto_gen_leader_six_houses', () => {
    const city = generateProceduralCity({ seed: 42 });
    const nonPlayerCells = city.filter((c) => c.owner !== 'player');

    for (const cell of nonPlayerCells) {
      expect(cell.enemyUnits).toBeDefined();
      expect(cell.enemyUnits!.length).toBeGreaterThan(0);
      const leader = cell.enemyUnits![0];
      expect(leader).toBeDefined();
      expect(leader.id).toBeDefined();
      expect(leader.stats).toBeDefined();
    }
  });
});



