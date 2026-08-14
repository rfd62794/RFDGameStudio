import { MapCell, Corporation, WeeklyOrder, UnitType, UnitGroup, CultureId } from './types';
import { getOpposite, getAdjacent } from './wheelTopology';

/**
 * Default-action heuristic for the guided per-Region walkthrough.
 *
 * Each rule is justified against the real state available in MapCell
 * and Corporation — no invented fields. Rules are evaluated in
 * priority order; the first matching rule wins. Treasury affordability
 * is checked inline — if the player can't afford an order, the rule
 * falls through to the next one.
 *
 * Costs: Fortify=$20k, Reinforce=$30k, Civic Unrest=$10k,
 *        Expand=free, Hold=free, Scan=$5k
 */

const COST_FORTIFY = 20000;
const COST_REINFORCE = 30000;
const COST_CIVIC_UNREST = 10000;

/**
 * Check whether a neighbor cell is owned by a rival corporation
 * (any corp that isn't the player).
 */
function isRivalNeighbor(
  cell: MapCell,
  allCells: MapCell[],
  playerCorp: Corporation
): boolean {
  for (const nid of cell.neighbors) {
    const neighbor = allCells.find(c => c.id === nid);
    if (neighbor && neighbor.ownerId && neighbor.ownerId !== playerCorp.id) {
      return true;
    }
  }
  return false;
}

/**
 * Check whether a neighbor cell is owned by the player's wheel-opposite
 * rival — the highest-threat neighbor on the map.
 */
function isOppositeRivalNeighbor(
  cell: MapCell,
  allCells: MapCell[],
  corporations: Corporation[],
  playerCorp: Corporation
): boolean {
  const oppositeCulture = getOpposite(playerCorp.cultureId);
  const oppositeCorp = corporations.find(
    c => c.cultureId === oppositeCulture && c.id !== playerCorp.id
  );
  if (!oppositeCorp) return false;

  for (const nid of cell.neighbors) {
    const neighbor = allCells.find(c => c.id === nid);
    if (neighbor && neighbor.ownerId === oppositeCorp.id) {
      return true;
    }
  }
  return false;
}

/**
 * Check whether a neighbor cell is owned by a wheel-adjacent rival
 * (one step away on the culture wheel — a moderate threat).
 */
