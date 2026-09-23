import { MapCell, Corporation, WeeklyOrder, UnitType, UnitGroup } from './types';
import { getOpposite } from './wheelTopology';
import { getHouseStats } from './houseStats';

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
 * Find the first neighbor owned by the player's wheel-opposite rival.
 * This is the highest-priority attack target — the "Fault Line" rival.
 */
function findOppositeRivalNeighbor(
  cell: MapCell,
  allCells: MapCell[],
  corporations: Corporation[],
  playerCorp: Corporation
): MapCell | null {
  const oppositeCulture = getOpposite(playerCorp.cultureId);
  const oppositeCorp = corporations.find(
    c => c.cultureId === oppositeCulture && c.id !== playerCorp.id
  );
  if (!oppositeCorp) return null;

  for (const nid of cell.neighbors) {
    const neighbor = allCells.find(c => c.id === nid);
    if (neighbor && neighbor.ownerId === oppositeCorp.id) {
      return neighbor;
    }
  }
  return null;
}

/**
 * Find the first neighbor owned by any rival (not the player, not neutral).
 */
function findRivalNeighbor(
  cell: MapCell,
  allCells: MapCell[],
  playerCorp: Corporation
): MapCell | null {
  for (const nid of cell.neighbors) {
    const neighbor = allCells.find(c => c.id === nid);
    if (neighbor && neighbor.ownerId && neighbor.ownerId !== playerCorp.id) {
      return neighbor;
    }
  }
  return null;
}

/**
 * Check whether a cell is "safe" — no rival adjacency, decent fortification,
 * and a garrison strong enough to spare units. Used for redistribution
 * candidates.
 */
function isSafeCell(
  cell: MapCell,
  allCells: MapCell[],
  _corporations: Corporation[],
  playerCorp: Corporation
): boolean {
  if (isRivalNeighbor(cell, allCells, playerCorp)) return false;
  if (cell.fortification < 1) return false;
  const garrison = cell.units.circle + cell.units.square + cell.units.triangle;
  if (garrison < 3) return false; // need at least 3 to spare 1-2
  return true;
}

/**
 * Find a contested own-cell that could receive redistributed units.
 * Searches the player's owned cells for one with rival adjacency.
 */
