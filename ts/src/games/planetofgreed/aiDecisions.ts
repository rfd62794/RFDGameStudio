import { Corporation, MapCell, CultureId } from './types';
import { getOpposite, getAdjacent } from './wheelTopology';
import { mulberry32 } from '../../engine/artGen/seededRandom';

// Phase 3: wheel-aware target selection for AI Expand orders.
//
// The four-band probability roll (40% Expand / 20% Reinforce / 20% Fortify
// / 20% Idle) is UNCHANGED and out of scope -- this module only replaces
// the *which neighbor* step inside the Expand branch. See App.tsx's
// generateAIWeeklyOrders for the roll itself; this module is called only
// after the roll has already decided "Expand".

// Tunable weights (Design.md v0.2 §AI Behavior, Engine Directive §2):
//   opposite-owned neighbor  -> 3   (highest, the "Fault Line" rival)
//   adjacent-owned neighbor  -> 1.5 (wheel-neighbor rival)
//   otherwise (neutral, non-rival, own) -> 1
//
// These are STARTING values, explicitly tunable. Flag if they produce
// degenerate behavior (e.g. AI never expanding into anything but its
// opposite, ignoring closer opportunities entirely).
export const WEIGHT_OPPOSITE = 3;
export const WEIGHT_ADJACENT = 1.5;
export const WEIGHT_BASELINE = 1;

// Seeded RNG (mulberry32) so distribution tests are deterministic, not flaky.
// Same seed -> same sequence, reproducible across runs.
// Consolidated: imports the canonical mulberry32 from artGen/seededRandom
// (which re-exports from engine/shared/seededRandom). This resolves the
// duplication found in the TS-Native Cross-Game Duplication Audit —
// Planet of Greed's local copy is removed, the shared canonical copy is used.
export const makeSeededRng = mulberry32;

// Weight for a single neighbor cell, based on the acting House's wheel
// relationship to whoever owns the neighbor cell.
//
//   - neighbor owned by acting House's wheel-opposite -> WEIGHT_OPPOSITE
//   - neighbor owned by acting House's wheel-adjacent -> WEIGHT_ADJACENT
//   - otherwise (neutral, non-rival House, or own cell) -> WEIGHT_BASELINE
//
// `actingCulture` is the acting House's cultureId; `neighborOwnerId` is
// the neighbor cell's ownerId (null = neutral). `corpsById` maps corpId ->
// Corporation so we can resolve the neighbor owner's culture.
export function weightNeighbor(
  actingCulture: CultureId,
  neighborOwnerId: string | null,
  corpsById: { [corpId: string]: Corporation },
): number {
  if (!neighborOwnerId) return WEIGHT_BASELINE; // neutral
  const neighborCorp = corpsById[neighborOwnerId];
  if (!neighborCorp) return WEIGHT_BASELINE; // unknown owner, defensive
  const neighborCulture = neighborCorp.cultureId;
  if (neighborCulture === actingCulture) return WEIGHT_BASELINE; // own cell
  if (neighborCulture === getOpposite(actingCulture)) return WEIGHT_OPPOSITE;
  const adj = getAdjacent(actingCulture);
  if (neighborCulture === adj[0] || neighborCulture === adj[1]) return WEIGHT_ADJACENT;
  return WEIGHT_BASELINE; // non-rival House (two steps away on the wheel)
}

// Weighted random selection of a target neighbor cell id for an Expand
// order. `cell.neighbors` is the list of candidate neighbor cell ids;
// `cellsById` resolves them to MapCell (for ownerId). Returns the chosen
// neighbor cell id, or null if there are no neighbors.
//
// Selection is weighted-random (not deterministic highest-weight-always-wins)
// so AI Houses don't behave identically predictable every playthrough.
export function selectWeightedNeighbor(
  actingCorp: Corporation,
  cell: MapCell,
  cellsById: { [cellId: number]: MapCell },
  corpsById: { [corpId: string]: Corporation },
  rng: () => number = Math.random,
): number | null {
  const neighborIds = cell.neighbors;
  if (neighborIds.length === 0) return null;

  const weights = neighborIds.map((nid) => {
    const neighbor = cellsById[nid];
    if (!neighbor) return WEIGHT_BASELINE; // defensive
    return weightNeighbor(actingCorp.cultureId, neighbor.ownerId, corpsById);
  });

  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return neighborIds[0];

  let r = rng() * total;
  for (let i = 0; i < neighborIds.length; i++) {
    r -= weights[i];
    if (r < 0) return neighborIds[i];
  }
  return neighborIds[neighborIds.length - 1]; // float-safety fallback
}