function isAdjacentRivalNeighbor(
  cell: MapCell,
  allCells: MapCell[],
  corporations: Corporation[],
  playerCorp: Corporation
): boolean {
  const [adj1, adj2] = getAdjacent(playerCorp.cultureId);
  const adjacentCorps = corporations.filter(
    c => (c.cultureId === adj1 || c.cultureId === adj2) && c.id !== playerCorp.id
  );

  for (const nid of cell.neighbors) {
    const neighbor = allCells.find(c => c.id === nid);
    if (neighbor && neighbor.ownerId) {
      if (adjacentCorps.some(c => c.id === neighbor.ownerId)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find the first unowned (neutral) neighbor of a cell.
 */
function findNeutralNeighbor(cell: MapCell, allCells: MapCell[]): MapCell | null {
  for (const nid of cell.neighbors) {
    const neighbor = allCells.find(c => c.id === nid);
    if (neighbor && !neighbor.ownerId) {
      return neighbor;
    }
  }
  return null;
}

/**
 * Pick the two most available unit types from a cell's garrison
 * for an Expand order. Returns a UnitGroup with at most 1 of each
 * of the two most plentiful types.
 */
function pickExpandUnits(cell: MapCell): UnitGroup {
  const types: UnitType[] = ['circle', 'square', 'triangle'];
  const sorted = [...types].sort(
    (a, b) => cell.units[b] - cell.units[a]
  );
  const result: UnitGroup = { circle: 0, square: 0, triangle: 0 };
  // Send 1 of the top type if available
  if (cell.units[sorted[0]] > 0) result[sorted[0]] = 1;
  // Send 1 of the second type if available
  if (cell.units[sorted[1]] > 0) result[sorted[1]] = 1;
  return result;
}

/**
 * Compute the sensible default action for a Region based on its
 * real state. Rules in priority order:
 *
 * 1. Adjacent to wheel-opposite rival AND fortification < 2 → Fortify
 *    (highest threat — the "Fault Line" rival is at the door)
 * 2. Adjacent to any rival AND garrison < 3 → Reinforce
 *    (moderate threat — need more bodies)
 * 3. Garrison >= 4 AND has neutral neighbor → Expand
 *    (safe and strong — push outward)
 * 4. Public opinion < 40 → Civic Unrest
 *    (population is restive — invest before it strikes)
 * 5. Fortification < 2 AND treasury >= $20k → Fortify
 *    (general defense — shore up weak positions)
 * 6. Else → Hold (safe default)
 */
export function getDefaultAction(
  cell: MapCell,
  allCells: MapCell[],
  corporations: Corporation[],
  playerCorp: Corporation
): WeeklyOrder {
  const garrison = cell.units.circle + cell.units.square + cell.units.triangle;
  const opinion = cell.publicOpinion ?? 50;

  // Rule 1: Opposite rival adjacent + low fort → Fortify
  if (
    isOppositeRivalNeighbor(cell, allCells, corporations, playerCorp) &&
    cell.fortification < 2 &&
    playerCorp.treasury >= COST_FORTIFY
  ) {
    return { type: 'fortify' };
  }

  // Rule 2: Any rival adjacent + low garrison → Reinforce
  if (
    isRivalNeighbor(cell, allCells, playerCorp) &&
    garrison < 3 &&
    playerCorp.treasury >= COST_REINFORCE
  ) {
    return { type: 'reinforce', reinforceType: cell.preferredProduction };
  }

  // Rule 3: Strong garrison + neutral neighbor → Expand
  if (garrison >= 4) {
    const target = findNeutralNeighbor(cell, allCells);
    if (target) {
      const unitsSent = pickExpandUnits(cell);
      const totalSent = unitsSent.circle + unitsSent.square + unitsSent.triangle;
      if (totalSent > 0) {
        return { type: 'expand', targetCellId: target.id, unitsSent };
      }
    }
  }

  // Rule 4: Low public opinion → Civic Unrest
  if (opinion < 40 && playerCorp.treasury >= COST_CIVIC_UNREST) {
    return { type: 'civic', focus: 'unrest' };
  }

  // Rule 5: Low fortification + can afford → Fortify
  if (cell.fortification < 2 && playerCorp.treasury >= COST_FORTIFY) {
    return { type: 'fortify' };
  }

  // Rule 6: Safe default
  return { type: 'hold' };
}

/**
 * Threat level for sorting Regions in the guided walkthrough.
 * Higher = more urgent = presented first.
 *
 * 3: adjacent to wheel-opposite rival (the "Fault Line")
 * 2: adjacent to any rival
 * 1: low fortification (<1) or low publicOpinion (<30)
 * 0: safe
 */
export function getThreatLevel(
  cell: MapCell,
  allCells: MapCell[],
  corporations: Corporation[],
  playerCorp: Corporation
): number {
  if (isOppositeRivalNeighbor(cell, allCells, corporations, playerCorp)) {
    return 3;
  }
  if (isRivalNeighbor(cell, allCells, playerCorp)) {
    return 2;
  }
  const opinion = cell.publicOpinion ?? 50;
  if (cell.fortification < 1 || opinion < 30) {
    return 1;
  }
  return 0;
}

/**
 * Sort the player's owned cells by threat level (highest first),
 * then by cell ID (lowest first) as a stable tiebreaker.
 */
export function sortRegionsByThreat(
  cells: MapCell[],
  allCells: MapCell[],
  corporations: Corporation[],
  playerCorp: Corporation
): MapCell[] {
  return cells
    .filter(c => c.ownerId === playerCorp.id)
    .sort((a, b) => {
      const threatA = getThreatLevel(a, allCells, corporations, playerCorp);
      const threatB = getThreatLevel(b, allCells, corporations, playerCorp);
      if (threatB !== threatA) return threatB - threatA;
      return a.id - b.id;
    });
}