function findContestedOwnCell(
  allCells: MapCell[],
  _corporations: Corporation[],
  playerCorp: Corporation
): MapCell | null {
  for (const c of allCells) {
    if (c.ownerId !== playerCorp.id) continue;
    if (isRivalNeighbor(c, allCells, playerCorp)) return c;
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
 * AGGRESSIVE RULES (attack the rival, press the wheel):
 * 1. Strong garrison (>=4) + wheel-opposite rival adjacent → Attack rival
 *    (the "Fault Line" rival is at the door — press the advantage)
 * 2. Strong garrison (>=4) + any rival adjacent → Attack rival
 *    (strong enough to push — take the fight to them)
 *
 * DEFENSIVE RULES (survive the rival's pressure):
 * 3. Opposite rival adjacent + low fort (<2) + can afford → Fortify
 *    (highest threat, not strong enough to attack — shore up defenses)
 * 4. Any rival adjacent + low garrison (<3) + can afford → Reinforce
 *    (moderate threat — need more bodies before fighting)
 *
 * EXPANSION RULES (grow when safe):
 * 5. Safe cell (no rival adjacency, fort >= 1, garrison >= 3) +
 *    contested own-cell exists → Redistribute to contested cell
 *    (spare units from quiet sectors toward the front line — takes
 *    priority over neutral expansion because the front line is urgent)
 * 6. Garrison >= 4 + neutral neighbor → Expand
 *    (safe and strong — push outward into neutral territory)
 *
 * STABILIZATION RULES (internal maintenance):
 * 7. Public opinion < 40 + can afford → Civic Unrest
 *    (population is restive — invest before it strikes)
 * 8. Fortification < 2 + can afford → Fortify
 *    (general defense — shore up weak positions)
 *
 * 9. Else → Hold (safe default)
 *
 * Design rationale: The wheel-locked rival is the game's central tension.
 * The original heuristic was entirely defensive — it never recommended
 * attacking, even when the player had a strong garrison adjacent to a
 * weak rival. This undercut "The Wheel Is Fate" pillar. The new rules
 * prioritize attacking the wheel-opposite rival first (Rule 1), then
 * any rival (Rule 2), when the garrison is strong enough to press the
 * advantage. Only when the garrison is NOT strong enough do the
 * defensive rules (3, 4) kick in. Redistribution (Rule 6) moves units
 * from safe sectors toward contested ones, using the existing Expand
 * mechanic (Expand to an own-owned cell merges units into the garrison).
 */
export function getDefaultAction(
  cell: MapCell,
  allCells: MapCell[],
  corporations: Corporation[],
  playerCorp: Corporation
): WeeklyOrder {
  const garrison = cell.units.circle + cell.units.square + cell.units.triangle;
  const opinion = cell.publicOpinion ?? 50;
  const stats = getHouseStats(playerCorp.cultureId);
  const costFortify = stats.fortifyCost;
  const fortifyMax = stats.fortifyMax;

  // Rule 1: Strong garrison + wheel-opposite rival adjacent → Attack
  if (garrison >= 4) {
    const target = findOppositeRivalNeighbor(cell, allCells, corporations, playerCorp);
    if (target) {
      const unitsSent = pickExpandUnits(cell);
      const totalSent = unitsSent.circle + unitsSent.square + unitsSent.triangle;
      if (totalSent > 0) {
        return { type: 'expand', targetCellId: target.id, unitsSent };
      }
    }
  }

  // Rule 2: Strong garrison + any rival adjacent → Attack
  if (garrison >= 4) {
    const target = findRivalNeighbor(cell, allCells, playerCorp);
    if (target) {
      const unitsSent = pickExpandUnits(cell);
      const totalSent = unitsSent.circle + unitsSent.square + unitsSent.triangle;
      if (totalSent > 0) {
        return { type: 'expand', targetCellId: target.id, unitsSent };
      }
    }
  }

  // Rule 3: Opposite rival adjacent + low fort → Fortify
  if (
    isOppositeRivalNeighbor(cell, allCells, corporations, playerCorp) &&
    cell.fortification < fortifyMax &&
    playerCorp.treasury >= costFortify
  ) {
    return { type: 'fortify' };
  }

  // Rule 4: Any rival adjacent + low garrison → Reinforce
  if (
    isRivalNeighbor(cell, allCells, playerCorp) &&
    garrison < 3 &&
    playerCorp.treasury >= COST_REINFORCE
  ) {
    return { type: 'reinforce', reinforceType: cell.preferredProduction };
  }

  // Rule 5: Safe cell + contested own-cell exists → Redistribute
  // (spare units from quiet sectors toward the front line — this takes
  // priority over neutral expansion because the front line is more urgent)
  if (isSafeCell(cell, allCells, corporations, playerCorp)) {
    const target = findContestedOwnCell(allCells, corporations, playerCorp);
    if (target && target.id !== cell.id) {
      const unitsSent = pickExpandUnits(cell);
      const totalSent = unitsSent.circle + unitsSent.square + unitsSent.triangle;
      if (totalSent > 0) {
        return { type: 'expand', targetCellId: target.id, unitsSent };
      }
    }
  }

  // Rule 6: Strong garrison + neutral neighbor → Expand
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

  // Rule 7: Low public opinion → Civic Unrest
  if (opinion < 40 && playerCorp.treasury >= COST_CIVIC_UNREST) {
    return { type: 'civic', focus: 'unrest' };
  }

  // Rule 8: Low fortification + can afford → Fortify
  if (cell.fortification < fortifyMax - 1 && playerCorp.treasury >= costFortify) {
    return { type: 'fortify' };
  }

  // Rule 9: Safe default
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
