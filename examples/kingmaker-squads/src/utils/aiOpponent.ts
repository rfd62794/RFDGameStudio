/**
 * AI Opponent Decision Engine for KingMaker Squads
 */

import { DeclaredAction, FactionId, TerritoryCell, UnitState } from '../types';
import { createUnit } from '../data/archetypes';
import { hostilityWeight } from '../data/factions';

/**
 * Rotates the starting participant for turn order every round.
 */
export function rotateTurnOrder(currentTurnOrder: FactionId[]): FactionId[] {
  if (currentTurnOrder.length <= 1) return [...currentTurnOrder];
  return [...currentTurnOrder.slice(1), currentTurnOrder[0]];
}

/**
 * Generate AI Pre-Turn Declarations respecting Fog of War.
 * AI cannot see unrevealed unit compositions, only visible map attributes.
 */
export function generateAIDeclaration(
  factionId: FactionId,
  cells: TerritoryCell[]
): DeclaredAction | null {
  const ownedCells = cells.filter((c) => c.owner === factionId);
  if (ownedCells.length === 0) return null;

  // 25% chance to declare a reinforcement of held territory (especially King cell)
  const kingCell = ownedCells.find((c) => c.hasKing);
  const shouldReinforce = Math.random() < 0.25 || (kingCell && Math.random() < 0.5);

  if (shouldReinforce && ownedCells.length > 0) {
    const target = kingCell || ownedCells[Math.floor(Math.random() * ownedCells.length)];
    return {
      id: `decl_${factionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      factionId,
      actionIntent: 'reinforce',
      targetCellId: target.id,
      assignedUnits: target.enemyUnits ? [...target.enemyUnits] : [],
      isResponse: false,
    };
  }

  // Attack decision: find non-owned target cells
  const potentialTargets = cells.filter((c) => c.owner !== factionId);
  if (potentialTargets.length === 0) return null;

  // Weight target selection strictly on visible attributes (threat level, troop count, visible king flag)
  // AI does NOT inspect unscouted enemyUnits array
  const scoredTargets = potentialTargets.map((cell) => {
    let score = 100 - cell.threatLevel * 10 - cell.troopCount * 5;
    if (cell.hasKing && cell.scouted) score += 30; // High priority if scouted King
    score += hostilityWeight(factionId, cell.owner);
    return { cell, score };
  });

  scoredTargets.sort((a, b) => b.score - a.score);
  const chosenTarget = scoredTargets[0].cell;
  const originCell = ownedCells[Math.floor(Math.random() * ownedCells.length)];

  return {
    id: `decl_${factionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    factionId,
    actionIntent: 'attack',
    targetCellId: chosenTarget.id,
    originCellId: originCell.id,
    assignedUnits: originCell.enemyUnits ? [...originCell.enemyUnits] : [],
    isResponse: false,
  };
}

/**
 * Generate AI Response when targeted during the single Response Window.
 */
export function generateAIResponse(
  factionId: FactionId,
  incomingActions: DeclaredAction[],
  cells: TerritoryCell[]
): DeclaredAction | null {
  // Find incoming attacks targeting cells owned by factionId
  const targetedAttack = incomingActions.find((a) => {
    if (a.factionId === factionId || a.actionIntent !== 'attack') return false;
    const cell = cells.find((c) => c.id === a.targetCellId);
    return cell && cell.owner === factionId;
  });

  if (!targetedAttack) return null;

  const targetCell = cells.find((c) => c.id === targetedAttack.targetCellId);
  if (!targetCell) return null;

  // Ensure Knight escort is assigned if King is threatened
  let updatedUnits = targetCell.enemyUnits ? [...targetCell.enemyUnits] : [];
  if (targetCell.hasKing) {
    const knightIdx = updatedUnits.findIndex((u) => u.archetype === 'knight');
    if (knightIdx !== -1) {
      updatedUnits[knightIdx] = { ...updatedUnits[knightIdx], isEscort: true };
    }
  }

  // Response reinforcement carries a defined penalty (-10% HP penalty on reinforcing troops)
  const penalizedUnits = updatedUnits.map((u) => ({
    ...u,
    stats: {
      ...u.stats,
      hp: Math.max(10, Math.round(u.stats.hp * 0.9)),
      maxHp: Math.max(10, Math.round(u.stats.maxHp * 0.9)),
    },
  }));

  return {
    id: `resp_${factionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    factionId,
    actionIntent: 'reinforce',
    targetCellId: targetCell.id,
    assignedUnits: penalizedUnits,
    isResponse: true,
    reinforcementPenaltyPaid: true,
  };
}

/**
 * Generalize coronation: Ensures every active AI faction with territory has a King.
 * If an AI faction's King was killed/captured, crowns the highest-ranked unit in its remaining cells.
 */
export function enforceAICoronation(cells: TerritoryCell[], defeatedFactionId?: FactionId): TerritoryCell[] {
  return cells.map((cell) => {
    if (cell.owner === 'player' || !cell.enemyUnits || cell.enemyUnits.length === 0) {
      return cell;
    }

    const faction = cell.owner;
    const factionCells = cells.filter((c) => c.owner === faction);
    const hasActiveKing = factionCells.some((c) => c.enemyUnits?.some((u) => u.isKing));

    if (!hasActiveKing && cell.id === factionCells[0]?.id) {
      // Crown highest-ranked unit in first cell
      const sortedUnits = [...cell.enemyUnits].sort((a, b) => {
        const ranks = { elite: 3, veteran: 2, recruit: 1 };
        return ranks[b.rank] - ranks[a.rank];
      });

      const newKingId = sortedUnits[0]?.id;
      const updatedUnits = cell.enemyUnits.map((u) =>
        u.id === newKingId ? { ...u, isKing: true } : u
      );

      return {
        ...cell,
        hasKing: true,
        enemyUnits: updatedUnits,
      };
    }

    return cell;
  });
}
